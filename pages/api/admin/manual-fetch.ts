import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { PrismaClient } from '@prisma/client';
import { GuardianApiService } from '../../../lib/guardianApi';
import { OpenAIService } from '../../../lib/openaiService';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { count = 10 } = req.body;

  // Log admin action
  await prisma.adminLog.create({
    data: {
      action: 'MANUAL_FETCH',
      details: { requestedCount: count },
      userEmail: session.user?.email || '',
    }
  });

  // Create job log entry
  const jobLog = await prisma.cronJobLog.create({
    data: {
      jobType: 'MANUAL',
      status: 'RUNNING',
      manualCount: count,
    }
  });

  let result = {
    success: false,
    articlesFound: 0,
    articlesProcessed: 0,
    articlesFailed: 0,
    errors: [] as string[]
  };

  try {
    console.log(`Starting manual article fetch (Count: ${count}) by ${session.user?.email}`);
    
    // Initialize services
    const guardianService = new GuardianApiService();
    const openaiService = new OpenAIService();

    // Fetch articles from Guardian
    const articles = await guardianService.fetchArticles(count);
    result.articlesFound = articles.length;

    console.log(`Found ${articles.length} articles from Guardian API`);

    // Process each article
    for (const article of articles) {
      try {
        // Check if we've already processed this article
        const existingId = await prisma.processedArticleId.findUnique({
          where: { id: article.id }
        });

        if (existingId) {
          console.log(`Article ${article.id} already processed, skipping...`);
          continue;
        }

        // Create processed ID record first
        await prisma.processedArticleId.create({
          data: { id: article.id }
        });

        // Clean and count the body text
        const cleanBodyText = GuardianApiService.cleanBodyText(article.fields?.bodyText || '');
        const originalWordCount = GuardianApiService.countWords(cleanBodyText);
        const originalCharCount = GuardianApiService.countCharacters(cleanBodyText);

        // Store Guardian article
        await prisma.guardianArticle.create({
          data: {
            guardianId: article.id,
            type: article.type,
            sectionName: article.sectionName,
            webPublicationDate: new Date(article.webPublicationDate),
            bodyText: cleanBodyText,
            thumbnail: article.fields?.thumbnail || null,
            wordCount: originalWordCount,
            characterCount: originalCharCount,
          }
        });

        console.log(`Stored Guardian article: ${article.id}`);

        // Process with OpenAI
        try {
          await prisma.openaiSummary.create({
            data: {
              guardianId: article.id,
              heading: '',
              category: '',
              summary: '',
              tldr: [],
              faqs: [],
              processingStatus: 'PROCESSING'
            }
          });

          const { summary, tokensUsed, estimatedCost } = await openaiService.summarizeArticle(
            cleanBodyText,
            article.sectionName
          );

          const summaryWordCount = OpenAIService.countWords(summary.summary);
          const summaryCharCount = OpenAIService.countCharacters(summary.summary);

          // Store OpenAI summary
          await prisma.openaiSummary.update({
            where: { guardianId: article.id },
            data: {
              heading: summary.heading,
              category: summary.category,
              summary: summary.summary,
              tldr: summary.tldr,
              faqs: summary.faqs,
              wordCountOriginal: originalWordCount,
              wordCountSummary: summaryWordCount,
              characterCountOriginal: originalCharCount,
              characterCountSummary: summaryCharCount,
              tokensUsed: tokensUsed,
              processingCostUsd: estimatedCost,
              processingStatus: 'COMPLETED',
              processingError: null,
            }
          });

          result.articlesProcessed++;
          console.log(`Successfully processed article: ${article.id}`);

        } catch (openaiError) {
          console.error(`OpenAI processing failed for article ${article.id}:`, openaiError);
          
          await prisma.openaiSummary.update({
            where: { guardianId: article.id },
            data: {
              processingStatus: 'FAILED',
              processingError: openaiError instanceof Error ? openaiError.message : 'Unknown error'
            }
          });

          result.articlesFailed++;
          result.errors.push(`Article ${article.id}: ${openaiError instanceof Error ? openaiError.message : 'Unknown error'}`);
        }

      } catch (articleError) {
        console.error(`Failed to process article ${article.id}:`, articleError);
        result.articlesFailed++;
        result.errors.push(`Article ${article.id}: ${articleError instanceof Error ? articleError.message : 'Unknown error'}`);
      }
    }

    result.success = true;
    console.log(`Manual processing complete. Processed: ${result.articlesProcessed}, Failed: ${result.articlesFailed}`);

  } catch (error) {
    console.error('Manual fetch failed:', error);
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  // Update job log
  await prisma.cronJobLog.update({
    where: { id: jobLog.id },
    data: {
      status: result.success ? 'COMPLETED' : 'FAILED',
      articlesFound: result.articlesFound,
      articlesProcessed: result.articlesProcessed,
      articlesFailed: result.articlesFailed,
      endTime: new Date(),
      errorMessage: result.errors.length > 0 ? result.errors.join('; ') : null,
    }
  });

  return res.status(result.success ? 200 : 500).json({
    success: result.success,
    message: result.success ? 'Articles processed successfully' : 'Processing completed with errors',
    data: {
      articlesFound: result.articlesFound,
      articlesProcessed: result.articlesProcessed,
      articlesFailed: result.articlesFailed,
      errors: result.errors,
    }
  });
}
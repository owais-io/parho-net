// pages/api/cron/fetch-articles.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { GuardianApiService } from '../../../lib/guardianApi';
import { OpenAIService } from '../../../lib/openaiService';

const prisma = new PrismaClient();

interface ProcessingResult {
  success: boolean;
  articlesFound: number;
  articlesProcessed: number;
  articlesFailed: number;
  errors: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Security: Verify cron secret
  const cronSecret = req.headers.authorization?.replace('Bearer ', '');
  if (cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { count, isManual = false } = req.body;
  const requestedCount = count || 450;

  // Create job log entry
  const jobLog = await prisma.cronJobLog.create({
    data: {
      jobType: isManual ? 'MANUAL' : 'SCHEDULED',
      status: 'RUNNING',
      manualCount: isManual ? requestedCount : null,
    }
  });

  let result: ProcessingResult = {
    success: false,
    articlesFound: 0,
    articlesProcessed: 0,
    articlesFailed: 0,
    errors: []
  };

  try {
    console.log(`Starting article fetch - ${isManual ? 'Manual' : 'Scheduled'} (Count: ${requestedCount})`);
    
    // Initialize services
    const guardianService = new GuardianApiService();
    const openaiService = new OpenAIService();

    // Fetch articles from Guardian
    const articles = await guardianService.fetchArticles(requestedCount);
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
          await prisma.openaiSummary.update({
            where: { guardianId: article.id },
            data: { processingStatus: 'PROCESSING' }
          }).catch(() => {
            // Create if doesn't exist
            return prisma.openaiSummary.create({
              data: {
                guardianId: article.id,
                heading: '',
                category: '',
                summary: '',
                tldr: [] as any,
                faqs: [] as any,
                processingStatus: 'PROCESSING'
              }
            });
          });

          // UPDATED: Pass prisma instance and guardianId for slug generation
          const { summary, tokensUsed, estimatedCost } = await openaiService.summarizeArticle(
            cleanBodyText,
            article.sectionName,
            prisma,
            article.id
          );

          const summaryWordCount = OpenAIService.countWords(summary.summary);
          const summaryCharCount = OpenAIService.countCharacters(summary.summary);

          // UPDATED: Store OpenAI summary with slug
          await prisma.openaiSummary.update({
            where: { guardianId: article.id },
            data: {
              heading: summary.heading,
              category: summary.category,
              summary: summary.summary,
              tldr: summary.tldr as any,
              faqs: summary.faqs as any,
              slug: summary.slug, // Add slug field
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
          console.log(`Successfully processed article: ${article.id} with slug: ${summary.slug}`);

        } catch (openaiError) {
          console.error(`OpenAI processing failed for article ${article.id}:`, openaiError);
          
          // Update processing status to failed
          await prisma.openaiSummary.update({
            where: { guardianId: article.id },
            data: {
              processingStatus: 'FAILED',
              processingError: openaiError instanceof Error ? openaiError.message : 'Unknown error'
            }
          }).catch(() => {
            // Create failed record if doesn't exist
            return prisma.openaiSummary.create({
              data: {
                guardianId: article.id,
                heading: '',
                category: '',
                summary: '',
                tldr: [],
                faqs: [],
                processingStatus: 'FAILED',
                processingError: openaiError instanceof Error ? openaiError.message : 'Unknown error'
              }
            });
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
    console.log(`Processing complete. Processed: ${result.articlesProcessed}, Failed: ${result.articlesFailed}`);

  } catch (error) {
    console.error('Cron job failed:', error);
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

  // Return results
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

  // Note: prisma.$disconnect() is handled by Vercel automatically
}
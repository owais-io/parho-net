import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../lib/auth';
import { PrismaClient } from '@prisma/client';
import { ArrowLeftIcon, ClockIcon, TagIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface ArticleData {
  guardianArticle: {
    id: number;
    guardianId: string;
    type: string;
    sectionName: string;
    webPublicationDate: string;
    bodyText: string;
    thumbnail?: string;
    wordCount: number;
    characterCount: number;
    status: string;
  };
  openaiSummary?: {
    heading: string;
    category: string;
    summary: string;
    tldr: string[];
    faqs: Array<{
      question: string;
      answer: string;
    }>;
    wordCountSummary: number;
    characterCountSummary: number;
    tokensUsed?: number;
    processingCostUsd?: number;
    processingStatus: string;
  };
}

interface ArticleViewProps {
  article: ArticleData;
}

export default function ViewArticle({ article }: ArticleViewProps) {
  const { guardianArticle, openaiSummary } = article;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderSummaryParagraphs = (summary: string) => {
    return summary.split('\n\n').map((paragraph, index) => (
      <p key={index} className="mb-4 text-gray-700 leading-relaxed">
        {paragraph}
      </p>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link
              href="/admin"
              className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Article Details</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Original Article */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Original Guardian Article</h2>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                  <TagIcon className="h-4 w-4 mr-1" />
                  <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">
                    {guardianArticle.sectionName}
                  </span>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {formatDate(guardianArticle.webPublicationDate)}
                </div>
              </div>

              {guardianArticle.thumbnail && (
                <img
                  src={guardianArticle.thumbnail}
                  alt="Article thumbnail"
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium text-gray-600">Word Count</div>
                  <div className="text-xl font-bold text-gray-900">
                    {guardianArticle.wordCount?.toLocaleString()}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium text-gray-600">Character Count</div>
                  <div className="text-xl font-bold text-gray-900">
                    {guardianArticle.characterCount?.toLocaleString()}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Full Article Text</h3>
                <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {guardianArticle.bodyText}
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-500">
                <div>Article ID: {guardianArticle.guardianId}</div>
                <div>Type: {guardianArticle.type}</div>
                <div>Status: {guardianArticle.status}</div>
              </div>
            </div>
          </div>

          {/* AI Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">AI Generated Summary</h2>
            
            {openaiSummary ? (
              <>
                {openaiSummary.processingStatus === 'COMPLETED' ? (
                  <div className="space-y-6">
                    {/* Summary Header */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {openaiSummary.heading}
                      </h3>
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                        {openaiSummary.category}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-green-50 p-3 rounded">
                        <div className="font-medium text-green-600">Summary Words</div>
                        <div className="text-xl font-bold text-green-900">
                          {openaiSummary.wordCountSummary}
                        </div>
                      </div>
                      <div className="bg-blue-50 p-3 rounded">
                        <div className="font-medium text-blue-600">Processing Cost</div>
                        <div className="text-xl font-bold text-blue-900">
                          ${openaiSummary.processingCostUsd?.toString() || '0.00'}
                        </div>
                      </div>
                    </div>

                    {/* Summary Text */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Summary</h4>
                      <div className="prose prose-sm max-w-none">
                        {renderSummaryParagraphs(openaiSummary.summary)}
                      </div>
                    </div>

                    {/* TLDR */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Key Takeaways (TL;DR)</h4>
                      <ul className="space-y-2">
                        {openaiSummary.tldr.map((point, index) => (
                          <li key={index} className="flex items-start">
                            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                              {index + 1}
                            </span>
                            <span className="text-sm text-gray-700">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* FAQs */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Frequently Asked Questions</h4>
                      <div className="space-y-4">
                        {openaiSummary.faqs.map((faq, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-2">
                              Q{index + 1}: {faq.question}
                            </h5>
                            <p className="text-sm text-gray-700">{faq.answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Processing Info */}
                    <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                      <div>Tokens Used: {openaiSummary.tokensUsed?.toLocaleString()}</div>
                      <div>Characters: {openaiSummary.characterCountSummary?.toLocaleString()}</div>
                      <div>Status: {openaiSummary.processingStatus}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      openaiSummary.processingStatus === 'PROCESSING' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : openaiSummary.processingStatus === 'FAILED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {openaiSummary.processingStatus}
                    </div>
                    <p className="text-gray-600 mt-2">
                      {openaiSummary.processingStatus === 'PROCESSING' 
                        ? 'AI summary is being generated...'
                        : openaiSummary.processingStatus === 'FAILED'
                        ? 'Failed to generate AI summary'
                        : 'Processing pending'
                      }
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <div className="inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                  No Summary Available
                </div>
                <p className="text-gray-600 mt-2">
                  This article has not been processed for AI summarization yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  
  if (!session) {
    return {
      redirect: {
        destination: '/admin/login',
        permanent: false,
      },
    };
  }

  const { id } = context.query;
  
  if (!id) {
    return {
      notFound: true,
    };
  }

  // Decode the base64 encoded Guardian ID
  const guardianId = Buffer.from(id as string, 'base64').toString('utf-8');
  
  const prisma = new PrismaClient();

  try {
    const guardianArticle = await prisma.guardianArticle.findUnique({
      where: {
        guardianId: guardianId,
        deletedAt: null,
      },
    });

    if (!guardianArticle) {
      await prisma.$disconnect();
      return {
        notFound: true,
      };
    }

    const openaiSummary = await prisma.openaiSummary.findUnique({
      where: {
        guardianId: guardianId,
        deletedAt: null,
      },
    });

    await prisma.$disconnect();

    return {
      props: {
        article: {
          guardianArticle: JSON.parse(JSON.stringify(guardianArticle)),
          openaiSummary: openaiSummary ? JSON.parse(JSON.stringify(openaiSummary)) : null,
        },
      },
    };
  } catch (error) {
    console.error('Error fetching article:', error);
    await prisma.$disconnect();
    
    return {
      notFound: true,
    };
  }
};
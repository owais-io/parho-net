import { GetServerSideProps } from 'next';
import Layout from '../../components/Layout';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { useState } from 'react';
import { 
  ClockIcon, 
  TagIcon, 
  BookOpenIcon,
  ArrowLeftIcon,
  ShareIcon,
  BookmarkIcon,
  EyeIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  LightBulbIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import {
  BookmarkIcon as BookmarkSolidIcon
} from '@heroicons/react/24/solid';

interface StoryData {
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
    slug: string;
    wordCountSummary: number;
    characterCountSummary: number;
    tokensUsed?: number;
    processingCostUsd?: number;
    processingStatus: string;
  };
}

interface StoryPageProps {
  story: StoryData;
  relatedStories: Array<{
    guardianId: string;
    openaiSummary?: {
      heading: string;
      category: string;
      summary: string;
      slug: string;
    };
    webPublicationDate: string;
    thumbnail?: string;
  }>;
}

export default function StoryPage({ story, relatedStories }: StoryPageProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'tldr' | 'faqs'>('summary');
  const [isBookmarked, setIsBookmarked] = useState(false);

  const { guardianArticle, openaiSummary } = story;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReadTime = (wordCount: number) => {
    const averageWordsPerMinute = 200;
    return Math.ceil(wordCount / averageWordsPerMinute);
  };

  const renderSummaryParagraphs = (summary: string) => {
    return summary.split('\n\n').map((paragraph, index) => (
      <p key={index} className="mb-6 text-gray-700 leading-relaxed text-lg">
        {paragraph}
      </p>
    ));
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: openaiSummary?.heading || 'News Story',
          text: openaiSummary?.tldr?.[0] || 'Check out this news summary',
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (!openaiSummary || openaiSummary.processingStatus !== 'COMPLETED') {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <SparklesIcon className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Article</h2>
            <p className="text-gray-600">This story is currently being summarized. Please check back in a few minutes.</p>
            <Link href="/" className="inline-block mt-4 text-blue-600 hover:text-blue-800">
              ← Back to Home
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      showBreadcrumb={true}
      breadcrumbItems={[
        { label: 'Home', href: '/' },
        { label: openaiSummary.category, href: `/category/${encodeURIComponent(openaiSummary.category)}` },
        { label: 'Story' }
      ]}
    >
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Article Header */}
          <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            {guardianArticle.thumbnail && (
              <div className="aspect-video md:aspect-[21/9] overflow-hidden">
                <img
                  src={guardianArticle.thumbnail}
                  alt={openaiSummary.heading}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="p-8">
              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <span className="px-4 py-2 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  {openaiSummary.category}
                </span>
                <div className="flex items-center text-gray-600 text-sm">
                  <ClockIcon className="h-4 w-4 mr-2" />
                  {formatDate(guardianArticle.webPublicationDate)}
                </div>
                <div className="flex items-center text-gray-600 text-sm">
                  <EyeIcon className="h-4 w-4 mr-2" />
                  {getReadTime(openaiSummary.wordCountSummary)} min read
                </div>
                <div className="ml-auto flex items-center space-x-2">
                  <button
                    onClick={handleShare}
                    className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                    title="Share this story"
                  >
                    <ShareIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setIsBookmarked(!isBookmarked)}
                    className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                    title="Bookmark this story"
                  >
                    {isBookmarked ? (
                      <BookmarkSolidIcon className="h-5 w-5 text-blue-600" />
                    ) : (
                      <BookmarkIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
                {openaiSummary.heading}
              </h1>

              {/* First TL;DR point as subtitle */}
              {openaiSummary.tldr && openaiSummary.tldr.length > 0 && (
                <p className="text-xl text-gray-600 leading-relaxed mb-8 font-medium">
                  {openaiSummary.tldr[0]}
                </p>
              )}
            </div>
          </article>

          {/* Content Tabs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="border-b border-gray-100">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'summary'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <BookOpenIcon className="h-4 w-4 inline mr-2" />
                  Summary
                </button>
                <button
                  onClick={() => setActiveTab('tldr')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'tldr'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <LightBulbIcon className="h-4 w-4 inline mr-2" />
                  TL;DR
                </button>
                <button
                  onClick={() => setActiveTab('faqs')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'faqs'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4 inline mr-2" />
                  FAQs
                </button>
              </nav>
            </div>

            <div className="p-8">
              {activeTab === 'summary' && (
                <div className="prose prose-lg max-w-none">
                  {renderSummaryParagraphs(openaiSummary.summary)}
                </div>
              )}

              {activeTab === 'tldr' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6">TL;DR</h3>
                  <div className="space-y-4">
                    {openaiSummary.tldr.map((point, index) => (
                      <div key={index} className="flex items-start group">
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-1">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-lg text-gray-700 leading-relaxed group-hover:text-gray-900 transition-colors">
                            {point}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'faqs' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h3>
                  <div className="space-y-6">
                    {openaiSummary.faqs.map((faq, index) => (
                      <div key={index} className="border border-gray-200 rounded-xl p-6 hover:shadow-sm transition-shadow">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-start">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                            Q
                          </span>
                          {faq.question}
                        </h4>
                        <div className="ml-9">
                          <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Related Stories */}
          {relatedStories.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">Related Stories</h3>
                <p className="text-gray-600 mt-1">More stories from this category</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {relatedStories.slice(0, 4).map((relatedStory) => (
                    <Link
                      key={relatedStory.guardianId}
                      href={`/story/${relatedStory.openaiSummary?.slug || 'processing'}`}
                      className="group"
                    >
                      <article className="flex gap-4 p-4 border border-gray-100 rounded-xl hover:shadow-md transition-all duration-200 group-hover:border-blue-200">
                        {relatedStory.thumbnail && (
                          <div className="flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden">
                            <img
                              src={relatedStory.thumbnail}
                              alt={relatedStory.openaiSummary?.heading}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors text-sm mb-2" style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {relatedStory.openaiSummary?.heading || 'Processing...'}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {formatDate(relatedStory.webPublicationDate)}
                          </p>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
                
                <div className="mt-6 text-center">
                  <Link
                    href={`/category/${encodeURIComponent(openaiSummary.category)}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View More in {openaiSummary.category}
                    <ArrowRightIcon className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Back to Top Button */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
          title="Back to top"
        >
          <ArrowLeftIcon className="h-5 w-5 rotate-90" />
        </button>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.params!;
  
  if (!slug) {
    return {
      notFound: true,
    };
  }

  const prisma = new PrismaClient();

  try {
    // Find the article by slug instead of encoded ID
    const openaiSummary = await prisma.openaiSummary.findUnique({
      where: {
        slug: slug as string,
        deletedAt: null,
      },
      include: {
        guardianArticle: true,
      },
    });

    if (!openaiSummary || !openaiSummary.guardianArticle) {
      await prisma.$disconnect();
      return {
        notFound: true,
      };
    }

    // Get related stories from the same category
    let relatedStories: any[] = [];
    if (openaiSummary.category) {
      relatedStories = await prisma.guardianArticle.findMany({
        where: {
          deletedAt: null,
          guardianId: {
            not: openaiSummary.guardianId, // Exclude current article
          },
          openaiSummary: {
            category: openaiSummary.category,
            processingStatus: 'COMPLETED',
            deletedAt: null,
          },
        },
        include: {
          openaiSummary: {
            select: {
              heading: true,
              category: true,
              summary: true,
              slug: true,
            },
          },
        },
        orderBy: {
          webPublicationDate: 'desc',
        },
        take: 6,
      });
    }

    await prisma.$disconnect();

    return {
      props: {
        story: {
          guardianArticle: JSON.parse(JSON.stringify(openaiSummary.guardianArticle)),
          openaiSummary: JSON.parse(JSON.stringify(openaiSummary)),
        },
        relatedStories: JSON.parse(JSON.stringify(relatedStories)),
      },
    };
  } catch (error) {
    console.error('Error fetching story:', error);
    await prisma.$disconnect();
    
    return {
      notFound: true,
    };
  }
};
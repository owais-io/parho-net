// pages/story/[slug].tsx

import { GetServerSideProps } from 'next';
import Head from 'next/head';
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
  seoData: {
    canonicalUrl: string;
    publishedDate: string;
    modifiedDate: string;
    estimatedReadTime: number;
    excerpt: string;
    keywords: string[];
  };
}

export default function StoryPage({ story, relatedStories, seoData }: StoryPageProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'tldr' | 'faqs'>('summary');
  const [isBookmarked, setIsBookmarked] = useState(false);

  const { guardianArticle, openaiSummary } = story;
  const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'parho.net';
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.parho.net';
  const pageTitle = `Processing Article | ${SITE_NAME}`;
  const completedPageTitle = `${openaiSummary?.heading || 'News Story'} | ${SITE_NAME}`; // Add this line



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

  // Generate structured data for SEO
  const generateStructuredData = () => {
    if (!openaiSummary) return null;

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: openaiSummary.heading,
      description: seoData.excerpt,
      image: guardianArticle.thumbnail ? [guardianArticle.thumbnail] : [],
      author: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL
      },
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/logo.png`
        }
      },
      datePublished: seoData.publishedDate,
      dateModified: seoData.modifiedDate,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': seoData.canonicalUrl
      },
      articleSection: openaiSummary.category,
      keywords: seoData.keywords.join(', '),
      wordCount: openaiSummary.wordCountSummary,
      timeRequired: `PT${seoData.estimatedReadTime}M`,
      url: seoData.canonicalUrl,
      inLanguage: 'en-US',
      articleBody: openaiSummary.summary
    };

    // Add FAQ structured data if FAQs exist
    if (openaiSummary.faqs && openaiSummary.faqs.length > 0) {
      const faqStructuredData = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: openaiSummary.faqs.map(faq => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer
          }
        }))
      };

      return [structuredData, faqStructuredData];
    }

    return [structuredData];
  };

  if (!openaiSummary || openaiSummary.processingStatus !== 'COMPLETED') {
    return (
      <>
        <Head>
          <title>{completedPageTitle}</title>

          <meta name="description" content="This article is currently being processed and summarized." />
          <meta name="robots" content="noindex, nofollow" />
        </Head>
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
      </>
    );
  }

  const structuredDataArray = generateStructuredData();

  return (
    <>
      <Head>
        {/* Basic Meta Tags */}
        <title>{completedPageTitle}</title>
        <meta name="description" content={seoData.excerpt} />
        <meta name="keywords" content={seoData.keywords.filter(Boolean).join(', ')} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={seoData.canonicalUrl} />
        
        {/* Open Graph Tags */}
        <meta property="og:title" content={openaiSummary.heading} />
        <meta property="og:description" content={seoData.excerpt} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={seoData.canonicalUrl} />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:locale" content="en_US" />
        {guardianArticle.thumbnail && (
          <>
            <meta property="og:image" content={guardianArticle.thumbnail} />
            <meta property="og:image:alt" content={openaiSummary.heading} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
          </>
        )}
        
        {/* Article Specific OG Tags */}
        <meta property="article:published_time" content={seoData.publishedDate} />
        <meta property="article:modified_time" content={seoData.modifiedDate} />
        <meta property="article:section" content={openaiSummary.category} />
        <meta property="article:author" content={SITE_NAME} />
        {seoData.keywords.map((keyword, index) => (
          <meta key={index} property="article:tag" content={keyword} />
        ))}
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={openaiSummary.heading} />
        <meta name="twitter:description" content={seoData.excerpt} />
        {guardianArticle.thumbnail && (
          <meta name="twitter:image" content={guardianArticle.thumbnail} />
        )}
        
        {/* Additional Meta Tags */}
        <meta name="author" content={SITE_NAME} />
        <meta name="publish_date" content={seoData.publishedDate} />
        <meta name="news_keywords" content={seoData.keywords.filter(Boolean).join(', ')} />
        
        {/* Rich Snippets / Structured Data */}
        {structuredDataArray && structuredDataArray.map((data, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
          />
        ))}
        
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Additional Performance Headers */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
        {/* Language and Region */}
        <meta httpEquiv="content-language" content="en-US" />
        
        {/* Cache Control for Articles */}
        <meta httpEquiv="cache-control" content="public, max-age=3600" />
      </Head>

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
              {/* Updated Image Section with 5:4 Aspect Ratio */}
              {guardianArticle.thumbnail && (
                <div className="w-full max-w-2xl mx-auto">
                  <div className="aspect-[5/4] overflow-hidden rounded-t-2xl">
                    <img
                      src={guardianArticle.thumbnail}
                      alt={openaiSummary.heading}
                      className="w-full h-full object-cover"
                      loading="eager"
                      fetchPriority="high"
                    />
                  </div>
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
                    <time dateTime={seoData.publishedDate}>
                      {formatDate(guardianArticle.webPublicationDate)}
                    </time>
                  </div>
                  <div className="flex items-center text-gray-600 text-sm">
                    <EyeIcon className="h-4 w-4 mr-2" />
                    {seoData.estimatedReadTime} min read
                  </div>
                  <div className="ml-auto flex items-center space-x-2">
                    <button
                      onClick={handleShare}
                      className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                      title="Share this story"
                      aria-label="Share this story"
                    >
                      <ShareIcon className="h-5 w-5" />
                    </button>
                    {/* <button
                      onClick={() => setIsBookmarked(!isBookmarked)}
                      className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                      title="Bookmark this story"
                      aria-label="Bookmark this story"
                    >
                      {isBookmarked ? (
                        <BookmarkSolidIcon className="h-5 w-5 text-blue-600" />
                      ) : (
                        <BookmarkIcon className="h-5 w-5" />
                      )}
                    </button> */}
                  </div>
                </div>

                {/* Title - Using h1 for SEO */}
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
                <nav className="flex" role="tablist">
                  <button
                    onClick={() => setActiveTab('summary')}
                    className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                      activeTab === 'summary'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    role="tab"
                    aria-selected={activeTab === 'summary'}
                    aria-controls="summary-panel"
                  >
                    <BookOpenIcon className="h-4 w-4 inline mr-2" />
                    Story
                  </button>
                  <button
                    onClick={() => setActiveTab('tldr')}
                    className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                      activeTab === 'tldr'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    role="tab"
                    aria-selected={activeTab === 'tldr'}
                    aria-controls="tldr-panel"
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
                    role="tab"
                    aria-selected={activeTab === 'faqs'}
                    aria-controls="faqs-panel"
                  >
                    <ChatBubbleLeftRightIcon className="h-4 w-4 inline mr-2" />
                    FAQs
                  </button>
                </nav>
              </div>

              <div className="p-8">
                {activeTab === 'summary' && (
                  <div role="tabpanel" id="summary-panel" className="prose prose-lg max-w-none">
                    {renderSummaryParagraphs(openaiSummary.summary)}
                  </div>
                )}

                {activeTab === 'tldr' && (
                  <div role="tabpanel" id="tldr-panel">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">TL;DR</h2>
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
                  <div role="tabpanel" id="faqs-panel">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
                    <div className="space-y-6">
                      {openaiSummary.faqs.map((faq, index) => (
                        <div key={index} className="border border-gray-200 rounded-xl p-6 hover:shadow-sm transition-shadow">
                          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-start">
                            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                              Q
                            </span>
                            {faq.question}
                          </h3>
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

            {/* Read more... */}
            {relatedStories.length > 0 && (
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900">Read more...</h2>
                  <p className="text-gray-600 mt-1">Latest articles you might find interesting</p>
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
                                loading="lazy"
                              />
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                                {relatedStory.openaiSummary?.category}
                              </span>
                            </div>
                            
                            <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors text-sm mb-2" style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>
                              {relatedStory.openaiSummary?.heading || 'Processing...'}
                            </h3>
                            <p className="text-xs text-gray-500">
                              <time dateTime={relatedStory.webPublicationDate}>
                                {formatDate(relatedStory.webPublicationDate)}
                              </time>
                            </p>
                          </div>
                        </article>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Back to Top Button */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
            title="Back to top"
            aria-label="Back to top"
          >
            <ArrowLeftIcon className="h-5 w-5 rotate-90" />
          </button>
        </div>
      </Layout>
    </>
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
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.parho.net';

  try {
    // Find the article by slug
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

    // Enhanced Related Stories Logic
    let relatedStories: any[] = [];
    const maxRelatedStories = 6; // Maximum number of related stories to show

    if (openaiSummary.category) {
      // Step 1: Get articles from the same category first (prioritized)
      const sameCategoryStories = await prisma.guardianArticle.findMany({
        where: {
          deletedAt: null,
          guardianId: {
            not: openaiSummary.guardianId, // Exclude current article
          },
          openaiSummary: {
            category: openaiSummary.category, // Same category only
            processingStatus: 'COMPLETED',
            deletedAt: null,
            slug: { not: null }, // Only articles with slugs
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
        take: maxRelatedStories, // Try to get full count from same category
      });

      relatedStories = sameCategoryStories;

      // Step 2: If we don't have enough articles from same category, fill with latest articles
      if (relatedStories.length < maxRelatedStories) {
        const remainingCount = maxRelatedStories - relatedStories.length;
        const existingIds = relatedStories.map(story => story.guardianId);
        
        const latestStories = await prisma.guardianArticle.findMany({
          where: {
            deletedAt: null,
            guardianId: {
              notIn: [...existingIds, openaiSummary.guardianId], // Exclude current and already selected
            },
            openaiSummary: {
              processingStatus: 'COMPLETED',
              deletedAt: null,
              slug: { not: null },
              category: { not: openaiSummary.category }, // Exclude same category (already got those)
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
          take: remainingCount,
        });

        // Combine same category + latest articles
        relatedStories = [...relatedStories, ...latestStories];
      }
    }

    // Step 3: Fallback - if still no articles (edge case), get any latest articles
    if (relatedStories.length === 0) {
      relatedStories = await prisma.guardianArticle.findMany({
        where: {
          deletedAt: null,
          guardianId: {
            not: openaiSummary.guardianId,
          },
          openaiSummary: {
            processingStatus: 'COMPLETED',
            deletedAt: null,
            slug: { not: null },
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
        take: maxRelatedStories,
      });
    }

    // Generate SEO data
    const canonicalUrl = `${SITE_URL}/story/${slug}`;
    const publishedDate = new Date(openaiSummary.guardianArticle.webPublicationDate).toISOString();
    const modifiedDate = new Date(openaiSummary.updatedAt).toISOString();
    const estimatedReadTime = Math.ceil((openaiSummary.wordCountSummary || 500) / 200);
    
    // Create excerpt from summary (first 160 characters)
    const excerpt = openaiSummary.summary
      .replace(/\n\n/g, ' ')
      .substring(0, 160)
      .trim() + (openaiSummary.summary.length > 160 ? '...' : '');
    
    // Generate keywords from category and content
    const keywords = [
      openaiSummary.category.toLowerCase(),
      ...openaiSummary.category.split(' ').filter(word => word.length > 3),
      'news',
      'summary',
      openaiSummary.guardianArticle.sectionName.toLowerCase()
    ].filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

    const seoData = {
      canonicalUrl,
      publishedDate,
      modifiedDate,
      estimatedReadTime,
      excerpt,
      keywords
    };

    await prisma.$disconnect();

    return {
      props: {
        story: {
          guardianArticle: JSON.parse(JSON.stringify(openaiSummary.guardianArticle)),
          openaiSummary: JSON.parse(JSON.stringify(openaiSummary)),
        },
        relatedStories: JSON.parse(JSON.stringify(relatedStories)),
        seoData,
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
import { GetServerSideProps } from 'next';
import { PrismaClient } from '@prisma/client';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import { 
  ClockIcon, 
  TagIcon, 
  BookOpenIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

interface Article {
  id: number;
  guardianId: string;
  sectionName: string;
  webPublicationDate: string;
  thumbnail?: string;
  openaiSummary?: {
    heading: string;
    category: string;
    summary: string;
    tldr: string[];
    slug?: string;
    wordCountSummary: number;
    processingStatus?: string;
  };
}

interface HomePageProps {
  featuredArticles: Article[];
  recentArticles: Article[];
  categories: Array<{ name: string; count: number }>;
  stats: {
    totalArticles: number;
    totalCategories: number;
  };
  seoData: {
    canonicalUrl: string;
    lastModified: string;
    featuredKeywords: string[];
    categoriesText: string;
  };
}

export default function HomePage({ featuredArticles, recentArticles, categories, stats, seoData }: HomePageProps) {
  const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'ParhoNet';
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.parho.net';
  const SITE_DESCRIPTION = `${SITE_NAME} - Your premier source for intelligent news summaries. Get the latest news from technology, science, environment, and politics with AI-powered summaries, TL;DR points, and comprehensive FAQs.`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getReadTime = (wordCount: number) => {
    const averageWordsPerMinute = 200;
    return Math.ceil(wordCount / averageWordsPerMinute);
  };

  // Generate structured data for homepage
  const generateStructuredData = () => {
    const websiteStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/logo.png`
        }
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      },
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: featuredArticles.length,
        itemListElement: featuredArticles.map((article, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'NewsArticle',
            headline: article.openaiSummary?.heading,
            url: `${SITE_URL}/story/${article.openaiSummary?.slug}`,
            datePublished: article.webPublicationDate,
            author: {
              '@type': 'Organization',
              name: SITE_NAME
            },
            publisher: {
              '@type': 'Organization',
              name: SITE_NAME
            },
            image: article.thumbnail || `${SITE_URL}/default-article-image.jpg`,
            articleSection: article.openaiSummary?.category
          }
        }))
      }
    };

    const organizationStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      description: SITE_DESCRIPTION,
      sameAs: [
        // Add your social media URLs here when available
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Customer Service',
        availableLanguage: 'English'
      }
    };

    const newsMediaStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'NewsMediaOrganization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      description: SITE_DESCRIPTION,
      publishingPrinciples: `${SITE_URL}/editorial-guidelines`,
      diversityPolicy: `${SITE_URL}/diversity-policy`,
      ethicsPolicy: `${SITE_URL}/ethics-policy`,
      masthead: `${SITE_URL}/about`,
      missionCoveragePrioritiesPolicy: `${SITE_URL}/mission`,
      actionableFeedbackPolicy: `${SITE_URL}/feedback`
    };

    return [websiteStructuredData, organizationStructuredData, newsMediaStructuredData];
  };

  const structuredDataArray = generateStructuredData();

  return (
    <>
      <Head>
        {/* Primary Meta Tags */}
        <title>{SITE_NAME} - Intelligent News Summaries | AI-Powered News Analysis</title>
        <meta name="description" content={SITE_DESCRIPTION} />
        <meta name="keywords" content={`news summaries, ${seoData.featuredKeywords.join(', ')}, AI news analysis, technology news, science news, environment news, politics news, TL;DR news, news FAQs`} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={seoData.canonicalUrl} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:title" content={`${SITE_NAME} - Intelligent News Summaries`} />
        <meta property="og:description" content={SITE_DESCRIPTION} />
        <meta property="og:url" content={seoData.canonicalUrl} />
        <meta property="og:locale" content="en_US" />
        <meta property="og:image" content={`${SITE_URL}/og-homepage.jpg`} />
        <meta property="og:image:alt" content={`${SITE_NAME} Homepage`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${SITE_NAME} - Intelligent News Summaries`} />
        <meta name="twitter:description" content={SITE_DESCRIPTION} />
        <meta name="twitter:image" content={`${SITE_URL}/twitter-homepage.jpg`} />
        
        {/* Additional Meta Tags */}
        <meta name="author" content={SITE_NAME} />
        <meta name="publisher" content={SITE_NAME} />
        <meta name="copyright" content={`© ${new Date().getFullYear()} ${SITE_NAME}`} />
        <meta name="language" content="en-US" />
        <meta name="revisit-after" content="1 day" />
        <meta name="distribution" content="global" />
        <meta name="rating" content="general" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        
        {/* News-specific meta tags */}
        <meta name="news_keywords" content={seoData.featuredKeywords.join(', ')} />
        <meta name="article:publisher" content={SITE_URL} />
        
        {/* Geographic targeting */}
        <meta name="geo.region" content="PK" />
        <meta name="geo.placename" content="Karachi" />
        
        {/* Mobile optimization */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//images.unsplash.com" />
        <link rel="dns-prefetch" href="//media.guim.co.uk" />
        
        {/* Structured Data */}
        {structuredDataArray.map((data, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
          />
        ))}
        
        {/* Additional Performance Headers */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="theme-color" content="#2563eb" />
        
        {/* Cache Control */}
        <meta httpEquiv="cache-control" content="public, max-age=3600" />
        <meta httpEquiv="expires" content={new Date(Date.now() + 3600000).toUTCString()} />
        <meta httpEquiv="last-modified" content={seoData.lastModified} />
        
        {/* Favicon and Icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>

      <Layout>
        <div className="bg-gradient-to-br from-slate-50 to-blue-50">
          {/* Hero Section */}
          <section className="relative overflow-hidden" role="banner">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {SITE_NAME}
                  </span>
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Your source for intelligent news summaries powered by AI. Get comprehensive news analysis with TL;DR points, detailed summaries, and FAQs across {stats.totalCategories} categories.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <BookOpenIcon className="h-4 w-4 mr-1" />
                    {stats.totalArticles.toLocaleString()} Articles
                  </span>
                  <span className="flex items-center">
                    <TagIcon className="h-4 w-4 mr-1" />
                    {stats.totalCategories} Categories
                  </span>
                  <span>Daily Updates</span>
                </div>
              </div>
            </div>
          </section>

          {/* Featured Articles */}
          <section className="py-16 bg-white" role="main">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Featured Stories</h2>
                  <p className="text-gray-600 mt-2">Today's most important news, intelligently summarized</p>
                </div>
                <Link 
                  href="/categories"
                  className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
                  aria-label="View all news categories"
                >
                  View All <ArrowRightIcon className="h-4 w-4 ml-1" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredArticles.map((article, index) => (
                  <Link 
                    key={article.guardianId}
                    href={`/story/${article.openaiSummary?.slug || 'processing'}`}
                    className="group"
                  >
                    <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                      {article.thumbnail && (
                        <div className="aspect-video overflow-hidden">
                          <img
                            src={article.thumbnail}
                            alt={article.openaiSummary?.heading || 'News article image'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading={index < 3 ? "eager" : "lazy"}
                            fetchpriority={index < 3 ? "high" : "auto"}
                          />
                        </div>
                      )}
                      
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            {article.openaiSummary?.category || article.sectionName}
                          </span>
                          <div className="flex items-center text-gray-500 text-sm">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            <time dateTime={article.webPublicationDate}>
                              {formatDate(article.webPublicationDate)}
                            </time>
                          </div>
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                          {article.openaiSummary?.heading || 'Processing...'}
                        </h3>
                        
                        {article.openaiSummary?.summary && (
                          <p className="text-gray-600 mb-4" style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {article.openaiSummary.summary.substring(0, 120)}...
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            {article.openaiSummary?.wordCountSummary && (
                              <span>{getReadTime(article.openaiSummary.wordCountSummary)} min read</span>
                            )}
                          </div>
                          <div className="flex items-center text-blue-600 text-sm font-medium">
                            Read More <ArrowRightIcon className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* Categories Preview */}
          <section className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900">Browse by Category</h2>
                <p className="text-gray-600 mt-2">
                  Explore news organized by intelligent AI categorization across {seoData.categoriesText}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categories.slice(0, 8).map((category) => (
                  <Link
                    key={category.name}
                    href={`/category/${encodeURIComponent(category.name)}`}
                    className="group"
                  >
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group-hover:border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {category.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {category.count} {category.count === 1 ? 'article' : 'articles'}
                          </p>
                        </div>
                        <TagIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="text-center mt-8">
                <Link
                  href="/categories"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                  aria-label="View all news categories and articles"
                >
                  View All Categories <ArrowRightIcon className="h-4 w-4 ml-2" />
                </Link>
              </div>
            </div>
          </section>

          {/* Recent Articles */}
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Latest Updates</h2>
              
              <div className="space-y-6">
                {recentArticles.map((article) => (
                  <Link
                    key={article.guardianId}
                    href={`/story/${article.openaiSummary?.slug || 'processing'}`}
                    className="group"
                  >
                    <article className="flex gap-6 p-6 bg-white border border-gray-100 rounded-xl hover:shadow-lg transition-all duration-200 group-hover:border-blue-200">
                      {article.thumbnail && (
                        <div className="flex-shrink-0 w-32 h-24 rounded-lg overflow-hidden">
                          <img
                            src={article.thumbnail}
                            alt={article.openaiSummary?.heading || 'News article thumbnail'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                            {article.openaiSummary?.category || article.sectionName}
                          </span>
                          <span className="text-gray-500 text-sm">
                            <time dateTime={article.webPublicationDate}>
                              {formatDate(article.webPublicationDate)}
                            </time>
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                          {article.openaiSummary?.heading || 'Processing...'}
                        </h3>
                        
                        {article.openaiSummary?.tldr && article.openaiSummary.tldr.length > 0 && (
                          <p className="text-gray-600 text-sm">
                            {article.openaiSummary.tldr[0]}
                          </p>
                        )}
                      </div>
                    </article>
                  </Link>
                ))}
              </div>

              <div className="text-center mt-8">
                <Link
                  href="/categories"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                  aria-label="Browse all news articles and categories"
                >
                  Browse All Articles <ArrowRightIcon className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </Layout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const prisma = new PrismaClient();
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.parho.net';

  try {
    // Get featured articles (recent completed summaries with slugs)
    const featuredArticles = await prisma.guardianArticle.findMany({
      where: {
        deletedAt: null,
        openaiSummary: {
          processingStatus: 'COMPLETED',
          deletedAt: null,
          slug: {
            not: null,
          },
        },
      },
      include: {
        openaiSummary: {
          select: {
            heading: true,
            category: true,
            summary: true,
            slug: true,
            wordCountSummary: true,
            processingStatus: true,
          }
        },
      },
      orderBy: {
        webPublicationDate: 'desc',
      },
      take: 6,
    });

    // Get recent articles (with slugs)
    const recentArticles = await prisma.guardianArticle.findMany({
      where: {
        deletedAt: null,
        openaiSummary: {
          processingStatus: 'COMPLETED',
          deletedAt: null,
          slug: {
            not: null,
          },
        },
      },
      include: {
        openaiSummary: {
          select: {
            heading: true,
            category: true,
            summary: true,
            slug: true,
            tldr: true,
            processingStatus: true,
          }
        },
      },
      orderBy: {
        webPublicationDate: 'desc',
      },
      take: 5,
      skip: 6, // Skip the featured articles
    });

    // Get categories with counts
    const categoriesData = await prisma.openaiSummary.groupBy({
      by: ['category'],
      where: {
        deletedAt: null,
        processingStatus: 'COMPLETED',
        category: {
          not: '',
        },
      },
      _count: {
        category: true,
      },
      orderBy: {
        _count: {
          category: 'desc',
        },
      },
    });

    const categories = categoriesData.map(item => ({
      name: item.category,
      count: item._count.category,
    }));

    // Get stats
    const stats = {
      totalArticles: await prisma.guardianArticle.count({
        where: { deletedAt: null },
      }),
      totalCategories: categories.length,
    };

    // Generate SEO data
    const canonicalUrl = SITE_URL;
    const lastModified = new Date().toISOString();
    
    // Extract keywords from featured articles and categories
    const featuredKeywords = [
      ...new Set([
        ...featuredArticles.map(a => a.openaiSummary?.category).filter(Boolean),
        ...categories.slice(0, 10).map(c => c.name.toLowerCase()),
        'news summaries',
        'AI news',
        'technology',
        'science',
        'environment',
        'politics'
      ])
    ].slice(0, 15);

    const categoriesText = categories.length > 0 
      ? `${categories.slice(0, 3).map(c => c.name).join(', ')} and ${categories.length - 3} more categories`
      : 'multiple categories';

    const seoData = {
      canonicalUrl,
      lastModified,
      featuredKeywords,
      categoriesText
    };

    await prisma.$disconnect();

    return {
      props: {
        featuredArticles: JSON.parse(JSON.stringify(featuredArticles)),
        recentArticles: JSON.parse(JSON.stringify(recentArticles)),
        categories,
        stats,
        seoData,
      },
    };
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    await prisma.$disconnect();
    
    // Return basic SEO data even on error
    const seoData = {
      canonicalUrl: SITE_URL,
      lastModified: new Date().toISOString(),
      featuredKeywords: ['news', 'summaries', 'AI', 'technology'],
      categoriesText: 'multiple categories'
    };
    
    return {
      props: {
        featuredArticles: [],
        recentArticles: [],
        categories: [],
        stats: { totalArticles: 0, totalCategories: 0 },
        seoData,
      },
    };
  }
};
import { GetServerSideProps } from 'next';
import { PrismaClient } from '@prisma/client';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import Layout from '../../components/Layout';
import { 
  ClockIcon, 
  TagIcon, 
  BookOpenIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon
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
    slug: string;
    wordCountSummary: number;
    updatedAt: string;
  };
}

interface CategoryPageProps {
  category: string;
  articles: Article[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  allCategories: Array<{ name: string; count: number }>;
  relatedCategories: Array<{ name: string; count: number }>;
  seoData: {
    canonicalUrl: string;
    categoryDescription: string;
    categoryKeywords: string[];
    lastModified: string;
    categorySlug: string;
  };
}

export default function CategoryPage({ 
  category, 
  articles, 
  totalCount, 
  currentPage, 
  totalPages,
  allCategories,
  relatedCategories,
  seoData
}: CategoryPageProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');

  const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'ParhoNet';
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

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

  const filteredArticles = articles.filter(article =>
    searchQuery === '' || 
    article.openaiSummary?.heading.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.openaiSummary?.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Generate structured data for category page
  const generateStructuredData = () => {
    const collectionPageData = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${category} News - ${SITE_NAME}`,
      description: seoData.categoryDescription,
      url: seoData.canonicalUrl,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: articles.length,
        itemListElement: articles.map((article, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'NewsArticle',
            headline: article.openaiSummary?.heading,
            url: `${SITE_URL}/story/${article.openaiSummary?.slug}`,
            datePublished: article.webPublicationDate,
            dateModified: article.openaiSummary?.updatedAt,
            author: {
              '@type': 'Organization',
              name: SITE_NAME
            },
            publisher: {
              '@type': 'Organization',
              name: SITE_NAME,
              logo: {
                '@type': 'ImageObject',
                url: `${SITE_URL}/logo.png`
              }
            },
            image: article.thumbnail || `${SITE_URL}/default-article-image.jpg`,
            articleSection: category,
            wordCount: article.openaiSummary?.wordCountSummary
          }
        }))
      },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: SITE_URL
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Categories',
            item: `${SITE_URL}/categories`
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: category,
            item: seoData.canonicalUrl
          }
        ]
      }
    };

    const websiteData = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    };

    return [collectionPageData, websiteData];
  };

  const structuredDataArray = generateStructuredData();

  const GridArticleCard = ({ article }: { article: Article }) => (
    <Link
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
              loading="lazy"
            />
          </div>
        )}
        
        <div className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              {article.sectionName}
            </span>
            <div className="flex items-center text-gray-500 text-sm">
              <ClockIcon className="h-4 w-4 mr-1" />
              <time dateTime={article.webPublicationDate}>
                {formatDate(article.webPublicationDate)}
              </time>
            </div>
          </div>
          
          <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors" style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {article.openaiSummary?.heading || 'Processing...'}
          </h3>
          
          {article.openaiSummary?.summary && (
            <p className="text-gray-600 mb-4 text-sm" style={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {article.openaiSummary.summary.substring(0, 150)}...
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
  );

  const ListArticleCard = ({ article }: { article: Article }) => (
    <Link
      href={`/story/${article.openaiSummary?.slug || 'processing'}`}
      className="group"
    >
      <article className="flex gap-6 p-6 bg-white border border-gray-100 rounded-xl hover:shadow-lg transition-all duration-200 group-hover:border-blue-200">
        {article.thumbnail && (
          <div className="flex-shrink-0 w-40 h-28 rounded-lg overflow-hidden">
            <img
              src={article.thumbnail}
              alt={article.openaiSummary?.heading || 'News article thumbnail'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        )}
        
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
              {article.sectionName}
            </span>
            <span className="text-gray-500 text-sm">
              <time dateTime={article.webPublicationDate}>
                {formatDate(article.webPublicationDate)}
              </time>
            </span>
            {article.openaiSummary?.wordCountSummary && (
              <span className="text-gray-500 text-sm">
                {getReadTime(article.openaiSummary.wordCountSummary)} min read
              </span>
            )}
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-3">
            {article.openaiSummary?.heading || 'Processing...'}
          </h3>
          
          {article.openaiSummary?.tldr && article.openaiSummary.tldr.length > 0 && (
            <p className="text-gray-600 mb-3">
              {article.openaiSummary.tldr[0]}
            </p>
          )}
          
          <div className="flex items-center text-blue-600 text-sm font-medium">
            Read Full Summary <ArrowRightIcon className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </article>
    </Link>
  );

  return (
    <>
      <Head>
        {/* Primary Meta Tags */}
        <title>{category} News - Latest {category} Articles & Summaries | {SITE_NAME}</title>
        <meta name="description" content={seoData.categoryDescription} />
        <meta name="keywords" content={seoData.categoryKeywords.join(', ')} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={seoData.canonicalUrl} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:title" content={`${category} News - Latest Articles | ${SITE_NAME}`} />
        <meta property="og:description" content={seoData.categoryDescription} />
        <meta property="og:url" content={seoData.canonicalUrl} />
        <meta property="og:locale" content="en_US" />
        <meta property="og:image" content={`${SITE_URL}/og-category-${seoData.categorySlug}.jpg`} />
        <meta property="og:image:alt" content={`${category} news articles on ${SITE_NAME}`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${category} News - Latest Articles | ${SITE_NAME}`} />
        <meta name="twitter:description" content={seoData.categoryDescription} />
        <meta name="twitter:image" content={`${SITE_URL}/twitter-category-${seoData.categorySlug}.jpg`} />
        
        {/* Additional Meta Tags */}
        <meta name="author" content={SITE_NAME} />
        <meta name="publisher" content={SITE_NAME} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="googlebot" content="index, follow" />
        
        {/* News-specific meta tags */}
        <meta name="news_keywords" content={seoData.categoryKeywords.join(', ')} />
        <meta name="article:section" content={category} />
        
        {/* Pagination meta tags */}
        {currentPage > 1 && (
          <link rel="prev" href={`${SITE_URL}/category/${seoData.categorySlug}${currentPage > 2 ? `?page=${currentPage - 1}` : ''}`} />
        )}
        {currentPage < totalPages && (
          <link rel="next" href={`${SITE_URL}/category/${seoData.categorySlug}?page=${currentPage + 1}`} />
        )}
        
        {/* Structured Data */}
        {structuredDataArray.map((data, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
          />
        ))}
        
        {/* Additional Performance Headers */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="theme-color" content="#2563eb" />
        
        {/* Cache Control */}
        <meta httpEquiv="cache-control" content="public, max-age=1800" />
        <meta httpEquiv="last-modified" content={seoData.lastModified} />
        
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//images.unsplash.com" />
        <link rel="dns-prefetch" href="//media.guim.co.uk" />
      </Head>

      <Layout 
        showBreadcrumb={true}
        breadcrumbItems={[
          { label: 'Home', href: '/' },
          { label: 'Categories', href: '/categories' },
          { label: category }
        ]}
      >
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              
              {/* Sidebar */}
              <aside className="lg:col-span-1" role="complementary">
                {/* Category Info */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                  <div className="flex items-center mb-4">
                    <TagIcon className="h-6 w-6 text-blue-600 mr-3" />
                    <h2 className="text-xl font-bold text-gray-900">{category}</h2>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p className="mb-2">{totalCount} articles in this category</p>
                    <p>AI-categorized content from The Guardian</p>
                  </div>
                </div>

                {/* Search */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Search Articles</h3>
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search in this category..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      aria-label={`Search ${category} articles`}
                    />
                  </div>
                </div>

                {/* Related Categories */}
                <nav className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6" aria-label="Related categories">
                  <h3 className="font-semibold text-gray-900 mb-4">Related Categories</h3>
                  <div className="space-y-2">
                    {relatedCategories.slice(0, 8).map((cat) => (
                      <Link
                        key={cat.name}
                        href={`/category/${encodeURIComponent(cat.name)}`}
                        className={`flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors ${
                          cat.name === category ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        <span className="font-medium">{cat.name}</span>
                        <span className="text-sm text-gray-500">{cat.count}</span>
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/categories"
                    className="block text-center text-blue-600 hover:text-blue-800 text-sm font-medium mt-4"
                  >
                    View All Categories
                  </Link>
                </nav>

                {/* All Categories Quick Access */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Popular Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {allCategories.slice(0, 10).map((cat) => (
                      <Link
                        key={cat.name}
                        href={`/category/${encodeURIComponent(cat.name)}`}
                        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                          cat.name === category
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </aside>

              {/* Main Content */}
              <main className="lg:col-span-3" role="main">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {category} News
                    </h1>
                    <p className="text-gray-600">
                      {filteredArticles.length} of {totalCount} articles
                      {searchQuery && ` matching "${searchQuery}"`}
                      {currentPage > 1 && ` - Page ${currentPage} of ${totalPages}`}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-4 md:mt-0">
                    {/* Sort */}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="Sort articles"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="wordCount">By Length</option>
                    </select>
                    
                    {/* View Mode Toggle */}
                    <div className="flex border border-gray-300 rounded-lg" role="tablist" aria-label="View mode">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 px-4 rounded-l-lg transition-colors text-sm flex items-center ${
                          viewMode === 'grid'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                        role="tab"
                        aria-selected={viewMode === 'grid'}
                        aria-label="Grid view"
                      >
                        <Squares2X2Icon className="h-4 w-4 mr-1" />
                        Grid
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 px-4 rounded-r-lg transition-colors text-sm flex items-center ${
                          viewMode === 'list'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                        role="tab"
                        aria-selected={viewMode === 'list'}
                        aria-label="List view"
                      >
                        <ListBulletIcon className="h-4 w-4 mr-1" />
                        List
                      </button>
                    </div>
                  </div>
                </header>

                {/* Articles */}
                {filteredArticles.length > 0 ? (
                  <>
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                        {filteredArticles.map((article) => (
                          <GridArticleCard key={article.guardianId} article={article} />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-6 mb-8">
                        {filteredArticles.map((article) => (
                          <ListArticleCard key={article.guardianId} article={article} />
                        ))}
                      </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && !searchQuery && (
                      <nav className="flex items-center justify-center space-x-2" aria-label="Pagination">
                        <Link
                          href={currentPage > 1 ? `${SITE_URL}/category/${seoData.categorySlug}${currentPage > 2 ? `?page=${currentPage - 1}` : ''}` : '#'}
                          className={`flex items-center px-4 py-2 border border-gray-300 rounded-lg ${
                            currentPage === 1
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:bg-gray-50'
                          }`}
                          aria-disabled={currentPage === 1}
                        >
                          <ArrowLeftIcon className="h-4 w-4 mr-2" />
                          Previous
                        </Link>
                        
                        <div className="flex items-center space-x-2">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNum = Math.max(1, currentPage - 2) + i;
                            if (pageNum > totalPages) return null;
                            
                            return (
                              <Link
                                key={pageNum}
                                href={pageNum === 1 ? `${SITE_URL}/category/${seoData.categorySlug}` : `${SITE_URL}/category/${seoData.categorySlug}?page=${pageNum}`}
                                className={`px-3 py-2 rounded-lg ${
                                  pageNum === currentPage
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                                aria-current={pageNum === currentPage ? 'page' : undefined}
                              >
                                {pageNum}
                              </Link>
                            );
                          })}
                        </div>
                        
                        <Link
                          href={currentPage < totalPages ? `${SITE_URL}/category/${seoData.categorySlug}?page=${currentPage + 1}` : '#'}
                          className={`flex items-center px-4 py-2 border border-gray-300 rounded-lg ${
                            currentPage === totalPages
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:bg-gray-50'
                          }`}
                          aria-disabled={currentPage === totalPages}
                        >
                          Next
                          <ArrowRightIcon className="h-4 w-4 ml-2" />
                        </Link>
                      </nav>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <TagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchQuery ? 'No articles found' : 'No articles in this category yet'}
                    </h3>
                    <p className="text-gray-600">
                      {searchQuery 
                        ? `Try adjusting your search terms or browse other categories.`
                        : 'Check back later for new content in this category.'
                      }
                    </p>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                )}
              </main>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { category } = context.params!;
  const page = parseInt(context.query.page as string) || 1;
  const itemsPerPage = 12;
  const skip = (page - 1) * itemsPerPage;

  const prisma = new PrismaClient();
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

  try {
    const decodedCategory = decodeURIComponent(category as string);

    // Get articles for this category
    const articles = await prisma.guardianArticle.findMany({
      where: {
        deletedAt: null,
        openaiSummary: {
          category: decodedCategory,
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
            tldr: true,
            slug: true,
            wordCountSummary: true,
            updatedAt: true,
          }
        },
      },
      orderBy: {
        webPublicationDate: 'desc',
      },
      skip,
      take: itemsPerPage,
    });

    // Get total count for this category
    const totalCount = await prisma.guardianArticle.count({
      where: {
        deletedAt: null,
        openaiSummary: {
          category: decodedCategory,
          processingStatus: 'COMPLETED',
          deletedAt: null,
          slug: { not: null },
        },
      },
    });

    // Get all categories with counts
    const allCategoriesData = await prisma.openaiSummary.groupBy({
      by: ['category'],
      where: {
        deletedAt: null,
        processingStatus: 'COMPLETED',
        category: { not: '' },
        slug: { not: null },
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

    const allCategories = allCategoriesData.map(item => ({
      name: item.category,
      count: item._count.category,
    }));

    // Get related categories (exclude current category)
    const relatedCategories = allCategories.filter(cat => cat.name !== decodedCategory);

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    // Generate SEO data
    const categorySlug = decodedCategory.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
    const canonicalUrl = page === 1 
      ? `${SITE_URL}/category/${encodeURIComponent(decodedCategory)}`
      : `${SITE_URL}/category/${encodeURIComponent(decodedCategory)}?page=${page}`;
    
    const categoryDescription = `Browse ${totalCount} ${decodedCategory.toLowerCase()} articles with AI-powered summaries, TL;DR points, and comprehensive FAQs. Stay updated with the latest ${decodedCategory.toLowerCase()} news from The Guardian.`;
    
    const categoryKeywords = [
      decodedCategory.toLowerCase(),
      `${decodedCategory.toLowerCase()} news`,
      `${decodedCategory.toLowerCase()} articles`,
      `${decodedCategory.toLowerCase()} summaries`,
      'AI news summaries',
      'news analysis',
      'Guardian news',
      ...decodedCategory.split(' ').filter(word => word.length > 3),
      'TL;DR news',
      'news FAQs'
    ].filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

    const lastModified = articles.length > 0 
      ? new Date(Math.max(...articles.map(a => new Date(a.openaiSummary?.updatedAt || a.webPublicationDate).getTime()))).toISOString()
      : new Date().toISOString();

    const seoData = {
      canonicalUrl,
      categoryDescription,
      categoryKeywords,
      lastModified,
      categorySlug
    };

    await prisma.$disconnect();

    return {
      props: {
        category: decodedCategory,
        articles: JSON.parse(JSON.stringify(articles)),
        totalCount,
        currentPage: page,
        totalPages,
        allCategories,
        relatedCategories,
        seoData,
      },
    };
  } catch (error) {
    console.error('Error fetching category data:', error);
    await prisma.$disconnect();
    
    return {
      notFound: true,
    };
  }
};
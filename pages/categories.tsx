import { GetServerSideProps } from 'next';
import { PrismaClient } from '@prisma/client';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import Layout from '../components/Layout';
import { 
  TagIcon, 
  BookOpenIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon
} from '@heroicons/react/24/outline';

interface Category {
  name: string;
  count: number;
  description?: string;
  recentArticles: Array<{
    guardianId: string;
    heading: string;
    slug: string;
    webPublicationDate: string;
  }>;
}

interface CategoriesPageProps {
  categories: Category[];
  totalArticles: number;
  stats: {
    totalCategories: number;
    avgArticlesPerCategory: number;
    mostPopularCategory: string;
  };
  seoData: {
    canonicalUrl: string;
    lastModified: string;
    categoryNames: string[];
    topCategories: string[];
  };
}

export default function CategoriesPage({ categories, totalArticles, stats, seoData }: CategoriesPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'alphabetical' | 'count' | 'recent'>('count');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'ParhoNet';
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';
  const PAGE_DESCRIPTION = `Browse ${stats.totalCategories} news categories including ${seoData.topCategories.join(', ')} and more. Access ${totalArticles.toLocaleString()} AI-summarized articles organized by intelligent categorization.`;

  const filteredCategories = categories
    .filter(category =>
      searchQuery === '' || 
      category.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'alphabetical':
          return a.name.localeCompare(b.name);
        case 'count':
          return b.count - a.count;
        case 'recent':
          const aLatest = new Date(a.recentArticles[0]?.webPublicationDate || 0);
          const bLatest = new Date(b.recentArticles[0]?.webPublicationDate || 0);
          return bLatest.getTime() - aLatest.getTime();
        default:
          return 0;
      }
    });

  const getCategoryColor = (index: number) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-green-500 to-green-600',
      'from-red-500 to-red-600',
      'from-yellow-500 to-yellow-600',
      'from-indigo-500 to-indigo-600',
      'from-pink-500 to-pink-600',
      'from-teal-500 to-teal-600',
    ];
    return colors[index % colors.length];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Generate structured data
  const generateStructuredData = () => {
    const collectionPageData = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `News Categories - ${SITE_NAME}`,
      description: PAGE_DESCRIPTION,
      url: seoData.canonicalUrl,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: categories.length,
        itemListElement: categories.map((category, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Thing',
            '@id': `${SITE_URL}/category/${encodeURIComponent(category.name)}`,
            name: category.name,
            description: `${category.count} ${category.name.toLowerCase()} articles`,
            url: `${SITE_URL}/category/${encodeURIComponent(category.name)}`
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

    const organizationData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      sameAs: [
        // Add social media URLs when available
      ]
    };

    return [collectionPageData, websiteData, organizationData];
  };

  const structuredDataArray = generateStructuredData();

  const GridCategoryCard = ({ category, index }: { category: Category; index: number }) => (
    <Link
      href={`/category/${encodeURIComponent(category.name)}`}
      className="group"
    >
      <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
        <div className={`h-32 bg-gradient-to-br ${getCategoryColor(index)} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-white font-bold text-xl group-hover:scale-105 transition-transform">
              {category.name}
            </h3>
            <p className="text-white/80 text-sm">
              {category.count} {category.count === 1 ? 'article' : 'articles'}
            </p>
          </div>
          <TagIcon className="absolute top-4 right-4 h-6 w-6 text-white/70" />
        </div>
        
        <div className="p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Recent Articles</span>
              <span className="text-green-500 text-sm">↗</span>
            </div>
            <div className="space-y-2">
              {category.recentArticles.slice(0, 2).map((article) => (
                <div key={article.guardianId} className="text-sm">
                  <p className="text-gray-600 truncate" title={article.heading}>
                    {article.heading}
                  </p>
                  <p className="text-gray-500 text-xs">
                    <time dateTime={article.webPublicationDate}>
                      {formatDate(article.webPublicationDate)}
                    </time>
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Last updated <time dateTime={category.recentArticles[0]?.webPublicationDate}>
                {formatDate(category.recentArticles[0]?.webPublicationDate)}
              </time>
            </div>
            <div className="text-blue-600 text-sm font-medium group-hover:text-blue-700">
              Explore →
            </div>
          </div>
        </div>
      </article>
    </Link>
  );

  const ListCategoryCard = ({ category, index }: { category: Category; index: number }) => (
    <Link
      href={`/category/${encodeURIComponent(category.name)}`}
      className="group"
    >
      <article className="bg-white border border-gray-100 rounded-xl p-6 hover:shadow-lg transition-all duration-200 group-hover:border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 bg-gradient-to-r ${getCategoryColor(index)} rounded-xl flex items-center justify-center`}>
              <TagIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {category.name}
              </h3>
              <p className="text-sm text-gray-500">
                {category.count} {category.count === 1 ? 'article' : 'articles'}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-500">Last updated</div>
            <div className="text-sm text-gray-700">
              <time dateTime={category.recentArticles[0]?.webPublicationDate}>
                {formatDate(category.recentArticles[0]?.webPublicationDate)}
              </time>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-600 mb-2 font-medium">Recent articles:</p>
          <div className="space-y-1">
            {category.recentArticles.slice(0, 3).map((article) => (
              <div key={article.guardianId} className="text-sm text-gray-700 truncate" title={article.heading}>
                • {article.heading}
              </div>
            ))}
          </div>
        </div>
      </article>
    </Link>
  );

  return (
    <>
      <Head>
        {/* Primary Meta Tags */}
        <title>News Categories - Browse {stats.totalCategories} Topics | {SITE_NAME}</title>
        <meta name="description" content={PAGE_DESCRIPTION} />
        <meta name="keywords" content={`news categories, ${seoData.categoryNames.join(', ')}, news topics, AI categorization, news organization, ${SITE_NAME}`} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={seoData.canonicalUrl} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:title" content={`News Categories - Browse ${stats.totalCategories} Topics | ${SITE_NAME}`} />
        <meta property="og:description" content={PAGE_DESCRIPTION} />
        <meta property="og:url" content={seoData.canonicalUrl} />
        <meta property="og:locale" content="en_US" />
        <meta property="og:image" content={`${SITE_URL}/og-categories.jpg`} />
        <meta property="og:image:alt" content={`${SITE_NAME} news categories overview`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`News Categories - Browse ${stats.totalCategories} Topics | ${SITE_NAME}`} />
        <meta name="twitter:description" content={PAGE_DESCRIPTION} />
        <meta name="twitter:image" content={`${SITE_URL}/twitter-categories.jpg`} />
        
        {/* Additional Meta Tags */}
        <meta name="author" content={SITE_NAME} />
        <meta name="publisher" content={SITE_NAME} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="googlebot" content="index, follow" />
        
        {/* News-specific meta tags */}
        <meta name="news_keywords" content={seoData.topCategories.join(', ')} />
        
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
        <meta httpEquiv="cache-control" content="public, max-age=3600" />
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
          { label: 'Categories' }
        ]}
      >
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          {/* Header */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <header className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Browse by 
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
                  Category
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
                Discover news organized by AI-detected topics and themes. Each category contains articles automatically classified by our intelligent system.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
                <span className="flex items-center">
                  <TagIcon className="h-4 w-4 mr-1" />
                  {stats.totalCategories} Categories
                </span>
                <span className="flex items-center">
                  <BookOpenIcon className="h-4 w-4 mr-1" />
                  {totalArticles.toLocaleString()} Articles
                </span>
                <span>Updated Daily</span>
              </div>
            </header>

            {/* Controls */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-label="Search categories"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Sort categories"
                  >
                    <option value="count">Most Articles</option>
                    <option value="alphabetical">Alphabetical</option>
                    <option value="recent">Most Recent</option>
                  </select>

                  {/* View Mode */}
                  <div className="flex border border-gray-300 rounded-xl" role="tablist" aria-label="View mode">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-3 px-4 rounded-l-xl transition-colors text-sm flex items-center ${
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
                      className={`p-3 px-4 rounded-r-xl transition-colors text-sm flex items-center ${
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
              </div>

              {/* Results count */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  Showing {filteredCategories.length} of {categories.length} categories
                  {searchQuery && ` matching "${searchQuery}"`}
                </p>
              </div>
            </div>

            {/* Categories */}
            <main role="main">
              {filteredCategories.length > 0 ? (
                <>
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                      {filteredCategories.map((category, index) => (
                        <GridCategoryCard key={category.name} category={category} index={index} />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4 mb-12">
                      {filteredCategories.map((category, index) => (
                        <ListCategoryCard key={category.name} category={category} index={index} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <TagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No categories found
                  </h3>
                  <p className="text-gray-600">
                    {searchQuery 
                      ? `No categories match "${searchQuery}". Try a different search term.`
                      : 'No categories available yet. Check back later for new content.'
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

            {/* Popular Category Highlight */}
            {stats.mostPopularCategory && (
              <section className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
                <h2 className="text-2xl font-bold mb-2">Most Popular Category</h2>
                <p className="text-blue-100 mb-4">
                  The "{stats.mostPopularCategory}" category has the most articles with comprehensive AI summaries
                </p>
                <Link
                  href={`/category/${encodeURIComponent(stats.mostPopularCategory)}`}
                  className="inline-block bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
                >
                  Explore {stats.mostPopularCategory}
                </Link>
              </section>
            )}

            {/* Category Navigation for SEO */}
            <nav className="mt-16" aria-label="All categories">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">All Categories</h2>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {categories.map((category) => (
                    <Link
                      key={category.name}
                      href={`/category/${encodeURIComponent(category.name)}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      <span className="font-medium text-gray-900">{category.name}</span>
                      <span className="text-gray-500">({category.count})</span>
                    </Link>
                  ))}
                </div>
              </div>
            </nav>
          </div>
        </div>
      </Layout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const prisma = new PrismaClient();
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

  try {
    // Get all categories with article counts and recent articles
    const categoriesData = await prisma.openaiSummary.groupBy({
      by: ['category'],
      where: {
        deletedAt: null,
        processingStatus: 'COMPLETED',
        category: { not: '' },
        slug: { not: null }, // Only completed articles with slugs
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

    // Get recent articles for each category
    const categories = await Promise.all(
      categoriesData.map(async (categoryData) => {
        const recentArticles = await prisma.guardianArticle.findMany({
          where: {
            deletedAt: null,
            openaiSummary: {
              category: categoryData.category,
              processingStatus: 'COMPLETED',
              deletedAt: null,
              slug: { not: null },
            },
          },
          include: {
            openaiSummary: {
              select: {
                heading: true,
                slug: true,
                updatedAt: true,
              },
            },
          },
          orderBy: {
            webPublicationDate: 'desc',
          },
          take: 5,
        });

        return {
          name: categoryData.category,
          count: categoryData._count.category,
          recentArticles: recentArticles.map(article => ({
            guardianId: article.guardianId,
            heading: article.openaiSummary?.heading || 'Processing...',
            slug: article.openaiSummary?.slug || '',
            webPublicationDate: article.webPublicationDate.toISOString(),
          })),
        };
      })
    );

    // Calculate stats
    const totalArticles = await prisma.guardianArticle.count({
      where: { 
        deletedAt: null,
        openaiSummary: {
          processingStatus: 'COMPLETED',
          slug: { not: null }
        }
      },
    });

    const stats = {
      totalCategories: categories.length,
      avgArticlesPerCategory: Math.round(totalArticles / categories.length),
      mostPopularCategory: categories[0]?.name || '',
    };

    // Generate SEO data
    const canonicalUrl = `${SITE_URL}/categories`;
    const lastModified = categories.length > 0 
      ? new Date(Math.max(...categories.flatMap(c => 
          c.recentArticles.map(a => new Date(a.webPublicationDate).getTime())
        ))).toISOString()
      : new Date().toISOString();

    const categoryNames = categories.map(c => c.name.toLowerCase());
    const topCategories = categories.slice(0, 5).map(c => c.name);

    const seoData = {
      canonicalUrl,
      lastModified,
      categoryNames,
      topCategories
    };

    await prisma.$disconnect();

    return {
      props: {
        categories,
        totalArticles,
        stats,
        seoData,
      },
    };
  } catch (error) {
    console.error('Error fetching categories:', error);
    await prisma.$disconnect();
    
    // Basic fallback SEO data
    const seoData = {
      canonicalUrl: `${SITE_URL}/categories`,
      lastModified: new Date().toISOString(),
      categoryNames: [],
      topCategories: []
    };
    
    return {
      props: {
        categories: [],
        totalArticles: 0,
        stats: {
          totalCategories: 0,
          avgArticlesPerCategory: 0,
          mostPopularCategory: '',
        },
        seoData,
      },
    };
  }
};
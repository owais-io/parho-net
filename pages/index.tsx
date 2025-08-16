import { GetServerSideProps } from 'next';
import { PrismaClient } from '@prisma/client';
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
    wordCountSummary: number;
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
}

export default function HomePage({ featuredArticles, recentArticles, categories, stats }: HomePageProps) {
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

  return (
    <Layout>
      <div className="bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  parho.net
                </span>
              </h1>
              <p className="text-lg text-gray-600">
                Your source for intelligent news summaries
              </p>
            </div>
          </div>
        </section>

        {/* Featured Articles */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Featured Stories</h2>
                <p className="text-gray-600 mt-2">Today's most important news, summarized</p>
              </div>
              <Link 
                href="/categories"
                className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
              >
                View All <ArrowRightIcon className="h-4 w-4 ml-1" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredArticles.map((article) => (
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
                          alt={article.openaiSummary?.heading}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                          {formatDate(article.webPublicationDate)}
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
              <p className="text-gray-600 mt-2">Explore news organized by intelligent categorization</p>
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
                          alt={article.openaiSummary?.heading}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                          {article.openaiSummary?.category || article.sectionName}
                        </span>
                        <span className="text-gray-500 text-sm">
                          {formatDate(article.webPublicationDate)}
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
          </div>
        </section>
      </div>
    </Layout>
  );
}

// Same getServerSideProps as before...
export const getServerSideProps: GetServerSideProps = async () => {
  const prisma = new PrismaClient();

  try {
    // Get featured articles (recent completed summaries with slugs)
    const featuredArticles = await prisma.guardianArticle.findMany({
      where: {
        deletedAt: null,
        openaiSummary: {
          processingStatus: 'COMPLETED',
          deletedAt: null,
          slug: {
            not: null, // Only articles with slugs
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
            not: null, // Only articles with slugs
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

    await prisma.$disconnect();

    return {
      props: {
        featuredArticles: JSON.parse(JSON.stringify(featuredArticles)),
        recentArticles: JSON.parse(JSON.stringify(recentArticles)),
        categories,
        stats,
      },
    };
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    await prisma.$disconnect();
    
    return {
      props: {
        featuredArticles: [],
        recentArticles: [],
        categories: [],
        stats: { totalArticles: 0, totalCategories: 0 },
      },
    };
  }
};
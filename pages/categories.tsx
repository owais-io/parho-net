import { GetServerSideProps } from 'next';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { useState } from 'react';
import { 
  TagIcon, 
  BookOpenIcon
} from '@heroicons/react/24/outline';

interface Category {
  name: string;
  count: number;
  description?: string;
  recentArticles: Array<{
    guardianId: string;
    heading: string;
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
}

export default function CategoriesPage({ categories, totalArticles, stats }: CategoriesPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'alphabetical' | 'count' | 'recent'>('count');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

  const GridCategoryCard = ({ category, index }: { category: Category; index: number }) => (
    <Link
      href={`/category/${encodeURIComponent(category.name)}`}
      className="group"
    >
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
        <div className={`h-32 bg-gradient-to-br ${getCategoryColor(index)} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-white font-bold text-xl group-hover:scale-105 transition-transform">
              {category.name}
            </h3>
          </div>
          <TagIcon className="absolute top-4 right-4 h-6 w-6 text-white/70" />
        </div>
        
        <div className="p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Recent Activity</span>
              <span className="text-green-500 text-sm">↗</span>
            </div>
            <div className="space-y-2">
              {category.recentArticles.slice(0, 2).map((article) => (
                <div key={article.guardianId} className="text-sm">
                  <p className="text-gray-600 truncate">
                    {article.heading}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {formatDate(article.webPublicationDate)}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Last updated {formatDate(category.recentArticles[0]?.webPublicationDate)}
            </div>
            <div className="text-blue-600 text-sm font-medium group-hover:text-blue-700">
              Explore →
            </div>
          </div>
        </div>
      </div>
    </Link>
  );

  const ListCategoryCard = ({ category, index }: { category: Category; index: number }) => (
    <Link
      href={`/category/${encodeURIComponent(category.name)}`}
      className="group"
    >
      <div className="bg-white border border-gray-100 rounded-xl p-6 hover:shadow-lg transition-all duration-200 group-hover:border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 bg-gradient-to-r ${getCategoryColor(index)} rounded-xl flex items-center justify-center`}>
              <TagIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {category.name}
              </h3>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-500">Last updated</div>
            <div className="text-sm text-gray-700">{formatDate(category.recentArticles[0]?.webPublicationDate)}</div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-600 mb-2 font-medium">Recent articles:</p>
          <div className="space-y-1">
            {category.recentArticles.slice(0, 3).map((article) => (
              <div key={article.guardianId} className="text-sm text-gray-700 truncate">
                • {article.heading}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl">
                  <BookOpenIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    parho.net
                  </h1>
                  <p className="text-xs text-gray-500">AI-Powered News Summaries</p>
                </div>
              </Link>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium">Home</Link>
              <Link href="/categories" className="text-blue-600 font-medium">Categories</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Browse by 
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
              Category
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover news organized by AI-detected topics and themes. Each category contains articles automatically classified by our intelligent system.
          </p>
        </div>

        {/* Stats - REMOVED */}

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-4">
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="count">Most Articles</option>
                <option value="alphabetical">Alphabetical</option>
                <option value="recent">Most Recent</option>
              </select>

              {/* View Mode */}
              <div className="flex border border-gray-300 rounded-xl">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 px-4 rounded-l-xl transition-colors text-sm ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 px-4 rounded-r-xl transition-colors text-sm ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  List
                </button>
              </div>
            </div>
          </div>

          {/* Results count - REMOVED */}
        </div>

        {/* Categories */}
        {filteredCategories.length > 0 ? (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCategories.map((category, index) => (
                  <GridCategoryCard key={category.name} category={category} index={index} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
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

        {/* Popular Category Highlight */}
        {stats.mostPopularCategory && (
          <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-2">Most Popular Category</h3>
            <p className="text-blue-100 mb-4">
              The "{stats.mostPopularCategory}" category has the most articles
            </p>
            <Link
              href={`/category/${encodeURIComponent(stats.mostPopularCategory)}`}
              className="inline-block bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
            >
              Explore {stats.mostPopularCategory}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const prisma = new PrismaClient();

  try {
    // Get all categories with article counts and recent articles
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
            },
          },
          include: {
            openaiSummary: {
              select: {
                heading: true,
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
            webPublicationDate: article.webPublicationDate.toISOString(),
          })),
        };
      })
    );

    // Calculate stats
    const totalArticles = await prisma.guardianArticle.count({
      where: { deletedAt: null },
    });

    const stats = {
      totalCategories: categories.length,
      avgArticlesPerCategory: Math.round(totalArticles / categories.length),
      mostPopularCategory: categories[0]?.name || '',
    };

    await prisma.$disconnect();

    return {
      props: {
        categories,
        totalArticles,
        stats,
      },
    };
  } catch (error) {
    console.error('Error fetching categories:', error);
    await prisma.$disconnect();
    
    return {
      props: {
        categories: [],
        totalArticles: 0,
        stats: {
          totalCategories: 0,
          avgArticlesPerCategory: 0,
          mostPopularCategory: '',
        },
      },
    };
  }
};
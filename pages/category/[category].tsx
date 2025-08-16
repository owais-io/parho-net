import { GetServerSideProps } from 'next';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { useState } from 'react';
import { 
  ClockIcon, 
  TagIcon, 
  BookOpenIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon
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

interface CategoryPageProps {
  category: string;
  articles: Article[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  allCategories: Array<{ name: string; count: number }>;
  relatedCategories: Array<{ name: string; count: number }>;
}

export default function CategoryPage({ 
  category, 
  articles, 
  totalCount, 
  currentPage, 
  totalPages,
  allCategories,
  relatedCategories 
}: CategoryPageProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');

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

  const GridArticleCard = ({ article }: { article: Article }) => (
    <Link
      href={`/story/${Buffer.from(article.guardianId).toString('base64')}`}
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
              {article.sectionName}
            </span>
            <div className="flex items-center text-gray-500 text-sm">
              <ClockIcon className="h-4 w-4 mr-1" />
              {formatDate(article.webPublicationDate)}
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
      href={`/story/${Buffer.from(article.guardianId).toString('base64')}`}
      className="group"
    >
      <article className="flex gap-6 p-6 bg-white border border-gray-100 rounded-xl hover:shadow-lg transition-all duration-200 group-hover:border-blue-200">
        {article.thumbnail && (
          <div className="flex-shrink-0 w-40 h-28 rounded-lg overflow-hidden">
            <img
              src={article.thumbnail}
              alt={article.openaiSummary?.heading}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
              {article.sectionName}
            </span>
            <span className="text-gray-500 text-sm">
              {formatDate(article.webPublicationDate)}
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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl">
                  <BookOpenIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Guardian Digest
                  </h1>
                  <p className="text-xs text-gray-500">AI-Powered News Summaries</p>
                </div>
              </Link>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium">Home</Link>
              <Link href="/categories" className="text-gray-700 hover:text-blue-600 font-medium">Categories</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-blue-600 hover:text-blue-800">Home</Link>
            <span className="text-gray-400">/</span>
            <Link href="/categories" className="text-blue-600 hover:text-blue-800">Categories</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-700 font-medium">{category}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
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
                />
              </div>
            </div>

            {/* Related Categories */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
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
            </div>

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
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {category} News
                </h1>
                <p className="text-gray-600">
                  {filteredArticles.length} of {totalCount} articles
                  {searchQuery && ` matching "${searchQuery}"`}
                </p>
              </div>
              
              <div className="flex items-center space-x-4 mt-4 md:mt-0">
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="wordCount">By Length</option>
                </select>
                
                {/* View Mode Toggle */}
                <div className="flex border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 px-4 rounded-l-lg transition-colors text-sm ${
                      viewMode === 'grid'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 px-4 rounded-r-lg transition-colors text-sm ${
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
                  <div className="flex items-center justify-center space-x-2">
                    <Link
                      href={`/category/${encodeURIComponent(category)}?page=${currentPage - 1}`}
                      className={`flex items-center px-4 py-2 border border-gray-300 rounded-lg ${
                        currentPage === 1
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-gray-50'
                      }`}
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
                            href={`/category/${encodeURIComponent(category)}?page=${pageNum}`}
                            className={`px-3 py-2 rounded-lg ${
                              pageNum === currentPage
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </Link>
                        );
                      })}
                    </div>
                    
                    <Link
                      href={`/category/${encodeURIComponent(category)}?page=${currentPage + 1}`}
                      className={`flex items-center px-4 py-2 border border-gray-300 rounded-lg ${
                        currentPage === totalPages
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      Next
                      <ArrowRightIcon className="h-4 w-4 ml-2" />
                    </Link>
                  </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { category } = context.params!;
  const page = parseInt(context.query.page as string) || 1;
  const itemsPerPage = 12;
  const skip = (page - 1) * itemsPerPage;

  const prisma = new PrismaClient();

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
        },
      },
      include: {
        openaiSummary: true,
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
        },
      },
    });

    // Get all categories with counts
    const allCategoriesData = await prisma.openaiSummary.groupBy({
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

    const allCategories = allCategoriesData.map(item => ({
      name: item.category,
      count: item._count.category,
    }));

    // Get related categories (exclude current category)
    const relatedCategories = allCategories.filter(cat => cat.name !== decodedCategory);

    const totalPages = Math.ceil(totalCount / itemsPerPage);

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
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../lib/auth';
import { PrismaClient } from '@prisma/client';
import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { 
  TrashIcon, 
  EyeIcon, 
  PlayIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import toast, { Toaster } from 'react-hot-toast';

interface Article {
  id: number;
  guardianId: string;
  type: string;
  sectionName: string;
  webPublicationDate: string;
  wordCount: number;
  characterCount: number;
  status: string;
  openaiSummary?: {
    id: number;
    heading: string;
    category: string;
    wordCountSummary: number;
    characterCountSummary: number;
    processingStatus: string;
    tokensUsed?: number;
    processingCostUsd?: number;
  };
}

interface DashboardStats {
  totalArticles: number;
  publishedArticles: number;
  totalSummaries: number;
  completedSummaries: number;
  failedSummaries: number;
  totalCost: number;
  totalTokens: number;
  lastCronRun?: string;
  todayProcessed: number;
}

interface AdminDashboardProps {
  initialArticles: Article[];
  totalCount: number;
  stats: DashboardStats;
}

export default function AdminDashboard({ initialArticles, totalCount, stats }: AdminDashboardProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGuardianCategory, setSelectedGuardianCategory] = useState('all');
  const [selectedOpenaiCategory, setSelectedOpenaiCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [manualCount, setManualCount] = useState(10);
  const [showManualFetch, setShowManualFetch] = useState(false);

  const itemsPerPage = 50;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Get unique Guardian categories
  const guardianCategories = ['all', ...new Set(articles.map(a => a.sectionName))];
  
  // Get unique OpenAI categories
  const openaiCategories = ['all', ...new Set(articles
    .filter(a => a.openaiSummary?.category)
    .map(a => a.openaiSummary!.category)
  )];

  // Filter articles by both categories
  const filteredArticles = articles.filter(article => {
    const guardianMatch = selectedGuardianCategory === 'all' || article.sectionName === selectedGuardianCategory;
    const openaiMatch = selectedOpenaiCategory === 'all' || 
      (article.openaiSummary?.category === selectedOpenaiCategory);
    return guardianMatch && openaiMatch;
  });

  const handleSelectAll = () => {
    if (selectedArticles.length === filteredArticles.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(filteredArticles.map(a => a.guardianId));
    }
  };

  const handleSelectArticle = (guardianId: string) => {
    setSelectedArticles(prev => 
      prev.includes(guardianId) 
        ? prev.filter(id => id !== guardianId)
        : [...prev, guardianId]
    );
  };

  const handleDeleteSingle = async (guardianId: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/articles/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleIds: [guardianId] })
      });

      if (response.ok) {
        setArticles(prev => prev.filter(a => a.guardianId !== guardianId));
        toast.success('Article deleted successfully');
      } else {
        toast.error('Failed to delete article');
      }
    } catch (error) {
      toast.error('Error deleting article');
    }
    setIsLoading(false);
  };

  const handleBulkDelete = async () => {
    if (selectedArticles.length === 0) {
      toast.error('No articles selected');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedArticles.length} articles?`)) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/articles/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleIds: selectedArticles })
      });

      if (response.ok) {
        setArticles(prev => prev.filter(a => !selectedArticles.includes(a.guardianId)));
        setSelectedArticles([]);
        toast.success(`${selectedArticles.length} articles deleted successfully`);
      } else {
        toast.error('Failed to delete articles');
      }
    } catch (error) {
      toast.error('Error deleting articles');
    }
    setIsLoading(false);
  };

  const handleManualFetch = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/manual-fetch', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count: manualCount })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(`Processed ${data.data.articlesProcessed} articles successfully`);
        // Refresh the page to show new articles
        window.location.reload();
      } else {
        toast.error('Failed to fetch articles');
      }
    } catch (error) {
      toast.error('Error fetching articles');
    }
    setIsLoading(false);
    setShowManualFetch(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'COMPLETED':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'PROCESSING':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'FAILED':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Guardian News Admin</h1>
              <p className="text-gray-600">Manage articles and summaries</p>
            </div>
            <button
              onClick={() => signOut()}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Articles</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalArticles}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Summaries</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedSummaries}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalCost.toFixed(4)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today Processed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayProcessed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex flex-col space-y-4">
            
            {/* Filter Row */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex flex-col">
                <label className="text-xs font-medium text-gray-600 mb-1">Guardian Category</label>
                <select
                  value={selectedGuardianCategory}
                  onChange={(e) => setSelectedGuardianCategory(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  {guardianCategories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Guardian Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex flex-col">
                <label className="text-xs font-medium text-gray-600 mb-1">AI Category</label>
                <select
                  value={selectedOpenaiCategory}
                  onChange={(e) => setSelectedOpenaiCategory(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  {openaiCategories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All AI Categories' : category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Action Row */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedArticles.length === 0 || isLoading}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete Selected ({selectedArticles.length})
                </button>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowManualFetch(!showManualFetch)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                >
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Manual Fetch
                </button>
              </div>
            </div>
          </div>
          
          {/* Manual Fetch Panel */}
          {showManualFetch && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Article Count:</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={manualCount}
                  onChange={(e) => setManualCount(parseInt(e.target.value) || 10)}
                  className="border border-gray-300 rounded-md px-3 py-1 w-20"
                />
                <button
                  onClick={handleManualFetch}
                  disabled={isLoading}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : 'Fetch Articles'}
                </button>
                <button
                  onClick={() => setShowManualFetch(false)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Articles Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedArticles.length === filteredArticles.length && filteredArticles.length > 0}
                onChange={handleSelectAll}
                className="h-4 w-4 text-blue-600 rounded border-gray-300"
              />
              <label className="ml-3 text-sm font-medium text-gray-700">
                Select All ({filteredArticles.length} articles)
              </label>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Select</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Article</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guardian Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Word Count</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Summary Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredArticles.map((article) => (
                  <tr key={article.guardianId} className={selectedArticles.includes(article.guardianId) ? 'bg-blue-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedArticles.includes(article.guardianId)}
                        onChange={() => handleSelectArticle(article.guardianId)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {article.openaiSummary?.heading || 'Processing...'}
                      </div>
                      <div className="text-sm text-gray-500">ID: {article.guardianId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        {article.sectionName}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {article.openaiSummary?.category ? (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {article.openaiSummary.category}
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">
                          Not Processed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>Original: {article.wordCount?.toLocaleString()}</div>
                      {article.openaiSummary?.wordCountSummary && (
                        <div className="text-gray-500">Summary: {article.openaiSummary.wordCountSummary}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(article.openaiSummary?.processingStatus || 'PENDING')}>
                        {article.openaiSummary?.processingStatus || 'PENDING'}
                      </span>
                      {article.openaiSummary?.processingCostUsd && (
                        <div className="text-xs text-gray-500 mt-1">
                          ${article.openaiSummary.processingCostUsd.toString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(article.webPublicationDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            const encodedId = Buffer.from(article.guardianId).toString('base64');
                            window.open(`/admin/view-article?id=${encodedId}`, '_blank');
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Article"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSingle(article.guardianId)}
                          disabled={isLoading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="Delete Article"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-6 py-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 bg-blue-600 text-white rounded-md">
                    {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
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

  const prisma = new PrismaClient();
  
  const page = parseInt(context.query.page as string) || 1;
  const guardianCategory = context.query.guardianCategory as string || 'all';
  const openaiCategory = context.query.openaiCategory as string || 'all';
  const itemsPerPage = 50;
  const skip = (page - 1) * itemsPerPage;

  // Build where clause for Guardian categories
  let whereClause: any = { deletedAt: null };
  
  if (guardianCategory !== 'all') {
    whereClause.sectionName = guardianCategory;
  }

  // Fetch articles with summaries
  let articles = await prisma.guardianArticle.findMany({
    where: whereClause,
    include: {
      openaiSummary: true,
    },
    orderBy: {
      webPublicationDate: 'desc',
    },
    skip,
    take: itemsPerPage,
  });

  // Filter by OpenAI category if specified (client-side filtering for now)
  if (openaiCategory !== 'all') {
    articles = articles.filter(article => 
      article.openaiSummary?.category === openaiCategory
    );
  }

  // Get total count (approximate for OpenAI filtering)
  const totalCount = await prisma.guardianArticle.count({
    where: whereClause,
  });

  // In your getServerSideProps function, replace the stats object creation:

  // Get dashboard stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats: DashboardStats = {
    totalArticles: await prisma.guardianArticle.count({ where: { deletedAt: null } }),
    publishedArticles: await prisma.guardianArticle.count({ 
      where: { status: 'PUBLISHED', deletedAt: null } 
    }),
    totalSummaries: await prisma.openaiSummary.count({ where: { deletedAt: null } }),
    completedSummaries: await prisma.openaiSummary.count({ 
      where: { processingStatus: 'COMPLETED', deletedAt: null } 
    }),
    failedSummaries: await prisma.openaiSummary.count({ 
      where: { processingStatus: 'FAILED', deletedAt: null } 
    }),
    totalCost: await prisma.openaiSummary.aggregate({
      _sum: { processingCostUsd: true },
      where: { deletedAt: null }
    }).then(result => Number(result._sum.processingCostUsd) || 0),
    totalTokens: await prisma.openaiSummary.aggregate({
      _sum: { tokensUsed: true },
      where: { deletedAt: null }
    }).then(result => result._sum.tokensUsed || 0),
    todayProcessed: await prisma.openaiSummary.count({
      where: {
        createdAt: { gte: today },
        processingStatus: 'COMPLETED',
        deletedAt: null
      }
    }),
    lastCronRun: undefined, // Initialize as undefined
  };

  const lastCronRun = await prisma.cronJobLog.findFirst({
    orderBy: { startTime: 'desc' },
  });

  if (lastCronRun) {
    stats.lastCronRun = lastCronRun.startTime.toISOString();
  }
  await prisma.$disconnect();

  return {
    props: {
      initialArticles: JSON.parse(JSON.stringify(articles)),
      totalCount,
      stats,
    },
  };
};
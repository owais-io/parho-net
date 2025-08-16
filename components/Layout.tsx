import Link from 'next/link';
import { ReactNode } from 'react';
import { BookOpenIcon } from '@heroicons/react/24/outline';

interface LayoutProps {
  children: ReactNode;
  showBreadcrumb?: boolean;
  breadcrumbItems?: Array<{
    label: string;
    href?: string;
  }>;
}

export default function Layout({ children, showBreadcrumb = false, breadcrumbItems = [] }: LayoutProps) {
  return (
    <div className="min-h-screen">
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
                  <p className="text-xs text-gray-500">Intelligent News Summaries</p>
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

      {/* Breadcrumb (Optional) */}
      {showBreadcrumb && breadcrumbItems.length > 0 && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-2 text-sm">
              {breadcrumbItems.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  {index > 0 && <span className="text-gray-400">/</span>}
                  {item.href ? (
                    <Link href={item.href} className="text-blue-600 hover:text-blue-800">
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-gray-700 font-medium">{item.label}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl">
                  <BookOpenIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold">parho.net</h3>
              </div>
              <p className="text-gray-400">
                Intelligent news summaries delivered fresh daily.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2">
                <Link href="/" className="block text-gray-400 hover:text-white transition-colors">Home</Link>
                <Link href="/categories" className="block text-gray-400 hover:text-white transition-colors">Categories</Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">About</h4>
              <p className="text-gray-400 text-sm">
                Content is automatically updated and summarized for easy consumption.
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2025 parho.net. News content curated and summarized.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
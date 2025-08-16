// components/Layout.tsx

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
              <Link href="/" className="flex items-center space-x-4 group">
                {/* Stylish Icon with Gradient */}
                <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-2.5 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <BookOpenIcon className="h-7 w-7 text-white" />
                </div>
                
                {/* Stylish Logo Text */}
                <div className="flex items-baseline space-x-1">
                  {/* "parho" in stylish font */}
                  <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:via-purple-700 group-hover:to-indigo-800 transition-all duration-300" 
                      style={{ 
                        fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
                        letterSpacing: '-0.02em'
                      }}>
                    parho
                  </h1>
                  {/* ".net" in simple font */}
                  <span className="text-lg font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300"
                        style={{ fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace' }}>
                    .net
                  </span>
                </div>
              </Link>
              
              {/* Optional tagline */}
              {/* <div className="hidden sm:block ml-4 pl-4 border-l border-gray-200">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Intelligent News
                </p>
              </div> */}
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 relative group">
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/categories" className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 relative group">
                Categories
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
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
                    <Link href={item.href} className="text-blue-600 hover:text-blue-800 transition-colors">
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
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-2.5 rounded-2xl shadow-lg">
                  <BookOpenIcon className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-baseline space-x-1">
                  <h3 className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent"
                      style={{ 
                        fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
                        letterSpacing: '-0.02em'
                      }}>
                    parho
                  </h3>
                  <span className="text-lg font-medium text-gray-400"
                        style={{ fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace' }}>
                    .net
                  </span>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Intelligent news summaries delivered fresh daily. Stay informed with AI-powered analysis.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-lg">Quick Links</h4>
              <div className="space-y-3">
                <Link href="/" className="block text-gray-400 hover:text-white transition-colors duration-200 hover:translate-x-1 transform">
                  Home
                </Link>
                <Link href="/categories" className="block text-gray-400 hover:text-white transition-colors duration-200 hover:translate-x-1 transform">
                  Categories
                </Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-lg">About</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                Content is automatically updated and summarized using advanced AI technology for easy consumption and better understanding.
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
              <div className="flex items-center space-x-1 mb-4 md:mb-0">
                <span>&copy; 2025</span>
                <span className="font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
                      style={{ fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif' }}>
                  parho
                </span>
                <span style={{ fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace' }}>.net</span>
                <span>• News content curated and summarized.</span>
              </div>
              <div className="text-xs text-gray-500">
                Powered by AI • Updated Daily
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
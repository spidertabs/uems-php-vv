// src/app/not-found.tsx
'use client';
import Link from 'next/link';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="space-y-8 lg:pl-64">
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          {/* 404 Illustration */}
          <div className="mb-8">
            <div className="relative mx-auto w-64 h-64">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-9xl font-bold text-gray-200 dark:text-gray-700">404</span>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Search className="h-32 w-32 text-blue-500 opacity-50 animate-pulse" />
              </div>
            </div>
          </div>
          {/* Error Message */}
          <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white md:text-5xl">
            Page Not Found
          </h1>
          <p className="mb-8 text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved, deleted, or never existed.
          </p>
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white font-medium shadow-lg hover:bg-blue-700 transition-all hover:shadow-xl"
            >
              <Home className="h-5 w-5" />
              Go to Dashboard
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 rounded-lg border-2 border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 shadow-md hover:bg-gray-50 transition-all dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
              Go Back
            </button>
          </div>
          {/* Helpful Links */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Here are some helpful links instead:
            </p>
            <div className="flex flex-wrap gap-4 justify-center text-sm">
              <Link 
                href="/exam-papers" 
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                Exam Papers
              </Link>
              <Link 
                href="/question-bank" 
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                Question Bank
              </Link>
              <Link 
                href="/notifications/inbox" 
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                Notifications
              </Link>
              <Link 
                href="/profile" 
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                Profile
              </Link>
            </div>
          </div>
          {/* Error Code */}
          <div className="mt-8">
            <p className="text-xs text-gray-400 dark:text-gray-600">
              Error Code: 404 - Page Not Found
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
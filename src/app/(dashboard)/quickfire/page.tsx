/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { QuickfireAssessment } from '@/types';

export default function QuickfireListPage() {
  const [assessments, setAssessments] = useState<QuickfireAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/quickfire');
      if (response.ok) {
        const result = await response.json();
        setAssessments(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssessments = assessments.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.course_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.course_title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center lg:pl-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:pl-64">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quickfire Assessments</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Create manual assessments for students (No HOD approval required)
          </p>
        </div>

        <Link
          href="/quickfire/new"
          className="whitespace-nowrap rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          ➕ Create Assessment
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 text-uppercase tracking-wider">Total Active</div>
          <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {assessments.filter(a => a.is_active).length}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 text-uppercase tracking-wider">Total Completed</div>
          <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {assessments.length}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 text-white bg-gradient-to-br from-indigo-500 to-purple-600 border-none">
          <div className="text-sm font-medium opacity-80 text-uppercase tracking-wider">Quickfire Module</div>
          <div className="mt-2 text-lg font-medium">Ready for Students</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search assessments by title or course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-10 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <span className="absolute left-3 top-3 text-gray-400">🔍</span>
        </div>
      </div>

      {/* Assessments List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredAssessments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 dark:border-gray-600 dark:bg-gray-900/50">
            <div className="text-5xl">📝</div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">No assessments found</h3>
            <p className="mt-1 text-sm text-gray-500">Create your first quickfire assessment to interact with students.</p>
            <Link href="/quickfire/new" className="mt-6 font-medium text-indigo-600 hover:text-indigo-500">
              Create now →
            </Link>
          </div>
        ) : (
          filteredAssessments.map((a) => (
            <div 
              key={a.id}
              className="group flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 transition hover:border-indigo-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-900/50 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                   <span className={`h-2.5 w-2.5 rounded-full ${a.is_active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} title={a.is_active ? 'Active' : 'Inactive'}></span>
                   <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                     {a.course_code}
                   </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {a.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                  {a.description || 'No description provided'}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-xs text-gray-500 dark:text-gray-500">
                  <span className="flex items-center gap-1">⏱️ {a.duration_minutes || '∞'} mins</span>
                  <span>|</span>
                  <span className="flex items-center gap-1">📅 {new Date(a.created_at).toLocaleDateString()}</span>
                  <span>|</span>
                  <span className="flex items-center gap-1">👁️ {a.show_results ? 'Results Public' : 'Results Hidden'}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/quickfire/${a.id}/results`}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-300"
                >
                  📊 Reports
                </Link>
                <Link
                  href={`/quickfire/${a.id}`}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 shadow-sm"
                >
                  ⚙️ Manage
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/colleges/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface College {
  id: number;
  code: string;
  name: string;
  description: string;
  departments_count: number;
  created_at: string;
  updated_at: string;
}

export default function CollegesPage() {
  const router = useRouter();
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      const response = await fetch('/api/colleges');
      
      console.log('Fetch response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched colleges data:', data);
        setColleges(data.colleges || []);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch colleges:', response.status, errorText);
        alert(`Failed to fetch colleges: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching colleges:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this college? This will also delete all associated departments.')) {
      return;
    }

    try {
      const response = await fetch(`/api/colleges/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('College deleted successfully');
        fetchColleges();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete college');
      }
    } catch (error) {
      console.error('Error deleting college:', error);
      alert('Failed to delete college');
    }
  };

  const filteredColleges = colleges.filter((college) =>
    college.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    college.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:pl-64">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🏛️ Colleges
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage colleges and schools across the university
          </p>
        </div>
        <Link
          href="/colleges/create"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        >
          ➕ Create College
        </Link>
      </div>

      {/* Search */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Search
        </label>
        <input
          type="text"
          placeholder="Search by name or code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {colleges.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Colleges</div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {colleges.reduce((sum, c) => sum + (c.departments_count || 0), 0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Departments</div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {filteredColleges.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Filtered Results</div>
        </div>
      </div>

      {/* Colleges Grid */}
      {filteredColleges.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-6xl">🏛️</div>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No colleges found
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {searchQuery
              ? 'Try adjusting your search'
              : 'Get started by creating your first college'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredColleges.map((college) => (
            <div
              key={college.id}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <Link
                    href={`/colleges/${college.id}`}
                    className="text-lg font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    {college.name}
                  </Link>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {college.code}
                  </span>
                </div>
              </div>

              {college.description && (
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {college.description}
                </p>
              )}

              <div className="mb-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Departments:</span>
                <span className="ml-2 font-semibold text-blue-600 dark:text-blue-400">
                  {college.departments_count || 0}
                </span>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/colleges/${college.id}`}
                  className="flex-1 rounded-lg bg-blue-100 px-3 py-2 text-center text-sm font-medium text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
                >
                  View
                </Link>
                <Link
                  href={`/colleges/edit/${college.id}`}
                  className="flex-1 rounded-lg bg-yellow-100 px-3 py-2 text-center text-sm font-medium text-yellow-700 transition-colors hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(college.id)}
                  className="flex-1 rounded-lg bg-red-100 px-3 py-2 text-center text-sm font-medium text-red-700 transition-colors hover:bg-red-200 dark:bg-red-900 dark:text-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
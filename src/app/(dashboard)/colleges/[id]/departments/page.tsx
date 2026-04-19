/* eslint-disable react-hooks/exhaustive-deps */
// src/app/colleges/[id]/departments/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Department {
  id: number;
  code: string;
  name: string;
  abbrv: string;
  description: string;
  college_id: number;
  created_at: string;
}

interface College {
  id: number;
  code: string;
  name: string;
  abbrv: string;
}

export default function DepartmentsPage() {
  const router = useRouter();
  const params = useParams();
  const collegeId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [college, setCollege] = useState<College | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, [collegeId]);

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/colleges/${collegeId}`);
      if (response.ok) {
        const data = await response.json();
        setCollege(data.college);
        setDepartments(data.departments || []);
      } else {
        alert('Failed to fetch data');
        router.push('/colleges');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch data');
      router.push('/colleges');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this department?')) {
      return;
    }

    try {
      const response = await fetch(`/api/departments/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Department deleted successfully');
        fetchData();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete department');
      }
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('Failed to delete department');
    }
  };

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.abbrv.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!college) {
    return <div>College not found</div>;
  }

  return (
    <div className="space-y-6 lg:pl-64">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🏢 Departments
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {college.name} ({college.abbrv})
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/colleges/${collegeId}`}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            ← Back to College
          </Link>
          <Link
            href={`/colleges/${collegeId}/departments/create`}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            ➕ Add Department
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Search Departments
        </label>
        <input
          type="text"
          placeholder="Search by name, code, or abbreviation..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {departments.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Departments
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {filteredDepartments.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Filtered Results
          </div>
        </div>
      </div>

      {/* Departments List */}
      {filteredDepartments.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-6xl">🏢</div>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No departments found
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {searchQuery
              ? 'Try adjusting your search'
              : 'Get started by creating your first department'}
          </p>
          {!searchQuery && (
            <Link
              href={`/colleges/${collegeId}/departments/create`}
              className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Create First Department
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDepartments.map((dept) => (
            <div
              key={dept.id}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <Link
                    href={`/colleges/${collegeId}/departments/${dept.id}`}
                    className="text-lg font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    {dept.abbrv}
                  </Link>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {dept.code}
                  </span>
                </div>
                <h3 className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                  {dept.name}
                </h3>
              </div>

              {dept.description && (
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {dept.description}
                </p>
              )}

              <div className="flex gap-2">
                <Link
                  href={`/colleges/${collegeId}/departments/${dept.id}`}
                  className="flex-1 rounded-lg bg-blue-100 px-3 py-2 text-center text-sm font-medium text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
                >
                  View
                </Link>
                <Link
                  href={`/colleges/${collegeId}/departments/${dept.id}/edit`}
                  className="flex-1 rounded-lg bg-yellow-100 px-3 py-2 text-center text-sm font-medium text-yellow-700 transition-colors hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(dept.id)}
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
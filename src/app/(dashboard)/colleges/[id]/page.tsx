/* eslint-disable react-hooks/exhaustive-deps */
// src/app/colleges/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface College {
  id: number;
  code: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface Department {
  id: number;
  code: string;
  name: string;
  abbrv: string;
  description: string;
}

export default function ViewCollegePage() {
  const router = useRouter();
  const params = useParams();
  const collegeId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [college, setCollege] = useState<College | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    fetchCollege();
  }, [collegeId]);

  const fetchCollege = async () => {
    try {
      const response = await fetch(`/api/colleges/${collegeId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        alert(`Failed to fetch college: ${response.status}`);
        router.push('/colleges');
        return;
      }

      const data = await response.json();
      console.log('Fetched college data:', data);
      
      setCollege(data.college);
      setDepartments(data.departments || []);
    } catch (error) {
      console.error('Error fetching college:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      router.push('/colleges');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!college) {
    return (
      <div className="text-center">
        <p>College not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:pl-64">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {college.name}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {college.code}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/colleges"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            ← Back
          </Link>
          <Link
            href={`/colleges/edit/${college.id}`}
            className="rounded-lg bg-yellow-600 px-4 py-2 text-white transition-colors hover:bg-yellow-700"
          >
            ✏️ Edit
          </Link>
        </div>
      </div>

      {/* College Details */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          College Information
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              College Code
            </label>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
              {college.code}
            </p>
          </div>

          {college.description && (
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Description
              </label>
              <p className="mt-1 text-gray-900 dark:text-white">
                {college.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Created At
              </label>
              <p className="mt-1 text-gray-900 dark:text-white">
                {new Date(college.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Last Updated
              </label>
              <p className="mt-1 text-gray-900 dark:text-white">
                {new Date(college.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Departments Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Departments ({departments.length})
          </h2>
          <Link
            href={`/colleges/${college.id}/departments/create`}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
          >
            ➕ Add Department
          </Link>
        </div>

        {departments.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-6xl">🏢</div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              No departments in this college yet
            </p>
            <Link
              href={`/colleges/${college.id}/departments/create`}
              className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Create First Department
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {departments.map((dept) => (
              <Link
                key={dept.id}
                href={`/colleges/${college.id}/departments/${dept.id}`}
                className="rounded-lg border border-gray-200 bg-gray-50 p-4 transition hover:shadow-md dark:border-gray-600 dark:bg-gray-700"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {dept.code}
                  </span>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {dept.abbrv}
                  </span>
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {dept.name}
                </h3>
                {dept.description && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {dept.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
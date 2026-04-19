/* eslint-disable react-hooks/exhaustive-deps */
// src/app/colleges/[id]/departments/[deptId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Department {
  id: number;
  code: string;
  name: string;
  description: string;
  college_id: number;
  college_name: string;
  created_at: string;
  updated_at: string;
}

export default function ViewDepartmentPage() {
  const router = useRouter();
  const params = useParams();
  const collegeId = params.id as string;
  const deptId = params.deptId as string;

  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState<Department | null>(null);

  useEffect(() => {
    fetchDepartment();
  }, [deptId]);

  const fetchDepartment = async () => {
    try {
      const response = await fetch(`/api/departments/${deptId}`);
      if (response.ok) {
        const data = await response.json();
        setDepartment(data.department);
      } else {
        alert('Failed to fetch department');
        router.push(`/colleges/${collegeId}/departments`);
      }
    } catch (error) {
      console.error('Error fetching department:', error);
      alert('Failed to fetch department');
      router.push(`/colleges/${collegeId}/departments`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this department?')) {
      return;
    }

    try {
      const response = await fetch(`/api/departments/${deptId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Department deleted successfully');
        router.push(`/colleges/${collegeId}/departments`);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete department');
      }
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('Failed to delete department');
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!department) {
    return <div>Department not found</div>;
  }

  return (
    <div className="space-y-6 lg:pl-64">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {department.name}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {department.code}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/colleges/${collegeId}/departments`}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            ← Back
          </Link>
          <Link
            href={`/colleges/${collegeId}/departments/${deptId}/edit`}
            className="rounded-lg bg-yellow-600 px-4 py-2 text-white transition-colors hover:bg-yellow-700"
          >
            ✏️ Edit
          </Link>
          <button
            onClick={handleDelete}
            className="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
          >
            🗑️ Delete
          </button>
        </div>
      </div>

      {/* Department Details */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          Department Information
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Department Code
            </label>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
              {department.code}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              College
            </label>
            <Link
              href={`/colleges/${collegeId}`}
              className="mt-1 block text-lg font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              {department.college_name}
            </Link>
          </div>

          {department.description && (
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Description
              </label>
              <p className="mt-1 text-gray-900 dark:text-white">
                {department.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Created At
              </label>
              <p className="mt-1 text-gray-900 dark:text-white">
                {new Date(department.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Last Updated
              </label>
              <p className="mt-1 text-gray-900 dark:text-white">
                {new Date(department.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Related Information */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Courses */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            📚 Courses
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            View all courses under this department
          </p>
          <Link
            href={`/courses?department=${deptId}`}
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
          >
            View Courses
          </Link>
        </div>

        {/* Programmes */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            🎓 Programmes
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            View all programmes under this department
          </p>
          <Link
            href={`/programmes?department=${deptId}`}
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
          >
            View Programmes
          </Link>
        </div>
      </div>
    </div>
  );
}
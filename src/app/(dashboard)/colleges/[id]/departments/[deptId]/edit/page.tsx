/* eslint-disable react-hooks/exhaustive-deps */
// src/app/colleges/[id]/departments/[deptId]/edit/page.tsx
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
  college_name: string;
}

export default function EditDepartmentPage() {
  const router = useRouter();
  const params = useParams();
  const collegeId = params.id as string;
  const deptId = params.deptId as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [department, setDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchDepartment();
  }, [deptId]);

  const fetchDepartment = async () => {
    try {
      const response = await fetch(`/api/departments/${deptId}`);
      if (response.ok) {
        const data = await response.json();
        setDepartment(data.department);
        setFormData({
          code: data.department.code,
          name: data.department.name,
          description: data.department.description || '',
        });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`/api/departments/${deptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Department updated successfully');
        router.push(`/colleges/${collegeId}/departments/${deptId}`);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update department');
      }
    } catch (error) {
      console.error('Error updating department:', error);
      alert('Failed to update department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
            Edit Department
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Update department information
          </p>
        </div>
        <Link
          href={`/colleges/${collegeId}/departments/${deptId}`}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
        >
          ← Back
        </Link>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
            Department Information
          </h2>

          <div className="space-y-6">
            {/* College (Read-only) */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                College
              </label>
              <input
                type="text"
                value={department.college_name}
                disabled
                className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400"
              />
            </div>

            {/* Code */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Department Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link
            href={`/colleges/${collegeId}/departments/${deptId}`}
            className="rounded-lg border border-gray-300 bg-white px-6 py-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Updating...' : 'Update Department'}
          </button>
        </div>
      </form>
    </div>
  );
}
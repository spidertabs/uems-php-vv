/* eslint-disable react-hooks/exhaustive-deps */
// src/app/permissions/[id]/edit/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Permission {
  id: number;
  lecturer_id: number;
  lecturer_name: string;
  lecturer_email: string;
  course_id: number;
  course_code: string;
  course_title: string;
  department_name?: string;
  granted_by: number;
  granted_by_name: string;
  can_add_questions: boolean;
  can_create_papers: boolean;
  can_edit_questions: boolean;
  granted_at: string;
  expires_at: string | null;
  is_active: boolean;
  notes: string | null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditPermissionPage({ params }: PageProps) {
  const router = useRouter();
  const [permission, setPermission] = useState<Permission | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissionId, setPermissionId] = useState<string>('');

  const [formData, setFormData] = useState({
    can_add_questions: false,
    can_create_papers: false,
    can_edit_questions: false,
    is_active: true,
    expires_at: '',
    notes: '',
  });

  useEffect(() => {
    params.then((resolvedParams) => {
      setPermissionId(resolvedParams.id);
    });
  }, [params]);

  useEffect(() => {
    if (permissionId) {
      fetchPermission();
    }
  }, [permissionId]);

  const fetchPermission = async () => {
    try {
      const response = await fetch(`/api/permissions/${permissionId}`);
      if (response.ok) {
        const data = await response.json();
        setPermission(data.data);
        setFormData({
          can_add_questions: data.data.can_add_questions,
          can_create_papers: data.data.can_create_papers,
          can_edit_questions: data.data.can_edit_questions,
          is_active: data.data.is_active,
          expires_at: data.data.expires_at
            ? new Date(data.data.expires_at).toISOString().split('T')[0]
            : '',
          notes: data.data.notes || '',
        });
      } else if (response.status === 401) {
        router.push('/auth/login');
      } else if (response.status === 404) {
        alert('Permission not found');
        router.push('/permissions');
      }
    } catch (error) {
      console.error('Error fetching permission:', error);
      alert('Failed to load permission');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/permissions/${permissionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          expires_at: formData.expires_at || null,
        }),
      });

      if (response.ok) {
        alert('Permission updated successfully');
        router.push(`/permissions/${permissionId}`);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update permission');
      }
    } catch (error) {
      console.error('Error updating permission:', error);
      alert('Failed to update permission');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center lg:pl-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!permission) {
    return (
      <div className="space-y-6 lg:pl-64">
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="text-5xl">🔐</div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
            Permission Not Found
          </h2>
          <Link
            href="/permissions"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Back to Permissions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:pl-64">
      {/* Header */}
      <div>
        <Link
          href={`/permissions/${permissionId}`}
          className="mb-2 inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          ← Back to Permission Details
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Edit Permission
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Update permission settings for {permission.lecturer_name}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Permission Details (Read-only) */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              📋 Permission Details
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Lecturer
                </label>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {permission.lecturer_name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {permission.lecturer_email}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Course
                </label>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {permission.course_code}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {permission.course_title}
                </p>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              🔑 Access Permissions
            </h2>
            <div className="space-y-4">
              <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-4 cursor-pointer hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50">
                <input
                  type="checkbox"
                  checked={formData.can_add_questions}
                  onChange={(e) =>
                    setFormData({ ...formData, can_add_questions: e.target.checked })
                  }
                  className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">➕</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      Add Questions
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Allow lecturer to create new questions in the question bank
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-4 cursor-pointer hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50">
                <input
                  type="checkbox"
                  checked={formData.can_create_papers}
                  onChange={(e) =>
                    setFormData({ ...formData, can_create_papers: e.target.checked })
                  }
                  className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📄</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      Create Papers
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Allow lecturer to generate and submit exam papers
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-4 cursor-pointer hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50">
                <input
                  type="checkbox"
                  checked={formData.can_edit_questions}
                  onChange={(e) =>
                    setFormData({ ...formData, can_edit_questions: e.target.checked })
                  }
                  className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">✏️</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      Edit Questions
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Allow lecturer to modify existing questions
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Additional Settings */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              ⚙️ Additional Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 cursor-pointer hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formData.is_active ? '✓ Active' : '✗ Inactive'}
                  </span>
                </label>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Expiration Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) =>
                    setFormData({ ...formData, expires_at: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Leave empty for no expiration
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Add any additional notes or comments..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Info */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              ℹ️ Current Info
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-gray-600 dark:text-gray-400">Granted By</label>
                <p className="font-medium text-gray-900 dark:text-white">
                  {permission.granted_by_name}
                </p>
              </div>
              <div>
                <label className="text-gray-600 dark:text-gray-400">Granted On</label>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(permission.granted_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
            <div className="space-y-3">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
              <Link
                href={`/permissions/${permissionId}`}
                className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-center font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
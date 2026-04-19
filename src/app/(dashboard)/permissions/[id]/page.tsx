/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react-hooks/exhaustive-deps */
// src/app/permissions/[id]/page.tsx
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

export default function PermissionDetailPage({ params }: PageProps) {
  const router = useRouter();
  const [permission, setPermission] = useState<Permission | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionId, setPermissionId] = useState<string>('');

  useEffect(() => {
    // Unwrap params promise
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

  const toggleStatus = async () => {
    if (!permission) return;

    try {
      const response = await fetch(`/api/permissions/${permissionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !permission.is_active }),
      });

      if (response.ok) {
        fetchPermission();
      }
    } catch (error) {
      console.error('Error updating permission status:', error);
    }
  };

  const handleRevoke = async () => {
    if (!confirm('Are you sure you want to revoke this permission?')) return;

    try {
      const response = await fetch(`/api/permissions/${permissionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Permission revoked successfully');
        router.push('/permissions');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to revoke permission');
      }
    } catch (error) {
      console.error('Error revoking permission:', error);
      alert('Failed to revoke permission');
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
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            The permission you're looking for doesn't exist or has been removed.
          </p>
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

  const isExpired = permission.expires_at && new Date(permission.expires_at) < new Date();

  return (
    <div className="space-y-6 lg:pl-64">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/permissions"
            className="mb-2 inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            ← Back to Permissions
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Permission Details
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            View and manage permission details
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/permissions/${permissionId}/edit`}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            ✏️ Edit
          </Link>
          <button
            onClick={handleRevoke}
            className="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
          >
            🗑️ Revoke
          </button>
        </div>
      </div>

      {/* Status Banner */}
      {isExpired && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-200">
                This permission has expired
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300">
                Expired on {new Date(permission.expires_at!).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {!permission.is_active && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⏸️</span>
            <div>
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-200">
                This permission is inactive
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                The lecturer cannot access this course until the permission is activated.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lecturer Info */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              👤 Lecturer Information
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Name</label>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {permission.lecturer_name}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Email</label>
                <p className="text-gray-900 dark:text-white">{permission.lecturer_email}</p>
              </div>
            </div>
          </div>

          {/* Course Info */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              📚 Course Information
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Course Code</label>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {permission.course_code}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Course Title</label>
                <p className="text-gray-900 dark:text-white">{permission.course_title}</p>
              </div>
              {permission.department_name && (
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Department</label>
                  <p className="text-gray-900 dark:text-white">{permission.department_name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Permissions Granted */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              🔑 Permissions Granted
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">➕</span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Add Questions</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Create new questions in the question bank
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    permission.can_add_questions
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {permission.can_add_questions ? 'Granted' : 'Denied'}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📄</span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Create Papers</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Generate and submit exam papers
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    permission.can_create_papers
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {permission.can_create_papers ? 'Granted' : 'Denied'}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✏️</span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Edit Questions</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Modify existing questions
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    permission.can_edit_questions
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {permission.can_edit_questions ? 'Granted' : 'Denied'}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {permission.notes && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                📝 Notes
              </h2>
              <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                {permission.notes}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              📊 Status
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Current Status</label>
                <button
                  onClick={toggleStatus}
                  className={`mt-1 w-full rounded-lg px-4 py-2 font-medium transition-colors ${
                    permission.is_active
                      ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {permission.is_active ? '✓ Active' : '✗ Inactive'}
                </button>
              </div>

              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Granted By</label>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {permission.granted_by_name}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Granted On</label>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {new Date(permission.granted_at).toLocaleDateString()}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Expires On</label>
                <p
                  className={`mt-1 font-medium ${
                    isExpired
                      ? 'text-red-600 dark:text-red-400'
                      : permission.expires_at
                      ? 'text-gray-900 dark:text-white'
                      : 'text-green-600 dark:text-green-400'
                  }`}
                >
                  {permission.expires_at
                    ? new Date(permission.expires_at).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              ⚡ Quick Actions
            </h2>
            <div className="space-y-2">
              <Link
                href={`/permissions/${permissionId}/edit`}
                className="block w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-center text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
              >
                ✏️ Edit Permission
              </Link>
              <button
                onClick={toggleStatus}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-700/50 dark:text-gray-300"
              >
                {permission.is_active ? '⏸️ Deactivate' : '▶️ Activate'}
              </button>
              <button
                onClick={handleRevoke}
                className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
              >
                🗑️ Revoke Permission
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
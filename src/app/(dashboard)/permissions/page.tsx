/* eslint-disable react-hooks/exhaustive-deps */
// src/app/(dashboard)/permissions/page.tsx
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

export default function PermissionsPage() {
  const router = useRouter();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [filteredPermissions, setFilteredPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCourse, setFilterCourse] = useState('all');

  useEffect(() => {
    fetchPermissions();
  }, []);

  useEffect(() => {
    filterPermissions();
  }, [searchTerm, filterStatus, filterCourse, permissions]);

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/permissions');
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.data || data.permissions || []);
      } else if (response.status === 401) {
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPermissions = () => {
    let filtered = [...permissions];

    if (searchTerm) {
      filtered = filtered.filter(
        (perm) =>
          perm.lecturer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          perm.course_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          perm.course_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((perm) =>
        filterStatus === 'active' ? perm.is_active : !perm.is_active
      );
    }

    if (filterCourse !== 'all') {
      filtered = filtered.filter(
        (perm) => perm.course_id.toString() === filterCourse
      );
    }

    setFilteredPermissions(filtered);
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/permissions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        fetchPermissions();
      }
    } catch (error) {
      console.error('Error updating permission status:', error);
    }
  };

  const handleRevoke = async (id: number) => {
    if (!confirm('Are you sure you want to revoke this permission?')) return;

    try {
      const response = await fetch(`/api/permissions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Permission revoked successfully');
        fetchPermissions();
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
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const uniqueCourses = Array.from(
    new Set(permissions.map((p) => p.course_id))
  );

  return (
    <div className="space-y-6 lg:pl-64">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🔐 Lecturer Permissions
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage lecturer access to courses and question banks
          </p>
        </div>
        <Link
          href="/permissions/grant"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        >
          ➕ Grant Permission
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Lecturer or course..."
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Course
            </label>
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Courses</option>
              {uniqueCourses.map((courseId) => {
                const perm = permissions.find((p) => p.course_id === courseId);
                return (
                  <option key={courseId} value={courseId.toString()}>
                    {perm?.course_code} - {perm?.course_title}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-blue-600">
            {permissions.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Permissions
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-green-600">
            {permissions.filter((p) => p.is_active).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-orange-600">
            {
              permissions.filter(
                (p) => p.expires_at && new Date(p.expires_at) < new Date()
              ).length
            }
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Expired</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-purple-600">
            {filteredPermissions.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Filtered
          </div>
        </div>
      </div>

      {/* Permissions Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Lecturer
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Course
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Permissions
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Granted By
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Expires
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPermissions.length > 0 ? (
                filteredPermissions.map((perm) => (
                  <tr
                    key={perm.id}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {perm.lecturer_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {perm.lecturer_email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {perm.course_code}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {perm.course_title}
                      </div>
                      {perm.department_name && (
                        <div className="text-xs text-gray-500">
                          {perm.department_name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {perm.can_add_questions && (
                          <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800 dark:bg-green-900 dark:text-green-200">
                            ➕ Add
                          </span>
                        )}
                        {perm.can_create_papers && (
                          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            📄 Create
                          </span>
                        )}
                        {perm.can_edit_questions && (
                          <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            ✏️ Edit
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {perm.granted_by_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {perm.expires_at ? (
                        <span
                          className={
                            new Date(perm.expires_at) < new Date()
                              ? 'text-red-600'
                              : ''
                          }
                        >
                          {new Date(perm.expires_at).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-green-600">Never</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleStatus(perm.id, perm.is_active)}
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          perm.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {perm.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/permissions/${perm.id}`}
                          className="rounded-lg bg-blue-100 px-3 py-1 text-sm text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
                        >
                          View
                        </Link>
                        <Link
                          href={`/permissions/${perm.id}/edit`}
                          className="rounded-lg bg-yellow-100 px-3 py-1 text-sm text-yellow-700 transition-colors hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleRevoke(perm.id)}
                          className="rounded-lg bg-red-100 px-3 py-1 text-sm text-red-700 transition-colors hover:bg-red-200 dark:bg-red-900 dark:text-red-200"
                        >
                          Revoke
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-5xl">🔐</div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">
                      No permissions found
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
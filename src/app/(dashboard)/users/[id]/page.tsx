// src/app/users/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department_id: number | null;
  department_name?: string;
  college_id: number | null;
  college_name?: string;
  phone: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

interface UserStats {
  papers_created: number;
  questions_created: number;
  papers_approved?: number;
  permissions_granted?: number;
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchUser();
      fetchUserStats();
    }
  }, [userId]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUser(data.data || data.user);
      } else if (response.status === 404) {
        alert('User not found');
        router.push('/users');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.data || data.stats);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('User deleted successfully');
        router.push('/users');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const toggleStatus = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !user.is_active }),
      });

      if (response.ok) {
        fetchUser();
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="text-5xl">❌</div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">User not found</p>
        </div>
      </div>
    );
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    exam_master: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    dean: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    hod: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    lecturer: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  };

  return (
    <div className="space-y-6 lg:pl-64">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            👤 {user.first_name} {user.last_name}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{user.email}</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/users"
            className="rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
          >
            ← Back
          </Link>
          <Link
            href={`/users/${userId}/edit`}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
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

      {/* User Info Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Personal Information
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Full Name
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {user.first_name} {user.last_name}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Email
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {user.email}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Phone
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {user.phone || 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Role
                </dt>
                <dd className="mt-1">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      roleColors[user.role]
                    }`}
                  >
                    {user.role.replace('_', ' ').toUpperCase()}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Organization
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  College
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {user.college_name || 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Department
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {user.department_name || 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Status
                </dt>
                <dd className="mt-1">
                  <button
                    onClick={toggleStatus}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      user.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {user.is_active ? 'Active' : 'Inactive'}
                  </button>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Last Login
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {user.last_login
                    ? new Date(user.last_login).toLocaleString()
                    : 'Never'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
            <div className="text-2xl font-bold text-blue-600">
              {stats.papers_created}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Papers Created
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
            <div className="text-2xl font-bold text-green-600">
              {stats.questions_created}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Questions Created
            </div>
          </div>
          {stats.papers_approved !== undefined && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
              <div className="text-2xl font-bold text-purple-600">
                {stats.papers_approved}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Papers Approved
              </div>
            </div>
          )}
          {stats.permissions_granted !== undefined && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
              <div className="text-2xl font-bold text-orange-600">
                {stats.permissions_granted}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Permissions Granted
              </div>
            </div>
          )}
        </div>
      )}

      {/* Account Details */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Account Details
        </h3>
        <dl className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Account Created
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {new Date(user.created_at).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Last Updated
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {new Date(user.updated_at).toLocaleString()}
              </dd>
            </div>
          </div>
        </dl>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {user.role === 'lecturer' && (
            <Link
              href={`/exam-papers?lecturer=${userId}`}
              className="rounded-lg border border-gray-300 p-4 text-center transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <div className="text-2xl">📄</div>
              <div className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                View Papers
              </div>
            </Link>
          )}
          <Link
            href={`/question-bank?created_by=${userId}`}
            className="rounded-lg border border-gray-300 p-4 text-center transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <div className="text-2xl">📝</div>
            <div className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              View Questions
            </div>
          </Link>
          {['hod', 'admin'].includes(user.role) && (
            <Link
              href={`/permissions?user=${userId}`}
              className="rounded-lg border border-gray-300 p-4 text-center transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <div className="text-2xl">🔐</div>
              <div className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Manage Permissions
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
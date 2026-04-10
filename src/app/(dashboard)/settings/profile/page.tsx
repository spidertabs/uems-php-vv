/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
// src/app/(dashboard)/settings/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: string;
  department_id?: number;
  college_id?: number;
  created_at: string;
}

interface Department {
  id: number;
  name: string;
  code: string;
}

interface College {
  id: number;
  name: string;
  code: string;
}

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userRes, deptsRes, collegesRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/departments').catch(() => null),
        fetch('/api/colleges').catch(() => null),
      ]);

      if (userRes.status === 401) {
        router.push('/auth/login');
        return;
      }

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
        setFormData({
          first_name: userData.user.first_name || '',
          last_name: userData.user.last_name || '',
          email: userData.user.email || '',
          phone: userData.user.phone || '',
        });
      }

      if (deptsRes && deptsRes.ok) {
        const deptsData = await deptsRes.json();
        setDepartments(deptsData.departments || []);
      }

      if (collegesRes && collegesRes.ok) {
        const collegesData = await collegesRes.json();
        setColleges(collegesData.colleges || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/users/${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        fetchData(); // Refresh user data
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while updating profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const getDepartmentName = (id?: number) => {
    if (!id) return 'Not assigned';
    const dept = departments.find((d) => d.id === id);
    return dept ? `${dept.code} - ${dept.name}` : 'Unknown';
  };

  const getCollegeName = (id?: number) => {
    if (!id) return 'Not assigned';
    const college = colleges.find((c) => c.id === id);
    return college ? `${college.code} - ${college.name}` : 'Unknown';
  };

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
      <div>
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            ⚙️ Settings
          </Link>
          <span className="text-gray-400">/</span>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            📝 Profile Settings
          </h1>
        </div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Update your personal information and profile details
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`rounded-lg p-4 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Personal Information
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+256 700 000 000"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Organization Information (Read-only) */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Organization Information
              </h3>
              <div className="space-y-4">
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900/50">
                  <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">Role</p>
                  <p className="font-semibold capitalize text-gray-900 dark:text-white">
                    {user?.role.replace('_', ' ')}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900/50">
                  <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">Department</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {getDepartmentName(user?.department_id)}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900/50">
                  <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">College</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {getCollegeName(user?.college_id)}
                  </p>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-500">
                  💡 Contact your system administrator to change your role, department, or college
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <Link
                href="/settings"
                className="rounded-lg border border-gray-300 bg-white px-6 py-2 font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Stats */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Account Stats
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">User ID</span>
                <span className="font-semibold text-gray-900 dark:text-white">#{user?.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Member Since</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {new Date(user?.created_at || '').toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Account Type</span>
                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Profile Picture (Future Feature) */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Profile Picture
            </h3>
            <div className="flex flex-col items-center">
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl font-bold text-white">
                {user?.first_name?.[0]}
                {user?.last_name?.[0]}
              </div>
              <button
                type="button"
                disabled
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-500 dark:bg-gray-700"
              >
                Upload Photo (Coming Soon)
              </button>
            </div>
          </div>

          {/* Help */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900/20 dark:bg-blue-900/10">
            <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-400">
              Need Help?
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-500">
              If you need to update your role or department assignment, please contact your system administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
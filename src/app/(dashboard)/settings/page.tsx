/* eslint-disable react-hooks/exhaustive-deps */
// src/app/(dashboard)/settings/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: number;
  role: string;
  first_name: string;
  last_name: string;
  email: string;
  department_id?: number;
  college_id?: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');

      if (response.status === 401) {
        router.push('/auth/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  const settingsCategories = [
    {
      title: 'Personal Settings',
      description: 'Manage your account and personal preferences',
      icon: '👤',
      color: 'bg-blue-500',
      items: [
        {
          title: 'Profile',
          description: 'Update your personal information and profile picture',
          icon: '📝',
          href: '/settings/profile',
          roles: ['all'],
        },
        {
          title: 'Preferences',
          description: 'Customize your dashboard and notification settings',
          icon: '⚙️',
          href: '/settings/preferences',
          roles: ['all'],
        },
        {
          title: 'Security',
          description: 'Change password and manage security settings',
          icon: '🔒',
          href: '/settings/security',
          roles: ['all'],
        },
      ],
    },
    {
      title: 'System Settings',
      description: 'Configure system-wide settings and preferences',
      icon: '🖥️',
      color: 'bg-purple-500',
      items: [
        {
          title: 'System Configuration',
          description: 'Manage system settings, email, and integrations',
          icon: '🔧',
          href: '/settings/system',
          roles: ['admin'],
        },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 lg:pl-64">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          ⚙️ Settings
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Settings Categories */}
      {settingsCategories.map((category) => {
        const visibleItems = category.items.filter(
          (item) => item.roles.includes('all') || (isAdmin && item.roles.includes('admin'))
        );

        if (visibleItems.length === 0) return null;

        return (
          <div key={category.title}>
            <div className="mb-4 flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${category.color} text-2xl text-white shadow-lg`}>
                {category.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {category.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {category.description}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visibleItems.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group rounded-xl border border-gray-200 bg-white p-6 shadow-md transition-all hover:border-blue-500 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-2xl transition-transform group-hover:scale-110 dark:bg-gray-700">
                      {item.icon}
                    </div>
                    <span className="text-gray-400 transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        );
      })}

      {/* Quick Stats */}
      <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Account Information
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">Full Name</p>
            <p className="mt-1 font-semibold text-gray-900 dark:text-white">
              {user?.first_name} {user?.last_name}
            </p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
            <p className="mt-1 font-semibold text-gray-900 dark:text-white">
              {user?.email}
            </p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">Role</p>
            <p className="mt-1 font-semibold capitalize text-gray-900 dark:text-white">
              {user?.role.replace('_', ' ')}
            </p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">User ID</p>
            <p className="mt-1 font-semibold text-gray-900 dark:text-white">
              #{user?.id}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
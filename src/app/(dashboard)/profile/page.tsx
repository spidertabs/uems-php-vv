/* eslint-disable react-hooks/exhaustive-deps */
// src/app/(dashboard)/profile/page.tsx
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
  last_login?: string;
  is_active: boolean;
}

interface Department {
  id: number;
  name: string;
  code: string;
  college_name?: string;
}

interface College {
  id: number;
  name: string;
  code: string;
}

interface Stats {
  total_papers: number;
  total_questions: number;
  papers_approved: number;
  papers_pending: number;
  questions_used: number;
  active_courses: number;
}

interface RecentActivity {
  id: number;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [college, setCollege] = useState<College | null>(null);
  const [stats, setStats] = useState<Stats>({
    total_papers: 0,
    total_questions: 0,
    papers_approved: 0,
    papers_pending: 0,
    questions_used: 0,
    active_courses: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'statistics'>('overview');

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const [userRes, statsRes, activityRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/stats').catch(() => null),
        fetch('/api/stats/recent-activity?limit=10').catch(() => null),
      ]);

      if (userRes.status === 401) {
        router.push('/auth/login');
        return;
      }

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);

        // Fetch department and college details
        if (userData.user.department_id) {
          const deptRes = await fetch(`/api/departments/${userData.user.department_id}`);
          if (deptRes.ok) {
            const deptData = await deptRes.json();
            setDepartment(deptData.department);
          }
        }

        if (userData.user.college_id) {
          const collegeRes = await fetch(`/api/colleges/${userData.user.college_id}`);
          if (collegeRes.ok) {
            const collegeData = await collegeRes.json();
            setCollege(collegeData.college);
          }
        }
      }

      if (statsRes && statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data || statsData);
      }

      if (activityRes && activityRes.ok) {
        const activityData = await activityRes.json();
        setRecentActivity(activityData.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      exam_master: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400',
      dean: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      hod: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
      lecturer: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleIcon = (role: string) => {
    const icons: Record<string, string> = {
      admin: '👑',
      exam_master: '🖨️',
      dean: '🎓',
      hod: '📚',
      lecturer: '👨‍🏫',
    };
    return icons[role] || '👤';
  };

  const getInitials = () => {
    if (!user) return '?';
    return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
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
      {/* Header with Profile Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 shadow-xl">
        <div className="absolute right-0 top-0 h-64 w-64 translate-x-32 -translate-y-32 transform rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-32 translate-y-32 transform rounded-full bg-white/10 blur-3xl"></div>
        
        <div className="relative flex flex-col items-center gap-6 sm:flex-row">
          {/* Profile Picture */}
          <div className="relative">
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white text-5xl font-bold text-blue-600 shadow-2xl ring-4 ring-white/20">
              {getInitials()}
            </div>
            <div className={`absolute bottom-2 right-2 h-6 w-6 rounded-full border-4 border-white ${user?.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="mb-2 text-3xl font-bold text-white">
              {user?.first_name} {user?.last_name}
            </h1>
            <p className="mb-3 text-lg text-blue-100">{user?.email}</p>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${getRoleBadgeColor(user?.role || '')}`}>
                <span>{getRoleIcon(user?.role || '')}</span>
                {user?.role.replace('_', ' ').toUpperCase()}
              </span>
              {user?.is_active && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  ✓ Active
                </span>
              )}
              {department && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold text-white">
                  📚 {department.code}
                </span>
              )}
            </div>
          </div>

          {/* Edit Button */}
          <div>
            <Link
              href="/settings/profile"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-medium text-blue-600 shadow-lg transition hover:bg-blue-50"
            >
              <span>✏️</span>
              Edit Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-2 text-2xl">📄</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.total_papers}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Total Papers</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-2 text-2xl">❓</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.total_questions}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Questions</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-2 text-2xl">✅</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.papers_approved}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Approved</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-2 text-2xl">⏳</div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {stats.papers_pending}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Pending</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-2 text-2xl">📊</div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats.questions_used}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Q Used</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-2 text-2xl">📚</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.active_courses}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Courses</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('overview')}
          className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-400'
          }`}
        >
          📋 Overview
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition ${
            activeTab === 'activity'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-400'
          }`}
        >
          🔔 Recent Activity
        </button>
        <button
          onClick={() => setActiveTab('statistics')}
          className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition ${
            activeTab === 'statistics'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-400'
          }`}
        >
          📊 Statistics
        </button>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">First Name</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{user?.first_name}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">Last Name</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{user?.last_name}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">Email</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{user?.email}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">Phone</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {user?.phone || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Organization Information */}
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

                  {department && (
                    <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900/50">
                      <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">Department</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {department.code} - {department.name}
                      </p>
                    </div>
                  )}

                  {college && (
                    <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900/50">
                      <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">College</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {college.code} - {college.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Links */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                  Quick Links
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/exam-papers"
                    className="rounded-lg border border-gray-200 p-4 text-center transition hover:border-blue-500 hover:bg-blue-50 dark:border-gray-700 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
                  >
                    <div className="mb-2 text-2xl">📄</div>
                    <div className="text-sm font-medium">My Papers</div>
                  </Link>
                  <Link
                    href="/question-bank"
                    className="rounded-lg border border-gray-200 p-4 text-center transition hover:border-blue-500 hover:bg-blue-50 dark:border-gray-700 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
                  >
                    <div className="mb-2 text-2xl">❓</div>
                    <div className="text-sm font-medium">Questions</div>
                  </Link>
                  <Link
                    href="/settings"
                    className="rounded-lg border border-gray-200 p-4 text-center transition hover:border-blue-500 hover:bg-blue-50 dark:border-gray-700 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
                  >
                    <div className="mb-2 text-2xl">⚙️</div>
                    <div className="text-sm font-medium">Settings</div>
                  </Link>
                  <Link
                    href="/notifications/inbox"
                    className="rounded-lg border border-gray-200 p-4 text-center transition hover:border-blue-500 hover:bg-blue-50 dark:border-gray-700 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
                  >
                    <div className="mb-2 text-2xl">📬</div>
                    <div className="text-sm font-medium">Notifications</div>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800">
              <div className="border-b border-gray-200 p-6 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Activity
                </h3>
              </div>
              {recentActivity.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="p-4 transition hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{activity.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {activity.title}
                          </h4>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {activity.description}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {getRelativeTime(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="mb-3 text-5xl">📭</div>
                  <p className="text-gray-600 dark:text-gray-400">No recent activity</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'statistics' && (
            <div className="space-y-6">
              {/* Performance Overview */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                  Performance Overview
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Papers Approval Rate</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {stats.total_papers > 0
                          ? Math.round((stats.papers_approved / stats.total_papers) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-full bg-green-500"
                        style={{
                          width: `${
                            stats.total_papers > 0
                              ? (stats.papers_approved / stats.total_papers) * 100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Question Usage Rate</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {stats.total_questions > 0
                          ? Math.round((stats.questions_used / stats.total_questions) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-full bg-purple-500"
                        style={{
                          width: `${
                            stats.total_questions > 0
                              ? (stats.questions_used / stats.total_questions) * 100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contribution Stats */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                  Contribution Statistics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="mb-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {stats.total_papers}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Papers Created</div>
                  </div>
                  <div className="text-center">
                    <div className="mb-2 text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {stats.total_questions}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Questions Added</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Status */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Account Status
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${user?.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-800'}`}>
                  {user?.is_active ? '✓ Active' : '○ Inactive'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">User ID</span>
                <span className="font-medium">#{user?.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Member Since</span>
                <span className="font-medium">
                  {user?.created_at ? formatDate(user.created_at) : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Last Login</span>
                <span className="font-medium">
                  {user?.last_login ? getRelativeTime(user.last_login) : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link
                href="/settings/profile"
                className="block rounded-lg bg-blue-50 px-4 py-3 text-center text-sm font-medium text-blue-700 transition hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
              >
                ✏️ Edit Profile
              </Link>
              <Link
                href="/settings/security"
                className="block rounded-lg bg-gray-50 px-4 py-3 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                🔒 Change Password
              </Link>
              <Link
                href="/settings/preferences"
                className="block rounded-lg bg-gray-50 px-4 py-3 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                ⚙️ Preferences
              </Link>
            </div>
          </div>

          {/* Help */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900/20 dark:bg-blue-900/10">
            <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-400">
              💡 Profile Tip
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-500">
              Keep your profile information up to date to ensure smooth communication and proper access to system features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
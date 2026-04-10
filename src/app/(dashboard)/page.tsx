/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/(dashboard)/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  myPapers: number;
  myQuestions: number;
  notifications: number;
  pendingApprovals?: number;
  papersToReview?: number;
  printQueue?: number;
  activeCourses?: number;
  totalUsers?: number;
  departmentCourses?: number;
  collegePapers?: number;
}

interface User {
  id: number;
  role: string;
  name: string;
  email: string;
  department_id?: number;
  college_id?: number;
}

interface RecentActivity {
  id: number;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  link?: string;
}

interface GroupedActivity {
  paperCode?: string;
  paperId?: number;
  activities: RecentActivity[];
  latestTimestamp: string;
  isExpanded: boolean;
}

interface PendingPaper {
  id: number;
  paper_code: string;
  course_code: string;
  course_title: string;
  exam_type: string;
  status: string;
  total_marks: number;
  created_by_name: string;
  submitted_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    myPapers: 0,
    myQuestions: 0,
    notifications: 0,
  });
  const [user, setUser] = useState<User | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [groupedActivities, setGroupedActivities] = useState<GroupedActivity[]>([]);
  const [pendingPapers, setPendingPapers] = useState<PendingPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (recentActivity.length > 0) {
      groupActivitiesByPaper();
    }
  }, [recentActivity]);

  const fetchDashboardData = async () => {
    try {
      const [userRes, statsRes, activityRes, pendingRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/stats'),
        fetch('/api/stats/recent-activity'),
        fetch('/api/approvals/pending').catch(() => null),
      ]);

      if (userRes.status === 401) {
        router.push('/auth/login');
        return;
      }

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data || statsData);
      }

      if (activityRes && activityRes.ok) {
        const activityData = await activityRes.json();
        setRecentActivity(activityData.data || []);
      }

      if (pendingRes && pendingRes.ok) {
        const pendingData = await pendingRes.json();
        setPendingPapers(pendingData.papers || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
      setActivityLoading(false);
    }
  };

  const groupActivitiesByPaper = () => {
    const grouped: Record<string, RecentActivity[]> = {};
    const standalone: RecentActivity[] = [];

    recentActivity.forEach((activity) => {
      // Extract paper code from title (assumes format like "Paper created: CS101-2024-T1")
      const paperCodeMatch = activity.title.match(/[A-Z]{2,}\d{3}[-_][^\s]+/i) || 
                             activity.title.match(/([A-Z]{2,}\d{3})/);
      const paperCode = paperCodeMatch ? paperCodeMatch[0] : null;

      // Extract paper ID from link if available
      const paperIdMatch = activity.link?.match(/\/exam-papers\/(\d+)/);
      const paperId = paperIdMatch ? parseInt(paperIdMatch[1]) : null;

      if (paperCode && paperId) {
        const key = `${paperCode}-${paperId}`;
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(activity);
      } else {
        standalone.push(activity);
      }
    });

    // Convert to array and create grouped structure
    const groupedArray: GroupedActivity[] = Object.entries(grouped).map(([key, activities]) => {
      const [paperCode] = key.split('-');
      const paperId = parseInt(key.split('-').pop() || '0');
      return {
        paperCode,
        paperId,
        activities: activities.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ),
        latestTimestamp: activities[0].timestamp,
        isExpanded: activities.length <= 2, // Auto-expand if 2 or fewer activities
      };
    });

    // Add standalone activities as single-item groups
    standalone.forEach((activity) => {
      groupedArray.push({
        activities: [activity],
        latestTimestamp: activity.timestamp,
        isExpanded: true,
      });
    });

    // Sort by latest timestamp
    groupedArray.sort((a, b) => 
      new Date(b.latestTimestamp).getTime() - new Date(a.latestTimestamp).getTime()
    );

    setGroupedActivities(groupedArray);
  };

  const toggleGroup = (index: number) => {
    setGroupedActivities(prev => 
      prev.map((group, i) => 
        i === index ? { ...group, isExpanded: !group.isExpanded } : group
      )
    );
  };

  const getRoleSpecificCards = () => {
    const role = user?.role;

    const cardsByRole: Record<string, any[]> = {
      admin: [
        {
          title: 'Total Users',
          value: stats.totalUsers || 0,
          icon: '👥',
          href: '/users',
          color: 'bg-indigo-500',
        },
        {
          title: 'All Papers',
          value: stats.myPapers,
          icon: '📄',
          href: '/exam-papers',
          color: 'bg-blue-500',
        },
        {
          title: 'Pending Approvals',
          value: stats.pendingApprovals || 0,
          icon: '⏳',
          href: '/approvals',
          color: 'bg-orange-500',
        },
        {
          title: 'Notifications',
          value: stats.notifications,
          icon: '📬',
          href: '/notifications/inbox',
          color: 'bg-purple-500',
        },
      ],
      exam_master: [
        {
          title: 'Print Queue',
          value: stats.printQueue || 0,
          icon: '🖨️',
          href: '/print-queue',
          color: 'bg-cyan-500',
        },
        {
          title: 'Approved Papers',
          value: stats.myPapers,
          icon: '✅',
          href: '/exam-papers',
          color: 'bg-green-500',
        },
        {
          title: 'Published Papers',
          value: stats.collegePapers || 0,
          icon: '📊',
          href: '/reports',
          color: 'bg-blue-500',
        },
        {
          title: 'Notifications',
          value: stats.notifications,
          icon: '📬',
          href: '/notifications/inbox',
          color: 'bg-purple-500',
        },
      ],
      dean: [
        {
          title: 'College Papers',
          value: stats.collegePapers || 0,
          icon: '📑',
          href: '/exam-papers',
          color: 'bg-blue-500',
        },
        {
          title: 'Pending Approvals',
          value: stats.pendingApprovals || 0,
          icon: '⏳',
          href: '/approvals',
          color: 'bg-orange-500',
        },
        {
          title: 'Active Courses',
          value: stats.activeCourses || 0,
          icon: '📚',
          href: '/courses',
          color: 'bg-green-500',
        },
        {
          title: 'Notifications',
          value: stats.notifications,
          icon: '📬',
          href: '/notifications/inbox',
          color: 'bg-purple-500',
        },
      ],
      hod: [
        {
          title: 'Pending Approvals',
          value: stats.pendingApprovals || 0,
          icon: '✅',
          href: '/approvals',
          color: 'bg-orange-500',
        },
        {
          title: 'Department Papers',
          value: stats.myPapers,
          icon: '📄',
          href: '/exam-papers',
          color: 'bg-blue-500',
        },
        {
          title: 'Department Courses',
          value: stats.departmentCourses || 0,
          icon: '📚',
          href: '/courses',
          color: 'bg-green-500',
        },
        {
          title: 'Question Bank',
          value: stats.myQuestions,
          icon: '📝',
          href: '/question-bank',
          color: 'bg-teal-500',
        },
      ],
      lecturer: [
        {
          title: 'My Papers',
          value: stats.myPapers,
          icon: '📄',
          href: '/exam-papers',
          color: 'bg-blue-500',
        },
        {
          title: 'My Questions',
          value: stats.myQuestions,
          icon: '📝',
          href: '/question-bank',
          color: 'bg-green-500',
        },
        {
          title: 'Papers to Review',
          value: stats.papersToReview || 0,
          icon: '👁️',
          href: '/notifications/feedback',
          color: 'bg-orange-500',
        },
        {
          title: 'Notifications',
          value: stats.notifications,
          icon: '📬',
          href: '/notifications/inbox',
          color: 'bg-purple-500',
        },
      ],
    };

    return cardsByRole[role || 'lecturer'] || cardsByRole.lecturer;
  };

  const getQuickActions = () => {
    const role = user?.role;

    const actionsByRole: Record<string, any[]> = {
      admin: [
        {
          title: 'Manage Users',
          description: 'Add or edit system users',
          icon: '👥',
          href: '/users',
          color: 'text-indigo-600 dark:text-indigo-400',
        },
        {
          title: 'Manage Colleges',
          description: 'Organize colleges and departments',
          icon: '🏛️',
          href: '/colleges',
          color: 'text-blue-600 dark:text-blue-400',
        },
        {
          title: 'View Reports',
          description: 'System-wide analytics',
          icon: '📊',
          href: '/reports',
          color: 'text-green-600 dark:text-green-400',
        },
        {
          title: 'Audit Logs',
          description: 'View system activity',
          icon: '📋',
          href: '/audit',
          color: 'text-purple-600 dark:text-purple-400',
        },
      ],
      exam_master: [
        {
          title: 'Print Queue',
          description: 'Manage papers ready for printing',
          icon: '🖨️',
          href: '/print-queue',
          color: 'text-cyan-600 dark:text-cyan-400',
        },
        {
          title: 'View All Papers',
          description: 'Browse approved exam papers',
          icon: '📄',
          href: '/exam-papers',
          color: 'text-blue-600 dark:text-blue-400',
        },
        {
          title: 'Print History',
          description: 'View printing records',
          icon: '📜',
          href: '/print-queue/history',
          color: 'text-gray-600 dark:text-gray-400',
        },
        {
          title: 'Reports',
          description: 'View exam statistics',
          icon: '📊',
          href: '/reports',
          color: 'text-green-600 dark:text-green-400',
        },
      ],
      dean: [
        {
          title: 'Review Papers',
          description: 'Approve submitted papers',
          icon: '✅',
          href: '/approvals',
          color: 'text-orange-600 dark:text-orange-400',
        },
        {
          title: 'View College Papers',
          description: 'All papers in your college',
          icon: '📑',
          href: '/exam-papers',
          color: 'text-blue-600 dark:text-blue-400',
        },
        {
          title: 'College Reports',
          description: 'Performance analytics',
          icon: '📊',
          href: '/reports',
          color: 'text-green-600 dark:text-green-400',
        },
        {
          title: 'View Courses',
          description: 'Manage college courses',
          icon: '📚',
          href: '/courses',
          color: 'text-teal-600 dark:text-teal-400',
        },
      ],
      hod: [
        {
          title: 'Review Papers',
          description: 'Approve submitted exam papers',
          icon: '✅',
          href: '/approvals',
          color: 'text-orange-600 dark:text-orange-400',
        },
        {
          title: 'Manage Courses',
          description: 'Edit department courses',
          icon: '📚',
          href: '/courses',
          color: 'text-blue-600 dark:text-blue-400',
        },
        {
          title: 'Grant Permissions',
          description: 'Manage lecturer permissions',
          icon: '🔐',
          href: '/permissions',
          color: 'text-purple-600 dark:text-purple-400',
        },
        {
          title: 'Add Questions',
          description: 'Build question bank',
          icon: '📝',
          href: '/question-bank/create',
          color: 'text-green-600 dark:text-green-400',
        },
      ],
      lecturer: [
        {
          title: 'Create New Paper',
          description: 'Start creating a new exam paper',
          icon: '➕',
          href: '/exam-papers/create',
          color: 'text-blue-600 dark:text-blue-400',
        },
        {
          title: 'Add Questions',
          description: 'Add questions to question bank',
          icon: '📝',
          href: '/question-bank/create',
          color: 'text-green-600 dark:text-green-400',
        },
        {
          title: 'View Feedback',
          description: 'Check returned papers',
          icon: '💬',
          href: '/notifications/feedback',
          color: 'text-orange-600 dark:text-orange-400',
        },
        {
          title: 'View Inbox',
          description: 'Check pending tasks',
          icon: '📥',
          href: '/notifications/inbox',
          color: 'text-purple-600 dark:text-purple-400',
        },
      ],
    };

    return actionsByRole[role || 'lecturer'] || actionsByRole.lecturer;
  };

  const getRoleWelcomeMessage = () => {
    const messages: Record<string, string> = {
      admin: "You have full system access. Monitor users, papers, and system health.",
      exam_master: "Manage the print queue and ensure exams are ready for distribution.",
      dean: "Oversee college operations and approve papers from your departments.",
      hod: "Manage your department's courses, approve papers, and grant permissions.",
      lecturer: "Create exam papers and add questions to the question bank.",
    };

    return messages[user?.role || 'lecturer'] || messages.lecturer;
  };

  const showPendingApprovals = () => {
    return ['hod', 'dean', 'admin'].includes(user?.role || '');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      hod_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      hod_approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      dean_review: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getExamTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      TEST: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      CAT: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      FINAL: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  const getActivityBorderColor = (type: string) => {
    const colors: Record<string, string> = {
      created: 'border-l-blue-500',
      submitted: 'border-l-yellow-500',
      paper_submitted: 'border-l-yellow-500',
      hod_approved: 'border-l-green-500',
      hod_rejected: 'border-l-red-500',
      dean_approved: 'border-l-emerald-500',
      dean_rejected: 'border-l-red-500',
      ready_for_print: 'border-l-cyan-500',
      printing_started: 'border-l-indigo-500',
      printed: 'border-l-teal-500',
      published: 'border-l-violet-500',
      comment_added: 'border-l-purple-500',
      user_registered: 'border-l-pink-500',
      permission_granted: 'border-l-amber-500',
      returned: 'border-l-orange-500',
      updated: 'border-l-gray-500',
    };
    return colors[type] || 'border-l-gray-400';
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 lg:pl-64">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="mb-3 text-blue-100">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p className="text-sm text-blue-200">
              {getRoleWelcomeMessage()}
            </p>
          </div>
          <div className="hidden md:block">
            <div className="rounded-full bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur-sm">
              {user?.role.replace('_', ' ').toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {getRoleSpecificCards().map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-lg transition-all hover:scale-105 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 transform rounded-full bg-gradient-to-br from-white/10 to-transparent" />
            <div className="relative">
              <div className="mb-4 flex items-center justify-between">
                <div
                  className={`${card.color} flex h-12 w-12 items-center justify-center rounded-lg text-2xl shadow-lg transition-transform group-hover:scale-110`}
                >
                  {card.icon}
                </div>
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {card.value}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {card.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>

      {/* Pending Approvals Section */}
      {showPendingApprovals() && pendingPapers.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Papers Awaiting Your Approval
            </h2>
            <Link
              href="/approvals"
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {pendingPapers.slice(0, 5).map((paper) => (
              <Link
                key={paper.id}
                href={`/exam-papers/${paper.id}`}
                className="block rounded-xl border border-gray-200 bg-white p-5 shadow-md transition-all hover:border-blue-500 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {paper.paper_code}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getExamTypeColor(paper.exam_type)}`}>
                        {paper.exam_type}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(paper.status)}`}>
                        {paper.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        {paper.total_marks} marks
                      </span>
                    </div>
                    <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">
                      {paper.course_code} - {paper.course_title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <span>Submitted by {paper.created_by_name}</span>
                      <span>•</span>
                      <span>{formatDate(paper.submitted_at)}</span>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <span className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                      Review →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {getQuickActions().map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="group rounded-xl border border-gray-200 bg-white p-6 shadow-md transition-all hover:border-blue-500 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500"
            >
              <div className="mb-3 text-4xl transition-transform group-hover:scale-110">
                {action.icon}
              </div>
              <h3 className={`mb-2 text-lg font-semibold ${action.color}`}>
                {action.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {action.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity - Grouped with Collapsible */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Recent Activity
          </h2>
          <button
            onClick={() => fetchDashboardData()}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            disabled={activityLoading}
          >
            {activityLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <span>🔄</span>
                <span>Refresh</span>
              </>
            )}
          </button>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800">
          {activityLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            </div>
          ) : groupedActivities.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {groupedActivities.map((group, groupIndex) => (
                <div key={groupIndex}>
                  {group.activities.length === 1 ? (
                    // Single activity - display normally
                    <Link
                      href={group.activities[0].link || '#'}
                      className={`block border-l-4 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${getActivityBorderColor(group.activities[0].type)}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <span className="text-2xl">{group.activities[0].icon}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h4 className="truncate font-medium text-gray-900 dark:text-white">
                                {group.activities[0].title}
                              </h4>
                              <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                                {group.activities[0].description}
                              </p>
                            </div>
                            <span className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-500">
                              {getRelativeTime(group.activities[0].timestamp)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                            {new Date(group.activities[0].timestamp).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    // Multiple activities - grouped with collapse/expand
                    <div className={`border-l-4 ${getActivityBorderColor(group.activities[0].type)}`}>
                      {/* Group Header - Clickable to expand/collapse */}
                      <button
                        onClick={() => toggleGroup(groupIndex)}
                        className="w-full p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <span className="text-2xl">{group.activities[0].icon}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-gray-900 dark:text-white">
                                    {group.paperCode ? `Paper: ${group.paperCode}` : 'Multiple Activities'}
                                  </h4>
                                  <span className="flex-shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    {group.activities.length} activities
                                  </span>
                                </div>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                  {group.activities[0].description.split('by')[0].trim()}
                                </p>
                              </div>
                              <div className="flex flex-shrink-0 items-center gap-2">
                                <span className="text-xs text-gray-500 dark:text-gray-500">
                                  {getRelativeTime(group.latestTimestamp)}
                                </span>
                                <span className="text-gray-400">
                                  {group.isExpanded ? '▼' : '▶'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* Expanded Activities */}
                      {group.isExpanded && (
                        <div className="border-t border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/20">
                          {group.activities.map((activity) => (
                            <Link
                              key={activity.id}
                              href={activity.link || '#'}
                              className="block border-t border-gray-200 p-4 pl-14 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800/50"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{activity.icon}</span>
                                    <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                                      {activity.title.split(':')[0]}
                                    </h5>
                                  </div>
                                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                    {activity.description}
                                  </p>
                                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                    {new Date(activity.timestamp).toLocaleString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                </div>
                                <span className="flex-shrink-0 text-xs text-gray-500">
                                  {getRelativeTime(activity.timestamp)}
                                </span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="mb-3 text-5xl">📭</div>
              <p className="text-gray-600 dark:text-gray-400">
                No recent activity to display
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                Activities will appear here as you work in the system
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
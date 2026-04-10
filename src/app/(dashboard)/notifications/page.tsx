// src/app/notifications/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface NotificationStats {
  total_notifications: number;
  unread_notifications: number;
  pending_feedback: number;
  recent_activities: number;
  urgent_count: number;
  high_priority_count: number;
}

interface RecentNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  priority: string;
  is_read: boolean;
  created_at: string;
  action_url: string | null;
}

interface RecentActivity {
  id: number;
  paper_code: string;
  action: string;
  actor_name: string;
  created_at: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<NotificationStats>({
    total_notifications: 0,
    unread_notifications: 0,
    pending_feedback: 0,
    recent_activities: 0,
    urgent_count: 0,
    high_priority_count: 0,
  });
  const [recentNotifications, setRecentNotifications] = useState<RecentNotification[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch notifications
      const notifResponse = await fetch('/api/notifications');
      if (notifResponse.status === 401) {
        router.push('/auth/login');
        return;
      }

      let notifications: RecentNotification[] = [];
      if (notifResponse.ok) {
        const notifData = await notifResponse.json();
        notifications = notifData.data || [];
        setRecentNotifications(notifications.slice(0, 5));
      }

      // Fetch feedback
      const feedbackResponse = await fetch('/api/notifications/feedback');
      let feedbackCount = 0;
      if (feedbackResponse.ok) {
        const feedbackData = await feedbackResponse.json();
        const feedbacks = feedbackData.data || [];
        feedbackCount = feedbacks.filter((f: any) => !f.is_resolved).length;
      }

      // Fetch history
      const historyResponse = await fetch('/api/notifications/history');
      let activities: RecentActivity[] = [];
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        activities = historyData.data || [];
        setRecentActivities(activities.slice(0, 5));
      }

      // Calculate stats
      const unreadCount = notifications.filter((n) => !n.is_read).length;
      const urgentCount = notifications.filter((n) => n.priority === 'urgent' && !n.is_read).length;
      const highPriorityCount = notifications.filter((n) => n.priority === 'high' && !n.is_read).length;

      setStats({
        total_notifications: notifications.length,
        unread_notifications: unreadCount,
        pending_feedback: feedbackCount,
        recent_activities: activities.length,
        urgent_count: urgentCount,
        high_priority_count: highPriorityCount,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
      });

      if (response.ok) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      paper_submitted: '📄',
      paper_approved: '✅',
      paper_rejected: '❌',
      paper_returned: '↩️',
      permission_granted: '🔓',
      approval_required: '⏳',
      ready_for_print: '🖨️',
      print_completed: '✔️',
      comment_added: '💬',
      deadline_reminder: '⏰',
      general: '📧',
    };
    return icons[type] || '📧';
  };

  const getActionIcon = (action: string) => {
    const icons: Record<string, string> = {
      created: '🆕',
      submitted: '📤',
      hod_approved: '✅',
      hod_rejected: '❌',
      dean_approved: '✅',
      dean_rejected: '❌',
      ready_for_print: '🖨️',
      printing_started: '⏳',
      printed: '✔️',
      published: '📢',
      returned: '↩️',
      updated: '✏️',
    };
    return icons[action] || '📋';
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          🔔 Notifications
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Stay updated with your exam paper workflow
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/notifications/inbox"
          className="group rounded-xl border border-gray-200 bg-white p-6 shadow-md transition hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Unread</p>
              <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
                {stats.unread_notifications}
              </p>
            </div>
            <div className="text-4xl transition group-hover:scale-110">📬</div>
          </div>
        </Link>

        <Link
          href="/notifications/inbox?filter=urgent"
          className="group rounded-xl border border-gray-200 bg-white p-6 shadow-md transition hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Urgent</p>
              <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
                {stats.urgent_count}
              </p>
            </div>
            <div className="text-4xl transition group-hover:scale-110">🚨</div>
          </div>
        </Link>

        <Link
          href="/notifications/feedback"
          className="group rounded-xl border border-gray-200 bg-white p-6 shadow-md transition hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Feedback</p>
              <p className="mt-2 text-3xl font-bold text-orange-600 dark:text-orange-400">
                {stats.pending_feedback}
              </p>
            </div>
            <div className="text-4xl transition group-hover:scale-110">💬</div>
          </div>
        </Link>

        <Link
          href="/notifications/history"
          className="group rounded-xl border border-gray-200 bg-white p-6 shadow-md transition hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Recent Activity</p>
              <p className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-400">
                {stats.recent_activities}
              </p>
            </div>
            <div className="text-4xl transition group-hover:scale-110">📜</div>
          </div>
        </Link>
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Link
          href="/notifications/inbox"
          className="group rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-md transition hover:shadow-lg dark:border-blue-900 dark:from-blue-950 dark:to-blue-900"
        >
          <div className="mb-3 text-4xl">📥</div>
          <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
            Inbox
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            View all your notifications and updates
          </p>
          <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400">
            <span className="text-sm font-medium">Go to Inbox</span>
            <span className="ml-2 transition group-hover:translate-x-1">→</span>
          </div>
        </Link>

        <Link
          href="/notifications/feedback"
          className="group rounded-xl border border-gray-200 bg-gradient-to-br from-orange-50 to-orange-100 p-6 shadow-md transition hover:shadow-lg dark:border-orange-900 dark:from-orange-950 dark:to-orange-900"
        >
          <div className="mb-3 text-4xl">💬</div>
          <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
            Paper Feedback
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Review comments and feedback on your papers
          </p>
          <div className="mt-4 flex items-center text-orange-600 dark:text-orange-400">
            <span className="text-sm font-medium">View Feedback</span>
            <span className="ml-2 transition group-hover:translate-x-1">→</span>
          </div>
        </Link>

        <Link
          href="/notifications/history"
          className="group rounded-xl border border-gray-200 bg-gradient-to-br from-purple-50 to-purple-100 p-6 shadow-md transition hover:shadow-lg dark:border-purple-900 dark:from-purple-950 dark:to-purple-900"
        >
          <div className="mb-3 text-4xl">📜</div>
          <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
            Activity History
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track workflow history and paper progress
          </p>
          <div className="mt-4 flex items-center text-purple-600 dark:text-purple-400">
            <span className="text-sm font-medium">View History</span>
            <span className="ml-2 transition group-hover:translate-x-1">→</span>
          </div>
        </Link>
      </div>

      {/* Recent Notifications */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Recent Notifications
          </h2>
          <Link
            href="/notifications/inbox"
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            View All →
          </Link>
        </div>

        {recentNotifications.length > 0 ? (
          <div className="space-y-3">
            {recentNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-lg border p-4 transition hover:shadow ${
                  notification.is_read
                    ? 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                    : 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{getTypeIcon(notification.type)}</div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4 flex gap-2">
                    {!notification.is_read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
                      >
                        ✓
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="mb-2 text-4xl">📭</div>
            <p className="text-gray-600 dark:text-gray-400">No notifications yet</p>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Recent Activity
          </h2>
          <Link
            href="/notifications/history"
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            View All →
          </Link>
        </div>

        {recentActivities.length > 0 ? (
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700"
              >
                <div className="text-2xl">{getActionIcon(activity.action)}</div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {activity.paper_code}
                    </h4>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                      {activity.action.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    By {activity.actor_name}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(activity.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="mb-2 text-4xl">📜</div>
            <p className="text-gray-600 dark:text-gray-400">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
}
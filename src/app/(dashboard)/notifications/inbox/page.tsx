/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/notifications/inbox/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  related_paper_id: number | null;
  action_url: string | null;
}

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const typeIcons: Record<string, string> = {
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

export default function NotificationsInboxPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    filterNotifications();
  }, [filter, typeFilter, notifications]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data || data.notifications || []);
      } else if (response.status === 401) {
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterNotifications = () => {
    let filtered = [...notifications];

    if (filter === 'unread') {
      filtered = filtered.filter((n) => !n.is_read);
    } else if (filter === 'read') {
      filtered = filtered.filter((n) => n.is_read);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((n) => n.type === typeFilter);
    }

    setFilteredNotifications(filtered);
  };

  const markAsRead = async (id: number) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
      });

      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
      });

      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: number) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;

    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6 lg:pl-64">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            📥 Inbox
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Your notifications and updates
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            ✓ Mark All as Read
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-blue-600">
            {notifications.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Notifications
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-orange-600">{unreadCount}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Unread</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-green-600">
            {notifications.length - unreadCount}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Read</div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="paper_submitted">Paper Submitted</option>
              <option value="paper_approved">Paper Approved</option>
              <option value="paper_rejected">Paper Rejected</option>
              <option value="approval_required">Approval Required</option>
              <option value="permission_granted">Permission Granted</option>
              <option value="ready_for_print">Ready for Print</option>
              <option value="comment_added">Comments</option>
              <option value="general">General</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-xl border p-6 shadow-md transition-all hover:shadow-lg ${
                notification.is_read
                  ? 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                  : 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex flex-1 items-start gap-4">
                  <div className="text-3xl">
                    {typeIcons[notification.type] || '📧'}
                  </div>
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {notification.title}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          priorityColors[notification.priority]
                        }`}
                      >
                        {notification.priority.toUpperCase()}
                      </span>
                      {!notification.is_read && (
                        <span className="rounded-full bg-blue-600 px-2 py-1 text-xs font-medium text-white">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="ml-4 flex gap-2">
                  {!notification.is_read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="rounded-lg bg-blue-100 px-3 py-1 text-sm text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
                    >
                      ✓ Read
                    </button>
                  )}
                  {notification.action_url && (
                    <Link
                      href={notification.action_url}
                      className="rounded-lg bg-green-100 px-3 py-1 text-sm text-green-700 transition-colors hover:bg-green-200 dark:bg-green-900 dark:text-green-200"
                    >
                      View →
                    </Link>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="rounded-lg bg-red-100 px-3 py-1 text-sm text-red-700 transition-colors hover:bg-red-200 dark:bg-red-900 dark:text-red-200"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-md dark:border-gray-700 dark:bg-gray-800">
            <div className="text-5xl">📭</div>
            <p className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No notifications
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {filter === 'unread'
                ? "You're all caught up!"
                : 'You have no notifications'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
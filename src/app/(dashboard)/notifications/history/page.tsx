/* eslint-disable react-hooks/exhaustive-deps */
// src/app/notifications/history/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Activity {
  id: number;
  exam_paper_id: number;
  paper_code: string;
  action: string;
  from_status: string | null;
  to_status: string;
  actor_name: string;
  actor_role: string;
  comments: string | null;
  created_at: string;
}

const actionIcons: Record<string, string> = {
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

export default function NotificationsHistoryPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/notifications/history');
      if (response.ok) {
        const data = await response.json();
        setActivities(data.data || []);
      } else if (response.status === 401) {
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredActivities =
    filter === 'all'
      ? activities
      : activities.filter((a) => a.action === filter);

  return (
    <div className="space-y-6 lg:pl-64">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            📜 Activity History
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Complete workflow history of your exam papers
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-blue-600">
            {activities.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Activities
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-green-600">
            {activities.filter((a) => a.action.includes('approved')).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Approvals
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-red-600">
            {activities.filter((a) => a.action.includes('rejected')).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Rejections
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-purple-600">
            {activities.filter((a) => a.action === 'submitted').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Submissions
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Filter by Action
        </label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All Actions</option>
          <option value="created">Created</option>
          <option value="submitted">Submitted</option>
          <option value="hod_approved">HOD Approved</option>
          <option value="hod_rejected">HOD Rejected</option>
          <option value="dean_approved">Dean Approved</option>
          <option value="dean_rejected">Dean Rejected</option>
          <option value="ready_for_print">Ready for Print</option>
          <option value="printed">Printed</option>
          <option value="published">Published</option>
        </select>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {filteredActivities.length > 0 ? (
          filteredActivities.map((activity, index) => (
            <div
              key={activity.id}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">
                  {actionIcons[activity.action] || '📋'}
                </div>
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {activity.paper_code}
                    </h3>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {activity.action.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">{activity.actor_name}</span>
                    <span className="text-gray-500"> ({activity.actor_role})</span>
                    {activity.from_status && (
                      <span>
                        {' '}
                        changed status from{' '}
                        <span className="font-medium">{activity.from_status}</span> to{' '}
                        <span className="font-medium">{activity.to_status}</span>
                      </span>
                    )}
                  </div>

                  {activity.comments && (
                    <div className="mb-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                      💬 {activity.comments}
                    </div>
                  )}

                  <p className="text-xs text-gray-500">
                    {new Date(activity.created_at).toLocaleString()}
                  </p>
                </div>

                {index === 0 && (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                    Latest
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-md dark:border-gray-700 dark:bg-gray-800">
            <div className="text-5xl">📜</div>
            <p className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No activity history
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {filter === 'all'
                ? 'No workflow activities recorded yet'
                : `No ${filter.replace('_', ' ')} activities found`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
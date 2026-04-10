/* eslint-disable react-hooks/exhaustive-deps */
// src/app/notifications/feedback/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Feedback {
  id: number;
  exam_paper_id: number;
  paper_code: string;
  course_code: string;
  course_title: string;
  comment: string;
  comment_type: string;
  is_resolved: boolean;
  user_name: string;
  created_at: string;
  status: string;
}

export default function NotificationsFeedbackPage() {
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const response = await fetch('/api/notifications/feedback');
      if (response.ok) {
        const data = await response.json();
        setFeedbacks(data.data || []);
      } else if (response.status === 401) {
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsResolved = async (id: number) => {
    try {
      const response = await fetch(`/api/paper-comments/${id}/resolve`, {
        method: 'PUT',
      });

      if (response.ok) {
        fetchFeedbacks();
      }
    } catch (error) {
      console.error('Error resolving feedback:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredFeedbacks = feedbacks.filter((f) => {
    if (filter === 'pending') return !f.is_resolved;
    if (filter === 'resolved') return f.is_resolved;
    return true;
  });

  const pendingCount = feedbacks.filter((f) => !f.is_resolved).length;

  return (
    <div className="space-y-6 lg:pl-64">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            💬 Paper Feedback
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Comments and feedback on your exam papers
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-blue-600">
            {feedbacks.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Feedback
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-orange-600">
            {pendingCount}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Pending
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-green-600">
            {feedbacks.length - pendingCount}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Resolved
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <div className="flex gap-3">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-lg px-4 py-2 transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            All ({feedbacks.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`rounded-lg px-4 py-2 transition-colors ${
              filter === 'pending'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`rounded-lg px-4 py-2 transition-colors ${
              filter === 'resolved'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            Resolved ({feedbacks.length - pendingCount})
          </button>
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {filteredFeedbacks.length > 0 ? (
          filteredFeedbacks.map((feedback) => (
            <div
              key={feedback.id}
              className={`rounded-xl border p-6 shadow-md ${
                feedback.is_resolved
                  ? 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                  : 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950'
              }`}
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {feedback.paper_code}
                    </h3>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        feedback.is_resolved
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                      }`}
                    >
                      {feedback.is_resolved ? 'Resolved' : 'Pending'}
                    </span>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {feedback.comment_type.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {feedback.course_code} - {feedback.course_title}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/exam-papers/${feedback.exam_paper_id}`}
                    className="rounded-lg bg-blue-100 px-3 py-1 text-sm text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
                  >
                    View Paper
                  </Link>
                  {!feedback.is_resolved && (
                    <button
                      onClick={() => markAsResolved(feedback.id)}
                      className="rounded-lg bg-green-100 px-3 py-1 text-sm text-green-700 transition-colors hover:bg-green-200 dark:bg-green-900 dark:text-green-200"
                    >
                      ✓ Resolve
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  From: {feedback.user_name}
                </p>
                <p className="text-gray-900 dark:text-white">{feedback.comment}</p>
                <p className="mt-2 text-xs text-gray-500">
                  {new Date(feedback.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-md dark:border-gray-700 dark:bg-gray-800">
            <div className="text-5xl">💬</div>
            <p className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No feedback
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {filter === 'pending'
                ? 'No pending feedback to review'
                : filter === 'resolved'
                  ? 'No resolved feedback'
                  : 'You have no feedback on your papers yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
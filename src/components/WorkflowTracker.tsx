/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/WorkflowTracker.tsx
'use client';

import { useEffect, useState } from 'react';

interface WorkflowStep {
  id: number;
  action: string;
  from_status: string;
  to_status: string;
  actor_name: string;
  actor_role: string;
  comments: string | null;
  created_at: string;
}

interface WorkflowTrackerProps {
  paperId: number;
  currentStatus: string;
  hodName?: string | null;
  deanName?: string | null;
}

export default function WorkflowTracker({ 
  paperId, 
  currentStatus, 
  hodName, 
  deanName 
}: WorkflowTrackerProps) {
  const [history, setHistory] = useState<WorkflowStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkflowHistory();
  }, [paperId]);

  const fetchWorkflowHistory = async () => {
    try {
      const response = await fetch(`/api/exam-papers/${paperId}/workflow`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to fetch workflow history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (action: string) => {
    const icons: Record<string, string> = {
      created: '📝',
      submitted: '📤',
      hod_approved: '✅',
      hod_rejected: '❌',
      dean_approved: '✅',
      dean_rejected: '❌',
      ready_for_print: '🖨️',
      printing_started: '⏳',
      printed: '✔️',
      published: '🎉',
      returned: '↩️',
      updated: '✏️',
    };
    return icons[action] || '📌';
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      created: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      hod_approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      hod_rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      dean_approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      dean_rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      ready_for_print: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
      printing_started: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      printed: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
      published: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Assignment Info */}
      {(hodName || deanName) && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <h4 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
            Current Assignment
          </h4>
          <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
            {hodName && (
              <p>
                <span className="font-medium">HOD:</span> {hodName}
              </p>
            )}
            {deanName && (
              <p>
                <span className="font-medium">Dean:</span> {deanName}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Workflow Timeline */}
      <div className="relative">
        {history.length === 0 ? (
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            No workflow history yet
          </p>
        ) : (
          <div className="space-y-4">
            {history.map((step, index) => (
              <div key={step.id} className="relative flex gap-4">
                {/* Timeline line */}
                {index < history.length - 1 && (
                  <div className="absolute left-4 top-8 h-full w-0.5 bg-gray-300 dark:bg-gray-600"></div>
                )}

                {/* Icon */}
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-md dark:bg-gray-800">
                  <span className="text-lg">{getStatusIcon(step.action)}</span>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getActionColor(
                            step.action
                          )}`}
                        >
                          {step.action.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          by {step.actor_name} ({step.actor_role})
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(step.created_at)}
                      </span>
                    </div>

                    {step.comments && (
                      <div className="mt-2 rounded-md bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-700/50 dark:text-gray-300">
                        <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                          Comments:
                        </p>
                        <p className="whitespace-pre-wrap">{step.comments}</p>
                      </div>
                    )}

                    {step.from_status && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Status changed: {step.from_status.replace(/_/g, ' ')} → {step.to_status.replace(/_/g, ' ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
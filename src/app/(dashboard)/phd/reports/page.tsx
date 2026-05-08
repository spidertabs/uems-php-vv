// src/app/(dashboard)/phd/reports/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CANDIDATE_STATUS_LABELS,
  CANDIDATE_STATUS_COLORS,
  OUTCOME_LABELS,
  OUTCOME_COLORS,
  type CandidateStatus,
  type VivaOutcome,
} from '@/types/phd';

interface StatusRow { status: CandidateStatus; count: number; }
interface OutcomeRow { outcome: VivaOutcome; count: number; }
interface ProgrammeRow { programme_name: string; programme_code: string; total: number; awarded: number; }
interface UpcomingViva {
  viva_id: number;
  candidate_name: string;
  registration_number: string;
  programme_name: string;
  scheduled_date: string;
  scheduled_time: string;
  venue: string;
  evaluations_submitted: number;
  total_examiners: number;
}
interface PendingAction {
  viva_id: number;
  candidate_name: string;
  registration_number: string;
  reason: string;
  since: string;
}

export default function PhdReportsPage() {
  const router = useRouter();
  const [statusBreakdown, setStatusBreakdown] = useState<StatusRow[]>([]);
  const [outcomeBreakdown, setOutcomeBreakdown] = useState<OutcomeRow[]>([]);
  const [programmeBreakdown, setProgrammeBreakdown] = useState<ProgrammeRow[]>([]);
  const [upcomingVivas, setUpcomingVivas] = useState<UpcomingViva[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await fetch('/api/phd/reports');
        if (res.status === 401) { router.push('/auth/login'); return; }
        if (res.ok) {
          const d = await res.json();
          setStatusBreakdown(d.status_breakdown || []);
          setOutcomeBreakdown(d.outcome_breakdown || []);
          setProgrammeBreakdown(d.programme_breakdown || []);
          setUpcomingVivas(d.upcoming_vivas || []);
          setPendingActions(d.pending_actions || []);
          setTotalCandidates(d.total_candidates || 0);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const formatTime = (t: string) => {
    const [h, m] = t.split(':');
    const hour = parseInt(h, 10);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const totalOutcomes = outcomeBreakdown.reduce((s, r) => s + r.count, 0);
  const totalStatuses = statusBreakdown.reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-8 lg:pl-64">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📊 PhD Reports</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            {totalCandidates} total candidate{totalCandidates !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/phd" className="inline-flex items-center text-sm text-emerald-600 hover:underline dark:text-emerald-400">
          ← PhD Dashboard
        </Link>
      </div>

      {/* Pending Actions Alert */}
      {pendingActions.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-5 dark:border-orange-800 dark:bg-orange-900/20">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-orange-800 dark:text-orange-300">
            ⚠️ Pending Actions ({pendingActions.length})
          </h2>
          <div className="space-y-2">
            {pendingActions.map((a) => (
              <div key={a.viva_id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg bg-white p-3 shadow-sm dark:bg-gray-800">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{a.candidate_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{a.registration_number} · {a.reason}</p>
                </div>
                <Link
                  href={`/phd/schedules/${a.viva_id}`}
                  className="inline-flex items-center justify-center rounded-lg bg-orange-100 px-3 py-1 text-xs text-orange-700 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200"
                >
                  Resolve →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two-column: Status + Outcomes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Candidate Status Breakdown */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-5 text-lg font-semibold text-gray-900 dark:text-white">Candidate Status Distribution</h2>
          {statusBreakdown.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No data</p>
          ) : (
            <div className="space-y-3">
              {statusBreakdown.map((row) => {
                const pct = totalStatuses > 0 ? Math.round((row.count / totalStatuses) * 100) : 0;
                return (
                  <div key={row.status}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${CANDIDATE_STATUS_COLORS[row.status]}`}>
                        {CANDIDATE_STATUS_LABELS[row.status]}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">
                        <strong>{row.count}</strong>
                        <span className="ml-1 text-gray-400 text-xs">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                      <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Viva Outcomes */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-5 text-lg font-semibold text-gray-900 dark:text-white">
            Viva Outcomes ({totalOutcomes} vivás with results)
          </h2>
          {outcomeBreakdown.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No outcomes recorded yet</p>
          ) : (
            <div className="space-y-3">
              {outcomeBreakdown.map((row) => {
                const pct = totalOutcomes > 0 ? Math.round((row.count / totalOutcomes) * 100) : 0;
                return (
                  <div key={row.outcome}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${OUTCOME_COLORS[row.outcome]}`}>
                        {OUTCOME_LABELS[row.outcome]}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">
                        <strong>{row.count}</strong>
                        <span className="ml-1 text-gray-400 text-xs">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor:
                            row.outcome === 'pass' ? '#10b981' :
                            row.outcome === 'pass_with_minor_corrections' ? '#3b82f6' :
                            row.outcome === 'pass_with_major_corrections' ? '#f97316' : '#ef4444',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Programme Breakdown */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
        <div className="border-b border-gray-200 p-6 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Candidates by Programme</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Programme</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Total</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Awarded</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Completion Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {programmeBreakdown.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">No data</td>
              </tr>
            ) : (
              programmeBreakdown.map((row) => {
                const rate = row.total > 0 ? Math.round((row.awarded / row.total) * 100) : 0;
                return (
                  <tr key={row.programme_code} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 dark:text-white">{row.programme_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{row.programme_code}</p>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{row.total}</td>
                    <td className="px-6 py-4">
                      <span className="whitespace-nowrap rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                        {row.awarded}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-32 rounded-full bg-gray-100 dark:bg-gray-700">
                          <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${rate}%` }} />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{rate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Upcoming Vivás */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">All Upcoming Vivás</h2>
          <Link href="/phd/schedules?status=scheduled" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">
            Manage →
          </Link>
        </div>
        {upcomingVivas.length === 0 ? (
          <div className="py-10 text-center">
            <div className="text-4xl">📅</div>
            <p className="mt-3 text-gray-500 dark:text-gray-400">No upcoming vivás scheduled.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Candidate</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Programme</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Venue</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Panel</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {upcomingVivas.map((v) => (
                <tr key={v.viva_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 dark:text-white">{v.candidate_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{v.registration_number}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{v.programme_name}</td>
                  <td className="px-6 py-4 text-sm">
                    <p className="text-gray-900 dark:text-white">{formatDate(v.scheduled_date)}</p>
                    <p className="text-gray-500 dark:text-gray-400">{formatTime(v.scheduled_time)}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-[160px]">
                    <p className="truncate">{v.venue}</p>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {v.evaluations_submitted === v.total_examiners && v.total_examiners > 0 ? (
                      <span className="text-green-600 dark:text-green-400">✅ {v.total_examiners}/3</span>
                    ) : (
                      <span className="text-orange-500">⚠️ {v.evaluations_submitted}/{v.total_examiners}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/phd/schedules/${v.viva_id}`} className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
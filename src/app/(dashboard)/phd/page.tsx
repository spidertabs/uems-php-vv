/* eslint-disable react-hooks/exhaustive-deps */
// src/app/(dashboard)/phd/page.tsx
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

interface DashboardStats {
  total_candidates: number;
  upcoming_vivas: number;
  pending_outcomes: number;    // vivás completed but no recommendation yet
  outstanding_evaluations: number; // evaluations not yet submitted
}

interface StatusBreakdown {
  status: CandidateStatus;
  count: number;
}

interface UpcomingViva {
  viva_id: number;
  candidate_name: string;
  registration_number: string;
  programme_name: string;
  scheduled_date: string;
  scheduled_time: string;
  venue: string;
  confirmed_examiners: number;
  total_examiners: number;
}

interface RecentOutcome {
  viva_id: number;
  candidate_name: string;
  registration_number: string;
  programme_name: string;
  outcome: VivaOutcome;
  issued_at: string;
}

export default function PhdDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    total_candidates: 0,
    upcoming_vivas: 0,
    pending_outcomes: 0,
    outstanding_evaluations: 0,
  });
  const [user, setUser] = useState<any>(null);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown[]>([]);
  const [upcomingVivas, setUpcomingVivas] = useState<UpcomingViva[]>([]);
  const [recentOutcomes, setRecentOutcomes] = useState<RecentOutcome[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, schedulesRes, userRes] = await Promise.all([
        fetch('/api/phd/stats'),
        fetch('/api/phd/schedules?status=scheduled&limit=5'),
        fetch('/api/auth/me'),
      ]);

      if (userRes.status === 401) {
        router.push('/auth/login');
        return;
      }

      if (userRes.ok) {
        const u = await userRes.json();
        setUser(u.user);
      }

      if (statsRes.ok) {
        const d = await statsRes.json();
        setStats(d.stats || {});
        setStatusBreakdown(d.status_breakdown || []);
        setRecentOutcomes(d.recent_outcomes || []);
      }

      if (schedulesRes.ok) {
        const d = await schedulesRes.json();
        setUpcomingVivas(d.schedules || []);
      }
    } catch (err) {
      console.error('Failed to fetch PhD dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const isManagement = ['admin', 'hod', 'dean', 'viva_coordinator'].includes(user?.role || '');
  const canManageVivás = ['admin', 'viva_coordinator', 'hod', 'dean'].includes(user?.role || '');

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const formatTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${m} ${ampm}`;
  };

  const getRelativeDate = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff > 0) return `In ${diff} days`;
    return `${Math.abs(diff)} days ago`;
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: isManagement ? 'Total Candidates' : 'Assigned Candidates',
      value: stats.total_candidates,
      icon: '👨‍🎓',
      href: isManagement ? '/phd/candidates' : '/phd/my-candidates',
      color: 'bg-emerald-500',
    },
    {
      title: 'Upcoming Vivás',
      value: stats.upcoming_vivas,
      icon: '📅',
      href: '/phd/schedules',
      color: 'bg-yellow-500',
    },
    {
      title: 'Pending Outcomes',
      value: stats.pending_outcomes,
      icon: '⏳',
      href: '/phd/schedules?status=completed',
      color: 'bg-orange-500',
    },
    {
      title: 'Outstanding Evaluations',
      value: stats.outstanding_evaluations,
      icon: '📝',
      href: '/phd/schedules',
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="space-y-8 lg:pl-64">
      {/* Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold">
              🎓 PhD Viva Voce {isManagement ? 'Administration' : 'Dashboard'}
            </h1>
            <p className="mb-1 text-emerald-100">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p className="text-sm text-emerald-200">
              Manage PhD candidates, thesis submissions, oral defence scheduling, and panel evaluations.
            </p>
          </div>
          {canManageVivás && (
            <div className="flex flex-col gap-2 text-right sm:flex-row md:flex-col lg:flex-row">
              <Link
                href="/phd/candidates/new"
                className="inline-flex items-center justify-center rounded-lg bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur-sm hover:bg-white/30 transition-colors"
              >
                + Register Candidate
              </Link>
              <Link
                href="/phd/schedules/new"
                className="inline-flex items-center justify-center rounded-lg bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur-sm hover:bg-white/30 transition-colors"
              >
                + Schedule Viva
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
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
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{card.title}</h3>
            </div>
          </Link>
        ))}
      </div>

      {/* Two-column: Upcoming Vivás + Status Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Upcoming Vivás */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upcoming Vivás</h2>
            <Link href="/phd/schedules" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">
              View All →
            </Link>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
            {upcomingVivas.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-4xl">📅</div>
                <p className="mt-3 text-gray-500 dark:text-gray-400">No vivás scheduled</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {upcomingVivas.map((viva) => (
                  <Link
                    key={viva.viva_id}
                    href={`/phd/schedules/${viva.viva_id}`}
                    className="block p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">
                          {viva.candidate_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {viva.registration_number} · {viva.programme_name}
                        </p>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                          📍 {viva.venue}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <span className="inline-block whitespace-nowrap rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          {getRelativeDate(viva.scheduled_date)}
                        </span>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(viva.scheduled_date)} · {formatTime(viva.scheduled_time)}
                        </p>
                        <p className="mt-1 text-xs">
                          {viva.confirmed_examiners === viva.total_examiners ? (
                            <span className="text-green-600 dark:text-green-400">
                              ✅ {viva.confirmed_examiners}/{viva.total_examiners} confirmed
                            </span>
                          ) : (
                            <span className="text-orange-500">
                              ⚠️ {viva.confirmed_examiners}/{viva.total_examiners} confirmed
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status Breakdown */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Candidate Status</h2>
            <Link href="/phd/candidates" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">
              View All →
            </Link>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800 space-y-3">
            {statusBreakdown.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">No data</p>
            ) : (
              statusBreakdown.map((row) => {
                const total = statusBreakdown.reduce((s, r) => s + r.count, 0);
                const pct = total > 0 ? Math.round((row.count / total) * 100) : 0;
                return (
                  <div key={row.status}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${CANDIDATE_STATUS_COLORS[row.status]}`}>
                        {CANDIDATE_STATUS_LABELS[row.status]}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {row.count}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                      <div
                        className="h-2 rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Outcomes */}
      {recentOutcomes.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Outcomes</h2>
            <Link href="/phd/reports" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">
              Full Report →
            </Link>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Candidate</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Programme</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Outcome</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentOutcomes.map((o) => (
                  <tr key={o.viva_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 dark:text-white">{o.candidate_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{o.registration_number}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{o.programme_name}</td>
                    <td className="px-6 py-4">
                      <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${OUTCOME_COLORS[o.outcome]}`}>
                        {OUTCOME_LABELS[o.outcome]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(o.issued_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/phd/report/${o.viva_id}`}
                        className="text-sm text-emerald-600 hover:underline dark:text-emerald-400"
                      >
                        Report →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: '👨‍🎓', title: 'Register Candidate', desc: 'Add a new PhD candidate', href: '/phd/candidates/new', color: 'text-emerald-600 dark:text-emerald-400', hide: !canManageVivás },
            { icon: '📅', title: 'Schedule Viva', desc: 'Create a new oral defence appointment', href: '/phd/schedules/new', color: 'text-yellow-600 dark:text-yellow-400', hide: !canManageVivás },
            { icon: '👥', title: 'View Candidates', desc: isManagement ? 'Browse all PhD candidates' : 'View your assigned candidates', href: isManagement ? '/phd/candidates' : '/phd/my-candidates', color: 'text-blue-600 dark:text-blue-400' },
            { icon: '📊', title: 'PhD Reports', desc: 'Outcomes and progress statistics', href: '/phd/reports', color: 'text-purple-600 dark:text-purple-400' },
            { icon: '📜', title: 'My Evaluations', desc: 'View your submitted evaluations', href: '/phd/my-candidates', color: 'text-indigo-600 dark:text-indigo-400', hide: isManagement },
          ].filter(a => !a.hide).map((a) => (
            <Link
              key={a.title}
              href={a.href}
              className="group rounded-xl border border-gray-200 bg-white p-6 shadow-md transition-all hover:border-emerald-500 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="mb-3 text-4xl transition-transform group-hover:scale-110">{a.icon}</div>
              <h3 className={`mb-1 text-lg font-semibold ${a.color}`}>{a.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{a.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
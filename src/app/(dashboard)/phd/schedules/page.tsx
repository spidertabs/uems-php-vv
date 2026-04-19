'use client';
// src/app/(dashboard)/phd/schedules/page.tsx

import { useCallback, useEffect, useState , Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  VIVA_STATUS_COLORS,
  OUTCOME_LABELS,
  OUTCOME_COLORS,
  type VivaStatus,
  type VivaOutcome,
} from '@/types/phd';

interface ScheduleRow {
  viva_id: number;
  scheduled_date: string;
  scheduled_time: string;
  venue: string;
  viva_status: VivaStatus;
  registration_number: string;
  thesis_title: string;
  candidate_status: string;
  candidate_name: string;
  supervisor_name: string | null;
  programme_name: string;
  outcome: VivaOutcome | null;
  evaluations_submitted: number;
  total_examiners: number;
}

const STATUS_OPTIONS: { value: VivaStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'postponed', label: 'Postponed' },
  { value: 'cancelled', label: 'Cancelled' },
];

function VivaSchedulesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [filtered, setFiltered] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<VivaStatus | 'all'>(
    (searchParams.get('status') as VivaStatus) || 'all',
  );
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await fetch('/api/phd/schedules');
      if (res.status === 401) { router.push('/auth/login'); return; }
      if (res.ok) {
        const d = await res.json();
        setSchedules(d.schedules || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const applyFilters = useCallback(() => {
    let list = [...schedules];
    if (filterStatus !== 'all') list = list.filter((s) => s.viva_status === filterStatus);
    if (dateFrom) list = list.filter((s) => s.scheduled_date >= dateFrom);
    if (dateTo) list = list.filter((s) => s.scheduled_date <= dateTo);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.candidate_name.toLowerCase().includes(q) ||
          s.registration_number.toLowerCase().includes(q),
      );
    }
    setFiltered(list);
  }, [schedules, filterStatus, dateFrom, dateTo, search]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const formatTime = (t: string) => {
    const [h, m] = t.split(':');
    const hour = parseInt(h, 10);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const confirmedPct = (row: ScheduleRow) =>
    row.total_examiners > 0
      ? Math.round((row.evaluations_submitted / row.total_examiners) * 100)
      : 0;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:pl-64">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📅 Viva Schedules</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            {schedules.length} viva{schedules.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link
          href="/phd/schedules/new"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-white transition-colors hover:bg-emerald-700"
        >
          + Schedule Viva
        </Link>
      </div>

      {/* Status Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilterStatus(opt.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filterStatus === opt.value
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {opt.label}
            {opt.value !== 'all' && (
              <span className="ml-1.5 text-xs opacity-75">
                ({schedules.filter((s) => s.viva_status === opt.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Advanced Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Search Candidate</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or reg number..."
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Date & Time</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Candidate</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Venue</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Evaluations</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Outcome</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.length > 0 ? (
                filtered.map((row) => (
                  <tr key={row.viva_id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm">
                      <p className="font-medium text-gray-900 dark:text-white">{formatDate(row.scheduled_date)}</p>
                      <p className="text-gray-500 dark:text-gray-400">{formatTime(row.scheduled_time)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/phd/candidates/${row.viva_id}`}
                        className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                      >
                        {row.candidate_name}
                      </Link>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{row.registration_number}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{row.programme_name}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-[160px]">
                      <p className="truncate">{row.venue}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 rounded-full bg-gray-100 dark:bg-gray-700">
                          <div
                            className="h-2 rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${confirmedPct(row)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {row.evaluations_submitted}/{row.total_examiners}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${VIVA_STATUS_COLORS[row.viva_status]}`}>
                        {row.viva_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {row.outcome ? (
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${OUTCOME_COLORS[row.outcome]}`}>
                          {OUTCOME_LABELS[row.outcome]}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/phd/schedules/${row.viva_id}`}
                        className="rounded-lg bg-emerald-100 px-3 py-1 text-sm text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-200"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-5xl">📅</div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">No viva schedules found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-3 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {filtered.length} of {schedules.length} schedules
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
function VivaSchedulesPageInner() {
  return <Suspense fallback={<div>Loading...</div>}><VivaSchedulesPageInner /></Suspense>;
}

function VivaSchedulesPageInner() {
  return <Suspense fallback={<div>Loading...</div>}><VivaSchedulesPageInner /></Suspense>;
}

export default function VivaSchedulesPage() {
  return <Suspense fallback={<div>Loading...</div>}><VivaSchedulesPageInner /></Suspense>;
}

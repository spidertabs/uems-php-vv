/* eslint-disable react-hooks/exhaustive-deps */
// src/app/(dashboard)/phd/my-candidates/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CANDIDATE_STATUS_LABELS,
  CANDIDATE_STATUS_COLORS,
  type CandidateStatus,
} from '@/types/phd';

interface Candidate {
  candidate_id: number;
  id?: number;
  candidate_name: string;
  registration_number: string;
  programme_code: string;
  programme_name: string;
  thesis_title: string;
  status: CandidateStatus;
  supervisor_name: string | null;
  co_supervisor_name: string | null;
  enrolment_year: number | null;
  thesis_count: number;
  viva_count: number;
  role_as_supervisor: 'primary' | 'co_supervisor' | 'supervisor' | 'examiner' | 'other'; // which role the current user has
  pending_evaluations: number;
  completed_evaluations: number;
  pending_viva_id?: number;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

const ALL_STATUSES = Object.keys(CANDIDATE_STATUS_LABELS) as CandidateStatus[];

export default function MyCandidatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 20,
    total_pages: 1,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [statusFilter, setStatusFilter] = useState<CandidateStatus | ''>(
    (searchParams.get('status') as CandidateStatus) ?? '',
  );
  const [page, setPage] = useState(Number(searchParams.get('page') ?? 1));

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', '20');
      // This endpoint returns only candidates where the current user
      // is supervisor or co-supervisor (resolved server-side via session)
      params.set('my_candidates', 'true');

      const res = await fetch(`/api/phd/my-candidates?${params.toString()}`);
      if (res.status === 401) { router.push('/auth/login'); return; }
      if (res.ok) {
        const d = await res.json();
        setCandidates(d.data ?? []);
        setPagination(d.pagination ?? { total: 0, page: 1, limit: 20, total_pages: 1 });
      }
    } catch (err) {
      console.error('Failed to fetch my candidates:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const handleSearchChange = (value: string) => { setSearch(value); setPage(1); };
  const handleStatusChange = (value: CandidateStatus | '') => { setStatusFilter(value); setPage(1); };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPage(1);
  };

  const hasActiveFilters = search || statusFilter;

  const getCandidateHref = (c: Candidate) =>
    `/phd/candidates/${c.candidate_id ?? c.id}`;

  // Summary counts per status for the mini stat strip

  return (
    <div className="space-y-6 lg:pl-64">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-700 p-8 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="mb-1 text-3xl font-bold">👤 My Candidates</h1>
            <p className="text-teal-100 text-sm">
              PhD candidates assigned to you — as a supervisor, co-supervisor, or examiner.
            </p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">{loading ? '—' : pagination.total}</p>
            <p className="text-sm text-teal-200">
              {pagination.total === 1 ? 'candidate' : 'candidates'} assigned
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative min-w-[220px] flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
              🔍
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search name, reg. number, thesis…"
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-4 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value as CandidateStatus | '')}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{CANDIDATE_STATUS_LABELS[s]}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Candidate list */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-600" />
          </div>
        ) : candidates.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-5xl">🎓</div>
            <p className="mt-4 font-medium text-gray-700 dark:text-gray-300">
              {hasActiveFilters
                ? 'No candidates match your filters.'
                : 'No candidates assigned to you yet.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-3 text-sm text-emerald-600 hover:underline dark:text-emerald-400"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Candidate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Programme
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Your Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Thesis
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Vivás
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {candidates.map((c) => (
                    <tr
                      key={c.candidate_id ?? c.id}
                      className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900 dark:text-white">{c.candidate_name}</p>
                        <p className="mt-0.5 font-mono text-xs text-gray-500 dark:text-gray-400">
                          {c.registration_number}
                        </p>
                        <p className="mt-1 max-w-xs truncate text-xs italic text-gray-400 dark:text-gray-500">
                          {c.thesis_title}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{c.programme_code}</p>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 max-w-[160px] truncate">
                          {c.programme_name}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {c.role_as_supervisor === 'primary' ? (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            Primary Supervisor
                          </span>
                        ) : c.role_as_supervisor === 'co_supervisor' ? (
                          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                            Co-Supervisor
                          </span>
                        ) : c.role_as_supervisor === 'supervisor' ? (
                          <span className="rounded-full bg-teal-100 px-2.5 py-1 text-xs font-medium text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                            Supervisor
                          </span>
                        ) : c.role_as_supervisor === 'examiner' ? (
                          <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                            Examiner
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${CANDIDATE_STATUS_COLORS[c.status]}`}
                        >
                          {CANDIDATE_STATUS_LABELS[c.status]}
                        </span>
                        {c.pending_evaluations > 0 ? (
                          <p className="mt-1 flex items-center gap-1 text-[10px] font-bold uppercase text-red-500 animate-pulse">
                            ⚠️ Pending Evaluation ({c.pending_evaluations})
                          </p>
                        ) : c.completed_evaluations > 0 ? (
                          <p className="mt-1 flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-500">
                            ✅ Evaluated ({c.completed_evaluations})
                          </p>
                        ) : null}
                        {c.enrolment_year && (
                          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                            Enrolled {c.enrolment_year}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-sm font-semibold ${c.thesis_count > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                          {c.thesis_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-sm font-semibold ${c.viva_count > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-400'}`}>
                          {c.viva_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {c.pending_viva_id ? (
                            <Link
                              href={`/phd/evaluations/${c.pending_viva_id}`}
                              className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition-colors hover:bg-red-100 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60"
                            >
                              Evaluate ★
                            </Link>
                          ) : c.viva_count > 0 && (
                            <Link
                              href={`/phd/candidates/${c.candidate_id ?? c.id}`}
                              className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                            >
                              Results 📊
                            </Link>
                          )}
                          <Link
                            href={getCandidateHref(c)}
                            className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
                          >
                            View →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-gray-200 md:hidden dark:divide-gray-700">
              {candidates.map((c) => (
                <Link
                  key={c.candidate_id ?? c.id}
                  href={getCandidateHref(c)}
                  className="block p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">{c.candidate_name}</p>
                      <p className="mt-0.5 font-mono text-xs text-gray-500 dark:text-gray-400">
                        {c.registration_number}
                      </p>
                      <p className="mt-1 truncate text-xs italic text-gray-400 dark:text-gray-500">
                        {c.thesis_title}
                      </p>
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                        {c.programme_code}
                        {c.role_as_supervisor === 'primary' && (
                          <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            Primary
                          </span>
                        )}
                        {c.role_as_supervisor === 'co_supervisor' && (
                          <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                            Co-Supervisor
                          </span>
                        )}
                        {c.role_as_supervisor === 'supervisor' && (
                          <span className="ml-2 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                            Supervisor
                          </span>
                        )}
                        {c.role_as_supervisor === 'examiner' && (
                          <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                            Examiner
                          </span>
                        )}
                      </p>
                    </div>
                    <span
                      className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${CANDIDATE_STATUS_COLORS[c.status]}`}
                    >
                      {CANDIDATE_STATUS_LABELS[c.status]}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>📄 {c.thesis_count} thesis version{c.thesis_count !== 1 ? 's' : ''}</span>
                    <span>📅 {c.viva_count} viva{c.viva_count !== 1 ? 's' : ''}</span>
                    {c.enrolment_year && <span>🎓 Enrolled {c.enrolment_year}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {!loading && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              ← Prev
            </button>

            <div className="flex gap-1">
              {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === pagination.total_pages || Math.abs(p - page) <= 1)
                .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span key={`ellipsis-${idx}`} className="px-1 py-1.5 text-sm text-gray-400">…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPage(item as number)}
                      className={`min-w-[32px] rounded-lg px-2 py-1.5 text-sm font-medium transition-colors ${
                        page === item
                          ? 'bg-emerald-600 text-white'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      {item}
                    </button>
                  ),
                )}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
              disabled={page >= pagination.total_pages}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
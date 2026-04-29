/* eslint-disable react-hooks/exhaustive-deps */
// src/app/(dashboard)/phd/candidates/page.tsx
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
  id: number;
  candidate_id?: number;
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
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

interface ProgrammeOption {
  id: number;
  code: string;
  name: string;
}

interface CurrentUser {
  id: number;
  role: string;
  department_id?: number;
}

const ALL_STATUSES = Object.keys(CANDIDATE_STATUS_LABELS) as CandidateStatus[];

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  hod: 'Head of Department',
  lecturer: 'Lecturer',
  professor: 'Professor',
  external_examiner: 'External Examiner',
};

export default function CandidatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0, page: 1, limit: 20, total_pages: 1,
  });
  const [programmes, setProgrammes] = useState<ProgrammeOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [statusFilter, setStatusFilter] = useState<CandidateStatus | ''>(
    (searchParams.get('status') as CandidateStatus) ?? '',
  );
  const [programmeFilter, setProgrammeFilter] = useState(searchParams.get('programme_id') ?? '');
  const [page, setPage] = useState(Number(searchParams.get('page') ?? 1));

  // Fetch current user role
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => setCurrentUser(d.user ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/phd/programmes')
      .then(r => r.json())
      .then(d => setProgrammes(d.programmes ?? []))
      .catch(() => {});
  }, []);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter) params.set('status', statusFilter);
      if (programmeFilter) params.set('programme_id', programmeFilter);
      params.set('page', String(page));
      params.set('limit', '20');

      // Lecturers/professors/external examiners see only their assigned candidates
      const isEvaluatorOnly = currentUser && !['admin', 'hod'].includes(currentUser.role);
      const endpoint = isEvaluatorOnly
        ? `/api/phd/my-candidates?${params.toString()}`
        : `/api/phd/candidates?${params.toString()}`;

      const res = await fetch(endpoint);
      if (res.status === 401) { router.push('/auth/login'); return; }
      if (res.ok) {
        const d = await res.json();
        setCandidates(d.candidates ?? d.data ?? []);
        setPagination(d.pagination ?? { total: 0, page: 1, limit: 20, total_pages: 1 });
      }
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, programmeFilter, page, currentUser]);

  useEffect(() => {
    if (currentUser !== null) fetchCandidates();
  }, [fetchCandidates, currentUser]);

  const handleSearchChange = (value: string) => { setSearch(value); setPage(1); };
  const handleStatusChange = (value: CandidateStatus | '') => { setStatusFilter(value); setPage(1); };
  const handleProgrammeChange = (value: string) => { setProgrammeFilter(value); setPage(1); };

  const clearFilters = () => { setSearch(''); setStatusFilter(''); setProgrammeFilter(''); setPage(1); };
  const hasActiveFilters = search || statusFilter || programmeFilter;

  const isHodOrAdmin = currentUser && ['admin', 'hod'].includes(currentUser.role);
  const isEvaluatorOnly = currentUser && !['admin', 'hod'].includes(currentUser.role);

  const pageTitle = isEvaluatorOnly ? 'My Assigned Candidates' : 'PhD Candidates';
  const pageDesc = isEvaluatorOnly
    ? 'Candidates assigned to you for supervision or examination.'
    : currentUser?.role === 'hod'
      ? 'All PhD candidates in your department.'
      : 'All registered PhD candidates.';

  return (
    <div className="space-y-6 lg:pl-64">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            👨‍🎓 {pageTitle}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {loading ? 'Loading…' : `${pagination.total} candidate${pagination.total !== 1 ? 's' : ''} — ${pageDesc}`}
          </p>
        </div>
        {/* Only HOD and Admin can register candidates */}
        {isHodOrAdmin && (
          <Link
            href="/phd/candidates/new"
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            + Register Candidate
          </Link>
        )}
      </div>

      {/* Role badge */}
      {currentUser && (
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            Viewing as: {ROLE_LABELS[currentUser.role] ?? currentUser.role}
          </span>
          {isEvaluatorOnly && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              ⚠️ You can only see candidates assigned to you
            </span>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[220px] flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search name, reg. number, thesis…"
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-4 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
          </div>

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

          {/* Programme filter only for HOD/Admin */}
          {isHodOrAdmin && (
            <select
              value={programmeFilter}
              onChange={(e) => handleProgrammeChange(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Programmes</option>
              {programmes.map((p) => (
                <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
              ))}
            </select>
          )}

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

      {/* Table */}
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
                : isEvaluatorOnly
                  ? 'No candidates are assigned to you yet.'
                  : 'No candidates registered yet.'}
            </p>
            {hasActiveFilters ? (
              <button onClick={clearFilters} className="mt-3 text-sm text-emerald-600 hover:underline dark:text-emerald-400">
                Clear filters
              </button>
            ) : isHodOrAdmin ? (
              <Link href="/phd/candidates/new" className="mt-3 inline-block text-sm text-emerald-600 hover:underline dark:text-emerald-400">
                Register the first candidate →
              </Link>
            ) : null}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Candidate</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Programme</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Supervisor</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Thesis</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Vivás</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {candidates.map((c) => {
                    const cId = c.candidate_id ?? c.id;
                    return (
                      <tr key={cId} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900 dark:text-white">{c.candidate_name}</p>
                          <p className="mt-0.5 font-mono text-xs text-gray-500 dark:text-gray-400">{c.registration_number}</p>
                          <p className="mt-1 max-w-xs truncate text-xs italic text-gray-400 dark:text-gray-500">{c.thesis_title}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{c.programme_code}</p>
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 max-w-[160px] truncate">{c.programme_name}</p>
                        </td>
                        <td className="px-6 py-4">
                          {c.supervisor_name ? (
                            <>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{c.supervisor_name}</p>
                              {c.co_supervisor_name && (
                                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">+ {c.co_supervisor_name}</p>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${CANDIDATE_STATUS_COLORS[c.status]}`}>
                            {CANDIDATE_STATUS_LABELS[c.status]}
                          </span>
                          {c.enrolment_year && (
                            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Enrolled {c.enrolment_year}</p>
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
                          <Link
                            href={`/phd/candidates/${cId}`}
                            className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-gray-200 md:hidden dark:divide-gray-700">
              {candidates.map((c) => {
                const cId = c.candidate_id ?? c.id;
                return (
                  <Link key={cId} href={`/phd/candidates/${cId}`} className="block p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">{c.candidate_name}</p>
                        <p className="mt-0.5 font-mono text-xs text-gray-500 dark:text-gray-400">{c.registration_number}</p>
                        <p className="mt-1 truncate text-xs italic text-gray-400 dark:text-gray-500">{c.thesis_title}</p>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                          {c.programme_code} · {c.supervisor_name ?? 'No supervisor'}
                        </p>
                      </div>
                      <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${CANDIDATE_STATUS_COLORS[c.status]}`}>
                        {CANDIDATE_STATUS_LABELS[c.status]}
                      </span>
                    </div>
                    <div className="mt-2 flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>📄 {c.thesis_count} thesis version{c.thesis_count !== 1 ? 's' : ''}</span>
                      <span>📅 {c.viva_count} viva{c.viva_count !== 1 ? 's' : ''}</span>
                      {c.enrolment_year && <span>🎓 Enrolled {c.enrolment_year}</span>}
                    </div>
                  </Link>
                );
              })}
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
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              ← Prev
            </button>
            <div className="flex gap-1">
              {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === pagination.total_pages || Math.abs(p - page) <= 1)
                .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span key={`e-${idx}`} className="px-1 py-1.5 text-sm text-gray-400">…</span>
                  ) : (
                    <button key={item} onClick={() => setPage(item as number)}
                      className={`min-w-[32px] rounded-lg px-2 py-1.5 text-sm font-medium transition-colors ${page === item ? 'bg-emerald-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                      {item}
                    </button>
                  )
                )}
            </div>
            <button onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))} disabled={page >= pagination.total_pages}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
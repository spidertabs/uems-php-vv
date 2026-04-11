// src/app/(dashboard)/phd/candidates/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CANDIDATE_STATUS_LABELS,
  CANDIDATE_STATUS_COLORS,
  type CandidateStatus,
  type CandidateWithDetails,
} from '@/types/phd';

interface Programme {
  id: number;
  code: string;
  name: string;
}

export default function CandidatesPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<CandidateWithDetails[]>([]);
  const [filtered, setFiltered] = useState<CandidateWithDetails[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<CandidateStatus | 'all'>('all');
  const [filterProgramme, setFilterProgramme] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [search, filterStatus, filterProgramme, candidates]);

  const fetchData = async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        fetch('/api/phd/candidates'),
        fetch('/api/phd/programmes'),
      ]);
      if (cRes.status === 401) { router.push('/auth/login'); return; }
      if (cRes.ok) { const d = await cRes.json(); setCandidates(d.candidates || []); }
      if (pRes.ok) { const d = await pRes.json(); setProgrammes(d.programmes || []); }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let list = [...candidates];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.candidate_name.toLowerCase().includes(q) ||
          c.registration_number.toLowerCase().includes(q) ||
          c.thesis_title.toLowerCase().includes(q),
      );
    }
    if (filterStatus !== 'all') list = list.filter((c) => c.status === filterStatus);
    if (filterProgramme !== 'all') list = list.filter((c) => c.programme_id.toString() === filterProgramme);
    setFiltered(list);
  };

  const statusCounts = Object.keys(CANDIDATE_STATUS_LABELS).reduce(
    (acc, s) => {
      acc[s as CandidateStatus] = candidates.filter((c) => c.status === s).length;
      return acc;
    },
    {} as Record<CandidateStatus, number>,
  );

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">👨‍🎓 PhD Candidates</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <Link
          href="/phd/candidates/new"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-white transition-colors hover:bg-emerald-700"
        >
          + Register Candidate
        </Link>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {(Object.entries(CANDIDATE_STATUS_LABELS) as [CandidateStatus, string][]).map(([status, label]) => (
          <button
            key={status}
            onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}
            className={`rounded-lg border p-3 text-center transition-all hover:shadow-md ${
              filterStatus === status
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
            }`}
          >
            <div className="text-xl font-bold text-gray-900 dark:text-white">{statusCounts[status]}</div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-tight">{label}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, reg number, or thesis title..."
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as CandidateStatus | 'all')}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Statuses</option>
              {(Object.entries(CANDIDATE_STATUS_LABELS) as [CandidateStatus, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Programme</label>
            <select
              value={filterProgramme}
              onChange={(e) => setFilterProgramme(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Programmes</option>
              {programmes.map((p) => (
                <option key={p.id} value={p.id.toString()}>{p.code} — {p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Reg. No.</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Candidate</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Programme</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Supervisor</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Enrolled</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.length > 0 ? (
                filtered.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                        {c.registration_number}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/phd/candidates/${c.id}`}
                        className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                      >
                        {c.candidate_name}
                      </Link>
                      <p className="mt-0.5 max-w-xs truncate text-xs text-gray-500 dark:text-gray-400">
                        {c.thesis_title}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {c.programme_code}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {c.supervisor_name || <span className="italic text-gray-400">Unassigned</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {c.enrolment_year || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${CANDIDATE_STATUS_COLORS[c.status]}`}>
                        {CANDIDATE_STATUS_LABELS[c.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/phd/candidates/${c.id}`}
                        className="rounded-lg bg-emerald-100 px-3 py-1 text-sm text-emerald-700 transition-colors hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-200"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-5xl">👨‍🎓</div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">No candidates found</p>
                    {search || filterStatus !== 'all' || filterProgramme !== 'all' ? (
                      <button
                        onClick={() => { setSearch(''); setFilterStatus('all'); setFilterProgramme('all'); }}
                        className="mt-2 text-sm text-emerald-600 hover:underline dark:text-emerald-400"
                      >
                        Clear filters
                      </button>
                    ) : null}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-3 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {filtered.length} of {candidates.length} candidates
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
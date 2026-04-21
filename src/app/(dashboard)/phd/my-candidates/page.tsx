/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CANDIDATE_STATUS_LABELS,
  CANDIDATE_STATUS_COLORS,
  type CandidateStatus,
} from '@/types/phd';

interface AssignedCandidate {
  id: number;
  registration_number: string;
  thesis_title: string;
  candidate_name: string;
  candidate_email: string;
  programme_name: string;
  status: CandidateStatus;
  upcoming_vivas: number;
  pending_evaluations: number;
  enrolment_year: number | null;
  updated_at: string;
}

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export default function MyPhDCandidatesPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<AssignedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    limit: 10,
    offset: 0,
    hasMore: false,
  });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchCandidates();
  }, [statusFilter, currentPage]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('limit', pagination.limit.toString());
      params.append('offset', ((currentPage - 1) * pagination.limit).toString());
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/phd/my-candidates?${params.toString()}`);

      if (response.status === 401) {
        router.push('/auth/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch candidates');
      }

      const result = await response.json();
      setCandidates(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: CandidateStatus): string => {
    return CANDIDATE_STATUS_COLORS[status] || 'bg-gray-200';
  };

  const getStatusLabel = (status: CandidateStatus): string => {
    return CANDIDATE_STATUS_LABELS[status] || status;
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My PhD Candidates</h1>
        <p className="text-gray-600">
          Manage and evaluate PhD candidates you are supervising
        </p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm text-gray-600">Total Candidates</div>
          <div className="text-2xl font-bold text-blue-600">{pagination.total}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-sm text-gray-600">Active Vivas</div>
          <div className="text-2xl font-bold text-green-600">
            {candidates.reduce((sum, c) => sum + c.upcoming_vivas, 0)}
          </div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="text-sm text-gray-600">Pending Evaluations</div>
          <div className="text-2xl font-bold text-orange-600">
            {candidates.reduce((sum, c) => sum + c.pending_evaluations, 0)}
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="text-sm text-gray-600">Enrolled</div>
          <div className="text-2xl font-bold text-purple-600">
            {candidates.filter((c) => c.status === 'enrolled').length}
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="mb-6 flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="enrolled">Enrolled</option>
          <option value="thesis_submitted">Thesis Submitted</option>
          <option value="viva_scheduled">Viva Scheduled</option>
          <option value="viva_completed">Viva Completed</option>
          <option value="corrections_pending">Corrections Pending</option>
          <option value="corrections_submitted">Corrections Submitted</option>
          <option value="awarded">Awarded</option>
          <option value="withdrawn">Withdrawn</option>
        </select>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Loading candidates...</div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
          Error: {error}
        </div>
      ) : candidates.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-500 mb-2">No candidates found</div>
          <p className="text-sm text-gray-400">
            {statusFilter
              ? 'Try changing the filter'
              : 'You have not been assigned any PhD candidates yet.'}
          </p>
        </div>
      ) : (
        <>
          {/* Candidates Table */}
          <div className="overflow-x-auto bg-white border rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Registration #
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Candidate
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Programme
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Thesis Title
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Vivas
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate) => (
                  <tr
                    key={candidate.id}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-mono text-gray-700">
                      {candidate.registration_number}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {candidate.candidate_name}
                      </div>
                      <div className="text-sm text-gray-500">{candidate.candidate_email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {candidate.programme_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                      <div className="truncate" title={candidate.thesis_title}>
                        {candidate.thesis_title}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          candidate.status
                        )} text-gray-800`}
                      >
                        {getStatusLabel(candidate.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {candidate.upcoming_vivas > 0 ? (
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          {candidate.upcoming_vivas} upcoming
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link
                        href={`/phd/candidates/${candidate.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * pagination.limit + 1} to{' '}
                {Math.min(currentPage * pagination.limit, pagination.total)} of{' '}
                {pagination.total}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!pagination.hasMore}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

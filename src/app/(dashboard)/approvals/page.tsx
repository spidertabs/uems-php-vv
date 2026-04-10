/* eslint-disable react-hooks/exhaustive-deps */
// src/app/approvals/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PendingPaper {
  id: number;
  paper_code: string;
  status: string;
  exam_type: string;
  course_code: string;
  course_title: string;
  lecturer_name: string;
  submitted_at: string;
  department_name: string;
  total_marks: number;
  duration: number;
  exam_date: string;
  programmes: string;
  academic_year: number;
  semester: number;
}

interface ApprovalStats {
  pending: number;
  approved_today: number;
  rejected_today: number;
  total_processed: number;
}

export default function ApprovalsPage() {
  const router = useRouter();
  const [papers, setPapers] = useState<PendingPaper[]>([]);
  const [stats, setStats] = useState<ApprovalStats>({
    pending: 0,
    approved_today: 0,
    rejected_today: 0,
    total_processed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'hod_review' | 'dean_review'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    fetchApprovals();
  }, [filter]);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const url = `/api/approvals${filter !== 'all' ? `?status=${filter}` : ''}`;
      const response = await fetch(url);

      if (response.status === 401) {
        router.push('/auth/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setPapers(data.data || []);
        setStats(data.stats || stats);
        setUserRole(data.userRole || '');
      }
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (paperId: number) => {
    if (!confirm('Approve this exam paper?')) return;

    try {
      const response = await fetch(`/api/approvals/${paperId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comments: 'Approved',
        }),
      });

      if (response.ok) {
        alert('Paper approved successfully');
        fetchApprovals();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to approve paper');
      }
    } catch (error) {
      console.error('Failed to approve paper:', error);
      alert('Failed to approve paper');
    }
  };

  const handleReject = async (paperId: number) => {
    const comments = prompt('Enter rejection reason:');
    if (!comments || comments.trim() === '') {
      alert('Rejection reason is required');
      return;
    }

    try {
      const response = await fetch(`/api/approvals/${paperId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments }),
      });

      if (response.ok) {
        alert('Paper rejected and returned to lecturer');
        fetchApprovals();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to reject paper');
      }
    } catch (error) {
      console.error('Failed to reject paper:', error);
      alert('Failed to reject paper');
    }
  };

  const filteredPapers = papers.filter(
    (paper) =>
      paper.paper_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paper.course_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paper.lecturer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      submitted: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Submitted' },
      hod_review: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'HOD Review' },
      dean_review: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Dean Review' },
      hod_approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'HOD Approved' },
    };

    const badge = badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };

    return (
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getExamTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      TEST: 'bg-blue-500',
      CAT: 'bg-purple-500',
      FINAL: 'bg-red-500',
    };

    return (
      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-white ${colors[type] || 'bg-gray-500'}`}>
        {type}
      </span>
    );
  };

  const canApprove = (paper: PendingPaper) => {
    if (userRole === 'hod') {
      return ['submitted', 'hod_review'].includes(paper.status);
    }
    if (userRole === 'dean') {
      return ['hod_approved', 'dean_review'].includes(paper.status);
    }
    return false;
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:pl-64">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            ✅ Approvals
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {userRole === 'hod' ? 'Review and approve exam papers from your department' : 'Review and approve exam papers from your college'}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pending Review
              </p>
              <p className="mt-2 text-3xl font-bold text-orange-600 dark:text-orange-400">
                {stats.pending}
              </p>
            </div>
            <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900/20">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Approved Today
              </p>
              <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
                {stats.approved_today}
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Rejected Today
              </p>
              <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
                {stats.rejected_today}
              </p>
            </div>
            <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
              <span className="text-2xl">❌</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Processed
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {stats.total_processed}
              </p>
            </div>
            <div className="rounded-full bg-gray-100 p-3 dark:bg-gray-700">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white'
            }`}
          >
            All Papers
          </button>
          {userRole === 'hod' && (
            <button
              onClick={() => setFilter('hod_review')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                filter === 'hod_review'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white'
              }`}
            >
              HOD Review
            </button>
          )}
          {userRole === 'dean' && (
            <button
              onClick={() => setFilter('dean_review')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                filter === 'dean_review'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white'
              }`}
            >
              Dean Review
            </button>
          )}
        </div>

        <input
          type="text"
          placeholder="Search papers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* Papers List */}
      <div className="space-y-4">
        {filteredPapers.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-md dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 text-6xl">📭</div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              No Papers Pending Approval
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              There are no exam papers waiting for your review at the moment.
            </p>
          </div>
        ) : (
          filteredPapers.map((paper) => (
            <div
              key={paper.id}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-md transition hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-3 flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {paper.paper_code}
                    </h3>
                    {getStatusBadge(paper.status)}
                    {getExamTypeBadge(paper.exam_type)}
                  </div>

                  <p className="mb-2 text-gray-900 dark:text-white">
                    <strong>Course:</strong> {paper.course_code} - {paper.course_title}
                  </p>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <p><strong>Lecturer:</strong> {paper.lecturer_name}</p>
                      <p><strong>Department:</strong> {paper.department_name}</p>
                      <p><strong>Programmes:</strong> {paper.programmes}</p>
                    </div>
                    <div>
                      <p><strong>Exam Date:</strong> {new Date(paper.exam_date).toLocaleDateString()}</p>
                      <p><strong>Duration:</strong> {paper.duration} minutes</p>
                      <p><strong>Total Marks:</strong> {paper.total_marks}</p>
                      <p><strong>Submitted:</strong> {new Date(paper.submitted_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="ml-4 flex flex-col gap-2">
                  <Link
                    href={`/exam-papers/${paper.id}/preview`}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    👁️ Review
                  </Link>

                  {canApprove(paper) && (
                    <>
                      <button
                        onClick={() => handleApprove(paper.id)}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => handleReject(paper.id)}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                      >
                        ❌ Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
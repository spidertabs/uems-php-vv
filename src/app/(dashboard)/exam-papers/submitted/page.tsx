// src/app/exam-papers/submitted/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ExamPaper {
  id: number;
  paper_code: string;
  course_code: string;
  course_title: string;
  exam_type: string;
  academic_year: number;
  semester: number;
  status: string;
  total_marks: number;
  created_by_name: string;
  submitted_at: string;
  exam_date: string | null;
}

export default function SubmittedPapersPage() {
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    try {
      const response = await fetch('/api/exam-papers');
      if (response.ok) {
        const data = await response.json();
        // Filter only submitted and beyond
        const submittedPapers = (data.papers || []).filter(
          (p: ExamPaper) => 
            p.status !== 'draft' && 
            p.submitted_at !== null
        );
        setPapers(submittedPapers);
      }
    } catch (error) {
      console.error('Failed to fetch papers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPapers = papers.filter((paper) => {
    const matchesSearch =
      paper.paper_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.course_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.course_title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || paper.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const statusColors: { [key: string]: string } = {
    submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    hod_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    hod_approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    hod_rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    dean_review: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    dean_approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    dean_rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    ready_for_print: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    printing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    printed: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    published: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  };

  const examTypeColors: { [key: string]: string } = {
    TEST: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    CAT: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    FINAL: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  // Statistics
  const stats = {
    total: filteredPapers.length,
    pending: filteredPapers.filter(p => 
      p.status === 'submitted' || p.status === 'hod_review' || p.status === 'dean_review'
    ).length,
    approved: filteredPapers.filter(p => 
      p.status === 'hod_approved' || p.status === 'dean_approved' || p.status === 'ready_for_print'
    ).length,
    rejected: filteredPapers.filter(p => 
      p.status === 'hod_rejected' || p.status === 'dean_rejected'
    ).length,
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center lg:pl-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:pl-64">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Submitted Papers
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track and manage submitted examination papers
          </p>
        </div>

        <Link
          href="/exam-papers"
          className="whitespace-nowrap rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          ← All Papers
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.total}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Submitted
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {stats.pending}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Pending Review
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.approved}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Approved</div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {stats.rejected}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Rejected</div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by paper code, course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="hod_review">HOD Review</option>
              <option value="hod_approved">HOD Approved</option>
              <option value="hod_rejected">HOD Rejected</option>
              <option value="dean_review">Dean Review</option>
              <option value="dean_approved">Dean Approved</option>
              <option value="ready_for_print">Ready for Print</option>
              <option value="printed">Printed</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterStatus('all');
            }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Papers List */}
      {filteredPapers.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-6xl">📄</div>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No submitted papers found
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Papers will appear here once they are submitted for approval
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPapers.map((paper) => (
            <div
              key={paper.id}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {paper.paper_code}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        examTypeColors[paper.exam_type]
                      }`}
                    >
                      {paper.exam_type}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        statusColors[paper.status]
                      }`}
                    >
                      {paper.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      {paper.total_marks} marks
                    </span>
                  </div>

                  <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                    {paper.course_code} - {paper.course_title}
                  </h3>

                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>AY {paper.academic_year}</span>
                    <span>•</span>
                    <span>Semester {paper.semester}</span>
                    <span>•</span>
                    <span>By {paper.created_by_name}</span>
                    <span>•</span>
                    <span>
                      Submitted: {new Date(paper.submitted_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="ml-4 flex gap-2">
                  <Link
                    href={`/exam-papers/${paper.id}`}
                    className="rounded-lg border border-blue-300 px-3 py-1.5 text-sm font-medium text-blue-700 transition hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/20"
                  >
                    View Details
                  </Link>
                  <Link
                    href={`/exam-papers/${paper.id}/preview`}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Preview
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
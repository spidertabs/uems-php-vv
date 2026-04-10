/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/(dashboard)/exam-papers/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ExamPaper } from '@/types';

interface ExamPaperWithDetails extends ExamPaper {
  course_code: string;
  course_title: string;
  created_by_name: string;
  hod_name: string | null;
  dean_name: string | null;
  programmes?: string;
}

interface User {
  role: string;
  id: number;
  first_name: string;
  last_name: string;
}

export default function ExamPapersPage() {
  const [papers, setPapers] = useState<ExamPaperWithDetails[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterExamType, setFilterExamType] = useState<string>('all');
  const [filterSemester, setFilterSemester] = useState<string>('all');
  const [filterAcademicYear, setFilterAcademicYear] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userRes, papersRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/exam-papers'),
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
      }

      if (papersRes.ok) {
        const papersData = await papersRes.json();
        setPapers(papersData.papers || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (paperId: number) => {
    if (!confirm('Are you sure you want to delete this exam paper? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/exam-papers/${paperId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPapers(papers.filter((p) => p.id !== paperId));
        alert('Exam paper deleted successfully');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete exam paper');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete exam paper');
    }
  };

  const filteredPapers = papers.filter((paper) => {
    const matchesSearch =
      paper.paper_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.course_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.course_title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || paper.status === filterStatus;
    const matchesExamType = filterExamType === 'all' || paper.exam_type === filterExamType;
    const matchesSemester = filterSemester === 'all' || paper.semester.toString() === filterSemester;
    const matchesAcademicYear = filterAcademicYear === 'all' || paper.academic_year.toString() === filterAcademicYear;

    return matchesSearch && matchesStatus && matchesExamType && matchesSemester && matchesAcademicYear;
  });

  // Get unique academic years and semesters from papers
  const academicYears = Array.from(new Set(papers.map((p) => p.academic_year))).sort((a, b) => b - a);
  const semesters = Array.from(new Set(papers.map((p) => p.semester))).sort((a, b) => a - b);

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    hod_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    hod_approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    hod_rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    dean_review: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    dean_approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    dean_rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    ready_for_print: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    printing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    printed: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    published: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
  };

  const examTypeColors: Record<string, string> = {
    TEST: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    CAT: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    FINAL: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterExamType('all');
    setFilterSemester('all');
    setFilterAcademicYear('all');
  };

  const hasActiveFilters = searchQuery || filterStatus !== 'all' || filterExamType !== 'all' || 
    filterSemester !== 'all' || filterAcademicYear !== 'all';

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Exam Papers</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Create and manage examination papers
          </p>
        </div>

        <Link
          href="/exam-papers/create"
          className="whitespace-nowrap rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          ➕ Create Paper
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {papers.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Papers</div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {papers.filter((p) => p.status === 'draft').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Drafts</div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {papers.filter((p) => 
              p.status === 'submitted' || 
              p.status === 'hod_review' || 
              p.status === 'dean_review'
            ).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Under Review</div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {papers.filter((p) => 
              p.status === 'hod_approved' || 
              p.status === 'dean_approved' || 
              p.status === 'published' ||
              p.status === 'ready_for_print' ||
              p.status === 'printed'
            ).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Approved</div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* Search */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by paper code, course code, or course title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="hod_review">HOD Review</option>
                <option value="hod_approved">HOD Approved</option>
                <option value="hod_rejected">HOD Rejected</option>
                <option value="dean_review">Dean Review</option>
                <option value="dean_approved">Dean Approved</option>
                <option value="dean_rejected">Dean Rejected</option>
                <option value="ready_for_print">Ready for Print</option>
                <option value="printing">Printing</option>
                <option value="printed">Printed</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Exam Type
              </label>
              <select
                value={filterExamType}
                onChange={(e) => setFilterExamType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Types</option>
                <option value="TEST">Test</option>
                <option value="CAT">CAT</option>
                <option value="FINAL">Final Exam</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Academic Year
              </label>
              <select
                value={filterAcademicYear}
                onChange={(e) => setFilterAcademicYear(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Years</option>
                {academicYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Semester
              </label>
              <select
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Semesters</option>
                {semesters.map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-2 dark:bg-blue-900/20">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Showing <strong>{filteredPapers.length}</strong> of <strong>{papers.length}</strong> papers
          </p>
        </div>
      )}

      {/* Papers List */}
      {filteredPapers.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-6xl">📄</div>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            {hasActiveFilters ? 'No papers match your filters' : 'No exam papers found'}
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {hasActiveFilters
              ? 'Try adjusting your search criteria'
              : 'Get started by creating your first exam paper'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPapers.map((paper) => (
            <div
              key={paper.id}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Badges */}
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {paper.paper_code}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        examTypeColors[paper.exam_type] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {paper.exam_type}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        statusColors[paper.status] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {paper.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      {paper.total_marks} marks
                    </span>
                    {paper.duration && (
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        {paper.duration} min
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                    {paper.course_code} - {paper.course_title}
                  </h3>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      📅 AY {paper.academic_year}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      📚 Semester {paper.semester}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      👤 {paper.created_by_name}
                    </span>
                    {paper.hod_name && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          👔 HOD: {paper.hod_name}
                        </span>
                      </>
                    )}
                    {paper.exam_date && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          🗓️ {formatDate(paper.exam_date)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row">
                  <Link
                    href={`/exam-papers/${paper.id}`}
                    className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-600 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                  >
                    View
                  </Link>
                  {paper.status === 'draft' && (
                    <>
                      <Link
                        href={`/exam-papers/${paper.id}/edit`}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(paper.id)}
                        className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-600 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
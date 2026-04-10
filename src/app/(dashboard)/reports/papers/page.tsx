/* eslint-disable react-hooks/exhaustive-deps */
// src/app/reports/papers/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PaperReport {
  id?: number;
  paper_code?: string;
  exam_type?: string;
  status?: string;
  academic_year?: number;
  semester?: number;
  total_marks?: number;
  exam_date?: string;
  created_at?: string;
  submitted_at?: string;
  hod_approved_at?: string;
  course_code?: string;
  course_title?: string;
  department_name?: string;
  college_name?: string;
  created_by_name?: string;
  hod_name?: string;
  programmes?: string;
  // Department report
  total_papers?: number;
  draft_papers?: number;
  pending_papers?: number;
  approved_papers?: number;
  printed_papers?: number;
  total_courses?: number;
  // Lecturer report
  lecturer_name?: string;
  email?: string;
  rejected_papers?: number;
  // Status report
  count?: number;
  avg_days_to_submit?: number;
  avg_days_to_hod_approval?: number;
}

export default function PapersReportPage() {
  const router = useRouter();
  const [reports, setReports] = useState<PaperReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<'summary' | 'by_department' | 'by_lecturer' | 'by_status'>('summary');
  const [filters, setFilters] = useState({
    academic_year: '',
    semester: '',
    exam_type: '',
    status: '',
    college_id: '',
    department_id: '',
  });

  useEffect(() => {
    fetchReport();
  }, [reportType, filters]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: reportType,
        ...(filters.academic_year && { academic_year: filters.academic_year }),
        ...(filters.semester && { semester: filters.semester }),
        ...(filters.exam_type && { exam_type: filters.exam_type }),
        ...(filters.status && { status: filters.status }),
        ...(filters.college_id && { college_id: filters.college_id }),
        ...(filters.department_id && { department_id: filters.department_id }),
      });

      const response = await fetch(`/api/reports/papers?${params}`);

      if (response.status === 401) {
        router.push('/auth/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setReports(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      academic_year: '',
      semester: '',
      exam_type: '',
      status: '',
      college_id: '',
      department_id: '',
    });
  };

  const exportToCSV = () => {
    if (reports.length === 0) return;

    const headers = Object.keys(reports[0]).join(',');
    const rows = reports.map(row => 
      Object.values(row).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(',')
    );
    
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `papers_report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
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
          <div className="flex items-center gap-2">
            <Link href="/reports" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
              📊 Reports
            </Link>
            <span className="text-gray-400">/</span>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              📄 Papers Report
            </h1>
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Detailed analysis of exam papers across the system
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
        >
          📥 Export CSV
        </button>
      </div>

      {/* Report Type Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        <button
          onClick={() => setReportType('summary')}
          className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
            reportType === 'summary'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white'
          }`}
        >
          📋 Summary
        </button>
        <button
          onClick={() => setReportType('by_department')}
          className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
            reportType === 'by_department'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white'
          }`}
        >
          🏢 By Department
        </button>
        <button
          onClick={() => setReportType('by_lecturer')}
          className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
            reportType === 'by_lecturer'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white'
          }`}
        >
          👤 By Lecturer
        </button>
        <button
          onClick={() => setReportType('by_status')}
          className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
            reportType === 'by_status'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white'
          }`}
        >
          📊 By Status
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Academic Year
            </label>
            <input
              type="number"
              placeholder="e.g., 2024"
              value={filters.academic_year}
              onChange={(e) => handleFilterChange('academic_year', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Semester
            </label>
            <select
              value={filters.semester}
              onChange={(e) => handleFilterChange('semester', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Semesters</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Exam Type
            </label>
            <select
              value={filters.exam_type}
              onChange={(e) => handleFilterChange('exam_type', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Types</option>
              <option value="TEST">TEST</option>
              <option value="CAT">CAT</option>
              <option value="FINAL">FINAL</option>
            </select>
          </div>

          {reportType === 'summary' && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="hod_review">HOD Review</option>
                <option value="hod_approved">HOD Approved</option>
                <option value="dean_review">Dean Review</option>
                <option value="dean_approved">Dean Approved</option>
                <option value="ready_for_print">Ready for Print</option>
                <option value="printed">Printed</option>
              </select>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={clearFilters}
            className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-300 dark:bg-gray-700 dark:text-white"
          >
            Clear Filters
          </button>
          <button
            onClick={fetchReport}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Report Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          {reportType === 'summary' && (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Paper Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Year/Sem
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {reports.map((paper) => (
                  <tr key={paper.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {paper.paper_code}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {paper.course_code} - {paper.course_title}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-white ${
                        paper.exam_type === 'TEST' ? 'bg-blue-500' :
                        paper.exam_type === 'CAT' ? 'bg-purple-500' : 'bg-red-500'
                      }`}>
                        {paper.exam_type}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {paper.status?.replace(/_/g, ' ').toUpperCase()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {paper.created_by_name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {paper.department_name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {paper.academic_year}/{paper.semester}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'by_department' && (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    College
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Total Papers
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Draft
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Pending
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Approved
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Printed
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {reports.map((dept, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {dept.department_name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {dept.college_name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                      {dept.total_papers}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300">
                      {dept.draft_papers}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-orange-600 dark:text-orange-400">
                      {dept.pending_papers}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-green-600 dark:text-green-400">
                      {dept.approved_papers}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-blue-600 dark:text-blue-400">
                      {dept.printed_papers}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'by_lecturer' && (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Lecturer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Department
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Total
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Approved
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Rejected
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Success Rate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {reports.map((lecturer, index) => {
                  const successRate = lecturer.total_papers && lecturer.total_papers > 0
                    ? ((lecturer.approved_papers || 0) / lecturer.total_papers * 100).toFixed(1)
                    : '0';
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {lecturer.lecturer_name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {lecturer.email}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {lecturer.department_name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        {lecturer.total_papers}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-green-600 dark:text-green-400">
                        {lecturer.approved_papers}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-red-600 dark:text-red-400">
                        {lecturer.rejected_papers}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {successRate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {reportType === 'by_status' && (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Count
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Avg Days to Submit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Avg Days to HOD Approval
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {reports.map((status, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {status.status?.replace(/_/g, ' ').toUpperCase()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                      {status.count}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300">
                      {status.avg_days_to_submit ? `${status.avg_days_to_submit.toFixed(1)} days` : 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300">
                      {status.avg_days_to_hod_approval ? `${status.avg_days_to_hod_approval.toFixed(1)} days` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {reports.length === 0 && (
          <div className="p-12 text-center">
            <div className="mb-4 text-6xl">📭</div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              No Data Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No papers found matching your criteria. Try adjusting the filters.
            </p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {reports.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Report Summary
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{reports.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Records</p>
            </div>
            {reportType === 'by_lecturer' && (
              <>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {reports.reduce((sum, r) => sum + (r.approved_papers || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Approved</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {reports.reduce((sum, r) => sum + (r.rejected_papers || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Rejected</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {reports.reduce((sum, r) => sum + (r.total_papers || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">All Papers</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
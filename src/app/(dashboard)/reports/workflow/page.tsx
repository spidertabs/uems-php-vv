/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
// src/app/reports/workflow/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface WorkflowReport {
  status?: string; count?: number; avg_days_in_status?: number; min_days?: number; max_days?: number;
  paper_code?: string; course_code?: string; course_title?: string; current_status?: string; days_in_current_status?: number;
  created_by_name?: string; department_name?: string; last_updated?: string; approver_id?: number; approver_name?: string;
  role?: string; total_approvals?: number; avg_approval_time?: number; pending_approvals?: number; rejected_papers?: number;
  approval_rate?: number; activity_date?: string; papers_created?: number; papers_submitted?: number; papers_approved?: number;
  papers_rejected?: number; papers_printed?: number; exam_type?: string; total_rejected?: number; avg_rejection_time?: number;
  resubmission_rate?: number;
}

export default function WorkflowReportPage() {
  const router = useRouter();
  const [reports, setReports] = useState<WorkflowReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<'approval_timeline' | 'bottlenecks' | 'approver_performance' | 'activity_trends' | 'rejection_analysis'>('approval_timeline');
  const [filters, setFilters] = useState({ start_date: '', end_date: '', department_id: '', status: '' });

  useEffect(() => { fetchReport(); }, [reportType, filters]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: reportType,
        ...(filters.start_date && { start_date: filters.start_date }),
        ...(filters.end_date && { end_date: filters.end_date }),
        ...(filters.department_id && { department_id: filters.department_id }),
        ...(filters.status && { status: filters.status }),
      });
      const response = await fetch(`/api/reports/workflow?${params}`);
      if (response.status === 401) { router.push('/auth/login'); return; }
      if (response.ok) { const data = await response.json(); setReports(data.data || []); }
    } catch (error) { console.error('Failed to fetch report:', error); }
    finally { setLoading(false); }
  };

  const handleFilterChange = (key: string, value: string) => setFilters((prev) => ({ ...prev, [key]: value }));
  const clearFilters = () => setFilters({ start_date: '', end_date: '', department_id: '', status: '' });

  const exportToCSV = () => {
    if (reports.length === 0) return;
    const headers = Object.keys(reports[0]).join(',');
    const rows = reports.map(row => Object.values(row).map(val => typeof val === 'string' && val.includes(',') ? `"${val}"` : val).join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow_report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      hod_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      hod_approved: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      hod_rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      dean_review: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      dean_approved: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      ready_for_print: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400',
      printed: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateStr: string) => !dateStr ? 'N/A' : new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  if (loading) return <div className="flex h-96 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div></div>;

  return (
    <div className="space-y-6 lg:pl-64">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/reports" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">📊 Reports</Link>
            <span className="text-gray-400">/</span>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">🔄 Workflow Report</h1>
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Analyze approval processes and workflow efficiency</p>
        </div>
        <button onClick={exportToCSV} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700">📥 Export CSV</button>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {[['approval_timeline', '⏱️ Approval Timeline'], ['bottlenecks', '🚧 Bottlenecks'], ['approver_performance', '👥 Approver Performance'], 
          ['activity_trends', '📈 Activity Trends'], ['rejection_analysis', '❌ Rejection Analysis']].map(([type, label]) => (
          <button key={type} onClick={() => setReportType(type as any)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${reportType === type ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div><label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
            <input type="date" value={filters.start_date} onChange={(e) => handleFilterChange('start_date', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white" /></div>
          <div><label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
            <input type="date" value={filters.end_date} onChange={(e) => handleFilterChange('end_date', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white" /></div>
          <div><label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Department ID</label>
            <input type="number" placeholder="Enter department ID" value={filters.department_id} onChange={(e) => handleFilterChange('department_id', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white" /></div>
          {reportType === 'bottlenecks' && (
            <div><label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Status Filter</label>
              <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                <option value="">All Statuses</option><option value="submitted">Submitted</option><option value="hod_review">HOD Review</option>
                <option value="dean_review">Dean Review</option><option value="ready_for_print">Ready for Print</option>
              </select></div>
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={clearFilters} className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-300 dark:bg-gray-700 dark:text-white">Clear Filters</button>
          <button onClick={fetchReport} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">Apply Filters</button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          {reportType === 'approval_timeline' && (
            <table className="w-full"><thead className="bg-gray-50 dark:bg-gray-700"><tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Papers</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Avg Days</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Min Days</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Max Days</th>
            </tr></thead><tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {reports.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="whitespace-nowrap px-6 py-4"><span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(item.status || '')}`}>
                    {item.status?.replace(/_/g, ' ').toUpperCase()}</span></td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">{item.count}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-blue-600 dark:text-blue-400">{item.avg_days_in_status?.toFixed(1)} days</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-green-600 dark:text-green-400">{item.min_days?.toFixed(1)} days</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-red-600 dark:text-red-400">{item.max_days?.toFixed(1)} days</td>
                </tr>
              ))}
            </tbody></table>
          )}

          {reportType === 'bottlenecks' && (
            <table className="w-full"><thead className="bg-gray-50 dark:bg-gray-700"><tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Paper Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Course</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Days Stuck</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Created By</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Department</th>
            </tr></thead><tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {reports.map((paper, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{paper.paper_code}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{paper.course_code} - {paper.course_title}</td>
                  <td className="whitespace-nowrap px-6 py-4"><span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(paper.current_status || '')}`}>
                    {paper.current_status?.replace(/_/g, ' ').toUpperCase()}</span></td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm"><span className={`font-semibold ${(paper.days_in_current_status || 0) > 7 ? 'text-red-600 dark:text-red-400' : (paper.days_in_current_status || 0) > 3 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                    {paper.days_in_current_status} days</span></td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{paper.created_by_name}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{paper.department_name}</td>
                </tr>
              ))}
            </tbody></table>
          )}

          {reportType === 'approver_performance' && (
            <table className="w-full"><thead className="bg-gray-50 dark:bg-gray-700"><tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Approver</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Role</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Approvals</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Avg Time</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Pending</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Rejected</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Rate</th>
            </tr></thead><tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {reports.map((approver, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{approver.approver_name}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{approver.role?.toUpperCase()}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">{approver.total_approvals}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-blue-600 dark:text-blue-400">{approver.avg_approval_time?.toFixed(1)} days</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-orange-600 dark:text-orange-400">{approver.pending_approvals}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-red-600 dark:text-red-400">{approver.rejected_papers}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm"><span className={`font-semibold ${(approver.approval_rate || 0) >= 90 ? 'text-green-600 dark:text-green-400' : (approver.approval_rate || 0) >= 70 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                    {approver.approval_rate?.toFixed(1)}%</span></td>
                </tr>
              ))}
            </tbody></table>
          )}

          {reportType === 'activity_trends' && (
            <table className="w-full"><thead className="bg-gray-50 dark:bg-gray-700"><tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Created</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Submitted</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Approved</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Rejected</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Printed</th>
            </tr></thead><tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {reports.map((trend, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{formatDate(trend.activity_date || '')}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-blue-600 dark:text-blue-400">{trend.papers_created || 0}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-purple-600 dark:text-purple-400">{trend.papers_submitted || 0}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-green-600 dark:text-green-400">{trend.papers_approved || 0}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-red-600 dark:text-red-400">{trend.papers_rejected || 0}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-indigo-600 dark:text-indigo-400">{trend.papers_printed || 0}</td>
                </tr>
              ))}
            </tbody></table>
          )}

          {reportType === 'rejection_analysis' && (
            <table className="w-full"><thead className="bg-gray-50 dark:bg-gray-700"><tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Type</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Rejected</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Avg Time</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Resubmission</th>
            </tr></thead><tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {reports.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="whitespace-nowrap px-6 py-4"><span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(item.status || '')}`}>
                    {item.status?.replace(/_/g, ' ').toUpperCase()}</span></td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{item.exam_type}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-red-600 dark:text-red-400">{item.total_rejected}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-blue-600 dark:text-blue-400">{item.avg_rejection_time?.toFixed(1)} days</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-green-600 dark:text-green-400">{item.resubmission_rate?.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody></table>
          )}
        </div>

        {reports.length === 0 && (
          <div className="p-12 text-center">
            <div className="mb-4 text-6xl">📭</div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">No Data Available</h3>
            <p className="text-gray-600 dark:text-gray-400">No workflow data found matching your criteria.</p>
          </div>
        )}
      </div>

      {reports.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Summary</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="text-center"><p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{reports.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Records</p></div>
            {reportType === 'approval_timeline' && (
              <div className="text-center"><p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {reports.reduce((sum, r) => sum + (r.count || 0), 0)}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Papers</p></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
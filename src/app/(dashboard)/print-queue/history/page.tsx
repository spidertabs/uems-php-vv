// src/app/print-queue/history/page.tsx
/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PrintRecord {
  id: number;
  paper_code: string;
  course_code: string;
  course_name: string;
  exam_type: string;
  exam_date: string;
  print_quantity: number;
  printed_at: string;
  exam_master_name: string;
  department_name: string;
  programmes: string;
  total_marks: number;
  duration: number;
}

export default function PrintHistoryPage() {
  const router = useRouter();
  const [records, setRecords] = useState<PrintRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchPrintHistory();
  }, []);

  const fetchPrintHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateFilter.start) params.append('start_date', dateFilter.start);
      if (dateFilter.end) params.append('end_date', dateFilter.end);

      const response = await fetch(`/api/print-queue/history?${params}`);
      if (response.status === 401) {
        router.push('/auth/login');
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setRecords(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch print history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDateFilter = () => {
    fetchPrintHistory();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredRecords = records.filter(
    (record) =>
      record.paper_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.course_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCopies = filteredRecords.reduce((sum, r) => sum + (r.print_quantity || 0), 0);

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
            📜 Print History
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Complete record of all printed exam papers
          </p>
        </div>
        <Link
          href="/print-queue"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          ← Back to Queue
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Papers Printed</p>
              <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
                {filteredRecords.length}
              </p>
            </div>
            <div className="text-4xl">📄</div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Copies</p>
              <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
                {totalCopies.toLocaleString()}
              </p>
            </div>
            <div className="text-4xl">📚</div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Copies/Paper</p>
              <p className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-400">
                {filteredRecords.length > 0
                  ? (totalCopies / filteredRecords.length).toFixed(0)
                  : 0}
              </p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Start Date
            </label>
            <input
              type="date"
              value={dateFilter.start}
              onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              End Date
            </label>
            <input
              type="date"
              value={dateFilter.end}
              onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Search
            </label>
            <input
              type="text"
              placeholder="Paper code, course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleApplyDateFilter}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
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
                  Exam Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Printed
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Copies
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Printed By
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="whitespace-nowrap px-6 py-4">
                    <Link
                      href={`/exam-papers/${record.id}`}
                      className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {record.paper_code}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {record.course_code}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        {record.course_name}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {record.exam_type}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {formatDate(record.exam_date)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {formatDateTime(record.printed_at)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                    {record.print_quantity}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {record.exam_master_name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRecords.length === 0 && (
          <div className="p-12 text-center">
            <div className="mb-4 text-6xl">📭</div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              No Print History
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || dateFilter.start || dateFilter.end
                ? 'No records match your search criteria'
                : 'No papers have been printed yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/(dashboard)/print-queue/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PrintQueuePaper {
  id: number;
  paper_code: string;
  status: string;
  exam_type: string;
  exam_date: string;
  course_code: string;
  course_name: string;
  total_marks: number;
  duration: number;
  hod_approved_at: string;
  print_quantity: number;
  department_name: string;
  college_name: string;
  programmes: string;
  programme_names: string;
  created_by_name?: string;
  exam_master_id?: number;
  printed_at?: string;
}

export default function PrintQueuePage() {
  const router = useRouter();
  const [papers, setPapers] = useState<PrintQueuePaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'ready_for_print' | 'printing' | 'printed'>('ready_for_print');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPapers, setSelectedPapers] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchPrintQueue();
  }, [filter]);

  const fetchPrintQueue = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      
      const response = await fetch(`/api/print-queue?${params}`);
      if (response.status === 401) {
        router.push('/auth/login');
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setPapers(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch print queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartPrinting = async (paperId: number) => {
    if (!confirm('Start printing this exam paper?')) return;

    try {
      const response = await fetch(`/api/print-queue/${paperId}/start`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Printing started successfully!');
        fetchPrintQueue();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to start printing');
      }
    } catch (error) {
      console.error('Error starting print:', error);
      alert('Failed to start printing');
    }
  };

  const handleCompletePrinting = async (paperId: number) => {
    const quantity = prompt('Enter the number of copies printed:');
    if (!quantity || isNaN(Number(quantity))) return;

    try {
      const response = await fetch(`/api/print-queue/${paperId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ print_quantity: Number(quantity) }),
      });

      if (response.ok) {
        alert('Printing completed successfully!');
        fetchPrintQueue();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to complete printing');
      }
    } catch (error) {
      console.error('Error completing print:', error);
      alert('Failed to complete printing');
    }
  };

  const handleBulkPrint = async () => {
    if (selectedPapers.size === 0) {
      alert('Please select papers to print');
      return;
    }

    if (!confirm(`Start printing ${selectedPapers.size} selected paper(s)?`)) return;

    try {
      const promises = Array.from(selectedPapers).map(paperId =>
        fetch(`/api/print-queue/${paperId}/start`, { method: 'POST' })
      );

      await Promise.all(promises);
      alert('Bulk printing started successfully!');
      setSelectedPapers(new Set());
      fetchPrintQueue();
    } catch (error) {
      console.error('Error with bulk print:', error);
      alert('Some papers failed to start printing');
    }
  };

  const togglePaperSelection = (paperId: number) => {
    setSelectedPapers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(paperId)) {
        newSet.delete(paperId);
      } else {
        newSet.add(paperId);
      }
      return newSet;
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      ready_for_print: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400',
      printing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      printed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredPapers = papers.filter(paper =>
    paper.paper_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    paper.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    paper.course_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">🖨️ Print Queue</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage exam paper printing workflow
          </p>
        </div>
        <div className="flex gap-2">
          {selectedPapers.size > 0 && (
            <button
              onClick={handleBulkPrint}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              🖨️ Print Selected ({selectedPapers.size})
            </button>
          )}
          <Link
            href="/print-queue/history"
            className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-300 dark:bg-gray-700 dark:text-white"
          >
            📜 Print History
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ready to Print</p>
              <p className="mt-2 text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                {papers.filter(p => p.status === 'ready_for_print').length}
              </p>
            </div>
            <div className="text-4xl">📋</div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Currently Printing</p>
              <p className="mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {papers.filter(p => p.status === 'printing').length}
              </p>
            </div>
            <div className="text-4xl">⏳</div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Printed Today</p>
              <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
                {papers.filter(p => p.status === 'printed' && 
                  p.printed_at && 
                  new Date(p.printed_at).toDateString() === new Date().toDateString()
                ).length}
              </p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {[
              ['all', '📊 All'],
              ['ready_for_print', '📋 Ready'],
              ['printing', '⏳ Printing'],
              ['printed', '✅ Printed'],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value as any)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  filter === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 sm:max-w-md">
            <input
              type="text"
              placeholder="Search by paper code, course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Papers Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3">
                  <input
                    type="checkbox"
                    checked={selectedPapers.size === filteredPapers.filter(p => p.status === 'ready_for_print').length && filteredPapers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPapers(new Set(filteredPapers.filter(p => p.status === 'ready_for_print').map(p => p.id)));
                      } else {
                        setSelectedPapers(new Set());
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </th>
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
                  Programmes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPapers.map((paper) => (
                <tr key={paper.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    {paper.status === 'ready_for_print' && (
                      <input
                        type="checkbox"
                        checked={selectedPapers.has(paper.id)}
                        onChange={() => togglePaperSelection(paper.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <Link
                      href={`/print-queue/${paper.id}`}
                      className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {paper.paper_code}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {paper.course_code}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        {paper.course_name}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {paper.exam_type}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {formatDate(paper.exam_date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {paper.programmes}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(
                        paper.status
                      )}`}
                    >
                      {paper.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/print-queue/${paper.id}`}
                        className="rounded bg-blue-100 px-3 py-1 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400"
                      >
                        Preview
                      </Link>
                      
                      {paper.status === 'ready_for_print' && (
                        <button
                          onClick={() => handleStartPrinting(paper.id)}
                          className="rounded bg-green-100 px-3 py-1 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400"
                        >
                          Start Print
                        </button>
                      )}
                      
                      {paper.status === 'printing' && (
                        <button
                          onClick={() => handleCompletePrinting(paper.id)}
                          className="rounded bg-purple-100 px-3 py-1 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPapers.length === 0 && (
          <div className="p-12 text-center">
            <div className="mb-4 text-6xl">📭</div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              No Papers in Queue
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm
                ? 'No papers match your search criteria'
                : 'There are no papers ready for printing at the moment'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
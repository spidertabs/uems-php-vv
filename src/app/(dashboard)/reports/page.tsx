/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react-hooks/exhaustive-deps */
// src/app/(dashboard)/reports/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface QuestionReport {
  // Summary
  course_id?: number;
  course_code?: string;
  course_title?: string;
  department_name?: string;
  total_questions?: number;
  mcq_count?: number;
  tf_count?: number;
  essay_count?: number;
  short_answer_count?: number;
  easy_count?: number;
  medium_count?: number;
  hard_count?: number;
  avg_marks?: number | string; // Can be string from MySQL
  total_usage?: number;
  // By difficulty
  difficulty_level?: string;
  question_type?: string;
  count?: number;
  avg_usage?: number | string; // Can be string from MySQL
  avg_performance?: number | string; // Can be string from MySQL
  // By creator
  id?: number;
  creator_name?: string;
  email?: string;
  active_questions?: number;
  // Usage stats
  question_preview?: string;
  marks?: number;
  usage_count?: number;
  avg_student_score?: number | string; // Can be string from MySQL
  created_by?: string;
  // Bloom's taxonomy
  bloom_taxonomy?: string;
}

export default function QuestionsReportPage() {
  const router = useRouter();
  const [reports, setReports] = useState<QuestionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<'summary' | 'by_difficulty' | 'by_creator' | 'usage_stats' | 'bloom_taxonomy'>('summary');
  const [filters, setFilters] = useState({
    course_id: '',
    department_id: '',
  });

  // Helper to safely format numbers from MySQL (which may return strings)
  const formatNumber = (value: any, decimals = 1): string => {
    if (value === null || value === undefined) return '0.0';
    const num = typeof value === 'number' ? value : parseFloat(value);
    return isNaN(num) ? '0.0' : num.toFixed(decimals);
  };

  // Helper to format large numbers in compact form (1.2K, 3.4M, etc.)
  const formatCompactNumber = (value: any): string => {
    if (value === null || value === undefined) return '0';
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return '0';
    
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, filters]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: reportType,
        ...(filters.course_id && { course_id: filters.course_id }),
        ...(filters.department_id && { department_id: filters.department_id }),
      });

      const response = await fetch(`/api/reports/questions?${params}`);

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
      course_id: '',
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
    a.download = `questions_report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getDifficultyBadge = (level: string) => {
    const colors: Record<string, string> = {
      easy: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      hard: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const getBloomBadge = (taxonomy: string) => {
    const colors: Record<string, string> = {
      remember: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      understand: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      apply: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      analyze: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      evaluate: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      create: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    };
    return colors[taxonomy] || 'bg-gray-100 text-gray-800';
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
              ❓ Questions Report
            </h1>
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Analyze question bank statistics and usage patterns
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
          onClick={() => setReportType('by_difficulty')}
          className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
            reportType === 'by_difficulty'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white'
          }`}
        >
          📊 By Difficulty
        </button>
        <button
          onClick={() => setReportType('by_creator')}
          className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
            reportType === 'by_creator'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white'
          }`}
        >
          👤 By Creator
        </button>
        <button
          onClick={() => setReportType('usage_stats')}
          className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
            reportType === 'usage_stats'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white'
          }`}
        >
          📈 Usage Stats
        </button>
        <button
          onClick={() => setReportType('bloom_taxonomy')}
          className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
            reportType === 'bloom_taxonomy'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white'
          }`}
        >
          🎯 Bloom&apos;s Taxonomy
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Course ID
            </label>
            <input
              type="number"
              placeholder="Enter course ID"
              value={filters.course_id}
              onChange={(e) => handleFilterChange('course_id', e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Department ID
            </label>
            <input
              type="number"
              placeholder="Enter department ID"
              value={filters.department_id}
              onChange={(e) => handleFilterChange('department_id', e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
          </div>
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
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Department
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Total
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    MCQ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Essay
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Easy/Med/Hard
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Avg Marks
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Usage
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {reports.map((course, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {course.course_code} - {course.course_title}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {course.department_name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                      {course.total_questions}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300">
                      {course.mcq_count}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300">
                      {course.essay_count}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <span className="text-green-600 dark:text-green-400">{course.easy_count}</span>
                      {' / '}
                      <span className="text-yellow-600 dark:text-yellow-400">{course.medium_count}</span>
                      {' / '}
                      <span className="text-red-600 dark:text-red-400">{course.hard_count}</span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300">
                      {formatNumber(course.avg_marks)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-blue-600 dark:text-blue-400">
                      {formatCompactNumber(course.total_usage)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'by_difficulty' && (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Difficulty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Question Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Count
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Avg Marks
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Avg Usage
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Avg Performance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {reports.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getDifficultyBadge(item.difficulty_level || '')}`}>
                        {item.difficulty_level?.toUpperCase()}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {item.question_type?.replace(/_/g, ' ').toUpperCase()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                      {item.count}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300">
                      {formatNumber(item.avg_marks)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-blue-600 dark:text-blue-400">
                      {formatNumber(item.avg_usage)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-green-600 dark:text-green-400">
                      {formatNumber(item.avg_performance)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'by_creator' && (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Creator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Department
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Total Questions
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Active
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Total Usage
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Avg Marks
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {reports.map((creator, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {creator.creator_name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {creator.email}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {creator.department_name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                      {creator.total_questions}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-green-600 dark:text-green-400">
                      {creator.active_questions}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-blue-600 dark:text-blue-400">
                      {formatCompactNumber(creator.total_usage)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300">
                      {formatNumber(creator.avg_marks)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'usage_stats' && (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Question Preview
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Difficulty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Course
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Marks
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Usage Count
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Avg Score
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {reports.map((question, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="max-w-md px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {question.question_preview}...
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {question.question_type?.replace(/_/g, ' ').toUpperCase()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getDifficultyBadge(question.difficulty_level || '')}`}>
                        {question.difficulty_level?.toUpperCase()}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {question.course_code}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300">
                      {question.marks}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {formatCompactNumber(question.usage_count)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-green-600 dark:text-green-400">
                      {formatNumber(question.avg_student_score)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'bloom_taxonomy' && (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Bloom's Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Difficulty
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Count
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Avg Marks
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Total Usage
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {reports.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getBloomBadge(item.bloom_taxonomy || '')}`}>
                        {item.bloom_taxonomy?.toUpperCase()}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getDifficultyBadge(item.difficulty_level || '')}`}>
                        {item.difficulty_level?.toUpperCase()}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                      {item.count}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300">
                      {formatNumber(item.avg_marks)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-blue-600 dark:text-blue-400">
                      {formatCompactNumber(item.total_usage)}
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
              No questions found matching your criteria. Try adjusting the filters.
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
            {reportType === 'summary' && (
              <>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {reports.reduce((sum, r) => sum + (r.total_questions || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Questions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {reports.reduce((sum, r) => sum + (r.mcq_count || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">MCQ Questions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {formatCompactNumber(reports.reduce((sum, r) => sum + (r.total_usage || 0), 0))}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Usage</p>
                </div>
              </>
            )}
            {reportType === 'by_difficulty' && (
              <>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {reports.reduce((sum, r) => sum + (r.count || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Questions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {formatNumber(reports.reduce((sum, r) => sum + parseFloat(String(r.avg_marks || 0)), 0) / reports.length)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Marks</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatNumber(reports.reduce((sum, r) => sum + parseFloat(String(r.avg_usage || 0)), 0) / reports.length)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Usage</p>
                </div>
              </>
            )}
            {reportType === 'by_creator' && (
              <>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {reports.reduce((sum, r) => sum + (r.total_questions || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Questions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {reports.reduce((sum, r) => sum + (r.active_questions || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Questions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {formatCompactNumber(reports.reduce((sum, r) => sum + (r.total_usage || 0), 0))}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Usage</p>
                </div>
              </>
            )}
            {reportType === 'usage_stats' && (
              <>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCompactNumber(reports.reduce((sum, r) => sum + (r.usage_count || 0), 0))}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Usage</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {formatNumber(reports.reduce((sum, r) => sum + parseFloat(String(r.avg_student_score || 0)), 0) / reports.length)}%
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Score</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatNumber(reports.reduce((sum, r) => sum + (r.marks || 0), 0) / reports.length)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Marks</p>
                </div>
              </>
            )}
            {reportType === 'bloom_taxonomy' && (
              <>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {reports.reduce((sum, r) => sum + (r.count || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Questions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {formatNumber(reports.reduce((sum, r) => sum + parseFloat(String(r.avg_marks || 0)), 0) / reports.length)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Marks</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCompactNumber(reports.reduce((sum, r) => sum + (r.total_usage || 0), 0))}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Usage</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
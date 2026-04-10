/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/(dashboard)/programmes/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Programme {
  id: number;
  code: string;
  name: string;
  level: string;
  duration_years: number;
  department_id: number;
  department_name: string;
  college_name: string;
  is_active: boolean;
  created_at: string;
}

export default function ProgrammesPage() {
  const router = useRouter();
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [filteredProgrammes, setFilteredProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchProgrammes();
  }, []);

  useEffect(() => {
    filterProgrammes();
  }, [searchTerm, filterLevel, filterStatus, programmes]);

  const fetchProgrammes = async () => {
    try {
      // Fetch all programmes including inactive ones for the list page
      const response = await fetch('/api/programmes');
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched programmes:', data);
        setProgrammes(data.data || data.programmes || []);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch programmes:', errorData);
      }
    } catch (error) {
      console.error('Error fetching programmes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProgrammes = () => {
    let filtered = [...programmes];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (prog) =>
          prog.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prog.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prog.department_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Level filter
    if (filterLevel !== 'all') {
      filtered = filtered.filter((prog) => prog.level === filterLevel);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((prog) => 
        filterStatus === 'active' ? prog.is_active : !prog.is_active
      );
    }

    setFilteredProgrammes(filtered);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this programme?')) return;

    try {
      const response = await fetch(`/api/programmes/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Programme deleted successfully');
        fetchProgrammes();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete programme');
      }
    } catch (error) {
      console.error('Error deleting programme:', error);
      alert('Failed to delete programme');
    }
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/programmes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        fetchProgrammes();
      }
    } catch (error) {
      console.error('Error updating programme status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const levels = ['diploma', 'bachelors', 'masters', 'phd'];

  return (
    <div className="space-y-6 lg:pl-64">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🎓 Programmes
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage academic programmes across all departments
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/programmes/import"
            className="rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
          >
            📥 Import
          </Link>
          <Link
            href="/programmes/create"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            ➕ Create Programme
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Search */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search programmes..."
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
          </div>

          {/* Level Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Level
            </label>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Levels</option>
              {levels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-blue-600">
            {programmes.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Programmes
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-green-600">
            {programmes.filter((p) => p.is_active).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Active Programmes
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-purple-600">
            {new Set(programmes.map((p) => p.level)).size}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Levels
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-orange-600">
            {filteredProgrammes.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Filtered Results
          </div>
        </div>
      </div>

      {/* Programmes Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Code
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Programme Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Level
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Duration
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Department
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredProgrammes.length > 0 ? (
                filteredProgrammes.map((programme) => (
                  <tr
                    key={programme.id}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {programme.code}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/programmes/${programme.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        {programme.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        {programme.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {programme.duration_years ? `${programme.duration_years} years` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      <div>{programme.department_name || 'N/A'}</div>
                      <div className="text-xs text-gray-500">
                        {programme.college_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() =>
                          toggleStatus(programme.id, programme.is_active)
                        }
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          programme.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {programme.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/programmes/${programme.id}`}
                          className="rounded-lg bg-blue-100 px-3 py-1 text-sm text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
                        >
                          View
                        </Link>
                        <Link
                          href={`/programmes/edit/${programme.id}`}
                          className="rounded-lg bg-yellow-100 px-3 py-1 text-sm text-yellow-700 transition-colors hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(programme.id)}
                          className="rounded-lg bg-red-100 px-3 py-1 text-sm text-red-700 transition-colors hover:bg-red-200 dark:bg-red-900 dark:text-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-5xl">📚</div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">
                      No programmes found
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
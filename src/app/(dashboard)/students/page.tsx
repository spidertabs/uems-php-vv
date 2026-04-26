/* eslint-disable react-hooks/exhaustive-deps */
// src/app/(dashboard)/students/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Student {
  id: number;
  registration_number: string;
  email: string;
  first_name: string;
  last_name: string;
  programme_name: string;
  department_name: string;
  enrolment_year: number;
  study_year: number;
  semester: number;
  is_active: boolean;
  created_at: string;
}

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('all');

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    const filtered = students.filter(s => 
      (s.first_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       s.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       s.registration_number.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterYear === 'all' || s.study_year.toString() === filterYear)
    );
    setFilteredStudents(filtered);
  }, [searchTerm, filterYear, students]);

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students');
      if (response.ok) {
        const data = await response.json();
        setStudents(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:pl-64">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">
            👨‍🎓 Student Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400 font-medium">
            Manage university candidates and academic records
          </p>
        </div>
        <div className="flex gap-3">
          <button className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-700 hover:scale-105 active:scale-95">
            ➕ Add Student
          </button>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
         <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-xl dark:border-emerald-900/30 dark:bg-gray-800">
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Students</div>
            <div className="mt-2 text-4xl font-black text-gray-900 dark:text-white">{students.length}</div>
         </div>
         <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-xl dark:border-blue-900/30 dark:bg-gray-800">
            <div className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Active This Semester</div>
            <div className="mt-2 text-4xl font-black text-gray-900 dark:text-white">{students.filter(s => s.is_active).length}</div>
         </div>
         <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-xl dark:border-purple-900/30 dark:bg-gray-800">
            <div className="text-sm font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Year 1 Intake</div>
            <div className="mt-2 text-4xl font-black text-gray-900 dark:text-white">{students.filter(s => s.study_year === 1).length}</div>
         </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder="Search by name or reg number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <select 
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          <option value="all">All Study Years</option>
          <option value="1">Year 1</option>
          <option value="2">Year 2</option>
          <option value="3">Year 3</option>
          <option value="4">Year 4+</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Reg Number</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Full Name</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Programme</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Year / Sem</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredStudents.map((student) => (
              <tr key={student.id} className="group hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-mono text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {student.registration_number}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900 dark:text-white">{student.first_name} {student.last_name}</div>
                  <div className="text-xs text-gray-500">{student.email}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{student.programme_name}</div>
                  <div className="text-xs text-gray-500">{student.department_name}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-bold">Year {student.study_year}</span>
                  <span className="mx-1 text-gray-300">|</span>
                  <span className="text-xs text-gray-500">Sem {student.semester}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    student.is_active 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' 
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {student.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-sm font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">Manage</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredStudents.length === 0 && (
          <div className="py-20 text-center">
            <div className="text-5xl">🔭</div>
            <div className="mt-4 text-gray-500 font-medium">No students found matching your criteria.</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* eslint-disable react-hooks/exhaustive-deps */
// src/app/(dashboard)/students/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Student {
  id: number;
  registration_number: string;
  email: string;
  first_name: string;
  last_name: string;
  programme_name: string;
  department_name: string;
  college_name: string;
  phone: string | null;
  enrolment_year: number;
  study_year: number;
  semester: number;
  is_active: boolean;
  created_at: string;
}

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) {
      fetchStudent();
    }
  }, [studentId]);

  const fetchStudent = async () => {
    try {
      const response = await fetch(`/api/students/${studentId}`);
      if (response.ok) {
        const data = await response.json();
        setStudent(data.data);
      } else if (response.status === 404) {
        alert('Student not found');
        router.push('/students');
      }
    } catch (error) {
      console.error('Error fetching student:', error);
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

  if (!student) return null;

  return (
    <div className="space-y-6 lg:pl-64">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">
            🎓 {student.first_name} {student.last_name}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest text-xs">
            {student.registration_number}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/students"
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold shadow-sm transition-all hover:bg-gray-50 active:scale-95 dark:border-gray-700 dark:bg-gray-800"
          >
            ← Back to List
          </Link>
          <button className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-700 active:scale-95">
            ✏️ Edit Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Personal Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">Personal Information</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">First Name</label>
                <div className="text-lg font-bold text-gray-900 dark:text-white">{student.first_name}</div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Last Name</label>
                <div className="text-lg font-bold text-gray-900 dark:text-white">{student.last_name}</div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Email Address</label>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{student.email}</div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Phone Number</label>
                <div className="text-lg font-bold text-gray-900 dark:text-white">{student.phone || 'Not Provided'}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">Academic Status</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-900/10">
                <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Current Year</label>
                <div className="text-2xl font-black text-gray-900 dark:text-white">{student.study_year}</div>
              </div>
              <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-900/10">
                <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Semester</label>
                <div className="text-2xl font-black text-gray-900 dark:text-white">{student.semester}</div>
              </div>
              <div className="rounded-xl bg-purple-50 p-4 dark:bg-purple-900/10">
                <label className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Enrolled Since</label>
                <div className="text-2xl font-black text-gray-900 dark:text-white">{student.enrolment_year}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Program Details */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">Programme</h2>
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-100 p-4 dark:border-gray-700">
                <div className="text-sm font-bold text-gray-900 dark:text-white">{student.programme_name}</div>
                <div className="text-xs text-gray-400 uppercase font-bold mt-1">Programme Name</div>
              </div>
              <div className="rounded-xl border border-gray-100 p-4 dark:border-gray-700">
                <div className="text-sm font-bold text-gray-900 dark:text-white">{student.department_name}</div>
                <div className="text-xs text-gray-400 uppercase font-bold mt-1">Department</div>
              </div>
              <div className="rounded-xl border border-gray-100 p-4 dark:border-gray-700">
                <div className="text-sm font-bold text-gray-900 dark:text-white">{student.college_name}</div>
                <div className="text-xs text-gray-400 uppercase font-bold mt-1">College</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50 p-6 dark:border-red-900/30 dark:bg-red-900/10">
             <h3 className="font-bold text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
             <p className="text-xs text-red-700 dark:text-red-300 mb-4 font-medium italic">Deleting a student record will remove all their enrollments and academic history.</p>
             <button className="w-full rounded-xl bg-red-600 px-4 py-2 font-bold text-white transition-colors hover:bg-red-700">
               Delete Student
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

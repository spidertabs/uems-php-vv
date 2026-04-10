/* eslint-disable react-hooks/exhaustive-deps */
// src/app/courses/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Course {
  id: number;
  code: string;
  title: string;
  level: number;
  semester: number;
  credit_units: number;
  department_id: number;
  department_name: string;
  college_id: number;
  college_name: string;
  college_abbreviation: string;
  hod_id: number;
  hod_name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface StudyUnit {
  id: number;
  course_id: number;
  code: string;
  name: string;
  description: string | null;
  sequence_order: number;
  is_active: boolean;
  questions_count: number;
}

interface User {
  role: string;
}

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [studyUnits, setStudyUnits] = useState<StudyUnit[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'units'>('overview');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, [courseId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId !== null && !(event.target as Element).closest('.menu-container')) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  const fetchData = async () => {
    try {
      const [userRes, courseRes, unitsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch(`/api/courses/${courseId}`),
        fetch(`/api/courses/${courseId}/study-units`),
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
      }

      if (courseRes.ok) {
        const courseData = await courseRes.json();
        setCourse(courseData.course);
      } else {
        router.push('/courses');
      }

      if (unitsRes.ok) {
        const unitsData = await unitsRes.json();
        setStudyUnits(unitsData.studyUnits || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveUnit = async (unitId: number, currentStatus: boolean) => {
    const action = currentStatus ? 'archive' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this study unit?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/courses/${courseId}/study-units/${unitId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !currentStatus,
        }),
      });

      if (response.ok) {
        setStudyUnits(studyUnits.map((u) => 
          u.id === unitId ? { ...u, is_active: !currentStatus } : u
        ));
        alert(`Study unit ${action}d successfully`);
      } else {
        const error = await response.json();
        alert(error.error || `Failed to ${action} study unit`);
      }
    } catch (error) {
      console.error('Archive error:', error);
      alert(`Failed to ${action} study unit`);
    }
    setOpenMenuId(null);
  };

  const toggleMenu = (unitId: number) => {
    setOpenMenuId(openMenuId === unitId ? null : unitId);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center lg:pl-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex h-96 items-center justify-center lg:pl-64">
        <div className="text-center">
          <div className="text-6xl">❌</div>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            Course not found
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:pl-64">
      {/* Header */}
<div className="flex items-center justify-between gap-4">
  {/* LEFT SIDE */}
  <div className="flex items-center gap-3">
    <Link
      href="/courses"
      className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
    >
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 19l-7-7 7-7"
        />
      </svg>
    </Link>

    <div className="flex flex-col">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {course.code}
        </h1>

        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            course.is_active
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
          }`}
        >
          {course.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      <p className="text-lg text-gray-600 dark:text-gray-400">
        {course.title}
      </p>
    </div>
  </div>

  {/* RIGHT SIDE BUTTON */}
  <Link
    href={`/courses/edit/${course.id}`}
    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
  >
    ✏️ Edit Course
  </Link>
</div>


      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('units')}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === 'units'
                ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Study Units ({studyUnits.length})
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Course Information */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              Course Information
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Course Code
                </label>
                <p className="mt-1 text-gray-900 dark:text-white">{course.code}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Course Title
                </label>
                <p className="mt-1 text-gray-900 dark:text-white">{course.title}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Level
                </label>
                <p className="mt-1 text-gray-900 dark:text-white">Level {course.level}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Semester
                </label>
                <p className="mt-1 text-gray-900 dark:text-white">Semester {course.semester}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Credit Units
                </label>
                <p className="mt-1 text-gray-900 dark:text-white">{course.credit_units} CU</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Department
                </label>
                <p className="mt-1 text-gray-900 dark:text-white">{course.department_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  College
                </label>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {course.college_name} ({course.college_abbreviation})
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Head of Department
                </label>
                <p className="mt-1 text-gray-900 dark:text-white">{course.hod_name}</p>
              </div>
            </div>
            {course.description && (
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Description
                </label>
                <p className="mt-1 text-gray-900 dark:text-white">{course.description}</p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {studyUnits.length}
              </div>
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">Study Units</div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {studyUnits.filter((u) => u.is_active).length}
              </div>
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">Active Units</div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {studyUnits.reduce((sum, u) => sum + (u.questions_count || 0), 0)}
              </div>
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">Total Questions</div>
            </div>
          </div>
        </div>
      )}

      {/* Study Units Tab */}
      {activeTab === 'units' && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Study Units
            </h2>
            <Link
              href={`/courses/${course.id}/study-units/create`}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              ➕ Add Study Unit
            </Link>
          </div>

          {/* Study Units List */}
          {studyUnits.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="text-6xl">📚</div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                No study units yet
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Get started by creating your first study unit for this course
              </p>
              <Link
                href={`/courses/${course.id}/study-units/create`}
                className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Create Study Unit
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {studyUnits.map((unit) => (
                <div
                  key={unit.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        {/* Sequence Order Badge */}
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-200">
                          {unit.sequence_order}
                        </span>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/courses/${course.id}/study-units/${unit.id}`}
                              className="text-lg font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            >
                              {unit.code}
                            </Link>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                unit.is_active
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {unit.is_active ? 'Active' : 'Archived'}
                            </span>
                          </div>
                          <h3 className="mt-1 font-medium text-gray-900 dark:text-white">
                            {unit.name}
                          </h3>
                        </div>
                      </div>

                      {unit.description && (
                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                          {unit.description}
                        </p>
                      )}
                      
                      <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium text-purple-600 dark:text-purple-400">
                          {unit.questions_count || 0} Questions
                        </span>
                      </div>
                    </div>

                    {/* Three-dot Menu */}
                    <div className="menu-container relative ml-2">
                      <button
                        onClick={() => toggleMenu(unit.id)}
                        className="rounded-lg p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>

                      {openMenuId === unit.id && (
                        <div className="absolute right-0 top-8 z-10 w-48 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
                          <Link
                            href={`/courses/${course.id}/study-units/${unit.id}`}
                            className="flex items-center gap-2 rounded-t-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            onClick={() => setOpenMenuId(null)}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Details
                          </Link>
                          <Link
                            href={`/courses/${course.id}/study-units/${unit.id}/edit`}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            onClick={() => setOpenMenuId(null)}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </Link>
                          {user?.role === 'admin' && (
                            <button
                              onClick={() => handleArchiveUnit(unit.id, unit.is_active)}
                              className={`flex w-full items-center gap-2 rounded-b-lg px-4 py-2 text-sm ${
                                unit.is_active
                                  ? 'text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20'
                                  : 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20'
                              }`}
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                              </svg>
                              {unit.is_active ? 'Archive' : 'Activate'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
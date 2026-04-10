/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/(dashboard)/courses/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Course {
  id: number;
  code: string;
  title: string;
  level: number;
  semester: number;
  credit_units: number;
  department_name: string;
  college_name: string;
  college_code: string;
  hod_name: string;
  is_active: boolean;
  study_units_count: number;
}

interface User {
  role: string;
}

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterSemester, setFilterSemester] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userRes, coursesRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/courses'),
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
      }

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourses(coursesData.courses || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.department_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLevel = filterLevel === 'all' || course.level === parseInt(filterLevel);
    const matchesSemester =
      filterSemester === 'all' || course.semester === parseInt(filterSemester);
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && course.is_active) ||
      (filterStatus === 'inactive' && !course.is_active);

    return matchesSearch && matchesLevel && matchesSemester && matchesStatus;
  });

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
  <div className="flex flex-col">
    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Courses</h1>
    <p className="text-sm text-gray-600 dark:text-gray-400">
      Manage courses and study units
    </p>
  </div>

  <Link
    href="/courses/create"
    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 whitespace-nowrap"
  >
    ➕ Add Course
  </Link>
</div>


      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by code, title, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Level
            </label>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Levels</option>
              <option value="1">Level 1</option>
              <option value="2">Level 2</option>
              <option value="3">Level 3</option>
              <option value="4">Level 4</option>
              <option value="5">Level 5</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Semester
            </label>
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Semesters</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {courses.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Courses</div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {courses.filter((c) => c.is_active).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Active Courses</div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {courses.reduce((sum, c) => sum + (c.study_units_count || 0), 0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Study Units</div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {filteredCourses.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Filtered Results</div>
        </div>
      </div>

      {/* Courses List */}
      {filteredCourses.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-6xl">📚</div>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No courses found
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {searchQuery || filterLevel !== 'all' || filterSemester !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by creating your first course'}
          </p>
        </div>
      ) : (
        /** ✅ 4 Columns here */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {filteredCourses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
                    {course.code}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      course.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {course.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <h3 className="mt-1 font-medium text-gray-900 dark:text-white">
                  {course.title}
                </h3>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <span className="w-24 font-medium">Department:</span>
                  <span>{course.department_name || 'N/A'}</span>
                </div>

                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <span className="w-24 font-medium">College:</span>
                  <span>{course.college_code || 'N/A'}</span>
                </div>

                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <span className="w-24 font-medium">Level:</span>
                  <span>Year {course.level}</span>
                  <span className="mx-2">:</span>
                  <span>Sem {course.semester}</span>
                  <span className="mx-2">•</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {course.study_units_count || 0}
                  </span>
                  <span className="mx-2">SU</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/permissions/debug/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DebugPermissionsPage() {
  const [data, setData] = useState<any>({
    permissions: [],
    courses: [],
    lecturers: [],
    loading: true,
  });

  useEffect(() => {
    fetchDebugData();
  }, []);

  const fetchDebugData = async () => {
    try {
      const [permissionsRes, coursesRes, usersRes] = await Promise.all([
        fetch('/api/permissions'),
        fetch('/api/courses'),
        fetch('/api/users'),
      ]);

      const permissions = permissionsRes.ok ? await permissionsRes.json() : { error: await permissionsRes.text() };
      const courses = coursesRes.ok ? await coursesRes.json() : { error: await coursesRes.text() };
      const users = usersRes.ok ? await usersRes.json() : { error: await usersRes.text() };

      setData({
        permissions: permissions.data || permissions.permissions || permissions,
        courses: courses.data || courses.courses || courses,
        users: users.data || users.users || users,
        loading: false,
      });

      console.log('Debug Data:', {
        permissions: permissions.data || permissions,
        courses: courses.data || courses,
        users: users.data || users,
      });
    } catch (error) {
      console.error('Error fetching debug data:', error);
      setData({ ...data, loading: false });
    }
  };

  if (data.loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const lecturers = Array.isArray(data.users) 
    ? data.users.filter((u: any) => u.role === 'lecturer')
    : [];

  return (
    <div className="space-y-6 lg:pl-64">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🔍 Debug Permissions Data
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Check what data exists in your database
          </p>
        </div>
        <Link
          href="/permissions"
          className="rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          ← Back
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-blue-600">
            {Array.isArray(data.permissions) ? data.permissions.length : 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Permissions
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-green-600">
            {Array.isArray(data.courses) ? data.courses.length : 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Courses
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-purple-600">
            {lecturers.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Lecturers
          </div>
        </div>
      </div>

      {/* Permissions Data */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          📋 Permissions Data
        </h2>
        <pre className="overflow-auto rounded-lg bg-gray-50 p-4 text-xs dark:bg-gray-900">
          {JSON.stringify(data.permissions, null, 2)}
        </pre>
      </div>

      {/* Courses Data */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          📚 Courses Data
        </h2>
        {Array.isArray(data.courses) && data.courses.length > 0 ? (
          <div className="space-y-2">
            {data.courses.map((course: any, i: number) => (
              <div key={i} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
                <div className="font-medium text-gray-900 dark:text-white">
                  {course.code} - {course.title}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  ID: {course.id} | Department: {course.department_name || 'N/A'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-yellow-50 p-4 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            ⚠️ No courses found. Create courses first!
          </div>
        )}
      </div>

      {/* Lecturers Data */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          👥 Lecturers Data
        </h2>
        {lecturers.length > 0 ? (
          <div className="space-y-2">
            {lecturers.map((lecturer: any, i: number) => (
              <div key={i} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
                <div className="font-medium text-gray-900 dark:text-white">
                  {lecturer.first_name} {lecturer.last_name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  ID: {lecturer.id} | Email: {lecturer.email}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-yellow-50 p-4 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            ⚠️ No lecturers found. Create lecturer users first!
          </div>
        )}
      </div>

      {/* Raw Response */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          🔧 Raw API Responses
        </h2>
        <pre className="overflow-auto rounded-lg bg-gray-50 p-4 text-xs dark:bg-gray-900">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Link
          href="/courses/create"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          ➕ Create Course
        </Link>
        <Link
          href="/users/create"
          className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          ➕ Create Lecturer
        </Link>
        <Link
          href="/permissions/grant"
          className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
        >
          🔓 Grant Permission
        </Link>
      </div>
    </div>
  );
}
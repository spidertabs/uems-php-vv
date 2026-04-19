/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/permissions/grant/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Course {
  id: number;
  code: string;
  title: string;
  department_name?: string;
}

interface Lecturer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  department_name?: string;
}

export default function GrantPermissionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [formData, setFormData] = useState({
    lecturer_id: '',
    course_id: '',
    can_add_questions: true,
    can_create_papers: true,
    can_edit_questions: false,
    expires_at: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch courses
      const coursesRes = await fetch('/api/courses');
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        const coursesList = coursesData.data || coursesData.courses || [];
        setCourses(coursesList);
        console.log('Courses loaded:', coursesList.length);
      } else {
        console.error('Failed to fetch courses:', await coursesRes.text());
      }

      // Fetch lecturers
      const lecturersRes = await fetch('/api/users');
      if (lecturersRes.ok) {
        const lecturersData = await lecturersRes.json();
        // Filter only lecturers
        const allUsers = lecturersData.data || lecturersData.users || [];
        const lecturerUsers = allUsers.filter((u: any) => u.role === 'lecturer' && u.is_active);
        setLecturers(lecturerUsers);
        console.log('Lecturers loaded:', lecturerUsers.length, 'from', allUsers.length, 'total users');
      } else {
        console.error('Failed to fetch users:', await lecturersRes.text());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/permissions/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          lecturer_id: parseInt(formData.lecturer_id),
          course_id: parseInt(formData.course_id),
          expires_at: formData.expires_at || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Permission granted successfully!');
        router.push('/permissions');
      } else {
        alert(data.error || 'Failed to grant permission');
      }
    } catch (error) {
      console.error('Error granting permission:', error);
      alert('Failed to grant permission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 lg:pl-64">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🔓 Grant Permission
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Grant lecturer access to courses and question banks
          </p>
        </div>
        <Link
          href="/permissions"
          className="rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          ← Back
        </Link>
      </div>

      {/* Form */}
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-md dark:border-gray-700 dark:bg-gray-800">
        {courses.length === 0 || lecturers.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mb-4 text-5xl">⚠️</div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Cannot Grant Permission
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {courses.length === 0 && lecturers.length === 0 && 'No courses or lecturers found in the system.'}
              {courses.length === 0 && lecturers.length > 0 && 'No courses found. Please create courses first.'}
              {courses.length > 0 && lecturers.length === 0 && 'No lecturers found. Please create lecturer accounts first.'}
            </p>
            <div className="mt-4 flex justify-center gap-3">
              {courses.length === 0 && (
                <Link
                  href="/courses/create"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Create Course
                </Link>
              )}
              {lecturers.length === 0 && (
                <Link
                  href="/users/create"
                  className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                >
                  Create Lecturer
                </Link>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Lecturer Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Lecturer <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.lecturer_id}
              onChange={(e) =>
                setFormData({ ...formData, lecturer_id: e.target.value })
              }
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">
                {lecturers.length === 0 
                  ? 'No lecturers available...' 
                  : 'Select a lecturer...'}
              </option>
              {lecturers.map((lecturer) => (
                <option key={lecturer.id} value={lecturer.id}>
                  {lecturer.first_name} {lecturer.last_name} ({lecturer.email})
                  {lecturer.department_name && ` - ${lecturer.department_name}`}
                </option>
              ))}
            </select>
            {lecturers.length === 0 && (
              <p className="mt-1 text-sm text-red-600">
                No active lecturers found. Please create lecturer accounts first.
              </p>
            )}
          </div>

          {/* Course Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Course <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.course_id}
              onChange={(e) =>
                setFormData({ ...formData, course_id: e.target.value })
              }
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select a course...</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.title}
                  {course.department_name && ` (${course.department_name})`}
                </option>
              ))}
            </select>
          </div>

          {/* Permissions Checkboxes */}
          <div>
            <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Grant Access To
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.can_add_questions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      can_add_questions: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  ➕ Add Questions to Question Bank
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.can_create_papers}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      can_create_papers: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  📄 Create Exam Papers
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.can_edit_questions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      can_edit_questions: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  ✏️ Edit Existing Questions
                </span>
              </label>
            </div>
          </div>

          {/* Expiration Date */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Expiration Date (Optional)
            </label>
            <input
              type="date"
              value={formData.expires_at}
              onChange={(e) =>
                setFormData({ ...formData, expires_at: e.target.value })
              }
              min={new Date().toISOString().split('T')[0]}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-1 text-sm text-gray-500">
              Leave empty for permanent access
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              placeholder="Add any relevant notes about this permission..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Granting...' : '✅ Grant Permission'}
            </button>
            <Link
              href="/permissions"
              className="rounded-lg border border-gray-300 px-6 py-3 text-center font-medium transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Cancel
            </Link>
          </div>
        </form>
        )}
      </div>

      {/* Info Box */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950">
        <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
          ℹ️ Permission Guidelines
        </h3>
        <ul className="list-inside list-disc space-y-1 text-sm text-blue-800 dark:text-blue-200">
          <li>
            Only grant permissions to lecturers who will be actively working on
            the course
          </li>
          <li>
            Set expiration dates for temporary permissions (e.g., per semester)
          </li>
          <li>
            Edit permissions allow modification of existing questions - grant
            carefully
          </li>
          <li>
            You can revoke permissions at any time from the permissions list
          </li>
          <li>
            Lecturers will receive a notification when permissions are granted
          </li>
        </ul>
      </div>
    </div>
  );
}
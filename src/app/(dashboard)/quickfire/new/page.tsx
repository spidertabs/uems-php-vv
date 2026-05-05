'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewQuickfirePage() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    course_id: '',
    title: '',
    description: '',
    duration_minutes: '15',
    is_active: true,
    show_results: true,
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      // In a real app, this might be filtered by the user's permissions
      const response = await fetch('/api/courses');
      if (response.ok) {
        const result = await response.json();
        setCourses(result.courses || []);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.course_id || !form.title) {
        alert('Please fill in required fields');
        return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/quickfire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          course_id: parseInt(form.course_id),
          duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        router.push(`/quickfire/${result.data.id}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create assessment');
      }
    } catch (error) {
      console.error('Submit Error:', error);
      alert('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center lg:pl-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 lg:pl-64">
      {/* Breadcrumbs */}
      <nav className="flex text-sm text-gray-500 dark:text-gray-400">
        <Link href="/quickfire" className="hover:text-indigo-600">Quickfire</Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-gray-900 dark:text-white">New Assessment</span>
      </nav>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">New Quickfire Assessment</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            
            {/* Course Selection */}
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Course Selection <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.course_id}
                onChange={(e) => setForm({ ...form, course_id: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select a course...</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    [{course.code}] {course.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Assessment Title */}
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Assessment Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Mid-Session Quiz on Data Structures"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Instructions / Description
              </label>
              <textarea
                rows={4}
                placeholder="Briefly explain what this assessment covers..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Duration (Minutes)
              </label>
              <input
                type="number"
                min="1"
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 italic">Leave empty for no time limit</p>
            </div>

            {/* Settings */}
            <div className="flex flex-col gap-4 pt-4 sm:pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Assessment is Active (Open for students)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.show_results}
                  onChange={(e) => setForm({ ...form, show_results: e.target.checked })}
                  className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show results to students immediately after submission</span>
              </label>
            </div>

          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          <Link
            href="/quickfire"
            className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-8 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50 shadow-md shadow-indigo-200 dark:shadow-none"
          >
            {submitting ? 'Creating...' : 'Create Assessment & Add Questions'}
          </button>
        </div>
      </form>
    </div>
  );
}

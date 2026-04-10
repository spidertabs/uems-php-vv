/* eslint-disable react-hooks/exhaustive-deps */
// src/app/courses/create/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Department {
  id: number;
  code: string;
  name: string;
  college_id: number;
}

interface College {
  id: number;
  code: string;
  name: string;
}

export default function CreateCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);

  const [formData, setFormData] = useState({
    code: '',
    title: '',
    level: 1,
    semester: 1,
    credit_units: 3,
    college_id: '',
    department_id: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    fetchCollegesAndDepartments();
  }, []);

  useEffect(() => {
    if (formData.college_id) {
      const filtered = departments.filter(
        (dept) => dept.college_id === parseInt(formData.college_id)
      );
      setFilteredDepartments(filtered);
      
      // Reset department if it doesn't belong to selected college
      if (formData.department_id) {
        const deptExists = filtered.some((d) => d.id === parseInt(formData.department_id));
        if (!deptExists) {
          setFormData((prev) => ({ ...prev, department_id: '' }));
        }
      }
    } else {
      setFilteredDepartments([]);
    }
  }, [formData.college_id, departments]);

  const fetchCollegesAndDepartments = async () => {
    try {
      const [collegesRes, departmentsRes] = await Promise.all([
        fetch('/api/colleges'),
        fetch('/api/departments'),
      ]);

      if (collegesRes.ok) {
        const data = await collegesRes.json();
        setColleges(data.colleges || []);
      }

      if (departmentsRes.ok) {
        const data = await departmentsRes.json();
        setDepartments(data.departments || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          college_id: formData.college_id ? parseInt(formData.college_id) : null,
          department_id: formData.department_id ? parseInt(formData.department_id) : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert('Course created successfully!');
        router.push(`/courses/${data.course.id}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create course');
      }
    } catch (error) {
      console.error('Create error:', error);
      alert('Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/courses"
          className="mb-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          ← Back to Courses
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Course</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Add a new course to the system
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Basic Information
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Course Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="e.g., CS101"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Credit Units <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="credit_units"
                value={formData.credit_units}
                onChange={handleChange}
                min="1"
                max="10"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Course Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Introduction to Computer Science"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Level <span className="text-red-500">*</span>
              </label>
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value={1}>Level 1</option>
                <option value={2}>Level 2</option>
                <option value={3}>Level 3</option>
                <option value={4}>Level 4</option>
                <option value={5}>Level 5</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Semester <span className="text-red-500">*</span>
              </label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value={1}>Semester 1</option>
                <option value={2}>Semester 2</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Assignment
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                College
              </label>
              <select
                name="college_id"
                value={formData.college_id}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select College</option>
                {colleges.map((college) => (
                  <option key={college.id} value={college.id}>
                    {college.name} ({college.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Department
              </label>
              <select
                name="department_id"
                value={formData.department_id}
                onChange={handleChange}
                disabled={!formData.college_id}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
              >
                <option value="">Select Department</option>
                {filteredDepartments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
              {!formData.college_id && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Select a college first
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Additional Details
          </h2>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Enter course description..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Active (course is available for use)
              </span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link
            href="/courses"
            className="rounded-lg border border-gray-300 px-6 py-2 font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Course'}
          </button>
        </div>
      </form>
    </div>
  );
}
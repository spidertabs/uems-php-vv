// src/app/programmes/create/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Department {
  id: number;
  department_name: string;
  college_name: string;
}

export default function CreateProgrammePage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    level: 'bachelors' as 'diploma' | 'bachelors' | 'masters' | 'phd',
    duration_years: 3,
    department_id: '',
    college_id: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/programmes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Programme created successfully!');
        router.push('/programmes');
      } else {
        alert(data.error || 'Failed to create programme');
      }
    } catch (error) {
      console.error('Error creating programme:', error);
      alert('Failed to create programme');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : type === 'number'
          ? parseInt(value)
          : value,
    }));
  };

  const degreeTypes: Array<'diploma' | 'bachelors' | 'masters' | 'phd'> = ['diploma', 'bachelors', 'masters', 'phd'];

  const levelDisplayNames: Record<string, string> = {
    diploma: 'Diploma',
    bachelors: 'Bachelors',
    masters: 'Masters',
    phd: 'PhD',
  };

  return (
    <div className="space-y-6 lg:pl-64">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            ➕ Create Programme
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Add a new academic programme to the system
          </p>
        </div>
        <Link
          href="/programmes"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
        >
          ← Back to Programmes
        </Link>
      </div>

      {/* Form */}
      <div className="mx-auto max-w-3xl">
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-white p-8 shadow-md dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="space-y-6">
            {/* Programme Code */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Programme Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                placeholder="e.g., BSC-CS-001"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500">
                Unique identifier for the programme
              </p>
            </div>

            {/* Programme Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Programme Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g., Bachelor of Science in Computer Science"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Level and Duration */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Level <span className="text-red-500">*</span>
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  {degreeTypes.map((type) => (
                    <option key={type} value={type}>
                      {levelDisplayNames[type]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Duration (Years) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="duration_years"
                  value={formData.duration_years}
                  onChange={handleChange}
                  required
                  min="1"
                  max="10"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                name="department_id"
                value={formData.department_id}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.department_name} ({dept.college_name})
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Brief description of the programme..."
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Programme is active
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-end gap-3">
            <Link
              href="/programmes"
              className="rounded-lg border border-gray-300 bg-white px-6 py-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:bg-blue-300"
            >
              {loading ? 'Creating...' : 'Create Programme'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
/* eslint-disable react-hooks/exhaustive-deps */
// src/app/courses/[id]/study-units/[unitId]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface StudyUnit {
  id: number;
  code: string;
  name: string;
  description: string;
  sequence_order: number;
  learning_outcomes: string;
  is_active: boolean;
}

export default function EditStudyUnitPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const unitId = params.unitId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    learning_outcomes: '',
    sequence_order: 0,
    is_active: true,
  });

  useEffect(() => {
    if (courseId && unitId) {
      fetchStudyUnit();
    }
  }, [courseId, unitId]);

  const fetchStudyUnit = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/study-units/${unitId}`);
      if (response.ok) {
        const data = await response.json();
        const unit: StudyUnit = data.study_unit;
        setFormData({
          code: unit.code,
          name: unit.name,
          description: unit.description || '',
          learning_outcomes: unit.learning_outcomes || '',
          sequence_order: unit.sequence_order,
          is_active: unit.is_active,
        });
      }
    } catch (error) {
      console.error('Failed to fetch study unit:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/courses/${courseId}/study-units/${unitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Study unit updated successfully!');
        router.push(`/courses/${courseId}/study-units/${unitId}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update study unit');
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update study unit');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/courses/${courseId}/study-units/${unitId}`}
          className="mb-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          ← Back to Study Unit
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Edit Study Unit
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Update study unit information
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
                Unit Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Sequence Order <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="sequence_order"
                value={formData.sequence_order}
                onChange={handleChange}
                required
                min="1"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Unit Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Learning Outcomes
            </label>
            <textarea
              name="learning_outcomes"
              value={formData.learning_outcomes}
              onChange={handleChange}
              rows={6}
              placeholder="What students should be able to do after completing this unit..."
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
                Active (unit is available for use)
              </span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link
            href={`/courses/${courseId}/study-units/${unitId}`}
            className="rounded-lg border border-gray-300 px-6 py-2 font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
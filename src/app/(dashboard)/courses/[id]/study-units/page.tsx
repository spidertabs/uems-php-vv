/* eslint-disable react-hooks/exhaustive-deps */
// src/app/courses/[id]/study-units/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface StudyUnit {
  id: number;
  code: string;
  name: string;
  description: string;
  sequence_order: number;
  learning_outcomes: string;
  is_active: boolean;
  created_by: number;
  created_by_name: string;
  questions_count: number;
  created_at: string;
}

interface Course {
  id: number;
  code: string;
  title: string;
}

export default function StudyUnitsPage() {
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [studyUnits, setStudyUnits] = useState<StudyUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  const fetchData = async () => {
    try {
      const [courseRes, unitsRes] = await Promise.all([
        fetch(`/api/courses/${courseId}`),
        fetch(`/api/courses/${courseId}/study-units`),
      ]);

      if (courseRes.ok) {
        const data = await courseRes.json();
        setCourse(data.course);
      }

      if (unitsRes.ok) {
        const data = await unitsRes.json();
        const units: StudyUnit[] = data.studyUnits || [];

        // Fetch all creator names
        const creatorsMap: Record<number, string> = {};
        await Promise.all(
          units.map(async (unit) => {
            if (!creatorsMap[unit.created_by]) {
              try {
                const res = await fetch(`/api/users/${unit.created_by}`);
                if (res.ok) {
                  const user = await res.json();
                  creatorsMap[unit.created_by] = user.name;
                } else {
                  creatorsMap[unit.created_by] = `User ${unit.created_by}`;
                }
              } catch {
                creatorsMap[unit.created_by] = `User ${unit.created_by}`;
              }
            }
          })
        );

        // Add creator names to study units
        const unitsWithNames = units.map((unit) => ({
          ...unit,
          created_by_name: creatorsMap[unit.created_by] || `User ${unit.created_by}`,
        }));

        setStudyUnits(unitsWithNames);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUnit = async (unitId: number) => {
    if (!confirm('Are you sure you want to delete this study unit? This will also delete all associated questions.')) return;

    try {
      const response = await fetch(`/api/courses/${courseId}/study-units/${unitId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setStudyUnits(studyUnits.filter((u) => u.id !== unitId));
        alert('Study unit deleted successfully');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete study unit');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete study unit');
    }
  };

  const handleToggleStatus = async (unitId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/study-units/${unitId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        setStudyUnits(
          studyUnits.map((u) =>
            u.id === unitId ? { ...u, is_active: data.study_unit.is_active } : u
          )
        );
      }
    } catch (error) {
      console.error('Toggle status error:', error);
    }
  };

  const filteredUnits = studyUnits.filter(
    (unit) =>
      unit.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <div>
        <Link
          href={`/courses/${courseId}`}
          className="mb-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          ← Back to Course
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Study Units</h1>
            {course && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {course.code} - {course.title}
              </p>
            )}
          </div>
          <Link
            href={`/courses/${courseId}/study-units/create`}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
          >
            ➕ Add Study Unit
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <input
          type="text"
          placeholder="Search study units by code or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {studyUnits.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Units</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {studyUnits.filter((u) => u.is_active).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Active Units</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {studyUnits.reduce((sum, u) => sum + u.questions_count, 0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Questions</div>
        </div>
      </div>

      {/* Study Units List */}
      {filteredUnits.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-6xl">📚</div>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No study units found
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {searchQuery ? 'Try adjusting your search' : 'Get started by adding your first study unit'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUnits
            .sort((a, b) => a.sequence_order - b.sequence_order)
            .map((unit) => (
              <div
                key={unit.id}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-200">
                        {unit.sequence_order}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/courses/${courseId}/study-units/${unit.id}`}
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
                            {unit.is_active ? 'Active' : 'Inactive'}
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

                    {unit.learning_outcomes && (
                      <div className="mt-3">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Learning Outcomes:
                        </span>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {unit.learning_outcomes}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div>
                        <span className="font-medium">Questions:</span>{' '}
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {unit.questions_count}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Created by:</span> {unit.created_by_name}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
                  <Link
                    href={`/courses/${courseId}/study-units/${unit.id}`}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    View Details
                  </Link>
                  <Link
                    href={`/courses/${courseId}/study-units/${unit.id}/edit`}
                    className="rounded-lg bg-gray-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-gray-700"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleToggleStatus(unit.id, unit.is_active)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium text-white transition ${
                      unit.is_active
                        ? 'bg-yellow-600 hover:bg-yellow-700'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {unit.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeleteUnit(unit.id)}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

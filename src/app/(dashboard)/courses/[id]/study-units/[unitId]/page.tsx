/* eslint-disable react-hooks/exhaustive-deps */
// src/app/courses/[id]/study-units/[unitId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
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
  created_by_name: string;
  course_code: string;
  course_title: string;
  created_at: string;
  updated_at: string;
}

interface Question {
  id: number;
  question_type: string;
  difficulty_level: string;
  question_text: string;
  marks: number;
  usage_count: number;
  is_active: boolean;
}

export default function StudyUnitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const unitId = params.unitId as string;

  const [studyUnit, setStudyUnit] = useState<StudyUnit | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId && unitId) {
      fetchData();
    }
  }, [courseId, unitId]);

  const fetchData = async () => {
    try {
      const [unitRes, questionsRes] = await Promise.all([
        fetch(`/api/courses/${courseId}/study-units/${unitId}`),
        fetch(`/api/questions?study_unit_id=${unitId}`),
      ]);

      if (unitRes.ok) {
        const data = await unitRes.json();
        setStudyUnit(data.study_unit);
      }

      if (questionsRes.ok) {
        const data = await questionsRes.json();
        setQuestions(data.questions || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this study unit? All associated questions will also be deleted.')) {
      return;
    }

    try {
      const response = await fetch(`/api/courses/${courseId}/study-units/${unitId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Study unit deleted successfully');
        router.push(`/courses/${courseId}/study-units`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete study unit');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete study unit');
    }
  };

  const toggleStatus = async () => {
    if (!studyUnit) return;

    try {
      const response = await fetch(`/api/courses/${courseId}/study-units/${unitId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !studyUnit.is_active }),
      });

      if (response.ok) {
        const data = await response.json();
        setStudyUnit(data.study_unit);
        alert(`Study unit ${data.study_unit.is_active ? 'activated' : 'deactivated'} successfully`);
      }
    } catch (error) {
      console.error('Toggle status error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!studyUnit) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Study unit not found
        </h2>
        <Link
          href={`/courses/${courseId}/study-units`}
          className="mt-4 inline-block text-blue-600 hover:text-blue-700"
        >
          ← Back to Study Units
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/courses/${courseId}/study-units`}
          className="mb-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          ← Back to Study Units
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-200">
                {studyUnit.sequence_order}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {studyUnit.code}
                  </h1>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      studyUnit.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {studyUnit.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <h2 className="mt-1 text-xl text-gray-700 dark:text-gray-300">
                  {studyUnit.name}
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {studyUnit.course_code} - {studyUnit.course_title}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/courses/${courseId}/study-units/${unitId}/edit`}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              ✏️ Edit
            </Link>
            <button
              onClick={toggleStatus}
              className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-yellow-700"
            >
              {studyUnit.is_active ? '❌ Deactivate' : '✅ Activate'}
            </button>
            <button
              onClick={handleDelete}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {questions.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Questions</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {questions.filter((q) => q.is_active).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Active Questions</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {questions.reduce((sum, q) => sum + q.usage_count, 0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Usage</div>
        </div>
      </div>

      {/* Study Unit Details */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Study Unit Information
        </h3>
        <div className="space-y-4">
          {studyUnit.description && (
            <div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Description:
              </span>
              <p className="mt-1 text-gray-900 dark:text-white">{studyUnit.description}</p>
            </div>
          )}
          {studyUnit.learning_outcomes && (
            <div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Learning Outcomes:
              </span>
              <p className="mt-1 whitespace-pre-line text-gray-900 dark:text-white">
                {studyUnit.learning_outcomes}
              </p>
            </div>
          )}
          <div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Created by:
            </span>
            <p className="mt-1 text-gray-900 dark:text-white">{studyUnit.created_by_name}</p>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Questions ({questions.length})
          </h3>
          <Link
            href={`/question-bank/create?study_unit_id=${unitId}&course_id=${courseId}`}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
          >
            ➕ Add Question
          </Link>
        </div>

        {questions.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-5xl">📝</div>
            <h4 className="mt-4 font-medium text-gray-900 dark:text-white">
              No questions yet
            </h4>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Add questions to this study unit to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((question) => (
              <Link
                key={question.id}
                href={`/question-bank/edit/${question.id}`}
                className="block rounded-lg border border-gray-200 p-4 transition hover:border-blue-500 hover:shadow-md dark:border-gray-700 dark:hover:border-blue-500"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {question.question_type.replace('_', ' ').toUpperCase()}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          question.difficulty_level === 'easy'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : question.difficulty_level === 'medium'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {question.difficulty_level.toUpperCase()}
                      </span>
                      <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        {question.marks} marks
                      </span>
                      {!question.is_active && (
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          INACTIVE
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-2 text-sm text-gray-900 dark:text-white">
                      {question.question_text}
                    </p>
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      Used {question.usage_count} time{question.usage_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-2xl text-gray-400">→</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap gap-4">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Created:</span>{' '}
            <span className="text-gray-900 dark:text-white">
              {new Date(studyUnit.created_at).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Last Updated:</span>{' '}
            <span className="text-gray-900 dark:text-white">
              {new Date(studyUnit.updated_at).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
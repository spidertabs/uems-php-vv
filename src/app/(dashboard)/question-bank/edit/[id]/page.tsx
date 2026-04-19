/* eslint-disable react-hooks/exhaustive-deps */ 
// src/app/(dashboard)/question-bank/edit/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Course {
  id: number;
  code: string;
  title: string;
}

interface StudyUnit {
  id: number;
  title: string;
  course_id: number;
}

export default function EditQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const questionId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [studyUnits, setStudyUnits] = useState<StudyUnit[]>([]);
  const [filteredStudyUnits, setFilteredStudyUnits] = useState<StudyUnit[]>([]);

  const [formData, setFormData] = useState({
    course_id: '',
    study_unit_id: '',
    question_text: '',
    question_type: 'Multiple Choice',
    marks: 1,
    difficulty_level: 'Medium',
    bloom_level: 'Understand',
    options: ['', '', '', ''],
    correct_answer: '',
    answer_explanation: '',
    tags: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, [questionId]);

  useEffect(() => {
    if (formData.course_id) {
      const filtered = studyUnits.filter(
        (unit) => unit.course_id === parseInt(formData.course_id)
      );
      setFilteredStudyUnits(filtered);
    } else {
      setFilteredStudyUnits([]);
    }
  }, [formData.course_id, studyUnits]);

  const fetchData = async () => {
    try {
      const [questionRes, coursesRes, studyUnitsRes] = await Promise.all([
        fetch(`/api/question-bank/${questionId}`),
        fetch('/api/courses'),
        fetch('/api/study-units'),
      ]);

      if (questionRes.ok) {
        const data = await questionRes.json();
        const question = data.question;

        setFormData({
          course_id: question.course_id?.toString() || '',
          study_unit_id: question.study_unit_id?.toString() || '',
          question_text: question.question_text || '',
          question_type: question.question_type || 'Multiple Choice',
          marks: question.marks || 1,
          difficulty_level: question.difficulty_level || 'Medium',
          bloom_level: question.bloom_level || 'Understand',
          options: question.options ? JSON.parse(question.options) : ['', '', '', ''],
          correct_answer: question.correct_answer || '',
          answer_explanation: question.answer_explanation || '',
          tags: question.tags || '',
        });
      }

      if (coursesRes.ok) {
        const data = await coursesRes.json();
        setCourses(data.courses || []);
      }

      if (studyUnitsRes.ok) {
        const data = await studyUnitsRes.json();
        setStudyUnits(data.studyUnits || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData((prev) => ({ ...prev, options: newOptions }));
  };

  const addOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, ''],
    }));
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, options: newOptions }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.course_id) newErrors.course_id = 'Course is required';
    if (!formData.question_text.trim()) newErrors.question_text = 'Question text is required';
    if (formData.marks < 1) newErrors.marks = 'Marks must be at least 1';

    if (formData.question_type === 'Multiple Choice') {
      const validOptions = formData.options.filter((opt) => opt.trim());
      if (validOptions.length < 2) {
        newErrors.options = 'At least 2 options are required';
      }
      if (!formData.correct_answer.trim()) {
        newErrors.correct_answer = 'Correct answer is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/question-bank/${questionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          study_unit_id: formData.study_unit_id || null,
          options:
            formData.question_type === 'Multiple Choice'
              ? formData.options.filter((opt) => opt.trim())
              : null,
          correct_answer: formData.correct_answer || null,
          answer_explanation: formData.answer_explanation || null,
          tags: formData.tags || null,
        }),
      });

      if (response.ok) {
        router.push('/question-bank');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update question');
      }
    } catch (error) {
      console.error('Submit failed:', error);
      alert('Failed to update question');
    } finally {
      setSaving(false);
    }
  };

  const questionTypes = [
    'Multiple Choice',
    'Short Answer',
    'Essay',
    'Problem Solving',
    'Practical',
  ];

  const difficultyLevels = ['Easy', 'Medium', 'Hard'];

  const bloomLevels = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center lg:pl-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:pl-64">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Question</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Update question details
          </p>
        </div>

        <Link
          href="/question-bank"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          ← Back
        </Link>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Course Information
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Course <span className="text-red-500">*</span>
              </label>
              <select
                name="course_id"
                value={formData.course_id}
                onChange={handleChange}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  errors.course_id
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600'
                } dark:bg-gray-700 dark:text-white`}
              >
                <option value="">Select a course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.title}
                  </option>
                ))}
              </select>
              {errors.course_id && (
                <p className="mt-1 text-xs text-red-500">{errors.course_id}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Study Unit (Optional)
              </label>
              <select
                name="study_unit_id"
                value={formData.study_unit_id}
                onChange={handleChange}
                disabled={!formData.course_id}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
              >
                <option value="">Select a study unit</option>
                {filteredStudyUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Question Details
          </h2>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Question Type <span className="text-red-500">*</span>
              </label>
              <select
                name="question_type"
                value={formData.question_type}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                {questionTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Question Text <span className="text-red-500">*</span>
              </label>
              <textarea
                name="question_text"
                value={formData.question_text}
                onChange={handleChange}
                rows={4}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  errors.question_text
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600'
                } dark:bg-gray-700 dark:text-white`}
                placeholder="Enter the question text..."
              />
              {errors.question_text && (
                <p className="mt-1 text-xs text-red-500">{errors.question_text}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Marks <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="marks"
                  value={formData.marks}
                  onChange={handleChange}
                  min="1"
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                    errors.marks
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600'
                  } dark:bg-gray-700 dark:text-white`}
                />
                {errors.marks && <p className="mt-1 text-xs text-red-500">{errors.marks}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Difficulty Level
                </label>
                <select
                  name="difficulty_level"
                  value={formData.difficulty_level}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  {difficultyLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Bloom&apos;s Taxonomy Level
                </label>
                <select
                  name="bloom_level"
                  value={formData.bloom_level}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  {bloomLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {formData.question_type === 'Multiple Choice' && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Answer Options
            </h2>

            <div className="space-y-3">
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  {formData.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              {errors.options && <p className="text-xs text-red-500">{errors.options}</p>}

              <button
                type="button"
                onClick={addOption}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                + Add Option
              </button>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Correct Answer <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="correct_answer"
                value={formData.correct_answer}
                onChange={handleChange}
                placeholder="Enter the correct answer (e.g., A or the full text)"
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  errors.correct_answer
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600'
                } dark:bg-gray-700 dark:text-white`}
              />
              {errors.correct_answer && (
                <p className="mt-1 text-xs text-red-500">{errors.correct_answer}</p>
              )}
            </div>
          </div>
        )}

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Additional Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Answer Explanation (Optional)
              </label>
              <textarea
                name="answer_explanation"
                value={formData.answer_explanation}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Provide an explanation for the correct answer..."
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tags (Optional)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="e.g., algebra, functions, derivatives (comma-separated)"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link
            href="/question-bank"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
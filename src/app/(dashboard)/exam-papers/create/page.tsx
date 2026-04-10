// src/app/exam-papers/create/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Course {
  id: number;
  code: string;
  title: string;
}

interface Programme {
  id: number;
  code: string;
  name: string;
  level: string;
  department_name: string | null;
  college_name: string | null;
}

export default function CreateExamPaperPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [selectedProgrammes, setSelectedProgrammes] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    course_id: '',
    exam_type: 'TEST',
    academic_year: new Date().getFullYear(),
    semester: 1,
    exam_date: '',
    duration: 60,
    instructions: '',
  });

  useEffect(() => {
    fetchCourses();
    fetchProgrammes();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  };

  const fetchProgrammes = async () => {
    try {
      const response = await fetch('/api/programmes');
      if (response.ok) {
        const data = await response.json();
        setProgrammes(data.programmes || []);
      }
    } catch (error) {
      console.error('Failed to fetch programmes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that at least one programme is selected
    if (selectedProgrammes.length === 0) {
      alert('Please select at least one programme for this exam paper');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/exam-papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          programme_ids: selectedProgrammes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert('Exam paper created successfully!');
        router.push(`/exam-papers/${data.paper_id}/select-questions`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create exam paper');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to create exam paper');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'course_id' || name === 'semester' || name === 'academic_year' || name === 'duration'
        ? parseInt(value) || ''
        : value,
    }));
  };

  const handleProgrammeToggle = (programmeId: number) => {
    setSelectedProgrammes((prev) =>
      prev.includes(programmeId)
        ? prev.filter((id) => id !== programmeId)
        : [...prev, programmeId]
    );
  };

  const handleSelectAllProgrammes = () => {
    if (selectedProgrammes.length === programmes.length) {
      setSelectedProgrammes([]);
    } else {
      setSelectedProgrammes(programmes.map((p) => p.id));
    }
  };

  // Helper to get year and semester display
  const getYearSemesterDisplay = (semester: number) => {
    const year = Math.ceil(semester / 2);
    const semInYear = semester % 2 === 0 ? 2 : 1;
    return `Year ${year}: ${semInYear}`;
  };

  return (
    <div className="space-y-6 lg:pl-64">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create Exam Paper
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Set up a new examination paper
          </p>
        </div>
        <Link
          href="/exam-papers"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          ← Back to Papers
        </Link>
      </div>

      {/* Form */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course Selection */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Course <span className="text-red-500">*</span>
            </label>
            <select
              name="course_id"
              value={formData.course_id}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.title}
                </option>
              ))}
            </select>
          </div>

          {/* Exam Type */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Exam Type <span className="text-red-500">*</span>
            </label>
            <select
              name="exam_type"
              value={formData.exam_type}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="TEST">Test</option>
              <option value="CAT">CAT</option>
              <option value="FINAL">Final Exam</option>
            </select>
          </div>

          {/* Academic Year and Semester */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Academic Year <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="academic_year"
                value={formData.academic_year}
                onChange={handleChange}
                required
                min="2020"
                max="2099"
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
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
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem} ({getYearSemesterDisplay(sem)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Exam Date and Duration */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Exam Date
              </label>
              <input
                type="date"
                name="exam_date"
                value={formData.exam_date}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Duration (minutes)
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                min="30"
                step="15"
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Programmes Selection */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Programmes <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleSelectAllProgrammes}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                {selectedProgrammes.length === programmes.length
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
            </div>
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              Select all programmes that will take this exam ({selectedProgrammes.length} selected)
            </p>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-gray-300 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700/50">
              {programmes.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No programmes available
                </p>
              ) : (
                programmes.map((programme) => (
                  <label
                    key={programme.id}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={selectedProgrammes.includes(programme.id)}
                      onChange={() => handleProgrammeToggle(programme.id)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {programme.code}
                        </span>
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          {programme.level}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {programme.name}
                      </p>
                      {(programme.department_name || programme.college_name) && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                          {[programme.department_name, programme.college_name]
                            .filter(Boolean)
                            .join(' • ')}
                        </p>
                      )}
                    </div>
                  </label>
                ))
              )}
            </div>
            {selectedProgrammes.length === 0 && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                Please select at least one programme
              </p>
            )}
          </div>

          {/* Instructions */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Instructions
            </label>
            <textarea
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              rows={4}
              placeholder="Enter exam instructions (e.g., Answer all questions, Time allowed: 2 hours...)"
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Link
              href="/exam-papers"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || selectedProgrammes.length === 0}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Paper & Add Questions'}
            </button>
          </div>
        </form>
      </div>

      {/* Info Box */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-600 dark:text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Next Steps
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <p>
                After creating the paper, you will be able to:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Select questions from the question bank</li>
                <li>Organize questions into sections</li>
                <li>Set custom marks for each question</li>
                <li>Preview the paper before submission</li>
                <li>Submit for HOD approval</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
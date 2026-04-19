/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
// src/app/exam-papers/[paperId]/edit/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Programme {
  id: number;
  code: string;
  name: string;
  level: string;
  department_name: string | null;
  college_name: string | null;
}

export default function EditExamPaperPage() {
  const router = useRouter();
  const params = useParams();
  const paperId = params.paperId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [selectedProgrammes, setSelectedProgrammes] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    exam_type: 'TEST',
    academic_year: new Date().getFullYear(),
    semester: 1,
    exam_date: '',
    duration: 60,
    instructions: '',
    footer_text: '',
  });

  useEffect(() => {
    if (paperId) {
      fetchPaper();
      fetchProgrammes();
    }
  }, [paperId]);

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

  const fetchPaper = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/exam-papers/${paperId}`);
      
      if (!response.ok) {
        console.error('Failed to load paper:', response.statusText);
        alert('Failed to load paper details');
        router.push('/exam-papers');
        return;
      }

      const data = await response.json();
      const paper = data.paper;
      
      setFormData({
        exam_type: paper.exam_type,
        academic_year: paper.academic_year,
        semester: paper.semester,
        exam_date: paper.exam_date ? paper.exam_date.split('T')[0] : '',
        duration: paper.duration || 60,
        instructions: paper.instructions || '',
        footer_text: paper.footer_text || '',
      });

      // Set selected programmes if they exist
      if (data.programmes && Array.isArray(data.programmes)) {
        setSelectedProgrammes(data.programmes.map((p: any) => p.id));
      }
    } catch (error) {
      console.error('Failed to fetch paper:', error);
      alert('Error loading paper details');
      router.push('/exam-papers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that at least one programme is selected
    if (selectedProgrammes.length === 0) {
      alert('Please select at least one programme for this exam paper');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/exam-papers/${paperId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          programme_ids: selectedProgrammes,
        }),
      });

      if (response.ok) {
        alert('Paper updated successfully!');
        router.push(`/exam-papers/${paperId}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update paper');
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update paper');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'semester' || name === 'academic_year' || name === 'duration'
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

  // Helper to format date for display (e.g., "Dec 24 2025")
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

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
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Edit Exam Paper
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Update paper details and programme assignments
          </p>
        </div>
        <Link
          href={`/exam-papers/${paperId}`}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          ← Back to Paper
        </Link>
      </div>

      {/* Form */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <form onSubmit={handleSubmit} className="space-y-6">
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              {formData.exam_date && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {formatDateForDisplay(formData.exam_date)}
                </p>
              )}
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
              rows={6}
              placeholder="Enter exam instructions..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Leave empty to use default instructions
            </p>
          </div>

          {/* Custom Footer Text */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Custom Footer Text
            </label>
            <input
              type="text"
              name="footer_text"
              value={formData.footer_text}
              onChange={handleChange}
              placeholder="*** END OF EXAMINATION ***"
              maxLength={100}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Leave empty to use default: &quot;*** END OF EXAMINATION ***&quot;
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Link
              href={`/exam-papers/${paperId}`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || selectedProgrammes.length === 0}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
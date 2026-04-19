/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/(dashboard)/exam-papers/[paperId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface ExamPaper {
  id: number;
  paper_code: string;
  course_code: string;
  course_title: string;
  exam_type: string;
  academic_year: number;
  semester: number;
  exam_date: string;
  duration: number;
  total_marks: number;
  instructions: string;
  status: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
  submitted_at: string;
  hod_name: string;
  dean_name: string;
}

interface Question {
  id: number;
  question_text: string;
  question_type: string;
  marks: number;
  section: string;
  sequence_order: number;
  difficulty_level: string;
  bloom_taxonomy: string;
  study_unit_name: string;
  options?: string | string[];
  option_order?: number[] | null;
  shuffledOptions?: string[];
}

interface Programme {
  id: number;
  code: string;
  name: string;
  level: string;
  duration_years: number;
  department_name: string | null;
  department_code: string | null;
  college_name: string | null;
  college_code: string | null;
}

interface User {
  role: string;
  id: number;
}

export default function ViewExamPaperPage() {
  const router = useRouter();
  const params = useParams();
  const paperId = params.paperId as string;

  const [paper, setPaper] = useState<ExamPaper | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState(false);

  // Helper function to parse options
  const parseOptions = (options: any): string[] | undefined => {
    if (!options) return undefined;

    if (typeof options === 'string') {
      try {
        const parsed = JSON.parse(options);
        if (Array.isArray(parsed)) {
          return parsed.map((opt) => (typeof opt === 'string' ? opt : opt.text));
        }
        return undefined;
      } catch {
        return undefined;
      }
    }

    if (Array.isArray(options)) {
      return options.map((opt) => (typeof opt === 'string' ? opt : opt.text));
    }

    return undefined;
  };

  // Helper function to apply saved order to options
  const applySavedOrder = <T,>(array: T[], order: number[]): T[] => {
    if (!order || order.length !== array.length) {
      return array;
    }
    return order.map((idx) => array[idx]);
  };

  useEffect(() => {
    fetchData();
  }, [paperId]);

  const fetchData = async () => {
    try {
      const [userRes, paperRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch(`/api/exam-papers/${paperId}`),
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
      }

      if (paperRes.ok) {
        const paperData = await paperRes.json();
        setPaper(paperData.paper);

        // Parse and apply shuffle order to questions
        const parsedQuestions = (paperData.questions || []).map((q: Question) => {
          const parsedOptions = parseOptions(q.options);

          if (q.question_type === 'multiple_choice' && parsedOptions) {
            let shuffledOptions: string[];

            if (q.option_order && Array.isArray(q.option_order)) {
              shuffledOptions = applySavedOrder(parsedOptions, q.option_order);
            } else {
              shuffledOptions = parsedOptions;
            }

            return {
              ...q,
              options: parsedOptions,
              shuffledOptions,
            };
          }

          return {
            ...q,
            options: parsedOptions,
          };
        });

        setQuestions(parsedQuestions);
        setProgrammes(paperData.programmes || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit this paper for approval?')) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/exam-papers/${paperId}/submit`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Paper submitted successfully!');
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit paper');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit paper');
    } finally {
      setProcessing(false);
    }
  };

  const handleReadyForPrint = async () => {
    if (!confirm('Mark this paper as ready for printing?')) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/exam-papers/${paperId}/ready-for-print`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Paper marked as ready for printing!');
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to mark as ready for print');
      }
    } catch (error) {
      console.error('Ready for print error:', error);
      alert('Failed to mark as ready for print');
    } finally {
      setProcessing(false);
    }
  };

  const handleStartPrinting = async () => {
    const quantity = prompt('Enter print quantity:', '50');
    if (!quantity || isNaN(Number(quantity))) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/exam-papers/${paperId}/start-print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: Number(quantity) }),
      });

      if (response.ok) {
        alert('Printing started!');
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to start printing');
      }
    } catch (error) {
      console.error('Start print error:', error);
      alert('Failed to start printing');
    } finally {
      setProcessing(false);
    }
  };

  const handleCompletePrinting = async () => {
    if (!confirm('Confirm that printing is complete?')) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/exam-papers/${paperId}/complete-print`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Printing completed!');
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to complete printing');
      }
    } catch (error) {
      console.error('Complete print error:', error);
      alert('Failed to complete printing');
    } finally {
      setProcessing(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm('Publish this exam paper?')) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/exam-papers/${paperId}/publish`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Paper published successfully!');
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to publish paper');
      }
    } catch (error) {
      console.error('Publish error:', error);
      alert('Failed to publish paper');
    } finally {
      setProcessing(false);
    }
  };

  const handleApproval = async () => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/exam-papers/${paperId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: approvalAction,
          comments,
        }),
      });

      if (response.ok) {
        alert(`Paper ${approvalAction === 'approve' ? 'approved' : 'rejected'} successfully!`);
        setShowApprovalModal(false);
        setComments('');
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to process approval');
      }
    } catch (error) {
      console.error('Approval error:', error);
      alert('Failed to process approval');
    } finally {
      setProcessing(false);
    }
  };

  // Helper to render MCQ options
  const renderMCQOptions = (shuffledOptions: string[] | undefined) => {
    if (!shuffledOptions || !Array.isArray(shuffledOptions)) return null;

    return (
      <div className="mt-3 ml-8 space-y-2">
        {shuffledOptions.map((option, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300"
          >
            <span className="font-semibold mt-0.5">{String.fromCharCode(65 + idx)}.</span>
            <span className="flex-1">{option}</span>
          </div>
        ))}
      </div>
    );
  };

  // Helper to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  // Permission checks
  const canEdit = user && paper && paper.created_by === user.id && paper.status === 'draft';
  const canSubmit =
    user && paper && paper.created_by === user.id && paper.status === 'draft' && questions.length > 0;
  const canApprove =
    user &&
    paper &&
    ((user.role === 'hod' && paper.status === 'submitted') ||
      (user.role === 'dean' && paper.status === 'hod_approved') ||
      user.role === 'admin');
  
  const canMarkReadyForPrint = user && paper && 
    ((user.role === 'hod' && paper.status === 'hod_approved') ||
     (user.role === 'dean' && paper.status === 'dean_approved') ||
     user.role === 'admin');
  
  const canPrint = user && paper &&
    ((user.role === 'exam_master' && ['ready_for_print', 'printing'].includes(paper.status)) ||
     user.role === 'admin');
  
  const canPublish = user && paper &&
    ((user.role === 'exam_master' && paper.status === 'printed') ||
     (user.role === 'admin' && ['printed', 'ready_for_print'].includes(paper.status)));
  
  const isAlreadyApproved = paper && 
    ['hod_approved', 'dean_approved', 'ready_for_print', 'printing', 'printed', 'published'].includes(paper.status);
  
  const isRejected = paper && 
    ['hod_rejected', 'dean_rejected'].includes(paper.status);

  const statusColors: { [key: string]: string } = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    hod_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    hod_approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    hod_rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    dean_approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    dean_rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    ready_for_print: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    printing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    printed: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    published: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  };

  const levelColors: { [key: string]: string } = {
    diploma: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    bachelors: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    masters: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    phd: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  };

  const difficultyColors: { [key: string]: string } = {
    easy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    hard: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  const bloomColors: { [key: string]: string } = {
    remember: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    understand: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    apply: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    analyze: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    evaluate: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    create: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  const calculatedMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center lg:pl-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="flex h-96 items-center justify-center lg:pl-64">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Paper not found</p>
          <Link
            href="/exam-papers"
            className="mt-4 inline-block text-blue-600 hover:underline dark:text-blue-400"
          >
            ← Back to Papers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:pl-64">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{paper.paper_code}</h1>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                statusColors[paper.status]
              }`}
            >
              {paper.status.replace(/_/g, ' ').toUpperCase()}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {paper.course_code} - {paper.course_title}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {paper.exam_type} • {paper.academic_year} • Semester {paper.semester}
          </p>
        </div>
        <Link
          href="/exam-papers"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          ← Back to Papers
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {questions.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Questions</div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {calculatedMarks}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Actual Marks</div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {paper.total_marks}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Target Marks</div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {paper.duration}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Minutes</div>
        </div>
      </div>

      {/* Warning if marks mismatch */}
      {calculatedMarks !== paper.total_marks && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
          <div className="flex items-center gap-2">
            <span className="text-orange-600 dark:text-orange-400">⚠️</span>
            <p className="text-sm text-orange-800 dark:text-orange-200">
              <strong>Marks Mismatch:</strong> Total marks from questions ({calculatedMarks}) doesn&apos;t
              match target marks ({paper.total_marks})
            </p>
          </div>
        </div>
      )}

      {/* Paper Details */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Paper Details</h2>
          {canEdit && (
            <Link
              href={`/exam-papers/${paperId}/edit`}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Edit Details →
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Exam Type
            </label>
            <p className="mt-1 text-gray-900 dark:text-white">{paper.exam_type}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Academic Year
            </label>
            <p className="mt-1 text-gray-900 dark:text-white">{paper.academic_year}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Semester
            </label>
            <p className="mt-1 text-gray-900 dark:text-white">Semester {paper.semester}</p>
          </div>

          {paper.exam_date && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Exam Date
              </label>
              <p className="mt-1 text-gray-900 dark:text-white">{formatDate(paper.exam_date)}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Created By
            </label>
            <p className="mt-1 text-gray-900 dark:text-white">{paper.created_by_name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Created At
            </label>
            <p className="mt-1 text-gray-900 dark:text-white">{formatDate(paper.created_at)}</p>
          </div>
        </div>

        {paper.instructions && (
          <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Instructions
            </label>
            <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
              {paper.instructions}
            </p>
          </div>
        )}
      </div>

      {/* Programmes Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Programmes ({programmes.length})
          </h2>
          {canEdit && (
            <Link
              href={`/exam-papers/${paperId}/edit`}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Manage Programmes →
            </Link>
          )}
        </div>

        {programmes.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-8 text-center dark:border-gray-600 dark:bg-gray-700/50">
            <div className="text-4xl">🎓</div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">No programmes assigned yet</p>
            {canEdit && (
              <Link
                href={`/exam-papers/${paperId}/edit`}
                className="mt-3 inline-block text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Assign Programmes →
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {programmes.map((programme) => (
              <div
                key={programme.id}
                className="rounded-lg border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 transition hover:shadow-md dark:border-gray-700 dark:from-gray-800 dark:to-gray-800/50"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {programme.code}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      levelColors[programme.level] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {programme.level.charAt(0).toUpperCase() + programme.level.slice(1)}
                  </span>
                </div>
                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {programme.name}
                </p>
                {(programme.department_name || programme.college_name) && (
                  <div className="mt-2 space-y-1 border-t border-gray-200 pt-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    {programme.department_name && (
                      <p className="flex items-center gap-1">
                        <span className="font-medium">Dept:</span>
                        <span>{programme.department_name}</span>
                      </p>
                    )}
                    {programme.college_name && (
                      <p className="flex items-center gap-1">
                        <span className="font-medium">College:</span>
                        <span>{programme.college_name}</span>
                      </p>
                    )}
                  </div>
                )}
                {programme.duration_years && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Duration: {programme.duration_years} year{programme.duration_years > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Questions ({questions.length})
          </h2>
          {canEdit && (
            <Link
              href={`/exam-papers/${paperId}/select-questions`}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              {questions.length === 0 ? '➕ Add Questions' : '✏️ Manage Questions'}
            </Link>
          )}
        </div>

        {questions.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-6xl">📝</div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">No questions added yet</p>
            {canEdit && (
              <Link
                href={`/exam-papers/${paperId}/select-questions`}
                className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Add Questions
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div
                key={question.id}
                className="rounded-lg border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800/50"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        {question.marks} marks
                      </span>
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        Section {question.section}
                      </span>
                      {question.option_order && (
                        <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-medium text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200">
                          🔀 Shuffled
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span
                      className={`rounded-full px-2.5 py-1 font-medium ${
                        difficultyColors[question.difficulty_level.toLowerCase()] ||
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {question.difficulty_level}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 font-medium ${
                        bloomColors[question.bloom_taxonomy.toLowerCase()] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {question.bloom_taxonomy}
                    </span>
                  </div>
                </div>

                <p className="text-base font-medium text-gray-900 dark:text-white mb-2">
                  {question.question_type === 'true_false' && (
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">True/False: </span>
                  )}
                  {question.question_text}
                </p>

                {question.question_type === 'multiple_choice' &&
                  renderMCQOptions(question.shuffledOptions)}

                {question.study_unit_name && (
                  <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    📚 Study Unit: {question.study_unit_name}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-3">
        <Link
          href={`/exam-papers/${paperId}/preview`}
          className="rounded-lg border border-blue-600 px-6 py-2.5 text-sm font-medium text-blue-700 transition hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20"
        >
          Preview Paper
        </Link>

        {/* Draft Status - Submit for Approval */}
        {canSubmit && (
          <button
            onClick={handleSubmit}
            disabled={processing}
            className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processing ? 'Submitting...' : '📤 Submit for Approval'}
          </button>
        )}

        {/* Rejected Status - Show rejection notice */}
        {isRejected && paper.created_by === user?.id && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
            ❌ Paper Rejected - Please revise and resubmit
          </div>
        )}

        {/* HOD/Dean Approval Actions */}
        {canApprove && !isAlreadyApproved && (
          <>
            <button
              onClick={() => {
                setApprovalAction('reject');
                setShowApprovalModal(true);
              }}
              disabled={processing}
              className="rounded-lg bg-red-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ❌ Reject
            </button>
            <button
              onClick={() => {
                setApprovalAction('approve');
                setShowApprovalModal(true);
              }}
              disabled={processing}
              className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ✅ Approve
            </button>
          </>
        )}

        {/* Already Approved - Show status */}
        {isAlreadyApproved && (user?.role === 'hod' || user?.role === 'dean') && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300">
            ✅ Already Approved
          </div>
        )}

        {/* Mark as Ready for Print */}
        {canMarkReadyForPrint && paper.status === 'hod_approved' && (
          <button
            onClick={handleReadyForPrint}
            disabled={processing}
            className="rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processing ? 'Processing...' : '🖨️ Ready for Print'}
          </button>
        )}

        {/* Exam Master - Printing Actions */}
        {canPrint && paper.status === 'ready_for_print' && (
          <button
            onClick={handleStartPrinting}
            disabled={processing}
            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processing ? 'Processing...' : '🖨️ Start Printing'}
          </button>
        )}

        {canPrint && paper.status === 'printing' && (
          <button
            onClick={handleCompletePrinting}
            disabled={processing}
            className="rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processing ? 'Processing...' : '✅ Complete Printing'}
          </button>
        )}

        {/* Publish Paper */}
        {canPublish && (
          <button
            onClick={handlePublish}
            disabled={processing}
            className="rounded-lg bg-cyan-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processing ? 'Publishing...' : '📢 Publish Paper'}
          </button>
        )}

        {/* Already Published */}
        {paper.status === 'published' && (
          <div className="rounded-lg bg-purple-50 border border-purple-200 px-4 py-2 text-sm text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300">
            📢 Published
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {approvalAction === 'approve' ? '✅ Approve Paper' : '❌ Reject Paper'}
            </h3>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={`Add ${
                approvalAction === 'reject' ? 'rejection reasons' : 'approval notes'
              } (optional)`}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setComments('');
                }}
                disabled={processing}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleApproval}
                disabled={processing}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  approvalAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {processing
                  ? 'Processing...'
                  : approvalAction === 'approve'
                  ? 'Confirm Approval'
                  : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
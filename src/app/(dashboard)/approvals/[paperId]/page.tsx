/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/approvals/[paperId]/page.tsx
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
  created_by_name: string;
  department_name: string;
  college_name: string;
  programmes: string[];
}

interface Question {
  id: number;
  section: string;
  question_number: string;
  sub_question_label: string | null;
  display_number: string;
  marks: number;
  question_text: string;
  question_type: string;
  options: any;
  indentation_level: number;
  parent_question_id: number | null;
}

interface Comment {
  id: number;
  user_name: string;
  user_role: string;
  comment_type: string;
  comment: string;
  created_at: string;
  is_resolved: boolean;
}

interface WorkflowHistory {
  id: number;
  action: string;
  from_status: string;
  to_status: string;
  actor_name: string;
  actor_role: string;
  comments: string;
  created_at: string;
}

export default function ApprovalReviewPage() {
  const router = useRouter();
  const params = useParams();
  const paperId = params.paperId as string;

  const [paper, setPaper] = useState<ExamPaper | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [history, setHistory] = useState<WorkflowHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');
  const [newComment, setNewComment] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [approvalComments, setApprovalComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchPaperDetails();
  }, [paperId]);

  const fetchPaperDetails = async () => {
    try {
      setLoading(true);
      const [paperRes, questionsRes, commentsRes, historyRes, userRes] = await Promise.all([
        fetch(`/api/exam-papers/${paperId}`),
        fetch(`/api/exam-papers/${paperId}/questions`),
        fetch(`/api/exam-papers/${paperId}/comments`),
        fetch(`/api/exam-papers/${paperId}/history`),
        fetch('/api/auth/me'),
      ]);

      if (paperRes.ok) {
        const paperData = await paperRes.json();
        setPaper(paperData.data);
      }

      if (questionsRes.ok) {
        const questionsData = await questionsRes.json();
        setQuestions(questionsData.data || []);
      }

      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setComments(commentsData.data || []);
      }

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData.data || []);
      }

      if (userRes.ok) {
        const userData = await userRes.json();
        setUserRole(userData.user.role);
      }
    } catch (error) {
      console.error('Failed to fetch paper details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`/api/exam-papers/${paperId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: newComment,
          comment_type: 'feedback',
        }),
      });

      if (response.ok) {
        setNewComment('');
        fetchPaperDetails();
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleApprove = async () => {
    try {
      const response = await fetch(`/api/approvals/${paperId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: approvalComments }),
      });

      if (response.ok) {
        alert('Paper approved successfully');
        router.push('/approvals');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to approve paper');
      }
    } catch (error) {
      console.error('Failed to approve paper:', error);
      alert('Failed to approve paper');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      const response = await fetch(`/api/approvals/${paperId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: rejectionReason }),
      });

      if (response.ok) {
        alert('Paper rejected successfully');
        router.push('/approvals');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to reject paper');
      }
    } catch (error) {
      console.error('Failed to reject paper:', error);
      alert('Failed to reject paper');
    }
  };

  const canApprove = () => {
    if (!paper) return false;
    if (userRole === 'hod') {
      return ['submitted', 'hod_review'].includes(paper.status);
    }
    if (userRole === 'dean') {
      return ['hod_approved', 'dean_review'].includes(paper.status);
    }
    return false;
  };

  const renderQuestion = (question: Question) => {
    const indent = question.indentation_level * 30;

    return (
      <div key={question.id} style={{ marginLeft: `${indent}px` }} className="mb-4">
        <div className="flex gap-2">
          <span className="font-semibold">{question.display_number}</span>
          <div className="flex-1">
            <p className="mb-2">{question.question_text}</p>

            {question.question_type === 'multiple_choice' && question.options && (
              <div className="ml-4 space-y-1">
                {Object.entries(question.options).map(([key, value]) => (
                  <div key={key}>
                    <span className="font-medium">{key})</span> {String(value)}
                  </div>
                ))}
              </div>
            )}

            {question.marks && (
              <div className="mt-2 text-sm text-gray-600">
                [{question.marks} {question.marks === 1 ? 'mark' : 'marks'}]
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSectionQuestions = (section: string) => {
    const sectionQuestions = questions.filter((q) => q.section === section);
    if (sectionQuestions.length === 0) return null;

    return (
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-bold">SECTION {section}</h2>
        {sectionQuestions.map(renderQuestion)}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-600">Paper not found</h2>
      </div>
    );
  }

  const sections = Array.from(new Set(questions.map((q) => q.section))).sort();

  return (
    <div className="space-y-6 lg:pl-64">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/approvals"
          className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-300 dark:bg-gray-700 dark:text-white"
        >
          ← Back to Approvals
        </Link>

        {canApprove() && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowRejectionModal(true)}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
            >
              ❌ Reject
            </button>
            <button
              onClick={() => setShowApprovalModal(true)}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
            >
              ✅ Approve
            </button>
          </div>
        )}
      </div>

      {/* Paper Preview */}
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-2xl font-bold uppercase text-gray-900 dark:text-white">
            {paper.college_name}
          </h1>
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
            {paper.department_name}
          </h2>
          <div className="my-4 border-t-2 border-b-2 border-gray-900 py-2 dark:border-white">
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {paper.exam_type} EXAMINATION - SEMESTER {paper.semester} {paper.academic_year}/
              {paper.academic_year + 1}
            </p>
          </div>
          <div className="mb-4 text-left text-gray-900 dark:text-white">
            <p>
              <strong>PAPER CODE:</strong> {paper.paper_code}
            </p>
            <p>
              <strong>COURSE CODE:</strong> {paper.course_code}
            </p>
            <p>
              <strong>COURSE TITLE:</strong> {paper.course_title}
            </p>
            <p>
              <strong>PROGRAMME(S):</strong> {paper.programmes.join(', ')}
            </p>
            <p>
              <strong>DATE:</strong> {new Date(paper.exam_date).toLocaleDateString()}
            </p>
            <p>
              <strong>TIME ALLOWED:</strong> {paper.duration} minutes
            </p>
            <p>
              <strong>TOTAL MARKS:</strong> {paper.total_marks}
            </p>
          </div>
        </div>

        {paper.instructions && (
          <div className="mb-6 rounded border border-gray-300 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700">
            <h3 className="mb-2 font-bold text-gray-900 dark:text-white">INSTRUCTIONS:</h3>
            <div className="whitespace-pre-wrap text-gray-900 dark:text-white">
              {paper.instructions}
            </div>
          </div>
        )}

        <div className="space-y-6 text-gray-900 dark:text-white">
          {sections.map((section) => renderSectionQuestions(section))}
        </div>
      </div>

      {/* Comments Section */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          Comments & Feedback
        </h3>

        <div className="mb-4 space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700"
            >
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {comment.user_name}
                  </span>
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    ({comment.user_role})
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(comment.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-900 dark:text-white">{comment.comment}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={handleAddComment}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Add Comment
          </button>
        </div>
      </div>

      {/* Workflow History */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          Workflow History
        </h3>
        <div className="space-y-3">
          {history.map((item) => (
            <div key={item.id} className="border-l-4 border-blue-500 bg-gray-50 p-4 dark:bg-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {item.action.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    by {item.actor_name} ({item.actor_role})
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(item.created_at).toLocaleString()}
                </span>
              </div>
              {item.comments && (
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{item.comments}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
            <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              Approve Paper
            </h3>
            <textarea
              value={approvalComments}
              onChange={(e) => setApprovalComments(e.target.value)}
              placeholder="Add approval comments (optional)..."
              className="mb-4 w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              rows={4}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
            <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              Reject Paper
            </h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason (required)..."
              className="mb-4 w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              rows={4}
              required
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRejectionModal(false)}
                className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
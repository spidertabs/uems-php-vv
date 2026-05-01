/* eslint-disable react-hooks/exhaustive-deps */
// src/app/(dashboard)/phd/candidates/[candidateId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  CANDIDATE_STATUS_LABELS,
  CANDIDATE_STATUS_COLORS,
  VIVA_STATUS_COLORS,
  OUTCOME_LABELS,
  OUTCOME_COLORS,
  EXAMINER_ROLE_LABELS,
  type CandidateWithDetails,
  type ThesisSubmission,
  type CandidateStatus,
  type VivaOutcome,
  type ExaminerRole,
  type VivaWithFullDetails,
} from '@/types/phd';

// ── Evaluation Types ────────────────────────────────────────────────────────

interface ExaminerRecord {
  examiner_id: number;
  user_id?: number;
  examiner_name: string;
  examiner_email: string;
  role: ExaminerRole;
  confirmed: boolean;
  evaluation_submitted: boolean;
  evaluation_id: number | null;
}

interface SubmittedEvaluation {
  id?: number;
  evaluation_id?: number;
  examiner_id: number;
  examiner_name: string;
  examiner_role?: string;
  originality_score: number | null;
  methodology_score: number | null;
  presentation_score: number | null;
  literature_score: number | null;
  strengths: string | null;
  weaknesses: string | null;
  recommended_corrections: string | null;
  general_comments: string | null;
  is_submitted: boolean;
  submitted_at?: string;
}

interface EvaluationDraft {
  id?: number;
  originality_score: string;
  methodology_score: string;
  presentation_score: string;
  literature_score: string;
  strengths: string;
  weaknesses: string;
  recommended_corrections: string;
  general_comments: string;
  is_submitted: boolean;
}

const EMPTY_DRAFT: EvaluationDraft = {
  originality_score: '',
  methodology_score: '',
  presentation_score: '',
  literature_score: '',
  strengths: '',
  weaknesses: '',
  recommended_corrections: '',
  general_comments: '',
  is_submitted: false,
};

const EVALUATOR_ONLY_ROLES = ['lecturer', 'professor', 'external_examiner'];
const MANAGER_ROLES = ['admin', 'hod', 'exam_master', 'viva_coordinator', 'dean'];

// ── Sub-components for Evaluation ──────────────────────────────────────────

function ScoreBar({ score, max = 25 }: { score: number | null; max?: number }) {
  if (score === null || score === undefined) return <span className="text-xs text-gray-400">—</span>;
  const pct = (score / max) * 100;
  const color = pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 rounded-full bg-gray-100 dark:bg-gray-700">
        <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">{score}/{max}</span>
    </div>
  );
}

function SubmittedEvaluationCard({ ev, fmt }: { ev: SubmittedEvaluation; fmt: (s: string) => string }) {
  const total = (ev.originality_score ?? 0) + (ev.methodology_score ?? 0) + (ev.presentation_score ?? 0) + (ev.literature_score ?? 0);
  const hasScores = ev.originality_score !== null;
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{ev.examiner_name}</p>
          {ev.examiner_role && (
            <p className="text-xs capitalize text-gray-500 dark:text-gray-400">
              {ev.examiner_role.replace('_', ' ')}
              {ev.submitted_at && ` · Submitted ${fmt(ev.submitted_at)}`}
            </p>
          )}
        </div>
        {hasScores && (
          <div className="rounded-lg bg-emerald-50 px-4 py-2 text-right dark:bg-emerald-900/30">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{total}</span>
            <span className="text-sm text-gray-500">/100</span>
          </div>
        )}
      </div>
      {hasScores && (
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-4">
            {[
              { label: 'Originality', score: ev.originality_score },
              { label: 'Methodology', score: ev.methodology_score },
              { label: 'Presentation', score: ev.presentation_score },
              { label: 'Literature Review', score: ev.literature_score },
            ].map(row => (
              <div key={row.label} className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  <span>{row.label}</span>
                  <span>{row.score}/25</span>
                </div>
                <ScoreBar score={row.score} />
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {[
              { label: 'Strengths', val: ev.strengths, color: 'border-emerald-500' },
              { label: 'Weaknesses', val: ev.weaknesses, color: 'border-orange-500' },
              { label: 'Corrections', val: ev.recommended_corrections, color: 'border-blue-500' },
              { label: 'Comments', val: ev.general_comments, color: 'border-purple-500' },
            ].filter(r => r.val).map(r => (
              <div key={r.label} className={`rounded-lg border-l-4 ${r.color} bg-gray-50 p-3 dark:bg-gray-700/40`}>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">{r.label}</p>
                <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{r.val}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface VivaRecord {
  viva_id: number;
  scheduled_date: string;
  scheduled_time: string;
  venue: string;
  viva_status: string;
  outcome: string | null;
}

interface CurrentUser {
  id: number;
  role: string;
  email?: string;
  name?: string;
}

// Tabs available depend on role
type Tab = 'thesis' | 'viva' | 'evaluation' | 'edit';

export default function CandidateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const candidateId = params.candidateId as string;

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [candidate, setCandidate] = useState<CandidateWithDetails | null>(null);
  const [theses, setTheses] = useState<ThesisSubmission[]>([]);
  const [vivas, setVivas] = useState<VivaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('viva');

  // Upload modal state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ file_name: '', file_path: '', file_size_kb: '', submission_notes: '' });
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Edit state
  const [editForm, setEditForm] = useState<{
    thesis_title?: string;
    status?: CandidateStatus;
    programme_id?: number | null;
    supervisor_id?: number | null;
    co_supervisor_id?: number | null;
  }>({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Dropdown options
  const [programmes, setProgrammes] = useState<Array<{ id: number; code: string; name: string }>>([]);
  const [supervisors, setSupervisors] = useState<Array<{ id: number; name: string }>>([]);
  const [programmeLoading, setProgrammeLoading] = useState(false);
  const [supervisorLoading, setSupervisorLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => setCurrentUser(d.user ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchAll();
    fetchProgrammes();
    fetchSupervisors();
  }, [candidateId]);

  // Evaluation state
  const searchParams = useSearchParams();
  const [selectedVivaId, setSelectedVivaId] = useState<number | null>(
    searchParams.get('vivaId') ? parseInt(searchParams.get('vivaId')!) : null
  );
  const [evaluations, setEvaluations] = useState<SubmittedEvaluation[]>([]);
  const [examiners, setExaminers] = useState<ExaminerRecord[]>([]);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalError, setEvalError] = useState('');
  const [evaluationSummary, setEvaluationSummary] = useState<any>(null);
  const [myExaminerRecord, setMyExaminerRecord] = useState<ExaminerRecord | null>(null);

  // Schedule Management States (Ported from Schedules page)
  const [vivaDetail, setVivaDetail] = useState<VivaWithFullDetails | null>(null);
  const [eligibleStaff, setEligibleStaff] = useState<any[]>([]);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [showPostpone, setShowPostpone] = useState(false);
  const [postponeReason, setPostponeReason] = useState('');
  const [postponeLoading, setPostponeLoading] = useState(false);
  const [recForm, setRecForm] = useState<{ outcome: VivaOutcome | ''; correction_deadline: string; final_comments: string }>({
    outcome: '', correction_deadline: '', final_comments: '',
  });
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState('');
  const [draft, setDraft] = useState<EvaluationDraft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [draftError, setDraftError] = useState('');

  useEffect(() => {
    const tabParam = searchParams.get('tab') as Tab;
    if (tabParam && ['thesis', 'viva', 'evaluation', 'edit'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    const vId = searchParams.get('vivaId');
    if (vId) setSelectedVivaId(parseInt(vId));
  }, [searchParams]);

  useEffect(() => {
    // Default to first viva if on evaluation tab and none selected
    if (activeTab === 'evaluation' && !selectedVivaId && vivas.length > 0) {
      setSelectedVivaId(vivas[0].viva_id);
    }
    // Reset if switching candidates and ID no longer exists in history
    if (selectedVivaId && vivas.length > 0 && !vivas.some(v => v.viva_id === selectedVivaId)) {
      setSelectedVivaId(vivas[0].viva_id);
    }
  }, [activeTab, selectedVivaId, vivas, candidateId]);

  useEffect(() => {
    if (selectedVivaId && (activeTab === 'evaluation' || activeTab === 'viva')) {
      fetchEvaluationData(selectedVivaId);
    }
  }, [activeTab, selectedVivaId, currentUser]);

  useEffect(() => {
    if ((activeTab === 'viva' || showAssignForm) && eligibleStaff.length === 0) {
      fetch('/api/phd/eligible-examiners')
        .then(r => r.json())
        .then(d => setEligibleStaff(d.staff || []));
    }
  }, [activeTab, showAssignForm, eligibleStaff.length]);

  const fetchEvaluationData = async (vId: number) => {
    setEvalLoading(true);
    setDraftError('');
    try {
      const res = await fetch(`/api/phd/schedules/${vId}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const v = data.viva ?? data.viva_details ?? data.data ?? data.schedule ?? data;
        setVivaDetail(v);
        setEvaluationSummary(v.evaluation_summary || null);
        
        const allEvaluators: ExaminerRecord[] = [
          ...(v.examiners || []),
          ...((v as any).supervisors || []).map((s: any) => ({
            examiner_id: s.supervisor_id,
            user_id: s.user_id,
            examiner_name: s.supervisor_name,
            examiner_email: s.supervisor_email,
            role: s.role as any,
            confirmed: true,
            evaluation_submitted: false,
            evaluation_id: null,
          })),
        ];

        // 1. De-duplicate first
        const uniqueEntries = new Map<number, ExaminerRecord>();
        allEvaluators.forEach(e => {
          uniqueEntries.set(Number(e.examiner_id), e);
        });
        const unique = Array.from(uniqueEntries.values());

        // 2. Update submission status on the UNIQUE entries
        if (v.evaluations) {
          v.evaluations.forEach((ev: any) => {
            const match = unique.find(
              e => String(e.examiner_id) === String(ev.examiner_id) ||
                   String(e.user_id) === String(ev.examiner_id)
            );
            if (match) {
              match.evaluation_submitted = ev.is_submitted || false;
              match.evaluation_id = ev.id || ev.evaluation_id || null;
            }
          });
          setEvaluations(v.evaluations);
        }
        
        setExaminers(unique);

        if (currentUser) {
          const userIdStr = String(currentUser.id);
          const me = unique.find(ex => 
            String(ex.examiner_id) === userIdStr || 
            (ex.user_id && String(ex.user_id) === userIdStr) ||
            (ex.examiner_email && currentUser.email && ex.examiner_email.toLowerCase() === currentUser.email.toLowerCase())
          );
          
          if (me) {
            setMyExaminerRecord(me);
            const myEval = v.evaluations?.find((ev: any) => String(ev.examiner_id) === String(me.examiner_id));
            if (myEval) {
              prefillDraft(myEval);
            }
          } else {
            // Check if current user is an assigned supervisor/co-supervisor of the candidate
            // even if they are not explicitly on the viva's panel yet.
            if (candidate && (
              Number(candidate.supervisor_id) === Number(currentUser.id) || 
              Number(candidate.co_supervisor_id) === Number(currentUser.id)
            )) {
              const existingEval = v.evaluations?.find((ev: any) => Number(ev.examiner_id) === Number(currentUser.id));
              setMyExaminerRecord({
                examiner_id: currentUser.id,
                user_id: currentUser.id,
                examiner_name: currentUser.name || 'Current User',
                examiner_email: currentUser.email || '',
                role: (Number(candidate.supervisor_id) === Number(currentUser.id) ? 'supervisor' : 'co_supervisor') as ExaminerRole,
                confirmed: true,
                evaluation_submitted: existingEval ? !!existingEval.is_submitted : false,
                evaluation_id: existingEval ? (existingEval.id || existingEval.evaluation_id || null) : null
              });
            } else {
              setMyExaminerRecord(null);
            }
          }
        }
      } else {
        setEvalError('Failed to load viva details. Please ensure this viva belongs to the current candidate.');
        setVivaDetail(null);
      }
    } catch (err) {
      console.error('Failed to fetch evaluation data:', err);
      setEvalError('A network error occurred while loading evaluation data.');
      setVivaDetail(null);
    } finally {
      setEvalLoading(false);
    }
  };

  // Schedule Management Actions
  const handleConfirmExaminer = async (exId: number) => {
    if (!selectedVivaId) return;
    await fetch(`/api/phd/schedules/${selectedVivaId}/examiners/${exId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmed: true }),
    });
    fetchEvaluationData(selectedVivaId);
  };

  const handleRemoveExaminer = async (exId: number) => {
    if (!selectedVivaId || !confirm('Remove this examiner?')) return;
    await fetch(`/api/phd/schedules/${selectedVivaId}/examiners/${exId}`, { method: 'DELETE' });
    fetchEvaluationData(selectedVivaId);
  };

  const handleAssignManually = async (exId: number, role: ExaminerRole, slot?: number) => {
    if (!selectedVivaId) return;
    setAssignError('');
    setAssignLoading(true);
    try {
      const res = await fetch(`/api/phd/schedules/${selectedVivaId}/examiners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examiner_id: exId, role, panel_slot: slot }),
      });
      if (!res.ok) {
        const d = await res.json();
        setAssignError(d.error || 'Failed to assign');
      } else {
        fetchEvaluationData(selectedVivaId);
      }
    } finally {
      setAssignLoading(false);
    }
  };

  const handleCompleteViva = async () => {
    if (!selectedVivaId || !confirm('Mark this viva as completed?')) return;
    await fetch(`/api/phd/schedules/${selectedVivaId}/complete`, { method: 'POST' });
    fetchEvaluationData(selectedVivaId);
  };

  const handlePostponeViva = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVivaId) return;
    setPostponeLoading(true);
    await fetch(`/api/phd/schedules/${selectedVivaId}/postpone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postponement_reason: postponeReason }),
    });
    setShowPostpone(false);
    setPostponeLoading(false);
    fetchEvaluationData(selectedVivaId);
  };

  const handleRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVivaId) return;
    setRecError('');
    if (!recForm.outcome) { setRecError('Please select an outcome.'); return; }
    if (recForm.outcome !== 'pass' && !recForm.correction_deadline) {
      setRecError('A correction deadline is required.'); return;
    }
    setRecLoading(true);
    try {
      const res = await fetch(`/api/phd/schedules/${selectedVivaId}/recommendation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recForm),
      });
      if (!res.ok) {
        const d = await res.json();
        setRecError(d.error || 'Failed');
      } else {
        fetchEvaluationData(selectedVivaId);
      }
    } finally {
      setRecLoading(false);
    }
  };
  const prefillDraft = (ev: SubmittedEvaluation) => {
    setDraft({
      id: ev.id ?? ev.evaluation_id,
      originality_score: ev.originality_score?.toString() ?? '',
      methodology_score: ev.methodology_score?.toString() ?? '',
      presentation_score: ev.presentation_score?.toString() ?? '',
      literature_score: ev.literature_score?.toString() ?? '',
      strengths: ev.strengths ?? '',
      weaknesses: ev.weaknesses ?? '',
      recommended_corrections: ev.recommended_corrections ?? '',
      general_comments: ev.general_comments ?? '',
      is_submitted: Boolean(ev.is_submitted),
    });
  };

  const handleSaveDraft = async () => {
    if (!selectedVivaId) return;
    setSaving(true); setSaveMsg(''); setDraftError('');
    try {
      const res = await fetch('/api/phd/my-evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          viva_id: selectedVivaId,
          examiner_id: currentUser?.id,
          originality_score: parseInt(draft.originality_score) || null,
          methodology_score: parseInt(draft.methodology_score) || null,
          presentation_score: parseInt(draft.presentation_score) || null,
          literature_score: parseInt(draft.literature_score) || null,
          strengths: draft.strengths || null,
          weaknesses: draft.weaknesses || null,
          recommended_corrections: draft.recommended_corrections || null,
          general_comments: draft.general_comments || null,
        }),
      });
      if (res.ok) { setSaveMsg('Draft saved ✓'); fetchEvaluationData(selectedVivaId); }
      else { const d = await res.json(); setDraftError(d.error || 'Save failed.'); }
    } catch { setDraftError('Network error.'); }
    finally { setSaving(false); }
  };

  const handleSubmitEvaluation = async () => {
    if (!selectedVivaId) return;
    const allScoresFilled = draft.originality_score && draft.methodology_score && draft.presentation_score && draft.literature_score;
    if (!allScoresFilled) { setDraftError('All four score fields are required before submitting.'); return; }
    if (!confirm('Submit your evaluation? This cannot be undone.')) return;
    setSubmitting(true); setDraftError('');
    try {
      const res = await fetch('/api/phd/my-evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          viva_id: selectedVivaId,
          examiner_id: currentUser?.id,
          originality_score: parseInt(draft.originality_score),
          methodology_score: parseInt(draft.methodology_score),
          presentation_score: parseInt(draft.presentation_score),
          literature_score: parseInt(draft.literature_score),
          strengths: draft.strengths || null,
          weaknesses: draft.weaknesses || null,
          recommended_corrections: draft.recommended_corrections || null,
          general_comments: draft.general_comments || null,
        }),
      });
      const saveResult = await res.json();
      if (!res.ok) { setDraftError(saveResult.error || 'Save failed.'); return; }
      const evalId = saveResult.data?.id;
      if (evalId) {
        const subRes = await fetch(`/api/phd/evaluations/${evalId}/submit`, { method: 'POST' });
        if (subRes.ok) { fetchEvaluationData(selectedVivaId); return; }
        const d = await subRes.json(); setDraftError(d.error || 'Submit failed.');
      }
    } catch { setDraftError('Network error.'); }
    finally { setSubmitting(false); }
  };

  const fetchAll = async () => {
    try {
      const [cRes, tRes, vRes] = await Promise.all([
        fetch(`/api/phd/candidates/${candidateId}`),
        fetch(`/api/phd/candidates/${candidateId}/thesis`),
        fetch(`/api/phd/schedules?candidate_id=${candidateId}`),
      ]);
      if (cRes.status === 401) { router.push('/auth/login'); return; }
      if (cRes.ok) {
        const d = await cRes.json();
        setCandidate(d.candidate);
        setEditForm({
          thesis_title: d.candidate.thesis_title,
          status: d.candidate.status,
          programme_id: d.candidate.programme_id,
          supervisor_id: d.candidate.supervisor_id,
          co_supervisor_id: d.candidate.co_supervisor_id,
        });
      }
      if (tRes.ok) { const d = await tRes.json(); setTheses(d.submissions || []); }
      if (vRes.ok) { const d = await vRes.json(); setVivas(d.schedules || []); }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgrammes = async () => {
    try {
      setProgrammeLoading(true);
      const res = await fetch('/api/phd/programmes');
      if (res.ok) { const d = await res.json(); setProgrammes(d.programmes || []); }
    } catch (err) { console.error(err); }
    finally { setProgrammeLoading(false); }
  };

  const fetchSupervisors = async () => {
    try {
      setSupervisorLoading(true);
      const res = await fetch('/api/phd/eligible-supervisors');
      if (res.ok) {
        const d = await res.json();
        setSupervisors(
          (d.staff || []).map((u: { id: number; first_name: string; last_name: string }) => ({
            id: u.id,
            name: `${u.first_name} ${u.last_name}`.trim(),
          }))
        );
      }
    } catch (err) { console.error(err); }
    finally { setSupervisorLoading(false); }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');
    setUploadLoading(true);
    try {
      const res = await fetch(`/api/phd/candidates/${candidateId}/thesis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...uploadForm, file_size_kb: parseInt(uploadForm.file_size_kb) || null }),
      });
      const data = await res.json();
      if (!res.ok) { setUploadError(data.error || 'Upload failed'); return; }
      setShowUpload(false);
      setUploadForm({ file_name: '', file_path: '', file_size_kb: '', submission_notes: '' });
      fetchAll();
    } catch {
      setUploadError('Network error. Please try again.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    setEditSuccess('');
    setEditLoading(true);
    try {
      const res = await fetch(`/api/phd/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error || 'Update failed'); return; }
      setEditSuccess('Candidate updated successfully.');
      fetchAll();
    } catch {
      setEditError('Network error. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const resetEditForm = () => {
    if (!candidate) return;
    setEditForm({
      thesis_title: candidate.thesis_title,
      status: candidate.status,
      programme_id: candidate.programme_id,
      supervisor_id: candidate.supervisor_id,
      co_supervisor_id: candidate.co_supervisor_id,
    });
    setEditError('');
    setEditSuccess('');
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const formatFileSize = (kb: number | null) => {
    if (!kb) return '—';
    if (kb < 1024) return `${kb} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const isHodOrAdmin = currentUser && MANAGER_ROLES.includes(currentUser.role);
  const isEvaluatorOnly = currentUser && EVALUATOR_ONLY_ROLES.includes(currentUser.role);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="lg:pl-64 py-12 text-center">
        <div className="text-5xl">🔍</div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Candidate not found.</p>
        <Link href="/phd/candidates" className="mt-3 inline-block text-emerald-600 hover:underline">
          ← Back to Candidates
        </Link>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'viva', label: `📅 Viva History (${vivas.length})` },
    { key: 'evaluation', label: `📝 My Evaluation` },
    ...(isHodOrAdmin ? [{ key: 'edit' as Tab, label: '✏️ Edit Details' }] : []),
  ];

  return (
    <div className="space-y-6 lg:pl-64">
      <Link href="/phd/candidates" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">
        ← Back to Candidates
      </Link>

      {/* Header Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{candidate.candidate_name}</h1>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${CANDIDATE_STATUS_COLORS[candidate.status]}`}>
                {CANDIDATE_STATUS_LABELS[candidate.status]}
              </span>
            </div>
            <p className="mt-1 font-mono text-sm text-gray-500 dark:text-gray-400">{candidate.registration_number}</p>
            <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {candidate.programme_code} — {candidate.programme_name}
            </p>
            <p className="mt-3 max-w-2xl text-sm italic text-gray-600 dark:text-gray-400">
              &ldquo;{candidate.thesis_title}&rdquo;
            </p>
          </div>
          <div className="space-y-1 text-right text-sm text-gray-600 dark:text-gray-400">
            {candidate.supervisor_name && (
              <p>👤 <span className="font-medium">Supervisor:</span> {candidate.supervisor_name}</p>
            )}
            {candidate.co_supervisor_name && (
              <p>👤 <span className="font-medium">Co-Supervisor:</span> {candidate.co_supervisor_name}</p>
            )}
            {candidate.enrolment_year && (
              <p>📅 <span className="font-medium">Enrolled:</span> {candidate.enrolment_year}</p>
            )}
          </div>
        </div>

        {/* Evaluator notice */}
        {isEvaluatorOnly && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2.5 text-sm text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
            <span>ℹ️</span>
            <span>You are viewing this candidate as an assigned examiner or supervisor. Edit access is restricted to HOD/Admin.</span>
          </div>
        )}

        {/* Tabs */}
        <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex gap-6">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                  activeTab === t.key
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Tab: Thesis (Omitted) ── */}
      {activeTab === 'thesis' && (
        <div className="py-12 text-center text-gray-500">
          Thesis submissions are managed elsewhere.
        </div>
      )}

      {/* ── Tab: Viva (Integrated Management) ── */}
      {activeTab === 'viva' && (
        <div className="space-y-4">
          {!selectedVivaId ? (
            // Viva History List
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Viva History</h2>
                {isHodOrAdmin && (
                  <Link
                    href={`/phd/schedules/new?candidate_id=${candidateId}`}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white transition-colors hover:bg-emerald-700"
                  >
                    + Schedule Viva
                  </Link>
                )}
              </div>
              {vivas.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white py-12 text-center shadow-md dark:border-gray-700 dark:bg-gray-800">
                  <div className="text-5xl">📅</div>
                  <p className="mt-3 text-gray-600 dark:text-gray-400">No viva scheduled yet.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {vivas.map((v) => (
                    <div
                      key={v.viva_id}
                      onClick={() => setSelectedVivaId(v.viva_id)}
                      className="cursor-pointer group relative rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${VIVA_STATUS_COLORS[v.viva_status as keyof typeof VIVA_STATUS_COLORS]}`}>
                          {v.viva_status.replace('_', ' ')}
                        </span>
                        {v.outcome && (
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${OUTCOME_COLORS[v.outcome as keyof typeof OUTCOME_COLORS]}`}>
                            {OUTCOME_LABELS[v.outcome as keyof typeof OUTCOME_LABELS]}
                          </span>
                        )}
                      </div>
                      <div className="mt-4">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">📅 {formatDate(v.scheduled_date)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">⏰ {v.scheduled_time.slice(0, 5)} · 📍 {v.venue}</p>
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-emerald-400">
                        View Details →
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Viva Detail View (Integrated)
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <button 
                onClick={() => setSelectedVivaId(null)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 dark:text-gray-400"
              >
                ← Back to History
              </button>
              
              {!vivaDetail || evalLoading ? (
                 <div className="flex h-64 items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                   <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600" />
                 </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary & Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl dark:bg-emerald-900">
                        📅
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          Viva on {formatDate(vivaDetail.scheduled_date)}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {vivaDetail.scheduled_time.slice(0, 5)} · {vivaDetail.venue}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${VIVA_STATUS_COLORS[vivaDetail.status as keyof typeof VIVA_STATUS_COLORS]}`}>
                        {vivaDetail.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {vivaDetail.recommendation?.outcome && (
                        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${OUTCOME_COLORS[vivaDetail.recommendation.outcome as keyof typeof OUTCOME_COLORS]}`}>
                          {OUTCOME_LABELS[vivaDetail.recommendation.outcome as keyof typeof OUTCOME_LABELS]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Integrated Content Sections */}
                  <div className="grid gap-6 lg:grid-cols-3">
                    {/* Panel Section */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-700">
                          <h4 className="font-bold text-gray-900 dark:text-white">Exam Information</h4>
                        </div>
                        <div className="p-5 space-y-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            The examination panel details have been moved to the Evaluation tab for a cleaner workflow.
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs uppercase font-bold text-gray-400">Status:</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${VIVA_STATUS_COLORS[vivaDetail.status as keyof typeof VIVA_STATUS_COLORS]}`}>
                              {vivaDetail.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Final Recommendation */}
                      {isHodOrAdmin && (vivaDetail.status === 'completed' || vivaDetail.status === 'scheduled') && (
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
                          <h4 className="mb-4 font-bold text-gray-900 dark:text-white">🏁 Final Recommendation</h4>
                          {vivaDetail.recommendation?.outcome ? (
                            <div className="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-900/10">
                              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                                Decision: {OUTCOME_LABELS[vivaDetail.recommendation.outcome as keyof typeof OUTCOME_LABELS]}
                              </p>
                              {vivaDetail.recommendation.correction_deadline && (
                                <p className="text-xs text-emerald-600 mt-1">Correction Deadline: {formatDate(vivaDetail.recommendation.correction_deadline)}</p>
                              )}
                              {vivaDetail.recommendation.final_comments && (
                                <p className="mt-2 text-sm italic text-gray-600 dark:text-gray-400">&ldquo;{vivaDetail.recommendation.final_comments}&rdquo;</p>
                              )}
                            </div>
                          ) : (
                            <form onSubmit={handleRecommendation} className="space-y-4">
                              <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                  <label className="mb-1 block text-xs font-bold text-gray-400 uppercase">Outcome</label>
                                  <select
                                    value={recForm.outcome}
                                    onChange={(e) => setRecForm(p => ({ ...p, outcome: e.target.value as any }))}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                  >
                                    <option value="">Select Outcome...</option>
                                    {Object.entries(OUTCOME_LABELS).map(([k, v]) => (
                                      <option key={k} value={k}>{v}</option>
                                    ))}
                                  </select>
                                </div>
                                {recForm.outcome && recForm.outcome !== 'pass' && (
                                  <div>
                                    <label className="mb-1 block text-xs font-bold text-gray-400 uppercase">Correction Deadline</label>
                                    <input
                                      type="date"
                                      value={recForm.correction_deadline}
                                      onChange={(e) => setRecForm(p => ({ ...p, correction_deadline: e.target.value }))}
                                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                  </div>
                                )}
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-bold text-gray-400 uppercase">Consensus Remarks</label>
                                <textarea
                                  value={recForm.final_comments}
                                  onChange={(e) => setRecForm(p => ({ ...p, final_comments: e.target.value }))}
                                  rows={2}
                                  placeholder="Summarize the panel agreement..."
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                              </div>
                              {recError && <p className="text-xs text-red-500 font-medium">{recError}</p>}
                              <button
                                type="submit"
                                disabled={recLoading}
                                className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 disabled:opacity-50"
                              >
                                {recLoading ? 'Processing...' : '💾 Save & Finalize Viva'}
                              </button>
                            </form>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quick Access Column */}
                    <div className="space-y-6">
                      {['admin', 'viva_coordinator', 'dean', 'hod'].includes(currentUser?.role || '') && (
                        <div className="flex gap-3">
                          <Link
                            href={`/phd/report/${selectedVivaId}`}
                            className="w-full rounded-lg bg-gray-800 py-2 text-center text-sm font-bold text-white hover:bg-gray-900 dark:bg-gray-700"
                          >
                            Generate Formal Report
                          </Link>
                        </div>
                      )}
                      <button 
                        onClick={() => setActiveTab('evaluation')}
                        className="w-full rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 text-left text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
                      >
                        <p className="text-sm font-medium opacity-90">Ready to score?</p>
                        <h4 className="text-xl font-bold">Go to Evaluation 📝</h4>
                        <p className="mt-2 text-xs opacity-75">Fill out or view individual scores for this viva session.</p>
                      </button>

                      {isHodOrAdmin && vivaDetail.status === 'scheduled' && (
                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-md dark:border-gray-700 dark:bg-gray-800">
                          <h4 className="mb-4 text-xs font-bold text-gray-400 uppercase">Viva Management</h4>
                          <div className="space-y-2">
                             <button onClick={handleCompleteViva} className="w-full rounded-lg bg-emerald-50 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400">
                               ✅ Mark as Conducted
                             </button>
                             <button onClick={() => setShowPostpone(true)} className="w-full rounded-lg bg-amber-50 py-2 text-sm font-bold text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400">
                               ⏳ Postpone Viva
                             </button>
                          </div>
                        </div>
                      )}
                      
                      {showPostpone && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-900/20">
                          <h4 className="mb-2 text-sm font-bold text-amber-800 dark:text-amber-300 italic underline tracking-widest text-center uppercase">Postponement Reason</h4>
                          <form onSubmit={handlePostponeViva} className="space-y-3">
                            <textarea
                              value={postponeReason}
                              onChange={(e) => setPostponeReason(e.target.value)}
                              required
                              rows={2}
                              className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm focus:outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                            />
                            <div className="flex gap-2">
                              <button type="button" onClick={() => setShowPostpone(false)} className="flex-1 text-xs text-gray-500">Cancel</button>
                              <button type="submit" disabled={postponeLoading} className="flex-1 rounded-lg bg-amber-600 py-1.5 text-xs font-bold text-white disabled:opacity-50">
                                {postponeLoading ? 'Savng...' : 'Confirm'}
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Evaluation ── */}
      {activeTab === 'evaluation' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Viva Evaluation</h2>
              {['admin', 'viva_coordinator', 'dean', 'hod'].includes(currentUser?.role || '') && selectedVivaId && (
                <Link
                  href={`/phd/report/${selectedVivaId}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  📋 Report
                </Link>
              )}
            </div>
            {vivas.length > 1 && (
              <select
                value={selectedVivaId || ''}
                onChange={(e) => setSelectedVivaId(parseInt(e.target.value) || null)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">— Select Viva —</option>
                {vivas.map(v => (
                  <option key={v.viva_id} value={v.viva_id}>
                    {formatDate(v.scheduled_date)} ({v.viva_status})
                  </option>
                ))}
              </select>
            )}
          </div>

          {!selectedVivaId ? (
            <div className="rounded-xl border border-gray-200 bg-white py-12 text-center shadow-md dark:border-gray-700 dark:bg-gray-800">
              <div className="text-5xl">📝</div>
              <p className="mt-3 text-gray-600 dark:text-gray-400">Select a viva to view or fill out an evaluation.</p>
              {vivas.length > 0 && (
                <button
                  onClick={() => setSelectedVivaId(vivas[0].viva_id)}
                  className="mt-4 text-sm font-medium text-emerald-600 hover:underline"
                >
                  View latest viva →
                </button>
              )}
            </div>
          ) : evalLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600" />
            </div>
          ) : evalError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center shadow-md dark:border-red-900/30 dark:bg-red-900/20">
              <div className="mb-3 text-3xl">⚠️</div>
              <p className="text-red-600 dark:text-red-400 font-medium">{evalError}</p>
              <button 
                onClick={() => selectedVivaId && fetchEvaluationData(selectedVivaId)}
                className="mt-4 text-sm font-semibold text-emerald-600 hover:underline"
              >
                Try reloading data
              </button>
            </div>
          ) : !vivaDetail ? (
            <div className="rounded-xl border border-gray-200 bg-white py-12 text-center shadow-md dark:border-gray-700 dark:bg-gray-800">
               <p className="text-gray-500">Could not retrieve details for this viva. It may belong to another candidate.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Overall Panel Summary (Visible to all if any submissions exist) */}
              {evaluationSummary && evaluationSummary.submitted_count > 0 && (
                <div className="rounded-xl border border-gray-200 bg-emerald-50/30 p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800/20">
                  <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                    Panel Summary ({evaluationSummary.submitted_count}/{evaluationSummary.total_examiners} Submitted)
                  </h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                    {[
                      { label: 'Originality', val: evaluationSummary.avg_originality, max: 25 },
                      { label: 'Methodology', val: evaluationSummary.avg_methodology, max: 25 },
                      { label: 'Presentation', val: evaluationSummary.avg_presentation, max: 25 },
                      { label: 'Literature', val: evaluationSummary.avg_literature, max: 25 },
                      { label: 'Overall', val: evaluationSummary.avg_overall, max: 100 },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl bg-white p-3 text-center shadow-sm dark:bg-gray-800">
                        <div className={`text-xl font-bold ${s.label === 'Overall' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                          {s.val !== null && s.val !== undefined ? s.val.toFixed(1) : '—'}
                        </div>
                        <div className="text-[10px] uppercase text-gray-500">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* If user is an examiner, show their form or their summary */}
              {myExaminerRecord && (
                <div className="space-y-5">
                  {myExaminerRecord.evaluation_submitted ? (
                    <div className="space-y-5">
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-700 dark:bg-emerald-900/20">
                        <div className="flex items-center gap-3 text-emerald-800 dark:text-emerald-200">
                          <span className="text-2xl">✅</span>
                          <div>
                            <p className="font-bold">Evaluation Submitted</p>
                            <p className="text-sm">Your evaluation has been officially recorded.</p>
                          </div>
                        </div>
                      </div>
                      {evaluations.find(ev => String(ev.examiner_id) === String(myExaminerRecord.examiner_id)) && (
                        <SubmittedEvaluationCard
                          ev={evaluations.find(ev => String(ev.examiner_id) === String(myExaminerRecord.examiner_id))!}
                          fmt={formatDate}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
                        <h3 className="mb-5 font-semibold text-gray-900 dark:text-white">Scoring (out of 100)</h3>
                        <div className="grid gap-6 md:grid-cols-2">
                          {[
                            { key: 'originality_score' as keyof EvaluationDraft, label: 'Originality' },
                            { key: 'methodology_score' as keyof EvaluationDraft, label: 'Methodology' },
                            { key: 'presentation_score' as keyof EvaluationDraft, label: 'Presentation' },
                            { key: 'literature_score' as keyof EvaluationDraft, label: 'Literature Review' },
                          ].map(f => (
                            <div key={f.key} className="flex items-center justify-between gap-4">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{f.label}</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number" min={0} max={25}
                                  value={draft[f.key] as string}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const n = parseInt(val);
                                    if (val === '' || (!isNaN(n) && n >= 0 && n <= 25)) {
                                      setDraft(p => ({ ...p, [f.key]: val }));
                                    }
                                  }}
                                  className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-center text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                                <span className="text-xs text-gray-400">/25</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
                        <h3 className="mb-5 font-semibold text-gray-900 dark:text-white">Feedback</h3>
                        <div className="space-y-4">
                          {[
                            { key: 'strengths' as keyof EvaluationDraft, label: 'Strengths', placeholder: 'Key strengths...' },
                            { key: 'weaknesses' as keyof EvaluationDraft, label: 'Weaknesses', placeholder: 'Areas for improvement...' },
                            { key: 'recommended_corrections' as keyof EvaluationDraft, label: 'Corrections', placeholder: 'Specific corrections needed...' },
                            { key: 'general_comments' as keyof EvaluationDraft, label: 'General Comments', placeholder: 'Overall remarks...' },
                          ].map(f => (
                            <div key={f.key}>
                              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{f.label}</label>
                              <textarea
                                value={draft[f.key] as string}
                                onChange={(e) => setDraft(p => ({ ...p, [f.key]: e.target.value }))}
                                rows={3}
                                placeholder={f.placeholder}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={handleSaveDraft}
                          disabled={saving}
                          className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          {saving ? 'Saving...' : '💾 Save Draft'}
                        </button>
                        <button
                          onClick={handleSubmitEvaluation}
                          disabled={submitting}
                          className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {submitting ? 'Submitting...' : '✅ Submit Evaluation'}
                        </button>
                        {saveMsg && <span className="text-sm text-emerald-600 font-medium">{saveMsg}</span>}
                        {draftError && <span className="text-sm text-red-600 font-medium">{draftError}</span>}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {!myExaminerRecord && !MANAGER_ROLES.includes(currentUser?.role || '') && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-8 text-center shadow-sm dark:border-indigo-900/30 dark:bg-indigo-900/20">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40">
                    <span className="text-2xl">📋</span>
                  </div>
                  <h3 className="mt-4 text-sm font-medium text-indigo-900 dark:text-indigo-100">Evaluator Assignment</h3>
                  <p className="mt-2 text-sm text-indigo-700 dark:text-indigo-300">
                    You are not assigned as an examiner or supervisor for this specific viva session.
                  </p>
                  <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-400">
                    If you believe this is an error, please contact the HOD or Viva Coordinator.
                  </p>
                </div>
              )}

              {/* Manager only view: Show all evaluations & Summary Table */}
              {MANAGER_ROLES.includes(currentUser?.role || '') && (
                <div className="space-y-6">
                  <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:bg-gray-900/50">
                        <tr>
                          <th className="px-6 py-4">Examiner (ID)</th>
                          <th className="px-6 py-4">Role</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Score</th>
                          <th className="px-6 py-4 text-center">Eval ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {examiners.map(ex => {
                          const ev = evaluations.find(e => String(e.examiner_id) === String(ex.examiner_id));
                          const total = ev ? (ev.originality_score ?? 0) + (ev.methodology_score ?? 0) + (ev.presentation_score ?? 0) + (ev.literature_score ?? 0) : null;
                          return (
                            <tr key={ex.examiner_id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                              <td className="px-6 py-4">
                                <span className="font-medium text-gray-900 dark:text-white">{ex.examiner_name}</span>
                                <span className="ml-2 text-[10px] text-gray-400">#{ex.examiner_id}</span>
                              </td>
                              <td className="px-6 py-4 capitalize text-gray-500">{ex.role.replace('_', ' ')}</td>
                              <td className="px-6 py-4">
                                {ev?.is_submitted ? (
                                  <span className="text-emerald-600 font-medium">Submitted ✓</span>
                                ) : (
                                  <span className="text-amber-500">Pending</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {total !== null ? (
                                  <span className="font-bold text-gray-900 dark:text-white">{total}/100</span>
                                ) : '—'}
                              </td>
                              <td className="px-6 py-4 text-center text-[10px] font-mono text-gray-400">
                                {ev?.id || ev?.evaluation_id || '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {evaluations.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-white py-12 text-center dark:border-gray-700 dark:bg-gray-800">
                      <p className="text-gray-500">No submitted evaluations for this viva yet.</p>
                      <p className="text-xs text-gray-400 mt-1">{examiners.filter(e => !e.evaluation_submitted).length} examiners pending.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid gap-6">
                        {evaluations.filter(ev => ev.is_submitted).map(ev => (
                          <SubmittedEvaluationCard key={ev.id} ev={ev} fmt={formatDate} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Edit (HOD/Admin only) ── */}
      {activeTab === 'edit' && isHodOrAdmin && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-5 text-lg font-semibold text-gray-900 dark:text-white">Edit Candidate Details</h2>

          {editError && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
              {editError}
            </div>
          )}
          {editSuccess && (
            <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
              ✅ {editSuccess}
            </div>
          )}

          <form onSubmit={handleEdit} className="max-w-lg space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Thesis Title</label>
              <textarea
                value={editForm.thesis_title || ''}
                onChange={(e) => setEditForm(p => ({ ...p, thesis_title: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                PhD Programme <span className="text-red-500">*</span>
              </label>
              <select
                value={editForm.programme_id || ''}
                onChange={(e) => setEditForm(p => ({ ...p, programme_id: parseInt(e.target.value) || undefined }))}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">— Select Programme —</option>
                {programmeLoading ? (
                  <option disabled>Loading programmes...</option>
                ) : programmes.map(p => (
                  <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Primary Supervisor <span className="text-red-500">*</span>
              </label>
              <select
                value={editForm.supervisor_id || ''}
                onChange={(e) => setEditForm(p => ({ ...p, supervisor_id: parseInt(e.target.value) || undefined }))}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">— Select Supervisor —</option>
                {supervisorLoading ? (
                  <option disabled>Loading supervisors...</option>
                ) : supervisors.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Co-Supervisor <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <select
                value={editForm.co_supervisor_id || ''}
                onChange={(e) => setEditForm(p => ({
                  ...p,
                  co_supervisor_id: e.target.value ? parseInt(e.target.value) : null,
                }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">— No Co-Supervisor —</option>
                {supervisorLoading ? (
                  <option disabled>Loading supervisors...</option>
                ) : supervisors
                    .filter(s => s.id !== editForm.supervisor_id)
                    .map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Candidate Status</label>
              <select
                value={editForm.status || ''}
                onChange={(e) => setEditForm(p => ({ ...p, status: e.target.value as CandidateStatus }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                {(Object.entries(CANDIDATE_STATUS_LABELS) as [CandidateStatus, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={resetEditForm}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                Reset
              </button>
              <button type="submit" disabled={editLoading}
                className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
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
  const [activeTab, setActiveTab] = useState<Tab>('thesis');

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
  const [myExaminerRecord, setMyExaminerRecord] = useState<ExaminerRecord | null>(null);
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
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === 'evaluation' && selectedVivaId) {
      fetchEvaluationData(selectedVivaId);
    }
  }, [activeTab, selectedVivaId]);

  const fetchEvaluationData = async (vId: number) => {
    setEvalLoading(true);
    setDraftError('');
    try {
      const res = await fetch(`/api/phd/schedules/${vId}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const v = data.schedule ?? data.viva ?? data;
        
        const allEvaluators: ExaminerRecord[] = [
          ...(v.examiners || []),
          ...((v as any).supervisors || []).map((s: any) => ({
            examiner_id: s.supervisor_id,
            user_id: s.supervisor_id,
            examiner_name: s.supervisor_name,
            examiner_email: s.supervisor_email,
            role: s.role as any,
            confirmed: true,
            evaluation_submitted: false,
            evaluation_id: null,
          })),
        ];

        if (v.evaluations) {
          v.evaluations.forEach((ev: any) => {
            const match = allEvaluators.find(
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
        
        const unique = Array.from(new Map(allEvaluators.map(e => [Number(e.examiner_id), e])).values());
        setExaminers(unique);

        if (currentUser) {
          let me = unique.find(ex => String(ex.examiner_id) === String(currentUser.id) || String(ex.user_id) === String(currentUser.id));
          const myEval = v.evaluations?.find((ev: any) => String(ev.examiner_id) === String(currentUser.id));
          if (myEval) {
            prefillDraft(myEval);
            if (!me) {
              me = {
                examiner_id: currentUser.id,
                examiner_name: myEval.examiner_name || 'Your Evaluation',
                examiner_email: '',
                role: (myEval.examiner_role as any) || 'supervisor',
                confirmed: true,
                evaluation_submitted: myEval.is_submitted,
                evaluation_id: myEval.id || null,
              };
            }
          }
          if (me) setMyExaminerRecord(me);
        }
      }
    } catch (err) {
      console.error('Failed to fetch evaluation data:', err);
    } finally {
      setEvalLoading(false);
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

  // Role enum: lecturer | professor | external_examiner | hod | dean | exam_master | viva_coordinator | admin
  const MANAGER_ROLES = ['admin', 'hod', 'exam_master', 'viva_coordinator', 'dean'];
  const EVALUATOR_ONLY_ROLES = ['lecturer', 'professor', 'external_examiner'];
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

  // Build tabs based on role
  const tabs: { key: Tab; label: string }[] = [
    { key: 'thesis', label: `📤 Thesis Versions (${theses.length})` },
    { key: 'viva', label: `📅 Viva History (${vivas.length})` },
    // Show evaluation tab if there are vivas or if one is selected
    { key: 'evaluation', label: `📝 My Evaluation` },
    // Only HOD/Admin can edit candidate details
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

      {/* ── Tab: Thesis ── */}
      {activeTab === 'thesis' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Thesis Submissions</h2>
            {/* Only HOD/Admin can upload thesis versions */}
            {isHodOrAdmin && (
              <button
                onClick={() => setShowUpload(true)}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white transition-colors hover:bg-emerald-700"
              >
                + Upload New Version
              </button>
            )}
          </div>

          {theses.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white py-12 text-center shadow-md dark:border-gray-700 dark:bg-gray-800">
              <div className="text-5xl">📄</div>
              <p className="mt-3 text-gray-600 dark:text-gray-400">No thesis submitted yet.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800">
              {theses
                .slice()
                .sort((a, b) => b.version - a.version)
                .map((t) => (
                  <div key={t.id} className="flex items-start justify-between gap-4 border-b border-gray-200 p-5 last:border-0 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-xl dark:bg-emerald-900">
                        📄
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Version {t.version}{' '}
                          {t.version === Math.max(...theses.map(x => x.version)) && (
                            <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                              Latest
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t.file_name}</p>
                        {t.submission_notes && (
                          <p className="mt-1 text-xs italic text-gray-400 dark:text-gray-500">{t.submission_notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right text-sm">
                      <p className="text-gray-600 dark:text-gray-400">{formatDate(t.submitted_at)}</p>
                      <p className="text-gray-500">{formatFileSize(t.file_size_kb)}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Upload Modal */}
          {showUpload && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800">
                <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Upload Thesis Version</h3>
                {uploadError && (
                  <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
                    {uploadError}
                  </div>
                )}
                <form onSubmit={handleUpload} className="space-y-4">
                  {[
                    { name: 'file_name', label: 'File Name', placeholder: 'thesis_v2.pdf', required: true },
                    { name: 'file_path', label: 'File Path (server)', placeholder: '/uploads/theses/...', required: true },
                    { name: 'file_size_kb', label: 'File Size (KB)', placeholder: '4820', required: false },
                  ].map((f) => (
                    <div key={f.name}>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{f.label}</label>
                      <input
                        type="text"
                        value={(uploadForm as Record<string, string>)[f.name]}
                        onChange={(e) => setUploadForm(p => ({ ...p, [f.name]: e.target.value }))}
                        placeholder={f.placeholder}
                        required={f.required}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Submission Notes</label>
                    <textarea
                      value={uploadForm.submission_notes}
                      onChange={(e) => setUploadForm(p => ({ ...p, submission_notes: e.target.value }))}
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowUpload(false)}
                      className="flex-1 rounded-lg border border-gray-300 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
                      Cancel
                    </button>
                    <button type="submit" disabled={uploadLoading}
                      className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50">
                      {uploadLoading ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Viva History ── */}
      {activeTab === 'viva' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Viva History</h2>
            {/* Only HOD/Admin can schedule vivas */}
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
            <div className="space-y-3">
              {vivas.map((v) => (
                <div key={v.viva_id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-md dark:border-gray-700 dark:bg-gray-800">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${VIVA_STATUS_COLORS[v.viva_status as keyof typeof VIVA_STATUS_COLORS]}`}>
                        {v.viva_status.replace('_', ' ').toUpperCase()}
                      </span>
                      {v.outcome && (
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${OUTCOME_COLORS[v.outcome as keyof typeof OUTCOME_COLORS]}`}>
                          {OUTCOME_LABELS[v.outcome as keyof typeof OUTCOME_LABELS]}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                      📅 {formatDate(v.scheduled_date)} · ⏰ {v.scheduled_time.slice(0, 5)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">📍 {v.venue}</p>
                  </div>
                  <div className="flex gap-2">
                    {/* Evaluators can go directly to their evaluation */}
                    {isEvaluatorOnly && (
                      <button
                        onClick={() => {
                          setSelectedVivaId(v.viva_id);
                          setActiveTab('evaluation');
                        }}
                        className="rounded-lg bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-200"
                      >
                        📝 My Evaluation
                      </button>
                    )}
                    <Link
                      href={`/phd/schedules/${v.viva_id}`}
                      className="rounded-lg bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-200"
                    >
                      {v.outcome ? 'View Report' : 'View Viva'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Evaluation ── */}
      {activeTab === 'evaluation' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Viva Evaluation</h2>
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
          ) : (
            <div className="space-y-6">
              {/* If user is an examiner, show their form or their summary */}
              {myExaminerRecord && !MANAGER_ROLES.includes(currentUser?.role || '') && (
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
                      {evaluations.find(ev => String(ev.examiner_id) === String(currentUser?.id)) && (
                        <SubmittedEvaluationCard
                          ev={evaluations.find(ev => String(ev.examiner_id) === String(currentUser?.id))!}
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

              {/* Manager view: Show all evaluations */}
              {(!myExaminerRecord || MANAGER_ROLES.includes(currentUser?.role || '')) && (
                <div className="space-y-6">
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
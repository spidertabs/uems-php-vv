/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
// src/app/(dashboard)/phd/evaluations/[vivaId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  OUTCOME_LABELS,
  OUTCOME_COLORS,
  EXAMINER_ROLE_LABELS,
  type VivaOutcome,
  type ExaminerRole,
} from '@/types/phd';

// ─── Types ─────────────────────────────────────────────────────────────────

interface VivaInfo {
  viva_id?: number;
  id?: number;
  candidate_id: number;
  candidate_name: string;
  registration_number: string;
  programme_code: string;
  programme_name: string;
  thesis_title: string;
  scheduled_date: string;
  scheduled_time: string;
  venue: string;
  status?: string;
  viva_status?: string;
  outcome: VivaOutcome | null;
  outcome_notes: string | null;
  issued_at: string | null;
  examiners?: ExaminerRecord[];
  evaluations?: SubmittedEvaluation[];
}

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

type Tab = 'my_evaluation' | 'all_evaluations' | 'examiners' | 'outcome';

interface CurrentUser {
  id: number;
  role: string;
}

// ─── Sub-components ──────────────────────────────────────────────────────

function ScoreBar({ score, max = 25 }: { score: number | null; max?: number }) {
  if (score === null || score === undefined) {
    return <span className="text-xs text-gray-400 dark:text-gray-500">—</span>;
  }
  const pct = (score / max) * 100;
  const color = pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 rounded-full bg-gray-100 dark:bg-gray-700">
        <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">
        {score}/{max}
      </span>
    </div>
  );
}

function Field({ label, required = false, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}{required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

const VIVA_STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  completed:  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  postponed:  'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  cancelled:  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

// ─── Submitted evaluation read-only card ──────────────────────────────────

function SubmittedEvaluationCard({ ev, fmt }: { ev: SubmittedEvaluation; fmt: (s: string) => string }) {
  const total =
    (ev.originality_score ?? 0) +
    (ev.methodology_score ?? 0) +
    (ev.presentation_score ?? 0) +
    (ev.literature_score ?? 0);
  const hasScores = ev.originality_score !== null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
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
            <span className="text-sm text-gray-500 dark:text-gray-400">/100</span>
          </div>
        )}
      </div>

      {hasScores && (
        <div className="grid gap-8 md:grid-cols-2 mb-5">
          <div className="space-y-4">
            {[
              { label: 'Originality',       score: ev.originality_score },
              { label: 'Methodology',       score: ev.methodology_score },
              { label: 'Presentation',      score: ev.presentation_score },
              { label: 'Literature Review', score: ev.literature_score },
            ].map(row => (
              <div key={row.label} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <span>{row.label}</span>
                  <span>{row.score}/25</span>
                </div>
                <ScoreBar score={row.score} max={25} />
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {[
              { label: 'Strengths',   val: ev.strengths,               color: 'border-emerald-500' },
              { label: 'Weaknesses',  val: ev.weaknesses,              color: 'border-orange-500' },
              { label: 'Corrections', val: ev.recommended_corrections, color: 'border-blue-500' },
              { label: 'Comments',    val: ev.general_comments,        color: 'border-purple-500' },
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

// ─── Page ────────────────────────────────────────────────────────────────

export default function VivaEvaluationsPage() {
  const router = useRouter();
  const params = useParams();
  const vivaId = params.vivaId as string;

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [viva, setViva] = useState<VivaInfo | null>(null);
  const [examiners, setExaminers] = useState<ExaminerRecord[]>([]);
  const [evaluations, setEvaluations] = useState<SubmittedEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<{ status: number; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('all_evaluations');

  const [myExaminerRecord, setMyExaminerRecord] = useState<ExaminerRecord | null>(null);
  const [draft, setDraft] = useState<EvaluationDraft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [draftError, setDraftError] = useState('');

  // Outcome modal (HOD/Admin only)
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [outcomeForm, setOutcomeForm] = useState<{ outcome: VivaOutcome | ''; notes: string }>({ outcome: '', notes: '' });
  const [outcomeError, setOutcomeError] = useState('');
  const [outcomeLoading, setOutcomeLoading] = useState(false);

  useEffect(() => { fetchAll(); }, [vivaId]);

  const fetchAll = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [meRes, vivaRes] = await Promise.all([
        fetch('/api/auth/me', { cache: 'no-store' }),
        fetch(`/api/phd/schedules/${vivaId}`, { cache: 'no-store' }),
      ]);
      if (meRes.status === 401 || vivaRes.status === 401) { router.push('/auth/login'); return; }

      let uid: number | null = null;
      let userRole = '';
      if (meRes.ok) {
        const meData = await meRes.json();
        uid = meData.user?.id ?? null;
        userRole = meData.user?.role ?? '';
        setCurrentUser({ id: uid!, role: userRole });
      }

      if (vivaRes.ok) {
        const vivaData = await vivaRes.json();
        const v: VivaInfo = vivaData.schedule ?? vivaData.viva ?? vivaData;
        setViva(v);

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
          v.evaluations.forEach(ev => {
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

        const unique = Array.from(
          new Map(allEvaluators.map(e => [Number(e.examiner_id), e])).values()
        );
        setExaminers(unique);

        if (uid) {
          let me = unique.find(
            ex => String(ex.examiner_id) === String(uid) || String(ex.user_id) === String(uid)
          );

          const myEval =
            v.evaluations?.find(ev => String(ev.examiner_id) === String(uid) && ev.is_submitted) ||
            v.evaluations?.find(ev => String(ev.examiner_id) === String(uid));

          if (myEval) {
            prefillDraft(myEval);
            if (!me) {
              me = {
                examiner_id: uid,
                examiner_name: myEval.examiner_name || 'Your Evaluation',
                examiner_email: '',
                role: (myEval.examiner_role as any) || 'supervisor',
                confirmed: true,
                evaluation_submitted: myEval.is_submitted,
                evaluation_id: myEval.id || null,
              };
            }
          }

          if (me) {
            setMyExaminerRecord(me);
            setActiveTab('my_evaluation');
          } else {
            // HOD/Admin with no evaluator role — default to all_evaluations
            setActiveTab('all_evaluations');
          }
        }
      } else {
        const errData = await vivaRes.json().catch(() => ({ error: 'Unknown error' }));
        setFetchError({ status: vivaRes.status, message: errData.error || 'Failed to load viva' });
      }
    } catch (err) {
      console.error('Failed to fetch viva evaluation data:', err);
    } finally {
      setLoading(false);
    }
  };

  function prefillDraft(ev: SubmittedEvaluation) {
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
  }

  const setScore = (field: keyof EvaluationDraft, val: string) => {
    const n = parseInt(val);
    if (val === '' || (!isNaN(n) && n >= 0 && n <= 25)) {
      setDraft(p => ({ ...p, [field]: val }));
    }
  };

  const isValidScore = (val: string) => { const n = parseInt(val); return !isNaN(n) && n >= 0 && n <= 25; };

  const allScoresFilled =
    isValidScore(draft.originality_score) &&
    isValidScore(draft.methodology_score) &&
    isValidScore(draft.presentation_score) &&
    isValidScore(draft.literature_score);

  const totalScore = () =>
    (parseInt(draft.originality_score) || 0) +
    (parseInt(draft.methodology_score) || 0) +
    (parseInt(draft.presentation_score) || 0) +
    (parseInt(draft.literature_score) || 0);

  const buildPayload = () => ({
    viva_id: parseInt(vivaId),
    examiner_id: currentUser?.id,
    originality_score: parseInt(draft.originality_score) || null,
    methodology_score: parseInt(draft.methodology_score) || null,
    presentation_score: parseInt(draft.presentation_score) || null,
    literature_score: parseInt(draft.literature_score) || null,
    strengths: draft.strengths || null,
    weaknesses: draft.weaknesses || null,
    recommended_corrections: draft.recommended_corrections || null,
    general_comments: draft.general_comments || null,
  });

  const handleSaveDraft = async () => {
    setSaving(true); setSaveMsg(''); setDraftError('');
    try {
      const res = await fetch('/api/phd/my-evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      if (res.ok) { setSaveMsg('Draft saved ✓'); fetchAll(); }
      else { const d = await res.json(); setDraftError(d.error || 'Save failed.'); }
    } catch { setDraftError('Network error.'); }
    finally { setSaving(false); }
  };

  const handleSubmitEvaluation = async () => {
    if (!allScoresFilled) { setDraftError('All four score fields are required before submitting.'); return; }
    if (!confirm('Submit your evaluation? This cannot be undone.')) return;
    setSubmitting(true); setDraftError('');
    try {
      const res = await fetch('/api/phd/my-evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const saveResult = await res.json();
      if (!res.ok) { setDraftError(saveResult.error || 'Save failed.'); return; }
      const evalId = saveResult.data?.id;
      if (evalId) {
        const subRes = await fetch(`/api/phd/evaluations/${evalId}/submit`, { method: 'POST' });
        if (subRes.ok) { setDraft(p => ({ ...p, is_submitted: true })); fetchAll(); return; }
        const d = await subRes.json();
        setDraftError(d.error || 'Submit failed.');
      } else {
        setDraftError('Could not capture evaluation ID.');
      }
    } catch { setDraftError('Network error.'); }
    finally { setSubmitting(false); }
  };

  const handleIssueOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outcomeForm.outcome) { setOutcomeError('Please select an outcome.'); return; }
    setOutcomeLoading(true); setOutcomeError('');
    try {
      const res = await fetch(`/api/phd/schedules/${vivaId}/outcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome: outcomeForm.outcome, notes: outcomeForm.notes || null }),
      });
      const data = await res.json();
      if (!res.ok) { setOutcomeError(data.error || 'Failed to issue outcome.'); return; }
      setShowOutcomeModal(false);
      fetchAll();
    } catch { setOutcomeError('Network error.'); }
    finally { setOutcomeLoading(false); }
  };

  const fmt = (s: string) =>
    new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const fmtTime = (t: string) => {
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const submitted = evaluations.filter(ev => ev.is_submitted);
  const pendingExaminers = examiners.filter(e => !e.evaluation_submitted);
  const allEvaluationsIn = examiners.length > 0 && pendingExaminers.length === 0;
  const vivaStatus = viva?.viva_status ?? viva?.status ?? '';

  const locked = Boolean(draft.is_submitted) ||
    Boolean(myExaminerRecord?.evaluation_submitted) ||
    evaluations.some(ev => String(ev.examiner_id) === String(currentUser?.id) && Boolean(ev.is_submitted));

  const isHodOrAdmin = currentUser && ['admin', 'hod'].includes(currentUser.role);
  // HOD is NOT an evaluator — they manage the process but don't evaluate
  const isHod = currentUser?.role === 'hod';

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center lg:pl-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!viva) {
    return (
      <div className="lg:pl-64 py-16 text-center space-y-3">
        <div className="text-5xl">🔍</div>
        <p className="font-medium text-gray-800 dark:text-white">Viva not found.</p>
        {fetchError && <p className="text-sm text-red-500">{fetchError.status} — {fetchError.message}</p>}
        <Link href="/phd/schedules" className="inline-block text-emerald-600 hover:underline">← Back to Schedules</Link>
      </div>
    );
  }

  // HOD blocked from evaluation tab
  const tabs: { key: Tab; label: string }[] = [
    // My Evaluation: only for non-HOD examiners assigned to this viva
    ...(myExaminerRecord && !isHod
      ? [{ key: 'my_evaluation' as Tab, label: `📝 My Evaluation${locked ? ' ✅' : ''}` }]
      : []),
    { key: 'all_evaluations', label: `📊 All Evaluations (${submitted.length}/${examiners.length || '—'})` },
    { key: 'examiners',       label: `👥 Examiners (${examiners.filter(e => e.evaluation_submitted).length}/${examiners.length})` },
    // Outcome: HOD and Admin can issue; all can view
    { key: 'outcome', label: '🏆 Outcome' },
  ];

  // My evaluation as read-only data (for self-reflection section)
  const mySubmittedEval = submitted.find(ev => String(ev.examiner_id) === String(currentUser?.id));

  return (
    <div className="space-y-6 lg:pl-64">
      <Link href={`/phd/schedules/${vivaId}`} className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">
        ← Back to Viva Detail
      </Link>

      {/* HOD notice */}
      {isHod && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <span className="text-xl">👔</span>
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-200">Head of Department View</p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              As HOD, you oversee this process but do not evaluate directly. You can view all evaluations and issue the official outcome once all examiners have submitted.
            </p>
          </div>
        </div>
      )}

      {/* Header card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{viva.candidate_name}</h1>
              {vivaStatus && (
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${VIVA_STATUS_STYLES[vivaStatus] ?? ''}`}>
                  {vivaStatus.replace('_', ' ').toUpperCase()}
                </span>
              )}
              {viva.outcome && (
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${OUTCOME_COLORS[viva.outcome]}`}>
                  {OUTCOME_LABELS[viva.outcome]}
                </span>
              )}
            </div>
            <p className="mt-1 font-mono text-sm text-gray-500 dark:text-gray-400">
              {viva.registration_number} · {viva.programme_code}
            </p>
            <p className="mt-2 max-w-2xl text-sm italic text-gray-500 dark:text-gray-400">
              &ldquo;{viva.thesis_title}&rdquo;
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 flex-shrink-0 text-sm text-gray-600 dark:text-gray-400">
            <p>📅 {fmt(viva.scheduled_date)}</p>
            <p>⏰ {fmtTime(viva.scheduled_time)}</p>
            <p>📍 {viva.venue}</p>
            {myExaminerRecord && !isHod && (
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
                Your Role: {EXAMINER_ROLE_LABELS[myExaminerRecord.role]}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex gap-6 overflow-x-auto">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`whitespace-nowrap pb-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === t.key
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}>
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Tab: My Evaluation ── */}
      {activeTab === 'my_evaluation' && myExaminerRecord && !isHod && (
        <div className="space-y-5">
          {locked ? (
            /* ── POST-SUBMISSION: Replace form with read-only evaluation + self-reflection ── */
            <div className="space-y-5">
              {/* Submitted banner */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-700 dark:bg-emerald-900/20">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <h3 className="font-bold text-emerald-800 dark:text-emerald-200">Evaluation Submitted</h3>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                      Your evaluation has been officially recorded and is now visible to the panel coordinator.
                    </p>
                  </div>
                </div>
              </div>

              {/* Read-only evaluation card */}
              {mySubmittedEval && (
                <SubmittedEvaluationCard ev={mySubmittedEval} fmt={fmt} />
              )}

              {/* Self-reflection section */}
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-6 dark:border-indigo-800 dark:bg-indigo-900/20">
                <h3 className="mb-4 flex items-center gap-2 font-bold text-indigo-800 dark:text-indigo-200">
                  <span className="text-xl">🪞</span> Self-Reflection
                </h3>
                <div className="space-y-4 text-sm text-indigo-700 dark:text-indigo-300">
                  <p>Reflecting on your evaluation helps improve the quality and consistency of future assessments.</p>

                  {mySubmittedEval && (
                    <div className="space-y-3">
                      <div className="rounded-lg bg-white/60 p-4 dark:bg-indigo-900/40">
                        <p className="font-semibold text-indigo-800 dark:text-indigo-200 mb-2">Your Score Summary</p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-center">
                          {[
                            { label: 'Originality',  score: mySubmittedEval.originality_score },
                            { label: 'Methodology',  score: mySubmittedEval.methodology_score },
                            { label: 'Presentation', score: mySubmittedEval.presentation_score },
                            { label: 'Literature',   score: mySubmittedEval.literature_score },
                          ].map(r => (
                            <div key={r.label} className="rounded-lg bg-indigo-100 p-2 dark:bg-indigo-800/50">
                              <div className="text-lg font-bold text-indigo-700 dark:text-indigo-300">{r.score ?? '—'}<span className="text-xs">/25</span></div>
                              <div className="text-[10px] uppercase tracking-wide text-indigo-500 dark:text-indigo-400">{r.label}</div>
                            </div>
                          ))}
                        </div>

                        {/* Compare to panel average if other evaluations exist */}
                        {submitted.length > 1 && (() => {
                          const panelAvg = submitted.reduce((sum, ev) => sum +
                            (ev.originality_score ?? 0) + (ev.methodology_score ?? 0) +
                            (ev.presentation_score ?? 0) + (ev.literature_score ?? 0), 0
                          ) / submitted.length;
                          const myTotal =
                            (mySubmittedEval.originality_score ?? 0) +
                            (mySubmittedEval.methodology_score ?? 0) +
                            (mySubmittedEval.presentation_score ?? 0) +
                            (mySubmittedEval.literature_score ?? 0);
                          const diff = myTotal - panelAvg;
                          return (
                            <div className="mt-3 rounded-lg bg-white/60 p-3 dark:bg-indigo-900/40">
                              <p className="font-medium text-indigo-800 dark:text-indigo-200 mb-1">Compared to Panel Average</p>
                              <div className="flex items-center gap-3">
                                <div className="flex-1">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span>Your score</span>
                                    <span className="font-bold">{myTotal}/100</span>
                                  </div>
                                  <ScoreBar score={myTotal} max={100} />
                                </div>
                                <div className={`text-sm font-bold ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                                  {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}
                                </div>
                              </div>
                              <p className="mt-2 text-xs text-indigo-600 dark:text-indigo-400">
                                Panel average: <strong>{panelAvg.toFixed(1)}/100</strong>
                                {Math.abs(diff) > 15
                                  ? ' — Your score differs significantly from the panel. Consider discussing with colleagues.'
                                  : Math.abs(diff) > 8
                                  ? ' — Moderate variation from panel average.'
                                  : ' — Your score is well-aligned with the panel.'}
                              </p>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="rounded-lg bg-white/60 p-4 dark:bg-indigo-900/40">
                        <p className="font-semibold text-indigo-800 dark:text-indigo-200 mb-2">Reflection Prompts</p>
                        <ul className="space-y-2 text-sm list-none">
                          {[
                            mySubmittedEval.strengths
                              ? `You identified these strengths: "${mySubmittedEval.strengths.slice(0, 80)}${mySubmittedEval.strengths.length > 80 ? '…' : ''}"`
                              : 'Consider: did you identify specific strengths clearly?',
                            mySubmittedEval.weaknesses
                              ? `You noted these weaknesses: "${mySubmittedEval.weaknesses.slice(0, 80)}${mySubmittedEval.weaknesses.length > 80 ? '…' : ''}"`
                              : 'Consider: were any weaknesses left unaddressed?',
                            mySubmittedEval.recommended_corrections
                              ? 'You provided specific correction recommendations — this helps the candidate improve.'
                              : 'Consider: were your correction recommendations specific enough for the candidate to act on?',
                          ].map((prompt, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-200 text-xs font-bold text-indigo-700 dark:bg-indigo-700 dark:text-indigo-200">
                                {i + 1}
                              </span>
                              <span className="text-indigo-700 dark:text-indigo-300">{prompt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ── PRE-SUBMISSION: Evaluation form ── */
            <>
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
                <h2 className="mb-5 font-semibold text-gray-900 dark:text-white">
                  Scoring <span className="text-sm font-normal text-gray-500">(each criterion out of 25)</span>
                </h2>
                <div className="space-y-5">
                  {[
                    { key: 'originality_score'   as keyof EvaluationDraft, label: 'Originality',       desc: 'Novel contribution to the field' },
                    { key: 'methodology_score'   as keyof EvaluationDraft, label: 'Methodology',       desc: 'Research design and approach' },
                    { key: 'presentation_score'  as keyof EvaluationDraft, label: 'Presentation',      desc: 'Clarity of writing and structure' },
                    { key: 'literature_score'    as keyof EvaluationDraft, label: 'Literature Review', desc: 'Coverage and analysis of existing work' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{desc}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number" min={0} max={25}
                          value={draft[key] as string}
                          onChange={(e) => setScore(key, e.target.value)}
                          placeholder="0"
                          className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                        <span className="text-sm text-gray-400">/25</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between rounded-xl bg-emerald-50 px-5 py-4 dark:bg-emerald-900/20">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Total Score</span>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      {allScoresFilled ? totalScore() : '—'}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400"> /100</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
                <h2 className="mb-5 font-semibold text-gray-900 dark:text-white">Qualitative Feedback</h2>
                <div className="space-y-5">
                  {[
                    { key: 'strengths'               as keyof EvaluationDraft, label: '💪 Strengths',                placeholder: 'Key strengths of the thesis...' },
                    { key: 'weaknesses'              as keyof EvaluationDraft, label: '⚠️ Weaknesses',               placeholder: 'Areas needing improvement...' },
                    { key: 'recommended_corrections' as keyof EvaluationDraft, label: '🔧 Recommended Corrections', placeholder: 'Specific corrections required...' },
                    { key: 'general_comments'        as keyof EvaluationDraft, label: '💬 General Comments',        placeholder: 'Any other observations...' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
                      <textarea
                        value={draft[key] as string}
                        onChange={(e) => setDraft(p => ({ ...p, [key]: e.target.value }))}
                        rows={3}
                        placeholder={placeholder}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
                {draftError && (
                  <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
                    {draftError}
                  </div>
                )}
                {saveMsg && (
                  <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {saveMsg}
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  <button onClick={handleSaveDraft} disabled={saving}
                    className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                    {saving ? 'Saving...' : '💾 Save Draft'}
                  </button>
                  <button onClick={handleSubmitEvaluation} disabled={submitting || !allScoresFilled}
                    className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
                    {submitting ? 'Submitting...' : '✅ Submit Evaluation'}
                  </button>
                </div>
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  ⚠️ Once submitted, your evaluation is locked and cannot be edited. Save as draft to preserve progress.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Tab: All Evaluations ── */}
      {activeTab === 'all_evaluations' && (
        <div className="space-y-4">
          {pendingExaminers.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-medium text-orange-800 dark:text-orange-300">
                  {pendingExaminers.length} evaluation{pendingExaminers.length > 1 ? 's' : ''} outstanding
                </p>
                <p className="mt-0.5 text-sm text-orange-700 dark:text-orange-400">
                  Pending from: {pendingExaminers.map(e => e.examiner_name).join(', ')}
                </p>
              </div>
            </div>
          )}

          {submitted.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white py-14 text-center shadow-md dark:border-gray-700 dark:bg-gray-800">
              <div className="text-5xl">📝</div>
              <p className="mt-3 font-medium text-gray-700 dark:text-gray-300">No evaluations submitted yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submitted.map(ev => (
                <SubmittedEvaluationCard key={ev.id ?? ev.evaluation_id} ev={ev} fmt={fmt} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Examiners ── */}
      {activeTab === 'examiners' && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
          {examiners.length === 0 ? (
            <div className="py-14 text-center">
              <div className="text-5xl">👥</div>
              <p className="mt-3 text-gray-600 dark:text-gray-400">No examiners assigned.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Examiner</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Role</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Confirmed</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Evaluation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {examiners.map(ex => (
                  <tr key={ex.examiner_id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 dark:text-white">{ex.examiner_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{ex.examiner_email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm capitalize text-gray-700 dark:text-gray-300">
                      {EXAMINER_ROLE_LABELS[ex.role] ?? ex.role.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {ex.confirmed
                        ? <span className="text-emerald-600 dark:text-emerald-400">✅ Yes</span>
                        : <span className="text-orange-500">⏳ Pending</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {ex.evaluation_submitted ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                          ✅ Submitted
                        </span>
                      ) : (
                        <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                          ⚠️ Outstanding
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Tab: Outcome ── */}
      {activeTab === 'outcome' && (
        <div className="space-y-4">
          {viva.outcome ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Official Outcome</h2>
              <div className="flex flex-wrap items-center gap-4">
                <span className={`rounded-full px-4 py-2 text-sm font-semibold ${OUTCOME_COLORS[viva.outcome]}`}>
                  {OUTCOME_LABELS[viva.outcome]}
                </span>
                {viva.issued_at && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">Issued {fmt(viva.issued_at)}</span>
                )}
              </div>
              {viva.outcome_notes && (
                <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm dark:bg-gray-700/40">
                  <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Notes</p>
                  <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{viva.outcome_notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">Issue Official Outcome</h2>
              <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
                {allEvaluationsIn
                  ? 'All evaluations are in. You can now issue the official outcome.'
                  : `${pendingExaminers.length} evaluation${pendingExaminers.length !== 1 ? 's' : ''} still outstanding.`}
              </p>
              {!allEvaluationsIn && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
                  <span>⚠️</span>
                  <p className="text-sm text-orange-700 dark:text-orange-400">
                    Pending from: {pendingExaminers.map(e => e.examiner_name).join(', ')}
                  </p>
                </div>
              )}
              {/* Only HOD/Admin can issue outcome */}
              {isHodOrAdmin ? (
                <button
                  onClick={() => { setOutcomeForm({ outcome: '', notes: '' }); setOutcomeError(''); setShowOutcomeModal(true); }}
                  className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  🏆 Issue Outcome
                </button>
              ) : (
                <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-700/40 dark:text-gray-400">
                  The HOD or Administrator will issue the official outcome once all evaluations are complete.
                </div>
              )}
            </div>
          )}

          {/* Score summary */}
          {submitted.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Examiner Score Summary
              </h3>
              <div className="space-y-3">
                {submitted.map(ev => {
                  const total =
                    (ev.originality_score ?? 0) +
                    (ev.methodology_score ?? 0) +
                    (ev.presentation_score ?? 0) +
                    (ev.literature_score ?? 0);
                  return (
                    <div key={ev.id ?? ev.evaluation_id} className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{ev.examiner_name}</p>
                        {ev.examiner_role && (
                          <p className="text-xs capitalize text-gray-500 dark:text-gray-400">
                            {ev.examiner_role.replace('_', ' ')}
                          </p>
                        )}
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        total >= 70 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
                        total >= 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' :
                                      'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                      }`}>
                        {total}/100
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Issue Outcome Modal */}
      {showOutcomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800">
            <h3 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">🏆 Issue Official Outcome</h3>
            <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
              Final outcome for <span className="font-medium text-gray-700 dark:text-gray-300">{viva.candidate_name}</span>.
            </p>
            {outcomeError && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
                {outcomeError}
              </div>
            )}
            <form onSubmit={handleIssueOutcome} className="space-y-4">
              <Field label="Official Outcome" required>
                <select
                  value={outcomeForm.outcome}
                  onChange={(e) => setOutcomeForm(p => ({ ...p, outcome: e.target.value as VivaOutcome }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select outcome…</option>
                  {(Object.entries(OUTCOME_LABELS) as [VivaOutcome, string][]).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </Field>
              <Field label="Notes (optional)">
                <textarea
                  value={outcomeForm.notes}
                  onChange={(e) => setOutcomeForm(p => ({ ...p, notes: e.target.value }))}
                  rows={3}
                  placeholder="Any additional notes or conditions…"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </Field>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowOutcomeModal(false)}
                  className="flex-1 rounded-lg border border-gray-300 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
                  Cancel
                </button>
                <button type="submit" disabled={outcomeLoading}
                  className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                  {outcomeLoading ? 'Issuing…' : 'Confirm & Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
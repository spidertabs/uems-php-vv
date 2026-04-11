// src/app/(dashboard)/phd/evaluations/[vivaId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { EXAMINER_ROLE_LABELS, type ExaminerRole } from '@/types/phd';

interface VivaInfo {
  id: number;
  scheduled_date: string;
  scheduled_time: string;
  venue: string;
  thesis_title: string;
  registration_number: string;
  candidate_name: string;
  programme_name: string;
  status: string;
}

interface ExaminerInfo {
  examiner_id: number;
  role: ExaminerRole;
  examiner_name: string;
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

export default function ExaminerEvaluationPage() {
  const router = useRouter();
  const params = useParams();
  const vivaId = params.vivaId as string;

  const [viva, setViva] = useState<VivaInfo | null>(null);
  const [myRole, setMyRole] = useState<ExaminerRole | null>(null);
  const [draft, setDraft] = useState<EvaluationDraft>(EMPTY_DRAFT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [meRes, vivaRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch(`/api/phd/schedules/${vivaId}`),
        ]);
        if (meRes.status === 401 || vivaRes.status === 401) {
          router.push('/auth/login'); return;
        }

        const meData = await meRes.json();
        const uid: number = meData.user?.id;
        setCurrentUserId(uid);

        if (vivaRes.ok) {
          const vivaData = await vivaRes.json();
          const v = vivaData.viva;
          setViva(v);

          // Determine my examiner role
          const me: ExaminerInfo | undefined = v.examiners?.find(
            (ex: ExaminerInfo) => ex.examiner_id === uid
          );
          if (me) setMyRole(me.role);

          // Pre-fill draft if it exists
          const myEval = v.evaluations?.find(
            (ev: { examiner_id: number }) => ev.examiner_id === uid
          );
          if (myEval) {
            setDraft({
              id: myEval.id,
              originality_score: myEval.originality_score?.toString() ?? '',
              methodology_score: myEval.methodology_score?.toString() ?? '',
              presentation_score: myEval.presentation_score?.toString() ?? '',
              literature_score: myEval.literature_score?.toString() ?? '',
              strengths: myEval.strengths ?? '',
              weaknesses: myEval.weaknesses ?? '',
              recommended_corrections: myEval.recommended_corrections ?? '',
              general_comments: myEval.general_comments ?? '',
              is_submitted: myEval.is_submitted ?? false,
            });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [vivaId, router]);

  const totalScore = () => {
    const o = parseInt(draft.originality_score) || 0;
    const m = parseInt(draft.methodology_score) || 0;
    const p = parseInt(draft.presentation_score) || 0;
    const l = parseInt(draft.literature_score) || 0;
    return o + m + p + l;
  };

  const isValid = (val: string) => {
    const n = parseInt(val);
    return !isNaN(n) && n >= 0 && n <= 25;
  };

  const allScoresFilled =
    isValid(draft.originality_score) &&
    isValid(draft.methodology_score) &&
    isValid(draft.presentation_score) &&
    isValid(draft.literature_score);

  const handleSaveDraft = async () => {
    setSaving(true); setSaveMsg(''); setError('');
    try {
      const res = await fetch('/api/phd/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          viva_id: parseInt(vivaId),
          examiner_id: currentUserId,
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
      if (res.ok) { setSaveMsg('Draft saved ✓'); }
      else { const d = await res.json(); setError(d.error || 'Save failed'); }
    } catch { setError('Network error'); }
    finally { setSaving(false); }
  };

  const handleSubmit = async () => {
    if (!allScoresFilled) { setError('All four score fields are required before submitting.'); return; }
    if (!confirm('Submit your evaluation? This cannot be undone.')) return;

    setSubmitting(true); setError('');
    try {
      // Save draft scores first
      await fetch('/api/phd/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          viva_id: parseInt(vivaId),
          examiner_id: currentUserId,
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

      // Then submit — need evaluationId from existing draft
      // Re-fetch to get the id
      const checkRes = await fetch(`/api/phd/schedules/${vivaId}/evaluations`);
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        const myEv = checkData.evaluations?.find(
          (ev: { examiner_id: number }) => ev.examiner_id === currentUserId
        );
        if (myEv) {
          const subRes = await fetch(`/api/phd/evaluations/${myEv.id}/submit`, { method: 'POST' });
          if (subRes.ok) {
            setDraft((p) => ({ ...p, is_submitted: true }));
            return;
          }
          const d = await subRes.json();
          setError(d.error || 'Submit failed');
        }
      }
    } catch { setError('Network error'); }
    finally { setSubmitting(false); }
  };

  const setScore = (field: keyof EvaluationDraft, val: string) => {
    const n = parseInt(val);
    if (val === '' || (n >= 0 && n <= 25)) {
      setDraft((p) => ({ ...p, [field]: val }));
    }
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const fmtTime = (t: string) => {
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center lg:pl-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!viva || !myRole) {
    return (
      <div className="lg:pl-64 py-16 text-center space-y-3">
        <div className="text-5xl">🚫</div>
        <p className="font-medium text-gray-800 dark:text-white">
          {!viva ? 'Viva not found.' : 'You are not assigned as an examiner for this viva.'}
        </p>
        <Link href="/phd/schedules" className="inline-block text-emerald-600 hover:underline">
          ← Back to Schedules
        </Link>
      </div>
    );
  }

  const locked = draft.is_submitted;

  return (
    <div className="space-y-6 lg:pl-64">
      <Link href={`/phd/schedules/${vivaId}`} className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">
        ← Back to Viva Detail
      </Link>

      {/* Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              📝 Evaluation Form
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {viva.candidate_name} · {viva.registration_number}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {fmt(viva.scheduled_date)} at {fmtTime(viva.scheduled_time)} — {viva.venue}
            </p>
            <p className="mt-2 text-sm italic text-gray-500 dark:text-gray-400">
              &ldquo;{viva.thesis_title}&rdquo;
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
              Your Role: {EXAMINER_ROLE_LABELS[myRole]}
            </span>
            {locked && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-900 dark:text-green-200">
                ✅ Evaluation Submitted
              </span>
            )}
          </div>
        </div>
      </div>

      {locked && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 dark:border-green-700 dark:bg-green-900/20">
          <p className="font-medium text-green-800 dark:text-green-200">
            Your evaluation has been submitted and is now locked. No further edits are possible.
          </p>
        </div>
      )}

      {/* Scoring */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-5 font-semibold text-gray-900 dark:text-white">
          Scoring <span className="text-sm font-normal text-gray-500">(each criterion out of 25)</span>
        </h2>

        <div className="space-y-4">
          {[
            { key: 'originality_score' as keyof EvaluationDraft, label: 'Originality', desc: 'Novel contribution to the field' },
            { key: 'methodology_score' as keyof EvaluationDraft, label: 'Methodology', desc: 'Research design and approach' },
            { key: 'presentation_score' as keyof EvaluationDraft, label: 'Presentation', desc: 'Clarity of writing and structure' },
            { key: 'literature_score' as keyof EvaluationDraft, label: 'Literature Review', desc: 'Coverage and analysis of existing work' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={25}
                  value={draft[key] as string}
                  onChange={(e) => setScore(key, e.target.value)}
                  disabled={locked}
                  placeholder="0"
                  className={`w-20 rounded-lg border px-3 py-2 text-center text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                    locked
                      ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-400'
                      : 'border-gray-300 bg-white focus:border-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white'
                  }`}
                />
                <span className="text-sm text-gray-400">/25</span>
              </div>
            </div>
          ))}
        </div>

        {/* Live total */}
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

      {/* Qualitative Feedback */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-5 font-semibold text-gray-900 dark:text-white">Qualitative Feedback</h2>
        <div className="space-y-5">
          {[
            { key: 'strengths' as keyof EvaluationDraft, label: '💪 Strengths', placeholder: 'Key strengths of the thesis...' },
            { key: 'weaknesses' as keyof EvaluationDraft, label: '⚠️ Weaknesses', placeholder: 'Areas needing improvement...' },
            { key: 'recommended_corrections' as keyof EvaluationDraft, label: '🔧 Recommended Corrections', placeholder: 'Specific corrections required...' },
            { key: 'general_comments' as keyof EvaluationDraft, label: '💬 General Comments', placeholder: 'Any other observations...' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
              <textarea
                value={draft[key] as string}
                onChange={(e) => setDraft((p) => ({ ...p, [key]: e.target.value }))}
                rows={3}
                disabled={locked}
                placeholder={locked ? '' : placeholder}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                  locked
                    ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-400'
                    : 'border-gray-300 bg-white focus:border-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white'
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      {!locked && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}
          {saveMsg && (
            <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              {saveMsg}
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {saving ? 'Saving...' : '💾 Save Draft'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !allScoresFilled}
              className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : '✅ Submit Evaluation'}
            </button>
          </div>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            ⚠️ Once submitted, your evaluation is locked and cannot be edited.
            Save as draft to preserve your progress.
          </p>
        </div>
      )}
    </div>
  );
}

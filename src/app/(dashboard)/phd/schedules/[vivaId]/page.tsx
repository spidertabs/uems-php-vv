// src/app/(dashboard)/phd/schedules/[vivaId]/page.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  VIVA_STATUS_COLORS,
  OUTCOME_LABELS,
  OUTCOME_COLORS,
  EXAMINER_ROLE_LABELS,
  type VivaWithFullDetails,
  type VivaExaminerWithUser,
  type ExaminerRole,
  type VivaOutcome,
} from '@/types/phd';

type Tab = 'panel' | 'evaluations' | 'recommendation';

interface EligibleUser {
  id: number;
  first_name: string;
  last_name: string;
  role: string;
  department_name?: string;
}

export default function VivaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const vivaId = params.vivaId as string;

  const [viva, setViva] = useState<VivaWithFullDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('panel');

  // Panel management
  const [eligibleStaff, setEligibleStaff] = useState<EligibleUser[]>([]);
  const [assignForm, setAssignForm] = useState({ examiner_id: '', role: '' as ExaminerRole | '' });
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [showAssignForm, setShowAssignForm] = useState(false);

  // Postpone modal
  const [showPostpone, setShowPostpone] = useState(false);
  const [postponeReason, setPostponeReason] = useState('');
  const [postponeLoading, setPostponeLoading] = useState(false);

  // Recommendation form
  const [recForm, setRecForm] = useState<{ outcome: VivaOutcome | ''; correction_deadline: string; final_comments: string }>({
    outcome: '', correction_deadline: '', final_comments: '',
  });
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState('');

  const fetchAll = useCallback(async () => {
    try {
      const [vRes, uRes] = await Promise.all([
        fetch(`/api/phd/schedules/${vivaId}`),
        fetch('/api/phd/eligible-examiners'),
      ]);
      if (vRes.status === 401) { router.push('/auth/login'); return; }
      if (vRes.ok) { const d = await vRes.json(); setViva(d.viva); }
      if (uRes.ok) { const d = await uRes.json(); setEligibleStaff(d.staff || []); }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [vivaId, router]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleConfirmExaminer = async (examinerId: number) => {
    await fetch(`/api/phd/schedules/${vivaId}/examiners/${examinerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmed: true }),
    });
    fetchAll();
  };

  const handleRemoveExaminer = async (examinerId: number) => {
    if (!confirm('Remove this examiner from the panel?')) return;
    await fetch(`/api/phd/schedules/${vivaId}/examiners/${examinerId}`, { method: 'DELETE' });
    fetchAll();
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignError('');
    setAssignLoading(true);
    try {
      const res = await fetch(`/api/phd/schedules/${vivaId}/examiners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignForm),
      });
      const d = await res.json();
      if (!res.ok) { setAssignError(d.error || 'Failed to assign examiner'); return; }
      setAssignForm({ examiner_id: '', role: '' });
      setShowAssignForm(false);
      fetchAll();
    } catch { setAssignError('Network error'); }
    finally { setAssignLoading(false); }
  };

  const handleComplete = async () => {
    if (!confirm('Mark this viva as completed?')) return;
    await fetch(`/api/phd/schedules/${vivaId}/complete`, { method: 'POST' });
    fetchAll();
  };

  const handlePostpone = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostponeLoading(true);
    await fetch(`/api/phd/schedules/${vivaId}/postpone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postponement_reason: postponeReason }),
    });
    setShowPostpone(false);
    setPostponeLoading(false);
    fetchAll();
  };

  const handleRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecError('');
    if (!recForm.outcome) { setRecError('Please select an outcome.'); return; }
    if (recForm.outcome !== 'pass' && !recForm.correction_deadline) {
      setRecError('A correction deadline is required for non-pass outcomes.'); return;
    }
    const allSubmitted = viva?.evaluations.every((ev) => ev.is_submitted);
    if (!allSubmitted) { setRecError('All examiner evaluations must be submitted before issuing a recommendation.'); return; }
    setRecLoading(true);
    try {
      const res = await fetch(`/api/phd/schedules/${vivaId}/recommendation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recForm),
      });
      const d = await res.json();
      if (!res.ok) { setRecError(d.error || 'Failed'); return; }
      fetchAll();
    } catch { setRecError('Network error'); }
    finally { setRecLoading(false); }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const formatTime = (t: string) => {
    const [h, m] = t.split(':');
    const hour = parseInt(h, 10);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!viva) {
    return (
      <div className="lg:pl-64 py-12 text-center">
        <div className="text-5xl">🔍</div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Viva not found.</p>
        <Link href="/phd/schedules" className="mt-3 inline-block text-emerald-600 hover:underline">← Back to Schedules</Link>
      </div>
    );
  }

  const evalSummary = viva.evaluation_summary;
  const canIssueRecommendation =
    viva.status === 'completed' &&
    !viva.recommendation &&
    viva.evaluations.every((ev) => ev.is_submitted);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'panel', label: `👥 Panel & Confirmation (${viva.examiners.length})` },
    { key: 'evaluations', label: `📝 Evaluations (${viva.evaluations.filter((e) => e.is_submitted).length}/${viva.examiners.length})` },
    { key: 'recommendation', label: `📋 Recommendation` },
  ];

  return (
    <div className="space-y-6 lg:pl-64">
      <Link href="/phd/schedules" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">
        ← Back to Schedules
      </Link>

      {/* Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Viva — {viva.candidate_name}
              </h1>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${VIVA_STATUS_COLORS[viva.status]}`}>
                {viva.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <p className="mt-1 font-mono text-sm text-gray-500 dark:text-gray-400">
              {viva.registration_number} · {viva.programme_name}
            </p>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              📅 {formatDate(viva.scheduled_date)} · ⏰ {formatTime(viva.scheduled_time)} · ⏱ {viva.duration_minutes} min
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">📍 {viva.venue}</p>
            {viva.supervisor_name && (
              <p className="text-sm text-gray-600 dark:text-gray-400">👤 Supervisor: {viva.supervisor_name}</p>
            )}
            <p className="mt-2 max-w-2xl text-sm italic text-gray-500 dark:text-gray-400">
              &ldquo;{viva.thesis_title}&rdquo;
            </p>
          </div>
          {/* Action buttons */}
          {viva.status === 'scheduled' && (
            <div className="flex flex-col gap-2">
              <button
                onClick={handleComplete}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700"
              >
                ✅ Mark Complete
              </button>
              <button
                onClick={() => setShowPostpone(true)}
                className="rounded-lg border border-orange-300 px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 dark:text-orange-400"
              >
                ⏸ Postpone
              </button>
            </div>
          )}
          {viva.recommendation && (
            <div className="text-right">
              <Link
                href={`/phd/report/${vivaId}`}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
              >
                🖨️ View Full Report
              </Link>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex gap-6">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === t.key
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Tab: Panel ───────────────────────────────────────── */}
      {activeTab === 'panel' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Examination Panel</h2>
            {viva.status !== 'completed' && (
              <button
                onClick={() => setShowAssignForm(!showAssignForm)}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700"
              >
                + Assign Examiner
              </button>
            )}
          </div>

          {assignError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
              {assignError}
            </div>
          )}

          {showAssignForm && (
            <form
              onSubmit={handleAssign}
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-900/20"
            >
              <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Assign New Examiner</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Examiner</label>
                  <select
                    value={assignForm.examiner_id}
                    onChange={(e) => setAssignForm((p) => ({ ...p, examiner_id: e.target.value }))}
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select examiner...</option>
                    {eligibleStaff
                      .filter((u) => !viva.examiners.find((e) => e.examiner_id === u.id))
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.first_name} {u.last_name} ({u.role.replace('_', ' ')})
                          {u.department_name ? ` — ${u.department_name}` : ''}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                  <select
                    value={assignForm.role}
                    onChange={(e) => setAssignForm((p) => ({ ...p, role: e.target.value as ExaminerRole }))}
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select role...</option>
                    {(Object.entries(EXAMINER_ROLE_LABELS) as [ExaminerRole, string][]).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAssignForm(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignLoading}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {assignLoading ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </form>
          )}

          {viva.examiners.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white py-10 text-center shadow-md dark:border-gray-700 dark:bg-gray-800">
              <div className="text-4xl">👥</div>
              <p className="mt-3 text-gray-500 dark:text-gray-400">No examiners assigned yet.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
              {viva.examiners.map((ex: VivaExaminerWithUser) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between border-b border-gray-200 p-5 last:border-0 dark:border-gray-700"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg dark:bg-gray-700">
                      👤
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{ex.examiner_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{ex.examiner_email}</p>
                      <span className="mt-1 inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
                        {EXAMINER_ROLE_LABELS[ex.role]}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {ex.confirmed ? (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-200">
                        ✅ Confirmed
                      </span>
                    ) : (
                      <>
                        <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200">
                          ⏳ Awaiting
                        </span>
                        {viva.status !== 'completed' && (
                          <button
                            onClick={() => handleConfirmExaminer(ex.examiner_id)}
                            className="rounded-lg bg-emerald-100 px-3 py-1 text-xs text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-200"
                          >
                            Confirm
                          </button>
                        )}
                      </>
                    )}
                    {viva.status !== 'completed' && (
                      <button
                        onClick={() => handleRemoveExaminer(ex.examiner_id)}
                        className="rounded-lg bg-red-100 px-3 py-1 text-xs text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Evaluations ─────────────────────────────────── */}
      {activeTab === 'evaluations' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Examiner Evaluations</h2>

          {/* Summary */}
          {evalSummary.submitted_count > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-md dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
                Panel Average Scores ({evalSummary.submitted_count}/{evalSummary.total_examiners} submitted)
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                {[
                  { label: 'Originality', val: evalSummary.avg_originality, max: 25 },
                  { label: 'Methodology', val: evalSummary.avg_methodology, max: 25 },
                  { label: 'Presentation', val: evalSummary.avg_presentation, max: 25 },
                  { label: 'Literature', val: evalSummary.avg_literature, max: 25 },
                  { label: 'Overall', val: evalSummary.avg_overall, max: 100 },
                ].map((s) => (
                  <div key={s.label} className={`rounded-lg p-4 text-center ${s.label === 'Overall' ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                    <div className={`text-2xl font-bold ${s.label === 'Overall' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                      {s.val !== null ? s.val.toFixed(1) : '—'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
                    <div className="text-xs text-gray-400">/{s.max}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Individual evaluations */}
          {viva.evaluations.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white py-10 text-center shadow-md dark:border-gray-700 dark:bg-gray-800">
              <div className="text-4xl">📝</div>
              <p className="mt-3 text-gray-500 dark:text-gray-400">No evaluations submitted yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {viva.evaluations.map((ev) => (
                <div
                  key={ev.id}
                  className={`rounded-xl border bg-white p-5 shadow-md dark:bg-gray-800 ${
                    ev.is_submitted
                      ? 'border-emerald-200 dark:border-emerald-700'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{ev.examiner_name}</p>
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
                        {EXAMINER_ROLE_LABELS[ev.examiner_panel_role]}
                      </span>
                    </div>
                    {ev.is_submitted ? (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-200">
                        ✅ Submitted {ev.submitted_at ? `· ${formatDate(ev.submitted_at)}` : ''}
                      </span>
                    ) : (
                      <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200">
                        ⏳ Draft / Not Submitted
                      </span>
                    )}
                  </div>

                  {ev.is_submitted && (
                    <>
                      <div className="mb-4 grid grid-cols-5 gap-3">
                        {[
                          { label: 'Originality', val: ev.originality_score, max: 25 },
                          { label: 'Methodology', val: ev.methodology_score, max: 25 },
                          { label: 'Presentation', val: ev.presentation_score, max: 25 },
                          { label: 'Literature', val: ev.literature_score, max: 25 },
                          { label: 'Total', val: ev.overall_score, max: 100 },
                        ].map((s) => (
                          <div key={s.label} className={`rounded-lg p-3 text-center ${s.label === 'Total' ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-gray-50 dark:bg-gray-700/30'}`}>
                            <div className={`text-xl font-bold ${s.label === 'Total' ? 'text-emerald-600' : 'text-gray-900 dark:text-white'}`}>
                              {s.val ?? '—'}
                            </div>
                            <div className="text-xs text-gray-500">{s.label}<span className="text-gray-400">/{s.max}</span></div>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 text-sm">
                        {ev.strengths && <div><p className="font-medium text-green-700 dark:text-green-400">Strengths</p><p className="mt-1 text-gray-600 dark:text-gray-400">{ev.strengths}</p></div>}
                        {ev.weaknesses && <div><p className="font-medium text-orange-600 dark:text-orange-400">Weaknesses</p><p className="mt-1 text-gray-600 dark:text-gray-400">{ev.weaknesses}</p></div>}
                        {ev.recommended_corrections && <div><p className="font-medium text-blue-600 dark:text-blue-400">Recommended Corrections</p><p className="mt-1 text-gray-600 dark:text-gray-400">{ev.recommended_corrections}</p></div>}
                        {ev.general_comments && <div><p className="font-medium text-gray-700 dark:text-gray-300">General Comments</p><p className="mt-1 text-gray-600 dark:text-gray-400">{ev.general_comments}</p></div>}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Recommendation ──────────────────────────────── */}
      {activeTab === 'recommendation' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Panel Recommendation</h2>

          {viva.recommendation ? (
            /* Show existing recommendation */
            <div className="rounded-xl border border-emerald-200 bg-white p-6 shadow-md dark:border-emerald-700 dark:bg-gray-800">
              <div className="flex items-center gap-4 mb-4">
                <span className={`rounded-full px-4 py-1.5 text-sm font-semibold ${OUTCOME_COLORS[viva.recommendation.outcome]}`}>
                  {OUTCOME_LABELS[viva.recommendation.outcome]}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Issued {formatDate(viva.recommendation.issued_at)}
                </span>
              </div>
              {viva.recommendation.correction_deadline && (
                <p className="mb-3 text-sm">
                  <span className="font-medium text-orange-600 dark:text-orange-400">Correction Deadline:</span>{' '}
                  {formatDate(viva.recommendation.correction_deadline)}
                </p>
              )}
              {viva.recommendation.final_comments && (
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Final Comments</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{viva.recommendation.final_comments}</p>
                </div>
              )}
              <div className="mt-4">
                <Link
                  href={`/phd/report/${vivaId}`}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
                >
                  🖨️ Print Full Report
                </Link>
              </div>
            </div>
          ) : canIssueRecommendation ? (
            /* Issue recommendation form */
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
              <p className="mb-5 text-sm text-gray-600 dark:text-gray-400">
                All {viva.examiners.length} evaluations have been submitted.
                {evalSummary.avg_overall !== null && (
                  <> Panel average: <strong>{evalSummary.avg_overall.toFixed(1)}/100</strong>.</>
                )} Issue the binding panel recommendation below.
              </p>
              {recError && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  {recError}
                </div>
              )}
              <form onSubmit={handleRecommendation} className="space-y-5 max-w-lg">
                <div>
                  <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">Outcome</label>
                  <div className="space-y-2">
                    {(Object.entries(OUTCOME_LABELS) as [VivaOutcome, string][]).map(([v, l]) => (
                      <label key={v} className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50">
                        <input
                          type="radio"
                          name="outcome"
                          value={v}
                          checked={recForm.outcome === v}
                          onChange={() => setRecForm((p) => ({ ...p, outcome: v }))}
                          className="h-4 w-4 text-emerald-600"
                        />
                        <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${OUTCOME_COLORS[v]}`}>{l}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {recForm.outcome && recForm.outcome !== 'pass' && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Correction Deadline <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={recForm.correction_deadline}
                      onChange={(e) => setRecForm((p) => ({ ...p, correction_deadline: e.target.value }))}
                      required
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Final Comments</label>
                  <textarea
                    value={recForm.final_comments}
                    onChange={(e) => setRecForm((p) => ({ ...p, final_comments: e.target.value }))}
                    rows={4}
                    placeholder="Enter the panel's final statement..."
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={recLoading || !recForm.outcome}
                  className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {recLoading ? 'Issuing...' : 'Issue Recommendation'}
                </button>
              </form>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white py-10 text-center shadow-md dark:border-gray-700 dark:bg-gray-800">
              <div className="text-4xl">📋</div>
              <p className="mt-3 font-medium text-gray-700 dark:text-gray-300">
                {viva.status !== 'completed'
                  ? 'Recommendation can only be issued after the viva is marked complete.'
                  : `${viva.evaluations.filter((e) => !e.is_submitted).length} evaluation(s) still pending submission.`}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {viva.status !== 'completed'
                  ? 'Mark the viva as complete from the Panel tab first.'
                  : 'All examiners must submit their evaluations before a recommendation can be issued.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Postpone Modal */}
      {showPostpone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Postpone Viva</h3>
            <form onSubmit={handlePostpone} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Reason for Postponement</label>
                <textarea
                  value={postponeReason}
                  onChange={(e) => setPostponeReason(e.target.value)}
                  rows={3}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowPostpone(false)} className="flex-1 rounded-lg border border-gray-300 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">Cancel</button>
                <button type="submit" disabled={postponeLoading} className="flex-1 rounded-lg bg-orange-500 py-2 text-sm text-white hover:bg-orange-600 disabled:opacity-50">
                  {postponeLoading ? 'Postponing...' : 'Postpone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
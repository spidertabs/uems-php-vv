// src/app/(dashboard)/phd/schedules/[vivaId]/recommend/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  OUTCOME_LABELS,
  OUTCOME_COLORS,
  EXAMINER_ROLE_LABELS,
  type VivaWithFullDetails,
  type VivaOutcome,
} from '@/types/phd';

export default function IssueRecommendationPage() {
  const router = useRouter();
  const params = useParams();
  const vivaId = params.vivaId as string;

  const [viva, setViva] = useState<VivaWithFullDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{
    outcome: VivaOutcome | '';
    correction_deadline: string;
    final_comments: string;
  }>({ outcome: '', correction_deadline: '', final_comments: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/phd/schedules/${vivaId}`)
      .then(async (res) => {
        if (res.status === 401) { router.push('/auth/login'); return; }
        if (res.ok) { const d = await res.json(); setViva(d.viva); }
      })
      .finally(() => setLoading(false));
  }, [vivaId, router]);

  const allSubmitted = viva?.evaluations.every((e) => e.is_submitted) ?? false;
  const alreadyHasRec = Boolean(viva?.recommendation);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.outcome) { setError('Please select an outcome.'); return; }
    if (form.outcome !== 'pass' && !form.correction_deadline) {
      setError('A correction deadline is required for correction outcomes.'); return;
    }
    if (!allSubmitted) {
      setError('All examiner evaluations must be submitted before issuing a recommendation.'); return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/phd/schedules/${vivaId}/recommendation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to issue recommendation'); return; }
      router.push(`/phd/schedules/${vivaId}`);
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center lg:pl-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!viva) {
    return (
      <div className="lg:pl-64 py-16 text-center">
        <div className="text-5xl">🔍</div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Viva not found.</p>
        <Link href="/phd/schedules" className="mt-3 inline-block text-emerald-600 hover:underline">← Back</Link>
      </div>
    );
  }

  if (alreadyHasRec) {
    return (
      <div className="lg:pl-64 py-16 text-center">
        <div className="text-5xl">✅</div>
        <p className="mt-4 font-medium text-gray-800 dark:text-white">A recommendation has already been issued.</p>
        <Link href={`/phd/schedules/${vivaId}`} className="mt-3 inline-block text-emerald-600 hover:underline">
          ← Back to Viva Detail
        </Link>
      </div>
    );
  }

  const evalSummary = viva.evaluation_summary;

  return (
    <div className="space-y-6 lg:pl-64">
      <Link href={`/phd/schedules/${vivaId}`} className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">
        ← Back to Viva Detail
      </Link>

      {/* Page Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📋 Issue Panel Recommendation</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {viva.candidate_name} · {viva.registration_number} · {viva.programme_name}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex flex-wrap gap-x-3">
          <span className="whitespace-nowrap">Viva: {fmt(viva.scheduled_date)}</span>
          <span className="whitespace-nowrap">📍 {viva.venue}</span>
        </p>
      </div>

      {/* Evaluation Summary */}
      {evalSummary.submitted_count > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">
            📝 Panel Score Summary ({evalSummary.submitted_count}/{evalSummary.total_examiners} submitted)
          </h2>

          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: 'Originality', val: evalSummary.avg_originality, max: 25 },
              { label: 'Methodology', val: evalSummary.avg_methodology, max: 25 },
              { label: 'Presentation', val: evalSummary.avg_presentation, max: 25 },
              { label: 'Literature', val: evalSummary.avg_literature, max: 25 },
              { label: 'Overall', val: evalSummary.avg_overall, max: 100 },
            ].map((s) => (
              <div
                key={s.label}
                className={`rounded-lg p-4 text-center ${s.label === 'Overall' ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-gray-50 dark:bg-gray-700/50'}`}
              >
                <div className={`text-2xl font-bold ${s.label === 'Overall' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                  {s.val !== null && s.val !== undefined ? s.val.toFixed(1) : '—'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
                <div className="text-xs text-gray-400">/{s.max}</div>
              </div>
            ))}
          </div>

          {/* Per-examiner breakdown */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs text-gray-500 uppercase">
                  <th className="pb-2 pr-4 whitespace-nowrap">Examiner</th>
                  <th className="pb-2 pr-4 whitespace-nowrap">Role</th>
                  <th className="pb-2 pr-2 text-center whitespace-nowrap">Orig</th>
                  <th className="pb-2 pr-2 text-center whitespace-nowrap">Meth</th>
                  <th className="pb-2 pr-2 text-center whitespace-nowrap">Pres</th>
                  <th className="pb-2 pr-2 text-center whitespace-nowrap">Lit</th>
                  <th className="pb-2 text-center font-semibold whitespace-nowrap">Total</th>
                </tr>
              </thead>
              <tbody>
                {viva.evaluations.map((ev) => (
                  <tr key={ev.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <td className="py-2 pr-4 font-medium text-gray-900 dark:text-white">{ev.examiner_name}</td>
                    <td className="py-2 pr-4 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                      {EXAMINER_ROLE_LABELS[ev.examiner_panel_role]}
                    </td>
                    <td className="py-2 pr-2 text-center">{ev.originality_score ?? '—'}</td>
                    <td className="py-2 pr-2 text-center">{ev.methodology_score ?? '—'}</td>
                    <td className="py-2 pr-2 text-center">{ev.presentation_score ?? '—'}</td>
                    <td className="py-2 pr-2 text-center">{ev.literature_score ?? '—'}</td>
                    <td className="py-2 text-center font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {ev.overall_score ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Guard: not all evaluations submitted */}
      {!allSubmitted && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-700 dark:bg-amber-900/20">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-200">Cannot Issue Recommendation Yet</p>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                {viva.evaluations.filter((e) => !e.is_submitted).length} examiner evaluation(s) are still pending submission.
                All examiners must submit their evaluations before a recommendation can be issued.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendation Form */}
      {allSubmitted && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-5 font-semibold text-gray-900 dark:text-white">Panel Recommendation</h2>

          {error && (
            <div className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
            {/* Outcome */}
            <div>
              <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Recommendation Outcome <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {(Object.entries(OUTCOME_LABELS) as [VivaOutcome, string][]).map(([v, l]) => (
                  <label
                    key={v}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                      form.outcome === v
                        ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-900/20'
                        : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="outcome"
                      value={v}
                      checked={form.outcome === v}
                      onChange={() => setForm((p) => ({ ...p, outcome: v }))}
                      className="h-4 w-4 text-emerald-600"
                    />
                    <span className={`whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium ${OUTCOME_COLORS[v]}`}>{l}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Correction Deadline (conditional) */}
            {form.outcome && form.outcome !== 'pass' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Correction Deadline <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.correction_deadline}
                  onChange={(e) => setForm((p) => ({ ...p, correction_deadline: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Deadline by which the candidate must submit corrections.
                </p>
              </div>
            )}

            {/* Final Comments */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Final Comments
              </label>
              <textarea
                value={form.final_comments}
                onChange={(e) => setForm((p) => ({ ...p, final_comments: e.target.value }))}
                rows={5}
                placeholder="Enter the panel's final statement and any additional comments..."
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex gap-3">
              <Link
                href={`/phd/schedules/${vivaId}`}
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || !form.outcome}
                className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Issuing...' : '📋 Issue Recommendation'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

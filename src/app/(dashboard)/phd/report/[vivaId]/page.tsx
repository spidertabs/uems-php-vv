// src/app/(dashboard)/phd/report/[vivaId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  OUTCOME_LABELS,
  OUTCOME_COLORS,
  VIVA_STATUS_COLORS,
  EXAMINER_ROLE_LABELS,
  type VivaReportFull,
  type ExaminerRole,
} from '@/types/phd';

export default function VivaReportPage() {
  const router = useRouter();
  const params = useParams();
  const vivaId = params.vivaId as string;

  const [report, setReport] = useState<VivaReportFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetch(`/api/phd/report/${vivaId}`)
      .then(async (res) => {
        if (res.status === 401) { router.push('/auth/login'); return; }
        if (res.ok) { const d = await res.json(); setReport(d.report); }
      })
      .finally(() => setLoading(false));
  }, [vivaId, router]);

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const fmtTime = (t: string) => {
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const toggle = (i: number) => setExpanded((p) => ({ ...p, [i]: !p[i] }));

  const submittedEvals = report?.evaluations.filter((e) => e.submitted_at) ?? [];

  const avgScore = (field: keyof typeof submittedEvals[0]): number | null => {
    const vals = submittedEvals
      .map((e) => e[field] as number | null)
      .filter((v): v is number => v !== null);
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center lg:pl-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="lg:pl-64 py-16 text-center space-y-3">
        <div className="text-5xl">📋</div>
        <p className="font-medium text-gray-800 dark:text-white">Report not found.</p>
        <Link href="/phd/schedules" className="inline-block text-emerald-600 hover:underline">
          ← Back to Schedules
        </Link>
      </div>
    );
  }

  const s = report.schedule;
  const avgOverall = avgScore('overall_score');

  return (
    <>
      {/* Print CSS */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-page { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <div className="space-y-6 lg:pl-64">
        {/* Toolbar */}
        <div className="no-print flex items-center justify-between">
          <Link href={`/phd/schedules/${vivaId}`} className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">
            ← Back to Viva Detail
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            🖨️ Print Report
          </button>
        </div>

        {/* Report Card */}
        <div className="print-page rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800">

          {/* University Header */}
          <div className="border-b border-gray-200 p-6 text-center dark:border-gray-700">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              Kampala International University
            </p>
            <h1 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
              PhD Viva Voce Examination Report
            </h1>
            <p className="mt-0.5 text-xs text-gray-400">Confidential — Academic Registry</p>
          </div>

          {/* Candidate & Schedule Info */}
          <div className="grid grid-cols-1 gap-0 border-b border-gray-200 dark:border-gray-700 sm:grid-cols-2">
            {/* Left */}
            <div className="space-y-3 p-6 sm:border-r sm:border-gray-200 sm:dark:border-gray-700">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Candidate Information
              </h2>
              <InfoRow label="Name" value={s.candidate_name} />
              <InfoRow label="Reg. Number" value={s.registration_number} mono />
              <InfoRow label="Programme" value={s.programme_name} />
              {s.supervisor_name && <InfoRow label="Supervisor" value={s.supervisor_name} />}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Thesis Title</p>
                <p className="mt-0.5 text-sm italic text-gray-800 dark:text-gray-200">&ldquo;{s.thesis_title}&rdquo;</p>
              </div>
            </div>
            {/* Right */}
            <div className="space-y-3 p-6">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Examination Details
              </h2>
              <InfoRow label="Date" value={fmt(s.scheduled_date)} />
              <InfoRow label="Time" value={fmtTime(s.scheduled_time)} />
              <InfoRow label="Venue" value={s.venue} />
              <InfoRow label="Duration" value={`${s.duration_minutes} minutes`} />
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${VIVA_STATUS_COLORS[s.status]}`}>
                  {s.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Panel Evaluations */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">Panel Evaluations</h2>

            {submittedEvals.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No evaluations submitted yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-xs font-semibold uppercase text-gray-500">
                      <th className="pb-3 text-left">Examiner (Role)</th>
                      <th className="pb-3 text-center">Orig /25</th>
                      <th className="pb-3 text-center">Meth /25</th>
                      <th className="pb-3 text-center">Pres /25</th>
                      <th className="pb-3 text-center">Lit /25</th>
                      <th className="pb-3 text-center font-bold">Total /100</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submittedEvals.map((ev, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <td className="py-3 pr-4">
                          <p className="font-medium text-gray-900 dark:text-white">{ev.examiner_name}</p>
                          <p className="text-xs text-gray-500">{EXAMINER_ROLE_LABELS[ev.examiner_role as ExaminerRole]}</p>
                        </td>
                        <td className="py-3 text-center">{ev.originality_score ?? '—'}</td>
                        <td className="py-3 text-center">{ev.methodology_score ?? '—'}</td>
                        <td className="py-3 text-center">{ev.presentation_score ?? '—'}</td>
                        <td className="py-3 text-center">{ev.literature_score ?? '—'}</td>
                        <td className="py-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                          {ev.overall_score ?? '—'}
                        </td>
                      </tr>
                    ))}
                    {/* Averages row */}
                    {submittedEvals.length > 1 && (
                      <tr className="border-t-2 border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-700/50">
                        <td className="py-3 pr-4 font-semibold text-gray-700 dark:text-gray-300">Panel Average</td>
                        <td className="py-3 text-center font-semibold">{avgScore('originality_score')?.toFixed(1) ?? '—'}</td>
                        <td className="py-3 text-center font-semibold">{avgScore('methodology_score')?.toFixed(1) ?? '—'}</td>
                        <td className="py-3 text-center font-semibold">{avgScore('presentation_score')?.toFixed(1) ?? '—'}</td>
                        <td className="py-3 text-center font-semibold">{avgScore('literature_score')?.toFixed(1) ?? '—'}</td>
                        <td className="py-3 text-center text-xl font-bold text-emerald-600 dark:text-emerald-400">
                          {avgOverall?.toFixed(1) ?? '—'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Individual Comments (expandable) */}
          {submittedEvals.some((e) => e.strengths || e.weaknesses || e.recommended_corrections || e.general_comments) && (
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">Individual Examiner Comments</h2>
              <div className="space-y-3">
                {submittedEvals.map((ev, i) => (
                  <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => toggle(i)}
                      className="no-print flex w-full items-center justify-between p-4 text-left"
                    >
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">{ev.examiner_name}</span>
                        <span className="ml-2 text-xs text-gray-500">
                          ({EXAMINER_ROLE_LABELS[ev.examiner_role as ExaminerRole]})
                        </span>
                      </div>
                      <span className="text-gray-400">{expanded[i] ? '▲' : '▼'}</span>
                    </button>
                    {(expanded[i] || true) && (
                      <div className="border-t border-gray-100 p-4 dark:border-gray-700 no-print-collapse">
                        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                          {ev.strengths && (
                            <div>
                              <p className="font-medium text-green-700 dark:text-green-400">Strengths</p>
                              <p className="mt-1 text-gray-600 dark:text-gray-400">{ev.strengths}</p>
                            </div>
                          )}
                          {ev.weaknesses && (
                            <div>
                              <p className="font-medium text-orange-600 dark:text-orange-400">Weaknesses</p>
                              <p className="mt-1 text-gray-600 dark:text-gray-400">{ev.weaknesses}</p>
                            </div>
                          )}
                          {ev.recommended_corrections && (
                            <div>
                              <p className="font-medium text-blue-600 dark:text-blue-400">Recommended Corrections</p>
                              <p className="mt-1 text-gray-600 dark:text-gray-400">{ev.recommended_corrections}</p>
                            </div>
                          )}
                          {ev.general_comments && (
                            <div>
                              <p className="font-medium text-gray-700 dark:text-gray-300">General Comments</p>
                              <p className="mt-1 text-gray-600 dark:text-gray-400">{ev.general_comments}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendation */}
          <div className="p-6">
            <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">Panel Recommendation</h2>
            {s.outcome ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${OUTCOME_COLORS[s.outcome]}`}>
                    {OUTCOME_LABELS[s.outcome]}
                  </span>
                  {avgOverall !== null && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Panel Average Score: <strong className="text-emerald-600 dark:text-emerald-400">{avgOverall.toFixed(1)}/100</strong>
                    </span>
                  )}
                </div>
                {s.correction_deadline && (
                  <div>
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Correction Deadline</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{fmt(s.correction_deadline)}</p>
                  </div>
                )}
                {s.final_comments && (
                  <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Final Comments
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{s.final_comments}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  ⏳ No recommendation has been issued yet for this viva.
                </p>
              </div>
            )}
          </div>

          {/* Report Footer */}
          <div className="border-t border-gray-200 p-6 dark:border-gray-700">
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-gray-400">
              <span>Generated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span>UEMS — Kampala International University · Academic Registry</span>
            </div>
          </div>
        </div>

        {/* Bottom print button */}
        <div className="no-print flex justify-end">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            🖨️ Print / Save PDF
          </button>
        </div>
      </div>
    </>
  );
}

// ── small helper component ────────────────────────────────────────────────────
function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-sm font-medium text-gray-800 dark:text-gray-100 ${mono ? 'font-mono' : ''}`}>
        {value}
      </p>
    </div>
  );
}

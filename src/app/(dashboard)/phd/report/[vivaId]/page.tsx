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

  useEffect(() => {
    fetch(`/api/phd/report/${vivaId}`)
      .then(async (res) => {
        if (res.status === 401) { router.push('/auth/login'); return; }
        if (res.ok) { const d = await res.json(); setReport(d.report); }
      })
      .finally(() => setLoading(false));
  }, [vivaId, router]);

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const fmtTime = (t: string) => {
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

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
        <Link href="/phd/schedules" className="inline-block text-emerald-600 hover:underline">← Back to Schedules</Link>
      </div>
    );
  }

  const s = report.schedule;
  const avgOverall = avgScore('overall_score');

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:wght@300;400;500;600&display=swap');

        .rpt { font-family: 'DM Sans', sans-serif; }

        /* ══════════════════════════════════════
           LIGHT MODE — base styles
        ══════════════════════════════════════ */
        .rpt-paper {
          background: #ffffff;
          color: #111827;
          width: 210mm;
          max-width: 95vw;
          min-height: 297mm;
          margin: 28px auto;
          box-shadow: 0 4px 40px rgba(0,0,0,0.15);
          overflow: hidden;
        }

        .rpt-header { padding: 10px 40px 0; border-bottom: none; text-align: center; }
        .rpt-logo { height: 65px; width: auto; margin-bottom: 5px; display: block; margin-left: auto; margin-right: auto; }
        .rpt-uni { font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #374151; margin-bottom: 3px; }
        .rpt-title { font-family: 'EB Garamond', Georgia, serif; font-size: 21px; font-weight: 600; color: #111827; letter-spacing: 0.01em; margin: 0 0 1px; }
        .rpt-conf { font-size: 10px; color: #9ca3af; letter-spacing: 0.1em; text-transform: uppercase; padding-bottom: 8px; display: block; }
        .rpt-topbar { height: 4px; background: linear-gradient(90deg, #064e3b 0%, #059669 55%, #6ee7b7 100%); margin: 0; }

        .rpt-cols { display: grid; grid-template-columns: 1fr; border-bottom: 1px solid #d1d5db; }
        @media (min-width: 768px) {
          .rpt-cols { grid-template-columns: 1fr 1fr; }
          .rpt-col:first-child { border-right: 1px solid #d1d5db; }
        }
        .rpt-col { padding: 18px 40px; }

        .rpt-grp-lbl { font-size: 8.5px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #9ca3af; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #f3f4f6; }
        .rpt-f { margin-bottom: 9px; }
        .rpt-fl { font-size: 8.5px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #9ca3af; margin-bottom: 1px; }
        .rpt-fv { font-size: 13px; color: #111827; font-weight: 500; line-height: 1.4; }
        .rpt-fv.mono { font-family: monospace; font-size: 12px; color: #065f46; }
        .rpt-fv.italic { font-family: 'EB Garamond', Georgia, serif; font-style: italic; font-size: 14px; color: #374151; line-height: 1.5; }

        .rpt-sec { padding: 18px 40px; border-bottom: 1px solid #d1d5db; }
        .rpt-sec:last-child { border-bottom: none; }
        .rpt-sec-ttl {
          font-size: 8.5px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;
          color: #6b7280; margin-bottom: 12px;
          display: flex; align-items: center; gap: 8px;
        }
        .rpt-sec-ttl::after { content: ''; flex: 1; height: 1px; background: #e5e7eb; }

        .st { width: 100%; border-collapse: collapse; font-size: 12px; }
        .st thead tr { border-bottom: 1.5px solid #111827; }
        .st th { padding: 5px 8px; text-align: center; font-size: 8.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #6b7280; white-space: nowrap; }
        .st th:first-child { text-align: left; }
        .st td { padding: 9px 8px; text-align: center; color: #374151; border-bottom: 1px solid #f3f4f6; }
        .st td:first-child { text-align: left; }
        .st .en { font-weight: 600; color: #111827; font-size: 13px; }
        .st .er { font-size: 10px; color: #9ca3af; }
        .st .sv { font-weight: 500; }
        .st .st-tot { font-weight: 700; font-size: 15px; color: #059669; }
        .st .ar td { border-top: 1.5px solid #374151; border-bottom: none; background: #f9fafb; font-weight: 600; color: #111827; padding: 9px 8px; }
        .st .ar .st-tot { font-size: 19px; color: #059669; }

        .cmt-block { margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px dashed #e5e7eb; }
        .cmt-block:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .cmt-who { font-size: 12px; font-weight: 600; color: #111827; margin-bottom: 7px; }
        .cmt-who span { font-weight: 400; color: #9ca3af; font-size: 10px; margin-left: 6px; white-space: nowrap; }
        .cmt-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
        @media (min-width: 640px) {
          .cmt-grid { grid-template-columns: 1fr 1fr; }
        }
        .cmt-box { border: 1px solid #e5e7eb; border-radius: 3px; padding: 9px 11px; background: #ffffff; }
        .cmt-lbl { font-size: 8.5px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 3px; }
        .cmt-txt { font-family: 'EB Garamond', Georgia, serif; font-size: 13px; color: #4b5563; line-height: 1.5; text-align: justify; }
        .cmt-s .cmt-lbl { color: #059669; }
        .cmt-w .cmt-lbl { color: #d97706; }
        .cmt-c .cmt-lbl { color: #2563eb; }
        .cmt-g .cmt-lbl { color: #6b7280; }

        .outcome-box {
          display: inline-flex; align-items: center; gap: 10px;
          border: 1.5px solid #111827; border-radius: 2px;
          padding: 6px 14px; font-size: 12px; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase; color: #111827;
          margin-bottom: 10px; white-space: nowrap;
        }
        .outcome-score { font-weight: 400; font-size: 12px; border-left: 1px solid #d1d5db; padding-left: 10px; margin-left: 4px; }

        .final-comments-box { margin-top: 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 3px; padding: 10px 14px; }
        .final-comments-lbl { font-size: 8.5px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #9ca3af; margin-bottom: 4px; }
        .final-comments-txt { font-family: 'EB Garamond, Georgia, serif'; font-size: 13px; color: #374151; line-height: 1.6; text-align: justify; }

        .sig-row { display: grid; grid-template-columns: 1fr; gap: 24px; margin-top: 6px; }
        @media (min-width: 640px) {
          .sig-row { grid-template-columns: 1fr 1fr 1fr; }
        }
        .sig-item { border-top: 1px solid #374151; padding-top: 5px; }
        .sig-lbl { font-size: 8.5px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #9ca3af; }
        .sig-nm { font-size: 11px; color: #374151; margin-top: 2px; }

        .rpt-foot { padding: 10px 40px; border-top: 1px solid #d1d5db; display: flex; flex-direction: column; gap: 10px; align-items: center; text-align: center; }
        @media (min-width: 640px) {
          .rpt-foot { flex-direction: row; justify-content: space-between; text-align: left; }
        }
        .rpt-foot-txt { font-size: 9px; color: #9ca3af; }
        .rpt-foot-stamp { font-size: 9px; font-weight: 700; color: #d1d5db; letter-spacing: 0.1em; text-transform: uppercase; border: 1px solid #e5e7eb; padding: 2px 8px; border-radius: 2px; white-space: nowrap; }

        /* ══════════════════════════════════════
           DARK MODE — only via .dark class on <html>
           No prefers-color-scheme so the app toggle
           is always the single source of truth.
        ══════════════════════════════════════ */
        .dark .rpt-paper {
          background: #111827;
          color: #f9fafb;
          box-shadow: 0 4px 40px rgba(0,0,0,0.5);
        }

        .dark .rpt-title                { color: #f9fafb; }
        .dark .rpt-uni                  { color: #9ca3af; }
        .dark .rpt-conf                 { color: #6b7280; }
        .dark .rpt-fv                   { color: #e5e7eb; }
        .dark .rpt-fv.mono              { color: #6ee7b7; }
        .dark .rpt-fv.italic            { color: #d1d5db; }
        .dark .rpt-fl                   { color: #6b7280; }
        .dark .rpt-grp-lbl              { color: #6b7280; border-bottom-color: #1f2937; }
        .dark .rpt-sec-ttl              { color: #9ca3af; }
        .dark .rpt-sec-ttl::after       { background: #374151; }
        .dark .rpt-cols                 { border-bottom-color: #374151; }
        .dark .rpt-col:first-child      { border-right-color: #374151; }
        .dark .rpt-sec                  { border-bottom-color: #374151; }
        .dark .rpt-foot                 { border-top-color: #374151; }
        .dark .rpt-foot-txt             { color: #6b7280; }
        .dark .rpt-foot-stamp           { color: #4b5563; border-color: #374151; }

        .dark .st thead tr              { border-bottom-color: #4b5563; }
        .dark .st th                    { color: #9ca3af; }
        .dark .st td                    { color: #d1d5db; border-bottom-color: #1f2937; }
        .dark .st .en                   { color: #f9fafb; }
        .dark .st .er                   { color: #6b7280; }
        .dark .st .ar td                { background: #1f2937; color: #f9fafb; border-top-color: #4b5563; }

        .dark .cmt-block                { border-bottom-color: #374151; }
        .dark .cmt-who                  { color: #f9fafb; }
        .dark .cmt-who span             { color: #6b7280; }
        .dark .cmt-box                  { border-color: #374151; background: #1f2937; }
        .dark .cmt-txt                  { color: #9ca3af; }

        .dark .outcome-box              { border-color: #d1d5db; color: #f9fafb; }
        .dark .outcome-score            { border-left-color: #4b5563; }

        .dark .final-comments-box       { background: #1f2937; border-color: #374151; }
        .dark .final-comments-lbl       { color: #6b7280; }
        .dark .final-comments-txt       { color: #d1d5db; }

        .dark .sig-item                 { border-top-color: #4b5563; }
        .dark .sig-lbl                  { color: #6b7280; }
        .dark .sig-nm                   { color: #9ca3af; }

        /* ══════════════════════════════════════
           PRINT — always white, regardless of theme
        ══════════════════════════════════════ */
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
          .no-print, nav, aside, header, [role="navigation"], [role="banner"] { display: none !important; }
          .lg\\:pl-64 { padding-left: 0 !important; }
          .rpt { padding: 0 !important; margin: 0 !important; }
          .rpt-paper {
            background: white !important; color: #111827 !important;
            width: 210mm !important; max-width: none !important; margin: 0 !important; padding-top: 0 !important;
            box-shadow: none !important; min-height: 0 !important;
            position: absolute !important; top: 0 !important; left: 0 !important;
          }
          .rpt-title, .rpt-fv                     { color: #111827 !important; }
          .rpt-fv.mono                             { color: #065f46 !important; }
          .rpt-fv.italic                           { color: #374151 !important; }
          .rpt-uni, .rpt-fl, .rpt-grp-lbl          { color: #6b7280 !important; }
          .rpt-sec-ttl                             { color: #6b7280 !important; }
          .rpt-sec-ttl::after                      { background: #e5e7eb !important; }
          .rpt-cols, .rpt-col:first-child           { border-color: #d1d5db !important; }
          .rpt-sec                                 { border-bottom-color: #d1d5db !important; }
          .rpt-foot                                { border-top-color: #d1d5db !important; }
          .rpt-foot-txt                            { color: #9ca3af !important; }
          .rpt-foot-stamp                          { color: #d1d5db !important; border-color: #e5e7eb !important; }
          .st thead tr                             { border-bottom-color: #111827 !important; }
          .st th                                   { color: #6b7280 !important; }
          .st td                                   { color: #374151 !important; border-bottom-color: #f3f4f6 !important; }
          .st .en                                  { color: #111827 !important; }
          .st .ar td                               { background: #f9fafb !important; color: #111827 !important; border-top-color: #374151 !important; }
          .cmt-who                                 { color: #111827 !important; }
          .cmt-box                                 { background: white !important; border-color: #e5e7eb !important; }
          .cmt-txt                                 { color: #4b5563 !important; }
          .outcome-box                             { border-color: #111827 !important; color: #111827 !important; }
          .final-comments-box                      { background: #f9fafb !important; border-color: #e5e7eb !important; }
          .final-comments-txt                      { color: #374151 !important; }
          .sig-item                                { border-top-color: #374151 !important; }
          .sig-nm                                  { color: #374151 !important; }
          @page { size: A4; margin: 8mm 10mm; }
        }
      `}</style>

      <div className="rpt lg:pl-64">

        {/* ── Toolbar ── */}
        <div className="no-print sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={`/phd/schedules/${vivaId}`}
            className="inline-flex items-center text-sm text-emerald-600 hover:underline dark:text-emerald-400"
          >
            ← Back to Viva
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-1.5 bg-emerald-900 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white border-0 rounded-md px-4 py-2 text-sm font-semibold cursor-pointer transition-colors duration-150"
          >
            🖨️ Print Report
          </button>
        </div>

        {/* ── Paper ── */}
        <div className="rpt-paper">

          {/* Header */}
          <div className="rpt-header">
            <img src="/static/images/kiu-Photoroom_black.png" alt="KIU" className="rpt-logo" />
            <div className="rpt-uni">Kampala International University</div>
            <div className="rpt-title">PhD Viva Voce Examination Report</div>
            <div className="rpt-conf">Confidential — Academic Registry</div>
          </div>
          <div className="rpt-topbar" />

          {/* Info columns */}
          <div className="rpt-cols">
            <div className="rpt-col">
              <div className="rpt-grp-lbl">Candidate Information</div>
              <div className="rpt-f"><div className="rpt-fl">Name</div><div className="rpt-fv">{s.candidate_name}</div></div>
              <div className="rpt-f"><div className="rpt-fl">Reg. Number</div><div className="rpt-fv mono">{s.registration_number}</div></div>
              <div className="rpt-f"><div className="rpt-fl">Programme</div><div className="rpt-fv">{s.programme_name}</div></div>
              {s.supervisor_name && (
                <div className="rpt-f"><div className="rpt-fl">Supervisor</div><div className="rpt-fv">{s.supervisor_name}</div></div>
              )}
              <div className="rpt-f"><div className="rpt-fl">Thesis Title</div><div className="rpt-fv italic">"{s.thesis_title}"</div></div>
            </div>
            <div className="rpt-col">
              <div className="rpt-grp-lbl">Examination Details</div>
              <div className="rpt-f"><div className="rpt-fl">Date</div><div className="rpt-fv">{fmt(s.scheduled_date)}</div></div>
              <div className="rpt-f"><div className="rpt-fl">Time</div><div className="rpt-fv">{fmtTime(s.scheduled_time)}</div></div>
              <div className="rpt-f"><div className="rpt-fl">Venue</div><div className="rpt-fv">{s.venue}</div></div>
              <div className="rpt-f"><div className="rpt-fl">Duration</div><div className="rpt-fv">{s.duration_minutes} minutes</div></div>
              <div className="rpt-f">
                <div className="rpt-fl">Status</div>
                <div
                  className="rpt-fv"
                  style={{
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontSize: 11,
                    fontWeight: 600,
                    color: s.status === 'completed' ? '#059669' : undefined,
                  }}
                >
                  {s.status.replace(/_/g, ' ')}
                </div>
              </div>
            </div>
          </div>

          {/* Evaluations */}
          <div className="rpt-sec">
            <div className="rpt-sec-ttl">Panel Evaluations</div>
            {submittedEvals.length === 0 ? (
              <p style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>No evaluations submitted yet.</p>
            ) : (
            <div className="overflow-x-auto">
              <table className="st">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Examiner (Role)</th>
                    <th>ORIG /25</th>
                    <th>METH /25</th>
                    <th>PRES /25</th>
                    <th>LIT /25</th>
                    <th>TOTAL /100</th>
                  </tr>
                </thead>
                <tbody>
                  {submittedEvals.map((ev, i) => (
                    <tr key={i}>
                      <td>
                        <div className="en whitespace-nowrap">{ev.examiner_name}</div>
                        <div className="er whitespace-nowrap">{EXAMINER_ROLE_LABELS[ev.examiner_role as ExaminerRole]}</div>
                      </td>
                      <td className="sv">{ev.originality_score ?? '—'}</td>
                      <td className="sv">{ev.methodology_score ?? '—'}</td>
                      <td className="sv">{ev.presentation_score ?? '—'}</td>
                      <td className="sv">{ev.literature_score ?? '—'}</td>
                      <td className="st-tot">{ev.overall_score ?? '—'}</td>
                    </tr>
                  ))}
                  {submittedEvals.length > 1 && (
                    <tr className="ar">
                      <td className="whitespace-nowrap">Panel Average</td>
                      <td>{avgScore('originality_score')?.toFixed(1) ?? '—'}</td>
                      <td>{avgScore('methodology_score')?.toFixed(1) ?? '—'}</td>
                      <td>{avgScore('presentation_score')?.toFixed(1) ?? '—'}</td>
                      <td>{avgScore('literature_score')?.toFixed(1) ?? '—'}</td>
                      <td className="st-tot">{avgOverall?.toFixed(1) ?? '—'}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            )}
          </div>

          {/* Comments */}
          {submittedEvals.some((e) => e.strengths || e.weaknesses || e.recommended_corrections || e.general_comments) && (
            <div className="rpt-sec">
              <div className="rpt-sec-ttl">Individual Examiner Comments</div>
              {submittedEvals.map((ev, i) =>
                (ev.strengths || ev.weaknesses || ev.recommended_corrections || ev.general_comments) ? (
                  <div key={i} className="cmt-block">
                    <div className="cmt-who">
                      {ev.examiner_name}
                      <span>— {EXAMINER_ROLE_LABELS[ev.examiner_role as ExaminerRole]}</span>
                    </div>
                    <div className="cmt-grid">
                      {ev.strengths && <div className="cmt-box cmt-s"><div className="cmt-lbl">Strengths</div><div className="cmt-txt">{ev.strengths}</div></div>}
                      {ev.weaknesses && <div className="cmt-box cmt-w"><div className="cmt-lbl">Weaknesses</div><div className="cmt-txt">{ev.weaknesses}</div></div>}
                      {ev.recommended_corrections && <div className="cmt-box cmt-c"><div className="cmt-lbl">Recommended Corrections</div><div className="cmt-txt">{ev.recommended_corrections}</div></div>}
                      {ev.general_comments && <div className="cmt-box cmt-g"><div className="cmt-lbl">General Comments</div><div className="cmt-txt">{ev.general_comments}</div></div>}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          )}

          {/* Recommendation */}
          <div className="rpt-sec">
            <div className="rpt-sec-ttl">Panel Recommendation</div>
            {s.outcome ? (
              <div>
                <div className="outcome-box">
                  {OUTCOME_LABELS[s.outcome]}
                  {avgOverall !== null && (
                    <span className="outcome-score">
                      Panel Average: <strong style={{ color: '#059669' }}>{avgOverall.toFixed(1)}/100</strong>
                    </span>
                  )}
                </div>
                {s.correction_deadline && (
                  <div className="rpt-f" style={{ marginTop: 8 }}>
                    <div className="rpt-fl">Correction Deadline</div>
                    <div className="rpt-fv">{fmt(s.correction_deadline)}</div>
                  </div>
                )}
                {s.final_comments && (
                  <div className="final-comments-box">
                    <div className="final-comments-lbl">Final Comments</div>
                    <div className="final-comments-txt">{s.final_comments}</div>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>No recommendation issued yet.</p>
            )}
          </div>

          {/* Signatures */}
          <div className="rpt-sec" style={{ paddingTop: 20 }}>
            <div className="rpt-sec-ttl">Signatures</div>
            <div className="sig-row">
              <div className="sig-item">
                <div style={{ height: 36 }} />
                <div className="sig-lbl">Chairperson</div>
                <div className="sig-nm">{submittedEvals.find(e => e.examiner_role === 'chairperson')?.examiner_name || '________________________'}</div>
              </div>
              <div className="sig-item">
                <div style={{ height: 36 }} />
                <div className="sig-lbl">Viva Coordinator</div>
                <div className="sig-nm">________________________</div>
              </div>
              <div className="sig-item">
                <div style={{ height: 36 }} />
                <div className="sig-lbl">Date</div>
                <div className="sig-nm">________________________</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="rpt-foot">
            <div className="rpt-foot-txt">
              Generated {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · UEMS — Kampala International University
            </div>
            <div className="rpt-foot-stamp">Academic Registry</div>
          </div>
        </div>

        {/* Bottom print button */}
        <div className="no-print flex justify-center py-4 pb-10">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-emerald-900 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white border-0 rounded-md px-6 py-2.5 text-sm font-semibold cursor-pointer transition-colors duration-150"
          >
            🖨️ Print / Save as PDF
          </button>
        </div>
      </div>
    </>
  );
}
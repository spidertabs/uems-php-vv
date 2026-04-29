/* eslint-disable react-hooks/exhaustive-deps */
// src/app/(dashboard)/phd/candidates/[candidateId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  CANDIDATE_STATUS_LABELS,
  CANDIDATE_STATUS_COLORS,
  VIVA_STATUS_COLORS,
  OUTCOME_LABELS,
  OUTCOME_COLORS,
  type CandidateWithDetails,
  type ThesisSubmission,
  type CandidateStatus,
} from '@/types/phd';

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
type Tab = 'thesis' | 'viva' | 'edit';

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

  // Role checks
  const isHodOrAdmin = currentUser && ['admin', 'hod'].includes(currentUser.role);
  const isEvaluatorOnly = currentUser && !['admin', 'hod'].includes(currentUser.role);

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
                      <Link
                        href={`/phd/evaluations/${v.viva_id}`}
                        className="rounded-lg bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-200"
                      >
                        📝 My Evaluation
                      </Link>
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
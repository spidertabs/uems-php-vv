// src/app/(dashboard)/phd/schedules/new/page.tsx
'use client';
 
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
 
interface CandidateOption {
  id: number;
  registration_number: string;
  candidate_name: string;
  programme_name: string;
  status: string;
}
 
interface ThesisOption {
  id: number;
  version: number;
  file_name: string;
  submitted_at: string;
}
 
export default function ScheduleVivaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
 
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [theses, setTheses] = useState<ThesisOption[]>([]);
  const [form, setForm] = useState({
    candidate_id: searchParams.get('candidate_id') || '',
    thesis_id: '',
    scheduled_date: '',
    scheduled_time: '',
    venue: '',
    duration_minutes: '90',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
 
  useEffect(() => {
    fetch('/api/phd/candidates?status=thesis_submitted&status=enrolled')
      .then((r) => r.json())
      .then((d) => setCandidates(d.candidates || []))
      .finally(() => setDataLoading(false));
  }, []);
 
  useEffect(() => {
    if (!form.candidate_id) { setTheses([]); return; }
    fetch(`/api/phd/candidates/${form.candidate_id}/thesis`)
      .then((r) => r.json())
      .then((d) => {
        const subs: ThesisOption[] = d.submissions || [];
        setTheses(subs);
        // Auto-select latest version
        if (subs.length > 0) {
          const latest = subs.reduce((a, b) => (a.version > b.version ? a : b));
          setForm((p) => ({ ...p, thesis_id: latest.id.toString() }));
        } else {
          setForm((p) => ({ ...p, thesis_id: '' }));
        }
      });
  }, [form.candidate_id]);
 
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.candidate_id) e.candidate_id = 'Please select a candidate.';
    if (!form.thesis_id) e.thesis_id = 'Please select a thesis version.';
    if (!form.scheduled_date) e.scheduled_date = 'Date is required.';
    else if (new Date(form.scheduled_date) < new Date()) e.scheduled_date = 'Date must be in the future.';
    if (!form.scheduled_time) e.scheduled_time = 'Time is required.';
    if (!form.venue.trim()) e.venue = 'Venue is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/phd/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          candidate_id: parseInt(form.candidate_id),
          thesis_id: parseInt(form.thesis_id),
          duration_minutes: parseInt(form.duration_minutes),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErrors({ general: data.error || 'Scheduling failed.' }); return; }
      router.push(`/phd/schedules/${data.viva_id}`);
    } catch {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };
 
  if (dataLoading) return <div className="flex h-96 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600"></div></div>;
 
  const today = new Date().toISOString().split('T')[0];
  const selectedCandidate = candidates.find((c) => c.id.toString() === form.candidate_id);
 
  return (
    <div className="space-y-6 lg:pl-64 max-w-2xl">
      <Link href="/phd/schedules" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">
        ← Back to Schedules
      </Link>
 
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📅 Schedule Viva</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">Create a new oral defence appointment.</p>
      </div>
 
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
        {errors.general && (
          <div className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
            {errors.general}
          </div>
        )}
 
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Candidate <span className="text-red-500">*</span>
            </label>
            <select
              value={form.candidate_id}
              onChange={(e) => setForm((p) => ({ ...p, candidate_id: e.target.value, thesis_id: '' }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select candidate...</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.registration_number} — {c.candidate_name} ({c.programme_name})
                </option>
              ))}
            </select>
            {errors.candidate_id && <p className="mt-1 text-xs text-red-600">{errors.candidate_id}</p>}
          </div>
 
          {selectedCandidate && (
            <div className="rounded-lg bg-emerald-50 p-3 text-sm dark:bg-emerald-900/20">
              <p className="font-medium text-emerald-800 dark:text-emerald-300">{selectedCandidate.candidate_name}</p>
              <p className="text-emerald-600 dark:text-emerald-400">{selectedCandidate.programme_name} · Status: {selectedCandidate.status.replace(/_/g, ' ')}</p>
            </div>
          )}
 
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Thesis Version <span className="text-red-500">*</span>
            </label>
            <select
              value={form.thesis_id}
              onChange={(e) => setForm((p) => ({ ...p, thesis_id: e.target.value }))}
              disabled={theses.length === 0}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">{theses.length === 0 ? 'Select a candidate first...' : 'Select version...'}</option>
              {theses.map((t) => (
                <option key={t.id} value={t.id}>
                  Version {t.version} — {t.file_name}
                </option>
              ))}
            </select>
            {errors.thesis_id && <p className="mt-1 text-xs text-red-600">{errors.thesis_id}</p>}
          </div>
 
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Date <span className="text-red-500">*</span></label>
              <input type="date" value={form.scheduled_date} min={today}
                onChange={(e) => setForm((p) => ({ ...p, scheduled_date: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              {errors.scheduled_date && <p className="mt-1 text-xs text-red-600">{errors.scheduled_date}</p>}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Time <span className="text-red-500">*</span></label>
              <input type="time" value={form.scheduled_time}
                onChange={(e) => setForm((p) => ({ ...p, scheduled_time: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              {errors.scheduled_time && <p className="mt-1 text-xs text-red-600">{errors.scheduled_time}</p>}
            </div>
          </div>
 
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Venue <span className="text-red-500">*</span></label>
            <input type="text" value={form.venue}
              onChange={(e) => setForm((p) => ({ ...p, venue: e.target.value }))}
              placeholder="Senate Building, Board Room 1"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            {errors.venue && <p className="mt-1 text-xs text-red-600">{errors.venue}</p>}
          </div>
 
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Duration (minutes)</label>
            <input type="number" value={form.duration_minutes} min={30} max={300} step={15}
              onChange={(e) => setForm((p) => ({ ...p, duration_minutes: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
 
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
            ⚠️ Scheduling this viva will automatically advance the candidate&apos;s status to <strong>Viva Scheduled</strong>.
          </div>
 
          <div className="flex gap-3 pt-2">
            <Link href="/phd/schedules" className="flex-1 rounded-lg border border-gray-300 py-2 text-center text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">Cancel</Link>
            <button type="submit" disabled={loading} className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
              {loading ? 'Scheduling...' : 'Schedule Viva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
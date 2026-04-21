// src/app/(dashboard)/phd/candidates/new/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface UserOption { id: number; first_name: string; last_name: string; email: string; role: string; }
interface ProgrammeOption { id: number; code: string; name: string; }

// ✅ Field is defined OUTSIDE the page component so it doesn't get
//    recreated on every render — that was causing inputs to lose focus
//    after each keystroke.
function Field({
  name, label, required = false, children, errors,
}: {
  name: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
  errors: Record<string, string>;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}{required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {errors[name] && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors[name]}</p>}
    </div>
  );
}

export default function RegisterCandidatePage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [programmes, setProgrammes] = useState<ProgrammeOption[]>([]);
  const [supervisors, setSupervisors] = useState<UserOption[]>([]);
  const [form, setForm] = useState({
    user_id: '',
    registration_number: '',
    thesis_title: '',
    programme_id: '',
    supervisor_id: '',
    co_supervisor_id: '',
    enrolment_year: new Date().getFullYear().toString(),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [uRes, sRes, pRes] = await Promise.all([
          fetch('/api/phd/available-users'),
          fetch('/api/phd/eligible-supervisors'),
          fetch('/api/phd/programmes'),
        ]);
        if (uRes.ok) {
          const d = await uRes.json();
          setUsers(d.users || []);
        }
        if (sRes.ok) {
          const d = await sRes.json();
          setSupervisors(d.users || []);
        }
        if (pRes.ok) {
          const d = await pRes.json();
          setProgrammes(d.programmes || []);
        }
      } finally {
        setDataLoading(false);
      }
    };
    fetchOptions();
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.user_id) e.user_id = 'Please select a candidate user.';
    if (!form.registration_number.trim()) e.registration_number = 'Registration number is required.';
    if (!form.thesis_title.trim()) e.thesis_title = 'Thesis title is required.';
    if (!form.programme_id) e.programme_id = 'Please select a programme.';
    if (!form.enrolment_year || isNaN(parseInt(form.enrolment_year))) e.enrolment_year = 'Valid year required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/phd/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          user_id: parseInt(form.user_id),
          programme_id: parseInt(form.programme_id),
          supervisor_id: form.supervisor_id ? parseInt(form.supervisor_id) : null,
          co_supervisor_id: form.co_supervisor_id ? parseInt(form.co_supervisor_id) : null,
          enrolment_year: parseInt(form.enrolment_year),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErrors({ general: data.error || 'Registration failed.' }); return; }
      router.push(`/phd/candidates/${data.candidate_id}`);
    } catch {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return <div className="flex h-96 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600"></div></div>;
  }

  return (
    <div className="space-y-6 lg:pl-64 max-w-2xl">
      <Link href="/phd/candidates" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">
        ← Back to Candidates
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">👨‍🎓 Register PhD Candidate</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">Create a new PhD candidate record in the system.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
        {errors.general && (
          <div className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field name="user_id" label="Candidate (User Account)" required errors={errors}>
            <select
              value={form.user_id}
              onChange={(e) => setForm((p) => ({ ...p, user_id: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select user...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.first_name} {u.last_name} — {u.email}
                </option>
              ))}
            </select>
          </Field>

          <Field name="registration_number" label="Registration Number" required errors={errors}>
            <input
              type="text"
              value={form.registration_number}
              onChange={(e) => setForm((p) => ({ ...p, registration_number: e.target.value }))}
              placeholder="KIU/PHD/CS/2024/001"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-mono focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </Field>

          <Field name="thesis_title" label="Thesis Title" required errors={errors}>
            <textarea
              value={form.thesis_title}
              onChange={(e) => setForm((p) => ({ ...p, thesis_title: e.target.value }))}
              rows={3}
              placeholder="Full thesis title as submitted..."
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </Field>

          <Field name="programme_id" label="PhD Programme" required errors={errors}>
            <select
              value={form.programme_id}
              onChange={(e) => setForm((p) => ({ ...p, programme_id: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select programme...</option>
              {programmes.map((p) => (
                <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field name="supervisor_id" label="Primary Supervisor" errors={errors}>
              <select
                value={form.supervisor_id}
                onChange={(e) => setForm((p) => ({ ...p, supervisor_id: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select supervisor...</option>
                {supervisors.map((u) => (
                  <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.role})</option>
                ))}
              </select>
            </Field>

            <Field name="co_supervisor_id" label="Co-Supervisor (optional)" errors={errors}>
              <select
                value={form.co_supervisor_id}
                onChange={(e) => setForm((p) => ({ ...p, co_supervisor_id: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">None</option>
                {supervisors
                  .filter((u) => u.id.toString() !== form.supervisor_id)
                  .map((u) => (
                    <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.role})</option>
                  ))}
              </select>
            </Field>
          </div>

          <Field name="enrolment_year" label="Enrolment Year" required errors={errors}>
            <input
              type="number"
              value={form.enrolment_year}
              onChange={(e) => setForm((p) => ({ ...p, enrolment_year: e.target.value }))}
              min={2000}
              max={new Date().getFullYear()}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </Field>

          <div className="flex gap-3 pt-2">
            <Link
              href="/phd/candidates"
              className="flex-1 rounded-lg border border-gray-300 py-2 text-center text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register Candidate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
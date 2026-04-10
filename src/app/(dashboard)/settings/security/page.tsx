/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
// src/app/(dashboard)/settings/security/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: number;
  email: string;
  role: string;
  created_at: string;
  last_login?: string;
}

export default function SecuritySettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: '',
    color: '',
  });

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    checkPasswordStrength(formData.new_password);
  }, [formData.new_password]);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');

      if (response.status === 401) {
        router.push('/auth/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;

    const strengths = [
      { label: 'Very Weak', color: 'bg-red-500' },
      { label: 'Weak', color: 'bg-orange-500' },
      { label: 'Fair', color: 'bg-yellow-500' },
      { label: 'Good', color: 'bg-lime-500' },
      { label: 'Strong', color: 'bg-green-500' },
      { label: 'Very Strong', color: 'bg-emerald-500' },
    ];

    setPasswordStrength({
      score,
      label: strengths[score].label,
      color: strengths[score].color,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    // Validation
    if (formData.new_password !== formData.confirm_password) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setSaving(false);
      return;
    }

    if (formData.new_password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long' });
      setSaving(false);
      return;
    }

    if (passwordStrength.score < 2) {
      setMessage({ type: 'error', text: 'Password is too weak. Please choose a stronger password.' });
      setSaving(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: formData.current_password,
          new_password: formData.new_password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setFormData({
          current_password: '',
          new_password: '',
          confirm_password: '',
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to change password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while changing password' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:pl-64">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            ⚙️ Settings
          </Link>
          <span className="text-gray-400">/</span>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🔒 Security Settings
          </h1>
        </div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your password and security preferences
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`rounded-lg p-4 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Change Password */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Change Password
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.current ? 'text' : 'password'}
                      name="current_password"
                      value={formData.current_password}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 pr-10 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword({ ...showPassword, current: !showPassword.current })
                      }
                      className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400"
                    >
                      {showPassword.current ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.new ? 'text' : 'password'}
                      name="new_password"
                      value={formData.new_password}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 pr-10 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword({ ...showPassword, new: !showPassword.new })
                      }
                      className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400"
                    >
                      {showPassword.new ? '🙈' : '👁️'}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {formData.new_password && (
                    <div className="mt-2">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">Password Strength</span>
                        <span className="font-medium">{passwordStrength.label}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className={`h-full transition-all ${passwordStrength.color}`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.confirm ? 'text' : 'password'}
                      name="confirm_password"
                      value={formData.confirm_password}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 pr-10 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword({ ...showPassword, confirm: !showPassword.confirm })
                      }
                      className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400"
                    >
                      {showPassword.confirm ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {formData.confirm_password && formData.new_password !== formData.confirm_password && (
                    <p className="mt-1 text-sm text-red-500">Passwords do not match</p>
                  )}
                </div>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Password Requirements
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className={formData.new_password.length >= 8 ? 'text-green-500' : 'text-gray-400'}>
                    {formData.new_password.length >= 8 ? '✓' : '○'}
                  </span>
                  <span>At least 8 characters</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className={/[a-z]/.test(formData.new_password) && /[A-Z]/.test(formData.new_password) ? 'text-green-500' : 'text-gray-400'}>
                    {/[a-z]/.test(formData.new_password) && /[A-Z]/.test(formData.new_password) ? '✓' : '○'}
                  </span>
                  <span>Both uppercase and lowercase letters</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className={/\d/.test(formData.new_password) ? 'text-green-500' : 'text-gray-400'}>
                    {/\d/.test(formData.new_password) ? '✓' : '○'}
                  </span>
                  <span>At least one number</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className={/[^a-zA-Z\d]/.test(formData.new_password) ? 'text-green-500' : 'text-gray-400'}>
                    {/[^a-zA-Z\d]/.test(formData.new_password) ? '✓' : '○'}
                  </span>
                  <span>At least one special character</span>
                </li>
              </ul>
            </div>

            {/* Save Button */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Changing Password...' : 'Change Password'}
              </button>
              <Link
                href="/settings"
                className="rounded-lg border border-gray-300 bg-white px-6 py-2 font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Security Info */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Account Security
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="mb-1 text-gray-600 dark:text-gray-400">Account Status</p>
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  ✓ Active
                </span>
              </div>
              <div>
                <p className="mb-1 text-gray-600 dark:text-gray-400">Last Login</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {user?.last_login
                    ? new Date(user.last_login).toLocaleString()
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="mb-1 text-gray-600 dark:text-gray-400">Account Created</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(user?.created_at || '').toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Security Tips */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900/20 dark:bg-blue-900/10">
            <h3 className="mb-2 flex items-center gap-2 font-semibold text-blue-900 dark:text-blue-400">
              <span>🔐</span>
              Security Tips
            </h3>
            <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-500">
              <li>• Use a unique password for this account</li>
              <li>• Change your password regularly</li>
              <li>• Never share your password with anyone</li>
              <li>• Use a password manager</li>
              <li>• Enable two-factor authentication (coming soon)</li>
            </ul>
          </div>

          {/* Session Management (Future Feature) */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Active Sessions
            </h3>
            <div className="mb-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-900/50">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-2xl">💻</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">Current Session</p>
                  <p className="text-xs text-gray-500">This device</p>
                </div>
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  Active
                </span>
              </div>
            </div>
            <button
              disabled
              className="w-full rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-500 dark:bg-gray-700"
            >
              Session Management (Coming Soon)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
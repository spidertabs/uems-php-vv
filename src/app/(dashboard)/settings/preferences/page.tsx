/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
// src/app/(dashboard)/settings/preferences/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Preferences {
  theme: 'light' | 'dark' | 'auto';
  notifications_enabled: boolean;
  email_notifications: boolean;
  dashboard_layout: 'compact' | 'comfortable';
  items_per_page: number;
  default_exam_type: 'TEST' | 'CAT' | 'FINAL';
  auto_save: boolean;
  show_tips: boolean;
}

export default function PreferencesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [preferences, setPreferences] = useState<Preferences>({
    theme: 'auto',
    notifications_enabled: true,
    email_notifications: true,
    dashboard_layout: 'comfortable',
    items_per_page: 10,
    default_exam_type: 'TEST',
    auto_save: true,
    show_tips: true,
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      // Check authentication
      const authRes = await fetch('/api/auth/me');
      if (authRes.status === 401) {
        router.push('/auth/login');
        return;
      }

      // Load preferences from localStorage
      const saved = localStorage.getItem('user_preferences');
      if (saved) {
        setPreferences(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    setSaving(true);
    setMessage(null);

    try {
      // Save to localStorage
      localStorage.setItem('user_preferences', JSON.stringify(preferences));

      // Apply theme
      if (preferences.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (preferences.theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        // Auto: detect system preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }

      setMessage({ type: 'success', text: 'Preferences saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save preferences' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const defaultPrefs: Preferences = {
      theme: 'auto',
      notifications_enabled: true,
      email_notifications: true,
      dashboard_layout: 'comfortable',
      items_per_page: 10,
      default_exam_type: 'TEST',
      auto_save: true,
      show_tips: true,
    };
    setPreferences(defaultPrefs);
    localStorage.setItem('user_preferences', JSON.stringify(defaultPrefs));
    setMessage({ type: 'success', text: 'Preferences reset to defaults!' });
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
            🎨 Preferences
          </h1>
        </div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Customize your dashboard experience and notification settings
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
        {/* Main Settings */}
        <div className="space-y-6 lg:col-span-2">
          {/* Appearance */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              🎨 Appearance
            </h3>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Theme
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setPreferences({ ...preferences, theme: 'light' })}
                    className={`rounded-lg border-2 p-4 text-center transition ${
                      preferences.theme === 'light'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                    }`}
                  >
                    <div className="mb-2 text-2xl">☀️</div>
                    <div className="text-sm font-medium">Light</div>
                  </button>
                  <button
                    onClick={() => setPreferences({ ...preferences, theme: 'dark' })}
                    className={`rounded-lg border-2 p-4 text-center transition ${
                      preferences.theme === 'dark'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                    }`}
                  >
                    <div className="mb-2 text-2xl">🌙</div>
                    <div className="text-sm font-medium">Dark</div>
                  </button>
                  <button
                    onClick={() => setPreferences({ ...preferences, theme: 'auto' })}
                    className={`rounded-lg border-2 p-4 text-center transition ${
                      preferences.theme === 'auto'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                    }`}
                  >
                    <div className="mb-2 text-2xl">💻</div>
                    <div className="text-sm font-medium">Auto</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Dashboard Layout
                </label>
                <select
                  value={preferences.dashboard_layout}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      dashboard_layout: e.target.value as 'compact' | 'comfortable',
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="compact">Compact</option>
                  <option value="comfortable">Comfortable</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              🔔 Notifications
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Enable Notifications
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Receive in-app notifications
                  </div>
                </div>
                <button
                  onClick={() =>
                    setPreferences({
                      ...preferences,
                      notifications_enabled: !preferences.notifications_enabled,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    preferences.notifications_enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      preferences.notifications_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Email Notifications
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Receive notifications via email
                  </div>
                </div>
                <button
                  onClick={() =>
                    setPreferences({
                      ...preferences,
                      email_notifications: !preferences.email_notifications,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    preferences.email_notifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      preferences.email_notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Behavior */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              ⚡ Behavior
            </h3>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Items Per Page
                </label>
                <select
                  value={preferences.items_per_page}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      items_per_page: parseInt(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Default Exam Type
                </label>
                <select
                  value={preferences.default_exam_type}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      default_exam_type: e.target.value as 'TEST' | 'CAT' | 'FINAL',
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="TEST">Test</option>
                  <option value="CAT">CAT</option>
                  <option value="FINAL">Final Exam</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Auto-Save</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Automatically save drafts
                  </div>
                </div>
                <button
                  onClick={() =>
                    setPreferences({
                      ...preferences,
                      auto_save: !preferences.auto_save,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    preferences.auto_save ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      preferences.auto_save ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Show Tips</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Display helpful tips and hints
                  </div>
                </div>
                <button
                  onClick={() =>
                    setPreferences({
                      ...preferences,
                      show_tips: !preferences.show_tips,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    preferences.show_tips ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      preferences.show_tips ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
            <button
              onClick={handleReset}
              className="rounded-lg border border-gray-300 bg-white px-6 py-2 font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Reset to Defaults
            </button>
            <Link
              href="/settings"
              className="rounded-lg border border-gray-300 bg-white px-6 py-2 font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </Link>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Preview */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Preview
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Theme</span>
                <span className="font-medium capitalize">{preferences.theme}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Layout</span>
                <span className="font-medium capitalize">{preferences.dashboard_layout}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Notifications</span>
                <span className="font-medium">
                  {preferences.notifications_enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Auto-Save</span>
                <span className="font-medium">{preferences.auto_save ? 'On' : 'Off'}</span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900/20 dark:bg-blue-900/10">
            <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-400">
              💡 Tip
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-500">
              Your preferences are saved locally in your browser. Changes take effect immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/(dashboard)/settings/system/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SystemSettings {
  site_name: string;
  site_email: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_secure: boolean;
  max_file_size: number;
  session_timeout: number;
  enable_registrations: boolean;
  require_email_verification: boolean;
  maintenance_mode: boolean;
}

export default function SystemSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'email' | 'security' | 'advanced'>('general');

  const [settings, setSettings] = useState<SystemSettings>({
    site_name: 'UEMS - University Exam Management System',
    site_email: 'noreply@university.ac.ug',
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_user: '',
    smtp_secure: true,
    max_file_size: 10,
    session_timeout: 60,
    enable_registrations: false,
    require_email_verification: true,
    maintenance_mode: false,
  });

  useEffect(() => {
    fetchUser();
    loadSettings();
  }, []);

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

        // Check if user is admin
        if (data.user.role !== 'admin') {
          router.push('/settings');
          return;
        }
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = () => {
    // Load from localStorage (in production, this would be from database/API)
    const saved = localStorage.getItem('system_settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  };

  const handleSave = () => {
    setSaving(true);
    setMessage(null);

    try {
      // Save to localStorage (in production, this would be API call)
      localStorage.setItem('system_settings', JSON.stringify(settings));
      setMessage({ type: 'success', text: 'System settings saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save system settings' });
    } finally {
      setSaving(false);
    }
  };

  const testEmailConfiguration = async () => {
    setMessage({ type: 'success', text: 'Test email sent! (Feature coming soon)' });
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
            🔧 System Settings
          </h1>
        </div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Configure system-wide settings and integrations (Admin Only)
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

      {/* Warning */}
      <div className="rounded-lg border-l-4 border-yellow-500 bg-yellow-50 p-4 dark:bg-yellow-900/20">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-400">
              Administrator Settings
            </h3>
            <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-500">
              Changes here affect the entire system. Please be careful when modifying these settings.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('general')}
          className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition ${
            activeTab === 'general'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-400'
          }`}
        >
          🏢 General
        </button>
        <button
          onClick={() => setActiveTab('email')}
          className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition ${
            activeTab === 'email'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-400'
          }`}
        >
          📧 Email
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition ${
            activeTab === 'security'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-400'
          }`}
        >
          🔒 Security
        </button>
        <button
          onClick={() => setActiveTab('advanced')}
          className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition ${
            activeTab === 'advanced'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-400'
          }`}
        >
          ⚙️ Advanced
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Settings */}
        <div className="space-y-6 lg:col-span-2">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                General Settings
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={settings.site_name}
                    onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Site Email
                  </label>
                  <input
                    type="email"
                    value={settings.site_email}
                    onChange={(e) => setSettings({ ...settings, site_email: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  <p className="mt-1 text-xs text-gray-500">Used for system notifications</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Maximum File Upload Size (MB)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={settings.max_file_size}
                    onChange={(e) =>
                      setSettings({ ...settings, max_file_size: parseInt(e.target.value) })
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Email Settings */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                  SMTP Configuration
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      SMTP Host
                    </label>
                    <input
                      type="text"
                      value={settings.smtp_host}
                      onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                      placeholder="smtp.gmail.com"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      SMTP Port
                    </label>
                    <input
                      type="number"
                      value={settings.smtp_port}
                      onChange={(e) =>
                        setSettings({ ...settings, smtp_port: parseInt(e.target.value) })
                      }
                      placeholder="587"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      SMTP Username
                    </label>
                    <input
                      type="text"
                      value={settings.smtp_user}
                      onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
                      placeholder="your-email@domain.com"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Use TLS/SSL</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Encrypt email connections
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setSettings({
                          ...settings,
                          smtp_secure: !settings.smtp_secure,
                        })
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        settings.smtp_secure ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          settings.smtp_secure ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    onClick={testEmailConfiguration}
                    className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    📧 Send Test Email
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Security Settings
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="480"
                    value={settings.session_timeout}
                    onChange={(e) =>
                      setSettings({ ...settings, session_timeout: parseInt(e.target.value) })
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Auto logout after inactivity
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Enable User Registrations
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Allow new users to register
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setSettings({
                        ...settings,
                        enable_registrations: !settings.enable_registrations,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      settings.enable_registrations ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        settings.enable_registrations ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Require Email Verification
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      New users must verify email
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setSettings({
                        ...settings,
                        require_email_verification: !settings.require_email_verification,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      settings.require_email_verification
                        ? 'bg-blue-600'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        settings.require_email_verification ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Settings */}
          {activeTab === 'advanced' && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Advanced Settings
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/20 dark:bg-red-900/10">
                  <div>
                    <div className="font-medium text-red-900 dark:text-red-400">
                      Maintenance Mode
                    </div>
                    <div className="text-sm text-red-700 dark:text-red-500">
                      Disable system access for all users except admins
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setSettings({
                        ...settings,
                        maintenance_mode: !settings.maintenance_mode,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      settings.maintenance_mode ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        settings.maintenance_mode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900/50">
                  <h4 className="mb-2 font-medium text-gray-900 dark:text-white">
                    Database Backup
                  </h4>
                  <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                    Create a backup of the entire database
                  </p>
                  <button
                    disabled
                    className="rounded-lg bg-gray-200 px-4 py-2 text-sm text-gray-500 dark:bg-gray-700"
                  >
                    💾 Backup Database (Coming Soon)
                  </button>
                </div>

                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900/50">
                  <h4 className="mb-2 font-medium text-gray-900 dark:text-white">
                    Clear Cache
                  </h4>
                  <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                    Clear all system caches and temporary data
                  </p>
                  <button
                    onClick={() => {
                      localStorage.clear();
                      setMessage({ type: 'success', text: 'Cache cleared successfully!' });
                    }}
                    className="rounded-lg bg-gray-200 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    🗑️ Clear Cache
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save System Settings'}
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
          {/* System Info */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              System Information
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="mb-1 text-gray-600 dark:text-gray-400">Version</p>
                <p className="font-medium text-gray-900 dark:text-white">v1.0.0</p>
              </div>
              <div>
                <p className="mb-1 text-gray-600 dark:text-gray-400">Environment</p>
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  Production
                </span>
              </div>
              <div>
                <p className="mb-1 text-gray-600 dark:text-gray-400">Database</p>
                <p className="font-medium text-gray-900 dark:text-white">MySQL 8.0</p>
              </div>
            </div>
          </div>

          {/* Help */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900/20 dark:bg-blue-900/10">
            <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-400">
              ⚠️ Important
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-500">
              System settings affect all users. Test changes in a development environment first when possible.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
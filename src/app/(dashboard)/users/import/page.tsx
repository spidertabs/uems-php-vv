// src/app/users/import/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

export default function ImportUsersPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      previewFile(selectedFile);
    }
  };

  const previewFile = async (file: File) => {
    const text = await file.text();
    const lines = text.split('\n').slice(0, 6); // First 5 rows + header
    const rows = lines.map((line) => line.split(','));
    setPreview(rows);
  };

  const handleImport = async () => {
    if (!file) {
      alert('Please select a file');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/users/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        if (data.failed === 0) {
          setTimeout(() => router.push('/users'), 2000);
        }
      } else {
        alert(data.error || 'Failed to import users');
      }
    } catch (error) {
      console.error('Error importing users:', error);
      alert('Failed to import users');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `email,first_name,last_name,role,department_id,college_id,phone,password
john.doe@example.com,John,Doe,lecturer,1,1,+256700000000,password123
jane.smith@example.com,Jane,Smith,hod,2,1,+256700000001,password123`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 lg:pl-64">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            📥 Import Users
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Bulk import users from CSV or Excel file
          </p>
        </div>
        <Link
          href="/users"
          className="rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
        >
          ← Back to Users
        </Link>
      </div>

      {/* Instructions */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
        <h3 className="mb-3 text-lg font-semibold text-blue-900 dark:text-blue-200">
          📋 Instructions
        </h3>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
          <li>• Download the template CSV file and fill in your user data</li>
          <li>• Required columns: email, first_name, last_name, role, password</li>
          <li>• Optional columns: department_id, college_id, phone</li>
          <li>• Valid roles: lecturer, hod, dean, exam_master, admin</li>
          <li>• Passwords must be at least 8 characters</li>
          <li>• File formats: CSV (.csv) or Excel (.xlsx, .xls)</li>
        </ul>
        <button
          onClick={downloadTemplate}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        >
          📄 Download Template
        </button>
      </div>

      {/* File Upload */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Upload File
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  className="w-10 h-10 mb-3 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  CSV or Excel files (MAX. 5MB)
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {file && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-900 dark:text-green-200">
                    📄 {file.name}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setPreview([]);
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Preview (First 5 rows)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                <tr>
                  {preview[0]?.map((header, i) => (
                    <th
                      key={i}
                      className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {preview.slice(1).map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import Button */}
      {file && (
        <div className="flex justify-end">
          <button
            onClick={handleImport}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400"
          >
            {loading ? '⏳ Importing...' : '📥 Import Users'}
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div
          className={`rounded-xl border p-6 shadow-md ${
            result.failed === 0
              ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
              : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
          }`}
        >
          <h3
            className={`mb-4 text-lg font-semibold ${
              result.failed === 0
                ? 'text-green-900 dark:text-green-200'
                : 'text-yellow-900 dark:text-yellow-200'
            }`}
          >
            {result.failed === 0 ? '✅ Import Successful!' : '⚠️ Import Completed with Errors'}
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Successfully Imported
              </p>
              <p className="text-2xl font-bold text-green-600">
                {result.success}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Failed
              </p>
              <p className="text-2xl font-bold text-red-600">{result.failed}</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div>
              <h4 className="mb-2 font-semibold text-red-900 dark:text-red-200">
                Errors:
              </h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {result.errors.map((error, i) => (
                  <div
                    key={i}
                    className="rounded bg-red-100 p-2 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200"
                  >
                    <strong>Row {error.row}:</strong> {error.error}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.failed === 0 && (
            <p className="mt-4 text-sm text-green-700 dark:text-green-300">
              Redirecting to users list...
            </p>
          )}
        </div>
      )}
    </div>
  );
}
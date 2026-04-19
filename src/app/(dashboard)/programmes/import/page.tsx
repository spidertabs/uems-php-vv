/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/programmes/import/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export default function ImportProgrammesPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setResult(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter((line) => line.trim());

      if (lines.length < 2) {
        alert('File must contain header and at least one data row');
        setLoading(false);
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim());
      const requiredHeaders = [
        'programme_code',
        'programme_name',
        'degree_type',
        'duration_years',
        'department_id',
      ];

      const missingHeaders = requiredHeaders.filter(
        (h) => !headers.includes(h)
      );
      if (missingHeaders.length > 0) {
        alert(`Missing required columns: ${missingHeaders.join(', ')}`);
        setLoading(false);
        return;
      }

      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      // Process each row
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(',').map((v) => v.trim());
          const rowData: Record<string, string> = {};

          headers.forEach((header, index) => {
            rowData[header] = values[index] || '';
          });

          const response = await fetch('/api/programmes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              programme_code: rowData.programme_code,
              programme_name: rowData.programme_name,
              degree_type: rowData.degree_type,
              duration_years: parseInt(rowData.duration_years) || 3,
              department_id: parseInt(rowData.department_id),
              description: rowData.description || '',
              is_active: rowData.is_active?.toLowerCase() !== 'false',
            }),
          });

          if (response.ok) {
            successCount++;
          } else {
            const data = await response.json();
            failedCount++;
            errors.push(
              `Row ${i + 1} (${rowData.programme_code}): ${data.error}`
            );
          }
        } catch (error) {
          failedCount++;
          errors.push(`Row ${i + 1}: ${error}`);
        }
      }

      setResult({
        success: successCount,
        failed: failedCount,
        errors: errors,
      });
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to process file');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `programme_code,programme_name,degree_type,duration_years,department_id,description,is_active
BSC-CS-001,Bachelor of Science in Computer Science,Bachelor,3,1,A comprehensive programme in computing,true
MSC-IT-001,Master of Science in Information Technology,Master,2,1,Advanced IT programme,true`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'programmes_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 lg:pl-64">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            📥 Import Programmes
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Bulk import programmes from CSV file
          </p>
        </div>
        <Link
          href="/programmes"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
        >
          ← Back
        </Link>
      </div>

      <div className="mx-auto max-w-3xl space-y-6">
        {/* Instructions */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
          <h3 className="mb-3 font-semibold text-blue-900 dark:text-blue-200">
            📋 Import Instructions
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <li>• File must be in CSV format</li>
            <li>
              • Required columns: programme_code, programme_name, degree_type,
              duration_years, department_id
            </li>
            <li>
              • Optional columns: description, is_active (default: true)
            </li>
            <li>
              • Degree types: Bachelor, Master, PhD, Diploma, Certificate
            </li>
            <li>• Department ID must exist in the database</li>
            <li>• Download the template below for the correct format</li>
          </ul>
          <button
            onClick={downloadTemplate}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
          >
            📥 Download CSV Template
          </button>
        </div>

        {/* Upload Form */}
        <form
          onSubmit={handleImport}
          className="rounded-xl border border-gray-200 bg-white p-8 shadow-md dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Select CSV File <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!file || loading}
              className="w-full rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700 disabled:bg-blue-300"
            >
              {loading ? 'Importing...' : 'Import Programmes'}
            </button>
          </div>
        </form>

        {/* Results */}
        {result && (
          <div
            className={`rounded-xl border p-6 ${
              result.failed === 0
                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
            }`}
          >
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Import Results
            </h3>
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-green-100 p-4 dark:bg-green-900">
                <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                  {result.success}
                </div>
                <div className="text-sm text-green-600 dark:text-green-300">
                  Successfully Imported
                </div>
              </div>
              <div className="rounded-lg bg-red-100 p-4 dark:bg-red-900">
                <div className="text-2xl font-bold text-red-800 dark:text-red-200">
                  {result.failed}
                </div>
                <div className="text-sm text-red-600 dark:text-red-300">
                  Failed
                </div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div>
                <h4 className="mb-2 font-medium text-gray-900 dark:text-white">
                  Errors:
                </h4>
                <div className="max-h-60 overflow-y-auto rounded-lg bg-white p-4 dark:bg-gray-800">
                  <ul className="space-y-1 text-sm text-red-600 dark:text-red-400">
                    {result.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {result.success > 0 && (
              <div className="mt-4">
                <Link
                  href="/programmes"
                  className="block w-full rounded-lg bg-blue-600 px-4 py-2 text-center text-white transition-colors hover:bg-blue-700"
                >
                  View Imported Programmes →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
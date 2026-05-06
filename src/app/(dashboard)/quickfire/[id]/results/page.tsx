'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { QuickfireAssessment, QuickfireResultSummary } from '@/types';

export default function AssessmentResultsPage() {
  const { id } = useParams();
  const [assessment, setAssessment] = useState<QuickfireAssessment | null>(null);
  const [results, setResults] = useState<QuickfireResultSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttempt, setSelectedAttempt] = useState<number | null>(null);
  const [detailedAnswers, setDetailedAnswers] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [aRes, rRes] = await Promise.all([
        fetch(`/api/quickfire/${id}`),
        fetch(`/api/quickfire/${id}/results`)
      ]);

      if (aRes.ok && rRes.ok) {
        const aData = await aRes.json();
        const rData = await rRes.json();
        setAssessment(aData.data);
        setResults(rData.data);
      }
    } catch (error) {
      console.error('Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const viewDetails = async (attemptId: number) => {
    setSelectedAttempt(attemptId);
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/quickfire/attempts/${attemptId}/answers`);
      if (res.ok) {
        const data = await res.json();
        setDetailedAnswers(data.data);
      }
    } catch (error) {
      console.error('Fetch Details Error:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center lg:pl-64">Loading report...</div>;
  if (!assessment) return null;

  return (
    <div className="space-y-8 lg:pl-64 pb-20">
      {/* Header */}
      <div>
        <nav className="mb-2 flex text-sm text-gray-500">
          <Link href="/quickfire" className="hover:text-indigo-600">Quickfire</Link>
          <span className="mx-2">/</span>
          <Link href={`/quickfire/${id}`} className="hover:text-indigo-600">Manage</Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-gray-900 dark:text-white">Results</span>
        </nav>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Performance Report</h1>
        <p className="text-sm text-gray-500">{assessment.title} • {assessment.course_code}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Results List */}
        <div className="xl:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="bg-gray-50 px-6 py-4 border-b dark:bg-gray-900/50 dark:border-gray-700">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Student Standings</h2>
            </div>
            
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-gray-500 border-b dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Score</th>
                  <th className="px-6 py-3">Submitted</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">No submissions found yet.</td>
                  </tr>
                ) : (
                  results.map((r) => (
                    <tr 
                      key={r.attempt_id} 
                      onClick={() => viewDetails(r.attempt_id)}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer ${selectedAttempt === r.attempt_id ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 dark:text-white">{r.student_name}</div>
                        <div className="text-xs text-gray-500">{r.registration_number}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <div className="h-2 w-20 bg-gray-100 rounded-full overflow-hidden dark:bg-gray-700">
                              <div 
                                className="h-full bg-indigo-500" 
                                style={{ width: `${(r.total_score / r.max_marks) * 100}%` }}
                              ></div>
                           </div>
                           <span className="font-bold">{r.total_score} <span className="text-xs font-normal text-gray-400">/ {r.max_marks}</span></span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : 'In Progress'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => viewDetails(r.attempt_id)}
                          className="text-xs font-bold text-indigo-600 hover:underline"
                        >
                          View Answers
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed View Panel */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 min-h-[400px]">
             {selectedAttempt === null ? (
               <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Answer Preview</h3>
                  <p className="text-xs text-gray-500 mt-2 px-6">Select a student from the list to see their detailed responses and essay content here.</p>
               </div>
             ) : loadingDetails ? (
               <div className="text-center py-12">Loading details...</div>
             ) : (
               <div className="space-y-6">
                  <div className="border-b pb-4 dark:border-gray-700">
                    <h3 className="text-lg font-bold">Detailed Responses</h3>
                    <p className="text-xs text-gray-500">Showing answers for {results.find(r => r.attempt_id === selectedAttempt)?.student_name}</p>
                  </div>

                  <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {detailedAnswers.map((ans, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[10px] font-bold uppercase text-gray-400">Question {ans.sequence_order}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${ans.is_correct ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-red-100 text-red-700 dark:bg-red-900/30'}`}>
                            {ans.marks_obtained} / {ans.max_question_marks} Pts
                          </span>
                        </div>
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{ans.question_text}</p>
                        
                        <div className="p-3 bg-gray-50 rounded-lg border dark:bg-gray-900/40 dark:border-gray-700">
                           <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Student Answer:</div>
                           <p className="text-sm whitespace-pre-wrap italic">"{ans.student_answer || 'No answer provided'}"</p>
                        </div>
                        
                        {!ans.is_correct && ans.correct_answer && (
                           <div className="text-[10px] flex items-center gap-1 text-green-600 font-medium">
                             <span>✓ Correct Answer:</span>
                             <span>{ans.correct_answer}</span>
                           </div>
                        )}
                      </div>
                    ))}
                  </div>
               </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
}

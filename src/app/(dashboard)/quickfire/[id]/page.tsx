'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { QuickfireAssessment, QuickfireQuestion } from '@/types';

export default function ManageAssessmentPage() {
  const { id } = useParams();
  const router = useRouter();
  const [assessment, setAssessment] = useState<QuickfireAssessment | null>(null);
  const [questions, setQuestions] = useState<QuickfireQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  
  // New Question Form
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    question_type: 'multiple_choice' as any,
    options: ['', '', '', ''],
    correct_answer: '',
    marks: 1,
    min_words: '',
    max_words: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const [aRes, qRes] = await Promise.all([
        fetch(`/api/quickfire/${id}`),
        fetch(`/api/quickfire/${id}/questions`)
      ]);

      if (aRes.ok && qRes.ok) {
        const aData = await aRes.json();
        const qData = await qRes.json();
        setAssessment(aData.data);
        setQuestions(qData.data);
      } else {
        router.push('/quickfire');
      }
    } catch (error) {
      console.error('Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingQuestion(true);
    try {
      const payload = {
        ...newQuestion,
        options: newQuestion.question_type === 'multiple_choice' ? newQuestion.options.filter(o => o.trim() !== '') : null,
        min_words: newQuestion.question_type === 'essay' && newQuestion.min_words ? parseInt(newQuestion.min_words) : null,
        max_words: newQuestion.question_type === 'essay' && newQuestion.max_words ? parseInt(newQuestion.max_words) : null,
        sequence_order: editingQuestionId ? undefined : questions.length + 1
      };

      const url = editingQuestionId 
        ? `/api/quickfire/questions/${editingQuestionId}` 
        : `/api/quickfire/${id}/questions`;
      
      const method = editingQuestionId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        resetForm();
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save question');
      }
    } catch (error) {
      console.error('Submit Error:', error);
    } finally {
      setAddingQuestion(false);
    }
  };

  const deleteQuestion = async (qId: number) => {
    if (!confirm('Remove this question?')) return;
    try {
      const response = await fetch(`/api/quickfire/questions/${qId}`, { method: 'DELETE' });
      if (response.ok) fetchData();
    } catch (error) {
      console.error('Delete Error:', error);
    }
  };

  const editQuestion = (q: QuickfireQuestion) => {
    setEditingQuestionId(q.id);
    const opts = q.options || [];
    setNewQuestion({
      question_text: q.question_text,
      question_type: q.question_type,
      options: [
        opts[0] || '',
        opts[1] || '',
        opts[2] || '',
        opts[3] || ''
      ],
      correct_answer: q.correct_answer || '',
      marks: q.marks,
      min_words: q.min_words ? String(q.min_words) : '',
      max_words: q.max_words ? String(q.max_words) : ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingQuestionId(null);
    setNewQuestion({
      question_text: '',
      question_type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: '',
      marks: 1,
      min_words: '',
      max_words: '',
    });
  };

  if (loading) return <div className="flex h-96 items-center justify-center lg:pl-64">Loading...</div>;
  if (!assessment) return null;

  return (
    <div className="space-y-8 lg:pl-64 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="mb-2 flex text-sm text-gray-500">
            <Link href="/quickfire" className="hover:text-indigo-600">Quickfire</Link>
            <span className="mx-2">/</span>
            <span className="font-medium text-gray-900 dark:text-white">Manage</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{assessment.title}</h1>
          <p className="text-sm text-gray-500">Course: [{assessment.course_code}] {assessment.course_title}</p>
        </div>
        
        <div className="flex gap-2">
            <Link 
              href={`/quickfire/${id}/results`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
            >
              📊 View Results
            </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Questions List & Add Form */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Add/Edit Question Form */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingQuestionId ? '✏️ Edit Question' : '➕ Add Question'}
              </h2>
              {editingQuestionId && (
                <button onClick={resetForm} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleAddQuestion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Question Text</label>
                <textarea 
                  required
                  rows={2}
                  value={newQuestion.question_text}
                  onChange={e => setNewQuestion({...newQuestion, question_text: e.target.value})}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter the question here..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Type</label>
                  <select 
                    value={newQuestion.question_type}
                    onChange={e => setNewQuestion({...newQuestion, question_type: e.target.value as any})}
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="essay">Essay / Open Ended</option>
                    <option value="short_answer">Short Answer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Marks</label>
                  <input 
                    type="number"
                    min="1"
                    value={newQuestion.marks}
                    onChange={e => setNewQuestion({...newQuestion, marks: parseInt(e.target.value) || 1})}
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              {newQuestion.question_type === 'multiple_choice' && (
                <div className="space-y-3 pt-2">
                  <label className="block text-sm font-medium">Options & Correct Answer</label>
                  {newQuestion.options.map((opt, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input 
                        type="radio" 
                        name="correct"
                        checked={newQuestion.correct_answer === opt && opt !== ''}
                        onChange={() => setNewQuestion({...newQuestion, correct_answer: opt})}
                        className="h-4 w-4 text-indigo-600"
                        title="Mark as correct answer"
                      />
                      <input 
                        type="text"
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        value={opt}
                        onChange={e => {
                          const next = [...newQuestion.options];
                          next[idx] = e.target.value;
                          setNewQuestion({...newQuestion, options: next});
                        }}
                        className="flex-1 rounded-lg border border-gray-300 p-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  ))}
                  <p className="text-xs text-gray-500 mt-1">Select the radio button next to the correct answer.</p>
                </div>
              )}

              {newQuestion.question_type === 'essay' && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Min Words</label>
                    <input 
                      type="number"
                      placeholder="Optional"
                      value={newQuestion.min_words}
                      onChange={e => setNewQuestion({...newQuestion, min_words: e.target.value})}
                      className="w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Max Words</label>
                    <input 
                      type="number"
                      placeholder="Optional"
                      value={newQuestion.max_words}
                      onChange={e => setNewQuestion({...newQuestion, max_words: e.target.value})}
                      className="w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
              )}

              <button 
                type="submit"
                disabled={addingQuestion}
                className={`w-full text-white rounded-lg py-2.5 font-bold transition disabled:opacity-50 mt-4 ${editingQuestionId ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {addingQuestion ? 'Saving...' : (editingQuestionId ? 'Save Changes' : 'Add Question')}
              </button>
            </form>
          </section>

          {/* Existing Questions */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">📝 Assessment Questions ({questions.length})</h2>
            {questions.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-xl border-2 border-dashed dark:bg-gray-900/40">
                <p className="text-gray-500">No questions added yet.</p>
              </div>
            ) : (
              questions.map((q, idx) => (
                <div key={q.id} className={`group rounded-xl border p-5 shadow-sm transition-colors ${editingQuestionId === q.id ? 'border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-900/20' : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-indigo-600 uppercase">Q {q.sequence_order || idx + 1} • {q.question_type.replace('_', ' ')} • {q.marks} Marks</span>
                    <div className="flex gap-2">
                       <button onClick={() => editQuestion(q)} className="text-gray-400 hover:text-indigo-500 transition-colors" title="Edit">✏️</button>
                       <button onClick={() => deleteQuestion(q.id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Delete">🗑️</button>
                    </div>
                  </div>
                  <p className="text-gray-900 dark:text-white font-medium">{q.question_text}</p>
                  
                  {q.question_type === 'multiple_choice' && q.options && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {(q.options as any).map((opt: string, i: number) => (
                        <div key={i} className={`text-sm p-2 rounded border ${opt === q.correct_answer ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800/50 dark:text-green-400' : 'bg-gray-50 border-gray-100 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-300'}`}>
                          {String.fromCharCode(65 + i)}. {opt}
                          {opt === q.correct_answer && <span className="ml-2">✓</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {q.question_type === 'essay' && (q.min_words || q.max_words) && (
                    <div className="mt-3 text-xs text-gray-500">
                      Constraint: {q.min_words || 0} to {q.max_words || '∞'} words
                    </div>
                  )}
                </div>
              ))
            )}
          </section>
        </div>

        {/* Right Column: Settings & Summary */}
        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">⚙️ Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                <div className="mt-1 flex items-center gap-2">
                   <div className={`h-2 w-2 rounded-full ${assessment.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                   <span className="font-medium text-sm">{assessment.is_active ? 'Accepting Responses' : 'Closed'}</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Time Allotted</label>
                <p className="text-sm font-medium">{assessment.duration_minutes ? `${assessment.duration_minutes} Minutes` : 'Unlimited'}</p>
              </div>
              <div className="pt-4 border-t dark:border-gray-700">
                 <button 
                  onClick={() => alert('Settings edit coming soon!')}
                  className="text-sm text-indigo-600 hover:underline font-medium"
                 >
                   Edit Assessment Settings
                 </button>
              </div>
            </div>
          </section>

          <section className="rounded-xl border-none bg-gradient-to-br from-indigo-600 to-purple-700 p-6 shadow-lg text-white">
            <h3 className="text-lg font-bold mb-2">🚀 Launch Info</h3>
            <p className="text-sm opacity-90 mb-4">Students can access this assessment using their registration number on the Vivavoce Flutter App.</p>
            <div className="rounded bg-white/10 p-3 text-xs font-mono break-all">
              ID: {id}
            </div>
            <p className="mt-4 text-[10px] uppercase tracking-widest font-bold opacity-60">spider tabs uems-phd-vv</p>
          </section>
        </div>

      </div>
    </div>
  );
}

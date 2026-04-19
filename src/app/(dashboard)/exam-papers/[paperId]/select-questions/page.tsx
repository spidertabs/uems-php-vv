/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/exam-papers/[paperId]/select-questions/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Question {
  id: number;
  question_text: string;
  question_type: string;
  marks: number;
  difficulty_level: string;
  bloom_level: string;
  course_code: string;
  course_title: string;
  study_unit_title: string;
  created_by_name: string;
  usage_count: number;
  options?: string | string[];
  shuffledOptions?: string[];
  optionOrder?: number[];
}

interface SelectedQuestion {
  id: number;
  question_id: number;
  question_number: string;
  display_number?: string;
  sub_question_label?: string | null;
  marks: number;
  section: string;
  parent_question_id?: number | null;
  indentation_level?: number;
  sequence_order: number;
  option_order?: number[] | null;
  can_have_sub_questions?: boolean;
  question: Question;
}

export default function SelectQuestionsPage() {
  const router = useRouter();
  const params = useParams();
  const paperId = params.paperId as string;

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<SelectedQuestion[]>([]);
  const [paper, setPaper] = useState<any>(null);

  // Filters
  const [filterStudyUnit, setFilterStudyUnit] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterBloom, setFilterBloom] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Section selection state
  const [selectedSection, setSelectedSection] = useState<Record<number, string>>({});
  const sections = ['A', 'B', 'C', 'D', 'E'];

  // Sub-question capability toggle (NEW)
  const [allowSubQuestions, setAllowSubQuestions] = useState<Record<number, boolean>>({});

  // Sub-question state
  const [showSubQuestionPrompt, setShowSubQuestionPrompt] = useState(false);
  const [lastAddedQuestion, setLastAddedQuestion] = useState<SelectedQuestion | null>(null);
  const [addingSubQuestionFor, setAddingSubQuestionFor] = useState<number | null>(null);
  const [subQuestionLevel, setSubQuestionLevel] = useState<number>(1);

  const [studyUnits, setStudyUnits] = useState<any[]>([]);
  const [loadingStudyUnits, setLoadingStudyUnits] = useState(false);
  const [questionTypes, setQuestionTypes] = useState<string[]>([
    'multiple_choice',
    'short_answer',
    'essay',
    'practical',
    'case_study',
  ]);

  // Helper to check if question type can have sub-questions
  const canHaveSubQuestions = (questionType: string): boolean => {
    const normalizedType = questionType.toLowerCase().replace(/\s+/g, '_');
    return normalizedType !== 'multiple_choice' && 
           normalizedType !== 'true_false';
  };

  // Helper to normalize question type for comparison
  const normalizeQuestionType = (type: string): string => {
    return type.toLowerCase().replace(/\s+/g, '_');
  };

  // Helper functions for MCQ options
  const shouldNotShuffle = (options: string[]): boolean => {
    const combinedText = options.join(' ').toLowerCase();
    return combinedText.includes('neither') || 
           combinedText.includes('both') ||
           combinedText.includes('all of the above') ||
           combinedText.includes('none of the above');
  };

  const shuffleArrayWithOrder = <T,>(array: T[]): { shuffled: T[]; order: number[] } => {
    const indices = array.map((_, idx) => idx);
    const shuffledIndices = [...indices];

    for (let i = shuffledIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
    }

    const shuffled = shuffledIndices.map((idx) => array[idx]);
    return { shuffled, order: shuffledIndices };
  };

  const applySavedOrder = <T,>(array: T[], order: number[]): T[] => {
    if (!order || order.length !== array.length) {
      return array;
    }
    return order.map((idx) => array[idx]);
  };

  const parseOptions = (options: any): string[] | undefined => {
    if (!options) return undefined;

    if (typeof options === 'string') {
      try {
        const parsed = JSON.parse(options);
        if (Array.isArray(parsed)) {
          return parsed.map((opt) => (typeof opt === 'string' ? opt : opt.text));
        }
        return undefined;
      } catch {
        return undefined;
      }
    }

    if (Array.isArray(options)) {
      return options.map((opt) => (typeof opt === 'string' ? opt : opt.text));
    }

    return undefined;
  };

  useEffect(() => {
    if (paperId) {
      fetchData();
    }
  }, [paperId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paperRes, questionsRes, typesRes] = await Promise.all([
        fetch(`/api/exam-papers/${paperId}`),
        fetch('/api/question-bank'),
        fetch('/api/questions?types=true'),
      ]);

      if (paperRes.ok) {
        const paperData = await paperRes.json();
        setPaper(paperData.paper);

        if (paperData.paper && paperData.paper.course_id) {
          fetchStudyUnits(paperData.paper.course_id);
        }

        await refreshSelectedQuestions();
      }

      if (questionsRes.ok) {
        const questionsData = await questionsRes.json();
        const parsedQuestions = (questionsData.questions || []).map((q: Question) => {
          const parsedOptions = parseOptions(q.options);

          if (normalizeQuestionType(q.question_type) === 'multiple_choice' && parsedOptions) {
            if (shouldNotShuffle(parsedOptions)) {
              return {
                ...q,
                options: parsedOptions,
                shuffledOptions: parsedOptions,
                optionOrder: parsedOptions.map((_, idx) => idx),
              };
            } else {
              const { shuffled, order } = shuffleArrayWithOrder(parsedOptions);
              return {
                ...q,
                options: parsedOptions,
                shuffledOptions: shuffled,
                optionOrder: order,
              };
            }
          }

          return {
            ...q,
            options: parsedOptions,
          };
        });

        setQuestions(parsedQuestions);
      }

      if (typesRes.ok) {
        const typesData = await typesRes.json();
        if (typesData.questionTypes && typesData.questionTypes.length > 0) {
          setQuestionTypes(typesData.questionTypes);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudyUnits = async (courseId: number | string) => {
    try {
      setLoadingStudyUnits(true);
      const response = await fetch(`/api/courses/${courseId}/study-units`);

      if (response.ok) {
        const data = await response.json();
        const unitsArray = data.study_units || data.studyUnits || [];
        if (Array.isArray(unitsArray)) {
          setStudyUnits(unitsArray);
        } else {
          setStudyUnits([]);
        }
      } else {
        setStudyUnits([]);
      }
    } catch (error) {
      console.error('Failed to fetch study units:', error);
      setStudyUnits([]);
    } finally {
      setLoadingStudyUnits(false);
    }
  };

  const refreshSelectedQuestions = async () => {
    try {
      const selectedRes = await fetch(`/api/exam-papers/${paperId}/questions`);
      if (selectedRes.ok) {
        const selectedData = await selectedRes.json();

        const parsedSelected = (selectedData.questions || []).map((sq: SelectedQuestion) => {
          const parsedOptions = parseOptions(sq.question.options);

          if (normalizeQuestionType(sq.question.question_type) === 'multiple_choice' && parsedOptions) {
            let shuffledOptions: string[];
            let optionOrder: number[];

            if (sq.option_order && Array.isArray(sq.option_order)) {
              shuffledOptions = applySavedOrder(parsedOptions, sq.option_order);
              optionOrder = sq.option_order;
            } else {
              if (shouldNotShuffle(parsedOptions)) {
                shuffledOptions = parsedOptions;
                optionOrder = parsedOptions.map((_, idx) => idx);
              } else {
                const { shuffled, order } = shuffleArrayWithOrder(parsedOptions);
                shuffledOptions = shuffled;
                optionOrder = order;
              }
            }

            return {
              ...sq,
              question: {
                ...sq.question,
                options: parsedOptions,
                shuffledOptions,
                optionOrder,
              },
            };
          }

          return {
            ...sq,
            question: {
              ...sq.question,
              options: parsedOptions,
            },
          };
        });

        setSelectedQuestions(parsedSelected);
      }
    } catch (error) {
      console.error('Failed to refresh selected questions:', error);
    }
  };

  const availableQuestions = useMemo(() => {
    return questions.filter((question) => {
      const isAlreadySelected = selectedQuestions.some((sq) => sq.question_id === question.id);
      if (isAlreadySelected) return false;

      const matchesSearch =
        question.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        question.course_code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCourse = paper && question.course_code === paper.course_code;
      const matchesStudyUnit =
        filterStudyUnit === 'all' || question.study_unit_title === filterStudyUnit;
      const matchesDifficulty =
        filterDifficulty === 'all' || question.difficulty_level === filterDifficulty;
      const matchesBloom = filterBloom === 'all' || question.bloom_level === filterBloom;
      
      // Normalize types for comparison
      const normalizedQuestionType = normalizeQuestionType(question.question_type);
      const normalizedFilterType = normalizeQuestionType(filterType);
      const matchesType = filterType === 'all' || normalizedQuestionType === normalizedFilterType;

      return (
        matchesSearch &&
        matchesCourse &&
        matchesStudyUnit &&
        matchesDifficulty &&
        matchesBloom &&
        matchesType
      );
    });
  }, [questions, selectedQuestions, searchQuery, paper, filterStudyUnit, filterDifficulty, filterBloom, filterType]);

  useEffect(() => {
    const initialSections: Record<number, string> = { ...selectedSection };
    const initialAllowSub: Record<number, boolean> = { ...allowSubQuestions };
    let hasChanges = false;

    availableQuestions.forEach((q: Question) => {
      if (!initialSections[q.id]) {
        initialSections[q.id] = 'A';
        hasChanges = true;
      }
      // Default: allow sub-questions for eligible question types
      if (initialAllowSub[q.id] === undefined) {
        initialAllowSub[q.id] = canHaveSubQuestions(q.question_type);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setSelectedSection(initialSections);
      setAllowSubQuestions(initialAllowSub);
    }
  }, [availableQuestions]);

  const handleSelectQuestion = async (
    question: Question,
    parentQuestionId?: number,
    indentationLevel?: number
  ) => {
    try {
      // Pre-validation: Check if MCQ or True/False is being added as sub-question
      if (parentQuestionId) {
        const normalizedType = normalizeQuestionType(question.question_type);
        if (!canHaveSubQuestions(question.question_type)) {
          alert('Multiple choice and True/False questions cannot be added as sub-questions');
          return;
        }
      }

      const requestData: any = {
        question_id: question.id,
        marks: question.marks,
        is_sub_question: !!parentQuestionId,
      };

      // Handle parent question (main question)
      if (parentQuestionId) {
        requestData.parent_question_id = parentQuestionId;
        requestData.indentation_level = indentationLevel || 1;
        // Section is inherited from parent - backend handles this
        // Sub-questions don't have the can_have_sub_questions flag (only main questions)
      } else {
        // Main question: use selected section and sub-question capability
        const section = selectedSection[question.id] || 'A';
        requestData.section = section;
        requestData.can_have_sub_questions = allowSubQuestions[question.id] ?? true;
      }

      // Add option order for MCQs
      if (normalizeQuestionType(question.question_type) === 'multiple_choice' && question.optionOrder) {
        requestData.option_order = question.optionOrder;
      }

      console.log('📤 Sending request:', requestData);

      const response = await fetch(`/api/exam-papers/${paperId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Success:', responseData);
        
        await refreshSelectedQuestions();
        
        // Handle sub-question prompt for main questions only
        if (!parentQuestionId) {
          // Check if user allowed sub-questions AND question type supports it
          const userAllowedSub = allowSubQuestions[question.id] ?? true;
          if (userAllowedSub && canHaveSubQuestions(question.question_type)) {
            // Fetch the newly added question to get its ID
            const selectedRes = await fetch(`/api/exam-papers/${paperId}/questions`);
            if (selectedRes.ok) {
              const selectedData = await selectedRes.json();
              const newlyAdded = selectedData.questions.find(
                (sq: SelectedQuestion) => sq.question_id === question.id && !sq.parent_question_id
              );
              
              if (newlyAdded) {
                setLastAddedQuestion(newlyAdded);
                setShowSubQuestionPrompt(true);
                setSubQuestionLevel(1);
              }
            }
          }
        } else {
          // Sub-question added successfully
          setAddingSubQuestionFor(null);
          setShowSubQuestionPrompt(false);
          setLastAddedQuestion(null);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        console.error('❌ API Error:', errorMessage);
        alert(`Failed to add question: ${errorMessage}`);
      }
    } catch (error) {
      console.error('❌ Failed to select question:', error);
      alert('Failed to add question: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleRemoveQuestion = async (selectedQuestion: SelectedQuestion) => {
    const hasSubQuestions = selectedQuestions.some(
      sq => sq.parent_question_id === selectedQuestion.id
    );
    
    const confirmMessage = hasSubQuestions
      ? 'Remove this question from the paper? This will also remove all its sub-questions.'
      : 'Remove this question from the paper?';
    
    if (!confirm(confirmMessage)) return;

    try {
      const response = await fetch(
        `/api/exam-papers/${paperId}/questions?epq_id=${selectedQuestion.id}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        await refreshSelectedQuestions();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to remove question');
      }
    } catch (error) {
      console.error('Failed to remove question:', error);
      alert('Failed to remove question');
    }
  };

  const handleContinueWithNewQuestion = () => {
    setShowSubQuestionPrompt(false);
    setLastAddedQuestion(null);
  };

  const handleAddSubQuestion = () => {
    if (lastAddedQuestion) {
      setShowSubQuestionPrompt(false);
      setAddingSubQuestionFor(lastAddedQuestion.id);
    }
  };

  const renderMCQOptions = (shuffledOptions: string[] | undefined) => {
    if (!shuffledOptions || !Array.isArray(shuffledOptions)) return null;

    return (
      <div className="mt-2 ml-3 space-y-1.5">
        {shuffledOptions.map((option, idx) => (
          <div key={idx} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
            <span className="font-semibold mt-0.5">{String.fromCharCode(65 + idx)}.</span>
            <span className="flex-1">{option}</span>
          </div>
        ))}
      </div>
    );
  };

  const groupedBySection = useMemo(() => {
    const grouped: Record<string, SelectedQuestion[]> = {};
    
    // First, add all main questions to their sections
    const mainQuestions = selectedQuestions.filter(sq => !sq.parent_question_id);
    mainQuestions.forEach(sq => {
      const section = sq.section || 'A';
      if (!grouped[section]) {
        grouped[section] = [];
      }
      grouped[section].push(sq);
    });
    
    // Then, recursively add sub-questions after their parents
    const addSubQuestions = (parentId: number, section: string) => {
      const children = selectedQuestions
        .filter(sq => sq.parent_question_id === parentId)
        .sort((a, b) => a.sequence_order - b.sequence_order);
      
      children.forEach(child => {
        const parentIndex = grouped[section].findIndex(q => q.id === parentId);
        if (parentIndex !== -1) {
          // Find the correct insertion point (after parent and all its existing children)
          let insertIndex = parentIndex + 1;
          while (
            insertIndex < grouped[section].length &&
            grouped[section][insertIndex].parent_question_id === parentId
          ) {
            insertIndex++;
          }
          grouped[section].splice(insertIndex, 0, child);
          
          // Recursively add children of this sub-question
          addSubQuestions(child.id, section);
        }
      });
    };
    
    // Add sub-questions for each main question
    mainQuestions.forEach(mainQ => {
      addSubQuestions(mainQ.id, mainQ.section || 'A');
    });
    
    return grouped;
  }, [selectedQuestions]);

  const totalMarks = selectedQuestions.reduce((sum, sq) => sum + sq.marks, 0);

  const difficultyColors = {
    easy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    hard: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    Easy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    Hard: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  const bloomColors = {
    remember: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    understand: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    apply: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    analyze: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    evaluate: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    create: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    Remember: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    Understand: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    Apply: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Analyze: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    Evaluate: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    Create: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center lg:pl-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:pl-64">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Select Questions</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {paper?.title} {paper?.course_code && `• ${paper.course_code}`}
          </p>
        </div>

        <Link
          href={`/exam-papers/${paperId}`}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          ← Back to Paper
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {selectedQuestions.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Selected Questions</div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{totalMarks}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Marks</div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {availableQuestions.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Available Questions</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Available Questions */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Available Questions
          </h2>

          {/* Filters */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />

              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <select
                  value={filterStudyUnit}
                  onChange={(e) => setFilterStudyUnit(e.target.value)}
                  disabled={loadingStudyUnits}
                  className="rounded-lg border border-gray-300 bg-gray-50 px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
                >
                  <option value="all">
                    {loadingStudyUnits ? 'Loading...' : 'All Study Units'}
                  </option>
                  {studyUnits.map((unit) => (
                    <option key={unit.id} value={unit.name || unit.title}>
                      {unit.name || unit.title}
                    </option>
                  ))}
                </select>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-gray-50 px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Types</option>
                  {questionTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>

                <select
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-gray-50 px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>

                <select
                  value={filterBloom}
                  onChange={(e) => setFilterBloom(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-gray-50 px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Bloom Levels</option>
                  <option value="remember">Remember</option>
                  <option value="understand">Understand</option>
                  <option value="apply">Apply</option>
                  <option value="analyze">Analyze</option>
                  <option value="evaluate">Evaluate</option>
                  <option value="create">Create</option>
                </select>
              </div>
            </div>
          </div>

          {/* Available Questions List */}
          <div className="max-h-[600px] space-y-3 overflow-y-auto">
            {availableQuestions.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                <div className="text-4xl">🔍</div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  No questions available
                </p>
              </div>
            ) : (
              availableQuestions.map((question) => (
                <div
                  key={question.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="mb-3">
                    <div className="mb-2 flex flex-wrap gap-1">
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {question.course_code}
                      </span>
                      {question.study_unit_title && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                          {question.study_unit_title}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          difficultyColors[question.difficulty_level as keyof typeof difficultyColors] || 
                          difficultyColors[question.difficulty_level.toLowerCase() as keyof typeof difficultyColors]
                        }`}
                      >
                        {question.difficulty_level}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      {question.question_text}
                    </p>

                    {normalizeQuestionType(question.question_type) === 'multiple_choice' &&
                      renderMCQOptions(question.shuffledOptions)}

                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {question.question_type.replace(/_/g, ' ')} • {question.marks} marks
                    </p>
                  </div>
                  
                  <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        Add to:
                      </label>
                      <select
                        value={selectedSection[question.id] || 'A'}
                        onChange={(e) => {
                          setSelectedSection((prev) => ({
                            ...prev,
                            [question.id]: e.target.value,
                          }));
                        }}
                        className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 font-medium focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      >
                        {sections.map((section) => (
                          <option key={section} value={section}>
                            Section {section}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* NEW: Sub-question capability toggle */}
                    {canHaveSubQuestions(question.question_type) && (
                      <div className="flex items-center gap-2 px-1">
                        <input
                          type="checkbox"
                          id={`sub-q-${question.id}`}
                          checked={allowSubQuestions[question.id] ?? true}
                          onChange={(e) => {
                            setAllowSubQuestions((prev) => ({
                              ...prev,
                              [question.id]: e.target.checked,
                            }));
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <label 
                          htmlFor={`sub-q-${question.id}`}
                          className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer"
                        >
                          Allow sub-questions
                        </label>
                      </div>
                    )}

                    <button
                      onClick={() => handleSelectQuestion(question)}
                      className="w-full rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
                    >
                      Add →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected Questions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Selected Questions ({selectedQuestions.length})
            </h2>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {totalMarks} marks
            </span>
          </div>

          <div className="max-h-[600px] space-y-4 overflow-y-auto">
            {selectedQuestions.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                <div className="text-4xl">📝</div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  No questions selected yet
                </p>
              </div>
            ) : (
              Object.entries(groupedBySection)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([section, sectionQuestions]) => (
                  <div key={section} className="space-y-3">
                    <div className="sticky top-0 z-10 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white">SECTION {section}</h3>
                        <span className="text-xs font-medium text-blue-100">
                          {sectionQuestions.length} questions • {sectionQuestions.reduce((sum, sq) => sum + sq.marks, 0)} marks
                        </span>
                      </div>
                    </div>

                    {sectionQuestions.map((sq) => {
                      const isMainQuestion = !sq.parent_question_id;
                      const hasSubQuestionLabel = sq.sub_question_label !== null && sq.sub_question_label !== undefined;
                      
                      const indentClass = 
                        sq.indentation_level === 1 ? 'ml-6' : 
                        sq.indentation_level === 2 ? 'ml-12' : 
                        sq.indentation_level && sq.indentation_level > 2 ? 'ml-16' : '';
                      
                      // Format display number
                      let displayNum: string;
                      if (isMainQuestion && !hasSubQuestionLabel) {
                        // Main question without sub-questions: show just the number
                        displayNum = sq.display_number || sq.question_number;
                      } else if (isMainQuestion && hasSubQuestionLabel) {
                        // Main question that became (a): show the full display
                        displayNum = sq.display_number || `${sq.question_number}(${sq.sub_question_label})`;
                      } else {
                        // Sub-question: extract just the sub-part
                        // e.g., "1(a)" -> "(a)", "2(i)" -> "(i)"
                        if (sq.display_number && sq.display_number.includes('(')) {
                          displayNum = sq.display_number.substring(sq.display_number.indexOf('('));
                        } else {
                          displayNum = sq.display_number || sq.question_number;
                        }
                      }
                      
                      const canAddSubQuestions = isMainQuestion && 
                                                 canHaveSubQuestions(sq.question.question_type) && 
                                                 (sq.can_have_sub_questions !== false);
                      
                      return (
                        <div
                          key={`${sq.id}-${sq.question_id}`}
                          className={`rounded-lg border p-4 ${
                            isMainQuestion 
                              ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                              : 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20'
                          } ${indentClass}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="mb-2 flex items-center gap-2 flex-wrap">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold text-white ${
                                  isMainQuestion && !hasSubQuestionLabel ? 'bg-green-600' : 
                                  hasSubQuestionLabel ? 'bg-purple-600' : 'bg-purple-600'
                                }`}>
                                  {displayNum}
                                </span>
                                {!isMainQuestion && (
                                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                                    Sub-question (Level {sq.indentation_level || 1})
                                  </span>
                                )}
                                {isMainQuestion && hasSubQuestionLabel && (
                                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                    Main question with sub-parts
                                  </span>
                                )}
                                {isMainQuestion && sq.can_have_sub_questions === false && (
                                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                    🔒 No sub-questions
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                {sq.question.question_text}
                              </p>

                              {normalizeQuestionType(sq.question.question_type) === 'multiple_choice' &&
                                renderMCQOptions(sq.question.shuffledOptions)}

                              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                {sq.question.question_type.replace(/_/g, ' ')} • {sq.marks} marks
                              </p>
                            </div>
                            <div className="ml-2 flex flex-col gap-2">
                              {canAddSubQuestions && (
                                <button
                                  onClick={() => {
                                    setLastAddedQuestion(sq);
                                    setAddingSubQuestionFor(sq.id);
                                    setSubQuestionLevel(1);
                                  }}
                                  className="rounded-lg border border-purple-300 px-3 py-1.5 text-xs font-medium text-purple-700 transition hover:bg-purple-50 dark:border-purple-600 dark:text-purple-400"
                                >
                                  + Sub
                                </button>
                              )}
                              <button
                                onClick={() => handleRemoveQuestion(sq)}
                                className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 dark:border-red-600 dark:text-red-400"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Prompt: Add Sub-Question or Continue */}
      {showSubQuestionPrompt && lastAddedQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-4 text-center">
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Question Added Successfully!
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Would you like to add a sub-question to this question?
              </p>
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs font-medium text-gray-900 dark:text-white">
                  {lastAddedQuestion.display_number || lastAddedQuestion.question_number}. {lastAddedQuestion.question.question_text}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleContinueWithNewQuestion}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                No, Add New Question
              </button>
              <button
                onClick={handleAddSubQuestion}
                className="flex-1 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700"
              >
                Yes, Add Sub-Question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Question Selection Dialog */}
      {addingSubQuestionFor && !showSubQuestionPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Add Sub-Question
              </h3>
              <button
                onClick={() => {
                  setAddingSubQuestionFor(null);
                  setLastAddedQuestion(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sub-question Level:
              </label>
              <select
                value={subQuestionLevel}
                onChange={(e) => setSubQuestionLevel(parseInt(e.target.value))}
                className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="1">Level 1 (a, b, c...)</option>
                <option value="2">Level 2 (i, ii, iii...)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Note: Multiple choice and True/False questions cannot be added as sub-questions
              </p>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {availableQuestions
                .filter(q => canHaveSubQuestions(q.question_type))
                .length === 0 ? (
                <div className="text-center p-8">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No eligible questions available
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    MCQs and True/False questions cannot be added as sub-questions
                  </p>
                </div>
              ) : (
                availableQuestions
                  .filter(q => canHaveSubQuestions(q.question_type))
                  .map((question) => (
                    <div
                      key={question.id}
                      className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900"
                    >
                      <div className="mb-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          {question.question_text}
                        </p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            {question.question_type.replace(/_/g, ' ')}
                          </span>
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {question.marks} marks
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSelectQuestion(question, addingSubQuestionFor, subQuestionLevel)}
                        className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-purple-700"
                      >
                        Add as Sub-Question
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
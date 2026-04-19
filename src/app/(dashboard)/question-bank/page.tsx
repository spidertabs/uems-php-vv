/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/(dashboard)/question-bank/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  created_at: string;
  usage_count: number;
  last_used: string | null;
}

interface User {
  role: string;
  id: number;
  first_name: string;
  last_name: string;
}

interface FilterOptions {
  courses: Array<{ id: number; code: string; title: string }>;
  studyUnits: Array<{ id: number; title: string; course_code: string }>;
  bloomLevels: string[];
  difficultyLevels: string[];
  questionTypes: string[];
}

export default function QuestionBankPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    courses: [],
    studyUnits: [],
    bloomLevels: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['Multiple Choice', 'Short Answer', 'Essay', 'Problem Solving', 'Practical'],
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [filterStudyUnit, setFilterStudyUnit] = useState<string>('all');
  const [filterBloom, setFilterBloom] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch study units when course is selected
  useEffect(() => {
    if (filterCourse && filterCourse !== 'all') {
      fetchStudyUnits(filterCourse);
    } else {
      // Clear study units when no course is selected
      setFilterOptions((prev) => ({ ...prev, studyUnits: [] }));
      setFilterStudyUnit('all');
    }
  }, [filterCourse]);

  const fetchStudyUnits = async (courseCode: string) => {
    try {
      const course = filterOptions.courses.find(c => c.code === courseCode);
      if (!course) {
        console.log('Course not found for code:', courseCode);
        return;
      }

      console.log('Fetching study units for course ID:', course.id);
      const response = await fetch(`/api/courses/${course.id}/study-units`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Study units response:', data);
        
        const units = data.studyUnits || [];
        
        console.log('Found units:', units.length);
        
        if (units.length === 0) {
          console.log('No study units found for this course');
        }
        
        setFilterOptions((prev) => ({
          ...prev,
          studyUnits: units.map((u: any) => ({
            id: u.id,
            title: u.name || u.title || 'Unnamed Unit',
            course_code: courseCode,
          })),
        }));
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch study units:', response.status, errorData);
        setFilterOptions((prev) => ({
          ...prev,
          studyUnits: [],
        }));
      }
    } catch (error) {
      console.error('Failed to fetch study units:', error);
      setFilterOptions((prev) => ({
        ...prev,
        studyUnits: [],
      }));
    }
  };

  const fetchData = async () => {
    try {
      const [userRes, questionsRes, coursesRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/question-bank'),
        fetch('/api/courses'),
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        console.log('User data:', userData);
        setUser(userData.user);
      }

      if (questionsRes.ok) {
        const questionsData = await questionsRes.json();
        console.log('Questions data:', questionsData);
        const allQuestions = questionsData.questions || [];
        setQuestions(allQuestions);

        // Extract unique values from actual questions to populate filters
        if (allQuestions.length > 0) {
          const uniqueBloomLevels = [...new Set(allQuestions.map((q: any) => q.bloom_level).filter(Boolean))] as string[];
          const uniqueDifficultyLevels = [...new Set(allQuestions.map((q: any) => q.difficulty_level).filter(Boolean))] as string[];
          const uniqueQuestionTypes = [...new Set(allQuestions.map((q: any) => q.question_type).filter(Boolean))] as string[];
          
          console.log('Unique values from DB:', {
            bloomLevels: uniqueBloomLevels,
            difficultyLevels: uniqueDifficultyLevels,
            questionTypes: uniqueQuestionTypes
          });

          setFilterOptions((prev) => ({
            ...prev,
            bloomLevels: uniqueBloomLevels.length > 0 ? uniqueBloomLevels : prev.bloomLevels,
            difficultyLevels: uniqueDifficultyLevels.length > 0 ? uniqueDifficultyLevels : prev.difficultyLevels,
            questionTypes: uniqueQuestionTypes.length > 0 ? uniqueQuestionTypes : prev.questionTypes,
          }));
        }
      } else {
        const errorData = await questionsRes.json();
        console.error('Questions error:', errorData);
      }

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        console.log('Courses data:', coursesData);
        const courses = coursesData.courses || [];
        setFilterOptions((prev) => ({
          ...prev,
          courses: courses.map((c: any) => ({ id: c.id, code: c.code, title: c.title })),
        }));
      } else {
        const errorData = await coursesRes.json();
        console.error('Courses error:', errorData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const response = await fetch(`/api/question-bank/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setQuestions(questions.filter((q) => q.id !== id));
      } else {
        alert('Failed to delete question');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete question');
    }
  };

  const filteredQuestions = questions.filter((question) => {
    const matchesSearch =
      question.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      question.course_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      question.study_unit_title?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCourse = filterCourse === 'all' || question.course_code === filterCourse;
    const matchesStudyUnit =
      filterStudyUnit === 'all' || question.study_unit_title === filterStudyUnit;
    
    const matchesBloom = filterBloom === 'all' || 
      question.bloom_level?.toLowerCase() === filterBloom.toLowerCase();
    
    const matchesDifficulty = filterDifficulty === 'all' || 
      question.difficulty_level?.toLowerCase() === filterDifficulty.toLowerCase();
    
    const matchesType = filterType === 'all' || 
      question.question_type?.toLowerCase() === filterType.toLowerCase();

    return (
      matchesSearch &&
      matchesCourse &&
      matchesStudyUnit &&
      matchesBloom &&
      matchesDifficulty &&
      matchesType
    );
  });

  // Show questions when course is selected (study unit is optional)
  const displayQuestions = filterCourse !== 'all' ? filteredQuestions : [];

  // Stats calculations
  const totalMarks = displayQuestions.reduce((sum, q) => sum + q.marks, 0);
  const avgMarks =
    displayQuestions.length > 0 ? (totalMarks / displayQuestions.length).toFixed(1) : 0;

  const difficultyColors = {
    Easy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    Hard: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  const bloomColors = {
    Remember: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    Understand: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    Apply: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Analyze: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    Evaluate: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    Create: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
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
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Question Bank</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage and organize your exam questions
          </p>
        </div>

        <Link
          href="/question-bank/create"
          className="whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          ➕ Add Question
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Search
          </label>
          <input
            type="text"
            placeholder="Search by question text, course, or study unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Course <span className="text-red-500">*</span>
            </label>
            <select
              value={filterCourse}
              onChange={(e) => {
                setFilterCourse(e.target.value);
                setFilterStudyUnit('all');
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Select a course</option>
              {filterOptions.courses.map((course) => (
                <option key={course.code} value={course.code}>
                  {course.code} - {course.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Study Unit
            </label>
            <select
              value={filterStudyUnit}
              onChange={(e) => setFilterStudyUnit(e.target.value)}
              disabled={filterCourse === 'all' || filterOptions.studyUnits.length === 0}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800 dark:disabled:text-gray-500"
            >
              <option value="all">
                {filterCourse === 'all' 
                  ? 'Select course first' 
                  : filterOptions.studyUnits.length === 0
                  ? 'No study units available'
                  : 'All Study Units'}
              </option>
              {filterOptions.studyUnits.map((unit) => (
                <option key={unit.id} value={unit.title}>
                  {unit.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Question Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Types</option>
              {filterOptions.questionTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Difficulty
            </label>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Difficulties</option>
              {filterOptions.difficultyLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Bloom Level
            </label>
            <select
              value={filterBloom}
              onChange={(e) => setFilterBloom(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Bloom Levels</option>
              {filterOptions.bloomLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterCourse('all');
              setFilterStudyUnit('all');
              setFilterBloom('all');
              setFilterDifficulty('all');
              setFilterType('all');
            }}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Clear All Filters
          </button>
          
          {filterCourse === 'all' && (
            <div className="flex items-center text-sm text-amber-600 dark:text-amber-400">
              <svg className="mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Please select a course to view questions
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {questions.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Questions</div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {displayQuestions.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {filterCourse === 'all' ? 'Select Course' : filterStudyUnit === 'all' ? 'All Questions' : 'Filtered Questions'}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {totalMarks}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Marks</div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {avgMarks}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Avg Marks/Question</div>
        </div>
      </div>

      {/* Questions List */}
      {filterCourse === 'all' ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-6xl">📚</div>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            Select a Course
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Choose a course from the dropdown above to view its questions
          </p>
        </div>
      ) : displayQuestions.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-6xl">❓</div>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No questions found
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {searchQuery || filterStudyUnit !== 'all' || filterBloom !== 'all' || filterDifficulty !== 'all' || filterType !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by creating your first question for this course'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayQuestions.map((question) => (
            <div
              key={question.id}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {question.course_code}
                    </span>
                    {question.study_unit_title && (
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        {question.study_unit_title}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        difficultyColors[question.difficulty_level as keyof typeof difficultyColors]
                      }`}
                    >
                      {question.difficulty_level}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        bloomColors[question.bloom_level as keyof typeof bloomColors]
                      }`}
                    >
                      {question.bloom_level}
                    </span>
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      {question.marks} marks
                    </span>
                  </div>

                  <div className="mb-3 text-gray-900 dark:text-white">
                    <div className="font-medium">{question.question_type}</div>
                    <div className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                      {question.question_text}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>By {question.created_by_name}</span>
                    <span>•</span>
                    <span>{new Date(question.created_at).toLocaleDateString()}</span>
                    {question.usage_count > 0 && (
                      <>
                        <span>•</span>
                        <span>Used {question.usage_count} times</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="ml-4 flex gap-2">
                  <Link
                    href={`/question-bank/edit/${question.id}`}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(question.id)}
                    className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-600 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
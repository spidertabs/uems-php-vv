/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
// src/app/(dashboard)/exam-papers/[paperId]/preview/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface ExamPaper {
  paper_code: string;
  course_code: string;
  course_title: string;
  college_name?: string;
  exam_type: string;
  academic_year: number;
  semester: number;
  exam_date: string;
  duration: number;
  total_marks: number;
  instructions: string;
  footer_text?: string;
}

interface Question {
  id: number;
  question_id: number;
  question_text: string;
  question_type: string;
  marks: number;
  section: string;
  sequence_order: number;
  question_number: string;
  display_number?: string;
  parent_question_id?: number | null;
  indentation_level?: number;
  options?: string | string[];
  option_order?: number[] | null;
  shuffledOptions?: string[];
}

interface Programme {
  id: number;
  code: string;
  name: string;
  level: string;
}

export default function PreviewExamPaperPage() {
  const params = useParams();
  const paperId = params.paperId as string;

  const [paper, setPaper] = useState<ExamPaper | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Helper function to parse options
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

  // Helper function to apply saved order to options
  const applySavedOrder = <T,>(array: T[], order: number[]): T[] => {
    if (!order || order.length !== array.length) {
      return array;
    }
    return order.map((idx) => array[idx]);
  };

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    // Check initially
    checkDarkMode();

    // Watch for changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (paperId) {
      fetchData();
    }
  }, [paperId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch paper details and questions
      const [paperResponse, questionsResponse] = await Promise.all([
        fetch(`/api/exam-papers/${paperId}`),
        fetch(`/api/exam-papers/${paperId}/questions`)
      ]);
      
      if (!paperResponse.ok) {
        console.error('Failed to fetch paper:', paperResponse.statusText);
        setPaper(null);
        setLoading(false);
        return;
      }

      const paperData = await paperResponse.json();
      setPaper(paperData.paper);
      setProgrammes(paperData.programmes || []);

      if (questionsResponse.ok) {
        const questionsData = await questionsResponse.json();
        
        // Parse and apply shuffle order to questions
        const parsedQuestions = (questionsData.questions || []).map((q: any) => {
          const parsedOptions = parseOptions(q.question?.options || q.options);

          const questionType = q.question?.question_type || q.question_type;
          
          if (questionType === 'multiple_choice' && parsedOptions) {
            // If we have a saved order, use it
            let shuffledOptions: string[];

            if (q.option_order && Array.isArray(q.option_order)) {
              shuffledOptions = applySavedOrder(parsedOptions, q.option_order);
            } else {
              // No saved order, just use original
              shuffledOptions = parsedOptions;
            }

            return {
              id: q.id,
              question_id: q.question_id,
              question_text: q.question?.question_text || q.question_text,
              question_type: questionType,
              marks: q.marks,
              section: q.section,
              sequence_order: q.sequence_order,
              question_number: q.question_number,
              display_number: q.display_number,
              parent_question_id: q.parent_question_id,
              indentation_level: q.indentation_level || 0,
              options: parsedOptions,
              shuffledOptions,
            };
          }

          return {
            id: q.id,
            question_id: q.question_id,
            question_text: q.question?.question_text || q.question_text,
            question_type: questionType,
            marks: q.marks,
            section: q.section,
            sequence_order: q.sequence_order,
            question_number: q.question_number,
            display_number: q.display_number,
            parent_question_id: q.parent_question_id,
            indentation_level: q.indentation_level || 0,
            options: parsedOptions,
          };
        });

        setQuestions(parsedQuestions);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setPaper(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper function to check if options can fit in two columns
  const canUseTwoColumns = (options: string[]): boolean => {
    // Use two columns if all options are short (less than 50 characters)
    const maxLength = Math.max(...options.map((opt) => opt.length));
    return maxLength < 50 && options.length >= 4;
  };

  // Helper function to render MCQ options
  const renderMCQOptions = (shuffledOptions: string[] | undefined, indentLevel: number = 0) => {
    if (!shuffledOptions || !Array.isArray(shuffledOptions)) return null;

    const useTwoColumns = canUseTwoColumns(shuffledOptions);
    const baseIndent = indentLevel * 24; // 24px per level

    if (useTwoColumns) {
      // Two-column layout
      return (
        <div 
          className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2"
          style={{ marginLeft: `${baseIndent + 24}px` }}
        >
          {shuffledOptions.map((option, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="font-semibold print-text-black">{String.fromCharCode(65 + idx)}.</span>
              <span className="flex-1 print-text-black">{option}</span>
            </div>
          ))}
        </div>
      );
    } else {
      // Single-column layout for longer options
      return (
        <div 
          className="mt-3 space-y-2"
          style={{ marginLeft: `${baseIndent + 24}px` }}
        >
          {shuffledOptions.map((option, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="font-semibold print-text-black">{String.fromCharCode(65 + idx)}.</span>
              <span className="flex-1 print-text-black">{option}</span>
            </div>
          ))}
        </div>
      );
    }
  };

  // Helper function to determine year from semester
  const getYearFromSemester = (semester: number) => {
    return Math.ceil(semester / 2);
  };

  // Helper function to get semester in year (1 or 2)
  const getSemesterInYear = (semester: number) => {
    return semester % 2 === 0 ? 2 : 1;
  };

  // Helper to format date (e.g., "Dec 24 2025")
  const formatDate = (dateString: string) => {
    if (!dateString) return '_______________';
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  // NEW: Group questions hierarchically by section
  const groupQuestionsBySection = () => {
    const sections: Record<string, Question[]> = {};
    
    // First, add all main questions to their sections
    const mainQuestions = questions.filter(q => !q.parent_question_id);
    mainQuestions.forEach(q => {
      const section = q.section || 'A';
      if (!sections[section]) {
        sections[section] = [];
      }
      sections[section].push(q);
    });
    
    // Then, recursively add sub-questions after their parents
    const addSubQuestions = (parentId: number, section: string) => {
      const children = questions
        .filter(q => q.parent_question_id === parentId)
        .sort((a, b) => a.sequence_order - b.sequence_order);
      
      children.forEach(child => {
        const parentIndex = sections[section].findIndex(q => q.id === parentId);
        if (parentIndex !== -1) {
          // Find the correct insertion point (after parent and all its existing children)
          let insertIndex = parentIndex + 1;
          while (
            insertIndex < sections[section].length &&
            sections[section][insertIndex].parent_question_id === parentId
          ) {
            insertIndex++;
          }
          sections[section].splice(insertIndex, 0, child);
          
          // Recursively add children of this sub-question
          addSubQuestions(child.id, section);
        }
      });
    };
    
    // Add sub-questions for each main question
    mainQuestions.forEach(mainQ => {
      addSubQuestions(mainQ.id, mainQ.section || 'A');
    });
    
    return sections;
  };

  // NEW: Render a single question with proper indentation
  const renderQuestion = (question: Question, mainQuestionIndex: number) => {
    const indentLevel = question.indentation_level || 0;
    const isMainQuestion = !question.parent_question_id;
    const baseIndent = indentLevel * 24; // 24px per level of indentation

    // Format display number
    let displayNum: string;
    if (isMainQuestion) {
      // Main question: use full number (1, 2, 3)
      displayNum = String(mainQuestionIndex);
    } else {
      // Sub-question: extract just the sub-part from display_number
      // e.g., "1(a)" -> "(a)", "2(i)" -> "(i)"
      if (question.display_number && question.display_number.includes('(')) {
        // Extract everything from the opening parenthesis onwards: "1(a)" -> "(a)"
        displayNum = question.display_number.substring(question.display_number.indexOf('('));
      } else {
        // Fallback
        displayNum = question.display_number || question.question_number || '';
      }
    }

    return (
      <div 
        key={`${question.id}-${question.question_id}`}
        className="break-inside-avoid"
        style={{ marginLeft: isMainQuestion ? '0px' : `${baseIndent}px` }}
      >
        <div className="flex items-start">
          <span className="mr-3 font-bold text-gray-900 dark:text-white print:text-black whitespace-nowrap">
            {displayNum}.
          </span>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-justify text-gray-900 dark:text-white print:text-black">
                  {/* Add True/False prefix for true_false questions */}
                  {question.question_type === 'true_false' && (
                    <span className="font-semibold">True/False: </span>
                  )}
                  {question.question_text}
                </p>

                {/* Show MCQ options if available */}
                {question.question_type === 'multiple_choice' &&
                  renderMCQOptions(question.shuffledOptions, indentLevel)}
              </div>
              <span className="flex-shrink-0 font-semibold text-gray-900 dark:text-white print:text-black whitespace-nowrap">
                [{question.marks} mark{question.marks !== 1 ? 's' : ''}]
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center lg:pl-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="flex h-96 items-center justify-center lg:pl-64">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Paper not found</p>
          <Link
            href="/exam-papers"
            className="mt-4 inline-block text-blue-600 hover:underline dark:text-blue-400"
          >
            ← Back to Papers
          </Link>
        </div>
      </div>
    );
  }

  const sections = groupQuestionsBySection();
  const year = getYearFromSemester(paper.semester);
  const semesterInYear = getSemesterInYear(paper.semester);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 lg:pl-64">
      {/* Print Controls - Hidden when printing */}
      <div className="no-print sticky top-0 z-10 bg-white p-4 shadow-md dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Preview: {paper.paper_code}
            </h1>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {questions.length} Questions
            </span>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/exam-papers/${paperId}`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              ← Back
            </Link>
            <button
              onClick={handlePrint}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              🖨️ Print / Save as PDF
            </button>
          </div>
        </div>
      </div>

      {/* Paper Preview - A4 Size */}
      <div
        className="mx-auto my-8 bg-white p-10 shadow-lg dark:bg-gray-800 print:m-0 print:p-0 print:bg-white print:shadow-none print:w-full"
        style={{ width: '210mm', minHeight: '297mm' }}
      >
        {/* Header with KIU Logo and College */}
        <div className="mb-2 pb-4">
          {/* KIU Logo - Centered - Dynamic based on theme */}
          <div className="mb-4 flex justify-center bg-white dark:bg-gray-800 print:bg-white">
            <img
              src={
                isDarkMode
                  ? '/static/images/kiu-Photoroom_white.png'
                  : '/static/images/kiu-Photoroom_black.png'
              }
              alt="KIU Logo"
              className="h-20 w-auto print:hidden"
            />
            {/* Separate logo for print - always use black */}
            <img
              src="/static/images/kiu-Photoroom_black.png"
              alt="KIU Logo"
              className="hidden h-20 w-auto print:block"
            />
          </div>

          <div className="text-center">
            <h1 className="mb-2 text-2xl font-bold uppercase text-gray-900 dark:text-white print:text-black">
              Kampala International University
            </h1>

            {/* College Name - Prominent Display */}
            {paper.college_name && (
              <div className="mb-3 mt-2">
                <p className="text-lg font-bold uppercase text-gray-800 dark:text-gray-200 print:text-black">
                  {paper.college_name}
                </p>
              </div>
            )}

            <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white print:text-black">
              {paper.exam_type} EXAMINATION {paper.academic_year}
            </h2>
            <p className="font-semibold text-gray-900 dark:text-white print:text-black">
              Time Allowed: {Math.floor(paper.duration / 60)} hour
              {Math.floor(paper.duration / 60) !== 1 ? 's' : ''}
              {paper.duration % 60 > 0 && ` ${paper.duration % 60} minutes`}
            </p>
          </div>
        </div>

        {/* Course Information */}
        <div className="mb-0 px-4 py-3 print:border-0">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold text-gray-700 dark:text-gray-300 print:text-black">
                Course Code:
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white print:text-black">
                {paper.course_code}
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-700 dark:text-gray-300 print:text-black">
                Course Title:
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white print:text-black">
                {paper.course_title}
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-700 dark:text-gray-300 print:text-black">
                Exam Date:
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white print:text-black">
                {formatDate(paper.exam_date)}
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-700 dark:text-gray-300 print:text-black">
                Programme(s):
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white print:text-black">
                {programmes.length > 0
                  ? programmes.map((p) => p.code).join(', ')
                  : '_______________'}
                <span className="px-2">
                  {' '}
                  / {year} : {semesterInYear}{' '}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Instructions - UPDATED WITH GREY BACKGROUND */}
        <div className="mb-6 p-4 print:p-2 print:bg-gray-100 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <p className="mb-2 font-bold uppercase text-gray-900 dark:text-white print:text-black">
            Instructions to Candidates:
          </p>
          {paper.instructions ? (
            <div className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 print:text-black">
              {paper.instructions}
            </div>
          ) : (
            <ul className="list-inside list-disc space-y-1 text-sm text-gray-800 dark:text-gray-200 print:text-black">
              <li>Write clearly and legibly.</li>
              <li>All answers and Rough work should be booklet provided.</li>
            </ul>
          )}
        </div>

        {/* Questions by Section */}
        <div className="space-y-8">
          {Object.entries(sections).length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center print:border-black">
              <p className="text-gray-600 dark:text-gray-400 print:text-black">
                No questions available
              </p>
            </div>
          ) : (
            Object.entries(sections)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([section, sectionQuestions]) => {
                // Calculate total marks for section (including sub-questions)
                const totalMarks = sectionQuestions.reduce((sum, q) => sum + q.marks, 0);
                
                // Get only main questions for counting
                const mainQuestionsCount = sectionQuestions.filter(q => !q.parent_question_id).length;
                
                return (
                  <div key={section}>
                    <div className="mb-4 border-b-2 border-gray-700 pb-2 dark:border-gray-300 print:border-black">
                      <h3 className="text-lg font-bold uppercase text-gray-900 dark:text-white print:text-black">
                        Section {section}
                        <span className="ml-4 text-sm font-normal">
                          ({totalMarks} Marks)
                        </span>
                      </h3>
                    </div>

                    <div className="space-y-6">
                      {sectionQuestions.map((question, index) => {
                        // Only render main questions and their children
                        // Children are rendered within their parents
                        if (question.parent_question_id) {
                          return null; // Skip - will be rendered with parent
                        }
                        
                        // Get main question index (not including sub-questions)
                        const mainQuestionIndex = sectionQuestions
                          .filter(q => !q.parent_question_id)
                          .findIndex(q => q.id === question.id) + 1;
                        
                        // Render main question
                        const mainQuestionElement = renderQuestion(question, mainQuestionIndex);
                        
                        // Get all children for this question
                        const children = sectionQuestions.filter(
                          q => q.parent_question_id === question.id
                        );
                        
                        return (
                          <div key={question.id}>
                            {mainQuestionElement}
                            {children.map(child => renderQuestion(child, 0))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 border-t-2 border-gray-900 pt-4 text-center text-xs text-gray-700 dark:border-gray-300 dark:text-gray-400 print:border-black print:text-black">
          <p className="font-bold">
            {paper.footer_text || ' END '}
          </p>
          <p className="mt-2">{paper.paper_code}</p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          /* Hide ALL non-essential elements */
          .no-print,
          nav,
          header,
          aside,
          [role="navigation"],
          [role="banner"],
          button:not(.print-keep) {
            display: none !important;
          }

          /* Reset body and html */
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            width: 100% !important;
            height: auto !important;
          }

          /* Remove all padding/margin from main containers */
          body > div,
          #__next,
          main {
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Reset the page container - remove left padding */
          .lg\\:pl-64 {
            padding-left: 0 !important;
          }

          /* Page setup */
          @page {
            size: A4;
            margin: 15mm 20mm;
          }

          /* Remove fixed width and adjust for print */
          .mx-auto {
            width: 100% !important;
            max-width: 100% !important;
          }

          /* Reset inline styles for print */
          [style*="width: 210mm"] {
            width: 100% !important;
          }

          /* Adjust padding for print */
          .print\\:p-0 {
            padding: 0 !important;
          }

          .print\\:w-full {
            width: 100% !important;
          }

          /* Prevent breaks inside elements */
          .break-inside-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* Force all backgrounds to white for print */
          * {
            background-color: white !important;
            background-image: none !important;
          }

          /* Force all text to black for print - override ALL color classes */
          *,
          .dark\\:text-white,
          .dark\\:text-gray-200,
          .dark\\:text-gray-300,
          .dark\\:text-gray-400,
          .dark\\:text-gray-500,
          .text-gray-900,
          .text-gray-800,
          .text-gray-700,
          .text-gray-600,
          .print-text-black,
          .print\\:text-black,
          .print\\:text-gray-900,
          .print\\:text-gray-800,
          .print\\:text-gray-700,
          .print\\:text-gray-600 {
            color: black !important;
          }

          /* Force all borders to black - no gray borders */
          *[class*="border"],
          .dark\\:border-gray-600,
          .dark\\:border-gray-500,
          .dark\\:border-gray-300,
          .border-gray-700,
          .border-gray-300,
          .print\\:border-black,
          .print\\:border-gray-900,
          .print\\:border-gray-700 {
            border-color: black !important;
          }

          /* Remove any box shadows */
          * {
            box-shadow: none !important;
          }

          /* Print-specific overrides */
          .print\\:bg-white {
            background-color: white !important;
          }
          
          .print\\:bg-gray-100 {
            background-color: #f3f4f6 !important;
          }

          .print\\:shadow-none {
            box-shadow: none !important;
          }

          .print\\:m-0 {
            margin: 0 !important;
          }

          .print\\:block {
            display: block !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:border-0 {
            border: 0 !important;
          }

          /* Ensure paper container takes full width */
          .mx-auto {
            margin-left: 0 !important;
            margin-right: 0 !important;
          }

          .my-8 {
            margin-top: 0 !important;
            margin-bottom: 0 !important;
          }

          /* Adjust text sizes for better fit */
          body {
            font-size: 11pt !important;
            line-height: 1.4 !important;
          }

          h1 {
            font-size: 18pt !important;
          }

          h2 {
            font-size: 16pt !important;
          }

          h3 {
            font-size: 14pt !important;
          }

          /* Reduce spacing for print */
          .space-y-8 > * + * {
            margin-top: 1.5rem !important;
          }

          .space-y-6 > * + * {
            margin-top: 1rem !important;
          }

          .mb-6 {
            margin-bottom: 1rem !important;
          }

          .mb-4 {
            margin-bottom: 0.75rem !important;
          }

          .mt-12 {
            margin-top: 2rem !important;
          }

          /* Print quality */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
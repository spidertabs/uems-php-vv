// src/app/(dashboard)/print-queue/[paperId]/page.tsx
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface PaperQuestion {
  id: number;
  question_number: string;
  sub_question_label: string | null;
  display_number: string;
  question_text: string;
  question_type: string;
  marks: number;
  sub_marks: string | null;
  section: string;
  indentation_level: number;
  parent_question_id: number | null;
  sequence_order: number;
  options: any;
  option_order: any;
  shuffledOptions?: string[];
  is_choice: boolean;
  choice_instructions: string | null;
  custom_instructions: string | null;
}

interface PaperDetails {
  id: number;
  paper_code: string;
  status: string;
  exam_type: string;
  exam_date: string;
  duration: number;
  total_marks: number;
  instructions: string;
  footer_text: string;
  academic_year: number;
  semester: number;
  course_code: string;
  course_title: string;
  department_name: string;
  college_name: string;
  programmes: string;
  created_by_name: string;
  hod_name: string;
  hod_approved_at: string;
  print_quantity: number;
  printed_at: string | null;
}

interface Programme {
  id: number;
  code: string;
  name: string;
  level: string;
}

export default function PrintPreviewPage() {
  const router = useRouter();
  const params = useParams();
  const paperId = params?.paperId as string;

  const [paper, setPaper] = useState<PaperDetails | null>(null);
  const [questions, setQuestions] = useState<PaperQuestion[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

    checkDarkMode();

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
      setError(null);

      console.log('Fetching paper from print queue:', paperId);
      
      const paperResponse = await fetch(`/api/print-queue/${paperId}`);
      
      if (!paperResponse.ok) {
        const errorText = await paperResponse.text();
        console.error('Failed to fetch paper:', paperResponse.status, errorText);
        setError(`Failed to load paper: ${paperResponse.status}`);
        setLoading(false);
        return;
      }

      const paperData = await paperResponse.json();
      console.log('Paper data received:', paperData);
      
      const paperDetails = paperData.data || paperData;
      setPaper(paperDetails);

      // Parse programmes from comma-separated string
      if (paperDetails.programmes) {
        const progCodes = paperDetails.programmes.split(', ');
        setProgrammes(progCodes.map((code: string, idx: number) => ({
          id: idx,
          code,
          name: code,
          level: 'bachelors'
        })));
      }

      console.log('Fetching questions for paper:', paperId);
      const questionsResponse = await fetch(`/api/exam-papers/${paperId}/questions`);
      
      if (questionsResponse.ok) {
        const questionsData = await questionsResponse.json();
        console.log('Questions data received:', questionsData);
        
        const questionsList = questionsData.data || questionsData.questions || [];
        
        // Parse and apply shuffle order to questions
        const parsedQuestions = questionsList.map((q: any) => {
          const parsedOptions = parseOptions(q.question?.options || q.options);
          const questionType = q.question?.question_type || q.question_type;
          
          if (questionType === 'multiple_choice' && parsedOptions) {
            let shuffledOptions: string[];

            if (q.option_order && Array.isArray(q.option_order)) {
              shuffledOptions = applySavedOrder(parsedOptions, q.option_order);
            } else {
              shuffledOptions = parsedOptions;
            }

            return {
              ...q,
              question_text: q.question?.question_text || q.question_text,
              question_type: questionType,
              indentation_level: q.indentation_level || 0,
              shuffledOptions,
            };
          }

          return {
            ...q,
            question_text: q.question?.question_text || q.question_text,
            question_type: questionType,
            indentation_level: q.indentation_level || 0,
          };
        });

        setQuestions(parsedQuestions);
      } else {
        console.error('Failed to fetch questions:', questionsResponse.status);
        setError('Failed to load questions');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleStartPrinting = async () => {
    if (!confirm('Start printing this exam paper?')) return;

    try {
      setPrinting(true);
      const response = await fetch(`/api/print-queue/${paperId}/start`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Printing started successfully!');
        router.push('/print-queue');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to start printing');
      }
    } catch (error) {
      console.error('Error starting print:', error);
      alert('Failed to start printing');
    } finally {
      setPrinting(false);
    }
  };

  const handleCompletePrinting = async () => {
    const quantity = prompt('Enter the number of copies printed:');
    if (!quantity || isNaN(Number(quantity))) return;

    try {
      setPrinting(true);
      const response = await fetch(`/api/print-queue/${paperId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ print_quantity: Number(quantity) }),
      });

      if (response.ok) {
        alert('Printing completed successfully!');
        router.push('/print-queue');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to complete printing');
      }
    } catch (error) {
      console.error('Error completing print:', error);
      alert('Failed to complete printing');
    } finally {
      setPrinting(false);
    }
  };

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

  const getYearFromSemester = (semester: number) => {
    return Math.ceil(semester / 2);
  };

  const getSemesterInYear = (semester: number) => {
    return semester % 2 === 0 ? 2 : 1;
  };

  const canUseTwoColumns = (options: string[]): boolean => {
    const maxLength = Math.max(...options.map((opt) => opt.length));
    return maxLength < 50 && options.length >= 4;
  };

  const renderMCQOptions = (shuffledOptions: string[] | undefined, indentLevel: number = 0) => {
    if (!shuffledOptions || !Array.isArray(shuffledOptions)) return null;

    const useTwoColumns = canUseTwoColumns(shuffledOptions);
    const baseIndent = indentLevel * 24;

    if (useTwoColumns) {
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

  const groupQuestionsBySection = () => {
    const sections: Record<string, PaperQuestion[]> = {};
    
    const mainQuestions = questions.filter(q => !q.parent_question_id);
    mainQuestions.forEach(q => {
      const section = q.section || 'A';
      if (!sections[section]) {
        sections[section] = [];
      }
      sections[section].push(q);
    });
    
    const addSubQuestions = (parentId: number, section: string) => {
      const children = questions
        .filter(q => q.parent_question_id === parentId)
        .sort((a, b) => a.sequence_order - b.sequence_order);
      
      children.forEach(child => {
        const parentIndex = sections[section].findIndex(q => q.id === parentId);
        if (parentIndex !== -1) {
          let insertIndex = parentIndex + 1;
          while (
            insertIndex < sections[section].length &&
            sections[section][insertIndex].parent_question_id === parentId
          ) {
            insertIndex++;
          }
          sections[section].splice(insertIndex, 0, child);
          addSubQuestions(child.id, section);
        }
      });
    };
    
    mainQuestions.forEach(mainQ => {
      addSubQuestions(mainQ.id, mainQ.section || 'A');
    });
    
    return sections;
  };

  const renderQuestion = (question: PaperQuestion, mainQuestionIndex: number) => {
    const indentLevel = question.indentation_level || 0;
    const isMainQuestion = !question.parent_question_id;
    const baseIndent = indentLevel * 24;

    let displayNum: string;
    if (isMainQuestion) {
      displayNum = String(mainQuestionIndex);
    } else {
      if (question.display_number && question.display_number.includes('(')) {
        displayNum = question.display_number.substring(question.display_number.indexOf('('));
      } else {
        displayNum = question.display_number || question.question_number || '';
      }
    }

    return (
      <div 
        key={`${question.id}-${question.question_number}`}
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
                  {question.question_text}
                </p>

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
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading paper preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center lg:pl-64">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Link
            href="/print-queue"
            className="inline-block text-blue-600 hover:underline dark:text-blue-400"
          >
            ← Back to Print Queue
          </Link>
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="flex h-96 items-center justify-center lg:pl-64">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Paper not found</p>
          <Link
            href="/print-queue"
            className="inline-block text-blue-600 hover:underline dark:text-blue-400"
          >
            ← Back to Print Queue
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
              Print Preview: {paper.paper_code}
            </h1>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {questions.length} Questions
            </span>
          </div>
          <div className="flex gap-3">
            <Link
              href="/print-queue"
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
            {paper.status === 'ready_for_print' && (
              <button
                onClick={handleStartPrinting}
                disabled={printing}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
              >
                {printing ? 'Processing...' : '▶️ Start Printing'}
              </button>
            )}
            {paper.status === 'printing' && (
              <button
                onClick={handleCompletePrinting}
                disabled={printing}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700 disabled:opacity-50"
              >
                {printing ? 'Processing...' : '✅ Complete Printing'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Paper Preview - A4 Size */}
      <div
        className="mx-auto my-8 bg-white p-10 shadow-lg dark:bg-gray-800 print:m-0 print:p-0 print:bg-white print:shadow-none print:w-full"
        style={{ width: '210mm', minHeight: '297mm' }}
      >
        {/* Header with KIU Logo */}
        <div className="mb-2 pb-4">
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

        {/* Instructions */}
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
              <li>All answers and Rough work should be in the booklet provided.</li>
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
                const totalMarks = sectionQuestions.reduce((sum, q) => sum + q.marks, 0);
                
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
                      {sectionQuestions.map((question) => {
                        if (question.parent_question_id) {
                          return null;
                        }
                        
                        const mainQuestionIndex = sectionQuestions
                          .filter(q => !q.parent_question_id)
                          .findIndex(q => q.id === question.id) + 1;
                        
                        const mainQuestionElement = renderQuestion(question, mainQuestionIndex);
                        
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
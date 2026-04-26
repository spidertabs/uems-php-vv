'use client';

import { useEffect, useState } from 'react';

interface Course {
  id: number;
  code: string;
  title: string;
  department_id: number;
}

interface Enrollment {
  id: number;
  course_id: number;
  course_code: string;
  course_title: string;
  academic_year: number;
  semester: number;
}

export default function EnrollmentPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Form
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [year, setYear] = useState('2026');
  const [semester, setSemester] = useState('1');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userRes, coursesRes, enrollRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/courses'),
        fetch('/api/exams/enroll')
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
      }

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourses(coursesData.courses || []);
      }

      if (enrollRes.ok) {
        const enrollData = await enrollRes.json();
        setEnrollments(enrollData.data || []);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;

    try {
      const response = await fetch('/api/exams/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: parseInt(selectedCourseId),
          academic_year: parseInt(year),
          semester: parseInt(semester)
        })
      });

      if (response.ok) {
        fetchData();
        setSelectedCourseId('');
        alert('Successfully enrolled in course!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to enroll');
      }
    } catch (error) {
      console.error('Enroll error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center lg:pl-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isStudent = user?.role === 'student';

  return (
    <div className="space-y-6 lg:pl-64 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 p-8 text-white shadow-xl">
        <div className="relative z-10">
          <h1 className="text-4xl font-black tracking-tight">Course Enrollment</h1>
          <p className="mt-2 text-emerald-100 font-medium">
            Register for units to access examination schedules.
          </p>
        </div>
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Enrollment Form */}
        {isStudent && (
          <div className="md:col-span-1 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">New Registration</h2>
            <form onSubmit={handleEnroll} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Course</label>
                <select
                  required
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a course...</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Year</label>
                    <input 
                       type="number"
                       value={year}
                       onChange={(e) => setYear(e.target.value)}
                       className="w-full rounded-xl border border-gray-300 bg-gray-50 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Sem</label>
                    <select
                       value={semester}
                       onChange={(e) => setSemester(e.target.value)}
                       className="w-full rounded-xl border border-gray-300 bg-gray-50 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                       <option value="1">1</option>
                       <option value="2">2</option>
                    </select>
                 </div>
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white shadow-lg transition hover:bg-emerald-700 mt-2"
              >
                Enroll Now
              </button>
            </form>
          </div>
        )}

        {/* My Enrollments */}
        <div className={isStudent ? "md:col-span-2" : "md:col-span-3"}>
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">
              {isStudent ? 'My Registered Courses' : 'Enrollment Statistics'}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <th className="pb-4 pt-2 text-sm font-bold text-gray-400 uppercase tracking-wider">Course</th>
                    <th className="pb-4 pt-2 text-sm font-bold text-gray-400 uppercase tracking-wider">Academic Period</th>
                    {!isStudent && <th className="pb-4 pt-2 text-sm font-bold text-gray-400 uppercase tracking-wider">Students</th>}
                    <th className="pb-4 pt-2 text-sm font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {enrollments.map((en) => (
                    <tr key={en.id} className="group transition hover:bg-gray-50/50">
                      <td className="py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{en.course_code}</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{en.course_title}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">AY {en.academic_year} | Sem {en.semester}</span>
                      </td>
                      {!isStudent && (
                        <td className="py-4">
                           <span className="text-sm font-bold text-gray-900 dark:text-white">{(en as any).student_count} Students</span>
                        </td>
                      )}
                      <td className="py-4">
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                          {isStudent ? '✅ Active' : '📊 Tracking'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {enrollments.length === 0 && (
                    <tr>
                       <td colSpan={isStudent ? 3 : 4} className="py-12 text-center text-gray-500">
                          No enrollments found.
                       </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

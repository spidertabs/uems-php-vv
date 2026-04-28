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
  exam_date?: string;
  start_time?: string;
  venue?: string;
}

import { Calendar, MapPin, Clock, CheckCircle2, AlertCircle, Search, Sparkles } from 'lucide-react';

export default function EnrollmentPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Form
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [year, setYear] = useState('2026');
  const [semester, setSemester] = useState('1');
  const [viewingCourse, setViewingCourse] = useState<any>(null);
  const [studentList, setStudentList] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [formStatus, setFormStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [courseStats, setCourseStats] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    fetchData();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/exams/enroll?stats=true'); // We'll add this specific flag handling in the next step
      if (res.ok) {
        const data = await res.json();
        setCourseStats(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setStatsLoading(false);
    }
  };

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
    setFormStatus(null);

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
        setFormStatus({ type: 'success', message: 'Successfully enrolled in course!' });
        setTimeout(() => setFormStatus(null), 5000);
      } else {
        const error = await response.json();
        setFormStatus({ type: 'error', message: error.error || 'Failed to enroll' });
      }
    } catch (error) {
      console.error('Enroll error:', error);
      setFormStatus({ type: 'error', message: 'A network error occurred. Please try again.' });
    }
  };

  const fetchStudentList = async (course: any) => {
    setViewingCourse(course);
    setListLoading(true);
    try {
      const res = await fetch(`/api/exams/enroll?course_id=${course.id}`);
      if (res.ok) {
        const data = await res.json();
        setStudentList(data.data || []);
      }
    } catch (error) {
      console.error('List error:', error);
    } finally {
      setListLoading(false);
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
                <div className="relative">
                  <select
                    required
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 p-2.5 pl-10 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white appearance-none"
                  >
                    <option value="">Select a course...</option>
                    {courses.filter(c => 
                      c.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      c.title.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map(c => (
                      <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
                    ))}
                  </select>
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
                <input 
                  type="text"
                  placeholder="Quick search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-900"
                />
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
              {formStatus && (
                <div className={`flex items-center gap-2 rounded-xl p-4 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300 ${
                  formStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  {formStatus.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  {formStatus.message}
                </div>
              )}
              <button
                type="submit"
                className="group relative w-full overflow-hidden rounded-xl bg-emerald-600 py-3 font-bold text-white shadow-lg transition-all hover:bg-emerald-700 hover:shadow-emerald-500/20 active:scale-95"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
                  Enroll Now
                </span>
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
                    {isStudent ? (
                      <th className="pb-4 pt-2 text-sm font-bold text-gray-400 uppercase tracking-wider">Academic Period</th>
                    ) : (
                      <th className="pb-4 pt-2 text-sm font-bold text-gray-400 uppercase tracking-wider">Department</th>
                    )}
                    {isStudent && <th className="pb-4 pt-2 text-sm font-bold text-gray-400 uppercase tracking-wider">Exam Schedule</th>}
                    {!isStudent && <th className="pb-4 pt-2 text-sm font-bold text-gray-400 uppercase tracking-wider">Enrolled</th>}
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
                        {isStudent ? (
                          <span className="text-sm text-gray-600 dark:text-gray-400">AY {en.academic_year} | Sem {en.semester}</span>
                        ) : (
                          <span className="text-sm text-gray-500 font-medium">{(en as any).department_name || 'General'}</span>
                        )}
                      </td>
                      {isStudent && (
                        <td className="py-4">
                          {en.exam_date ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-200">
                                <Calendar className="h-3 w-3 text-emerald-500" />
                                {new Date(en.exam_date).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Clock className="h-3 w-3" />
                                {en.start_time?.slice(0, 5)} @ {en.venue}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Not scheduled</span>
                          )}
                        </td>
                      )}
                      {!isStudent && (
                        <td className="py-4">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                            <span className="text-lg font-black text-blue-600 dark:text-blue-400">{(en as any).student_count || 0}</span>
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-tighter">Students</span>
                          </div>
                        </td>
                      )}
                      <td className="py-4">
                        <div className="flex items-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                            {isStudent ? <><CheckCircle2 className="h-3 w-3" /> Active</> : <><Sparkles className="h-3 w-3" /> Tracking</>}
                          </span>
                          {!isStudent && (
                             <button 
                                onClick={() => fetchStudentList(en)}
                                className="ml-3 text-xs font-bold text-blue-600 hover:underline"
                             >
                                View List
                             </button>
                          )}
                        </div>
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

      {/* Global Enrollment Overview */}
      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">General Statistics</h2>
            <p className="text-sm text-gray-500 font-medium tracking-tight">Overview of enrollment distribution across all courses</p>
          </div>
          <button 
            onClick={fetchStats}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
          >
            <Sparkles className={`h-5 w-5 ${statsLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {courseStats.slice(0, 8).map((stat: any) => (
            <div key={stat.id} className="relative group overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/50 p-5 dark:border-gray-700/50 dark:bg-gray-900/50 transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3 text-emerald-600 dark:text-emerald-400">
                  <span className="text-xs font-black uppercase tracking-widest">{stat.code}</span>
                  <CheckCircle2 className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1 mb-4">{stat.title}</h3>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-gray-900 dark:text-white">{stat.student_count || 0}</span>
                  <span className="text-xs font-bold text-gray-400 uppercase">Enrolled</span>
                </div>
              </div>
              <div className="absolute right-[-10%] bottom-[-10%] opacity-5 text-emerald-900 dark:text-emerald-100 scale-150 rotate-12 transition-transform group-hover:scale-175">
                <Sparkles size={100} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Student List Modal */}
      {viewingCourse && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl dark:bg-gray-800">
               <div className="flex items-center justify-between mb-6">
                  <div>
                     <h2 className="text-2xl font-black text-gray-900 dark:text-white">Enrolled Students</h2>
                     <p className="text-sm font-bold text-emerald-600 uppercase">{viewingCourse.code} - {viewingCourse.title}</p>
                  </div>
                  <button onClick={() => setViewingCourse(null)} className="text-gray-500 hover:text-gray-700">✕</button>
               </div>
               
               <div className="max-h-96 overflow-y-auto rounded-2xl border border-gray-100 dark:border-gray-700">
                  {listLoading ? (
                     <div className="py-20 text-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600 mx-auto"></div>
                     </div>
                  ) : (
                     <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/50 dark:bg-gray-900/50">
                           <tr>
                              <th className="px-4 py-3 font-bold text-gray-500">Reg Number</th>
                              <th className="px-4 py-3 font-bold text-gray-500">Name</th>
                              <th className="px-4 py-3 font-bold text-gray-500">Email</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                           {studentList.map((s, i) => (
                              <tr key={i} className="hover:bg-gray-50/50">
                                 <td className="px-4 py-3 font-mono font-bold text-emerald-600">{s.registration_number}</td>
                                 <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{s.first_name} {s.last_name}</td>
                                 <td className="px-4 py-3 text-gray-500">{s.email}</td>
                              </tr>
                           ))}
                           {studentList.length === 0 && (
                              <tr>
                                 <td colSpan={3} className="py-10 text-center text-gray-500">No students enrolled yet.</td>
                              </tr>
                           )}
                        </tbody>
                     </table>
                  )}
               </div>
               
               <div className="mt-6 flex justify-end">
                  <button 
                     onClick={() => setViewingCourse(null)}
                     className="rounded-xl bg-gray-100 px-6 py-2.5 font-bold text-gray-600 hover:bg-gray-200"
                  >
                     Close
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}

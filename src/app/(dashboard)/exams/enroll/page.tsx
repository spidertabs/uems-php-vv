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
  code: string;
  title: string;
  academic_year: number;
  semester: number;
  exam_date?: string;
  start_time?: string;
  venue?: string;
  department_name?: string;
  student_count?: number;
}

import { Calendar, MapPin, Clock, CheckCircle2, AlertCircle, Search, Sparkles } from 'lucide-react';

export default function EnrollmentPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [myEnrollments, setMyEnrollments] = useState<any[]>([]);

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
      const [userRes, coursesRes, enrollRes, myEnrollRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/courses'),
        fetch('/api/exams/enroll'), // All courses with counts
        fetch('/api/exams/enroll?student_only=true') // My own enrollments
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

      if (myEnrollRes.ok) {
        const myData = await myEnrollRes.json();
        setMyEnrollments(myData.data || []);
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
        <div className="md:col-span-3">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
               <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">Courses & Enrollment Status</h2>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-tighter">View counts and expected candidates for examination</p>
               </div>
               <div className="relative w-full md:w-64">
                  <input 
                     type="text"
                     placeholder="Search courses..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 pl-10 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
               </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <th className="pb-4 pt-2 text-sm font-bold text-gray-400 uppercase tracking-wider">Course</th>
                    <th className="pb-4 pt-2 text-sm font-bold text-gray-400 uppercase tracking-wider">Department</th>
                    <th className="pb-4 pt-2 text-sm font-bold text-gray-400 uppercase tracking-wider text-center">Enrolled</th>
                    <th className="pb-4 pt-2 text-sm font-bold text-gray-400 uppercase tracking-wider">Schedule Status</th>
                    <th className="pb-4 pt-2 text-sm font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {enrollments.filter(en => 
                    en.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    en.title.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((en) => {
                    const isEnrolled = myEnrollments.some((me: any) => me.course_id === en.id);
                    return (
                    <tr key={en.id} className="group transition hover:bg-gray-50/50">
                      <td className="py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{en.code}</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{en.title}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="text-sm text-gray-500 font-medium">{en.department_name || 'General'}</span>
                      </td>
                      <td className="py-4 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
                           <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{en.student_count || 0}</span>
                           <span className="text-xs font-bold text-emerald-400 uppercase tracking-tighter">Students</span>
                        </div>
                      </td>
                      <td className="py-4">
                        {en.exam_date ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-200">
                                <Calendar className="h-3 w-3 text-emerald-500" />
                                {new Date(en.exam_date).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Clock className="h-3 w-3" />
                                {en.start_time?.slice(0, 5)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">No schedule set</span>
                          )}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                           {isEnrolled ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                 <CheckCircle2 className="h-3 w-3" /> Registered
                              </span>
                           ) : isStudent && (
                              <button 
                                 onClick={() => {
                                    setSelectedCourseId(en.id.toString());
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                 }}
                                 className="text-xs font-bold text-emerald-600 hover:underline"
                              >
                                 Enroll
                              </button>
                           )}
                           <button 
                              onClick={() => fetchStudentList(en)}
                              className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
                           >
                              View Details
                           </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>



      {/* Student List Modal */}
      {viewingCourse && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-4xl rounded-3xl bg-white p-8 shadow-2xl dark:bg-gray-800">
               <div className="flex items-start justify-between mb-8">
                  <div>
                     <span className="text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-md mb-2 inline-block">Course Details</span>
                     <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{viewingCourse.code}: {viewingCourse.title}</h2>
                     <p className="mt-1 text-gray-500 font-medium">Department of {viewingCourse.department_name || 'General Studies'}</p>
                  </div>
                  <button onClick={() => setViewingCourse(null)} className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100">✕</button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                  {/* Stats & Schedule Summary */}
                  <div className="md:col-span-1 space-y-4">
                     <div className="rounded-2xl bg-gray-50 p-6 dark:bg-gray-900/50">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Enrollment Status</p>
                        <div className="flex items-baseline gap-2 text-emerald-600">
                           <span className="text-4xl font-black">{viewingCourse.student_count || 0}</span>
                           <span className="font-bold">Students</span>
                        </div>
                     </div>
                     
                     <div className="rounded-2xl border border-gray-100 p-6 dark:border-gray-700">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-4">Exam Schedule</p>
                        {viewingCourse.exam_date ? (
                           <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                 <Calendar className="h-5 w-5 text-emerald-500" />
                                 <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{new Date(viewingCourse.exam_date).toDateString()}</p>
                                    <p className="text-xs text-gray-500">Date scheduled</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-3">
                                 <Clock className="h-5 w-5 text-emerald-500" />
                                 <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{viewingCourse.start_time?.slice(0, 5)} HRS</p>
                                    <p className="text-xs text-gray-500">Commencement time</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-3">
                                 <MapPin className="h-5 w-5 text-emerald-500" />
                                 <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{viewingCourse.venue || 'TBA'}</p>
                                    <p className="text-xs text-gray-500">Examination venue</p>
                                 </div>
                              </div>
                           </div>
                        ) : (
                           <div className="py-4 text-center border-2 border-dashed border-gray-100 rounded-xl dark:border-gray-700">
                              <p className="text-sm text-gray-400 italic">Schedule not yet published</p>
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Student List */}
                  <div className="md:col-span-2">
                     <p className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center justify-between">
                        Expected Candidate List
                        <span className="text-emerald-600 lowercase font-medium">{studentList.length} items</span>
                     </p>
                     <div className="max-h-[400px] overflow-y-auto rounded-2xl border border-gray-100 dark:border-gray-700">
                        {listLoading ? (
                           <div className="py-20 text-center">
                              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600 mx-auto"></div>
                           </div>
                        ) : (
                           <table className="w-full text-left text-sm">
                              <thead className="bg-gray-50/50 dark:bg-gray-900/50 sticky top-0 backdrop-blur-md">
                                 <tr>
                                    <th className="px-4 py-3 font-bold text-gray-500">Reg Number</th>
                                    <th className="px-4 py-3 font-bold text-gray-500">Name</th>
                                    <th className="px-4 py-3 font-bold text-gray-500">Email</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                 {studentList.map((s, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                       <td className="px-4 py-4 font-mono font-bold text-emerald-600">{s.registration_number}</td>
                                       <td className="px-4 py-4 font-medium text-gray-900 dark:text-white">{s.first_name} {s.last_name}</td>
                                       <td className="px-4 py-4 text-gray-400 text-xs">{s.email}</td>
                                    </tr>
                                 ))}
                                 {studentList.length === 0 && (
                                    <tr>
                                       <td colSpan={3} className="py-20 text-center">
                                          <div className="flex flex-col items-center gap-2 text-gray-400">
                                             <AlertCircle size={32} />
                                             <p>No registered candidates found.</p>
                                          </div>
                                       </td>
                                    </tr>
                                 )}
                              </tbody>
                           </table>
                        )}
                     </div>
                  </div>
               </div>
               
               <div className="mt-8 pt-6 border-t border-gray-50 flex justify-between items-center dark:border-gray-700">
                  <p className="text-xs text-gray-400 italic font-medium">* This list contains students expected to sit for the {viewingCourse.code} examination.</p>
                  <button 
                     onClick={() => setViewingCourse(null)}
                     className="rounded-xl bg-gray-900 px-8 py-3 font-black text-white hover:bg-black transition-all active:scale-95 shadow-lg shadow-gray-200"
                  >
                     Close Explorer
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Course Registration Form (Floating for students) */}
      {isStudent && (
          <div className="fixed bottom-6 right-6 z-40">
             <div className="group relative">
                <button 
                  onClick={() => {
                     const form = document.getElementById('enrollment-form');
                     form?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-2xl hover:bg-emerald-700 transition-all active:scale-95"
                >
                   <Sparkles className="h-6 w-6" />
                </button>
                <div className="absolute bottom-full right-0 mb-4 scale-0 group-hover:scale-100 transition-all origin-bottom-right">
                   <div id="enrollment-form" className="w-80 rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
                      <h2 className="mb-4 text-lg font-black text-gray-900 dark:text-white">Quick Register</h2>
                      <form onSubmit={handleEnroll} className="space-y-4">
                        <div>
                           <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Select Course</label>
                           <select
                              required
                              value={selectedCourseId}
                              onChange={(e) => setSelectedCourseId(e.target.value)}
                              className="w-full rounded-xl border border-gray-300 bg-gray-50 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                           >
                              <option value="">Course...</option>
                              {courses.map(c => (
                                 <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
                              ))}
                           </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                           <input type="number" value={year} onChange={e => setYear(e.target.value)} className="rounded-xl border p-2 text-sm" placeholder="Year" />
                           <select value={semester} onChange={e => setSemester(e.target.value)} className="rounded-xl border p-2 text-sm">
                              <option value="1">Sem 1</option>
                              <option value="2">Sem 2</option>
                           </select>
                        </div>
                        {formStatus && (
                           <div className={`p-2 text-xs font-bold rounded-lg ${formStatus.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                              {formStatus.message}
                           </div>
                        )}
                        <button type="submit" className="w-full rounded-xl bg-emerald-600 py-2.5 font-bold text-white hover:bg-emerald-700">
                           Confirm Enrollment
                        </button>
                      </form>
                   </div>
                </div>
             </div>
          </div>
      )}
    </div>
  );
}

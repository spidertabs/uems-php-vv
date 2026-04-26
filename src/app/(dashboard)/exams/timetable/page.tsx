/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface TimetableSlot {
  id: number;
  exam_paper_id: number;
  paper_code: string;
  course_title: string;
  course_code: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  capacity: number | null;
  enrollment_count: number;
}

interface PublishedPaper {
  id: number;
  paper_code: string;
  course_title: string;
  course_code: string;
  academic_year: number;
  semester: number;
}

export default function TimetablePage() {
  const router = useRouter();
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [publishedPapers, setPublishedPapers] = useState<PublishedPaper[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedPaperId, setSelectedPaperId] = useState<string>('');
  const [selectedLecturers, setSelectedLecturers] = useState<number[]>([]);
  const [examDate, setExamDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [venue, setVenue] = useState('');
  const [capacity, setCapacity] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userRes, timetableRes, papersRes, staffRes, coursesRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/exams/timetable'),
        fetch('/api/exam-papers?status=published'),
        fetch('/api/staff?all=true'),
        fetch('/api/courses')
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
      }

      if (timetableRes.ok) {
        const timetableData = await timetableRes.json();
        setSlots(timetableData.data || []);
      }

      if (papersRes.ok) {
        const papersData = await papersRes.json();
        setPublishedPapers(papersData.papers || []);
      }

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaff(staffData.data || []);
      }

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourses(coursesData.courses || []);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    // Find the published paper for this course
    const paper = publishedPapers.find(p => (p as any).course_id.toString() === courseId);
    if (paper) {
      setSelectedPaperId(paper.id.toString());
    } else {
      setSelectedPaperId('');
    }
  };

  const toggleLecturer = (id: number) => {
    if (selectedLecturers.includes(id)) {
      setSelectedLecturers(selectedLecturers.filter(l => l !== id));
    } else {
      setSelectedLecturers([...selectedLecturers, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/exams/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_paper_id: selectedPaperId ? parseInt(selectedPaperId) : null,
          course_id: selectedCourseId ? parseInt(selectedCourseId) : null,
          exam_date: examDate,
          start_time: startTime,
          end_time: endTime,
          venue,
          capacity: capacity ? parseInt(capacity) : null,
          supervisor_ids: selectedLecturers
        })
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchData();
        // Reset form
        setSelectedCourseId('');
        setSelectedPaperId('');
        setSelectedLecturers([]);
        setExamDate('');
        setVenue('');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update timetable');
      }
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center lg:pl-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isHOD = user?.role === 'hod' || user?.role === 'admin';

  return (
    <div className="space-y-6 lg:pl-64 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Dynamic Header with Gradient */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Exam Timetable</h1>
            <p className="mt-2 text-blue-100 font-medium">
              Manage and view the master examination schedule.
            </p>
          </div>
          {isHOD && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="rounded-xl bg-white/20 backdrop-blur-md px-6 py-3 font-bold text-white ring-1 ring-white/30 transition hover:bg-white/30"
            >
              🗓️ Schedule Paper
            </button>
          )}
        </div>
        {/* Background blobs */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl"></div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 gap-6">
        {/* Timetable List */}
        <div className="rounded-3xl border border-gray-200 bg-white/80 backdrop-blur-sm p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800/80">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Active Schedule</h2>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              {slots.length} {slots.length === 1 ? 'Slot' : 'Slots'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="pb-4 pt-2 text-sm font-bold text-gray-400 uppercase tracking-wider">Exam Paper</th>
                  <th className="pb-4 pt-2 text-sm font-bold text-gray-400 uppercase tracking-wider">Date & Time</th>
                  <th className="pb-4 pt-2 text-sm font-bold text-gray-400 uppercase tracking-wider">Venue</th>
                  <th className="pb-4 pt-2 text-sm font-bold text-gray-400 uppercase tracking-wider">Enrollment</th>
                  {isHOD && <th className="pb-4 pt-2 text-sm font-bold text-gray-400 uppercase tracking-wider">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {slots.map((slot) => (
                  <tr key={slot.id} className="group transition hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-blue-600 dark:text-blue-400">{slot.paper_code || slot.course_code}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{slot.course_title}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex flex-col text-sm">
                        <span className="font-bold text-gray-900 dark:text-white">
                          {new Date(slot.exam_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-gray-500">{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        📍 {slot.venue}
                      </span>
                    </td>
                    <td className="py-4">
                       <div className="flex items-center gap-2">
                          <div className="h-2 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                             <div 
                                className="h-full bg-indigo-500" 
                                style={{ width: slot.capacity ? `${Math.min((slot.enrollment_count / slot.capacity) * 100, 100)}%` : '0%' }}
                             ></div>
                          </div>
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                            {slot.enrollment_count}{slot.capacity ? `/${slot.capacity}` : ''}
                          </span>
                       </div>
                    </td>
                    {isHOD && (
                      <td className="py-4 text-right">
                         <button 
                            onClick={() => {
                               setSelectedPaperId(slot.exam_paper_id.toString());
                               setExamDate(slot.exam_date.split('T')[0]);
                               setStartTime(slot.start_time.slice(0, 5));
                               setEndTime(slot.end_time.slice(0, 5));
                               setVenue(slot.venue);
                               setCapacity(slot.capacity?.toString() || '');
                               setIsModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 font-bold text-sm"
                         >
                            Edit
                         </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal for Scheduling */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl dark:bg-gray-800">
              <h2 className="mb-6 text-2xl font-black text-gray-900 dark:text-white">Schedule Exam</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Select Course</label>
                    <select 
                       required
                       value={selectedCourseId}
                       onChange={(e) => handleCourseChange(e.target.value)}
                       className="w-full rounded-xl border border-gray-300 bg-gray-50 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                       <option value="">Choose a course...</option>
                       {courses.map(course => (
                          <option key={course.id} value={course.id.toString()}>{course.code} - {course.title}</option>
                       ))}
                    </select>
                 </div>
                 {selectedPaperId && (
                    <div className="rounded-xl bg-blue-50 p-3 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                       Linked Paper: {publishedPapers.find(p => p.id.toString() === selectedPaperId)?.paper_code}
                    </div>
                 )}
                 <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Exam Date</label>
                    <input 
                       type="date" 
                       required
                       value={examDate}
                       onChange={(e) => setExamDate(e.target.value)}
                       className="w-full rounded-xl border border-gray-300 bg-gray-50 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
                       <input 
                          type="time" 
                          required
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full rounded-xl border border-gray-300 bg-gray-50 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                       />
                    </div>
                    <div>
                       <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">End Time</label>
                       <input 
                          type="time" 
                          required
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-full rounded-xl border border-gray-300 bg-gray-50 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                       />
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Venue</label>
                    <input 
                       type="text" 
                       required
                       placeholder="e.g. Main Hall"
                       value={venue}
                       onChange={(e) => setVenue(e.target.value)}
                       className="w-full rounded-xl border border-gray-300 bg-gray-50 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Capacity (Optional)</label>
                    <input 
                       type="number" 
                       placeholder="e.g. 100"
                       value={capacity}
                       onChange={(e) => setCapacity(e.target.value)}
                       className="w-full rounded-xl border border-gray-300 bg-gray-50 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Assign Supervisors</label>
                    <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-300 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700">
                       {staff.filter(s => s.role === 'lecturer' || s.role === 'hod').map(lecturer => (
                          <label key={lecturer.id} className="flex items-center gap-3 py-1 cursor-pointer">
                             <input 
                                type="checkbox"
                                checked={selectedLecturers.includes(lecturer.id)}
                                onChange={() => toggleLecturer(lecturer.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                             />
                             <span className="text-sm text-gray-700 dark:text-gray-200">{lecturer.first_name} {lecturer.last_name}</span>
                          </label>
                       ))}
                    </div>
                 </div>
                 <div className="flex gap-3 pt-4">
                    <button 
                       type="button"
                       onClick={() => setIsModalOpen(false)}
                       className="flex-1 rounded-xl bg-gray-100 py-3 font-bold text-gray-600 transition hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                    >
                       Cancel
                    </button>
                    <button 
                       type="submit"
                       className="flex-1 rounded-xl bg-blue-600 py-3 font-bold text-white shadow-lg transition hover:bg-blue-700"
                    >
                       Save Slot
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

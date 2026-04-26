'use client';

import { useEffect, useState } from 'react';

interface SupervisionSlot {
  id: number;
  paper_code: string;
  course_title: string;
  course_code: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  enrollment_count: number;
}

export default function SupervisionPage() {
  const [slots, setSlots] = useState<SupervisionSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userRes, timetableRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/exams/timetable')
      ]);
      
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
      }

      if (timetableRes.ok) {
        const data = await timetableRes.json();
        setSlots(data.data || []);
      }
    } catch (error) {
       console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isManagement = user?.role === 'admin' || user?.role === 'hod';

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center lg:pl-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
     <div className="space-y-6 lg:pl-64 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 to-red-600 p-8 text-white shadow-xl">
           <div className="relative z-10">
              <h1 className="text-4xl font-black tracking-tight">{isManagement ? 'Invigilation Overview' : 'Supervision Roster'}</h1>
              <p className="mt-2 text-orange-100 font-medium">
                 {isManagement ? 'Monitoring all examination duties and invigilation assignments.' : 'Your assigned examination duties and invigilation slots.'}
              </p>
           </div>
           <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-400/20 blur-3xl"></div>
        </div>

        <div className="grid grid-cols-1 gap-6">
           {slots.length === 0 ? (
              <div className="rounded-3xl border border-gray-200 bg-white p-20 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
                 <div className="text-6xl">{isManagement ? '📅' : '🛡️'}</div>
                 <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
                    {isManagement ? 'No Active Schedules' : 'No Assigned Duties'}
                 </h2>
                 <p className="text-gray-500">
                    {isManagement 
                       ? 'There are currently no exams scheduled in the system.' 
                       : 'You are not currently assigned to supervise any upcoming exams.'}
                 </p>
              </div>
           ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {slots.map((slot) => (
                    <div key={slot.id} className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-lg dark:border-gray-700 dark:bg-gray-800">
                       <div className="mb-4 flex items-center justify-between">
                          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                             {slot.paper_code || slot.course_code}
                          </span>
                          <span className="text-xs font-bold text-gray-400">
                             {slot.enrollment_count} Students
                          </span>
                       </div>
                       <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white leading-tight">
                          {slot.course_title}
                       </h3>
                       <div className="mt-4 space-y-2 border-t border-gray-50 pt-4 dark:border-gray-700/50">
                          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                             <span>📅</span>
                             <span className="font-bold whitespace-nowrap">
                                {new Date(slot.exam_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                             </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                             <span>⏰</span>
                             <span className="font-medium">{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                             <span>📍</span>
                             <span className="font-medium">{slot.venue}</span>
                          </div>
                          {isManagement && (
                             <div className="flex items-center gap-3 text-sm text-blue-600 dark:text-blue-400 mt-3 pt-3 border-t border-blue-50 dark:border-blue-900/20">
                                <span>👥</span>
                                <span className="font-bold">{(slot as any).supervisor_names || 'No supervisors assigned'}</span>
                             </div>
                          )}
                       </div>
                       <div className="absolute -right-4 -bottom-4 text-6xl opacity-5 group-hover:opacity-10 transition-opacity rotate-12">📝</div>
                    </div>
                 ))}
              </div>
           )}
        </div>
     </div>
  );
}

// src/data/headerNavLinks.ts
export interface NavLink {
  title: string;
  href: string;
  emoji?: string;
  roles?: string[];
}

const headerNavLinks: NavLink[] = [
  // Core Features
  {
    title: '📊 Dashboard',
    href: '/',
    roles: ['lecturer', 'professor', 'external_examiner', 'hod', 'dean', 'exam_master', 'admin', 'viva_coordinator'],
  },
  {
    title: '👤 Profile',
    href: '/profile',
  },

  // Academic Content
  {
    title: '📬 Notifications',
    href: '/notifications/',
    roles: ['lecturer', 'professor', 'external_examiner', 'hod', 'dean', 'exam_master', 'admin', 'viva_coordinator'],
  },
  {
    title: '✅ Approvals',
    href: '/approvals',
    roles: ['hod', 'dean', 'admin'],
  },
  {
    title: '📄 Exam Papers',
    href: '/exam-papers',
    roles: ['lecturer', 'hod', 'exam_master', 'admin'],
  },
  {
    title: '📝 Question Bank',
    href: '/question-bank',
    roles: ['lecturer', 'hod', 'admin'],
  },

  // Organization
  {
    title: '📚 Courses',
    href: '/courses',
    roles: ['admin', 'hod'],
  },
  {
    title: '🎓 Programmes',
    href: '/programmes',
    roles: ['admin', 'hod'],
  },
  {
    title: '🏛️ Colleges',
    href: '/colleges',
    roles: ['admin', 'hod'],
  },

  // Examination
  {
    title: '📅 Exam Timetable',
    href: '/exams/timetable',
    roles: ['admin', 'hod', 'dean', 'lecturer', 'student'],
  },
  {
    title: '📝 Course Enrollment',
    href: '/exams/enroll',
    roles: ['admin', 'hod', 'student'],
  },
  {
    title: '🛡️ Supervision Roster',
    href: '/exams/supervision',
    roles: ['lecturer', 'hod', 'admin'],
  },

  // Workflow & Communication
  {
    title: '🖨️ Print Queue',
    href: '/print-queue',
    roles: ['exam_master', 'admin'],
  },

  // ── PhD Viva Voce ─────────────────────────────────────────
  {
    title: '🎓 PhD Dashboard',
    href: '/phd',
    roles: ['viva_coordinator', 'admin', 'dean', 'hod', 'lecturer', 'professor', 'external_examiner'],
  },
  {
    title: '👨‍🎓 PhD Candidates',
    href: '/phd/candidates',
    roles: ['viva_coordinator', 'admin', 'dean', 'hod'],
  },
  {
    title: '📅 Viva Schedules',
    href: '/phd/schedules',
    roles: ['viva_coordinator', 'admin', 'dean', 'hod', 'lecturer', 'professor', 'external_examiner'],
  },
  {
    title: '📋 PhD Reports',
    href: '/phd/reports',
    roles: ['viva_coordinator', 'admin', 'dean', 'hod'],
  },

  // Management & Reports
  {
    title: '👥 Staff',
    href: '/staff',
    roles: ['admin'],
  },
  {
    title: '👨‍🎓 Students',
    href: '/students',
    roles: ['admin', 'hod'],
  },
  {
    title: '🔐 Permissions',
    href: '/permissions',
    roles: ['admin', 'hod'],
  },
  {
    title: '📊 Reports',
    href: '/reports',
    roles: ['hod', 'dean', 'exam_master', 'admin'],
  },
  {
    title: '📋 Audit Logs',
    href: '/audit',
    roles: ['admin', 'dean', 'hod'],
  },

  // PhD Management
  {
    title: '🎓 PhD Candidates',
    href: '/phd/my-candidates',
    roles: ['lecturer', 'professor', 'external_examiner'],
  },

  // Bottom Section
  {
    title: '⚙️ Settings',
    href: '/settings',
    roles: ['lecturer', 'hod', 'dean', 'exam_master', 'admin', 'viva_coordinator'],
  },
];

export default headerNavLinks;
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
    roles: ['lecturer', 'hod', 'dean', 'exam_master', 'admin', 'viva_coordinator'],
  },
  {
    title: '👤 Profile',
    href: '/profile',
  },

  // Academic Content
  {
    title: '📬 Notifications',
    href: '/notifications/',
    roles: ['lecturer', 'hod', 'dean', 'exam_master', 'admin', 'viva_coordinator'],
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
    roles: ['viva_coordinator', 'admin', 'dean'],
  },
  {
    title: '👨‍🎓 Candidates',
    href: '/phd/candidates',
    roles: ['viva_coordinator', 'admin'],
  },
  {
    title: '📅 Viva Schedules',
    href: '/phd/schedules',
    roles: ['viva_coordinator', 'admin'],
  },
  {
    title: '📋 PhD Reports',
    href: '/phd/reports',
    roles: ['viva_coordinator', 'admin', 'dean'],
  },

  // Management & Reports
  {
    title: '👥 Users',
    href: '/users',
    roles: ['admin'],
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
    roles: ['lecturer', 'hod'],
  },

  // Bottom Section
  {
    title: '⚙️ Settings',
    href: '/settings',
    roles: ['lecturer', 'hod', 'dean', 'exam_master', 'admin', 'viva_coordinator'],
  },
];

export default headerNavLinks;
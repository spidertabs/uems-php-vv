// data/headerNavLinks.ts
export interface NavLink {
  title: string;
  href: string;
  emoji?: string;
  roles?: string[]; // Restrict by user role
}

const headerNavLinks: NavLink[] = [
  // Core Features
  {
    title: '📊 Dashboard',
    href: '/',
    roles: ['lecturer', 'hod', 'dean', 'exam_master', 'admin'],
  },
  {
    title: '👤 Profile',
    href: '/profile',
  },
  
  // Academic Content
  {
    title: '📬 Notifications',
    href: '/notifications/',
    roles: ['lecturer', 'hod', 'dean', 'exam_master', 'admin'],
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
  
  // Bottom Section (Settings will be separated in layout)
  {
    title: '⚙️ Settings',
    href: '/settings',
    roles: ['lecturer', 'hod', 'dean', 'exam_master', 'admin'],
  },
];

export default headerNavLinks;
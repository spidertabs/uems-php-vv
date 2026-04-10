// src/app/layout.tsx
/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import headerNavLinks from '@/data/headerNavLinks';
import './globals.css';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Preferences {
  theme: 'light' | 'dark' | 'auto';
  notifications_enabled: boolean;
  email_notifications: boolean;
  dashboard_layout: 'compact' | 'comfortable';
  items_per_page: number;
  default_exam_type: 'TEST' | 'CAT' | 'FINAL';
  auto_save: boolean;
  show_tips: boolean;
}

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  priority: string;
  is_read: boolean;
  created_at: string;
  action_url: string | null;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  const [preferences, setPreferences] = useState<Preferences>({
    theme: 'auto',
    notifications_enabled: true,
    email_notifications: true,
    dashboard_layout: 'comfortable',
    items_per_page: 10,
    default_exam_type: 'TEST',
    auto_save: true,
    show_tips: true,
  });

  const isAuthRoute = pathname.startsWith('/auth');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load preferences and apply theme
  useEffect(() => {
    loadPreferences();
  }, []);

  // Listen for preference changes from settings page
  useEffect(() => {
    const handleStorageChange = () => {
      loadPreferences();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('preferencesUpdated', handleStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('preferencesUpdated', handleStorageChange as EventListener);
    };
  }, []);

  const loadPreferences = () => {
    const saved = localStorage.getItem('user_preferences');
    if (saved) {
      const prefs = JSON.parse(saved);
      setPreferences(prefs);
      applyTheme(prefs.theme);
    } else {
      applyTheme('auto');
    }
  };

  const applyTheme = (theme: 'light' | 'dark' | 'auto') => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  useEffect(() => {
    if (!isAuthRoute) {
      fetchUser();
      fetchNotifications();
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [pathname]);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        const notifs = data.data || [];
        setNotifications(notifs.slice(0, 5)); // Show only 5 most recent
        setNotificationCount(notifs.filter((n: Notification) => !n.is_read).length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
      });

      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      
      await Promise.all(
        unreadIds.map(id => 
          fetch(`/api/notifications/${id}/read`, { method: 'PUT' })
        )
      );
      
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    if (notification.action_url) {
      router.push(notification.action_url);
      setNotificationDropdownOpen(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/auth/login');
    router.refresh();
  };

  const toggleTheme = () => {
    const currentTheme = preferences.theme;
    let newTheme: 'light' | 'dark' | 'auto';

    if (currentTheme === 'light') {
      newTheme = 'dark';
    } else if (currentTheme === 'dark') {
      newTheme = 'auto';
    } else {
      newTheme = 'light';
    }

    const newPreferences = { ...preferences, theme: newTheme };
    setPreferences(newPreferences);
    localStorage.setItem('user_preferences', JSON.stringify(newPreferences));
    applyTheme(newTheme);
    window.dispatchEvent(new Event('preferencesUpdated'));
  };

  const getThemeIcon = () => {
    if (preferences.theme === 'light') return '☀️';
    if (preferences.theme === 'dark') return '🌙';
    return '💻';
  };

  const getThemeLabel = () => {
    if (preferences.theme === 'light') return 'Light';
    if (preferences.theme === 'dark') return 'Dark';
    return 'Auto';
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      paper_submitted: '📄',
      paper_approved: '✅',
      paper_rejected: '❌',
      paper_returned: '↩️',
      permission_granted: '🔓',
      approval_required: '⏳',
      ready_for_print: '🖨️',
      print_completed: '✔️',
      comment_added: '💬',
      deadline_reminder: '⏰',
      general: '📧',
    };
    return icons[type] || '📧';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    };
    return colors[priority] || colors.medium;
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const isActiveLink = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-500',
      exam_master: 'bg-cyan-500',
      dean: 'bg-purple-500',
      hod: 'bg-indigo-500',
      lecturer: 'bg-blue-500',
    };
    return colors[role] || 'bg-gray-500';
  };

  const getRoleIcon = (role: string) => {
    const icons: Record<string, string> = {
      admin: '👑',
      exam_master: '🖨️',
      dean: '🎓',
      hod: '📚',
      lecturer: '👨‍🏫',
    };
    return icons[role] || '👤';
  };

  const filteredNavLinks = user
    ? headerNavLinks.filter((link) => !link.roles || link.roles.includes(user.role))
    : [];

  const mainNavLinks = filteredNavLinks.filter((link) => link.href !== '/settings');
  const settingsLink = filteredNavLinks.find((link) => link.href === '/settings');

  // Generate page title based on user and route
  const getPageTitle = () => {
    if (user && !isAuthRoute) {
      const name = user.name || 'Admin';
      const role = user.role ? user.role.replace('_', ' ').toUpperCase() : 'ADMIN';
      return `${name} - ${role} | UEMS`;
    }
    return 'UEMS - University Exam Management System';
  };

  // Generate Open Graph title
  const getOGTitle = () => {
    if (user && !isAuthRoute) {
      const name = user.name || 'Admin';
      const role = user.role ? user.role.replace('_', ' ').toUpperCase() : 'ADMIN';
      return `${name} - ${role} | UEMS`;
    }
    return 'UEMS - University Exam Management System';
  };

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="University Exam Management System for managing exam papers, question banks, and approval workflows" />
        <meta name="author" content="Kampala International University" />
        <meta name="theme-color" content="#3B82F6" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={getOGTitle()} />
        <meta property="og:description" content="University Exam Management System for managing exam papers, question banks, and approval workflows" />
        <meta property="og:site_name" content="UEMS" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={getOGTitle()} />
        <meta name="twitter:description" content="University Exam Management System for managing exam papers, question banks, and approval workflows" />
        <meta name="twitter:image" content="/static/images/kiu-seal.png" />
        
        {/* Favicon */}
        <link rel="icon" type="image/png" href="/static/images/kiu-logo.png" />
        <link rel="apple-touch-icon" href="/static/images/kiu-logo.png" />
        
        <title>{getPageTitle()}</title>
      </head>
      <body className="min-h-screen bg-gray-50 font-sans antialiased dark:bg-gray-900">
        {isAuthRoute ? (
          children
        ) : loading ? (
          <div className="flex min-h-screen items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="min-h-screen">
            {/* Top Navigation Bar */}
            <nav className="fixed top-0 z-30 w-full border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex h-16 items-center justify-between px-4">
                {/* Left Section */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 lg:hidden"
                    aria-label="Toggle sidebar"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>

                  <Link href="/" className="flex items-center gap-3">
                    <div className="relative h-10 w-10">
                      <Image
                        src="/static/images/kiu-logo.png"
                        alt="KIU Logo"
                        width={40}
                        height={40}
                        className="object-contain"
                      />
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">UEMS</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Exam Management</div>
                    </div>
                  </Link>
                </div>

                {/* Center Section - Search with Notification */}
                <div className="hidden flex-1 items-center justify-center gap-3 px-8 lg:flex">
                  <div ref={searchRef} className="relative w-full max-w-xl">
                    <form onSubmit={handleSearch}>
                      <div className="relative">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onFocus={() => setSearchOpen(true)}
                          onKeyDown={handleSearchKeyDown}
                          placeholder="Search exam papers, questions, courses..."
                          className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400 dark:focus:bg-gray-600"
                        />
                        <svg
                          className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-600 dark:hover:text-gray-300"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </form>

                    {/* Search Suggestions/Quick Links */}
                    {searchOpen && (
                      <div className="absolute left-0 right-0 top-full mt-2 rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
                        <div className="p-3">
                          <p className="mb-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                            Quick Links
                          </p>
                          <div className="space-y-1">
                            <Link
                              href="/exam-papers"
                              onClick={() => setSearchOpen(false)}
                              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              <span>📄</span>
                              <span>All Exam Papers</span>
                            </Link>
                            <Link
                              href="/question-bank"
                              onClick={() => setSearchOpen(false)}
                              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              <span>❓</span>
                              <span>Question Bank</span>
                            </Link>
                            <Link
                              href="/courses"
                              onClick={() => setSearchOpen(false)}
                              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              <span>📚</span>
                              <span>Courses</span>
                            </Link>
                          </div>
                        </div>
                        <div className="border-t border-gray-200 p-2 dark:border-gray-700">
                          <p className="px-3 text-xs text-gray-500 dark:text-gray-400">
                            💡 Tip: Press <kbd className="rounded bg-gray-200 px-1.5 py-0.5 text-xs font-semibold dark:bg-gray-700">Enter</kbd> to search
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notifications Dropdown - Desktop */}
                  <div ref={notificationRef} className="relative">
                    <button
                      onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                      className="relative rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                      title="Notifications"
                    >
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      {notificationCount > 0 && (
                        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                          {notificationCount > 9 ? '9+' : notificationCount}
                        </span>
                      )}
                    </button>

                    {/* Dropdown Panel */}
                    {notificationDropdownOpen && (
                      <div className="absolute right-0 top-12 w-96 max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Notifications
                          </h3>
                          <div className="flex items-center gap-2">
                            {notificationCount > 0 && (
                              <button
                                onClick={markAllAsRead}
                                className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                              >
                                Mark all read
                              </button>
                            )}
                            <Link
                              href="/notifications"
                              onClick={() => setNotificationDropdownOpen(false)}
                              className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                            >
                              View all
                            </Link>
                          </div>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length > 0 ? (
                            notifications.map((notification) => (
                              <button
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`w-full border-b border-gray-100 p-4 text-left transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50 ${
                                  !notification.is_read ? 'bg-blue-50 dark:bg-blue-950/30' : ''
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="text-2xl">{getTypeIcon(notification.type)}</div>
                                  <div className="flex-1 min-w-0">
                                    <div className="mb-1 flex items-center gap-2">
                                      <h4 className="truncate font-semibold text-gray-900 dark:text-white text-sm">
                                        {notification.title}
                                      </h4>
                                      {!notification.is_read && (
                                        <div className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-600"></div>
                                      )}
                                    </div>
                                    <p className="mb-2 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">
                                      {notification.message}
                                    </p>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-gray-500">
                                        {getTimeAgo(notification.created_at)}
                                      </span>
                                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                                        {notification.priority}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="py-12 text-center">
                              <div className="mb-2 text-4xl">📭</div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                No notifications
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                          <div className="border-t border-gray-200 p-3 dark:border-gray-700">
                            <Link
                              href="/notifications"
                              onClick={() => setNotificationDropdownOpen(false)}
                              className="flex items-center justify-center gap-2 rounded-lg bg-blue-50 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
                            >
                              <span>View all notifications</span>
                              <span>→</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile Search Button */}
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 lg:hidden"
                  title="Search"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>

                {/* Right Section */}
                <div className="flex items-center gap-3">
                  {/* Theme Toggle */}
                  <button
                    onClick={toggleTheme}
                    className="group relative rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    title={`Theme: ${getThemeLabel()}`}
                  >
                    <span className="text-xl">{getThemeIcon()}</span>
                    <span className="absolute -bottom-8 right-0 hidden rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block dark:bg-gray-700">
                      {getThemeLabel()}
                    </span>
                  </button>

                  {/* User Menu Dropdown - Desktop */}
                  <div ref={userMenuRef} className="relative hidden sm:block">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-3 rounded-lg border-2 border-gray-200 bg-white p-2 shadow-sm transition hover:border-blue-500 hover:shadow-md dark:border-gray-600 dark:bg-gray-800 dark:hover:border-blue-500"
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${getRoleColor(user?.role || '')} shadow-md text-sm font-bold text-white ring-2 ring-white dark:ring-gray-800`}>
                        {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                      </div>
                      <div className="hidden text-left lg:block">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</div>
                        <div className="text-xs font-medium capitalize text-gray-500 dark:text-gray-400">
                          {user?.role.replace('_', ' ')}
                        </div>
                      </div>
                      <svg className={`h-4 w-4 text-gray-500 transition-transform dark:text-gray-400 ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* User Dropdown Menu */}
                    {userMenuOpen && (
                      <div className="absolute right-0 top-12 w-56 rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
                        {/* User Info */}
                        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${getRoleColor(user?.role || '')} text-sm font-bold text-white`}>
                              {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="truncate font-medium text-gray-900 dark:text-white">{user?.name}</div>
                              <div className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.email}</div>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="p-2">
                          <Link
                            href="/profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>My Profile</span>
                          </Link>

                          <Link
                            href="/settings"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Settings</span>
                          </Link>

                          <div className="my-2 border-t border-gray-200 dark:border-gray-700"></div>

                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              handleLogout();
                            }}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white bg-red-600 transition hover:bg-red-700 shadow-md hover:shadow-lg"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mobile Logout */}
                  <button
                    onClick={handleLogout}
                    className="rounded-lg bg-red-600 p-2 text-white transition hover:bg-red-700 sm:hidden"
                    title="Logout"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </div>
            </nav>

            {/* Mobile Search Overlay */}
            {searchOpen && (
              <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setSearchOpen(false)}>
                <div className="absolute left-0 right-0 top-16 mx-4 mt-4" onClick={(e) => e.stopPropagation()}>
                  <form onSubmit={handleSearch}>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        placeholder="Search exam papers, questions, courses..."
                        autoFocus
                        className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-12 pr-12 text-sm text-gray-900 placeholder-gray-500 shadow-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                      />
                      <svg
                        className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </form>

                  {/* Mobile Quick Links */}
                  <div className="mt-3 rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
                    <div className="p-3">
                      <p className="mb-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                        Quick Links
                      </p>
                      <div className="space-y-1">
                        <Link
                          href="/exam-papers"
                          onClick={() => {
                            setSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          <span>📄</span>
                          <span>All Exam Papers</span>
                        </Link>
                        <Link
                          href="/question-bank"
                          onClick={() => {
                            setSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          <span>❓</span>
                          <span>Question Bank</span>
                        </Link>
                        <Link
                          href="/courses"
                          onClick={() => {
                            setSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          <span>📚</span>
                          <span>Courses</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sidebar */}
            <aside
              className={`fixed left-0 top-16 z-20 h-[calc(100vh-4rem)] w-64 overflow-y-auto border-r border-gray-200 bg-white shadow-lg transition-transform duration-300 dark:border-gray-700 dark:bg-gray-800 ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
              }`}
            >
              {/* User Info - Mobile Only */}
              <div className="border-b border-gray-200 p-4 dark:border-gray-700 sm:hidden">
                <Link href="/profile" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${getRoleColor(user?.role || '')} text-lg font-bold text-white`}>
                    {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">{user?.name}</div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{getRoleIcon(user?.role || '')}</span>
                      <span className="capitalize">{user?.role.replace('_', ' ')}</span>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1 p-3">
                {mainNavLinks.map((link) => {
                  const isActive = isActiveLink(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className="text-xl">{link.title.split(' ')[0]}</span>
                      <span className="flex-1">{link.title.substring(link.title.indexOf(' ') + 1)}</span>
                      {isActive && (
                        <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Settings (Bottom) */}
              {settingsLink && (
                <div className="absolute bottom-0 w-full border-t border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                  <Link
                    href={settingsLink.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                      isActiveLink(settingsLink.href)
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-xl">{settingsLink.title.split(' ')[0]}</span>
                    <span className="flex-1">{settingsLink.title.substring(settingsLink.title.indexOf(' ') + 1)}</span>
                    {isActiveLink(settingsLink.href) && (
                      <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                    )}
                  </Link>
                </div>
              )}
            </aside>

            {/* Overlay for mobile */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 z-10 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* Main Content */}
            <main className="min-h-screen pt-16">
              <div className="p-6">{children}</div>
            </main>
          </div>
        )}
      </body>
    </html>
  );
}
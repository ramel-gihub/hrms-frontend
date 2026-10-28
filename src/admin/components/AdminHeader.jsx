import React, { useState, useRef, useEffect } from 'react';
import {
  MenuIcon,
  SearchIcon,
  MoonIcon,
  SunIcon,
  BellIcon,
  ChatIcon,
  ChevronDownIcon,
  UserCircleIcon,
  SettingsIcon,
  LogOutIcon
} from './Icons';

const API_URL = import.meta.env.VITE_API_URL || (
  ['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? 'http://localhost:5002'
    : 'https://hrms-backend-5xo8.onrender.com'
);

function timeAgo(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AdminHeader({
  sidebarOpen,
  setSidebarOpen,
  currentUser,
  handleLogout,
  onNavigate,
  isSuperAdmin = false,
  currentTenant = {}
}) {
  const [darkMode, setDarkMode] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  // Toggle dark class on root document
  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Fetch real notifications for admin
  const fetchNotifications = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch(`${API_URL}/api/notifications?userId=${encodeURIComponent(currentUser.id)}`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.notifications || []);
        setNotifications(list);
        setUnreadCount(list.filter(n => !n.is_read).length);
      }
    } catch (err) {
      console.error('Failed to fetch admin notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  const handleMarkAsRead = async (notifId, actionUrl, sourceType) => {
    try {
      await fetch(`${API_URL}/api/notifications/${encodeURIComponent(notifId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, is_read: true })
      });
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Navigate if applicable
      if (onNavigate) {
        if (actionUrl) {
          if (actionUrl.includes('leave')) onNavigate('leaves');
          else if (actionUrl.includes('request')) onNavigate('requests');
          else if (actionUrl.includes('asset')) onNavigate('assets');
          else if (actionUrl.includes('expense')) onNavigate('expenses');
        } else if (sourceType) {
          if (sourceType === 'leave') onNavigate('leaves');
          else if (sourceType === 'asset') onNavigate('assets');
          else if (sourceType === 'expense') onNavigate('expenses');
          else onNavigate('requests');
        }
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch(`${API_URL}/api/notifications/${encodeURIComponent(currentUser.id)}/read-all`, {
        method: 'PATCH'
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadNotifications = notifications.filter(n => !n.is_read);

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      {/* Left: Mobile Toggle & Search */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          aria-label="Toggle sidebar"
        >
          <MenuIcon className="w-6 h-6" />
        </button>

        <div className="relative hidden sm:block w-72 md:w-96">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
            <SearchIcon className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Type to search..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-12 text-sm text-gray-800 placeholder-gray-400 focus:border-[#3c50e0] focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-[#3c50e0]"
          />
          <kbd className="absolute inset-y-0 right-0 my-auto mr-3 flex h-5 items-center rounded border border-gray-200 bg-gray-100 px-1.5 text-[10px] font-medium text-gray-400 dark:border-gray-700 dark:bg-gray-700">
            ⌘K
          </kbd>
        </div>

        {!isSuperAdmin && currentTenant?.company_name && (
          <span className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-xs font-semibold border border-blue-200/50 dark:border-blue-800/50">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            {currentTenant.company_name}
          </span>
        )}
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Dark Mode Switcher */}
        <button
          onClick={toggleDarkMode}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? <SunIcon className="w-5 h-5 text-amber-400" /> : <MoonIcon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            title="Notifications"
          >
            <BellIcon className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-gray-900">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900 z-50 overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40">
                <div className="flex items-center gap-2">
                  <h5 className="text-sm font-bold text-gray-800 dark:text-white">Notifications</h5>
                  {unreadCount > 0 ? (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                      {unreadCount} New
                    </span>
                  ) : null}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs font-semibold text-[#3c50e0] hover:underline dark:text-blue-400"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                {unreadCount === 0 || unreadNotifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center text-xl font-bold">
                      ✓
                    </div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      No pending notifications
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      You're all caught up! New employee requests will appear here.
                    </p>
                  </div>
                ) : (
                  unreadNotifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleMarkAsRead(n.id, n.action_url, n.source_type)}
                      className="p-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/70 cursor-pointer transition-colors flex gap-3 items-start bg-blue-50/20 dark:bg-blue-950/10"
                    >
                      <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-sm">
                        {n.category === 'Leave Request' ? '🌴' : n.category === 'Asset Request' ? '💻' : n.category === 'Expenses & Claims' ? '💳' : '📋'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                            {n.title}
                          </p>
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-gray-400 mt-1 block">
                          {timeAgo(n.created_at)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-[#3c50e0] to-[#607afb] text-white font-bold text-sm shadow-sm">
              {(currentUser?.email || "A").charAt(0).toUpperCase()}
            </div>
            <div className="hidden text-left md:block">
              <span className="block text-sm font-semibold text-gray-800 dark:text-white leading-tight">
                {currentUser?.name || currentUser?.email?.split('@')[0] || "Admin User"}
              </span>
              <span className="block text-xs text-gray-400 capitalize">
                {currentUser?.role || "Super Admin"}
              </span>
            </div>
            <ChevronDownIcon className="w-4 h-4 text-gray-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-800 dark:bg-gray-900 z-50">
              <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                  {currentUser?.name || currentUser?.email?.split('@')[0] || "Admin"}
                </p>
                <p className="text-xs text-gray-400 truncate">{currentUser?.email}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => { setDropdownOpen(false); if (onNavigate) onNavigate("profile"); }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                >
                  <UserCircleIcon className="w-4 h-4 text-gray-400" />
                  My Profile
                </button>
                <button
                  onClick={() => { setDropdownOpen(false); if (onNavigate) onNavigate("settings"); }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                >
                  <SettingsIcon className="w-4 h-4 text-gray-400" />
                  Settings
                </button>
              </div>

              <div className="border-t border-gray-100 pt-1 dark:border-gray-800">
                <button
                  onClick={() => { setDropdownOpen(false); handleLogout(); }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                >
                  <LogOutIcon className="w-4 h-4" />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

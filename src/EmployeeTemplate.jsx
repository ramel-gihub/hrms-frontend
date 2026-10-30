import React, { useState, useEffect, useRef, useMemo } from "react";
import Chart from "react-apexcharts";
import EmployeeProfile from "./pages/EmployeeProfile";
import EmploymentDetails from "./pages/EmploymentDetails";
import Documents from "./pages/Documents";
import SkillsCertifications from "./pages/SkillsCertifications";
import Attendance from "./pages/Attendance";
import Leaves from "./pages/Leaves";
import Assets from "./pages/Assets";
import AccessAccounts from "./pages/AccessAccounts";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import ExitManagement from "./pages/ExitManagement";
import EmployeeRequests from "./pages/EmployeeRequests";
import Calendar from "./pages/Calendar";
import Expenses from "./pages/Expenses";
import MyTeam from "./pages/MyTeam";
import HRAssistant from "./components/HRAssistant";
import EmptyState from "./components/EmptyState";
import TeamChatModal from "./components/TeamChatModal";
import Announcements from "./pages/Announcements";

const SEARCH_DIRECTORY = [
  // Dashboard & Overview
  { id: "dashboard", label: "Employee Dashboard", category: "Dashboard", description: "Workspace overview, daily punch and workday progress", icon: "bi-grid", page: "index", keywords: ["dashboard", "home", "overview", "workday", "check in", "check out", "punch"] },

  // Leaves
  { id: "leaves-main", label: "Leaves & Time Off", category: "Leaves", description: "View leave balances, submit new requests, and history", icon: "bi-calendar-plus", page: "leaves", keywords: ["leave", "leaves", "time off", "vacation", "holiday", "absent"] },
  { id: "apply-leave", label: "Apply Leave", category: "Leaves", description: "Request annual, sick, or casual leave", icon: "bi-calendar-plus", page: "leaves", keywords: ["apply leave", "request leave", "vacation request", "sick leave", "annual leave", "casual leave"] },
  { id: "leave-history", label: "Leave History & Requests", category: "Leaves", description: "Track pending, approved, and rejected leave requests", icon: "bi-clock-history", page: "leaves", keywords: ["leave history", "past leaves", "leave status", "cancelled leaves"] },
  { id: "leave-policy", label: "Leave Policy", category: "Leaves", description: "View annual allowance, carry forward, and company guidelines", icon: "bi-file-text", page: "leaves", action: "open_policy", keywords: ["policy", "leave policy", "carry forward", "rules", "sick policy", "annual policy"] },

  // Attendance
  { id: "attendance-main", label: "Attendance & Log", category: "Attendance", description: "Check your daily punch records, hours, and logs", icon: "bi-calendar-check", page: "attendance", keywords: ["attendance", "punch", "punch in", "punch out", "checkin", "checkout", "hours", "timesheet"] },
  { id: "attendance-history", label: "Attendance History", category: "Attendance", description: "Monthly and weekly attendance logs and timings", icon: "bi-journal-check", page: "attendance", keywords: ["attendance history", "monthly log", "work hours", "overtime", "presence"] },

  // Employee Requests & WFH
  { id: "requests-main", label: "Employee Requests", category: "Requests", description: "Raise HR requests, track tickets, and inquiries", icon: "bi-send", page: "employee-requests", keywords: ["request", "requests", "helpdesk", "tickets", "hr request"] },
  { id: "wfh-request", label: "Work From Home (WFH)", category: "Requests", description: "Submit remote work / work from home requests", icon: "bi-house-door", page: "employee-requests", keywords: ["wfh", "work from home", "remote", "telecommute", "home work"] },
  { id: "contact-hr", label: "Contact HR / Help", category: "Requests", description: "Get in touch with HR department for assistance", icon: "bi-headset", page: "employee-requests", keywords: ["contact hr", "help", "support", "hr inquiry", "hr email"] },
  { id: "asset-request", label: "Request Equipment / Asset", category: "Requests", description: "Request laptops, monitors, accessories, or tokens", icon: "bi-laptop", page: "employee-requests", keywords: ["request asset", "request laptop", "equipment", "hardware", "mouse", "monitor"] },

  // Profile & Personal Information
  { id: "profile-main", label: "Employee Profile", category: "Profile", description: "View your full profile and job summary", icon: "bi-person-vcard", page: "employee-profile", keywords: ["profile", "my profile", "bio", "employee code", "designation", "avatar"] },
  { id: "commute-travel", label: "Commute & Travel", category: "Profile", description: "View daily commute details, travel records, and export", icon: "bi-bus-front", page: "employee-profile", keywords: ["commute", "travel", "transport", "vehicle", "bus", "train", "cab"] },
  { id: "personal-info", label: "Personal Information", category: "Profile", description: "Date of birth, nationality, marital status, gender", icon: "bi-person", page: "settings", keywords: ["personal info", "dob", "birth date", "gender", "marital status", "preferred name"] },
  { id: "contact-info", label: "Contact Information", category: "Profile", description: "Phone numbers, residential address, and email", icon: "bi-telephone", page: "settings", keywords: ["contact info", "phone", "mobile", "address", "city", "emergency phone"] },
  { id: "emergency-contact", label: "Emergency Contacts", category: "Profile", description: "Primary and secondary emergency contacts", icon: "bi-person-hearts", page: "settings", keywords: ["emergency", "emergency contact", "next of kin", "kin"] },
  { id: "bank-details", label: "Bank & Salary Details", category: "Profile", description: "Bank account number, IFSC code, and branch details", icon: "bi-bank", page: "settings", keywords: ["bank", "salary account", "ifsc", "account number", "payroll account"] },
  { id: "identity-info", label: "Identity & Tax Information", category: "Profile", description: "PAN card, Aadhaar, Passport, or government IDs", icon: "bi-fingerprint", page: "settings", keywords: ["identity", "pan", "aadhaar", "national id", "passport"] },

  // Employment Details
  { id: "employment-details", label: "Employment Details", category: "Employment", description: "Department, team, reporting manager, and joining date", icon: "bi-briefcase", page: "employement-details", keywords: ["employment details", "department", "team", "manager", "joining date", "work mode", "shift"] },

  // Documents
  { id: "documents-main", label: "My Documents", category: "Documents", description: "Browse, view, and download uploaded employee files", icon: "bi-folder2-open", page: "documents", keywords: ["documents", "files", "pdf", "uploads", "contracts"] },
  { id: "upload-document", label: "Upload New Document", category: "Documents", description: "Upload identity, academic, or employment documents", icon: "bi-cloud-arrow-up", page: "documents", keywords: ["upload document", "add document", "submit file", "id proof"] },

  // Skills & Certifications
  { id: "skills-main", label: "Skills & Certifications", category: "Skills", description: "View technical skills, proficiencies, and certificates", icon: "bi-award", page: "skills-certifications", keywords: ["skills", "certifications", "qualifications", "credentials", "badges"] },
  { id: "add-cert", label: "Add Certification", category: "Skills", description: "Register a new certificate with credential ID and expiry", icon: "bi-plus-circle", page: "skills-certifications", keywords: ["add certification", "new certificate", "add skill", "verify cert"] },

  // Assets
  { id: "assets-main", label: "My Assigned Assets", category: "Assets", description: "View company equipment, serial numbers, and status", icon: "bi-laptop", page: "assets", keywords: ["assets", "equipment", "hardware", "assigned devices", "laptop serial"] },

  // Calendar
  { id: "calendar-main", label: "Company Calendar & Holidays", category: "Calendar", description: "Upcoming public holidays, events, and company schedule", icon: "bi-calendar-date", page: "calendar", keywords: ["calendar", "holidays", "events", "public holidays", "festival days", "schedule"] },

  // Notifications
  { id: "notifications-main", label: "Notifications & Alerts", category: "System", description: "View announcements, approvals, and reminders", icon: "bi-bell", page: "notifications", keywords: ["notifications", "alerts", "messages", "reminders", "inbox"] },

  // Settings & Security
  { id: "settings-main", label: "Account Settings", category: "Settings", description: "Manage application preferences, password, and security", icon: "bi-gear", page: "settings", keywords: ["settings", "preferences", "account"] },
  { id: "account-security", label: "Account & Security", category: "Settings", description: "Change password, setup security questions, session management", icon: "bi-shield-lock", page: "settings", keywords: ["security", "password", "change password", "security questions", "authentication"] },
  { id: "preferences", label: "Display & Notifications Preferences", category: "Settings", description: "Email notifications, language, theme preferences", icon: "bi-sliders", page: "settings", keywords: ["preferences", "theme", "notification settings", "email alerts"] },

  // Exit Management
  { id: "exit-main", label: "Resignation & Exit Management", category: "Exit", description: "Submit resignation, handover tasks, and exit clearance", icon: "bi-box-arrow-right", page: "exit-management", keywords: ["exit", "resignation", "resign", "notice period", "clearance", "offboarding"] },

  // Accounts
  { id: "accounts-main", label: "Access & Accounts", category: "Accounts", description: "Work email, SSO credentials, and system access", icon: "bi-shield-lock", page: "access-accounts", keywords: ["accounts", "access", "login", "credentials", "sso"] },

  // HR Announcements
  { id: "announcements-main", label: "HR Announcements", category: "HR Management", description: "Create and broadcast company, project, or employee announcements", icon: "bi-megaphone", page: "announcements", keywords: ["announcement", "announcements", "broadcast", "news", "notice", "hr"] }
];

const SHORTCUT_CONFIG = {
  "dashboard": { id: "dashboard", label: "Employee Dashboard", description: "Your workspace overview", icon: "bi-grid", color: "blue", page: "index" },
  "apply-leave": { id: "apply-leave", label: "Apply Leave", description: "Request time off", icon: "bi-calendar-plus", color: "purple", page: "leaves" },
  "attendance": { id: "attendance", label: "Attendance", description: "View attendance", icon: "bi-calendar-check", color: "blue", page: "attendance" },
  // "my-team": { id: "my-team", label: "My Team", description: "View your project team", icon: "bi-people-fill", color: "blue", page: "my-team" },
  // "expenses": { id: "expenses", label: "Expenses & Claims", description: "Submit & track claims", icon: "bi-wallet2", color: "orange", page: "expenses" },
  "new-request": { id: "new-request", label: "New Request", description: "Contact HR / Admin", icon: "bi-send", color: "orange", page: "employee-requests" },
  "documents": { id: "documents", label: "Documents", description: "My documents", icon: "bi-folder2-open", color: "green", page: "documents" },
  "employment-details": { id: "employment-details", label: "Employment Details", description: "View your job information", icon: "bi-briefcase", color: "orange", page: "employement-details" },
  "skills-certifications": { id: "skills-certifications", label: "Skills & Certifications", description: "Manage your qualifications", icon: "bi-award", color: "green", page: "skills-certifications" },
  "assets": { id: "assets", label: "My Assets", description: "Assigned equipment", icon: "bi-laptop", color: "pink", page: "assets" },
  "profile": { id: "profile", label: "My Profile", description: "View profile", icon: "bi-person", color: "dark", page: "employee-profile" },
  "calendar": { id: "calendar", label: "Calendar", description: "View company events", icon: "bi-calendar-date", color: "blue", page: "calendar" },
  "notifications": { id: "notifications", label: "Notifications", description: "View your updates", icon: "bi-bell", color: "pink", page: "notifications" },
  "settings": { id: "settings", label: "Settings", description: "Manage your preferences", icon: "bi-gear", color: "dark", page: "settings" },
  "exit-management": { id: "exit-management", label: "Resignation & Exit", description: "View exit information", icon: "bi-box-arrow-right", color: "orange", page: "exit-management" },
  "access-accounts": { id: "access-accounts", label: "Access & Accounts", description: "View accounts", icon: "bi-shield-lock", color: "blue", page: "access-accounts" }
};

export default function EmployeeTemplate({
  currentUser, handleLogout,
  attendanceStatus, checkInTime, checkOutTime, workingTime,
  attendanceLoading, handleCheckIn, handleCheckOut, fetchAttendance, employeeProfile, fetchEmployeeProfile, attendanceStats, fetchAttendanceStats,
  attendanceLocation, attendanceArea, attendanceCity, attendanceState, attendanceDevice, setAttendanceDevice, todayAttendance
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dashboardNotifications, setDashboardNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [dynamicPolicies, setDynamicPolicies] = useState([]);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState("");
  const [showCheckOutConfirm, setShowCheckOutConfirm] = useState(false);
  const [toastNotification, setToastNotification] = useState(null);

  useEffect(() => {
    if (!toastNotification) return;
    const timer = setTimeout(() => {
      setToastNotification(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toastNotification]);

  const handleCheckInWithToast = async () => {
    try {
      const ok = await handleCheckIn();
      if (ok !== false) {
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setToastNotification({
          type: "success",
          title: "Checked In Successfully",
          message: `Welcome! Your check-in at ${nowStr} has been confirmed.`,
          icon: "bi-box-arrow-in-right"
        });
      }
    } catch (_) {}
  };

  const handleConfirmCheckOut = async () => {
    setShowCheckOutConfirm(false);
    try {
      const ok = await handleCheckOut();
      if (ok !== false) {
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setToastNotification({
          type: "success",
          title: "Checked Out Successfully",
          message: `Your check-out punch at ${nowStr} has been recorded.`,
          icon: "bi-box-arrow-right"
        });
      }
    } catch (_) {}
  };

  const formatDays = (val, fallback = 0) => {
    if (val === undefined || val === null || val === '') return fallback;
    const num = Number(val);
    if (isNaN(num)) return val;
    return num % 1 === 0 ? String(Math.round(num)) : String(parseFloat(num.toFixed(2)));
  };
  const [pushToast, setPushToast] = useState(null);
  const [headerNotifOpen, setHeaderNotifOpen] = useState(false);
  const headerNotifRef = useRef(null);
  const seenNotifIdsRef = useRef(new Set());
  const initialLoadDoneRef = useRef(false);

  const handleMarkAsRead = async (notifId, e) => {
    if (e) e.stopPropagation();
    try {
      await fetch(`${API_BASE}/api/notifications/${encodeURIComponent(notifId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser?.id, is_read: true })
      });
      setDashboardNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
      setUnreadNotificationCount(prev => Math.max(0, prev - 1));
      if (pushToast?.id === notifId) {
        setPushToast(null);
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch(`${API_BASE}/api/notifications/${encodeURIComponent(currentUser?.id)}/read-all`, {
        method: "PATCH"
      });
      setDashboardNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadNotificationCount(0);
      setPushToast(null);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  useEffect(() => {
    if (!currentUser?.id) return;
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/notifications?userId=${encodeURIComponent(currentUser.id)}`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.notifications || [];
          setDashboardNotifications(list);
          const unreadList = list.filter(n => !n.is_read);
          setUnreadNotificationCount(unreadList.length);

          if (!initialLoadDoneRef.current) {
            list.forEach(n => seenNotifIdsRef.current.add(n.id));
            initialLoadDoneRef.current = true;
            // Check if there is an unread approval notification to show immediately
            const latestApproved = unreadList.find(n => 
              n.title?.toLowerCase().includes("approved") || n.message?.toLowerCase().includes("approved")
            );
            if (latestApproved) {
              setPushToast(latestApproved);
            }
          } else {
            // Subsequent polls: check if newly arrived notification
            for (const n of unreadList) {
              if (!seenNotifIdsRef.current.has(n.id)) {
                seenNotifIdsRef.current.add(n.id);
                setPushToast(n);
                break;
              }
            }
          }
        }
      } catch (err) {
        console.error("Dashboard notification fetch error:", err);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  // Auto-dismiss push toast after 9 seconds
  useEffect(() => {
    if (!pushToast) return;
    const timer = setTimeout(() => {
      setPushToast(null);
    }, 9000);
    return () => clearTimeout(timer);
  }, [pushToast]);

  // Close header notification dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (headerNotifRef.current && !headerNotifRef.current.contains(event.target)) {
        setHeaderNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;
    const fetchPolicies = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/leaves/data/${currentUser.id}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.leaveTypes) && data.leaveTypes.length > 0) {
            setDynamicPolicies(data.leaveTypes);
          } else if (Array.isArray(data.balances) && data.balances.length > 0) {
            setDynamicPolicies(data.balances.map(b => ({ id: b.leave_type_id, name: b.leave_type_name, default_days: b.total_days })));
          }
        }
      } catch (e) {
        console.error("Error fetching policies:", e);
      }
    };
    fetchPolicies();
  }, [currentUser?.id]);

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return "";
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 172800) return "Yesterday";
    return `${Math.floor(diff / 86400)} days ago`;
  };
  const [activePage, setActivePage] = useState("index");
  const [calendarTab, setCalendarTab] = useState("calendar");
  const [statsPeriod, setStatsPeriod] = useState("week");
  const [leavesData, setLeavesData] = useState({ balances: [], requests: [] });
  const [assetRequests, setAssetRequests] = useState([]);
  const [attendanceCorrections, setAttendanceCorrections] = useState([]);
  const [employeeRequests, setEmployeeRequests] = useState([]);
  const [widgetsData, setWidgetsData] = useState({ nextHoliday: null, upcomingBirthday: null, upcomingAnniversary: null });
  const [todayWorkMode, setTodayWorkMode] = useState(employeeProfile?.work_mode || '');
  const [selectedShortcutIds, setSelectedShortcutIds] = useState([]);
  const [shortcutsLoading, setShortcutsLoading] = useState(true);
  const [sentWishes, setSentWishes] = useState({});
  const [sendingWishId, setSendingWishId] = useState(null);
  const [latestAnnouncement, setLatestAnnouncement] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL || "https://hrms-backend-5xo8.onrender.com";

  const isHR = useMemo(() => {
    const roleStr = (currentUser?.role || currentUser?.roleName || '').toLowerCase();
    const desigStr = (employeeProfile?.designation || '').toLowerCase();
    const deptStr = (employeeProfile?.department || '').toLowerCase();
    return roleStr.includes('hr') || desigStr.includes('hr') || deptStr.includes('human resources') || deptStr.includes('hr');
  }, [currentUser, employeeProfile]);

  useEffect(() => {
    const orgId = currentUser?.tenant?.id || employeeProfile?.organization_id || 1;
    const uid = currentUser?.id;
    const eid = employeeProfile?.id || employeeProfile?.employee_id;
    fetch(`${API_BASE}/api/announcements?orgId=${orgId}&userId=${uid || ''}&employeeId=${eid || ''}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.announcements) && data.announcements.length > 0) {
          setLatestAnnouncement(data.announcements[0]);
        } else {
          setLatestAnnouncement(null);
        }
      })
      .catch(() => setLatestAnnouncement(null));
  }, [currentUser?.id, employeeProfile?.id, employeeProfile?.employee_id]);

  const handleSendWish = async (celebration, type) => {
    if (!celebration || !currentUser?.id) return;
    const wishKey = `${type}-${celebration.id || celebration.userId || celebration.name}`;
    if (sentWishes[wishKey] || sendingWishId === wishKey) return;

    setSendingWishId(wishKey);
    try {
      const res = await fetch(`${API_BASE}/api/celebrations/send-wishes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderUserId: currentUser.id,
          recipientEmployeeId: celebration.employeeId || celebration.id,
          recipientUserId: celebration.userId,
          type
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSentWishes(prev => ({ ...prev, [wishKey]: true }));
        setPushToast({
          id: Date.now(),
          title: type === 'birthday' ? "🎂 Birthday Wishes Sent!" : "🌟 Work Anniversary Wishes Sent!",
          message: data.message || `Your wishes have been sent to ${celebration.name}!`,
          created_at: new Date().toISOString()
        });
      } else {
        alert(data.message || data.error || "Failed to send wishes");
      }
    } catch (err) {
      console.error("Error sending wish:", err);
      alert("Failed to send wishes. Please try again.");
    } finally {
      setSendingWishId(null);
    }
  };
  const rawAvatar = employeeProfile?.profile_pic || employeeProfile?.avatar_url || "";
  const dynamicAvatarUrl = rawAvatar
    ? (/^(https?:\/\/|data:|blob:)/i.test(rawAvatar) ? rawAvatar : `${API_BASE}/${rawAvatar.replace(/^\/+/, "")}`)
    : "";

  useEffect(() => {
    const handleProfilePicUpdate = () => {
      if (typeof fetchEmployeeProfile === "function") {
        fetchEmployeeProfile();
      }
    };
    window.addEventListener("profilePicUpdated", handleProfilePicUpdate);
    return () => window.removeEventListener("profilePicUpdated", handleProfilePicUpdate);
  }, [fetchEmployeeProfile]);

  // Fetch today's work mode directly from employee_attendance for this employee
  useEffect(() => {
    const targetId = currentUser?.id || employeeProfile?.employee_id;
    if (!targetId) return;
    fetch(`${API_BASE}/api/attendance/today/${targetId}`)
      .then(res => res.json())
      .then(data => {
        if (data?.today?.work_mode) {
          setTodayWorkMode(data.today.work_mode);
        }
      })
      .catch(() => {});
  }, [currentUser?.id, employeeProfile?.employee_id, todayAttendance]);

  // Page key to URL path mapping
  const pageToPath = {
    "index": "/",
    "employee-profile": "/employee-profile",
    "employement-details": "/employment-details",
    "my-team": "/my-team",
    "documents": "/documents",
    "skills-certifications": "/skills-certifications",
    "employee-requests": "/employee-requests",
    "attendance": "/attendance",
    "leaves": "/leave",
    "expenses": "/expenses",
    "assets": "/assets",
    "access-accounts": "/access-accounts",
    "calendar": "/calendar",
    "notifications": "/notifications",
    "settings": "/settings",
    "exit-management": "/exit-management",
  };

  // URL path back to page key mapping
  const pathToPage = {
    "/": "index",
    "/index": "index",
    "/employee-profile": "employee-profile",
    "/employment-details": "employement-details",
    "/employement-details": "employement-details",
    "/my-team": "my-team",
    "/documents": "documents",
    "/skills-certifications": "skills-certifications",
    "/employee-requests": "employee-requests",
    "/attendance": "attendance",
    "/leave": "leaves",
    "/leaves": "leaves",
    "/expenses": "expenses",
    "/assets": "assets",
    "/access-accounts": "access-accounts",
    "/calendar": "calendar",
    "/notifications": "notifications",
    "/settings": "settings",
    "/exit-management": "exit-management",
  };

  // Navigate helper: sets page, closes Bootstrap offcanvas + backdrop, updates URL
  const navigateTo = (page, tab) => {
    setActivePage(page);
    if (page === "calendar") {
      setCalendarTab(tab || "calendar");
    }
    setMenuOpen(false);
    const offcanvasEl = document.getElementById("mainMenu");
    if (offcanvasEl) {
      // Try Bootstrap API first
      if (window.bootstrap) {
        const instance = window.bootstrap.Offcanvas.getInstance(offcanvasEl);
        if (instance) instance.hide();
      }
      // Force-remove backdrop immediately after animation ends (Bootstrap sometimes leaves it)
      const cleanupBackdrop = () => {
        document.querySelectorAll(".offcanvas-backdrop").forEach(el => el.remove());
        document.body.classList.remove("modal-open");
        document.body.style.removeProperty("overflow");
        document.body.style.removeProperty("padding-right");
        offcanvasEl.classList.remove("show");
        offcanvasEl.style.removeProperty("visibility");
      };
      // Run immediately AND after animation (300ms) to cover both cases
      cleanupBackdrop();
      setTimeout(cleanupBackdrop, 320);
    }
    const path = pageToPath[page] || "/" + page;
    window.history.pushState({ page }, "", path);
  };

  // On mount: read URL to set initial page; handle back/forward
  useEffect(() => {
    const normalizePath = (raw) => {
      const p = (raw || "").replace(/\/+$/, "") || "/";
      return pathToPage[p] || pathToPage["/" + p.replace(/^\/+/, "")] || null;
    };
    const initialPage = normalizePath(window.location.pathname);
    if (initialPage) {
      setActivePage(initialPage);
    }
    const handlePopState = (e) => {
      const pg = normalizePath(window.location.pathname) || "index";
      setActivePage(pg);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);




    useEffect(() => {
        const uid = currentUser?.id || employeeProfile?.user_id || 1;
        fetch(`${API_BASE}/api/dashboard/widgets/${uid}`)
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) setWidgetsData(data);
            })
            .catch(console.error);
    }, [currentUser, employeeProfile]);

  useEffect(() => {
      if (currentUser?.id) {
          fetch(`${API_BASE}/api/leaves/data/${currentUser.id}`)
              .then(res => res.json())
              .then(data => setLeavesData(data || { balances: [], requests: [] }))
              .catch(err => console.error(err));

          fetch(`${API_BASE}/api/assets/requests/${currentUser.id}`)
              .then(res => res.json())
              .then(data => {
                  if (data && data.requests) setAssetRequests(data.requests);
              })
              .catch(console.error);

          fetch(`${API_BASE}/api/attendance/corrections/${currentUser.id}`)
              .then(res => res.json())
              .then(data => {
                  if (data && data.corrections) setAttendanceCorrections(data.corrections);
              })
              .catch(console.error);
          fetch(`${API_BASE}/api/employee-requests/${currentUser.id}`)
              .then(res => res.json())
              .then(data => {
                  if (data && data.requests) setEmployeeRequests(data.requests);
              })
              .catch(console.error);

          // Fetch dynamic shortcut selections for current employee
          setShortcutsLoading(true);
          fetch(`${API_BASE}/api/employee/shortcut-selections/${currentUser.id}`)
              .then(res => {
                  if (res.status === 404) {
                      const localSaved = localStorage.getItem(`shortcut_selections_${currentUser.id}`);
                      if (localSaved) {
                          try { setSelectedShortcutIds(JSON.parse(localSaved)); } catch { setSelectedShortcutIds([]); }
                      } else {
                          setSelectedShortcutIds([]);
                      }
                      return null;
                  }
                  return res.json();
              })
              .then(data => {
                  if (data && Array.isArray(data.shortcutIds)) {
                      setSelectedShortcutIds(data.shortcutIds);
                      localStorage.setItem(`shortcut_selections_${currentUser.id}`, JSON.stringify(data.shortcutIds));
                  }
              })
              .catch(() => {
                  const localSaved = localStorage.getItem(`shortcut_selections_${currentUser.id}`);
                  if (localSaved) {
                      try { setSelectedShortcutIds(JSON.parse(localSaved)); } catch { setSelectedShortcutIds([]); }
                  }
              })
              .finally(() => {
                  setShortcutsLoading(false);
              });
      }
  }, [currentUser]);

  // Listen for shortcut selection updates dispatched from Settings
  useEffect(() => {
      const handleShortcutUpdate = (event) => {
          if (event.detail && Array.isArray(event.detail.shortcutIds)) {
              if (!event.detail.userId || event.detail.userId === currentUser?.id) {
                  setSelectedShortcutIds(event.detail.shortcutIds);
              }
          }
      };
      window.addEventListener('shortcutSelectionsUpdated', handleShortcutUpdate);
      return () => window.removeEventListener('shortcutSelectionsUpdated', handleShortcutUpdate);
  }, [currentUser?.id]);

  // DB-based project teams for employee
  const [myTeamData, setMyTeamData] = useState({ teams: [], currentEmployee: null });
  const [selectedDashboardProjectId, setSelectedDashboardProjectId] = useState('all');
  const [activeChatUser, setActiveChatUser] = useState(null);

  useEffect(() => {
    const uid = currentUser?.id || employeeProfile?.user_id;
    if (!uid) return;
    fetch(`${import.meta.env.VITE_API_URL || "https://hrms-backend-5xo8.onrender.com"}/api/employee/my-teams/${uid}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          setMyTeamData({
            teams: data.teams || [],
            currentEmployee: data.currentEmployee || null
          });
          if (data.teams && data.teams.length > 0) {
            setSelectedDashboardProjectId('all');
          }
        }
      })
      .catch(console.error);
  }, [currentUser?.id, employeeProfile?.user_id]);

  // Derive dashboard team members based on selected project or all assigned teams (or self if unmapped)
  const dashboardDisplayedMembers = useMemo(() => {
    const teams = myTeamData.teams || [];
    if (teams.length === 0) {
      // If not mapped to any team, show only that employee themselves
      const emp = myTeamData.currentEmployee || employeeProfile || currentUser;
      const empName = emp?.employee_name || emp?.full_name || (emp?.first_name ? `${emp.first_name} ${emp.last_name || ''}`.trim() : null) || emp?.name || 'You';
      return [{
        id: emp?.id || 1,
        full_name: empName,
        designation: emp?.designation || 'Team Member',
        status: 'Active',
        role_in_team: 'Member',
        is_current_user: true,
        project_badge: 'No Team Mapped'
      }];
    }

    // If a specific project is selected
    if (selectedDashboardProjectId !== 'all') {
      const selectedTeam = teams.find(t => String(t.id) === String(selectedDashboardProjectId));
      if (selectedTeam) {
        return (selectedTeam.members || []).map(m => ({
          id: m.employee_id,
          full_name: m.employee_name,
          designation: m.designation || 'Developer',
          status: 'Active',
          role_in_team: m.role_in_team,
          is_current_user: m.is_current_user,
          project_badge: selectedTeam.project_code || selectedTeam.project_name
        }));
      }
    }

    // 'all' projects selected: aggregate unique members across all teams
    const memberMap = new Map();
    teams.forEach(t => {
      (t.members || []).forEach(m => {
        if (!memberMap.has(m.employee_id)) {
          memberMap.set(m.employee_id, {
            id: m.employee_id,
            full_name: m.employee_name,
            designation: m.designation || 'Developer',
            status: 'Active',
            role_in_team: m.role_in_team,
            is_current_user: m.is_current_user,
            project_badge: t.project_code || t.project_name
          });
        }
      });
    });
    return Array.from(memberMap.values());
  }, [myTeamData, selectedDashboardProjectId, employeeProfile, currentUser]);

  const dashComputedBalances = (leavesData.balances || []).map(b => {
      const typeName = b.leave_type_name;
      const actualUsed = (leavesData.requests || [])
          .filter(r => r.leave_type === typeName && r.status === 'Approved')
          .reduce((sum, r) => sum + parseFloat(r.days_requested || 0), 0);
      const remaining = parseFloat(b.total_days || 0) - actualUsed;
      return { ...b, used_days: actualUsed, remaining_days: remaining };
  });

  const dashAnnual = dashComputedBalances.find(b => (b.leave_type_name || '').toLowerCase().includes('annual')) || {
      leave_type_name: 'Annual Leave', total_days: 18, used_days: 1, remaining_days: 17
  };
  const dashSick = dashComputedBalances.find(b => (b.leave_type_name || '').toLowerCase().includes('sick')) || {
      leave_type_name: 'Sick Leave', total_days: 10, used_days: 0, remaining_days: 10
  };

  const currentYear = new Date().getFullYear();
  const rawHolidays = (leavesData.holidays && leavesData.holidays.length > 0)
    ? leavesData.holidays
    : (widgetsData.allHolidays || []);

  // Show current year holidays count only
  const dashHolidaysList = rawHolidays.filter(h => {
    if (!h.holiday_date) return false;
    const dStr = typeof h.holiday_date === 'string' ? h.holiday_date.split('T')[0] : '';
    if (dStr) {
      return dStr.startsWith(`${currentYear}-`);
    }
    const d = new Date(h.holiday_date);
    return !isNaN(d.getTime()) && d.getFullYear() === currentYear;
  });

  const dashTotalHolidays = dashHolidaysList.length;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const dashPassedHolidays = dashHolidaysList.filter(h => {
    const d = new Date(h.holiday_date);
    d.setHours(0, 0, 0, 0);
    return d < now;
  });
  const dashUpcomingHolidays = dashHolidaysList.filter(h => {
    const d = new Date(h.holiday_date);
    d.setHours(0, 0, 0, 0);
    return d >= now;
  });

  const dashHolidaysCompleted = dashPassedHolidays.length;
  const dashHolidaysRemaining = dashUpcomingHolidays.length;

  const dashDisplayCards = [
      {
          id: 'annual',
          name: 'Annual Leave',
          used: dashAnnual.used_days,
          total: Number(dashAnnual.total_days) === Math.floor(dashAnnual.total_days) ? dashAnnual.total_days.toString().split(".")[0] : dashAnnual.total_days,
          remaining: String(Math.floor(dashAnnual.remaining_days)).padStart(2, '0'),
          percent: Math.round((parseFloat(dashAnnual.used_days) / (parseFloat(dashAnnual.total_days) || 1)) * 100),
          dotClass: 'ed-dot-purple'
      },
      {
          id: 'sick',
          name: 'Sick Leave',
          used: dashSick.used_days,
          total: Number(dashSick.total_days) === Math.floor(dashSick.total_days) ? dashSick.total_days.toString().split(".")[0] : dashSick.total_days,
          remaining: String(Math.floor(dashSick.remaining_days)).padStart(2, '0'),
          percent: Math.round((parseFloat(dashSick.used_days) / (parseFloat(dashSick.total_days) || 1)) * 100),
          dotClass: 'ed-dot-blue'
      },
      {
          id: 'holiday',
          name: 'Public Holidays',
          used: dashHolidaysCompleted,
          total: dashTotalHolidays,
          remaining: String(dashHolidaysRemaining).padStart(2, '0'),
          percent: dashTotalHolidays > 0 ? Math.round((dashHolidaysCompleted / dashTotalHolidays) * 100) : 0,
          dotClass: 'ed-dot-orange'
      }
  ];

  const today = new Date();
  today.setHours(0,0,0,0);
  const pad2 = n => String(n).padStart(2, '0');
  const todayStr = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;

  const getCleanDate = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val.split('T')[0];
    const d = new Date(val);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  };

  const dashUpcomingLeave = (leavesData.requests || [])
      .filter(r => {
        if (r.status !== 'Pending' && r.status !== 'Approved') return false;
        const sDate = getCleanDate(r.start_date);
        return sDate && sDate >= todayStr;
      })
      .sort((a, b) => getCleanDate(a.start_date).localeCompare(getCleanDate(b.start_date)))[0] || null;

  // Dynamic Recent Requests for Dashboard strictly using employee_requests (Top 3)
  const recentDashboardRequests = (employeeRequests || []).slice(0, 3).map((req) => {
    let icon = "bi bi-chat-left-text";
    let iconBg = "ed-request-purple";
    let displayTitle = req.category || "Request";
    let displaySubtitle = "";

    const codeStr = req.request_code || (`REQ-${String(req.id).padStart(5, '0')}`);
    const reqDate = req.created_at ? new Date(req.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "";

    if (req.category === "Leave Request") {
      icon = "bi bi-calendar2-check";
      iconBg = "ed-request-purple";
      displayTitle = "Leave Request";
      if (req.start_date) {
        const sDate = new Date(req.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        const eDate = req.end_date ? new Date(req.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : sDate;
        displaySubtitle = `${codeStr} · ${sDate}${sDate !== eDate ? ' - ' + eDate : ''}`;
      } else {
        displaySubtitle = `${codeStr} · ${reqDate}`;
      }
    } else if (req.category === "Asset Request") {
      icon = "bi bi-laptop";
      iconBg = "ed-request-orange";
      const aType = req.asset_type ? req.asset_type.charAt(0).toUpperCase() + req.asset_type.slice(1) : (req.preferred_model || req.subject || "Hardware");
      displayTitle = `Asset Request (${aType})`;
      displaySubtitle = `${codeStr} · ${reqDate}`;
    } else if (req.category === "Attendance Correction") {
      icon = "bi bi-clock-history";
      iconBg = "ed-request-blue";
      displayTitle = "Attendance Correction";
      displaySubtitle = `${codeStr} · ${reqDate}`;
    } else {
      displaySubtitle = `${codeStr} · ${reqDate}`;
    }

    const st = (req.status || 'Pending').trim();
    let statusClass = "ed-request-pending";
    if (st.toLowerCase() === 'approved') statusClass = "ed-request-approved";
    else if (st.toLowerCase() === 'rejected') statusClass = "ed-request-rejected";
    else if (st.toLowerCase() === 'in progress' || st.toLowerCase() === 'in review') statusClass = "ed-request-progress";

    return {
      id: req.id,
      title: displayTitle,
      subtitle: displaySubtitle,
      status: st,
      statusClass,
      icon,
      iconBg
    };
  });

  const finalHolidays = widgetsData.allHolidays || [];

  const dashNextHoliday = useMemo(() => {
    if (widgetsData?.nextHoliday) return widgetsData.nextHoliday;
    const upcoming = finalHolidays.filter(h => {
      if (!h.holiday_date) return false;
      const dStr = typeof h.holiday_date === 'string' ? h.holiday_date.split('T')[0] : '';
      const d = dStr ? new Date(`${dStr}T00:00:00`) : new Date(h.holiday_date);
      d.setHours(0,0,0,0);
      return d >= today;
    }).sort((a, b) => new Date(a.holiday_date) - new Date(b.holiday_date));
    return upcoming[0] || finalHolidays[0] || null;
  }, [widgetsData, finalHolidays, today]);

  const activeBirthday = useMemo(() => {
    if (widgetsData?.upcomingBirthday) return widgetsData.upcomingBirthday;
    const users = widgetsData?.allCelebrationUsers || [];
    const curMonth = today.getMonth();
    const curYear = today.getFullYear();
    const thisMonthUsers = users.filter(u => {
      if (!u.dob) return false;
      const str = String(u.dob).slice(5, 7);
      return parseInt(str, 10) - 1 === curMonth;
    });
    if (thisMonthUsers.length > 0) {
      const u = thisMonthUsers[0];
      const day = parseInt(String(u.dob).slice(8, 10), 10) || 1;
      const bdayDate = new Date(curYear, curMonth, day);
      return {
        id: u.id,
        employeeId: u.employeeId || u.id,
        userId: u.userId || u.user_id,
        name: u.name,
        profilePic: u.profilePic || u.profile_pic,
        date: bdayDate,
        type: 'Birthday',
        daysUntil: Math.ceil((bdayDate - today) / (1000 * 60 * 60 * 24))
      };
    }
    return null;
  }, [widgetsData, today]);

  const activeAnniversary = useMemo(() => {
    if (widgetsData?.upcomingAnniversary) return widgetsData.upcomingAnniversary;
    const users = widgetsData?.allCelebrationUsers || [];
    const curMonth = today.getMonth();
    const curYear = today.getFullYear();
    const thisMonthUsers = users.filter(u => {
      if (!u.doj) return false;
      const str = String(u.doj).slice(5, 7);
      return parseInt(str, 10) - 1 === curMonth;
    });
    if (thisMonthUsers.length > 0) {
      const u = thisMonthUsers[0];
      const day = parseInt(String(u.doj).slice(8, 10), 10) || 1;
      const joinYear = parseInt(String(u.doj).slice(0, 4), 10) || curYear;
      const annivDate = new Date(curYear, curMonth, day);
      const yrs = curYear - joinYear;
      return {
        id: u.id,
        employeeId: u.employeeId || u.id,
        userId: u.userId || u.user_id,
        name: u.name,
        profilePic: u.profilePic || u.profile_pic,
        date: annivDate,
        type: 'Anniversary',
        years: yrs > 0 ? yrs : 1,
        daysUntil: Math.ceil((annivDate - today) / (1000 * 60 * 60 * 24))
      };
    }
    return null;
  }, [widgetsData, today]);


  const chartOptions = {
      chart: { type: "area", height: 255, toolbar: { show: false }, zoom: { enabled: false } },
      dataLabels: { enabled: false },
      markers: { size: 5, colors: ["#fff"], strokeColors: "#1E90FF", strokeWidth: 2, hover: { size: 7 } },
      stroke: { curve: "smooth", width: 3 },
      fill: {
          type: "gradient",
          gradient: { shadeIntensity: 1, opacityFrom: 0.2, opacityTo: 0.05, stops: [0, 90, 100] }
      },
      xaxis: {
          categories: attendanceStats?.chartCategories || [],
          labels: { style: { colors: "#8a90a2", fontSize: "12px", fontFamily: "inherit" } },
          axisBorder: { show: false },
          axisTicks: { show: false }
      },
      yaxis: {
          labels: {
              formatter: (value) => value + "h",
              style: { colors: "#8a90a2", fontSize: "12px", fontFamily: "inherit" }
          },
          min: 0,
          max: 10
      },
      grid: {
          borderColor: "#f1f3f5", strokeDashArray: 4,
          xaxis: { lines: { show: true } },
          yaxis: { lines: { show: true } },
          padding: { top: 0, right: 0, bottom: 0, left: 10 }
      },
      colors: ["#1E90FF"], // theme green
      tooltip: {
          theme: "light",
          y: { formatter: (value) => value + " Hours" }
      }
  };

  // Resolve dynamic work mode and location:
  // If location matches Chennai office address -> 'Chennai' & 'Office'
  // Any other location -> detected city & 'Remote'
  const isOfficeLoc = (loc) => {
    const l = (loc || '').toLowerCase().trim();
    return l.includes('aminjikarai') || l.includes('ayyavoo') || l.includes('sridharan') || l.includes('600030') || l.includes('chennai');
  };

  const handleRenameDevice = () => {
    const current = (todayAttendance?.check_in_device && todayAttendance.check_in_device !== 'MSI Thin 15 (Dev)')
      ? todayAttendance.check_in_device
      : ((attendanceDevice && attendanceDevice !== 'MSI Thin 15 (Dev)')
          ? attendanceDevice
          : 'My Device');
    const updated = window.prompt('Rename Device (e.g. Work PC, Office Laptop):', current);
    if (updated && updated.trim()) {
      localStorage.setItem('hrms_device_name', updated.trim());
      if (typeof setAttendanceDevice === 'function') {
        setAttendanceDevice(updated.trim());
      }
    }
  };

  const fullLocationStr = attendanceLocation || todayAttendance?.check_in_location || employeeProfile?.city || 'Nagpur, Maharashtra';
  const isOffice = isOfficeLoc(fullLocationStr);
  const effectiveWorkMode = todayAttendance?.work_mode || todayWorkMode || (isOffice ? 'Office' : 'Remote');
  const locParts = (fullLocationStr || '').split(',').map(s => s.trim()).filter(Boolean);
  const effectiveArea = todayAttendance?.check_in_area || attendanceArea || locParts[0] || '';
  const effectiveCity = todayAttendance?.check_in_city || attendanceCity || (locParts.length > 1 ? locParts[1] : employeeProfile?.city || 'Nagpur');
  const effectiveState = todayAttendance?.check_in_state || attendanceState || (isOffice ? 'Tamil Nadu' : 'Maharashtra');
  const effectiveLocationLabel = isOffice 
    ? 'Chennai' 
    : (effectiveArea && effectiveCity && effectiveArea.toLowerCase() !== effectiveCity.toLowerCase()
        ? `${effectiveArea}, ${effectiveCity}`
        : (effectiveArea || effectiveCity || 'Nagpur'));
  const savedDev = (() => {
    try {
      const s = localStorage.getItem('hrms_device_name');
      return (s && s.trim() !== 'MSI Thin 15 (Dev)' && s.trim() !== 'MSI Thin 15') ? s.trim() : null;
    } catch (_) { return null; }
  })();
  const effectiveDevice = (todayAttendance?.check_in_device && todayAttendance.check_in_device !== 'MSI Thin 15 (Dev)')
    ? todayAttendance.check_in_device
    : ((attendanceDevice && attendanceDevice !== 'MSI Thin 15 (Dev)')
        ? attendanceDevice
        : (savedDev || 'Windows PC'));

  return (
    <div onClick={() => setMenuOpen(false)}>


    
    <div className="offcanvas offcanvas-start custom-offcanvas" tabIndex="-1" id="mainMenu">
        <div className="offcanvas-header">
            <div className="menu-brand">
                <div className="menu-brand-icon">
                    <i className="bi bi-grid-1x2-fill"></i>
                </div>
                <div>
                    <h5>Ramel | HR</h5>
                    <span>Employee Workspace</span>
                </div>
            </div>
            <button type="button" className="btn-close" data-bs-dismiss="offcanvas"></button>
        </div>
        <div className="offcanvas-body p-0" style={{ overflowY: "auto", overflowX: "hidden", height: "calc(100vh - 100px)", paddingBottom: "100px" }}>
            <div className="menu-nav" style={{paddingBottom: "3rem"}}>
                  
                  <span className="menu-label" style={{ fontSize: '11px', fontWeight: 700, color: '#8a90a2', marginLeft: '22px', marginBottom: '8px', display: 'block', marginTop: '16px', letterSpacing: '0.5px' }}>OVERVIEW</span>
                  <span onClick={() => navigateTo("index")} className={`menu-item${activePage === "index" ? " active" : ""}`} style={{cursor:"pointer"}}>
                      <i className="bi bi-grid"></i>
                      <span>Employee Dashboard</span>
                  </span>

                  <span className="menu-label" style={{ fontSize: '11px', fontWeight: 700, color: '#8a90a2', marginLeft: '22px', marginBottom: '8px', display: 'block', marginTop: '24px', letterSpacing: '0.5px' }}>EMPLOYEE INFORMATION</span>
                  <span onClick={() => navigateTo("employee-profile")} className={`menu-item${activePage === "employee-profile" ? " active" : ""}`} style={{cursor:"pointer"}}>
                      <i className="bi bi-person-vcard"></i>
                      <span>Employee Profile</span>
                  </span>
                  <span onClick={() => navigateTo("employement-details")} className={`menu-item${activePage === "employement-details" ? " active" : ""}`} style={{cursor:"pointer"}}>
                      <i className="bi bi-briefcase"></i>
                      <span>Employment Details</span>
                  </span>
                  {/* <span onClick={() => navigateTo("my-team")} className={`menu-item${activePage === "my-team" ? " active" : ""}`} style={{cursor:"pointer"}}>
                      <i className="bi bi-people-fill"></i>
                      <span>My Team</span>
                  </span> */}
                  <span onClick={() => navigateTo("documents")} className={`menu-item${activePage === "documents" ? " active" : ""}`} style={{cursor:"pointer"}}>
                      <i className="bi bi-folder2-open"></i>
                      <span>Documents</span>
                  </span>
                  <span onClick={() => navigateTo("skills-certifications")} className={`menu-item${activePage === "skills-certifications" ? " active" : ""}`} style={{cursor:"pointer"}}>
                      <i className="bi bi-award"></i>
                      <span>Skills & Certifications</span>
                  </span>
                  <span onClick={() => navigateTo("employee-requests")} className={`menu-item${activePage === "employee-requests" ? " active" : ""}`} style={{cursor:"pointer"}}>
                      <i className="bi bi-chat-text"></i>
                      <span>Employee Requests</span>
                  </span>

                  <span className="menu-label" style={{ fontSize: '11px', fontWeight: 700, color: '#8a90a2', marginLeft: '22px', marginBottom: '8px', display: 'block', marginTop: '24px', letterSpacing: '0.5px' }}>ATTENDANCE & LEAVE</span>
                  <span onClick={() => navigateTo("attendance")} className={`menu-item${activePage === "attendance" ? " active" : ""}`} style={{cursor:"pointer"}}>
                      <i className="bi bi-clock-history"></i>
                      <span>Attendance</span>
                  </span>
                  <span onClick={() => navigateTo("leaves")} className={`menu-item${activePage === "leaves" ? " active" : ""}`} style={{cursor:"pointer"}}>
                      <i className="bi bi-calendar2-minus"></i>
                      <span>Leave</span>
                  </span>

                  {/*
                  <span className="menu-label" style={{ fontSize: '11px', fontWeight: 700, color: '#8a90a2', marginLeft: '22px', marginBottom: '8px', display: 'block', marginTop: '24px', letterSpacing: '0.5px' }}>FINANCE & CLAIMS</span>
                  <span onClick={() => navigateTo("expenses")} className={`menu-item${activePage === "expenses" ? " active" : ""}`} style={{cursor:"pointer"}}>
                      <i className="bi bi-wallet2"></i>
                      <span>Expenses & Claims</span>
                  </span>
                  */}

                  <span className="menu-label" style={{ fontSize: '11px', fontWeight: 700, color: '#8a90a2', marginLeft: '22px', marginBottom: '8px', display: 'block', marginTop: '24px', letterSpacing: '0.5px' }}>COMPANY RESOURCES</span>
                  <span onClick={() => navigateTo("assets")} className={`menu-item${activePage === "assets" ? " active" : ""}`} style={{cursor:"pointer"}}>
                      <i className="bi bi-laptop"></i>
                      <span>Assets</span>
                  </span>
                  {/*
                  <span onClick={() => navigateTo("access-accounts")} className={`menu-item${activePage === "access-accounts" ? " active" : ""}`} style={{cursor:"pointer"}}>
                      <i className="bi bi-shield-lock"></i>
                      <span>Access & Accounts</span>
                  </span>
                  */}

                  <span className="menu-label" style={{ fontSize: '11px', fontWeight: 700, color: '#8a90a2', marginLeft: '22px', marginBottom: '8px', display: 'block', marginTop: '24px', letterSpacing: '0.5px' }}>COMMUNICATION</span>
                  {isHR && (
                    <span onClick={() => navigateTo("announcements")} className={`menu-item${activePage === "announcements" ? " active" : ""}`} style={{cursor:"pointer"}}>
                        <i className="bi bi-megaphone-fill text-primary"></i>
                        <span>Announcements</span>
                        <span className="badge bg-primary text-white rounded-pill px-2 py-0 ms-auto" style={{ fontSize: '10px' }}>HR</span>
                    </span>
                  )}
                  <span onClick={() => navigateTo("calendar")} className={`menu-item${activePage === "calendar" ? " active" : ""}`} style={{cursor:"pointer"}}>
                      <i className="bi bi-calendar-date"></i>
                      <span>Calendar</span>
                  </span>
                  <span onClick={() => navigateTo("notifications")} className={`menu-item${activePage === "notifications" ? " active" : ""}`} style={{cursor:"pointer"}}>
                      <i className="bi bi-bell"></i>
                      <span>Notifications</span>
                  </span>
                  <span onClick={() => navigateTo("settings")} className={`menu-item${activePage === "settings" ? " active" : ""}`} style={{cursor:"pointer"}}>
                      <i className="bi bi-gear"></i>
                      <span>Settings</span>
                  </span>

                  <span className="menu-label" style={{ fontSize: '11px', fontWeight: 700, color: '#8a90a2', marginLeft: '22px', marginBottom: '8px', display: 'block', marginTop: '24px', letterSpacing: '0.5px' }}>EMPLOYEE EXIT</span>
                  <span onClick={() => navigateTo("exit-management")} className={`menu-item${activePage === "exit-management" ? " active" : ""}`} style={{cursor:"pointer"}}>
                      <i className="bi bi-box-arrow-right"></i>
                      <span>Resignation & Exit</span>
                  </span>


                  <span className="menu-label" style={{ fontSize: '11px', fontWeight: 700, color: '#8a90a2', marginLeft: '22px', marginBottom: '8px', display: 'block', marginTop: '24px', letterSpacing: '0.5px' }}>ACCOUNT</span>
                  <a href="#!" className="menu-item text-danger" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                      <i className="bi bi-box-arrow-left"></i>
                      <span>Logout</span>
                  </a>
              </div>
        </div>
    </div>

    
    {/* Commented out Question Mark (?) Orbit Menu & Radial Nav as requested
    <button className={`orbit-menu pulse ${menuOpen ? "open" : ""}`} id="menuToggle" aria-label="Quick navigation" onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}>
        <span className="menu-icon">?</span>
    </button>

    <nav className={`radial-nav ${menuOpen ? "open" : ""}`} id="radialNav" onClick={(e) => e.stopPropagation()}>
        <a href="#" className="active">
            <i className="bi bi-grid-1x2-fill"></i>
            <span>Dashboard</span>
        </a>
        <a href="#">
            <i className="bi bi-people-fill"></i>
            <span>Employees</span>
        </a>
        <a href="#">
            <i className="bi bi-calendar2-check-fill"></i>
            <span>Attendance</span>
        </a>
        <a href="#">
            <i className="bi bi-wallet2"></i>
            <span>Payroll</span>
        </a>
        <a href="#">
            <i className="bi bi-bar-chart-fill"></i>
            <span>Reports</span>
        </a>
    </nav>
    */}

    
    <main className="dashboard-wrapper">
        <div className="dashboard-container">

            
            <header className="top-header">

                <div className="d-flex align-items-center justify-content-between">


                    <span onClick={() => navigateTo("index")} className="brand-logo" style={{cursor:"pointer"}}>

                        <div className="brand-icon">
                            <i className="bi bi-grid-1x2-fill"></i>
                        </div>

                        <div>
                            <h5>Ramel HR</h5>
                            <span>Employee Workspace</span>
                        </div>

                    </span>


                    <div className="d-flex align-items-center gap-3 header-actions">


                        <button className="header-action" id="headerSearchBtn" type="button" onClick={() => { setIsSearchOpen(true); setHeaderSearchQuery(""); }} title="Quick Search">
                            <i className="bi bi-search"></i>
                        </button>


                        <div className="position-relative" ref={headerNotifRef}>
                            <button 
                                className="header-action position-relative" 
                                onClick={() => setHeaderNotifOpen(!headerNotifOpen)}
                                title="Notifications"
                                type="button"
                            >
                                <i className="bi bi-bell"></i>
                                {unreadNotificationCount > 0 && (
                                    <span 
                                        className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                                        style={{ fontSize: "10px", padding: "3px 6px" }}
                                    >
                                        {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                                    </span>
                                )}
                            </button>

                            {headerNotifOpen && (
                                <div 
                                    className="position-absolute end-0 mt-2 card border-0 shadow-lg rounded-4 overflow-hidden"
                                    style={{ width: "360px", maxWidth: "90vw", zIndex: 1050 }}
                                >
                                    <div className="card-header bg-white border-bottom p-3 d-flex align-items-center justify-content-between">
                                        <div className="d-flex align-items-center gap-2">
                                            <h6 className="mb-0 fw-bold">Notifications</h6>
                                            {unreadNotificationCount > 0 && (
                                                <span className="badge bg-primary-subtle text-primary rounded-pill">
                                                    {unreadNotificationCount} New
                                                </span>
                                            )}
                                        </div>
                                        {unreadNotificationCount > 0 && (
                                            <button 
                                                type="button" 
                                                className="btn btn-link btn-sm p-0 text-decoration-none fw-semibold"
                                                style={{ fontSize: "12px" }}
                                                onClick={handleMarkAllAsRead}
                                            >
                                                Mark all as read
                                            </button>
                                        )}
                                    </div>

                                    <div className="card-body p-0" style={{ maxHeight: "360px", overflowY: "auto" }}>
                                        {unreadNotificationCount === 0 || dashboardNotifications.filter(n => !n.is_read).length === 0 ? (
                                            <div className="text-center py-5 px-3">
                                                <div 
                                                    className="rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center"
                                                    style={{ width: "48px", height: "48px", background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", fontSize: "20px" }}
                                                >
                                                    <i className="bi bi-check2-circle"></i>
                                                </div>
                                                <h6 className="fw-bold mb-1" style={{ fontSize: "14px" }}>No pending notifications</h6>
                                                <p className="text-muted mb-0" style={{ fontSize: "12px" }}>
                                                    You're all caught up! New alerts and updates will show up here.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="list-group list-group-flush">
                                                {dashboardNotifications.filter(n => !n.is_read).map((n) => (
                                                    <div 
                                                        key={n.id} 
                                                        className="list-group-item list-group-item-action p-3 border-bottom d-flex gap-3 align-items-start"
                                                        style={{ cursor: "pointer", background: "rgba(59, 130, 246, 0.04)" }}
                                                        onClick={(e) => {
                                                            handleMarkAsRead(n.id, e);
                                                            setHeaderNotifOpen(false);
                                                            navigateTo("notifications");
                                                        }}
                                                    >
                                                        <div 
                                                            className="rounded-3 d-flex align-items-center justify-content-center shrink-0 mt-1"
                                                            style={{ 
                                                                width: "36px", 
                                                                height: "36px", 
                                                                background: n.title?.toLowerCase().includes("approved") ? "rgba(16, 185, 129, 0.12)" : n.title?.toLowerCase().includes("rejected") ? "rgba(239, 68, 68, 0.12)" : "rgba(99, 102, 241, 0.12)",
                                                                color: n.title?.toLowerCase().includes("approved") ? "#10b981" : n.title?.toLowerCase().includes("rejected") ? "#ef4444" : "#6366f1",
                                                                fontSize: "16px"
                                                            }}
                                                        >
                                                            <i className={`bi ${n.title?.toLowerCase().includes("approved") ? "bi-check-circle" : n.title?.toLowerCase().includes("rejected") ? "bi-x-circle" : "bi-bell"}`}></i>
                                                        </div>
                                                        <div className="flex-grow-1 min-w-0">
                                                            <div className="d-flex align-items-center justify-content-between mb-1">
                                                                <strong className="text-truncate d-block" style={{ fontSize: "13px" }}>{n.title}</strong>
                                                                <span className="badge rounded-circle p-1 bg-primary" style={{ width: "6px", height: "6px" }}></span>
                                                            </div>
                                                            <p className="text-muted mb-1 text-truncate" style={{ fontSize: "12px" }}>{n.message}</p>
                                                            <div className="d-flex align-items-center justify-content-between">
                                                                <small className="text-muted" style={{ fontSize: "11px" }}>{formatTimeAgo(n.created_at)}</small>
                                                                <span 
                                                                    className="badge text-primary p-0 fw-normal" 
                                                                    style={{ fontSize: "11px", cursor: "pointer" }}
                                                                    onClick={(e) => handleMarkAsRead(n.id, e)}
                                                                >
                                                                    Mark read
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="card-footer bg-white border-top p-2 text-center">
                                        <button 
                                            type="button" 
                                            className="btn btn-link btn-sm text-decoration-none w-100 fw-semibold text-secondary"
                                            style={{ fontSize: "12px" }}
                                            onClick={() => {
                                                setHeaderNotifOpen(false);
                                                navigateTo("notifications");
                                            }}
                                        >
                                            View all notifications <i className="bi bi-arrow-right ms-1"></i>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>


                        <div className="dropdown">

                            <button className="profile-button" data-bs-toggle="dropdown">

                                <div className="profile-avatar overflow-hidden">
                                    {dynamicAvatarUrl ? (
                                        <img src={dynamicAvatarUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "14px" }} />
                                    ) : (
                                        (employeeProfile?.preferred_name
                                            ? employeeProfile.preferred_name.slice(0, 2)
                                            : employeeProfile?.first_name
                                                ? `${employeeProfile.first_name[0]}${employeeProfile.last_name ? employeeProfile.last_name[0] : (employeeProfile.first_name[1] || "")}`
                                                : currentUser.email.slice(0, 2)
                                        ).toUpperCase()
                                    )}
                                </div>

                                <div className="profile-info">

                                    <h6>{employeeProfile?.preferred_name || employeeProfile?.first_name || currentUser.email.split("@")[0]}</h6>

                                    <span className="text-nowrap">{employeeProfile?.designation || employeeProfile?.role_name || "Senior Software Engineer"}</span>

                                </div>

                                <i className="bi bi-chevron-down"></i>

                            </button>


                            <ul className="dropdown-menu dropdown-menu-end border-0 shadow rounded-4 p-2">

                                <li>
                                    <a className="dropdown-item rounded-3 py-2" href="#!" onClick={(e) => { e.preventDefault(); navigateTo("employee-profile"); }}>
                                        <i className="bi bi-person me-2"></i>
                                        My Profile
                                    </a>
                                </li>

                                <li>
                                    <a className="dropdown-item rounded-3 py-2" href="#!" onClick={(e) => { e.preventDefault(); navigateTo("settings"); }}>
                                        <i className="bi bi-gear me-2"></i>
                                        Settings
                                    </a>
                                </li>

                                <li>
                                    <hr className="dropdown-divider" />
                                </li>

                                <li>
                                    <a className="dropdown-item rounded-3 py-2 text-danger" href="#!" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                                        <i className="bi bi-box-arrow-right me-2"></i>
                                        Logout
                                    </a>
                                </li>

                            </ul>

                        </div>


                        <button className="header-action" data-bs-toggle="offcanvas" data-bs-target="#mainMenu">

                            <i className="bi bi-list"></i>

                        </button>

                    </div>

                </div>

            </header>

            
            {activePage === "index" && (
  <>
<div className="px-0 px-md-5 employee-dashboard">

                
                <section className="page-heading employee-page-heading">
                    <div className="row align-items-center g-3">

                        <div className="col-lg-8">
                            <div className="dashboard-title-wrap">

                                <div>
                                    <h2>Employee Dashboard</h2>

                                    <p>
                                        Monitor workforce activity, employee movements,
                                        requests and important HR events from one place.
                                    </p>
                                </div>

                            </div>
                        </div>

                        <div className="col-lg-4 text-lg-end">
                            <div className="dashboard-date">
                                <div className="dashboard-date-icon">
                                    <i className="bi bi-calendar3"></i>
                                </div>

                                <div>
                                    <span>Today</span>
                                    <strong id="dashboardDate">
                                        {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </strong>
                                </div>
                            </div>
                        </div>

                    </div>
                </section>

                <div className="employee-dashboard-page">

                    
                    <section className="ed-hero">
                        <div className="ed-hero-main">
                            <div className="ed-profile-avatar overflow-hidden">
                                {dynamicAvatarUrl ? (
                                    <img src={dynamicAvatarUrl} alt={employeeProfile?.preferred_name || employeeProfile?.first_name || "Employee"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                    <img src="https://i.pravatar.cc/150?img=12" alt={employeeProfile?.preferred_name || employeeProfile?.first_name || "Employee"} />
                                )}
                                <span className="ed-online-dot"></span>
                            </div>

                            <div className="ed-hero-content">
                                <span className="ed-eyebrow">
                                    <i className="bi bi-sun"></i>
                                    {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>

                                <h1>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {employeeProfile ? (employeeProfile.preferred_name || employeeProfile.first_name || currentUser.email.split("@")[0]) : currentUser.email.split("@")[0]}</h1>

                                <p>
                                    Here's your workspace overview for today.
                                    Stay productive and have a great day.
                                </p>

                                <div className="ed-employee-meta">
                                    <span>
                                        <i className="bi bi-person-badge"></i>
                                        {employeeProfile?.employee_code || "EMP-1360"}
                                    </span>

                                    <span>
                                        <i className="bi bi-briefcase"></i>
                                        {employeeProfile?.designation || "Senior Software Engineer"}
                                    </span>

                                    <span>
                                        <i className="bi bi-diagram-3"></i>
                                        {employeeProfile?.department ? `${employeeProfile.department}${employeeProfile.team ? ` · ${employeeProfile.team}` : " · Backend"}` : "Engineering · Backend"}
                                    </span>

                                    <span>
                                        <i className="bi bi-geo-alt"></i>
                                        {employeeProfile?.city || employeeProfile?.location || "Nagpur"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="es-profile-completion" style={{ cursor: "pointer" }} onClick={() => navigateTo("settings")} title="Click to complete your profile in Settings">
                            <div className="es-completion-top">
                                <span>Profile Completion</span>
                                <strong>{employeeProfile?.profile_completion_percentage ?? 0}%</strong>
                            </div>
                            <div className="progress es-progress">
                                <div className="progress-bar" style={{width: `${employeeProfile?.profile_completion_percentage ?? 0}%`}}></div>
                            </div>
                            <small>Complete your remaining profile details in Settings.</small>
                        </div>
                    </section>


                    
                    <section className="ed-section">

                        <div className="ed-section-heading">
                            <div>
                                <span className="ed-section-label">TODAY</span>
                                <h2>Workday Overview</h2>
                            </div>

                            <span className="ed-live-status">
                                <span></span>
                                Live attendance
                            </span>
                        </div>

                        <div className="row g-4">

                            
                            <div className="col-xl-5 col-lg-6">

                                <div className="ed-attendance-card">

                                    <div className="ed-attendance-top">
                                        <div>
                                            <span className="ed-card-kicker">TODAY'S ATTENDANCE</span>
                                            <h3 id="edAttendanceTitle">{attendanceStatus === "Checked In" ? "You're checked in" : attendanceStatus === "Checked Out" ? "You're checked out" : "Not checked in"}</h3>
                                        </div>

                                        <div className="ed-attendance-icon">
                                            <i className="bi bi-fingerprint"></i>
                                        </div>
                                    </div>

                                    <div className="ed-time-display">
                                        <div className="ed-clock">
                                            <span id="edCurrentTime">{checkInTime !== "--:--" ? checkInTime.split(" ")[0] : "--:--"}</span><small>{checkInTime !== "--:--" ? checkInTime.split(" ")[1] : ""}</small>
                                        </div>
                                        <div className="ed-work-location-badge" id="edWorkLocationBadge"
                                            data-work-location={effectiveWorkMode.toLowerCase()} aria-label={`${effectiveLocationLabel}, ${effectiveWorkMode}`}
                                            title={`Location: ${fullLocationStr} (${effectiveWorkMode})`}>
                                            <i className="bi bi-geo-alt-fill" aria-hidden="true"></i>
                                            <span id="edWorkLocationLabel">{effectiveLocationLabel}</span>
                                            <strong id="edWorkMode">{effectiveWorkMode}</strong>
                                        </div>
                                    </div>

                                    <div className="ed-attendance-date">
                                        {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </div>

                                    <div className="ed-attendance-progress">
                                        <div className="ed-progress-top">
                                            <span>Working time</span>
                                            <strong id="edWorkingTime">{workingTime}</strong>
                                        </div>

                                        <div className="ed-progress-track">
                                            <span id="edWorkProgress" style={{width: attendanceStatus === "Checked Out" ? "100%" : attendanceStatus === "Checked In" ? "50%" : "0%"}}></span>
                                        </div>

                                        <div className="ed-progress-bottom">
                                            <span>09:00 AM</span>
                                            <span>06:00 PM</span>
                                        </div>
                                    </div>

                                    <div className="ed-attendance-actions">
                                        <button 
                                            type="button" 
                                            className={`ed-checkin-btn ${attendanceStatus === 'Checked In' ? 'is-inactive' : 'is-active'}`} 
                                            id="edCheckInBtn" 
                                            onClick={handleCheckInWithToast} 
                                            disabled={attendanceLoading || attendanceStatus === "Checked In"}
                                        >
                                            <i className="bi bi-box-arrow-in-right"></i>
                                            {attendanceLoading && attendanceStatus !== "Checked In" ? "..." : "Check In"}
                                        </button>

                                        <button 
                                            type="button" 
                                            className={`ed-checkout-btn ${attendanceStatus === 'Checked In' ? 'is-active' : 'is-inactive'}`} 
                                            id="edCheckOutBtn" 
                                            onClick={() => setShowCheckOutConfirm(true)} 
                                            disabled={attendanceLoading || attendanceStatus !== "Checked In"}
                                        >
                                            <i className="bi bi-box-arrow-right"></i>
                                            {attendanceLoading && attendanceStatus === "Checked In" ? "..." : "Check Out"}
                                        </button>
                                    </div>

                                    <div className="ed-attendance-footer">

                                        <div>
                                            <span>Check In</span>
                                            <strong id="edCheckInTime">{checkInTime}</strong>
                                            {todayAttendance?.check_in_location && (
                                                <small className="d-block text-white-50 text-truncate mt-1" style={{ fontSize: '0.68rem', maxWidth: '110px' }} title={`Check-in Location: ${todayAttendance.check_in_location}`}>
                                                    <i className="bi bi-geo-alt me-1"></i>{todayAttendance.check_in_location.split(',')[0]}
                                                </small>
                                            )}
                                        </div>

                                        <div>
                                            <span>Check Out</span>
                                            <strong id="edCheckOutTime">{checkOutTime}</strong>
                                            {todayAttendance?.check_out_location && (
                                                <small className="d-block text-white-50 text-truncate mt-1" style={{ fontSize: '0.68rem', maxWidth: '110px' }} title={`Check-out Location: ${todayAttendance.check_out_location}`}>
                                                    <i className="bi bi-geo-alt me-1"></i>{todayAttendance.check_out_location.split(',')[0]}
                                                </small>
                                            )}
                                        </div>

                                        <div>
                                            <span>Break</span>
                                            <strong>1 hour</strong>
                                        </div>

                                    </div>

                                    {(attendanceDevice || attendanceLocation || todayAttendance?.check_in_device || todayAttendance?.check_in_location) && (
                                        <div className="ed-punch-device-badge mt-3 pt-2 border-top border-white border-opacity-10 d-flex align-items-center justify-content-between flex-wrap gap-2" style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                                            <div className="d-flex align-items-center gap-1" title="Click to rename device">
                                                <i className="bi bi-laptop text-info"></i>
                                                <span>Device: <strong style={{ cursor: 'pointer' }} onClick={handleRenameDevice}>{effectiveDevice}</strong></span>
                                                <button type="button" onClick={handleRenameDevice} className="btn btn-link p-0 text-white-50 ms-1" style={{ fontSize: '0.72rem', textDecoration: 'none' }} title="Rename this PC">
                                                    <i className="bi bi-pencil-square"></i>
                                                </button>
                                            </div>
                                            <div className="d-flex align-items-center gap-1" title={`Work Mode: ${effectiveWorkMode}`}>
                                                <i className={isOffice ? "bi bi-building text-success" : "bi bi-house-door text-warning"}></i>
                                                <span>Mode: <strong>{effectiveWorkMode}</strong></span>
                                            </div>
                                            {(todayAttendance?.check_in_location || attendanceLocation) && (
                                                <div className="d-flex align-items-center gap-1 text-truncate" style={{ maxWidth: '240px' }} title={`Dynamic Location: ${todayAttendance?.check_in_location || attendanceLocation} | Area: ${effectiveArea} | City: ${effectiveCity} | State: ${effectiveState}`}>
                                                    <i className="bi bi-geo-alt-fill text-danger"></i>
                                                    <span className="text-truncate">Location: <strong>{todayAttendance?.check_in_location || attendanceLocation}</strong></span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                  </div>
                              </div>
                              
                              <div className="col-xl-7 col-lg-6">

                                <div className="ed-work-stat-card">

                                    <div className="ed-card-header">
                                        <div>
                                            <span className="ed-card-kicker">MY WORKDAY</span>
                                            <h3>Today's summary</h3>
                                        </div>

                                        <select
                                            className="ed-period-select"
                                            value={statsPeriod}
                                            onChange={(e) => {
                                                const p = e.target.value;
                                                setStatsPeriod(p);
                                                fetchAttendanceStats(p);
                                            }}
                                        >
                                            <option value="week">This Week</option>
                                            <option value="month">This Month</option>
                                            <option value="last_month">Last Month</option>
                                        </select>
                                    </div>

                                    <div className="row g-3">

                                        {/* 1. Average Check-in */}
                                        <div className="col-md-6">
                                            <div className="ed-mini-stat">
                                                <div className="ed-mini-stat-icon ed-blue">
                                                    <i className="bi bi-clock-history"></i>
                                                </div>

                                                <div>
                                                    <span>Average Check-in</span>
                                                    <strong>{attendanceStats?.averageCheckIn || '--'}</strong>
                                                    <small>{attendanceStats?.todayCheckInDiff || 'Not checked in'}</small>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. Average Hours */}
                                        <div className="col-md-6">
                                            <div className="ed-mini-stat">
                                                <div className="ed-mini-stat-icon ed-purple">
                                                    <i className="bi bi-calendar2-week"></i>
                                                </div>

                                                <div>
                                                    <span>Average Hours</span>
                                                    <strong>{attendanceStats?.avgHoursDisplay || '0h 00m'}</strong>
                                                    <small>{attendanceStats?.periodLabel || (statsPeriod === 'month' ? 'This Month' : statsPeriod === 'last_month' ? 'Last Month' : 'This Week')}</small>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 3. On-Time */}
                                        <div className="col-md-6">
                                            <div className="ed-mini-stat">
                                                <div className="ed-mini-stat-icon ed-green">
                                                    <i className="bi bi-check-circle"></i>
                                                </div>

                                                <div>
                                                    <span>On-Time</span>
                                                    <strong>{attendanceStats?.onTimeDisplay || `${attendanceStats?.onTimeDays ?? 0} On-Time`}</strong>
                                                    <small>{attendanceStats?.periodLabel || (statsPeriod === 'month' ? 'This Month' : statsPeriod === 'last_month' ? 'Last Month' : 'This Week')}</small>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 4. Late Arrivals */}
                                        <div className="col-md-6">
                                            <div className="ed-mini-stat">
                                                <div className="ed-mini-stat-icon ed-orange">
                                                    <i className="bi bi-clock"></i>
                                                </div>

                                                <div>
                                                    <span>Late Arrivals</span>
                                                    <strong>{attendanceStats?.lateDisplay || `${attendanceStats?.lateDays ?? 0} Late`}</strong>
                                                    <small>{attendanceStats?.periodLabel || (statsPeriod === 'month' ? 'This Month' : statsPeriod === 'last_month' ? 'Last Month' : 'This Week')}</small>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 5. Overtime */}
                                        <div className="col-md-6">
                                            <div className="ed-mini-stat">
                                                <div className="ed-mini-stat-icon ed-purple">
                                                    <i className="bi bi-stopwatch"></i>
                                                </div>

                                                <div>
                                                    <span>Overtime</span>
                                                    <strong>{attendanceStats?.overtimeDisplay || '00h 00m OT'}</strong>
                                                    <small>{attendanceStats?.periodLabel || (statsPeriod === 'month' ? 'This Month' : statsPeriod === 'last_month' ? 'Last Month' : 'This Week')}</small>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 6. Attendance */}
                                        <div className="col-md-6">
                                            <div className="ed-mini-stat">
                                                <div className="ed-mini-stat-icon ed-green">
                                                    <i className="bi bi-calendar-check"></i>
                                                </div>

                                                <div>
                                                    <span>Attendance</span>
                                                    <strong>{attendanceStats?.attendanceDisplay || `${attendanceStats?.attendancePercentage ?? 100}% Attendance`}</strong>
                                                    <small>{attendanceStats?.periodLabel || (statsPeriod === 'month' ? 'This Month' : statsPeriod === 'last_month' ? 'Last Month' : 'This Week')}</small>
                                                </div>
                                            </div>
                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </section>


                    
                    <section className="ed-section ed-quick-section">

                        <div className="ed-section-heading">
                            <div className="d-flex align-items-center justify-content-between w-100">
                                <div>
                                    <span className="ed-section-label">SHORTCUTS</span>
                                    <h2>Quick Actions</h2>
                                </div>
                                <button
                                    className="ed-text-action"
                                    onClick={() => navigateTo("settings")}
                                    style={{ background: 'transparent', border: 0, color: '#3c2fbc', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                                >
                                    <i className="bi bi-gear me-1"></i>
                                    Customize
                                </button>
                            </div>
                        </div>

                        {shortcutsLoading ? (
                            <div className="row g-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div className="col-xl col-lg-3 col-md-4 col-6" key={i}>
                                        <div className="ed-quick-card" style={{ opacity: 0.6 }}>
                                            <span className="ed-quick-icon ed-q-blue">
                                                <i className="bi bi-hourglass-split"></i>
                                            </span>
                                            <strong>Loading...</strong>
                                            <small>Fetching shortcuts</small>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : selectedShortcutIds.length > 0 ? (
                            <div className="row g-3">
                                {selectedShortcutIds
                                    .map((id) => SHORTCUT_CONFIG[id])
                                    .filter(Boolean)
                                    .map((shortcut) => (
                                        <div className="col-xl col-lg-3 col-md-4 col-6 d-flex" key={shortcut.id}>
                                            <button className="ed-quick-card flex-fill" onClick={() => navigateTo(shortcut.page)}>
                                                <span className={`ed-quick-icon ed-q-${shortcut.color}`}>
                                                    <i className={`bi ${shortcut.icon}`}></i>
                                                </span>
                                                <strong>{shortcut.label}</strong>
                                                <small>{shortcut.description}</small>
                                            </button>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <div
                                className="ed-quick-empty-card p-4 text-center"
                                style={{
                                    border: '1px dashed #d7d8e3',
                                    borderRadius: '18px',
                                    background: '#fafaff',
                                    padding: '30px 20px'
                                }}
                            >
                                <div
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '14px',
                                        background: '#eeecff',
                                        color: '#3c2fbc',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '22px',
                                        marginBottom: '12px'
                                    }}
                                >
                                    <i className="bi bi-star"></i>
                                </div>
                                <h6 style={{ fontWeight: 700, color: '#24263d', marginBottom: '6px' }}>
                                    No shortcuts selected
                                </h6>
                                <p style={{ color: '#85889b', fontSize: '13px', margin: '0 0 14px' }}>
                                    You haven't selected any shortcut icons yet. Customize your workspace by selecting quick actions in Settings.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => navigateTo("settings")}
                                    className="btn btn-sm"
                                    style={{
                                        background: '#3c2fbc',
                                        color: '#ffffff',
                                        borderRadius: '10px',
                                        padding: '7px 18px',
                                        fontWeight: 600,
                                        fontSize: '13px'
                                    }}
                                >
                                    <i className="bi bi-plus-lg me-1"></i> Choose Shortcuts
                                </button>
                            </div>
                        )}

                    </section>


                    
                    <section className="ed-section">

                        <div className="row g-4">

                            
                            <div className="col-xl-5 col-lg-6">

                                <div className="ed-panel ed-leave-panel">

                                    <div className="ed-panel-header">
                                        <div>
                                            <span className="ed-card-kicker">TIME OFF</span>
                                            <h3>My Leave Balance</h3>
                                        </div>

                                        <button className="ed-text-action" onClick={(e) => { e.preventDefault(); navigateTo("leaves"); }}>
                                              Apply Leave
                                              <i className="bi bi-arrow-up-right"></i>
                                          </button>
                                    </div>

                                    <div className="ed-leave-balance">
                                      {dashDisplayCards.map((b) => (
                                          <React.Fragment key={b.id}>
                                              <div className="ed-leave-row">
                                                  <div className="ed-leave-type">
                                                      <span className={`ed-leave-dot ${b.dotClass}`}></span>
                                                      <div>
                                                          <strong>{b.name}</strong>
                                                          <small>{b.used} used of {b.total} days</small>
                                                      </div>
                                                  </div>
                                                  <strong className="ed-leave-number">{b.remaining}</strong>
                                              </div>
                                              <div className="ed-leave-track">
                                                  <span style={{width: `${b.percent}%`}}></span>
                                              </div>
                                          </React.Fragment>
                                      ))}

                                    <div className="ed-leave-upcoming" style={{cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '15px', border: '1px solid #f1f3f5', borderRadius: '12px', marginTop: '15px'}} onClick={(e) => { e.preventDefault(); navigateTo("leaves"); }}>
                                        <div className="ed-upcoming-icon" style={{ backgroundColor: '#f0f0ff', color: '#4e36f5', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <i className="bi bi-calendar2-heart"></i>
                                        </div>
                                        <div style={{ flex: 1, marginLeft: '12px' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#4e36f5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>UPCOMING LEAVE</span>
                                            {dashUpcomingLeave ? (
                                                <div style={{ marginTop: '2px' }}>
                                                    <strong style={{ display: 'block', fontSize: '14px', color: '#24263d', fontWeight: '700' }}>
                                                        {getCleanDate(dashUpcomingLeave.start_date) === getCleanDate(dashUpcomingLeave.end_date)
                                                            ? new Date(dashUpcomingLeave.start_date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
                                                            : `${new Date(dashUpcomingLeave.start_date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short'})} - ${new Date(dashUpcomingLeave.end_date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})}`}
                                                    </strong>
                                                    <small style={{ color: '#8b8e9f', fontSize: '12px' }}>
                                                        {dashUpcomingLeave.leave_type} · {dashUpcomingLeave.is_half_day ? `0.5 day (${dashUpcomingLeave.half_day_period === 'Second Half' ? '2nd Half' : '1st Half'})` : `${Number(dashUpcomingLeave.days_requested)} ${Number(dashUpcomingLeave.days_requested) === 1 ? 'day' : 'days'}`}
                                                    </small>
                                                </div>
                                            ) : (
                                                <div style={{ marginTop: '2px' }}>
                                                    <strong style={{ display: 'block', fontSize: '14px', color: '#24263d', fontWeight: '700' }}>No upcoming leave</strong>
                                                    <small style={{ color: '#8b8e9f', fontSize: '12px' }}>--</small>
                                                </div>
                                            )}
                                        </div>
                                        <i className="bi bi-chevron-right" style={{ color: '#bdc1d1' }}></i>
                                    </div>
                                  </div>
                              </div>
                              </div>
                              
                              <div className="col-xl-7 col-lg-6">
                                  <div className="ed-panel">
                                      <div className="ed-panel-header">
                                          <div>
                                              <span className="ed-card-kicker">ATTENDANCE</span>
                                              <h3>My attendance this week</h3>
                                          </div>
                                          <select className="ed-period-select" value={statsPeriod} onChange={(e) => { const p = e.target.value; setStatsPeriod(p); fetchAttendanceStats(p); }}>
                                              <option value="week">This Week</option>
                                              <option value="month">This Month</option>
                                              <option value="last_month">Last Month</option>
                                          </select>
                                      </div>
                                      <div className="ed-attendance-chart">
                                          {attendanceLoading ? (
                                              <div className="d-flex justify-content-center align-items-center h-100">
                                                  <div className="spinner-border text-primary" role="status"></div>
                                              </div>
                                          ) : (
                                              <Chart options={chartOptions} series={[{ name: "Working Hours", data: attendanceStats?.chartData || [] }]} type="area" height={255} />
                                          )}
                                      </div>
                                      <div className="ed-attendance-footer" style={{ borderTop: '1px solid #f1f3f5', marginTop: '15px', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', paddingLeft: '15px', paddingRight: '15px' }}>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                              <span style={{ color: '#8b8e9f', fontSize: '13px' }}>Present</span>
                                              <strong style={{ color: '#24263d', fontSize: '15px', fontWeight: '700' }}>{attendanceStats?.presentDays || 0} {attendanceStats?.presentDays === 1 ? 'Day' : 'Days'}</strong>
                                          </div>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                              <span style={{ color: '#8b8e9f', fontSize: '13px' }}>Average</span>
                                              <strong style={{ color: '#24263d', fontSize: '15px', fontWeight: '700' }}>{attendanceStats?.avgHoursDisplay || '0h 00m'}</strong>
                                          </div>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                              <span style={{ color: '#8b8e9f', fontSize: '13px' }}>Late</span>
                                              <strong style={{ color: '#24263d', fontSize: '15px', fontWeight: '700' }}>{String(attendanceStats?.lateDays || 0).padStart(2, '0')} Day{attendanceStats?.lateDays !== 1 ? 's' : ''}</strong>
                                          </div>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                              <span style={{ color: '#8b8e9f', fontSize: '13px' }}>Overtime</span>
                                              <strong style={{ color: '#24263d', fontSize: '15px', fontWeight: '700' }}>{attendanceStats?.overtimeDisplay || '00h 00m'}</strong>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </section>

                      <section className="ed-section">

                        <div className="row g-4">

                            
                            <div className="col-xl-7">

                                <div className="ed-celebration-panel">
    <div className="ed-celebration-heading">
        <div>
            <span className="ed-card-kicker">CELEBRATIONS</span>
            <h3>Special days this Month</h3>
        </div>
        <button className="ed-text-action" onClick={(e) => { e.preventDefault(); navigateTo("calendar", "wishes"); }}>
            View All
            <i className="bi bi-arrow-up-right"></i>
        </button>
    </div>
    <div className="row g-4">
        <div className="col-md-6">
            <div className="ed-celebration-card">
                <div className="ed-celebration-avatar" style={{ overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {activeBirthday?.profilePic ? (
                        <img 
                            src={/^(https?:\/\/|data:|blob:)/i.test(activeBirthday.profilePic) ? activeBirthday.profilePic : `${API_BASE}/${activeBirthday.profilePic.replace(/^\/+/, '')}`} 
                            alt={activeBirthday.name} 
                            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "14px" }}
                        />
                    ) : (
                        <div style={{ width: "100%", height: "100%", borderRadius: "14px", background: "#fff1f7", color: "#e8679d", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "16px" }}>
                            {activeBirthday ? (activeBirthday.name?.charAt(0) || "🎂") : <i className="bi bi-balloon-heart"></i>}
                        </div>
                    )}
                </div>
                <div className="ed-celebration-content">
                    <span className="ed-celebration-type">
                        <i className="bi bi-balloon-heart"></i>
                        Birthday
                    </span>
                    <strong>{activeBirthday ? activeBirthday.name : "No Birthdays"}</strong>
                    <small>
                        {activeBirthday ? (
                            activeBirthday.daysUntil === 1 
                                ? `Tomorrow · ${new Date(activeBirthday.date).toLocaleDateString('en-GB', {day: 'numeric', month: 'long'})}`
                                : activeBirthday.daysUntil === 0 
                                    ? `Today · ${new Date(activeBirthday.date).toLocaleDateString('en-GB', {day: 'numeric', month: 'long'})}`
                                    : new Date(activeBirthday.date).toLocaleDateString('en-GB', {day: 'numeric', month: 'long'})
                        ) : "--"}
                    </small>
                    {activeBirthday && (
                        <button 
                            type="button"
                            disabled={
                                sentWishes[`birthday-${activeBirthday.id || activeBirthday.userId || activeBirthday.name}`] || 
                                sendingWishId === `birthday-${activeBirthday.id || activeBirthday.userId || activeBirthday.name}` ||
                                (currentUser?.id && activeBirthday.userId && Number(currentUser.id) === Number(activeBirthday.userId))
                            }
                            onClick={() => handleSendWish(activeBirthday, 'birthday')}
                            style={{
                                cursor: (sentWishes[`birthday-${activeBirthday.id || activeBirthday.userId || activeBirthday.name}`] || (currentUser?.id && activeBirthday.userId && Number(currentUser.id) === Number(activeBirthday.userId))) ? "default" : "pointer"
                            }}
                        >
                            {sendingWishId === `birthday-${activeBirthday.id || activeBirthday.userId || activeBirthday.name}` ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" style={{ width: '12px', height: '12px' }}></span>
                                    Sending...
                                </>
                            ) : sentWishes[`birthday-${activeBirthday.id || activeBirthday.userId || activeBirthday.name}`] ? (
                                <>
                                    <i className="bi bi-check2-circle text-success me-1"></i>
                                    Wish Sent ✨
                                </>
                            ) : (currentUser?.id && activeBirthday.userId && Number(currentUser.id) === Number(activeBirthday.userId)) ? (
                                <>
                                    <i className="bi bi-stars me-1 text-warning"></i>
                                    Your Birthday 🎉
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-send me-1"></i>
                                    Send wishes
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
        <div className="col-md-6">
            <div className="ed-celebration-card">
                <div className="ed-celebration-avatar ed-anniversary" style={{ overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {activeAnniversary?.profilePic ? (
                        <img 
                            src={/^(https?:\/\/|data:|blob:)/i.test(activeAnniversary.profilePic) ? activeAnniversary.profilePic : `${API_BASE}/${activeAnniversary.profilePic.replace(/^\/+/, '')}`} 
                            alt={activeAnniversary.name} 
                            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "14px" }}
                        />
                    ) : (
                        <div style={{ width: "100%", height: "100%", borderRadius: "14px", background: "#eeecff", color: "#3c2fbc", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "16px" }}>
                            {activeAnniversary ? (activeAnniversary.name?.charAt(0) || "🏆") : <i className="bi bi-award"></i>}
                        </div>
                    )}
                </div>
                <div className="ed-celebration-content">
                    <span className="ed-celebration-type">
                        <i className="bi bi-stars"></i>
                        Work Anniversary
                    </span>
                    <strong>{activeAnniversary ? activeAnniversary.name : "No Anniversaries"}</strong>
                    <small>
                        {activeAnniversary ? (
                            `${new Date(activeAnniversary.date).toLocaleDateString('en-GB', {day: 'numeric', month: 'long'})} · ${activeAnniversary.years} Years`
                        ) : "--"}
                    </small>
                    {activeAnniversary && (
                        <button 
                            type="button"
                            disabled={
                                sentWishes[`anniversary-${activeAnniversary.id || activeAnniversary.userId || activeAnniversary.name}`] || 
                                sendingWishId === `anniversary-${activeAnniversary.id || activeAnniversary.userId || activeAnniversary.name}` ||
                                (currentUser?.id && activeAnniversary.userId && Number(currentUser.id) === Number(activeAnniversary.userId))
                            }
                            onClick={() => handleSendWish(activeAnniversary, 'anniversary')}
                            style={{
                                cursor: (sentWishes[`anniversary-${activeAnniversary.id || activeAnniversary.userId || activeAnniversary.name}`] || (currentUser?.id && activeAnniversary.userId && Number(currentUser.id) === Number(activeAnniversary.userId))) ? "default" : "pointer"
                            }}
                        >
                            {sendingWishId === `anniversary-${activeAnniversary.id || activeAnniversary.userId || activeAnniversary.name}` ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" style={{ width: '12px', height: '12px' }}></span>
                                    Sending...
                                </>
                            ) : sentWishes[`anniversary-${activeAnniversary.id || activeAnniversary.userId || activeAnniversary.name}`] ? (
                                <>
                                    <i className="bi bi-check2-circle text-success me-1"></i>
                                    Wish Sent ✨
                                </>
                            ) : (currentUser?.id && activeAnniversary.userId && Number(currentUser.id) === Number(activeAnniversary.userId)) ? (
                                <>
                                    <i className="bi bi-stars me-1 text-warning"></i>
                                    Your Anniversary 🌟
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-send me-1"></i>
                                    Send wishes
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    </div>
</div>
</div>
<div className="col-xl-5">
<div className="ed-holiday-panel">
    <div className="ed-holiday-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
        <div>
            <span className="ed-card-kicker">CALENDAR</span>
            <h3>Next Holiday</h3>
        </div>
        <i className="bi bi-calendar3 ed-calendar-icon"></i>
    </div>
    <div className="ed-holiday-main">
        <div className="ed-holiday-date">
            <strong>{dashNextHoliday ? new Date(dashNextHoliday.holiday_date).toLocaleDateString('en-GB', {day: '2-digit'}) : '--'}</strong>
            <span>{dashNextHoliday ? new Date(dashNextHoliday.holiday_date).toLocaleDateString('en-GB', {month: 'short'}).toUpperCase() : ''}</span>
        </div>
        <div>
            <span>Next public holiday</span>
            <strong>{dashNextHoliday ? dashNextHoliday.holiday_name : 'No upcoming holidays'}</strong>
            <small>{dashNextHoliday ? new Date(dashNextHoliday.holiday_date).toLocaleDateString('en-GB', {weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'}) : ''}</small>
        </div>
    </div>
    <div className="ed-holiday-footer">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            {dashNextHoliday ? (
                <>
                    <i className="bi bi-calendar-event me-2"></i>
                    {Math.ceil((new Date(dashNextHoliday.holiday_date) - new Date()) / (1000 * 60 * 60 * 24))} days from now
                </>
            ) : null}
        </span>
        <button onClick={(e) => { e.preventDefault(); navigateTo("calendar"); }}>
            View All
            <i className="bi bi-arrow-right"></i>
        </button>
    </div>
</div>

                            </div>

                        </div>

                    </section>


                    
                    <section className="ed-section">

                        <div className="row g-4">

                            
                            <div className="col-xl-7">

                                <div className="ed-panel">

                                    <div className="ed-panel-header">
                                        <div>
                                            <span className="ed-card-kicker">MY REQUESTS</span>
                                            <h3>Recent requests</h3>
                                        </div>

                                        <button className="ed-text-action" onClick={() => navigateTo("employee-requests")}>
                                            View all
                                            <i className="bi bi-arrow-up-right"></i>
                                        </button>
                                    </div>

                                    <div className="ed-request-list">
                                        {recentDashboardRequests.length > 0 ? (
                                            recentDashboardRequests.map((req) => (
                                                <div
                                                    className="ed-request-item"
                                                    key={req.id}
                                                >
                                                    <div className={`ed-request-icon ${req.iconBg}`}>
                                                        <i className={req.icon}></i>
                                                    </div>

                                                    <div className="ed-request-content">
                                                        <strong>{req.title}</strong>
                                                        <span>{req.subtitle}</span>
                                                    </div>

                                                    <span className={`ed-request-status ${req.statusClass}`}>
                                                        {req.status}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <EmptyState
                                                compact
                                                emoji="📬"
                                                title="No recent requests"
                                                message="You have not submitted any employee requests recently."
                                            />
                                        )}
                                    </div>

                                </div>

                            </div>


                            
                            <div className="col-xl-5">
                                {latestAnnouncement ? (
                                    <div className="ed-announcement-panel">
                                        <div className="ed-announcement-top">
                                            <div className="ed-announcement-icon">
                                                <i className="bi bi-megaphone-fill"></i>
                                            </div>

                                            <span>{latestAnnouncement.category ? latestAnnouncement.category.toUpperCase() : "HR ANNOUNCEMENT"}</span>
                                        </div>

                                        <h3>{latestAnnouncement.title}</h3>

                                        <p>
                                            {latestAnnouncement.content && latestAnnouncement.content.length > 140 
                                                ? `${latestAnnouncement.content.slice(0, 140)}...` 
                                                : latestAnnouncement.content}
                                        </p>

                                        <div className="ed-announcement-meta">
                                            <span>
                                                <i className="bi bi-calendar3"></i>
                                                {new Date(latestAnnouncement.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>

                                            <span>
                                                <i className="bi bi-clock"></i>
                                                {new Date(latestAnnouncement.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        <button type="button" onClick={() => setIsAnnouncementModalOpen(true)}>
                                            Read announcement
                                            <i className="bi bi-arrow-up-right"></i>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="ed-panel h-100 d-flex flex-column" style={{ minHeight: "240px" }}>
                                        <div className="ed-panel-header mb-1">
                                            <div>
                                                <span className="ed-card-kicker">ANNOUNCEMENTS</span>
                                                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "4px 0 0 0" }}>HR Announcements</h3>
                                                <p style={{ margin: "4px 0 0", color: "#85889b", fontSize: "0.85rem" }}>
                                                    Company and organization announcements.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex-grow-1 d-flex align-items-center justify-content-center">
                                            <EmptyState
                                                compact
                                                emoji="📢"
                                                title="No announcements yet"
                                                message="There are currently no active company announcements."
                                                action={isHR ? (
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-primary rounded-pill px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-1 shadow-xs"
                                                        onClick={() => navigateTo("announcements")}
                                                        style={{ fontSize: "12px" }}
                                                    >
                                                        <i className="bi bi-plus-lg"></i> Post Announcement
                                                    </button>
                                                ) : null}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>

                    </section>

                     
                    <section className="ed-section">

                        <div className="row g-4">

                            
                            <div className="col-xl-7">

                                <div className="ed-panel">

                                    <div className="ed-panel-header">
                                        <div>
                                            <span className="ed-card-kicker">MY TEAM</span>
                                            <h3>People around you</h3>
                                        </div>

                                        <button
                                            className="ed-text-action"
                                            type="button"
                                            onClick={() => navigateTo("calendar", "overview")}>
                                            View Team
                                            <i className="bi bi-arrow-up-right"></i>
                                        </button>
                                    </div>

                                    {/* Project Selection / Badge Bar above team list */}
                                    {myTeamData.teams && myTeamData.teams.length > 0 && (
                                        <div className="px-4 py-2 border-bottom d-flex align-items-center justify-content-between gap-2 bg-light bg-opacity-50">
                                            {myTeamData.teams.length === 1 ? (
                                                <div className="d-flex align-items-center gap-2 small">
                                                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 fw-bold">
                                                        <i className="bi bi-diagram-3-fill me-1"></i>
                                                        {myTeamData.teams[0].project_name} ({myTeamData.teams[0].project_code || 'PRJ'})
                                                    </span>
                                                    <span className="badge bg-secondary-subtle text-secondary small">
                                                        {myTeamData.teams[0].members?.length || 0} members
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="d-flex align-items-center gap-2 small w-100 justify-content-between">
                                                    <div className="d-flex align-items-center gap-1 text-muted">
                                                        <i className="bi bi-diagram-3-fill text-primary"></i>
                                                        <span className="fw-semibold text-dark">Project:</span>
                                                    </div>
                                                    <select
                                                        className="form-select form-select-sm"
                                                        style={{ width: "auto", fontSize: "12px", padding: "3px 28px 3px 8px", borderRadius: "8px" }}
                                                        value={selectedDashboardProjectId}
                                                        onChange={(e) => setSelectedDashboardProjectId(e.target.value)}
                                                    >
                                                        <option value="all">All Projects ({myTeamData.teams.length})</option>
                                                        {myTeamData.teams.map((t) => (
                                                            <option key={t.id} value={t.id}>
                                                                {t.project_name} ({t.project_code}) {t.my_role === 'Lead' ? '★ Lead' : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                            {myTeamData.teams.length === 1 && myTeamData.teams[0].my_role === 'Lead' && (
                                                <span className="badge bg-warning text-dark px-2 py-0 small">
                                                    <i className="bi bi-star-fill me-1"></i>Lead
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* If no team mapped in DB */}
                                    {(!myTeamData.teams || myTeamData.teams.length === 0) && (
                                        <div className="px-4 py-2 border-bottom d-flex align-items-center justify-content-between bg-light bg-opacity-50">
                                            <span className="text-muted small">
                                                <i className="bi bi-info-circle me-1 text-primary"></i>
                                                No project team assigned yet
                                            </span>
                                            <span className="badge bg-secondary-subtle text-secondary small">Solo</span>
                                        </div>
                                    )}

                                    <div className="ed-team-list">
                                        {dashboardDisplayedMembers.map((member, idx) => (
                                            <div className="ed-team-member" key={member.id || idx}>
                                                <div className="ed-team-avatar">
                                                    <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: ["#ede9fe", "#e0f2fe", "#fef3c7", "#dcfce7"][idx % 4], color: ["#6366f1", "#0284c7", "#d97706", "#16a34a"][idx % 4], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px" }}>
                                                        {(member.full_name || "EM").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <span></span>
                                                </div>

                                                <div className="ed-team-info">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <strong>{member.full_name || member.email}</strong>
                                                        {member.is_current_user && (
                                                            <span className="badge bg-primary text-white rounded-pill px-2 py-0" style={{ fontSize: "10px" }}>You</span>
                                                        )}
                                                        {member.role_in_team === "Lead" && (
                                                            <span className="badge bg-warning text-dark rounded-pill px-2 py-0" style={{ fontSize: "10px" }}>Lead</span>
                                                        )}
                                                    </div>
                                                    <span>{member.designation || member.role_name || "Engineering"} {member.project_badge && member.project_badge !== 'No Team Mapped' ? `· ${member.project_badge}` : ''}</span>
                                                </div>

                                                <div className="ed-team-status d-flex align-items-center gap-2">
                                                    <span className="ed-status-present">{member.status || "Active"}</span>
                                                    {!member.is_current_user && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-primary rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1 shadow-xs"
                                                            title={`Chat with ${member.full_name || member.email}`}
                                                            onClick={() => setActiveChatUser(member)}
                                                            style={{ fontSize: "11.5px", fontWeight: 600, whiteSpace: "nowrap" }}
                                                        >
                                                            <i className="bi bi-chat-dots-fill"></i> Chat
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                </div>

                            </div>


                            
                            <div className="col-xl-5">

                                <div className="ed-panel ed-notification-panel">

                                    <div className="ed-panel-header">
                                        <div>
                                            <span className="ed-card-kicker">UPDATES</span>
                                            <h3>Notifications</h3>
                                        </div>

                                        <span className="ed-unread-count">{unreadNotificationCount} New</span>
                                    </div>

                                    <div className="ed-notification-list">
                                        {dashboardNotifications.length > 0 ? (
                                            dashboardNotifications.slice(0, 4).map((n) => (
                                                <div
                                                    className={`ed-notification-item${n.is_read ? "" : " ed-unread"}`}
                                                    key={n.id}
                                                    style={{ cursor: "pointer" }}
                                                    onClick={(e) => {
                                                        handleMarkAsRead(n.id, e);
                                                        navigateTo("notifications");
                                                    }}
                                                >
                                                    <div className={`ed-notification-icon ${n.category === "leave" || n.category === "Leave Request" ? "ed-notify-purple" : n.category === "asset" || n.category === "Asset Request" ? "ed-notify-orange" : "ed-notify-blue"}`}>
                                                        <i className={`bi ${n.category === "leave" || n.category === "Leave Request" ? "bi-calendar-check" : n.category === "asset" || n.category === "Asset Request" ? "bi-laptop" : "bi-bell"}`}></i>
                                                    </div>
                                                    <div>
                                                        <strong>{n.title}</strong>
                                                        <p>{n.message}</p>
                                                        <small>{formatTimeAgo(n.created_at)}</small>
                                                    </div>
                                                    {!n.is_read && <span className="ed-notification-new"></span>}
                                                </div>
                                            ))
                                        ) : (
                                            <EmptyState
                                                compact
                                                emoji="🔔"
                                                title="No new notifications"
                                                message="You're all caught up! New alerts and updates will show up here."
                                            />
                                        )}
                                    </div>

                                    <button className="ed-view-all-btn" onClick={() => navigateTo("notifications")}>
                                        View all notifications
                                        <i className="bi bi-arrow-right"></i>
                                    </button>

                                </div>

                            </div>

                        </div>

                    </section>


                    
                    <section className="ed-bottom-section">

                        <div className="row g-4">

                            <div className="col-xl-12">

                                <div className="ed-policy-banner">

                                    <div className="ed-policy-icon">
                                        <i className="bi bi-shield-check"></i>
                                    </div>

                                    <div className="ed-policy-content">
                                        <span>HR POLICY</span>
                                        <h3>Know your leave policy</h3>
                                        <p>
                                            Review annual, sick and casual leave rules,
                                            eligibility, carry-forward limits and approval
                                            requirements.
                                        </p>
                                    </div>

                                    <button type="button" onClick={() => setIsPolicyModalOpen(true)}>
                                        View Policy
                                        <i className="bi bi-arrow-right"></i>
                                    </button>

                                </div>

                            </div>

                        </div>

                    </section>

                </div>


                

                
                <div className="ed-toast" id="edToast">

                    <div className="ed-toast-icon">
                        <i className="bi bi-check-lg"></i>
                    </div>

                    <div>
                        <strong id="edToastTitle">Action completed</strong>
                        <span id="edToastMessage">Your request was completed successfully.</span>
                    </div>

                    <button>
                        <i className="bi bi-x"></i>
                    </button>

                </div>
            </div>
  </>
)}
{activePage === "employee-profile" && <EmployeeProfile currentUser={currentUser} employeeProfile={employeeProfile} onProfileUpdate={fetchEmployeeProfile} onNavigate={navigateTo} />}
{activePage === "employement-details" && <EmploymentDetails employeeProfile={employeeProfile} currentUser={currentUser} onProfileUpdate={fetchEmployeeProfile} onNavigate={navigateTo} />}
{activePage === "documents" && <Documents employeeProfile={employeeProfile} currentUser={currentUser} />}
{activePage === "skills-certifications" && <SkillsCertifications employeeProfile={employeeProfile} currentUser={currentUser} />}
{activePage === "attendance" && <Attendance currentUser={currentUser} employeeProfile={employeeProfile} onNavigate={navigateTo} />}
{activePage === "leaves" && <Leaves currentUser={currentUser} employeeProfile={employeeProfile} />}
{activePage === "expenses" && <Expenses currentUser={currentUser} employeeProfile={employeeProfile} onNavigate={navigateTo} />}
{activePage === "assets" && <Assets employeeProfile={employeeProfile} currentUser={currentUser} />}
{activePage === "access-accounts" && <AccessAccounts employeeProfile={employeeProfile} />}
{activePage === "notifications" && <Notifications currentUser={currentUser} employeeProfile={employeeProfile} />}
{activePage === "settings" && <Settings employeeProfile={employeeProfile} currentUser={currentUser} onProfileUpdate={fetchEmployeeProfile} onNavigate={navigateTo} />}
{activePage === "exit-management" && <ExitManagement employeeProfile={employeeProfile} currentUser={currentUser} onNavigate={navigateTo} />}
{activePage === "employee-requests" && <EmployeeRequests employeeProfile={employeeProfile} currentUser={currentUser} />}
{activePage === "calendar" && <Calendar employeeProfile={employeeProfile} currentUser={currentUser} initialTab={calendarTab} />}
{activePage === "announcements" && <Announcements currentUser={currentUser} employeeProfile={employeeProfile} />}

        {/* Check-Out Confirmation Modal */}
        {showCheckOutConfirm && (
            <>
            <div className="modal-backdrop fade show" style={{ zIndex: 9998, backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setShowCheckOutConfirm(false)}></div>
            <div className="modal fade show d-block" id="edCheckOutConfirmModal" tabIndex="-1" role="dialog" style={{ zIndex: 9999 }} onClick={(e) => { if (e.target === e.currentTarget) setShowCheckOutConfirm(false); }}>
                <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "440px" }}>
                    <div className="modal-content" style={{ borderRadius: "20px", border: "none", boxShadow: "0 20px 45px rgba(0,0,0,0.18)", backgroundColor: "#ffffff", padding: "12px" }}>
                        <div className="modal-body text-center" style={{ padding: "24px 20px 16px 20px" }}>
                            <div style={{ width: "56px", height: "56px", borderRadius: "18px", backgroundColor: "#fef2f2", color: "#ef4444", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "26px", marginBottom: "16px" }}>
                                <i className="bi bi-box-arrow-right"></i>
                            </div>
                            <h5 style={{ fontWeight: 700, fontSize: "18px", color: "#1e293b", marginBottom: "8px" }}>Confirm Check Out</h5>
                            <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.5", margin: 0 }}>
                                Are you sure you want to Check Out for today? Your workday duration and punch details will be recorded.
                            </p>
                        </div>
                        <div className="modal-footer d-flex justify-content-center gap-2" style={{ borderTop: "none", padding: "0 20px 16px 20px" }}>
                            <button
                                type="button"
                                className="btn btn-light"
                                style={{ borderRadius: "10px", padding: "9px 22px", fontWeight: 600, color: "#64748b", backgroundColor: "#f1f5f9", border: "none" }}
                                onClick={() => setShowCheckOutConfirm(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn text-white"
                                style={{ borderRadius: "10px", padding: "9px 24px", fontWeight: 600, backgroundColor: "#ef4444", border: "none" }}
                                onClick={handleConfirmCheckOut}
                                disabled={attendanceLoading}
                            >
                                {attendanceLoading ? "Checking Out..." : "Yes, Check Out"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            </>
        )}

        {/* Global Pop-up Toaster */}
        {toastNotification && (
            <div className="ed-toast show" style={{ zIndex: 99999 }}>
                <div className="ed-toast-icon" style={{ backgroundColor: toastNotification.type === 'danger' ? '#fef2f2' : '#eafaf4', color: toastNotification.type === 'danger' ? '#ef4444' : '#22b981' }}>
                    <i className={`bi ${toastNotification.icon || 'bi-check-lg'}`}></i>
                </div>
                <div>
                    <strong>{toastNotification.title}</strong>
                    <span>{toastNotification.message}</span>
                </div>
                <button type="button" onClick={() => setToastNotification(null)}>
                    <i className="bi bi-x"></i>
                </button>
            </div>
        )}

{isPolicyModalOpen && (
                    <>
                    <div className="modal-backdrop fade show" style={{ zIndex: 9998, backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setIsPolicyModalOpen(false)}></div>
                    <div className="modal fade show d-block" id="edLeavePolicyModal" tabIndex="-1" role="dialog" style={{ zIndex: 9999 }} onClick={(e) => { if (e.target === e.currentTarget) setIsPolicyModalOpen(false); }}>
                        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "680px" }}>
                            <div className="modal-content" style={{ borderRadius: "20px", border: "none", boxShadow: "0 20px 45px rgba(0,0,0,0.12)", backgroundColor: "#ffffff", padding: "8px" }}>

                                <div className="modal-header d-flex justify-content-between align-items-start" style={{ borderBottom: "none", padding: "20px 24px 10px 24px" }}>
                                    <div>
                                        <span style={{ color: "#4f46e5", fontSize: "11px", fontWeight: 700, letterSpacing: "0.8px", display: "block", marginBottom: "4px" }}>HR POLICY</span>
                                        <h4 className="modal-title" style={{ fontWeight: 700, fontSize: "20px", color: "#1e293b", margin: 0 }}>Leave Policy</h4>
                                    </div>

                                    <button
                                        type="button"
                                        className="btn-close"
                                        style={{ fontSize: "12px", opacity: 0.7 }}
                                        onClick={() => setIsPolicyModalOpen(false)}>
                                    </button>
                                </div>

                                <div className="modal-body" style={{ padding: "10px 24px 20px 24px" }}>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                        <div style={{ padding: "20px", border: "1px solid #edf2f7", borderRadius: "16px", backgroundColor: "#ffffff" }}>
                                            <i className="bi bi-calendar-heart" style={{ fontSize: "22px", color: "#4f46e5", display: "inline-block" }}></i>
                                            <h6 style={{ fontWeight: 700, fontSize: "15px", color: "#1e293b", marginTop: "14px", marginBottom: "3px" }}>Annual Leave</h6>
                                            <span style={{ color: "#8a90a2", fontSize: "13.5px" }}>
                                                {formatDays(dynamicPolicies.find(p => /annual/i.test(p.name))?.default_days, 18)} days per year
                                            </span>
                                        </div>

                                        <div style={{ padding: "20px", border: "1px solid #edf2f7", borderRadius: "16px", backgroundColor: "#ffffff" }}>
                                            <i className="bi bi-heart-pulse" style={{ fontSize: "22px", color: "#4f46e5", display: "inline-block" }}></i>
                                            <h6 style={{ fontWeight: 700, fontSize: "15px", color: "#1e293b", marginTop: "14px", marginBottom: "3px" }}>Sick Leave</h6>
                                            <span style={{ color: "#8a90a2", fontSize: "13.5px" }}>
                                                {formatDays(dynamicPolicies.find(p => /sick/i.test(p.name))?.default_days, 10)} days per year
                                            </span>
                                        </div>

                                        <div style={{ padding: "20px", border: "1px solid #edf2f7", borderRadius: "16px", backgroundColor: "#ffffff" }}>
                                            <i className="bi bi-calendar2-event" style={{ fontSize: "22px", color: "#4f46e5", display: "inline-block" }}></i>
                                            <h6 style={{ fontWeight: 700, fontSize: "15px", color: "#1e293b", marginTop: "14px", marginBottom: "3px" }}>Public Holidays</h6>
                                            <span style={{ color: "#8a90a2", fontSize: "13.5px" }}>
                                                {dashHolidaysRemaining} pending ({dashTotalHolidays} days in {currentYear})
                                            </span>
                                        </div>

                                        <div style={{ padding: "20px", border: "1px solid #edf2f7", borderRadius: "16px", backgroundColor: "#ffffff" }}>
                                            <i className="bi bi-arrow-repeat" style={{ fontSize: "22px", color: "#4f46e5", display: "inline-block" }}></i>
                                            <h6 style={{ fontWeight: 700, fontSize: "15px", color: "#1e293b", marginTop: "14px", marginBottom: "3px" }}>Carry Forward</h6>
                                            <span style={{ color: "#8a90a2", fontSize: "13.5px" }}>Up to 5 annual days</span>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: "24px" }}>
                                        <h6 style={{ fontWeight: 700, fontSize: "15px", color: "#1e293b", marginBottom: "12px" }}>Important Guidelines</h6>
                                        <ul style={{ margin: 0, paddingLeft: "20px", color: "#64748b", fontSize: "13.5px", lineHeight: 1.8 }}>
                                            <li>Leave should be requested before the planned absence.</li>
                                            <li>Unplanned absence should be communicated to the reporting manager.</li>
                                            <li>Supporting documents may be required for certain leave types.</li>
                                            <li>Leave approval depends on business and team requirements.</li>
                                        </ul>
                                    </div>

                                </div>

                                <div className="modal-footer d-flex justify-content-end gap-2" style={{ borderTop: "none", padding: "0 24px 20px 24px" }}>
                                    <button
                                        type="button"
                                        className="btn btn-light"
                                        style={{ borderRadius: "10px", padding: "8px 22px", fontWeight: 600, color: "#334155", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
                                        onClick={() => setIsPolicyModalOpen(false)}>
                                        Close
                                    </button>
                                    <button
                                        type="button"
                                        className="btn text-white"
                                        style={{ borderRadius: "10px", padding: "8px 22px", fontWeight: 600, backgroundColor: "#3c2fbc", border: "none", display: "inline-flex", alignItems: "center", gap: "8px" }}
                                        onClick={() => { setIsPolicyModalOpen(false); navigateTo("leaves"); }}>
                                        Apply Leave <i className="bi bi-arrow-right"></i>
                                    </button>
                                </div>

                            </div>
                        </div>
                    </div>
                    </>
                )}


                
                {/* HR Announcement Modal */}
                {isAnnouncementModalOpen && (
                    <>
                    <div className="modal-backdrop fade show" style={{ zIndex: 9998, backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setIsAnnouncementModalOpen(false)}></div>
                    <div className="modal fade show d-block" id="edAnnouncementModal" tabIndex="-1" role="dialog" style={{ zIndex: 9999 }} onClick={(e) => { if (e.target === e.currentTarget) setIsAnnouncementModalOpen(false); }}>
                        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "620px" }}>
                            <div className="modal-content" style={{ borderRadius: "20px", border: "none", boxShadow: "0 20px 45px rgba(0,0,0,0.12)", backgroundColor: "#ffffff", padding: "8px" }}>
                                <div className="modal-header d-flex justify-content-between align-items-start" style={{ borderBottom: "none", padding: "20px 24px 10px 24px" }}>
                                    <div>
                                        <span style={{ color: "#4f46e5", fontSize: "11px", fontWeight: 700, letterSpacing: "0.8px", display: "block", marginBottom: "4px" }}>
                                            {latestAnnouncement?.category ? latestAnnouncement.category.toUpperCase() : "COMPANY ANNOUNCEMENT"}
                                        </span>
                                        <h4 className="modal-title" style={{ fontWeight: 700, fontSize: "20px", color: "#1e293b", margin: 0 }}>
                                            {latestAnnouncement?.title || "Quarterly Town Hall"}
                                        </h4>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        style={{ fontSize: "12px", opacity: 0.7 }}
                                        onClick={() => setIsAnnouncementModalOpen(false)}>
                                    </button>
                                </div>

                                <div className="modal-body" style={{ padding: "10px 24px 20px 24px" }}>
                                    <div style={{ display: "flex", gap: "16px", marginBottom: "18px", padding: "12px 16px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #edf2f7", flexWrap: "wrap" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "13px" }}>
                                            <i className="bi bi-calendar3" style={{ color: "#4f46e5" }}></i>
                                            <strong>{latestAnnouncement?.created_at ? new Date(latestAnnouncement.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : "25 Sep 2026"}</strong>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "13px" }}>
                                            <i className="bi bi-clock" style={{ color: "#4f46e5" }}></i>
                                            <strong>{latestAnnouncement?.created_at ? new Date(latestAnnouncement.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "4:00 PM - 5:30 PM (IST)"}</strong>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "13px" }}>
                                            <i className="bi bi-bullseye" style={{ color: "#4f46e5" }}></i>
                                            <strong>{latestAnnouncement?.target_name || "Company-wide"}</strong>
                                        </div>
                                    </div>

                                    <h6 style={{ fontWeight: 650, fontSize: "15px", color: "#1e293b", marginBottom: "8px" }}>Overview & Message</h6>
                                    <div style={{ color: "#475569", fontSize: "14px", lineHeight: "1.6", marginBottom: "14px", whiteSpace: "pre-wrap" }}>
                                        {latestAnnouncement?.content || "Join our company-wide Quarterly Town Hall meeting! Executive leadership and team heads will share updates on company performance, Q3 milestones, project achievements, and strategic plans for the upcoming quarter."}
                                    </div>
                                    <div style={{ padding: "14px", backgroundColor: "#eff6ff", borderRadius: "12px", border: "1px solid #bfdbfe", color: "#1e40af", fontSize: "13px" }}>
                                        <strong style={{ display: "block", marginBottom: "4px" }}><i className="bi bi-info-circle me-1"></i>Issued by</strong>
                                        <span>{latestAnnouncement?.author_name || "HR Department"} · Official HR Communication</span>
                                    </div>
                                </div>

                                <div className="modal-footer d-flex justify-content-end" style={{ borderTop: "none", padding: "10px 24px 20px 24px" }}>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        style={{ backgroundColor: "#4f46e5", borderColor: "#4f46e5", borderRadius: "10px", padding: "8px 24px", fontWeight: 600, fontSize: "14px" }}
                                        onClick={() => setIsAnnouncementModalOpen(false)}>
                                        Got it
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    </>
                )}

                {/* Header Global Search Modal (Works across all pages) */}
        {isSearchOpen && (
            <>
            <div className="modal-backdrop fade show" style={{ zIndex: 9998, backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setIsSearchOpen(false)}></div>
            <div className="modal fade show d-block" id="edSearchModal" tabIndex="-1" role="dialog" style={{ zIndex: 9999 }} onClick={(e) => { if (e.target === e.currentTarget) setIsSearchOpen(false); }}>
                <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "600px" }}>
                    <div className="modal-content" style={{ borderRadius: "20px", border: "none", boxShadow: "0 20px 45px rgba(0,0,0,0.22)", backgroundColor: "#ffffff", overflow: "hidden" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
                            <i className="bi bi-search" style={{ fontSize: "18px", color: "#4f46e5" }}></i>
                            <input 
                                type="text" 
                                className="form-control border-0 shadow-none p-0" 
                                style={{ fontSize: "15px", fontWeight: 500 }}
                                placeholder="Search all pages, features, requests, or tools..."
                                value={headerSearchQuery}
                                onChange={(e) => setHeaderSearchQuery(e.target.value)}
                                autoFocus
                            />
                            {headerSearchQuery && (
                                <button 
                                    type="button" 
                                    className="btn btn-sm btn-link text-muted p-0 text-decoration-none" 
                                    onClick={() => setHeaderSearchQuery("")}
                                    style={{ fontSize: "14px" }}
                                >
                                    <i className="bi bi-x-circle-fill"></i>
                                </button>
                            )}
                            <button 
                                type="button" 
                                className="btn-close" 
                                style={{ fontSize: "11px" }} 
                                onClick={() => setIsSearchOpen(false)}
                            ></button>
                        </div>
                        <div style={{ maxHeight: "380px", overflowY: "auto", padding: "12px 14px" }}>
                            {(() => {
                                const q = headerSearchQuery.trim().toLowerCase();
                                const results = SEARCH_DIRECTORY.filter(item => {
                                    if (!q) return true;
                                    return (
                                        item.label.toLowerCase().includes(q) ||
                                        item.description.toLowerCase().includes(q) ||
                                        item.category.toLowerCase().includes(q) ||
                                        (item.keywords && item.keywords.some(k => k.toLowerCase().includes(q)))
                                    );
                                });

                                if (results.length === 0) {
                                    return (
                                        <div className="text-center py-4 text-muted">
                                            <i className="bi bi-search" style={{ fontSize: "24px", color: "#cbd5e1", display: "block", marginBottom: "8px" }}></i>
                                            <div style={{ fontSize: "14px", fontWeight: 600 }}>No results found</div>
                                            <div style={{ fontSize: "12.5px" }}>Try searching with keywords like &quot;leave&quot;, &quot;attendance&quot;, &quot;profile&quot;, &quot;request&quot; or &quot;document&quot;</div>
                                        </div>
                                    );
                                }

                                return results.map(item => (
                                    <div 
                                        key={item.id}
                                        onClick={() => {
                                            navigateTo(item.page);
                                            setIsSearchOpen(false);
                                            if (item.action === "open_policy") {
                                                setTimeout(() => setIsPolicyModalOpen(true), 150);
                                            }
                                        }}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "14px",
                                            padding: "10px 14px",
                                            borderRadius: "12px",
                                            cursor: "pointer",
                                            transition: "background-color 0.15s ease",
                                            marginBottom: "4px"
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                    >
                                        <div style={{
                                            width: "38px",
                                            height: "38px",
                                            borderRadius: "10px",
                                            backgroundColor: "#eef2ff",
                                            color: "#4f46e5",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "17px",
                                            flexShrink: 0
                                        }}>
                                            <i className={`bi ${item.icon}`}></i>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <span style={{ fontWeight: 600, fontSize: "14px", color: "#1e293b" }}>{item.label}</span>
                                                <span style={{ fontSize: "10.5px", fontWeight: 600, padding: "2px 7px", borderRadius: "6px", backgroundColor: "#f1f5f9", color: "#64748b" }}>{item.category}</span>
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.description}</div>
                                        </div>
                                        <i className="bi bi-chevron-right" style={{ color: "#94a3b8", fontSize: "13px" }}></i>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </div>
            </div>
            </>
        )}
        </div>
    </main>

    
    {/* Commented out Bottom-Right Spark Shortcuts Menu & Spark Nav as requested
    <button className="spark-menu" id="sparkMenu" aria-label="Open shortcuts">
        <span></span>
        <span></span>
        <span></span>
    </button>

    <div className="spark-nav" id="sparkNav">
        <a href="#">
            <i className="bi bi-person-plus-fill"></i>
            <b>Add Employee</b>
        </a>
        <a href="#">
            <i className="bi bi-calendar2-check-fill"></i>
            <b>Attendance</b>
        </a>
        <a href="#">
            <i className="bi bi-wallet2"></i>
            <b>Payroll</b>
        </a>
        <a href="#">
            <i className="bi bi-file-earmark-bar-graph-fill"></i>
            <b>Reports</b>
        </a>
        <a href="#">
            <i className="bi bi-bell-fill"></i>
            <b>Notifications</b>
        </a>
    </div>
    */}

    
    <footer className="footer">
        Copyright © 2026 Ramel Techno Solutions. All rights reserved.
    </footer>

    
    

    

    
    

    <HRAssistant currentUser={currentUser} employeeProfile={employeeProfile} mode="employee" />

    {/* Floating Real-time Push Notification Toast */}
    {pushToast && (
      <div 
        className="position-fixed bottom-0 end-0 p-3" 
        style={{ zIndex: 9999, maxWidth: "420px", width: "100%" }}
      >
        <div 
          className="card border-0 shadow-lg rounded-4 overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            color: "#fff",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)"
          }}
        >
          <div className="card-body p-3">
            <div className="d-flex align-items-start gap-3">
              <div 
                className="rounded-circle shrink-0"
                style={{
                  width: "42px",
                  height: "42px",
                  background: pushToast.title?.toLowerCase().includes("approved") 
                    ? "rgba(16, 185, 129, 0.25)" 
                    : pushToast.title?.toLowerCase().includes("rejected")
                      ? "rgba(239, 68, 68, 0.25)"
                      : "rgba(59, 130, 246, 0.25)",
                  color: pushToast.title?.toLowerCase().includes("approved")
                    ? "#10b981"
                    : pushToast.title?.toLowerCase().includes("rejected")
                      ? "#ef4444"
                      : "#60a5fa",
                  fontSize: "1.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <i className={`bi ${pushToast.title?.toLowerCase().includes("approved") ? "bi-check-circle-fill" : pushToast.title?.toLowerCase().includes("rejected") ? "bi-x-circle-fill" : "bi-bell-fill"}`}></i>
              </div>

              <div className="flex-grow-1 min-w-0">
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <span className="badge rounded-pill" style={{ background: "rgba(255, 255, 255, 0.15)", fontSize: "10px", letterSpacing: "0.5px" }}>
                    NOTIFICATION
                  </span>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white" 
                    style={{ fontSize: "10px" }}
                    onClick={() => setPushToast(null)}
                    aria-label="Close"
                  ></button>
                </div>
                <h6 className="mb-1 fw-bold text-white text-truncate" style={{ fontSize: "13.5px" }}>
                  {pushToast.title}
                </h6>
                <p className="mb-2 text-white-50" style={{ fontSize: "12px", lineHeight: "1.4" }}>
                  {pushToast.message}
                </p>
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-light rounded-pill px-3 py-1 fw-semibold"
                    style={{ fontSize: "12px" }}
                    onClick={(e) => {
                      handleMarkAsRead(pushToast.id, e);
                      navigateTo("notifications");
                    }}
                  >
                    Mark as read
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-white-50 text-decoration-none p-0 ms-2"
                    style={{ fontSize: "12px" }}
                    onClick={() => {
                      setPushToast(null);
                      navigateTo("notifications");
                    }}
                  >
                    View all
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Team Colleague Chat Modal */}
    <TeamChatModal
      isOpen={!!activeChatUser}
      onClose={() => setActiveChatUser(null)}
      targetUser={activeChatUser}
      currentUser={currentUser}
      currentEmployee={myTeamData.currentEmployee}
      employeeProfile={employeeProfile}
    />

    </div>
  );
}

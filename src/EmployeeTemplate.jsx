import React, { useState, useEffect } from "react";
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
import HRAssistant from "./components/HRAssistant";

const SHORTCUT_CONFIG = {
  "dashboard": { id: "dashboard", label: "Employee Dashboard", description: "Your workspace overview", icon: "bi-grid", color: "blue", page: "index" },
  "apply-leave": { id: "apply-leave", label: "Apply Leave", description: "Request time off", icon: "bi-calendar-plus", color: "purple", page: "leaves" },
  "attendance": { id: "attendance", label: "Attendance", description: "View attendance", icon: "bi-calendar-check", color: "blue", page: "attendance" },
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
  attendanceLoading, handleCheckIn, handleCheckOut, fetchAttendance, employeeProfile, fetchEmployeeProfile, attendanceStats, fetchAttendanceStats
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState("index");
  const [statsPeriod, setStatsPeriod] = useState("week");
  const [leavesData, setLeavesData] = useState({ balances: [], requests: [] });
  const [assetRequests, setAssetRequests] = useState([]);
  const [attendanceCorrections, setAttendanceCorrections] = useState([]);
  const [employeeRequests, setEmployeeRequests] = useState([]);
  const [widgetsData, setWidgetsData] = useState({ nextHoliday: null, upcomingBirthday: null, upcomingAnniversary: null });
  const [todayWorkMode, setTodayWorkMode] = useState(employeeProfile?.work_mode || '');
  const [selectedShortcutIds, setSelectedShortcutIds] = useState([]);
  const [shortcutsLoading, setShortcutsLoading] = useState(true);

  const API_BASE = import.meta.env.VITE_API_URL || "https://hrms-backend-f2ef.onrender.com";
  const rawAvatar = employeeProfile?.profile_pic || employeeProfile?.avatar_url || "";
  const dynamicAvatarUrl = rawAvatar
    ? (/^https?:\/\//i.test(rawAvatar) ? rawAvatar : `${API_BASE}/${rawAvatar.replace(/^\/+/, "")}`)
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
  }, [currentUser?.id, employeeProfile?.employee_id]);

  // Page key to URL path mapping
  const pageToPath = {
    "index": "/",
    "employee-profile": "/employee-profile",
    "employement-details": "/employment-details",
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
    "/employee-profile": "employee-profile",
    "/employment-details": "employement-details",
    "/documents": "documents",
    "/skills-certifications": "skills-certifications",
    "/employee-requests": "employee-requests",
    "/attendance": "attendance",
    "/leave": "leaves",
    "/expenses": "expenses",
    "/assets": "assets",
    "/access-accounts": "access-accounts",
    "/calendar": "calendar",
    "/notifications": "notifications",
    "/settings": "settings",
    "/exit-management": "exit-management",
  };

  // Navigate helper: sets page, closes Bootstrap offcanvas + backdrop, updates URL
  const navigateTo = (page) => {
    setActivePage(page);
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
    const path = window.location.pathname;
    const page = pathToPage[path];
    if (page) {
      setActivePage(page);
    }
    const handlePopState = (e) => {
      const p = window.location.pathname;
      const pg = pathToPage[p] || "index";
      setActivePage(pg);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);



    useEffect(() => {
        if (currentUser?.id) {
            fetch(`${API_BASE}/api/dashboard/widgets/${currentUser.id}`)
                .then(res => res.json())
                .then(data => {
                    if (!data.error) setWidgetsData(data);
                })
                .catch(console.error);
        }
    }, [currentUser]);

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

  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || "https://hrms-backend-f2ef.onrender.com"}/api/admin/employees?orgId=1`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Exclude duplicates and current user, take up to 4
          const seen = new Set();
          const filtered = [];
          data.forEach(emp => {
            if (emp.email && !seen.has(emp.email) && emp.email.toLowerCase() !== (currentUser?.email || '').toLowerCase()) {
              seen.add(emp.email);
              filtered.push(emp);
            }
          });
          setTeamMembers(filtered.slice(0, 4));
        }
      })
      .catch(console.error);
  }, [currentUser]);

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

  const dashNextHoliday = finalHolidays
      .filter(h => new Date(h.holiday_date) >= today)
      .sort((a,b) => new Date(a.holiday_date) - new Date(b.holiday_date))[0] || widgetsData.nextHoliday;


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
                  <span onClick={() => navigateTo("index")} className="menu-item" style={{cursor:"pointer"}}>
                      <i className="bi bi-grid"></i>
                      <span>Employee Dashboard</span>
                  </span>

                  <span className="menu-label" style={{ fontSize: '11px', fontWeight: 700, color: '#8a90a2', marginLeft: '22px', marginBottom: '8px', display: 'block', marginTop: '24px', letterSpacing: '0.5px' }}>EMPLOYEE INFORMATION</span>
                  <span onClick={() => navigateTo("employee-profile")} className="menu-item" style={{cursor:"pointer"}}>
                      <i className="bi bi-person-vcard"></i>
                      <span>Employee Profile</span>
                  </span>
                  <span onClick={() => navigateTo("employement-details")} className="menu-item" style={{cursor:"pointer"}}>
                      <i className="bi bi-briefcase"></i>
                      <span>Employment Details</span>
                  </span>
                  <span onClick={() => navigateTo("documents")} className="menu-item" style={{cursor:"pointer"}}>
                      <i className="bi bi-folder2-open"></i>
                      <span>Documents</span>
                  </span>
                  <span onClick={() => navigateTo("skills-certifications")} className="menu-item" style={{cursor:"pointer"}}>
                      <i className="bi bi-award"></i>
                      <span>Skills & Certifications</span>
                  </span>
                  <span onClick={() => navigateTo("employee-requests")} className="menu-item" style={{cursor:"pointer"}}>
                      <i className="bi bi-chat-text"></i>
                      <span>Employee Requests</span>
                  </span>

                  <span className="menu-label" style={{ fontSize: '11px', fontWeight: 700, color: '#8a90a2', marginLeft: '22px', marginBottom: '8px', display: 'block', marginTop: '24px', letterSpacing: '0.5px' }}>ATTENDANCE & LEAVE</span>
                  <span onClick={() => navigateTo("attendance")} className="menu-item" style={{cursor:"pointer"}}>
                      <i className="bi bi-clock-history"></i>
                      <span>Attendance</span>
                  </span>
                  <span onClick={() => navigateTo("leaves")} className="menu-item" style={{cursor:"pointer"}}>
                      <i className="bi bi-calendar2-minus"></i>
                      <span>Leave</span>
                  </span>

                  {/*
                  <span className="menu-label" style={{ fontSize: '11px', fontWeight: 700, color: '#8a90a2', marginLeft: '22px', marginBottom: '8px', display: 'block', marginTop: '24px', letterSpacing: '0.5px' }}>FINANCE & CLAIMS</span>
                  <span onClick={() => navigateTo("expenses")} className="menu-item" style={{cursor:"pointer"}}>
                      <i className="bi bi-wallet2"></i>
                      <span>Expenses & Claims</span>
                  </span>
                  */}

                  <span className="menu-label" style={{ fontSize: '11px', fontWeight: 700, color: '#8a90a2', marginLeft: '22px', marginBottom: '8px', display: 'block', marginTop: '24px', letterSpacing: '0.5px' }}>COMPANY RESOURCES</span>
                  <span onClick={() => navigateTo("assets")} className="menu-item" style={{cursor:"pointer"}}>
                      <i className="bi bi-laptop"></i>
                      <span>Assets</span>
                  </span>
                  {/*
                  <span onClick={() => navigateTo("access-accounts")} className="menu-item" style={{cursor:"pointer"}}>
                      <i className="bi bi-shield-lock"></i>
                      <span>Access & Accounts</span>
                  </span>
                  */}

                  <span className="menu-label" style={{ fontSize: '11px', fontWeight: 700, color: '#8a90a2', marginLeft: '22px', marginBottom: '8px', display: 'block', marginTop: '24px', letterSpacing: '0.5px' }}>COMMUNICATION</span>
                  <span onClick={() => navigateTo("calendar")} className="menu-item" style={{cursor:"pointer"}}>
                      <i className="bi bi-calendar-date"></i>
                      <span>Calendar</span>
                  </span>
                  <span onClick={() => navigateTo("notifications")} className="menu-item" style={{cursor:"pointer"}}>
                      <i className="bi bi-bell"></i>
                      <span>Notifications</span>
                  </span>
                  <span onClick={() => navigateTo("settings")} className="menu-item" style={{cursor:"pointer"}}>
                      <i className="bi bi-gear"></i>
                      <span>Settings</span>
                  </span>

                  <span className="menu-label" style={{ fontSize: '11px', fontWeight: 700, color: '#8a90a2', marginLeft: '22px', marginBottom: '8px', display: 'block', marginTop: '24px', letterSpacing: '0.5px' }}>EMPLOYEE EXIT</span>
                  <span onClick={() => navigateTo("exit-management")} className="menu-item" style={{cursor:"pointer"}}>
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


                        <button className="header-action">
                            <i className="bi bi-search"></i>
                        </button>


                        <button className="header-action" onClick={() => navigateTo("notifications")}>

                            <i className="bi bi-bell"></i>

                            <span className="notification-dot"></span>

                        </button>


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
                                    <span className="dashboard-eyebrow">
                                        EMPLOYEE DASHBOARD
                                    </span>

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

                        <div className="es-profile-completion">
                            <div className="es-completion-top">
                                <span>Profile Completion</span>
                                <strong>{employeeProfile?.profile_completion_percentage || 85}%</strong>
                            </div>
                            <div className="progress es-progress">
                                <div className="progress-bar" style={{width: (employeeProfile?.profile_completion_percentage || 85) + "%"}}></div>
                            </div>
                            <small>Complete your remaining profile details.</small>
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
                                            data-work-location="office" aria-label="Office, WFO">
                                            <i className="bi bi-geo-alt-fill" aria-hidden="true"></i>
                                            <span id="edWorkLocationLabel">{employeeProfile?.city || "Office"}</span>
                                            <strong id="edWorkMode">{todayWorkMode || employeeProfile?.work_mode || "Hybrid"}</strong>
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
                                        <button type="button" className="ed-checkin-btn" id="edCheckInBtn" onClick={handleCheckIn} disabled={attendanceLoading || attendanceStatus === "Checked In" || attendanceStatus === "Checked Out"}><i className="bi bi-box-arrow-in-right"></i>{attendanceLoading && attendanceStatus !== "Checked In" ? "..." : "Check In"}</button>

                                        <button type="button" className="ed-checkout-btn" id="edCheckOutBtn" onClick={handleCheckOut} disabled={attendanceLoading || attendanceStatus !== "Checked In"}><i className="bi bi-box-arrow-right"></i>{attendanceLoading && attendanceStatus === "Checked In" ? "..." : "Check Out"}</button>
                                    </div>

                                    <div className="ed-attendance-footer">

                                        <div>
                                            <span>Check In</span>
                                            <strong id="edCheckInTime">{checkInTime}</strong>
                                        </div>

                                        <div>
                                            <span>Check Out</span>
                                            <strong id="edCheckOutTime">{checkOutTime}</strong>
                                        </div>

                                        <div>
                                            <span>Break</span>
                                            <strong>1 hour</strong>
                                        </div>

                                                                                                                </div>
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
        <button className="ed-text-action" onClick={(e) => { e.preventDefault(); navigateTo("calendar"); }}>
            View All
            <i className="bi bi-arrow-up-right"></i>
        </button>
    </div>
    <div className="row g-3">
        <div className="col-md-6">
            <div className="ed-celebration-card">
                <div className="ed-celebration-avatar">
                    <img src="https://i.pravatar.cc/100?img=49" alt="Employee" />
                </div>
                <div className="ed-celebration-content">
                    <span className="ed-celebration-type">
                        <i className="bi bi-balloon-heart"></i>
                        Birthday
                    </span>
                    <strong>{widgetsData.upcomingBirthday ? widgetsData.upcomingBirthday.name : "No Birthdays"}</strong>
                    <small>{widgetsData.upcomingBirthday ? new Date(widgetsData.upcomingBirthday.date).toLocaleDateString('en-GB', {day: '2-digit', month: 'long'}) : "--"}</small>
                    <button disabled={!widgetsData.upcomingBirthday}>
                        <i className="bi bi-send"></i>
                        Send wishes
                    </button>
                </div>
            </div>
        </div>
        <div className="col-md-6">
            <div className="ed-celebration-card">
                <div className="ed-celebration-avatar ed-anniversary">
                    <i className="bi bi-award"></i>
                </div>
                <div className="ed-celebration-content">
                    <span className="ed-celebration-type">
                        <i className="bi bi-stars"></i>
                        Work Anniversary
                    </span>
                    <strong>{widgetsData.upcomingAnniversary ? widgetsData.upcomingAnniversary.name : "No Anniversaries"}</strong>
                    <small>{widgetsData.upcomingAnniversary ? `${new Date(widgetsData.upcomingAnniversary.date).toLocaleDateString('en-GB', {day: '2-digit', month: 'long'})} - ${widgetsData.upcomingAnniversary.years} Years` : "--"}</small>
                    <button disabled={!widgetsData.upcomingAnniversary}>
                        <i className="bi bi-send"></i>
                        Send wishes
                    </button>
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
        <span>
            {dashNextHoliday ? (
                <>
                    <i className="bi bi-calendar-event"></i>
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
                                            <div style={{ padding: '24px 0', textAlign: 'center', color: '#85889b', fontSize: '13px' }}>
                                                <i className="bi bi-inbox" style={{ fontSize: '28px', display: 'block', marginBottom: '8px', color: '#b0b3c6' }}></i>
                                                No recent requests found.
                                            </div>
                                        )}
                                    </div>

                                </div>

                            </div>


                            
                            <div className="col-xl-5">

                                <div className="ed-announcement-panel">

                                    <div className="ed-announcement-top">
                                        <div className="ed-announcement-icon">
                                            <i className="bi bi-megaphone-fill"></i>
                                        </div>

                                        <span>HR ANNOUNCEMENT</span>
                                    </div>

                                    <h3>Quarterly Town Hall</h3>

                                    <p>
                                        Join the upcoming employee town hall to hear company
                                        updates, achievements and what's coming next.
                                    </p>

                                    <div className="ed-announcement-meta">
                                        <span>
                                            <i className="bi bi-calendar3"></i>
                                            25 Sep 2026
                                        </span>

                                        <span>
                                            <i className="bi bi-clock"></i>
                                            4:00 PM
                                        </span>
                                    </div>

                                    <button>
                                        Read announcement
                                        <i className="bi bi-arrow-up-right"></i>
                                    </button>

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
                                            <span className="ed-card-kicker">MY TEAM</span>
                                            <h3>People around you</h3>
                                        </div>

                                        <button
                                            className="ed-text-action">
                                            View Team
                                            <i className="bi bi-arrow-up-right"></i>
                                        </button>
                                    </div>

                                    <div className="ed-team-list">
                                        {(teamMembers.length > 0 ? teamMembers : [
                                            { id: 4, full_name: "Priya Sharma", designation: "QA Automation Engineer", status: "Active" },
                                            { id: 3, full_name: "Yash Raj", designation: "Software Engineer", status: "Active" },
                                            { id: 5, full_name: "Rahul Verma", designation: "Associate Specialist", status: "Active" },
                                        ]).map((member, idx) => (
                                            <div className="ed-team-member" key={member.id || idx}>
                                                <div className="ed-team-avatar">
                                                    <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: ["#ede9fe", "#e0f2fe", "#fef3c7", "#dcfce7"][idx % 4], color: ["#6366f1", "#0284c7", "#d97706", "#16a34a"][idx % 4], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px" }}>
                                                        {(member.full_name || "EM").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <span></span>
                                                </div>

                                                <div className="ed-team-info">
                                                    <strong>{member.full_name || member.email}</strong>
                                                    <span>{member.designation || member.role_name || "Engineering"}</span>
                                                </div>

                                                <div className="ed-team-status">
                                                    <span className="ed-status-present">{member.status || "Active"}</span>
                                                </div>

                                                <button className="ed-team-action">
                                                    <i className="bi bi-chat"></i>
                                                </button>
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

                                        <span className="ed-unread-count">3 New</span>
                                    </div>

                                    <div className="ed-notification-list">

                                        <div className="ed-notification-item ed-unread">
                                            <div className="ed-notification-icon ed-notify-purple">
                                                <i className="bi bi-calendar-check"></i>
                                            </div>

                                            <div>
                                                <strong>Leave approved</strong>
                                                <p>Your leave request for 02 Oct has been approved.</p>
                                                <small>12 minutes ago</small>
                                            </div>

                                            <span className="ed-notification-new"></span>
                                        </div>


                                        <div className="ed-notification-item ed-unread">
                                            <div className="ed-notification-icon ed-notify-blue">
                                                <i className="bi bi-megaphone"></i>
                                            </div>

                                            <div>
                                                <strong>New HR announcement</strong>
                                                <p>Quarterly employee town hall is scheduled for Friday.</p>
                                                <small>2 hours ago</small>
                                            </div>

                                            <span className="ed-notification-new"></span>
                                        </div>


                                        <div className="ed-notification-item ed-unread">
                                            <div className="ed-notification-icon ed-notify-orange">
                                                <i className="bi bi-file-earmark-text"></i>
                                            </div>

                                            <div>
                                                <strong>Document verification</strong>
                                                <p>Your ID proof is waiting for verification.</p>
                                                <small>Yesterday</small>
                                            </div>

                                            <span className="ed-notification-new"></span>
                                        </div>


                                        <div className="ed-notification-item">
                                            <div className="ed-notification-icon ed-notify-green">
                                                <i className="bi bi-person-check"></i>
                                            </div>

                                            <div>
                                                <strong>Profile updated</strong>
                                                <p>Your employment information was updated successfully.</p>
                                                <small>2 days ago</small>
                                            </div>
                                        </div>

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

                                    <button>
                                        View Policy
                                        <i className="bi bi-arrow-right"></i>
                                    </button>

                                </div>

                            </div>

                        </div>

                    </section>

                </div>


                

                
                <div className="modal fade" id="edLeavePolicyModal" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content ed-modal-content">

                            <div className="modal-header">
                                <div>
                                    <span className="ed-modal-label">HR POLICY</span>
                                    <h5 className="modal-title">Leave Policy</h5>
                                </div>

                                <button
                                    type="button"
                                    className="btn-close"
                                    data-bs-dismiss="modal">
                                </button>
                            </div>

                            <div className="modal-body">

                                <div className="ed-policy-grid">

                                    <div className="ed-policy-item">
                                        <i className="bi bi-calendar-heart"></i>
                                        <strong>Annual Leave</strong>
                                        <span>18 days per year</span>
                                    </div>

                                    <div className="ed-policy-item">
                                        <i className="bi bi-heart-pulse"></i>
                                        <strong>Sick Leave</strong>
                                        <span>10 days per year</span>
                                    </div>

                                    <div className="ed-policy-item">
                                        <i className="bi bi-calendar2-event"></i>
                                        <strong>Casual Leave</strong>
                                        <span>7 days per year</span>
                                    </div>

                                    <div className="ed-policy-item">
                                        <i className="bi bi-arrow-repeat"></i>
                                        <strong>Carry Forward</strong>
                                        <span>Up to 5 annual days</span>
                                    </div>

                                </div>

                                <div className="ed-policy-text">
                                    <h6>Important Guidelines</h6>

                                    <ul>
                                        <li>Leave should be requested before the planned absence.</li>
                                        <li>Unplanned absence should be communicated to the reporting manager.</li>
                                        <li>Supporting documents may be required for certain leave types.</li>
                                        <li>Leave approval depends on business and team requirements.</li>
                                    </ul>
                                </div>

                            </div>

                            <div className="modal-footer">
                                <button
                                    className="btn btn-light"
                                    data-bs-dismiss="modal">
                                    Close
                                </button>

                                <button
                                    className="ed-modal-primary-btn">
                                    Apply Leave
                                    <i className="bi bi-arrow-right"></i>
                                </button>
                            </div>

                        </div>
                    </div>
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
{activePage === "employee-profile" && <EmployeeProfile currentUser={currentUser} employeeProfile={employeeProfile} onProfileUpdate={fetchEmployeeProfile} />}
{activePage === "employement-details" && <EmploymentDetails employeeProfile={employeeProfile} currentUser={currentUser} onProfileUpdate={fetchEmployeeProfile} />}
{activePage === "documents" && <Documents employeeProfile={employeeProfile} currentUser={currentUser} />}
{activePage === "skills-certifications" && <SkillsCertifications employeeProfile={employeeProfile} currentUser={currentUser} />}
{activePage === "attendance" && <Attendance currentUser={currentUser} employeeProfile={employeeProfile} onNavigate={navigateTo} />}
{activePage === "leaves" && <Leaves currentUser={currentUser} employeeProfile={employeeProfile} />}
{activePage === "expenses" && <Expenses currentUser={currentUser} employeeProfile={employeeProfile} onNavigate={navigateTo} />}
{activePage === "assets" && <Assets employeeProfile={employeeProfile} currentUser={currentUser} />}
{activePage === "access-accounts" && <AccessAccounts employeeProfile={employeeProfile} />}
{activePage === "notifications" && <Notifications currentUser={currentUser} employeeProfile={employeeProfile} />}
{activePage === "settings" && <Settings employeeProfile={employeeProfile} currentUser={currentUser} onProfileUpdate={fetchEmployeeProfile} />}
{activePage === "exit-management" && <ExitManagement employeeProfile={employeeProfile} currentUser={currentUser} onNavigate={navigateTo} />}
{activePage === "employee-requests" && <EmployeeRequests employeeProfile={employeeProfile} currentUser={currentUser} />}
{activePage === "calendar" && <Calendar employeeProfile={employeeProfile} currentUser={currentUser} />}
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

    
    

    

    
    

    <HRAssistant currentUser={currentUser} employeeProfile={employeeProfile} />

    </div>
  );
}

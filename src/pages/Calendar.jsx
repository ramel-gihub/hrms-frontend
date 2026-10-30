import React, { useState, useEffect, useMemo } from "react";
import EmptyState from "../components/EmptyState";
import TeamChatModal from "../components/TeamChatModal";

const API_BASE = import.meta.env.VITE_API_URL || "https://hrms-backend-5xo8.onrender.com";

export default function Calendar({ employeeProfile, currentUser, initialTab = "calendar" }) {
  const profile = employeeProfile || {};
  const [activeTab, setActiveTab] = useState(initialTab || "calendar");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      if (initialTab === "overview") {
        setTimeout(() => {
          const el = document.getElementById("calendarTeamDirectory");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 150);
      }
    }
  }, [initialTab]);
  
  const [holidays, setHolidays] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [upcomingHolidays, setUpcomingHolidays] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [myTeamData, setMyTeamData] = useState({ teams: [], currentEmployee: null });
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({ title: '', list: [] });

  const [sentWishes, setSentWishes] = useState({});
  const [sendingWishId, setSendingWishId] = useState(null);
  const [wishToast, setWishToast] = useState(null);

  const handleSendWish = async (user, type) => {
    if (!user || !currentUser?.id) return;
    const wishKey = `${type}-${user.id || user.userId || user.name}`;
    if (sentWishes[wishKey] || sendingWishId === wishKey) return;

    setSendingWishId(wishKey);
    try {
      const res = await fetch(`${API_BASE}/api/celebrations/send-wishes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderUserId: currentUser.id,
          recipientEmployeeId: user.employeeId || user.id,
          recipientUserId: user.userId,
          type
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSentWishes(prev => ({ ...prev, [wishKey]: true }));
        setWishToast({
          title: type === 'birthday' ? "🎂 Birthday Wishes Sent!" : "🌟 Work Anniversary Wishes Sent!",
          message: data.message || `Wishes sent to ${user.name}!`
        });
        setTimeout(() => setWishToast(null), 6000);
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

  useEffect(() => {
    const uid = currentUser?.id || profile.user_id || 1; 
    const eid = profile.employee_id || 1;

    const targetOrgId = currentUser?.tenant?.id || currentUser?.organization_id || profile?.organization_id || 1;
    // Fetch My Teams (DB-based project teams for the employee)
    const myTeamsUid = currentUser?.id || profile.user_id;
    if (myTeamsUid) {
      fetch(`${API_BASE}/api/employee/my-teams/${myTeamsUid}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.success) {
            setMyTeamData({
              teams: data.teams || [],
              currentEmployee: data.currentEmployee || null
            });
          }
        })
        .catch(console.error);
    }
    // Fetch Celebrations with profile pictures
    fetch(`${API_BASE}/api/celebrations?orgId=${targetOrgId}`)
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data) && data.length > 0) {
                const mappedUsers = data.map(u => ({
                    id: u.id,
                    employeeId: u.id,
                    userId: u.user_id,
                    name: u.name || 'Employee',
                    profilePic: u.profile_pic || null,
                    dob: u.dob,
                    doj: u.doj,
                    department: u.department,
                    designation: u.designation
                }));
                setAllUsers(mappedUsers);
            }
        })
        .catch(() => {
            fetch(`${API_BASE}/api/admin/employees?orgId=${targetOrgId}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        const mappedUsers = data.map(u => ({
                            id: u.id,
                            employeeId: u.id,
                            userId: u.user_id,
                            name: u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Employee',
                            profilePic: u.profile_pic || u.avatar_url || null,
                            dob: u.date_of_birth,
                            doj: u.joining_date,
                            department: u.department,
                            designation: u.designation
                        }));
                        setAllUsers(mappedUsers);
                    }
                })
                .catch(console.error);
        });

    if (uid) {
        // Fetch Holidays (the widgets endpoint still returns allHolidays safely)
        fetch(`${API_BASE}/api/dashboard/widgets/${uid}`)
            .then(res => res.json())
            .then(data => {
                if (data.allHolidays) {
                    const finalHolidays = data.allHolidays || [];
                    setHolidays(finalHolidays);
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const upcoming = finalHolidays.filter(h => {
                      if (!h.holiday_date) return false;
                      const p = parseDateParts(h.holiday_date);
                      const d = p ? new Date(p.year, p.month, p.day) : new Date(h.holiday_date);
                      d.setHours(0,0,0,0);
                      return d >= today;
                    }).sort((a,b) => new Date(a.holiday_date) - new Date(b.holiday_date));
                    setUpcomingHolidays(upcoming);
                }
                if (data.allCelebrationUsers && Array.isArray(data.allCelebrationUsers) && data.allCelebrationUsers.length > 0) {
                    setAllUsers(data.allCelebrationUsers);
                }
            })
            .catch(console.error);

        // Fetch Leaves using UID (backend expects user_id for /api/leaves/data/)
        fetch(`${import.meta.env.VITE_API_URL || "https://hrms-backend-5xo8.onrender.com"}/api/leaves/data/${uid}`)
            .then(res => res.json())
            .then(data => {
                if (data.requests) {
                    setLeaves(data.requests.filter(r => r.status === 'Approved' || r.status === 'Pending'));
                }
            })
            .catch(console.error);
    }
  }, [profile, currentUser]);

    // Compute team directory members based on assigned project teams (or self if unmapped)
  const teamDirectoryMembers = useMemo(() => {
    const teams = myTeamData.teams || [];
    if (teams.length === 0) {
      const emp = myTeamData.currentEmployee || profile || currentUser;
      const empName = emp?.employee_name || emp?.full_name || (emp?.first_name ? `${emp.first_name} ${emp.last_name || ''}`.trim() : null) || emp?.name || 'You';
      return [{
        id: emp?.id || 1,
        name: empName,
        designation: emp?.designation || 'Team Member',
        is_current_user: true,
        is_lead: false,
        note: 'No team assigned yet'
      }];
    }

    const memberMap = new Map();
    teams.forEach(t => {
      (t.members || []).forEach(m => {
        if (!memberMap.has(m.employee_id)) {
          memberMap.set(m.employee_id, {
            id: m.employee_id,
            name: m.employee_name,
            designation: m.designation || 'Team Member',
            department: m.department,
            email: m.email,
            is_current_user: m.is_current_user,
            is_lead: m.role_in_team === 'Lead' || m.employee_id === t.team_lead_id,
            projects: [t.project_name]
          });
        } else {
          const existing = memberMap.get(m.employee_id);
          if (!existing.projects.includes(t.project_name)) {
            existing.projects.push(t.project_name);
          }
          if (m.role_in_team === 'Lead' || m.employee_id === t.team_lead_id) {
            existing.is_lead = true;
          }
        }
      });
    });

    return Array.from(memberMap.values()).map(m => ({
      ...m,
      project_names: m.projects.join(', ')
    }));
  }, [myTeamData, profile, currentUser]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const grid = [];
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = firstDay - 1; i >= 0; i--) {
    grid.push({ date: new Date(year, month - 1, prevMonthDays - i), isOtherMonth: true });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    grid.push({ date: new Date(year, month, i), isOtherMonth: false });
  }
  const totalCells = Math.ceil(grid.length / 7) * 7;
  const nextDays = totalCells - grid.length;
  for (let i = 1; i <= nextDays; i++) {
    grid.push({ date: new Date(year, month + 1, i), isOtherMonth: true });
  }

    // Timezone-safe date parser
  const parseDateParts = (val) => {
    if (!val) return null;
    if (typeof val === 'string') {
      const match = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        return { year: parseInt(match[1], 10), month: parseInt(match[2], 10) - 1, day: parseInt(match[3], 10) };
      }
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  };

  const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  
  const isDateBetween = (date, start, end) => {
    const d = new Date(date).setHours(0,0,0,0);
    const s = new Date(start).setHours(0,0,0,0);
    const e = new Date(end).setHours(0,0,0,0);
    return d >= s && d <= e;
  };

  const renderEvents = (date) => {
    const events = [];
    
    // 1. Public Holiday event
    const hol = holidays.find(h => {
      if (!h.holiday_date) return false;
      const p = parseDateParts(h.holiday_date);
      return p && p.year === date.getFullYear() && p.month === date.getMonth() && p.day === date.getDate();
    });
    if (hol) {
        events.push(
            <div key={`hol-${hol.id || hol.holiday_name}`} className="calendar-event holiday" title={`Holiday: ${hol.holiday_name}`} onClick={() => { setModalData({ title: 'Public Holiday', type: 'holiday', holidayName: hol.holiday_name, holidayDate: hol.holiday_date, list: [hol.holiday_name] }); setShowModal(true); }} style={{cursor: 'pointer'}}>
                <i className="bi bi-flag-fill" style={{fontSize: '11px', color: '#b96816', marginRight: '4px'}}></i>
                <span>{hol.holiday_name}</span>
            </div>
        );
    }

    // 2. Birthday event (from employee_personal_info.date_of_birth)
    const dayBdays = allUsers.filter(u => {
      if (!u.dob) return false;
      const p = parseDateParts(u.dob);
      return p && p.day === date.getDate() && p.month === date.getMonth();
    });

    dayBdays.forEach((b, idx) => {
      events.push(
        <div
          key={`bday-${idx}-${b.name}`}
          className="calendar-event birthday"
          title={`🎂 Birthday: ${b.name}`}
          onClick={() => {
            setModalData({
              title: "Birthday Celebration",
              type: "birthday",
              personName: b.name,
              eventDate: date,
              list: [b.name]
            });
            setShowModal(true);
          }}
          style={{
            cursor: "pointer",
            backgroundColor: "#fff0f6",
            color: "#c026d3",
            borderLeft: "3px solid #d946ef",
            padding: "2px 6px",
            borderRadius: "4px",
            fontSize: "11px",
            fontWeight: 600,
            marginTop: "2px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}
        >
          <i className="bi bi-gift-fill" style={{ fontSize: "10px", color: "#d946ef" }}></i>
          <span>{b.name}'s Birthday</span>
        </div>
      );
    });

    // 3. Work Anniversary event (from employee_employment_details.joining_date)
    const dayAnnivs = allUsers.filter(u => {
      if (!u.doj) return false;
      const p = parseDateParts(u.doj);
      return p && p.day === date.getDate() && p.month === date.getMonth();
    });

    dayAnnivs.forEach((a, idx) => {
      const p = parseDateParts(a.doj);
      const joinYear = p ? p.year : new Date(a.doj).getFullYear();
      const yrs = date.getFullYear() - joinYear;
      const label = yrs > 0 ? `${yrs}y Anniv: ${a.name}` : `Joined: ${a.name}`;
      events.push(
        <div
          key={`anniv-${idx}-${a.name}`}
          className="calendar-event anniversary"
          title={`🏅 Work Anniversary: ${a.name} (${yrs > 0 ? `${yrs} Years` : 'Joined'})`}
          onClick={() => {
            setModalData({
              title: "Work Anniversary",
              type: "anniversary",
              personName: a.name,
              years: yrs,
              eventDate: date,
              list: [yrs > 0 ? `${a.name} (${yrs} Years)` : `${a.name} (Joined)`]
            });
            setShowModal(true);
          }}
          style={{
            cursor: "pointer",
            backgroundColor: "#fefce8",
            color: "#ca8a04",
            borderLeft: "3px solid #eab308",
            padding: "2px 6px",
            borderRadius: "4px",
            fontSize: "11px",
            fontWeight: 600,
            marginTop: "2px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}
        >
          <i className="bi bi-award-fill" style={{ fontSize: "10px", color: "#eab308" }}></i>
          <span>{label}</span>
        </div>
      );
    });

    return events;
  };

  const monthName = currentMonth.toLocaleDateString('en-GB', {month: 'long'});
  const yearName = currentMonth.getFullYear();

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0,0,0,0);
    return t;
  }, []);
  const currentCalendarYear = currentMonth.getFullYear();

  // Helper arrays for Overview Tab & Send Wishes Tab (Birthdays & Work Anniversaries)
  const thisMonthBdays = useMemo(() => {
    return allUsers
      .filter(u => {
        if (!u.dob) return false;
        const p = parseDateParts(u.dob);
        return p && p.month === month;
      })
      .map(u => {
        const p = parseDateParts(u.dob);
        const bdayDate = new Date(year, month, p.day);
        const daysUntil = Math.ceil((bdayDate - today) / (1000 * 60 * 60 * 24));
        return {
          ...u,
          day: p.day,
          date: bdayDate,
          daysUntil
        };
      })
      .sort((a, b) => a.day - b.day);
  }, [allUsers, month, year, today]);

  const thisMonthAnnivs = useMemo(() => {
    return allUsers
      .filter(u => {
        if (!u.doj) return false;
        const p = parseDateParts(u.doj);
        return p && p.month === month;
      })
      .map(u => {
        const p = parseDateParts(u.doj);
        const annivDate = new Date(year, month, p.day);
        const daysUntil = Math.ceil((annivDate - today) / (1000 * 60 * 60 * 24));
        const joinYear = p.year || new Date(u.doj).getFullYear();
        const years = year - joinYear;
        return {
          ...u,
          day: p.day,
          date: annivDate,
          years: years > 0 ? years : 1,
          daysUntil
        };
      })
      .sort((a, b) => a.day - b.day);
  }, [allUsers, month, year, today]);

  // Send Wishes Tab Pagination
  const [bdayPage, setBdayPage] = useState(1);
  const [bdayPerPage, setBdayPerPage] = useState(5);
  const [annivPage, setAnnivPage] = useState(1);
  const [annivPerPage, setAnnivPerPage] = useState(5);

  useEffect(() => {
    setBdayPage(1);
    setAnnivPage(1);
  }, [currentMonth]);

  const totalBdayPages = Math.ceil(thisMonthBdays.length / bdayPerPage) || 1;
  const currentBdayPage = Math.min(bdayPage, totalBdayPages);
  const paginatedBdays = useMemo(() => {
    const start = (currentBdayPage - 1) * bdayPerPage;
    return thisMonthBdays.slice(start, start + bdayPerPage);
  }, [thisMonthBdays, currentBdayPage, bdayPerPage]);
  const bdayStartIndex = thisMonthBdays.length === 0 ? 0 : (currentBdayPage - 1) * bdayPerPage + 1;
  const bdayEndIndex = Math.min(currentBdayPage * bdayPerPage, thisMonthBdays.length);

  const totalAnnivPages = Math.ceil(thisMonthAnnivs.length / annivPerPage) || 1;
  const currentAnnivPage = Math.min(annivPage, totalAnnivPages);
  const paginatedAnnivs = useMemo(() => {
    const start = (currentAnnivPage - 1) * annivPerPage;
    return thisMonthAnnivs.slice(start, start + annivPerPage);
  }, [thisMonthAnnivs, currentAnnivPage, annivPerPage]);
  const annivStartIndex = thisMonthAnnivs.length === 0 ? 0 : (currentAnnivPage - 1) * annivPerPage + 1;
  const annivEndIndex = Math.min(currentAnnivPage * annivPerPage, thisMonthAnnivs.length);

  // Public holidays: show only current year pending holidays
  const pendingCurrentYearHolidays = holidays.filter(h => {
    if (!h.holiday_date) return false;
    const p = parseDateParts(h.holiday_date);
    const d = p ? new Date(p.year, p.month, p.day) : new Date(h.holiday_date);
    d.setHours(0,0,0,0);
    return d.getFullYear() === currentCalendarYear && d >= today;
  }).sort((a,b) => new Date(a.holiday_date) - new Date(b.holiday_date));

  const nextHoliday = pendingCurrentYearHolidays.length > 0 
    ? pendingCurrentYearHolidays[0] 
    : (upcomingHolidays.length > 0 ? upcomingHolidays[0] : (holidays.length > 0 ? holidays[0] : null));

  return (
    <>
      <main className="dashboard-wrapper">
        <div className="dashboard-container">
          <div className="px-0 px-md-5 employee-dashboard">
            <div className="employee-work-calendar">
              
              <div className="work-calendar-header">
                <div>
                  <h1>Work Calendar</h1>
                  <p>View your work calendar, holidays, special days and team availability in one place.</p>
                </div>
                {/* <div className="calendar-header-actions">
                  <button className="calendar-action-btn secondary" onClick={() => setCurrentMonth(new Date())}>
                    <i className="bi bi-calendar-check"></i> Today
                  </button>
                </div> */}
              </div>

              <section className="ed-hero" style={{ marginBottom: "25px" }}>
                <div className="ed-hero-main">
                  <div className="ed-profile-avatar overflow-hidden">
                    {(employeeProfile?.profile_pic || employeeProfile?.avatar_url || profile?.profile_pic) ? (
                      <img
                        src={/^(https?:\/\/|data:|blob:)/i.test(employeeProfile?.profile_pic || employeeProfile?.avatar_url || profile?.profile_pic)
                          ? (employeeProfile?.profile_pic || employeeProfile?.avatar_url || profile?.profile_pic)
                          : `${import.meta.env.VITE_API_URL || 'https://hrms-backend-5xo8.onrender.com'}/${(employeeProfile?.profile_pic || employeeProfile?.avatar_url || profile?.profile_pic).replace(/^\/+/, '')}`}
                        alt={profile?.preferred_name || profile?.first_name || "Employee"}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <img src="https://i.pravatar.cc/150?img=12" alt={profile?.preferred_name || profile?.first_name || "Employee"} />
                    )}
                    <span className="ed-online-dot"></span>
                  </div>

                  <div className="ed-hero-content">
                    <span className="ed-eyebrow">
                      <i className="bi bi-sun"></i>
                      {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>

                    <h1>
                      Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
                      {profile?.preferred_name || profile?.first_name || currentUser?.email?.split("@")[0] || "Employee"}
                    </h1>

                    <p>
                      Here's your workspace overview for today. Stay productive and have a great day.
                    </p>

                    <div className="ed-employee-meta">
                      <span>
                        <i className="bi bi-person-badge"></i>
                        {profile?.employee_code || "EMP-1360"}
                      </span>

                      <span>
                        <i className="bi bi-briefcase"></i>
                        {profile?.designation || "Senior Software Engineer"}
                      </span>

                      <span>
                        <i className="bi bi-diagram-3"></i>
                        {profile?.department ? `${profile.department}${profile.team ? ` · ${profile.team}` : " · Backend"}` : "Engineering · Backend"}
                      </span>

                      <span>
                        <i className="bi bi-geo-alt"></i>
                        {profile?.city || profile?.location || "Nagpur"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="es-profile-completion">
                  <div className="es-completion-top">
                    <span>Profile Completion</span>
                    <strong>{profile?.profile_completion_percentage || 85}%</strong>
                  </div>
                  <div className="progress es-progress">
                    <div className="progress-bar" style={{ width: (profile?.profile_completion_percentage || 85) + "%" }}></div>
                  </div>
                  <small>Complete your remaining profile details.</small>
                </div>
              </section>

              <div className="calendar-summary">
                <div className="summary-item">
                  <div className="summary-icon purple">
                    <i className="bi bi-calendar-event"></i>
                  </div>
                  <div>
                    <span>Upcoming Leaves</span>
                    <strong>{leaves.filter(l => new Date(l.start_date) >= today).length}</strong>
                  </div>
                </div>
                <div className="summary-item">
                  <div className="summary-icon orange">
                    <i className="bi bi-sun"></i>
                  </div>
                  <div>
                    <span>Next Holiday</span>
                    <strong>{nextHoliday ? new Date(nextHoliday.holiday_date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short'}) : '--'}</strong>
                  </div>
                </div>
                <div className="summary-item">
                  <div className="summary-icon green">
                    <i className="bi bi-people"></i>
                  </div>
                  <div>
                    <span>Team Members</span>
                    <strong>{allUsers.length || 0}</strong>
                  </div>
                </div>
                <div className="summary-item">
                  <div className="summary-icon blue">
                    <i className="bi bi-briefcase"></i>
                  </div>
                  <div>
                    <span>Working Days</span>
                    <strong>{daysInMonth - (Math.floor(daysInMonth / 7) * 2)}</strong>
                  </div>
                </div>
              </div>

              <div className="calendar-tabs-wrapper">
                <div className="calendar-tabs" role="tablist">
                  <button className={`calendar-tab ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')} type="button">
                    <i className="bi bi-calendar3"></i> Full Calendar
                  </button>
                  <button className={`calendar-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')} type="button">
                    <i className="bi bi-layout-text-window-reverse"></i> Days & Team
                  </button>
                  <button className={`calendar-tab ${activeTab === 'wishes' ? 'active' : ''}`} onClick={() => setActiveTab('wishes')} type="button">
                    <i className="bi bi-gift"></i> Send Wishes
                  </button>
                </div>
              </div>

              {activeTab === 'calendar' && (
                <section className="calendar-tab-content active" id="calendarTab">
                  <div className="calendar-layout">
                    
                    <div className="calendar-main-card" style={{ maxHeight: "calc(100vh - 220px)", overflowY: "auto", overflowX: "auto" }}>
                      <div className="calendar-toolbar">
                        <div className="calendar-month-navigation">
                          <button className="month-nav-btn" onClick={prevMonth} aria-label="Previous month">
                            <i className="bi bi-chevron-left"></i>
                          </button>
                          <h2>{monthName} {yearName}</h2>
                          <button className="month-nav-btn" onClick={nextMonth} aria-label="Next month">
                            <i className="bi bi-chevron-right"></i>
                          </button>
                        </div>
                      </div>

                      <div className="calendar-legend">
                        <span><i className="legend-dot holiday"></i> Public Holiday</span>
                      </div>

                      <div className="calendar-grid-view" style={{ minWidth: "650px" }}>
                        <div className="calendar-weekdays">
                          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                        </div>
                        <div className="calendar-days">
                          {grid.map((cell, index) => {
                            const isToday = isSameDay(cell.date, new Date());
                            return (
                                <div key={index} className={`calendar-day ${cell.isOtherMonth ? 'other-month' : ''}`}>
                                    <div className="day-number">
                                        <span className={isToday ? 'active' : ''}>{cell.date.getDate()}</span>
                                    </div>
                                    <div className="day-events">
                                        {renderEvents(cell.date)}
                                    </div>
                                </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <aside className="calendar-side-panel">
                      <div className="side-card next-holiday-card">
                        <div className="side-card-header">
                          <div>
                            <span className="section-label">NEXT HOLIDAY</span>
                            <h3>{nextHoliday ? nextHoliday.holiday_name : 'No Holiday'}</h3>
                          </div>
                          <div className="side-card-icon orange">
                            <i className="bi bi-stars"></i>
                          </div>
                        </div>
                        <div className="holiday-date-box">
                          <strong>{nextHoliday ? new Date(nextHoliday.holiday_date).toLocaleDateString('en-GB', {day: '2-digit'}) : '--'}</strong>
                          <span>{nextHoliday ? new Date(nextHoliday.holiday_date).toLocaleDateString('en-GB', {month: 'short'}).toUpperCase() : ''}<br/>{nextHoliday ? new Date(nextHoliday.holiday_date).getFullYear() : ''}</span>
                        </div>
                        <p>{nextHoliday ? nextHoliday.holiday_name : ''}</p>
                        <div className="holiday-meta">
                          <span>
                            <i className="bi bi-calendar3"></i> {nextHoliday ? new Date(nextHoliday.holiday_date).toLocaleDateString('en-GB', {weekday: 'long'}) : ''}
                          </span>
                          <span>
                            <i className="bi bi-building"></i> Public Holiday
                          </span>
                        </div>
                      </div>

                      <div className="side-card">
                        <div className="side-card-header">
                          <div>
                            <span className="section-label">UPCOMING</span>
                            <h3>Holidays</h3>
                          </div>
                          <i className="bi bi-three-dots"></i>
                        </div>
                        <div className="holiday-mini-list">
                          {upcomingHolidays.slice(0,4).map((h, i) => (
                            <div className="holiday-mini-item" key={i}>
                              <div className="mini-date">
                                <strong>{new Date(h.holiday_date).toLocaleDateString('en-GB', {day: '2-digit'})}</strong>
                                <span>{new Date(h.holiday_date).toLocaleDateString('en-GB', {month: 'short'}).toUpperCase()}</span>
                              </div>
                              <div>
                                <strong>{h.holiday_name}</strong>
                                <span>{new Date(h.holiday_date).toLocaleDateString('en-GB', {weekday: 'long'})}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </aside>

                  </div>
                </section>
              )}

              {activeTab === 'overview' && (
                <section className="calendar-tab-content active" id="overviewTab">
                   <div className="overview-toolbar">
                       <div>
                           <h2>Days & Team</h2>
                           <p className="text-muted">Explore special days, upcoming holidays and your team.</p>
                       </div>
                   </div>

                   <div className="row g-4 mt-2">
                       {/* Special Days Card */}
                       <div className="col-12 col-lg-6">
                           <div className="side-card h-100 mb-0">
                               <div className="side-card-header">
                                   <div>
                                       <span className="section-label">{monthName.toUpperCase()} {yearName}</span>
                                       <h3>Special Days</h3>
                                   </div>
                                   <div className="side-card-icon purple">
                                       <i className="bi bi-stars"></i>
                                   </div>
                               </div>
                               <div className="mt-3">
                                   {thisMonthBdays.length === 0 && thisMonthAnnivs.length === 0 ? (
                                       <EmptyState
                                            compact
                                            emoji="🎂"
                                            title="No celebrations this month"
                                            message="There are no birthdays or work anniversaries scheduled for this month."
                                        />
                                   ) : (
                                       <ul className="list-unstyled mb-0" style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                                           {thisMonthBdays.map((u, i) => (
                                               <li key={`obday-${i}`} className="d-flex align-items-center gap-3">
                                                   <div style={{background: '#ffeeff', color: '#d63384', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                                       <i className="bi bi-gift-fill"></i>
                                                   </div>
                                                   <div>
                                                       <h6 className="mb-0">{u.name}'s Birthday</h6>
                                                       <small className="text-muted">{new Date(u.dob).toLocaleDateString('en-GB', {day: '2-digit', month: 'short'})}</small>
                                                   </div>
                                               </li>
                                           ))}
                                           {thisMonthAnnivs.map((u, i) => {
                                               const joinYear = new Date(u.doj).getFullYear();
                                               const yrs = year - joinYear;
                                               const annivLabel = yrs > 0 ? `${u.name}'s Work Anniversary (${yrs} ${yrs === 1 ? 'Year' : 'Years'})` : `${u.name} Joined the Team`;
                                               return (
                                               <li key={`oanniv-${i}`} className="d-flex align-items-center gap-3">
                                                   <div style={{background: '#fff3cd', color: '#ffc107', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                                       <i className="bi bi-award-fill"></i>
                                                   </div>
                                                   <div>
                                                       <h6 className="mb-0">{annivLabel}</h6>
                                                       <small className="text-muted">{new Date(u.doj).toLocaleDateString('en-GB', {day: '2-digit', month: 'short'})}</small>
                                                   </div>
                                               </li>
                                               );
                                           })}
                                       </ul>
                                   )}
                               </div>
                           </div>
                       </div>

                       {/* Upcoming Holidays Card - Current Year Pending Only */}
                       <div className="col-12 col-lg-6">
                           <div className="side-card h-100 mb-0">
                               <div className="side-card-header">
                                   <div>
                                       <span className="section-label">{pendingCurrentYearHolidays.length} PENDING IN {currentCalendarYear}</span>
                                       <h3>Next Holidays</h3>
                                   </div>
                                   <div className="side-card-icon orange">
                                       <i className="bi bi-sun"></i>
                                   </div>
                               </div>
                               <div className="holiday-mini-list mt-3">
                                  {pendingCurrentYearHolidays.map((h, i) => (
                                    <div className="holiday-mini-item" key={i}>
                                      <div className="mini-date">
                                        <strong>{new Date(h.holiday_date).toLocaleDateString('en-GB', {day: '2-digit'})}</strong>
                                        <span>{new Date(h.holiday_date).toLocaleDateString('en-GB', {month: 'short'}).toUpperCase()}</span>
                                      </div>
                                      <div>
                                        <strong>{h.holiday_name}</strong>
                                        <span>{new Date(h.holiday_date).toLocaleDateString('en-GB', {weekday: 'long'})}</span>
                                      </div>
                                    </div>
                                  ))}
                                  {pendingCurrentYearHolidays.length === 0 && (
                                       <EmptyState
                                           compact
                                           emoji="🌴"
                                           title="No upcoming holidays"
                                           message={`No remaining public holidays scheduled for ${currentCalendarYear}.`}
                                       />
                                   )}
                               </div>
                           </div>
                       </div>
                   </div>

                   {/* Team Directory (DB-based Project Teams) */}
                   <div id="calendarTeamDirectory" className="side-card mt-4">
                       <div className="side-card-header border-bottom pb-3 mb-3">
                           <div>
                               <span className="section-label">TEAM DIRECTORY</span>
                               <h3>My Team Members</h3>
                               <p className="text-muted mb-0 mt-1" style={{fontSize: '13px'}}>
                                 {myTeamData.teams && myTeamData.teams.length > 0
                                   ? `Teammates across your assigned project teams (${myTeamData.teams.map(t => t.project_name).join(', ')}).`
                                   : 'View your teammates and their current availability.'}
                               </p>
                           </div>
                           <div className="text-end">
                               <h3 className="mb-0 text-primary">{teamDirectoryMembers.length}</h3>
                               <span className="text-muted" style={{fontSize: '12px'}}>Members</span>
                           </div>
                       </div>
                       
                       <div className="row g-3">
                           {teamDirectoryMembers.length === 0 ? (
                               <div className="col-12">
                                   <EmptyState
                                       compact
                                       emoji="👥"
                                       title="No team members found"
                                       message="There are currently no team members in this directory."
                                   />
                               </div>
                           ) : (
                               teamDirectoryMembers.map((u, i) => (
                               <div className="col-12 col-md-6 col-xl-4" key={u.id || i}>
                                   <div className={`d-flex align-items-center gap-3 p-3 border rounded-3 ${u.is_current_user ? 'bg-primary-subtle bg-opacity-10 border-primary' : 'bg-light'}`}>
                                       <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{width: '45px', height: '45px', fontWeight: 'bold', fontSize: '18px', flexShrink: 0}}>
                                           {u.name.charAt(0)}
                                       </div>
                                       <div style={{minWidth: 0, flexGrow: 1}}>
                                           <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                                             <div className="d-flex align-items-center gap-2 text-truncate">
                                               <h6 className="mb-0 text-truncate" title={u.name}>{u.name}</h6>
                                               {u.is_current_user && (
                                                 <span className="badge bg-primary text-white rounded-pill px-2 py-0" style={{fontSize: '10px', flexShrink: 0}}>You</span>
                                               )}
                                               {u.is_lead && (
                                                 <span className="badge bg-warning text-dark rounded-pill px-2 py-0" style={{fontSize: '10px', flexShrink: 0}}>Lead</span>
                                               )}
                                             </div>
                                             {!u.is_current_user && (
                                               <button
                                                 type="button"
                                                 className="btn btn-sm btn-outline-primary rounded-pill px-2.5 py-0.5 d-inline-flex align-items-center gap-1 shadow-xs"
                                                 title={`Chat with ${u.name}`}
                                                 onClick={() => setActiveChatUser({ id: u.id, full_name: u.name, designation: u.designation })}
                                                 style={{ fontSize: '11px', fontWeight: 600, flexShrink: 0 }}
                                               >
                                                 <i className="bi bi-chat-dots-fill"></i> Chat
                                               </button>
                                             )}
                                           </div>
                                           <small className="text-muted text-truncate d-block">{u.designation || 'Team Member'}</small>
                                           {u.project_names && (
                                             <div className="text-muted text-truncate" style={{fontSize: '11px'}} title={u.project_names}>
                                               <i className="bi bi-diagram-3 me-1"></i>{u.project_names}
                                             </div>
                                           )}
                                           {u.note && (
                                             <div className="text-muted" style={{fontSize: '11px', fontStyle: 'italic'}}>{u.note}</div>
                                           )}
                                       </div>
                                   </div>
                               </div>
                           )))}
                       </div>
                   </div>
                </section>
              )}

              {activeTab === 'wishes' && (
                <section className="calendar-tab-content active" id="wishesTab">
                  <div className="overview-toolbar d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3">
                    <div>
                      <h2>Send Wishes & Greetings</h2>
                      <p className="text-muted mb-0">Celebrate your colleagues' special moments this month ({monthName} {yearName}) with heartfelt greetings.</p>
                    </div>
                  </div>

                  {wishToast && (
                    <div 
                      className="alert alert-success alert-dismissible fade show d-flex align-items-center gap-2 mb-4" 
                      role="alert"
                      style={{ borderRadius: "14px", border: "1px solid #bbf7d0", backgroundColor: "#f0fdf4", color: "#166534" }}
                    >
                      <i className="bi bi-check-circle-fill text-success fs-5"></i>
                      <div className="flex-grow-1">
                        <strong>{wishToast.title}</strong> {wishToast.message}
                      </div>
                      <button type="button" className="btn-close" onClick={() => setWishToast(null)} aria-label="Close"></button>
                    </div>
                  )}

                  <div className="row g-4 mt-1">
                    {/* Column 1: Current Month Upcoming Birthdays */}
                    <div className="col-12 col-lg-6">
                      <div className="side-card h-100 mb-0 d-flex flex-column" style={{ borderRadius: "20px", border: "1px solid #ebecf3", background: "#ffffff", padding: "22px" }}>
                        <div className="side-card-header d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
                          <div>
                            <span className="section-label text-uppercase fw-semibold" style={{ fontSize: "11px", letterSpacing: "0.5px", color: "#e8679d" }}>
                              {monthName.toUpperCase()} {yearName} CELEBRATIONS
                            </span>
                            <div className="d-flex align-items-center gap-2 mt-1">
                              <h3 className="mb-0" style={{ fontSize: "18px", fontWeight: "700" }}>Upcoming Birthdays</h3>
                              <span className="badge rounded-pill" style={{ backgroundColor: "#fff1f7", color: "#e8679d", fontSize: "12px", padding: "4px 10px" }}>
                                {thisMonthBdays.length}
                              </span>
                            </div>
                          </div>
                          <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#fff1f7", color: "#e8679d", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                            <i className="bi bi-balloon-heart-fill"></i>
                          </div>
                        </div>

                        <div className="flex-grow-1 d-flex flex-column justify-content-between">
                          {thisMonthBdays.length === 0 ? (
                            <EmptyState
                              compact
                              emoji="🎂"
                              title="No birthdays this month"
                              message={`There are no colleagues celebrating birthdays in ${monthName}.`}
                            />
                          ) : (
                            <div className="d-flex flex-column gap-2">
                              {paginatedBdays.map((u, i) => {
                                const isCurrentUser = currentUser?.id && u.userId && Number(currentUser.id) === Number(u.userId);
                                const wishKey = `birthday-${u.id || u.userId || u.name}`;
                                const isSent = sentWishes[wishKey];
                                const isSending = sendingWishId === wishKey;
                                const avatarSrc = u.profilePic 
                                  ? (/^(https?:\/\/|data:|blob:)/i.test(u.profilePic) ? u.profilePic : `${API_BASE}/${u.profilePic.replace(/^\/+/, '')}`)
                                  : null;

                                return (
                                  <div
                                    key={`wbday-${u.id || i}`}
                                    className="d-flex align-items-center justify-content-between p-3 rounded-4"
                                    style={{
                                      background: "#fafbfc",
                                      border: "1px solid #f0f0f5",
                                      transition: "all 0.2s ease"
                                    }}
                                  >
                                    <div className="d-flex align-items-center gap-3 min-w-0">
                                      <div style={{ width: "48px", height: "48px", borderRadius: "14px", overflow: "hidden", flexShrink: 0, border: "1px solid #e2e8f0" }}>
                                        {avatarSrc ? (
                                          <img
                                            src={avatarSrc}
                                            alt={u.name}
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                          />
                                        ) : (
                                          <div style={{ width: "100%", height: "100%", background: "#fff1f7", color: "#e8679d", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "16px" }}>
                                            {u.name?.charAt(0) || "🎂"}
                                          </div>
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="d-flex align-items-center gap-2">
                                          <strong className="d-block text-truncate" style={{ fontSize: "14.5px", color: "#1e293b" }}>{u.name}</strong>
                                          {isCurrentUser && (
                                            <span className="badge bg-primary text-white rounded-pill px-2 py-0" style={{ fontSize: "10px" }}>You</span>
                                          )}
                                        </div>
                                        <span className="d-block text-truncate text-muted" style={{ fontSize: "12px" }}>
                                          {u.designation || u.department || "Team Member"}
                                        </span>
                                        <small style={{ fontSize: "11.5px", color: u.daysUntil === 0 ? "#16a34a" : "#64748b", fontWeight: u.daysUntil === 0 ? 600 : 400 }}>
                                          <i className="bi bi-calendar-event me-1"></i>
                                          {u.daysUntil === 0 ? "Today 🎉" : u.daysUntil === 1 ? "Tomorrow" : `${u.day} ${monthName}`}
                                        </small>
                                      </div>
                                    </div>

                                    <div className="flex-shrink-0 ms-2">
                                      <button
                                        type="button"
                                        className="btn btn-sm"
                                        disabled={isSent || isSending || isCurrentUser}
                                        onClick={() => handleSendWish(u, 'birthday')}
                                        style={{
                                          borderRadius: "10px",
                                          padding: "7px 14px",
                                          fontSize: "12.5px",
                                          fontWeight: 600,
                                          backgroundColor: isSent ? "#dcfce7" : isCurrentUser ? "#f1f5f9" : "#3c2fbc",
                                          color: isSent ? "#15803d" : isCurrentUser ? "#94a3b8" : "#ffffff",
                                          border: "none",
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "6px",
                                          cursor: (isSent || isCurrentUser) ? "default" : "pointer",
                                          boxShadow: (isSent || isCurrentUser) ? "none" : "0 2px 6px rgba(60, 47, 188, 0.25)"
                                        }}
                                      >
                                        {isSending ? (
                                          <>
                                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                            <span>Sending...</span>
                                          </>
                                        ) : isSent ? (
                                          <>
                                            <i className="bi bi-check-circle-fill"></i>
                                            <span>Wish Sent ✨</span>
                                          </>
                                        ) : isCurrentUser ? (
                                          <>
                                            <span>Your Day 🎉</span>
                                          </>
                                        ) : (
                                          <>
                                            <i className="bi bi-send-fill"></i>
                                            <span>Send Wishes</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {thisMonthBdays.length > 0 && (
                            <div
                              className="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-3 mt-3 border-top"
                              style={{
                                padding: "12px 14px",
                                backgroundColor: "#fafbfc",
                                borderRadius: "14px",
                                border: "1px solid #f0f0f5"
                              }}
                            >
                              <div className="d-flex align-items-center gap-2 flex-wrap">
                                <span style={{ fontSize: "12.5px", color: "#64748b" }}>
                                  Showing <strong style={{ color: "#1e293b" }}>{bdayStartIndex}–{bdayEndIndex}</strong> of <strong style={{ color: "#1e293b" }}>{thisMonthBdays.length}</strong>
                                </span>
                                <div className="d-flex align-items-center gap-1.5 ms-1">
                                  <span style={{ fontSize: "12px", color: "#64748b" }}>Per page:</span>
                                  <select
                                    className="form-select form-select-sm"
                                    value={bdayPerPage}
                                    onChange={e => { setBdayPerPage(Number(e.target.value)); setBdayPage(1); }}
                                    style={{
                                      width: "66px",
                                      height: "30px",
                                      borderRadius: "8px",
                                      borderColor: "#e2e8f0",
                                      fontSize: "12px",
                                      backgroundColor: "#ffffff",
                                      color: "#1e293b",
                                      fontWeight: 500,
                                      cursor: "pointer",
                                      boxShadow: "none"
                                    }}
                                  >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                  </select>
                                </div>
                              </div>

                              <div className="d-flex align-items-center gap-1">
                                <button 
                                  type="button"
                                  className="btn btn-sm"
                                  disabled={currentBdayPage === 1} 
                                  onClick={() => setBdayPage(p => Math.max(1, p - 1))}
                                  title="Previous Page"
                                  style={{
                                    width: "30px",
                                    height: "30px",
                                    borderRadius: "8px",
                                    border: "1px solid #e2e8f0",
                                    backgroundColor: currentBdayPage === 1 ? "#f8fafc" : "#ffffff",
                                    color: currentBdayPage === 1 ? "#cbd5e1" : "#475569",
                                    fontSize: "11px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: currentBdayPage === 1 ? "not-allowed" : "pointer"
                                  }}
                                >
                                  <i className="bi bi-chevron-left"></i>
                                </button>
                                {Array.from({ length: totalBdayPages }, (_, i) => i + 1).map(pageNum => (
                                  <button 
                                    key={pageNum} 
                                    type="button" 
                                    className="btn btn-sm"
                                    onClick={() => setBdayPage(pageNum)}
                                    style={{
                                      width: "30px",
                                      height: "30px",
                                      borderRadius: "8px",
                                      border: currentBdayPage === pageNum ? "none" : "1px solid #e2e8f0",
                                      backgroundColor: currentBdayPage === pageNum ? "#3c2fbc" : "#ffffff",
                                      color: currentBdayPage === pageNum ? "#ffffff" : "#475569",
                                      fontWeight: currentBdayPage === pageNum ? 600 : 400,
                                      fontSize: "11.5px",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      cursor: "pointer",
                                      boxShadow: currentBdayPage === pageNum ? "0 2px 4px rgba(60, 47, 188, 0.2)" : "none"
                                    }}
                                  >
                                    {pageNum}
                                  </button>
                                ))}
                                <button 
                                  type="button"
                                  className="btn btn-sm"
                                  disabled={currentBdayPage === totalBdayPages} 
                                  onClick={() => setBdayPage(p => Math.min(totalBdayPages, p + 1))}
                                  title="Next Page"
                                  style={{
                                    width: "30px",
                                    height: "30px",
                                    borderRadius: "8px",
                                    border: "1px solid #e2e8f0",
                                    backgroundColor: currentBdayPage === totalBdayPages ? "#f8fafc" : "#ffffff",
                                    color: currentBdayPage === totalBdayPages ? "#cbd5e1" : "#475569",
                                    fontSize: "11px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: currentBdayPage === totalBdayPages ? "not-allowed" : "pointer"
                                  }}
                                >
                                  <i className="bi bi-chevron-right"></i>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Current Month Upcoming Work Anniversaries */}
                    <div className="col-12 col-lg-6">
                      <div className="side-card h-100 mb-0 d-flex flex-column" style={{ borderRadius: "20px", border: "1px solid #ebecf3", background: "#ffffff", padding: "22px" }}>
                        <div className="side-card-header d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
                          <div>
                            <span className="section-label text-uppercase fw-semibold" style={{ fontSize: "11px", letterSpacing: "0.5px", color: "#3c2fbc" }}>
                              {monthName.toUpperCase()} {yearName} MILESTONES
                            </span>
                            <div className="d-flex align-items-center gap-2 mt-1">
                              <h3 className="mb-0" style={{ fontSize: "18px", fontWeight: "700" }}>Upcoming Work Anniversaries</h3>
                              <span className="badge rounded-pill" style={{ backgroundColor: "#eeecff", color: "#3c2fbc", fontSize: "12px", padding: "4px 10px" }}>
                                {thisMonthAnnivs.length}
                              </span>
                            </div>
                          </div>
                          <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#eeecff", color: "#3c2fbc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                            <i className="bi bi-stars"></i>
                          </div>
                        </div>

                        <div className="flex-grow-1 d-flex flex-column justify-content-between">
                          {thisMonthAnnivs.length === 0 ? (
                            <EmptyState
                              compact
                              emoji="🏆"
                              title="No work anniversaries this month"
                              message={`There are no work anniversaries scheduled for ${monthName}.`}
                            />
                          ) : (
                            <div className="d-flex flex-column gap-2">
                              {paginatedAnnivs.map((u, i) => {
                                const isCurrentUser = currentUser?.id && u.userId && Number(currentUser.id) === Number(u.userId);
                                const wishKey = `anniversary-${u.id || u.userId || u.name}`;
                                const isSent = sentWishes[wishKey];
                                const isSending = sendingWishId === wishKey;
                                const avatarSrc = u.profilePic 
                                  ? (/^(https?:\/\/|data:|blob:)/i.test(u.profilePic) ? u.profilePic : `${API_BASE}/${u.profilePic.replace(/^\/+/, '')}`)
                                  : null;

                                return (
                                  <div
                                    key={`wanniv-${u.id || i}`}
                                    className="d-flex align-items-center justify-content-between p-3 rounded-4"
                                    style={{
                                      background: "#fafbfc",
                                      border: "1px solid #f0f0f5",
                                      transition: "all 0.2s ease"
                                    }}
                                  >
                                    <div className="d-flex align-items-center gap-3 min-w-0">
                                      <div style={{ width: "48px", height: "48px", borderRadius: "14px", overflow: "hidden", flexShrink: 0, border: "1px solid #e2e8f0" }}>
                                        {avatarSrc ? (
                                          <img
                                            src={avatarSrc}
                                            alt={u.name}
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                          />
                                        ) : (
                                          <div style={{ width: "100%", height: "100%", background: "#eeecff", color: "#3c2fbc", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "16px" }}>
                                            {u.name?.charAt(0) || "🏆"}
                                          </div>
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="d-flex align-items-center gap-2">
                                          <strong className="d-block text-truncate" style={{ fontSize: "14.5px", color: "#1e293b" }}>{u.name}</strong>
                                          {isCurrentUser && (
                                            <span className="badge bg-primary text-white rounded-pill px-2 py-0" style={{ fontSize: "10px" }}>You</span>
                                          )}
                                        </div>
                                        <span className="d-block text-truncate text-muted" style={{ fontSize: "12px" }}>
                                          {u.designation || u.department || "Team Member"}
                                        </span>
                                        <small style={{ fontSize: "11.5px", color: u.daysUntil === 0 ? "#16a34a" : "#64748b", fontWeight: u.daysUntil === 0 ? 600 : 400 }}>
                                          <i className="bi bi-award me-1"></i>
                                          {u.years} Year{u.years !== 1 ? 's' : ''} · {u.daysUntil === 0 ? "Today 🎉" : u.daysUntil === 1 ? "Tomorrow" : `${u.day} ${monthName}`}
                                        </small>
                                      </div>
                                    </div>

                                    <div className="flex-shrink-0 ms-2">
                                      <button
                                        type="button"
                                        className="btn btn-sm"
                                        disabled={isSent || isSending || isCurrentUser}
                                        onClick={() => handleSendWish(u, 'anniversary')}
                                        style={{
                                          borderRadius: "10px",
                                          padding: "7px 14px",
                                          fontSize: "12.5px",
                                          fontWeight: 600,
                                          backgroundColor: isSent ? "#dcfce7" : isCurrentUser ? "#f1f5f9" : "#3c2fbc",
                                          color: isSent ? "#15803d" : isCurrentUser ? "#94a3b8" : "#ffffff",
                                          border: "none",
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "6px",
                                          cursor: (isSent || isCurrentUser) ? "default" : "pointer",
                                          boxShadow: (isSent || isCurrentUser) ? "none" : "0 2px 6px rgba(60, 47, 188, 0.25)"
                                        }}
                                      >
                                        {isSending ? (
                                          <>
                                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                            <span>Sending...</span>
                                          </>
                                        ) : isSent ? (
                                          <>
                                            <i className="bi bi-check-circle-fill"></i>
                                            <span>Wish Sent ✨</span>
                                          </>
                                        ) : isCurrentUser ? (
                                          <>
                                            <span>Your Milestone 🌟</span>
                                          </>
                                        ) : (
                                          <>
                                            <i className="bi bi-send-fill"></i>
                                            <span>Send Wishes</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {thisMonthAnnivs.length > 0 && (
                            <div
                              className="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-3 mt-3 border-top"
                              style={{
                                padding: "12px 14px",
                                backgroundColor: "#fafbfc",
                                borderRadius: "14px",
                                border: "1px solid #f0f0f5"
                              }}
                            >
                              <div className="d-flex align-items-center gap-2 flex-wrap">
                                <span style={{ fontSize: "12.5px", color: "#64748b" }}>
                                  Showing <strong style={{ color: "#1e293b" }}>{annivStartIndex}–{annivEndIndex}</strong> of <strong style={{ color: "#1e293b" }}>{thisMonthAnnivs.length}</strong>
                                </span>
                                <div className="d-flex align-items-center gap-1.5 ms-1">
                                  <span style={{ fontSize: "12px", color: "#64748b" }}>Per page:</span>
                                  <select
                                    className="form-select form-select-sm"
                                    value={annivPerPage}
                                    onChange={e => { setAnnivPerPage(Number(e.target.value)); setAnnivPage(1); }}
                                    style={{
                                      width: "66px",
                                      height: "30px",
                                      borderRadius: "8px",
                                      borderColor: "#e2e8f0",
                                      fontSize: "12px",
                                      backgroundColor: "#ffffff",
                                      color: "#1e293b",
                                      fontWeight: 500,
                                      cursor: "pointer",
                                      boxShadow: "none"
                                    }}
                                  >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                  </select>
                                </div>
                              </div>

                              <div className="d-flex align-items-center gap-1">
                                <button 
                                  type="button"
                                  className="btn btn-sm"
                                  disabled={currentAnnivPage === 1} 
                                  onClick={() => setAnnivPage(p => Math.max(1, p - 1))}
                                  title="Previous Page"
                                  style={{
                                    width: "30px",
                                    height: "30px",
                                    borderRadius: "8px",
                                    border: "1px solid #e2e8f0",
                                    backgroundColor: currentAnnivPage === 1 ? "#f8fafc" : "#ffffff",
                                    color: currentAnnivPage === 1 ? "#cbd5e1" : "#475569",
                                    fontSize: "11px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: currentAnnivPage === 1 ? "not-allowed" : "pointer"
                                  }}
                                >
                                  <i className="bi bi-chevron-left"></i>
                                </button>
                                {Array.from({ length: totalAnnivPages }, (_, i) => i + 1).map(pageNum => (
                                  <button 
                                    key={pageNum} 
                                    type="button" 
                                    className="btn btn-sm"
                                    onClick={() => setAnnivPage(pageNum)}
                                    style={{
                                      width: "30px",
                                      height: "30px",
                                      borderRadius: "8px",
                                      border: currentAnnivPage === pageNum ? "none" : "1px solid #e2e8f0",
                                      backgroundColor: currentAnnivPage === pageNum ? "#3c2fbc" : "#ffffff",
                                      color: currentAnnivPage === pageNum ? "#ffffff" : "#475569",
                                      fontWeight: currentAnnivPage === pageNum ? 600 : 400,
                                      fontSize: "11.5px",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      cursor: "pointer",
                                      boxShadow: currentAnnivPage === pageNum ? "0 2px 4px rgba(60, 47, 188, 0.2)" : "none"
                                    }}
                                  >
                                    {pageNum}
                                  </button>
                                ))}
                                <button 
                                  type="button"
                                  className="btn btn-sm"
                                  disabled={currentAnnivPage === totalAnnivPages} 
                                  onClick={() => setAnnivPage(p => Math.min(totalAnnivPages, p + 1))}
                                  title="Next Page"
                                  style={{
                                    width: "30px",
                                    height: "30px",
                                    borderRadius: "8px",
                                    border: "1px solid #e2e8f0",
                                    backgroundColor: currentAnnivPage === totalAnnivPages ? "#f8fafc" : "#ffffff",
                                    color: currentAnnivPage === totalAnnivPages ? "#cbd5e1" : "#475569",
                                    fontSize: "11px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: currentAnnivPage === totalAnnivPages ? "not-allowed" : "pointer"
                                  }}
                                >
                                  <i className="bi bi-chevron-right"></i>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}
              
            </div>
          </div>
        </div>
        
        {/* Custom centered modal overlay */}
        {showModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowModal(false)}>
                <div style={{ background: '#fff', borderRadius: '16px', width: '360px', maxWidth: '90%', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                    <div style={{ 
                        background: modalData.type === 'birthday' 
                            ? 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)' 
                            : modalData.type === 'anniversary'
                            ? 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)'
                            : modalData.type === 'holiday'
                            ? 'linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)'
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                        padding: '30px 20px', 
                        textAlign: 'center', 
                        position: 'relative' 
                    }}>
                        <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', border: 'none', background: 'rgba(255,255,255,0.3)', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', cursor: 'pointer', color: '#fff', lineHeight: 1 }}>&times;</button>
                        <i className={`bi ${
                            modalData.type === 'birthday' 
                                ? 'bi-cake2-fill' 
                                : modalData.type === 'anniversary'
                                ? 'bi-award-fill'
                                : modalData.type === 'holiday'
                                ? 'bi-flag-fill'
                                : 'bi-calendar-heart-fill'
                        }`} style={{ fontSize: '4.5rem', color: '#fff', dropShadow: '0 4px 6px rgba(0,0,0,0.1)' }}></i>
                        <h4 style={{ margin: '15px 0 0', color: '#fff', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>{modalData.title}</h4>
                    </div>

                    <div style={{ padding: '25px 20px', maxHeight: '320px', overflowY: 'auto', backgroundColor: '#fff' }}>
                        {modalData.type === 'holiday' ? (
                            <div style={{ textAlign: 'center', padding: '10px 0' }}>
                                <div style={{ fontSize: '18px', fontWeight: '700', color: '#24263d', marginBottom: '8px' }}>
                                    {modalData.holidayName}
                                </div>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: '#fff3e6', color: '#b96816', fontSize: '14px', fontWeight: '600' }}>
                                    <i className="bi bi-calendar-event"></i>
                                    {modalData.holidayDate ? new Date(modalData.holidayDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                                </div>
                                <div style={{ marginTop: '16px', fontSize: '13px', color: '#6c757d' }}>
                                    <i className="bi bi-building me-1"></i> Public Holiday · All offices closed
                                </div>
                            </div>
                        ) : modalData.type === 'leave' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {(modalData.list || []).map((lv, i) => (
                                    <div key={i} style={{ padding: '12px', background: '#f8f9fa', borderRadius: '12px', borderLeft: '4px solid #667eea' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '15px', fontWeight: '700', color: '#24263d' }}>{lv.leave_type || 'Leave'}</span>
                                            <span style={{ 
                                                fontSize: '11px', 
                                                fontWeight: '700', 
                                                padding: '2px 8px', 
                                                borderRadius: '12px', 
                                                background: lv.status === 'Approved' ? '#e6f7ec' : '#fff8e6', 
                                                color: lv.status === 'Approved' ? '#28a745' : '#e6a100' 
                                            }}>
                                                {lv.status}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>
                                            <i className="bi bi-clock me-1"></i>
                                            {new Date(lv.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                            {lv.end_date && !isSameDay(new Date(lv.start_date), new Date(lv.end_date)) ? ` - ${new Date(lv.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}
                                            {lv.days_requested ? ` (${lv.days_requested} ${lv.days_requested > 1 ? 'days' : 'day'})` : ''}
                                        </div>
                                        {lv.reason && (
                                            <div style={{ fontSize: '12px', color: '#495057', fontStyle: 'italic', background: '#fff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #edf2f7' }}>
                                                "{lv.reason}"
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {(modalData.list || []).map((name, i) => (
                                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: '#f8f9fa', borderRadius: '10px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: modalData.type === 'birthday' ? '#ffe5f1' : '#fff4d2', color: modalData.type === 'birthday' ? '#d63384' : '#ffc107', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px' }}>
                                            {name.charAt(0).toUpperCase()}
                                        </div>
                                        <span style={{ fontSize: '16px', color: '#24263d', fontWeight: '600' }}>{name}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div style={{ padding: '15px 20px', borderTop: '1px solid #f1f3f5', textAlign: 'center', backgroundColor: '#fcfcfd' }}>
                        <button onClick={() => setShowModal(false)} className="btn btn-primary" style={{ background: '#24263d', borderColor: '#24263d', borderRadius: '8px', padding: '10px 30px', fontWeight: '600', width: '100%' }}>Awesome!</button>
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
          apiBase={API_BASE}
        />

      </main>
    </>
  );
}

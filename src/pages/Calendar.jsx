import React, { useState, useEffect } from "react";

export default function Calendar({ employeeProfile, currentUser }) {
  const profile = employeeProfile || {};
  const [activeTab, setActiveTab] = useState("calendar");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [holidays, setHolidays] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [upcomingHolidays, setUpcomingHolidays] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({ title: '', list: [] });

  useEffect(() => {
    const uid = currentUser?.id || profile.user_id || 1; 
    const eid = profile.employee_id || 1;

    // Fetch Employees (for birthdays and anniversaries)
    fetch(`${import.meta.env.VITE_API_URL || "https://hrms-backend-5xo8.onrender.com"}/api/admin/employees?orgId=1`)
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                const mappedUsers = data.map(u => ({
                    name: u.full_name,
                    dob: u.date_of_birth,
                    doj: u.joining_date
                }));
                setAllUsers(mappedUsers);
            }
        })
        .catch(console.error);

    if (uid) {
        // Fetch Holidays (the widgets endpoint still returns allHolidays safely)
        fetch(`${import.meta.env.VITE_API_URL || "https://hrms-backend-5xo8.onrender.com"}/api/dashboard/widgets/${uid}`)
            .then(res => res.json())
            .then(data => {
                if (data.allHolidays) {
                    const finalHolidays = data.allHolidays || [];
                    setHolidays(finalHolidays);
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const upcoming = finalHolidays.filter(h => new Date(h.holiday_date) >= today).sort((a,b) => new Date(a.holiday_date) - new Date(b.holiday_date));
                    setUpcomingHolidays(upcoming);
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

  const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  
  const isDateBetween = (date, start, end) => {
    const d = new Date(date).setHours(0,0,0,0);
    const s = new Date(start).setHours(0,0,0,0);
    const e = new Date(end).setHours(0,0,0,0);
    return d >= s && d <= e;
  };

  const renderEvents = (date) => {
    const events = [];
    
    const hol = holidays.find(h => isSameDay(new Date(h.holiday_date), date));
    if (hol) {
        events.push(
            <div key={`hol-${hol.id || hol.holiday_name}`} className="calendar-event holiday" title={`Holiday: ${hol.holiday_name}`} onClick={() => { setModalData({ title: 'Public Holiday', type: 'holiday', holidayName: hol.holiday_name, holidayDate: hol.holiday_date }); setShowModal(true); }} style={{cursor: 'pointer'}}>
                <i className="bi bi-flag-fill" style={{fontSize: '11px', color: '#b96816', marginRight: '4px'}}></i>
                <span>{hol.holiday_name}</span>
            </div>
        );
    }

    return events;
  };

  const monthName = currentMonth.toLocaleDateString('en-GB', {month: 'long'});
  const yearName = currentMonth.getFullYear();

  // Helper arrays for Overview Tab
  const thisMonthBdays = allUsers.filter(u => u.dob && new Date(u.dob).getMonth() === month);
  const thisMonthAnnivs = allUsers.filter(u => u.doj && new Date(u.doj).getMonth() === month && new Date(u.doj).getFullYear() < year);
  
  const today = new Date();
  today.setHours(0,0,0,0);
  const nextHoliday = upcomingHolidays.length > 0 ? upcomingHolidays[0] : null;

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
                        src={/^https?:\/\//i.test(employeeProfile?.profile_pic || employeeProfile?.avatar_url || profile?.profile_pic)
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
                                       <p className="text-muted">No birthdays or anniversaries this month.</p>
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
                                           {thisMonthAnnivs.map((u, i) => (
                                               <li key={`oanniv-${i}`} className="d-flex align-items-center gap-3">
                                                   <div style={{background: '#fff3cd', color: '#ffc107', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                                       <i className="bi bi-award-fill"></i>
                                                   </div>
                                                   <div>
                                                       <h6 className="mb-0">{u.name}'s Work Anniversary</h6>
                                                       <small className="text-muted">{new Date(u.doj).toLocaleDateString('en-GB', {day: '2-digit', month: 'short'})}</small>
                                                   </div>
                                               </li>
                                           ))}
                                       </ul>
                                   )}
                               </div>
                           </div>
                       </div>

                       {/* Upcoming Holidays Card */}
                       <div className="col-12 col-lg-6">
                           <div className="side-card h-100 mb-0">
                               <div className="side-card-header">
                                   <div>
                                       <span className="section-label">UPCOMING</span>
                                       <h3>Next Holidays</h3>
                                   </div>
                                   <div className="side-card-icon orange">
                                       <i className="bi bi-sun"></i>
                                   </div>
                               </div>
                               <div className="holiday-mini-list mt-3">
                                  {upcomingHolidays.slice(0,5).map((h, i) => (
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
                                  {upcomingHolidays.length === 0 && <p className="text-muted">No upcoming holidays.</p>}
                               </div>
                           </div>
                       </div>
                   </div>

                   {/* Team Directory */}
                   <div className="side-card mt-4">
                       <div className="side-card-header border-bottom pb-3 mb-3">
                           <div>
                               <span className="section-label">TEAM DIRECTORY</span>
                               <h3>My Team Members</h3>
                               <p className="text-muted mb-0 mt-1" style={{fontSize: '13px'}}>View your teammates and their current availability.</p>
                           </div>
                           <div className="text-end">
                               <h3 className="mb-0 text-primary">{allUsers.length}</h3>
                               <span className="text-muted" style={{fontSize: '12px'}}>Members</span>
                           </div>
                       </div>
                       
                       <div className="row g-3">
                           {allUsers.map((u, i) => (
                               <div className="col-12 col-md-6 col-xl-4" key={i}>
                                   <div className="d-flex align-items-center gap-3 p-3 border rounded-3 bg-light">
                                       <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{width: '45px', height: '45px', fontWeight: 'bold', fontSize: '18px'}}>
                                           {u.name.charAt(0)}
                                       </div>
                                       <div>
                                           <h6 className="mb-0">{u.name}</h6>
                                           <small className="text-muted">Team Member</small>
                                       </div>
                                   </div>
                               </div>
                           ))}
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

      </main>
    </>
  );
}

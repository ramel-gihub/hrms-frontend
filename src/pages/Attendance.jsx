
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Chart from "react-apexcharts";

export default function Attendance({ currentUser, employeeProfile, onNavigate, embedded = false }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [corrections, setCorrections] = useState([]);
  const [avatarError, setAvatarError] = useState(false);

  const rawAvatar = employeeProfile?.profile_pic || employeeProfile?.avatar_url || "";
  const dynamicAvatarUrl = rawAvatar
    ? (/^(https?:\/\/|data:)/i.test(rawAvatar) ? rawAvatar : `${(import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).replace("f2ef", "fzef") : "https://hrms-backend-fzef.onrender.com")}/${rawAvatar.replace(/^\/+/, '')}`)
    : "";

  useEffect(() => {
    setAvatarError(false);
  }, [rawAvatar]);

  useEffect(() => {
    const today = new Date();
    const m = `${today.getFullYear()}-${(today.getMonth()+1).toString().padStart(2, '0')}`;
    setMonth(m);
  }, []);

  useEffect(() => {
    if (!currentUser || !month) return;
    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${(import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).replace("f2ef", "fzef") : "https://hrms-backend-fzef.onrender.com")}/api/attendance/page/${currentUser.id}?month=${month}`);
        const data = await res.json();
        setReport(data);
        // Fetch attendance corrections
        fetch(`${(import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).replace("f2ef", "fzef") : "https://hrms-backend-fzef.onrender.com")}/api/attendance/corrections/${currentUser.id}`)
          .then(r => r.json())
          .then(cData => { if (cData && cData.corrections) setCorrections(cData.corrections); })
          .catch(console.error);

        // Default select current date
        const todayStr = new Date().toISOString().split('T')[0];
        const todayRecord = data.dailyRecords.find(r => new Date(r.date).toISOString().split('T')[0] === todayStr);
        if (todayRecord) setSelectedDate(todayRecord);
        else if (data.dailyRecords.length > 0) setSelectedDate(data.dailyRecords[data.dailyRecords.length - 1]);

      } catch (err) {
        console.error("Error fetching attendance report", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [currentUser, month]);

  if (!currentUser) return <div>Please wait...</div>;

  const totalDays = report?.dailyRecords?.length || 0;
  const workingDays = report?.kpis?.workingDays || totalDays;
  const presentCount = report?.kpis?.presentDays || 0;
  const leaveCount = report?.kpis?.leaveDays || 0;
  const absentCount = report?.kpis?.absentDays || 0;
  const totalHoursDisplay = report?.kpis?.totalHoursDisplay || "00h 00m";
  const overtimeDisplay = report?.kpis?.overtimeDisplay || "00h 00m";
  const avgCheckIn = report?.insights?.avgCheckIn || "--";
  const avgCheckOut = report?.insights?.avgCheckOut || "--";
  const avgHours = report?.insights?.avgHoursDisplay || "0h 00m";
  const lateCount = report?.insights?.lateDays || 0;
  const onTimeCount = report?.insights?.onTimeDays !== undefined ? report?.insights?.onTimeDays : Math.max(0, presentCount - lateCount);

  // Daily categories: 01, 02, 03, ...
  const chartCategories = (report?.dailyRecords || []).map(r => {
    const d = new Date(r.date);
    return String(d.getDate()).padStart(2, '0');
  });

  const standardHoursData = (report?.dailyRecords || []).map(r => r.standardHours !== undefined ? r.standardHours : (r.status === 'Present' ? Math.min(8, r.hours || 8) : 0));
  const overtimeHoursData = (report?.dailyRecords || []).map(r => r.overtimeHours !== undefined ? r.overtimeHours : (r.hours > 8 ? +(r.hours - 8).toFixed(2) : 0));
  const leaveHoursData = (report?.dailyRecords || []).map(r => r.leaveHours !== undefined ? r.leaveHours : (r.status === 'Leave' ? 8 : 0));
  const shortfallHoursData = (report?.dailyRecords || []).map(r => r.shortfallHours !== undefined ? r.shortfallHours : (r.status === 'Absent' ? 8 : (r.status === 'Present' && r.hours < 8 && r.hours > 0 ? +(8 - r.hours).toFixed(2) : 0)));

  const lineChartSeries = [
    { name: "Standard Hours", data: standardHoursData },
    { name: "Overtime Hours", data: overtimeHoursData },
    { name: "Leave Days / Hours", data: leaveHoursData },
    { name: "Shortfall / Absent Hours", data: shortfallHoursData }
  ];

  const lineChartOptions = {
    chart: {
      type: "line",
      height: 255,
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: "smooth",
      width: 2
    },
    colors: ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444"],
    markers: {
      size: 4,
      hover: { size: 6 }
    },
    xaxis: {
      categories: chartCategories,
      labels: {
        style: {
          colors: "#8a90a2",
          fontSize: "12px",
          fontFamily: "inherit"
        }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      min: 0,
      max: 10,
      tickAmount: 5,
      labels: {
        style: {
          colors: "#8a90a2",
          fontSize: "12px",
          fontFamily: "inherit"
        },
        formatter: (val) => val + "h"
      }
    },
    grid: {
      borderColor: "#f1f1f1",
      strokeDashArray: 4,
      padding: { top: 0, right: 10, bottom: 0, left: 10 }
    },
    legend: { show: false }
  };

  const donutSeries = [presentCount, leaveCount, absentCount];
  const donutOptions = {
    labels: ['Present', 'Leave', 'Absent'],
    colors: ['#22b981', '#f59e0b', '#ef4444'],
    chart: { type: 'donut' },
    plotOptions: { pie: { donut: { size: '75%' } } },
    dataLabels: { enabled: false },
    legend: { show: false }
  };

  // Generate weeks for the selected month (Sunday to Saturday)
  const monthWeeks = React.useMemo(() => {
    if (!month) return [];
    const [y, m] = month.split('-').map(Number);
    const totalDaysInMonth = new Date(y, m, 0).getDate();
    const weeks = [];
    let weekIndex = 1;
    let day = 1;

    while (day <= totalDaysInMonth) {
      const startDay = day;
      const startDt = new Date(y, m - 1, startDay);
      const dayOfWeek = startDt.getDay(); // 0 is Sunday, 6 is Saturday
      // Week ends on Saturday (or last day of month)
      const daysUntilSaturday = 6 - dayOfWeek;
      const endDay = Math.min(startDay + daysUntilSaturday, totalDaysInMonth);
      const endDt = new Date(y, m - 1, endDay);

      const pad = n => String(n).padStart(2, '0');
      weeks.push({
        weekNum: weekIndex,
        label: `Week ${weekIndex}`,
        startDateStr: `${y}-${pad(m)}-${pad(startDay)}`,
        endDateStr: `${y}-${pad(m)}-${pad(endDay)}`,
        startLabel: startDt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        endLabel: endDt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
      });

      day = endDay + 1;
      weekIndex++;
    }
    return weeks;
  }, [month]);

  // Always keep current week active on load or month change
  useEffect(() => {
    if (monthWeeks.length === 0) return;
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    // Find week that contains today
    const currentWeekMatch = monthWeeks.find(w => todayStr >= w.startDateStr && todayStr <= w.endDateStr);
    if (currentWeekMatch) {
      setSelectedWeek(currentWeekMatch.weekNum);
    } else {
      // If viewing another month, default to Week 1 (or last week if past month)
      const thisMonthPrefix = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
      if (month < thisMonthPrefix) {
        setSelectedWeek(monthWeeks[monthWeeks.length - 1].weekNum);
      } else {
        setSelectedWeek(1);
      }
    }
  }, [monthWeeks, month]);

  const activeWeekInfo = monthWeeks.find(w => w.weekNum === selectedWeek) || monthWeeks[0];

  const filteredRecords = (report?.dailyRecords || []).filter(r => {
    if (!r.date) return false;
    const dateStr = typeof r.date === 'string' && r.date.includes('T') ? r.date.split('T')[0] : (new Date(r.date).toISOString().split('T')[0]);
    
    // Filter by active week
    if (activeWeekInfo) {
      if (dateStr < activeWeekInfo.startDateStr || dateStr > activeWeekInfo.endDateStr) {
        return false;
      }
    }

    if (statusFilter !== "All Status") {
      if (statusFilter === "Present" && r.status !== "Present") return false;
      if (statusFilter === "Absent" && r.status !== "Absent") return false;
      if (statusFilter === "Leave" && r.status !== "Leave") return false;
      if (statusFilter === "Holiday" && (r.status !== "Holiday" && r.status !== "Week Off")) return false;
      if (statusFilter === "Week Off" && r.status !== "Week Off") return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const dtFormatted = new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toLowerCase();
      const statusText = (r.status || '').toLowerCase();
      if (!dtFormatted.includes(q) && !statusText.includes(q)) return false;
    }

    return true;
  }).reverse(); // Show latest first within active week

  return (
    <>
      <div className="epa-page">

                        
                        <div className={`epa-page-header${embedded ? " d-none" : ""}`}>
                            <div>

                                <h2 className="epa-title">Attendance</h2>
                                <p className="epa-subtitle">
                                    Track attendance, working hours, overtime and daily attendance status.
                                </p>
                            </div>

                            <div className="epa-header-actions">
                                <div>
                                    <button type="button" className="epd-upload-btn" id="epdHeaderUploadBtn">
                                        <i className="bi bi-cloud-arrow-up"></i>
                                        Export
                                    </button>
                                </div>
                            </div>
                        </div>

                        
                        <div className={`esc-employee-bar${embedded ? " d-none" : ""}`}>

                            <div className="esc-employee-main">

                                <div className="esc-avatar overflow-hidden">
    {dynamicAvatarUrl && !avatarError ? (
      <img
        src={dynamicAvatarUrl}
        alt="Employee"
        onError={() => setAvatarError(true)}
        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "17px" }}
      />
    ) : (
      <>
        {employeeProfile?.first_name?.charAt(0) || currentUser?.email?.charAt(0)?.toUpperCase() || "E"}
        {employeeProfile?.last_name?.charAt(0) || ""}
      </>
    )}
  </div>

                                <div className="esc-employee-info">
                                    <div className="esc-name-row">
                                        <h3>{employeeProfile?.first_name ? `${employeeProfile.first_name} ${employeeProfile.last_name || ''}` : currentUser?.email}</h3>
                                        <span className="esc-status-badge">
                                            <span></span>
                                            Active
                                        </span>
                                    </div>

                                    <p>{employeeProfile?.designation || "Senior Software Engineer"}</p>

                                    <div className="esc-employee-meta">
                                        <span>
                                            <i className="bi bi-diagram-3"></i>
                                            {employeeProfile?.department || "Engineering"}
                                        </span>
                                        <span>
                                            <i className="bi bi-geo-alt"></i>
                                            {employeeProfile?.city || employeeProfile?.location || "Nagpur"}
                                        </span>
                                        <span>
                                            <i className="bi bi-person-badge"></i>
                                            {employeeProfile?.employee_code || "EMP-1360"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="esc-employee-side">
                                <span className="esc-side-label">Current Shift</span>
                                <strong>General Shift</strong> 
                                <strong>09:00 AM - 06:00 PM</strong> 
                                <div><strong>Today's Punch time : {!loading && report?.dailyRecords?.find(r => new Date(r.date).toISOString().split('T')[0] === new Date().toISOString().split('T')[0])?.checkIn ? new Date(report.dailyRecords.find(r => new Date(r.date).toISOString().split('T')[0] === new Date().toISOString().split('T')[0]).checkIn).toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'}) : "--"}</strong> </div>
                            </div>

                        </div>


                        
                        <div className="row g-4 epa-summary-row">

                            {/* Card 1: Present Days */}
                            <div className="col-xl-4 col-md-6">
                                <div className="epa-summary-card">
                                    <div className="epa-summary-icon epa-purple">
                                        <i className="bi bi-person-check"></i>
                                    </div>
                                    <div>
                                        <span>Present Days</span>
                                        <strong>{loading ? "..." : presentCount}</strong>
                                        <small>of {loading ? "..." : workingDays} working days</small>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Average Check-in */}
                            <div className="col-xl-4 col-md-6">
                                <div className="epa-summary-card">
                                    <div className="epa-summary-icon epa-green">
                                        <i className="bi bi-alarm"></i>
                                    </div>
                                    <div>
                                        <span>Average Check-in</span>
                                        <strong>{loading ? "..." : avgCheckIn}</strong>
                                        <small>This month</small>
                                    </div>
                                </div>
                            </div>

                            {/* Card 3: Average Check-out */}
                            <div className="col-xl-4 col-md-6">
                                <div className="epa-summary-card">
                                    <div className="epa-summary-icon epa-blue">
                                        <i className="bi bi-box-arrow-right"></i>
                                    </div>
                                    <div>
                                        <span>Average Check-out</span>
                                        <strong>{loading ? "..." : avgCheckOut}</strong>
                                        <small>This month</small>
                                    </div>
                                </div>
                            </div>

                            {/* Card 4: Average Hours */}
                            <div className="col-xl-4 col-md-6">
                                <div className="epa-summary-card">
                                    <div className="epa-summary-icon epa-orange">
                                        <i className="bi bi-hourglass-split"></i>
                                    </div>
                                    <div>
                                        <span>Average Hours</span>
                                        <strong>{loading ? "..." : avgHours}</strong>
                                        <small>This Month</small>
                                    </div>
                                </div>
                            </div>

                            {/* Card 5: Late Arrivals */}
                            <div className="col-xl-4 col-md-6">
                                <div className="epa-summary-card">
                                    <div className="epa-summary-icon epa-purple">
                                        <i className="bi bi-exclamation-circle"></i>
                                    </div>
                                    <div>
                                        <span>Late Arrivals</span>
                                        <strong>{loading ? "..." : `${lateCount} Days`}</strong>
                                        <small>This month</small>
                                    </div>
                                </div>
                            </div>

                            {/* Card 6: On Time Arrivals */}
                            <div className="col-xl-4 col-md-6">
                                <div className="epa-summary-card">
                                    <div className="epa-summary-icon epa-blue">
                                        <i className="bi bi-person-badge"></i>
                                    </div>
                                    <div>
                                        <span>On Time Arrivals</span>
                                        <strong>{loading ? "..." : `${onTimeCount} Days`}</strong>
                                        <small>This month</small>
                                    </div>
                                </div>
                            </div>

                        </div>


                        
                        <div className="row g-4 epa-overview-row">

                            {/* Chart Card */}
                            <div className="col-xl-8">
                                <div className="epa-card epa-chart-card">

                                    <div className="epa-card-header common-card-heading">
                                        <div>
                                            <span className="epa-section-label">ATTENDANCE OVERVIEW</span>
                                            <h3>Daily Hours Breakdown</h3>
                                            <p>Standard, overtime, leave and shortfall hours for the selected month.</p>
                                        </div>

                                        <div className="epa-chart-legend">
                                            <span>
                                                <i className="epa-dot epa-dot-standard"></i>
                                                Standard Hours
                                            </span>

                                            <span>
                                                <i className="epa-dot epa-dot-overtime"></i>
                                                Overtime Hours
                                            </span>

                                            <span>
                                                <i className="epa-dot epa-dot-leave"></i>
                                                Leave Days / Hours
                                            </span>

                                            <span>
                                                <i className="epa-dot epa-dot-shortfall"></i>
                                                Shortfall / Absent Hours
                                            </span>
                                        </div>
                                    </div>

                                    {!loading && <Chart options={lineChartOptions} series={lineChartSeries} type="line" height={255} />}

                                </div>
                            </div>


                            {/* Monthly Breakdown Card */}
                            <div className="col-xl-4">
                                <div className="epa-card epa-breakdown-card">

                                    <div className="epa-card-header common-card-heading">
                                        <div>
                                            <span className="epa-section-label">MONTHLY STATUS</span>
                                            <h3>Attendance Breakdown</h3>
                                            <p>Attendance distribution for this month.</p>
                                        </div>
                                    </div>

                                    <div className="epa-donut-wrapper">
                                        <div id="epaAttendanceDonut">{!loading && <Chart options={donutOptions} series={donutSeries} type="donut" height={200} />}</div>

                                        <div className="epa-donut-center">
                                            <strong>{!loading ? Math.round((presentCount / ((presentCount + absentCount + leaveCount) || 1)) * 100) + "%" : "..."}</strong>
                                            <span>Attendance</span>
                                        </div>
                                    </div>

                                    <div className="epa-status-list">

                                        <div className="epa-status-item">
                                            <div>
                                                <span className="epa-status-dot present"></span>
                                                Present
                                            </div>
                                            <strong>{presentCount} Days</strong>
                                        </div>

                                        <div className="epa-status-item">
                                            <div>
                                                <span className="epa-status-dot leave"></span>
                                                Leave
                                            </div>
                                            <strong>{leaveCount} Days</strong>
                                        </div>

                                        <div className="epa-status-item">
                                            <div>
                                                <span className="epa-status-dot absent"></span>
                                                Absent
                                            </div>
                                            <strong>{absentCount} Days</strong>
                                        </div>

                                    </div>

                                </div>
                            </div>

                        </div>


                        
                        <div className="epa-card epa-records-card">

                            <div className="epa-card-header epa-record-header common-card-heading">

                                <div>
                                    <span className="epa-section-label">DAILY RECORDS</span>
                                    <h3>Employee Attendance</h3>
                                    <p>
                                        Daily check-in, check-out and working hour records.
                                    </p>
                                </div>

                                <div className="epa-record-actions">

                                    <div className="epa-search-box">
                                        <i className="bi bi-search"></i>
                                        <input 
                                            type="text" 
                                            id="epaAttendanceSearch"
                                            placeholder="Search date or status..." 
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                        />
                                    </div>

                                    <select 
                                        id="epaStatusFilter" 
                                        className="form-select epa-filter-select"
                                        value={statusFilter}
                                        onChange={e => setStatusFilter(e.target.value)}
                                    >
                                        <option value="All Status">All Status</option>
                                        <option value="Present">Present</option>
                                        <option value="Absent">Absent</option>
                                        <option value="Leave">Leave</option>
                                        <option value="Holiday">Holiday</option>
                                        <option value="Week Off">Week Off</option>
                                    </select>

                                </div>

                            </div>


                            <div className="table-responsive epa-table-wrapper">

                                <table className="table epa-attendance-table">

                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Check In</th>
                                            <th>Check Out</th>
                                            <th>Hours</th>
                                            <th>Status</th>
                                            <th className="text-end">Action</th>
                                        </tr>
                                    </thead>

                                    <tbody id="epaAttendanceTableBody">
  {loading && <tr><td colSpan="6" className="text-center py-4">Loading...</td></tr>}
  {!loading && filteredRecords.length === 0 && (
    <tr><td colSpan="6" className="text-center py-4 text-muted">No attendance records found for this week.</td></tr>
  )}
  {!loading && filteredRecords.map((row, i) => (
    <tr key={i}>
      <td>
        <div className="fw-bold">{new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
      </td>
      <td>
        {row.checkIn ? <><i className="bi bi-box-arrow-in-right text-primary me-2"></i>{new Date(row.checkIn).toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'})}</> : "--"}
      </td>
      <td>
        {row.checkOut ? <><i className="bi bi-box-arrow-right text-danger me-2"></i>{new Date(row.checkOut).toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'})}</> : "--"}
      </td>
      <td className="fw-bold">{row.hoursDisplay}</td>
      <td>
        {row.status === 'Present' && <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2"><span className="me-1">✔</span> Present</span>}
        {row.status === 'Leave' && <span className="badge bg-warning bg-opacity-10 text-warning rounded-pill px-3 py-2"><span className="me-1">●</span> Leave</span>}
        {row.status === 'Absent' && <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill px-3 py-2"><span className="me-1">✖</span> Absent</span>}
        {row.status === 'Holiday' && <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill px-3 py-2"><i className="bi bi-calendar-event me-1"></i> Holiday ({row.holidayName || 'Holiday'})</span>}
        {row.status === 'Week Off' && <span className="badge bg-info bg-opacity-10 text-info rounded-pill px-3 py-2" style={{ backgroundColor: 'rgba(13, 202, 240, 0.12)', color: '#0dcaf0' }}><i className="bi bi-calendar-x me-1"></i> Week Off</span>}
        {row.status === '-' && <span className="text-muted">--</span>}
      </td>
      <td className="text-end">
        <button type="button" className="btn btn-sm btn-light text-primary rounded-circle ms-auto" style={{width:"32px", height:"32px", display:"flex", alignItems:"center", justifyContent:"center"}} onClick={() => { setSelectedDate(row); setShowModal(true); }}>
          <i className="bi bi-eye"></i>
        </button>
      </td>
    </tr>
  ))}
</tbody>

                                </table>

                            </div>

                            {/* Week-wise Pagination Controls */}
                            {monthWeeks.length > 0 && (
                              <div className="epa-table-footer d-flex align-items-center justify-content-between p-3 border-top">
                                <span className="text-muted" style={{ fontSize: '13px' }}>
                                  {activeWeekInfo ? (
                                    <>
                                      Showing <strong className="text-dark">{activeWeekInfo.label}</strong> ({activeWeekInfo.startLabel} - {activeWeekInfo.endLabel}) · {filteredRecords.length} record(s)
                                    </>
                                  ) : (
                                    `Showing ${filteredRecords.length} record(s)`
                                  )}
                                </span>
                                <div className="epa-pagination d-flex align-items-center gap-1">
                                  <button 
                                    className={`btn btn-sm btn-outline-secondary ${selectedWeek <= 1 ? 'disabled' : ''}`}
                                    style={{ borderRadius: '8px', padding: '4px 10px' }}
                                    disabled={selectedWeek <= 1}
                                    onClick={() => setSelectedWeek(prev => Math.max(1, (prev || 1) - 1))}
                                  >
                                    <i className="bi bi-chevron-left"></i>
                                  </button>
                                  {monthWeeks.map(w => {
                                    const isSelected = selectedWeek === w.weekNum;
                                    return (
                                      <button
                                        key={w.weekNum}
                                        type="button"
                                        className="btn btn-sm"
                                        style={{
                                          borderRadius: '8px',
                                          padding: '5px 12px',
                                          fontWeight: isSelected ? '600' : '400',
                                          backgroundColor: isSelected ? '#3c2fbc' : '#f8f9fa',
                                          color: isSelected ? '#fff' : '#64748b',
                                          border: isSelected ? '1px solid #3c2fbc' : '1px solid #e2e8f0'
                                        }}
                                        onClick={() => setSelectedWeek(w.weekNum)}
                                      >
                                        {w.label}
                                      </button>
                                    );
                                  })}
                                  <button 
                                    className={`btn btn-sm btn-outline-secondary ${selectedWeek >= monthWeeks.length ? 'disabled' : ''}`}
                                    style={{ borderRadius: '8px', padding: '4px 10px' }}
                                    disabled={selectedWeek >= monthWeeks.length}
                                    onClick={() => setSelectedWeek(prev => Math.min(monthWeeks.length, (prev || 1) + 1))}
                                  >
                                    <i className="bi bi-chevron-right"></i>
                                  </button>
                                </div>
                              </div>
                            )}

                        </div>


                        
                        
{showModal && selectedDate && createPortal(
  <>
    <div className="modal-backdrop fade show" style={{ zIndex: 9998, position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.5)" }}></div>
    <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 9999, position: "fixed", top: 0, left: 0, width: "100%", height: "100%", overflowX: "hidden", overflowY: "auto", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowModal(false)}>
      <div className="modal-dialog modal-dialog-centered modal-lg" style={{ width: "100%", maxWidth: "800px", margin: "1.75rem auto" }} onClick={e => e.stopPropagation()}>
        <div className="modal-content" style={{ border: 'none', borderRadius: '12px', backgroundColor: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
          <div className="modal-header d-flex justify-content-between align-items-center" style={{ borderBottom: '1px solid #eee', padding: '20px 24px' }}>
            <h5 className="modal-title mb-0" style={{ fontWeight: 600, fontSize: '18px', color: '#1a1d27' }}>Attendance Information</h5>
            <span className="badge rounded-pill" style={{ backgroundColor: '#f5f4fa', color: '#5b50a1', padding: '6px 12px', fontWeight: 500, fontSize: '13px' }}>
              {new Date(selectedDate.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')}
            </span>
          </div>
          
          <div className="modal-body" style={{ padding: '24px' }}>
            <div className="row g-3">
              <div className="col-md-3 col-sm-6">
                <div className="p-3 rounded" style={{ border: '1px solid #eee' }}>
                  <div style={{ fontSize: '12px', color: '#8a90a2', marginBottom: '4px' }}>Date</div>
                  <div style={{ fontWeight: 600, color: '#1a1d27', fontSize: '14px' }}>{new Date(selectedDate.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')}</div>
                </div>
              </div>
              <div className="col-md-3 col-sm-6">
                <div className="p-3 rounded" style={{ border: '1px solid #eee' }}>
                  <div style={{ fontSize: '12px', color: '#8a90a2', marginBottom: '4px' }}>Shift</div>
                  <div style={{ fontWeight: 600, color: '#1a1d27', fontSize: '14px' }}>General Shift</div>
                </div>
              </div>
              <div className="col-md-3 col-sm-6">
                <div className="p-3 rounded" style={{ border: '1px solid #eee' }}>
                  <div style={{ fontSize: '12px', color: '#8a90a2', marginBottom: '4px' }}>Check-in</div>
                  <div style={{ fontWeight: 600, color: '#1a1d27', fontSize: '14px' }}>{selectedDate?.checkIn ? new Date(selectedDate.checkIn).toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'}) : "--"}</div>
                </div>
              </div>
              <div className="col-md-3 col-sm-6">
                <div className="p-3 rounded" style={{ border: '1px solid #eee' }}>
                  <div style={{ fontSize: '12px', color: '#8a90a2', marginBottom: '4px' }}>Check-out</div>
                  <div style={{ fontWeight: 600, color: '#1a1d27', fontSize: '14px' }}>{selectedDate?.checkOut ? new Date(selectedDate.checkOut).toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'}) : "--"}</div>
                </div>
              </div>

              <div className="col-md-3 col-sm-6">
                <div className="p-3 rounded" style={{ border: '1px solid #eee' }}>
                  <div style={{ fontSize: '12px', color: '#8a90a2', marginBottom: '4px' }}>Break</div>
                  <div style={{ fontWeight: 600, color: '#1a1d27', fontSize: '14px' }}>{selectedDate?.status === 'Present' ? "01h 00m" : "--"}</div>
                </div>
              </div>
              <div className="col-md-3 col-sm-6">
                <div className="p-3 rounded" style={{ border: '1px solid #eee' }}>
                  <div style={{ fontSize: '12px', color: '#8a90a2', marginBottom: '4px' }}>Total Hours</div>
                  <div style={{ fontWeight: 600, color: '#1a1d27', fontSize: '14px' }}>{selectedDate?.hoursDisplay || "--"}</div>
                </div>
              </div>
              <div className="col-md-3 col-sm-6">
                <div className="p-3 rounded" style={{ border: '1px solid #eee' }}>
                  <div style={{ fontSize: '12px', color: '#8a90a2', marginBottom: '4px' }}>Overtime</div>
                  <div style={{ fontWeight: 600, color: '#1a1d27', fontSize: '14px' }}>{selectedDate && selectedDate.hours > 9 ? ((selectedDate.hours - 9)*60).toFixed(0) + "m" : "0m"}</div>
                </div>
              </div>
              <div className="col-md-3 col-sm-6">
                <div className="p-3 rounded" style={{ border: '1px solid #eee' }}>
                  <div style={{ fontSize: '12px', color: '#8a90a2', marginBottom: '4px' }}>Attendance Status</div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }} className={`epa-detail-status ${selectedDate?.status?.toLowerCase()}`}>{selectedDate?.status || "--"}</div>
                </div>
              </div>

              <div className="col-12">
                <div className="p-3 rounded" style={{ border: '1px solid #eee' }}>
                  <div style={{ fontSize: '12px', color: '#8a90a2', marginBottom: '4px' }}>Remarks</div>
                  <div style={{ fontWeight: 600, color: '#1a1d27', fontSize: '14px' }}>Regular attendance</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="modal-footer" style={{ borderTop: 'none', padding: '0 24px 24px 24px' }}>
            <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      </div>
    </div>
  </>,
  document.body
)}

                        <div className="row g-4 epa-bottom-row">

                            {/* ATTENDANCE INSIGHTS */}
                            <div className="col-xl-7">
                                <div className="epa-card epa-attendance-insights">

                                    <div className="epa-card-header common-card-heading">
                                        <div>
                                            <span className="epa-section-label">ATTENDANCE INSIGHTS</span>
                                            <h3>This Month</h3>
                                            <p>Quick attendance observations for the employee.</p>
                                        </div>
                                    </div>

                                    <div className="row g-3">

                                        <div className="col-md-4">
                                            <div className="epa-insight-box">
                                                <div className="epa-insight-icon">
                                                    <i className="bi bi-clock"></i>
                                                </div>
                                                <div>
                                                    <span>Total Hours</span>
                                                    <strong>{loading ? "..." : totalHoursDisplay}</strong>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-md-4">
                                            <div className="epa-insight-box">
                                                <div className="epa-insight-icon">
                                                    <i className="bi bi-calendar4-week"></i>
                                                </div>
                                                <div>
                                                    <span>Leave Days</span>
                                                    <strong>{loading ? "..." : leaveCount}</strong>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-md-4">
                                            <div className="epa-insight-box">
                                                <div className="epa-insight-icon">
                                                    <i className="bi bi-stopwatch"></i>
                                                </div>
                                                <div>
                                                    <span>Overtime</span>
                                                    <strong>{loading ? "..." : overtimeDisplay}</strong>
                                                </div>
                                            </div>
                                        </div>

                                    </div>

                                </div>
                            </div>

                            {/* REGULARIZATION */}
                            <div className="col-xl-5">
                                <div className="epa-card epa-regularization-card">

                                    <div className="epa-card-header common-card-heading">
                                        <div>
                                            <span className="epa-section-label">REGULARIZATION</span>
                                            <h3>Attendance Requests</h3>
                                            <p>Recent attendance corrections.</p>
                                        </div>

                                        {onNavigate && (
                                            <button
                                                type="button"
                                                onClick={() => onNavigate("employee-requests")}
                                                className="btn btn-sm text-white"
                                                style={{
                                                    backgroundColor: "#3c2fbc",
                                                    borderRadius: "8px",
                                                    fontWeight: 600,
                                                    fontSize: "12px",
                                                    padding: "6px 14px",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                    cursor: "pointer",
                                                    border: "none"
                                                }}
                                            >
                                                Employee Requests <i className="bi bi-arrow-up-right"></i>
                                            </button>
                                        )}
                                    </div>

                                    <div className="epa-regularization-list">
                                        {corrections && corrections.length > 0 ? (
                                            corrections.slice(0, 4).map((req, idx) => {
                                                const d = req.attendance_date ? new Date(req.attendance_date) : (req.created_at ? new Date(req.created_at) : null);
                                                const reqDate = d && !isNaN(d) ? `${String(d.getDate()).padStart(2, '0')}-${d.toLocaleDateString('en-US', { month: 'short' })}-${d.getFullYear()}` : "--";
                                                const isApproved = (req.status || '').toLowerCase() === 'approved';
                                                const issueText = req.issue_type || req.reason || req.subject || 'Check-out missing';
                                                return (
                                                    <div className="epa-request-row" key={req.id || idx}>
                                                        <div className="epa-request-icon">
                                                            <i className={`bi ${isApproved ? 'bi-check2-circle' : 'bi-pencil-square'}`}></i>
                                                        </div>

                                                        <div className="epa-request-content">
                                                            <strong>Attendance Correction</strong>
                                                            <span>{reqDate} &bull; {issueText}</span>
                                                        </div>

                                                        <span className={`epa-request-status ${isApproved ? 'approved' : 'pending'}`}>
                                                            {req.status || 'Pending'}
                                                        </span>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div style={{ padding: '24px 0', textAlign: 'center', color: '#85889b', fontSize: '13px' }}>
                                                <i className="bi bi-calendar-check" style={{ fontSize: '24px', display: 'block', marginBottom: '6px', color: '#b0b3c6' }}></i>
                                                No attendance correction requests found.
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>

                        </div>

                    </div>
    </>
  );
}

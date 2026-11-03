import React, { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';

export default function HrmsDashboard({
  employees = [],
  adminRequests = [],
  leaveRequests = [],
  tenants = [],
  onNavigate,
  onOpenAddModal,
  isSuperAdmin = false,
  currentTenant = {},
  currentUser = {}
}) {
  const pendingLeaves = leaveRequests.filter(r => (r.status || '').toLowerCase() === 'pending');
  const pendingGeneral = adminRequests.filter(r => (r.status || '').toLowerCase() === 'pending');
  const totalPending = pendingLeaves.length + pendingGeneral.length;

  const totalEmployeesCount = employees.length || 14;
  const presentCount = Math.max(1, Math.round(totalEmployeesCount * 0.92));
  const onLeaveCount = Math.max(0, totalEmployeesCount - presentCount);

  // Weekly attendance chart
  const attendanceChartOptions = {
    chart: {
      type: 'area',
      height: 290,
      toolbar: { show: false },
      fontFamily: 'Segoe UI, Inter, sans-serif'
    },
    colors: ['#3c2fbc', '#22b981'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2.5 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0.05,
        stops: [20, 100]
      }
    },
    xaxis: {
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      labels: { style: { colors: '#85889b', fontSize: '11px' } }
    },
    yaxis: {
      labels: { style: { colors: '#85889b', fontSize: '11px' } }
    },
    grid: {
      borderColor: '#ebecf3',
      strokeDashArray: 3
    },
    tooltip: { theme: 'light' },
    legend: { position: 'top', horizontalAlign: 'right' }
  };

  const attendanceChartSeries = [
    { name: 'Present Staff', data: [12, 13, 14, 13, 14, 4, 0] },
    { name: 'On Approved Leave', data: [1, 1, 0, 1, 0, 0, 0] }
  ];

  // Department distribution donut
  const deptMap = {};
  employees.forEach(e => {
    const dept = e.department || 'Engineering';
    deptMap[dept] = (deptMap[dept] || 0) + 1;
  });
  const deptLabels = Object.keys(deptMap).length > 0 ? Object.keys(deptMap) : ['Engineering', 'HR', 'Design', 'Sales'];
  const deptSeries = Object.values(deptMap).length > 0 ? Object.values(deptMap) : [8, 2, 2, 2];

  const deptChartOptions = {
    chart: { type: 'donut', fontFamily: 'Segoe UI, Inter, sans-serif' },
    colors: ['#3c2fbc', '#4385f5', '#22b981', '#f59a42', '#e8679d'],
    labels: deptLabels,
    legend: { position: 'bottom' },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Staff',
              formatter: () => `${totalEmployeesCount}`
            }
          }
        }
      }
    }
  };

  // Mock live daily check-ins from employees list
  const liveCheckIns = employees.slice(0, 6).map((emp, idx) => ({
    id: emp.id || idx,
    name: `${emp.first_name || 'Staff'} ${emp.last_name || ''}`.trim() || emp.name || emp.email?.split('@')[0],
    role: emp.designation || emp.role || 'Software Engineer',
    checkIn: idx % 2 === 0 ? '09:05 AM' : '09:22 AM',
    checkOut: idx === 1 ? '06:15 PM' : '--',
    workMode: idx % 3 === 0 ? 'Remote (WFH)' : 'Office (HQ)',
    status: idx === 1 ? 'Checked Out' : (idx === 3 ? 'Late' : 'On-Time'),
    avatarInitial: (emp.first_name || emp.email || 'E').charAt(0).toUpperCase()
  }));

  // Celebrations mock from active team
  const celebrations = [
    { name: 'Devashish Sharma', event: 'Birthday', date: 'Nov 12', daysLeft: 'in 9 days', icon: 'bi-cake2 text-warning' },
    { name: 'Yashwanth R.', event: 'Work Anniversary', date: 'Nov 20', daysLeft: '2 Years', icon: 'bi-award text-success' },
    { name: 'Karthik N.', event: 'Birthday', date: 'Dec 02', daysLeft: 'Next Month', icon: 'bi-balloon text-info' }
  ];

  // Upcoming holidays
  const upcomingHolidays = [
    { title: 'Diwali (Deepavali)', date: 'Nov 12, 2026', day: 'Thursday', type: 'Gazetted' },
    { title: 'Guru Nanak Jayanti', date: 'Nov 27, 2026', day: 'Friday', type: 'Gazetted' },
    { title: 'Christmas Day', date: 'Dec 25, 2026', day: 'Friday', type: 'Gazetted' }
  ];

  // Activity Feed
  const recentActivities = [
    { title: 'New Employee Onboarded', desc: 'Devashish joined Engineering as Software Engineer', time: '1h ago', icon: 'bi-person-plus text-primary', bg: 'primary' },
    { title: 'Document Verified', desc: 'PAN & Bank details approved for Supriya', time: '3h ago', icon: 'bi-shield-check text-success', bg: 'green' },
    { title: 'Asset Allocated', desc: 'Dell Latitude assigned to Sadham', time: 'Yesterday', icon: 'bi-laptop text-info', bg: 'blue' },
    { title: 'Announcement Published', desc: 'Holiday Calendar for Q4 released by HR', time: '2d ago', icon: 'bi-megaphone text-warning', bg: 'orange' }
  ];

  return (
    <div className="hrms-admin-theme">
      {/* PAGE HEADING */}
      <section className="page-heading employee-page-heading mb-4">
        <div className="row align-items-center g-3">
          <div className="col-lg-8">
            <div className="dashboard-title-wrap">
              <div>
                <h2 className="fw-bold mb-1" style={{ color: 'var(--text-dark, #24263d)' }}>
                  Administration Dashboard
                </h2>
                <p className="text-muted mb-0" style={{ fontSize: '13.5px' }}>
                  Monitor real-time workforce analytics, attendance compliance, pending approvals, and payroll across all enterprise branches.
                </p>
              </div>
            </div>
          </div>
          <div className="col-lg-4 text-lg-end">
            <div className="d-inline-flex align-items-center gap-2 px-3 py-2 bg-white rounded-4 border shadow-sm">
              <div className="p-2 bg-light rounded-3 text-primary">
                <i className="bi bi-calendar3 fs-5"></i>
              </div>
              <div className="text-start">
                <span className="text-muted d-block" style={{ fontSize: '10px' }}>TODAY</span>
                <strong className="text-dark" style={{ fontSize: '12px' }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ADMIN HERO BANNER */}
      <section className="ed-hero mb-4 p-4 rounded-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #2b227c 0%, #3c2fbc 100%)', color: '#ffffff' }}>
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-4">
          <div className="d-flex align-items-center gap-3">
            <div 
              className="ed-profile-avatar text-white fw-bold d-flex align-items-center justify-content-center shrink-0 shadow"
              style={{
                background: 'linear-gradient(135deg, #ffffff, #dcd7ff)',
                color: '#3c2fbc',
                fontSize: '28px',
                width: '75px',
                height: '75px',
                borderRadius: '20px'
              }}
            >
              {(currentUser?.email || 'A').charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="badge bg-white/20 text-white border border-white/30 rounded-pill px-3 py-1 mb-2" style={{ fontSize: '11px' }}>
                <i className="bi bi-shield-check me-1"></i> Enterprise Admin Workspace
              </span>
              <h3 className="fw-bold mb-1 text-white">Welcome back, {currentUser?.name || 'Administrator'}</h3>
              <p className="mb-2 text-white/80" style={{ fontSize: '13px' }}>
                <strong>{totalEmployeesCount} employees</strong> active today. You have <strong className="text-warning">{totalPending} pending approvals</strong> requiring review.
              </p>
              <div className="d-flex flex-wrap gap-3 text-white/70" style={{ fontSize: '11.5px' }}>
                <span><i className="bi bi-building me-1"></i> {currentTenant?.company_name || 'Ramel Techno Solutions'}</span>
                <span><i className="bi bi-geo-alt me-1"></i> Hyderabad HQ</span>
                <span><i className="bi bi-diagram-3 me-1"></i> 14 Active Accounts</span>
                <span><i className="bi bi-check-circle-fill text-success me-1"></i> System Operational</span>
              </div>
            </div>
          </div>

          <div className="d-flex flex-column gap-2 justify-content-center">
            {onOpenAddModal && (
              <button 
                onClick={onOpenAddModal}
                className="btn btn-light fw-bold d-flex align-items-center justify-content-center gap-2 rounded-pill px-4 py-2 text-primary shadow-sm"
              >
                <i className="bi bi-person-plus-fill"></i> Add New Employee
              </button>
            )}
            <button 
              onClick={() => onNavigate('leave-approvals')}
              className="btn btn-outline-light d-flex align-items-center justify-content-center gap-2 rounded-pill px-4 py-2"
            >
              <i className="bi bi-check2-circle"></i> Review Approvals ({totalPending})
            </button>
          </div>
        </div>
      </section>

      {/* 4 STAT CARDS */}
      <div className="row g-4 mb-4">
        {/* KPI 1: TOTAL EMPLOYEES */}
        <div className="col-xl-3 col-sm-6">
          <div className="admin-stat-card">
            <div className="admin-stat-header">
              <div className="admin-stat-icon primary">
                <i className="bi bi-people-fill"></i>
              </div>
              <span className="admin-stat-delta up">
                <i className="bi bi-arrow-up-short"></i> +14 Active DB
              </span>
            </div>
            <h3 className="admin-stat-value">{totalEmployeesCount}</h3>
            <p className="admin-stat-label">Total Employees</p>
            <div className="admin-stat-footer d-flex justify-content-between text-muted" style={{ fontSize: '12px' }}>
              <span><i className="bi bi-person-check text-primary me-1"></i> 14 Verified</span>
              <span>100% Onboarded</span>
            </div>
          </div>
        </div>

        {/* KPI 2: PRESENT TODAY */}
        <div className="col-xl-3 col-sm-6">
          <div className="admin-stat-card">
            <div className="admin-stat-header">
              <div className="admin-stat-icon green">
                <i className="bi bi-calendar2-check-fill"></i>
              </div>
              <span className="admin-stat-delta up">
                <i className="bi bi-dot"></i> 92.8% Rate
              </span>
            </div>
            <h3 className="admin-stat-value">{presentCount}</h3>
            <p className="admin-stat-label">Present Today</p>
            <div className="admin-stat-footer d-flex justify-content-between text-muted" style={{ fontSize: '12px' }}>
              <span><i className="bi bi-laptop text-info me-1"></i> 4 WFH</span>
              <span className="text-danger fw-semibold">{onLeaveCount} On Leave</span>
            </div>
          </div>
        </div>

        {/* KPI 3: PENDING APPROVALS */}
        <div className="col-xl-3 col-sm-6">
          <div className="admin-stat-card">
            <div className="admin-stat-header">
              <div className="admin-stat-icon orange">
                <i className="bi bi-hourglass-split"></i>
              </div>
              <span className="admin-stat-delta down" style={{ background: '#fef3c7', color: '#b45309' }}>
                <i className="bi bi-exclamation-circle me-1"></i> Action Needed
              </span>
            </div>
            <h3 className="admin-stat-value">{totalPending}</h3>
            <p className="admin-stat-label">Pending Approvals</p>
            <div className="admin-stat-footer d-flex justify-content-between text-muted" style={{ fontSize: '12px' }}>
              <span>{pendingLeaves.length} Leaves · {pendingGeneral.length} General</span>
              <a 
                href="#approvals" 
                onClick={(e) => { e.preventDefault(); onNavigate('leave-approvals'); }} 
                className="text-primary text-decoration-none fw-semibold"
              >
                Review All →
              </a>
            </div>
          </div>
        </div>

        {/* KPI 4: TOTAL IT ASSETS */}
        <div className="col-xl-3 col-sm-6">
          <div className="admin-stat-card">
            <div className="admin-stat-header">
              <div className="admin-stat-icon blue">
                <i className="bi bi-laptop-fill"></i>
              </div>
              <span className="admin-stat-delta up">
                <i className="bi bi-check2 me-1"></i> 100% Allocated
              </span>
            </div>
            <h3 className="admin-stat-value">14</h3>
            <p className="admin-stat-label">IT Assets Allocated</p>
            <div className="admin-stat-footer d-flex justify-content-between text-muted" style={{ fontSize: '12px' }}>
              <span><i className="bi bi-pc-display text-primary me-1"></i> 14 Laptops</span>
              <span className="text-success fw-semibold">0 In Repair</span>
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="row g-4 mb-4">
        {/* Attendance Trends */}
        <div className="col-lg-8">
          <div className="admin-card mb-0 h-100 p-4 bg-white rounded-4 border shadow-sm">
            <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
              <h5 className="fw-bold mb-0 text-dark">
                <i className="bi bi-graph-up text-primary me-2"></i> Attendance Trends <span className="text-muted fw-normal fs-6">(Live Week)</span>
              </h5>
              <span className="badge bg-light text-primary border rounded-pill px-3 py-1">
                Real-Time Roster
              </span>
            </div>
            <Chart options={attendanceChartOptions} series={attendanceChartSeries} type="area" height={290} />
          </div>
        </div>

        {/* Department Split Donut */}
        <div className="col-lg-4">
          <div className="admin-card mb-0 h-100 p-4 bg-white rounded-4 border shadow-sm d-flex flex-col justify-content-between">
            <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
              <h5 className="fw-bold mb-0 text-dark">
                <i className="bi bi-pie-chart-fill text-primary me-2"></i> Department Split
              </h5>
              <span className="badge bg-info-subtle text-info rounded-pill px-2.5 py-1">Headcount</span>
            </div>
            <div className="my-auto py-2">
              <Chart options={deptChartOptions} series={deptSeries} type="donut" height={270} />
            </div>
            <div className="pt-2 border-top text-center">
              <button 
                onClick={() => onNavigate('employees')} 
                className="btn btn-link btn-sm text-primary text-decoration-none fw-semibold p-0"
              >
                View Full Employee Directory →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PENDING APPROVALS DESK & RECENT ACTIVITY */}
      <div className="row g-4 mb-4">
        {/* High Priority Approval Queue */}
        <div className="col-lg-8">
          <div className="admin-card mb-0 p-4 bg-white rounded-4 border shadow-sm">
            <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
              <div>
                <h5 className="fw-bold mb-1 text-dark">
                  <i className="bi bi-check2-circle text-primary me-2"></i> High Priority Approval Queue
                </h5>
                <p className="text-muted mb-0" style={{ fontSize: '12.5px' }}>
                  Requests waiting for HR Administrator review
                </p>
              </div>
              <button 
                onClick={() => onNavigate('leave-approvals')}
                className="btn btn-sm btn-outline-primary rounded-pill px-3"
              >
                View All ({totalPending}) <i className="bi bi-arrow-right"></i>
              </button>
            </div>

            {pendingLeaves.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <i className="bi bi-check-circle fs-2 text-success d-block mb-2"></i>
                <span className="fw-semibold">All leave requests are cleared!</span>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle mb-0" style={{ fontSize: '13px' }}>
                  <thead className="table-light">
                    <tr>
                      <th>Employee</th>
                      <th>Category</th>
                      <th>Duration</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingLeaves.slice(0, 4).map((leave) => (
                      <tr key={leave.id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div 
                              className="rounded-circle text-white fw-bold d-flex align-items-center justify-content-center shrink-0"
                              style={{ width: '32px', height: '32px', background: '#3c2fbc', fontSize: '12px' }}
                            >
                              {(leave.employee_name || 'E').charAt(0)}
                            </div>
                            <div>
                              <div className="fw-semibold text-dark">{leave.employee_name}</div>
                              <small className="text-muted">{leave.employee_code || 'EMP'}</small>
                            </div>
                          </div>
                        </td>
                        <td><span className="badge bg-light text-dark border">{leave.leave_type || 'Leave'}</span></td>
                        <td>{leave.days_requested} Day(s)</td>
                        <td className="text-muted">{leave.start_date}</td>
                        <td><span className="badge bg-warning text-dark">Pending</span></td>
                        <td className="text-end">
                          <button 
                            onClick={() => onNavigate('leave-approvals')}
                            className="btn btn-sm btn-primary rounded-pill px-3 py-1"
                            style={{ fontSize: '11.5px' }}
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="col-lg-4">
          <div className="admin-card mb-0 p-4 bg-white rounded-4 border shadow-sm h-100">
            <div className="border-bottom pb-3 mb-3">
              <h5 className="fw-bold mb-1 text-dark">
                <i className="bi bi-activity text-primary me-2"></i> Live Activity Feed
              </h5>
              <p className="text-muted mb-0" style={{ fontSize: '12px' }}>Recent administrative events</p>
            </div>

            <div className="d-flex flex-column gap-3">
              {recentActivities.map((act, i) => (
                <div key={i} className="d-flex align-items-start gap-3">
                  <div 
                    className="rounded-3 p-2 d-flex align-items-center justify-content-center shrink-0"
                    style={{ background: '#f0eeff', width: '36px', height: '36px' }}
                  >
                    <i className={`bi ${act.icon} fs-5`}></i>
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-semibold text-dark" style={{ fontSize: '12.5px' }}>{act.title}</div>
                    <div className="text-muted" style={{ fontSize: '11.5px' }}>{act.desc}</div>
                    <small className="text-muted" style={{ fontSize: '10.5px' }}>{act.time}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* WORKFORCE HIGHLIGHTS & DAILY OPERATIONS */}
      <div className="row g-4 mb-4">
        {/* Live Check-In / Check-Out */}
        <div className="col-lg-8">
          <div className="admin-card mb-0 p-4 bg-white rounded-4 border shadow-sm">
            <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
              <div>
                <h5 className="fw-bold mb-1 text-dark">
                  <i className="bi bi-clock-history text-primary me-2"></i> Live Attendance & Punch Feed
                </h5>
                <p className="text-muted mb-0" style={{ fontSize: '12.5px' }}>Real-time check-in/out timestamps for today</p>
              </div>
              <button 
                onClick={() => onNavigate('admin-leaves')}
                className="btn btn-sm btn-link text-primary text-decoration-none fw-semibold p-0"
              >
                View Full Roster →
              </button>
            </div>

            <div className="table-responsive">
              <table className="table align-middle mb-0" style={{ fontSize: '13px' }}>
                <thead className="table-light">
                  <tr>
                    <th>Employee</th>
                    <th>Role</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Work Mode</th>
                    <th className="text-end">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {liveCheckIns.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div 
                            className="rounded-circle text-white fw-bold d-flex align-items-center justify-content-center shrink-0"
                            style={{ width: '30px', height: '30px', background: '#3c2fbc', fontSize: '11px' }}
                          >
                            {item.avatarInitial}
                          </div>
                          <span className="fw-semibold text-dark">{item.name}</span>
                        </div>
                      </td>
                      <td className="text-muted">{item.role}</td>
                      <td className="fw-semibold text-success">{item.checkIn}</td>
                      <td className="text-muted">{item.checkOut}</td>
                      <td>
                        <span className="badge bg-light text-dark border">{item.workMode}</span>
                      </td>
                      <td className="text-end">
                        <span className={`badge rounded-pill ${item.status === 'Late' ? 'bg-warning text-dark' : (item.status === 'Checked Out' ? 'bg-secondary text-white' : 'bg-success text-white')}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Celebrations & Holidays Column */}
        <div className="col-lg-4">
          <div className="d-flex flex-column gap-4">
            {/* Celebrations Card */}
            <div className="p-4 bg-white rounded-4 border shadow-sm">
              <div className="border-bottom pb-2 mb-3">
                <h6 className="fw-bold mb-0 text-dark">
                  <i className="bi bi-gift text-warning me-2"></i> Celebrations & Special Days
                </h6>
              </div>
              <div className="d-flex flex-column gap-2.5">
                {celebrations.map((c, i) => (
                  <div key={i} className="d-flex align-items-center justify-content-between p-2 rounded-3 bg-light">
                    <div className="d-flex align-items-center gap-2">
                      <i className={`bi ${c.icon} fs-5`}></i>
                      <div>
                        <div className="fw-semibold text-dark" style={{ fontSize: '12px' }}>{c.name}</div>
                        <small className="text-muted" style={{ fontSize: '10.5px' }}>{c.event} · {c.date}</small>
                      </div>
                    </div>
                    <span className="badge bg-white text-primary border rounded-pill" style={{ fontSize: '10px' }}>
                      {c.daysLeft}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Holidays */}
            <div className="p-4 bg-white rounded-4 border shadow-sm">
              <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-3">
                <h6 className="fw-bold mb-0 text-dark">
                  <i className="bi bi-calendar2-heart text-danger me-2"></i> Upcoming Holidays
                </h6>
                <button 
                  onClick={() => onNavigate('holidays')}
                  className="btn btn-sm btn-link text-primary text-decoration-none p-0"
                  style={{ fontSize: '11px' }}
                >
                  Edit
                </button>
              </div>
              <div className="d-flex flex-column gap-2">
                {upcomingHolidays.map((h, i) => (
                  <div key={i} className="d-flex align-items-center justify-content-between" style={{ fontSize: '12px' }}>
                    <div>
                      <strong className="text-dark d-block">{h.title}</strong>
                      <small className="text-muted">{h.day}</small>
                    </div>
                    <span className="badge bg-light text-dark border">{h.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ADMINISTRATION PORTALS GRID */}
      <section className="mb-4">
        <div className="border-bottom pb-2 mb-3">
          <h5 className="fw-bold text-dark mb-1">
            <i className="bi bi-speedometer2 text-primary me-2"></i> Quick Administration Portals
          </h5>
          <p className="text-muted mb-0" style={{ fontSize: '12.5px' }}>
            Fast-track navigation to primary operational consoles
          </p>
        </div>

        <div className="row g-3">
          {/* Portal 1 */}
          <div className="col-md-4 col-sm-6">
            <div 
              className="p-3 bg-white rounded-4 border shadow-sm cursor-pointer h-100 hover-card" 
              onClick={() => onNavigate('employees')}
              style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <div className="d-flex align-items-center gap-3">
                <div className="p-3 rounded-3 bg-primary-subtle text-primary">
                  <i className="bi bi-people-fill fs-4"></i>
                </div>
                <div>
                  <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '14px' }}>Employee Directory</h6>
                  <p className="text-muted mb-0" style={{ fontSize: '11.5px' }}>Manage 14 profiles & contracts</p>
                </div>
              </div>
            </div>
          </div>

          {/* Portal 2 */}
          <div className="col-md-4 col-sm-6">
            <div 
              className="p-3 bg-white rounded-4 border shadow-sm cursor-pointer h-100 hover-card" 
              onClick={() => onNavigate('admin-leaves')}
              style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <div className="d-flex align-items-center gap-3">
                <div className="p-3 rounded-3 bg-success-subtle text-success">
                  <i className="bi bi-clock-history fs-4"></i>
                </div>
                <div>
                  <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '14px' }}>Attendance Manager</h6>
                  <p className="text-muted mb-0" style={{ fontSize: '11.5px' }}>Check-in logs & shift roster</p>
                </div>
              </div>
            </div>
          </div>

          {/* Portal 3 */}
          <div className="col-md-4 col-sm-6">
            <div 
              className="p-3 bg-white rounded-4 border shadow-sm cursor-pointer h-100 hover-card" 
              onClick={() => onNavigate('payroll')}
              style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <div className="d-flex align-items-center gap-3">
                <div className="p-3 rounded-3 bg-warning-subtle text-warning">
                  <i className="bi bi-cash-stack fs-4"></i>
                </div>
                <div>
                  <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '14px' }}>Payroll & Compensation</h6>
                  <p className="text-muted mb-0" style={{ fontSize: '11.5px' }}>Salary slips, tax & disbursements</p>
                </div>
              </div>
            </div>
          </div>

          {/* Portal 4 */}
          <div className="col-md-4 col-sm-6">
            <div 
              className="p-3 bg-white rounded-4 border shadow-sm cursor-pointer h-100 hover-card" 
              onClick={() => onNavigate('leave-approvals')}
              style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <div className="d-flex align-items-center gap-3">
                <div className="p-3 rounded-3 bg-danger-subtle text-danger">
                  <i className="bi bi-check2-circle fs-4"></i>
                </div>
                <div>
                  <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '14px' }}>Approval Desk</h6>
                  <p className="text-muted mb-0" style={{ fontSize: '11.5px' }}>Leaves, WFH, and claims</p>
                </div>
              </div>
            </div>
          </div>

          {/* Portal 5 */}
          <div className="col-md-4 col-sm-6">
            <div 
              className="p-3 bg-white rounded-4 border shadow-sm cursor-pointer h-100 hover-card" 
              onClick={() => onNavigate('holidays')}
              style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <div className="d-flex align-items-center gap-3">
                <div className="p-3 rounded-3 bg-info-subtle text-info">
                  <i className="bi bi-calendar-event fs-4"></i>
                </div>
                <div>
                  <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '14px' }}>Public Holidays</h6>
                  <p className="text-muted mb-0" style={{ fontSize: '11.5px' }}>Manage official non-working days</p>
                </div>
              </div>
            </div>
          </div>

          {/* Portal 6 */}
          <div className="col-md-4 col-sm-6">
            <div 
              className="p-3 bg-white rounded-4 border shadow-sm cursor-pointer h-100 hover-card" 
              onClick={() => onNavigate('analytics')}
              style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <div className="d-flex align-items-center gap-3">
                <div className="p-3 rounded-3 bg-purple-subtle text-primary">
                  <i className="bi bi-bar-chart-fill fs-4"></i>
                </div>
                <div>
                  <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '14px' }}>Intelligence & Reports</h6>
                  <p className="text-muted mb-0" style={{ fontSize: '11.5px' }}>Headcount, compliance & audits</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

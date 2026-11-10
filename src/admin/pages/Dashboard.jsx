import React, { useState } from 'react';
import Chart from 'react-apexcharts';

export default function Dashboard({
  employees = [],
  adminRequests = [],
  leaveRequests = [],
  tenants = [],
  onNavigate,
  onOpenAddModal,
  isSuperAdmin = false,
  currentTenant = {}
}) {
  const [celebrationFilter, setCelebrationFilter] = useState('all');
  const [attendanceTrendFilter, setAttendanceTrendFilter] = useState('current_week');

  const pendingLeaves = leaveRequests.filter(r => (r.status || '').toLowerCase() === 'pending');
  const pendingGeneral = adminRequests.filter(r => (r.status || '').toLowerCase() === 'pending');
  const totalPending = pendingLeaves.length + pendingGeneral.length;

  const totalEmployeesCount = employees.length || 1280;
  const presentCount = Math.round(totalEmployeesCount * 0.93) || 1194;
  const remoteCount = Math.round(totalEmployeesCount * 0.32) || 410;
  const onLeaveCount = pendingLeaves.length || 86;

  const attendanceChartOptions = {
    chart: {
      type: 'area',
      height: 290,
      toolbar: { show: false },
      fontFamily: 'Segoe UI, Outfit, Inter, sans-serif'
    },
    colors: ['#3c2fbc', '#22b981'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [20, 100]
      }
    },
    xaxis: {
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: '#85889b', fontSize: '12px' } }
    },
    yaxis: {
      labels: { style: { colors: '#85889b', fontSize: '12px' } }
    },
    grid: {
      borderColor: '#ebecf3',
      strokeDashArray: 4
    },
    tooltip: { theme: 'light' },
    legend: { position: 'top', horizontalAlign: 'right' }
  };

  const attendanceChartSeries = [
    { name: 'Present Staff', data: [19, 21, 20, 23, 22, 6, 0] },
    { name: 'On Approved Leave', data: [2, 1, 3, 1, 2, 0, 0] }
  ];

  const deptMap = {};
  employees.forEach(e => {
    const dept = e.department || 'Engineering';
    deptMap[dept] = (deptMap[dept] || 0) + 1;
  });
  const deptLabels = Object.keys(deptMap).length > 0 ? Object.keys(deptMap) : ['Engineering', 'HR', 'Design', 'Sales', 'Marketing'];
  const deptSeries = Object.values(deptMap).length > 0 ? Object.values(deptMap) : [14, 4, 3, 3, 2];

  const deptChartOptions = {
    chart: { type: 'donut', fontFamily: 'Segoe UI, Outfit, Inter, sans-serif' },
    colors: ['#3c2fbc', '#4385f5', '#22b981', '#f59a42', '#e8679d'],
    labels: deptLabels,
    legend: { position: 'bottom' },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Headcount',
              formatter: () => `${totalEmployeesCount}`
            }
          }
        }
      }
    }
  };

  const todayDateFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="employee-dashboard px-0">
      <section className="page-heading employee-page-heading mb-4">
        <div className="row align-items-center g-3">
          <div className="col-lg-8">
            <div className="dashboard-title-wrap">
              <div>
                <h2>Administration Dashboard</h2>
                <p>
                  Monitor real-time workforce analytics, attendance compliance, pending approvals,
                  and payroll across all enterprise branches.
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
                <strong>{todayDateFormatted}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="ed-hero mb-4">
        <div className="ed-hero-main">
          <div
            className="ed-profile-avatar"
            style={{
              background: 'linear-gradient(135deg, var(--primary), #9b8cff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              color: '#fff',
              fontWeight: 'bold',
              width: '85px',
              height: '85px',
              borderRadius: '24px'
            }}
          >
            AD
            <span className="ed-online-dot"></span>
          </div>
          <div className="ed-hero-content">
            <span className="ed-eyebrow">
              <i className="bi bi-shield-check"></i> Enterprise Admin Workspace
            </span>
            <h1>Welcome back, Super Admin</h1>
            <p>
              {totalEmployeesCount.toLocaleString()} employees active today. You have <strong>{totalPending} pending approvals</strong> requiring
              executive review and team alerts.
            </p>
            <div className="ed-employee-meta">
              <span><i className="bi bi-building"></i> {currentTenant?.company_name || 'Ramel Techno Solutions'}</span>
              <span><i className="bi bi-geo-alt"></i> Global HQ</span>
              <span><i className="bi bi-diagram-3"></i> {deptLabels.length} Departments</span>
              <span><i className="bi bi-activity"></i> System Operational</span>
            </div>
          </div>
        </div>
        <div className="d-flex flex-column gap-2 justify-content-center p-3">
          <button 
            type="button" 
            className="btn-admin-primary"
            onClick={onOpenAddModal}
          >
            <i className="bi bi-person-plus-fill me-1"></i> Add New Employee
          </button>
          <button 
            type="button" 
            className="btn-admin-secondary"
            onClick={() => onNavigate('requests')}
          >
            <i className="bi bi-check2-circle me-1"></i> Review Approvals ({totalPending})
          </button>
        </div>
      </section>

      <div className="row g-4 mb-4">
        <div className="col-xl-3 col-sm-6">
          <div className="admin-stat-card">
            <div className="admin-stat-header">
              <div className="admin-stat-icon primary">
                <i className="bi bi-people-fill"></i>
              </div>
              <span className="admin-stat-delta up">
                <i className="bi bi-arrow-up-short"></i> +2.4% this month
              </span>
            </div>
            <h3 className="admin-stat-value">{totalEmployeesCount}</h3>
            <p className="admin-stat-label">Total Employees</p>
            <div className="admin-stat-footer">
              <span><i className="bi bi-person-check me-1 text-primary"></i> Full-Time</span>
              <span className="text-muted">Enterprise</span>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6">
          <div className="admin-stat-card">
            <div className="admin-stat-header">
              <div className="admin-stat-icon green">
                <i className="bi bi-calendar2-check-fill"></i>
              </div>
              <span className="admin-stat-delta up">
                <i className="bi bi-dot"></i> 93.3% Rate
              </span>
            </div>
            <h3 className="admin-stat-value">{presentCount}</h3>
            <p className="admin-stat-label">Present Today</p>
            <div className="admin-stat-footer">
              <span><i className="bi bi-laptop me-1 text-info"></i> {remoteCount} Remote (WFH)</span>
              <span className="text-danger fw-semibold">{onLeaveCount} On Leave</span>
            </div>
          </div>
        </div>

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
            <div className="admin-stat-footer">
              <span>{pendingLeaves.length} Leaves · {pendingGeneral.length} General</span>
              <button 
                type="button" 
                onClick={() => onNavigate('requests')}
                className="btn btn-link p-0 text-primary text-decoration-none fw-semibold border-0"
              >
                Review All →
              </button>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6">
          <div className="admin-stat-card">
            <div className="admin-stat-header">
              <div className="admin-stat-icon blue">
                <i className="bi bi-laptop-fill"></i>
              </div>
              <span className="admin-stat-delta up">
                <i className="bi bi-check2 me-1"></i> 88.3% In Use
              </span>
            </div>
            <h3 className="admin-stat-value">2,140</h3>
            <p className="admin-stat-label">Total IT Assets</p>
            <div className="admin-stat-footer">
              <span><i className="bi bi-pc-display me-1 text-primary"></i> 1,890 Assigned</span>
              <span className="text-muted">180 In Stock</span>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="admin-card mb-0 h-100">
            <div className="admin-card-header">
              <h4 className="admin-card-title">
                <i className="bi bi-graph-up text-primary"></i> Attendance Trends
              </h4>
              <div className="d-flex align-items-center gap-2">
                <select 
                  className="form-select form-select-sm" 
                  value={attendanceTrendFilter}
                  onChange={(e) => setAttendanceTrendFilter(e.target.value)}
                  style={{ minWidth: '135px', fontWeight: 500 }}
                >
                  <option value="current_week">This Week</option>
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                </select>
              </div>
            </div>
            <div style={{ minHeight: '290px' }}>
              <Chart options={attendanceChartOptions} series={attendanceChartSeries} type="area" height={290} />
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="admin-card mb-0 h-100">
            <div className="admin-card-header">
              <h4 className="admin-card-title">
                <i className="bi bi-pie-chart-fill text-primary"></i> Department Split
              </h4>
              <span className="admin-badge badge-info">Headcount</span>
            </div>
            <div style={{ minHeight: '290px' }}>
              <Chart options={deptChartOptions} series={deptSeries} type="donut" height={290} />
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="admin-card mb-0">
            <div className="admin-card-header">
              <div>
                <h4 className="admin-card-title">
                  <i className="bi bi-check2-circle text-primary"></i> High Priority Approval Queue
                </h4>
                <p className="admin-section-heading mb-0" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Requests waiting for HR Administrator review
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => onNavigate('requests')}
                className="btn-admin-light border-0"
              >
                View All ({totalPending}) <i className="bi bi-arrow-right"></i>
              </button>
            </div>

            <div className="admin-table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Category</th>
                    <th>Details</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingLeaves.slice(0, 3).map((l, i) => (
                    <tr key={`leave-${l.id || i}`}>
                      <td>
                        <div className="employee-cell">
                          <div className="employee-avatar">{(l.employee_name || 'E').substring(0, 2).toUpperCase()}</div>
                          <div className="employee-info">
                            <h6>{l.employee_name || 'Staff Member'}</h6>
                            <span>{l.employee_code || 'EMP'} · {l.department || 'Engineering'}</span>
                          </div>
                        </div>
                      </td>
                      <td><span className="admin-badge badge-purple">{l.leave_type_name || 'Leave'}</span></td>
                      <td>{l.days_requested} Days ({l.reason || 'Personal'})</td>
                      <td>{l.start_date ? new Date(l.start_date).toLocaleDateString('en-GB') : 'Upcoming'}</td>
                      <td><span className="admin-badge badge-pending"><span className="admin-badge-dot"></span> Pending</span></td>
                      <td className="text-end">
                        <button 
                          type="button"
                          onClick={() => onNavigate('leave-approvals')}
                          className="btn btn-sm btn-outline-primary rounded-pill px-3"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pendingGeneral.slice(0, 2).map((r, i) => (
                    <tr key={`req-${r.id || i}`}>
                      <td>
                        <div className="employee-cell">
                          <div className="employee-avatar">{(r.employee_name || 'U').substring(0, 2).toUpperCase()}</div>
                          <div className="employee-info">
                            <h6>{r.employee_name || 'Employee'}</h6>
                            <span>{r.source_type || 'General'}</span>
                          </div>
                        </div>
                      </td>
                      <td><span className="admin-badge badge-info">{r.category || 'Request'}</span></td>
                      <td>{r.details || r.title || 'Review Required'}</td>
                      <td>{new Date().toLocaleDateString('en-GB')}</td>
                      <td><span className="admin-badge badge-pending"><span className="admin-badge-dot"></span> Pending</span></td>
                      <td className="text-end">
                        <button 
                          type="button"
                          onClick={() => onNavigate('requests')}
                          className="btn btn-sm btn-outline-primary rounded-pill px-3"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                  {totalPending === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">
                        <i className="bi bi-check2-circle text-success fs-4 d-block mb-1"></i>
                        No pending requests in queue!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="admin-card mb-0 h-100">
            <div className="admin-card-header">
              <h4 className="admin-card-title">
                <i className="bi bi-clock-history text-primary"></i> Live Activity Feed
              </h4>
              <span className="admin-badge badge-active"><span className="admin-badge-dot"></span> Realtime</span>
            </div>

            <div className="admin-activity-list">
              <div className="admin-activity-item">
                <div className="admin-activity-icon" style={{ background: 'var(--green-light)', color: 'var(--green)' }}>
                  <i className="bi bi-person-check-fill"></i>
                </div>
                <div className="admin-activity-content">
                  <h6>New Employee Onboarded</h6>
                  <p>Active profile created in directory</p>
                </div>
                <span className="admin-activity-time">15m ago</span>
              </div>

              <div className="admin-activity-item">
                <div className="admin-activity-icon" style={{ background: 'var(--blue-light)', color: 'var(--blue)' }}>
                  <i className="bi bi-file-earmark-lock-fill"></i>
                </div>
                <div className="admin-activity-content">
                  <h6>Document Verified</h6>
                  <p>Identity & Compliance documents approved</p>
                </div>
                <span className="admin-activity-time">42m ago</span>
              </div>

              <div className="admin-activity-item">
                <div className="admin-activity-icon" style={{ background: 'var(--orange-light)', color: 'var(--orange)' }}>
                  <i className="bi bi-laptop"></i>
                </div>
                <div className="admin-activity-content">
                  <h6>Asset Allocated</h6>
                  <p>Equipment tagged to staff member</p>
                </div>
                <span className="admin-activity-time">2h ago</span>
              </div>

              <div className="admin-activity-item">
                <div className="admin-activity-icon" style={{ background: 'var(--pink-light)', color: 'var(--pink)' }}>
                  <i className="bi bi-megaphone-fill"></i>
                </div>
                <div className="admin-activity-content">
                  <h6>Announcement Broadcasted</h6>
                  <p>All-hands update broadcasted</p>
                </div>
                <span className="admin-activity-time">4h ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-section-heading mt-4">
        <div>
          <h3>Workforce Highlights & Daily Operations</h3>
          <p>Real-time attendance logs, employee celebrations, and official company calendar</p>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-xl-4 col-md-6">
          <div className="dash-widget-card">
            <div>
              <div className="dash-widget-header">
                <h5 className="dash-widget-title">
                  <i className="bi bi-clock-history text-primary"></i> Check-In/Out
                </h5>
                <button 
                  type="button" 
                  onClick={() => onNavigate('admin-leaves')}
                  className="dash-widget-link btn btn-link p-0 border-0"
                >
                  View All <i className="bi bi-arrow-right"></i>
                </button>
              </div>

              <div className="dash-checkin-list">
                {employees.slice(0, 5).map((emp, idx) => (
                  <div className="dash-checkin-item" key={emp.id || idx}>
                    <div className="dash-checkin-user">
                      <div className="dash-checkin-avatar" style={{ background: 'var(--primary)' }}>
                        {(emp.first_name || emp.name || 'E').substring(0, 1).toUpperCase()}
                      </div>
                      <div className="dash-checkin-info">
                        <h6>{emp.first_name || emp.name || 'Employee'}</h6>
                        <span>{emp.department || emp.designation || 'Staff'}</span>
                      </div>
                    </div>
                    <span className="dash-punch-pill in">09:18 AM</span>
                    <span className="dash-punch-pill out">18:18 PM</span>
                    <span className="dash-prod-time">09:18 hrs</span>
                  </div>
                ))}
                {employees.length === 0 && (
                  <div className="text-center py-3 text-muted">No attendance logs available</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4 col-md-6">
          <div className="dash-widget-card">
            <div>
              <div className="dash-widget-header">
                <h5 className="dash-widget-title">
                  <i className="bi bi-gift-fill text-primary"></i> Celebrations & Special Days
                </h5>
                <button 
                  type="button" 
                  onClick={() => onNavigate('calendar')}
                  className="dash-widget-link btn btn-link p-0 border-0"
                >
                  View All <i className="bi bi-arrow-right"></i>
                </button>
              </div>

              <div className="dash-celebration-filter">
                <button 
                  type="button" 
                  className={`dash-filter-pill ${celebrationFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setCelebrationFilter('all')}
                >
                  All (4)
                </button>
                <button 
                  type="button" 
                  className={`dash-filter-pill ${celebrationFilter === 'birthday' ? 'active' : ''}`}
                  onClick={() => setCelebrationFilter('birthday')}
                >
                  <i className="bi bi-cake2-fill text-warning me-1"></i> Birthdays
                </button>
                <button 
                  type="button" 
                  className={`dash-filter-pill ${celebrationFilter === 'anniversary' ? 'active' : ''}`}
                  onClick={() => setCelebrationFilter('anniversary')}
                >
                  <i className="bi bi-award-fill text-primary me-1"></i> Anniversaries
                </button>
              </div>

              <div className="dash-birthday-group" data-group="today">
                <div className="dash-group-tag">TODAY</div>
                <div className="dash-celebration-item" data-type="birthday">
                  <div className="dash-birthday-user">
                    <div className="dash-birthday-avatar bg-peach">J</div>
                    <div className="dash-birthday-info">
                      <h6>Jasmine Roy</h6>
                      <div className="d-flex align-items-center gap-2 mt-1">
                        <span className="dash-event-badge birthday">
                          <i className="bi bi-cake2-fill"></i> Birthday
                        </span>
                        <span className="dash-event-date">Today</span>
                      </div>
                    </div>
                  </div>
                  <button className="btn-wish-send" type="button">
                    <i className="bi bi-send-fill me-1"></i> Wish
                  </button>
                </div>
              </div>

              <div className="dash-birthday-group" data-group="this_month">
                <div className="dash-group-tag">THIS MONTH</div>
                <div className="dash-celebration-item mb-2" data-type="anniversary">
                  <div className="dash-birthday-user">
                    <div className="dash-birthday-avatar bg-anniversary">
                      <i className="bi bi-award-fill"></i>
                    </div>
                    <div className="dash-birthday-info">
                      <h6>Ganesh V.</h6>
                      <div className="d-flex align-items-center gap-2 mt-1">
                        <span className="dash-event-badge anniversary">
                          <i className="bi bi-award-fill"></i> 3rd Work Anniversary
                        </span>
                        <span className="dash-event-date">10 Nov · 3 Yrs</span>
                      </div>
                    </div>
                  </div>
                  <button className="btn-wish-send" type="button">
                    <i className="bi bi-send-fill me-1"></i> Wish
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4 col-md-12">
          <div className="dash-widget-card">
            <div>
              <div className="dash-widget-header">
                <h5 className="dash-widget-title">
                  <i className="bi bi-calendar3-week text-primary"></i> Upcoming Holidays
                </h5>
                <button 
                  type="button"
                  onClick={() => onNavigate('holidays')}
                  className="dash-pill-btn btn btn-sm btn-link text-decoration-none border-0"
                >
                  <i className="bi bi-pencil-square me-1"></i> <span>EDIT</span>
                </button>
              </div>

              <div className="dash-holiday-scroll">
                <table className="dash-holiday-table">
                  <tbody>
                    <tr>
                      <td>
                        <span className="dash-holiday-name">Republic Day</span>
                        <span className="dash-holiday-tag ms-1">(Optional)</span>
                      </td>
                      <td className="dash-holiday-date">26 JAN 2026</td>
                    </tr>
                    <tr>
                      <td><span className="dash-holiday-name">Bogi Pongal</span></td>
                      <td className="dash-holiday-date">13 JAN 2026</td>
                    </tr>
                    <tr>
                      <td><span className="dash-holiday-name">Pongal</span></td>
                      <td className="dash-holiday-date">14 JAN 2026</td>
                    </tr>
                    <tr>
                      <td><span className="dash-holiday-name">Holi</span></td>
                      <td className="dash-holiday-date">25 MAR 2026</td>
                    </tr>
                    <tr>
                      <td><span className="dash-holiday-name">Good Friday</span></td>
                      <td className="dash-holiday-date">18 APR 2026</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";

export default function EmploymentDetails({ employeeProfile, currentUser, onProfileUpdate, onNavigate, embedded = false }) {
  const [profile, setProfile] = useState(employeeProfile || {});
  const [workMode, setWorkMode] = useState(employeeProfile?.work_mode || 'Hybrid');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (employeeProfile && Object.keys(employeeProfile).length > 0) {
      setProfile(employeeProfile);
      if (employeeProfile.work_mode) {
        setWorkMode(employeeProfile.work_mode);
      }
    }
  }, [employeeProfile]);

  // Always load latest work_mode directly from employee_attendance in DB on mount/reload
  useEffect(() => {
    const targetId = currentUser?.id || profile?.employee_id;
    if (!targetId) return;
    const API_URL = import.meta.env.VITE_API_URL || "https://hrms-backend-5xo8.onrender.com";
    fetch(`${API_URL}/api/attendance/today/${targetId}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.today && data.today.work_mode) {
          setWorkMode(data.today.work_mode);
          setProfile(prev => ({ ...prev, work_mode: data.today.work_mode }));
        }
      })
      .catch(() => {});
  }, [currentUser?.id, profile?.employee_id]);

  // Payslips Dynamic State
  const currentDate = new Date();
  const currentCalYear = currentDate.getFullYear();
  const currentCalMonth = currentDate.getMonth() + 1; // 1-12

  // Determine current financial year (April - March)
  const currentFYStart = currentCalMonth >= 4 ? currentCalYear : currentCalYear - 1;
  const defaultFY = `${currentFYStart}-${String(currentFYStart + 1).slice(-2)}`;

  const [selectedFY, setSelectedFY] = useState(defaultFY);
  const [selectedMonth, setSelectedMonth] = useState(currentCalMonth);
  const [payslipsData, setPayslipsData] = useState([]);
  const [loadingPayslips, setLoadingPayslips] = useState(false);
  const [activePayslipModal, setActivePayslipModal] = useState(null);

  // Generate Available Financial Years dynamically (past 3 FYs, current, and next FY)
  const availableFYs = [
    `${currentCalYear - 1}-${String(currentCalYear).slice(-2)}`,
    `${currentCalYear}-${String(currentCalYear + 1).slice(-2)}`,
    `${currentCalYear + 1}-${String(currentCalYear + 2).slice(-2)}`
  ];

  // Helper: Month list for a Financial Year (April to March)
  const monthsInFY = [
    { num: 4, name: "April", short: "Apr", calYearOffset: 0 },
    { num: 5, name: "May", short: "May", calYearOffset: 0 },
    { num: 6, name: "June", short: "Jun", calYearOffset: 0 },
    { num: 7, name: "July", short: "Jul", calYearOffset: 0 },
    { num: 8, name: "August", short: "Aug", calYearOffset: 0 },
    { num: 9, name: "September", short: "Sep", calYearOffset: 0 },
    { num: 10, name: "October", short: "Oct", calYearOffset: 0 },
    { num: 11, name: "November", short: "Nov", calYearOffset: 0 },
    { num: 12, name: "December", short: "Dec", calYearOffset: 0 },
    { num: 1, name: "January", short: "Jan", calYearOffset: 1 },
    { num: 2, name: "February", short: "Feb", calYearOffset: 1 },
    { num: 3, name: "March", short: "Mar", calYearOffset: 1 }
  ];

  // Fetch payslips for this employee
  useEffect(() => {
    const empId = currentUser?.id || profile?.employee_id;
    if (!empId) return;

    setLoadingPayslips(true);
    fetch(`${import.meta.env.VITE_API_URL || "https://hrms-backend-5xo8.onrender.com"}/api/employee/payslips/${empId}?financialYear=${selectedFY}`)
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.payslips)) {
          setPayslipsData(data.payslips);
        } else {
          setPayslipsData([]);
        }
      })
      .catch(err => {
        console.error("Error fetching payslips:", err);
        setPayslipsData([]);
      })
      .finally(() => setLoadingPayslips(false));
  }, [currentUser?.id, profile?.employee_id, selectedFY]);

  // Helper to convert number to words (for net pay in words)
  const numberToWords = (num) => {
    if (!num || isNaN(num)) return "Zero";
    const a = [
      "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
      "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    ];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const formatHundreds = (n) => {
      let str = "";
      if (n > 99) {
        str += a[Math.floor(n / 100)] + " Hundred ";
        n %= 100;
      }
      if (n > 19) {
        str += b[Math.floor(n / 10)] + " " + a[n % 10];
      } else if (n > 0) {
        str += a[n];
      }
      return str.trim();
    };

    let n = Math.floor(num);
    let output = "";
    if (n >= 10000000) {
      output += formatHundreds(Math.floor(n / 10000000)) + " Crore ";
      n %= 10000000;
    }
    if (n >= 100000) {
      output += formatHundreds(Math.floor(n / 100000)) + " Lakh ";
      n %= 100000;
    }
    if (n >= 1000) {
      output += formatHundreds(Math.floor(n / 1000)) + " Thousand ";
      n %= 1000;
    }
    if (n > 0) {
      output += formatHundreds(n);
    }
    return output.trim();
  };

  // Compute selected month's actual calendar year
  const startYear = parseInt(selectedFY.split("-")[0], 10);
  const selectedMonthObj = monthsInFY.find(m => m.num === Number(selectedMonth)) || monthsInFY[0];
  const effectiveCalYear = startYear + selectedMonthObj.calYearOffset;

  // Check if upcoming month (i.e. strictly in future relative to current real date)
  const isUpcoming = (effectiveCalYear > currentCalYear) || 
    (effectiveCalYear === currentCalYear && Number(selectedMonth) > currentCalMonth);

  // Find payslip for selected month and year from DB
  const foundPayslip = payslipsData.find(
    p => Number(p.month) === Number(selectedMonth) && Number(p.year) === effectiveCalYear
  );

  const activePayslip = foundPayslip || null;

  /*
  const handleUpdateWorkMode = async (mode) => {
    const targetId = profile.employee_id || currentUser?.id;
    if (!targetId) return;
    setWorkMode(mode);
    setUpdating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || "https://hrms-backend-5xo8.onrender.com"}/api/employee/${targetId}/work-mode`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ work_mode: mode })
      });
      if (response.ok) {
        setWorkMode(mode);
        setProfile(prev => ({ ...prev, work_mode: mode }));
        if (typeof onProfileUpdate === 'function') {
          onProfileUpdate();
        }
      } else {
        console.error("Failed to update work mode on server");
      }
    } catch (error) {
      console.error("Error updating work mode:", error);
    } finally {
      setUpdating(false);
    }
  };
  */

  // Formatter helper
  const formatDate = (dateString) => {
    if (!dateString) return "--";
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const getInitials = (f, l) => {
    return `${f ? f[0] : ''}${l ? l[0] : ''}`.toUpperCase() || 'EMP';
  };

  // Dynamic calculation for probation and confirmation based on joining_date, probation_period and probation_status
  const calculateProbationInfo = () => {
    const period = profile.probation_period || '3 Month';
    const match = String(period).match(/\d+/);
    const months = match ? parseInt(match[0], 10) : 3;

    let endDate = profile.probation_end_date;
    if (!endDate && profile.joining_date) {
      const d = new Date(profile.joining_date);
      if (!isNaN(d.getTime())) {
        const end = new Date(d);
        end.setMonth(end.getMonth() + months);
        endDate = end.toISOString().split('T')[0];
      }
    }

    let confirmDate = null;
    const status = (profile.probation_status || '').toLowerCase();
    if (status === 'completed' || status === 'confirmed') {
      if (profile.confirmation_date) {
        confirmDate = profile.confirmation_date;
      } else if (endDate) {
        confirmDate = endDate;
      }
    }

    return {
      period,
      endDate,
      confirmDate
    };
  };

  const probationDetails = calculateProbationInfo();

  // Dynamic calculation of Employment Profile completion percentage
  const section1Fields = [
    { label: 'Employee ID', value: profile.employee_code },
    { label: 'Employee Type', value: profile.employment_type },
    { label: 'Employment Status', value: profile.status || 'Active' },
    { label: 'Joining Date', value: profile.joining_date }
  ];

  const section2Fields = [
    { label: 'Probation Period', value: probationDetails.period },
    { label: 'Probation End Date', value: probationDetails.endDate },
    { label: 'Confirmation Date', value: probationDetails.confirmDate }
  ];

  const section3Fields = [
    { label: 'Department', value: profile.department },
    { label: 'Team', value: profile.team },
    { label: 'Designation', value: profile.designation },
    { label: 'Location', value: profile.location || profile.city }
  ];

  const section4Fields = [
    { label: 'Work Mode', value: workMode || profile.work_mode }
  ];

  const section5Fields = [
    { label: 'Reporting Manager', value: profile.reporting_manager_name || 'Maruthi Vara Prasad' },
    { label: 'HR Manager', value: profile.hr_manager_name || profile.hr_manager_id },
    { label: 'Shift', value: profile.shift }
  ];

  const allSections = [
    { name: 'Employment Overview', fields: section1Fields },
    { name: 'Probation & Confirmation', fields: section2Fields },
    { name: 'Organization Placement', fields: section3Fields },
    { name: 'Work Arrangement', fields: section4Fields },
    { name: 'Reporting Structure', fields: section5Fields }
  ];

  const isFieldComplete = (val) => {
    if (!val) return false;
    const str = String(val).trim();
    if (str === '' || str === '--' || str.toLowerCase().includes('mock') || str === 'N/A') return false;
    return true;
  };

  const totalFields = allSections.reduce((acc, sec) => acc + sec.fields.length, 0);
  const completedFields = allSections.reduce((acc, sec) => {
    return acc + sec.fields.filter(f => isFieldComplete(f.value)).length;
  }, 0);

  const completionPercentage = Math.round((completedFields / totalFields) * 100);
  const incompleteSections = allSections.filter(sec => sec.fields.some(f => !isFieldComplete(f.value)));

  return (
    <>
      <main className="dashboard-wrapper">
        <div className="dashboard-container">
          <div className="px-0 px-md-5 employee-dashboard">
            <div className="employment-details-page">

              {!embedded && (
                <>
                  <div className="employment-page-intro">
                    <div>
                      <h1>Employment Details</h1>
                      <p>Employment profile and organizational details for this employee.</p>
                    </div>
                    <button type="button" className="epd-upload-btn" id="epdHeaderUploadBtn" onClick={() => onNavigate?.("employee-profile")}>
                      <i className="bi bi-eye"></i> View-only profile
                    </button>
                  </div>

                  <div className="esc-employee-bar">
                    <div className="esc-employee-main">
                      <div className="esc-avatar overflow-hidden">
                        {(employeeProfile?.profile_pic || employeeProfile?.avatar_url || profile?.profile_pic) ? (
                          <img
                            src={/^(https?:\/\/|data:|blob:)/i.test(employeeProfile?.profile_pic || employeeProfile?.avatar_url || profile?.profile_pic)
                              ? (employeeProfile?.profile_pic || employeeProfile?.avatar_url || profile?.profile_pic)
                              : `${import.meta.env.VITE_API_URL || 'https://hrms-backend-5xo8.onrender.com'}/${(employeeProfile?.profile_pic || employeeProfile?.avatar_url || profile?.profile_pic).replace(/^\/+/, '')}`}
                            alt="Employee"
                            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "17px" }}
                          />
                        ) : (
                          getInitials(profile.first_name, profile.last_name)
                        )}
                      </div>
                      <div className="esc-employee-info">
                        <div className="esc-name-row">
                          <h3>{profile.first_name || 'Employee'} {profile.last_name || 'Name'}</h3>
                          <span className="esc-status-badge"><span></span>Active</span>
                        </div>
                        <p>{profile.designation || employeeProfile?.designation || 'Senior Software Engineer'}</p>
                        <div className="esc-employee-meta">
                          <span><i className="bi bi-diagram-3"></i>{profile.department || employeeProfile?.department || 'Engineering'}</span>
                          <span><i className="bi bi-code-slash"></i>{profile.team || employeeProfile?.team || 'Backend'}</span>
                          <span><i className="bi bi-person-badge"></i>{profile.employee_code || employeeProfile?.employee_code || 'EMP-1360'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="esc-employee-side">
                      <span className="esc-side-label">Profile Area</span>
                      <strong>Employment Details</strong>
                    </div>
                  </div>
                </>
              )}

              <div className="row g-4 align-items-start">
                {/* Main Content */}
                <div className="col-xl-8">
                  <div className="employment-main-card">

                    {/* Section 1: Employment Overview */}
                    <div className="employment-section">
                      <div className="employment-section-heading common-card-heading">
                        <div className="employment-section-icon"><i className="bi bi-person-vcard"></i></div>
                        <div>
                          <h3>Employment Overview</h3>
                          <p>Employee type, status and joining information.</p>
                        </div>
                      </div>
                      <div className="row g-4">
                        <div className="col-md-6">
                          <label className="employment-label">Employee ID</label>
                          <div className="employment-input-icon">
                            <i className="bi bi-fingerprint"></i>
                            <span className="employment-control employment-readonly-value">{profile.employee_code || '--'}</span>
                          </div>
                          <div className="employment-helper">Unique identification number for this employee.</div>
                        </div>
                        <div className="col-md-6">
                          <label className="employment-label">Employee Type</label>
                          <div className="employment-control employment-readonly-value">{profile.employment_type || 'Permanent'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="employment-label">Employment Status</label>
                          <div className="employment-control employment-readonly-value">Active</div>
                        </div>
                        <div className="col-md-6">
                          <label className="employment-label">Joining Date</label>
                          <div className="employment-input-icon">
                            <i className="bi bi-calendar3"></i>
                            <span className="employment-control employment-readonly-value">{formatDate(profile.joining_date)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Probation & Confirmation */}
                    <div className="employment-section">
                      <div className="employment-section-heading common-card-heading">
                        <div className="employment-section-icon"><i className="bi bi-hourglass-split"></i></div>
                        <div>
                          <h3>Probation & Confirmation</h3>
                          <p>Probation and confirmation dates on record.</p>
                        </div>
                      </div>
                      <div className="row g-4">
                        <div className="col-md-4">
                          <label className="employment-label">Probation Period</label>
                          <div className="employment-input-icon">
                            <i className="bi bi-calendar-check"></i>
                            <span className="employment-control employment-readonly-value">{probationDetails.period}</span>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <label className="employment-label">Probation End Date</label>
                          <div className="employment-input-icon">
                            <i className="bi bi-calendar-check"></i>
                            <span className="employment-control employment-readonly-value">{formatDate(probationDetails.endDate)}</span>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <label className="employment-label">Confirmation Date</label>
                          <div className="employment-input-icon">
                            <i className="bi bi-patch-check"></i>
                            <span className="employment-control employment-readonly-value">{formatDate(probationDetails.confirmDate)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Organization Placement */}
                    <div className="employment-section">
                      <div className="employment-section-heading common-card-heading">
                        <div className="employment-section-icon"><i className="bi bi-diagram-3"></i></div>
                        <div>
                          <h3>Organization Placement</h3>
                          <p>Department, team, designation and primary work location.</p>
                        </div>
                      </div>
                      <div className="row g-4">
                        <div className="col-md-6">
                          <label className="employment-label">Department</label>
                          <div className="employment-select-wrapper">
                            <i className="bi bi-building"></i>
                            <span className="employment-control employment-readonly-value employment-select-with-icon">{profile.department || employeeProfile?.department || 'Engineering'}</span>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <label className="employment-label">Team</label>
                          <div className="employment-select-wrapper">
                            <i className="bi bi-people"></i>
                            <span className="employment-control employment-readonly-value employment-select-with-icon">{profile.team || employeeProfile?.team || 'Backend'}</span>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <label className="employment-label">Designation</label>
                          <div className="employment-select-wrapper">
                            <i className="bi bi-award"></i>
                            <span className="employment-control employment-readonly-value employment-select-with-icon">{profile.designation || employeeProfile?.designation || 'Senior Software Engineer'}</span>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <label className="employment-label">Location</label>
                          <div className="employment-input-icon">
                            <i className="bi bi-geo-alt"></i>
                            <span className="employment-control employment-readonly-value">{profile.location || profile.city || employeeProfile?.location || employeeProfile?.city || 'Nagpur'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Work Arrangement */}
                    <div className="employment-section">
                      <div className="employment-section-heading common-card-heading">
                        <div className="employment-section-icon"><i className="bi bi-laptop"></i></div>
                        <div>
                          <h3>Work Arrangement</h3>
                          <p>Current work arrangement on record.</p>
                        </div>
                      </div>
                      <div className="work-mode-options">
                        <div /* onClick={() => handleUpdateWorkMode('Office')} */ className={`work-mode-card ${workMode === 'Office' ? 'is-selected' : ''}`}>
                          <span className="work-mode-content">
                            <span className="work-mode-icon"><i className="bi bi-building"></i></span>
                            <span><strong>Office</strong><small>Works from the office</small></span>
                            {workMode === 'Office' && <span className="work-mode-check"><i className="bi bi-check2"></i></span>}
                          </span>
                        </div>
                        <div /* onClick={() => handleUpdateWorkMode('Remote')} */ className={`work-mode-card ${workMode === 'Remote' ? 'is-selected' : ''}`}>
                          <span className="work-mode-content">
                            <span className="work-mode-icon"><i className="bi bi-house"></i></span>
                            <span><strong>Remote</strong><small>Works remotely</small></span>
                            {workMode === 'Remote' && <span className="work-mode-check"><i className="bi bi-check2"></i></span>}
                          </span>
                        </div>
                        <div /* onClick={() => handleUpdateWorkMode('Hybrid')} */ className={`work-mode-card ${workMode === 'Hybrid' || !workMode ? 'is-selected' : ''}`}>
                          <span className="work-mode-content">
                            <span className="work-mode-icon"><i className="bi bi-arrow-left-right"></i></span>
                            <span><strong>Hybrid</strong><small>Office + remote</small></span>
                            {(workMode === 'Hybrid' || !workMode) && <span className="work-mode-check"><i className="bi bi-check2"></i></span>}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section 5: Reporting Structure */}
                    <div className="employment-section">
                      <div className="employment-section-heading common-card-heading">
                        <div className="employment-section-icon"><i className="bi bi-person-lines-fill"></i></div>
                        <div>
                          <h3>Reporting Structure</h3>
                          <p>Reporting and HR contacts, plus the assigned shift.</p>
                        </div>
                      </div>
                      <div className="row g-4">
                        <div className="col-md-6">
                          <label className="employment-label">Reporting Manager</label>
                          <div className="employment-manager-field">
                            <div className="employment-manager-avatar">{getInitials(profile.reporting_manager_name || 'Maruthi Vara Prasad')}</div>
                            <span className="employment-control employment-readonly-value">{profile.reporting_manager_name || 'Maruthi Vara Prasad'}</span>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <label className="employment-label">HR Manager</label>
                          <div className="employment-manager-field">
                            <div className="employment-manager-avatar employment-manager-avatar-hr">HR</div>
                            <span className="employment-control employment-readonly-value">{profile.hr_manager_name || (profile.hr_manager_id ? `HR ID: ${profile.hr_manager_id}` : '--')}</span>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <label className="employment-label">Shift</label>
                          <div className="employment-input-icon">
                            <i className="bi bi-clock"></i>
                            <span className="employment-control employment-readonly-value employment-select-with-icon">{profile.shift || 'General Shift - 09:00 AM - 06:00 PM'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 6: Payslips */}
                    <div className="employment-section payslips-section">
                      <div className="employment-section-heading common-card-heading d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-3">
                          <div className="employment-section-icon"><i className="bi bi-receipt"></i></div>
                          <div className="payslips-heading-copy">
                            <h3>Payslips</h3>
                            <p>Choose a financial year and month to view or print your payslip.</p>
                          </div>
                        </div>
                        <div className="payslips-badge-fy">
                          <i className="bi bi-calendar-range"></i> Apr – Mar
                        </div>
                      </div>

                      {/* Filter Row */}
                      <div className="payslips-filter-card">
                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="payslips-filter-group mb-0">
                              <label className="payslips-filter-label">Financial Year</label>
                              <div className="payslips-select-wrapper">
                                <i className="bi bi-calendar-event select-icon"></i>
                                <select 
                                  className="payslips-select"
                                  value={selectedFY} 
                                  onChange={(e) => setSelectedFY(e.target.value)}
                                >
                                  {availableFYs.map(fy => (
                                    <option key={fy} value={fy}>{fy}</option>
                                  ))}
                                </select>
                                <i className="bi bi-chevron-down chevron-icon"></i>
                              </div>
                            </div>
                          </div>

                          <div className="col-md-6">
                            <div className="payslips-filter-group mb-0">
                              <label className="payslips-filter-label">Month</label>
                              <div className="payslips-select-wrapper">
                                <i className="bi bi-calendar-month select-icon"></i>
                                <select 
                                  className="payslips-select"
                                  value={selectedMonth} 
                                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                >
                                  {monthsInFY.map(m => {
                                    const mCalYear = startYear + m.calYearOffset;
                                    const isMonthUpcoming = (mCalYear > currentCalYear) || 
                                      (mCalYear === currentCalYear && m.num > currentCalMonth);
                                    return (
                                      <option key={m.num} value={m.num}>
                                        {m.name} ({mCalYear}){isMonthUpcoming ? ' · (Upcoming)' : ''}
                                      </option>
                                    );
                                  })}
                                </select>
                                <i className="bi bi-chevron-down chevron-icon"></i>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Payslip Result Box */}
                      <div className="payslip-result-card">
                        <div className="payslip-result-left">
                          <div className={`payslip-result-icon ${isUpcoming || !activePayslip ? 'disabled' : ''}`}>
                            <i className={isUpcoming ? "bi bi-calendar-x" : (!activePayslip ? "bi bi-file-earmark-x" : "bi bi-file-earmark-pdf")}></i>
                          </div>
                          <div className="payslip-result-info">
                            <h4>{selectedMonthObj.name} {effectiveCalYear}</h4>
                            <p>
                              {isUpcoming 
                                ? "Upcoming month · Payslip not generated yet" 
                                : loadingPayslips 
                                  ? "Checking records..."
                                  : activePayslip 
                                    ? "Payslip ready to view and download"
                                    : "No payslip record found for this month"}
                            </p>
                          </div>
                        </div>

                        <div className="payslip-result-actions">
                          <button
                            type="button"
                            className="payslip-btn-view"
                            disabled={isUpcoming || loadingPayslips || !activePayslip}
                            onClick={() => activePayslip && setActivePayslipModal(activePayslip)}
                          >
                            <i className="bi bi-eye"></i> View payslip
                          </button>
                        </div>
                      </div>

                      <div className="payslip-footer-hint">
                        <i className="bi bi-info-circle"></i>
                        <span>Open a payslip to view the salary breakdown, print it, or save as PDF.</span>
                      </div>
                    </div>

                    <div className="employment-record-footer">
                      <i className="bi bi-eye" aria-hidden="true"></i> Employee record · View only
                    </div>
                  </div>
                </div>

                {/* Sidebar Content */}
                <div className="col-xl-4">
                  <aside className="employment-side-wrapper">
                    {/* Progress Card */}
                    <div className="employment-completion-card mb-4">
                      <div className="employment-completion-top">
                        <div>
                          <span>EMPLOYMENT PROFILE</span>
                          <strong>{completionPercentage}%</strong>
                        </div>
                        <div className="employment-completion-ring">
                          {completionPercentage === 100 ? (
                            <i className="bi bi-check2"></i>
                          ) : (
                            <i className="bi bi-hourglass-split"></i>
                          )}
                        </div>
                      </div>
                      <div className="employment-progress">
                        <span style={{width: `${completionPercentage}%`}}></span>
                      </div>
                      <p>
                        {completionPercentage === 100 
                          ? "Employee details are on file." 
                          : `${completedFields} of ${totalFields} details verified (${incompleteSections.length} section${incompleteSections.length > 1 ? 's' : ''} incomplete).`}
                      </p>
                    </div>

                    {/* Summary Card */}
                    <div className="employment-summary-card">
                      <div className="employment-summary-header common-card-heading">
                        <div>
                          <span className="employment-summary-eyebrow">EMPLOYEE PROFILE</span>
                          <h3>Employment Snapshot</h3>
                        </div>
                        <div className="employment-summary-icon"><i className="bi bi-briefcase"></i></div>
                      </div>
                      <div className="employment-summary-profile">
                        <div className="employment-summary-avatar">{getInitials(profile.first_name, profile.last_name)}</div>
                        <div>
                          <strong>{profile.first_name || 'Employee'} {profile.last_name || 'Name'}</strong>
                          <span>{profile.employee_code || 'EMP-000'}</span>
                        </div>
                      </div>
                      <div className="employment-summary-status">
                        <div>
                          <span className="employment-mini-label">Current Status</span>
                          <strong>Active</strong>
                        </div>
                        <span className="employment-summary-status-badge"><span></span>Active</span>
                      </div>
                      <div className="employment-summary-list">
                        <div className="employment-summary-item">
                          <span className="employment-summary-item-icon"><i className="bi bi-building"></i></span>
                          <div><small>Department</small><strong>{profile.department || '--'}</strong></div>
                        </div>
                        <div className="employment-summary-item">
                          <span className="employment-summary-item-icon"><i className="bi bi-award"></i></span>
                          <div><small>Designation</small><strong>{profile.designation || '--'}</strong></div>
                        </div>
                        <div className="employment-summary-item">
                          <span className="employment-summary-item-icon"><i className="bi bi-person"></i></span>
                          <div><small>Reporting Manager</small><strong>{profile.reporting_manager_name || 'Maruthi Vara Prasad'}</strong></div>
                        </div>
                        <div className="employment-summary-item">
                          <span className="employment-summary-item-icon"><i className="bi bi-geo-alt"></i></span>
                          <div><small>Location</small><strong>{profile.location || profile.city || '--'}</strong></div>
                        </div>
                        <div className="employment-summary-item">
                          <span className="employment-summary-item-icon"><i className="bi bi-laptop"></i></span>
                          <div><small>Work Mode</small><strong>{workMode || 'Hybrid'}</strong></div>
                        </div>
                        <div className="employment-summary-item">
                          <span className="employment-summary-item-icon"><i className="bi bi-calendar3"></i></span>
                          <div><small>Joining Date</small><strong>{formatDate(profile.joining_date)}</strong></div>
                        </div>
                      </div>
                    </div>

                    <div className="employment-tip-card mt-4">
                      <div className="employment-tip-icon"><i className="bi bi-stars"></i></div>
                      <div>
                        <h4>Employment record</h4>
                        <p>This snapshot shows the employee's current role, reporting line, work location and employment dates.</p>
                      </div>
                    </div>
                  </aside>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Official Ramel Payslip Modal */}
      {activePayslipModal && (
        <div className="payslip-modal-backdrop" onClick={() => setActivePayslipModal(null)}>
          <div className="payslip-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="payslip-modal-header no-print">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-file-earmark-ruled fs-5 text-primary"></i>
                <h3 className="mb-0">Employee Payslip · {activePayslipModal.month_name} {activePayslipModal.year}</h3>
              </div>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setActivePayslipModal(null)}
              ></button>
            </div>

            <div className="payslip-modal-body">
              {/* Exact template matching Ramel Techno Solutions Private Limited payslip PDF */}
              <div className="ramel-payslip-paper">
                <div className="ramel-payslip-top-tag">Pay Slip</div>
                
                {/* Header Table / Box */}
                <div className="ramel-payslip-outer-box">
                  <div className="ramel-payslip-header-row">
                    <div className="ramel-payslip-brand-box">
                      <div className="ramel-payslip-brand-flex">
                        <div className="ramel-payslip-logo-icon">
                          <i className="bi bi-intersect"></i>
                        </div>
                        <div>
                          <span className="ramel-brand-title">RAMEL</span>
                          <span className="ramel-brand-subtitle">Techno solutions Private limited</span>
                        </div>
                      </div>
                    </div>
                    <div className="ramel-payslip-company-address">
                      <strong>RAMEL TECHNO SOLUTIONS PRIVATE LIMITED</strong>
                      <div>NO.3, Sridharan Street,</div>
                      <div>Ayyavoo Colony,</div>
                      <div>Aminjikarai, Chennai - 600 029</div>
                    </div>
                  </div>

                  {/* Employee Details Grid */}
                  <table className="ramel-payslip-meta-table">
                    <tbody>
                      <tr>
                        <td className="meta-label">EMP CODE</td>
                        <td className="meta-value">: {profile.employee_code || '—'}</td>
                        <td className="meta-label">BANK NAME</td>
                        <td className="meta-value">: {activePayslipModal.bank_name || 'KOTAK MAHINDRA BANK'}</td>
                      </tr>
                      <tr>
                        <td className="meta-label">EMP NAME</td>
                        <td className="meta-value">: {([profile.first_name, profile.last_name].filter(Boolean).join(' ') || currentUser?.email || 'EMPLOYEE').toUpperCase()}</td>
                        <td className="meta-label">BANK A/C NO.</td>
                        <td className="meta-value">: {activePayslipModal.bank_account || '5212500492'}</td>
                      </tr>
                      <tr>
                        <td className="meta-label">DESIGNATION</td>
                        <td className="meta-value">: {(profile.designation || 'EMPLOYEE').toUpperCase()}</td>
                        <td className="meta-label">PAN NUMBER</td>
                        <td className="meta-value">: {activePayslipModal.pan_number || 'BIVPA5135J'}</td>
                      </tr>
                      <tr>
                        <td className="meta-label">DOJ</td>
                        <td className="meta-value">: {formatDate(profile.joining_date)}</td>
                        <td className="meta-label">PAID DAYS</td>
                        <td className="meta-value">: {activePayslipModal.paid_days || 31}</td>
                      </tr>
                      <tr>
                        <td className="meta-label">LOCATION</td>
                        <td className="meta-value">: {(profile.location || profile.city || 'NAGPUR').toUpperCase()}</td>
                        <td className="meta-label">LOP DAYS</td>
                        <td className="meta-value">: {activePayslipModal.lop_days || 0}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Earnings & Deductions Split Table */}
                  <table className="ramel-payslip-salary-table">
                    <thead>
                      <tr>
                        <th style={{ width: '38%' }}>EARNINGS</th>
                        <th style={{ width: '15%', textAlign: 'right' }}>ACTUAL</th>
                        <th style={{ width: '15%', textAlign: 'right' }}>EARNED</th>
                        <th style={{ width: '22%' }}>DEDUCTIONS</th>
                        <th style={{ width: '10%', textAlign: 'right' }}>AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>BASIC PAY</td>
                        <td className="amt">{Number(activePayslipModal.basic_salary || 40000).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="amt">{Number(activePayslipModal.basic_salary || 40000).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td>LOSS OF PAY</td>
                        <td className="amt">{Number(activePayslipModal.loss_of_pay || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr>
                        <td>HOUSE RENT ALLOWANCE (HRA)</td>
                        <td className="amt">{Number(activePayslipModal.hra || 20000).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="amt">{Number(activePayslipModal.hra || 20000).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td>PROFESSION TAX</td>
                        <td className="amt">{Number(activePayslipModal.professional_tax || 250).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr>
                        <td>TRAVEL ALLOWANCE</td>
                        <td className="amt">{Number(activePayslipModal.travel_allowance || 14000).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="amt">{Number(activePayslipModal.travel_allowance || 14000).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td>EPF DEDUCTIONS</td>
                        <td className="amt">{Number(activePayslipModal.epf_deductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr>
                        <td>CONVEYANCE ALLOWANCE</td>
                        <td className="amt">{Number(activePayslipModal.conveyance_allowance || 12000).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="amt">{Number(activePayslipModal.conveyance_allowance || 12000).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td>TDS DEDUCTIONS</td>
                        <td className="amt">{Number(activePayslipModal.tds_deductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr>
                        <td>OTHER ALLOWANCE</td>
                        <td className="amt">{Number(activePayslipModal.other_allowance || 14000).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="amt">{Number(activePayslipModal.other_allowance || 14000).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td></td>
                        <td className="amt"></td>
                      </tr>
                      <tr className="total-row">
                        <td><strong>GROSS EARNINGS</strong></td>
                        <td className="amt"><strong>{Number(activePayslipModal.gross_earnings || 100000).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
                        <td className="amt"><strong>{Number(activePayslipModal.gross_earnings || 100000).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
                        <td><strong>GROSS DEDUCTIONS</strong></td>
                        <td className="amt"><strong>{Number(activePayslipModal.total_deductions || 250).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
                      </tr>
                      <tr className="netpay-row">
                        <td><strong>NET PAY</strong></td>
                        <td colSpan="4">
                          <strong>: ₹ {Number(activePayslipModal.net_pay || 99750).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                        </td>
                      </tr>
                      <tr className="words-row">
                        <td><strong>IN WORDS</strong></td>
                        <td colSpan="4">
                          : Rupees {numberToWords(activePayslipModal.net_pay || 99750)} Only
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="ramel-payslip-disclaimer">
                    Note: This is a auto-generated document and does not require a signature.
                  </div>
                </div>
              </div>
            </div>

            <div className="payslip-modal-footer no-print">
              <button 
                type="button" 
                className="btn btn-outline-secondary px-4 rounded-3" 
                onClick={() => setActivePayslipModal(null)}
              >
                Close
              </button>
              <button 
                type="button" 
                className="btn btn-primary px-4 rounded-3 d-flex align-items-center gap-2"
                onClick={() => window.print()}
              >
                <i className="bi bi-printer"></i> Print / Save as PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
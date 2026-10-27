
import React, { useState, useEffect, useMemo } from "react";
import Chart from "react-apexcharts";

export default function Leaves({ currentUser, employeeProfile, embedded = false }) {
  const [data, setData] = useState({ balances: [], leaveTypes: [], approvers: [], requests: [] });
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [leaveSubmitError, setLeaveSubmitError] = useState("");
  const [alertBanner, setAlertBanner] = useState(null); // { type: 'success' | 'danger', message: '' }
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [viewLeave, setViewLeave] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  
  useEffect(() => {
      const closeDropdown = () => setOpenDropdownId(null);
      document.addEventListener('click', closeDropdown);
      return () => document.removeEventListener('click', closeDropdown);
  }, []);

  useEffect(() => {
    if (data.requests && data.requests.length > 0) {
      if (!selectedLeave) {
        setSelectedLeave(data.requests[0]);
      } else {
        const updatedSelected = data.requests.find(r => r.id === selectedLeave.id);
        if (updatedSelected) {
          setSelectedLeave(updatedSelected);
        }
      }
    }
  }, [data.requests]);
  
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterType, setFilterType] = useState('All Leave Type');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterType, itemsPerPage]);

  const filteredLeaveRequests = useMemo(() => {
    return (data.requests || []).filter(req => {
      let match = true;
      if (filterStatus !== 'All Status' && req.status !== filterStatus) match = false;
      if (filterType !== 'All Leave Type' && req.leave_type !== filterType) match = false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const typeMatch = (req.leave_type || '').toLowerCase().includes(q);
        const reasonMatch = (req.reason || '').toLowerCase().includes(q);
        if (!typeMatch && !reasonMatch) match = false;
      }
      return match;
    });
  }, [data.requests, filterStatus, filterType, searchQuery]);

  const totalLeavePages = Math.ceil(filteredLeaveRequests.length / itemsPerPage) || 1;

  useEffect(() => {
    if (currentPage > totalLeavePages) {
      setCurrentPage(Math.max(1, totalLeavePages));
    }
  }, [currentPage, totalLeavePages]);

  const leaveStartIndex = (currentPage - 1) * itemsPerPage;
  const leaveEndIndex = Math.min(leaveStartIndex + itemsPerPage, filteredLeaveRequests.length);

  const paginatedLeaveRequests = useMemo(() => {
    return filteredLeaveRequests.slice(leaveStartIndex, leaveEndIndex);
  }, [filteredLeaveRequests, leaveStartIndex, leaveEndIndex]);

  const handleCancelLeave = async (leaveId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "https://hrms-backend-5xo8.onrender.com"}/api/leaves/cancel/${leaveId}`, {
        method: 'PUT'
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to cancel leave request');
      setAlertBanner({ type: 'success', message: 'Leave request cancelled successfully!' });
      setTimeout(() => setAlertBanner(null), 5000);
      await fetchData();
    } catch (err) {
      console.error(err);
      setAlertBanner({ type: 'danger', message: err.message || 'Failed to cancel leave request' });
      setTimeout(() => setAlertBanner(null), 5000);
    }
  };

  
  const [previewDoc, setPreviewDoc] = useState(null); // { url, name }
  const [editDocFile, setEditDocFile] = useState(null);
  
  const [formData, setFormData] = useState({
    leaveTypeId: '', approverId: '', startDate: '', endDate: '', reason: '', documentFile: null,
    isHalfDay: false, halfDayPeriod: 'First Half'
  });
  const [daysCalculated, setDaysCalculated] = useState(0);

  const handleOpenLeaveDocument = (leaveId, docUrl, docName) => {
    if (leaveId) {
      const fullUrl = `${import.meta.env.VITE_API_URL || "https://hrms-backend-5xo8.onrender.com"}/api/leaves/file/${leaveId}`;
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (docUrl && docUrl.startsWith('data:')) {
      try {
        const parts = docUrl.split(',');
        const byteString = atob(parts[1]);
        const mimeString = parts[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        const blob = new Blob([ab], { type: mimeString });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank', 'noopener,noreferrer');
        return;
      } catch (e) {
        console.error('Error opening blob document:', e);
      }
    }
    if (docUrl) {
      const fullUrl = docUrl.startsWith('http')
        ? docUrl
        : `${import.meta.env.VITE_API_URL || "https://hrms-backend-5xo8.onrender.com"}${docUrl.startsWith('/') ? '' : '/'}${docUrl}`;
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const fetchData = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL || "https://hrms-backend-5xo8.onrender.com"}/api/leaves/data/${currentUser.id}`);
      const result = await res.json();
      if (result.error) {
          console.error(result.error);
          setData({ balances: [], leaveTypes: [], approvers: [], requests: [] });
      } else {
          setData(result || { balances: [], leaveTypes: [], approvers: [], requests: [] });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [currentUser]);

  // Calculate min/max dates for leave application
  const todayObj = new Date();
  const pad2 = n => String(n).padStart(2, '0');
  const formatYMD = dt => `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
  
  const minDateObj = new Date(todayObj);
  minDateObj.setDate(todayObj.getDate() - 2);
  const minSelectableDate = formatYMD(minDateObj);

  const maxDateObj = new Date(todayObj);
  maxDateObj.setMonth(todayObj.getMonth() + 3);
  const maxSelectableDate = formatYMD(maxDateObj);

  // Helper: calculate working days skipping weekends and public holidays
  const calculateWorkingDays = (startDateStr, endDateStr) => {
    if (!startDateStr || !endDateStr) return 0;
    const cleanStart = startDateStr.includes('T') ? startDateStr.split('T')[0] : startDateStr;
    const cleanEnd = endDateStr.includes('T') ? endDateStr.split('T')[0] : endDateStr;
    const [sY, sM, sD] = cleanStart.split('-').map(Number);
    const [eY, eM, eD] = cleanEnd.split('-').map(Number);
    const start = new Date(sY, sM - 1, sD);
    const end = new Date(eY, eM - 1, eD);
    if (end < start) return 0;
    const holidayDatesSet = new Set(
      (data.holidays || []).map(h => {
        if (!h.holiday_date) return '';
        const dt = new Date(h.holiday_date);
        const pad = n => String(n).padStart(2, '0');
        return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
      }).filter(Boolean)
    );
    let count = 0;
    let cur = new Date(start);
    while (cur <= end) {
      const dayOfWeek = cur.getDay();
      const pad = n => String(n).padStart(2, '0');
      const curStr = `${cur.getFullYear()}-${pad(cur.getMonth() + 1)}-${pad(cur.getDate())}`;
      const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
      const isHoliday = holidayDatesSet.has(curStr);
      if (!isWeekend && !isHoliday) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  };

  // Calculate working days for apply modal
  useEffect(() => {
    if (formData.isHalfDay) {
      setDaysCalculated(0.5);
    } else {
      setDaysCalculated(calculateWorkingDays(formData.startDate, formData.endDate));
    }
  }, [formData.startDate, formData.endDate, formData.isHalfDay, data.holidays]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingLeave) return;
    setLeaveSubmitError("");

    // Form validation: other than document upload, all fields required
    if (!formData.leaveTypeId) {
      setLeaveSubmitError("Please select a leave type.");
      return;
    }
    if (!formData.approverId) {
      setLeaveSubmitError("Please select an approver.");
      return;
    }
    if (!formData.startDate) {
      setLeaveSubmitError("Please select a from date.");
      return;
    }
    if (!formData.isHalfDay && !formData.endDate) {
      setLeaveSubmitError("Please select a to date.");
      return;
    }
    if (formData.startDate < minSelectableDate || formData.startDate > maxSelectableDate) {
      setLeaveSubmitError(`From Date must be between ${minSelectableDate} and ${maxSelectableDate}.`);
      return;
    }
    if (!formData.isHalfDay && formData.endDate < formData.startDate) {
      setLeaveSubmitError("To Date cannot be earlier than From Date.");
      return;
    }
    if (!formData.reason || !formData.reason.trim()) {
      setLeaveSubmitError("Please enter a reason for your leave.");
      return;
    }

    setSubmittingLeave(true);
    try {
      const dataPayload = new FormData();
      dataPayload.append('userId', currentUser.id);
      dataPayload.append('leaveTypeId', formData.leaveTypeId);
      dataPayload.append('approverId', formData.approverId);
      dataPayload.append('startDate', formData.startDate);
      dataPayload.append('endDate', formData.isHalfDay ? formData.startDate : formData.endDate);
      dataPayload.append('days', formData.isHalfDay ? 0.5 : daysCalculated);
      dataPayload.append('isHalfDay', formData.isHalfDay);
      dataPayload.append('halfDayPeriod', formData.halfDayPeriod || 'First Half');
      dataPayload.append('reason', formData.reason.trim());
      if (formData.documentFile) {
        dataPayload.append('file', formData.documentFile);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || "https://hrms-backend-5xo8.onrender.com"}/api/leaves/apply`, {
        method: 'POST',
        body: dataPayload
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to submit leave request');
      setShowApplyModal(false);
      setFormData({ leaveTypeId: '', approverId: '', startDate: '', endDate: '', reason: '', documentFile: null, isHalfDay: false, halfDayPeriod: 'First Half' });
      setAlertBanner({ type: 'success', message: 'Leave request submitted successfully!' });
      setTimeout(() => setAlertBanner(null), 5000);
      await fetchData();
    } catch (err) {
      setLeaveSubmitError(err.message || 'Unable to submit leave request');
      setAlertBanner({ type: 'danger', message: err.message || 'Failed to submit leave request' });
      setTimeout(() => setAlertBanner(null), 5000);
    } finally {
      setSubmittingLeave(false);
    }
  };

  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentYear = today.getFullYear();

  // Show current year holidays count only
  const holidaysList = (data.holidays || []).filter(h => {
    if (!h.holiday_date) return false;
    const dStr = typeof h.holiday_date === 'string' ? h.holiday_date.split('T')[0] : '';
    if (dStr) {
      return dStr.startsWith(`${currentYear}-`);
    }
    const d = new Date(h.holiday_date);
    return !isNaN(d.getTime()) && d.getFullYear() === currentYear;
  });

  const totalHolidays = holidaysList.length;
  const passedHolidays = holidaysList.filter(h => new Date(h.holiday_date) < today);
  const upcomingHolidays = holidaysList.filter(h => new Date(h.holiday_date) >= today);

  const holidaysCompletedCount = passedHolidays.length;
  const holidaysRemainingCount = upcomingHolidays.length;
  const holidayCompletedPercent = totalHolidays > 0 ? Math.round((holidaysCompletedCount / totalHolidays) * 100) : 0;

  const orgLeaveTypes = (data.leaveTypes && data.leaveTypes.length > 0)
    ? data.leaveTypes.map(lt => ({ id: lt.id, name: lt.name }))
    : (data.balances || []).map(b => ({ id: b.leave_type_id, name: b.leave_type_name }));

  const computedBalances = (data.balances || []).map(b => {
      const typeName = b.leave_type_name;
      const actualUsed = (data.requests || [])
          .filter(r => r.leave_type === typeName && r.status === 'Approved')
          .reduce((sum, r) => sum + parseFloat(r.days_requested || 0), 0);
      const remaining = parseFloat(b.total_days || 0) - actualUsed;
      return { ...b, used_days: actualUsed, remaining_days: Number(remaining) === Math.floor(remaining) ? remaining.toString() : remaining.toFixed(2) };
  });

  const annualBalance = computedBalances.find(b => (b.leave_type_name || '').toLowerCase().includes('annual')) || {
      leave_type_name: 'Annual Leave', total_days: 18, used_days: 1, remaining_days: '17'
  };
  const sickBalance = computedBalances.find(b => (b.leave_type_name || '').toLowerCase().includes('sick')) || {
      leave_type_name: 'Sick Leave', total_days: 10, used_days: 0, remaining_days: '10'
  };

  const totalUsed = parseFloat(annualBalance.used_days || 0) + parseFloat(sickBalance.used_days || 0);

  const chartSeries = [
      parseFloat(annualBalance.used_days || 0),
      parseFloat(sickBalance.used_days || 0),
      holidaysCompletedCount
  ];
  const chartSum = chartSeries.reduce((a, b) => a + b, 0);

  const chartOptions = {
      chart: { type: 'donut', fontFamily: 'inherit' },
      labels: ['Annual Leave', 'Sick Leave', 'Public Holidays'],
      colors: ['#4e36f5', '#ff5b5b', '#ff9800'],
      dataLabels: { enabled: false },
      stroke: { width: 0 },
      plotOptions: {
          pie: {
              donut: {
                  size: '75%',
                  labels: {
                      show: true,
                      name: { show: true, color: '#888', fontSize: '14px' },
                      value: { show: true, fontSize: '24px', fontWeight: 'bold', color: '#333' },
                      total: {
                          show: true,
                          label: 'Days Used',
                          formatter: function () {
                              return chartSum;
                          }
                      }
                  }
              }
          }
      },
      legend: { show: false }
  };

  const todayDateStr = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;

  const getCleanDate = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val.split('T')[0];
    const d = new Date(val);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  };

  const scheduledLeaves = (data.requests || [])
      .filter(req => (req.status === 'Pending' || req.status === 'Approved'))
      .filter(req => {
          const sDate = getCleanDate(req.start_date);
          return sDate && sDate >= todayDateStr;
      })
      .map(req => {
          const startDate = new Date(req.start_date);
          const month = startDate.toLocaleString('default', { month: 'short' }).toUpperCase();
          const day = startDate.getDate();
          const startFmt = new Date(req.start_date).toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'}).replace(/ /g, '-');
          const endFmt = new Date(req.end_date).toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'}).replace(/ /g, '-');
          const isSameDay = getCleanDate(req.start_date) === getCleanDate(req.end_date);
          const dateStr = isSameDay ? startFmt : `${startFmt} to ${endFmt}`;
          const statusClass = req.status === 'Approved' ? 'approved' : 'pending';
          return {
              id: `leave-${req.id}`,
              date: startDate,
              day,
              month,
              title: req.leave_type,
              dateStr,
              days: req.days_requested,
              is_half_day: req.is_half_day,
              half_day_period: req.half_day_period,
              status: req.status,
              statusClass
          };
      });

  const scheduledHolidays = upcomingHolidays.map((h, i) => {
      const hDate = new Date(h.holiday_date);
      const month = hDate.toLocaleString('default', { month: 'short' }).toUpperCase();
      const day = hDate.getDate();
      const dateFmt = hDate.toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'}).replace(/ /g, '-');
      return {
          id: `holiday-${h.id || i}`,
          date: hDate,
          day,
          month,
          title: `Public Holiday (${h.holiday_name})`,
          dateStr: dateFmt,
          days: 1,
          status: 'Pending',
          statusClass: 'pending'
      };
  });

  const upcomingRequests = [...scheduledLeaves]
      .sort((a, b) => a.date - b.date)
      .slice(0, 3);

  if (!currentUser) return <div>Loading...</div>;

  return (
    <>
      <main className="dashboard-wrapper">
        <div className="dashboard-container">

            
            

            <div className="px-0 px-md-5 employee-dashboard">

                <div id="profileLeave">

                    <div className="epl-page">

                        
{alertBanner && (
                            <div className={`alert alert-${alertBanner.type} alert-dismissible fade show mb-4`} role="alert" style={{ borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)' }}>
                                <div className="d-flex align-items-center">
                                    <i className={`bi ${alertBanner.type === 'success' ? 'bi-check-circle-fill text-success' : 'bi-exclamation-triangle-fill text-danger'} fs-5 me-2`}></i>
                                    <strong>{alertBanner.message}</strong>
                                </div>
                                <button type="button" className="btn-close" onClick={() => setAlertBanner(null)} aria-label="Close"></button>
                            </div>
                        )}
                        <div className="epl-page-header">

                            {!embedded && <div>
                                <h2 className="epl-title">Leave Management</h2>

                                <p className="epl-subtitle">
                                    Manage leave balances, requests, approvals and leave history.
                                </p>
                            </div>}

                            <div className="epl-header-actions">

                                {!embedded && <button type="button" className="btn" style={{ borderColor: '#4e36f5', color: '#4e36f5', backgroundColor: '#fff', fontWeight: '500', padding: '8px 16px', borderRadius: '6px' }} id="eplExportBtn" onClick={() => alert("Export functionality coming soon!")}><i className="bi bi-download"></i> Export</button>}

                                <button type="button" className="btn" style={{ backgroundColor: '#4e36f5', color: '#fff', fontWeight: '500', padding: '8px 16px', borderRadius: '6px' }} id="eplApplyLeaveBtn" onClick={() => { setLeaveSubmitError(""); setShowApplyModal(true); }}><i className="bi bi-plus-lg"></i> Apply Leave</button>

                            </div>

                        </div>

                        
                        <div className={`esc-employee-bar${embedded ? " d-none" : ""}`}>

                            <div className="esc-employee-main">

                                <div className="esc-avatar overflow-hidden">
        {(employeeProfile?.profile_pic || employeeProfile?.avatar_url) ? (
          <img
            src={/^(https?:\/\/|data:|blob:)/i.test(employeeProfile?.profile_pic || employeeProfile?.avatar_url)
              ? (employeeProfile?.profile_pic || employeeProfile?.avatar_url)
              : `${import.meta.env.VITE_API_URL || 'https://hrms-backend-5xo8.onrender.com'}/${(employeeProfile?.profile_pic || employeeProfile?.avatar_url).replace(/^\/+/, '')}`}
            alt="Employee"
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "17px" }}
          />
        ) : (
          <>
            {employeeProfile?.first_name?.charAt(0) || currentUser?.email?.charAt(0)?.toUpperCase()}
            {employeeProfile?.last_name?.charAt(0) || ""}
          </>
        )}
    </div>

                                <div className="esc-employee-info">
                                    <div className="esc-name-row">
        <h3>{employeeProfile?.first_name ? `${employeeProfile.first_name} ${employeeProfile.last_name || ''}` : currentUser?.email}</h3>
        <span className="esc-status-badge"><span></span>Active</span>
    </div>

                                    <p className="esc-role">{employeeProfile?.designation || "Senior Software Engineer"}</p>

                                    <div className="esc-employee-meta">
        <span><i className="bi bi-diagram-3"></i> {employeeProfile?.department || "Engineering"}</span>
        <span><i className="bi bi-geo-alt"></i> {employeeProfile?.city || employeeProfile?.location || "Nagpur"}</span>
        <span><i className="bi bi-person-badge"></i> {employeeProfile?.employee_code || "EMP-1360"}</span>
    </div>
                                </div>

                            </div>

                            <div className="esc-employee-side">
                                <span className="esc-side-label">Profile Area</span>
                                <strong>Leave Management</strong>
                            </div>

                        </div>


                        
                        <div className="row g-4 epl-summary-row">

                            {/* 1. Annual Leave Card */}
                            <div className="col-xl-4 col-md-6">
                                <div className="epl-balance-card annual">
                                    <div className="epl-balance-top">
                                        <div className="epl-balance-icon">
                                            <i className="bi bi-calendar-check"></i>
                                        </div>
                                        <span className="epl-balance-label">Annual Leave</span>
                                    </div>
                                    <div className="epl-balance-values">
                                        <strong>{parseFloat(annualBalance.used_days || 0)}</strong>
                                        <span>/ {Number(annualBalance.total_days) === Math.floor(annualBalance.total_days) ? annualBalance.total_days.toString().split(".")[0] : annualBalance.total_days} Days</span>
                                    </div>
                                    <div className="epl-progress">
                                        <div className="epl-progress-bar" style={{ width: `${Math.min(100, Math.round((parseFloat(annualBalance.used_days || 0) / (parseFloat(annualBalance.total_days) || 1)) * 100))}%` }}></div>
                                    </div>
                                    <div className="epl-balance-bottom d-flex justify-content-between align-items-center mt-2">
                                        <span>{annualBalance.remaining_days} days remaining</span>
                                        <strong>{Math.round((parseFloat(annualBalance.used_days) / (parseFloat(annualBalance.total_days) || 1)) * 100)}% used</strong>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Sick Leave Card */}
                            <div className="col-xl-4 col-md-6">
                                <div className="epl-balance-card sick">
                                    <div className="epl-balance-top">
                                        <div className="epl-balance-icon">
                                            <i className="bi bi-heart-pulse"></i>
                                        </div>
                                        <span className="epl-balance-label">Sick Leave</span>
                                    </div>
                                    <div className="epl-balance-values">
                                        <strong>{parseFloat(sickBalance.used_days || 0)}</strong>
                                        <span>/ {Number(sickBalance.total_days) === Math.floor(sickBalance.total_days) ? sickBalance.total_days.toString().split(".")[0] : sickBalance.total_days} Days</span>
                                    </div>
                                    <div className="epl-progress">
                                        <div className="epl-progress-bar" style={{ width: `${Math.min(100, Math.round((parseFloat(sickBalance.used_days || 0) / (parseFloat(sickBalance.total_days) || 1)) * 100))}%` }}></div>
                                    </div>
                                    <div className="epl-balance-bottom d-flex justify-content-between align-items-center mt-2">
                                        <span>{sickBalance.remaining_days} days remaining</span>
                                        <strong>{Math.round((parseFloat(sickBalance.used_days) / (parseFloat(sickBalance.total_days) || 1)) * 100)}% used</strong>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Public Holidays Card (Replaces Casual Leave) */}
                            <div className="col-xl-4 col-md-6">
                                <div className="epl-balance-card casual">
                                    <div className="epl-balance-top">
                                        <div className="epl-balance-icon">
                                            <i className="bi bi-calendar2-week"></i>
                                        </div>
                                        <span className="epl-balance-label">Public Holidays</span>
                                    </div>
                                    <div className="epl-balance-values">
                                        <strong>{holidaysCompletedCount}</strong>
                                        <span>/ {totalHolidays} Days</span>
                                    </div>
                                    <div className="epl-progress">
                                        <div className="epl-progress-bar" style={{ width: `${holidayCompletedPercent}%` }}></div>
                                    </div>
                                    <div className="epl-balance-bottom d-flex justify-content-between align-items-center mt-2">
                                        <span>{holidaysRemainingCount} days remaining</span>
                                        <strong>{holidayCompletedPercent}% Completed</strong>
                                    </div>
                                </div>
                            </div>

                        </div>


                        
                        <div className="row g-4 epl-overview-row">

                            
                            <div className="col-xl-7">

                                <div className="epl-card epl-utilization-card">

                                    <div className="epl-card-header common-card-heading">

                                        <div>
                                            <span className="epl-section-label">
                                                LEAVE OVERVIEW
                                            </span>

                                            <h3>Leave Utilization</h3>

                                            <p>
                                                Leave usage across available leave categories.
                                            </p>
                                        </div>

                                        <span className="epl-year-badge">
                                            2026
                                        </span>

                                    </div>

                                    <div className="epl-utilization-content">

                                        <div id="eplLeaveChart" className="d-flex justify-content-center align-items-center" style={{ width: '250px', margin: '0 auto' }}>
                                            <Chart options={chartOptions} series={chartSeries} type="donut" width="100%" />
                                        </div>

                                        <div className="epl-utilization-summary">

                                            <div className="epl-util-item">
                                                <span><i className="epl-dot annual"></i>Annual Leave</span>
                                                <strong>{annualBalance.used_days} / {Number(annualBalance.total_days) === Math.floor(annualBalance.total_days) ? annualBalance.total_days.toString().split(".")[0] : annualBalance.total_days}</strong>
                                            </div>

                                            <div className="epl-util-item">
                                                <span><i className="epl-dot sick"></i>Sick Leave</span>
                                                <strong>{sickBalance.used_days} / {Number(sickBalance.total_days) === Math.floor(sickBalance.total_days) ? sickBalance.total_days.toString().split(".")[0] : sickBalance.total_days}</strong>
                                            </div>

                                            <div className="epl-util-item">
                                                <span><i className="epl-dot casual"></i>Public Holidays</span>
                                                <strong>{holidaysCompletedCount} / {totalHolidays}</strong>
                                            </div>

                                            <div className="epl-util-total">
                                                <span>Total Leave Used</span>
                                                <strong>{chartSum} Days</strong>
                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </div>


                            
                            <div className="col-xl-5">

                                <div className="epl-card epl-upcoming-card">

                                    <div className="epl-card-header common-card-heading">

                                        <div>
                                            <span className="epl-section-label">
                                                UPCOMING
                                            </span>

                                            <h3>Upcoming Leave</h3>

                                            <p>
                                                Scheduled leave for this employee.
                                            </p>
                                        </div>

                                    </div>

                                    {upcomingRequests.length > 0 ? upcomingRequests.map(req => (
                                        <div className="epl-upcoming-item" key={req.id}>
                                            <div className="epl-upcoming-date">
                                                <strong>{req.day}</strong>
                                                <span>{req.month}</span>
                                            </div>
                                            <div className="epl-upcoming-content">
                                                <strong>{req.title}</strong>
                                                <span>{req.dateStr}</span>
                                                <small>{req.is_half_day ? `0.5 Day (${req.half_day_period === 'Second Half' ? '2nd Half' : '1st Half'})` : `${req.days} Day${Number(req.days) > 1 ? 's' : ''}`}</small>
                                            </div>
                                            <span className={`epl-leave-status ${req.statusClass}`}>
                                                {req.status}
                                            </span>
                                        </div>
                                    )) : (
                                        <div className="text-muted p-3 text-center">No upcoming leaves</div>
                                    )}

                                </div>

                            </div>

                        </div>


                        
                        <div className="epl-card epl-history-card">

                            <div className="epl-card-header epl-history-header common-card-heading">

                                <div>

                                    <span className="epl-section-label">
                                        LEAVE HISTORY
                                    </span>

                                    <h3>Employee Leave Requests</h3>

                                    <p>
                                        Showing {filteredLeaveRequests.length === 0 ? 0 : leaveStartIndex + 1} - {leaveEndIndex} of {filteredLeaveRequests.length} leave requests {totalLeavePages > 1 ? `(Page ${currentPage} of ${totalLeavePages})` : ''}
                                    </p>

                                </div>

                                <div className="epl-history-actions">

                                    <div className="epl-search-box">

                                        <i className="bi bi-search"></i>

                                        <input 
                                            type="text" 
                                            id="eplLeaveSearch" 
                                            placeholder="Search leave type or reason..." 
                                            value={searchQuery}
                                            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                        />

                                    </div>

                                    <select id="eplStatusFilter" className="form-select epl-filter" value={filterStatus} onChange={e => {setFilterStatus(e.target.value); setCurrentPage(1);}}>
    <option value="All Status">All Status</option>
    <option value="Approved">Approved</option>
    <option value="Pending">Pending</option>
    <option value="Rejected">Rejected</option>
    <option value="Cancelled">Cancelled</option>
</select>

                                    <select id="eplTypeFilter" className="form-select epl-filter" value={filterType} onChange={e => {setFilterType(e.target.value); setCurrentPage(1);}}>
    <option value="All Leave Type">All Leave Type</option>
    {computedBalances.map(b => <option key={b.leave_type_id} value={b.leave_type_name}>{b.leave_type_name}</option>)}
</select>

                                </div>

                            </div>


                            <div className="table-responsive" style={{ overflow: 'visible' }}>

                                <table className="table epl-leave-table">

                                    <thead>

                                        <tr>

                                            <th>Leave Type</th>
                                            <th>From Date</th>
                                            <th>To Date</th>
                                            <th>Days</th>
                                            <th>Reason</th>
                                            <th>Approver</th>
                                            <th>Status</th>
                                            <th>Applied Date</th>
                                            <th>Action</th>

                                        </tr>

                                    </thead>

                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan={9} className="text-center py-4 text-muted">
                                                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                                                    Loading leave requests...
                                                </td>
                                            </tr>
                                        ) : filteredLeaveRequests.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="text-center py-4 text-muted">
                                                    No leave requests found.
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedLeaveRequests.map((req) => {
                                                const statusClass = req.status === 'Approved' ? 'success' : (req.status === 'Rejected' || req.status === 'Cancelled') ? 'danger' : 'warning';
                                                const startFmt = new Date(req.start_date).toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'}).replace(/ /g, ' ');
                                                const endFmt = new Date(req.end_date).toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'}).replace(/ /g, ' ');
                                                const appliedFmt = new Date(req.created_at).toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'}).replace(/ /g, ' ');
                                                const isAnnual = (req.leave_type || '').toLowerCase().includes('annual');
                                                const isSick = (req.leave_type || '').toLowerCase().includes('sick');
                                                const typeClass = isAnnual ? 'annual' : isSick ? 'sick' : 'casual';
                                                const typeIcon = isAnnual ? 'bi-calendar-check' : isSick ? 'bi-heart-pulse' : 'bi-calendar2-week';
                                                
                                                return (
                                                    <tr key={`leave-req-${req.id}`}>
                                                        <td>
                                                            <div className="epl-leave-type">
                                                                <div className={`epl-type-icon ${typeClass}`}><i className={`bi ${typeIcon}`}></i></div>
                                                                <strong>{req.leave_type}</strong>
                                                            </div>
                                                        </td>
                                                        <td>{startFmt}</td>
                                                        <td>{req.is_half_day ? startFmt : endFmt}</td>
                                                        <td>
                                                            {req.is_half_day ? (
                                                                <span className="d-inline-flex align-items-center gap-1.5 flex-wrap">
                                                                    <span>0.50 Day(s)</span>
                                                                    <span className="badge rounded-pill" style={{ background: '#eef2ff', color: '#4338ca', fontSize: '11px', padding: '3px 8px', fontWeight: '600' }}>
                                                                        {req.half_day_period === 'Second Half' ? '2nd Half' : '1st Half'}
                                                                    </span>
                                                                </span>
                                                            ) : (
                                                                `${req.days_requested} Day(s)`
                                                            )}
                                                        </td>
                                                        <td><span className="text-truncate d-inline-block" style={{maxWidth: '150px'}} title={req.reason}>{req.reason || '--'}</span></td>
                                                        <td>{req.approver_first ? `${req.approver_first} ${req.approver_last}` : '--'}</td>
                                                        <td><span className={`badge bg-${statusClass} bg-opacity-10 text-${statusClass} rounded-pill px-3 py-2`}>{req.status}</span></td>
                                                        <td>{appliedFmt}</td>
                                                        <td>
                                                            <div style={{ position: 'relative' }}>
                                                                <button className="btn btn-sm btn-light border-0" style={{ backgroundColor: 'transparent', color: '#4e36f5', fontWeight: 'bold' }} type="button" onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === req.id ? null : req.id); setSelectedLeave(req); }}>
                                                                    <i className="bi bi-three-dots"></i>
                                                                </button>
                                                                {openDropdownId === req.id && (
                                                                    <ul className="dropdown-menu dropdown-menu-end shadow border-0 show" style={{ position: 'absolute', right: '100%', top: 0, minWidth: '150px', zIndex: 9999, display: 'block', marginRight: '5px' }}>
                                                                        <li>
                                                                            {req.status === 'Pending' ? (
                                                                                <button className="dropdown-item d-flex align-items-center gap-2 py-2 text-secondary" onClick={() => { setViewLeave(req); setIsEditMode(true); setOpenDropdownId(null); }}>
                                                                                    <i className="bi bi-pencil" style={{fontSize: '14px'}}></i> Edit
                                                                                </button>
                                                                            ) : (
                                                                                <span className="dropdown-item d-flex align-items-center gap-2 py-2 text-muted" style={{ cursor: 'not-allowed' }} title="Can only edit pending leaves">
                                                                                    <i className="bi bi-pencil" style={{fontSize: '14px'}}></i> Edit
                                                                                </span>
                                                                            )}
                                                                        </li>
                                                                        <li><button className="dropdown-item d-flex align-items-center gap-2 py-2 text-secondary" onClick={() => { setViewLeave(req); setIsEditMode(false); setOpenDropdownId(null); }}><i className="bi bi-eye" style={{fontSize: '14px'}}></i> View Details</button></li>
                                                                        <li><hr className="dropdown-divider m-0" /></li>
                                                                        <li>
                                                                            {req.status === 'Pending' ? (
                                                                                <button 
                                                                                    className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger" 
                                                                                    onClick={() => {
                                                                                        setOpenDropdownId(null);
                                                                                        handleCancelLeave(req.id);
                                                                                    }}
                                                                                >
                                                                                    <i className="bi bi-trash" style={{fontSize: '14px'}}></i> Cancel
                                                                                </button>
                                                                            ) : (
                                                                                <span className="dropdown-item d-flex align-items-center gap-2 py-2 text-muted" style={{ cursor: 'not-allowed' }} title="Can only cancel pending leaves">
                                                                                    <i className="bi bi-trash" style={{fontSize: '14px'}}></i> Cancel
                                                                                </span>
                                                                            )}
                                                                        </li>
                                                                    </ul>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>

                                </table>

                            </div>


                            <div className="epl-table-footer d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3 p-3">
                                <div className="d-flex align-items-center gap-3 text-muted" style={{ fontSize: '13px' }}>
                                    <span>
                                        Showing <strong>{filteredLeaveRequests.length === 0 ? 0 : leaveStartIndex + 1}</strong> to <strong>{leaveEndIndex}</strong> of <strong>{filteredLeaveRequests.length}</strong> leave requests
                                    </span>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className="text-muted small">Per page:</span>
                                        <select
                                            className="form-select form-select-sm"
                                            value={itemsPerPage}
                                            onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                            style={{ width: '72px', height: '32px', borderRadius: '8px', borderColor: '#ebecf3', fontSize: '12px', backgroundColor: '#fafaff', cursor: 'pointer' }}
                                        >
                                            <option value={5}>5</option>
                                            <option value={10}>10</option>
                                            <option value={20}>20</option>
                                        </select>
                                    </div>
                                </div>

                                {totalLeavePages > 1 && (
                                    <div className="epl-pagination d-flex align-items-center gap-1">
                                        <button 
                                            type="button"
                                            className={`epl-page-btn ${currentPage === 1 ? "disabled" : ""}`} 
                                            disabled={currentPage === 1} 
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            title="Previous Page"
                                        >
                                            <i className="bi bi-chevron-left"></i>
                                        </button>
                                        {Array.from({ length: totalLeavePages }, (_, i) => i + 1).map(pageNum => (
                                            <button 
                                                key={pageNum} 
                                                type="button"
                                                className={`epl-page-btn ${currentPage === pageNum ? 'active' : ''}`} 
                                                onClick={() => setCurrentPage(pageNum)}
                                            >
                                                {pageNum}
                                            </button>
                                        ))}
                                        <button 
                                            type="button"
                                            className={`epl-page-btn ${currentPage === totalLeavePages ? "disabled" : ""}`} 
                                            disabled={currentPage === totalLeavePages} 
                                            onClick={() => setCurrentPage(p => Math.min(totalLeavePages, p + 1))}
                                            title="Next Page"
                                        >
                                            <i className="bi bi-chevron-right"></i>
                                        </button>
                                    </div>
                                )}
                            </div>
</div>
</div>
</div>
<div className="row g-4">

                            <div className="col-xl-7">

                                <div className="epl-card epl-timeline-card">

                                    <div className="epl-card-header common-card-heading">

                                        <div>

                                            <span className="epl-section-label">
                                                APPROVAL FLOW
                                            </span>

                                            <h3>Leave Approval Timeline</h3>

                                            <p>
                                                Track the progress of the selected leave request.
                                            </p>

                                        </div>

                                    </div>


                                    <div className="epl-timeline">
{selectedLeave ? (
    <>
        <div className="epl-timeline-item completed">
            <div className="epl-timeline-icon"><i className="bi bi-check-lg"></i></div>
            <div className="epl-timeline-content">
                <strong>Leave Applied</strong>
                <span>{new Date(selectedLeave.created_at || selectedLeave.start_date).toLocaleString('en-GB', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
                <small>Leave request submitted.</small>
            </div>
        </div>
        
        <div className="epl-timeline-line"></div>
        
        <div className={`epl-timeline-item ${selectedLeave.status === 'Approved' || selectedLeave.status === 'Rejected' ? 'completed' : 'pending'}`}>
            <div className="epl-timeline-icon">
                {selectedLeave.status === 'Approved' ? <i className="bi bi-check-lg"></i> : selectedLeave.status === 'Rejected' ? <i className="bi bi-x-lg"></i> : <i className="bi bi-hourglass-split"></i>}
            </div>
            <div className="epl-timeline-content">
                <strong>{selectedLeave.status === 'Approved' ? 'Manager Approved' : selectedLeave.status === 'Rejected' ? 'Manager Rejected' : 'Pending Manager Approval'}</strong>
                {selectedLeave.updated_at && <span>{new Date(selectedLeave.updated_at).toLocaleString('en-GB', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})}</span>}
                <small>{selectedLeave.status === 'Approved' ? `Approved by ${selectedLeave.approver_first || 'Manager'}` : selectedLeave.status === 'Rejected' ? `Rejected by ${selectedLeave.approver_first || 'Manager'}` : `Waiting for ${selectedLeave.approver_first || 'Manager'}`}</small>
            </div>
        </div>
        
        {selectedLeave.status !== 'Pending' && (
            <>
                <div className="epl-timeline-line"></div>
                <div className="epl-timeline-item completed">
                    <div className="epl-timeline-icon">
                        {selectedLeave.status === 'Approved' ? <i className="bi bi-check-lg"></i> : <i className="bi bi-x-lg"></i>}
                    </div>
                    <div className="epl-timeline-content">
                        <strong>Leave {selectedLeave.status}</strong>
                        {selectedLeave.updated_at && <span>{new Date(selectedLeave.updated_at).toLocaleString('en-GB', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})}</span>}
                        <small>Leave request {selectedLeave.status.toLowerCase()} successfully.</small>
                    </div>
                </div>
            </>
        )}
    </>
) : (
    <div className="text-muted p-3">Select a leave request to view timeline</div>
)}
                                    </div>
                                </div>
                            </div>
                            <div className="col-xl-5">

                                <div className="epl-card epl-policy-card">

                                    <div className="epl-card-header common-card-heading">

                                        <div>

                                            <span className="epl-section-label">
                                                LEAVE POLICY
                                            </span>

                                            <h3>Leave Information</h3>

                                        </div>

                                    </div>


                                    <div className="epl-policy-list">
                                        <div>
                                            <span>Annual Leave</span>
                                            <strong>{Number(annualBalance.total_days) === Math.floor(annualBalance.total_days) ? annualBalance.total_days.toString().split(".")[0] : annualBalance.total_days} Days / Year</strong>
                                        </div>
                                        <div>
                                            <span>Sick Leave</span>
                                            <strong>{Number(sickBalance.total_days) === Math.floor(sickBalance.total_days) ? sickBalance.total_days.toString().split(".")[0] : sickBalance.total_days} Days / Year</strong>
                                        </div>
                                        <div>
                                            <span>Public Holidays</span>
                                            <strong>{totalHolidays} Days / Year</strong>
                                        </div>
                                        <div>
                                            <span>Carry Forward</span>
                                            <strong>Up to 5 Days</strong>
                                        </div>
                                    </div>
                                    <div className="epl-policy-note">
                                        <i className="bi bi-info-circle"></i>
                                        <span>Leave balances are calculated according to the employee's assigned leave policy.</span>
                                    </div>
                                </div>
</div>
</div>

                    </div>
                </div>


                

                <div className="modal fade" id="eplApplyLeaveModal" tabindex="-1">

                    <div className="modal-dialog modal-dialog-centered modal-lg">

                        <div className="modal-content epl-modal">

                            <div className="modal-header">

                                <div>
                                    <span className="epl-section-label">
                                        LEAVE REQUEST
                                    </span>

                                    <h5 className="modal-title">
                                        Apply Leave
                                    </h5>
                                </div>

                                <button type="button" className="btn-close" data-bs-dismiss="modal">
                                </button>

                            </div>


                            <div className="modal-body">

                                <div className="row g-4">

                                    <div className="col-md-6">

                                        <label className="form-label">
                                            Leave Type
                                        </label>

                                        <select id="eplApplyType" className="form-select">

                                            <option value="">
                                                Select Leave Type
                                            </option>

                                            <option>
                                                Annual Leave
                                            </option>

                                            <option>
                                                Sick Leave
                                            </option>

                                            <option>
                                                Casual Leave
                                            </option>

                                        </select>

                                    </div>


                                    <div className="col-md-6">

                                        <label className="form-label">
                                            Approver
                                        </label>

                                        <select className="form-select">

                                            <option>
                                                Priya Sharma
                                            </option>

                                            <option>
                                                Anita Rao
                                            </option>

                                        </select>

                                    </div>


                                    <div className="col-md-6">

                                        <label className="form-label">
                                            From Date
                                        </label>

                                        <input
                                            type="date"
                                            id="eplApplyFrom"
                                            className="form-control"
                                            onClick={(e) => {
                                                try { e.currentTarget.showPicker(); } catch (_) {}
                                            }}
                                            onFocus={(e) => {
                                                try { e.currentTarget.showPicker(); } catch (_) {}
                                            }}
                                            style={{ cursor: "pointer" }}
                                        />

                                    </div>


                                    <div className="col-md-6">

                                        <label className="form-label">
                                            To Date
                                        </label>

                                        <input
                                            type="date"
                                            id="eplApplyTo"
                                            className="form-control"
                                            onClick={(e) => {
                                                try { e.currentTarget.showPicker(); } catch (_) {}
                                            }}
                                            onFocus={(e) => {
                                                try { e.currentTarget.showPicker(); } catch (_) {}
                                            }}
                                            style={{ cursor: "pointer" }}
                                        />

                                    </div>


                                    <div className="col-md-6">

                                        <label className="form-label">
                                            Number of Days
                                        </label>

                                        <input type="text" id="eplApplyDays" className="form-control" placeholder="Automatically calculated" readOnly />

                                    </div>


                                    <div className="col-md-6">

                                        <label className="form-label">
                                            Supporting Document
                                        </label>

                                        <input type="file" className="form-control" />

                                    </div>


                                    <div className="col-12">

                                        <label className="form-label">
                                            Reason
                                        </label>

                                        <textarea className="form-control" rows="3"
                                            placeholder="Enter reason for leave"></textarea>

                                    </div>

                                </div>

                            </div>


                            <div className="modal-footer">

                                <button type="button" className="btn epl-cancel-btn" data-bs-dismiss="modal">
                                    Cancel
                                </button>

                                <button type="button" className="btn epl-primary-btn" id="eplSubmitLeave">
                                    Submit Leave
                                </button>

                            </div>

                        </div>

                    </div>
</div>
</main>

      {/* Dynamic Apply Leave Modal (overriding the bootstrap one in HTML if it was there) */}
      {showApplyModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content epl-modal">
              <div className="modal-header">
    <div>
        <span className="epl-section-label">LEAVE REQUEST</span>
        <h5 className="modal-title">Apply Leave</h5>
    </div>
    <button type="button" className="btn-close" onClick={() => setShowApplyModal(false)} aria-label="Close"></button>
</div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-4">
                    {leaveSubmitError && <div className="col-12"><div className="alert alert-danger mb-0" role="alert">{leaveSubmitError}</div></div>}
                    <div className="col-md-6">
                      <label className="form-label">Leave Type <span className="text-danger">*</span></label>
                      <select className="form-select" required value={formData.leaveTypeId} onChange={e => setFormData({...formData, leaveTypeId: e.target.value})}>
                        <option value="">Select Leave Type</option>
                        {orgLeaveTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Approver</label>
                      <select className="form-select" required value={formData.approverId} onChange={e => setFormData({...formData, approverId: e.target.value})}>
                        <option value="">Select Approver</option>
                        {(data.approvers || []).map(a => <option key={a.id} value={a.id}>{a.first_name} {a.last_name} ({a.role_name})</option>)}
                      </select>
                    </div>
                    <div className="col-12">
                      <div className="d-flex align-items-center justify-content-between rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 14px' }}>
                        <div className="form-check form-switch mb-0 d-flex align-items-center gap-2">
                          <input
                            className="form-check-input mt-0"
                            type="checkbox"
                            role="switch"
                            id="halfDaySwitch"
                            style={{ width: '38px', height: '20px', cursor: 'pointer' }}
                            checked={formData.isHalfDay}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFormData(prev => ({
                                ...prev,
                                isHalfDay: checked,
                                endDate: checked ? prev.startDate : prev.endDate,
                                halfDayPeriod: prev.halfDayPeriod || 'First Half'
                              }));
                            }}
                          />
                          <label className="form-check-label fw-semibold text-dark mb-0" htmlFor="halfDaySwitch" style={{ cursor: 'pointer', fontSize: '13.5px' }}>
                            Half Day Leave
                          </label>
                        </div>
                        {formData.isHalfDay && (
                          <div className="d-flex align-items-center gap-2">
                            <span className="text-muted fw-medium" style={{ fontSize: '12px' }}>Session:</span>
                            <div className="btn-group btn-group-sm" role="group">
                              <button
                                type="button"
                                className={`btn btn-sm ${formData.halfDayPeriod === 'First Half' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                style={{ fontSize: '12px', padding: '3px 12px', fontWeight: formData.halfDayPeriod === 'First Half' ? '600' : '400' }}
                                onClick={() => setFormData(prev => ({ ...prev, halfDayPeriod: 'First Half' }))}
                              >
                                1st Half (Morning)
                              </button>
                              <button
                                type="button"
                                className={`btn btn-sm ${formData.halfDayPeriod === 'Second Half' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                style={{ fontSize: '12px', padding: '3px 12px', fontWeight: formData.halfDayPeriod === 'Second Half' ? '600' : '400' }}
                                onClick={() => setFormData(prev => ({ ...prev, halfDayPeriod: 'Second Half' }))}
                              >
                                2nd Half (Afternoon)
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">{formData.isHalfDay ? 'Leave Date' : 'From Date'} <span className="text-danger">*</span></label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        min={minSelectableDate}
                        max={maxSelectableDate}
                        value={formData.startDate}
                        onChange={e => {
                          const val = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            startDate: val,
                            ...(prev.isHalfDay ? { endDate: val } : {})
                          }));
                        }}
                        onClick={(e) => {
                          try { e.currentTarget.showPicker(); } catch (_) {}
                        }}
                        onFocus={(e) => {
                          try { e.currentTarget.showPicker(); } catch (_) {}
                        }}
                        style={{ cursor: "pointer" }}
                      />
                    </div>
                    {!formData.isHalfDay ? (
                      <div className="col-md-6">
                        <label className="form-label">To Date <span className="text-danger">*</span></label>
                        <input
                          type="date"
                          className="form-control"
                          required
                          min={formData.startDate || minSelectableDate}
                          max={maxSelectableDate}
                          value={formData.endDate}
                          onChange={e => setFormData({...formData, endDate: e.target.value})}
                          onClick={(e) => {
                            try { e.currentTarget.showPicker(); } catch (_) {}
                          }}
                          onFocus={(e) => {
                            try { e.currentTarget.showPicker(); } catch (_) {}
                          }}
                          style={{ cursor: "pointer" }}
                        />
                      </div>
                    ) : (
                      <div className="col-md-6">
                        <label className="form-label">Session Period</label>
                        <input
                          type="text"
                          className="form-control"
                          readOnly
                          style={{ backgroundColor: '#f8fafc', fontWeight: '500', color: '#4338ca' }}
                          value={formData.halfDayPeriod === 'Second Half' ? '2nd Half (Afternoon)' : '1st Half (Morning)'}
                        />
                      </div>
                    )}
                    <div className="col-md-6">
                      <label className="form-label">Number of Days</label>
                      <input
                        type="text"
                        className="form-control"
                        readOnly
                        style={{ backgroundColor: '#f8fafc', fontWeight: '600' }}
                        value={formData.isHalfDay ? '0.50 Day' : (daysCalculated > 0 ? `${daysCalculated} Day(s)` : 'Automatically calculated')}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Supporting Document <span className="text-muted fw-normal" style={{ fontSize: '12px' }}>(Max 500 KB)</span></label>
                      <input
                        type="file"
                        className="form-control"
                        onChange={e => {
                          const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                          if (file && file.size > 500 * 1024) {
                            setLeaveSubmitError("Supporting document size must be 500 KB or less.");
                            e.target.value = "";
                            setFormData(prev => ({ ...prev, documentFile: null }));
                            return;
                          }
                          setLeaveSubmitError("");
                          setFormData(prev => ({ ...prev, documentFile: file }));
                        }}
                      />
                      {formData.documentFile && (
                        <div className="mt-2 d-flex align-items-center justify-content-between p-2 rounded bg-light border">
                          <span className="small text-truncate" style={{ maxWidth: '65%' }}>
                            <i className="bi bi-file-earmark-check text-success me-1"></i>
                            {formData.documentFile.name}
                          </span>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary py-1 px-2 d-inline-flex align-items-center gap-1"
                            style={{ fontSize: "12px", borderRadius: "6px" }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const blobUrl = URL.createObjectURL(formData.documentFile);
                              window.open(blobUrl, "_blank", "noopener,noreferrer");
                            }}
                            title="Open document in new window"
                          >
                            <i className="bi bi-box-arrow-up-right"></i> View in New Window
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="col-12">
                      <label className="form-label">Reason <span className="text-danger">*</span></label>
                      <textarea className="form-control" rows="3" placeholder="Enter reason for leave" required value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})}></textarea>
                    </div>
                  </div>
                </div>
                <hr></hr>
                <div className="modal-footer border-0 pt-0 px-4 pb-4 gap-2">
                  <button type="button" className="btn" style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: '10px', padding: '10px 24px', fontWeight: '500' }} onClick={() => setShowApplyModal(false)}>Cancel</button>
                  <button type="submit" className="btn" style={{ background: '#3525b8', border: 'none', color: '#fff', borderRadius: '10px', padding: '10px 24px', fontWeight: '600', boxShadow: '0 4px 12px rgba(53,37,184,0.25)' }} disabled={submittingLeave}>{submittingLeave ? "Submitting..." : "Submit Leave"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    
      {/* View / Edit Leave Details Modal */}
      {viewLeave && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content epl-modal border-0 shadow" style={{ borderRadius: '12px' }}>
              <div className="modal-header border-0 pb-0 pt-4 px-4">
                <h5 className="modal-title fw-bold" style={{ color: '#24263d', fontSize: '18px' }}>Leave Information</h5>
                <button type="button" className="btn-close" onClick={() => setViewLeave(null)}></button>
              </div>
              <div className="modal-body px-4 pb-4 pt-3">
                  <div className="row g-3">
                      <div className="col-md-3">
                          <div className="p-3 rounded" style={{ border: '1px solid #eaeaea' }}>
                              <small className="text-muted d-block mb-1" style={{ fontSize: '13px' }}>Leave Type</small>
                              {isEditMode ? (
                                  <select className="form-select form-select-sm border-0 px-0 fw-bold shadow-none" value={viewLeave.leave_type || ''} onChange={(e) => setViewLeave({...viewLeave, leave_type: e.target.value})}>
                                      {orgLeaveTypes.map(lt => <option key={lt.id} value={lt.name}>{lt.name}</option>)}
                                  </select>
                              ) : (
                                  <strong className="d-block text-dark">{viewLeave.leave_type || '--'}</strong>
                              )}
                          </div>
                      </div>
                      <div className="col-md-3">
                          <div className="p-3 rounded" style={{ border: '1px solid #eaeaea' }}>
                              <small className="text-muted d-block mb-1" style={{ fontSize: '13px' }}>From Date</small>
                              {isEditMode ? (
                                  <input
                                      type="date"
                                      className="form-control form-control-sm border-0 px-0 fw-bold shadow-none"
                                      value={viewLeave.start_date ? (viewLeave.start_date.includes('T') ? viewLeave.start_date.split('T')[0] : new Date(viewLeave.start_date).toISOString().split('T')[0]) : ''}
                                      onChange={(e) => {
                                          const newStart = e.target.value;
                                          const newDays = calculateWorkingDays(newStart, viewLeave.end_date);
                                          setViewLeave({...viewLeave, start_date: newStart, days_requested: newDays});
                                      }}
                                      onClick={(e) => {
                                          try { e.currentTarget.showPicker(); } catch (_) {}
                                      }}
                                      onFocus={(e) => {
                                          try { e.currentTarget.showPicker(); } catch (_) {}
                                      }}
                                      style={{ cursor: "pointer" }}
                                  />
                              ) : (
                                  <strong className="d-block text-dark">{viewLeave.start_date ? new Date(viewLeave.start_date).toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'}).replace(/ /g, '-') : '--'}</strong>
                              )}
                          </div>
                      </div>
                      <div className="col-md-3">
                          <div className="p-3 rounded" style={{ border: '1px solid #eaeaea' }}>
                              <small className="text-muted d-block mb-1" style={{ fontSize: '13px' }}>To Date</small>
                              {isEditMode ? (
                                  <input
                                      type="date"
                                      className="form-control form-control-sm border-0 px-0 fw-bold shadow-none"
                                      value={viewLeave.end_date ? (viewLeave.end_date.includes('T') ? viewLeave.end_date.split('T')[0] : new Date(viewLeave.end_date).toISOString().split('T')[0]) : ''}
                                      onChange={(e) => {
                                          const newEnd = e.target.value;
                                          const newDays = calculateWorkingDays(viewLeave.start_date, newEnd);
                                          setViewLeave({...viewLeave, end_date: newEnd, days_requested: newDays});
                                      }}
                                      onClick={(e) => {
                                          try { e.currentTarget.showPicker(); } catch (_) {}
                                      }}
                                      onFocus={(e) => {
                                          try { e.currentTarget.showPicker(); } catch (_) {}
                                      }}
                                      style={{ cursor: "pointer" }}
                                  />
                              ) : (
                                  <strong className="d-block text-dark">{viewLeave.end_date ? new Date(viewLeave.end_date).toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'}).replace(/ /g, '-') : '--'}</strong>
                              )}
                          </div>
                      </div>
                      <div className="col-md-3">
                          <div className="p-3 rounded" style={{ border: '1px solid #eaeaea' }}>
                              <small className="text-muted d-block mb-1" style={{ fontSize: '13px' }}>Number of Days</small>
                              <strong className="d-block text-dark">
                                  {viewLeave.is_half_day 
                                      ? `0.50 Day (${viewLeave.half_day_period === 'Second Half' ? '2nd Half' : '1st Half'})` 
                                      : `${viewLeave.days_requested || '--'} Days`}
                              </strong>
                          </div>
                      </div>
      
                      <div className="col-md-3">
                          <div className="p-3 rounded" style={{ border: '1px solid #eaeaea' }}>
                              <small className="text-muted d-block mb-1" style={{ fontSize: '13px' }}>Approver</small>
                              <strong className="d-block text-dark">{viewLeave.approver_first ? `${viewLeave.approver_first} ${viewLeave.approver_last || ''}` : 'Admin User'}</strong>
                          </div>
                      </div>
                      <div className="col-md-3">
                          <div className="p-3 rounded" style={{ border: '1px solid #eaeaea' }}>
                              <small className="text-muted d-block mb-1" style={{ fontSize: '13px' }}>Applied Date</small>
                              <strong className="d-block text-dark">{viewLeave.created_at ? new Date(viewLeave.created_at).toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'}).replace(/ /g, '-') : '--'}</strong>
                          </div>
                      </div>
                      <div className="col-md-3">
                          <div className="p-3 rounded" style={{ border: '1px solid #eaeaea' }}>
                              <small className="text-muted d-block mb-1" style={{ fontSize: '13px' }}>Approved Date</small>
                              <strong className="d-block text-dark">{viewLeave.updated_at && viewLeave.status !== 'Pending' ? new Date(viewLeave.updated_at).toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'}).replace(/ /g, '-') : '--'}</strong>
                          </div>
                      </div>
                      <div className="col-md-3">
                          <div className="p-3 rounded" style={{ border: '1px solid #eaeaea' }}>
                              <small className="text-muted d-block mb-1" style={{ fontSize: '13px' }}>Supporting Document</small>
                              {isEditMode ? (
                                  <div>
                                      <input
                                          type="file"
                                          className="form-control form-control-sm border-0 px-0 shadow-none"
                                          onChange={e => {
                                            const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                                            if (file && file.size > 500 * 1024) {
                                              alert("Supporting document exceeds 500 KB limit. Please select a smaller file.");
                                              e.target.value = "";
                                              setEditDocFile(null);
                                              return;
                                            }
                                            setEditDocFile(file);
                                          }}
                                      />
                                      {viewLeave.document_url && !editDocFile && (
                                          <button 
                                              type="button"
                                              onClick={() => handleOpenLeaveDocument(viewLeave.id, viewLeave.document_url, viewLeave.document_name)}
                                              className="btn btn-link text-primary text-truncate d-inline-flex align-items-center gap-1 mt-1 p-0 text-decoration-none" 
                                              style={{ fontSize: '11px', maxWidth: '200px', cursor: 'pointer' }} 
                                              title={viewLeave.document_name || 'View current document in new window'}
                                          >
                                              <i className="bi bi-box-arrow-up-right"></i> Current: {viewLeave.document_name || 'Document'}
                                          </button>
                                      )}
                                      {editDocFile && (
                                          <div className="mt-1 d-flex align-items-center justify-content-between p-1 px-2 rounded bg-light border">
                                              <span className="small text-truncate" style={{ fontSize: '11px', maxWidth: '120px' }}>
                                                  {editDocFile.name}
                                              </span>
                                              <button
                                                  type="button"
                                                  className="btn btn-sm btn-outline-primary py-0 px-1"
                                                  style={{ fontSize: '10px' }}
                                                  onClick={() => {
                                                      const blobUrl = URL.createObjectURL(editDocFile);
                                                      window.open(blobUrl, '_blank', 'noopener,noreferrer');
                                                  }}
                                              >
                                                  <i className="bi bi-box-arrow-up-right"></i> View
                                              </button>
                                          </div>
                                      )}
                                  </div>
                              ) : (
                                  viewLeave.document_url ? (
                                      <div className="d-flex align-items-center gap-1 mt-1">
                                          <button 
                                              type="button"
                                              onClick={() => handleOpenLeaveDocument(viewLeave.id, viewLeave.document_url, viewLeave.document_name)}
                                              className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 py-1 px-2" 
                                              style={{ fontSize: '12px', borderRadius: '6px' }}
                                              title="Open document in new window"
                                          >
                                              <i className="bi bi-box-arrow-up-right"></i> View Document in New Window
                                          </button>
                                      </div>
                                  ) : (
                                      <strong className="d-block text-muted">Not Required</strong>
                                  )
                              )}
                          </div>
                      </div>
      
                      <div className="col-12">
                          <div className="p-3 rounded" style={{ border: '1px solid #eaeaea' }}>
                              <small className="text-muted d-block mb-1" style={{ fontSize: '13px' }}>Reason</small>
                              {isEditMode ? (
                                  <textarea className="form-control form-control-sm border-0 px-0 fw-bold shadow-none" rows="2" value={viewLeave.reason || ''} onChange={(e) => setViewLeave({...viewLeave, reason: e.target.value})}></textarea>
                              ) : (
                                  <strong className="d-block text-dark">{viewLeave.reason || '--'}</strong>
                              )}
                          </div>
                      </div>
      
                      <div className="col-12">
                          <div className="p-3 rounded" style={{ border: '1px solid #eaeaea' }}>
                              <small className="text-muted d-block mb-1" style={{ fontSize: '13px' }}>Comments</small>
                              <strong className="d-block text-dark">{viewLeave.status === 'Approved' ? 'Approved by reporting manager.' : (viewLeave.status === 'Rejected' ? 'Rejected by manager.' : 'Waiting for manager approval.')}</strong>
                          </div>
                      </div>
                  </div>
              </div>
              <div className="modal-footer border-0 px-4 pb-4 pt-0">
                  {!isEditMode ? (
                      <>
                          {viewLeave.status === 'Pending' && (
                              <button type="button" className="btn btn-outline-secondary px-4 fw-medium rounded-3 d-flex align-items-center gap-2" onClick={() => { setIsEditMode(true); setEditDocFile(null); }}>
                                  <i className="bi bi-pencil"></i> Edit
                              </button>
                          )}
                          <button type="button" className="btn text-white px-4 fw-medium rounded-3 ms-auto" style={{ backgroundColor: '#4e36f5' }} onClick={() => { setViewLeave(null); setEditDocFile(null); }}>
                              Close
                          </button>
                      </>
                  ) : (
                      <>
                          <button type="button" className="btn btn-outline-secondary px-4 fw-medium rounded-3" onClick={() => { setIsEditMode(false); setEditDocFile(null); }}>
                              Cancel
                          </button>
                          <button type="button" className="btn text-white px-4 fw-medium rounded-3 d-flex align-items-center gap-2 ms-auto" style={{ backgroundColor: '#4e36f5' }} onClick={async () => {
                              try {
                                  const sDateStr = viewLeave.start_date ? (viewLeave.start_date.includes('T') ? viewLeave.start_date.split('T')[0] : viewLeave.start_date) : '';
                                  const eDateStr = viewLeave.end_date ? (viewLeave.end_date.includes('T') ? viewLeave.end_date.split('T')[0] : viewLeave.end_date) : '';
                                  
                                  if (!sDateStr || !eDateStr) {
                                      setAlertBanner({ type: 'danger', message: 'Please provide both From and To dates.' });
                                      setTimeout(() => setAlertBanner(null), 5000);
                                      return;
                                  }
                                  if (eDateStr < sDateStr) {
                                      setAlertBanner({ type: 'danger', message: 'To Date cannot be earlier than From Date.' });
                                      setTimeout(() => setAlertBanner(null), 5000);
                                      return;
                                  }

                                  const updatePayload = new FormData();
                                  updatePayload.append('leave_type', viewLeave.leave_type || '');
                                  updatePayload.append('start_date', sDateStr);
                                  updatePayload.append('end_date', eDateStr);
                                  updatePayload.append('reason', viewLeave.reason || '');
                                  if (editDocFile) {
                                      updatePayload.append('file', editDocFile);
                                  }

                                  const res = await fetch(`${import.meta.env.VITE_API_URL || "https://hrms-backend-5xo8.onrender.com"}/api/leaves/update/${viewLeave.id}`, {
                                      method: 'PUT',
                                      body: updatePayload
                                  });
                                  if (res.ok) {
                                      setIsEditMode(false);
                                      setViewLeave(null);
                                      setEditDocFile(null);
                                      setAlertBanner({ type: 'success', message: 'Leave request updated successfully!' });
                                      setTimeout(() => setAlertBanner(null), 5000);
                                      await fetchData();
                                  } else {
                                      const errData = await res.json().catch(() => ({}));
                                      setAlertBanner({ type: 'danger', message: errData.error || 'Failed to save changes' });
                                      setTimeout(() => setAlertBanner(null), 5000);
                                  }
                              } catch (err) {
                                  console.error(err);
                                  setAlertBanner({ type: 'danger', message: 'Error saving changes: ' + (err.message || '') });
                                  setTimeout(() => setAlertBanner(null), 5000);
                              }
                          }}>
                              <i className="bi bi-check2"></i> Save changes
                          </button>
                      </>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document In-Modal Preview Modal */}
      {previewDoc && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg" style={{ maxWidth: '850px' }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '14px', overflow: 'hidden' }}>
              <div className="modal-header py-3 px-4 bg-light border-bottom d-flex align-items-center justify-content-between">
                <h6 className="modal-title fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                  <i className="bi bi-file-earmark-text text-primary"></i>
                  <span className="text-truncate" style={{ maxWidth: '550px' }}>{previewDoc.name || 'Document Attachment'}</span>
                </h6>
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenLeaveDocument(null, previewDoc.url, previewDoc.name)}
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                    title="Open in new window"
                  >
                    <i className="bi bi-box-arrow-up-right"></i> Open in New Window
                  </button>
                  <button type="button" className="btn-close" onClick={() => setPreviewDoc(null)}></button>
                </div>
              </div>
              <div className="modal-body p-0 d-flex justify-content-center align-items-center" style={{ backgroundColor: '#1e293b', minHeight: '480px', maxHeight: '75vh', overflow: 'auto' }}>
                {previewDoc.url && (previewDoc.url.toLowerCase().endsWith('.pdf') || (previewDoc.name && previewDoc.name.toLowerCase().endsWith('.pdf'))) ? (
                  <iframe src={previewDoc.url} title="Document Preview" style={{ width: '100%', height: '540px', border: 'none' }} />
                ) : (
                  <img src={previewDoc.url} alt="Attachment Preview" style={{ maxWidth: '100%', maxHeight: '540px', objectFit: 'contain', padding: '12px' }} />
                )}
              </div>
              <div className="modal-footer py-2 px-4 bg-light border-top">
                <button type="button" className="btn btn-secondary btn-sm px-4 rounded-3" onClick={() => setPreviewDoc(null)}>Close Preview</button>
              </div>
            </div>
          </div>
        </div>
      )}

      </>
  );
}

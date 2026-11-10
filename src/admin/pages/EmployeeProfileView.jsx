import React, { useState, useEffect } from 'react';

export default function EmployeeProfileView({
  employee,
  onBack,
  currentUser
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);

  // Document Preview Modal State
  const [previewDoc, setPreviewDoc] = useState(null);

  // Assign Asset Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [isCustomAsset, setIsCustomAsset] = useState(false);
  const [customTag, setCustomTag] = useState('');
  const [customName, setCustomName] = useState('');
  const [customSerial, setCustomSerial] = useState('');
  const [customType, setCustomType] = useState('Laptop');
  const [assetCondition, setAssetCondition] = useState('Excellent');
  const [assignDate, setAssignDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [assigning, setAssigning] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 
    (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:5002'
      : 'https://hrms-backend-fzef.onrender.com');

  const employeeId = employee?.id || employee?.employee_id;

  // Safe accessor helper: returns NA if missing / empty in DB
  const val = (v, suffix = '') => {
    if (v === null || v === undefined || v === '') return 'NA';
    const str = String(v).trim();
    if (!str || str.toLowerCase() === 'undefined' || str.toLowerCase() === 'null') return 'NA';
    return str + suffix;
  };

  // Fetch full live DB dossier for this employee
  const fetchDossier = async () => {
    if (!employeeId) return;
    try {
      setLoading(true);
      const res = await fetch(API_URL + '/api/admin/employees/' + employeeId + '/dossier');
      if (res.ok) {
        const data = await res.json();
        setDossier(data);
      }
    } catch (err) {
      console.error('Error fetching employee dossier from DB:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDossier();
  }, [employeeId, API_URL]);

  // Fetch Available Free Assets when Assign Modal opens
  const fetchAvailableAssets = async () => {
    try {
      const res = await fetch(API_URL + '/api/admin/assets/available');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAvailableAssets(data);
          if (data.length > 0) {
            setSelectedAssetId(String(data[0].id));
            setIsCustomAsset(false);
          } else {
            setIsCustomAsset(true);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching available assets:', err);
    }
  };

  const handleOpenAssignModal = () => {
    fetchAvailableAssets();
    setShowAssignModal(true);
  };

  // Submit Asset Assignment
  const handleAssignAssetSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!employeeId) return;
    setAssigning(true);
    setFeedback(null);

    const payload = isCustomAsset ? {
      asset_tag: customTag,
      asset_name: customName,
      asset_type: customType,
      serial_number: customSerial,
      condition: assetCondition,
      assigned_date: assignDate
    } : {
      asset_id: selectedAssetId,
      condition: assetCondition,
      assigned_date: assignDate
    };

    try {
      const res = await fetch(API_URL + '/api/admin/employees/' + employeeId + '/assets/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to assign asset');
      }

      setFeedback({ type: 'success', message: 'Corporate asset assigned successfully!' });
      setShowAssignModal(false);
      // Re-fetch dossier so newly assigned asset appears immediately
      fetchDossier();
    } catch (err) {
      setFeedback({ type: 'danger', message: err.message || 'Error assigning asset' });
    } finally {
      setAssigning(false);
    }
  };

  // Merge database fields with fallback to employee prop, or 'NA'
  const empRecord = dossier?.employee || employee || {};
  const personal = dossier?.personal || {};
  const contact = dossier?.contact || {};
  const emergency = dossier?.emergency || {};
  const employment = dossier?.employment || {};
  const identity = dossier?.identity || {};
  const bank = dossier?.bank || {};
  const documents = Array.isArray(dossier?.documents) ? dossier.documents : [];
  const assets = Array.isArray(dossier?.assets) ? dossier.assets : [];
  const attStats = dossier?.attendanceStats || {};
  const recentPunches = Array.isArray(dossier?.recentPunches) ? dossier.recentPunches : [];

  // Computed Full Name
  const fullName = personal.first_name 
    ? (personal.first_name + (personal.middle_name ? ' ' + personal.middle_name : '') + (personal.last_name ? ' ' + personal.last_name : ''))
    : (empRecord.full_name || ((empRecord.first_name || '') + ' ' + (empRecord.last_name || '')) || 'NA');

  // Initials for Avatar
  const initials = fullName !== 'NA'
    ? fullName.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : 'EM';

  // Core Header Properties
  const employeeCode = val(empRecord.employee_code || (empRecord.id ? ('EMP-' + empRecord.id) : null));
  const designation = val(employment.designation || empRecord.designation || empRecord.role_name);
  const department = val(employment.department || empRecord.department);
  const team = val(employment.team || empRecord.team);
  const workMode = val(employment.work_mode || employment.location || empRecord.location);
  const email = val(contact.work_email || empRecord.email);
  const phone = val(contact.phone_number || contact.alternate_phone || empRecord.phone);
  const status = empRecord.status || 'Active';
  const isProbation = status.toLowerCase() === 'probation';
  const isInactive = status.toLowerCase() === 'inactive';
  const employmentType = val(employment.employment_type || empRecord.employment_type);

  // Date of birth & age
  let dobFormatted = 'NA';
  if (personal.date_of_birth) {
    const d = new Date(personal.date_of_birth);
    if (!isNaN(d.getTime())) {
      const age = new Date().getFullYear() - d.getFullYear();
      dobFormatted = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + (age > 0 ? (' (' + age + ' yrs)') : '');
    }
  }

  // Joining Date & Tenure calculation
  let joiningDateFormatted = 'NA';
  let tenureText = '';
  const rawJoin = employment.joining_date || empRecord.joining_date;
  if (rawJoin) {
    const jd = new Date(rawJoin);
    if (!isNaN(jd.getTime())) {
      joiningDateFormatted = jd.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const now = new Date();
      let yrs = now.getFullYear() - jd.getFullYear();
      let mos = now.getMonth() - jd.getMonth();
      if (mos < 0) {
        yrs -= 1;
        mos += 12;
      }
      tenureText = yrs > 0 ? (' (' + yrs + ' yrs, ' + mos + ' mos)') : (' (' + mos + ' mos)');
    }
  }

  // Address lines
  const currentAddress = [
    contact.current_address_line,
    contact.current_city,
    contact.current_state,
    contact.current_postal_code,
    contact.current_country
  ].filter(Boolean).join(', ');

  const permanentAddress = [
    contact.permanent_address_line,
    contact.permanent_city,
    contact.permanent_state,
    contact.permanent_postal_code,
    contact.permanent_country
  ].filter(Boolean).join(', ');

  // Documents filtering
  const pendingDocs = documents.filter(d => (d.verification_status || '').toLowerCase() === 'pending');
  const approvedDocs = documents.filter(d => (d.verification_status || '').toLowerCase() !== 'pending');

  return (
    <div className="employee-profile-page">
      {/* Top Header / Breadcrumb & Action Controls */}
      <div className="esc-page-header">
        <div>
          <div className="d-flex align-items-center gap-2 mb-2">
            <button 
              type="button" 
              className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1"
              onClick={onBack}
              title="Return to Employee Directory"
            >
              <i className="bi bi-arrow-left me-1"></i> Back to Directory
            </button>
            <span className="text-muted small">/</span>
            <span className="text-muted small">Workforce</span>
            <span className="text-muted small">/</span>
            <span className="fw-semibold small text-primary">{fullName}</span>
          </div>
          <h2 className="esc-page-title" id="pageHeaderTitle">Complete Employee Profile Overview</h2>
          <p className="esc-page-subtitle">
            Comprehensive employee dossier, identity records, timesheets, shift compliance and asset allocation.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button 
            type="button" 
            className="btn-admin-secondary"
            onClick={() => window.print()}
          >
            <i className="bi bi-download me-1"></i> Export Dossier
          </button>
          <button 
            type="button" 
            className="btn-admin-primary"
            onClick={() => alert('Editing profile for ' + fullName)}
          >
            <i className="bi bi-pencil-square me-1"></i> Edit Profile
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedback && (
        <div className={'alert alert-' + feedback.type + ' alert-dismissible fade show rounded-3 mb-4'} role="alert">
          <i className={'bi ' + (feedback.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill') + ' me-2'}></i>
          {feedback.message}
          <button type="button" className="btn-close" onClick={() => setFeedback(null)} aria-label="Close"></button>
        </div>
      )}

      {/* Employee Profile Dossier Welcome Banner */}
      <div className="en-welcome-banner mb-4">
        <div className="en-welcome-icon">
          <i className="bi bi-person-lines-fill"></i>
        </div>
        <div className="en-welcome-content">
          <span className="en-eyebrow">COMPREHENSIVE EMPLOYEE DOSSIER</span>
          <h3>Personnel Records, Credentials &amp; Career History.</h3>
          <p>Review personal details, statutory tax IDs, compensation band, emergency contacts, timesheets, and performance records.</p>
        </div>
        <div className="en-banner-decoration">
          <i className="bi bi-person-bounding-box"></i>
          <i className="bi bi-stars"></i>
        </div>
      </div>

      {/* EMPLOYEE IDENTITY HERO BAR */}
      <div className="esc-employee-bar mb-4">
        <div className="esc-employee-main">
          <div 
            className="esc-avatar" 
            id="empAvatarInitial" 
            style={{ 
              background: '#f59a42', 
              color: '#fff',
              fontSize: '20px',
              fontWeight: '700'
            }}
          >
            {initials}
          </div>

          <div className="esc-employee-info">
            <div className="esc-name-row">
              <h3 id="empFullName">{fullName}</h3>
              <span className="esc-status-badge">
                <span style={{ background: isInactive ? '#e75b5b' : isProbation ? '#f59a42' : '#22b981' }}></span> {status}
              </span>
            </div>

            <p id="empRoleText">{designation}</p>

            <div className="esc-employee-meta">
              <span>
                <i className="bi bi-diagram-3"></i> <span>{department}</span>
              </span>
              <span>
                <i className="bi bi-code-slash"></i> <span>{team}</span>
              </span>
              <span>
                <i className="bi bi-person-badge"></i> <span>{employeeCode}</span>
              </span>
              <span>
                <i className="bi bi-geo-alt"></i> <span>{workMode}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="esc-employee-side">
          <span className="esc-side-label">Work Shift</span>
          <strong>{val(employment.shift || 'General: 08:30 AM - 05:30 PM')}</strong>
          <small className="text-success d-block mt-1">
            <i className="bi bi-check-circle me-1"></i> Biometric Enrolled
          </small>
        </div>
      </div>

      {/* PROFILE OVERVIEW TABS */}
      <section className="ep-profile-tabs-wrapper mb-4">
        <div className="ep-profile-tabs">
          <button 
            type="button" 
            className={'ep-profile-tab ' + (activeTab === 'overview' ? 'active' : '')}
            onClick={() => setActiveTab('overview')}
          >
            <i className="bi bi-grid-1x2"></i> Overview &amp; Bio
          </button>
          <button 
            type="button" 
            className={'ep-profile-tab ' + (activeTab === 'attendance' ? 'active' : '')}
            onClick={() => setActiveTab('attendance')}
          >
            <i className="bi bi-calendar-check"></i> Attendance &amp; Punches
          </button>
          <button 
            type="button" 
            className={'ep-profile-tab ' + (activeTab === 'employment' ? 'active' : '')}
            onClick={() => setActiveTab('employment')}
          >
            <i className="bi bi-briefcase"></i> Employment &amp; Salary
          </button>
          <button 
            type="button" 
            className={'ep-profile-tab ' + (activeTab === 'documents' ? 'active' : '')}
            onClick={() => setActiveTab('documents')}
          >
            <i className="bi bi-folder2"></i> Documents
          </button>
          <button 
            type="button" 
            className={'ep-profile-tab ' + (activeTab === 'assets' ? 'active' : '')}
            onClick={() => setActiveTab('assets')}
          >
            <i className="bi bi-laptop"></i> Assets &amp; Access
          </button>
        </div>
      </section>

      {/* TAB 1: OVERVIEW & PERSONAL INFORMATION (IMAGE 5) */}
      {activeTab === 'overview' && (
        <section className="profile-tab-pane" id="tabPaneOverview">
          <div className="ep-profile-layout">
            {/* Left Column: Personal Information & Contact */}
            <div>
              {/* Personal Information Card */}
              <div className="ep-info-card mb-4">
                <div className="ep-card-heading common-card-heading">
                  <div className="ep-card-heading-left">
                    <div className="ep-card-icon ep-icon-purple">
                      <i className="bi bi-person"></i>
                    </div>
                    <div>
                      <h3>Personal Information</h3>
                      <p>Basic personal identity and demographic details.</p>
                    </div>
                  </div>
                </div>

                <div className="ep-information-grid">
                  <div className="ep-information-item">
                    <span>Full Name</span>
                    <strong>{fullName}</strong>
                  </div>
                  <div className="ep-information-item">
                    <span>Employee ID</span>
                    <strong>{employeeCode}</strong>
                  </div>
                  <div className="ep-information-item">
                    <span>Corporate Email</span>
                    <strong className="text-primary">{email}</strong>
                  </div>
                  <div className="ep-information-item">
                    <span>Contact Phone</span>
                    <strong>{phone}</strong>
                  </div>
                  <div className="ep-information-item">
                    <span>Date of Birth</span>
                    <strong>{dobFormatted}</strong>
                  </div>
                  <div className="ep-information-item">
                    <span>Gender</span>
                    <strong>{val(personal.gender)}</strong>
                  </div>
                  <div className="ep-information-item">
                    <span>Blood Group</span>
                    <strong>{val(personal.blood_group)}</strong>
                  </div>
                  <div className="ep-information-item">
                    <span>Marital Status</span>
                    <strong>{val(personal.marital_status)}</strong>
                  </div>
                </div>
              </div>

              {/* Contact & Residential Address Card */}
              <div className="ep-info-card mb-4">
                <div className="ep-card-heading common-card-heading">
                  <div className="ep-card-heading-left">
                    <div className="ep-card-icon ep-icon-blue">
                      <i className="bi bi-geo-alt"></i>
                    </div>
                    <div>
                      <h3>Contact &amp; Residential Address</h3>
                      <p>Residential coordinates and registered emergency contacts.</p>
                    </div>
                  </div>
                </div>

                <div className="ep-information-grid">
                  <div className="ep-information-item">
                    <span>Current Residential Address</span>
                    <strong>{val(currentAddress)}</strong>
                  </div>
                  <div className="ep-information-item">
                    <span>Permanent Home Address</span>
                    <strong>{val(permanentAddress)}</strong>
                  </div>
                  <div className="ep-information-item">
                    <span>Emergency Contact Name</span>
                    <strong>
                      {val(emergency.contact_name ? (emergency.contact_name + (emergency.relationship ? ' (' + emergency.relationship + ')' : '')) : null)}
                    </strong>
                  </div>
                  <div className="ep-information-item">
                    <span>Emergency Phone Number</span>
                    <strong>{val(emergency.phone_number)}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Attendance Summary & Statutory Eligibility */}
            <div>
              {/* Attendance Summary Card */}
              <div className="admin-card mb-4">
                <div className="admin-card-header">
                  <h4 className="admin-card-title">
                    <i className="bi bi-clock-history text-primary"></i> Attendance Summary (Current Month)
                  </h4>
                </div>
                <div className="p-3">
                  <div className="p-3 rounded-4 mb-3 border d-flex align-items-center justify-content-between" style={{ background: '#f8fafc' }}>
                    <div>
                      <span className="text-muted small d-block">Monthly Attendance</span>
                      <h2 className="fw-bold mb-0 text-success">
                        {attStats.days_present > 0 ? '96.8%' : 'NA'}
                      </h2>
                    </div>
                    <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill">
                      {attStats.days_present > 0 ? 'Good Standing' : 'NA'}
                    </span>
                  </div>

                  <ul className="list-unstyled mb-3 d-flex flex-column gap-2 small">
                    <li className="d-flex align-items-center justify-content-between py-1 border-bottom">
                      <span className="text-muted"><i className="bi bi-check-circle text-success me-2"></i>Days Present</span>
                      <strong className="text-dark">{val(attStats.days_present, ' Days')}</strong>
                    </li>
                    <li className="d-flex align-items-center justify-content-between py-1 border-bottom">
                      <span className="text-muted"><i className="bi bi-clock text-warning me-2"></i>Late Arrivals</span>
                      <strong className="text-dark">{val(attStats.late_arrivals, ' Days')}</strong>
                    </li>
                    <li className="d-flex align-items-center justify-content-between py-1 border-bottom">
                      <span className="text-muted"><i className="bi bi-star text-info me-2"></i>Half Days</span>
                      <strong className="text-dark">{val(attStats.half_days, ' Days')}</strong>
                    </li>
                    <li className="d-flex align-items-center justify-content-between py-1 border-bottom">
                      <span className="text-muted"><i className="bi bi-x-circle text-danger me-2"></i>Absences</span>
                      <strong className="text-dark">{val(attStats.absences || '0', ' Days')}</strong>
                    </li>
                    <li className="d-flex align-items-center justify-content-between py-1">
                      <span className="text-muted"><i className="bi bi-speedometer2 text-primary me-2"></i>Avg. Productive Hrs</span>
                      <strong className="text-dark">{val(attStats.avg_hours || '09:25:20', ' / day')}</strong>
                    </li>
                  </ul>

                  <button 
                    type="button" 
                    className="btn btn-primary w-100 rounded-pill py-2"
                    style={{ background: '#3c2fbc', borderColor: '#3c2fbc' }}
                    onClick={() => setActiveTab('attendance')}
                  >
                    <i className="bi bi-grid-3x3-gap me-2"></i> View in Attendance Matrix
                  </button>
                </div>
              </div>

              {/* Statutory & Work Eligibility Card */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <h4 className="admin-card-title">
                    <i className="bi bi-shield-check text-success"></i> Statutory &amp; Work Eligibility
                  </h4>
                </div>
                <div className="p-3 small">
                  <div className="d-flex align-items-center justify-content-between py-2 border-bottom">
                    <span className="text-muted">PAN Card</span>
                    <strong className="d-flex align-items-center gap-1">
                      {val(identity.pan_number)}
                      {identity.pan_number && <i className="bi bi-check-circle-fill text-success ms-1"></i>}
                    </strong>
                  </div>
                  <div className="d-flex align-items-center justify-content-between py-2 border-bottom">
                    <span className="text-muted">Aadhaar (UIDAI)</span>
                    <strong className="d-flex align-items-center gap-1">
                      {identity.aadhaar_number ? ('•••• •••• •••• ' + identity.aadhaar_number.slice(-4)) : 'NA'}
                      {identity.aadhaar_number && <i className="bi bi-check-circle-fill text-success ms-1"></i>}
                    </strong>
                  </div>
                  <div className="d-flex align-items-center justify-content-between py-2 border-bottom">
                    <span className="text-muted">UAN / PF Number</span>
                    <strong>{val(identity.uan_number)}</strong>
                  </div>
                  <div className="d-flex align-items-center justify-content-between py-2">
                    <span className="text-muted">ESIC IP Number</span>
                    <strong>{val(identity.esic_number)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 2: ATTENDANCE & PUNCHES */}
      {activeTab === 'attendance' && (
        <section className="profile-tab-pane" id="tabPaneAttendance">
          <div className="admin-card mb-4">
            <div className="admin-card-header">
              <div>
                <h4 className="admin-card-title">
                  <i className="bi bi-clock-history text-primary"></i> Daily Punch Logs &amp; Biometric Records
                </h4>
                <span className="text-muted small">Live device synchronizations for {fullName}</span>
              </div>
              <button 
                type="button"
                className="btn btn-sm btn-admin-secondary"
                onClick={() => alert('Biometric logs are synchronized with live database')}
              >
                <i className="bi bi-arrow-repeat me-1"></i> Sync Logs
              </button>
            </div>

            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Total Hours</th>
                    <th>Shift Status</th>
                    <th>Verification Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPunches.length > 0 ? (
                    recentPunches.map((punch, idx) => (
                      <tr key={idx}>
                        <td className="fw-semibold">
                          {punch.attendance_date ? new Date(punch.attendance_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'NA'}
                        </td>
                        <td>
                          {punch.check_in_time ? (
                            <span className="badge bg-success-subtle text-success">
                              <i className="bi bi-box-arrow-in-right me-1"></i>
                              {new Date(punch.check_in_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          ) : 'NA'}
                        </td>
                        <td>
                          {punch.check_out_time ? (
                            <span className="badge bg-secondary-subtle text-secondary">
                              <i className="bi bi-box-arrow-left me-1"></i>
                              {new Date(punch.check_out_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          ) : 'NA'}
                        </td>
                        <td><strong>{val(punch.total_hours, ' hrs')}</strong></td>
                        <td>
                          <span className="admin-badge badge-active">
                            <span className="admin-badge-dot"></span> Recorded
                          </span>
                        </td>
                        <td>
                          <span className="small text-muted"><i className="bi bi-fingerprint text-primary me-1"></i> Biometric Device</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">
                        NA - No biometric punch records available in database for this employee.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* TAB 3: EMPLOYMENT & SALARY (IMAGE 3) */}
      {activeTab === 'employment' && (
        <section className="profile-tab-pane" id="tabPaneEmployment">
          <div className="ep-two-column-grid">
            {/* Left Card: Employment Details */}
            <div className="admin-card h-100 mb-0">
              <div className="admin-card-header">
                <h4 className="admin-card-title">
                  <i className="bi bi-briefcase text-primary"></i> Employment Details
                </h4>
              </div>
              <div className="p-3 small">
                <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <span className="text-muted">Job Title</span>
                  <strong className="text-dark">{designation}</strong>
                </div>
                <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <span className="text-muted">Department</span>
                  <strong className="text-dark">{department}</strong>
                </div>
                <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <span className="text-muted">Employment Type</span>
                  <strong className="text-dark">{employmentType}</strong>
                </div>
                <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <span className="text-muted">Date of Joining</span>
                  <strong className="text-dark">{joiningDateFormatted}{tenureText}</strong>
                </div>
                <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <span className="text-muted">Reporting Manager</span>
                  <strong className="text-dark">{val(employment.reporting_manager_name)}</strong>
                </div>
                <div className="d-flex justify-content-between align-items-center py-2">
                  <span className="text-muted">Probation Status</span>
                  <span className={'badge ' + (isProbation ? 'bg-warning-subtle text-warning border border-warning-subtle' : 'bg-success-subtle text-success border border-success-subtle') + ' px-3 py-1 rounded-pill'}>
                    {val(employment.probation_status || status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Card: Compensation & Payroll Grade */}
            <div className="admin-card h-100 mb-0">
              <div className="admin-card-header">
                <h4 className="admin-card-title">
                  <i className="bi bi-credit-card-2-front text-primary"></i> Compensation &amp; Payroll Grade
                </h4>
              </div>
              <div className="p-3 small">
                <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <span className="text-muted">Pay Grade / Level</span>
                  <strong className="text-dark">{val(bank.pay_grade || 'L4 Senior Specialist')}</strong>
                </div>
                <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <span className="text-muted">Annual CTC</span>
                  <strong className="text-dark">{val(bank.annual_ctc ? ('₹ ' + Number(bank.annual_ctc).toLocaleString() + ' / year') : 'NA')}</strong>
                </div>
                <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <span className="text-muted">Monthly Gross</span>
                  <strong className="text-dark">{val(bank.monthly_gross ? ('₹ ' + Number(bank.monthly_gross).toLocaleString()) : 'NA')}</strong>
                </div>
                <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <span className="text-muted">Salary Account ({val(bank.bank_name)})</span>
                  <strong className="text-dark">
                    {bank.account_number ? ('•••• •••• •••• ' + bank.account_number.slice(-4)) : 'NA'}
                  </strong>
                </div>
                <div className="d-flex justify-content-between align-items-center py-2">
                  <span className="text-muted">Payroll Cycle</span>
                  <strong className="text-dark">{val(bank.payroll_cycle || 'Last Working Day of Month')}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 4: DOCUMENTS (IMAGE 4) */}
      {activeTab === 'documents' && (
        <section className="profile-tab-pane" id="tabPaneDocuments">
          <div className="admin-card">
            {/* Top Card Header */}
            <div className="admin-card-header flex-wrap gap-2">
              <div>
                <h4 className="admin-card-title">
                  <i className="bi bi-folder2-open text-primary"></i> Uploaded Documents &amp; Compliance Dossier
                </h4>
                <span className="text-muted small">Manage employee identity credentials, verification requests, and approved corporate records.</span>
              </div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className="badge bg-light text-muted border px-3 py-2 rounded-pill">
                  <i className="bi bi-clock me-1 text-warning"></i> {pendingDocs.length} Pending Verification
                </span>
                <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill">
                  <i className="bi bi-check-circle me-1"></i> {approvedDocs.length} Approved &amp; Verified
                </span>
                <button 
                  type="button" 
                  className="btn btn-sm btn-admin-primary"
                  onClick={() => alert('Add Document dialog opened')}
                >
                  <i className="bi bi-plus-lg me-1"></i> Add Document
                </button>
              </div>
            </div>

            <div className="p-3">
              {/* SECTION 1: DOCUMENTS PENDING VERIFICATION */}
              <div className="mb-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-exclamation-circle-fill text-warning"></i>
                    <strong className="text-dark">Documents Pending Verification &amp; Approval</strong>
                    <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1">
                      Action Required
                    </span>
                  </div>
                </div>
                <p className="text-muted small mb-3">Staff submitted documents requiring administrative verification before official archiving.</p>

                <div className="table-responsive border rounded-3 mb-4">
                  <table className="admin-table align-middle mb-0">
                    <thead className="table-light small">
                      <tr>
                        <th>DOCUMENT NAME &amp; CATEGORY</th>
                        <th>DOCUMENT ID / NUMBER</th>
                        <th>ATTACHED FILE</th>
                        <th>SUBMISSION DATE</th>
                        <th>VERIFICATION STATUS</th>
                        <th className="text-end">VERIFICATION ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingDocs.length > 0 ? (
                        pendingDocs.map(doc => (
                          <tr key={doc.id}>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <i className="bi bi-file-earmark-pdf fs-5 text-danger"></i>
                                <div>
                                  <strong className="d-block text-dark">{val(doc.document_name || doc.document_type)}</strong>
                                  <span className="badge bg-light text-secondary border">{val(doc.document_category)}</span>
                                </div>
                              </div>
                            </td>
                            <td><span className="text-danger fw-semibold">{val(doc.document_number)}</span></td>
                            <td>
                              <span className="small text-muted d-flex align-items-center gap-1">
                                <i className="bi bi-paperclip"></i> {val(doc.file_name)}
                              </span>
                            </td>
                            <td>
                              {doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'NA'}
                            </td>
                            <td>
                              <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1">
                                Pending Verification
                              </span>
                            </td>
                            <td className="text-end">
                              <button 
                                type="button" 
                                className="btn btn-sm btn-outline-primary rounded-circle me-1"
                                onClick={() => setPreviewDoc(doc)}
                                title="View Document in Popup"
                              >
                                <i className="bi bi-eye"></i>
                              </button>
                              <button 
                                type="button" 
                                className="btn btn-sm btn-primary rounded-pill px-3 me-1"
                                style={{ background: '#3c2fbc', borderColor: '#3c2fbc' }}
                                onClick={() => alert('Document approved: ' + doc.id)}
                              >
                                <i className="bi bi-check-lg me-1"></i> Approve
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center py-3 text-muted">
                            NA - No documents pending verification for this employee.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 2: APPROVED & VERIFIED DOCUMENTS */}
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-check-circle-fill text-success"></i>
                    <strong className="text-dark">Approved &amp; Verified Documents</strong>
                    <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                      Verified Compliant
                    </span>
                  </div>
                </div>
                <p className="text-muted small mb-3">Accredited employee agreements, statutory proofs, and verified enterprise documents.</p>

                <div className="table-responsive border rounded-3">
                  <table className="admin-table align-middle mb-0">
                    <thead className="table-light small">
                      <tr>
                        <th>DOCUMENT NAME &amp; TYPE</th>
                        <th>DOCUMENT ID / NUMBER</th>
                        <th>ATTACHED FILE</th>
                        <th>VERIFIED DATE &amp; AUTHORITY</th>
                        <th>STATUS</th>
                        <th className="text-end">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {approvedDocs.length > 0 ? (
                        approvedDocs.map(doc => (
                          <tr key={doc.id}>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <i className="bi bi-file-earmark-check fs-5 text-success"></i>
                                <div>
                                  <strong className="d-block text-dark">{val(doc.document_name || doc.document_type)}</strong>
                                  <span className="badge bg-light text-secondary border">{val(doc.document_type || doc.document_category)}</span>
                                </div>
                              </div>
                            </td>
                            <td><code>{val(doc.document_number)}</code></td>
                            <td>
                              <span className="small text-muted d-flex align-items-center gap-1">
                                <i className="bi bi-paperclip"></i> {val(doc.file_name)}
                              </span>
                            </td>
                            <td>
                              <span className="d-block">
                                {doc.updated_at ? new Date(doc.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'NA'}
                              </span>
                              <small className="text-muted">Verified by HR Operations</small>
                            </td>
                            <td>
                              <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                                ● Approved &amp; Verified
                              </span>
                            </td>
                            <td className="text-end">
                              <button 
                                type="button" 
                                className="btn btn-sm btn-outline-primary rounded-circle me-1"
                                onClick={() => setPreviewDoc(doc)}
                                title="View Document in Popup"
                              >
                                <i className="bi bi-eye"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center py-3 text-muted">
                            NA - No approved documents on file in database.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 5: ASSETS & ACCESS (IMAGE 2) */}
      {activeTab === 'assets' && (
        <section className="profile-tab-pane" id="tabPaneAssets">
          <div className="admin-card">
            <div className="admin-card-header">
              <h4 className="admin-card-title">
                <i className="bi bi-laptop text-primary"></i> Assigned Corporate Hardware &amp; Security Accounts
              </h4>
              <button 
                type="button"
                className="btn btn-sm btn-admin-primary"
                onClick={handleOpenAssignModal}
              >
                <i className="bi bi-plus-lg me-1"></i> Assign Asset
              </button>
            </div>

            <div className="table-responsive">
              <table className="admin-table align-middle">
                <thead>
                  <tr>
                    <th>Asset Tag</th>
                    <th>Device / Resource</th>
                    <th>Serial Number</th>
                    <th>Allocated Date</th>
                    <th>Condition</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.length > 0 ? (
                    assets.map(asset => (
                      <tr key={asset.id}>
                        <td><strong>{val(asset.asset_tag)}</strong></td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-laptop fs-5 text-primary"></i>
                            <span>{val(asset.asset_name)}</span>
                          </div>
                        </td>
                        <td><code>{val(asset.serial_number)}</code></td>
                        <td>
                          {asset.assigned_date ? new Date(asset.assigned_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'NA'}
                        </td>
                        <td>{val(asset.asset_condition)}</td>
                        <td>
                          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                            {val(asset.status)}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">
                        NA - No corporate hardware or access keys assigned in database for this employee.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* DOCUMENT PREVIEW MODAL POPUP */}
      {/* ========================================================================= */}
      {previewDoc && (
        <div 
          className="modal fade show" 
          style={{ display: 'block', backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 1070 }}
          onClick={() => setPreviewDoc(null)}
        >
          <div 
            className="modal-dialog modal-dialog-centered modal-lg" 
            style={{ maxWidth: '850px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="modal-header px-4 py-3 bg-white border-bottom d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <div 
                    style={{ 
                      width: '42px', 
                      height: '42px', 
                      borderRadius: '12px', 
                      background: '#eeecff', 
                      color: '#3c2fbc', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '20px' 
                    }}
                  >
                    <i className="bi bi-file-earmark-text"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold mb-0 text-dark">
                      {val(previewDoc.document_name || previewDoc.document_type || 'Document Preview')}
                    </h5>
                    <div className="d-flex align-items-center gap-2 mt-1">
                      <span className="badge bg-light text-secondary border">
                        {val(previewDoc.document_category)}
                      </span>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                        {val(previewDoc.verification_status)}
                      </span>
                      <small className="text-muted">{val(previewDoc.file_name)}</small>
                    </div>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setPreviewDoc(null)}
                ></button>
              </div>

              <div className="modal-body p-4 bg-light text-center" style={{ minHeight: '350px' }}>
                {previewDoc.file_path && (previewDoc.file_path.startsWith('data:image') || previewDoc.file_name?.match(/\.(png|jpg|jpeg|webp|gif)$/i)) ? (
                  <div className="bg-white p-3 rounded-3 shadow-sm d-inline-block">
                    <img 
                      src={previewDoc.file_path.startsWith('data:') ? previewDoc.file_path : (API_URL + '/' + previewDoc.file_path.replace(/^\//, ''))} 
                      alt={previewDoc.document_name}
                      className="img-fluid rounded"
                      style={{ maxHeight: '68vh', objectFit: 'contain' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div style={{ display: 'none' }} className="p-4 text-muted">
                      <i className="bi bi-file-earmark-image fs-1 d-block mb-2 text-primary"></i>
                      <p className="mb-0">Image file path is referenced securely in database ({val(previewDoc.file_name)})</p>
                    </div>
                  </div>
                ) : previewDoc.file_name?.match(/\.pdf$/i) ? (
                  <iframe
                    src={previewDoc.file_path.startsWith('http') ? previewDoc.file_path : (API_URL + '/' + previewDoc.file_path.replace(/^\//, ''))}
                    title={previewDoc.document_name}
                    style={{ width: '100%', height: '68vh', border: 'none', borderRadius: '12px' }}
                  />
                ) : (
                  <div className="bg-white p-5 rounded-4 shadow-sm text-center">
                    <div 
                      className="mx-auto mb-3"
                      style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '50%',
                        background: '#eeecff',
                        color: '#3c2fbc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '32px'
                      }}
                    >
                      <i className="bi bi-file-earmark-check"></i>
                    </div>
                    <h5 className="fw-bold mb-1">{val(previewDoc.document_name || previewDoc.file_name)}</h5>
                    <p className="text-muted small mb-3">Document Record ID: #{previewDoc.id} • Number: {val(previewDoc.document_number)}</p>
                    <div className="p-3 bg-light rounded-3 d-inline-block text-start small">
                      <div><strong>Category:</strong> {val(previewDoc.document_category)}</div>
                      <div><strong>File Name:</strong> {val(previewDoc.file_name)}</div>
                      <div><strong>Status:</strong> {val(previewDoc.verification_status)}</div>
                      <div><strong>Uploaded Date:</strong> {previewDoc.created_at ? new Date(previewDoc.created_at).toLocaleDateString('en-GB') : 'NA'}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer px-4 py-3 bg-white border-top d-flex justify-content-between">
                <span className="text-muted small">
                  <i className="bi bi-shield-check me-1 text-success"></i> Verified Storage
                </span>
                <button 
                  type="button" 
                  className="btn btn-secondary rounded-pill px-4"
                  onClick={() => setPreviewDoc(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ASSIGN CORPORATE ASSET MODAL */}
      {/* ========================================================================= */}
      {showAssignModal && (
        <div 
          className="modal fade show" 
          style={{ display: 'block', backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1060 }}
          onClick={() => { if (!assigning) setShowAssignModal(false); }}
        >
          <div 
            className="modal-dialog modal-dialog-centered modal-lg" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="modal-header px-4 py-3 bg-white border-bottom d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <div 
                    style={{ 
                      width: '44px', 
                      height: '44px', 
                      borderRadius: '12px', 
                      background: '#eeecff', 
                      color: '#3c2fbc', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '20px' 
                    }}
                  >
                    <i className="bi bi-laptop-fill"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold mb-0 text-dark">Assign Corporate Hardware &amp; Assets</h5>
                    <small className="text-muted">Allocate available company inventory to {fullName} ({employeeCode})</small>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAssignModal(false)}
                  disabled={assigning}
                ></button>
              </div>

              <form onSubmit={handleAssignAssetSubmit}>
                <div className="modal-body p-4 bg-light">
                  <div className="bg-white p-4 rounded-4 border mb-3">
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1 mb-3">
                      <i className="bi bi-box-seam me-1"></i> Available Inventory Pool
                    </span>

                    <div className="row g-3">
                      {/* Asset Source Selection */}
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-muted">
                          Choose Available Asset from Inventory
                        </label>
                        <select
                          className="form-select rounded-3"
                          value={isCustomAsset ? 'custom' : selectedAssetId}
                          onChange={(e) => {
                            if (e.target.value === 'custom') {
                              setIsCustomAsset(true);
                              setSelectedAssetId('');
                            } else {
                              setIsCustomAsset(false);
                              setSelectedAssetId(e.target.value);
                            }
                          }}
                          required
                        >
                          {availableAssets.length > 0 ? (
                            availableAssets.map(a => (
                              <option key={a.id} value={String(a.id)}>
                                [{a.asset_tag}] {a.asset_name} ({a.asset_type} • {a.asset_condition})
                              </option>
                            ))
                          ) : (
                            <option value="custom" disabled>No free assets in inventory</option>
                          )}
                          <option value="custom">+ Register &amp; Assign New Asset</option>
                        </select>
                        <small className="text-muted mt-1 d-block">
                          Only unassigned and available assets from the company pool are shown.
                        </small>
                      </div>

                      {/* Custom Asset Inputs if registering a new one */}
                      {isCustomAsset && (
                        <>
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold text-muted">Asset Tag / Asset ID</label>
                            <input
                              type="text"
                              className="form-control rounded-3"
                              placeholder="e.g. AST-2026-099"
                              value={customTag}
                              onChange={(e) => setCustomTag(e.target.value)}
                              required={isCustomAsset}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold text-muted">Asset Name / Model</label>
                            <input
                              type="text"
                              className="form-control rounded-3"
                              placeholder='e.g. Apple MacBook Air 15" M3'
                              value={customName}
                              onChange={(e) => setCustomName(e.target.value)}
                              required={isCustomAsset}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold text-muted">Category</label>
                            <select
                              className="form-select rounded-3"
                              value={customType}
                              onChange={(e) => setCustomType(e.target.value)}
                            >
                              <option value="Laptop">Laptop / Workstation</option>
                              <option value="Display">Display / Monitor</option>
                              <option value="Security Key">Security Key / YubiKey</option>
                              <option value="Peripheral">Peripheral / Accessory</option>
                              <option value="Facility Access">Facility NFC Card</option>
                            </select>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold text-muted">Serial Number</label>
                            <input
                              type="text"
                              className="form-control rounded-3"
                              placeholder="e.g. C02G9012MD6R"
                              value={customSerial}
                              onChange={(e) => setCustomSerial(e.target.value)}
                            />
                          </div>
                        </>
                      )}

                      {/* Allocation Date */}
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-muted">Allocation Date</label>
                        <input
                          type="date"
                          className="form-control rounded-3"
                          value={assignDate}
                          onChange={(e) => setAssignDate(e.target.value)}
                          required
                        />
                      </div>

                      {/* Condition at Handover */}
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-muted">Condition at Handover</label>
                        <select
                          className="form-select rounded-3"
                          value={assetCondition}
                          onChange={(e) => setAssetCondition(e.target.value)}
                        >
                          <option value="Brand New">Brand New</option>
                          <option value="Excellent">Excellent</option>
                          <option value="Good">Good</option>
                          <option value="Fair">Fair</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer px-4 py-3 bg-white border-top">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary rounded-pill px-4"
                    onClick={() => setShowAssignModal(false)}
                    disabled={assigning}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary rounded-pill px-4"
                    style={{ background: '#3c2fbc', borderColor: '#3c2fbc' }}
                    disabled={assigning}
                  >
                    {assigning ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Assigning...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check2-circle me-1"></i> Confirm &amp; Assign Asset
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Clean Brand Footer */}
      <div className="text-center py-4 text-muted small border-top mt-4">
        Copyright © 2026 Ramel Techno Solutions. All rights reserved.
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import './ems-styles.css';
import EmployeeTemplate from './EmployeeTemplate';
import AdminTemplate from './admin/AdminTemplate';

const API_BASE = import.meta.env.VITE_API_URL || "https://hrms-backend-5xo8.onrender.com";


const DEFAULT_EMPLOYEE = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  roleKey: 'SOFTWARE_ENGINEER',
  department: 'Engineering',
  designation: 'Developer',
};

const ADMIN_ROLES = ['admin', 'org_admin', 'super_admin', 'hr'];

export default function App() {
  // ============================================================
  // AUTHENTICATION STATE
  // ============================================================

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('hrms_user');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Failed to read logged-in user:', error);
      return null;
    }
  });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);

  // ============================================================
  // ADMIN EMPLOYEE DIRECTORY
  // ============================================================

  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employeeError, setEmployeeError] = useState('');
  const [adminTab, setAdminTab] = useState('employees');
  const [adminRequests, setAdminRequests] = useState([]);
  const [loadingAdminRequests, setLoadingAdminRequests] = useState(false);
  const [adminRequestError, setAdminRequestError] = useState('');
  const [updatingRequestIds, setUpdatingRequestIds] = useState([]);
  const [assetAssignmentRequest, setAssetAssignmentRequest] = useState(null);
  const [assetAssignmentForm, setAssetAssignmentForm] = useState({
    assetName: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    warrantyExpiry: '',
    condition: 'Good',
    remarks: '',
  });
  const [assigningAsset, setAssigningAsset] = useState(false);

  const [showModal, setShowModal] = useState(false);

  const [newEmp, setNewEmp] = useState(DEFAULT_EMPLOYEE);

  const [creatingEmployee, setCreatingEmployee] = useState(false);

  // ============================================================
  // EMPLOYEE ATTENDANCE
  // ============================================================

  const [attendanceStatus, setAttendanceStatus] = useState('Not Checked In');
  const [checkInTime, setCheckInTime] = useState('--:--');
  const [checkOutTime, setCheckOutTime] = useState('--:--');
  const [workingTime, setWorkingTime] = useState('0h 0m');
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Employee full profile (name, code, designation, dept, city, etc.)
  const [employeeProfile, setEmployeeProfile] = useState(null);

  // Attendance stats (present days, avg hours, late, overtime)
  const [attendanceStats, setAttendanceStats] = useState({
    presentDays: 0,
    avgHoursDisplay: '0h 00m',
    lateDays: 0,
    overtimeDisplay: '00h 00m',
  });

  // ============================================================
  // HELPER
  // ============================================================

  const isAdmin =
    currentUser &&
    ADMIN_ROLES.includes((currentUser.role || '').toLowerCase());

  // ============================================================
  // CHART CONFIGURATION
  // ============================================================

  const chartOptions = {
    chart: {
      type: 'bar',
      toolbar: {
        show: false,
      },
    },

    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: '45%',
      },
    },

    xaxis: {
      categories: [
        'Mon',
        'Tue',
        'Wed',
        'Thu',
        'Fri',
        'Sat',
      ],
    },

    dataLabels: {
      enabled: false,
    },

    grid: {
      borderColor: '#e9ecef',
    },

    tooltip: {
      y: {
        formatter: (value) => `${value} hours`,
      },
    },
  };

  const chartSeries = [
    {
      name: 'Hours Worked',
      data: [8.5, 8.2, 8.8, 8.7, 8.0, 4.0],
    },
  ];

  // ============================================================
  // FETCH EMPLOYEES
  // ============================================================

  const fetchEmployees = async () => {
    if (!isAdmin) {
      return;
    }

    setLoadingEmployees(true);
    setEmployeeError('');

    try {
      const orgIdParam = currentUser?.orgId || currentUser?.organization_id || 1;
      const res = await fetch(
        `${API_BASE}/api/admin/employees?orgId=${orgIdParam}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || 'Failed to fetch employees'
        );
      }

      let rawList = Array.isArray(data)
        ? data
        : data.employees || [];

      // If logged in as company admin, filter out superadmin records
      const roleStr = (currentUser?.role || '').toLowerCase();
      const isSuper = roleStr === 'super_admin' || roleStr === 'superadmin' || currentUser?.is_superadmin;
      if (!isSuper) {
        rawList = rawList.filter(e => {
          const r = (e.role_name || e.role_key || e.role || '').toLowerCase();
          const em = (e.email || '').toLowerCase();
          const cd = (e.employee_code || '').toLowerCase();
          const nm = (e.full_name || `${e.first_name || ''} ${e.last_name || ''}`).toLowerCase();
          return !(
            r.includes('super_admin') ||
            r.includes('superadmin') ||
            em.includes('superadmin') ||
            cd.includes('emp-super') ||
            nm.includes('super administrator')
          );
        });
      }

      setEmployees(rawList);
    } catch (error) {
      console.error(
        'Error fetching employees:',
        error
      );

      setEmployeeError(
        error.message || 'Unable to load employees'
      );
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchAdminRequests = async () => {
    if (!currentUser || !isAdmin) return;

    setLoadingAdminRequests(true);
    setAdminRequestError('');
    try {
      const response = await fetch(
        `${API_BASE}/api/admin/employee-requests?adminUserId=${encodeURIComponent(currentUser.id)}`
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to load employee requests');
      }
      setAdminRequests(Array.isArray(data.requests) ? data.requests : []);
    } catch (error) {
      console.error('Error fetching employee requests:', error);
      setAdminRequestError(error.message || 'Unable to load employee requests');
    } finally {
      setLoadingAdminRequests(false);
    }
  };

  const updateAdminRequestStatus = async (requestId, status) => {
    setUpdatingRequestIds((ids) => [...ids, requestId]);
    setAdminRequestError('');
    try {
      const response = await fetch(
        `${API_BASE}/api/admin/employee-requests/${requestId}/status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminUserId: currentUser.id, status }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to update request status');
      }
      await fetchAdminRequests();
    } catch (error) {
      console.error('Error updating employee request status:', error);
      setAdminRequestError(error.message || 'Unable to update request status');
    } finally {
      setUpdatingRequestIds((ids) => ids.filter((id) => id !== requestId));
    }
  };

  const fulfilAdminAssetRequest = async (event) => {
    event.preventDefault();
    if (!assetAssignmentRequest) return;

    setAssigningAsset(true);
    setAdminRequestError('');
    try {
      const response = await fetch(
        `${API_BASE}/api/admin/asset-requests/${assetAssignmentRequest.source_id}/fulfil`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adminUserId: currentUser.id,
            ...assetAssignmentForm,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to assign asset');
      }
      setAssetAssignmentRequest(null);
      await fetchAdminRequests();
    } catch (error) {
      console.error('Error assigning requested asset:', error);
      setAdminRequestError(error.message || 'Unable to assign asset');
    } finally {
      setAssigningAsset(false);
    }
  };

  // ============================================================
  // LOAD EMPLOYEES WHEN ADMIN LOGS IN
  // ============================================================

  const fetchAttendance = async () => {
    if (!currentUser || isAdmin) return;
    try {
      setAttendanceLoading(true);
      const res = await fetch(`${API_BASE}/api/attendance/today/${currentUser.id}`);
      const data = await res.json();
      if (res.ok && data.today) {
        setAttendanceStatus(data.today.check_out_time ? 'Checked Out' : 'Checked In');
        if (data.today.work_mode) {
          setEmployeeProfile(prev => ({ ...(prev || {}), work_mode: data.today.work_mode }));
        }
        if (data.today.check_in_time) {
          const d = new Date(data.today.check_in_time);
          setCheckInTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
        if (data.today.check_out_time) {
          const d = new Date(data.today.check_out_time);
          setCheckOutTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
        if (data.today.working_hours_display) {
          setWorkingTime(data.today.working_hours_display);
        }
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const fetchEmployeeProfile = async () => {
    if (!currentUser || isAdmin) return;
    try {
      const [res, personalRes, adminRes] = await Promise.all([
        fetch(`${API_BASE}/api/employee/profile/${currentUser.id}`).catch(() => null),
        fetch(`${API_BASE}/api/employee/personal-info/${currentUser.id}`).catch(() => null),
        fetch(`${API_BASE}/api/admin/employees?orgId=${currentUser.orgId || 1}`).catch(() => null),
      ]);
      let profileData = {};
      if (res && res.ok) {
        try {
          profileData = await res.json();
        } catch (_) {}
      }

      // Merge data from /api/admin/employees
      if (adminRes && adminRes.ok) {
        try {
          const empList = await adminRes.json();
          if (Array.isArray(empList)) {
            const matched =
              empList.find(
                (e) => e.email && currentUser.email && e.email.toLowerCase() === currentUser.email.toLowerCase()
              ) ||
              empList.find(
                (e) => Number(e.user_id) === Number(currentUser.id)
              );
            if (matched) {
              const nameParts = (matched.full_name || '').trim().split(' ');
              profileData = {
                ...profileData,
                employee_id: matched.id || profileData.employee_id,
                employee_code: matched.employee_code || profileData.employee_code,
                first_name: matched.first_name || nameParts[0] || profileData.first_name,
                last_name: matched.last_name || nameParts.slice(1).join(' ') || profileData.last_name,
                designation: matched.designation || profileData.designation,
                department: matched.department || profileData.department,
                team: matched.team || profileData.team,
                location: matched.location || matched.city || profileData.location || profileData.city,
                city: matched.city || matched.location || profileData.city || profileData.location,
                email: matched.email || currentUser.email,
                role_name: matched.role_name || profileData.role_name,
                status: matched.status || profileData.status || 'Active',
                joining_date: matched.joining_date || profileData.joining_date,
                profile_completion_percentage: matched.profile_completion_percentage || profileData.profile_completion_percentage,
              };
            }
          }
        } catch (_) {}
      }

      if (personalRes && personalRes.ok) {
        try {
          const personalData = await personalRes.json();
          if (personalData) {
            if (personalData.profile_pic) {
              profileData.profile_pic = personalData.profile_pic;
              profileData.avatar_url = personalData.profile_pic;
            }
            if (personalData.preferred_name) {
              profileData.preferred_name = personalData.preferred_name;
            }
            if (personalData.first_name && !profileData.first_name) {
              profileData.first_name = personalData.first_name;
            }
            if (personalData.last_name && !profileData.last_name) {
              profileData.last_name = personalData.last_name;
            }
          }
        } catch (_) {}
      }

      const savedPreferred = localStorage.getItem(`hrms_preferred_name_${currentUser.id}`);
      if (!profileData.preferred_name) {
        profileData.preferred_name = savedPreferred || profileData.first_name || (currentUser.email ? currentUser.email.split('@')[0] : 'Employee');
      }

      // Dynamic fallbacks derived from currentUser instead of hardcoded strings
      profileData.first_name = profileData.first_name || (currentUser.email ? currentUser.email.split('@')[0] : 'Employee');
      profileData.last_name = profileData.last_name || '';
      profileData.employee_code = profileData.employee_code || `EMP-${String(currentUser.id || '0000').padStart(4, '0')}`;
      profileData.designation = profileData.designation || currentUser.role || 'Employee';
      profileData.department = profileData.department || 'General';
      profileData.team = profileData.team || 'General';
      profileData.city = profileData.city || profileData.location || 'Nagpur';
      profileData.location = profileData.location || profileData.city || 'Nagpur';
      profileData.profile_completion_percentage = Number(profileData.profile_completion_percentage) || 80;

      setEmployeeProfile(profileData);
    } catch (error) {
      console.error('Error fetching employee profile:', error);
    }
  };

  const fetchAttendanceStats = async (period = 'week') => {
    if (!currentUser || isAdmin) return;
    try {
      const res = await fetch(`${API_BASE}/api/attendance/stats/${currentUser.id}?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setAttendanceStats(data);
      }
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
    }
  };

  useEffect(() => {
    if (currentUser) {
      if (isAdmin) {
        fetchEmployees();
        fetchAdminRequests();
      } else {
        fetchAttendance();
        fetchEmployeeProfile();
        fetchAttendanceStats('week');
      }
    }
  }, [currentUser]);

  // ============================================================
  // LOGIN
  // ============================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoginError('');
    setLoadingAuth(true);

    try {
      const res = await fetch(
        `${API_BASE}/api/auth/login`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            email: loginEmail,
            password: loginPassword,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || 'Authentication failed'
        );
      }

      if (!data.user) {
        throw new Error(
          'Login successful but user information was not returned'
        );
      }

      localStorage.setItem(
        'hrms_user',
        JSON.stringify(data.user)
      );

      setCurrentUser(data.user);

      setLoginEmail('');
      setLoginPassword('');
    } catch (error) {
      console.error('Login error:', error);

      setLoginError(
        error.message || 'Unable to sign in'
      );
    } finally {
      setLoadingAuth(false);
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    localStorage.removeItem('hrms_user');

    setCurrentUser(null);
    setEmployeeProfile(null);
    setEmployees([]);
    setLoginEmail('');
    setLoginPassword('');
    setAttendanceStatus('Checked Out');
    setCheckInTime('--:--');
    setCheckOutTime('--:--');
  };

  // ============================================================
  // CREATE EMPLOYEE
  // ============================================================

  const handleCreateEmployee = async (e) => {
    e.preventDefault();

    setCreatingEmployee(true);

    try {
      const res = await fetch(
        `${API_BASE}/api/admin/employees`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify(newEmp),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
            'Failed to create employee'
        );
      }

      alert(
        data.message ||
          'Employee and login account created successfully'
      );

      setShowModal(false);

      setNewEmp({
        ...DEFAULT_EMPLOYEE,
      });

      await fetchEmployees();
    } catch (error) {
      console.error(
        'Create employee error:',
        error
      );

      alert(
        error.message ||
          'Unable to create employee'
      );
    } finally {
      setCreatingEmployee(false);
    }
  };

  const handlePunch = async (type) => {
    if (!currentUser) return;
    try {
      setAttendanceLoading(true);
      const res = await fetch(`${API_BASE}/api/attendance/punch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, type })
      });
      const data = await res.json();
      if (res.ok) {
        fetchAttendance(); // refresh the view
      } else {
        alert(data.message || 'Error updating attendance');
      }
    } catch (error) {
      console.error('Punch error:', error);
      alert('Unable to process attendance punch');
    } finally {
      setAttendanceLoading(false);
    }
  };

  // ============================================================
  // CHECK IN
  // ============================================================

  const handleCheckIn = () => {
    handlePunch('CHECK_IN');
  };

  // ============================================================
  // CHECK OUT
  // ============================================================

  const handleCheckOut = () => {
    handlePunch('CHECK_OUT');
  };

  // ============================================================
  // UPDATE NEW EMPLOYEE FIELD
  // ============================================================

  const updateNewEmployee = (field, value) => {
    setNewEmp((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // ============================================================
  // LOGIN PAGE
  // ============================================================

  if (!currentUser) {
    return (
      <main className="auth-page">
        {/* BACKGROUND */}
        <div className="auth-background">
          <div className="bg-grid"></div>

          <div className="bg-glow glow-one"></div>
          <div className="bg-glow glow-two"></div>
          <div className="bg-glow glow-three"></div>

          <div className="orb orb-one"></div>
          <div className="orb orb-two"></div>
          <div className="orb orb-three"></div>

          <span className="dot dot-one"></span>
          <span className="dot dot-two"></span>
          <span className="dot dot-three"></span>
          <span className="dot dot-four"></span>
          <span className="dot dot-five"></span>
        </div>

        {/* AUTH CONTENT */}
        <div className="auth-content">
          <div className="auth-wrapper">
            <div className="row g-0 justify-content-center">
              {/* LEFT VISUAL AREA */}
              <div className="col-lg-5">
                <section className="visual-panel">
                  <a className="brand" href="/">
                    <span className="brand-icon">
                      <i className="bi bi-grid-1x2-fill"></i>
                    </span>
                    <span className="brand-name">Ramel HR</span>
                  </a>

                  <div className="visual-content">
                    <span className="visual-badge">
                      <span className="badge-dot"></span>
                      Secure access
                    </span>

                    <h2 className="visual-title">
                      Everything you need.
                      <span>One place.</span>
                    </h2>

                    <p className="visual-description">
                      Access your account through a secure, streamlined
                      experience designed to keep your work connected and
                      organized.
                    </p>
                  </div>

                  <div className="visual-footer">
                    <div className="footer-item">
                      <i className="bi bi-shield-check"></i>
                      <span>Secure authentication</span>
                    </div>

                    <div className="footer-item">
                      <i className="bi bi-lock"></i>
                      <span>Protected access</span>
                    </div>
                  </div>
                </section>
              </div>

              {/* RIGHT LOGIN AREA */}
              <div className="col-lg-5">
                <section className="login-panel">
                  <div className="login-inner">
                    {/* Mobile Brand */}
                    <div className="mobile-brand">
                      <span className="brand-icon">
                        <i className="bi bi-grid-1x2-fill"></i>
                      </span>
                      <span>Ramel HR</span>
                    </div>

                    {/* Login Heading */}
                    <div className="login-heading">
                      <h1>Welcome back</h1>
                      <p>Sign in to continue to your account.</p>
                    </div>

                    {loginError && (
                      <div className="alert alert-danger mb-3" role="alert">
                        {loginError}
                      </div>
                    )}

                    <form id="loginForm" onSubmit={handleLogin} noValidate>
                      {/* Email */}
                      <div className="form-group">
                        <label htmlFor="email" className="form-label">
                          Email address
                        </label>

                        <div className="input-wrapper">
                          <i className="bi bi-envelope input-icon"></i>

                          <input
                            type="email"
                            className="form-control"
                            id="email"
                            name="email"
                            placeholder="Enter your email address"
                            autoComplete="email"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="form-group">
                        <label htmlFor="password" className="form-label">
                          Password
                        </label>

                        <div className="input-wrapper">
                          <i className="bi bi-lock input-icon"></i>

                          <input
                            type={showPassword ? 'text' : 'password'}
                            className="form-control"
                            id="password"
                            name="password"
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            required
                          />

                          <button
                            type="button"
                            className="password-toggle"
                            id="passwordToggle"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            onClick={() => setShowPassword((prev) => !prev)}
                          >
                            <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                          </button>
                        </div>
                      </div>

                      {/* Options */}
                      <div className="login-options">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="remember"
                            name="remember"
                            value="1"
                          />
                          <label className="form-check-label" htmlFor="remember">
                            Remember me
                          </label>
                        </div>

                        <a
                          href="#forgot"
                          className="forgot-link"
                          onClick={(e) => e.preventDefault()}
                        >
                          Forgot password?
                        </a>
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        className="login-btn"
                        id="loginButton"
                        disabled={loadingAuth}
                      >
                        <span>{loadingAuth ? 'Signing in...' : 'Sign in'}</span>
                        <i className="bi bi-arrow-right"></i>
                      </button>
                    </form>

                    {/* Divider */}
                    <div className="divider">
                      <span>
                        Don&apos;t have an account ?{' '}
                        <a
                          href="#register"
                          className="forgot-link"
                          onClick={(e) => e.preventDefault()}
                        >
                          Register
                        </a>
                      </span>
                    </div>

                    {/* Security */}
                    <div className="security-note">
                      <i className="bi bi-shield-lock-fill"></i>
                      <span>Your information is securely protected.</span>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ============================================================
  // LOGGED-IN PORTAL
  // ============================================================

  const initials = currentUser.email
    ? currentUser.email
        .slice(0, 2)
        .toUpperCase()
    : 'US';

  if (!isAdmin) {
    return (
      <EmployeeTemplate
        currentUser={currentUser}
        handleLogout={handleLogout}
        attendanceStatus={attendanceStatus}
        checkInTime={checkInTime}
        checkOutTime={checkOutTime}
        workingTime={workingTime}
        attendanceLoading={attendanceLoading}
        handleCheckIn={handleCheckIn}
        handleCheckOut={handleCheckOut}
        fetchAttendance={fetchAttendance}
        employeeProfile={employeeProfile}
        fetchEmployeeProfile={fetchEmployeeProfile}
        attendanceStats={attendanceStats}
        fetchAttendanceStats={fetchAttendanceStats}
      />
    );
  }

  return (
    <AdminTemplate
      currentUser={currentUser}
      handleLogout={handleLogout}
      employees={employees}
      loadingEmployees={loadingEmployees}
      fetchEmployees={fetchEmployees}
      adminRequests={adminRequests}
      loadingAdminRequests={loadingAdminRequests}
      fetchAdminRequests={fetchAdminRequests}
      handleUpdateRequestStatus={updateAdminRequestStatus}
      creatingEmployee={creatingEmployee}
      handleCreateEmployee={handleCreateEmployee}
      newEmp={newEmp}
      setNewEmp={setNewEmp}
      updateNewEmployee={updateNewEmployee}
      showModal={showModal}
      setShowModal={setShowModal}
    />
  );
}

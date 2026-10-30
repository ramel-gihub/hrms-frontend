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

const ADMIN_ROLES = ['admin', 'org_admin', 'super_admin'];

export default function App() {
  // ============================================================
  // AUTHENTICATION STATE
  // ============================================================

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      // Session-only persistence: clear when browser is closed
      const saved = sessionStorage.getItem('hrms_user');
      localStorage.removeItem('hrms_user');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Failed to read logged-in user:', error);
      return null;
    }
  });

  // Cross-tab logout listener
  useEffect(() => {
    const handleStorageSync = (e) => {
      if (e.key === 'hrms_logout_signal') {
        sessionStorage.removeItem('hrms_user');
        localStorage.removeItem('hrms_user');
        setCurrentUser(null);
        setPendingFirstTimeUser(null);
        setEmployeeProfile(null);
        setEmployees([]);
      }
    };
    window.addEventListener('storage', handleStorageSync);
    return () => window.removeEventListener('storage', handleStorageSync);
  }, []);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);

  // First-time login password change state
  const [pendingFirstTimeUser, setPendingFirstTimeUser] = useState(null);
  const [firstTimeNewPassword, setFirstTimeNewPassword] = useState('');
  const [firstTimeConfirmPassword, setFirstTimeConfirmPassword] = useState('');
  const [firstTimeShowPassword, setFirstTimeShowPassword] = useState(false);
  const [firstTimeError, setFirstTimeError] = useState('');
  const [firstTimeLoading, setFirstTimeLoading] = useState(false);

  // Forgot Password State
  const [isForgotPasswordActive, setIsForgotPasswordActive] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: identify, 2: answer question, 3: set new password
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotUser, setForgotUser] = useState(null);
  const [selectedForgotQuestion, setSelectedForgotQuestion] = useState('');
  const [forgotAnswer, setForgotAnswer] = useState('');
  const [forgotResetToken, setForgotResetToken] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotShowPassword, setForgotShowPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

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
  const [attendanceLocation, setAttendanceLocation] = useState('');
  const [attendanceArea, setAttendanceArea] = useState('');
  const [attendanceCity, setAttendanceCity] = useState('');
  const [attendanceState, setAttendanceState] = useState('');
  const [attendanceDevice, setAttendanceDevice] = useState(() => {
    try {
      const saved = localStorage.getItem('hrms_device_name');
      if (saved && saved.trim() && saved.trim() !== 'MSI Thin 15 (Dev)' && saved.trim() !== 'MSI Thin 15') {
        return saved.trim();
      }
      if (saved === 'MSI Thin 15 (Dev)' || saved === 'MSI Thin 15') {
        localStorage.removeItem('hrms_device_name');
      }
      const ua = typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '';
      if (/android/i.test(ua)) {
        const m = ua.match(/;\s*([^;]+?)\s+Build\//i);
        if (m && m[1] && !m[1].includes('Android')) return `${m[1].trim()} (Android)`;
        return /tablet/i.test(ua) ? 'Android Tablet' : 'Android Mobile';
      }
      if (/iphone/i.test(ua)) return 'Apple iPhone';
      if (/ipad/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'Apple iPad';
      if (/macintosh|mac os x/i.test(ua)) return 'MacBook';
      if (/windows nt 10/i.test(ua) || /windows/i.test(ua)) return 'Windows PC';
      if (/linux/i.test(ua)) return 'Linux PC';
    } catch (_) {}
    return 'Workstation PC';
  });
  const [closeAlert, setCloseAlert] = useState(null);
  const showCloseAlert = (title, message, type = 'warning') => setCloseAlert({ title, message, type });
  const [todayAttendance, setTodayAttendance] = useState(null);

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

  const updateAdminRequestStatus = async (requestId, status, adminRemarks = '') => {
    setUpdatingRequestIds((ids) => [...ids, requestId]);
    setAdminRequestError('');
    try {
      const response = await fetch(
        `${API_BASE}/api/admin/employee-requests/${requestId}/status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminUserId: currentUser.id, status, adminRemarks }),
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
        setTodayAttendance(data.today);
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
        } else {
          setCheckOutTime('--:--');
        }
        if (data.today.working_hours_display) {
          setWorkingTime(data.today.working_hours_display);
        }
        const loc = data.today.check_out_time
          ? (data.today.check_out_location || data.today.check_in_location)
          : data.today.check_in_location;
        const dev = data.today.check_out_time
          ? (data.today.check_out_device || data.today.check_in_device)
          : data.today.check_in_device;
        const area = data.today.check_out_time
          ? (data.today.check_out_area || data.today.check_in_area)
          : data.today.check_in_area;
        const city = data.today.check_out_time
          ? (data.today.check_out_city || data.today.check_in_city)
          : data.today.check_in_city;
        const state = data.today.check_out_time
          ? (data.today.check_out_state || data.today.check_in_state)
          : data.today.check_in_state;
        if (loc) setAttendanceLocation(loc);
        if (dev) {
          setAttendanceDevice(dev);
          localStorage.setItem('hrms_device_name', dev);
        }
        if (area) setAttendanceArea(area);
        if (city) setAttendanceCity(city);
        if (state) setAttendanceState(state);
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
      const [res, personalRes, contactRes, adminRes] = await Promise.all([
        fetch(`${API_BASE}/api/employee/profile/${currentUser.id}`).catch(() => null),
        fetch(`${API_BASE}/api/employee/personal-info/${currentUser.id}`).catch(() => null),
        fetch(`${API_BASE}/api/employee/contact-info/${currentUser.id}`).catch(() => null),
        fetch(`${API_BASE}/api/admin/employees?orgId=${currentUser.orgId || 1}`).catch(() => null),
      ]);
      let profileData = {};
      if (res && res.ok) {
        try {
          profileData = await res.json();
        } catch (_) {}
      }

      if (contactRes && contactRes.ok) {
        try {
          const contactData = await contactRes.json();
          if (contactData) {
            if (contactData.current_city) {
              profileData.city = contactData.current_city;
              profileData.current_city = contactData.current_city;
            }
            if (contactData.current_country) {
              profileData.current_country = contactData.current_country;
            }
            profileData.phone = contactData.phone_number || contactData.mobile || contactData.alternate_phone || profileData.phone;
            profileData.phone_number = contactData.phone_number || profileData.phone_number;
            const locParts = [contactData.current_city, contactData.current_country].filter(Boolean);
            if (locParts.length > 0) {
              profileData.location = locParts.join(', ');
            }
          }
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
            if (personalData.date_of_birth) {
              profileData.date_of_birth = personalData.date_of_birth;
              profileData.dob = personalData.date_of_birth;
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
      profileData.profile_completion_percentage = Number.isFinite(Number(profileData.profile_completion_percentage)) ? Math.min(100, Math.max(0, Number(profileData.profile_completion_percentage))) : 0;

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
    const handleDateInputClick = (event) => {
      const target = event.target;
      if (target && target.tagName === 'INPUT' && target.type === 'date') {
        try {
          if (typeof target.showPicker === 'function') {
            target.showPicker();
          }
        } catch (_) {}
      }
    };
    document.addEventListener('click', handleDateInputClick, true);
    return () => document.removeEventListener('click', handleDateInputClick, true);
  }, []);

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

      // Check if user is required to change password on first login
      if (data.requirePasswordChange) {
        setPendingFirstTimeUser(data.user);
        setLoginPassword('');
        setFirstTimeError('');
        setFirstTimeNewPassword('');
        setFirstTimeConfirmPassword('');
        return;
      }

      sessionStorage.setItem(
        'hrms_user',
        JSON.stringify(data.user)
      );
      localStorage.removeItem('hrms_user');

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
    sessionStorage.removeItem('hrms_user');
    localStorage.removeItem('hrms_user');
    try {
      localStorage.setItem('hrms_logout_signal', String(Date.now()));
    } catch (_) {}

    setCurrentUser(null);
    setPendingFirstTimeUser(null);
    setEmployeeProfile(null);
    setEmployees([]);
    setLoginEmail('');
    setLoginPassword('');
    setAttendanceStatus('Checked Out');
    setCheckInTime('--:--');
    setCheckOutTime('--:--');
  };

  const handleForgotIdentify = async (e) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotIdentifier.trim()) {
      setForgotError('Please enter your corporate email or employee ID.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password/get-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: forgotIdentifier.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Unable to find user account.');
      }
      setForgotUser({
        userId: data.userId,
        email: data.email,
        name: data.name,
        questions: data.questions
      });
      if (data.questions && data.questions.length > 0) {
        setSelectedForgotQuestion(data.questions[0]);
      }
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.message || 'Unable to retrieve security questions.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotVerifyAnswer = async (e) => {
    e.preventDefault();
    setForgotError('');
    if (!selectedForgotQuestion) {
      setForgotError('Please select a security question.');
      return;
    }
    if (!forgotAnswer.trim()) {
      setForgotError('Please enter your answer.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password/verify-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: forgotUser.userId,
          question: selectedForgotQuestion,
          answer: forgotAnswer.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Incorrect answer. Please try again.');
      }
      setForgotResetToken(data.token);
      setForgotStep(3);
    } catch (err) {
      setForgotError(err.message || 'Verification failed.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotResetPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!forgotNewPassword) {
      setForgotError('Please enter a new password.');
      return;
    }
    if (forgotNewPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: forgotUser.userId,
          token: forgotResetToken,
          newPassword: forgotNewPassword
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to reset password.');
      }
      setForgotSuccess('✓ Password reset successfully! Logging you in...');
      setTimeout(() => {
        sessionStorage.setItem('hrms_user', JSON.stringify(data.user));
        localStorage.removeItem('hrms_user');
        setCurrentUser(data.user);
        setIsForgotPasswordActive(false);
        setForgotStep(1);
        setForgotIdentifier('');
        setForgotUser(null);
        setForgotAnswer('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');
      }, 800);
    } catch (err) {
      setForgotError(err.message || 'Unable to reset password.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleFirstTimePasswordSubmit = async (e) => {
    e.preventDefault();
    setFirstTimeError('');

    if (!firstTimeNewPassword || firstTimeNewPassword.length < 6) {
      setFirstTimeError('New password must be at least 6 characters long.');
      return;
    }

    if (firstTimeNewPassword !== firstTimeConfirmPassword) {
      setFirstTimeError('New password and confirm password do not match.');
      return;
    }

    setFirstTimeLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/first-time-change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: pendingFirstTimeUser.id,
          newPassword: firstTimeNewPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update password');
      }

      const activeUser = data.user || pendingFirstTimeUser;
      activeUser.requirePasswordChange = false;

      sessionStorage.setItem('hrms_user', JSON.stringify(activeUser));
      localStorage.removeItem('hrms_user');
      setCurrentUser(activeUser);
      setPendingFirstTimeUser(null);
      setFirstTimeNewPassword('');
      setFirstTimeConfirmPassword('');
    } catch (err) {
      console.error('First time password change error:', err);
      setFirstTimeError(err.message || 'Unable to update password. Please try again.');
    } finally {
      setFirstTimeLoading(false);
    }
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

  const getDeviceName = async () => {
    try {
      const saved = localStorage.getItem('hrms_device_name');
      if (saved && saved.trim() && saved.trim() !== 'MSI Thin 15 (Dev)' && saved.trim() !== 'MSI Thin 15') {
        return saved.trim();
      }
      if (saved === 'MSI Thin 15 (Dev)' || saved === 'MSI Thin 15') {
        localStorage.removeItem('hrms_device_name');
      }

      if (navigator.userAgentData && typeof navigator.userAgentData.getHighEntropyValues === 'function') {
        const hints = await navigator.userAgentData.getHighEntropyValues(['model', 'platform', 'platformVersion']);
        if (hints.model && hints.model.trim()) {
          const plat = hints.platform ? ` (${hints.platform})` : '';
          const dev = `${hints.model.trim()}${plat}`;
          localStorage.setItem('hrms_device_name', dev);
          return dev;
        }
        if (hints.platform && /windows/i.test(hints.platform)) {
          const major = parseInt((hints.platformVersion || '').split('.')[0], 10);
          const dev = major >= 13 ? 'Windows 11 PC' : 'Windows 10 PC';
          localStorage.setItem('hrms_device_name', dev);
          return dev;
        }
        if (hints.platform) {
          const dev = `${hints.platform} PC`;
          localStorage.setItem('hrms_device_name', dev);
          return dev;
        }
      }
    } catch (_) {}

    const ua = typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '';
    let os = 'Workstation PC';
    if (/android/i.test(ua)) {
      const m = ua.match(/;\s*([^;]+?)\s+Build\//i);
      os = (m && m[1] && !m[1].includes('Android')) ? `${m[1].trim()} (Android)` : (/tablet/i.test(ua) ? 'Android Tablet' : 'Android Mobile');
    } else if (/iphone/i.test(ua)) {
      os = 'Apple iPhone';
    } else if (/ipad/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
      os = 'Apple iPad';
    } else if (/macintosh|mac os x/i.test(ua)) {
      os = 'MacBook';
    } else if (/windows nt 10/i.test(ua) || /windows/i.test(ua)) {
      os = 'Windows PC';
    } else if (/linux/i.test(ua)) {
      os = 'Linux PC';
    }

    try { localStorage.setItem('hrms_device_name', os); } catch (_) {}
    return os;
  };

  const detectDynamicLocation = async (forceLocation = false) => {
    let result = {
      location: employeeProfile?.city ? `${employeeProfile.city}, Maharashtra` : 'Nagpur, Maharashtra',
      area: employeeProfile?.city || 'Nagpur',
      city: employeeProfile?.city || 'Nagpur',
      state: employeeProfile?.state || 'Maharashtra',
      latitude: null,
      longitude: null
    };

    // 1. Mandatory / High-Accuracy Geolocation Check
    if (navigator.geolocation) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: forceLocation ? 10000 : 3500,
            enableHighAccuracy: true,
            maximumAge: forceLocation ? 0 : 60000
          });
        });

        const { latitude, longitude } = pos.coords;
        result.latitude = latitude;
        result.longitude = longitude;

        // Check if close to Chennai office (1.5 km of 13.07214, 80.22055)
        if (isOfficeLocation('', latitude, longitude)) {
          return {
            location: 'No:3, Sridharan St, Ayyavoo Colony, Aminjikarai, Chennai, Tamil Nadu 600030',
            area: 'Aminjikarai, Ayyavoo Colony',
            city: 'Chennai',
            state: 'Tamil Nadu',
            latitude,
            longitude
          };
        }

        let area = '';
        let city = '';
        let state = '';
        let locStr = '';

        // Try OpenStreetMap Nominatim for exact hyper-local neighborhood (e.g. Chandrakiran Nagar, Hudkeshwar)
        try {
          const osmRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (osmRes.ok) {
            const osmData = await osmRes.json();
            const addr = osmData.address || {};
            area = addr.suburb || addr.neighbourhood || addr.residential || addr.road || addr.village || addr.subdistrict || '';
            city = addr.city || addr.town || addr.municipality || addr.state_district || 'Nagpur';
            if (city.endsWith(' City')) city = city.replace(' City', '');
            state = addr.state || 'Maharashtra';
          }
        } catch (_) {}

        // Fallback to BigDataCloud reverse geocode if needed
        if (!area || !city) {
          try {
            const geoRes = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              if (!area) area = geoData.locality || geoData.principalSubdivisionCode || '';
              if (!city) city = geoData.city || geoData.locality || 'Nagpur';
              if (!state) state = geoData.principalSubdivision || 'Maharashtra';
            }
          } catch (_) {}
        }

        const parts = [area, city, state].filter((v, i, a) => v && a.indexOf(v) === i);
        locStr = parts.join(', ');

        return {
          location: locStr || (area ? `${area}, ${city}, ${state}` : `${city}, ${state}` || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`),
          area: area || city || 'Nagpur',
          city: city || 'Nagpur',
          state: state || 'Maharashtra',
          latitude,
          longitude
        };
            } catch (geoErr) {
        if (forceLocation) {
          if (geoErr && geoErr.code === 1) {
            showCloseAlert(
              "Location Access Required",
              "You must allow Location permission to Check In or Check Out.\n\nPlease click the lock / tune icon next to the URL in your browser's address bar, set Location to 'Allow', and click Check In / Check Out again.",
              "warning"
            );
          } else if (geoErr && geoErr.code === 2) {
            showCloseAlert(
              "Location Unavailable",
              "Unable to detect your device location.\n\nPlease make sure Location services and Wi-Fi are turned ON in Windows / device settings, then try again.",
              "warning"
            );
          } else if (geoErr && geoErr.code === 3) {
            showCloseAlert(
              "Location Timeout",
              "Location request timed out.\n\nPlease ensure your device has an active internet connection and location enabled, then try again.",
              "warning"
            );
          } else {
            showCloseAlert(
              "Location Required",
              "Location is mandatory to Check In / Check Out. Please enable location.",
              "warning"
            );
          }
          return null;
        }
      }
    } else if (forceLocation) {
      showCloseAlert(
        "Geolocation Not Supported",
        "Geolocation is not supported by your browser. Please use Chrome or Edge with location support.",
        "warning"
      );
      return null;
    }

    // 2. IP Geolocation fallback for initial background preview only
    try {
      const ipRes = await fetch('https://ipwho.is/');
      if (ipRes.ok) {
        const ipData = await ipRes.json();
        if (ipData && ipData.success !== false) {
          const city = ipData.city || 'Nagpur';
          const state = ipData.region || 'Maharashtra';
          const area = ipData.city || 'Nagpur';
          const locStr = [city, state].filter(Boolean).join(', ');
          return {
            location: locStr || (employeeProfile?.city || 'Nagpur, Maharashtra'),
            area: area,
            city: city,
            state: state,
            latitude: ipData.latitude || null,
            longitude: ipData.longitude || null
          };
        }
      }
    } catch (_) {}

    return result;
  };

  useEffect(() => {
    if (currentUser && !isAdmin && !attendanceLocation) {
      detectDynamicLocation().then((res) => {
        if (res.location) setAttendanceLocation(res.location);
        if (res.area) setAttendanceArea(res.area);
        if (res.city) setAttendanceCity(res.city);
        if (res.state) setAttendanceState(res.state);
      }).catch(() => {});
    }
  }, [currentUser, isAdmin]);

  const isOfficeLocation = (loc, lat, lon) => {
    const l = (loc || '').toLowerCase().trim();
    const keywords = ['aminjikarai', 'ayyavoo', 'sridharan', '600030', 'chennai'];
    if (keywords.some(k => l.includes(k))) return true;
    if (lat && lon && !isNaN(Number(lat)) && !isNaN(Number(lon))) {
      const R = 6371;
      const dLat = (13.07214 - Number(lat)) * Math.PI / 180;
      const dLon = (80.22055 - Number(lon)) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(Number(lat) * Math.PI / 180) * Math.cos(13.07214 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      if (dist <= 1.5) return true;
    }
    return false;
  };

  const handlePunch = async (type) => {
    if (!currentUser) return false;
    try {
      setAttendanceLoading(true);
      const device = await getDeviceName();
      const locObj = await detectDynamicLocation(true);
      if (!locObj) {
        setAttendanceLoading(false);
        return false;
      }
      const { location, area, city, state, latitude, longitude } = locObj;
      const isOffice = isOfficeLocation(location, latitude, longitude);
      const computedWorkMode = isOffice ? 'Office' : 'Remote';

      const res = await fetch(`${API_BASE}/api/attendance/punch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: currentUser.id, 
          type,
          location,
          device,
          area,
          city,
          state,
          latitude,
          longitude,
          workMode: computedWorkMode
        })
      });
      const data = await res.json();
      if (res.ok) {
        if (location) setAttendanceLocation(location);
        if (device) {
          setAttendanceDevice(device);
          localStorage.setItem('hrms_device_name', device);
        }
        if (area) setAttendanceArea(area);
        if (city) setAttendanceCity(city);
        if (state) setAttendanceState(state);
        if (data.record?.work_mode || data.workMode) {
          const wm = data.record?.work_mode || data.workMode;
          setEmployeeProfile(prev => ({ ...(prev || {}), work_mode: wm }));
        }
        await fetchAttendance(); // refresh the view
        return true;
      } else {
        showCloseAlert('Attendance Notice', data.message || 'Error updating attendance', 'error');
        return false;
      }
    } catch (error) {
      console.error('Punch error:', error);
      showCloseAlert('Attendance Notice', 'Unable to process attendance punch. Please check your network and try again.', 'error');
      return false;
    } finally {
      setAttendanceLoading(false);
    }
  };

  // ============================================================
  // CHECK IN
  // ============================================================

  const handleCheckIn = async () => {
    return await handlePunch('CHECK_IN');
  };

  // ============================================================
  // CHECK OUT
  // ============================================================

  const handleCheckOut = async () => {
    return await handlePunch('CHECK_OUT');
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

                    {isForgotPasswordActive ? (
                      /* Forgot Password Multi-Step Form */
                      <div>
                        {forgotStep === 1 && (
                          <div>
                            <div className="login-heading">
                              <h1 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Reset Password</h1>
                              <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                Enter your corporate email or employee ID to retrieve your security verification.
                              </p>
                            </div>

                            {forgotError && (
                              <div className="alert alert-danger mb-3" role="alert" style={{ borderRadius: 8, fontSize: '0.875rem' }}>
                                {forgotError}
                              </div>
                            )}

                            <form onSubmit={handleForgotIdentify} noValidate>
                              <div className="form-group mb-3">
                                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                  Corporate Email or Employee ID <span className="text-danger">*</span>
                                </label>
                                <div className="input-wrapper">
                                  <i className="bi bi-person-badge input-icon"></i>
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="e.g. dev@ramel.co.in or EMP-00101"
                                    value={forgotIdentifier}
                                    onChange={(e) => setForgotIdentifier(e.target.value)}
                                    required
                                    autoFocus
                                  />
                                </div>
                              </div>

                              <button
                                type="submit"
                                className="login-btn w-100 mb-2"
                                disabled={forgotLoading}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                              >
                                <span>{forgotLoading ? 'Verifying...' : 'Continue'}</span>
                                <i className="bi bi-arrow-right"></i>
                              </button>

                              <button
                                type="button"
                                className="btn btn-link w-100 text-center"
                                style={{ textDecoration: 'none', color: '#64748b', fontSize: '0.875rem' }}
                                onClick={() => {
                                  setIsForgotPasswordActive(false);
                                  setForgotError('');
                                }}
                              >
                                <i className="bi bi-arrow-left me-1"></i> Back to Sign In
                              </button>
                            </form>
                          </div>
                        )}

                        {forgotStep === 2 && (
                          <div>
                            <div className="login-heading">
                              <h1 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Security Question</h1>
                              <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                Please answer any 1 of your security questions to verify identity for <strong>{forgotUser?.name || forgotUser?.email}</strong>.
                              </p>
                            </div>

                            {forgotError && (
                              <div className="alert alert-danger mb-3" role="alert" style={{ borderRadius: 8, fontSize: '0.875rem' }}>
                                {forgotError}
                              </div>
                            )}

                            <form onSubmit={handleForgotVerifyAnswer} noValidate>
                              <div className="form-group mb-3">
                                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                  Choose a Security Question <span className="text-danger">*</span>
                                </label>
                                <select
                                  className="form-select"
                                  value={selectedForgotQuestion}
                                  onChange={(e) => {
                                    setSelectedForgotQuestion(e.target.value);
                                    setForgotError('');
                                  }}
                                  style={{ height: '48px', borderRadius: '10px', fontSize: '0.9rem' }}
                                  required
                                >
                                  {(forgotUser?.questions || []).map((q, idx) => (
                                    <option key={idx} value={q}>
                                      {idx + 1}. {q}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="form-group mb-3">
                                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                  Your Answer <span className="text-danger">*</span>
                                </label>
                                <div className="input-wrapper">
                                  <i className="bi bi-key input-icon"></i>
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter your answer"
                                    value={forgotAnswer}
                                    onChange={(e) => setForgotAnswer(e.target.value)}
                                    required
                                    autoFocus
                                  />
                                </div>
                              </div>

                              <button
                                type="submit"
                                className="login-btn w-100 mb-2"
                                disabled={forgotLoading}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                              >
                                <span>{forgotLoading ? 'Verifying Answer...' : 'Verify Answer'}</span>
                                <i className="bi bi-arrow-right"></i>
                              </button>

                              <button
                                type="button"
                                className="btn btn-link w-100 text-center"
                                style={{ textDecoration: 'none', color: '#64748b', fontSize: '0.875rem' }}
                                onClick={() => {
                                  setForgotStep(1);
                                  setForgotError('');
                                  setForgotAnswer('');
                                }}
                              >
                                <i className="bi bi-arrow-left me-1"></i> Back to Previous Step
                              </button>
                            </form>
                          </div>
                        )}

                        {forgotStep === 3 && (
                          <div>
                            <div className="login-heading">
                              <h1 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Set New Password</h1>
                              <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                Security verified! Create a new password and sign in directly.
                              </p>
                            </div>

                            {forgotSuccess && (
                              <div className="alert alert-success mb-3" role="alert" style={{ borderRadius: 8, fontSize: '0.875rem' }}>
                                {forgotSuccess}
                              </div>
                            )}
                            {forgotError && (
                              <div className="alert alert-danger mb-3" role="alert" style={{ borderRadius: 8, fontSize: '0.875rem' }}>
                                {forgotError}
                              </div>
                            )}

                            <form onSubmit={handleForgotResetPassword} noValidate>
                              <div className="form-group mb-3">
                                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                  New Password <span className="text-danger">*</span>
                                </label>
                                <div className="input-wrapper" style={{ position: 'relative' }}>
                                  <i className="bi bi-lock input-icon"></i>
                                  <input
                                    type={forgotShowPassword ? 'text' : 'password'}
                                    className="form-control"
                                    placeholder="Enter new password (min. 6 characters)"
                                    value={forgotNewPassword}
                                    onChange={(e) => setForgotNewPassword(e.target.value)}
                                    required
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setForgotShowPassword((prev) => !prev)}
                                    aria-label="Toggle password visibility"
                                  >
                                    <i className={`bi ${forgotShowPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                  </button>
                                </div>
                              </div>

                              <div className="form-group mb-3">
                                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                  Confirm New Password <span className="text-danger">*</span>
                                </label>
                                <div className="input-wrapper">
                                  <i className="bi bi-shield-check input-icon"></i>
                                  <input
                                    type={forgotShowPassword ? 'text' : 'password'}
                                    className="form-control"
                                    placeholder="Re-enter new password"
                                    value={forgotConfirmPassword}
                                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                                    required
                                  />
                                </div>
                              </div>

                              <button
                                type="submit"
                                className="login-btn w-100 mb-2"
                                disabled={forgotLoading}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                              >
                                <span>{forgotLoading ? 'Resetting & Logging in...' : 'Reset Password & Sign In'}</span>
                                <i className="bi bi-arrow-right"></i>
                              </button>

                              <button
                                type="button"
                                className="btn btn-link w-100 text-center"
                                style={{ textDecoration: 'none', color: '#64748b', fontSize: '0.875rem' }}
                                onClick={() => {
                                  setIsForgotPasswordActive(false);
                                  setForgotError('');
                                  setForgotSuccess('');
                                }}
                              >
                                <i className="bi bi-arrow-left me-1"></i> Back to Sign In
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    ) : pendingFirstTimeUser ? (
                      /* First Time Password Change Form */
                      <div>
                        <div className="login-heading">
                          <h1 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Set New Password</h1>
                          <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
                            First-time login required: please create a new password for <strong>{pendingFirstTimeUser.email}</strong>.
                          </p>
                        </div>

                        {firstTimeError && (
                          <div className="alert alert-danger mb-3" role="alert">
                            {firstTimeError}
                          </div>
                        )}

                        <form onSubmit={handleFirstTimePasswordSubmit} noValidate>
                          <div className="form-group mb-3">
                            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                              New Password
                            </label>
                            <div className="input-wrapper" style={{ position: 'relative' }}>
                              <i className="bi bi-lock input-icon"></i>
                              <input
                                type={firstTimeShowPassword ? 'text' : 'password'}
                                className="form-control"
                                placeholder="Enter new password (min. 6 characters)"
                                value={firstTimeNewPassword}
                                onChange={(e) => setFirstTimeNewPassword(e.target.value)}
                                required
                              />
                              <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setFirstTimeShowPassword((prev) => !prev)}
                                aria-label="Toggle password visibility"
                              >
                                <i className={`bi ${firstTimeShowPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                              </button>
                            </div>
                          </div>

                          <div className="form-group mb-3">
                            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                              Confirm New Password
                            </label>
                            <div className="input-wrapper">
                              <i className="bi bi-shield-check input-icon"></i>
                              <input
                                type={firstTimeShowPassword ? 'text' : 'password'}
                                className="form-control"
                                placeholder="Re-enter new password"
                                value={firstTimeConfirmPassword}
                                onChange={(e) => setFirstTimeConfirmPassword(e.target.value)}
                                required
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="login-btn w-100 mb-2"
                            disabled={firstTimeLoading}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                          >
                            <span>{firstTimeLoading ? 'Saving...' : 'Update Password & Continue'}</span>
                            <i className="bi bi-arrow-right"></i>
                          </button>

                          <button
                            type="button"
                            className="btn btn-link w-100 text-center"
                            style={{ textDecoration: 'none', color: '#64748b', fontSize: '0.875rem' }}
                            onClick={() => {
                              setPendingFirstTimeUser(null);
                              setFirstTimeError('');
                            }}
                          >
                            <i className="bi bi-arrow-left me-1"></i> Back to Sign In
                          </button>
                        </form>
                      </div>
                    ) : (
                      <>
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

                        <button
                          type="button"
                          className="btn btn-link forgot-link p-0"
                          style={{ textDecoration: 'none', border: 'none', background: 'none' }}
                          onClick={() => {
                            setIsForgotPasswordActive(true);
                            setForgotStep(1);
                            setForgotIdentifier(loginEmail || '');
                            setForgotError('');
                            setForgotSuccess('');
                            setForgotAnswer('');
                            setForgotNewPassword('');
                            setForgotConfirmPassword('');
                          }}
                        >
                          Forgot password?
                        </button>
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

                    {/* Divider & Register */}
                    {/* <div className="divider">
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
                    </div> */}

                    {/* Security */}
                    <div className="security-note">
                      <i className="bi bi-shield-lock-fill"></i>
                      <span>Your information is securely protected.</span>
                    </div>
                      </>
                    )}
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
      <>
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
        attendanceLocation={attendanceLocation}
        attendanceArea={attendanceArea}
        attendanceCity={attendanceCity}
        attendanceState={attendanceState}
        attendanceDevice={attendanceDevice}
        setAttendanceDevice={setAttendanceDevice}
        todayAttendance={todayAttendance}
      />

      {closeAlert && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '16px'
          }}
          onClick={() => setCloseAlert(null)}
        >
          <div 
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '28px 24px 24px 24px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              textAlign: 'center',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setCloseAlert(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
                fontSize: '16px',
                lineHeight: 1
              }}
            >
              ✕
            </button>

            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: closeAlert.type === 'error' ? '#fee2e2' : '#fef3c7',
              color: closeAlert.type === 'error' ? '#dc2626' : '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              fontSize: '28px'
            }}>
              {closeAlert.type === 'error' ? '⚠️' : '📍'}
            </div>

            <h3 style={{
              fontSize: '19px',
              fontWeight: '700',
              color: '#0f172a',
              marginBottom: '10px'
            }}>
              {closeAlert.title || 'Location Notice'}
            </h3>

            <p style={{
              fontSize: '14px',
              color: '#475569',
              lineHeight: 1.6,
              whiteSpace: 'pre-line',
              marginBottom: '24px'
            }}>
              {closeAlert.message}
            </p>

            <button
              type="button"
              onClick={() => setCloseAlert(null)}
              style={{
                width: '100%',
                padding: '12px 20px',
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                fontWeight: '600',
                fontSize: '14px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
      </>
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

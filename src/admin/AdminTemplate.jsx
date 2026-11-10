import React, { useState, useEffect } from 'react';
import './tailadmin.css';
import './admin-theme.css';
import AddEmployeeModal from './components/AddEmployeeModal';
import HRAssistant from '../components/HRAssistant';

// Pages
import Dashboard from './pages/Dashboard';
import LeaveApprovals from './pages/LeaveApprovals';
import EmployeeRequestApprovals from './pages/EmployeeRequestApprovals';
import Employees from './pages/Employees';
import ProjectTeams from './pages/ProjectTeams';
import Tenants from './pages/Tenants';
import LeaveBalanceMapping from './pages/LeaveBalanceMapping';
import HolidaysManagement from './pages/HolidaysManagement';
import AdminLeaves from './pages/AdminLeaves';
import AdminWFH from './pages/AdminWFH';
import DataReset from './pages/DataReset';
import Announcements from '../pages/Announcements';
import Analytics from './pages/Analytics';
import PayrollManagement from './pages/PayrollManagement';

export default function AdminTemplate({
  currentUser,
  handleLogout,
  employees = [],
  loadingEmployees = false,
  fetchEmployees,
  adminRequests = [],
  loadingAdminRequests = false,
  fetchAdminRequests,
  handleUpdateRequestStatus,
  creatingEmployee = false,
  handleCreateEmployee,
  newEmp = {},
  setNewEmp,
  updateNewEmployee,
  showModal = false,
  setShowModal
}) {
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get('tab');
      if (urlTab) return urlTab;
      return localStorage.getItem('admin_active_tab') || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });

  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    try {
      if (activeTab) localStorage.setItem('admin_active_tab', activeTab);
    } catch (e) {}
  }, [activeTab]);

  const isSuperAdmin = (currentUser?.role || '').toLowerCase() === 'super_admin' || 
                       (currentUser?.role || '').toLowerCase() === 'superadmin' || 
                       currentUser?.is_superadmin === true;

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loadingLeaveRequests, setLoadingLeaveRequests] = useState(false);
  const [unmappedCount, setUnmappedCount] = useState(0);
  const [tenants, setTenants] = useState([]);
  const [currentTenantId, setCurrentTenantId] = useState(currentUser?.tenant?.id || currentUser?.organization_id || 1);
  const [loadingTenants, setLoadingTenants] = useState(false);

  const API_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5002' : (import.meta.env.VITE_API_URL || 'https://hrms-backend-fzef.onrender.com'));

  const fetchLeaveRequests = async () => {
    if (!currentUser?.id) return;
    setLoadingLeaveRequests(true);
    try {
      const res = await fetch(API_URL + '/api/admin/leave-requests?adminUserId=' + currentUser.id + '&orgId=' + currentTenantId);
      const data = await res.json();
      if (data && Array.isArray(data.requests)) {
        setLeaveRequests(data.requests);
      }
    } catch (err) {
      console.error('Error fetching admin leave requests:', err);
    } finally {
      setLoadingLeaveRequests(false);
    }
  };

  const fetchUnmappedCount = async () => {
    try {
      const res = await fetch(API_URL + '/api/admin/unmapped-leave-balances?orgId=' + currentTenantId);
      const data = await res.json();
      if (data && Array.isArray(data.unmappedEmployees)) {
        const filtered = data.unmappedEmployees.filter(e => {
          const role = (e.role_name || e.roleKey || e.role || '').toLowerCase();
          const email = (e.email || '').toLowerCase();
          const code = (e.employee_code || '').toLowerCase();
          const name = (e.first_name || '') + ' ' + (e.last_name || '') + ' ' + (e.employee_name || '');
          const lowerName = name.toLowerCase();
          return !(
            role.includes('super_admin') || 
            role.includes('superadmin') || 
            email.includes('superadmin') || 
            code.includes('emp-super') || 
            lowerName.includes('super administrator')
          );
        });
        setUnmappedCount(filtered.length);
      }
    } catch (err) {
      console.error('Error fetching unmapped count:', err);
    }
  };

  const fetchTenants = async () => {
    if (!isSuperAdmin) return;
    setLoadingTenants(true);
    try {
      const res = await fetch(API_URL + '/api/admin/tenants');
      const data = await res.json();
      if (data && Array.isArray(data.tenants)) {
        setTenants(data.tenants);
      }
    } catch (err) {
      console.error('Error fetching tenants:', err);
    } finally {
      setLoadingTenants(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
    fetchUnmappedCount();
    if (isSuperAdmin) {
      fetchTenants();
    }
  }, [currentUser, currentTenantId, isSuperAdmin]);

  const handleUpdateLeaveStatus = async (leaveId, status, adminRemarks = '') => {
    const res = await fetch(API_URL + '/api/admin/leave-requests/' + leaveId + '/status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        adminRemarks,
        adminUserId: currentUser?.id
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update leave status');
    }
    await fetchLeaveRequests();
    if (fetchAdminRequests) fetchAdminRequests();
  };

  const currentTenant = tenants.find(t => t.id === currentTenantId) || {
    id: currentTenantId,
    company_name: currentUser?.tenant?.name || currentUser?.company_name || 'Ramel Techno Solutions',
    subdomain: 'ramel'
  };

  const pendingLeavesCount = leaveRequests.filter(r => (r.status || '').toLowerCase() === 'pending').length;
  const pendingRequestsCount = adminRequests.filter(r => (r.status || '').toLowerCase() === 'pending').length;

  const navigateTo = (tabId) => {
    setActiveTab(tabId);
    setMenuOpen(false);
  };

  return (
    <div className="admin-app-root">
      {/* OFFCANVAS ADMIN NAVIGATION MENU (luxury-frangollo style) */}
      <div 
        className={"offcanvas offcanvas-start custom-offcanvas " + (menuOpen ? "show" : "")} 
        tabIndex="-1" 
        style={{ visibility: menuOpen ? "visible" : "hidden", zIndex: 1055 }}
      >
        <div className="offcanvas-header">
          <div className="menu-brand">
            <div className="menu-brand-icon">
              <i className="bi bi-grid-1x2-fill"></i>
            </div>
            <div>
              <h5>Ramel | HR</h5>
              <span>Enterprise Admin</span>
            </div>
          </div>
          <button type="button" className="btn-close" onClick={() => setMenuOpen(false)} aria-label="Close"></button>
        </div>
        <div className="offcanvas-body p-0">
          <div className="menu-nav">
            <span className="menu-label">OVERVIEW</span>
            <a 
              className={"menu-item " + (activeTab === "dashboard" ? "active" : "")}
              href="#dashboard"
              onClick={(e) => { e.preventDefault(); navigateTo("dashboard"); }}
            >
              <i className="bi bi-grid-1x2"></i>
              <span>Admin Dashboard</span>
            </a>

            <span className="menu-label">WORKFORCE MANAGEMENT</span>
            <a 
              className={"menu-item " + (activeTab === "employees" ? "active" : "")}
              href="#employees"
              onClick={(e) => { e.preventDefault(); navigateTo("employees"); }}
            >
              <i className="bi bi-people"></i>
              <span>Employee Directory</span>
            </a>
            <a 
              className={"menu-item " + (activeTab === "project-teams" ? "active" : "")}
              href="#project-teams"
              onClick={(e) => { e.preventDefault(); navigateTo("project-teams"); }}
            >
              <i className="bi bi-diagram-3"></i>
              <span>Departments & Roles</span>
            </a>
            <a 
              className={"menu-item " + (activeTab === "requests" ? "active" : "")}
              href="#requests"
              onClick={(e) => { e.preventDefault(); navigateTo("requests"); }}
            >
              <i className="bi bi-check2-square"></i>
              <span>Request Approvals</span>
              {pendingRequestsCount > 0 && (
                <span className="badge bg-warning text-dark ms-auto">{pendingRequestsCount}</span>
              )}
            </a>

            <span className="menu-label">TIME & ATTENDANCE</span>
            <a 
              className={"menu-item " + (activeTab === "admin-leaves" ? "active" : "")}
              href="#admin-leaves"
              onClick={(e) => { e.preventDefault(); navigateTo("admin-leaves"); }}
            >
              <i className="bi bi-clock-history"></i>
              <span>Attendance Tracking</span>
            </a>
            <a 
              className={"menu-item " + (activeTab === "admin-wfh" ? "active" : "")}
              href="#admin-wfh"
              onClick={(e) => { e.preventDefault(); navigateTo("admin-wfh"); }}
            >
              <i className="bi bi-laptop"></i>
              <span>Manage Leaves & WFH</span>
            </a>
            <a 
              className={"menu-item " + (activeTab === "leave-approvals" ? "active" : "")}
              href="#leave-approvals"
              onClick={(e) => { e.preventDefault(); navigateTo("leave-approvals"); }}
            >
              <i className="bi bi-calendar2-check"></i>
              <span>Leave Management</span>
              {pendingLeavesCount > 0 && (
                <span className="badge bg-danger ms-auto">{pendingLeavesCount}</span>
              )}
            </a>
            <a 
              className={"menu-item " + (activeTab === "leave-balance-mapping" ? "active" : "")}
              href="#leave-balance-mapping"
              onClick={(e) => { e.preventDefault(); navigateTo("leave-balance-mapping"); }}
            >
              <i className="bi bi-layers"></i>
              <span>Leave Types & Quotas</span>
              {unmappedCount > 0 && (
                <span className="badge bg-danger ms-auto">{unmappedCount}</span>
              )}
            </a>

            <span className="menu-label">PAYROLL & FINANCIALS</span>
            <a 
              className={"menu-item " + (activeTab === "payroll" ? "active" : "")}
              href="#payroll"
              onClick={(e) => { e.preventDefault(); navigateTo("payroll"); }}
            >
              <i className="bi bi-wallet2"></i>
              <span>Payroll & CTC Packages</span>
            </a>

            <span className="menu-label">COMMUNICATION & SCHEDULE</span>
            <a 
              className={"menu-item " + (activeTab === "calendar" ? "active" : "")}
              href="#calendar"
              onClick={(e) => { e.preventDefault(); navigateTo("calendar"); }}
            >
              <i className="bi bi-calendar3"></i>
              <span>Company Calendar</span>
            </a>
            <a 
              className={"menu-item " + (activeTab === "holidays" ? "active" : "")}
              href="#holidays"
              onClick={(e) => { e.preventDefault(); navigateTo("holidays"); }}
            >
              <i className="bi bi-calendar-event"></i>
              <span>Public Holidays</span>
            </a>
            <a 
              className={"menu-item " + (activeTab === "announcements" ? "active" : "")}
              href="#announcements"
              onClick={(e) => { e.preventDefault(); navigateTo("announcements"); }}
            >
              <i className="bi bi-megaphone"></i>
              <span>Broadcast Announcements</span>
            </a>

            <span className="menu-label">SYSTEM & CONFIG</span>
            <a 
              className={"menu-item " + (activeTab === "analytics" ? "active" : "")}
              href="#analytics"
              onClick={(e) => { e.preventDefault(); navigateTo("analytics"); }}
            >
              <i className="bi bi-bar-chart-line"></i>
              <span>Reports & Analytics</span>
            </a>
            {isSuperAdmin && (
              <a 
                className={"menu-item " + (activeTab === "tenants" ? "active" : "")}
                href="#tenants"
                onClick={(e) => { e.preventDefault(); navigateTo("tenants"); }}
              >
                <i className="bi bi-building"></i>
                <span>Tenant Organizations</span>
              </a>
            )}
            <a 
              className={"menu-item " + (activeTab === "data-reset" ? "active" : "")}
              href="#data-reset"
              onClick={(e) => { e.preventDefault(); navigateTo("data-reset"); }}
            >
              <i className="bi bi-arrow-counterclockwise"></i>
              <span>Data Reset & Cleanup</span>
            </a>

            <span className="menu-label">ACCOUNT</span>
            <a 
              className="menu-item text-danger"
              href="#logout"
              onClick={(e) => { e.preventDefault(); handleLogout(); }}
            >
              <i className="bi bi-box-arrow-left"></i>
              <span>Logout</span>
            </a>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div 
          className="offcanvas-backdrop fade show" 
          onClick={() => setMenuOpen(false)}
          style={{ zIndex: 1050 }}
        ></div>
      )}

      {/* Netlify Template Wrapper */}
      <main className="dashboard-wrapper">
        <div className="dashboard-container">
          {/* Top Header */}
          <header className="top-header mb-4">
            <div className="d-flex align-items-center justify-content-between">
              <a 
                className="brand-logo d-flex align-items-center" 
                href="#dashboard"
                onClick={(e) => { e.preventDefault(); navigateTo("dashboard"); }}
                style={{ cursor: "pointer" }}
              >
                <img 
                  src="/images/logo/official_ramel_logo.png" 
                  alt="Ramel Employee Management System" 
                  style={{ height: "38px", objectFit: "contain" }} 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/images/logo/logo.png";
                  }}
                />
              </a>

              <div className="d-flex align-items-center gap-3 header-actions">
                <button 
                  className="header-action" 
                  title="Search"
                  type="button"
                >
                  <i className="bi bi-search"></i>
                </button>

                <button 
                  className="header-action position-relative" 
                  title="Notifications"
                  type="button"
                  onClick={() => navigateTo("requests")}
                >
                  <i className="bi bi-bell"></i>
                  {(pendingLeavesCount + pendingRequestsCount) > 0 && (
                    <span className="notification-dot"></span>
                  )}
                </button>

                <div className="dropdown">
                  <button 
                    className="profile-button d-flex align-items-center gap-2" 
                    type="button"
                    onClick={handleLogout}
                    title="Click to logout"
                  >
                    <div className="profile-avatar">
                      {(currentUser?.name || currentUser?.email || 'AD').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="profile-info text-start d-none d-sm-block">
                      <h6>{currentUser?.name || 'Admin User'}</h6>
                      <span className="text-nowrap">{currentUser?.role || 'Super Administrator'}</span>
                    </div>
                    <i className="bi bi-box-arrow-right ms-1 text-muted"></i>
                  </button>
                </div>

                <button 
                  className="header-action" 
                  type="button"
                  onClick={() => setMenuOpen(true)}
                  aria-label="Open Navigation"
                >
                  <i className="bi bi-list fs-5"></i>
                </button>
              </div>
            </div>
          </header>

          {/* Superadmin Context Bar */}
          {isSuperAdmin && (
            <div className="p-3 mb-4 rounded-4 bg-white border border-secondary border-opacity-10 shadow-sm d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-success-subtle text-success rounded-pill px-2.5 py-1 font-monospace">
                  <i className="bi bi-building me-1"></i> Tenant #{currentTenantId}
                </span>
                <strong className="text-dark">{currentTenant.company_name}</strong>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted small">Switch Tenant:</span>
                <select
                  value={currentTenantId}
                  onChange={(e) => setCurrentTenantId(parseInt(e.target.value, 10))}
                  className="form-select form-select-sm"
                  style={{ minWidth: '180px' }}
                >
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.company_name} ({t.subdomain})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => navigateTo("tenants")}
                  className="btn btn-sm btn-outline-primary"
                >
                  Manage Tenants
                </button>
              </div>
            </div>
          )}

          {/* Render Active View */}
          <div className="employee-dashboard px-0">
            {activeTab === 'dashboard' && (
              <Dashboard
                employees={employees}
                adminRequests={adminRequests}
                leaveRequests={leaveRequests}
                tenants={tenants}
                onNavigate={navigateTo}
                onOpenAddModal={() => setShowModal(true)}
                isSuperAdmin={isSuperAdmin}
                currentTenant={currentTenant}
              />
            )}

            {activeTab === 'admin-leaves' && (
              <AdminLeaves
                currentUser={currentUser}
                currentTenantId={currentTenantId}
                employees={employees}
                fetchEmployees={fetchEmployees}
              />
            )}

            {activeTab === 'admin-wfh' && (
              <AdminWFH
                currentUser={currentUser}
                currentTenantId={currentTenantId}
                employees={employees}
                fetchEmployees={fetchEmployees}
              />
            )}

            {activeTab === 'data-reset' && (
              <DataReset
                currentUser={currentUser}
                currentTenantId={currentTenantId}
                employees={employees}
                fetchEmployees={fetchEmployees}
                onNavigate={navigateTo}
              />
            )}

            {activeTab === 'leave-approvals' && (
              <LeaveApprovals
                leaveRequests={leaveRequests}
                loading={loadingLeaveRequests}
                onUpdateStatus={handleUpdateLeaveStatus}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'requests' && (
              <EmployeeRequestApprovals
                adminRequests={adminRequests}
                loading={loadingAdminRequests}
                onUpdateStatus={handleUpdateRequestStatus}
              />
            )}

            {activeTab === 'project-teams' && (
              <ProjectTeams
                currentTenantId={currentTenantId}
                currentUser={currentUser}
                employees={employees}
              />
            )}

            {activeTab === 'employees' && (
              <Employees
                employees={employees}
                loading={loadingEmployees}
                onOpenAddModal={() => setShowModal(true)}
                fetchEmployees={fetchEmployees}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'leave-balance-mapping' && (
              <LeaveBalanceMapping
                currentTenantId={currentTenantId}
                currentUser={currentUser}
                onBalancesMapped={() => {
                  fetchUnmappedCount();
                  fetchLeaveRequests();
                }}
              />
            )}

            {activeTab === 'holidays' && (
              <HolidaysManagement
                currentTenantId={currentTenantId}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'announcements' && (
              <Announcements
                currentUser={currentUser}
              />
            )}

            {activeTab === 'calendar' && (
              <div className="admin-card p-4">
                <h4 className="admin-card-title mb-3">
                  <i className="bi bi-calendar3 text-primary me-2"></i> Company Calendar
                </h4>
                <HolidaysManagement
                  currentTenantId={currentTenantId}
                  currentUser={currentUser}
                />
              </div>
            )}

            {activeTab === 'analytics' && (
              <Analytics
                employees={employees}
                leaveRequests={leaveRequests}
                adminRequests={adminRequests}
                currentTenant={currentTenant}
              />
            )}

            {activeTab === 'payroll' && (
              <PayrollManagement
                employees={employees}
                currentTenant={currentTenant}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'tenants' && isSuperAdmin && (
              <Tenants
                tenants={tenants}
                loading={loadingTenants}
                onCreateTenant={fetchTenants}
                onUpdateTenant={fetchTenants}
                onToggleStatus={fetchTenants}
                onDeleteTenant={fetchTenants}
              />
            )}
          </div>
        </div>
      </main>

      {showModal && (
        <AddEmployeeModal
          showModal={showModal}
          setShowModal={setShowModal}
          creatingEmployee={creatingEmployee}
          handleCreateEmployee={handleCreateEmployee}
          newEmp={newEmp}
          setNewEmp={setNewEmp}
          updateNewEmployee={updateNewEmployee}
          currentTenant={currentTenant}
        />
      )}

      <HRAssistant currentUser={currentUser} />
    </div>
  );
}

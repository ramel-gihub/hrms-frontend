import React, { useState, useEffect } from 'react';
import './styles/hrms-admin.css';
import HrmsAdminHeader from './components/HrmsAdminHeader';
import HrmsAdminSidebar from './components/HrmsAdminSidebar';
import HrmsDashboard from './pages/HrmsDashboard';

// Import all existing feature modules
import Employees from '../admin/pages/Employees';
import AdminLeaves from '../admin/pages/AdminLeaves';
import AdminWFH from '../admin/pages/AdminWFH';
import LeaveApprovals from '../admin/pages/LeaveApprovals';
import EmployeeRequestApprovals from '../admin/pages/EmployeeRequestApprovals';
import LeaveBalanceMapping from '../admin/pages/LeaveBalanceMapping';
import HolidaysManagement from '../admin/pages/HolidaysManagement';
import PayrollManagement from '../admin/pages/PayrollManagement';
import ProjectTeams from '../admin/pages/ProjectTeams';
import Tenants from '../admin/pages/Tenants';
import Analytics from '../admin/pages/Analytics';
import DataReset from '../admin/pages/DataReset';
import Calendar from '../pages/Calendar';
import Announcements from '../pages/Announcements';
import Settings from '../pages/Settings';
import EmployeeProfile from '../pages/EmployeeProfile';

export default function HrmsAdminTemplate({
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
  setShowModal,
  onSwitchToClassic
}) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [unmappedCount, setUnmappedCount] = useState(0);

  const isSuperAdmin = (currentUser?.role || '').toLowerCase() === 'super_admin' || currentUser?.email === 'admin@ramel.co.in';
  const API_URL = import.meta.env.VITE_API_URL || 'https://hrms-backend-5xo8.onrender.com';

  // Fetch pending leaves count
  useEffect(() => {
    fetch(`${API_URL}/api/admin/leaves?status=pending`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLeaveRequests(data);
        else if (data && Array.isArray(data.leaves)) setLeaveRequests(data.leaves);
      })
      .catch(() => {});

    // Fetch tenants if superadmin
    if (isSuperAdmin) {
      fetch(`${API_URL}/api/admin/tenants`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setTenants(data);
          else if (data?.tenants) setTenants(data.tenants);
        })
        .catch(() => {});
    }

    // Fetch unmapped leave count
    fetch(`${API_URL}/api/admin/leave-balance-mapping/unmapped-count`)
      .then(res => res.json())
      .then(data => {
        if (typeof data.unmapped_count === 'number') {
          setUnmappedCount(data.unmapped_count);
        }
      })
      .catch(() => {});
  }, [API_URL, isSuperAdmin]);

  const pendingLeavesCount = leaveRequests.filter(r => (r.status || '').toLowerCase() === 'pending').length;
  const pendingRequestsCount = adminRequests.filter(r => (r.status || '').toLowerCase() === 'pending').length;

  return (
    <div className="dashboard-wrapper bg-light min-vh-100" style={{ backgroundColor: 'var(--body-bg, #f6f7fb)' }}>
      {/* Offcanvas Drawer Sidebar */}
      <HrmsAdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSuperAdmin={isSuperAdmin}
        pendingLeavesCount={pendingLeavesCount}
        pendingRequestsCount={pendingRequestsCount}
        unmappedCount={unmappedCount}
        currentUser={currentUser}
        handleLogout={handleLogout}
      />

      <div className="dashboard-container" style={{ maxWidth: '1600px', margin: '0 auto', padding: '15px' }}>
        {/* Top Header */}
        <HrmsAdminHeader
          currentUser={currentUser}
          handleLogout={handleLogout}
          onOpenAddModal={() => setShowModal && setShowModal(true)}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingCount={pendingLeavesCount + pendingRequestsCount}
          onSwitchToClassic={onSwitchToClassic}
        />

        {/* Dynamic Content Views */}
        <main className="main-content">
          {activeTab === 'dashboard' && (
            <HrmsDashboard
              employees={employees}
              adminRequests={adminRequests}
              leaveRequests={leaveRequests}
              tenants={tenants}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenAddModal={() => setShowModal && setShowModal(true)}
              isSuperAdmin={isSuperAdmin}
              currentTenant={currentUser?.tenant}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'employees' && (
            <div className="bg-white p-4 rounded-4 border shadow-sm">
              <Employees
                employees={employees}
                loading={loadingEmployees}
                onRefresh={fetchEmployees}
                onOpenAddModal={() => setShowModal && setShowModal(true)}
              />
            </div>
          )}

          {activeTab === 'admin-leaves' && (
            <div className="bg-white p-4 rounded-4 border shadow-sm">
              <AdminLeaves currentUser={currentUser} />
            </div>
          )}

          {activeTab === 'admin-wfh' && (
            <div className="bg-white p-4 rounded-4 border shadow-sm">
              <AdminWFH currentUser={currentUser} />
            </div>
          )}

          {activeTab === 'leave-approvals' && (
            <div className="bg-white p-4 rounded-4 border shadow-sm">
              <LeaveApprovals
                leaveRequests={leaveRequests}
                onRefresh={() => {
                  fetch(`${API_URL}/api/admin/leaves?status=pending`)
                    .then(res => res.json())
                    .then(data => Array.isArray(data) ? setLeaveRequests(data) : setLeaveRequests(data.leaves || []));
                }}
              />
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="bg-white p-4 rounded-4 border shadow-sm">
              <EmployeeRequestApprovals
                adminRequests={adminRequests}
                loading={loadingAdminRequests}
                onUpdateStatus={handleUpdateRequestStatus}
                onRefresh={fetchAdminRequests}
              />
            </div>
          )}

          {activeTab === 'project-teams' && (
            <div className="bg-white p-4 rounded-4 border shadow-sm">
              <ProjectTeams currentUser={currentUser} employees={employees} />
            </div>
          )}

          {activeTab === 'leave-balance-mapping' && (
            <div className="bg-white p-4 rounded-4 border shadow-sm">
              <LeaveBalanceMapping />
            </div>
          )}

          {activeTab === 'holidays' && (
            <div className="bg-white p-4 rounded-4 border shadow-sm">
              <HolidaysManagement currentUser={currentUser} />
            </div>
          )}

          {activeTab === 'payroll' && (
            <div className="bg-white p-4 rounded-4 border shadow-sm">
              <PayrollManagement employees={employees} />
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="bg-white p-4 rounded-4 border shadow-sm">
              <Announcements currentUser={currentUser} />
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="bg-white p-4 rounded-4 border shadow-sm">
              <Calendar currentUser={currentUser} />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="bg-white p-4 rounded-4 border shadow-sm">
              <Analytics />
            </div>
          )}

          {activeTab === 'tenants' && isSuperAdmin && (
            <div className="bg-white p-4 rounded-4 border shadow-sm">
              <Tenants
                tenants={tenants}
                onRefresh={() => {
                  fetch(`${API_URL}/api/admin/tenants`)
                    .then(res => res.json())
                    .then(data => Array.isArray(data) ? setTenants(data) : setTenants(data.tenants || []));
                }}
              />
            </div>
          )}

          {activeTab === 'data-reset' && (
            <div className="bg-white p-4 rounded-4 border shadow-sm">
              <DataReset currentUser={currentUser} />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white p-4 rounded-4 border shadow-sm">
              <Settings currentUser={currentUser} />
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white p-4 rounded-4 border shadow-sm">
              <EmployeeProfile currentUser={currentUser} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

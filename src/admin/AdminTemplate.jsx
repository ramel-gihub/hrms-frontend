import React, { useState, useEffect } from 'react';
import './tailadmin.css';
import AdminSidebar from './components/AdminSidebar';
import AdminHeader from './components/AdminHeader';
import AddEmployeeModal from './components/AddEmployeeModal';

// Pages
import Dashboard from './pages/Dashboard';
import LeaveApprovals from './pages/LeaveApprovals';
import EmployeeRequestApprovals from './pages/EmployeeRequestApprovals';
import Employees from './pages/Employees';
import Tenants from './pages/Tenants';
import LeaveBalanceMapping from './pages/LeaveBalanceMapping';
import HolidaysManagement from './pages/HolidaysManagement';

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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Role check: superadmin vs company admin
  const isSuperAdmin = (currentUser?.role || '').toLowerCase() === 'super_admin' || 
                       (currentUser?.role || '').toLowerCase() === 'superadmin' || 
                       currentUser?.is_superadmin === true;

  // Leave Requests state (with employee-wise leave balances)
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loadingLeaveRequests, setLoadingLeaveRequests] = useState(false);

  // Unmapped employees count for sidebar badge
  const [unmappedCount, setUnmappedCount] = useState(0);

  // Multi-Tenant state (only active for superadmin)
  const [tenants, setTenants] = useState([]);
  const [currentTenantId, setCurrentTenantId] = useState(currentUser?.tenant?.id || currentUser?.organization_id || 1);
  const [loadingTenants, setLoadingTenants] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'https://hrms-backend-f2ef.onrender.com';

  // Fetch Leave Requests with employee-wise leave balances
  const fetchLeaveRequests = async () => {
    if (!currentUser?.id) return;
    setLoadingLeaveRequests(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/leave-requests?adminUserId=${currentUser.id}&orgId=${currentTenantId}`);
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

  // Fetch Unmapped Leave Balances count
  const fetchUnmappedCount = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/unmapped-leave-balances?orgId=${currentTenantId}`);
      const data = await res.json();
      if (data && Array.isArray(data.unmappedEmployees)) {
        const filtered = data.unmappedEmployees.filter(e => {
          const role = (e.role_name || e.roleKey || e.role || '').toLowerCase();
          const email = (e.email || '').toLowerCase();
          const code = (e.employee_code || '').toLowerCase();
          const name = `${e.first_name || ''} ${e.last_name || ''} ${e.employee_name || ''}`.toLowerCase();
          return !(
            role.includes('super_admin') || 
            role.includes('superadmin') || 
            email.includes('superadmin') || 
            code.includes('emp-super') || 
            name.includes('super administrator')
          );
        });
        setUnmappedCount(filtered.length);
      }
    } catch (err) {
      console.error('Error fetching unmapped count:', err);
    }
  };

  // Fetch Tenants (Only if superadmin)
  const fetchTenants = async () => {
    if (!isSuperAdmin) return;
    setLoadingTenants(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/tenants`);
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

  // Update Leave Request status (Approve / Reject)
  const handleUpdateLeaveStatus = async (leaveId, status, adminRemarks = '') => {
    const res = await fetch(`${API_URL}/api/admin/leave-requests/${leaveId}/status`, {
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

  // Create new tenant (Superadmin only)
  const handleCreateTenant = async (tenantData) => {
    const res = await fetch(`${API_URL}/api/admin/tenants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tenantData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create tenant organization');
    }
    await fetchTenants();
  };

  const currentTenant = tenants.find(t => t.id === currentTenantId) || {
    company_name: currentUser?.tenant?.name || 'Ramel',
    subdomain: 'ramel',
    id: currentTenantId
  };

  const pendingLeavesCount = leaveRequests.filter(r => (r.status || '').toLowerCase() === 'pending').length;
  const pendingRequestsCount = adminRequests.filter(r => (r.status || '').toLowerCase() === 'pending').length;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950 font-sans text-gray-800 dark:text-gray-100">
      {/* TailAdmin Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        currentUser={currentUser}
        handleLogout={handleLogout}
        isSuperAdmin={isSuperAdmin}
        currentTenant={currentTenant}
        unmappedCount={unmappedCount}
        pendingLeavesCount={pendingLeavesCount}
        pendingRequestsCount={pendingRequestsCount}
      />

      {/* Main Content Area */}
      <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        {/* TailAdmin Header */}
        <AdminHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          currentUser={currentUser}
          handleLogout={handleLogout}
          onNavigate={setActiveTab}
          isSuperAdmin={isSuperAdmin}
          currentTenant={currentTenant}
        />

        {/* Multi-Tenant Context Indicator Bar - ONLY VISIBLE TO SUPERADMIN */}
        {isSuperAdmin && (
          <div className="bg-[#1c2434] px-6 py-2.5 text-xs text-gray-300 flex flex-wrap items-center justify-between border-b border-gray-800">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-gray-400">Active Tenant Organization:</span>
              <strong className="text-white font-bold">{currentTenant.company_name}</strong>
              <span className="bg-blue-900/60 text-blue-300 text-[10px] px-2 py-0.5 rounded font-mono">
                Tenant ID: #{currentTenantId}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1 sm:mt-0">
              <span className="text-gray-400">Switch Tenant:</span>
              <select
                value={currentTenantId}
                onChange={(e) => setCurrentTenantId(parseInt(e.target.value, 10))}
                className="bg-[#243044] text-white rounded-lg px-2.5 py-1 text-xs border border-gray-700 focus:outline-none focus:border-[#3c50e0]"
              >
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.company_name} ({t.subdomain})
                  </option>
                ))}
              </select>
              <button
                onClick={() => setActiveTab('tenants')}
                className="text-[#3c50e0] hover:text-white font-semibold text-xs ml-1 hover:underline"
              >
                Manage Tenants →
              </button>
            </div>
          </div>
        )}

        {/* Page Content View */}
        <main className="p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              employees={employees}
              adminRequests={adminRequests}
              leaveRequests={leaveRequests}
              tenants={tenants}
              onNavigate={setActiveTab}
              onOpenAddModal={() => setShowModal(true)}
              isSuperAdmin={isSuperAdmin}
              currentTenant={currentTenant}
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

          {activeTab === 'employees' && (
            <Employees
              employees={employees}
              loading={loadingEmployees}
              onOpenAddModal={() => setShowModal(true)}
            />
          )}

          {/* Leave Balance Auto-Mapping Page */}
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

          {/* Public Holidays Management Page */}
          {activeTab === 'holidays' && (
            <HolidaysManagement
              currentTenantId={currentTenantId}
              currentUser={currentUser}
            />
          )}

          {/* Tenants (Super Admin Only) */}
          {activeTab === 'tenants' && isSuperAdmin && (
            <Tenants
              tenants={tenants}
              loading={loadingTenants}
              onCreateTenant={handleCreateTenant}
              currentTenantId={currentTenantId}
              onSwitchTenant={setCurrentTenantId}
            />
          )}

          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Events & Leaves Calendar</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Calendar overview of scheduled absences and holidays.</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <LeaveApprovals
                  leaveRequests={leaveRequests}
                  loading={loadingLeaveRequests}
                  onUpdateStatus={handleUpdateLeaveStatus}
                  currentUser={currentUser}
                />
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900 max-w-2xl mx-auto space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Organization Settings</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  System preferences and configurations for {currentTenant.company_name}.
                </p>
              </div>

              <div className="space-y-4 text-sm">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white">Organization Name</p>
                    <p className="text-xs text-gray-500">{currentTenant.company_name}</p>
                  </div>
                  <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full">
                    Tenant #{currentTenantId}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white">Public Holidays & Policies</p>
                    <p className="text-xs text-gray-500">Configure annual statutory holidays</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('holidays')}
                    className="text-xs font-bold text-[#3c50e0] hover:underline"
                  >
                    Manage Holidays →
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white">Leave Balance Quotas</p>
                    <p className="text-xs text-gray-500">Check and auto-map staff leave balances</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('leave-balance-mapping')}
                    className="text-xs font-bold text-[#3c50e0] hover:underline"
                  >
                    Check Balances ({unmappedCount} unmapped) →
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900 max-w-xl mx-auto text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#3c50e0] to-[#607afb] text-white text-3xl font-bold flex items-center justify-center mx-auto shadow-md">
                {(currentUser?.email || 'A').charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {currentUser?.name || currentUser?.email?.split('@')[0] || 'Administrator'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{currentUser?.email}</p>
                <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  {isSuperAdmin ? 'Super Administrator' : (currentUser?.role || 'Company Admin')} · {currentTenant.company_name}
                </span>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add Employee Modal */}
      <AddEmployeeModal
        showModal={showModal}
        setShowModal={setShowModal}
        newEmp={newEmp}
        updateNewEmployee={updateNewEmployee}
        handleCreateEmployee={async (e) => {
          await handleCreateEmployee(e);
          // Refresh unmapped count and leave requests
          setTimeout(() => {
            fetchUnmappedCount();
            fetchLeaveRequests();
          }, 600);
        }}
        creatingEmployee={creatingEmployee}
      />
    </div>
  );
}

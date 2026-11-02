import React, { useState, useMemo, useEffect } from 'react';
import Pagination from '../components/Pagination';
import EmptyState from '../../components/EmptyState';
import { PlusIcon, CheckCircleIcon, CloseIcon, SearchIcon } from '../components/Icons';

export default function Tenants({
  tenants = [],
  loading = false,
  onCreateTenant,
  onUpdateTenant,
  onToggleTenantStatus,
  onDeleteTenant,
  currentTenantId,
  onSwitchTenant
}) {
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [deletingTenant, setDeletingTenant] = useState(null);
  const [togglingTenant, setTogglingTenant] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, planFilter]);

  // Form states
  const [addForm, setAddForm] = useState({
    companyName: '',
    subdomain: '',
    plan: 'Enterprise',
    contactEmail: '',
    maxEmployees: 100,
    adminPassword: '',
    adminFirstName: '',
    adminLastName: ''
  });

  const [editForm, setEditForm] = useState({
    companyName: '',
    plan: 'Enterprise',
    contactEmail: '',
    maxEmployees: 100
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdAdminResult, setCreatedAdminResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Filtered tenants calculation
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        (t.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.subdomain || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.contact_email || '').toLowerCase().includes(searchTerm.toLowerCase());

      const tenantStatus = (t.status || 'Active').toUpperCase();
      const matchesStatus =
        statusFilter === 'ALL' || tenantStatus === statusFilter;

      const tenantPlan = (t.plan || 'Enterprise').toUpperCase();
      const matchesPlan =
        planFilter === 'ALL' || tenantPlan === planFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [tenants, searchTerm, statusFilter, planFilter]);

  const paginatedTenants = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTenants.slice(start, start + pageSize);
  }, [filteredTenants, currentPage, pageSize]);

  // Handle Create Tenant
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      const result = await onCreateTenant(addForm);
      setShowAddModal(false);
      setAddForm({
        companyName: '',
        subdomain: '',
        plan: 'Enterprise',
        contactEmail: '',
        maxEmployees: 100,
        adminPassword: '',
        adminFirstName: '',
        adminLastName: ''
      });
      if (result && result.adminAccount) {
        setCreatedAdminResult(result);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create tenant organization');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (tenant) => {
    setEditingTenant(tenant);
    setEditForm({
      companyName: tenant.company_name || '',
      plan: tenant.plan || 'Enterprise',
      contactEmail: tenant.contact_email || '',
      maxEmployees: tenant.max_employees || 100
    });
    setErrorMsg('');
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingTenant || !onUpdateTenant) return;
    setErrorMsg('');
    setSubmitting(true);
    try {
      await onUpdateTenant(editingTenant.id, editForm);
      setEditingTenant(null);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update tenant organization');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Status Toggle Submit
  const handleConfirmToggleStatus = async () => {
    if (!togglingTenant || !onToggleTenantStatus) return;
    const currentStatus = (togglingTenant.status || 'Active').toLowerCase();
    const newStatus = currentStatus === 'suspended' ? 'Active' : 'Suspended';
    setSubmitting(true);
    try {
      await onToggleTenantStatus(togglingTenant.id, newStatus);
      setTogglingTenant(null);
    } catch (err) {
      alert(err.message || 'Failed to toggle status');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Submit
  const handleConfirmDelete = async () => {
    if (!deletingTenant || !onDeleteTenant) return;
    if (deletingTenant.id === 1) {
      alert('The root organization cannot be deleted.');
      return;
    }
    setSubmitting(true);
    try {
      await onDeleteTenant(deletingTenant.id);
      setDeletingTenant(null);
    } catch (err) {
      alert(err.message || 'Failed to delete tenant');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdAdminResult) return;
    const text = `Tenant: ${createdAdminResult.tenant?.company_name} (${createdAdminResult.tenant?.subdomain}.hrms.local)\nAdmin Email: ${createdAdminResult.adminAccount?.email}\nPassword: ${createdAdminResult.adminAccount?.password}\nRole: ${createdAdminResult.adminAccount?.roleName || 'Organization Admin'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Multi-Tenant Organization Management
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Super Admin control panel to provision, configure, suspend, or manage tenant organizations and quotas.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg('');
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-[#3c50e0] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#3444be] transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Add Tenant Organization
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-800">
          <span className="text-xs font-semibold text-gray-500 uppercase">Total Tenants</span>
          <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1.5">{tenants.length}</h3>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">Registered Clients</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-800">
          <span className="text-xs font-semibold text-gray-500 uppercase">Active Organizations</span>
          <h3 className="text-2xl font-extrabold text-emerald-600 mt-1.5">
            {tenants.filter(t => (t.status || 'Active').toLowerCase() === 'active').length}
          </h3>
          <span className="text-xs text-gray-400 mt-1 inline-block">
            {tenants.filter(t => (t.status || '').toLowerCase() === 'suspended').length} Suspended
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-800">
          <span className="text-xs font-semibold text-gray-500 uppercase">Total User Accounts</span>
          <h3 className="text-2xl font-extrabold text-[#3c50e0] mt-1.5">
            {tenants.reduce((sum, t) => sum + parseInt(t.user_count || t.employee_count || 0, 10), 0)}
          </h3>
          <span className="text-xs text-purple-600 font-semibold mt-1 inline-block">Across all tenants</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-800">
          <span className="text-xs font-semibold text-gray-500 uppercase">Current Active Workspace</span>
          <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mt-1.5 truncate">
            {tenants.find(t => t.id === currentTenantId)?.company_name || 'Ramel (Default)'}
          </h3>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">Tenant #{currentTenantId}</span>
        </div>
      </div>

      {/* Tenants Table Card with Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden space-y-4">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by company name, subdomain, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-700 font-medium focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>

            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-700 font-medium focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <option value="ALL">All Plans</option>
              <option value="ENTERPRISE">Enterprise</option>
              <option value="PROFESSIONAL">Professional</option>
              <option value="STARTUP">Startup</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50/75 text-xs uppercase font-semibold text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">Organization</th>
                <th className="px-4 py-3">Subdomain</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Employees / Quota</th>
                <th className="px-4 py-3">Admin Email</th>
                <th className="px-4 py-3 text-right rounded-r-xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem 0' }}>
                    <EmptyState
                      emoji="🏢"
                      title="No organizations found"
                      message={searchTerm || statusFilter !== 'ALL' || planFilter !== 'ALL' 
                        ? "No tenant matches your search or filter criteria." 
                        : "No registered organizations found."}
                    />
                  </td>
                </tr>
              ) : (
                paginatedTenants.map(tenant => {
                  const isCurrent = tenant.id === currentTenantId;
                  const isRoot = tenant.id === 1;
                  const isSuspended = (tenant.status || '').toLowerCase() === 'suspended';
                  const adminEmail = tenant.admin_email || tenant.contact_email || `admin@${tenant.subdomain}.com`;

                  return (
                    <tr key={tenant.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-white">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${isSuspended ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400' : 'bg-gradient-to-tr from-[#3c50e0] to-[#607afb] text-white'} font-bold text-xs shrink-0 shadow-sm`}>
                            {tenant.company_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-gray-900 dark:text-white leading-tight">
                                {tenant.company_name}
                              </p>
                              {isRoot && (
                                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-1.5 py-0.2 rounded">
                                  Root
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-gray-400">Tenant #{tenant.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-xs text-blue-600 dark:text-blue-400">
                        {tenant.subdomain}.hrms.local
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">
                          {tenant.plan || 'Enterprise'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        {isSuspended ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                            ● Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                            ● Active
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-gray-700 dark:text-gray-300">
                        <b>{tenant.employee_count || tenant.user_count || 0}</b> / {tenant.max_employees || 100} Staff
                      </td>

                      <td className="px-4 py-3.5 text-xs">
                        <div className="font-medium text-gray-800 dark:text-gray-200">
                          {adminEmail}
                        </div>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          Role: org_admin
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Switch Context */}
                          {isCurrent ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 px-2.5 py-1">
                              <CheckCircleIcon className="w-3.5 h-3.5" />
                              Active
                            </span>
                          ) : (
                            <button
                              onClick={() => onSwitchTenant(tenant.id)}
                              className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                              title="Switch active session to this tenant"
                            >
                              Switch
                            </button>
                          )}

                          {/* Edit Tenant */}
                          <button
                            onClick={() => handleOpenEdit(tenant)}
                            className="rounded-lg border border-gray-200 p-1 text-gray-600 hover:bg-gray-100 hover:text-[#3c50e0] dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                            title="Edit Organization Details"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>

                          {/* Toggle Suspend/Activate Status */}
                          {!isRoot && (
                            <button
                              onClick={() => setTogglingTenant(tenant)}
                              className={`rounded-lg border p-1 transition-colors ${
                                isSuspended
                                  ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/40'
                                  : 'border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-950/40'
                              }`}
                              title={isSuspended ? 'Reactivate Tenant' : 'Suspend Tenant'}
                            >
                              {isSuspended ? (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </button>
                          )}

                          {/* Delete Tenant (Protected for ID 1) */}
                          {!isRoot ? (
                            <button
                              onClick={() => setDeletingTenant(tenant)}
                              className="rounded-lg border border-rose-200 p-1 text-rose-500 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Delete Tenant Organization"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          ) : (
                            <span className="text-[10px] text-gray-400 font-mono px-1" title="Root organization cannot be deleted">
                              🔒
                            </span>
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

        <div className="px-5 pb-4">
          <Pagination
            currentPage={currentPage}
            totalItems={filteredTenants.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="organizations"
          />
        </div>
      </div>

      {/* Edit Tenant Modal */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Edit Tenant Organization
                </h3>
                <p className="text-xs text-gray-500">
                  Subdomain: <span className="font-mono text-[#3c50e0]">{editingTenant.subdomain}.hrms.local</span>
                </p>
              </div>
              <button
                onClick={() => setEditingTenant(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.companyName}
                  onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Subscription Plan
                  </label>
                  <select
                    value={editForm.plan}
                    onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="Enterprise">Enterprise</option>
                    <option value="Professional">Professional</option>
                    <option value="Startup">Startup</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Max Employee Quota
                  </label>
                  <input
                    type="number"
                    value={editForm.maxEmployees}
                    onChange={(e) => setEditForm({ ...editForm, maxEmployees: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Contact / Notification Email
                </label>
                <input
                  type="email"
                  value={editForm.contactEmail}
                  onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#3c50e0] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#3444be] disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Toggle Confirmation Modal */}
      {togglingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              {(togglingTenant.status || 'Active').toLowerCase() === 'suspended' ? 'Reactivate Tenant Organization' : 'Suspend Tenant Organization'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {(togglingTenant.status || 'Active').toLowerCase() === 'suspended'
                ? `Are you sure you want to reactivate "${togglingTenant.company_name}"? Users and admins will immediately regain access to log in.`
                : `Are you sure you want to suspend "${togglingTenant.company_name}"? Regular users and organization admins under this tenant will be blocked from logging in until reactivated.`}
            </p>

            <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setTogglingTenant(null)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmToggleStatus}
                className={`rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-50 ${
                  (togglingTenant.status || 'Active').toLowerCase() === 'suspended'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {submitting
                  ? 'Updating...'
                  : (togglingTenant.status || 'Active').toLowerCase() === 'suspended'
                  ? 'Reactivate Now'
                  : 'Suspend Access'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-rose-100 dark:border-rose-950">
            <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">
              Delete Tenant Organization
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">
              Are you sure you want to delete <span className="font-bold text-gray-900 dark:text-white">"{deletingTenant.company_name}"</span> (#{deletingTenant.id})?
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              This action will soft-delete the organization workspace and deactivate member accounts.
            </p>

            <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setDeletingTenant(null)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmDelete}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Delete Organization'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Tenant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Add New Tenant Organization
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corporation"
                  value={addForm.companyName}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoSub = name.toLowerCase().replace(/[^a-z0-9]/g, '');
                    setAddForm({ ...addForm, companyName: name, subdomain: addForm.subdomain || autoSub });
                  }}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Subdomain <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    required
                    placeholder="acme"
                    value={addForm.subdomain}
                    onChange={(e) => setAddForm({ ...addForm, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="w-full rounded-l-xl border border-r-0 border-gray-200 p-2.5 text-xs text-gray-800 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white font-mono"
                  />
                  <span className="rounded-r-xl border border-l-0 border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-mono text-gray-500 dark:border-gray-700 dark:bg-gray-800">
                    .hrms.local
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Subscription Plan
                  </label>
                  <select
                    value={addForm.plan}
                    onChange={(e) => setAddForm({ ...addForm, plan: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="Enterprise">Enterprise</option>
                    <option value="Professional">Professional</option>
                    <option value="Startup">Startup</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Max Employee Quota
                  </label>
                  <input
                    type="number"
                    value={addForm.maxEmployees}
                    onChange={(e) => setAddForm({ ...addForm, maxEmployees: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Default Admin Account Section */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Default Organization Admin Account
                </span>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Admin Email (Login ID)
                    </label>
                    <input
                      type="email"
                      placeholder={addForm.subdomain ? `admin@${addForm.subdomain}.com` : 'admin@company.com'}
                      value={addForm.contactEmail}
                      onChange={(e) => setAddForm({ ...addForm, contactEmail: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                    <span className="text-[10px] text-gray-400 mt-0.5 block">
                      Leave blank to auto-generate: admin@{addForm.subdomain || 'subdomain'}.com
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Admin Password
                    </label>
                    <input
                      type="text"
                      placeholder="Default: Admin@123"
                      value={addForm.adminPassword}
                      onChange={(e) => setAddForm({ ...addForm, adminPassword: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white font-mono"
                    />
                    <span className="text-[10px] text-gray-400 mt-0.5 block">
                      Leave blank to default to: <span className="font-mono font-semibold">Admin@123</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#3c50e0] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#3444be] disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Tenant & Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal Showing Created Tenant Admin Credentials */}
      {createdAdminResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <CheckCircleIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Tenant & Admin Created Successfully!
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Default Organization Admin has been provisioned.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400">Organization</span>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">
                  {createdAdminResult.tenant?.company_name} ({createdAdminResult.tenant?.subdomain}.hrms.local)
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400">Admin Login Email</span>
                <p className="text-xs font-mono font-bold text-[#3c50e0] dark:text-[#607afb] select-all">
                  {createdAdminResult.adminAccount?.email}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400">Default Password</span>
                <p className="text-xs font-mono font-bold text-gray-900 dark:text-white select-all">
                  {createdAdminResult.adminAccount?.password}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400">Assigned Role</span>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {createdAdminResult.adminAccount?.roleName || 'Organization Admin'} ({createdAdminResult.adminAccount?.role || 'org_admin'})
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
              >
                {copied ? '✓ Copied Credentials!' : 'Copy Login Details'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSwitchTenant(createdAdminResult.tenant?.id);
                    setCreatedAdminResult(null);
                  }}
                  className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                >
                  Switch Context
                </button>
                <button
                  type="button"
                  onClick={() => setCreatedAdminResult(null)}
                  className="rounded-xl bg-gray-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

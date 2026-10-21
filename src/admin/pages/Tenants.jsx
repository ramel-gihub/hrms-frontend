import React, { useState } from 'react';
import { PlusIcon, CheckCircleIcon, CloseIcon, UsersIcon } from '../components/Icons';

export default function Tenants({
  tenants = [],
  loading = false,
  onCreateTenant,
  currentTenantId,
  onSwitchTenant
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    subdomain: '',
    plan: 'Enterprise',
    contactEmail: '',
    maxEmployees: 100
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await onCreateTenant(form);
      setShowAddModal(false);
      setForm({ companyName: '', subdomain: '', plan: 'Enterprise', contactEmail: '', maxEmployees: 100 });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create tenant organization');
    } finally {
      setSubmitting(false);
    }
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
            Manage SaaS tenant workspaces, subdomains, subscriptions, and quotas.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
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
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">100% Operational</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-800">
          <span className="text-xs font-semibold text-gray-500 uppercase">Active Subscriptions</span>
          <h3 className="text-2xl font-extrabold text-[#3c50e0] mt-1.5">
            {tenants.filter(t => (t.status || '').toLowerCase() === 'active').length}
          </h3>
          <span className="text-xs text-gray-400 mt-1 inline-block">Enterprise & Pro tiers</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-800">
          <span className="text-xs font-semibold text-gray-500 uppercase">Total User Accounts</span>
          <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1.5">
            {tenants.reduce((sum, t) => sum + parseInt(t.user_count || 0, 10), 0)}
          </h3>
          <span className="text-xs text-purple-600 font-semibold mt-1 inline-block">Across all tenants</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-800">
          <span className="text-xs font-semibold text-gray-500 uppercase">Current Workspace</span>
          <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mt-1.5 truncate">
            {tenants.find(t => t.id === currentTenantId)?.company_name || 'Ramel (Default)'}
          </h3>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">Active Session</span>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">
          All Registered Client Organizations
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50/75 text-xs uppercase font-semibold text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">Organization</th>
                <th className="px-4 py-3">Subdomain</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Employees / Quota</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3 text-right rounded-r-xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {tenants.map(tenant => {
                const isCurrent = tenant.id === currentTenantId;
                return (
                  <tr key={tenant.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#3c50e0] to-[#607afb] text-white font-bold text-xs shrink-0 shadow-sm">
                          {tenant.company_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white leading-tight">
                            {tenant.company_name}
                          </p>
                          <span className="text-[11px] text-gray-400">Tenant ID: #{tenant.id}</span>
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
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        ● {tenant.status || 'Active'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-gray-700 dark:text-gray-300">
                      <b>{tenant.employee_count || 0}</b> / {tenant.max_employees || 100} Staff
                    </td>

                    <td className="px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400">
                      {tenant.contact_email || `admin@${tenant.subdomain}.com`}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircleIcon className="w-3.5 h-3.5" />
                          Active Context
                        </span>
                      ) : (
                        <button
                          onClick={() => onSwitchTenant(tenant.id)}
                          className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                          Switch Context
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Tenant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
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

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corporation"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Subdomain Slug <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center rounded-xl border border-gray-200 overflow-hidden dark:border-gray-700 dark:bg-gray-800">
                  <input
                    type="text"
                    required
                    placeholder="acme"
                    value={form.subdomain}
                    onChange={(e) => setForm({ ...form, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="w-full p-2.5 text-xs text-gray-800 focus:outline-none dark:bg-gray-800 dark:text-white"
                  />
                  <span className="bg-gray-50 px-3 text-xs text-gray-400 dark:bg-gray-700">.hrms.local</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Subscription Tier
                  </label>
                  <select
                    value={form.plan}
                    onChange={(e) => setForm({ ...form, plan: e.target.value })}
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
                    value={form.maxEmployees}
                    onChange={(e) => setForm({ ...form, maxEmployees: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Primary Contact Email
                </label>
                <input
                  type="email"
                  placeholder="admin@acme.com"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
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
                  {submitting ? 'Creating...' : 'Create Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

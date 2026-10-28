import React, { useState, useEffect, useMemo } from 'react';
import EmptyState from '../../components/EmptyState';
import { HomeIcon, PlusIcon, CloseIcon, SearchIcon, CheckCircleIcon } from '../components/Icons';

export default function AdminWFH({
  currentUser,
  currentTenantId,
  employees = [],
  fetchEmployees
}) {
  const API_URL = import.meta.env.VITE_API_URL || 'https://hrms-backend-5xo8.onrender.com';
  const orgId = currentTenantId || currentUser?.organization_id || 1;

  // WFH Requests state
  const [wfhRequests, setWfhRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tenantEmployees, setTenantEmployees] = useState(employees);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [entryMode, setEntryMode] = useState('batch'); // 'batch' or 'rows'
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  // Batch Form State
  const [batchSelectedEmpIds, setBatchSelectedEmpIds] = useState([]);
  const [batchForm, setBatchForm] = useState({
    startDate: '',
    endDate: '',
    wfhContact: '',
    reason: ''
  });

  // Rows Form State ("Add More" interface)
  const [rowEntries, setRowEntries] = useState([
    {
      employeeId: '',
      startDate: '',
      endDate: '',
      wfhContact: '',
      reason: ''
    }
  ]);

  // Fetch WFH Requests
  const fetchWfhRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/wfh-requests?adminUserId=${currentUser?.id}&orgId=${orgId}`);
      const data = await res.json();
      if (data && Array.isArray(data.requests)) {
        setWfhRequests(data.requests);
      }
    } catch (err) {
      console.error('Error fetching admin WFH requests:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Tenant-specific employees (strictly same tenant ID)
  const fetchTenantStaff = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/employees?orgId=${orgId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setTenantEmployees(data);
      }
    } catch (err) {
      console.error('Error fetching tenant employees:', err);
    }
  };

  useEffect(() => {
    fetchWfhRequests();
    fetchTenantStaff();
  }, [orgId, currentUser?.id]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return wfhRequests.filter(req => {
      if (statusFilter !== 'All' && (req.status || 'Pending').toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const empName = `${req.first_name || ''} ${req.last_name || ''}`.toLowerCase();
        const empCode = (req.employee_code || '').toLowerCase();
        const phone = (req.wfh_contact || '').toLowerCase();
        const reason = (req.description || '').toLowerCase();
        const remarks = (req.admin_remarks || '').toLowerCase();
        if (!empName.includes(q) && !empCode.includes(q) && !phone.includes(q) && !reason.includes(q) && !remarks.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [wfhRequests, statusFilter, searchQuery]);

  // Calculate day difference
  const calculateDays = (start, end) => {
    if (!start) return 1;
    const s = new Date(start);
    const e = new Date(end || start);
    const diff = Math.floor((e - s) / 86400000) + 1;
    return Math.max(1, isNaN(diff) ? 1 : diff);
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = wfhRequests.length;
    const autoApproved = wfhRequests.filter(r => (r.admin_remarks || '').includes('Admin: auto Approved')).length;
    const approved = wfhRequests.filter(r => (r.status || '').toLowerCase() === 'approved').length;
    const totalDays = wfhRequests
      .filter(r => (r.status || '').toLowerCase() === 'approved')
      .reduce((sum, r) => sum + calculateDays(r.wfh_start_date, r.wfh_end_date), 0);
    return { total, autoApproved, approved, totalDays };
  }, [wfhRequests]);

  // Batch toggle
  const toggleBatchEmployee = (empId) => {
    setBatchSelectedEmpIds(prev =>
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  const selectAllBatchEmployees = () => {
    if (batchSelectedEmpIds.length === tenantEmployees.length) {
      setBatchSelectedEmpIds([]);
    } else {
      setBatchSelectedEmpIds(tenantEmployees.map(e => e.id));
    }
  };

  // Row builder helpers ("Add More" interface)
  const handleAddRow = () => {
    setRowEntries(prev => [
      ...prev,
      {
        employeeId: '',
        startDate: '',
        endDate: '',
        wfhContact: '',
        reason: ''
      }
    ]);
  };

  const handleRemoveRow = (index) => {
    if (rowEntries.length === 1) return;
    setRowEntries(prev => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (index, field, value) => {
    setRowEntries(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Submit Handler
  const handleSubmitWFH = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    let entriesToSubmit = [];

    if (entryMode === 'batch') {
      if (batchSelectedEmpIds.length === 0) {
        setFeedback({ type: 'error', message: 'Please select at least one employee from the list.' });
        setSubmitting(false);
        return;
      }
      if (!batchForm.startDate) {
        setFeedback({ type: 'error', message: 'Please select From Date.' });
        setSubmitting(false);
        return;
      }

      entriesToSubmit = batchSelectedEmpIds.map(empId => ({
        employeeId: empId,
        startDate: batchForm.startDate,
        endDate: batchForm.endDate || batchForm.startDate,
        wfhContact: batchForm.wfhContact.trim() || null,
        reason: batchForm.reason.trim() || 'Admin recorded Work From Home (WFH)'
      }));
    } else {
      const validRows = rowEntries.filter(r => r.employeeId && r.startDate);
      if (validRows.length === 0) {
        setFeedback({ type: 'error', message: 'Please fill in Employee and From Date for at least one row.' });
        setSubmitting(false);
        return;
      }

      entriesToSubmit = validRows.map(r => ({
        employeeId: Number(r.employeeId),
        startDate: r.startDate,
        endDate: r.endDate || r.startDate,
        wfhContact: r.wfhContact.trim() || null,
        reason: r.reason.trim() || 'Admin recorded Work From Home (WFH)'
      }));
    }

    try {
      const res = await fetch(`${API_URL}/api/admin/wfh/record-past`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: currentUser?.id,
          orgId,
          entries: entriesToSubmit
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record WFH requests');
      }

      setFeedback({
        type: 'success',
        message: `Successfully saved & auto-approved ${data.count} WFH record(s) in database!`
      });

      // Reset form
      setBatchSelectedEmpIds([]);
      setBatchForm({
        startDate: '',
        endDate: '',
        wfhContact: '',
        reason: ''
      });
      setRowEntries([
        {
          employeeId: '',
          startDate: '',
          endDate: '',
          wfhContact: '',
          reason: ''
        }
      ]);

      await fetchWfhRequests();
      if (fetchEmployees) fetchEmployees();

      setTimeout(() => {
        setShowModal(false);
        setFeedback(null);
      }, 1500);
    } catch (err) {
      console.error('Submit WFH error:', err);
      setFeedback({ type: 'error', message: err.message || 'Unable to save WFH records.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <HomeIcon className="w-6 h-6" />
            </span>
            Manage Work From Home (WFH)
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Record and backdate Work From Home requests for one or multiple staff members. Automatically auto-approved with status <span className="font-semibold text-emerald-600">Approved</span>.
          </p>
        </div>

        <button
          onClick={() => { setShowModal(true); setFeedback(null); }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:opacity-95 active:scale-95 shrink-0"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Record Past / Multiple WFH</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total WFH Requests</span>
            <span className="p-2 rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400">
              <HomeIcon className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{metrics.total}</div>
          <p className="text-xs text-gray-400 mt-1">All recorded WFH entries</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Auto-Approved by Admin</span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <CheckCircleIcon className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{metrics.autoApproved}</div>
          <p className="text-xs text-gray-400 mt-1">Status: Admin: auto Approved</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Approved WFH</span>
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <CheckCircleIcon className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{metrics.approved}</div>
          <p className="text-xs text-gray-400 mt-1">Active approved WFH records</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total WFH Days</span>
            <span className="p-2 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <HomeIcon className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{metrics.totalDays} Days</div>
          <p className="text-xs text-gray-400 mt-1">Total remote work days</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search employee, phone, reason, or remark..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap gap-2.5 items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 focus:outline-none"
          >
            <option value="All">All Status</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
            <option value="In Review">In Review</option>
          </select>
        </div>
      </div>

      {/* WFH Requests Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden dark:border-gray-800 dark:bg-gray-900">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">Loading WFH records...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-8">
            <EmptyState
              emoji="🏡"
              title="No WFH Records Found"
              message="No Work From Home requests match your search criteria. Click 'Record Past / Multiple WFH' to record remote work."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/75 text-xs font-bold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">WFH Dates</th>
                  <th className="px-5 py-3.5">Total Days</th>
                  <th className="px-5 py-3.5">Contact Phone</th>
                  <th className="px-5 py-3.5">Reason / Details</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Approval Remark</th>
                  <th className="px-5 py-3.5 text-right">Recorded Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredRequests.map((req) => {
                  const isAutoApproved = (req.admin_remarks || '').includes('Admin: auto Approved');
                  const sDate = req.wfh_start_date ? new Date(req.wfh_start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '--';
                  const eDate = req.wfh_end_date ? new Date(req.wfh_end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '--';
                  const dateDisplay = req.wfh_start_date === req.wfh_end_date || !req.wfh_end_date ? sDate : `${sDate} – ${eDate}`;
                  const daysCount = calculateDays(req.wfh_start_date, req.wfh_end_date);

                  return (
                    <tr key={req.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-sm">
                            {(req.first_name || 'E').charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white leading-tight">
                              {req.first_name || req.last_name ? `${req.first_name || ''} ${req.last_name || ''}`.trim() : 'Employee'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {req.employee_code} · {req.department || 'Staff'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-medium text-gray-800 dark:text-gray-200">{dateDisplay}</div>
                        <div className="text-xs text-gray-400">{req.request_code}</div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          {daysCount} Day(s)
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300 text-xs">
                        {req.wfh_contact || '—'}
                      </td>

                      <td className="px-5 py-3.5 max-w-xs truncate text-gray-600 dark:text-gray-300" title={req.description}>
                        {req.description || '—'}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          (req.status || '').toLowerCase() === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                            : (req.status || '').toLowerCase() === 'rejected'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                        }`}>
                          {req.status || 'Approved'}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        {isAutoApproved ? (
                          <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded dark:bg-emerald-900/30 dark:text-emerald-300">
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                            Admin: auto Approved
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">{req.admin_remarks || '—'}</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right text-xs text-gray-500 whitespace-nowrap">
                        {req.created_at ? new Date(req.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Past WFH Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800 my-8 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  <HomeIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Record & Auto-Approve Work From Home (WFH)
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Apply past or current WFH dates for one or multiple employees in your organization. Automatically saved as <span className="text-emerald-600 font-semibold">Approved</span> with comment <span className="font-mono text-emerald-600">Admin: auto Approved</span>.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Sub-Header Tabs */}
            <div className="px-6 pt-4 pb-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between shrink-0">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEntryMode('batch')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                    entryMode === 'batch'
                      ? 'bg-white text-emerald-700 shadow-sm border border-emerald-200 dark:bg-gray-800 dark:text-emerald-300 dark:border-emerald-800'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400'
                  }`}
                >
                  👥 Batch Multiple Employees (Same Dates)
                </button>
                <button
                  type="button"
                  onClick={() => setEntryMode('rows')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                    entryMode === 'rows'
                      ? 'bg-white text-emerald-700 shadow-sm border border-emerald-200 dark:bg-gray-800 dark:text-emerald-300 dark:border-emerald-800'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400'
                  }`}
                >
                  📝 Add More Interface (Row by Row)
                </button>
              </div>

              <div className="text-xs font-mono bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 px-2.5 py-1 rounded-full">
                Tenant #{orgId} Staff Only
              </div>
            </div>

            {/* Form Body (Scrollable) */}
            <form onSubmit={handleSubmitWFH} className="flex-1 overflow-y-auto p-6 space-y-5">
              {feedback && (
                <div className={`p-4 rounded-xl text-sm font-medium ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                }`}>
                  {feedback.message}
                </div>
              )}

              {/* Mode A: Batch Selection */}
              {entryMode === 'batch' && (
                <div className="space-y-5">
                  {/* Employee Multi-Select Checklist */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        Select Employees (Same Tenant #{orgId}) <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={selectAllBatchEmployees}
                        className="text-xs font-semibold text-emerald-600 hover:underline"
                      >
                        {batchSelectedEmpIds.length === tenantEmployees.length ? 'Deselect All' : `Select All (${tenantEmployees.length})`}
                      </button>
                    </div>

                    <div className="max-h-44 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50/50 p-2.5 dark:border-gray-700 dark:bg-gray-800/40 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {tenantEmployees.length === 0 ? (
                        <p className="text-xs text-gray-400 col-span-3 py-2 text-center">No active employees found for this organization.</p>
                      ) : (
                        tenantEmployees.map(emp => {
                          const isSelected = batchSelectedEmpIds.includes(emp.id);
                          return (
                            <label
                              key={emp.id}
                              onClick={() => toggleBatchEmployee(emp.id)}
                              className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer text-xs font-medium border transition-all ${
                                isSelected
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800 shadow-sm'
                                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="rounded text-emerald-600 focus:ring-emerald-500"
                              />
                              <div className="truncate">
                                <span className="font-semibold block truncate">{emp.full_name || emp.employee_code}</span>
                                <span className="text-[10px] text-gray-400 block">{emp.employee_code} · {emp.department || 'Staff'}</span>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {batchSelectedEmpIds.length} employee(s) selected for this WFH batch.
                    </p>
                  </div>

                  {/* Date Range & Contact */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                        From Date (Past Allowed) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={batchForm.startDate}
                        onChange={(e) => setBatchForm({ ...batchForm, startDate: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                        To Date
                      </label>
                      <input
                        type="date"
                        value={batchForm.endDate || batchForm.startDate}
                        onChange={(e) => setBatchForm({ ...batchForm, endDate: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                        Contact Phone during WFH
                      </label>
                      <input
                        type="tel"
                        value={batchForm.wfhContact}
                        onChange={(e) => setBatchForm({ ...batchForm, wfhContact: e.target.value })}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Calculated Days Display */}
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200/60 dark:border-gray-700 flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-600 dark:text-gray-400">Total WFH Days:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {calculateDays(batchForm.startDate, batchForm.endDate)} Day(s)
                    </span>
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                      Reason / Administrative Note
                    </label>
                    <textarea
                      rows="2"
                      value={batchForm.reason}
                      onChange={(e) => setBatchForm({ ...batchForm, reason: e.target.value })}
                      placeholder="e.g. Client site remote support / Official WFH approval"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Mode B: Row-by-Row Add More Interface */}
              {entryMode === 'rows' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      WFH Entries ({rowEntries.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddRow}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 text-emerald-700 px-3 py-1.5 text-xs font-bold hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300"
                    >
                      <PlusIcon className="w-4 h-4" />
                      <span>+ Add More Row</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {rowEntries.map((row, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-gray-200 bg-gray-50/40 dark:border-gray-800 dark:bg-gray-800/20 space-y-3 relative"
                      >
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                          <span className="text-xs font-bold text-gray-500">Entry #{idx + 1}</span>
                          {rowEntries.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(idx)}
                              className="text-xs text-rose-600 hover:text-rose-800 dark:text-rose-400 font-semibold"
                            >
                              Remove Row
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                              Employee <span className="text-rose-500">*</span>
                            </label>
                            <select
                              value={row.employeeId}
                              onChange={(e) => handleRowChange(idx, 'employeeId', e.target.value)}
                              className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                              required
                            >
                              <option value="">Select Employee</option>
                              {tenantEmployees.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.full_name || emp.employee_code} ({emp.employee_code})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                              From Date (Past Allowed) <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="date"
                              value={row.startDate}
                              onChange={(e) => handleRowChange(idx, 'startDate', e.target.value)}
                              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                              To Date
                            </label>
                            <input
                              type="date"
                              value={row.endDate || row.startDate}
                              onChange={(e) => handleRowChange(idx, 'endDate', e.target.value)}
                              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                              Contact Phone
                            </label>
                            <input
                              type="tel"
                              value={row.wfhContact}
                              onChange={(e) => handleRowChange(idx, 'wfhContact', e.target.value)}
                              placeholder="+91..."
                              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <input
                            type="text"
                            value={row.reason}
                            onChange={(e) => handleRowChange(idx, 'reason', e.target.value)}
                            placeholder="Reason / Notes (optional)"
                            className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:border-emerald-300 hover:text-emerald-600 dark:border-gray-800 dark:text-gray-400 dark:hover:border-emerald-700 transition-colors"
                  >
                    + Click to Add More Row
                  </button>
                </div>
              )}

              {/* Notice Banner */}
              <div className="rounded-xl bg-emerald-50/70 p-3.5 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/50 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-300">
                <CheckCircleIcon className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <div>
                  <strong>Automatic Approval System:</strong> All WFH records created by administrators are immediately saved with status <strong>"Approved"</strong> and comment <strong>"Admin: auto Approved"</strong>, allowing historical / past dates to be recorded accurately in DB.
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50"
                >
                  {submitting ? 'Auto-Approving & Saving...' : 'Auto-Approve & Save to DB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

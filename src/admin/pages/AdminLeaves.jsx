import React, { useState, useEffect, useMemo } from 'react';
import EmptyState from '../../components/EmptyState';
import { CalendarIcon, PlusIcon, CloseIcon, SearchIcon, CheckCircleIcon } from '../components/Icons';

export default function AdminLeaves({
  currentUser,
  currentTenantId,
  employees = [],
  fetchEmployees
}) {
  const API_URL = import.meta.env.VITE_API_URL || 'https://hrms-backend-5xo8.onrender.com';
  const orgId = currentTenantId || currentUser?.organization_id || 1;

  // Leaves and Leave types state
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [tenantEmployees, setTenantEmployees] = useState(employees);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [entryMode, setEntryMode] = useState('batch'); // 'batch' or 'rows'
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  // Batch Form State
  const [batchSelectedEmpIds, setBatchSelectedEmpIds] = useState([]);
  const [batchForm, setBatchForm] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    isHalfDay: false,
    halfDayPeriod: 'First Half',
    reason: ''
  });

  // Rows Form State ("Add More" interface)
  const [rowEntries, setRowEntries] = useState([
    {
      employeeId: '',
      leaveTypeId: '',
      startDate: '',
      endDate: '',
      isHalfDay: false,
      halfDayPeriod: 'First Half',
      reason: ''
    }
  ]);

  // Fetch Leave Requests for this tenant
  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/leave-requests?adminUserId=${currentUser?.id}&orgId=${orgId}`);
      const data = await res.json();
      if (data && Array.isArray(data.requests)) {
        setLeaveRequests(data.requests);
      }
    } catch (err) {
      console.error('Error fetching admin leave requests:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Leave Types
  const fetchLeaveTypes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/leave-types?orgId=${orgId}`);
      const data = await res.json();
      if (data && Array.isArray(data.leaveTypes)) {
        setLeaveTypes(data.leaveTypes);
        if (data.leaveTypes.length > 0 && !batchForm.leaveTypeId) {
          setBatchForm(prev => ({ ...prev, leaveTypeId: String(data.leaveTypes[0].id) }));
        }
      }
    } catch (err) {
      console.error('Error fetching leave types:', err);
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
    fetchLeaves();
    fetchLeaveTypes();
    fetchTenantStaff();
  }, [orgId, currentUser?.id]);

  // Filtered requests
  const filteredLeaves = useMemo(() => {
    return leaveRequests.filter(req => {
      if (statusFilter !== 'All' && (req.status || 'Pending').toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (typeFilter !== 'All' && req.leave_type_name !== typeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const empName = (req.employee_name || `${req.first_name || ''} ${req.last_name || ''}`).toLowerCase();
        const empCode = (req.employee_code || '').toLowerCase();
        const typeName = (req.leave_type_name || '').toLowerCase();
        const reason = (req.reason || '').toLowerCase();
        const remarks = (req.admin_remarks || '').toLowerCase();
        if (!empName.includes(q) && !empCode.includes(q) && !typeName.includes(q) && !reason.includes(q) && !remarks.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [leaveRequests, statusFilter, typeFilter, searchQuery]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = leaveRequests.length;
    const autoApproved = leaveRequests.filter(r => (r.admin_remarks || '').includes('Admin: auto Approved')).length;
    const approved = leaveRequests.filter(r => (r.status || '').toLowerCase() === 'approved').length;
    const totalDays = leaveRequests
      .filter(r => (r.status || '').toLowerCase() === 'approved')
      .reduce((sum, r) => sum + parseFloat(r.days_requested || 0), 0);
    return { total, autoApproved, approved, totalDays: Math.round(totalDays * 10) / 10 };
  }, [leaveRequests]);

  // Toggle employee in batch selection
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
        leaveTypeId: leaveTypes[0] ? String(leaveTypes[0].id) : '',
        startDate: '',
        endDate: '',
        isHalfDay: false,
        halfDayPeriod: 'First Half',
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
  const handleSubmitLeaves = async (e) => {
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
      if (!batchForm.leaveTypeId || !batchForm.startDate) {
        setFeedback({ type: 'error', message: 'Please select Leave Type and Start Date.' });
        setSubmitting(false);
        return;
      }

      entriesToSubmit = batchSelectedEmpIds.map(empId => ({
        employeeId: empId,
        leaveTypeId: Number(batchForm.leaveTypeId),
        startDate: batchForm.startDate,
        endDate: batchForm.isHalfDay ? batchForm.startDate : (batchForm.endDate || batchForm.startDate),
        isHalfDay: batchForm.isHalfDay,
        halfDayPeriod: batchForm.halfDayPeriod,
        reason: batchForm.reason.trim() || 'Admin recorded leave'
      }));
    } else {
      const validRows = rowEntries.filter(r => r.employeeId && r.leaveTypeId && r.startDate);
      if (validRows.length === 0) {
        setFeedback({ type: 'error', message: 'Please fill in Employee, Leave Type, and Start Date for at least one row.' });
        setSubmitting(false);
        return;
      }

      entriesToSubmit = validRows.map(r => ({
        employeeId: Number(r.employeeId),
        leaveTypeId: Number(r.leaveTypeId),
        startDate: r.startDate,
        endDate: r.isHalfDay ? r.startDate : (r.endDate || r.startDate),
        isHalfDay: r.isHalfDay,
        halfDayPeriod: r.halfDayPeriod,
        reason: r.reason.trim() || 'Admin recorded leave'
      }));
    }

    try {
      const res = await fetch(`${API_URL}/api/admin/leaves/record-past`, {
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
        throw new Error(data.error || 'Failed to record leaves');
      }

      setFeedback({
        type: 'success',
        message: `Successfully saved & auto-approved ${data.count} leave record(s) in database!`
      });

      // Reset form
      setBatchSelectedEmpIds([]);
      setBatchForm({
        leaveTypeId: leaveTypes[0] ? String(leaveTypes[0].id) : '',
        startDate: '',
        endDate: '',
        isHalfDay: false,
        halfDayPeriod: 'First Half',
        reason: ''
      });
      setRowEntries([
        {
          employeeId: '',
          leaveTypeId: leaveTypes[0] ? String(leaveTypes[0].id) : '',
          startDate: '',
          endDate: '',
          isHalfDay: false,
          halfDayPeriod: 'First Half',
          reason: ''
        }
      ]);

      // Re-fetch leaves list
      await fetchLeaves();
      if (fetchEmployees) fetchEmployees();

      setTimeout(() => {
        setShowModal(false);
        setFeedback(null);
      }, 1500);
    } catch (err) {
      console.error('Submit leaves error:', err);
      setFeedback({ type: 'error', message: err.message || 'Unable to save leave records.' });
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
            <span className="p-2 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              <CalendarIcon className="w-6 h-6" />
            </span>
            Manage Employee Leaves
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Apply and backdate leave requests for one or multiple employees in your organization. All entries auto-approved with status <span className="font-semibold text-emerald-600">Approved</span>.
          </p>
        </div>

        <button
          onClick={() => { setShowModal(true); setFeedback(null); }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#3c50e0] to-[#5a6ff0] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:opacity-95 active:scale-95 shrink-0"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Record Past / Multiple Leaves</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Leaves</span>
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <CalendarIcon className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{metrics.total}</div>
          <p className="text-xs text-gray-400 mt-1">All recorded leave entries</p>
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
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Approved Leaves</span>
            <span className="p-2 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <CheckCircleIcon className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{metrics.approved}</div>
          <p className="text-xs text-gray-400 mt-1">Approved & active in system</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Days Covered</span>
            <span className="p-2 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <CalendarIcon className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{metrics.totalDays} Days</div>
          <p className="text-xs text-gray-400 mt-1">Deducted from leave balance</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search employee, leave type, reason, or remark..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-2 text-sm text-gray-900 focus:border-[#3c50e0] focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap gap-2.5 items-center">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 focus:outline-none"
          >
            <option value="All">All Leave Types</option>
            {leaveTypes.map(lt => (
              <option key={lt.id} value={lt.name}>{lt.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 focus:outline-none"
          >
            <option value="All">All Status</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden dark:border-gray-800 dark:bg-gray-900">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">Loading leave records...</div>
        ) : filteredLeaves.length === 0 ? (
          <div className="p-8">
            <EmptyState
              emoji="📅"
              title="No Leave Records Found"
              message="No leaves match your search criteria. Click 'Record Past / Multiple Leaves' to add leaves for your employees."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/75 text-xs font-bold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Leave Type</th>
                  <th className="px-5 py-3.5">Dates & Duration</th>
                  <th className="px-5 py-3.5">Reason</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Approval Remark</th>
                  <th className="px-5 py-3.5 text-right">Recorded Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredLeaves.map((leave) => {
                  const isAutoApproved = (leave.admin_remarks || '').includes('Admin: auto Approved');
                  const sDate = leave.start_date ? new Date(leave.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '--';
                  const eDate = leave.end_date ? new Date(leave.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '--';
                  const dateDisplay = leave.start_date === leave.end_date ? sDate : `${sDate} – ${eDate}`;

                  return (
                    <tr key={leave.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#3c50e0] to-[#607afb] text-white font-bold text-xs shadow-sm">
                            {(leave.first_name || leave.employee_name || 'E').charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white leading-tight">
                              {leave.employee_name || `${leave.first_name || ''} ${leave.last_name || ''}`}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {leave.employee_code} · {leave.department || 'Staff'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                          {leave.leave_type_name}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-medium text-gray-800 dark:text-gray-200">{dateDisplay}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-semibold text-purple-600 dark:text-purple-400">
                            {leave.is_half_day ? '0.5 Day' : `${leave.days_requested} Day(s)`}
                          </span>
                          {leave.is_half_day && (
                            <span className="text-[11px] bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 px-1.5 py-0.2 rounded">
                              {leave.half_day_period === 'Second Half' ? '2nd Half' : '1st Half'}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 max-w-xs truncate text-gray-600 dark:text-gray-300" title={leave.reason}>
                        {leave.reason || '—'}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          (leave.status || '').toLowerCase() === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                            : (leave.status || '').toLowerCase() === 'rejected'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                        }`}>
                          {leave.status || 'Approved'}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        {isAutoApproved ? (
                          <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded dark:bg-emerald-900/30 dark:text-emerald-300">
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                            Admin: auto Approved
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">{leave.admin_remarks || '—'}</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right text-xs text-gray-500 whitespace-nowrap">
                        {leave.created_at ? new Date(leave.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Past Leaves Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800 my-8 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Record & Auto-Approve Leaves
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Apply old dates or current leaves for your organization's staff. Automatically saved as <span className="text-emerald-600 font-semibold">Approved</span> with comment <span className="font-mono text-emerald-600">Admin: auto Approved</span>.
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
                      ? 'bg-white text-purple-700 shadow-sm border border-purple-200 dark:bg-gray-800 dark:text-purple-300 dark:border-purple-800'
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
                      ? 'bg-white text-purple-700 shadow-sm border border-purple-200 dark:bg-gray-800 dark:text-purple-300 dark:border-purple-800'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400'
                  }`}
                >
                  📝 Add More Interface (Row by Row)
                </button>
              </div>

              <div className="text-xs font-mono bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2.5 py-1 rounded-full">
                Tenant #{orgId} Staff Only
              </div>
            </div>

            {/* Form Body (Scrollable) */}
            <form onSubmit={handleSubmitLeaves} className="flex-1 overflow-y-auto p-6 space-y-5">
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
                        className="text-xs font-semibold text-[#3c50e0] hover:underline"
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
                                  ? 'bg-purple-50 text-purple-900 border-purple-300 dark:bg-purple-950/40 dark:text-purple-200 dark:border-purple-800 shadow-sm'
                                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}} // handled by label onClick
                                className="rounded text-[#3c50e0] focus:ring-[#3c50e0]"
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
                      {batchSelectedEmpIds.length} employee(s) selected for this leave batch.
                    </p>
                  </div>

                  {/* Common Leave Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                        Leave Type <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={batchForm.leaveTypeId}
                        onChange={(e) => setBatchForm({ ...batchForm, leaveTypeId: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-[#3c50e0]"
                        required
                      >
                        <option value="">Select Leave Type</option>
                        {leaveTypes.map(lt => (
                          <option key={lt.id} value={lt.id}>{lt.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                        Start Date (Past Allowed) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={batchForm.startDate}
                        onChange={(e) => setBatchForm({ ...batchForm, startDate: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-[#3c50e0]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={batchForm.isHalfDay ? batchForm.startDate : batchForm.endDate}
                        disabled={batchForm.isHalfDay}
                        onChange={(e) => setBatchForm({ ...batchForm, endDate: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-[#3c50e0] disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Half Day Option */}
                  <div className="flex flex-wrap items-center gap-6 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200/60 dark:border-gray-700">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={batchForm.isHalfDay}
                        onChange={(e) => setBatchForm({ ...batchForm, isHalfDay: e.target.checked })}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span>Is Half Day?</span>
                    </label>

                    {batchForm.isHalfDay && (
                      <div className="flex items-center gap-4 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="batchHalfPeriod"
                            value="First Half"
                            checked={batchForm.halfDayPeriod === 'First Half'}
                            onChange={(e) => setBatchForm({ ...batchForm, halfDayPeriod: e.target.value })}
                          />
                          <span>First Half</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="batchHalfPeriod"
                            value="Second Half"
                            checked={batchForm.halfDayPeriod === 'Second Half'}
                            onChange={(e) => setBatchForm({ ...batchForm, halfDayPeriod: e.target.value })}
                          />
                          <span>Second Half</span>
                        </label>
                      </div>
                    )}
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
                      placeholder="e.g. Approved by Management / Historical leave update"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-[#3c50e0]"
                    />
                  </div>
                </div>
              )}

              {/* Mode B: Row-by-Row Add More Interface */}
              {entryMode === 'rows' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Leave Entries ({rowEntries.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddRow}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 text-purple-700 px-3 py-1.5 text-xs font-bold hover:bg-purple-100 dark:bg-purple-900/40 dark:text-purple-300"
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
                              Leave Type <span className="text-rose-500">*</span>
                            </label>
                            <select
                              value={row.leaveTypeId}
                              onChange={(e) => handleRowChange(idx, 'leaveTypeId', e.target.value)}
                              className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                              required
                            >
                              <option value="">Select Leave Type</option>
                              {leaveTypes.map(lt => (
                                <option key={lt.id} value={lt.id}>{lt.name}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                              Start Date (Past Allowed) <span className="text-rose-500">*</span>
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
                              End Date
                            </label>
                            <input
                              type="date"
                              value={row.isHalfDay ? row.startDate : row.endDate}
                              disabled={row.isHalfDay}
                              onChange={(e) => handleRowChange(idx, 'endDate', e.target.value)}
                              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white disabled:opacity-50"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                          <div className="flex items-center gap-4 text-xs">
                            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-gray-700 dark:text-gray-300">
                              <input
                                type="checkbox"
                                checked={row.isHalfDay}
                                onChange={(e) => handleRowChange(idx, 'isHalfDay', e.target.checked)}
                              />
                              <span>Half Day</span>
                            </label>
                            {row.isHalfDay && (
                              <select
                                value={row.halfDayPeriod}
                                onChange={(e) => handleRowChange(idx, 'halfDayPeriod', e.target.value)}
                                className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                              >
                                <option value="First Half">First Half</option>
                                <option value="Second Half">Second Half</option>
                              </select>
                            )}
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
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:border-purple-300 hover:text-purple-600 dark:border-gray-800 dark:text-gray-400 dark:hover:border-purple-700 transition-colors"
                  >
                    + Click to Add More Row
                  </button>
                </div>
              )}

              {/* Notice Banner */}
              <div className="rounded-xl bg-purple-50/70 p-3.5 border border-purple-100 dark:bg-purple-950/20 dark:border-purple-900/50 flex items-start gap-2.5 text-xs text-purple-900 dark:text-purple-300">
                <CheckCircleIcon className="w-4 h-4 shrink-0 mt-0.5 text-purple-600" />
                <div>
                  <strong>Automatic Approval System:</strong> All records created by administrators bypass pending queues, are immediately set to status <strong>"Approved"</strong> with comment <strong>"Admin: auto Approved"</strong>, and deduct the corresponding employee's leave balance in DB.
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
                  className="rounded-xl bg-gradient-to-r from-[#3c50e0] to-[#5a6ff0] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50"
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

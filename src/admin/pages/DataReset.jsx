import React, { useState, useEffect, useMemo } from 'react';

export default function DataReset({
  currentUser,
  currentTenantId,
  employees = [],
  fetchEmployees,
  onNavigate
}) {
  const API_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5002' : 'https://hrms-backend-5xo8.onrender.com');
  const orgId = currentTenantId || currentUser?.organization_id || 1;

  // Filter out superadmins and organization admins so only actual non-admin employees are shown in dropdown and counted
  const visibleEmployees = useMemo(() => {
    return employees.filter(e => {
      const role = (e.role_name || e.roleKey || e.role_key || e.role || '').toLowerCase();
      const code = (e.employee_code || '').toLowerCase();
      const email = (e.email || '').toLowerCase();
      const name = (e.full_name || `${e.first_name || ''} ${e.last_name || ''}`).toLowerCase();

      const isSuperAdmin = (
        role.includes('super_admin') || 
        role.includes('superadmin') || 
        code.includes('emp-super') || 
        email.includes('superadmin') || 
        name.includes('super administrator')
      );

      const isOrgAdmin = (
        role.includes('org_admin') || 
        role.includes('organization admin') || 
        role === 'admin' || 
        code.includes('emp-admin') || 
        code === 'emp001' || 
        email.startsWith('admin@') || 
        (currentUser?.id && (String(e.user_id) === String(currentUser.id) || String(e.id) === String(currentUser.id)))
      );

      return !isSuperAdmin && !isOrgAdmin;
    });
  }, [employees, currentUser]);

  // State
  const [targetType, setTargetType] = useState('single'); // 'single' or 'all'
  const [selectedEmpIds, setSelectedEmpIds] = useState([]);
  const [currentEmpSelect, setCurrentEmpSelect] = useState('');
  const [selectedModules, setSelectedModules] = useState([]);
  const [counts, setCounts] = useState(null);
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '', details: {} }
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');

  // Helper to reliably retrieve employee display name
  const getEmpName = (emp) => {
    if (!emp) return '';
    const full = (emp.full_name || '').trim();
    if (full && full.toLowerCase() !== 'new hire') return full;
    const combined = `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
    if (combined) return combined;
    if (emp.name) return emp.name;
    if (emp.email) return emp.email.split('@')[0];
    return emp.employee_code || 'Employee';
  };

  // Initial selection (restores previous employee selection if available)
  useEffect(() => {
    if (visibleEmployees.length > 0 && selectedEmpIds.length === 0) {
      let saved = null;
      try {
        const raw = localStorage.getItem('data_reset_selected_emp');
        if (raw) saved = JSON.parse(raw);
      } catch (e) {}

      if (Array.isArray(saved) && saved.length > 0 && saved.every(id => visibleEmployees.some(e => String(e.id) === String(id)))) {
        setSelectedEmpIds(saved);
        setCurrentEmpSelect(saved[0]);
      } else {
        const firstId = String(visibleEmployees[0].id);
        setSelectedEmpIds([firstId]);
        setCurrentEmpSelect(firstId);
      }
    }
  }, [visibleEmployees.length]);

  const handleSelectEmployee = (val) => {
    setCurrentEmpSelect(val);
    if (val) {
      setSelectedEmpIds([String(val)]);
    } else {
      setSelectedEmpIds([]);
    }
  };

  const handleAddEmployee = (empId) => {
    if (!empId) return;
    const strId = String(empId);
    if (!selectedEmpIds.includes(strId)) {
      setSelectedEmpIds(prev => [...prev, strId]);
    }
  };

  const handleRemoveEmployee = (empId) => {
    setSelectedEmpIds(prev => {
      const next = prev.filter(id => id !== String(empId));
      if (next.length === 1) {
        setCurrentEmpSelect(next[0]);
      } else if (next.length === 0) {
        setCurrentEmpSelect('');
      }
      return next;
    });
  };

  // Fetch count preview whenever target or employees change
  useEffect(() => {
    fetchCountsPreview();
  }, [targetType, selectedEmpIds, orgId]);

  const fetchCountsPreview = async () => {
    if (targetType === 'single' && selectedEmpIds.length === 0) {
      setCounts(null);
      return;
    }
    setLoadingCounts(true);
    try {
      const queryParams = new URLSearchParams({
        targetType,
        organizationId: orgId,
        ...(targetType === 'single' ? { employeeIds: selectedEmpIds.join(',') } : {})
      });
      const res = await fetch(`${API_URL}/api/admin/data-reset/counts?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCounts(data);
      }
    } catch (err) {
      console.error('Failed to fetch counts preview:', err);
    } finally {
      setLoadingCounts(false);
    }
  };



  const moduleDefinitions = [
    {
      id: 'attendance',
      name: 'Attendance Records',
      icon: 'bi-clock-history',
      color: 'blue',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
      description: 'Clock-in / Clock-out punches, working hours, punch device, location, and attendance corrections.',
      countKey: 'attendance'
    },
    {
      id: 'leaves',
      name: 'Leaves & Balances',
      icon: 'bi-calendar2-minus',
      color: 'purple',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300',
      description: 'Leave requests history, approvals, and resets used/pending leave days back to allocated balance.',
      countKey: 'leaves'
    },
    {
      id: 'wfh',
      name: 'Work From Home (WFH)',
      icon: 'bi-house-door',
      color: 'emerald',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300',
      description: 'Submitted Work From Home applications, remote dates, and WFH approval records.',
      countKey: 'wfh'
    },
    {
      id: 'requests',
      name: 'Employee Tickets & Asset Requests',
      icon: 'bi-file-earmark-text',
      color: 'amber',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300',
      description: 'General HR requests, company equipment/asset requests, and helpdesk queries.',
      countKey: 'requests'
    },
    {
      id: 'expenses',
      name: 'Expenses & Claims',
      icon: 'bi-wallet2',
      color: 'rose',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300',
      description: 'Submitted reimbursement claims, expense receipts, and claim approval status.',
      countKey: 'expenses'
    },
    {
      id: 'firstlogin',
      name: 'First Login & Password Reset',
      icon: 'bi-shield-lock',
      color: 'indigo',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300',
      description: 'Resets employee account to first-time login state. Clears saved security questions, restores initial credentials (password123), and requires creating a new password upon their next login.',
      countKey: 'firstlogin'
    },
    {
      id: 'commute',
      name: 'Commute & Travel Records',
      icon: 'bi-car-front',
      color: 'teal',
      badgeBg: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300',
      description: 'Daily commute logs, transport mode, vehicle details, travel distance preferences, and commute approval requests.',
      countKey: 'commute'
    },
    {
      id: 'documents',
      name: 'Employee Documents & Uploads',
      icon: 'bi-file-earmark-arrow-up',
      color: 'cyan',
      badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300',
      description: 'Uploaded government ID proofs, education certificates, resumes, and HR verification files.',
      countKey: 'documents'
    },
    {
      id: 'skills',
      name: 'Skills & Certifications',
      icon: 'bi-award',
      color: 'violet',
      badgeBg: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300',
      description: 'Employee-submitted technical skills, proficiency levels, and professional certifications.',
      countKey: 'skills'
    }
  ];

  const toggleModule = (modId) => {
    setSelectedModules(prev =>
      prev.includes(modId) ? prev.filter(m => m !== modId) : [...prev, modId]
    );
  };

  const selectAllModules = () => {
    setSelectedModules(moduleDefinitions.map(m => m.id));
  };

  const deselectAllModules = () => {
    setSelectedModules([]);
  };

  const handleOpenConfirm = () => {
    if (selectedModules.length === 0) {
      setFeedback({ type: 'error', message: 'Please select at least one module to reset.' });
      return;
    }
    if (targetType === 'single' && selectedEmpIds.length === 0) {
      setFeedback({ type: 'error', message: 'Please select at least one employee.' });
      return;
    }
    setConfirmInput('');
    setShowConfirmModal(true);
  };

  const handleExecuteReset = async () => {
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/data-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          employeeIds: selectedEmpIds,
          organizationId: orgId,
          modules: selectedModules,
          adminUserId: currentUser?.id
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to execute data reset');
      }

      setShowConfirmModal(false);
      setFeedback({
        type: 'success',
        message: 'Data reset completed successfully! Refreshing page...',
        details: data.details || {}
      });

      // Immediately zero out the wiped module counts in local state so the UI reflects 0 instantly
      setCounts(prev => {
        if (!prev) return prev;
        const next = { ...prev };
        selectedModules.forEach(mod => {
          if (mod in next) next[mod] = 0;
        });
        return next;
      });

      // Save selected employee to localStorage so selection is preserved after reload
      try {
        if (selectedEmpIds.length > 0) {
          localStorage.setItem('data_reset_selected_emp', JSON.stringify(selectedEmpIds));
        }
      } catch (e) {}

      // Automatically refresh the page
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error('Data reset error:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'An error occurred while executing data reset.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400">
              <i className="bi bi-arrow-counterclockwise text-lg"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Data Reset & Cleanup
            </h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Reset module records employee-wise or for all employees across the organization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
            <i className="bi bi-exclamation-triangle-fill text-rose-500"></i>
            Irreversible Administrative Action
          </span>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          feedback.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200'
            : 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-200'
        }`}>
          <div className="mt-0.5 text-lg">
            {feedback.type === 'success' ? (
              <i className="bi bi-check-circle-fill text-emerald-600 dark:text-emerald-400"></i>
            ) : (
              <i className="bi bi-x-circle-fill text-rose-600 dark:text-rose-400"></i>
            )}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{feedback.message}</p>
            {feedback.details && Object.keys(feedback.details).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {feedback.details.attendance !== undefined && (
                  <span className="bg-white/80 dark:bg-black/30 px-2 py-1 rounded border border-emerald-300 dark:border-emerald-700 font-mono">
                    Attendance: {feedback.details.attendance} deleted
                  </span>
                )}
                {feedback.details.leaves !== undefined && (
                  <span className="bg-white/80 dark:bg-black/30 px-2 py-1 rounded border border-emerald-300 dark:border-emerald-700 font-mono">
                    Leaves: {feedback.details.leaves} deleted (balances reset: {feedback.details.leaveBalancesReset || 0})
                  </span>
                )}
                {feedback.details.wfh !== undefined && (
                  <span className="bg-white/80 dark:bg-black/30 px-2 py-1 rounded border border-emerald-300 dark:border-emerald-700 font-mono">
                    WFH: {feedback.details.wfh} deleted
                  </span>
                )}
                {feedback.details.requests !== undefined && (
                  <span className="bg-white/80 dark:bg-black/30 px-2 py-1 rounded border border-emerald-300 dark:border-emerald-700 font-mono">
                    Requests: {feedback.details.requests} deleted
                  </span>
                )}
                {feedback.details.expenses !== undefined && (
                  <span className="bg-white/80 dark:bg-black/30 px-2 py-1 rounded border border-emerald-300 dark:border-emerald-700 font-mono">
                    Expenses: {feedback.details.expenses} deleted
                  </span>
                )}
                {feedback.details.firstlogin !== undefined && (
                  <span className="bg-white/80 dark:bg-black/30 px-2 py-1 rounded border border-emerald-300 dark:border-emerald-700 font-mono">
                    First Login Reset: {feedback.details.firstlogin} account(s)
                  </span>
                )}
                {feedback.details.commute !== undefined && (
                  <span className="bg-white/80 dark:bg-black/30 px-2 py-1 rounded border border-emerald-300 dark:border-emerald-700 font-mono">
                    Commute & Travel: {feedback.details.commute} deleted
                  </span>
                )}
                {feedback.details.documents !== undefined && (
                  <span className="bg-white/80 dark:bg-black/30 px-2 py-1 rounded border border-emerald-300 dark:border-emerald-700 font-mono">
                    Documents: {feedback.details.documents} deleted
                  </span>
                )}
                {feedback.details.skills !== undefined && (
                  <span className="bg-white/80 dark:bg-black/30 px-2 py-1 rounded border border-emerald-300 dark:border-emerald-700 font-mono">
                    Skills & Certifications: {feedback.details.skills} deleted
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      )}

      {/* Main Grid: Target Scope & Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Scope Selection (4 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold dark:bg-blue-900/60 dark:text-blue-300">
                1
              </span>
              Select Target Scope
            </h3>

            {/* Target Type Radio Options */}
            <div className="space-y-3 mb-5">
              <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                targetType === 'single'
                  ? 'border-[#3c50e0] bg-indigo-50/40 dark:bg-indigo-950/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-800'
              }`}>
                <input
                  type="radio"
                  name="targetType"
                  value="single"
                  checked={targetType === 'single'}
                  onChange={() => setTargetType('single')}
                  className="mt-1 text-[#3c50e0] focus:ring-[#3c50e0]"
                />
                <div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Specific Employee(s)
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Reset data for one or more chosen employees only.
                  </div>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                targetType === 'all'
                  ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-800'
              }`}>
                <input
                  type="radio"
                  name="targetType"
                  value="all"
                  checked={targetType === 'all'}
                  onChange={() => setTargetType('all')}
                  className="mt-1 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                    All Employees (Entire Organization)
                    <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-1.5 py-0.5 rounded dark:bg-rose-900/50 dark:text-rose-300">
                      ALL
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Wipes data across all {visibleEmployees.length} active employees at once.
                  </div>
                </div>
              </label>
            </div>

            {/* If Single Employee selected */}
            {targetType === 'single' && (
              <div className="space-y-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                    Select Employee
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={currentEmpSelect}
                      onChange={(e) => handleSelectEmployee(e.target.value)}
                      className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:border-[#3c50e0] focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">-- Choose Employee --</option>
                      {visibleEmployees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.employee_code} - {getEmpName(emp)} ({emp.designation || emp.role_name || 'Staff'})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => handleAddEmployee(currentEmpSelect)}
                      disabled={!currentEmpSelect || selectedEmpIds.includes(currentEmpSelect)}
                      className="px-3 py-2 bg-indigo-50 text-[#3c50e0] rounded-xl text-xs font-semibold hover:bg-indigo-100 disabled:opacity-50 dark:bg-indigo-950/40 dark:text-indigo-300"
                      title="Add more employees"
                    >
                      <i className="bi bi-plus-lg me-1"></i> Add More
                    </button>
                  </div>
                </div>

                {/* Selected Employees Tag List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Selected Employees ({selectedEmpIds.length}):
                    </span>
                    {selectedEmpIds.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setSelectedEmpIds([])}
                        className="text-[11px] text-rose-500 hover:underline"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
                    {selectedEmpIds.length === 0 ? (
                      <span className="text-xs text-gray-400 italic p-1">No employee selected yet.</span>
                    ) : (
                      selectedEmpIds.map(id => {
                        const emp = visibleEmployees.find(e => String(e.id) === String(id));
                        const name = emp ? getEmpName(emp) : `Emp #${id}`;
                        const code = emp?.employee_code || '';
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-800 rounded-lg px-2.5 py-1 text-xs shadow-xs dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                          >
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{code}</span>
                            <span>{name}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveEmployee(id)}
                              className="text-gray-400 hover:text-rose-500 ms-0.5"
                            >
                              <i className="bi bi-x"></i>
                            </button>
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* If All Employees selected */}
            {targetType === 'all' && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <i className="bi bi-exclamation-triangle-fill text-amber-600"></i>
                  Organization-Wide Scope Active
                </div>
                Resetting will apply to all <strong>{visibleEmployees.length} employees</strong> in this tenant organization.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Module Selection & Reset Action (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold dark:bg-blue-900/60 dark:text-blue-300">
                  2
                </span>
                Select Modules to Reset
              </h3>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={selectAllModules}
                  className="font-semibold text-[#3c50e0] hover:underline"
                >
                  Select All
                </button>
                <span className="text-gray-300 dark:text-gray-700">|</span>
                <button
                  type="button"
                  onClick={deselectAllModules}
                  className="font-semibold text-gray-500 hover:underline dark:text-gray-400"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Modules List Checkboxes */}
            <div className="space-y-3">
              {moduleDefinitions.map((mod) => {
                const isChecked = selectedModules.includes(mod.id);
                const countVal = counts ? counts[mod.countKey] : null;

                return (
                  <label
                    key={mod.id}
                    className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? 'border-indigo-400 bg-indigo-50/30 dark:border-indigo-700 dark:bg-indigo-950/20'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleModule(mod.id)}
                      className="mt-1 h-4 w-4 rounded text-[#3c50e0] focus:ring-[#3c50e0] border-gray-300"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <i className={`bi ${mod.icon} text-base text-gray-700 dark:text-gray-300`}></i>
                          <span className="font-semibold text-sm text-gray-900 dark:text-white">
                            {mod.name}
                          </span>
                        </div>

                        {countVal !== null && (
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${mod.badgeBg}`}>
                            {loadingCounts ? '...' : `${countVal} records`}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                        {mod.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Reset Execution Bar */}
            <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between flex-wrap gap-4">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <strong>{selectedModules.length}</strong> module(s) selected for{' '}
                <strong className="text-gray-800 dark:text-gray-200">
                  {targetType === 'all' ? 'All Employees' : `${selectedEmpIds.length} Employee(s)`}
                </strong>
              </div>

              <button
                type="button"
                onClick={handleOpenConfirm}
                disabled={selectedModules.length === 0 || (targetType === 'single' && selectedEmpIds.length === 0)}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-rose-600/20 flex items-center gap-2 transition-all"
              >
                <i className="bi bi-trash3-fill"></i>
                Reset Selected Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                <i className="bi bi-exclamation-triangle-fill text-2xl"></i>
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                  Confirm Data Reset
                </h4>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                  This permanent action will wipe records from the database.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200/60 dark:border-gray-700 text-xs space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Target Scope:</span>
                <strong className="text-gray-900 dark:text-white">
                  {targetType === 'all' 
                    ? `All Employees in Organization (${visibleEmployees.length})` 
                    : selectedEmpIds.map(id => {
                        const emp = visibleEmployees.find(e => String(e.id) === String(id));
                        return emp ? `${getEmpName(emp)} (${emp.employee_code})` : `Emp #${id}`;
                      }).join(', ')
                  }
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Modules to Wipe:</span>
                <strong className="text-rose-600 dark:text-rose-400 text-right capitalize">
                  {selectedModules.map(m => moduleDefinitions.find(d => d.id === m)?.name || m).join(', ')}
                </strong>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 mb-5 leading-relaxed">
              Are you sure you want to permanently reset this data? This action will immediately delete the selected module records from the database and cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteReset}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 shadow-md shadow-rose-600/30 flex items-center gap-2 cursor-pointer transition-all"
              >
                {submitting ? (
                  <>
                    <div className="spinner-border spinner-border-sm" role="status"></div>
                    Resetting Data...
                  </>
                ) : (
                  <>
                    <i className="bi bi-trash3-fill"></i>
                    Yes, Permanently Reset Data
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

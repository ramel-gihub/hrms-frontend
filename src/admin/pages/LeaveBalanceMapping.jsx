import React, { useState, useEffect, useMemo } from 'react';
import { LayersIcon, CheckCircleIcon, SparklesIcon, CalendarIcon, PlusIcon, CloseIcon, SearchIcon } from '../components/Icons';
import Pagination from '../components/Pagination';

export default function LeaveBalanceMapping({
  currentTenantId = 1,
  currentUser,
  onBalancesMapped
}) {
  // Current calendar year (Jan to Dec cycle)
  const currentCalYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentCalYear);
  const availableYears = [currentCalYear - 1, currentCalYear, currentCalYear + 1, currentCalYear + 2];

  // Navigation sub-tab: 'types' | 'mapping' | 'compoff_history'
  const [activeSubTab, setActiveSubTab] = useState('types');

  // Master Leave Types State
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(false);

  // Leave Type Modals (Add / Edit)
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [showEditTypeModal, setShowEditTypeModal] = useState(false);
  const [typeForm, setTypeForm] = useState({ 
    name: '', 
    defaultDays: '12', 
    carryForwardAllowed: true, 
    maxCarryForward: '5', 
    autoMap: true 
  });
  const [editingType, setEditingType] = useState(null);
  const [syncExistingOnEdit, setSyncExistingOnEdit] = useState(true);
  const [savingType, setSavingType] = useState(false);

  // Employee Balances Overview State
  const [employeesOverview, setEmployeesOverview] = useState([]);
  const [unmappedEmployees, setUnmappedEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [selectedEmpIds, setSelectedEmpIds] = useState([]);
  const [mappingInProgress, setMappingInProgress] = useState(false);
  const [mappingSingleId, setMappingSingleId] = useState(null);

  // Filters for Employee Mapping Table
  const [searchQuery, setSearchQuery] = useState('');
  const [mappingFilter, setMappingFilter] = useState('ALL'); // ALL, FULLY_MAPPED, UNMAPPED

  // Custom Employee Balance Edit Modal
  const [editingEmpBalance, setEditingEmpBalance] = useState(null); // employee object
  const [customBalanceForm, setCustomBalanceForm] = useState({
    leaveTypeId: '',
    totalDays: '12',
    usedDays: '0'
  });
  const [savingCustomBalance, setSavingCustomBalance] = useState(false);

  // Year-End Carry Forward Modal
  const [showCarryForwardModal, setShowCarryForwardModal] = useState(false);
  const [carryForwardForm, setCarryForwardForm] = useState({
    fromYear: currentCalYear,
    toYear: currentCalYear + 1
  });
  const [rollingOver, setRollingOver] = useState(false);

  // Compensatory Leave (Comp-Off for Weekend Work) Modal
  const [showCompOffModal, setShowCompOffModal] = useState(false);
  const [compOffForm, setCompOffForm] = useState({
    employeeId: '',
    leaveTypeId: '',
    daysCredited: '1',
    workDate: new Date().toISOString().split('T')[0],
    reason: ''
  });
  const [savingCompOff, setSavingCompOff] = useState(false);

  // Compensatory History
  const [compOffHistory, setCompOffHistory] = useState([]);
  const [loadingCompOffHistory, setLoadingCompOffHistory] = useState(false);

  // Feedback Notification
  const [feedbackMsg, setFeedbackMsg] = useState(null); // { type: 'success' | 'error', text: '' }

  // Pagination states for all 3 sub-tabs
  const [typesPage, setTypesPage] = useState(1);
  const [typesPageSize, setTypesPageSize] = useState(10);

  const [empPage, setEmpPage] = useState(1);
  const [empPageSize, setEmpPageSize] = useState(10);

  const [compOffPage, setCompOffPage] = useState(1);
  const [compOffPageSize, setCompOffPageSize] = useState(10);

  const API_URL = import.meta.env.VITE_API_URL || 
    (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:5002'
      : 'https://hrms-backend-5xo8.onrender.com');

  const showFeedback = (type, text) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 6000);
  };

  // 1. Fetch Leave Types Master
  const fetchLeaveTypes = async () => {
    setLoadingTypes(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/leave-types?orgId=${currentTenantId}`);
      const data = await res.json();
      if (data && Array.isArray(data.leaveTypes)) {
        setLeaveTypes(data.leaveTypes);
      }
    } catch (err) {
      console.error('Error fetching leave types:', err);
      showFeedback('error', 'Failed to load leave types configuration.');
    } finally {
      setLoadingTypes(false);
    }
  };

  // 2. Fetch Employee Leave Balances Overview for Selected Year
  const fetchEmployeesOverview = async () => {
    setLoadingEmployees(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/employee-leave-balances-overview?orgId=${currentTenantId}&year=${selectedYear}`);
      const data = await res.json();
      if (data && Array.isArray(data.employees)) {
        const validEmployees = data.employees.filter(e => {
          const email = (e.email || '').toLowerCase();
          const code = (e.employee_code || '').toLowerCase();
          return !email.includes('superadmin') && !code.includes('emp-super');
        });
        setEmployeesOverview(validEmployees);
      }
    } catch (err) {
      console.error('Error fetching employee leave balances overview:', err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // 3. Fetch Unmapped Employees
  const fetchUnmappedEmployees = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/unmapped-leave-balances?orgId=${currentTenantId}`);
      const data = await res.json();
      if (data && Array.isArray(data.unmappedEmployees)) {
        const filtered = data.unmappedEmployees.filter(e => {
          const email = (e.email || '').toLowerCase();
          const code = (e.employee_code || '').toLowerCase();
          return !email.includes('superadmin') && !code.includes('emp-super');
        });
        setUnmappedEmployees(filtered);
        setSelectedEmpIds(prev => prev.filter(id => filtered.some(e => e.employee_id === id)));
      }
    } catch (err) {
      console.error('Error fetching unmapped employees:', err);
    }
  };

  // 4. Fetch Compensatory Leave History
  const fetchCompOffHistory = async () => {
    setLoadingCompOffHistory(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/compensatory-leave/history?orgId=${currentTenantId}&year=${selectedYear}`);
      const data = await res.json();
      if (data && Array.isArray(data.credits)) {
        setCompOffHistory(data.credits);
      }
    } catch (err) {
      console.error('Error fetching comp-off history:', err);
    } finally {
      setLoadingCompOffHistory(false);
    }
  };

  const refreshAllData = async () => {
    await Promise.all([
      fetchLeaveTypes(), 
      fetchEmployeesOverview(), 
      fetchUnmappedEmployees(),
      fetchCompOffHistory()
    ]);
  };

  useEffect(() => {
    refreshAllData();
  }, [currentTenantId, selectedYear]);

  // Handle Add New Leave Type
  const handleCreateLeaveType = async (e) => {
    e.preventDefault();
    if (!typeForm.name.trim()) {
      showFeedback('error', 'Please enter a valid leave type name.');
      return;
    }

    setSavingType(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/leave-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: currentTenantId,
          name: typeForm.name.trim(),
          defaultDays: parseFloat(typeForm.defaultDays) || 0,
          carryForwardAllowed: typeForm.carryForwardAllowed,
          maxCarryForward: parseFloat(typeForm.maxCarryForward) || 5,
          autoMapToEmployees: typeForm.autoMap
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create leave type');

      showFeedback('success', `Leave Type "${typeForm.name}" created! ${data.mappedCount ? `Mapped to ${data.mappedCount} employee(s).` : ''}`);
      setShowAddTypeModal(false);
      setTypeForm({ name: '', defaultDays: '12', carryForwardAllowed: true, maxCarryForward: '5', autoMap: true });
      await refreshAllData();
      if (onBalancesMapped) onBalancesMapped();
    } catch (err) {
      showFeedback('error', err.message);
    } finally {
      setSavingType(false);
    }
  };

  // Open Edit Leave Type
  const openEditLeaveType = (lt) => {
    setEditingType(lt);
    setTypeForm({
      name: lt.name || '',
      defaultDays: String(lt.default_days || 12),
      carryForwardAllowed: lt.carry_forward_allowed !== false,
      maxCarryForward: String(lt.max_carry_forward !== undefined ? lt.max_carry_forward : 5),
      autoMap: false
    });
    setSyncExistingOnEdit(true);
    setShowEditTypeModal(true);
  };

  // Handle Update Leave Type
  const handleUpdateLeaveType = async (e) => {
    e.preventDefault();
    if (!editingType) return;

    setSavingType(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/leave-types/${editingType.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: currentTenantId,
          name: typeForm.name.trim(),
          defaultDays: parseFloat(typeForm.defaultDays) || 0,
          carryForwardAllowed: typeForm.carryForwardAllowed,
          maxCarryForward: parseFloat(typeForm.maxCarryForward) || 5,
          syncExistingBalances: syncExistingOnEdit
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update leave type');

      showFeedback('success', `Leave Type "${typeForm.name}" updated successfully! ${data.updatedBalancesCount ? `Updated ${data.updatedBalancesCount} employee balance records.` : ''}`);
      setShowEditTypeModal(false);
      setEditingType(null);
      await refreshAllData();
      if (onBalancesMapped) onBalancesMapped();
    } catch (err) {
      showFeedback('error', err.message);
    } finally {
      setSavingType(false);
    }
  };

  // Handle Delete Leave Type
  const handleDeleteLeaveType = async (lt) => {
    if (!window.confirm(`Are you sure you want to delete the leave type "${lt.name}" (${lt.default_days} days)? All associated employee balances for this type will be removed.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/admin/leave-types/${lt.id}?orgId=${currentTenantId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete leave type');

      showFeedback('success', data.message || `Leave type "${lt.name}" deleted.`);
      await refreshAllData();
      if (onBalancesMapped) onBalancesMapped();
    } catch (err) {
      showFeedback('error', err.message);
    }
  };

  // Handle Year-End Carry Forward Rollover
  const handleExecuteCarryForward = async (e) => {
    e.preventDefault();
    const { fromYear, toYear } = carryForwardForm;
    if (fromYear >= toYear) {
      showFeedback('error', 'Target year must be greater than source year.');
      return;
    }

    if (!window.confirm(`Execute Year-End Carry Forward from ${fromYear} to ${toYear} (Jan-Dec Calendar Year)? Unused leaves up to 5 days per category will be carried forward to each employee's ${toYear} quota.`)) {
      return;
    }

    setRollingOver(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/leave-balances/carry-forward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: currentTenantId,
          fromYear: parseInt(fromYear, 10),
          toYear: parseInt(toYear, 10)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to execute carry forward');

      showFeedback('success', data.message);
      setShowCarryForwardModal(false);
      setSelectedYear(parseInt(toYear, 10));
      await refreshAllData();
      if (onBalancesMapped) onBalancesMapped();
    } catch (err) {
      showFeedback('error', err.message);
    } finally {
      setRollingOver(false);
    }
  };

  // Handle Compensatory Leave (Comp-Off for Weekend Work) Submit
  const handleCreditCompOff = async (e) => {
    e.preventDefault();
    if (!compOffForm.employeeId) {
      showFeedback('error', 'Please select an employee.');
      return;
    }
    if (!compOffForm.workDate) {
      showFeedback('error', 'Please select the weekend or holiday date worked.');
      return;
    }

    setSavingCompOff(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/compensatory-leave/credit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: currentTenantId,
          employeeId: parseInt(compOffForm.employeeId, 10),
          leaveTypeId: compOffForm.leaveTypeId ? parseInt(compOffForm.leaveTypeId, 10) : null,
          daysCredited: parseFloat(compOffForm.daysCredited) || 1,
          workDate: compOffForm.workDate,
          reason: compOffForm.reason.trim(),
          adminUserId: currentUser?.id,
          year: selectedYear
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to credit compensatory leave');

      showFeedback('success', data.message || 'Compensatory leave credited successfully!');
      setShowCompOffModal(false);
      setCompOffForm({
        employeeId: '',
        leaveTypeId: '',
        daysCredited: '1',
        workDate: new Date().toISOString().split('T')[0],
        reason: ''
      });
      await refreshAllData();
      if (onBalancesMapped) onBalancesMapped();
    } catch (err) {
      showFeedback('error', err.message);
    } finally {
      setSavingCompOff(false);
    }
  };

  // Toggle selection for unmapped employees
  const handleToggleSelectAll = () => {
    if (selectedEmpIds.length === unmappedEmployees.length) {
      setSelectedEmpIds([]);
    } else {
      setSelectedEmpIds(unmappedEmployees.map(e => e.employee_id));
    }
  };

  const handleToggleSelectEmp = (empId) => {
    setSelectedEmpIds(prev => 
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  // Bulk Auto Map balances
  const handleAutoMap = async (empIdsToMap) => {
    if (!empIdsToMap || empIdsToMap.length === 0) return;
    setMappingInProgress(true);
    if (empIdsToMap.length === 1) setMappingSingleId(empIdsToMap[0]);

    try {
      const res = await fetch(`${API_URL}/api/admin/map-leave-balances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeIds: empIdsToMap,
          orgId: currentTenantId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to map leave balances');

      showFeedback('success', `Successfully auto-mapped leave balances for ${data.mappedCount || empIdsToMap.length} employee(s)!`);
      setSelectedEmpIds([]);
      await refreshAllData();
      if (onBalancesMapped) onBalancesMapped();
    } catch (err) {
      showFeedback('error', err.message || 'Error occurred while mapping leave balances');
    } finally {
      setMappingInProgress(false);
      setMappingSingleId(null);
    }
  };

  // Open Custom Employee Balance Edit Modal
  const openCustomBalanceModal = (emp) => {
    setEditingEmpBalance(emp);
    const firstBalance = emp.balances && emp.balances[0];
    const initialLtId = firstBalance ? String(firstBalance.leave_type_id) : (leaveTypes[0] ? String(leaveTypes[0].id) : '');
    const matchedBal = (emp.balances || []).find(b => String(b.leave_type_id) === initialLtId);

    setCustomBalanceForm({
      leaveTypeId: initialLtId,
      totalDays: matchedBal ? String(matchedBal.total_days) : (leaveTypes[0] ? String(leaveTypes[0].default_days) : '12'),
      usedDays: matchedBal ? String(matchedBal.used_days) : '0'
    });
  };

  const handleCustomLtChange = (ltId) => {
    const matchedBal = (editingEmpBalance?.balances || []).find(b => String(b.leave_type_id) === String(ltId));
    const matchedLt = leaveTypes.find(lt => String(lt.id) === String(ltId));

    setCustomBalanceForm({
      leaveTypeId: ltId,
      totalDays: matchedBal ? String(matchedBal.total_days) : (matchedLt ? String(matchedLt.default_days) : '12'),
      usedDays: matchedBal ? String(matchedBal.used_days) : '0'
    });
  };

  // Save Custom Employee Balance
  const handleSaveCustomBalance = async (e) => {
    e.preventDefault();
    if (!editingEmpBalance || !customBalanceForm.leaveTypeId) return;

    setSavingCustomBalance(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/employee-leave-balances/custom`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: editingEmpBalance.employee_id,
          leaveTypeId: parseInt(customBalanceForm.leaveTypeId, 10),
          totalDays: parseFloat(customBalanceForm.totalDays) || 0,
          usedDays: parseFloat(customBalanceForm.usedDays) || 0,
          year: selectedYear
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update employee leave quota');

      showFeedback('success', `Updated ${selectedYear} leave quota for ${editingEmpBalance.employee_name || 'employee'} successfully!`);
      setEditingEmpBalance(null);
      await refreshAllData();
      if (onBalancesMapped) onBalancesMapped();
    } catch (err) {
      showFeedback('error', err.message);
    } finally {
      setSavingCustomBalance(false);
    }
  };

  // Quick open Comp-Off for a specific employee
  const quickOpenCompOff = (emp) => {
    const compLt = leaveTypes.find(lt => lt.name.toLowerCase().includes('compensat') || lt.name.toLowerCase().includes('comp'));
    setCompOffForm({
      employeeId: String(emp.employee_id),
      leaveTypeId: compLt ? String(compLt.id) : (leaveTypes[0] ? String(leaveTypes[0].id) : ''),
      daysCredited: '1',
      workDate: new Date().toISOString().split('T')[0],
      reason: 'Weekend work / overtime production deliverable'
    });
    setShowCompOffModal(true);
  };

  // Filtered employees for overview table
  const filteredEmployees = useMemo(() => {
    return employeesOverview.filter(emp => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        (emp.employee_name && emp.employee_name.toLowerCase().includes(q)) ||
        (emp.employee_code && emp.employee_code.toLowerCase().includes(q)) ||
        (emp.department && emp.department.toLowerCase().includes(q)) ||
        (emp.designation && emp.designation.toLowerCase().includes(q)) ||
        (emp.email && emp.email.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (mappingFilter === 'FULLY_MAPPED') return emp.is_fully_mapped;
      if (mappingFilter === 'UNMAPPED') return !emp.is_fully_mapped;
      return true;
    });
  }, [employeesOverview, searchQuery, mappingFilter]);

  const paginatedLeaveTypes = useMemo(() => {
    const start = (typesPage - 1) * typesPageSize;
    return leaveTypes.slice(start, start + typesPageSize);
  }, [leaveTypes, typesPage, typesPageSize]);

  const paginatedEmployees = useMemo(() => {
    const start = (empPage - 1) * empPageSize;
    return filteredEmployees.slice(start, start + empPageSize);
  }, [filteredEmployees, empPage, empPageSize]);

  const paginatedCompOffHistory = useMemo(() => {
    const start = (compOffPage - 1) * compOffPageSize;
    return compOffHistory.slice(start, start + compOffPageSize);
  }, [compOffHistory, compOffPage, compOffPageSize]);

  const totalLeaveTypes = leaveTypes.length;
  const fullyMappedCount = employeesOverview.filter(e => e.is_fully_mapped).length;
  const unmappedCount = employeesOverview.length - fullyMappedCount;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <LayersIcon className="w-6 h-6 text-[#3c50e0]" />
            Leave Policy Master & Balance Mapping
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure year-wise leaves (Jan to Dec cycle), carry forward (up to 5 days), and grant weekend work compensatory leaves (Comp-Off).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Year Selector */}
          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300 pl-2">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="bg-white dark:bg-gray-900 text-xs font-bold text-gray-800 dark:text-white rounded-lg px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-[#3c50e0]"
            >
              {availableYears.map(yr => (
                <option key={yr} value={yr}>
                  {yr} {yr === currentCalYear ? '(Current Jan-Dec)' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={refreshAllData}
            disabled={loadingTypes || loadingEmployees}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 transition-colors cursor-pointer"
            title="Refresh leave balances"
          >
            <i className="bi bi-arrow-clockwise"></i>
            Refresh
          </button>

          {/* Weekend Work Comp-Off Button */}
          <button
            onClick={() => {
              setCompOffForm({
                employeeId: employeesOverview[0] ? String(employeesOverview[0].employee_id) : '',
                leaveTypeId: '',
                daysCredited: '1',
                workDate: new Date().toISOString().split('T')[0],
                reason: 'Weekend work / overtime support'
              });
              setShowCompOffModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 shadow-xs hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 transition-colors cursor-pointer"
            title="Credit compensatory off for weekend or holiday work"
          >
            <i className="bi bi-gift-fill text-emerald-600 dark:text-emerald-400"></i>
            Credit Comp-Off
          </button>

          {/* Carry Forward Rollover Button */}
          <button
            onClick={() => {
              setCarryForwardForm({ fromYear: selectedYear, toYear: selectedYear + 1 });
              setShowCarryForwardModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 shadow-xs hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 transition-colors cursor-pointer"
            title="Carry forward unused leaves to next calendar year"
          >
            <i className="bi bi-arrow-right-circle-fill text-indigo-600 dark:text-indigo-400"></i>
            Carry Forward ({selectedYear} → {selectedYear + 1})
          </button>

          <button
            onClick={() => {
              setTypeForm({ name: '', defaultDays: '12', carryForwardAllowed: true, maxCarryForward: '5', autoMap: true });
              setShowAddTypeModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#3c50e0] px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#3444c5] transition-all cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            Add Leave Type
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div className={`p-4 rounded-xl border text-sm flex items-center gap-2.5 animate-fadeIn shadow-xs ${
          feedbackMsg.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
            : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
        }`}>
          {feedbackMsg.type === 'success' ? (
            <CheckCircleIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <i className="bi bi-exclamation-triangle-fill text-rose-600 dark:text-rose-400 text-base shrink-0"></i>
          )}
          <span className="font-medium">{feedbackMsg.text}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-800">
          <span className="text-xs font-semibold text-gray-500 uppercase">Policy Cycle</span>
          <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mt-1.5 flex items-center justify-between">
            Jan - Dec {selectedYear}
            <i className="bi bi-calendar-range text-indigo-500 text-xl font-normal"></i>
          </h3>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-1 inline-block">
            Calendar Year Cycle Active
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-800">
          <span className="text-xs font-semibold text-gray-500 uppercase">Configured Leave Types</span>
          <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1.5 flex items-center justify-between">
            {totalLeaveTypes}
            <i className="bi bi-card-checklist text-blue-500 text-xl font-normal"></i>
          </h3>
          <span className="text-xs text-gray-400 mt-1 inline-block">Annual quota categories</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-800">
          <span className="text-xs font-semibold text-gray-500 uppercase">Carry-Forward Limit</span>
          <h3 className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1.5 flex items-center justify-between">
            Max 5.0 Days
            <i className="bi bi-forward-fill text-indigo-500 text-xl font-normal"></i>
          </h3>
          <span className="text-xs text-gray-400 mt-1 inline-block">Rollover cap to next calendar year</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-800">
          <span className="text-xs font-semibold text-gray-500 uppercase">Weekend Comp-Offs Credited</span>
          <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center justify-between">
            {compOffHistory.length}
            <i className="bi bi-gift text-emerald-500 text-xl font-normal"></i>
          </h3>
          <span className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1 inline-block">Weekend work credits granted</span>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-800 flex items-center gap-6">
        <button
          onClick={() => setActiveSubTab('types')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'types'
              ? 'border-[#3c50e0] text-[#3c50e0] dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          <i className="bi bi-sliders text-base"></i>
          <span>Leave Types Policy Master</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-extrabold">
            {leaveTypes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('mapping')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'mapping'
              ? 'border-[#3c50e0] text-[#3c50e0] dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          <LayersIcon className="w-4 h-4" />
          <span>Employee Quota Allocation ({selectedYear})</span>
          {unmappedCount > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-amber-500 text-white font-extrabold animate-pulse">
              {unmappedCount} Unmapped
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('compoff_history')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'compoff_history'
              ? 'border-[#3c50e0] text-[#3c50e0] dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          <i className="bi bi-gift-fill text-emerald-600 dark:text-emerald-400"></i>
          <span>Weekend Work Comp-Off Credits Log</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold">
            {compOffHistory.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LEAVE TYPES POLICY MASTER */}
      {/* ========================================================================= */}
      {activeSubTab === 'types' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Leave Types Policy & Carry-Forward Rules</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Configure annual quotas (Jan - Dec) and specify carry forward limits (max 5 days) for each category.
              </p>
            </div>
            <button
              onClick={() => {
                setTypeForm({ name: '', defaultDays: '12', carryForwardAllowed: true, maxCarryForward: '5', autoMap: true });
                setShowAddTypeModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-bold dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300 transition-colors cursor-pointer"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Add New Category
            </button>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50/75 text-xs uppercase font-semibold text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
                  <tr>
                    <th className="px-5 py-3.5">Leave Type Name</th>
                    <th className="px-5 py-3.5 text-center">Annual Quota (Default)</th>
                    <th className="px-5 py-3.5 text-center">Carry-Forward Allowed</th>
                    <th className="px-5 py-3.5 text-center">Max Carry-Forward</th>
                    <th className="px-5 py-3.5 text-center">Assigned Employees</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {loadingTypes ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-sm text-gray-400">
                        Loading leave types...
                      </td>
                    </tr>
                  ) : leaveTypes.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-sm text-gray-400">
                        No leave types configured for this organization yet. Click "Add Leave Type" to set one up.
                      </td>
                    </tr>
                  ) : (
                    paginatedLeaveTypes.map((lt) => {
                      const daysVal = parseFloat(lt.default_days) || 0;
                      const isCarryAllowed = lt.carry_forward_allowed !== false;
                      const maxCarry = parseFloat(lt.max_carry_forward) >= 0 ? parseFloat(lt.max_carry_forward) : 5;

                      return (
                        <tr key={lt.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-bold text-sm">
                                {lt.name ? lt.name.charAt(0) : 'L'}
                              </span>
                              <div>
                                <span className="font-bold text-gray-900 dark:text-white block">{lt.name}</span>
                                <span className="text-[11px] text-gray-400">ID #{lt.id}</span>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3.5 text-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              {daysVal % 1 === 0 ? Math.round(daysVal) : daysVal.toFixed(1)} Days / Year
                            </span>
                          </td>

                          <td className="px-5 py-3.5 text-center">
                            {isCarryAllowed ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <i className="bi bi-check-circle-fill"></i>
                                Allowed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                <i className="bi bi-x-circle-fill"></i>
                                Lapsed Year-End
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-3.5 text-center">
                            {isCarryAllowed ? (
                              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                                Up to {maxCarry % 1 === 0 ? Math.round(maxCarry) : maxCarry.toFixed(1)} Days
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">--</span>
                            )}
                          </td>

                          <td className="px-5 py-3.5 text-center">
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                              {lt.assigned_employees_count || 0} Staff
                            </span>
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditLeaveType(lt)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                                title="Edit leave type name and quota"
                              >
                                <i className="bi bi-pencil-square"></i>
                                Edit
                              </button>

                              <button
                                onClick={() => handleDeleteLeaveType(lt)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="Delete this leave type"
                              >
                                <i className="bi bi-trash"></i>
                                Delete
                              </button>
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
                currentPage={typesPage}
                totalItems={leaveTypes.length}
                pageSize={typesPageSize}
                onPageChange={setTypesPage}
                onPageSizeChange={setTypesPageSize}
                itemLabel="leave categories"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EMPLOYEE QUOTA ALLOCATION & MAPPING */}
      {/* ========================================================================= */}
      {activeSubTab === 'mapping' && (
        <div className="space-y-4">
          {/* Unmapped Notification & One-Click Fix Banner */}
          {unmappedEmployees.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white font-bold text-sm shadow-xs">
                  {unmappedEmployees.length}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                    {unmappedEmployees.length} employee{unmappedEmployees.length > 1 ? 's have' : ' has'} missing leave quotas
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    Click Auto-Map to allocate all configured default leave balances (Annual, Sick, Casual, Paid) instantly.
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleAutoMap(selectedEmpIds.length > 0 ? selectedEmpIds : unmappedEmployees.map(e => e.employee_id))}
                disabled={mappingInProgress}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
              >
                <SparklesIcon className="w-4 h-4" />
                {mappingInProgress ? 'Mapping Balances...' : selectedEmpIds.length > 0 ? `Auto Map Selected (${selectedEmpIds.length})` : `Auto Map All (${unmappedEmployees.length})`}
              </button>
            </div>
          )}

          {/* Search & Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <SearchIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search staff by name, code, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3.5 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-[#3c50e0]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={mappingFilter}
                onChange={(e) => setMappingFilter(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 focus:outline-none"
              >
                <option value="ALL">All Status ({employeesOverview.length})</option>
                <option value="FULLY_MAPPED">Fully Mapped ({fullyMappedCount})</option>
                <option value="UNMAPPED">Missing Quotas ({unmappedCount})</option>
              </select>
            </div>
          </div>

          {/* Employees Table */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50/75 text-xs uppercase font-semibold text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={unmappedEmployees.length > 0 && selectedEmpIds.length === unmappedEmployees.length}
                        onChange={handleToggleSelectAll}
                        className="rounded border-gray-300 text-[#3c50e0] focus:ring-[#3c50e0] w-4 h-4 cursor-pointer"
                        title="Select all unmapped staff"
                      />
                    </th>
                    <th className="px-4 py-3.5">Employee</th>
                    <th className="px-4 py-3.5">Department & Role</th>
                    <th className="px-4 py-3.5">Allocated Leave Quotas ({selectedYear})</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {loadingEmployees ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-sm text-gray-400">
                        Loading employee quotas for {selectedYear}...
                      </td>
                    </tr>
                  ) : filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-sm text-gray-400">
                        No employees found matching the filter criteria for {selectedYear}.
                      </td>
                    </tr>
                  ) : (
                    paginatedEmployees.map((emp) => {
                      const isUnmapped = !emp.is_fully_mapped;
                      const isChecked = selectedEmpIds.includes(emp.employee_id);

                      return (
                        <tr
                          key={emp.employee_id}
                          className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors ${
                            isChecked ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                          }`}
                        >
                          <td className="px-4 py-3.5 text-center">
                            {isUnmapped ? (
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleSelectEmp(emp.employee_id)}
                                className="rounded border-gray-300 text-[#3c50e0] focus:ring-[#3c50e0] w-4 h-4 cursor-pointer"
                              />
                            ) : (
                              <span className="text-gray-300 dark:text-gray-700">✓</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3c50e0]/10 text-[#3c50e0] font-bold text-xs">
                                {emp.first_name ? emp.first_name.charAt(0) : 'E'}
                              </div>
                              <div>
                                <span className="font-bold text-gray-900 dark:text-white block">
                                  {emp.employee_name || 'Employee'}
                                </span>
                                <span className="text-[11px] text-gray-400">
                                  {emp.employee_code || `EMP-${emp.employee_id}`} · {emp.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 block">
                              {emp.department || 'General'}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              {emp.designation || 'Staff'}
                            </span>
                          </td>

                          {/* Allocated Leave Quotas Breakdown */}
                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap items-center gap-1.5 max-w-lg">
                              {(emp.balances || []).length === 0 ? (
                                <span className="text-xs text-rose-500 font-medium italic">
                                  No leave quotas mapped for {selectedYear}
                                </span>
                              ) : (
                                emp.balances.map((b) => (
                                  <span
                                    key={b.leave_type_id}
                                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
                                    title={`${b.leave_type_name}: ${b.remaining_days} remaining out of ${b.total_days} total ${b.carried_forward_days > 0 ? `(includes ${b.carried_forward_days} carried forward)` : ''} ${b.compensatory_days > 0 ? `(includes +${b.compensatory_days} comp-off)` : ''}`}
                                  >
                                    <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
                                      {b.leave_type_name}:
                                    </strong>
                                    <span>
                                      {b.remaining_days % 1 === 0 ? Math.round(b.remaining_days) : b.remaining_days.toFixed(1)} / {b.total_days % 1 === 0 ? Math.round(b.total_days) : b.total_days.toFixed(1)}
                                    </span>
                                    {b.carried_forward_days > 0 && (
                                      <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-1 rounded font-bold" title="Carried forward from previous year">
                                        +{b.carried_forward_days} CF
                                      </span>
                                    )}
                                    {b.compensatory_days > 0 && (
                                      <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1 rounded font-bold" title="Compensatory credit for weekend work">
                                        +{b.compensatory_days} Comp
                                      </span>
                                    )}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5 text-center">
                            {emp.is_fully_mapped ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <i className="bi bi-check-circle-fill"></i>
                                Fully Mapped
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                <i className="bi bi-exclamation-circle-fill"></i>
                                Missing Quotas
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Quick Comp-Off Action */}
                              <button
                                onClick={() => quickOpenCompOff(emp)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
                                title="Credit compensatory leave for weekend work"
                              >
                                <i className="bi bi-gift-fill"></i>
                                Comp-Off
                              </button>

                              {isUnmapped && (
                                <button
                                  onClick={() => handleAutoMap([emp.employee_id])}
                                  disabled={mappingInProgress && mappingSingleId === emp.employee_id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
                                  title="Auto-map default leave quotas"
                                >
                                  <SparklesIcon className="w-3.5 h-3.5" />
                                  Auto-Map
                                </button>
                              )}

                              <button
                                onClick={() => openCustomBalanceModal(emp)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-semibold dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                                title="Customize leave quota"
                              >
                                <i className="bi bi-sliders"></i>
                                Edit Quota
                              </button>
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
                currentPage={empPage}
                totalItems={filteredEmployees.length}
                pageSize={empPageSize}
                onPageChange={setEmpPage}
                onPageSizeChange={setEmpPageSize}
                itemLabel="employees"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WEEKEND WORK COMP-OFF CREDITS LOG */}
      {/* ========================================================================= */}
      {activeSubTab === 'compoff_history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Weekend Work Compensatory Credits History ({selectedYear})</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Log of all compensatory leaves credited to staff for working on weekends or public holidays.
              </p>
            </div>

            <button
              onClick={() => {
                setCompOffForm({
                  employeeId: employeesOverview[0] ? String(employeesOverview[0].employee_id) : '',
                  leaveTypeId: '',
                  daysCredited: '1',
                  workDate: new Date().toISOString().split('T')[0],
                  reason: 'Weekend work / overtime support'
                });
                setShowCompOffModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs"
            >
              <i className="bi bi-gift-fill"></i>
              Credit New Comp-Off
            </button>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50/75 text-xs uppercase font-semibold text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
                  <tr>
                    <th className="px-5 py-3.5">Employee</th>
                    <th className="px-5 py-3.5 text-center">Work Date (Weekend/Holiday)</th>
                    <th className="px-5 py-3.5 text-center">Days Credited</th>
                    <th className="px-5 py-3.5">Category Credited</th>
                    <th className="px-5 py-3.5">Reason / Task Description</th>
                    <th className="px-5 py-3.5 text-right">Credited By & Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {loadingCompOffHistory ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-sm text-gray-400">
                        Loading compensatory leave log...
                      </td>
                    </tr>
                  ) : compOffHistory.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-sm text-gray-400">
                        No weekend compensatory credits recorded for {selectedYear} yet.
                      </td>
                    </tr>
                  ) : (
                    paginatedCompOffHistory.map((rec) => (
                      <tr key={rec.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-gray-900 dark:text-white block">
                            {rec.employee_name}
                          </span>
                          <span className="text-[11px] text-gray-400">{rec.employee_code}</span>
                        </td>

                        <td className="px-5 py-3.5 text-center">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 font-bold text-xs">
                            <i className="bi bi-calendar-event"></i>
                            {new Date(rec.work_date).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-extrabold border border-emerald-200 dark:border-emerald-800">
                            +{rec.days_credited} Day{rec.days_credited > 1 ? 's' : ''}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-gray-800 dark:text-gray-200">
                            {rec.leave_type_name || 'Compensatory Off'}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="text-xs text-gray-700 dark:text-gray-300 block max-w-xs truncate" title={rec.reason}>
                            {rec.reason || 'Weekend work credit'}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 block">
                            {rec.credited_by_name || 'Admin'}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {new Date(rec.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-5 pb-4">
              <Pagination
                currentPage={compOffPage}
                totalItems={compOffHistory.length}
                pageSize={compOffPageSize}
                onPageChange={setCompOffPage}
                onPageSizeChange={setCompOffPageSize}
                itemLabel="comp-off records"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD LEAVE TYPE */}
      {/* ========================================================================= */}
      {showAddTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <PlusIcon className="w-4 h-4 text-[#3c50e0]" />
                Add New Leave Type
              </h3>
              <button
                onClick={() => setShowAddTypeModal(false)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLeaveType} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Leave Type Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Leave, Sick Leave, Casual Leave, Compensatory Off"
                  value={typeForm.name}
                  onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-[#3c50e0]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Annual Quota (Days) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="365"
                    required
                    placeholder="e.g. 12"
                    value={typeForm.defaultDays}
                    onChange={(e) => setTypeForm({ ...typeForm, defaultDays: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-[#3c50e0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Max Carry-Forward (Days)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="30"
                    required={typeForm.carryForwardAllowed}
                    disabled={!typeForm.carryForwardAllowed}
                    placeholder="e.g. 5"
                    value={typeForm.maxCarryForward}
                    onChange={(e) => setTypeForm({ ...typeForm, maxCarryForward: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-[#3c50e0] disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={typeForm.carryForwardAllowed}
                    onChange={(e) => setTypeForm({ ...typeForm, carryForwardAllowed: e.target.checked })}
                    className="rounded border-gray-300 text-[#3c50e0] focus:ring-[#3c50e0] w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    Allow Year-End Carry Forward (Roll over up to {typeForm.maxCarryForward || 5} days)
                  </span>
                </label>
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                  Unused balance from the Jan - Dec calendar year up to {typeForm.maxCarryForward || 5} days will be added to the next year's quota.
                </p>
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={typeForm.autoMap}
                    onChange={(e) => setTypeForm({ ...typeForm, autoMap: e.target.checked })}
                    className="rounded border-gray-300 text-[#3c50e0] focus:ring-[#3c50e0] mt-0.5 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                      Auto-assign to all active employees immediately
                    </span>
                    <span className="text-[11px] text-gray-400 block">
                      Creates balance records for all {employeesOverview.length} staff in this organization.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddTypeModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingType}
                  className="rounded-xl bg-[#3c50e0] px-4 py-2 text-xs font-bold text-white hover:bg-[#3444c5] disabled:opacity-50 transition-colors shadow-sm"
                >
                  {savingType ? 'Saving...' : 'Create Leave Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT LEAVE TYPE */}
      {/* ========================================================================= */}
      {showEditTypeModal && editingType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <i className="bi bi-pencil-square text-[#3c50e0]"></i>
                Edit Leave Type: {editingType.name}
              </h3>
              <button
                onClick={() => setShowEditTypeModal(false)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateLeaveType} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Leave Type Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={typeForm.name}
                  onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-[#3c50e0]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Annual Quota (Days) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="365"
                    required
                    value={typeForm.defaultDays}
                    onChange={(e) => setTypeForm({ ...typeForm, defaultDays: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-[#3c50e0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Max Carry-Forward (Days)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="30"
                    required={typeForm.carryForwardAllowed}
                    disabled={!typeForm.carryForwardAllowed}
                    value={typeForm.maxCarryForward}
                    onChange={(e) => setTypeForm({ ...typeForm, maxCarryForward: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-[#3c50e0] disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={typeForm.carryForwardAllowed}
                    onChange={(e) => setTypeForm({ ...typeForm, carryForwardAllowed: e.target.checked })}
                    className="rounded border-gray-300 text-[#3c50e0] focus:ring-[#3c50e0] w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    Allow Year-End Carry Forward (Max {typeForm.maxCarryForward || 5} days)
                  </span>
                </label>
              </div>

              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncExistingOnEdit}
                    onChange={(e) => setSyncExistingOnEdit(e.target.checked)}
                    className="rounded border-gray-300 text-[#3c50e0] focus:ring-[#3c50e0] mt-0.5 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-200 block">
                      Sync updated quota to all existing employees
                    </span>
                    <span className="text-[11px] text-blue-700 dark:text-blue-300 block">
                      Updates the total allocated days in employee balances to {typeForm.defaultDays} days.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowEditTypeModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingType}
                  className="rounded-xl bg-[#3c50e0] px-4 py-2 text-xs font-bold text-white hover:bg-[#3444c5] disabled:opacity-50 transition-colors shadow-sm"
                >
                  {savingType ? 'Updating...' : 'Update Leave Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: YEAR-END CARRY FORWARD ROLLOVER */}
      {/* ========================================================================= */}
      {showCarryForwardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <i className="bi bi-arrow-right-circle-fill text-indigo-600"></i>
                Year-End Carry Forward Rollover
              </h3>
              <button
                onClick={() => setShowCarryForwardModal(false)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteCarryForward} className="mt-4 space-y-4">
              <div className="p-3.5 bg-indigo-50 border border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800 rounded-xl text-xs space-y-2 text-indigo-900 dark:text-indigo-200">
                <div className="font-bold flex items-center gap-1.5">
                  <i className="bi bi-info-circle-fill"></i>
                  Annual Rollover Policy (Jan to Dec Cycle)
                </div>
                <p className="text-[11px] leading-relaxed text-indigo-700 dark:text-indigo-300">
                  Unused balances from {carryForwardForm.fromYear} will be rolled over to {carryForwardForm.toYear}. For each eligible category, up to <strong>5.0 days</strong> of unused leave will be carried forward and credited to the new year's quota.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Source Year
                  </label>
                  <select
                    value={carryForwardForm.fromYear}
                    onChange={(e) => {
                      const fromY = parseInt(e.target.value, 10);
                      setCarryForwardForm({ fromYear: fromY, toYear: fromY + 1 });
                    }}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-[#3c50e0]"
                  >
                    {availableYears.map(yr => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Target Year (New Quotas)
                  </label>
                  <select
                    value={carryForwardForm.toYear}
                    onChange={(e) => setCarryForwardForm({ ...carryForwardForm, toYear: parseInt(e.target.value, 10) })}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-[#3c50e0]"
                  >
                    {availableYears.filter(yr => yr > carryForwardForm.fromYear).map(yr => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl text-xs text-gray-600 dark:text-gray-300 space-y-1">
                <div className="flex justify-between">
                  <span>Target Staff:</span>
                  <strong>{employeesOverview.length} active employees</strong>
                </div>
                <div className="flex justify-between">
                  <span>Eligible Categories:</span>
                  <strong>{leaveTypes.filter(lt => lt.carry_forward_allowed !== false).map(l => l.name).join(', ') || 'All categories'}</strong>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowCarryForwardModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rollingOver}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {rollingOver ? 'Rolling Over...' : `Execute Rollover to ${carryForwardForm.toYear}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CREDIT COMPENSATORY LEAVE (WEEKEND WORK COMP-OFF) */}
      {/* ========================================================================= */}
      {showCompOffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <i className="bi bi-gift-fill text-emerald-600"></i>
                Credit Weekend Work Compensatory Leave
              </h3>
              <button
                onClick={() => setShowCompOffModal(false)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreditCompOff} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Select Employee <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={compOffForm.employeeId}
                  onChange={(e) => setCompOffForm({ ...compOffForm, employeeId: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-[#3c50e0]"
                >
                  <option value="">Choose Employee</option>
                  {employeesOverview.map(emp => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      {emp.employee_name} ({emp.employee_code || `ID ${emp.employee_id}`}) - {emp.department}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Work Date (Weekend / Holiday) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={compOffForm.workDate}
                    onChange={(e) => setCompOffForm({ ...compOffForm, workDate: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-[#3c50e0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Days to Credit <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={compOffForm.daysCredited}
                    onChange={(e) => setCompOffForm({ ...compOffForm, daysCredited: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-[#3c50e0]"
                  >
                    <option value="0.5">+0.5 Day (Half Day)</option>
                    <option value="1">+1.0 Day (Full Day)</option>
                    <option value="1.5">+1.5 Days</option>
                    <option value="2">+2.0 Days (Full Weekend)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Credit To Category
                </label>
                <select
                  value={compOffForm.leaveTypeId}
                  onChange={(e) => setCompOffForm({ ...compOffForm, leaveTypeId: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-[#3c50e0]"
                >
                  <option value="">Compensatory Off (Comp-Off) - Default</option>
                  {leaveTypes.map(lt => (
                    <option key={lt.id} value={lt.id}>
                      Add directly to {lt.name} (Current: {lt.default_days}d)
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Select where the additional leave days should be added to the employee's balance.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Reason / Task Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows="2"
                  required
                  placeholder="e.g. Worked Sunday on client critical production release / server migration"
                  value={compOffForm.reason}
                  onChange={(e) => setCompOffForm({ ...compOffForm, reason: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-[#3c50e0]"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowCompOffModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCompOff}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {savingCompOff ? 'Crediting...' : 'Credit Leave Days'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: CUSTOMIZE EMPLOYEE LEAVE QUOTA */}
      {/* ========================================================================= */}
      {editingEmpBalance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <i className="bi bi-sliders text-[#3c50e0]"></i>
                  Customize Leave Quota ({selectedYear})
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">
                  {editingEmpBalance.employee_name} ({editingEmpBalance.employee_code || `ID ${editingEmpBalance.employee_id}`})
                </span>
              </div>
              <button
                onClick={() => setEditingEmpBalance(null)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomBalance} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Select Leave Type <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={customBalanceForm.leaveTypeId}
                  onChange={(e) => handleCustomLtChange(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-[#3c50e0]"
                >
                  <option value="">Select Leave Type</option>
                  {leaveTypes.map((lt) => (
                    <option key={lt.id} value={lt.id}>
                      {lt.name} (Default: {lt.default_days} Days)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Total Quota Days <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="365"
                    required
                    value={customBalanceForm.totalDays}
                    onChange={(e) => setCustomBalanceForm({ ...customBalanceForm, totalDays: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-[#3c50e0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Used Days
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="365"
                    value={customBalanceForm.usedDays}
                    onChange={(e) => setCustomBalanceForm({ ...customBalanceForm, usedDays: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-[#3c50e0]"
                  />
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl text-xs space-y-1 text-gray-600 dark:text-gray-300">
                <div className="flex justify-between">
                  <span>Calculated Remaining Days:</span>
                  <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
                    {(parseFloat(customBalanceForm.totalDays) || 0) - (parseFloat(customBalanceForm.usedDays) || 0)} Days
                  </strong>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditingEmpBalance(null)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCustomBalance}
                  className="rounded-xl bg-[#3c50e0] px-4 py-2 text-xs font-bold text-white hover:bg-[#3444c5] disabled:opacity-50 transition-colors shadow-sm"
                >
                  {savingCustomBalance ? 'Saving...' : 'Save Quota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

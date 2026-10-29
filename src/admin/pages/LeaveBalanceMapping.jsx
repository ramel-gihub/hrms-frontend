import React, { useState, useEffect } from 'react';
import { LayersIcon, CheckCircleIcon, SparklesIcon } from '../components/Icons';

export default function LeaveBalanceMapping({
  currentTenantId = 1,
  currentUser,
  onBalancesMapped
}) {
  const [unmappedEmployees, setUnmappedEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmpIds, setSelectedEmpIds] = useState([]);
  const [mappingInProgress, setMappingInProgress] = useState(false);
  const [mappingSingleId, setMappingSingleId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 
    (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:5002'
      : 'https://hrms-backend-5xo8.onrender.com');

  const fetchUnmappedEmployees = async () => {
    setLoading(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/unmapped-leave-balances?orgId=${currentTenantId}`);
      const data = await res.json();
      if (data && Array.isArray(data.unmappedEmployees)) {
        // Filter out superadmin records so they are not treated as unmapped
        const filtered = data.unmappedEmployees.filter(e => {
          const role = (e.role_name || e.roleKey || e.role || '').toLowerCase();
          const email = (e.email || '').toLowerCase();
          const code = (e.employee_code || '').toLowerCase();
          const name = `${e.first_name || ''} ${e.last_name || ''} ${e.employee_name || ''}`.toLowerCase();
          const isSuperAdmin = (
            role.includes('super_admin') || 
            role.includes('superadmin') || 
            email.includes('superadmin') || 
            code.includes('emp-super') || 
            name.includes('super administrator')
          );
          return !isSuperAdmin;
        });
        setUnmappedEmployees(filtered);
        setSelectedEmpIds(prev => prev.filter(id => filtered.some(e => e.employee_id === id)));
      }
    } catch (err) {
      console.error('Error fetching unmapped employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnmappedEmployees();
  }, [currentTenantId]);

  // Select / Deselect All
  const handleToggleSelectAll = () => {
    if (selectedEmpIds.length === unmappedEmployees.length) {
      setSelectedEmpIds([]);
    } else {
      setSelectedEmpIds(unmappedEmployees.map(e => e.employee_id));
    }
  };

  // Toggle single employee
  const handleToggleSelectEmp = (empId) => {
    setSelectedEmpIds(prev => 
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  // Map balances for selected (or single)
  const handleAutoMap = async (empIdsToMap) => {
    if (!empIdsToMap || empIdsToMap.length === 0) return;
    setMappingInProgress(true);
    if (empIdsToMap.length === 1) setMappingSingleId(empIdsToMap[0]);
    setFeedbackMsg(null);
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
      if (!res.ok) {
        throw new Error(data.error || 'Failed to map leave balances');
      }

      setFeedbackMsg({
        type: 'success',
        text: `Successfully auto-mapped leave balances for ${data.mappedCount || empIdsToMap.length} employee(s)!`
      });
      await fetchUnmappedEmployees();
      if (onBalancesMapped) onBalancesMapped();
      setTimeout(() => setFeedbackMsg(null), 5000);
    } catch (err) {
      console.error('Mapping error:', err);
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'Error occurred while mapping leave balances'
      });
    } finally {
      setMappingInProgress(false);
      setMappingSingleId(null);
    }
  };

  const isAllSelected = unmappedEmployees.length > 0 && selectedEmpIds.length === unmappedEmployees.length;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <LayersIcon className="w-6 h-6 text-[#3c50e0]" />
            Employee Leave Balance Mapping
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Detect and auto-map default leave quotas (Annual, Sick, Casual, Paid) for staff with missing balances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchUnmappedEmployees}
            disabled={loading || mappingInProgress}
            className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 transition-colors cursor-pointer"
          >
            {loading ? 'Refreshing...' : '↻ Refresh List'}
          </button>

          {unmappedEmployees.length > 0 && (
            <button
              onClick={() => handleAutoMap(selectedEmpIds.length > 0 ? selectedEmpIds : unmappedEmployees.map(e => e.employee_id))}
              disabled={mappingInProgress || unmappedEmployees.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#3c50e0] to-[#5a6ff0] px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              <SparklesIcon className="w-4 h-4" />
              {mappingInProgress 
                ? 'Auto Mapping...' 
                : selectedEmpIds.length > 0 
                  ? `Auto Map Selected (${selectedEmpIds.length})` 
                  : `Auto Map All (${unmappedEmployees.length})`}
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div className={`p-4 rounded-xl border text-sm flex items-center gap-2 animate-in fade-in ${
          feedbackMsg.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
            : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
        }`}>
          <span className="font-bold">{feedbackMsg.type === 'success' ? '✓' : '⚠'}</span>
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Unmapped Employees</span>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className={`text-3xl font-extrabold ${unmappedEmployees.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {unmappedEmployees.length}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              unmappedEmployees.length > 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
            }`}>
              {unmappedEmployees.length > 0 ? 'Action Needed' : 'All Mapped'}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Default Org Leave Types</span>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">4</h3>
            <span className="text-xs text-gray-400">Annual, Sick, Casual, Paid</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mapping Status</span>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {unmappedEmployees.length === 0 ? '100% Complete' : `${selectedEmpIds.length} of ${unmappedEmployees.length} Selected`}
            </h3>
            <span className="text-xs text-blue-600 font-semibold dark:text-blue-400">Dynamic Policy</span>
          </div>
        </div>
      </div>

      {/* Main Table / Empty State: ONLY SHOWS UNMAPPED EMPLOYEES */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden dark:border-gray-800 dark:bg-gray-900">
        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#3c50e0] border-r-transparent"></div>
            <p className="mt-3 text-sm text-gray-500">Scanning employee leave balances...</p>
          </div>
        ) : unmappedEmployees.length === 0 ? (
          <div className="py-16 px-6 text-center max-w-md mx-auto space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center mx-auto text-2xl shadow-sm">
              <CheckCircleIcon className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white">
              All Employees Are Fully Mapped!
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Every employee in this organization currently has their leave balances configured according to company policies.
            </p>
          </div>
        ) : (
          <div>
            {/* Table Action Bar */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/40">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleToggleSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-[#3c50e0] focus:ring-[#3c50e0] cursor-pointer"
                />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Select All ({unmappedEmployees.length})
                </span>
              </div>

              <span className="text-xs text-gray-500">
                {selectedEmpIds.length} employee(s) selected
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50/75 text-xs uppercase font-semibold text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
                  <tr>
                    <th className="w-12 px-6 py-3.5"></th>
                    <th className="px-6 py-3.5">Employee</th>
                    <th className="px-6 py-3.5">Department</th>
                    <th className="px-6 py-3.5">Designation</th>
                    <th className="px-6 py-3.5">Current Mapped</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {unmappedEmployees.map((emp) => {
                    const isSelected = selectedEmpIds.includes(emp.employee_id);
                    const isMappingThis = mappingSingleId === emp.employee_id;
                    const name = emp.employee_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Employee';

                    return (
                      <tr 
                        key={emp.employee_id} 
                        className={`transition-colors ${isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/40'}`}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectEmp(emp.employee_id)}
                            className="h-4 w-4 rounded border-gray-300 text-[#3c50e0] focus:ring-[#3c50e0] cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#3c50e0] to-[#607afb] text-white font-bold text-xs shrink-0 shadow-sm">
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white text-sm">{name}</div>
                              <div className="text-xs text-gray-400 font-mono">{emp.employee_code} • {emp.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-700 dark:text-gray-300">{emp.department}</td>
                        <td className="px-6 py-4 text-xs text-gray-700 dark:text-gray-300">{emp.designation}</td>
                        <td className="px-6 py-4 text-xs">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                            {emp.mapped_leave_types_count} of {emp.total_org_leave_types} types mapped
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleAutoMap([emp.employee_id])}
                            disabled={mappingInProgress}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#3c50e0] hover:bg-[#3245c5] shadow-xs transition-all cursor-pointer disabled:opacity-50"
                          >
                            {isMappingThis ? (
                              <>
                                <div className="spinner-border spinner-border-sm" role="status"></div>
                                <span>Mapping...</span>
                              </>
                            ) : (
                              <>
                                <SparklesIcon className="w-3.5 h-3.5" />
                                <span>Auto Map</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

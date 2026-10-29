import React, { useState, useEffect } from 'react';
import EmptyState from '../../components/EmptyState';
import { SearchIcon, PlusIcon, UsersIcon } from '../components/Icons';

export default function Employees({
  employees = [],
  loading = false,
  onOpenAddModal,
  fetchEmployees,
  currentUser
}) {
  const API_URL = import.meta.env.VITE_API_URL || 
    (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:5002'
      : 'https://hrms-backend-5xo8.onrender.com');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Delete modal state
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Filter out superadmin records so they are never displayed in the employee directory
  const visibleEmployees = employees.filter(e => {
    const role = (e.role_name || e.roleKey || e.role || '').toLowerCase();
    const email = (e.email || '').toLowerCase();
    const code = (e.employee_code || '').toLowerCase();
    const name = `${e.first_name || ''} ${e.last_name || ''} ${e.full_name || ''}`.toLowerCase();
    const isSuperAdmin = (
      role.includes('super_admin') || 
      role.includes('superadmin') || 
      email.includes('superadmin') || 
      code.includes('emp-super') || 
      name.includes('super administrator')
    );
    return !isSuperAdmin;
  });

  const departments = ['All', ...new Set(visibleEmployees.map(e => e.department).filter(Boolean))];

  const filtered = visibleEmployees.filter(e => {
    const fullName = `${e.first_name || ''} ${e.last_name || ''} ${e.full_name || ''}`.toLowerCase();
    const email = (e.email || '').toLowerCase();
    const code = (e.employee_code || '').toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesSearch = fullName.includes(query) || email.includes(query) || code.includes(query);
    const matchesDept = selectedDept === 'All' || e.department === selectedDept;

    return matchesSearch && matchesDept;
  });

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDept, pageSize]);

  // Open delete modal
  const handleOpenDeleteModal = (emp) => {
    setEmployeeToDelete(emp);
    setShowDeleteModal(true);
  };

  // Confirm delete handler
  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    setDeleting(true);
    setFeedback(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/employees/${employeeToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to delete employee');
      }

      setShowDeleteModal(false);
      const deletedName = employeeToDelete.full_name || `${employeeToDelete.first_name || ''} ${employeeToDelete.last_name || ''}`.trim() || employeeToDelete.employee_code;
      setEmployeeToDelete(null);

      setFeedback({
        type: 'success',
        message: `Employee "${deletedName}" has been successfully deleted.`
      });

      // Refresh employee list from backend (is_deleted = false filter will automatically exclude it)
      if (typeof fetchEmployees === 'function') {
        await fetchEmployees();
      }

      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      console.error('Delete employee error:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'An error occurred while deleting employee.'
      });
    } finally {
      setDeleting(false);
    }
  };

  // Pagination calculations
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentEmployees = filtered.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <UsersIcon className="h-6 w-6 text-[#3c50e0]" />
            Employee Directory
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage your company workforce, view roles, and manage employee accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 rounded-xl bg-[#3c50e0] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#3245c5] transition-all cursor-pointer"
          >
            <PlusIcon className="h-4 w-4" />
            Add New Employee
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl p-3.5 text-xs font-medium border animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <i className={`bi ${feedback.type === 'success' ? 'bi-check-circle-fill text-emerald-600' : 'bi-exclamation-octagon-fill text-rose-600'} text-base`}></i>
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <i className="bi bi-x text-base"></i>
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, employee code or email..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-2 text-xs text-gray-800 focus:border-[#3c50e0] focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800"
          />
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Department:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs text-gray-800 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Show:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs text-gray-800 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employees Table Container */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50/75 text-xs uppercase font-semibold text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">Employee</th>
                <th className="px-4 py-3">Employee Code</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Designation</th>
                <th className="px-4 py-3">System Role</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right rounded-r-xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {currentEmployees.map((emp, i) => {
                const name = emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Employee';
                const roleLower = (emp.role_name || emp.roleKey || emp.role || '').toLowerCase();
                const codeLower = (emp.employee_code || '').toLowerCase();
                const emailLower = (emp.email || '').toLowerCase();
                // Only actual admin user accounts (e.g. EMP-ADMIN, Organization Admin)
                const isAdmin = (
                  roleLower === 'admin' ||
                  roleLower === 'org_admin' ||
                  roleLower === 'organization admin' ||
                  roleLower === 'super_admin' ||
                  roleLower === 'superadmin' ||
                  codeLower === 'emp-admin' ||
                  codeLower === 'emp-super' ||
                  emailLower.startsWith('admin@') ||
                  emailLower.startsWith('superadmin@')
                );

                return (
                  <tr key={emp.id || i} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#3c50e0] to-[#607afb] text-white font-bold text-xs shrink-0 shadow-sm">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white leading-tight">
                            {name}
                          </p>
                          <span className="text-xs text-gray-400">{emp.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-[#3c50e0]">
                      {emp.employee_code || `EMP-${emp.id}`}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-gray-700 dark:text-gray-300">
                      {emp.department || 'Engineering'}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-gray-700 dark:text-gray-300">
                      {emp.designation || 'Software Engineer'}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                        {emp.role_name || emp.roleKey || emp.role || 'Employee'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        ● Active
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      {isAdmin ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold text-gray-400 bg-gray-100 dark:bg-gray-800 dark:text-gray-500">
                          Admin
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenDeleteModal(emp)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-900/50 transition-all cursor-pointer shadow-2xs"
                          title={`Delete ${name}`}
                        >
                          <i className="bi bi-trash3 text-xs"></i>
                          <span>Delete</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {currentEmployees.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ padding: 0 }}>
                    <EmptyState
                      emoji="👥"
                      title="No employees found"
                      message="No employees found matching the search or filter criteria."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* TailAdmin Pagination Bar */}
        {totalItems > 0 && (
          <div className="pt-5 mt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Showing <span className="font-bold text-gray-800 dark:text-gray-200">{startIndex + 1}</span> to{' '}
              <span className="font-bold text-gray-800 dark:text-gray-200">{endIndex}</span> of{' '}
              <span className="font-bold text-gray-800 dark:text-gray-200">{totalItems}</span> entries
            </div>

            <div className="flex items-center gap-1.5 self-center sm:self-auto">
              {/* Previous Button */}
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center justify-center rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
              >
                Previous
              </button>

              {/* Page Number Buttons */}
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => {
                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-8 w-8 rounded-lg text-xs font-bold transition-colors ${
                      isActive
                        ? 'bg-[#3c50e0] text-white shadow-sm'
                        : 'border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Next Button */}
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center justify-center rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && employeeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 shrink-0">
                <i className="bi bi-exclamation-triangle-fill text-2xl"></i>
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                  Confirm Delete Employee
                </h4>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                  This action will soft-delete the employee.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200/60 dark:border-gray-700 text-xs space-y-2 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-[#3c50e0] to-[#607afb] text-white font-bold text-xs shrink-0">
                  {((employeeToDelete.full_name || employeeToDelete.first_name || 'E')).charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white text-sm">
                    {employeeToDelete.full_name || `${employeeToDelete.first_name || ''} ${employeeToDelete.last_name || ''}`.trim() || 'Employee'}
                  </div>
                  <div className="text-gray-400 text-xs font-mono">
                    {employeeToDelete.employee_code} • {employeeToDelete.email}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 mb-5 leading-relaxed">
              Are you sure you want to delete this employee? Once confirmed, the employee will be marked as deleted (<span className="font-mono font-semibold text-rose-600 dark:text-rose-400">is_deleted = true</span>), deactivated, and removed from the active employee directory.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setEmployeeToDelete(null);
                }}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer transition-all"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 shadow-md shadow-rose-600/30 flex items-center gap-2 cursor-pointer transition-all"
              >
                {deleting ? (
                  <>
                    <div className="spinner-border spinner-border-sm" role="status"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <i className="bi bi-trash3-fill"></i>
                    Yes, Delete Employee
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

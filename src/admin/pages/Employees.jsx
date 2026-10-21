import React, { useState, useEffect } from 'react';
import { SearchIcon, PlusIcon, UsersIcon } from '../components/Icons';

export default function Employees({
  employees = [],
  loading = false,
  onOpenAddModal
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

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

  // Pagination calculations
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentEmployees = filtered.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Employee Directory
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage organization members, assignments, roles, and profiles.
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-2 rounded-xl bg-[#3c50e0] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#3444be] transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {/* Filters Bar */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none">
            <SearchIcon className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by name, email, or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-10 pr-4 text-xs text-gray-800 focus:border-[#3c50e0] focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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
                <th className="px-4 py-3 text-right rounded-r-xl">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {currentEmployees.map((emp, i) => {
                const name = emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Employee';
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

                    <td className="px-4 py-3.5 text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        ● Active
                      </span>
                    </td>
                  </tr>
                );
              })}

              {currentEmployees.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400">
                    <UsersIcon className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-700" />
                    No employees found matching the search criteria.
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
    </div>
  );
}

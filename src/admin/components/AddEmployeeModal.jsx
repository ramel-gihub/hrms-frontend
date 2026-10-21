import React from 'react';
import { CloseIcon } from './Icons';

export default function AddEmployeeModal({
  showModal,
  setShowModal,
  newEmp,
  updateNewEmployee,
  handleCreateEmployee,
  creatingEmployee
}) {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 transition-all overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Add New Employee
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Create a new user account and employee record in the system.
            </p>
          </div>
          <button
            onClick={() => setShowModal(false)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleCreateEmployee}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John"
                  value={newEmp.firstName}
                  onChange={(e) => updateNewEmployee('firstName', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Doe"
                  value={newEmp.lastName}
                  onChange={(e) => updateNewEmployee('lastName', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Work Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="john.doe@ramel.co.in"
                value={newEmp.email}
                onChange={(e) => updateNewEmployee('email', e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Temporary Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={newEmp.password}
                onChange={(e) => updateNewEmployee('password', e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Department
                </label>
                <input
                  type="text"
                  placeholder="Engineering"
                  value={newEmp.department}
                  onChange={(e) => updateNewEmployee('department', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Designation
                </label>
                <input
                  type="text"
                  placeholder="Software Engineer"
                  value={newEmp.designation}
                  onChange={(e) => updateNewEmployee('designation', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                System Role <span className="text-rose-500">*</span>
              </label>
              <select
                value={newEmp.roleKey}
                onChange={(e) => updateNewEmployee('roleKey', e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="SOFTWARE_ENGINEER">Software Engineer</option>
                <option value="HR">HR</option>
                <option value="MANAGER">Manager</option>
                <option value="TEAM_LEAD">Team Lead</option>
                <option value="EMPLOYEE">Employee</option>
              </select>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/50">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              disabled={creatingEmployee}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingEmployee}
              className="rounded-xl bg-[#3c50e0] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#3444be] disabled:opacity-50 transition-colors"
            >
              {creatingEmployee ? "Creating..." : "Create Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

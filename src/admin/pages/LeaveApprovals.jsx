import React, { useState } from 'react';
import { CheckCircleIcon, CloseIcon, CalendarIcon, ClockIcon, FileTextIcon } from '../components/Icons';

export default function LeaveApprovals({
  leaveRequests = [],
  loading = false,
  onUpdateStatus,
  currentUser
}) {
  const [filter, setFilter] = useState('Pending');
  const [remarksModal, setRemarksModal] = useState({ open: false, leaveId: null, action: null, remarks: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const filtered = leaveRequests.filter(req => {
    if (filter === 'All') return true;
    return (req.status || 'Pending').toLowerCase() === filter.toLowerCase();
  });

  const handleAction = async (leaveId, status, remarks = '') => {
    setActionLoading(true);
    try {
      await onUpdateStatus(leaveId, status, remarks);
      setRemarksModal({ open: false, leaveId: null, action: null, remarks: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Leave Approvals & Balances
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Review employee leave requests with real-time employee-wise leave balance cards.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="inline-flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
          {['Pending', 'Approved', 'Rejected', 'All'].map(tab => {
            const count = tab === 'All' ? leaveRequests.length : leaveRequests.filter(r => (r.status || 'Pending').toLowerCase() === tab.toLowerCase()).length;
            const isActive = filter === tab;
            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                <span>{tab}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Leave Requests Cards List */}
      <div className="space-y-4">
        {filtered.map((leave) => {
          const st = (leave.status || 'Pending').toLowerCase();
          const badgeColor =
            st === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' :
            st === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800' :
            'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800';

          return (
            <div
              key={leave.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 transition-all hover:border-gray-300 dark:hover:border-gray-700"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                {/* Left Side: Employee & Request Details */}
                <div className="space-y-4 flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#3c50e0] to-[#607afb] text-white font-bold text-base shadow-sm shrink-0">
                        {(leave.first_name || leave.employee_name || 'E').charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                          {leave.employee_name || `${leave.first_name || ''} ${leave.last_name || ''}`}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {leave.employee_code} · {leave.designation || 'Staff'} · <span className="font-medium text-gray-700 dark:text-gray-300">{leave.department || 'Engineering'}</span>
                        </p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{leave.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${badgeColor}`}>
                        {leave.status || 'Pending'}
                      </span>
                    </div>
                  </div>

                  {/* Leave Request Specification */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 text-xs">
                    <div>
                      <span className="text-gray-400 block font-medium">Leave Type</span>
                      <strong className="text-gray-900 dark:text-white font-semibold text-sm">
                        {leave.leave_type_name || 'Casual Leave'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-gray-400 block font-medium">Duration</span>
                      <strong className="text-gray-900 dark:text-white font-semibold text-sm">
                        {new Date(leave.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        {' — '}
                        {new Date(leave.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </strong>
                    </div>

                    <div>
                      <span className="text-gray-400 block font-medium">Days Requested</span>
                      <strong className="text-[#3c50e0] font-bold text-sm">
                        {leave.days_requested} {parseFloat(leave.days_requested) <= 1 ? 'Day' : 'Days'}
                        {leave.is_half_day && <span className="text-[11px] text-purple-600 ml-1">({leave.half_day_period || 'Half Day'})</span>}
                      </strong>
                    </div>
                  </div>

                  {/* Reason & Documentation */}
                  <div className="space-y-2">
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      <span className="font-semibold text-gray-700 dark:text-gray-200">Reason: </span>
                      "{leave.reason || 'No reason specified'}"
                    </p>

                    {leave.document_url && (
                      <div className="flex items-center gap-2 text-xs">
                        <FileTextIcon className="w-4 h-4 text-blue-500" />
                        <a
                          href={leave.document_url.startsWith('http') ? leave.document_url : `${import.meta.env.VITE_API_URL || 'https://hrms-backend-5xo8.onrender.com'}${leave.document_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#3c50e0] font-semibold hover:underline"
                        >
                          View Supporting Document ({leave.document_name || 'Attachment'})
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Employee-Wise Leave Balance Card */}
                <div className="w-full lg:w-96 rounded-xl border border-blue-100 bg-blue-50/40 p-4 dark:border-blue-900/30 dark:bg-blue-950/20 space-y-3 shrink-0">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-2 dark:border-blue-900/40">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                      <ClockIcon className="w-4 h-4 text-[#3c50e0]" />
                      Employee Leave Balances
                    </span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-[#3c50e0] dark:bg-blue-900/60 dark:text-blue-300">
                      {leave.totalAvailableLeaves !== undefined ? `${leave.totalAvailableLeaves} Days Total` : 'Available'}
                    </span>
                  </div>

                  {/* Balances Grid for this employee */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {(leave.balances || []).map((bal, bIdx) => {
                      const avail = Math.max(0, parseFloat(bal.available_days || 0));
                      const total = parseFloat(bal.total_days || 12);
                      const used = parseFloat(bal.used_days || 0);
                      const isMatchingType = bal.leave_type_name === leave.leave_type_name;

                      return (
                        <div
                          key={bIdx}
                          className={`p-2.5 rounded-lg border text-xs transition-all ${
                            isMatchingType
                              ? 'bg-white border-[#3c50e0] shadow-sm dark:bg-gray-900 dark:border-[#3c50e0]'
                              : 'bg-white/80 border-gray-200 dark:bg-gray-900/60 dark:border-gray-800'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[100px]" title={bal.leave_type_name}>
                              {bal.leave_type_name}
                            </span>
                            {isMatchingType && (
                              <span className="text-[10px] bg-blue-50 text-blue-600 px-1 rounded font-bold">
                                Applied
                              </span>
                            )}
                          </div>
                          <div className="flex items-baseline justify-between">
                            <strong className="text-base font-extrabold text-gray-900 dark:text-white">
                              {avail}
                            </strong>
                            <span className="text-[10px] text-gray-400">
                              / {total} total
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${avail <= 2 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(100, Math.round((avail / (total || 1)) * 100))}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                            <span>Used: {used}d</span>
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">{avail}d left</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions Bar */}
                  {st === 'pending' && (
                    <div className="pt-2 border-t border-blue-100 dark:border-blue-900/40 flex items-center gap-2">
                      <button
                        onClick={() => handleAction(leave.id, 'Approved')}
                        disabled={actionLoading}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 px-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        <CheckCircleIcon className="w-4 h-4" />
                        Approve Leave
                      </button>

                      <button
                        onClick={() => setRemarksModal({ open: true, leaveId: leave.id, action: 'Rejected', remarks: '' })}
                        disabled={actionLoading}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 py-2 px-3 text-xs font-bold text-rose-600 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400 transition-colors"
                      >
                        <CloseIcon className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  )}

                  {st !== 'pending' && (
                    <div className="pt-2 border-t border-blue-100 dark:border-blue-900/40 text-center">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Reviewed & {leave.status}
                        {leave.reviewed_at && ` on ${new Date(leave.reviewed_at).toLocaleDateString('en-GB')}`}
                      </span>
                      {leave.admin_remarks && (
                        <p className="text-[11px] text-gray-400 italic mt-0.5">"{leave.admin_remarks}"</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
            <CalendarIcon className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800 dark:text-white">
              No {filter !== 'All' ? filter : ''} Leave Requests
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              There are currently no leave requests under this filter category.
            </p>
          </div>
        )}
      </div>

      {/* Reject Remarks Modal */}
      {remarksModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Reject Leave Request
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Please specify the reason for rejecting this leave request.
            </p>

            <textarea
              rows="3"
              value={remarksModal.remarks}
              onChange={(e) => setRemarksModal({ ...remarksModal, remarks: e.target.value })}
              placeholder="e.g. Critical project deadline / Staff shortage..."
              className="mt-4 w-full rounded-xl border border-gray-200 p-3 text-xs text-gray-800 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setRemarksModal({ open: false, leaveId: null, action: null, remarks: '' })}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(remarksModal.leaveId, 'Rejected', remarksModal.remarks)}
                disabled={actionLoading}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

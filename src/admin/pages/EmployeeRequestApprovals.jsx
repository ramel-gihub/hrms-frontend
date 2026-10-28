import React, { useState } from 'react';
import EmptyState from '../../components/EmptyState';
import { CheckCircleIcon, CloseIcon, FileTextIcon, ClockIcon } from '../components/Icons';

export default function EmployeeRequestApprovals({
  adminRequests = [],
  loading = false,
  onUpdateStatus
}) {
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('Pending');
  const [remarksModal, setRemarksModal] = useState({ open: false, reqId: null, action: null, remarks: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const categories = ['All', 'Commute & Travel', 'Work From Home (WFH)', 'Attendance Correction', 'Assets', 'Expenses & Claims', 'General'];

  const filtered = adminRequests.filter(req => {
    const st = (req.status || 'Pending').toLowerCase();
    const statusMatch = filterStatus === 'All' || st === filterStatus.toLowerCase();

    let catMatch = true;
    if (filterCategory !== 'All') {
      const cat = (req.category || req.request_type || '').toLowerCase();
      if (filterCategory === 'Commute & Travel') catMatch = cat.includes('commute') || cat.includes('travel');
      else if (filterCategory === 'Work From Home (WFH)') catMatch = cat.includes('wfh') || cat.includes('home');
      else if (filterCategory === 'Attendance Correction') catMatch = cat.includes('attendance') || cat.includes('correction');
      else if (filterCategory === 'Assets') catMatch = cat.includes('asset');
      else if (filterCategory === 'Expenses & Claims') catMatch = cat.includes('expense') || cat.includes('claim');
      else catMatch = cat.includes('general');
    }

    return statusMatch && catMatch;
  });

  const handleAction = async (id, status, remarks = '') => {
    setActionLoading(true);
    try {
      await onUpdateStatus(id, status, remarks);
      setRemarksModal({ open: false, reqId: null, action: null, remarks: '' });
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
            Employee Request Approvals
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Review and approve attendance corrections, work from home requests, assets, and expense claims.
          </p>
        </div>

        {/* Filter Status Pills */}
        <div className="inline-flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
          {['Pending', 'In Review', 'Approved', 'Rejected', 'All'].map(tab => {
            const count = tab === 'All' ? adminRequests.length : adminRequests.filter(r => (r.status || 'Pending').toLowerCase() === tab.toLowerCase()).length;
            const isActive = filterStatus === tab;
            return (
              <button
                key={tab}
                onClick={() => setFilterStatus(tab)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
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

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors ${
              filterCategory === cat
                ? 'bg-[#3c50e0] text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Requests Cards / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(req => {
          const st = (req.status || 'Pending').toLowerCase();
          const badgeColor =
            st === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' :
            st === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800' :
            st === 'in review' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800' :
            'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800';

          return (
            <div
              key={req.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-4 hover:border-gray-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 font-bold text-sm shrink-0">
                      {(req.first_name || req.employee_name || 'E').charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                        {req.employee_name || `${req.first_name || ''} ${req.last_name || ''}`}
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {req.employee_code || `EMP-${req.employee_id || 101}`} · <span className="font-semibold text-gray-700 dark:text-gray-300">{req.category || 'Request'}</span>
                      </p>
                    </div>
                  </div>

                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeColor}`}>
                    {req.status || 'Pending'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                    <span>Subject</span>
                    <strong className="text-gray-900 dark:text-white font-semibold truncate max-w-[200px]">
                      {req.subject || req.category}
                    </strong>
                  </div>

                  {req.wfh_start_date && (
                    <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                      <span>WFH Dates</span>
                      <strong className="text-purple-600 font-semibold">
                        {new Date(req.wfh_start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        {req.wfh_end_date && ` - ${new Date(req.wfh_end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`}
                      </strong>
                    </div>
                  )}

                  <div className="pt-1 text-gray-600 dark:text-gray-300">
                    <p className="line-clamp-2">"{req.description || 'No detailed description provided.'}"</p>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">
                  {req.created_at ? new Date(req.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'}
                </span>

                {st === 'pending' || st === 'in review' ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAction(req.id, 'Approved')}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <CheckCircleIcon className="w-3.5 h-3.5" />
                      Approve
                    </button>
                    <button
                      onClick={() => setRemarksModal({ open: true, reqId: req.id, action: 'Rejected', remarks: '' })}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400"
                    >
                      <CloseIcon className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-gray-500">
                    Reviewed ({req.status})
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-2 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
            <EmptyState
              emoji="📬"
              title="No Requests Found"
              message="There are no employee requests matching the selected category and status."
            />
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {remarksModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Reject Employee Request
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Provide feedback or reasons for declining this request.
            </p>

            <textarea
              rows="3"
              value={remarksModal.remarks}
              onChange={(e) => setRemarksModal({ ...remarksModal, remarks: e.target.value })}
              placeholder="e.g. Incomplete details / Policy restrictions..."
              className="mt-4 w-full rounded-xl border border-gray-200 p-3 text-xs text-gray-800 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setRemarksModal({ open: false, reqId: null, action: null, remarks: '' })}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(remarksModal.reqId, 'Rejected', remarksModal.remarks)}
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

import React, { useState, useEffect } from 'react';
import EmptyState from '../../components/EmptyState';
import { CalendarIcon, PlusIcon, CloseIcon, CheckCircleIcon } from '../components/Icons';
import DatePickerCalendar from '../components/DatePickerCalendar';

export default function HolidaysManagement({
  currentTenantId = 1,
  currentUser
}) {
  const effectiveOrgId = currentTenantId || currentUser?.tenant?.id || currentUser?.organization_id || 1;
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newHoliday, setNewHoliday] = useState({
    holiday_name: '',
    holiday_date: ''
  });
  const [feedback, setFeedback] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'https://hrms-backend-5xo8.onrender.com';

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/holidays?orgId=${effectiveOrgId}`);
      const data = await res.json();
      if (data && Array.isArray(data.holidays)) {
        setHolidays(data.holidays);
      }
    } catch (err) {
      console.error('Error fetching holidays:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [currentTenantId]);

  const handleCreateHoliday = async (e) => {
    e.preventDefault();
    if (!newHoliday.holiday_name.trim() || !newHoliday.holiday_date) return;
    setCreating(true);
    setFeedback(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/holidays`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: effectiveOrgId,
          holiday_name: newHoliday.holiday_name.trim(),
          holiday_date: newHoliday.holiday_date
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create holiday');
      }

      setFeedback({ type: 'success', text: `Public holiday "${newHoliday.holiday_name}" added successfully!` });
      setNewHoliday({ holiday_name: '', holiday_date: '' });
      setShowModal(false);
      await fetchHolidays();
    } catch (err) {
      console.error('Error creating holiday:', err);
      setFeedback({ type: 'error', text: err.message || 'Error creating holiday' });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteHoliday = async (holidayId, holidayName) => {
    if (!window.confirm(`Are you sure you want to remove the public holiday "${holidayName}"?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/holidays/${holidayId}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete holiday');
      }
      setFeedback({ type: 'success', text: `Holiday "${holidayName}" removed.` });
      await fetchHolidays();
    } catch (err) {
      console.error('Error deleting holiday:', err);
      setFeedback({ type: 'error', text: err.message || 'Error deleting holiday' });
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingHolidays = holidays.filter(h => {
    const dStr = typeof h.holiday_date === 'string' ? h.holiday_date.split('T')[0] : '';
    return dStr >= todayStr;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-emerald-500" />
            Public Holidays Management
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure official public holidays and company days off for this organization.
          </p>
        </div>

        <button
          onClick={() => { setShowModal(true); setFeedback(null); }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-95 transition-all self-start sm:self-auto"
        >
          <PlusIcon className="w-4 h-4" />
          Add Public Holiday
        </button>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div className={`p-4 rounded-xl border text-sm flex items-center justify-between ${
          feedback.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
            : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            <span className="font-bold">{feedback.type === 'success' ? '✓' : '⚠'}</span>
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Holidays</span>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              {holidays.length}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              Annual Calendar
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Upcoming Holidays</span>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {upcomingHolidays.length}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              Scheduled Ahead
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Next Holiday</span>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-base font-bold text-gray-900 dark:text-white truncate max-w-[180px]">
              {upcomingHolidays[0]?.holiday_name || 'None Scheduled'}
            </h3>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              {upcomingHolidays[0] ? new Date(upcomingHolidays[0].holiday_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '--'}
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden dark:border-gray-800 dark:bg-gray-900">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800 dark:text-white">
            Official Organization Public Holidays ({holidays.length})
          </h3>
          <span className="text-xs text-gray-400">
            Automatically factored into attendance and leave days deduction
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent"></div>
            <p className="mt-3 text-sm text-gray-500">Loading holidays list...</p>
          </div>
        ) : holidays.length === 0 ? (
          <EmptyState
            emoji="🌴"
            title="No public holidays defined"
            message='Click "Add Public Holiday" above to schedule company holidays.'
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-gray-200 dark:bg-gray-800 dark:border-gray-800 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-4">Holiday Name</th>
                  <th scope="col" className="px-6 py-4">Date</th>
                  <th scope="col" className="px-6 py-4">Day of Week</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {holidays.map((h) => {
                  const d = new Date(h.holiday_date);
                  const isUpcoming = (typeof h.holiday_date === 'string' ? h.holiday_date.split('T')[0] : '') >= todayStr;
                  const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
                  const formattedDate = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

                  return (
                    <tr key={h.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                          {d.getDate()}
                        </div>
                        {h.holiday_name}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">
                        {formattedDate}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {dayName}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isUpcoming
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${isUpcoming ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                          {isUpcoming ? 'Upcoming' : 'Past Holiday'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteHoliday(h.id, h.holiday_name)}
                          className="rounded-lg text-rose-600 hover:bg-rose-50 p-1.5 dark:hover:bg-rose-950/30 text-xs font-semibold transition-colors"
                          title="Delete Holiday"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Holiday Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
          <div 
            className="relative w-full max-w-md my-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 max-h-[92vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Add Public Holiday
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Designate an official public holiday for your organization.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHoliday} className="flex-1 overflow-y-auto flex flex-col justify-between">
              <div className="p-5 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Holiday Title / Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Christmas Day"
                    value={newHoliday.holiday_name}
                    onChange={(e) => setNewHoliday({ ...newHoliday, holiday_name: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Holiday Date <span className="text-rose-500">*</span>
                  </label>
                  <DatePickerCalendar
                    required
                    value={newHoliday.holiday_date}
                    onChange={(dateStr) => setNewHoliday({ ...newHoliday, holiday_date: dateStr })}
                    placeholder="Click to pick holiday date from calendar"
                  />
                  <p className="mt-1 text-[11px] text-gray-400">
                    Click the field to open the calendar and pick a day.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/50 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={creating}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {creating ? 'Saving...' : 'Save Public Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

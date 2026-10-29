import React, { useState, useEffect } from 'react';

export default function ProjectTeams({
  currentTenantId = 1,
  currentUser,
  employees = []
}) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Form state
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formLeadId, setFormLeadId] = useState('');
  const [formMemberIds, setFormMemberIds] = useState([]);
  const [formStatus, setFormStatus] = useState('Active');
  const [memberSearch, setMemberSearch] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 
    (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:5002'
      : 'https://hrms-backend-5xo8.onrender.com');

  const orgId = currentTenantId || currentUser?.organization_id || 1;

  // Filter out superadmins so only actual staff can be leads or members
  const visibleEmployees = employees.filter(e => {
    const role = (e.role_name || e.roleKey || e.role || '').toLowerCase();
    const code = (e.employee_code || '').toLowerCase();
    const email = (e.email || '').toLowerCase();
    return !role.includes('super_admin') && !code.includes('emp-super') && !email.includes('superadmin');
  });

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

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/project-teams?orgId=${orgId}`);
      const data = await res.json();
      if (data && Array.isArray(data.teams)) {
        setTeams(data.teams);
      }
    } catch (err) {
      console.error('Failed to fetch project teams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [orgId]);

  const handleOpenCreateModal = () => {
    setEditingTeam(null);
    setFormName('');
    setFormCode('');
    setFormDesc('');
    setFormLeadId('');
    setFormMemberIds([]);
    setFormStatus('Active');
    setMemberSearch('');
    setShowModal(true);
  };

  const handleOpenEditModal = (team) => {
    setEditingTeam(team);
    setFormName(team.project_name || '');
    setFormCode(team.project_code || '');
    setFormDesc(team.description || '');
    setFormLeadId(team.team_lead_id ? String(team.team_lead_id) : '');
    const memberIds = (team.members || []).map(m => String(m.employee_id));
    setFormMemberIds(memberIds);
    setFormStatus(team.status || 'Active');
    setMemberSearch('');
    setShowModal(true);
  };

  const handleToggleMember = (empIdStr) => {
    setFormMemberIds(prev => 
      prev.includes(empIdStr) 
        ? prev.filter(id => id !== empIdStr) 
        : [...prev, empIdStr]
    );
  };

  const handleSaveTeam = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFeedback({ type: 'error', message: 'Project Name is required.' });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const payload = {
        organizationId: orgId,
        projectName: formName.trim(),
        projectCode: formCode.trim(),
        description: formDesc.trim(),
        teamLeadId: formLeadId ? parseInt(formLeadId, 10) : null,
        memberIds: formMemberIds.map(id => parseInt(id, 10)),
        status: formStatus,
        adminUserId: currentUser?.id
      };

      const url = editingTeam 
        ? `${API_URL}/api/admin/project-teams/${editingTeam.id}`
        : `${API_URL}/api/admin/project-teams`;
      const method = editingTeam ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save project team');
      }

      setShowModal(false);
      setFeedback({
        type: 'success',
        message: editingTeam ? 'Project team updated successfully!' : 'Project team created successfully!'
      });
      await fetchTeams();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      console.error('Save team error:', err);
      setFeedback({ type: 'error', message: err.message || 'Error saving project team.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeam = async (teamId, teamName) => {
    if (!window.confirm(`Are you sure you want to delete project team "${teamName}"?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/project-teams/${teamId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setFeedback({ type: 'success', message: `Team "${teamName}" deleted successfully.` });
        await fetchTeams();
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch (err) {
      console.error('Delete team error:', err);
      setFeedback({ type: 'error', message: 'Failed to delete team.' });
    }
  };

  const filteredTeams = teams.filter(t => {
    const q = searchTerm.toLowerCase();
    const nameMatch = (t.project_name || '').toLowerCase().includes(q);
    const codeMatch = (t.project_code || '').toLowerCase().includes(q);
    const leadMatch = (t.team_lead_name || '').toLowerCase().includes(q);
    const statusMatch = statusFilter === 'All' || t.status === statusFilter;
    return (nameMatch || codeMatch || leadMatch) && statusMatch;
  });

  const filteredMembersList = visibleEmployees.filter(emp => {
    const q = memberSearch.toLowerCase();
    const name = getEmpName(emp).toLowerCase();
    const code = (emp.employee_code || '').toLowerCase();
    const dept = (emp.department || '').toLowerCase();
    return name.includes(q) || code.includes(q) || dept.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <i className="bi bi-diagram-3-fill text-[#3c50e0]"></i>
            Project Teams Management
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Create project-wise teams, assign team leads, and map members for employee portal collaboration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchTeams}
            disabled={loading}
            className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 transition-colors cursor-pointer"
          >
            {loading ? 'Refreshing...' : '↻ Refresh'}
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-[#3c50e0] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#3245c5] transition-all cursor-pointer"
          >
            <i className="bi bi-plus-lg"></i>
            Create Project Team
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

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Teams</span>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              {teams.length}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
              Projects
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Teams</span>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {teams.filter(t => t.status === 'Active').length}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              In Delivery
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Mapped Members</span>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-[#3c50e0] dark:text-indigo-400">
              {teams.reduce((acc, t) => acc + (t.member_count || 0), 0)}
            </h3>
            <span className="text-xs text-gray-400">Assigned Seats</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <i className="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search project name, code, or team lead..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-2 text-xs text-gray-800 focus:border-[#3c50e0] focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs text-gray-800 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="In Progress">In Progress</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Teams Grid / List */}
      {loading ? (
        <div className="py-20 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#3c50e0] border-r-transparent"></div>
          <p className="mt-3 text-xs text-gray-500">Loading project teams...</p>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-[#3c50e0] dark:bg-indigo-950/40 dark:text-indigo-300 text-2xl mb-3 shadow-xs">
            <i className="bi bi-diagram-3"></i>
          </div>
          <h4 className="text-base font-bold text-gray-900 dark:text-white">No Project Teams Found</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
            {teams.length === 0
              ? 'Start by creating your first project team and assigning a team lead and members.'
              : 'No project teams match your search or filter criteria.'}
          </p>
          {teams.length === 0 && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#3c50e0] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#3245c5] cursor-pointer"
            >
              <i className="bi bi-plus-lg"></i>
              Create First Team
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTeams.map((team) => {
            const leadName = team.team_lead_name || 'Not Assigned';
            return (
              <div
                key={team.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all dark:border-gray-800 dark:bg-gray-900 flex flex-col justify-between"
              >
                <div>
                  {/* Team Top Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                          {team.project_name}
                        </h3>
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-[#3c50e0] border border-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800">
                          {team.project_code || `PRJ-${team.id}`}
                        </span>
                      </div>
                      {team.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                          {team.description}
                        </p>
                      )}
                    </div>

                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                      team.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : team.status === 'Completed'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      ● {team.status}
                    </span>
                  </div>

                  {/* Team Lead Box */}
                  <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700 mb-4">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <i className="bi bi-star-fill text-amber-500 text-xs"></i>
                      Team Lead
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#3c50e0] to-[#607afb] text-white font-bold text-xs shrink-0 shadow-xs">
                        {leadName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                            {leadName}
                          </span>
                          {team.team_lead_code && (
                            <span className="text-[10px] text-gray-400 font-mono">
                              ({team.team_lead_code})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate">
                          {team.team_lead_designation || 'Team Lead'} • {team.team_lead_email}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Team Members List */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                        Team Members ({team.member_count || 0})
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-white dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800">
                      {team.members && team.members.length > 0 ? (
                        team.members.map((m) => {
                          const isLead = m.role_in_team === 'Lead' || String(m.employee_id) === String(team.team_lead_id);
                          return (
                            <div
                              key={m.mapping_id || m.employee_id}
                              className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs ${
                                isLead
                                  ? 'bg-amber-50/60 border-amber-200/80 text-amber-900 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-200'
                                  : 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200'
                              }`}
                            >
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 font-bold text-[10px] shrink-0">
                                {m.employee_name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-semibold text-xs">{m.employee_name}</span>
                              <span className="text-[10px] text-gray-400 font-mono">({m.employee_code})</span>
                              {isLead && (
                                <span className="bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-300 px-1.5 py-0.2 rounded text-[9px] font-bold">
                                  LEAD
                                </span>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <span className="text-xs text-gray-400 italic p-1">No members mapped yet.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Team Footer Actions */}
                <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(team)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#3c50e0] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                  >
                    <i className="bi bi-pencil-square"></i>
                    Edit Team
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteTeam(team.id, team.project_name)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
                  >
                    <i className="bi bi-trash3"></i>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT TEAM MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-[#3c50e0] dark:bg-indigo-950/40 dark:text-indigo-300">
                  <i className="bi bi-diagram-3-fill text-lg"></i>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {editingTeam ? 'Edit Project Team' : 'Create Project Team'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Define project details, assign a team lead, and select project members.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <i className="bi bi-x-lg text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSaveTeam} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Project / Team Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Enterprise HRMS Platform"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs text-gray-800 focus:border-[#3c50e0] focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Project Code
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="e.g. PRJ-HRMS (auto-generated if empty)"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs text-gray-800 focus:border-[#3c50e0] focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Assign Team Lead
                  </label>
                  <select
                    value={formLeadId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormLeadId(val);
                      if (val && !formMemberIds.includes(val)) {
                        setFormMemberIds(prev => [...prev, val]);
                      }
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs text-gray-800 focus:border-[#3c50e0] focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">-- Select Team Lead --</option>
                    {visibleEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employee_code} - {getEmpName(emp)} ({emp.designation || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Project Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs text-gray-800 focus:border-[#3c50e0] focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="Active">Active</option>
                    <option value="In Progress">In Progress</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Project Description
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Brief summary of project scope, objectives, or responsibilities..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-800 focus:border-[#3c50e0] focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Select Team Members (Multi-Select Checklist) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Select Team Members ({formMemberIds.length} selected)
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormMemberIds(visibleEmployees.map(e => String(e.id)))}
                      className="text-[11px] font-semibold text-[#3c50e0] hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => setFormMemberIds([])}
                      className="text-[11px] font-semibold text-gray-400 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="relative mb-2">
                  <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search employees to add..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-8 pr-3 py-1.5 text-xs text-gray-800 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200/60 dark:border-gray-700">
                  {filteredMembersList.map(emp => {
                    const empIdStr = String(emp.id);
                    const isChecked = formMemberIds.includes(empIdStr);
                    const isLead = formLeadId === empIdStr;
                    const name = getEmpName(emp);

                    return (
                      <label
                        key={emp.id}
                        className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors text-xs ${
                          isChecked
                            ? 'bg-indigo-50/50 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-800'
                            : 'bg-white border-gray-100 hover:bg-gray-100/50 dark:bg-gray-800 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleMember(empIdStr)}
                            className="h-4 w-4 rounded border-gray-300 text-[#3c50e0] focus:ring-[#3c50e0]"
                          />
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-[#3c50e0] font-bold text-xs shrink-0">
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <span className="font-bold text-gray-900 dark:text-white mr-1.5">{name}</span>
                            <span className="text-[11px] text-gray-400 font-mono">({emp.employee_code})</span>
                            <span className="text-[11px] text-gray-500 ml-2">{emp.designation || 'Staff'}</span>
                          </div>
                        </div>

                        {isLead && (
                          <span className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                            Team Lead
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#3c50e0] hover:bg-[#3245c5] shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="spinner-border spinner-border-sm" role="status"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg"></i>
                      {editingTeam ? 'Update Team' : 'Create Team'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import EmptyState from '../components/EmptyState';

const API_BASE = import.meta.env.VITE_API_URL || 'https://hrms-backend-5xo8.onrender.com';

const CATEGORIES = [
  'Company News',
  'Policy Update',
  'Event & Celebrations',
  'Urgent Alert',
  'Holiday Notice',
  'General Information'
];

const PRIORITIES = [
  { value: 'Normal', label: 'Normal', color: 'secondary' },
  { value: 'Important', label: 'Important', color: 'primary' },
  { value: 'Urgent', label: 'Urgent Alert', color: 'danger' }
];

export default function Announcements({ currentUser, employeeProfile }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterScope, setFilterScope] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  // Targets for project & employee selection
  const [targets, setTargets] = useState({ projects: [], employees: [] });
  const [targetsLoading, setTargetsLoading] = useState(false);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'Company News',
    priority: 'Normal',
    targetType: 'all', // 'all', 'project', 'employee'
    targetId: '',
    targetName: '',
    expiresAt: ''
  });

  const orgId = currentUser?.tenant?.id || employeeProfile?.organization_id || 1;

  // Show toast notification
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch announcements list (HR management view fetches all for tenant)
  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/announcements?orgId=${orgId}&all=true`);
      const data = await res.json();
      if (data && data.success) {
        setAnnouncements(data.announcements || []);
        setError(null);
      } else {
        setError(data?.error || 'Failed to load announcements');
      }
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError('Unable to reach server. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch dropdown targets (projects and employees)
  const fetchTargets = async () => {
    setTargetsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/announcements/targets?orgId=${orgId}`);
      const data = await res.json();
      if (data && data.success) {
        setTargets({
          projects: data.projects || [],
          employees: data.employees || []
        });
      }
    } catch (err) {
      console.error('Error fetching targets:', err);
    } finally {
      setTargetsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    fetchTargets();
  }, [orgId]);

  // Handle form change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };

      // Update targetName when targetId changes
      if (name === 'targetId') {
        if (prev.targetType === 'project') {
          const prj = targets.projects.find(p => String(p.id) === String(value));
          updated.targetName = prj ? (prj.project_name || prj.project_code) : '';
        } else if (prev.targetType === 'employee') {
          const emp = targets.employees.find(e => String(e.id) === String(value));
          updated.targetName = emp ? (emp.full_name || emp.employee_code) : '';
        }
      }

      // Reset targetId and targetName when targetType changes
      if (name === 'targetType') {
        updated.targetId = '';
        updated.targetName = value === 'all' ? 'All Employees (Company-wide)' : '';
      }

      return updated;
    });
  };

  // Open creation modal
  const openCreateModal = () => {
    setFormData({
      title: '',
      content: '',
      category: 'Company News',
      priority: 'Normal',
      targetType: 'all',
      targetId: '',
      targetName: 'All Employees (Company-wide)',
      expiresAt: ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Submit announcement
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title.trim()) {
      setFormError('Please enter an announcement title.');
      return;
    }
    if (!formData.content.trim()) {
      setFormError('Please enter announcement content.');
      return;
    }
    if (formData.targetType === 'project' && !formData.targetId) {
      setFormError('Please select a target project.');
      return;
    }
    if (formData.targetType === 'employee' && !formData.targetId) {
      setFormError('Please select an employee.');
      return;
    }

    // Expiry date validation: must be strictly greater than current date
    if (formData.expiresAt) {
      const expDate = new Date(formData.expiresAt);
      expDate.setHours(0, 0, 0, 0);
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      if (isNaN(expDate.getTime()) || expDate <= todayDate) {
        setFormError('Expiration date must be greater than current date.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const authorName = employeeProfile?.first_name 
        ? `${employeeProfile.first_name} ${employeeProfile.last_name || ''} (HR)` 
        : (currentUser?.name || 'HR Manager');

      const payload = {
        organizationId: orgId,
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        priority: formData.priority,
        targetType: formData.targetType,
        targetId: formData.targetId ? parseInt(formData.targetId, 10) : null,
        targetName: formData.targetName || (formData.targetType === 'all' ? 'All Employees (Company-wide)' : ''),
        authorName,
        expiresAt: formData.expiresAt || null,
        createdByUserId: currentUser?.id || null
      };

      const res = await fetch(`${API_BASE}/api/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data && data.success) {
        setIsModalOpen(false);
        showToast('Announcement published successfully! Target members were notified.');
        fetchAnnouncements();
      } else {
        setFormError(data?.error || 'Failed to publish announcement');
      }
    } catch (err) {
      console.error('Submit announcement error:', err);
      setFormError('Network error while publishing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle active status
  const handleToggleActive = async (item) => {
    try {
      const res = await fetch(`${API_BASE}/api/announcements/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !item.is_active })
      });
      const data = await res.json();
      if (data && data.success) {
        setAnnouncements(prev => prev.map(a => a.id === item.id ? { ...a, is_active: !item.is_active } : a));
        showToast(`Announcement marked as ${!item.is_active ? 'Active' : 'Inactive'}.`);
      }
    } catch (err) {
      console.error('Error toggling announcement:', err);
    }
  };

  // Delete announcement
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) return;

    try {
      const res = await fetch(`${API_BASE}/api/announcements/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data && data.success) {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
        showToast('Announcement deleted successfully.');
        if (selectedAnnouncement?.id === id) {
          setSelectedAnnouncement(null);
        }
      }
    } catch (err) {
      console.error('Error deleting announcement:', err);
    }
  };

  // Filtered announcements
  const filteredList = announcements.filter(item => {
    const matchesSearch = !searchQuery.trim() || 
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.target_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesScope = filterScope === 'all' || item.target_type === filterScope;
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;

    return matchesSearch && matchesScope && matchesCategory;
  });

  // KPI counts
  const totalCount = announcements.length;
  const activeCount = announcements.filter(a => a.is_active).length;
  const orgCount = announcements.filter(a => a.target_type === 'all').length;
  const targetedCount = announcements.filter(a => a.target_type !== 'all').length;

  return (
    <div className="container-fluid px-3 px-md-4 py-3">
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          className="position-fixed top-0 end-0 p-3" 
          style={{ zIndex: 1080 }}
        >
          <div className="toast show align-items-center text-white bg-success border-0 shadow-lg rounded-3" role="alert">
            <div className="d-flex">
              <div className="toast-body d-flex align-items-center gap-2">
                <i className="bi bi-check-circle-fill fs-5"></i>
                <span>{toastMessage}</span>
              </div>
              <button 
                type="button" 
                className="btn-close btn-close-white me-2 m-auto" 
                onClick={() => setToastMessage(null)}
              ></button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-primary text-white rounded-pill px-2.5 py-1" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
              HR PORTAL
            </span>
            <span className="text-muted small">Tenant #{orgId}</span>
          </div>
          <h2 className="mb-1 mt-1 fw-bold text-dark">HR Announcements</h2>
          <p className="text-muted mb-0 small">
            Broadcast official updates company-wide, or deliver targeted announcements based on project or individual employee.
          </p>
        </div>

        <button 
          type="button" 
          className="btn btn-primary rounded-pill px-3 py-2 d-inline-flex align-items-center gap-2 shadow-sm"
          onClick={openCreateModal}
          style={{ fontWeight: 600, fontSize: '13.5px' }}
        >
          <i className="bi bi-megaphone-fill"></i>
          <span>Create Announcement</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-xs rounded-3 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '11px' }}>Total Announcements</span>
                <h3 className="mb-0 fw-bold text-dark mt-1">{totalCount}</h3>
              </div>
              <div className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center" style={{ width: 44, height: 44 }}>
                <i className="bi bi-megaphone fs-5"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-xs rounded-3 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '11px' }}>Active Broadcasts</span>
                <h3 className="mb-0 fw-bold text-success mt-1">{activeCount}</h3>
              </div>
              <div className="rounded-circle bg-success-subtle text-success d-flex align-items-center justify-content-center" style={{ width: 44, height: 44 }}>
                <i className="bi bi-broadcast fs-5"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-xs rounded-3 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '11px' }}>Company-Wide (All)</span>
                <h3 className="mb-0 fw-bold text-primary mt-1">{orgCount}</h3>
              </div>
              <div className="rounded-circle bg-indigo-subtle text-primary d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, backgroundColor: '#ede9fe', color: '#6366f1' }}>
                <i className="bi bi-buildings fs-5"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-xs rounded-3 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '11px' }}>Project / Employee Targeted</span>
                <h3 className="mb-0 fw-bold text-warning mt-1">{targetedCount}</h3>
              </div>
              <div className="rounded-circle bg-warning-subtle text-warning d-flex align-items-center justify-content-center" style={{ width: 44, height: 44 }}>
                <i className="bi bi-bullseye fs-5"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card border-0 shadow-xs rounded-3 p-3 bg-white mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0"
                placeholder="Search announcements by title, content or target..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="btn btn-light border" onClick={() => setSearchQuery('')}>
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={filterScope}
              onChange={(e) => setFilterScope(e.target.value)}
            >
              <option value="all">All Scopes (Company, Project, Employee)</option>
              <option value="all">🏢 Company-wide Only</option>
              <option value="project">📁 Project-based Only</option>
              <option value="employee">👤 Individual Employee Only</option>
            </select>
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat, i) => (
                <option key={i} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-2 text-md-end">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary w-100 rounded-pill d-inline-flex align-items-center justify-content-center gap-1"
              onClick={fetchAnnouncements}
              title="Refresh list"
            >
              <i className="bi bi-arrow-clockwise"></i>
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="d-flex flex-column align-items-center justify-content-center py-5 my-5 text-muted">
          <div className="spinner-border text-primary mb-3" role="status"></div>
          <h6>Loading announcements...</h6>
        </div>
      ) : error ? (
        <div className="alert alert-danger p-3 rounded-3" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      ) : filteredList.length === 0 ? (
        <EmptyState
          emoji="📢"
          title="No announcements found"
          message={
            searchQuery || filterScope !== 'all' || filterCategory !== 'all'
              ? 'No announcements match the selected filter criteria. Try clearing filters.'
              : 'You have not created any announcements yet. Click "+ Create Announcement" to broadcast to employees.'
          }
        />
      ) : (
        <div className="row g-3">
          {filteredList.map((item) => {
            const isCompanyWide = item.target_type === 'all';
            const isProject = item.target_type === 'project';
            const isEmployee = item.target_type === 'employee';

            return (
              <div className="col-12 col-lg-6 col-xl-4" key={item.id}>
                <div 
                  className={`card border-0 shadow-xs rounded-3 h-100 transition-all ${!item.is_active ? 'opacity-75 bg-light' : 'bg-white'}`}
                  style={{ borderLeft: `4px solid ${item.priority === 'Urgent' ? '#ef4444' : item.priority === 'Important' ? '#3b82f6' : '#10b981'}` }}
                >
                  <div className="card-body p-3 d-flex flex-column">
                    {/* Top Row: Category, Priority, Active Toggle */}
                    <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                      <div className="d-flex align-items-center gap-1.5 flex-wrap">
                        <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: '11px' }}>
                          {item.category || 'Company News'}
                        </span>
                        {item.priority === 'Urgent' && (
                          <span className="badge bg-danger text-white px-2 py-1" style={{ fontSize: '11px' }}>
                            <i className="bi bi-exclamation-circle-fill me-1"></i>Urgent
                          </span>
                        )}
                        {item.priority === 'Important' && (
                          <span className="badge bg-primary text-white px-2 py-1" style={{ fontSize: '11px' }}>
                            Important
                          </span>
                        )}
                      </div>

                      <div className="form-check form-switch m-0" title="Toggle active/inactive status">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          checked={item.is_active}
                          onChange={() => handleToggleActive(item)}
                          style={{ cursor: 'pointer' }}
                        />
                      </div>
                    </div>

                    {/* Announcement Title */}
                    <h5 className="card-title fw-bold text-dark mb-1" style={{ fontSize: '16px' }}>
                      {item.title}
                    </h5>

                    {/* Target Scope Badge */}
                    <div className="mb-2">
                      {isCompanyWide && (
                        <span className="badge bg-primary-subtle text-primary rounded-pill px-2.5 py-1" style={{ fontSize: '11px' }}>
                          <i className="bi bi-buildings me-1"></i> Company-wide (All Employees)
                        </span>
                      )}
                      {isProject && (
                        <span className="badge bg-info-subtle text-info rounded-pill px-2.5 py-1" style={{ fontSize: '11px' }}>
                          <i className="bi bi-diagram-3 me-1"></i> Project: {item.target_name || `#${item.target_id}`}
                        </span>
                      )}
                      {isEmployee && (
                        <span className="badge bg-warning-subtle text-warning-emphasis rounded-pill px-2.5 py-1" style={{ fontSize: '11px' }}>
                          <i className="bi bi-person me-1"></i> Employee: {item.target_name || `#${item.target_id}`}
                        </span>
                      )}
                    </div>

                    {/* Content Preview */}
                    <p className="card-text text-muted small flex-grow-1" style={{ lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                      {item.content && item.content.length > 160 
                        ? `${item.content.slice(0, 160)}...` 
                        : item.content}
                    </p>

                    {/* Meta info & actions */}
                    <div className="pt-2 mt-2 border-top d-flex align-items-center justify-content-between text-muted small" style={{ fontSize: '11.5px' }}>
                      <div>
                        <span><i className="bi bi-calendar3 me-1"></i>{new Date(item.created_at).toLocaleDateString()}</span>
                        <span className="ms-2">By: {item.author_name || 'HR'}</span>
                      </div>

                      <div className="d-flex align-items-center gap-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-light border px-2 py-0.5 text-primary"
                          onClick={() => setSelectedAnnouncement(item)}
                          title="View full announcement details"
                          style={{ fontSize: '11px' }}
                        >
                          <i className="bi bi-eye"></i> View
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-light border px-2 py-0.5 text-danger"
                          onClick={() => handleDelete(item.id)}
                          title="Delete announcement"
                          style={{ fontSize: '11px' }}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE ANNOUNCEMENT MODAL */}
      {isModalOpen && (
        <div 
          className="modal fade show d-block" 
          tabIndex="-1" 
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(3px)', zIndex: 1060 }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div 
                className="modal-header text-white px-4 py-3"
                style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' }}
              >
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded-circle bg-white text-primary p-2 d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
                    <i className="bi bi-megaphone-fill"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-white mb-0">Create New HR Announcement</h5>
                    <small className="text-white-50">Publish an update to employees across your organization</small>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setIsModalOpen(false)}
                ></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  {formError && (
                    <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3">
                      <i className="bi bi-exclamation-triangle-fill me-1"></i> {formError}
                    </div>
                  )}

                  <div className="row g-3">
                    {/* Announcement Title */}
                    <div className="col-12">
                      <label className="form-label fw-semibold small">
                        Announcement Title <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="title"
                        className="form-control"
                        placeholder="e.g. Annual Company Town Hall, Q4 Milestone Celebration, Updated Leave Policy"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    {/* Category & Priority */}
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small">Category</label>
                      <select
                        name="category"
                        className="form-select"
                        value={formData.category}
                        onChange={handleInputChange}
                      >
                        {CATEGORIES.map((cat, i) => (
                          <option key={i} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small">Priority Level</label>
                      <select
                        name="priority"
                        className="form-select"
                        value={formData.priority}
                        onChange={handleInputChange}
                      >
                        {PRIORITIES.map((p, i) => (
                          <option key={i} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Target Scope Selection */}
                    <div className="col-12">
                      <div className="p-3 bg-light rounded-3 border">
                        <label className="form-label fw-bold small text-dark d-block mb-2">
                          <i className="bi bi-bullseye me-1 text-primary"></i> Target Audience & Scope <span className="text-danger">*</span>
                        </label>
                        <div className="row g-2 mb-3">
                          <div className="col-12 col-md-4">
                            <label className={`card p-2.5 border h-100 cursor-pointer ${formData.targetType === 'all' ? 'border-primary bg-primary-subtle bg-opacity-25' : 'bg-white'}`} style={{ cursor: 'pointer' }}>
                              <div className="d-flex align-items-center gap-2">
                                <input
                                  type="radio"
                                  name="targetType"
                                  value="all"
                                  checked={formData.targetType === 'all'}
                                  onChange={handleInputChange}
                                  className="form-check-input mt-0"
                                />
                                <div>
                                  <div className="fw-semibold small text-dark">Company-Wide</div>
                                  <small className="text-muted" style={{ fontSize: '11px' }}>All employees in tenant</small>
                                </div>
                              </div>
                            </label>
                          </div>

                          <div className="col-12 col-md-4">
                            <label className={`card p-2.5 border h-100 cursor-pointer ${formData.targetType === 'project' ? 'border-primary bg-primary-subtle bg-opacity-25' : 'bg-white'}`} style={{ cursor: 'pointer' }}>
                              <div className="d-flex align-items-center gap-2">
                                <input
                                  type="radio"
                                  name="targetType"
                                  value="project"
                                  checked={formData.targetType === 'project'}
                                  onChange={handleInputChange}
                                  className="form-check-input mt-0"
                                />
                                <div>
                                  <div className="fw-semibold small text-dark">Project-Based</div>
                                  <small className="text-muted" style={{ fontSize: '11px' }}>Specific project team</small>
                                </div>
                              </div>
                            </label>
                          </div>

                          <div className="col-12 col-md-4">
                            <label className={`card p-2.5 border h-100 cursor-pointer ${formData.targetType === 'employee' ? 'border-primary bg-primary-subtle bg-opacity-25' : 'bg-white'}`} style={{ cursor: 'pointer' }}>
                              <div className="d-flex align-items-center gap-2">
                                <input
                                  type="radio"
                                  name="targetType"
                                  value="employee"
                                  checked={formData.targetType === 'employee'}
                                  onChange={handleInputChange}
                                  className="form-check-input mt-0"
                                />
                                <div>
                                  <div className="fw-semibold small text-dark">Particular Employee</div>
                                  <small className="text-muted" style={{ fontSize: '11px' }}>Single individual</small>
                                </div>
                              </div>
                            </label>
                          </div>
                        </div>

                        {/* Conditional Dropdown for Project */}
                        {formData.targetType === 'project' && (
                          <div>
                            <label className="form-label small fw-semibold">
                              Select Project Team <span className="text-danger">*</span>
                            </label>
                            <select
                              name="targetId"
                              className="form-select form-select-sm"
                              value={formData.targetId}
                              onChange={handleInputChange}
                              required
                            >
                              <option value="">-- Choose a project --</option>
                              {targets.projects.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.project_name} ({p.project_code || `ID: ${p.id}`})
                                </option>
                              ))}
                            </select>
                            <small className="text-muted mt-1 d-block" style={{ fontSize: '11.5px' }}>
                              Only members assigned to this project will receive this announcement.
                            </small>
                          </div>
                        )}

                        {/* Conditional Dropdown for Particular Employee */}
                        {formData.targetType === 'employee' && (
                          <div>
                            <label className="form-label small fw-semibold">
                              Select Employee <span className="text-danger">*</span>
                            </label>
                            <select
                              name="targetId"
                              className="form-select form-select-sm"
                              value={formData.targetId}
                              onChange={handleInputChange}
                              required
                            >
                              <option value="">-- Choose an employee --</option>
                              {targets.employees.map(e => (
                                <option key={e.id} value={e.id}>
                                  {e.full_name} ({e.employee_code}) - {e.designation || 'Staff'}
                                </option>
                              ))}
                            </select>
                            <small className="text-muted mt-1 d-block" style={{ fontSize: '11.5px' }}>
                              This announcement will be delivered directly and exclusively to this employee.
                            </small>
                          </div>
                        )}

                        {formData.targetType === 'all' && (
                          <div className="text-muted small" style={{ fontSize: '12px' }}>
                            <i className="bi bi-info-circle text-primary me-1"></i>
                            This broadcast will be visible to <strong>all employees</strong> in organization #{orgId}.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Announcement Content */}
                    <div className="col-12">
                      <label className="form-label fw-semibold small">
                        Announcement Message & Content <span className="text-danger">*</span>
                      </label>
                      <textarea
                        name="content"
                        className="form-control"
                        rows="4"
                        placeholder="Write the full message details, guidelines, meeting links, or instructions..."
                        value={formData.content}
                        onChange={handleInputChange}
                        required
                      ></textarea>
                    </div>

                    {/* Optional Expiration Date (must be strictly greater than current date) */}
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small text-muted">
                        Expiration Date (Optional)
                      </label>
                      <input
                        type="date"
                        name="expiresAt"
                        className="form-control form-control-sm"
                        min={(() => {
                          const d = new Date();
                          d.setDate(d.getDate() + 1);
                          return d.toISOString().split('T')[0];
                        })()}
                        value={formData.expiresAt}
                        onChange={handleInputChange}
                      />
                      <small className="text-muted d-block mt-1" style={{ fontSize: '11px' }}>
                        <i className="bi bi-info-circle me-1 text-primary"></i>Must be greater than current date (tomorrow onwards).
                      </small>
                    </div>
                  </div>
                </div>

                <div className="modal-footer px-4 py-3 bg-light">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary rounded-pill px-3" 
                    onClick={() => setIsModalOpen(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary rounded-pill px-4 fw-semibold d-inline-flex align-items-center gap-2"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send-fill"></i>
                        <span>Publish Announcement</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* VIEW ANNOUNCEMENT DETAILS MODAL */}
      {selectedAnnouncement && (
        <div 
          className="modal fade show d-block" 
          tabIndex="-1" 
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(3px)', zIndex: 1060 }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedAnnouncement(null); }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-light px-4 py-3 border-bottom">
                <div>
                  <span className="badge bg-primary text-white rounded-pill px-2.5 py-0.5 mb-1" style={{ fontSize: '10.5px' }}>
                    {selectedAnnouncement.category || 'Company News'}
                  </span>
                  <h5 className="modal-title fw-bold text-dark mb-0">
                    {selectedAnnouncement.title}
                  </h5>
                </div>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setSelectedAnnouncement(null)}
                ></button>
              </div>

              <div className="modal-body p-4">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 p-2.5 bg-light rounded-3 mb-3" style={{ fontSize: '12px' }}>
                  <div>
                    <span className="text-muted">Target: </span>
                    <strong className="text-dark">{selectedAnnouncement.target_name || selectedAnnouncement.target_type}</strong>
                  </div>
                  <div>
                    <span className="text-muted">Priority: </span>
                    <span className={`fw-semibold ${selectedAnnouncement.priority === 'Urgent' ? 'text-danger' : selectedAnnouncement.priority === 'Important' ? 'text-primary' : 'text-secondary'}`}>
                      {selectedAnnouncement.priority}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">Status: </span>
                    <span className={`badge ${selectedAnnouncement.is_active ? 'bg-success' : 'bg-secondary'}`}>
                      {selectedAnnouncement.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <h6 className="fw-semibold text-muted small text-uppercase mb-1" style={{ fontSize: '11px' }}>Message Details</h6>
                  <div className="p-3 bg-light rounded-3 border text-dark" style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap', fontSize: '14px' }}>
                    {selectedAnnouncement.content}
                  </div>
                </div>

                <div className="d-flex align-items-center justify-content-between text-muted small pt-2 border-top" style={{ fontSize: '11.5px' }}>
                  <span>Published on: {new Date(selectedAnnouncement.created_at).toLocaleString()}</span>
                  <span>Author: {selectedAnnouncement.author_name || 'HR Department'}</span>
                </div>
              </div>

              <div className="modal-footer px-4 py-2.5 bg-light">
                <button 
                  type="button" 
                  className="btn btn-secondary rounded-pill px-3 py-1 btn-sm" 
                  onClick={() => setSelectedAnnouncement(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import EmptyState from '../../components/EmptyState';
import { PlusIcon } from '../components/Icons';
import EmployeeProfileView from './EmployeeProfileView';

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
      : 'https://hrms-backend-fzef.onrender.com');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'list'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Local state for optimistic update on save
  const [localEmployees, setLocalEmployees] = useState(employees);

  useEffect(() => {
    setLocalEmployees(employees);
  }, [employees]);

  // Profile view navigation
  const [selectedEmployeeForView, setSelectedEmployeeForView] = useState(null);

  // Floating 3-dots menu state
  const [openMenuId, setOpenMenuId] = useState(null);

  // Company Roles list from backend (roles table)
  const [companyRoles, setCompanyRoles] = useState([]);

  // Delete / Deactivate modal state
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Edit Employment Details modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({
    role_key: '',
    role_id: '',
    designation: '',
    department: 'Engineering',
    team: '',
    location: 'Remote',
    employment_type: 'Full Time',
    status: 'Active',
    joining_date: ''
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Fetch Company Created Roles on component mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch(API_URL + '/api/admin/roles').catch(function() { return null; });
        if (res && res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setCompanyRoles(data);
          }
        }
      } catch (err) {
        console.error('Error fetching company roles:', err);
      }
    };
    fetchRoles();
  }, [API_URL]);

  // Close 3-dots menu when clicking outside
  useEffect(() => {
    const handleWindowClick = () => {
      setOpenMenuId(null);
    };
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  // Filter out superadmin records
  const visibleEmployees = localEmployees.filter(e => {
    const role = (e.role_name || e.roleKey || e.role || '').toLowerCase();
    const email = (e.email || '').toLowerCase();
    const code = (e.employee_code || '').toLowerCase();
    const name = ((e.first_name || '') + ' ' + (e.last_name || '') + ' ' + (e.full_name || '')).toLowerCase();
    return !role.includes('superadmin') && 
           !role.includes('super_admin') && 
           !email.includes('superadmin') &&
           code !== 'emp-super' &&
           !name.includes('super admin');
  });

  // Extract unique departments for filter dropdown
  const departments = ['All', ...new Set(visibleEmployees.map(e => e.department).filter(Boolean))];

  // Apply search and filter
  const filteredEmployees = visibleEmployees.filter(emp => {
    const fullName = (emp.full_name || ((emp.first_name || '') + ' ' + (emp.last_name || ''))).toLowerCase();
    const code = (emp.employee_code || '').toLowerCase();
    const email = (emp.email || '').toLowerCase();
    const designation = (emp.designation || '').toLowerCase();
    const team = (emp.team || '').toLowerCase();
    const search = searchTerm.toLowerCase();

    const matchesSearch = !searchTerm || 
      fullName.includes(search) || 
      code.includes(search) || 
      email.includes(search) || 
      designation.includes(search) ||
      team.includes(search);

    const matchesDept = selectedDept === 'All' || emp.department === selectedDept;

    return matchesSearch && matchesDept;
  });

  // Apply sorting
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    if (sortBy === 'name') {
      const nameA = a.full_name || a.first_name || '';
      const nameB = b.full_name || b.first_name || '';
      return nameA.localeCompare(nameB);
    }
    if (sortBy === 'department') {
      return (a.department || '').localeCompare(b.department || '');
    }
    if (sortBy === 'employee-id') {
      return (a.employee_code || '').localeCompare(b.employee_code || '');
    }
    // Default 'recent': higher id or created_at first
    return (b.id || 0) - (a.id || 0);
  });

  // Pagination calculation
  const totalEmployees = sortedEmployees.length;
  const totalPages = Math.ceil(totalEmployees / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const currentEmployees = sortedEmployees.slice(startIndex, startIndex + pageSize);

  // Deactivate modal handlers
  const handleOpenDeleteModal = (emp) => {
    setEmployeeToDelete(emp);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    if (!deleting) {
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    setDeleting(true);
    setFeedback(null);

    try {
      const empId = employeeToDelete.id;
      const res = await fetch(API_URL + '/api/admin/employees/' + empId, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to deactivate employee');
      }

      setFeedback({ type: 'success', message: 'Employee ' + (employeeToDelete.full_name || employeeToDelete.employee_code) + ' deactivated successfully' });
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
      if (fetchEmployees) fetchEmployees();
    } catch (err) {
      setFeedback({ type: 'danger', message: err.message || 'Failed to deactivate employee' });
    } finally {
      setDeleting(false);
    }
  };

  // Edit Employment Details handlers
  const handleOpenEditEmploymentModal = (emp) => {
    setEmployeeToEdit(emp);
    
    // Resolve matching company role
    const matchedRole = companyRoles.find(r => 
      r.role_key === emp.role_key ||
      r.role_key === emp.roleKey ||
      r.role_name === emp.role_name ||
      (r.role_key && emp.role && r.role_key.toLowerCase() === emp.role.toLowerCase())
    );

    setEditFormData({
      role_key: matchedRole ? matchedRole.role_key : (emp.role_key || 'SOFTWARE_ENGINEER'),
      role_id: matchedRole ? matchedRole.id : '',
      designation: emp.designation || (matchedRole ? matchedRole.role_name : 'Software Engineer'),
      department: emp.department || 'NA',
      team: emp.team || 'Backend',
      location: emp.location || emp.work_mode || 'NA',
      employment_type: emp.employment_type || 'NA',
      status: emp.status || 'Active',
      joining_date: emp.joining_date ? emp.joining_date.split('T')[0] : ''
    });
    setShowEditModal(true);
  };

  const handleSaveEmploymentDetails = async (e) => {
    if (e) e.preventDefault();
    if (!employeeToEdit) return;
    setSavingEdit(true);
    setFeedback(null);

    try {
      const res = await fetch(API_URL + '/api/admin/employees/' + employeeToEdit.id + '/employment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to update employment details');
      }

      // Optimistically update local list so card updates immediately
      setLocalEmployees(prev => prev.map(emp => {
        if (emp.id === employeeToEdit.id) {
          const selectedRole = companyRoles.find(r => r.role_key === editFormData.role_key);
          return {
            ...emp,
            designation: editFormData.designation,
            department: editFormData.department,
            team: editFormData.team,
            location: editFormData.location,
            work_mode: editFormData.location,
            employment_type: editFormData.employment_type,
            status: editFormData.status,
            joining_date: editFormData.joining_date || emp.joining_date,
            role_key: editFormData.role_key,
            role_name: selectedRole ? selectedRole.role_name : emp.role_name
          };
        }
        return emp;
      }));

      setFeedback({
        type: 'success',
        message: 'Employment details updated successfully for ' + (employeeToEdit.full_name || employeeToEdit.first_name || 'Employee')
      });
      setShowEditModal(false);
      setEmployeeToEdit(null);
      if (fetchEmployees) fetchEmployees();
    } catch (err) {
      setFeedback({ type: 'danger', message: err.message || 'Error updating employment details' });
    } finally {
      setSavingEdit(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (!sortedEmployees || sortedEmployees.length === 0) return;
    const headers = ['ID', 'Employee Code', 'Full Name', 'Email', 'Department', 'Designation', 'Status', 'Joining Date', 'Employment Type'];
    const rows = sortedEmployees.map(e => [
      e.id,
      e.employee_code || '',
      e.full_name || ((e.first_name || '') + ' ' + (e.last_name || '')),
      e.email || '',
      e.department || '',
      e.designation || '',
      e.status || 'Active',
      e.joining_date ? e.joining_date.split('T')[0] : '',
      e.employment_type || 'Full Time'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join(String.fromCharCode(10));
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'employees_export_' + new Date().toISOString().split('T')[0] + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // If user clicked "View" or "View Profile", render the full EmployeeProfileView
  if (selectedEmployeeForView) {
    return (
      <EmployeeProfileView
        employee={selectedEmployeeForView}
        onBack={() => setSelectedEmployeeForView(null)}
        currentUser={currentUser}
      />
    );
  }

  return (
    <div className="employee-list-page">
      {/* Top Header */}
      <div className="employee-page-header">
        <div>
          <h2 className="employee-page-title">Employee List</h2>
          <p className="employee-page-subtitle">Manage employees, departments, teams, assignments and employment details.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button 
            type="button" 
            className="btn-admin-secondary"
            onClick={handleExportCSV}
            title="Download CSV report of current employees"
          >
            <i className="bi bi-download me-1"></i>
            <span>Export</span>
          </button>
          <button 
            type="button" 
            className="btn-admin-primary"
            onClick={onOpenAddModal}
          >
            <i className="bi bi-plus-lg me-1"></i>
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Hero Welcome Banner */}
      <div className="en-welcome-banner mb-4">
        <div className="en-welcome-icon">
          <i className="bi bi-people-fill"></i>
        </div>
        <div className="en-welcome-content">
          <span className="en-eyebrow">WORKFORCE DIRECTORY &amp; ROSTER</span>
          <h3>Enterprise Staff Directory &amp; Roster Overview</h3>
          <p>Search, filter, and inspect detailed employment records across branches, departments, and working modes.</p>
        </div>
        <div className="en-banner-decoration">
          <i className="bi bi-people"></i>
          <i className="bi bi-stars"></i>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedback && (
        <div className={'alert alert-' + feedback.type + ' alert-dismissible fade show rounded-3 mb-4'} role="alert">
          <i className={'bi ' + (feedback.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill') + ' me-2'}></i>
          {feedback.message}
          <button type="button" className="btn-close" onClick={() => setFeedback(null)} aria-label="Close"></button>
        </div>
      )}

      {/* Search, Filter & Toolbar Bar */}
      <div className="employee-toolbar-card mb-4">
        <div className="employee-search-row">
          {/* Universal Search Input */}
          <div className="employee-search-input-wrapper">
            <i className="bi bi-search"></i>
            <input 
              type="text" 
              className="employee-search-input"
              placeholder="Search by employee ID, name, email, phone, department or designation..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchTerm && (
              <button 
                type="button" 
                className="btn-clear-search"
                onClick={() => setSearchTerm('')}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            )}
          </div>

          {/* Department Filter */}
          <div className="employee-filter-select-wrapper">
            <label>Department:</label>
            <select 
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setCurrentPage(1);
              }}
              className="employee-filter-select"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="employee-filter-select-wrapper">
            <label>Sort:</label>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="employee-filter-select"
            >
              <option value="recent">Recently Joined</option>
              <option value="name">Employee Name</option>
              <option value="department">Department</option>
              <option value="employee-id">Employee ID</option>
            </select>
          </div>

          {/* View Switcher (Cards vs List) */}
          <div className="employee-view-switcher" role="group">
            <button 
              type="button" 
              className={'employee-view-btn ' + (viewMode === 'cards' ? 'active' : '')}
              onClick={() => setViewMode('cards')}
              title="Card view"
            >
              <i className="bi bi-grid-fill"></i>
            </button>
            <button 
              type="button" 
              className={'employee-view-btn ' + (viewMode === 'list' ? 'active' : '')}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <i className="bi bi-list-ul"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading workforce...</span>
          </div>
          <p className="text-muted mt-3 fw-medium">Loading employee roster...</p>
        </div>
      ) : currentEmployees.length === 0 ? (
        <div className="admin-card text-center py-5">
          <div className="my-4">
            <EmptyState
              title={searchTerm || selectedDept !== 'All' ? 'No matching employees found' : 'No employees added yet'}
              description={searchTerm || selectedDept !== 'All' ? 'Try adjusting your search filters or department selection.' : 'Add your first organization team member to get started.'}
              actionLabel="Add Employee"
              onAction={onOpenAddModal}
              icon={PlusIcon}
            />
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        /* CARD GRID VIEW */
        <div className="employee-card-grid">
          {currentEmployees.map(emp => {
            const fullName = emp.full_name || ((emp.first_name || '') + ' ' + (emp.last_name || '')) || 'Employee';
            const initials = fullName
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map(n => n[0])
              .join('')
              .toUpperCase() || 'EM';

            const statusLower = (emp.status || 'active').toLowerCase();
            const isInactive = statusLower === 'inactive';
            const isProbation = statusLower === 'probation';
            const statusLabel = isInactive ? 'Inactive' : isProbation ? 'Probation' : 'Active';

            return (
              <div key={emp.id} className="employee-card">
                <div className="employee-card-top">
                  <div className="employee-card-top-row">
                    <div className="employee-card-identity">
                      <div className="employee-card-avatar">
                        {emp.avatar_url || emp.profile_pic ? (
                          <img 
                            src={emp.avatar_url || emp.profile_pic} 
                            alt={fullName}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="employee-card-avatar-fallback" 
                          style={{ display: emp.avatar_url || emp.profile_pic ? 'none' : 'flex' }}
                        >
                          {initials}
                        </div>
                      </div>
                      <div className="employee-card-name">
                        <h3 title={fullName}>{fullName}</h3>
                        <span>{emp.designation || 'NA'}</span>
                      </div>
                    </div>

                    {/* 3-DOTS ACTION MENU WITH FLOATING DROPDOWN */}
                    <div className="dropdown position-relative">
                      <button 
                        type="button" 
                        className="employee-card-menu"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === emp.id ? null : emp.id);
                        }}
                        title="Actions"
                      >
                        <i className="bi bi-three-dots"></i>
                      </button>

                      {openMenuId === emp.id && (
                        <ul 
                          className="dropdown-menu dropdown-menu-end show shadow-lg border"
                          style={{
                            position: 'absolute',
                            top: '100%',
                            right: '0',
                            zIndex: 1050,
                            minWidth: '180px',
                            borderRadius: '12px',
                            padding: '6px',
                            backgroundColor: '#fff'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <li>
                            <button
                              type="button"
                              className="dropdown-item d-flex align-items-center py-2 px-3 rounded-2"
                              onClick={() => {
                                setOpenMenuId(null);
                                setSelectedEmployeeForView(emp);
                              }}
                            >
                              <i className="bi bi-eye me-2 text-primary"></i>
                              <span>View Profile</span>
                            </button>
                          </li>

                          {/* Edit Employee commented as requested */}
                          {/* 
                          <li>
                            <button
                              type="button"
                              className="dropdown-item d-flex align-items-center py-2 px-3 rounded-2"
                              onClick={() => {
                                setOpenMenuId(null);
                                handleOpenEditEmploymentModal(emp);
                              }}
                            >
                              <i className="bi bi-pencil me-2"></i>
                              <span>Edit Employee</span>
                            </button>
                          </li>
                          */}

                          {/* Documents commented as requested */}
                          {/*
                          <li>
                            <button
                              type="button"
                              className="dropdown-item d-flex align-items-center py-2 px-3 rounded-2"
                              onClick={() => {
                                setOpenMenuId(null);
                                alert('Documents panel for ' + fullName);
                              }}
                            >
                              <i className="bi bi-folder2-open me-2"></i>
                              <span>Documents</span>
                            </button>
                          </li>
                          */}

                          <li>
                            <hr className="dropdown-divider my-1" />
                          </li>

                          <li>
                            <button
                              type="button"
                              className="dropdown-item d-flex align-items-center text-danger py-2 px-3 rounded-2"
                              onClick={() => {
                                setOpenMenuId(null);
                                handleOpenDeleteModal(emp);
                              }}
                            >
                              <i className="bi bi-person-x me-2"></i>
                              <span>Deactivate</span>
                            </button>
                          </li>
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Card Meta Bar */}
                  <div className="employee-card-meta">
                    <span className="employee-id">{emp.employee_code || ('EMP-' + emp.id)}</span>
                    <span className={'admin-badge ' + (isInactive ? 'badge-danger' : isProbation ? 'badge-info' : 'badge-active')}>
                      <span className="admin-badge-dot"></span>
                      {statusLabel}
                    </span>
                  </div>
                </div>

                {/* 2-Column Detail Grid */}
                <div className="employee-card-details">
                  <div className="employee-card-detail-grid">
                    <div className="employee-card-detail">
                      <span className="employee-card-detail-label">Department</span>
                      <span className="employee-card-detail-value">{emp.department || 'NA'}</span>
                    </div>
                    <div className="employee-card-detail">
                      <span className="employee-card-detail-label">Team</span>
                      <span className="employee-card-detail-value">{emp.team || 'NA'}</span>
                    </div>
                    <div className="employee-card-detail">
                      <span className="employee-card-detail-label">Manager</span>
                      <span className="employee-card-detail-value">{emp.reporting_manager || 'NA'}</span>
                    </div>
                    <div className="employee-card-detail">
                      <span className="employee-card-detail-label">Location</span>
                      <span className="employee-card-detail-value">{emp.location || emp.work_mode || 'NA'}</span>
                    </div>
                    <div className="employee-card-detail">
                      <span className="employee-card-detail-label">Employment</span>
                      <span className="employee-card-detail-value">{emp.employment_type || 'NA'}</span>
                    </div>
                    <div className="employee-card-detail">
                      <span className="employee-card-detail-label">Joining Date</span>
                      <span className="employee-card-detail-value">
                        {emp.joining_date 
                          ? new Date(emp.joining_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                          : 'NA'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: View and Edit */}
                <div className="employee-card-footer">
                  <button 
                    type="button" 
                    className="employee-card-action"
                    onClick={() => setSelectedEmployeeForView(emp)}
                  >
                    <i className="bi bi-eye"></i>
                    <span>View</span>
                  </button>
                  <button 
                    type="button" 
                    className="employee-card-action primary"
                    onClick={() => handleOpenEditEmploymentModal(emp)}
                  >
                    <i className="bi bi-pencil"></i>
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST TABLE VIEW */
        <div className="admin-card p-0 overflow-hidden mb-4">
          <div className="table-responsive">
            <table className="admin-table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Employee Code</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Team</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentEmployees.map(emp => {
                  const fullName = emp.full_name || ((emp.first_name || '') + ' ' + (emp.last_name || '')) || 'Employee';
                  const initials = fullName
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map(n => n[0])
                    .join('')
                    .toUpperCase() || 'EM';

                  const statusLower = (emp.status || 'active').toLowerCase();
                  const isInactive = statusLower === 'inactive';
                  const isProbation = statusLower === 'probation';
                  const statusLabel = isInactive ? 'Inactive' : isProbation ? 'Probation' : 'Active';

                  return (
                    <tr key={emp.id}>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <div 
                            style={{ 
                              width: '40px', 
                              height: '40px', 
                              borderRadius: '12px', 
                              background: '#eeecff', 
                              color: '#3c2fbc', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              fontWeight: '700',
                              fontSize: '14px' 
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <span className="fw-bold d-block text-dark">{fullName}</span>
                            <span className="text-muted small">{emp.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="employee-id">{emp.employee_code || ('EMP-' + emp.id)}</span>
                      </td>
                      <td>{emp.department || 'NA'}</td>
                      <td>{emp.designation || 'NA'}</td>
                      <td>{emp.team || 'NA'}</td>
                      <td>
                        <span className={'admin-badge ' + (isInactive ? 'badge-danger' : isProbation ? 'badge-info' : 'badge-active')}>
                          <span className="admin-badge-dot"></span>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          onClick={() => setSelectedEmployeeForView(emp)}
                          className="btn btn-sm btn-outline-primary rounded-pill px-3 me-2"
                        >
                          <i className="bi bi-eye me-1"></i> View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditEmploymentModal(emp)}
                          className="btn btn-sm btn-primary rounded-pill px-3 me-2"
                          style={{ background: '#3c2fbc', borderColor: '#3c2fbc' }}
                        >
                          <i className="bi bi-pencil me-1"></i> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDeleteModal(emp)}
                          className="btn btn-sm btn-outline-danger rounded-pill px-3"
                        >
                          <i className="bi bi-person-x me-1"></i> Deactivate
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

      {/* Pagination Footer Bar */}
      {totalPages > 1 && (
        <div className="employee-pagination-bar">
          <div className="employee-pagination-info">
            Showing <strong>{startIndex + 1}</strong> to <strong>{Math.min(startIndex + pageSize, totalEmployees)}</strong> of <strong>{totalEmployees}</strong> employees
          </div>

          <div className="employee-pagination-controls">
            <button 
              type="button" 
              className="employee-page-nav-btn"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <i className="bi bi-chevron-left"></i> Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button 
                key={page}
                type="button"
                className={'employee-page-num ' + (currentPage === page ? 'active' : '')}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button 
              type="button" 
              className="employee-page-nav-btn"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      )}

      {/* EDIT EMPLOYMENT DETAILS MODAL (IMAGE 1 WISE WITH COMPANY ROLE DROPDOWN) */}
      {showEditModal && employeeToEdit && (
        <div 
          className="modal fade show" 
          style={{ display: 'block', backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1060 }}
          onClick={() => { if (!savingEdit) setShowEditModal(false); }}
        >
          <div 
            className="modal-dialog modal-dialog-centered modal-lg" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="modal-header px-4 py-3 bg-white border-bottom d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <div 
                    style={{ 
                      width: '44px', 
                      height: '44px', 
                      borderRadius: '12px', 
                      background: '#eeecff', 
                      color: '#3c2fbc', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '20px' 
                    }}
                  >
                    <i className="bi bi-briefcase-fill"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold mb-0 text-dark">Edit Employment Details</h5>
                    <small className="text-muted">
                      {employeeToEdit.full_name || ((employeeToEdit.first_name || '') + ' ' + (employeeToEdit.last_name || ''))} • {employeeToEdit.employee_code || ('EMP-' + employeeToEdit.id)}
                    </small>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowEditModal(false)}
                  disabled={savingEdit}
                ></button>
              </div>

              <form onSubmit={handleSaveEmploymentDetails}>
                <div className="modal-body p-4 bg-light">
                  <div className="bg-white p-4 rounded-4 border mb-3">
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1 mb-3">
                      <i className="bi bi-info-circle me-1"></i> Organizational Terms &amp; Role Details
                    </span>

                    <div className="row g-3">
                      {/* COMPANY ROLE DROPDOWN (IMAGE 1 ENHANCEMENT) */}
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-muted">
                          Company Role <span className="text-primary fw-normal">(System Role Access)</span>
                        </label>
                        <select
                          className="form-select rounded-3"
                          value={editFormData.role_key}
                          onChange={(e) => {
                            const selected = companyRoles.find(r => r.role_key === e.target.value);
                            setEditFormData({ 
                              ...editFormData, 
                              role_key: e.target.value,
                              role_id: selected ? selected.id : '',
                              // Auto-suggest designation matching role if desired
                              designation: editFormData.designation || (selected ? selected.role_name : '')
                            });
                          }}
                          required
                        >
                          {companyRoles.length > 0 ? (
                            companyRoles.map(role => (
                              <option key={role.id} value={role.role_key}>
                                {role.role_name} {role.department_category ? `(${role.department_category})` : ''}
                              </option>
                            ))
                          ) : (
                            <>
                              <option value="SOFTWARE_ENGINEER">Software Engineer</option>
                              <option value="SR_SOFTWARE_ENGINEER">Senior Software Engineer</option>
                              <option value="HR_MANAGER">HR Manager</option>
                              <option value="QA_ENGINEER">QA / Test Engineer</option>
                              <option value="MANAGER">Department Manager / Lead</option>
                              <option value="EMPLOYEE">Standard Employee</option>
                            </>
                          )}
                        </select>
                      </div>

                      {/* Designation */}
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-muted">Designation</label>
                        <input
                          type="text"
                          className="form-control rounded-3"
                          value={editFormData.designation}
                          onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                          placeholder="e.g. Developer / Senior DevOps Engineer"
                          required
                        />
                      </div>

                      {/* Department */}
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-muted">Department</label>
                        <select
                          className="form-select rounded-3"
                          value={editFormData.department}
                          onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                          required
                        >
                          <option value="Engineering">Engineering</option>
                          <option value="Human Resources">Human Resources</option>
                          <option value="Sales">Sales</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Finance">Finance</option>
                          <option value="Operations">Operations</option>
                        </select>
                      </div>

                      {/* Team / Subdivision */}
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-muted">Team / Subdivision</label>
                        <input
                          type="text"
                          className="form-control rounded-3"
                          value={editFormData.team}
                          onChange={(e) => setEditFormData({ ...editFormData, team: e.target.value })}
                          placeholder="e.g. Backend / Frontend / Core Platform"
                        />
                      </div>

                      {/* Location / Working Mode */}
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-muted">Location / Working Mode</label>
                        <select
                          className="form-select rounded-3"
                          value={editFormData.location}
                          onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                        >
                          <option value="Remote">Remote</option>
                          <option value="Chennai Office">Chennai Office</option>
                          <option value="Bangalore Campus">Bangalore Campus</option>
                          <option value="Head Office (Hybrid)">Head Office (Hybrid)</option>
                          <option value="On-site">On-site</option>
                        </select>
                      </div>

                      {/* Employment Type */}
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-muted">Employment Type</label>
                        <select
                          className="form-select rounded-3"
                          value={editFormData.employment_type}
                          onChange={(e) => setEditFormData({ ...editFormData, employment_type: e.target.value })}
                        >
                          <option value="Full Time">Full Time</option>
                          <option value="Contract">Contract</option>
                          <option value="Intern">Intern</option>
                          <option value="Probationary">Probationary</option>
                          <option value="Part Time">Part Time</option>
                        </select>
                      </div>

                      {/* Employment Status */}
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-muted">Employment Status</label>
                        <select
                          className="form-select rounded-3"
                          value={editFormData.status}
                          onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                        >
                          <option value="Active">Active</option>
                          <option value="Probation">Probation</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>

                      {/* Date of Joining */}
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-muted">Date of Joining</label>
                        <input
                          type="date"
                          className="form-control rounded-3"
                          value={editFormData.joining_date}
                          onChange={(e) => setEditFormData({ ...editFormData, joining_date: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer px-4 py-3 bg-white border-top">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary rounded-pill px-4"
                    onClick={() => setShowEditModal(false)}
                    disabled={savingEdit}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary rounded-pill px-4"
                    style={{ background: '#3c2fbc', borderColor: '#3c2fbc' }}
                    disabled={savingEdit}
                  >
                    {savingEdit ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check2-circle me-1"></i> Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DEACTIVATE CONFIRMATION MODAL */}
      {showDeleteModal && employeeToDelete && (
        <div 
          className="modal fade show" 
          style={{ display: 'block', backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1060 }}
          onClick={handleCloseDeleteModal}
        >
          <div 
            className="modal-dialog modal-dialog-centered" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="modal-body p-4 text-center">
                <div 
                  className="mx-auto mb-3" 
                  style={{ 
                    width: '64px', 
                    height: '64px', 
                    borderRadius: '50%', 
                    background: '#fef2f2', 
                    color: '#dc2626', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '28px' 
                  }}
                >
                  <i className="bi bi-person-x"></i>
                </div>

                <h4 className="fw-bold mb-2">Deactivate Employee?</h4>
                <p className="text-muted mb-4 small">
                  Are you sure you want to deactivate{' '}
                  <strong className="text-dark">
                    {employeeToDelete.full_name || ((employeeToDelete.first_name || '') + ' ' + (employeeToDelete.last_name || ''))}
                  </strong>{' '}
                  ({employeeToDelete.employee_code || ('EMP-' + employeeToDelete.id)})? 
                  This will mark their profile as Inactive and revoke system access.
                </p>

                <div className="d-flex align-items-center justify-content-center gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary rounded-pill px-4"
                    onClick={handleCloseDeleteModal}
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger rounded-pill px-4"
                    onClick={handleConfirmDelete}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Deactivating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-person-x me-1"></i> Deactivate Employee
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

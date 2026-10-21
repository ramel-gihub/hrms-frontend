import React, { useState } from 'react';

export default function CreateEmployeeModal({ showModal, setShowModal, handleCreateEmployee, newEmp, updateNewEmployee, creatingEmployee }) {
  const [activeTab, setActiveTab] = useState('Personal Information');

  if (!showModal) return null;

  const tabs = [
    'Personal Information',
    'Contact Information',
    'Employment Details',
    'Bank Details',
    'Identity Information',
    'Emergency Contact'
  ];

  return (
    <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content border-0 shadow">
          <div className="modal-header">
            <div>
              <h5 className="modal-title fw-bold">Create Employee & Login Account</h5>
              <small className="text-muted">Create an employee profile and login credentials.</small>
            </div>
            <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
          </div>

          <form onSubmit={handleCreateEmployee}>
            <div className="modal-body p-0">
              <div className="row g-0">
                <div className="col-12 col-md-3 bg-light border-end">
                  <div className="p-3">
                    <small className="text-muted fw-bold d-block mb-2">DETAILS</small>
                    <ul className="nav flex-column gap-2">
                      {tabs.map((tab) => (
                        <li className="nav-item" key={tab}>
                          <button 
                            type="button"
                            className={`nav-link text-start w-100 btn ${activeTab === tab ? 'btn-primary-subtle text-primary fw-bold' : 'btn-light text-dark'}`}
                            onClick={() => setActiveTab(tab)}
                          >
                            {tab}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="col-12 col-md-9 p-4">
                  {activeTab === 'Personal Information' && (
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">First Name *</label>
                        <input type="text" className="form-control" value={newEmp.firstName} onChange={(e) => updateNewEmployee('firstName', e.target.value)} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Last Name *</label>
                        <input type="text" className="form-control" value={newEmp.lastName} onChange={(e) => updateNewEmployee('lastName', e.target.value)} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Work Email *</label>
                        <input type="email" className="form-control" placeholder="employee@ramel.co.in" value={newEmp.email} onChange={(e) => updateNewEmployee('email', e.target.value)} required />
                        <small className="text-muted">This email will be used as the login username.</small>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Temporary Password *</label>
                        <input type="password" className="form-control" value={newEmp.password} onChange={(e) => updateNewEmployee('password', e.target.value)} minLength="6" required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Gender</label>
                        <select className="form-select">
                          <option>Male</option>
                          <option>Female</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Date of Birth</label>
                        <input type="date" className="form-control" />
                      </div>
                    </div>
                  )}

                  {activeTab === 'Employment Details' && (
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Department *</label>
                        <input type="text" className="form-control" value={newEmp.department} onChange={(e) => updateNewEmployee('department', e.target.value)} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Designation *</label>
                        <input type="text" className="form-control" value={newEmp.designation} onChange={(e) => updateNewEmployee('designation', e.target.value)} required />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold">System Role *</label>
                        <select className="form-select" value={newEmp.roleKey} onChange={(e) => updateNewEmployee('roleKey', e.target.value)}>
                          <option value="SOFTWARE_ENGINEER">Software Engineer</option>
                          <option value="HR">HR</option>
                          <option value="MANAGER">Manager</option>
                          <option value="TEAM_LEAD">Team Lead</option>
                          <option value="EMPLOYEE">Employee</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {activeTab !== 'Personal Information' && activeTab !== 'Employment Details' && (
                     <div className="text-center py-5">
                       <p className="text-muted mb-0">Fill out {activeTab} information (Optional)</p>
                     </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={creatingEmployee}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={creatingEmployee}>{creatingEmployee ? 'Creating...' : 'Create User & Employee'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

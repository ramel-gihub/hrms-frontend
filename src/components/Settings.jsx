import React, { useState } from 'react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('Personal Information');

  const tabs = [
    'Personal Information',
    'Contact Information',
    'Employment Details',
    'Bank Details',
    'Identity Information',
    'Emergency Contact'
  ];

  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">My Settings</h4>
          <p className="text-muted mb-0">Manage your personal details, bank accounts, and contact info.</p>
        </div>
        <button className="btn btn-outline-primary btn-sm">
          <i className="bi bi-clock me-1"></i> History & Security
        </button>
      </div>

      <div className="card border-0 shadow-sm mb-4 bg-primary text-white">
        <div className="card-body p-4 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-white text-primary fw-bold rounded-circle d-flex align-items-center justify-content-center" style={{ width: 60, height: 60, fontSize: '1.5rem' }}>
              AK
            </div>
            <div>
              <h5 className="mb-0 fw-bold">Anil Kumar</h5>
              <p className="mb-0 opacity-75">Senior Software Engineer - Engineering - Backend</p>
              <div className="d-flex gap-2 mt-2">
                <span className="badge bg-white text-primary rounded-pill"><i className="bi bi-person me-1"></i> FMP-000124</span>
                <span className="badge bg-white text-primary rounded-pill"><i className="bi bi-briefcase me-1"></i> Remote</span>
                <span className="badge bg-white text-primary rounded-pill"><i className="bi bi-geo-alt me-1"></i> Chennai</span>
              </div>
            </div>
          </div>
          <div className="text-end">
            <h6 className="mb-1">Profile Completion 85%</h6>
            <div className="progress mt-2" style={{ height: '6px', width: '150px' }}>
              <div className="progress-bar bg-warning" role="progressbar" style={{ width: '85%' }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-3">
              <small className="text-muted fw-bold d-block mb-2">SETTINGS MENU</small>
              <ul className="nav flex-column gap-2">
                {tabs.map((tab) => (
                  <li className="nav-item" key={tab}>
                    <button 
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
        </div>
        <div className="col-12 col-md-9">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white p-4 pb-0 border-0">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0">
                  <i className="bi bi-person text-primary me-2"></i> 
                  {activeTab}
                </h5>
                <button className="btn btn-outline-primary btn-sm"><i className="bi bi-pencil me-1"></i> Edit</button>
              </div>
            </div>
            <div className="card-body p-4">
              {activeTab === 'Personal Information' && (
                <div className="row g-4">
                  <div className="col-md-4">
                    <small className="text-muted">First Name</small>
                    <div className="fw-semibold">Anil</div>
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted">Middle Name</small>
                    <div className="fw-semibold">-</div>
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted">Last Name</small>
                    <div className="fw-semibold">Kumar</div>
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted">Gender</small>
                    <div className="fw-semibold">Male</div>
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted">Date of Birth</small>
                    <div className="fw-semibold">12 Jun 1993</div>
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted">Marital Status</small>
                    <div className="fw-semibold">Single</div>
                  </div>
                </div>
              )}
              {activeTab === 'Contact Information' && (
                <div>
                   <p className="text-muted">No details available yet. Click Edit to add.</p>
                </div>
              )}
              {activeTab !== 'Personal Information' && activeTab !== 'Contact Information' && (
                <div>
                   <p className="text-muted">Placeholder for {activeTab}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

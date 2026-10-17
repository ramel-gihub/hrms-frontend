import React from "react";

export default function AccessAccounts() {
  return (
    <>
<div className="px-0 px-md-5 employee-dashboard">

                <div className="employee-access-page">

                    
                    <div className="ea-page-header">
                        <div>

                            <h1>Access & Accounts</h1>
                            <p>Manage employee application accounts, system access and IT permissions.</p>
                        </div>

                        <div className="ea-header-actions">
                            <button className="btn ea-btn-outline">
                                <i className="bi bi-download"></i>
                                Export
                            </button>

                            <button className="btn ea-btn-primary" data-bs-toggle="modal" data-bs-target="#eaAddAccessModal">
                                <i className="bi bi-plus-lg"></i>
                                Grant Access
                            </button>
                        </div>
                    </div>

                    
                    <div className="esc-employee-bar">

                        <div className="esc-employee-main">

                            <div className="esc-avatar overflow-hidden">
                                {(employeeProfile?.profile_pic || employeeProfile?.avatar_url) ? (
                                    <img
                                        src={/^https?:\/\//i.test(employeeProfile?.profile_pic || employeeProfile?.avatar_url)
                                            ? (employeeProfile?.profile_pic || employeeProfile?.avatar_url)
                                            : `${(import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).replace("f2ef", "fzef") : "https://hrms-backend-fzef.onrender.com")}/${(employeeProfile?.profile_pic || employeeProfile?.avatar_url).replace(/^\/+/, '')}`}
                                        alt="Employee"
                                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "17px" }}
                                    />
                                ) : (
                                    (employeeProfile?.preferred_name
                                        ? employeeProfile.preferred_name.slice(0, 2)
                                        : employeeProfile?.first_name
                                            ? `${employeeProfile.first_name[0]}${employeeProfile.last_name ? employeeProfile.last_name[0] : (employeeProfile.first_name[1] || "")}`
                                            : "DA"
                                    ).toUpperCase()
                                )}
                            </div>

                            <div className="esc-employee-info">
                                <div className="esc-name-row">
                                    <h3>{employeeProfile?.preferred_name || (employeeProfile?.first_name ? `${employeeProfile.first_name} ${employeeProfile.last_name || ''}`.trim() : "Devashish Ahire")}</h3>
                                    <span className="esc-status-badge">
                                        <span></span>
                                        Active
                                    </span>
                                </div>

                                <p>{employeeProfile?.designation || "Senior Software Engineer"}</p>

                                <div className="esc-employee-meta">
                                    <span>
                                        <i className="bi bi-diagram-3"></i>
                                        {employeeProfile?.department || "Engineering"}
                                    </span>

                                    <span>
                                        <i className="bi bi-code-slash"></i>
                                        {employeeProfile?.team || "Backend"}
                                    </span>

                                    <span>
                                        <i className="bi bi-person-badge"></i>
                                        {employeeProfile?.employee_code || "EMP-1360"}
                                    </span>
                                </div>
                            </div>

                        </div>

                        <div className="esc-employee-side">
                            
                            <div className="ea-account-health">
                                <div className="ea-health-label">
                                    <span>Access Health</span>
                                    <strong>Good</strong>
                                </div>

                                <div className="ea-health-bar">
                                    <span style={{width: "88%"}}></span>
                                </div>

                                <small>All critical employee accounts are active.</small>
                            </div>
                        </div>

                    </div>


                    
                    <div className="ea-overview-strip">

                        <div className="ea-overview-item">
                            <div className="ea-overview-icon purple">
                                <i className="bi bi-grid-1x2"></i>
                            </div>
                            <div>
                                <strong id="eaTotalAccess">11</strong>
                                <span>Total Access</span>
                            </div>
                        </div>

                        <div className="ea-overview-item">
                            <div className="ea-overview-icon green">
                                <i className="bi bi-check-circle"></i>
                            </div>
                            <div>
                                <strong id="eaActiveAccess">10</strong>
                                <span>Active</span>
                            </div>
                        </div>

                        <div className="ea-overview-item">
                            <div className="ea-overview-icon orange">
                                <i className="bi bi-clock-history"></i>
                            </div>
                            <div>
                                <strong>1</strong>
                                <span>Pending</span>
                            </div>
                        </div>

                        <div className="ea-overview-item">
                            <div className="ea-overview-icon blue">
                                <i className="bi bi-shield-check"></i>
                            </div>
                            <div>
                                <strong>8</strong>
                                <span>MFA Protected</span>
                            </div>
                        </div>

                        <div className="ea-overview-item">
                            <div className="ea-overview-icon pink">
                                <i className="bi bi-calendar-event"></i>
                            </div>
                            <div>
                                <strong>1</strong>
                                <span>Expiring Soon</span>
                            </div>
                        </div>

                    </div>


                    
                    <section className="ea-section">
                        <div className="ea-section-heading common-card-heading">
                            <div>
                                <span className="ea-section-kicker">Primary Accounts</span>
                                <h3>Corporate Accounts</h3>
                                <p>Core employee accounts used for company communication and identity.</p>
                            </div>

                            <button className="btn ea-small-btn" data-bs-toggle="modal" data-bs-target="#eaAddAccessModal">
                                <i className="bi bi-plus"></i>
                                Add Account
                            </button>
                        </div>

                        <div className="row g-4">

                            
                            <div className="col-xl-6 col-lg-6">
                                <div className="ea-account-card">
                                    <div className="ea-account-icon email">
                                        <i className="bi bi-envelope-at"></i>
                                    </div>

                                    <div className="ea-account-content">
                                        <div className="ea-account-top">
                                            <div>
                                                <span className="ea-account-category">Corporate Email</span>
                                                <h4>arun.kumar@company.com</h4>
                                            </div>

                                            <span className="ea-mini-status active">Active</span>
                                        </div>

                                        <div className="ea-account-details">
                                            <span>
                                                <b>Account:</b> arun.kumar
                                            </span>
                                            <span>
                                                <b>Last Login:</b> Today, 09:12 AM
                                            </span>
                                        </div>

                                        <div className="ea-account-footer">
                                            <span>
                                                <i className="bi bi-shield-check"></i>
                                                MFA Enabled
                                            </span>

                                            <button>
                                                View Details
                                                <i className="bi bi-arrow-right"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>


                            
                            <div className="col-xl-6 col-lg-6">
                                <div className="ea-account-card">
                                    <div className="ea-account-icon microsoft">
                                        <i className="bi bi-microsoft"></i>
                                    </div>

                                    <div className="ea-account-content">
                                        <div className="ea-account-top">
                                            <div>
                                                <span className="ea-account-category">Microsoft / Google Account</span>
                                                <h4>arun.kumar@company.com</h4>
                                            </div>

                                            <span className="ea-mini-status active">Active</span>
                                        </div>

                                        <div className="ea-account-details">
                                            <span>
                                                <b>Account:</b> Microsoft 365
                                            </span>
                                            <span>
                                                <b>Last Login:</b> Today, 08:54 AM
                                            </span>
                                        </div>

                                        <div className="ea-account-footer">
                                            <span>
                                                <i className="bi bi-shield-check"></i>
                                                MFA Enabled
                                            </span>

                                            <button>
                                                View Details
                                                <i className="bi bi-arrow-right"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </section>


                    
                    <section className="ea-section">

                        <div className="ea-section-heading common-card-heading">
                            <div>
                                <span className="ea-section-kicker">Development & Collaboration</span>
                                <h3>Application Access</h3>
                                <p>Development, project management and communication tools assigned to the employee.</p>
                            </div>

                            <div className="ea-filter-actions">
                                <div className="ea-search">
                                    <i className="bi bi-search"></i>
                                    <input
                                        type="text"
                                        id="eaAccessSearch"
                                        placeholder="Search application or account..."
                                        onkeyup="eaFilterAccess()" />
                                </div>

                                <select id="eaAccessStatus" onchange="eaFilterAccess()">
                                    <option value="">All Status</option>
                                    <option value="Active">Active</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Suspended">Suspended</option>
                                    <option value="Revoked">Revoked</option>
                                    <option value="Expired">Expired</option>
                                </select>
                            </div>
                        </div>


                        <div className="ea-access-list" id="eaAccessList">

                            
                            <div className="ea-access-row"
                                data-application="GitHub"
                                data-account="arun.kumar"
                                data-status="Active">

                                <div className="ea-app-icon github">
                                    <i className="bi bi-github"></i>
                                </div>

                                <div className="ea-access-info">
                                    <div className="ea-access-name">
                                        <h4>GitHub</h4>
                                        <span className="ea-mini-status active">Active</span>
                                    </div>

                                    <p>arun.kumar</p>
                                </div>

                                <div className="ea-access-column">
                                    <span>Access Level</span>
                                    <strong>Developer</strong>
                                </div>

                                <div className="ea-access-column">
                                    <span>Granted Date</span>
                                    <strong>15-Jan-2025</strong>
                                </div>

                                <div className="ea-access-column">
                                    <span>Approved By</span>
                                    <strong>IT Admin</strong>
                                </div>

                                <div className="ea-access-action">
                                    <button title="View">
                                        <i className="bi bi-eye"></i>
                                    </button>

                                    <button title="Edit">
                                        <i className="bi bi-pencil"></i>
                                    </button>

                                    <button title="More">
                                        <i className="bi bi-three-dots"></i>
                                    </button>
                                </div>
                            </div>


                            
                            <div className="ea-access-row"
                                data-application="GitLab"
                                data-account="arun.kumar"
                                data-status="Active">

                                <div className="ea-app-icon gitlab">
                                    <i className="bi bi-git"></i>
                                </div>

                                <div className="ea-access-info">
                                    <div className="ea-access-name">
                                        <h4>GitLab</h4>
                                        <span className="ea-mini-status active">Active</span>
                                    </div>

                                    <p>arun.kumar</p>
                                </div>

                                <div className="ea-access-column">
                                    <span>Access Level</span>
                                    <strong>Developer</strong>
                                </div>

                                <div className="ea-access-column">
                                    <span>Granted Date</span>
                                    <strong>20-Jan-2025</strong>
                                </div>

                                <div className="ea-access-column">
                                    <span>Approved By</span>
                                    <strong>IT Admin</strong>
                                </div>

                                <div className="ea-access-action">
                                    <button title="View">
                                        <i className="bi bi-eye"></i>
                                    </button>

                                    <button title="Edit">
                                        <i className="bi bi-pencil"></i>
                                    </button>

                                    <button title="More">
                                        <i className="bi bi-three-dots"></i>
                                    </button>
                                </div>
                            </div>


                            
                            <div className="ea-access-row"
                                data-application="Jira"
                                data-account="arun.kumar"
                                data-status="Active">

                                <div className="ea-app-icon jira">
                                    <i className="bi bi-kanban"></i>
                                </div>

                                <div className="ea-access-info">
                                    <div className="ea-access-name">
                                        <h4>Jira</h4>
                                        <span className="ea-mini-status active">Active</span>
                                    </div>

                                    <p>arun.kumar</p>
                                </div>

                                <div className="ea-access-column">
                                    <span>Access Level</span>
                                    <strong>Developer</strong>
                                </div>

                                <div className="ea-access-column">
                                    <span>Granted Date</span>
                                    <strong>15-Jan-2025</strong>
                                </div>

                                <div className="ea-access-column">
                                    <span>Approved By</span>
                                    <strong>IT Admin</strong>
                                </div>

                                <div className="ea-access-action">
                                    <button title="View">
                                        <i className="bi bi-eye"></i>
                                    </button>

                                    <button title="Edit">
                                        <i className="bi bi-pencil"></i>
                                    </button>

                                    <button title="More">
                                        <i className="bi bi-three-dots"></i>
                                    </button>
                                </div>
                            </div>


                            
                            <div className="ea-access-row"
                                data-application="Slack / Teams"
                                data-account="arun.kumar"
                                data-status="Active">

                                <div className="ea-app-icon slack">
                                    <i className="bi bi-chat-square-dots"></i>
                                </div>

                                <div className="ea-access-info">
                                    <div className="ea-access-name">
                                        <h4>Slack / Teams</h4>
                                        <span className="ea-mini-status active">Active</span>
                                    </div>

                                    <p>arun.kumar</p>
                                </div>

                                <div className="ea-access-column">
                                    <span>Access Level</span>
                                    <strong>Member</strong>
                                </div>

                                <div className="ea-access-column">
                                    <span>Granted Date</span>
                                    <strong>15-Jan-2025</strong>
                                </div>

                                <div className="ea-access-column">
                                    <span>Approved By</span>
                                    <strong>IT Admin</strong>
                                </div>

                                <div className="ea-access-action">
                                    <button title="View">
                                        <i className="bi bi-eye"></i>
                                    </button>

                                    <button title="Edit">
                                        <i className="bi bi-pencil"></i>
                                    </button>

                                    <button title="More">
                                        <i className="bi bi-three-dots"></i>
                                    </button>
                                </div>
                            </div>


                            
                            <div className="ea-access-row"
                                data-application="VPN"
                                data-account="arun.kumar"
                                data-status="Active">

                                <div className="ea-app-icon vpn">
                                    <i className="bi bi-shield-lock"></i>
                                </div>

                                <div className="ea-access-info">
                                    <div className="ea-access-name">
                                        <h4>VPN</h4>
                                        <span className="ea-mini-status active">Active</span>
                                    </div>

                                    <p>arun.kumar</p>
                                </div>

                                <div className="ea-access-column">
                                    <span>Access Level</span>
                                    <strong>Standard</strong>
                                </div>

                                <div className="ea-access-column">
                                    <span>Granted Date</span>
                                    <strong>15-Jan-2025</strong>
                                </div>

                                <div className="ea-access-column">
                                    <span>Approved By</span>
                                    <strong>IT Admin</strong>
                                </div>

                                <div className="ea-access-action">
                                    <button title="View">
                                        <i className="bi bi-eye"></i>
                                    </button>

                                    <button title="Edit">
                                        <i className="bi bi-pencil"></i>
                                    </button>

                                    <button title="More">
                                        <i className="bi bi-three-dots"></i>
                                    </button>
                                </div>
                            </div>

                        </div>

                        <div className="ea-empty-state d-none" id="eaEmptyState">
                            <i className="bi bi-search"></i>
                            <h4>No access found</h4>
                            <p>Try another application, account or status.</p>
                        </div>

                    </section>


                    
                    <section className="ea-section">

                        <div className="ea-section-heading common-card-heading">
                            <div>
                                <span className="ea-section-kicker">Infrastructure</span>
                                <h3>Cloud & Infrastructure Access</h3>
                                <p>Cloud platforms, databases and infrastructure permissions.</p>
                            </div>
                        </div>

                        <div className="row g-4">

                            
                            <div className="col-xl-4 col-md-6">
                                <div className="ea-cloud-card">
                                    <div className="ea-cloud-top">
                                        <div className="ea-cloud-icon aws">
                                            <i className="bi bi-cloud"></i>
                                        </div>
                                        <span className="ea-mini-status active">Active</span>
                                    </div>

                                    <h4>AWS</h4>
                                    <p>Developer access</p>

                                    <div className="ea-cloud-meta">
                                        <span>Account</span>
                                        <strong>arun.kumar</strong>
                                    </div>

                                    <div className="ea-cloud-meta">
                                        <span>Granted</span>
                                        <strong>15-Jan-2025</strong>
                                    </div>

                                    <button className="ea-card-link">
                                        View Access
                                        <i className="bi bi-arrow-right"></i>
                                    </button>
                                </div>
                            </div>


                            
                            <div className="col-xl-4 col-md-6">
                                <div className="ea-cloud-card">
                                    <div className="ea-cloud-top">
                                        <div className="ea-cloud-icon azure">
                                            <i className="bi bi-cloud"></i>
                                        </div>
                                        <span className="ea-mini-status active">Active</span>
                                    </div>

                                    <h4>Azure</h4>
                                    <p>Developer access</p>

                                    <div className="ea-cloud-meta">
                                        <span>Account</span>
                                        <strong>arun.kumar</strong>
                                    </div>

                                    <div className="ea-cloud-meta">
                                        <span>Granted</span>
                                        <strong>20-Jan-2025</strong>
                                    </div>

                                    <button className="ea-card-link">
                                        View Access
                                        <i className="bi bi-arrow-right"></i>
                                    </button>
                                </div>
                            </div>


                            
                            <div className="col-xl-4 col-md-6">
                                <div className="ea-cloud-card">
                                    <div className="ea-cloud-top">
                                        <div className="ea-cloud-icon gcp">
                                            <i className="bi bi-cloud"></i>
                                        </div>
                                        <span className="ea-mini-status pending">Pending</span>
                                    </div>

                                    <h4>GCP</h4>
                                    <p>Access request pending</p>

                                    <div className="ea-cloud-meta">
                                        <span>Account</span>
                                        <strong>Not Created</strong>
                                    </div>

                                    <div className="ea-cloud-meta">
                                        <span>Requested</span>
                                        <strong>18-Sep-2026</strong>
                                    </div>

                                    <button className="ea-card-link">
                                        Review Request
                                        <i className="bi bi-arrow-right"></i>
                                    </button>
                                </div>
                            </div>

                        </div>
                    </section>


                    
                    <section className="ea-section">

                        <div className="ea-section-heading common-card-heading">
                            <div>
                                <span className="ea-section-kicker">Restricted Systems</span>
                                <h3>Database & Application Access</h3>
                                <p>Privileged access to internal databases and business applications.</p>
                            </div>
                        </div>

                        <div className="row g-4">

                            <div className="col-xl-6">
                                <div className="ea-security-card">
                                    <div className="ea-security-icon database">
                                        <i className="bi bi-database"></i>
                                    </div>

                                    <div className="ea-security-content">
                                        <div className="ea-security-heading">
                                            <div>
                                                <span>Database Access</span>
                                                <h4>Production PostgreSQL</h4>
                                            </div>

                                            <span className="ea-mini-status active">Active</span>
                                        </div>

                                        <div className="ea-security-info">
                                            <div>
                                                <span>Access Level</span>
                                                <strong>Read / Write</strong>
                                            </div>

                                            <div>
                                                <span>Granted Date</span>
                                                <strong>15-Jan-2025</strong>
                                            </div>

                                            <div>
                                                <span>Approved By</span>
                                                <strong>IT Admin</strong>
                                            </div>
                                        </div>

                                        <div className="ea-security-warning">
                                            <i className="bi bi-shield-lock"></i>
                                            Credentials are managed outside the HR system.
                                        </div>

                                        <button className="ea-card-link">
                                            View Access
                                            <i className="bi bi-arrow-right"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>


                            <div className="col-xl-6">
                                <div className="ea-security-card">
                                    <div className="ea-security-icon application">
                                        <i className="bi bi-window-stack"></i>
                                    </div>

                                    <div className="ea-security-content">
                                        <div className="ea-security-heading">
                                            <div>
                                                <span>Application Access</span>
                                                <h4>Internal HR Application</h4>
                                            </div>

                                            <span className="ea-mini-status active">Active</span>
                                        </div>

                                        <div className="ea-security-info">
                                            <div>
                                                <span>Access Level</span>
                                                <strong>Employee</strong>
                                            </div>

                                            <div>
                                                <span>Granted Date</span>
                                                <strong>15-Jan-2025</strong>
                                            </div>

                                            <div>
                                                <span>Approved By</span>
                                                <strong>HR Admin</strong>
                                            </div>
                                        </div>

                                        <div className="ea-security-warning neutral">
                                            <i className="bi bi-info-circle"></i>
                                            Access follows the employee's assigned role.
                                        </div>

                                        <button className="ea-card-link">
                                            View Access
                                            <i className="bi bi-arrow-right"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </section>


                    
                    <div className="row g-4">

                        
                        <div className="col-xl-7">

                            <section className="ea-panel">
                                <div className="ea-panel-header common-card-heading">
                                    <div>
                                        <span className="ea-section-kicker">Audit Trail</span>
                                        <h3>Recent Access Activity</h3>
                                    </div>

                                    <button>
                                        View Full History
                                        <i className="bi bi-arrow-right"></i>
                                    </button>
                                </div>

                                <div className="ea-timeline">

                                    <div className="ea-timeline-item">
                                        <div className="ea-timeline-dot green">
                                            <i className="bi bi-check-lg"></i>
                                        </div>

                                        <div className="ea-timeline-content">
                                            <strong>GitHub access granted</strong>
                                            <p>Developer access approved by IT Admin.</p>
                                            <span>15-Jan-2025 · 10:32 AM</span>
                                        </div>
                                    </div>

                                    <div className="ea-timeline-item">
                                        <div className="ea-timeline-dot blue">
                                            <i className="bi bi-shield-check"></i>
                                        </div>

                                        <div className="ea-timeline-content">
                                            <strong>MFA enabled</strong>
                                            <p>Multi-factor authentication enabled for corporate account.</p>
                                            <span>15-Jan-2025 · 11:05 AM</span>
                                        </div>
                                    </div>

                                    <div className="ea-timeline-item">
                                        <div className="ea-timeline-dot purple">
                                            <i className="bi bi-cloud"></i>
                                        </div>

                                        <div className="ea-timeline-content">
                                            <strong>AWS access updated</strong>
                                            <p>Access level changed to Developer.</p>
                                            <span>20-Jan-2025 · 02:15 PM</span>
                                        </div>
                                    </div>

                                    <div className="ea-timeline-item">
                                        <div className="ea-timeline-dot orange">
                                            <i className="bi bi-clock"></i>
                                        </div>

                                        <div className="ea-timeline-content">
                                            <strong>GCP access requested</strong>
                                            <p>Request is waiting for IT approval.</p>
                                            <span>18-Sep-2026 · 04:20 PM</span>
                                        </div>
                                    </div>

                                </div>
                            </section>

                        </div>


                        
                        <div className="col-xl-5">

                            <section className="ea-panel ea-security-summary">

                                <div className="ea-panel-header common-card-heading">
                                    <div>
                                        <span className="ea-section-kicker">Security</span>
                                        <h3>Account Security</h3>
                                    </div>

                                    <div className="ea-security-score">
                                        <strong>88%</strong>
                                        <span>Secure</span>
                                    </div>
                                </div>

                                <div className="ea-security-check">
                                    <div className="ea-check-icon success">
                                        <i className="bi bi-check-lg"></i>
                                    </div>

                                    <div>
                                        <strong>MFA Protection</strong>
                                        <span>Enabled for primary accounts</span>
                                    </div>
                                </div>

                                <div className="ea-security-check">
                                    <div className="ea-check-icon success">
                                        <i className="bi bi-check-lg"></i>
                                    </div>

                                    <div>
                                        <strong>Corporate Account</strong>
                                        <span>Active and verified</span>
                                    </div>
                                </div>

                                <div className="ea-security-check">
                                    <div className="ea-check-icon warning">
                                        <i className="bi bi-exclamation-lg"></i>
                                    </div>

                                    <div>
                                        <strong>GCP Access</strong>
                                        <span>Approval required</span>
                                    </div>
                                </div>

                                <div className="ea-security-check">
                                    <div className="ea-check-icon success">
                                        <i className="bi bi-check-lg"></i>
                                    </div>

                                    <div>
                                        <strong>Password Information</strong>
                                        <span>Credentials are not stored here</span>
                                    </div>
                                </div>

                            </section>

                        </div>

                    </div>


                    
                    <div className="ea-security-notice">
                        <div className="ea-notice-icon">
                            <i className="bi bi-shield-lock"></i>
                        </div>

                        <div>
                            <strong>Security & Credential Policy</strong>
                            <p>
                                This employee-management system stores account and access metadata only.
                                Application passwords, API keys, tokens and other sensitive credentials
                                must be managed through the organization's approved identity or secret-management systems.
                            </p>
                        </div>
                    </div>

                </div>

                <div className="modal fade" id="eaAddAccessModal" tabIndex="-1" aria-hidden="true">

                    <div className="modal-dialog modal-dialog-centered modal-lg">

                        <div className="modal-content ea-modal">

                            <div className="modal-header">
                                <div>
                                    <span className="ea-section-kicker">IT Administration</span>
                                    <h5 className="modal-title">Grant New Access</h5>
                                </div>

                                <button type="button"
                                        className="btn-close"
                                        data-bs-dismiss="modal"
                                        aria-label="Close"></button>
                            </div>

                            <form id="eaAccessForm">

                                <div className="modal-body">

                                    <div className="ea-form-note">
                                        <i className="bi bi-info-circle"></i>
                                        Add account and access information only. Do not enter passwords,
                                        API keys, tokens or other credentials.
                                    </div>

                                    <div className="row g-4">

                                        <div className="col-md-6">
                                            <label>Application <span>*</span></label>

                                            <select className="form-select" required>
                                                <option value="">Select Application</option>
                                                <option>Corporate Email</option>
                                                <option>Microsoft 365</option>
                                                <option>Google Workspace</option>
                                                <option>GitHub</option>
                                                <option>GitLab</option>
                                                <option>Jira</option>
                                                <option>Slack</option>
                                                <option>Microsoft Teams</option>
                                                <option>VPN</option>
                                                <option>AWS</option>
                                                <option>Azure</option>
                                                <option>GCP</option>
                                                <option>Database</option>
                                                <option>Internal Application</option>
                                            </select>
                                        </div>

                                        <div className="col-md-6">
                                            <label>Account / Username <span>*</span></label>

                                            <input type="text"
                                                className="form-control"
                                                placeholder="e.g. arun.kumar"
                                                required />
                                        </div>

                                        <div className="col-md-6">
                                            <label>Access Level <span>*</span></label>

                                            <select className="form-select" required>
                                                <option value="">Select Access Level</option>
                                                <option>Viewer</option>
                                                <option>Member</option>
                                                <option>Developer</option>
                                                <option>Manager</option>
                                                <option>Administrator</option>
                                                <option>Read Only</option>
                                                <option>Read / Write</option>
                                                <option>Custom</option>
                                            </select>
                                        </div>

                                        <div className="col-md-6">
                                            <label>Status</label>

                                            <select className="form-select">
                                                <option>Active</option>
                                                <option>Pending</option>
                                                <option>Suspended</option>
                                                <option>Revoked</option>
                                                <option>Expired</option>
                                            </select>
                                        </div>

                                        <div className="col-md-6">
                                            <label>Granted Date</label>

                                            <input type="date"
                                                className="form-control"
                                                value="2026-09-22" />
                                        </div>

                                        <div className="col-md-6">
                                            <label>Expiry Date</label>

                                            <input type="date"
                                                className="form-control" />
                                        </div>

                                        <div className="col-md-6">
                                            <label>Approved By</label>

                                            <input type="text"
                                                className="form-control"
                                                placeholder="e.g. IT Admin" />
                                        </div>

                                        <div className="col-md-6">
                                            <label>MFA Status</label>

                                            <select className="form-select">
                                                <option>Enabled</option>
                                                <option>Not Required</option>
                                                <option>Pending Setup</option>
                                            </select>
                                        </div>

                                        <div className="col-12">
                                            <label>Remarks</label>

                                            <textarea className="form-control"
                                                    rows="3"
                                                    placeholder="Add any access-related notes..."></textarea>
                                        </div>

                                    </div>

                                </div>

                                <div className="modal-footer">
                                    <button type="button"
                                            className="btn ea-btn-outline"
                                            data-bs-dismiss="modal">
                                        Cancel
                                    </button>

                                    <button type="submit"
                                            className="btn ea-btn-primary">
                                        <i className="bi bi-check2-circle"></i>
                                        Grant Access
                                    </button>
                                </div>

                            </form>

                        </div>

                    </div>
                </div>

                <div className="modal fade" id="eaDetailsModal" tabIndex="-1" aria-hidden="true">

                    <div className="modal-dialog modal-dialog-centered">

                        <div className="modal-content ea-modal">

                            <div className="modal-header">
                                <div>
                                    <span className="ea-section-kicker">Access Details</span>
                                    <h5 className="modal-title" id="eaDetailsTitle">GitHub</h5>
                                </div>

                                <button type="button"
                                        className="btn-close"
                                        data-bs-dismiss="modal"></button>
                            </div>

                            <div className="modal-body">

                                <div className="ea-detail-modal-icon">
                                    <i className="bi bi-shield-check"></i>
                                </div>

                                <div className="ea-detail-grid">

                                    <div>
                                        <span>Application</span>
                                        <strong id="eaDetailApplication">GitHub</strong>
                                    </div>

                                    <div>
                                        <span>Status</span>
                                        <strong className="ea-detail-active" id="eaDetailStatus">Active</strong>
                                    </div>

                                    <div>
                                        <span>Account</span>
                                        <strong id="eaDetailAccount">arun.kumar</strong>
                                    </div>

                                    <div>
                                        <span>Access Level</span>
                                        <strong id="eaDetailLevel">Developer</strong>
                                    </div>

                                    <div>
                                        <span>Granted Date</span>
                                        <strong>15-Jan-2025</strong>
                                    </div>

                                    <div>
                                        <span>Approved By</span>
                                        <strong>IT Admin</strong>
                                    </div>

                                    <div>
                                        <span>Last Login</span>
                                        <strong>Today, 09:12 AM</strong>
                                    </div>

                                    <div>
                                        <span>MFA</span>
                                        <strong>Enabled</strong>
                                    </div>

                                </div>

                                <div className="ea-modal-security-note">
                                    <i className="bi bi-lock"></i>
                                    <div>
                                        <strong>Credentials protected</strong>
                                        <span>Password and secret credentials are not stored in this system.</span>
                                    </div>
                                </div>

                            </div>

                            <div className="modal-footer">
                                <button type="button"
                                        className="btn ea-btn-outline"
                                        data-bs-dismiss="modal">
                                    Close
                                </button>

                                <button type="button"
                                        className="btn ea-btn-primary">
                                    <i className="bi bi-pencil"></i>
                                    Edit Access
                                </button>
                            </div>

                        </div>

                    </div>
                </div>


                

            </div>
    </>
  );
}

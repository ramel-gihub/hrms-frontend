import React, { useState, useEffect } from "react";
import EmploymentDetails from "./EmploymentDetails";
import Documents from "./Documents";
import SkillsCertifications from "./SkillsCertifications";
import Attendance from "./Attendance";
import Leaves from "./Leaves";
import Assets from "./Assets";

export default function EmployeeProfile({ currentUser, employeeProfile, onProfileUpdate }) {
    const [activeProfileTab, setActiveProfileTab] = useState("overview");
    const firstName = employeeProfile?.first_name || "";
    const lastName = employeeProfile?.last_name || "";
    const employeeName = `${firstName} ${lastName}`.trim() || currentUser?.email || "Employee";
    const employeeInitials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
        || currentUser?.email?.slice(0, 2).toUpperCase()
        || "EM";
    const personalItems = [
        { label: "First Name", value: firstName },
        { label: "Last Name", value: lastName },
        { label: "Email", value: employeeProfile?.email || currentUser?.email },
        { label: "City", value: employeeProfile?.current_city },
    ];
    const employmentItems = [
        { label: "Employee Code", value: employeeProfile?.employee_code },
        { label: "Designation", value: employeeProfile?.designation },
        { label: "Department", value: employeeProfile?.department },
        { label: "Team", value: employeeProfile?.team },
        { label: "Employment Type", value: employeeProfile?.employment_type },
        { label: "Work Mode", value: employeeProfile?.work_mode },
    ];
    const skillNames = Array.isArray(employeeProfile?.skills)
        ? employeeProfile.skills.filter(Boolean).join(" · ")
        : "";
    const API_BASE = (import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).replace("f2ef", "fzef") : "https://hrms-backend-fzef.onrender.com");
    const [avatarError, setAvatarError] = useState(false);
    const rawAvatar = employeeProfile?.profile_pic || employeeProfile?.avatar_url || "";
    const dynamicAvatarUrl = rawAvatar
        ? (/^(https?:\/\/|data:)/i.test(rawAvatar) ? rawAvatar : `${API_BASE}/${rawAvatar.replace(/^\/+/, "")}`)
        : "";

    useEffect(() => {
        setAvatarError(false);
    }, [rawAvatar]);
  return (
    <>
<div className="px-0 px-md-5 employee-dashboard">

                <div className="employee-profile-page">

                    
                    <div className="esc-page-header">
                        <div>
                            <h2 className="esc-page-title">Employee Profile</h2>
                            <p className="esc-page-subtitle">
                                Manage employee details, records and essential information from one place.
                            </p>
                        </div>

                        <div>
                            <button type="button" className="epd-upload-btn" id="epdHeaderUploadBtn">
                                <i className="bi bi-cloud-arrow-up"></i>
                                Export
                            </button>
                        </div>
                    </div>

                    
                    <div className="esc-employee-bar">

                        <div className="esc-employee-main">

                            <div className="esc-avatar overflow-hidden">
                                {dynamicAvatarUrl && !avatarError ? (
                                    <img
                                        src={dynamicAvatarUrl}
                                        alt={employeeName}
                                        onError={() => setAvatarError(true)}
                                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "17px" }}
                                    />
                                ) : (
                                    employeeInitials
                                )}
                            </div>

                            <div className="esc-employee-info">
                                <div className="esc-name-row">
                                    <h3>{employeeName}</h3>
                                    <span className="esc-status-badge">
                                        <span></span>
                                        Active
                                    </span>
                                </div>

                                <p>{employeeProfile?.designation || "Employee"}</p>

                                <div className="esc-employee-meta">
                                    <span>
                                        <i className="bi bi-diagram-3"></i>
                                        {employeeProfile?.department || "Department"}
                                    </span>

                                    <span>
                                        <i className="bi bi-code-slash"></i>
                                        {employeeProfile?.team || "Team"}
                                    </span>

                                    <span>
                                        <i className="bi bi-person-badge"></i>
                                        {employeeProfile?.employee_code || "EMP-0000"}
                                    </span>
                                </div>
                            </div>

                        </div>

                        <div className="esc-employee-side">
                            <span className="esc-side-label">Profile Area</span>
                            <strong>Employee Profile</strong>
                        </div>

                    </div>


                    
                    <section className="ep-profile-tabs-wrapper">

                        <div className="ep-profile-tabs">

                            <button type="button" className={`ep-profile-tab${activeProfileTab === "overview" ? " active" : ""}`} data-profile-tab="overview" onClick={() => setActiveProfileTab("overview")}>
                                <i className="bi bi-grid-1x2"></i>
                                Overview
                            </button>

                            <button type="button" className={`ep-profile-tab${activeProfileTab === "employment" ? " active" : ""}`} data-profile-tab="employment" onClick={() => setActiveProfileTab("employment")}>
                                <i className="bi bi-briefcase"></i>
                                Employment
                            </button>

                            <button type="button" className={`ep-profile-tab${activeProfileTab === "documents" ? " active" : ""}`} data-profile-tab="documents" onClick={() => setActiveProfileTab("documents")}>
                                <i className="bi bi-folder2"></i>
                                Documents
                            </button>

                            <button type="button" className={`ep-profile-tab${activeProfileTab === "skills" ? " active" : ""}`} data-profile-tab="skills" onClick={() => setActiveProfileTab("skills")}>
                                <i className="bi bi-stars"></i>
                                Skills
                            </button>

                            <button type="button" className={`ep-profile-tab${activeProfileTab === "attendance" ? " active" : ""}`} data-profile-tab="attendance" onClick={() => setActiveProfileTab("attendance")}>
                                <i className="bi bi-calendar-check"></i>
                                Attendance
                            </button>

                            <button type="button" className={`ep-profile-tab${activeProfileTab === "leave" ? " active" : ""}`} data-profile-tab="leave" onClick={() => setActiveProfileTab("leave")}>
                                <i className="bi bi-calendar2-minus"></i>
                                Leave
                            </button>

                            <button type="button" className={`ep-profile-tab${activeProfileTab === "assets" ? " active" : ""}`} data-profile-tab="assets" onClick={() => setActiveProfileTab("assets")}>
                                <i className="bi bi-laptop"></i>
                                Assets
                            </button>

                            {/* <button type="button" className="ep-profile-tab" data-profile-tab="access">
                                <i className="bi bi-shield-lock"></i>
                                Access
                            </button> */}

                        </div>

                    </section>


                    
                    <section className={`ep-profile-content${activeProfileTab === "overview" ? "" : " d-none"}`} id="profileOverview">

                        <div className="row g-4">

                            
                            <div className="col-xl-8">

                                
                                <div className="ep-info-card">

                                    <div className="ep-card-heading common-card-heading">

                                        <div className="ep-card-heading-left">

                                            <div className="ep-card-icon ep-icon-purple">
                                                <i className="bi bi-person"></i>
                                            </div>

                                            <div>
                                                <h3>Personal Information</h3>
                                                <p>Basic personal details of the employee.</p>
                                            </div>

                                        </div>

                                    </div>


                                    <div className="row g-0 ep-information-grid">

                                        {personalItems.map((item) => (
                                            <div className="col-md-6 ep-information-item" key={item.label}>
                                                <span>{item.label}</span>
                                                <strong>{item.value || "-"}</strong>
                                            </div>
                                        ))}

                                    </div>

                                </div>


                                
                                <div className="ep-info-card">

                                    <div className="ep-card-heading common-card-heading">

                                        <div className="ep-card-heading-left">

                                            <div className="ep-card-icon ep-icon-blue">
                                                <i className="bi bi-briefcase"></i>
                                            </div>

                                            <div>
                                                <h3>Employment</h3>
                                                <p>Current organizational and employment details.</p>
                                            </div>

                                        </div>
                                    </div>


                                    <div className="row g-0 ep-information-grid">

                                        {employmentItems.map((item) => (
                                            <div className="col-md-6 ep-information-item" key={item.label}>
                                                <span>{item.label}</span>
                                                <strong>{item.value || "-"}</strong>
                                            </div>
                                        ))}

                                    </div>

                                </div>


                                
                                <div className="ep-info-card">

                                    <div className="ep-card-heading common-card-heading">

                                        <div className="ep-card-heading-left">

                                            <div className="ep-card-icon ep-icon-orange">
                                                <i className="bi bi-lightning"></i>
                                            </div>

                                            <div>
                                                <h3>Quick Information</h3>
                                                <p>Important information at a glance.</p>
                                            </div>

                                        </div>

                                    </div>


                                    <div className="row g-3">

                                        
                                        <div className="col-md-6">

                                            <div className="ep-quick-card">

                                                <div className="ep-quick-icon ep-quick-purple">
                                                    <i className="bi bi-kanban"></i>
                                                </div>

                                                <div>
                                                    <span>Current Project</span>
                                                    <strong>HRM Portal</strong>
                                                </div>

                                                <i className="bi bi-chevron-right ep-quick-arrow"></i>

                                            </div>

                                        </div>


                                        
                                        <div className="col-md-6">

                                            <div className="ep-quick-card">

                                                <div className="ep-quick-icon ep-quick-blue">
                                                    <i className="bi bi-stars"></i>
                                                </div>

                                                <div>
                                                    <span>Skills</span>

                                                    <strong className="ep-skill-preview">
                                                        {!employeeProfile ? "Loading skills..." : skillNames || "No skills listed"}
                                                    </strong>
                                                </div>

                                                <i className="bi bi-chevron-right ep-quick-arrow"></i>

                                            </div>

                                        </div>


                                        
                                        <div className="col-md-6">

                                            <div className="ep-quick-card">

                                                <div className="ep-quick-icon ep-quick-orange">
                                                    <i className="bi bi-hourglass-split"></i>
                                                </div>

                                                <div>
                                                    <span>Probation Status</span>
                                                    <strong className="ep-success-text">
                                                        Confirmed
                                                    </strong>
                                                </div>

                                                <i className="bi bi-chevron-right ep-quick-arrow"></i>

                                            </div>

                                        </div>


                                        
                                        <div className="col-md-6">

                                            <div className="ep-quick-card">

                                                <div className="ep-quick-icon ep-quick-pink">
                                                    <i className="bi bi-calendar2-check"></i>
                                                </div>

                                                <div>
                                                    <span>Leave Balance</span>
                                                    <strong>14 Days</strong>
                                                </div>

                                                <i className="bi bi-chevron-right ep-quick-arrow"></i>

                                            </div>

                                        </div>


                                        
                                        <div className="col-md-6">

                                            <div className="ep-quick-card">

                                                <div className="ep-quick-icon ep-quick-green">
                                                    <i className="bi bi-laptop"></i>
                                                </div>

                                                <div>
                                                    <span>Assigned Assets</span>
                                                    <strong>4 Assets</strong>
                                                </div>

                                                <i className="bi bi-chevron-right ep-quick-arrow"></i>

                                            </div>

                                        </div>


                                        
                                        <div className="col-md-6">

                                            <div className="ep-quick-card">

                                                <div className="ep-quick-icon ep-quick-red">
                                                    <i className="bi bi-person-badge"></i>
                                                </div>

                                                <div>
                                                    <span>HR Manager</span>
                                                    <strong>Anita Rao</strong>
                                                </div>

                                                <i className="bi bi-chevron-right ep-quick-arrow"></i>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </div>


                            
                            <div className="col-xl-4">

                                
                                <div className="ep-side-card ep-completion-card">

                                    <div className="ep-side-heading common-card-heading">

                                        <div>
                                            <span>PROFILE STATUS</span>
                                            <h3>Profile Completion</h3>
                                        </div>

                                        <div className="ep-completion-percentage">
                                            92%
                                        </div>

                                    </div>


                                    <div className="ep-completion-bar">
                                        <span style={{width: "92%"}}></span>
                                    </div>


                                    <p>
                                        Your employee profile is almost complete.
                                        Add the remaining information to reach 100%.
                                    </p>


                                    <div className="ep-completion-list">

                                        <div className="ep-completion-item completed">
                                            <i className="bi bi-check-circle-fill"></i>
                                            Personal information
                                        </div>

                                        <div className="ep-completion-item completed">
                                            <i className="bi bi-check-circle-fill"></i>
                                            Employment details
                                        </div>

                                        <div className="ep-completion-item completed">
                                            <i className="bi bi-check-circle-fill"></i>
                                            Contact information
                                        </div>

                                        <div className="ep-completion-item completed">
                                            <i className="bi bi-check-circle-fill"></i>
                                            Emergency contact
                                        </div>

                                        <div className="ep-completion-item pending">
                                            <i className="bi bi-clock-fill text-danger"></i>
                                            Documents
                                        </div>

                                    </div>

                                    <button type="button" className="btn ep-complete-profile-btn">
                                        Complete Profile
                                        <i className="bi bi-arrow-right"></i>
                                    </button>

                                </div>


                                
                                <div className="ep-side-card">

                                    <div className="ep-side-heading common-card-heading">

                                        <div>
                                            <span>REPORTING STRUCTURE</span>
                                            <h3>People</h3>
                                        </div>

                                        <i className="bi bi-diagram-3 ep-side-heading-icon"></i>

                                    </div>


                                    
                                    <div className="ep-person-card">

                                        <div className="ep-person-avatar ep-avatar-blue">
                                            MVP
                                        </div>

                                        <div className="ep-person-info">
                                            <span>Reporting Manager</span>
                                            <strong>Maruthi Vara Prasad</strong>
                                            <small>Engineering Manager</small>
                                        </div>

                                        <button type="button">
                                            <i className="bi bi-chevron-right"></i>
                                        </button>

                                    </div>


                                    
                                    

                                </div>


                                
                                <div className="ep-side-card">

                                    <div className="ep-side-heading common-card-heading">

                                        <div>
                                            <span>RECENT ACTIVITY</span>
                                            <h3>Latest Updates</h3>
                                        </div>

                                        <i className="bi bi-clock-history ep-side-heading-icon"></i>

                                    </div>


                                    <div className="ep-activity-list">

                                        <div className="ep-activity-item">

                                            <div className="ep-activity-icon ep-activity-purple">
                                                <i className="bi bi-pencil"></i>
                                            </div>

                                            <div>
                                                <strong>Profile updated</strong>
                                                <span>Today, 10:42 AM</span>
                                            </div>

                                        </div>


                                        <div className="ep-activity-item">

                                            <div className="ep-activity-icon ep-activity-blue">
                                                <i className="bi bi-laptop"></i>
                                            </div>

                                            <div>
                                                <strong>Laptop assigned</strong>
                                                <span>Yesterday, 04:15 PM</span>
                                            </div>

                                        </div>


                                        <div className="ep-activity-item">

                                            <div className="ep-activity-icon ep-activity-green">
                                                <i className="bi bi-check2-circle"></i>
                                            </div>

                                            <div>
                                                <strong>Profile verified</strong>
                                                <span>12 Sep 2026</span>
                                            </div>

                                        </div>


                                        <div className="ep-activity-item">

                                            <div className="ep-activity-icon ep-activity-orange">
                                                <i className="bi bi-arrow-up-right"></i>
                                            </div>

                                            <div>
                                                <strong>Designation updated</strong>
                                                <span>05 Sep 2026</span>
                                            </div>

                                        </div>

                                    </div>


                                    <button type="button" className="ep-view-activity">
                                        View all activity
                                        <i className="bi bi-arrow-right"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    
                    {activeProfileTab === "employment" && (
                        <EmploymentDetails
                            employeeProfile={employeeProfile}
                            currentUser={currentUser}
                            onProfileUpdate={onProfileUpdate}
                            embedded
                        />
                    )}

                    {activeProfileTab === "documents" && (
                        <Documents
                            employeeProfile={employeeProfile}
                            currentUser={currentUser}
                            embedded
                        />
                    )}

                    {activeProfileTab === "skills" && (
                        <SkillsCertifications employeeProfile={employeeProfile} currentUser={currentUser} embedded />
                    )}

                    {activeProfileTab === "attendance" && (
                        <Attendance employeeProfile={employeeProfile} currentUser={currentUser} embedded />
                    )}

                    {activeProfileTab === "leave" && (
                        <Leaves employeeProfile={employeeProfile} currentUser={currentUser} embedded />
                    )}

                    {activeProfileTab === "assets" && (
                        <Assets employeeProfile={employeeProfile} currentUser={currentUser} embedded />
                    )}

                    <section className={`ep-profile-tab-content${["overview", "employment", "documents", "skills", "attendance", "leave", "assets"].includes(activeProfileTab) ? " d-none" : ""}`} id="profileTabPlaceholder">
                        <div className="ep-placeholder-card">
                            <div className="ep-placeholder-icon">
                                <i className="bi bi-window-stack"></i>
                            </div>
                            <h3 id="profilePlaceholderTitle">
                                {activeProfileTab.charAt(0).toUpperCase() + activeProfileTab.slice(1)}
                            </h3>
                            <p>
                                This section will contain the employee's detailed
                                information and related records.
                            </p>
                        </div>
                    </section>
                </div>

            </div>
    </>
  );
}

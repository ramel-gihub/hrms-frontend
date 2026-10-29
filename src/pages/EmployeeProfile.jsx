import React, { useState, useEffect } from "react";
import EmploymentDetails from "./EmploymentDetails";
import Documents from "./Documents";
import SkillsCertifications from "./SkillsCertifications";
import Attendance from "./Attendance";
import Leaves from "./Leaves";
import Assets from "./Assets";
import Expenses from "./Expenses";

export default function EmployeeProfile({ currentUser, employeeProfile, onProfileUpdate, onNavigate }) {
    const API_BASE = import.meta.env.VITE_API_URL || "https://hrms-backend-5xo8.onrender.com";
    const [activeProfileTab, setActiveProfileTab] = useState("overview");
    const [skillsList, setSkillsList] = useState([]);
    const [skillsLoading, setSkillsLoading] = useState(false);
    const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
    const [allocatedAssetsCount, setAllocatedAssetsCount] = useState(null);
    const [totalLeaveBalance, setTotalLeaveBalance] = useState(null);
        const [documentsCount, setDocumentsCount] = useState(null);
    const [wfhRequests, setWfhRequests] = useState([]);
    const [wfhLoading, setWfhLoading] = useState(false);
    const [wfhPage, setWfhPage] = useState(1);
    const handleApplyWfh = () => {
        sessionStorage.setItem("open_wfh_request", "true");
        if (typeof onNavigate === "function") {
            onNavigate("employee-requests");
        } else {
            window.location.href = "/employee-requests";
        }
    };

    const effectiveUserId = currentUser?.id || employeeProfile?.user_id || employeeProfile?.userId || employeeProfile?.id;
    const effectiveEmpId = employeeProfile?.id;

    useEffect(() => {
        if (!effectiveUserId) return;
        let isCancelled = false;

        setSkillsLoading(true);
        fetch(`${API_BASE}/api/employee/skills/${effectiveUserId}`)
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => {
                if (!isCancelled && Array.isArray(data)) {
                    setSkillsList(data);
                }
            })
            .catch((err) => console.error("Failed to load skills:", err))
            .finally(() => {
                if (!isCancelled) setSkillsLoading(false);
            });

        fetch(`${API_BASE}/api/assets/${effectiveUserId}`)
            .then((res) => (res.ok ? res.json() : { assets: [] }))
            .then((data) => {
                if (!isCancelled) {
                    const assets = Array.isArray(data?.assets) ? data.assets : [];
                    const allocated = assets.filter(
                        (a) => (a.status || "").toLowerCase() !== "returned"
                    ).length;
                    setAllocatedAssetsCount(allocated);
                }
            })
            .catch((err) => console.error("Failed to load assets:", err));

                // Fetch WFH requests
        setWfhLoading(true);
        fetch(`${API_BASE}/api/employee-requests/${effectiveUserId}`)
            .then((res) => (res.ok ? res.json() : { requests: [] }))
            .then((data) => {
                if (!isCancelled) {
                    const reqs = Array.isArray(data?.requests) ? data.requests : [];
                    const wfh = reqs.filter((r) => {
                        if (effectiveEmpId && r.employee_id && Number(r.employee_id) !== Number(effectiveEmpId)) {
                            return false;
                        }
                        const cat = (r.category || "").toLowerCase();
                        const src = (r.source_type || "").toLowerCase();
                        const subj = (r.subject || "").toLowerCase();
                        return cat.includes("work from home") || cat.includes("wfh") || src === "wfh" || subj.includes("work from home") || subj.includes("wfh");
                    });
                    setWfhRequests(wfh);
                }
            })
            .catch((err) => console.error("Failed to load WFH requests:", err))
            .finally(() => {
                if (!isCancelled) setWfhLoading(false);
            });

        // Fetch leaves data for actual remaining balance
        fetch(`${API_BASE}/api/leaves/data/${effectiveUserId}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (!isCancelled && data?.balances && Array.isArray(data.balances)) {
                    const remaining = data.balances.reduce(
                        (sum, b) => sum + (parseFloat(b.remaining_days) || 0),
                        0
                    );
                    setTotalLeaveBalance(remaining);
                }
            })
            .catch((err) => console.error("Failed to load leaves:", err));

        // Fetch documents count
        fetch(`${API_BASE}/api/employee/documents/${effectiveUserId}`)
            .then((res) => (res.ok ? res.json() : []))
            .then((docs) => {
                if (!isCancelled && Array.isArray(docs)) {
                    setDocumentsCount(docs.length);
                }
            })
            .catch((err) => console.error("Failed to load documents:", err));

        return () => {
            isCancelled = true;
        };
    }, [effectiveUserId, API_BASE, activeProfileTab]);
    const firstName = employeeProfile?.first_name || "";
    const lastName = employeeProfile?.last_name || "";
    const employeeName = `${firstName} ${lastName}`.trim() || currentUser?.email || "Employee";
    const employeeInitials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
        || currentUser?.email?.slice(0, 2).toUpperCase()
        || "EM";
    const formatDob = (dateStr) => {
        if (!dateStr) return "18 August 1998";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
        } catch {
            return dateStr;
        }
    };

    const locationDisplay = employeeProfile?.location ||
        [employeeProfile?.current_city || employeeProfile?.city, employeeProfile?.current_country || "India"].filter(Boolean).join(", ") ||
        employeeProfile?.current_city ||
        employeeProfile?.city ||
        "Hyderabad, India";

    const phoneDisplay = employeeProfile?.phone ||
        employeeProfile?.phone_number ||
        employeeProfile?.mobile_number ||
        employeeProfile?.mobile ||
        "+91 98765 43210";

    const employeeCodeDisplay = employeeProfile?.employee_code ||
        (employeeProfile?.id ? `EMP-${String(employeeProfile.id).padStart(6, "0")}` : "EMP-000124");

    const personalItems = [
        { label: "Full Name", value: employeeName || "Anil Kumar" },
        { label: "Employee ID", value: employeeCodeDisplay },
        { label: "Email", value: employeeProfile?.email || currentUser?.email || "arun.kumar@example.com" },
        { label: "Phone", value: phoneDisplay },
        { label: "Date of Birth", value: formatDob(employeeProfile?.dob || employeeProfile?.date_of_birth) },
        { label: "Location", value: locationDisplay },
    ];

    const workScheduleItems = [
        { label: "Working Days", value: employeeProfile?.working_days || "Monday – Friday" },
        { label: "Working Hours", value: employeeProfile?.working_hours || "9:00 AM – 6:00 PM" },
        { label: "Time Zone", value: employeeProfile?.timezone || "India Standard Time (IST)" },
        { label: "Daily Break", value: employeeProfile?.daily_break || "1:00 PM – 2:00 PM" },
    ];

    const employmentItems = [
        { label: "Employee Code", value: employeeCodeDisplay },
        { label: "Designation", value: employeeProfile?.designation || "Developer" },
        { label: "Department", value: employeeProfile?.department || "Engineering" },
        { label: "Team", value: employeeProfile?.team || "General" },
        { label: "Employment Type", value: employeeProfile?.employment_type || "Full Time" },
        { label: "Work Mode", value: employeeProfile?.work_mode || "Hybrid" },
    ];
    const skillNames = Array.isArray(employeeProfile?.skills)
        ? employeeProfile.skills.filter(Boolean).join(" · ")
        : "";
    const hrManagerName = employeeProfile?.hr_manager_name || employeeProfile?.hr_manager || "";
    const hrManagerInitials = hrManagerName
        ? hrManagerName.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase()
        : "HR";
    const displaySkills = skillsList.length > 0
        ? skillsList.map((s) => s.skill_name).filter(Boolean).join(" · ")
        : (skillNames || "No skills listed");

    const leaveBalanceDisplay = totalLeaveBalance !== null
        ? `${totalLeaveBalance} ${totalLeaveBalance === 1 ? "Day" : "Days"}`
        : (employeeProfile?.leave_balance !== undefined && employeeProfile?.leave_balance !== null
            ? `${employeeProfile.leave_balance} ${employeeProfile.leave_balance === 1 ? "Day" : "Days"}`
            : "0 Days");

    const sections = employeeProfile?.completion_sections || {};
    const isPersonalComplete = sections.personal_info !== undefined
        ? Boolean(sections.personal_info)
        : Boolean(employeeProfile?.first_name && employeeProfile?.last_name && (employeeProfile?.dob || employeeProfile?.date_of_birth));

    const isEmploymentComplete = sections.employment_details !== undefined
        ? Boolean(sections.employment_details)
        : Boolean(employeeProfile?.designation && employeeProfile?.department && employeeProfile?.joining_date);

    const isContactComplete = sections.contact_info !== undefined
        ? Boolean(sections.contact_info)
        : Boolean(employeeProfile?.phone && (employeeProfile?.location || employeeProfile?.city));

    const isEmergencyComplete = sections.emergency_contact !== undefined
        ? Boolean(sections.emergency_contact)
        : false;

    const isDocumentsComplete = sections.documents !== undefined
        ? Boolean(sections.documents)
        : Boolean(documentsCount !== null ? documentsCount > 0 : false);

    const completionItems = [
        { label: "Personal information", completed: isPersonalComplete },
        { label: "Employment details", completed: isEmploymentComplete },
        { label: "Contact information", completed: isContactComplete },
        { label: "Emergency contact", completed: isEmergencyComplete },
        { label: "Documents", completed: isDocumentsComplete },
    ];
    const rawAvatar = employeeProfile?.profile_pic || employeeProfile?.avatar_url || "";
    const dynamicAvatarUrl = rawAvatar
        ? (/^(https?:\/\/|data:|blob:)/i.test(rawAvatar) ? rawAvatar : `${API_BASE}/${rawAvatar.replace(/^\/+/, "")}`)
        : "";
  return (
    <>
      <main className="dashboard-wrapper">
        <div className="dashboard-container">
          <div className="px-0 px-md-5 employee-dashboard">
            <div className="employee-profile-page">

                    
                    <div className="esc-page-header">
                        <div>
                            <h2 className="esc-page-title">Employee Profile</h2>
                            <p className="esc-page-subtitle">
                                Manage employee details, records and essential information from one place.
                            </p>
                        </div>

                        {/* <div>
                            <button type="button" className="epd-upload-btn" id="epdHeaderUploadBtn">
                                <i className="bi bi-cloud-arrow-up"></i>
                                Export
                            </button>
                        </div> */}
                    </div>


                    
                    <div className="esc-employee-bar">

                        <div className="esc-employee-main">

                            <div className="esc-avatar overflow-hidden">
                                {dynamicAvatarUrl ? (
                                    <img src={dynamicAvatarUrl} alt={employeeName} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "17px" }} />
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

                            <button type="button" className={`ep-profile-tab${activeProfileTab === "wfh" ? " active" : ""}`} data-profile-tab="wfh" onClick={() => { setActiveProfileTab("wfh"); setWfhPage(1); }}>
                                <i className="bi bi-house-door"></i>
                                Work From Home
                            </button>

                            {/*
                            <button type="button" className={`ep-profile-tab${activeProfileTab === "expenses" ? " active" : ""}`} data-profile-tab="expenses" onClick={() => setActiveProfileTab("expenses")}>
                                <i className="bi bi-wallet2"></i>
                                Expenses & Claims
                            </button>
                            */}

                            {/* <button type="button" className="ep-profile-tab" data-profile-tab="access">
                                <i className="bi bi-shield-lock"></i>
                                Access
                            </button> */}

                        </div>

                    </section>


                    
                    <section className={`ep-profile-content${activeProfileTab === "overview" ? "" : " d-none"}`} id="profileOverview">

                        {/* ROW 1: Personal Information + Profile Completion */}
                        <div className="row g-4 align-items-stretch mb-4">
                            <div className="col-lg-8 d-flex flex-column">
                                <div className="ep-info-card h-100 mb-0 d-flex flex-column">
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

                                    <div className="row g-0 ep-information-grid flex-grow-1">
                                        {personalItems.map((item) => (
                                            <div className="col-md-6 ep-information-item" key={item.label}>
                                                <span className="label">{item.label}</span>
                                                <strong className="value">{item.value || "-"}</strong>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="col-lg-4 d-flex flex-column">
                                <div className="ep-side-card ep-completion-card h-100 mb-0 d-flex flex-column justify-content-between">
                                    <div>
                                        <div className="ep-side-heading common-card-heading">
                                            <div>
                                                <span>PROFILE STATUS</span>
                                                <h3>Profile Completion</h3>
                                            </div>
                                            <div className="ep-completion-percentage">
                                                {employeeProfile?.profile_completion_percentage ?? 92}%
                                            </div>
                                        </div>

                                        <div className="ep-completion-bar">
                                            <span style={{ width: `${employeeProfile?.profile_completion_percentage ?? 92}%` }}></span>
                                        </div>

                                        <p>
                                            Your employee profile is almost complete. Add the remaining information to reach 100%.
                                        </p>

                                        <div className="ep-completion-list">
                                            {completionItems.map((item) => (
                                                <div
                                                    className={`ep-completion-item ${item.completed ? "completed" : "pending"}`}
                                                    key={item.label}
                                                >
                                                    {item.completed ? (
                                                        <i className="bi bi-check-circle-fill"></i>
                                                    ) : (
                                                        <i className="bi bi-clock-fill" style={{ color: "#ef4444" }}></i>
                                                    )}
                                                    {item.label}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button type="button" className="btn ep-complete-profile-btn" onClick={() => onNavigate?.("settings")}>
                                        Complete Profile
                                        <i className="bi bi-arrow-right"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ROW 2: Work Schedule + People */}
                        <div className="row g-4 align-items-stretch mb-4">
                            <div className="col-lg-8 d-flex flex-column">
                                <div className="ep-info-card h-100 mb-0 d-flex flex-column">
                                    <div className="ep-card-heading common-card-heading">
                                        <div className="ep-card-heading-left">
                                            <div className="ep-card-icon ep-icon-blue">
                                                <i className="bi bi-clock"></i>
                                            </div>
                                            <div>
                                                <h3>Work Schedule</h3>
                                                <p>Regular working hours and schedule at a glance.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row g-0 ep-information-grid flex-grow-1">
                                        {workScheduleItems.map((item) => (
                                            <div className="col-md-6 ep-information-item" key={item.label}>
                                                <span className="label">{item.label}</span>
                                                <strong className="value">{item.value || "-"}</strong>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="col-lg-4 d-flex flex-column">
                                <div className="ep-side-card h-100 mb-0 d-flex flex-column">
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
                                            <strong>{employeeProfile?.reporting_manager_name || "Maruthi Vara Prasad"}</strong>
                                            <small>Engineering Manager</small>
                                        </div>
                                        <button type="button">
                                            <i className="bi bi-chevron-right"></i>
                                        </button>
                                    </div>

                                    <div className="ep-person-card">
                                        <div className="ep-person-avatar ep-avatar-pink">
                                            {hrManagerInitials}
                                        </div>
                                        <div className="ep-person-info">
                                            <span>HR Manager</span>
                                            <strong>{hrManagerName || "—"}</strong>
                                            {hrManagerName ? <small>HR Department</small> : null}
                                        </div>
                                        <button type="button">
                                            <i className="bi bi-chevron-right"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ROW 3: Quick Information + Latest Updates (Aligned Row) */}
                        <div className="row g-4 align-items-stretch mb-4">
                            <div className="col-lg-8 d-flex flex-column">
                                <div className="ep-info-card h-100 mb-0 d-flex flex-column">
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

                                    <div className="ep-info-card-body flex-grow-1 d-flex flex-column justify-content-center">
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <div className="ep-quick-card">
                                                    <div className="ep-quick-icon ep-quick-purple">
                                                        <i className="bi bi-kanban"></i>
                                                    </div>
                                                    <div>
                                                        <span>Current Project</span>
                                                        <strong>{employeeProfile?.current_project || "HRM Portal"}</strong>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-md-6">
                                                <div
                                                    className="ep-quick-card"
                                                    onClick={() => setIsSkillsModalOpen(true)}
                                                    style={{ cursor: "pointer" }}
                                                    role="button"
                                                    title="Click to view detailed skills"
                                                >
                                                    <div className="ep-quick-icon ep-quick-blue">
                                                        <i className="bi bi-stars"></i>
                                                    </div>
                                                    <div className="overflow-hidden flex-grow-1">
                                                        <span>Skills</span>
                                                        <strong className="ep-skill-preview" style={{ maxWidth: "230px" }}>
                                                            {!employeeProfile && skillsLoading ? "Loading skills..." : displaySkills}
                                                        </strong>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-md-6">
                                                <div className="ep-quick-card">
                                                    <div className="ep-quick-icon ep-quick-orange">
                                                        <i className="bi bi-hourglass-split"></i>
                                                    </div>
                                                    <div>
                                                        <span>Probation Status</span>
                                                        <strong className={
                                                            (employeeProfile?.probation_status || "").toLowerCase() === "confirmed" || (employeeProfile?.probation_status || "").toLowerCase() === "completed"
                                                                ? "ep-success-text"
                                                                : "text-muted"
                                                        }>
                                                            {employeeProfile?.probation_status || "—"}
                                                        </strong>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-md-6">
                                                <div className="ep-quick-card">
                                                    <div className="ep-quick-icon ep-quick-pink">
                                                        <i className="bi bi-calendar2-check"></i>
                                                    </div>
                                                    <div>
                                                        <span>Leave Balance</span>
                                                        <strong>{leaveBalanceDisplay}</strong>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-md-6">
                                                <div className="ep-quick-card">
                                                    <div className="ep-quick-icon ep-quick-green">
                                                        <i className="bi bi-laptop"></i>
                                                    </div>
                                                    <div>
                                                        <span>Assigned Assets</span>
                                                        <strong>{allocatedAssetsCount !== null ? `${allocatedAssetsCount} ${allocatedAssetsCount === 1 ? "Asset" : "Assets"}` : "0 Assets"}</strong>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-md-6">
                                                <div className="ep-quick-card">
                                                    <div className="ep-quick-icon ep-quick-red">
                                                        <i className="bi bi-person-badge"></i>
                                                    </div>
                                                    <div>
                                                        <span>HR Manager</span>
                                                        <strong>{hrManagerName || "—"}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-lg-4 d-flex flex-column">
                                <div className="ep-side-card h-100 mb-0 d-flex flex-column justify-content-between">
                                    <div>
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

                    {activeProfileTab === "wfh" && (
                        <div className="ep-wfh-container mt-3">
                            {/* TOP STAT CARDS: Total, Approved, Pending */}
                            <div className="row g-3 mb-4">
                                {/* Total Requests */}
                                <div className="col-12 col-md-4">
                                    <div style={{
                                        backgroundColor: "#ffffff",
                                        borderRadius: "16px",
                                        padding: "20px 22px",
                                        border: "1px solid #e2e8f0",
                                        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "16px",
                                        height: "100%"
                                    }}>
                                        <div style={{
                                            width: "52px",
                                            height: "52px",
                                            borderRadius: "14px",
                                            backgroundColor: "#eff6ff",
                                            color: "#2563eb",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "24px",
                                            flexShrink: 0
                                        }}>
                                            <i className="bi bi-file-earmark-text"></i>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                                Total Requests
                                            </div>
                                            <div style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", lineHeight: 1.2, marginTop: "2px" }}>
                                                {wfhRequests.length}
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                                                All submitted applications
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Approved Requests */}
                                <div className="col-12 col-md-4">
                                    <div style={{
                                        backgroundColor: "#ffffff",
                                        borderRadius: "16px",
                                        padding: "20px 22px",
                                        border: "1px solid #e2e8f0",
                                        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "16px",
                                        height: "100%"
                                    }}>
                                        <div style={{
                                            width: "52px",
                                            height: "52px",
                                            borderRadius: "14px",
                                            backgroundColor: "#dcfce7",
                                            color: "#16a34a",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "24px",
                                            flexShrink: 0
                                        }}>
                                            <i className="bi bi-check-circle-fill"></i>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "12px", fontWeight: 600, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                                Approved Requests
                                            </div>
                                            <div style={{ fontSize: "28px", fontWeight: 800, color: "#15803d", lineHeight: 1.2, marginTop: "2px" }}>
                                                {wfhRequests.filter((r) => (r.status || "").toLowerCase() === "approved").length}
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                                                Granted remote work days
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Pending Requests */}
                                <div className="col-12 col-md-4">
                                    <div style={{
                                        backgroundColor: "#ffffff",
                                        borderRadius: "16px",
                                        padding: "20px 22px",
                                        border: "1px solid #e2e8f0",
                                        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "16px",
                                        height: "100%"
                                    }}>
                                        <div style={{
                                            width: "52px",
                                            height: "52px",
                                            borderRadius: "14px",
                                            backgroundColor: "#fef3c7",
                                            color: "#d97706",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "24px",
                                            flexShrink: 0
                                        }}>
                                            <i className="bi bi-clock-history"></i>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "12px", fontWeight: 600, color: "#d97706", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                                Pending Requests
                                            </div>
                                            <div style={{ fontSize: "28px", fontWeight: 800, color: "#b45309", lineHeight: 1.2, marginTop: "2px" }}>
                                                {wfhRequests.filter((r) => (r.status || "").toLowerCase() === "pending").length}
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                                                Awaiting manager / HR review
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RECORDS LIST CARD WITH 5 RECORDS PER PAGE */}
                            <div style={{
                                backgroundColor: "#ffffff",
                                borderRadius: "18px",
                                border: "1px solid #e2e8f0",
                                boxShadow: "0 4px 18px rgba(0,0,0,0.03)",
                                overflow: "hidden"
                            }}>
                                {/* Card Header */}
                                <div style={{
                                    padding: "20px 24px",
                                    borderBottom: "1px solid #f1f5f9",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    flexWrap: "wrap",
                                    gap: "12px"
                                }}>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#0f172a" }}>
                                            Work From Home Applications
                                        </h4>
                                        <p style={{ margin: "3px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                                            Showing 5 records per page
                                        </p>
                                    </div>
                                    {onNavigate && (
                                        <button 
                                            type="button" 
                                            onClick={handleApplyWfh}
                                            style={{
                                                padding: "8px 16px",
                                                backgroundColor: "#4f46e5",
                                                color: "#ffffff",
                                                borderRadius: "10px",
                                                border: "none",
                                                fontSize: "13px",
                                                fontWeight: 600,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px",
                                                cursor: "pointer"
                                            }}
                                        >
                                            <i className="bi bi-plus-lg"></i>
                                            Apply WFH
                                        </button>
                                    )}
                                </div>

                                {/* Table */}
                                <div className="table-responsive" style={{ margin: 0 }}>
                                    <table className="table align-middle" style={{ margin: 0, fontSize: "13.5px" }}>
                                        <thead style={{ backgroundColor: "#f8fafc", color: "#475569", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                            <tr>
                                                <th style={{ padding: "14px 20px", borderBottom: "1px solid #e2e8f0" }}>Request Code</th>
                                                <th style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0" }}>Dates & Duration</th>
                                                <th style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0" }}>Reason / Subject</th>
                                                <th style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0" }}>Emergency Contact</th>
                                                <th style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0" }}>Applied On</th>
                                                <th style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0" }}>Status</th>
                                                <th style={{ padding: "14px 20px", borderBottom: "1px solid #e2e8f0" }}>Admin Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {wfhLoading ? (
                                                <tr>
                                                    <td colSpan="7" style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                                                        <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                                                        Loading Work From Home records...
                                                    </td>
                                                </tr>
                                            ) : wfhRequests.length === 0 ? (
                                                <tr>
                                                    <td colSpan="7" style={{ textAlign: "center", padding: "48px 20px" }}>
                                                        <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#f1f5f9", color: "#94a3b8", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "24px", marginBottom: "12px" }}>
                                                            <i className="bi bi-house-door"></i>
                                                        </div>
                                                        <div style={{ fontWeight: 600, color: "#334155", fontSize: "15px" }}>No Work From Home Requests</div>
                                                        <div style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px" }}>You haven't submitted any WFH applications yet.</div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                wfhRequests
                                                    .slice((wfhPage - 1) * 5, wfhPage * 5)
                                                    .map((req, idx) => {
                                                        const sDate = req.wfh_start_date ? new Date(req.wfh_start_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-";
                                                        const eDate = req.wfh_end_date ? new Date(req.wfh_end_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : sDate;
                                                        const appliedDate = req.created_at ? new Date(req.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-";
                                                        const statusNorm = (req.status || "Pending").toLowerCase();

                                                        return (
                                                            <tr key={req.id || idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                                                <td style={{ padding: "16px 20px" }}>
                                                                    <span style={{ fontWeight: 600, color: "#3b82f6", backgroundColor: "#eff6ff", padding: "4px 10px", borderRadius: "8px", fontSize: "12px" }}>
                                                                        {req.request_code || `WFH-${req.id}`}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: "16px 16px" }}>
                                                                    <div style={{ fontWeight: 600, color: "#1e293b" }}>
                                                                        {sDate === eDate ? sDate : `${sDate} → ${eDate}`}
                                                                    </div>
                                                                    {sDate !== "-" && (
                                                                        <span style={{ fontSize: "11px", color: "#64748b" }}>
                                                                            {sDate === eDate ? "1 Day" : "Multiple Days"}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td style={{ padding: "16px 16px", maxWidth: "260px" }}>
                                                                    <div style={{ fontWeight: 600, color: "#0f172a" }}>
                                                                        {req.subject || "Work From Home"}
                                                                    </div>
                                                                    {req.description && (
                                                                        <div style={{ fontSize: "12px", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                                            {req.description}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td style={{ padding: "16px 16px", color: "#475569", fontSize: "12.5px" }}>
                                                                    {req.wfh_contact || req.phone_number || "-"}
                                                                </td>
                                                                <td style={{ padding: "16px 16px", color: "#475569", fontSize: "12.5px" }}>
                                                                    {appliedDate}
                                                                </td>
                                                                <td style={{ padding: "16px 16px" }}>
                                                                    {statusNorm === "approved" ? (
                                                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", backgroundColor: "#dcfce7", color: "#15803d", fontWeight: 600, fontSize: "12px", padding: "4px 10px", borderRadius: "20px" }}>
                                                                            <i className="bi bi-check-circle-fill"></i> Approved
                                                                        </span>
                                                                    ) : statusNorm === "rejected" ? (
                                                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", backgroundColor: "#fee2e2", color: "#b91c1c", fontWeight: 600, fontSize: "12px", padding: "4px 10px", borderRadius: "20px" }}>
                                                                            <i className="bi bi-x-circle-fill"></i> Rejected
                                                                        </span>
                                                                    ) : (
                                                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", backgroundColor: "#fef3c7", color: "#b45309", fontWeight: 600, fontSize: "12px", padding: "4px 10px", borderRadius: "20px" }}>
                                                                            <i className="bi bi-clock-history"></i> Pending
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td style={{ padding: "16px 20px", color: "#64748b", fontSize: "12.5px" }}>
                                                                    {req.admin_remarks || "-"}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination Controls - 5 records per page */}
                                {wfhRequests.length > 0 && (
                                    <div style={{
                                        padding: "14px 24px",
                                        backgroundColor: "#fafbfc",
                                        borderTop: "1px solid #f1f5f9",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        flexWrap: "wrap",
                                        gap: "12px"
                                    }}>
                                        <div style={{ fontSize: "13px", color: "#64748b" }}>
                                            Showing <strong style={{ color: "#0f172a" }}>{(wfhPage - 1) * 5 + 1}</strong> to <strong style={{ color: "#0f172a" }}>{Math.min(wfhPage * 5, wfhRequests.length)}</strong> of <strong style={{ color: "#0f172a" }}>{wfhRequests.length}</strong> records
                                        </div>

                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                            <button
                                                type="button"
                                                disabled={wfhPage <= 1}
                                                onClick={() => setWfhPage((prev) => Math.max(1, prev - 1))}
                                                style={{
                                                    padding: "6px 12px",
                                                    border: "1px solid #e2e8f0",
                                                    backgroundColor: wfhPage <= 1 ? "#f8fafc" : "#ffffff",
                                                    color: wfhPage <= 1 ? "#cbd5e1" : "#334155",
                                                    borderRadius: "8px",
                                                    fontSize: "13px",
                                                    cursor: wfhPage <= 1 ? "not-allowed" : "pointer"
                                                }}
                                            >
                                                <i className="bi bi-chevron-left me-1"></i> Prev
                                            </button>

                                            {Array.from({ length: Math.ceil(wfhRequests.length / 5) || 1 }).map((_, i) => {
                                                const pNum = i + 1;
                                                const isActive = pNum === wfhPage;
                                                return (
                                                    <button
                                                        key={pNum}
                                                        type="button"
                                                        onClick={() => setWfhPage(pNum)}
                                                        style={{
                                                            width: "32px",
                                                            height: "32px",
                                                            borderRadius: "8px",
                                                            border: isActive ? "none" : "1px solid #e2e8f0",
                                                            backgroundColor: isActive ? "#4f46e5" : "#ffffff",
                                                            color: isActive ? "#ffffff" : "#334155",
                                                            fontWeight: isActive ? 600 : 400,
                                                            fontSize: "13px",
                                                            cursor: "pointer"
                                                        }}
                                                    >
                                                        {pNum}
                                                    </button>
                                                );
                                            })}

                                            <button
                                                type="button"
                                                disabled={wfhPage >= Math.ceil(wfhRequests.length / 5)}
                                                onClick={() => setWfhPage((prev) => Math.min(Math.ceil(wfhRequests.length / 5), prev + 1))}
                                                style={{
                                                    padding: "6px 12px",
                                                    border: "1px solid #e2e8f0",
                                                    backgroundColor: wfhPage >= Math.ceil(wfhRequests.length / 5) ? "#f8fafc" : "#ffffff",
                                                    color: wfhPage >= Math.ceil(wfhRequests.length / 5) ? "#cbd5e1" : "#334155",
                                                    borderRadius: "8px",
                                                    fontSize: "13px",
                                                    cursor: wfhPage >= Math.ceil(wfhRequests.length / 5) ? "not-allowed" : "pointer"
                                                }}
                                            >
                                                Next <i className="bi bi-chevron-right ms-1"></i>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeProfileTab === "expenses" && (
                        <Expenses employeeProfile={employeeProfile} currentUser={currentUser} embedded />
                    )}

                    <section className={`ep-profile-tab-content${["overview", "employment", "documents", "skills", "attendance", "leave", "assets", "expenses", "wfh"].includes(activeProfileTab) ? " d-none" : ""}`} id="profileTabPlaceholder">
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
          </div>
        </main>

            {/* Skills Modal */}
            {isSkillsModalOpen && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{ backgroundColor: "rgba(15, 23, 42, 0.6)", zIndex: 1055 }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content" style={{ borderRadius: "16px", border: "none", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", overflow: "hidden" }}>
                            <div className="modal-header px-4 py-3" style={{ borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
                                <div className="d-flex align-items-center gap-2">
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "#e0e7ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
                                        <i className="bi bi-stars"></i>
                                    </div>
                                    <div>
                                        <h5 className="modal-title mb-0" style={{ fontWeight: 700, fontSize: "1.1rem", color: "#1e293b" }}>
                                            Employee Skills ({skillsList.length})
                                        </h5>
                                        <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                            Skills and competencies listed in the profile
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="btn-close"
                                    aria-label="Close"
                                    onClick={() => setIsSkillsModalOpen(false)}
                                ></button>
                            </div>

                            <div className="modal-body p-4" style={{ maxHeight: "65vh", overflowY: "auto" }}>
                                {skillsLoading ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="mt-2 text-muted" style={{ fontSize: "0.9rem" }}>Loading skills details...</p>
                                    </div>
                                ) : skillsList.length === 0 ? (
                                    <div className="text-center py-5">
                                        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#f1f5f9", color: "#94a3b8", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", marginBottom: 12 }}>
                                            <i className="bi bi-stars"></i>
                                        </div>
                                        <h6 style={{ fontWeight: 600, color: "#334155" }}>No Skills Recorded</h6>
                                        <p className="text-muted mb-3" style={{ fontSize: "0.85rem" }}>
                                            No skills have been added yet in the Skills &amp; Certifications section.
                                        </p>
                                        <button
                                            type="button"
                                            className="btn btn-primary btn-sm"
                                            style={{ borderRadius: 8, padding: "6px 16px" }}
                                            onClick={() => {
                                                setIsSkillsModalOpen(false);
                                                setActiveProfileTab("skills");
                                            }}
                                        >
                                            <i className="bi bi-plus-lg me-1"></i> Add Skills
                                        </button>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.9rem" }}>
                                            <thead style={{ background: "#f8fafc", color: "#475569", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                                <tr>
                                                    <th style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>Skill</th>
                                                    <th style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>Category</th>
                                                    <th style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>Proficiency</th>
                                                    <th style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>Experience</th>
                                                    <th style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>Last Used</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {skillsList.map((skill) => {
                                                    const badgeColor =
                                                        skill.proficiency === "Expert" ? { bg: "#dcfce7", color: "#15803d" } :
                                                        skill.proficiency === "Advanced" ? { bg: "#f3e8ff", color: "#7e22ce" } :
                                                        skill.proficiency === "Intermediate" ? { bg: "#e0f2fe", color: "#0369a1" } :
                                                        { bg: "#f1f5f9", color: "#475569" };

                                                    return (
                                                        <tr key={skill.id || skill.skill_name}>
                                                            <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1e293b" }}>
                                                                {skill.skill_name}
                                                            </td>
                                                            <td style={{ padding: "12px 16px", color: "#64748b" }}>
                                                                <span className="badge" style={{ background: "#f1f5f9", color: "#334155", fontWeight: 500, fontSize: "0.8rem" }}>
                                                                    {skill.skill_category || "General"}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: "12px 16px" }}>
                                                                <span
                                                                    className="badge"
                                                                    style={{
                                                                        background: badgeColor.bg,
                                                                        color: badgeColor.color,
                                                                        fontWeight: 600,
                                                                        fontSize: "0.8rem",
                                                                        padding: "5px 10px",
                                                                        borderRadius: "6px"
                                                                    }}
                                                                >
                                                                    {skill.proficiency || "Beginner"}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: "12px 16px", color: "#475569" }}>
                                                                {skill.years_of_experience ? `${skill.years_of_experience} ${skill.years_of_experience === 1 || skill.years_of_experience === "1" ? "Year" : "Years"}` : "—"}
                                                            </td>
                                                            <td style={{ padding: "12px 16px", color: "#64748b" }}>
                                                                {skill.last_used || "—"}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer px-4 py-3" style={{ borderTop: "1px solid #f1f5f9", background: "#f8fafc" }}>
                                <button
                                    type="button"
                                    className="btn btn-outline-primary btn-sm me-auto"
                                    style={{ borderRadius: 8, padding: "7px 16px", fontWeight: 500 }}
                                    onClick={() => {
                                        setIsSkillsModalOpen(false);
                                        setActiveProfileTab("skills");
                                    }}
                                >
                                    <i className="bi bi-box-arrow-up-right me-1"></i> Manage in Skills Tab
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    style={{ borderRadius: 8, padding: "7px 18px", fontWeight: 500 }}
                                    onClick={() => setIsSkillsModalOpen(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

    </>
  );
}

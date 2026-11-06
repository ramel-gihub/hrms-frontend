import React, { useState, useEffect, useRef, useMemo } from "react";
import Chart from "react-apexcharts";
import EmptyState from "../components/EmptyState";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5002";

const getInitials = (nameOrFirst, last) => {
  if (last !== undefined) {
    const f = (nameOrFirst || "").trim().charAt(0);
    const l = (last || "").trim().charAt(0);
    return (f + l).toUpperCase() || "U";
  }
  const parts = String(nameOrFirst || "").trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }
  return String(nameOrFirst || "U").charAt(0).toUpperCase();
};

const getAvatarBg = (name) => {
  const colors = [
    { bg: "#e0e7ff", text: "#4338ca" },
    { bg: "#fef3c7", text: "#b45309" },
    { bg: "#d1fae5", text: "#065f46" },
    { bg: "#fce7f3", text: "#9d174d" },
    { bg: "#e0f2fe", text: "#0369a1" },
    { bg: "#ede9fe", text: "#6d28d9" },
  ];
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function MyTeam({ currentUser, employeeProfile }) {
  const currentEmpId = employeeProfile?.id || currentUser?.id || 1;
  const user = currentUser || (employeeProfile?.user_id ? { id: employeeProfile.user_id, email: employeeProfile.email } : null);

  // Active Main Navigation Tab
  // "session": BeeWork 5-step Daily Session (Image 1)
  // "team_hours": Team Lead Hours Summary (Image 2 Left)
  // "pm_pnl": Project Manager & Admin Profit/Loss 115 days = 1,240 hrs (Image 2 Right)
  // "roster": Team Members & Project Teams Overview
  const [activeTab, setActiveTab] = useState("session");

  // ----------------------------------------------------------------------
  // TAB 1: DAILY WORK SESSION (BeeWork Flow - Image 1)
  // ----------------------------------------------------------------------
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [clockedIn, setClockedIn] = useState(true);
  const [locationName, setLocationName] = useState("Office 20 - Cyberjaya HQ");
  const [clients, setClients] = useState([]);
  const [sessionProjects, setSessionProjects] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);

  // Form State
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [taskInput, setTaskInput] = useState("");
  const [isBillable, setIsBillable] = useState(true);
  const [startingSession, setStartingSession] = useState(false);
  const [stoppingSession, setStoppingSession] = useState(false);
  const [sessionFeedback, setSessionFeedback] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // ----------------------------------------------------------------------
  // TAB 2: TEAM LEAD HOURS SUMMARY (Image 2 Left)
  // ----------------------------------------------------------------------
  const [teamSummaryLoading, setTeamSummaryLoading] = useState(false);
  const [teamProjectsBreakdown, setTeamProjectsBreakdown] = useState([]);
  const [activeTeamSessions, setActiveTeamSessions] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [approvingSessionId, setApprovingSessionId] = useState(null);

  // ----------------------------------------------------------------------
  // TAB 3: PROJECT MANAGER & ADMIN PROFIT/LOSS SUMMARY (Image 2 Right)
  // ----------------------------------------------------------------------
  const [pmSummaryLoading, setPmSummaryLoading] = useState(false);
  const [pmSummary, setPmSummary] = useState(null);
  const [pmProjects, setPmProjects] = useState([]);
  const [clientDistribution, setClientDistribution] = useState([]);
  const [filterPnlStatus, setFilterPnlStatus] = useState("all");

  // ----------------------------------------------------------------------
  // TAB 4: ORIGINAL PROJECT TEAMS & MEMBERS ROSTER
  // ----------------------------------------------------------------------
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterTeams, setRosterTeams] = useState([]);
  const [selectedRosterTeamId, setSelectedRosterTeamId] = useState(null);
  const [searchMember, setSearchMember] = useState("");
  // ----------------------------------------------------------------------
  // TEAM LEAD TASK ASSIGNMENT & EMPLOYEE ASSIGNED TASKS
  // ----------------------------------------------------------------------
  const [teamLeadTasks, setTeamLeadTasks] = useState([]);
  const [employeeAssignedTasks, setEmployeeAssignedTasks] = useState([]);
  const [showAssignTaskModal, setShowAssignTaskModal] = useState(false);
  const [taskProjectId, setTaskProjectId] = useState("");
  const [taskAssignedTo, setTaskAssignedTo] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskEstHours, setTaskEstHours] = useState(8.0);
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState("Medium");
  const [submittingTask, setSubmittingTask] = useState(false);

  // ----------------------------------------------------------------------
  // DATA FETCHING
  // ----------------------------------------------------------------------
  const fetchWorkSessionOptions = async () => {
    try {
      setOptionsLoading(true);
      const res = await fetch(`${API_BASE}/api/work-sessions/options/${currentEmpId}`);
      const data = await res.json();
      if (data && data.success) {
        setClockedIn(data.clockedIn ?? true);
        setLocationName(data.attendanceLocation || "Office 20 - Cyberjaya HQ");
        setClients(data.clients || []);
        setSessionProjects(data.projects || []);
        setActiveSession(data.activeSession || null);
        if (data.activeSession) {
          setSelectedClientId(data.activeSession.client_id || "");
          setSelectedProjectId(data.activeSession.project_id || "");
          setTaskInput(data.activeSession.task_description || "");
        }
      }
    } catch (err) {
      console.error("Failed to fetch session options:", err);
    } finally {
      setOptionsLoading(false);
    }
  };

  const fetchRecentSessions = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/work-sessions/my-sessions/${currentEmpId}`);
      const data = await res.json();
      if (data && data.success) {
        setRecentSessions(data.sessions || []);
      }
    } catch (err) {
      console.error("Failed to fetch my sessions:", err);
    }
  };

  const fetchTeamLeadSummary = async () => {
    try {
      setTeamSummaryLoading(true);
      const res = await fetch(`${API_BASE}/api/team-lead/hours-summary/${currentEmpId}`);
      const data = await res.json();
      if (data && data.success) {
        setTeamProjectsBreakdown(data.projectsBreakdown || []);
        setActiveTeamSessions(data.activeTeamSessions || []);
        setPendingApprovals(data.pendingApprovals || []);
      }
    } catch (err) {
      console.error("Failed to fetch team lead summary:", err);
    } finally {
      setTeamSummaryLoading(false);
    }
  };

  const fetchProjectManagerSummary = async () => {
    try {
      setPmSummaryLoading(true);
      const res = await fetch(`${API_BASE}/api/project-manager/project-summary`);
      const data = await res.json();
      if (data && data.success) {
        setPmSummary(data.summary || null);
        setPmProjects(data.projects || []);
        setClientDistribution(data.clientDistribution || []);
      }
    } catch (err) {
      console.error("Failed to fetch PM summary:", err);
    } finally {
      setPmSummaryLoading(false);
    }
  };

    const fetchTeamLeadTasks = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/team-lead/tasks/${currentEmpId}`);
      const data = await res.json();
      if (data && data.success) {
        setTeamLeadTasks(data.tasks || []);
      }
    } catch (err) {
      console.error("Failed to fetch team lead tasks:", err);
    }
  };

  const fetchEmployeeTasks = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/employee/assigned-tasks/${currentEmpId}`);
      const data = await res.json();
      if (data && data.success) {
        setEmployeeAssignedTasks(data.tasks || []);
      }
    } catch (err) {
      console.error("Failed to fetch employee tasks:", err);
    }
  };

  const handleAssignTaskSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!taskProjectId || !taskAssignedTo || !taskTitle.trim()) {
      alert("Please select project, employee, and enter task title.");
      return;
    }
    try {
      setSubmittingTask(true);
      const res = await fetch(`${API_BASE}/api/team-lead/assign-task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: taskProjectId,
          assignedTo: taskAssignedTo,
          assignedBy: currentEmpId,
          taskName: taskTitle.trim(),
          taskDescription: taskDesc.trim(),
          estimatedHours: parseFloat(taskEstHours) || 8.0,
          dueDate: taskDueDate || null,
          priority: taskPriority
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShowAssignTaskModal(false);
        setTaskTitle("");
        setTaskDesc("");
        setTaskDueDate("");
        setSessionFeedback({ type: "success", text: "Task assigned to team employee successfully!" });
        fetchTeamLeadTasks();
        fetchEmployeeTasks();
      } else {
        alert(data.error || "Failed to assign task");
      }
    } catch (err) {
      alert("Error assigning task: " + err.message);
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${taskId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchTeamLeadTasks();
        fetchEmployeeTasks();
      }
    } catch (err) {
      console.error("Failed to update task status:", err);
    }
  };

  const fetchMyTeamsRoster = async () => {
    if (!user?.id && !currentEmpId) return;
    setRosterLoading(true);
    try {
      const uid = user?.id || currentEmpId;
      const res = await fetch(`${API_BASE}/api/employee/my-teams/${uid}`);
      if (res.ok) {
        const data = await res.json();
        const list = data.teams || [];
        setRosterTeams(list);
        if (list.length > 0 && !selectedRosterTeamId) {
          setSelectedRosterTeamId(list[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching my teams roster:", err);
    } finally {
      setRosterLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkSessionOptions();
    fetchRecentSessions();
    fetchTeamLeadSummary();
    fetchProjectManagerSummary();
    fetchMyTeamsRoster();
    fetchTeamLeadTasks();
    fetchEmployeeTasks();
  }, [currentEmpId, user?.id]);

  // Live Timer for running session
  useEffect(() => {
    if (!activeSession || !activeSession.start_time) {
      setElapsedSeconds(0);
      return;
    }
    const updateElapsed = () => {
      const start = new Date(activeSession.start_time).getTime();
      const now = new Date().getTime();
      const secs = Math.max(0, Math.floor((now - start) / 1000));
      setElapsedSeconds(secs);
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const formatTimer = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const filteredSessionProjects = useMemo(() => {
    if (!selectedClientId) return sessionProjects;
    return sessionProjects.filter(p => !p.client_id || String(p.client_id) === String(selectedClientId));
  }, [sessionProjects, selectedClientId]);

  // ----------------------------------------------------------------------
  // ACTIONS: START & STOP SESSION, APPROVE
  // ----------------------------------------------------------------------
  const handleStartSession = async (e) => {
    if (e) e.preventDefault();
    if (!selectedClientId) {
      setSessionFeedback({ type: "danger", text: "Please select a client to start your session." });
      return;
    }
    if (!selectedProjectId) {
      setSessionFeedback({ type: "danger", text: "Please select a project to start your session." });
      return;
    }
    if (!taskInput || !taskInput.trim()) {
      setSessionFeedback({ type: "danger", text: "Please describe what you are working on." });
      return;
    }

    try {
      setStartingSession(true);
      setSessionFeedback(null);
      const res = await fetch(`${API_BASE}/api/work-sessions/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: currentEmpId,
          clientId: selectedClientId,
          projectId: selectedProjectId,
          taskDescription: taskInput.trim(),
          isBillable
        })
      });
      const data = await res.json();
      if (data && data.success) {
        setActiveSession(data.session);
        setSessionFeedback({ type: "success", text: "Session started! Timer is actively recording." });
        fetchRecentSessions();
        fetchTeamLeadSummary();
        fetchProjectManagerSummary();
      } else {
        setSessionFeedback({ type: "danger", text: data.error || "Failed to start session." });
      }
    } catch (err) {
      setSessionFeedback({ type: "danger", text: "Network error: " + err.message });
    } finally {
      setStartingSession(false);
    }
  };

  const handleStopSession = async () => {
    if (!activeSession) return;
    try {
      setStoppingSession(true);
      setSessionFeedback(null);
      const res = await fetch(`${API_BASE}/api/work-sessions/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSession.id,
          employeeId: currentEmpId
        })
      });
      const data = await res.json();
      if (data && data.success) {
        setActiveSession(null);
        setTaskInput("");
        setSessionFeedback({ type: "success", text: `Session stopped. Recorded ${data.session.duration_hours} hrs successfully.` });
        fetchRecentSessions();
        fetchTeamLeadSummary();
        fetchProjectManagerSummary();
      } else {
        setSessionFeedback({ type: "danger", text: data.error || "Failed to stop session." });
      }
    } catch (err) {
      setSessionFeedback({ type: "danger", text: "Network error: " + err.message });
    } finally {
      setStoppingSession(false);
    }
  };

  const handleApproveSession = async (sessionId) => {
    try {
      setApprovingSessionId(sessionId);
      const res = await fetch(`${API_BASE}/api/team-lead/approve-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          approverEmployeeId: currentEmpId
        })
      });
      const data = await res.json();
      if (data && data.success) {
        fetchTeamLeadSummary();
        fetchProjectManagerSummary();
      }
    } catch (err) {
      console.error("Failed to approve session:", err);
    } finally {
      setApprovingSessionId(null);
    }
  };

  // ----------------------------------------------------------------------
  // APEXCHARTS CONFIG FOR MULTI-TIER DONUT (IMAGE 2 RIGHT)
  // ----------------------------------------------------------------------
  const donutSeries = useMemo(() => {
    if (!clientDistribution || clientDistribution.length === 0) return [1];
    return clientDistribution.map(c => Math.max(0.1, c.totalHours));
  }, [clientDistribution]);

  const donutLabels = useMemo(() => {
    if (!clientDistribution || clientDistribution.length === 0) return ["No hours logged"];
    return clientDistribution.map(c => `${c.clientName} (${c.totalHours} hrs)`);
  }, [clientDistribution]);

  const donutOptions = {
    chart: { type: "donut", fontFamily: "inherit" },
    labels: donutLabels,
    colors: ["#10b981", "#3b82f6", "#ec4899", "#8b5cf6", "#f59e0b", "#06b6d4"],
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            name: { show: true, fontSize: "14px", fontWeight: 600, color: "#64748b" },
            value: {
              show: true,
              fontSize: "20px",
              fontWeight: 700,
              formatter: (val) => `${parseFloat(val).toFixed(1)}h`
            },
            total: {
              show: true,
              label: "Total Burned",
              formatter: () => `${pmSummary?.totalBurnedHours || 0} hrs`
            }
          }
        }
      }
    },
    legend: { position: "bottom", horizontalAlign: "center", markers: { radius: 12 } },
    dataLabels: { enabled: false },
    stroke: { width: 3, colors: ["#ffffff"] },
    tooltip: {
      y: { formatter: (val) => `${parseFloat(val).toFixed(2)} Hours logged` }
    }
  };

  const filteredPmProjects = useMemo(() => {
    if (filterPnlStatus === "all") return pmProjects;
    return pmProjects.filter(p => p.status_pnl === filterPnlStatus);
  }, [pmProjects, filterPnlStatus]);

  const activeRosterTeam = rosterTeams.find((t) => t.id === selectedRosterTeamId) || rosterTeams[0];
  const filteredRosterMembers = (activeRosterTeam?.members || []).filter((m) => {
    if (!searchMember.trim()) return true;
    const q = searchMember.toLowerCase();
    const name = (m.employee_name || "").toLowerCase();
    const des = (m.designation || "").toLowerCase();
    const dept = (m.department || "").toLowerCase();
    const code = (m.employee_code || "").toLowerCase();
    return name.includes(q) || des.includes(q) || dept.includes(q) || code.includes(q);
  });

  return (
    <div className="container-fluid py-4" style={{ maxWidth: "1440px" }}>
      {/* TOP HEADER */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h3 className="fw-bold mb-0 text-dark">Client Projects & Work Sessions</h3>
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1">
              Local System Active
            </span>
          </div>
          <p className="text-muted small mb-0 mt-1">
            End-to-end Client ➔ Project ➔ Work Sessions ➔ Invoices ➔ Profit/Loss Tracking (115 days / 1,240 hrs).
          </p>
        </div>

        {/* ROLE VIEW / TAB SWITCHER */}
        <div className="d-flex align-items-center gap-1 bg-white p-1.5 rounded-3 border shadow-sm flex-wrap">
          <button 
            type="button" 
            className={`btn btn-sm ${activeTab === "session" ? "btn-primary shadow-xs fw-semibold" : "btn-light text-dark"}`}
            onClick={() => setActiveTab("session")}
          >
            <i className="bi bi-play-circle-fill me-1.5 text-success"></i>Daily Session
          </button>
          <button 
            type="button" 
            className={`btn btn-sm ${activeTab === "team_hours" ? "btn-primary shadow-xs fw-semibold" : "btn-light text-dark"}`}
            onClick={() => setActiveTab("team_hours")}
          >
            <i className="bi bi-people-fill me-1.5 text-primary"></i>Team Lead Hours
          </button>
          <button 
            type="button" 
            className={`btn btn-sm ${activeTab === "pm_pnl" ? "btn-primary shadow-xs fw-semibold" : "btn-light text-dark"}`}
            onClick={() => setActiveTab("pm_pnl")}
          >
            <i className="bi bi-graph-up-arrow me-1.5 text-warning"></i>PM Profit & Loss
          </button>
          <button 
            type="button" 
            className={`btn btn-sm ${activeTab === "roster" ? "btn-primary shadow-xs fw-semibold" : "btn-light text-dark"}`}
            onClick={() => setActiveTab("roster")}
          >
            <i className="bi bi-person-lines-fill me-1.5 text-info"></i>Team Roster
          </button>
        </div>
      </div>

      {/* FEEDBACK ALERT */}
      {sessionFeedback && (
        <div className={`alert alert-${sessionFeedback.type} alert-dismissible fade show d-flex align-items-center gap-2 shadow-sm mb-4`} role="alert">
          <i className={`bi ${sessionFeedback.type === "success" ? "bi-check-circle-fill text-success" : "bi-exclamation-triangle-fill text-danger"} fs-5`}></i>
          <div>{sessionFeedback.text}</div>
          <button type="button" className="btn-close" onClick={() => setSessionFeedback(null)}></button>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 1: DAILY WORK SESSION (BeeWork 5-step Flow - Image 1)               */}
      {/* ====================================================================== */}
      {activeTab === "session" && (
        <div className="row g-4">
          {/* LEFT COLUMN: 5-STEP WORKFLOW GUIDE & CLOCKED IN CARD */}
          <div className="col-lg-5 col-xl-4">
            <div className="card border-0 shadow-sm rounded-4 h-100 bg-white overflow-hidden">
              <div className="p-4 text-white" style={{ background: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)" }}>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <span className="badge bg-white text-primary fw-bold px-2.5 py-1">THE DAILY FLOW</span>
                  <span className="small opacity-75">beeWork Standard</span>
                </div>
                <h4 className="fw-bold mb-1">Start a session in five steps.</h4>
                <p className="small opacity-75 mb-0">Follow the standard sequence to log billable hours accurately.</p>
              </div>

              <div className="card-body p-4 d-flex flex-column gap-3">
                {/* Step 1 */}
                <div className="d-flex align-items-start gap-3 p-3 rounded-3 bg-light border">
                  <div className="badge rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: 28, height: 28, flexShrink: 0 }}>
                    1
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-semibold small text-dark">Clock in for the day</div>
                    <div className="text-muted" style={{ fontSize: "12px" }}>BeeWhere mobile or office scanner (required)</div>
                    <div className="mt-2 d-flex align-items-center gap-2">
                      <span className="badge bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-1.5 px-2.5 py-1">
                        <span className="spinner-grow spinner-grow-sm text-success" style={{ width: 8, height: 8 }}></span>
                        {clockedIn ? `Clocked In • ${locationName}` : "Not Clocked In"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="d-flex align-items-start gap-3 p-3 rounded-3 bg-light border">
                  <div className="badge rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: 28, height: 28, flexShrink: 0 }}>
                    2
                  </div>
                  <div>
                    <div className="fw-semibold small text-dark">Select a client</div>
                    <div className="text-muted" style={{ fontSize: "12px" }}>Choose the contract client receiving the work.</div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="d-flex align-items-start gap-3 p-3 rounded-3 bg-light border">
                  <div className="badge rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: 28, height: 28, flexShrink: 0 }}>
                    3
                  </div>
                  <div>
                    <div className="fw-semibold small text-dark">Select a project</div>
                    <div className="text-muted" style={{ fontSize: "12px" }}>Select the active milestone or deliverable.</div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="d-flex align-items-start gap-3 p-3 rounded-3 bg-light border">
                  <div className="badge rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: 28, height: 28, flexShrink: 0 }}>
                    4
                  </div>
                  <div>
                    <div className="fw-semibold small text-dark">Type the task and press Enter</div>
                    <div className="text-muted" style={{ fontSize: "12px" }}>Clear summary of the work unit (e.g. bugfix, API).</div>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="d-flex align-items-start gap-3 p-3 rounded-3 bg-light border">
                  <div className="badge rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: 28, height: 28, flexShrink: 0 }}>
                    5
                  </div>
                  <div>
                    <div className="fw-semibold small text-dark">Click Start session</div>
                    <div className="text-muted" style={{ fontSize: "12px" }}>Live timer starts immediately. Stop when taking breaks.</div>
                  </div>
                </div>

                <div className="p-3 rounded-3 border text-dark small" style={{ backgroundColor: "#fef9c3", borderColor: "#fef08a" }}>
                  <i className="bi bi-info-circle-fill text-warning me-1.5"></i>
                  <strong>Rule:</strong> Client and project are both required — and at least one task description.
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ACTIVE SESSION WIDGET / NEW SESSION FORM */}
          <div className="col-lg-7 col-xl-8">
            <div className="card border-0 shadow-sm rounded-4 bg-white mb-4">
              <div className="card-header bg-white border-bottom p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-3">
                    <div className="rounded-3 bg-primary text-white d-flex align-items-center justify-content-center shadow-xs" style={{ width: 44, height: 44 }}>
                      <i className="bi bi-play-circle-fill fs-5"></i>
                    </div>
                    <div>
                      <h5 className="fw-bold mb-0 text-dark">beeWork Workspace Session</h5>
                      <small className="text-muted">Run your time. Get things done.</small>
                    </div>
                  </div>
                  {activeSession ? (
                    <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 fw-bold">
                      <span className="spinner-grow spinner-grow-sm me-1.5"></span> RECORDING ACTIVE
                    </span>
                  ) : (
                    <span className="badge bg-light text-secondary border px-3 py-2">
                      Ready to Start
                    </span>
                  )}
                </div>
              </div>

              <div className="card-body p-4">
                {/* ACTIVE RUNNING SESSION CARD */}
                {activeSession ? (
                  <div className="p-4 rounded-4 border border-success bg-success-subtle bg-opacity-25 mb-4">
                    <div className="row align-items-center gy-3">
                      <div className="col-md-7">
                        <span className="badge bg-success text-white mb-2">RUNNING WORK SESSION</span>
                        <h4 className="fw-bold text-dark mb-1">{activeSession.task_description}</h4>
                        <div className="text-muted small d-flex flex-wrap align-items-center gap-3 mt-2">
                          <span><i className="bi bi-building me-1 text-primary"></i>Client: <strong>{activeSession.client_name || "Assigned Client"}</strong></span>
                          <span><i className="bi bi-folder2 me-1 text-primary"></i>Project: <strong>{activeSession.project_name || "Active Project"}</strong></span>
                          <span><i className="bi bi-tag me-1 text-primary"></i>{activeSession.is_billable ? "Billable Work" : "Non-Billable"}</span>
                        </div>
                      </div>
                      <div className="col-md-5 text-md-end">
                        <div className="display-6 fw-bold font-monospace text-dark mb-2">
                          {formatTimer(elapsedSeconds)}
                        </div>
                        <button 
                          className="btn btn-danger btn-lg px-4 rounded-pill shadow-sm"
                          onClick={handleStopSession}
                          disabled={stoppingSession}
                        >
                          {stoppingSession ? (
                            <><span className="spinner-border spinner-border-sm me-2"></span>Stopping...</>
                          ) : (
                            <><i className="bi bi-stop-circle-fill me-2"></i>Stop Session</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* START NEW SESSION FORM */
                  <form onSubmit={handleStartSession}>
                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small text-dark">
                          Client <span className="text-danger">*</span>
                        </label>
                        <select 
                          className="form-select"
                          value={selectedClientId}
                          onChange={(e) => {
                            setSelectedClientId(e.target.value);
                            setSelectedProjectId("");
                          }}
                          required
                        >
                          <option value="">Select a client...</option>
                          {clients.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.client_code ? `(${c.client_code})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold small text-dark">
                          Project <span className="text-danger">*</span>
                        </label>
                        <select 
                          className="form-select"
                          value={selectedProjectId}
                          onChange={(e) => setSelectedProjectId(e.target.value)}
                          required
                          disabled={!selectedClientId}
                        >
                          <option value="">
                            {selectedClientId ? "Select a project..." : "First select a client"}
                          </option>
                          {filteredSessionProjects.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.project_name} {p.project_code ? `(${p.project_code})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-dark">
                        What are you working on? <span className="text-danger">*</span>
                      </label>
                      <input 
                        type="text"
                        className="form-control form-control-lg"
                        placeholder="e.g. Fixing login bug on client portal / API development..."
                        value={taskInput}
                        onChange={(e) => setTaskInput(e.target.value)}
                        required
                      />
                      <small className="text-muted mt-1 d-block">
                        Be descriptive. This will appear on client invoices and team lead timesheet reviews.
                      </small>
                    </div>

                    <div className="d-flex align-items-center justify-content-between pt-3 border-top">
                      <div className="form-check form-switch">
                        <input 
                          className="form-check-input"
                          type="checkbox"
                          id="billableCheck"
                          checked={isBillable}
                          onChange={(e) => setIsBillable(e.target.checked)}
                        />
                        <label className="form-check-label fw-semibold small text-dark" htmlFor="billableCheck">
                          Billable Session (Track against client invoice)
                        </label>
                      </div>

                      <button 
                        type="submit"
                        className="btn btn-primary btn-lg px-5 rounded-pill shadow-sm"
                        disabled={startingSession || !selectedClientId || !selectedProjectId || !taskInput.trim()}
                      >
                        {startingSession ? (
                          <><span className="spinner-border spinner-border-sm me-2"></span>Starting...</>
                        ) : (
                          <><i className="bi bi-play-circle-fill me-2"></i>Start session</>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* RECENT SESSIONS TABLE */}
            <div className="card border-0 shadow-sm rounded-4 bg-white">
              <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
                <h6 className="fw-bold mb-0 text-dark">
                  <i className="bi bi-clock-history me-2 text-primary"></i>My Recent Work Sessions
                </h6>
                <span className="badge bg-light text-muted border">{recentSessions.length} Entries</span>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="ps-4">Date & Time</th>
                        <th>Client</th>
                        <th>Project</th>
                        <th>Task Description</th>
                        <th>Duration</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSessions.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-4 text-muted">
                            No work sessions recorded yet. Start your first session above!
                          </td>
                        </tr>
                      ) : (
                        recentSessions.map(s => (
                          <tr key={s.id}>
                            <td className="ps-4 text-nowrap">
                              <div className="fw-semibold small text-dark">
                                {new Date(s.start_time).toLocaleDateString()}
                              </div>
                              <small className="text-muted" style={{ fontSize: "11px" }}>
                                {new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </small>
                            </td>
                            <td>
                              <span className="badge bg-light text-dark border">
                                {s.client_name || "Client"}
                              </span>
                            </td>
                            <td className="fw-semibold small">{s.project_name || "Project"}</td>
                            <td className="small text-truncate" style={{ maxWidth: 220 }}>
                              {s.task_description}
                            </td>
                            <td>
                              <span className="badge bg-primary-subtle text-primary fw-bold font-monospace">
                                {s.duration_hours || 0} hrs
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${
                                s.status === "Approved" ? "bg-success text-white" :
                                s.status === "Running" ? "bg-warning text-dark" : "bg-info text-white"
                              }`}>
                                {s.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 2: TEAM LEAD HOURS SUMMARY (Image 2 Left)                           */}
      {/* ====================================================================== */}
      {activeTab === "team_hours" && (
        <div className="d-flex flex-column gap-4">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
              <div>
                <span className="badge bg-primary text-white mb-2">TEAM LEAD REPORT</span>
                <h4 className="fw-bold text-dark mb-1">Hours contributed per project</h4>
                <p className="text-muted small mb-0">
                  Per project — each project split by its staff members. Manage timesheet allocations and active team tracking.
                </p>
              </div>
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-outline-secondary btn-sm"
                  onClick={fetchTeamLeadSummary}
                  disabled={teamSummaryLoading}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>Refresh Data
                </button>
              </div>
            </div>
          </div>

          {/* ACTIVE TEAM SESSIONS TRACKER */}
          {activeTeamSessions.length > 0 && (
            <div className="card border-0 shadow-sm rounded-4 border-start border-4 border-warning bg-white p-4">
              <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <span className="spinner-grow spinner-grow-sm text-warning"></span>
                Currently Active Team Sessions ({activeTeamSessions.length})
              </h6>
              <div className="row g-3">
                {activeTeamSessions.map(ats => (
                  <div key={ats.id} className="col-md-6 col-lg-4">
                    <div className="p-3 rounded-3 bg-light border d-flex align-items-center gap-3">
                      <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: 40, height: 40 }}>
                        {ats.staff_name ? ats.staff_name.charAt(0) : "S"}
                      </div>
                      <div className="flex-grow-1 overflow-hidden">
                        <div className="fw-bold small text-truncate text-dark">{ats.staff_name}</div>
                        <div className="text-muted text-truncate" style={{ fontSize: "12px" }}>{ats.task_description}</div>
                        <span className="badge bg-warning-subtle text-warning border border-warning-subtle" style={{ fontSize: "10px" }}>
                          {ats.project_name}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROJECT STAFF ALLOCATION GRID (MATCHING USER'S IMAGE 2 LEFT) */}
          <div className="row g-4">
            {teamProjectsBreakdown.map((proj, pIdx) => {
              const bgColors = [
                { header: "#ecfdf5", text: "#065f46", border: "#a7f3d0" },
                { header: "#eff6ff", text: "#1e40af", border: "#bfdbfe" },
                { header: "#f5f3ff", text: "#5b21b6", border: "#ddd6fe" }
              ];
              const theme = bgColors[pIdx % bgColors.length];

              return (
                <div key={proj.projectId} className="col-lg-6 col-xl-6">
                  <div className="card border-0 shadow-sm rounded-4 h-100 bg-white overflow-hidden" style={{ border: `1px solid ${theme.border}` }}>
                    <div className="p-3 border-bottom d-flex justify-content-between align-items-center" style={{ backgroundColor: theme.header }}>
                      <div>
                        <span className="fw-bold small" style={{ color: theme.text }}>
                          {proj.projectCode}: {proj.projectName}
                        </span>
                        <div className="small text-muted" style={{ fontSize: "11px" }}>
                          Budget: {proj.budgetHours} hrs
                        </div>
                      </div>
                      <span className="badge rounded-pill fw-bold" style={{ backgroundColor: theme.text, color: "#fff" }}>
                        {proj.totalBurnedHours} hrs Total
                      </span>
                    </div>

                    <div className="card-body p-3">
                      <div className="row g-2">
                        {proj.staffList.length === 0 ? (
                          <div className="col-12 text-center py-4 text-muted small">
                            No recorded hours yet for this project.
                          </div>
                        ) : (
                          proj.staffList.map((st, sIdx) => {
                            const pct = proj.totalBurnedHours > 0 
                              ? Math.round((st.hours / proj.totalBurnedHours) * 100) 
                              : 0;
                            return (
                              <div key={sIdx} className="col-sm-6">
                                <div 
                                  className="p-3 rounded-3 h-100 d-flex flex-column justify-content-between"
                                  style={{ 
                                    backgroundColor: sIdx === 0 ? "#bbf7d0" : "#dbeafe",
                                    border: `1px solid ${sIdx === 0 ? "#86efac" : "#bfdbfe"}`
                                  }}
                                >
                                  <div>
                                    <div className="d-flex justify-content-between align-items-start">
                                      <div className="fw-bold text-dark text-truncate" style={{ fontSize: "13px" }}>
                                        {st.staffName.toUpperCase()}
                                      </div>
                                      <span className="badge bg-white text-dark shadow-xs" style={{ fontSize: "10px" }}>
                                        {pct}%
                                      </span>
                                    </div>
                                    <div className="text-secondary" style={{ fontSize: "11px" }}>
                                      {st.designation || "Staff Resource"}
                                    </div>
                                  </div>
                                  <div className="mt-3 pt-2 border-top border-white border-opacity-50 d-flex justify-content-between align-items-baseline">
                                    <span className="small text-muted" style={{ fontSize: "11px" }}>Burned Hours:</span>
                                    <span className="fs-6 fw-bold text-dark font-monospace">
                                      {st.hours} hrs
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

                    {/* TEAM LEAD TASK ASSIGNMENT SECTION */}
          <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
            <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
              <div>
                <h6 className="fw-bold mb-0 text-dark">
                  <i className="bi bi-list-task me-2 text-primary"></i>Team Task Assignments
                </h6>
                <small className="text-muted">Assign work packages and track deliverable status across your team.</small>
              </div>
              <button 
                type="button" 
                className="btn btn-primary btn-sm rounded-pill px-3 shadow-xs"
                onClick={() => {
                  if (teamProjectsBreakdown.length > 0) {
                    setTaskProjectId(String(teamProjectsBreakdown[0].projectId));
                    if (teamProjectsBreakdown[0].staffList.length > 0) {
                      setTaskAssignedTo(String(teamProjectsBreakdown[0].staffList[0].employeeId));
                    }
                  }
                  setShowAssignTaskModal(true);
                }}
              >
                <i className="bi bi-plus-circle-fill me-1.5"></i>+ Assign Task to Member
              </button>
            </div>

            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4">Task & Project</th>
                      <th>Assigned Member</th>
                      <th>Due Date</th>
                      <th>Est. Hours</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th className="pe-4 text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamLeadTasks.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4 text-muted">
                          No tasks assigned yet. Click "+ Assign Task to Member" above to assign work.
                        </td>
                      </tr>
                    ) : (
                      teamLeadTasks.map(t => (
                        <tr key={t.id}>
                          <td className="ps-4">
                            <div className="fw-bold text-dark">{t.task_name}</div>
                            <small className="text-muted">{t.project_name} ({t.project_code})</small>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              {t.profile_pic ? (
                                <img src={t.profile_pic} alt={t.employee_name} className="rounded-circle" style={{ width: 32, height: 32, objectFit: "cover" }} />
                              ) : (
                                <div className="rounded-circle bg-primary-subtle text-primary fw-bold d-flex align-items-center justify-content-center" style={{ width: 32, height: 32, fontSize: "12px" }}>
                                  {getInitials(t.employee_name)}
                                </div>
                              )}
                              <div>
                                <div className="fw-semibold small text-dark">{t.employee_name}</div>
                                <div className="text-muted" style={{ fontSize: "11px" }}>{t.designation || "Staff"}</div>
                              </div>
                            </div>
                          </td>
                          <td className="small text-muted">
                            {t.due_date ? new Date(t.due_date).toLocaleDateString() : "--"}
                          </td>
                          <td>
                            <span className="badge bg-light text-dark font-monospace border">
                              {t.estimated_hours}h
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${
                              t.priority === "High" ? "bg-danger-subtle text-danger" :
                              t.priority === "Medium" ? "bg-warning-subtle text-warning" : "bg-info-subtle text-info"
                            } border`}>
                              {t.priority}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${
                              t.status === "Completed" ? "bg-success text-white" :
                              t.status === "In Progress" ? "bg-info text-white" : "bg-secondary text-white"
                            }`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="pe-4 text-end">
                            {t.status !== "Completed" ? (
                              <button 
                                className="btn btn-outline-success btn-sm rounded-pill px-2.5 py-0.5"
                                style={{ fontSize: "11px" }}
                                onClick={() => handleUpdateTaskStatus(t.id, "Completed")}
                              >
                                Mark Done
                              </button>
                            ) : (
                              <span className="text-success small fw-semibold">
                                <i className="bi bi-check-circle-fill me-1"></i>Done
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* PENDING APPROVALS QUEUE */}
          <div className="card border-0 shadow-sm rounded-4 bg-white">
            <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
              <div>
                <h6 className="fw-bold mb-0 text-dark">
                  <i className="bi bi-patch-check me-2 text-primary"></i>Timesheet Approvals Queue
                </h6>
                <small className="text-muted">Review and sign off on completed member sessions.</small>
              </div>
              <span className="badge bg-warning-subtle text-warning border">{pendingApprovals.length} Pending</span>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4">Staff Member</th>
                      <th>Project</th>
                      <th>Task</th>
                      <th>Logged Hours</th>
                      <th>Submitted Date</th>
                      <th className="text-end pe-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingApprovals.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4 text-muted">
                          All submitted work sessions have been approved! No pending timesheets.
                        </td>
                      </tr>
                    ) : (
                      pendingApprovals.map(pa => (
                        <tr key={pa.id}>
                          <td className="ps-4">
                            <div className="fw-semibold small text-dark">{pa.staff_name}</div>
                            <small className="text-muted">{pa.client_name}</small>
                          </td>
                          <td className="small fw-semibold">{pa.project_name}</td>
                          <td className="small text-truncate" style={{ maxWidth: 220 }}>{pa.task_description}</td>
                          <td>
                            <span className="badge bg-primary-subtle text-primary font-monospace fw-bold">
                              {pa.duration_hours} hrs
                            </span>
                          </td>
                          <td className="small text-muted">
                            {new Date(pa.created_at).toLocaleDateString()}
                          </td>
                          <td className="text-end pe-4">
                            <button 
                              className="btn btn-success btn-sm rounded-pill px-3"
                              onClick={() => handleApproveSession(pa.id)}
                              disabled={approvingSessionId === pa.id}
                            >
                              {approvingSessionId === pa.id ? "Approving..." : "Approve Hours"}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 3: PROJECT MANAGER & ADMIN PROFIT/LOSS SUMMARY (Image 2 Right)     */}
      {/* ====================================================================== */}
      {activeTab === "pm_pnl" && (
        <div className="d-flex flex-column gap-4">
          {/* FORMULA HIGHLIGHT BANNER */}
          <div className="card border-0 shadow-sm rounded-4 text-white overflow-hidden" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)" }}>
            <div className="card-body p-4 p-md-5">
              <div className="row align-items-center gy-4">
                <div className="col-lg-8">
                  <span className="badge bg-success text-white mb-2 px-3 py-1.5 fw-bold">
                    BUDGET & PROFIT FORMULA
                  </span>
                  <h3 className="fw-bold mb-2">Project = 115 Days &rarr; 115 &times; 8 = 1,240 Hours</h3>
                  <p className="opacity-90 mb-0 fs-6">
                    <strong>Rule:</strong> Burned Hours ≤ 1,240 Hrs ➔ <span className="badge bg-success ms-1 me-2">PROFIT 🟢</span> 
                    Burned Hours &gt; 1,240 Hrs ➔ <span className="badge bg-danger ms-1">LOSS 🔴</span>
                  </p>
                </div>
                <div className="col-lg-4 text-lg-end">
                  <div className="p-3 rounded-3 bg-white bg-opacity-10 border border-white border-opacity-20 d-inline-block text-start">
                    <small className="opacity-75 d-block">Portfolio Budget Health</small>
                    <div className="fs-4 fw-bold font-monospace">
                      {pmSummary?.overallStatus === "Profit" ? "PROFITABLE (In-Budget)" : "DEFICIT (Overrun)"}
                    </div>
                    <small className="text-success fw-bold">
                      {pmSummary?.totalBurnedHours || 0} / {pmSummary?.totalBudgetHours || 3720} hrs
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* KPI METRIC CARDS */}
          <div className="row g-3">
            <div className="col-sm-6 col-xl-3">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <span className="text-muted small fw-semibold">Active Projects</span>
                    <h3 className="fw-bold text-dark mt-1 mb-0">{pmSummary?.totalProjects || 0}</h3>
                  </div>
                  <div className="p-2.5 rounded-3 bg-primary-subtle text-primary">
                    <i className="bi bi-briefcase fs-4"></i>
                  </div>
                </div>
                <small className="text-muted mt-2 d-block">Clients & Projects Tracked</small>
              </div>
            </div>

            <div className="col-sm-6 col-xl-3">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <span className="text-muted small fw-semibold">Total Budget Hours</span>
                    <h3 className="fw-bold text-dark mt-1 mb-0">{pmSummary?.totalBudgetHours || 0} hrs</h3>
                  </div>
                  <div className="p-2.5 rounded-3 bg-info-subtle text-info">
                    <i className="bi bi-clock-history fs-4"></i>
                  </div>
                </div>
                <small className="text-muted mt-2 d-block">115 days × 8h per project</small>
              </div>
            </div>

            <div className="col-sm-6 col-xl-3">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <span className="text-muted small fw-semibold">Burned / Logged Hours</span>
                    <h3 className="fw-bold text-dark mt-1 mb-0 font-monospace">{pmSummary?.totalBurnedHours || 0} hrs</h3>
                  </div>
                  <div className="p-2.5 rounded-3 bg-warning-subtle text-warning">
                    <i className="bi bi-fire fs-4"></i>
                  </div>
                </div>
                <div className="progress mt-2" style={{ height: 6 }}>
                  <div 
                    className={`progress-bar ${(pmSummary?.overallBurnPct || 0) > 100 ? "bg-danger" : "bg-success"}`}
                    style={{ width: `${Math.min(100, pmSummary?.overallBurnPct || 0)}%` }}
                  ></div>
                </div>
                <small className="text-muted mt-1 d-block">{pmSummary?.overallBurnPct || 0}% of total budget</small>
              </div>
            </div>

            <div className="col-sm-6 col-xl-3">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <span className="text-muted small fw-semibold">Portfolio Invoiced</span>
                    <h3 className="fw-bold text-dark mt-1 mb-0 font-monospace">${(pmSummary?.totalInvoicedAmount || 0).toLocaleString()}</h3>
                  </div>
                  <div className="p-2.5 rounded-3 bg-success-subtle text-success">
                    <i className="bi bi-cash-stack fs-4"></i>
                  </div>
                </div>
                <small className="text-success fw-bold mt-2 d-block">
                  Net Margin: ${(pmSummary?.netMargin || 0).toLocaleString()}
                </small>
              </div>
            </div>
          </div>

          {/* VISUAL ANALYTICS: MULTI-TIER DONUT / SUNBURST CHART (IMAGE 2 RIGHT) */}
          <div className="row g-4">
            <div className="col-lg-5">
              <div className="card border-0 shadow-sm rounded-4 bg-white h-100 p-4">
                <div className="mb-3">
                  <span className="badge bg-primary text-white mb-1">CLIENT DISTRIBUTION</span>
                  <h5 className="fw-bold text-dark mb-0">Working hours by client and project</h5>
                  <p className="text-muted small mb-0 mt-1">
                    Multi-tier visualization: Inner ring is the client, outer breakdown is the project.
                  </p>
                </div>

                <div className="d-flex justify-content-center align-items-center py-3">
                  <Chart 
                    options={donutOptions}
                    series={donutSeries}
                    type="donut"
                    width="100%"
                    height={320}
                  />
                </div>
              </div>
            </div>

            {/* CLIENT & PROJECT BREAKDOWN LEGEND LIST */}
            <div className="col-lg-7">
              <div className="card border-0 shadow-sm rounded-4 bg-white h-100 p-4">
                <h6 className="fw-bold text-dark mb-3">Client Breakdown & Invoicing Summary</h6>
                <div className="d-flex flex-column gap-3">
                  {clientDistribution.map((cd, idx) => (
                    <div key={idx} className="p-3 rounded-3 bg-light border">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge bg-primary text-white">{cd.clientCode}</span>
                          <span className="fw-bold text-dark">{cd.clientName}</span>
                        </div>
                        <span className="badge bg-dark font-monospace fs-6 px-3 py-1.5">
                          {cd.totalHours} hrs
                        </span>
                      </div>
                      
                      <div className="d-flex flex-column gap-2 mt-2 pt-2 border-top">
                        {cd.projects.map(cp => (
                          <div key={cp.projectId} className="d-flex justify-content-between align-items-center text-muted small ps-2">
                            <span><i className="bi bi-caret-right-fill text-primary me-1"></i>{cp.projectCode} - {cp.projectName}</span>
                            <div className="d-flex align-items-center gap-2">
                              <span className="font-monospace fw-semibold">{cp.hours} hrs</span>
                              <span className={`badge ${cp.isProfit ? "bg-success" : "bg-danger"}`}>
                                {cp.statusPnl}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* DETAILED PROJECT & PROFIT/LOSS PORTFOLIO TABLE */}
          <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
            <div className="card-header bg-white border-bottom p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
              <div>
                <h5 className="fw-bold mb-0 text-dark">Project Portfolio & Profit/Loss Evaluation</h5>
                <small className="text-muted">Formula: 115 days × 8h = 1,240 hrs. Comparison against total logged hours.</small>
              </div>
              <div className="d-flex gap-2">
                <select 
                  className="form-select form-select-sm"
                  value={filterPnlStatus}
                  onChange={(e) => setFilterPnlStatus(e.target.value)}
                  style={{ width: 160 }}
                >
                  <option value="all">All Projects</option>
                  <option value="Profit">Profit Only 🟢</option>
                  <option value="Loss">Loss Only 🔴</option>
                </select>
              </div>
            </div>

            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4">Project & Client</th>
                      <th>Budget (Days / Hrs)</th>
                      <th>Burned Hours</th>
                      <th>Remaining Hrs</th>
                      <th>Burn Progress</th>
                      <th>Profit / Loss Status</th>
                      <th>Invoiced Amount</th>
                      <th className="pe-4 text-end">Net Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPmProjects.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-4 text-muted">
                          No projects matching criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredPmProjects.map(p => {
                        const isProfit = p.is_profit;
                        return (
                          <tr key={p.id}>
                            <td className="ps-4">
                              <div className="fw-bold text-dark">{p.project_name}</div>
                              <div className="d-flex align-items-center gap-2 mt-1">
                                <span className="badge bg-light text-secondary border">{p.project_code}</span>
                                <small className="text-muted">{p.client_name || "Internal"}</small>
                              </div>
                            </td>
                            <td>
                              <div className="fw-semibold small">{p.budget_days} Days</div>
                              <small className="text-muted font-monospace">{p.budget_hours} hrs</small>
                            </td>
                            <td>
                              <span className="fw-bold font-monospace fs-6 text-dark">
                                {p.burned_hours} hrs
                              </span>
                            </td>
                            <td>
                              <span className={`fw-bold font-monospace ${p.remaining_hours >= 0 ? "text-success" : "text-danger"}`}>
                                {p.remaining_hours >= 0 ? `+${p.remaining_hours}` : p.remaining_hours} hrs
                              </span>
                            </td>
                            <td style={{ minWidth: 140 }}>
                              <div className="d-flex justify-content-between small text-muted mb-1 font-monospace">
                                <span>{p.burn_rate_pct}%</span>
                              </div>
                              <div className="progress" style={{ height: 6 }}>
                                <div 
                                  className={`progress-bar ${p.burn_rate_pct > 100 ? "bg-danger" : "bg-success"}`}
                                  style={{ width: `${Math.min(100, p.burn_rate_pct)}%` }}
                                ></div>
                              </div>
                            </td>
                            <td>
                              {isProfit ? (
                                <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 fw-bold d-inline-flex align-items-center gap-1.5">
                                  <i className="bi bi-arrow-up-right-circle-fill"></i> PROFIT
                                </span>
                              ) : (
                                <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-2 fw-bold d-inline-flex align-items-center gap-1.5">
                                  <i className="bi bi-arrow-down-right-circle-fill"></i> LOSS
                                </span>
                              )}
                            </td>
                            <td>
                              <div className="fw-semibold font-monospace small">${p.invoiced_amount.toLocaleString()}</div>
                              <small className="text-muted">Rate: ${p.hourly_rate}/h</small>
                            </td>
                            <td className="pe-4 text-end">
                              <span className={`fw-bold font-monospace ${p.margin_amount >= 0 ? "text-success" : "text-danger"}`}>
                                ${p.margin_amount.toLocaleString()}
                              </span>
                              <div className="text-muted" style={{ fontSize: "11px" }}>
                                {p.profit_margin_pct}% Margin
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 4: ORIGINAL PROJECT TEAMS & MEMBERS ROSTER (WITH AVATARS)          */}
      {/* ====================================================================== */}
      {activeTab === "roster" && (
        <div>
          {rosterTeams.length === 0 ? (
            <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
              <EmptyState title="No Project Teams Found" description="You are not currently assigned to any active project team." />
            </div>
          ) : (
            <div className="row g-4">
              <div className="col-lg-4">
                <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
                  <div className="p-3 border-bottom bg-light fw-bold text-dark">
                    Your Assigned Teams
                  </div>
                  <div className="list-group list-group-flush">
                    {rosterTeams.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        className={`list-group-item list-group-item-action p-3 d-flex justify-content-between align-items-center ${t.id === activeRosterTeam?.id ? "active" : ""}`}
                        onClick={() => setSelectedRosterTeamId(t.id)}
                      >
                        <div>
                          <div className="fw-bold">{t.project_name}</div>
                          <small className={t.id === activeRosterTeam?.id ? "text-white-50" : "text-muted"}>
                            Code: {t.project_code} • Role: {t.my_role || "Member"}
                          </small>
                        </div>
                        <span className="badge bg-light text-dark rounded-pill">
                          {t.members?.length || 0}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="col-lg-8">
                <div className="card border-0 shadow-sm rounded-4 bg-white p-4">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                    <div>
                      <h5 className="fw-bold mb-1 text-dark">{activeRosterTeam?.project_name}</h5>
                      <span className="badge bg-primary text-white me-2">Lead: {activeRosterTeam?.team_lead_name || "Unassigned"}</span>
                      <small className="text-muted">{activeRosterTeam?.description || "Active production team"}</small>
                    </div>
                    <input 
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Search member..."
                      value={searchMember}
                      onChange={(e) => setSearchMember(e.target.value)}
                      style={{ maxWidth: 220 }}
                    />
                  </div>

                  <div className="row g-3">
                    {filteredRosterMembers.map(m => {
                      const initials = getInitials(m.employee_name);
                      const bg = getAvatarBg(m.employee_name);
                      return (
                        <div key={m.mapping_id || m.employee_id} className="col-sm-6">
                          <div className="p-3 rounded-3 border bg-light d-flex align-items-center gap-3">
                            {m.profile_pic ? (
                              <img 
                                src={m.profile_pic} 
                                alt={m.employee_name} 
                                className="rounded-circle shadow-xs" 
                                style={{ width: 44, height: 44, objectFit: "cover" }} 
                              />
                            ) : (
                              <div 
                                className="rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-xs"
                                style={{ width: 44, height: 44, backgroundColor: bg.bg, color: bg.text }}
                              >
                                {initials}
                              </div>
                            )}
                            <div className="overflow-hidden">
                              <div className="fw-bold text-dark text-truncate">{m.employee_name}</div>
                              <div className="text-muted small text-truncate">{m.designation || "Software Engineer"}</div>
                              <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: "10px" }}>
                                {m.role_in_team || "Member"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

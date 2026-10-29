import React, { useState, useEffect } from "react";
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
  const user = currentUser || (employeeProfile?.user_id ? { id: employeeProfile.user_id, email: employeeProfile.email } : null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [searchMember, setSearchMember] = useState("");

  const fetchMyTeams = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/employee/my-teams/${user.id}`);
      if (!res.ok) {
        throw new Error(`Failed to load teams (status: ${res.status})`);
      }
      const data = await res.json();
      const teamList = data.teams || [];
      setTeams(teamList);
      if (teamList.length > 0 && !selectedTeamId) {
        setSelectedTeamId(teamList[0].id);
      }
    } catch (err) {
      console.error("Error fetching my teams:", err);
      setError("Unable to load project teams. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTeams();
  }, [user?.id]);

  const activeTeam = teams.find((t) => t.id === selectedTeamId) || teams[0];

  const filteredMembers = (activeTeam?.members || []).filter((m) => {
    if (!searchMember.trim()) return true;
    const q = searchMember.toLowerCase();
    const name = (m.employee_name || "").toLowerCase();
    const des = (m.designation || "").toLowerCase();
    const dept = (m.department || "").toLowerCase();
    const code = (m.employee_code || "").toLowerCase();
    return name.includes(q) || des.includes(q) || dept.includes(q) || code.includes(q);
  });

  return (
    <div className="container-fluid py-4" style={{ maxWidth: "1400px" }}>
      {/* Header section */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h2 className="h4 fw-bold mb-1 text-dark d-flex align-items-center gap-2">
            <i className="bi bi-people-fill text-primary"></i>
            My Project Teams
          </h2>
          <p className="text-muted small mb-0">
            View your assigned project teams, team leads, and project collaborators
          </p>
        </div>
        <button
          onClick={fetchMyTeams}
          disabled={loading}
          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 shadow-sm"
          title="Refresh Teams"
        >
          <i className={`bi bi-arrow-clockwise ${loading ? "spin" : ""}`}></i>
          <span>Refresh</span>
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center my-4">
          <div className="spinner-border text-primary mx-auto mb-3" role="status"></div>
          <p className="text-muted mb-0 fw-medium">Loading your project teams...</p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="alert alert-danger d-flex align-items-center rounded-4 shadow-sm" role="alert">
          <i className="bi bi-exclamation-triangle-fill fs-5 me-2"></i>
          <div>{error}</div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && teams.length === 0 && (
        <div className="card border-0 shadow-sm rounded-4 p-4">
          <EmptyState
            icon="bi-people"
            title="No Project Teams Assigned"
            message="You are not currently assigned to any project team. Once an administrator assigns you to a project team, details and colleagues will appear here."
          />
        </div>
      )}

      {/* Main Content when teams exist */}
      {!loading && !error && teams.length > 0 && activeTeam && (
        <div>
          {/* Multiple Teams Tabs (if more than 1 team) */}
          {teams.length > 1 && (
            <div className="d-flex gap-2 overflow-auto pb-2 mb-3">
              {teams.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTeamId(t.id);
                    setSearchMember("");
                  }}
                  className={`btn btn-sm px-3 py-2 rounded-pill fw-semibold transition-all ${
                    activeTeam.id === t.id
                      ? "btn-primary shadow-sm"
                      : "btn-outline-secondary bg-white"
                  }`}
                >
                  <i className="bi bi-diagram-3-fill me-1"></i>
                  {t.project_name}
                  <span className="badge bg-white text-dark ms-2 opacity-75">
                    {t.my_role === "Lead" ? "Lead" : "Member"}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Project Team Card Banner */}
          <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
            <div
              className="p-4"
              style={{
                background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                color: "#ffffff"
              }}
            >
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                <div>
                  <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                    <span className="badge bg-primary px-3 py-1 rounded-pill fw-bold">
                      {activeTeam.project_code || "PROJECT"}
                    </span>
                    <span
                      className={`badge px-3 py-1 rounded-pill fw-medium ${
                        activeTeam.status === "Active"
                          ? "bg-success-subtle text-success border border-success-subtle"
                          : "bg-secondary-subtle text-secondary"
                      }`}
                    >
                      ● {activeTeam.status || "Active"}
                    </span>
                    {activeTeam.my_role === "Lead" ? (
                      <span className="badge bg-warning text-dark px-3 py-1 rounded-pill fw-bold shadow-sm">
                        <i className="bi bi-star-fill me-1"></i> You are Team Lead
                      </span>
                    ) : (
                      <span className="badge bg-info-subtle text-info border border-info-subtle px-3 py-1 rounded-pill fw-medium">
                        <i className="bi bi-person-check-fill me-1"></i> Team Member
                      </span>
                    )}
                  </div>
                  <h3 className="h3 fw-bold mb-1 text-white">{activeTeam.project_name}</h3>
                  <p className="text-light text-opacity-75 mb-0" style={{ maxWidth: "800px" }}>
                    {activeTeam.description || "No project description provided."}
                  </p>
                </div>

                <div className="d-flex gap-3 text-center">
                  <div className="bg-white bg-opacity-10 rounded-3 px-3 py-2 border border-white border-opacity-10">
                    <div className="fs-4 fw-bold text-white">{activeTeam.members?.length || 0}</div>
                    <div className="text-white text-opacity-75 small">Total Members</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Details Bar */}
            <div className="bg-light px-4 py-3 border-top d-flex flex-wrap justify-content-between align-items-center gap-2 text-muted small">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-shield-check text-primary"></i>
                <span>Managed by Organization Administration</span>
              </div>
              <div>
                <span>Team ID: #{activeTeam.id}</span>
              </div>
            </div>
          </div>

          <div className="row g-4">
            {/* Left Column: Team Lead Highlight Card */}
            <div className="col-lg-4 col-md-5">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-header bg-white border-0 pt-4 px-4 pb-2">
                  <div className="d-flex align-items-center justify-content-between">
                    <h5 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                      <i className="bi bi-star-fill text-warning"></i>
                      Project Team Lead
                    </h5>
                    {activeTeam.team_lead_id === activeTeam.members?.find(m => m.is_current_user)?.employee_id && (
                      <span className="badge bg-warning text-dark rounded-pill">You</span>
                    )}
                  </div>
                </div>

                <div className="card-body px-4 pb-4">
                  {activeTeam.team_lead_name ? (
                    <div className="text-center p-3 rounded-4 bg-light border border-light-subtle">
                      {/* Avatar */}
                      <div
                        className="mx-auto rounded-circle d-flex align-items-center justify-content-center shadow-sm mb-3"
                        style={{
                          width: "72px",
                          height: "72px",
                          backgroundColor: "#fef3c7",
                          color: "#b45309",
                          fontSize: "1.5rem",
                          fontWeight: 700,
                          border: "3px solid #fde68a"
                        }}
                      >
                        {getInitials(activeTeam.team_lead_name)}
                      </div>

                      <h5 className="fw-bold text-dark mb-1">{activeTeam.team_lead_name}</h5>
                      <div className="badge bg-secondary-subtle text-secondary px-2 py-1 mb-2">
                        {activeTeam.team_lead_code || "LEAD"}
                      </div>

                      <div className="text-muted small mb-3">
                        <div className="fw-medium text-dark">{activeTeam.team_lead_designation || "Project Lead"}</div>
                      </div>

                      <hr className="my-3 opacity-25" />

                      <div className="d-flex flex-column gap-2 text-start small">
                        {activeTeam.team_lead_email && (
                          <div className="d-flex align-items-center gap-2 text-muted">
                            <i className="bi bi-envelope text-primary"></i>
                            <a
                              href={`mailto:${activeTeam.team_lead_email}`}
                              className="text-decoration-none text-dark text-truncate"
                              title={activeTeam.team_lead_email}
                            >
                              {activeTeam.team_lead_email}
                            </a>
                          </div>
                        )}
                        <div className="d-flex align-items-center gap-2 text-muted">
                          <i className="bi bi-briefcase text-secondary"></i>
                          <span>Role: Project Leadership & Delivery</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted py-4">
                      <i className="bi bi-person-x fs-2 d-block mb-2 text-secondary"></i>
                      No Team Lead assigned yet
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Teammates Grid */}
            <div className="col-lg-8 col-md-7">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-header bg-white border-0 pt-4 px-4 pb-2">
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                    <h5 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                      <i className="bi bi-people text-primary"></i>
                      Project Team Members
                      <span className="badge bg-primary-subtle text-primary rounded-pill fs-6 px-2 py-1">
                        {activeTeam.members?.length || 0}
                      </span>
                    </h5>
                  </div>

                  {/* Search box */}
                  <div className="input-group input-group-sm mt-3">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-search text-muted"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control bg-light border-start-0"
                      placeholder="Search teammates by name, code, designation..."
                      value={searchMember}
                      onChange={(e) => setSearchMember(e.target.value)}
                    />
                    {searchMember && (
                      <button
                        className="btn btn-outline-secondary border-start-0 bg-light"
                        onClick={() => setSearchMember("")}
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    )}
                  </div>
                </div>

                <div className="card-body px-4 pb-4">
                  {filteredMembers.length === 0 ? (
                    <div className="text-center text-muted py-5">
                      <i className="bi bi-search fs-2 d-block mb-2 text-secondary"></i>
                      No members matched your search criteria.
                    </div>
                  ) : (
                    <div className="row g-3">
                      {filteredMembers.map((member) => {
                        const avatarStyle = getAvatarBg(member.employee_name);
                        const isLead = member.role_in_team === "Lead" || member.employee_id === activeTeam.team_lead_id;

                        return (
                          <div key={member.employee_id} className="col-xl-6 col-12">
                            <div
                              className={`p-3 rounded-4 border transition-all h-100 position-relative ${
                                member.is_current_user
                                  ? "border-primary bg-primary-subtle bg-opacity-10 shadow-sm"
                                  : "border-light-subtle bg-white hover-shadow"
                              }`}
                              style={{
                                borderLeft: member.is_current_user ? "4px solid #3b82f6" : undefined
                              }}
                            >
                              <div className="d-flex align-items-start gap-3">
                                {/* Member Avatar */}
                                <div
                                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-bold shadow-sm"
                                  style={{
                                    width: "48px",
                                    height: "48px",
                                    backgroundColor: avatarStyle.bg,
                                    color: avatarStyle.text,
                                    fontSize: "1.1rem"
                                  }}
                                >
                                  {getInitials(member.employee_name)}
                                </div>

                                {/* Member details */}
                                <div className="flex-grow-1 min-w-0">
                                  <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                                    <div className="fw-bold text-dark text-truncate" title={member.employee_name}>
                                      {member.employee_name}
                                      {member.is_current_user && (
                                        <span className="badge bg-primary text-white rounded-pill ms-2 px-2 py-0 small fw-bold">
                                          You
                                        </span>
                                      )}
                                    </div>
                                    {isLead ? (
                                      <span className="badge bg-warning text-dark rounded-pill px-2 py-0 small flex-shrink-0">
                                        <i className="bi bi-star-fill me-1"></i>Lead
                                      </span>
                                    ) : (
                                      <span className="badge bg-secondary-subtle text-secondary rounded-pill px-2 py-0 small flex-shrink-0">
                                        Member
                                      </span>
                                    )}
                                  </div>

                                  <div className="text-muted small text-truncate mb-1">
                                    {member.designation || "Team Member"}
                                    {member.department ? ` · ${member.department}` : ""}
                                  </div>

                                  <div className="d-flex align-items-center gap-2 text-muted small">
                                    <span className="badge bg-light text-secondary border px-2 py-0">
                                      {member.employee_code || "EMP"}
                                    </span>
                                    {member.email && (
                                      <a
                                        href={`mailto:${member.email}`}
                                        className="text-decoration-none text-muted text-truncate"
                                        title={member.email}
                                      >
                                        <i className="bi bi-envelope me-1"></i>
                                        {member.email}
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

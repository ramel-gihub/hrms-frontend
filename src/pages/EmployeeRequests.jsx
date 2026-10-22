import React, { useEffect, useMemo, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "https://hrms-backend-f2ef.onrender.com";

const requestCategories = [
  "Attendance Correction",
  "Certificate Request",
  "Leave Request",
  "Work From Home (WFH)",
  // "Expenses & Claims",
  "Payroll Request",
  "Personal Information",
  "Asset Request",
  "Access & Accounts",
  "Employment Details",
  "General HR Request"
];

const quickActions = [
  {
    category: "Attendance Correction",
    title: "Attendance Correction",
    description: "Correct missed punches or attendance records",
    icon: "bi-clock-history",
    color: "purple"
  },
  {
    category: "Certificate Request",
    title: "Certificate Request",
    description: "Request employment and HR certificates",
    icon: "bi-patch-check",
    color: "blue"
  },
  {
    category: "Leave Request",
    title: "Leave Related",
    description: "Raise leave corrections or related requests",
    icon: "bi-calendar2-check",
    color: "green"
  },
  {
    category: "Work From Home (WFH)",
    title: "Work From Home",
    description: "Apply for remote work or work from home days",
    icon: "bi-house-door",
    color: "purple"
  },
  /*
  {
    category: "Expenses & Claims",
    title: "Expenses & Claims",
    description: "Submit travel, bills or expense claims",
    icon: "bi-wallet2",
    color: "orange"
  },
  */
  {
    category: "Payroll Request",
    title: "Payroll & Salary",
    description: "Salary slips, payroll and payment queries",
    icon: "bi-cash-stack",
    color: "orange"
  },
  {
    category: "Personal Information",
    title: "Personal Information",
    description: "Update or correct employee information",
    icon: "bi-person-lines-fill",
    color: "pink"
  },
  {
    category: "Asset Request",
    title: "Asset Related",
    description: "Request, replace or report company assets",
    icon: "bi-laptop",
    color: "blue"
  }
];

const statusClass = (status) => {
  if (status === "In Review") return "review";
  if (status === "Settled") return "completed";
  return status ? status.toLowerCase() : "pending";
};

const statusIcon = (status) => {
  switch (status) {
    case "Pending":
      return "bi-hourglass-split";
    case "In Review":
      return "bi-arrow-repeat";
    case "Approved":
      return "bi-check2";
    case "Completed":
    case "Settled":
      return "bi-check2-circle";
    default:
      return "bi-x-circle";
  }
};

const categoryStyle = (category) => {
  const action = quickActions.find((item) => item.category === category);
  if (action) return { color: action.color, icon: action.icon };
  if (category === "Work From Home (WFH)" || category === "WFH Request" || category === "WFH") {
    return { color: "purple", icon: "bi-house-door" };
  }
  if (category === "Expenses & Claims" || category === "Expenses") {
    return { color: "orange", icon: "bi-wallet2" };
  }
  if (category === "Access & Accounts") {
    return { color: "purple", icon: "bi-shield-lock" };
  }
  if (category === "Employment Details") {
    return { color: "green", icon: "bi-briefcase" };
  }
  return { color: "pink", icon: "bi-chat-square-text" };
};

const emptyForm = {
  category: "",
  subject: "",
  priority: "Normal",
  response: "Email",
  description: "",
  assetType: "",
  preferredModel: "",
  dateNeeded: "",
  workLocation: "",
  additionalRequirements: "",
  leaveTypeId: "",
  approverId: "",
  startDate: "",
  endDate: "",
  isHalfDay: false,
  halfDayPeriod: "First Half",
  expenseCategory: "Travel & Cab",
  claimAmount: "",
  merchantName: "",
  expenseDate: new Date().toISOString().split("T")[0],
  wfhContact: "" 
};

const mapRequest = (request) => {
  const style = categoryStyle(request.category);
  return {
    ...request,
    id: request.request_code || String(request.id),
    date: request.request_date || new Date(request.created_at).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }),
    submitted: `Submitted ${request.request_date || ""}`.trim(),
    response: request.preferred_response || "Portal Notification",
    assignedTo: request.assigned_to || (request.source_type === "expense" ? "Finance / Accounts" : "Pending assignment"),
    attachment: request.attachment_name || request.receipt_filename || "",
    receipt_url: request.receipt_url || "",
    receipt_filename: request.receipt_filename || "",
    claim_amount: request.claim_amount,
    expense_category: request.expense_category,
    merchant_name: request.merchant_name,
    expense_date: request.expense_date,
    icon: style.icon,
    color: style.color
  };
};

export default function EmployeeRequests({ employeeProfile, currentUser }) {
  const profile = employeeProfile || {};
  const userId = currentUser?.id || profile.user_id;
  const firstName = profile.first_name || currentUser?.first_name || "Employee";
  const lastName = profile.last_name || currentUser?.last_name || "Name";
  const employeeName = `${firstName} ${lastName}`.trim();
  const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();

  const [requests, setRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [approvers, setApprovers] = useState([]);
  const [requestStats, setRequestStats] = useState({
    average_resolution_days: null,
    completed_asset_requests: 0
  });
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [requestError, setRequestError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const requestModalRef = useRef(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showContactPanel, setShowContactPanel] = useState(false);
  const [showContactSuccess, setShowContactSuccess] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [attachment, setAttachment] = useState(null);
  const [fileError, setFileError] = useState("");
  const [contactForm, setContactForm] = useState({ subject: "", message: "" });
  const [toast, setToast] = useState("");
  const pageSize = 5;

  const loadRequests = async (signal, showLoading = false) => {
    if (!userId) {
      setRequestError("Unable to identify your employee account.");
      setLoadingRequests(false);
      return;
    }
    if (showLoading) setLoadingRequests(true);
    try {
      const response = await fetch(`${API_BASE}/api/employee-requests/${userId}`, { signal });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load employee requests.");
      setRequests((result.requests || []).map(mapRequest));
      setLeaveTypes(result.leaveTypes || []);
      setApprovers(result.approvers || []);
      setRequestStats(result.stats || { average_resolution_days: null, completed_asset_requests: 0 });
      setRequestError("");
    } catch (error) {
      if (error.name !== "AbortError") {
        setRequestError(error.message || "Unable to load employee requests.");
      }
    } finally {
      if (!signal?.aborted && showLoading) setLoadingRequests(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const refreshRequests = () => {
      if (document.visibilityState === "visible") {
        loadRequests(controller.signal);
      }
    };
    loadRequests(controller.signal, true);
    const interval = window.setInterval(refreshRequests, 15000);
    window.addEventListener("focus", refreshRequests);
    document.addEventListener("visibilitychange", refreshRequests);
    return () => {
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshRequests);
      document.removeEventListener("visibilitychange", refreshRequests);
    };
  }, [userId]);

  useEffect(() => {
    if (!selectedRequest) return;
    const latestRequest = requests.find((request) => request.id === selectedRequest.id);
    if (latestRequest && latestRequest.status !== selectedRequest.status) {
      setSelectedRequest(latestRequest);
    }
  }, [requests, selectedRequest]);

  useEffect(() => {
    if (!selectedRequest && !showContactPanel) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setSelectedRequest(null);
        setShowContactPanel(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedRequest, showContactPanel]);

  useEffect(() => {
    const modalElement = requestModalRef.current;
    if (!modalElement) return undefined;
    const resetAttachment = () => {
      setAttachment(null);
      setFileError("");
    };
    modalElement.addEventListener("hidden.bs.modal", resetAttachment);
    return () => modalElement.removeEventListener("hidden.bs.modal", resetAttachment);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const counts = useMemo(
    () => ({
      pending: requests.filter((request) => request.status === "Pending").length,
      review: requests.filter((request) => request.status === "In Review").length,
      completed: requests.filter((request) => request.status === "Completed").length,
      rejected: requests.filter((request) => request.status === "Rejected").length
    }),
    [requests]
  );

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesSearch =
        !query ||
        [request.id, request.subject, request.category, request.description]
          .some((value) => value.toLowerCase().includes(query));
      const matchesStatus =
        statusFilter === "all" || statusClass(request.status) === statusFilter;
      const matchesCategory =
        categoryFilter === "all" || request.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [requests, search, statusFilter, categoryFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleRequests = filteredRequests.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const firstVisible = filteredRequests.length ? (currentPage - 1) * pageSize + 1 : 0;
  const lastVisible = Math.min(currentPage * pageSize, filteredRequests.length);
  const sortedQuickActions = useMemo(() => {
    const usage = new Map();
    requests.forEach((request) => {
      const current = usage.get(request.category) || { count: 0, latest: 0 };
      current.count += 1;
      const createdAt = new Date(request.created_at).getTime();
      current.latest = Math.max(current.latest, Number.isNaN(createdAt) ? 0 : createdAt);
      usage.set(request.category, current);
    });

    return quickActions
      .map((action, index) => ({
        ...action,
        originalIndex: index,
        usage: usage.get(action.category) || { count: 0, latest: 0 }
      }))
      .sort((first, second) =>
        second.usage.count - first.usage.count ||
        second.usage.latest - first.usage.latest ||
        first.originalIndex - second.originalIndex
      );
  }, [requests]);

  const openRequestModal = (category = "") => {
    setForm({ ...emptyForm, category: requestCategories.includes(category) ? category : "" });
    setAttachment(null);
    setFileError("");
    setFormError("");
    if (requestModalRef.current) {
      window.bootstrap.Modal.getOrCreateInstance(requestModalRef.current).show();
    }
  };

  const closeRequestModal = () => {
    if (requestModalRef.current) {
      window.bootstrap.Modal.getInstance(requestModalRef.current)?.hide();
    }
    setAttachment(null);
    setFileError("");
    setFormError("");
  };

  const submitEmployeeRequest = async (payload) => {
    const response = await fetch(`${API_BASE}/api/employee-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...payload })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to submit employee request.");
    const requestDate = new Date(result.request.created_at).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
    const createdRequest = {
      ...payload,
      ...result.request,
      category: payload.category,
      subject: payload.subject,
      description: payload.description,
      priority: payload.priority || "Normal",
      preferred_response: payload.preferredResponse || "Portal Notification",
      attachment_name: payload.attachmentName || "",
      status: result.request.status || "Pending",
      request_date: requestDate
    };
    setRequests((currentRequests) => [
      mapRequest(createdRequest),
      ...currentRequests.filter((request) => request.id !== createdRequest.request_code)
    ]);
    setSearch("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setPage(1);
    setRequestError("");
    void loadRequests();
    return result.request;
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!form.category || !form.subject.trim() || !form.description.trim()) {
      setFormError("Complete all required fields before submitting.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const result = await submitEmployeeRequest({
        category: form.category,
        subject: form.subject.trim(),
        description: form.description.trim(),
        priority: form.priority,
        preferredResponse: form.response,
        attachmentName: attachment?.name || null,
        ...(form.category === "Asset Request" && {
          assetType: form.assetType,
          preferredModel: form.preferredModel,
          dateNeeded: form.dateNeeded || null,
          workLocation: form.workLocation,
          additionalRequirements: form.additionalRequirements
        }),
        ...(form.category === "Leave Request" && {
          leaveTypeId: form.leaveTypeId,
          approverId: form.approverId,
          startDate: form.startDate,
          endDate: form.isHalfDay ? form.startDate : form.endDate,
          isHalfDay: form.isHalfDay,
          halfDayPeriod: form.halfDayPeriod || "First Half"
        }),
        ...(form.category === "Work From Home (WFH)" && {
          startDate: form.startDate,
          endDate: form.endDate || form.startDate,
          wfhContact: form.wfhContact || null
        }),
        ...(form.category === "Expenses & Claims" && {
          claimAmount: form.claimAmount,
          expenseCategory: form.expenseCategory,
          merchantName: form.merchantName,
          expenseDate: form.expenseDate
        })
      });
      setForm(emptyForm);
      closeRequestModal();
      setToast(`Request ${result.request_code} submitted successfully.`);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAttachmentChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (file && file.size > 500 * 1024) {
      setAttachment(null);
      setFileError("File size exceeds 500 KB limit. Please select a smaller file.");
      event.target.value = "";
      return;
    }
    setAttachment(file);
    setFileError("");
  };

  const handleExport = () => {
    const columns = ["Request ID", "Category", "Subject", "Date", "Priority", "Status"];
    const escapeCsv = (value) => `"${String(value).replace(/"/g, '""')}"`;
    const csv = [
      columns.map(escapeCsv).join(","),
      ...filteredRequests.map((request) =>
        [request.id, request.category, request.subject, request.date, request.priority, request.status]
          .map(escapeCsv)
          .join(",")
      )
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "employee-requests.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleContactSubmit = async (event) => {
    event.preventDefault();
    if (!contactForm.subject.trim() || !contactForm.message.trim()) return;
    try {
      await submitEmployeeRequest({
        category: "General HR Request",
        subject: contactForm.subject.trim(),
        description: contactForm.message.trim(),
        priority: "Urgent",
        preferredResponse: "Email"
      });
      setContactForm({ subject: "", message: "" });
      setShowContactPanel(false);
      setShowContactSuccess(true);
      window.setTimeout(() => setShowContactSuccess(false), 4500);
    } catch (error) {
      setRequestError(error.message);
    }
  };

  const summaryCards = [
    { label: "Total Requests", value: requests.length, note: "All requests raised", color: "purple", icon: "bi-send" },
    { label: "Pending", value: counts.pending, note: "Awaiting action", color: "orange", icon: "bi-hourglass-split" },
    { label: "In Review", value: counts.review, note: "Currently being reviewed", color: "blue", icon: "bi-arrow-repeat" },
    { label: "Completed", value: counts.completed, note: "Successfully resolved", color: "green", icon: "bi-check2-circle" },
    { label: "Rejected", value: counts.rejected, note: "Requests not approved", color: "red", icon: "bi-x-circle" }
  ];
  const averageResolutionDays = requestStats.average_resolution_days;

  return (
    <main className="dashboard-wrapper employee-requests-page">
      <div className="dashboard-container">
        <div className="px-0 px-md-5 employee-dashboard">
          <div className="employee-requests-page">
            <header className="requests-page-header">
              <div>
                <h1>Employee Requests</h1>
                <p>
                  Raise HR requests, track their progress, and view your complete
                  request history from one place.
                </p>
              </div>
              <button
                className="requests-primary-btn"
                type="button"
                onClick={() => openRequestModal()}
              >
                <i className="bi bi-plus-lg" aria-hidden="true"></i>
                Raise a Request
              </button>
            </header>

            <section className="esc-employee-bar" aria-label="Employee profile">
              <div className="esc-employee-main">
                <div className="esc-avatar overflow-hidden">
                  {(employeeProfile?.profile_pic || employeeProfile?.avatar_url || profile?.profile_pic) ? (
                    <img
                      src={/^https?:\/\//i.test(employeeProfile?.profile_pic || employeeProfile?.avatar_url || profile?.profile_pic)
                        ? (employeeProfile?.profile_pic || employeeProfile?.avatar_url || profile?.profile_pic)
                        : `${import.meta.env.VITE_API_URL || 'https://hrms-backend-f2ef.onrender.com'}/${(employeeProfile?.profile_pic || employeeProfile?.avatar_url || profile?.profile_pic).replace(/^\/+/, '')}`}
                      alt={employeeName}
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "17px" }}
                    />
                  ) : (
                    initials || "EMP"
                  )}
                </div>
                <div className="esc-employee-info">
                  <div className="esc-name-row">
                    <h3>{employeeName}</h3>
                    <span className="esc-status-badge"><span></span>Active</span>
                  </div>
                  <p>{profile.designation || "Senior Software Engineer"}</p>
                  <div className="esc-employee-meta">
                    <span><i className="bi bi-diagram-3" aria-hidden="true"></i>{profile.department || "Engineering"}</span>
                    <span><i className="bi bi-code-slash" aria-hidden="true"></i>{profile.team || "Backend"}</span>
                    <span><i className="bi bi-person-badge" aria-hidden="true"></i>{profile.employee_code || "EMP-1360"}</span>
                  </div>
                </div>
              </div>
              <div className="esc-employee-side">
                <span className="esc-side-label">Profile Area</span>
                <strong>Employee Requests</strong>
              </div>
            </section>

            <section className="requests-summary-grid" aria-label="Request summary">
              {summaryCards.map((card) => (
                <article className="request-summary-card" key={card.label}>
                  <div className={`request-summary-icon ${card.color}`}>
                    <i className={`bi ${card.icon}`} aria-hidden="true"></i>
                  </div>
                  <div>
                    <span>{card.label}</span>
                    <strong>{card.value}</strong>
                    <small>{card.note}</small>
                  </div>
                </article>
              ))}
            </section>

            <div className="requests-main-layout">
              <div className="requests-main-column">
                <section className="requests-card">
                  <div className="requests-card-header">
                    <div>
                      <span className="requests-section-label">QUICK ACTIONS</span>
                      <h2>Frequently Requested</h2>
                      <p>Start a request using one of the commonly used HR services.</p>
                    </div>
                  </div>
                  <div className="request-type-grid">
                    {sortedQuickActions.map((action) => (
                      <button
                        className="request-type-card"
                        key={action.category}
                        type="button"
                        onClick={() => openRequestModal(action.category)}
                      >
                        <div className={`request-type-icon ${action.color}`}>
                          <i className={`bi ${action.icon}`} aria-hidden="true"></i>
                        </div>
                        <div>
                          <strong>{action.title}</strong>
                          <span>{action.description}</span>
                        </div>
                        <i className="bi bi-chevron-right request-type-arrow" aria-hidden="true"></i>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="requests-card">
                  <div className="requests-card-header request-history-header">
                    <div>
                      <span className="requests-section-label">REQUEST HISTORY</span>
                      <h2>My Requests</h2>
                      <p>Track all requests raised by you and their current status.</p>
                    </div>
                    <button className="requests-outline-btn" type="button" onClick={handleExport}>
                      <i className="bi bi-download" aria-hidden="true"></i>
                      Export
                    </button>
                  </div>

                  <div className="requests-filter-bar">
                    <label className="requests-search">
                      <i className="bi bi-search" aria-hidden="true"></i>
                      <span className="visually-hidden">Search requests</span>
                      <input
                        type="search"
                        value={search}
                        placeholder="Search request ID, subject or category..."
                        onChange={(event) => {
                          setSearch(event.target.value);
                          setPage(1);
                        }}
                      />
                    </label>
                    <label>
                      <span className="visually-hidden">Filter by status</span>
                      <select
                        value={statusFilter}
                        onChange={(event) => {
                          setStatusFilter(event.target.value);
                          setPage(1);
                        }}
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                                          <option value="review">In Review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="completed">Completed</option>
                      </select>
                    </label>
                    <label>
                      <span className="visually-hidden">Filter by category</span>
                      <select
                        value={categoryFilter}
                        onChange={(event) => {
                          setCategoryFilter(event.target.value);
                          setPage(1);
                        }}
                      >
                        <option value="all">All Categories</option>
                        {requestCategories.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {requestError && (
                    <div className="alert alert-danger" role="alert">{requestError}</div>
                  )}
                  {loadingRequests ? (
                    <div className="requests-loading" role="status">
                      <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
                      Loading your requests...
                    </div>
                  ) : visibleRequests.length ? (
                    <div className="requests-list">
                      {visibleRequests.map((request) => (
                        <article className="employee-request-item" key={request.id}>
                          <div className={`request-item-icon ${request.color}`}>
                            <i className={`bi ${request.icon}`} aria-hidden="true"></i>
                          </div>
                          <div className="request-item-main">
                            <div className="request-item-top">
                              <span className="request-id">{request.id}</span>
                              <span className={`request-status ${statusClass(request.status)}`}>
                                <i className={`bi ${statusIcon(request.status)}`} aria-hidden="true"></i>
                                {request.status}
                              </span>
                            </div>
                            <h3>{request.subject}</h3>
                            <p>{request.description}</p>
                            <div className="request-item-meta">
                              <span><i className="bi bi-tag" aria-hidden="true"></i>{request.category}</span>
                              <span><i className="bi bi-calendar3" aria-hidden="true"></i>{request.date}</span>
                              <span><i className="bi bi-clock" aria-hidden="true"></i>{request.submitted}</span>
                            </div>
                          </div>
                          <div className="request-item-actions">
                            {request.priority !== "Normal" && (
                              <span className={`request-priority-btn ${request.priority.toLowerCase()}`}>
                                <i className="bi bi-exclamation-triangle" aria-hidden="true"></i>
                                {request.priority} Priority
                              </span>
                            )}
                            <button
                              className="request-view-btn"
                              type="button"
                              onClick={() => setSelectedRequest(request)}
                            >
                              View <i className="bi bi-chevron-right" aria-hidden="true"></i>
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : !requestError ? (
                    <div className="requests-empty-state show">
                      <div className="requests-empty-icon">
                        <i className="bi bi-search" aria-hidden="true"></i>
                      </div>
                      <h3>No requests found</h3>
                      <p>Try changing your search or filter criteria.</p>
                    </div>
                  ) : null}

                  {!loadingRequests && !requestError && <div className="requests-pagination">
                    <span>
                      Showing <strong>{firstVisible}-{lastVisible}</strong> of{" "}
                      <strong>{filteredRequests.length}</strong> requests
                    </span>
                    <div className="pagination-buttons" aria-label="Request pages">
                      <button
                        type="button"
                        aria-label="Previous page"
                        disabled={currentPage === 1}
                        onClick={() => setPage(currentPage - 1)}
                      >
                        <i className="bi bi-chevron-left" aria-hidden="true"></i>
                      </button>
                      {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
                        <button
                          className={currentPage === pageNumber ? "active" : ""}
                          type="button"
                          aria-current={currentPage === pageNumber ? "page" : undefined}
                          key={pageNumber}
                          onClick={() => setPage(pageNumber)}
                        >
                          {pageNumber}
                        </button>
                      ))}
                      <button
                        type="button"
                        aria-label="Next page"
                        disabled={currentPage === pageCount}
                        onClick={() => setPage(currentPage + 1)}
                      >
                        <i className="bi bi-chevron-right" aria-hidden="true"></i>
                      </button>
                    </div>
                  </div>}
                </section>
              </div>

              <aside className="requests-side-column">
                <section className="requests-card request-help-card">
                  <div className="request-help-icon">
                    <i className="bi bi-question-circle" aria-hidden="true"></i>
                  </div>
                  <span className="requests-section-label">NEED HELP?</span>
                  <h3>Can&apos;t find what you need?</h3>
                  <p>Raise a general HR request and our team will route it to the appropriate department.</p>
                  <button
                    className="requests-outline-btn full-width"
                    type="button"
                    onClick={() => openRequestModal("General HR Request")}
                  >
                    <i className="bi bi-chat-square-text" aria-hidden="true"></i>
                    Raise General Request
                  </button>
                </section>

                <section className="requests-card">
                  <div className="requests-side-heading">
                    <span className="requests-section-label">STATUS GUIDE</span>
                    <h3>Request Status</h3>
                  </div>
                  <div className="status-guide-list">
                    {[
                      ["pending", "Pending", "Waiting for HR or manager action."],
                      ["review", "In Review", "Your request is currently being reviewed."],
                      ["approved", "Approved", "Your request has been approved."],
                      ["completed", "Completed", "The requested action has been completed."],
                      ["rejected", "Rejected", "The request was not approved."]
                    ].map(([color, label, description]) => (
                      <div key={label}>
                        <span className={`status-guide-dot ${color}`}></span>
                        <div><strong>{label}</strong><p>{description}</p></div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="requests-card request-resolution-card">
                  <span className="requests-section-label">SERVICE INSIGHT</span>
                  <div className="resolution-value">
                    <strong>{averageResolutionDays ?? "—"}</strong>
                    {averageResolutionDays !== null && <span>days</span>}
                  </div>
                  <h3>Average Resolution Time</h3>
                  <p>
                    {requestStats.completed_asset_requests
                      ? `Based on ${requestStats.completed_asset_requests} completed asset ${requestStats.completed_asset_requests === 1 ? "request" : "requests"}.`
                      : "Resolution time will appear after your asset requests are fulfilled."}
                  </p>
                </section>

                <section className="requests-card request-contact-card">
                  <span className="requests-section-label">HR SUPPORT</span>
                  <h3>Need direct assistance?</h3>
                  <div className="request-contact-person">
                    <div className="request-contact-avatar">PS</div>
                    <div><strong>Priya Sharma</strong><span>HR Manager</span></div>
                  </div>
                  <button
                    className="request-contact-btn"
                    type="button"
                    onClick={() => setShowContactPanel(true)}
                  >
                    <i className="bi bi-chat-dots" aria-hidden="true"></i>
                    Contact HR
                  </button>
                </section>
              </aside>
            </div>
          </div>
        </div>
      </div>

      <div
        className="modal fade"
        id="employeeRequestModal"
        ref={requestModalRef}
        tabIndex="-1"
        aria-labelledby="raise-request-title"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable request-modal-dialog">
          <section className="modal-content request-modal">
            <header className="request-modal-header">
              <div>
                <h2 id="raise-request-title">Raise a Request</h2>
                <p>Provide the required information and submit your request.</p>
              </div>
              <button
                className="request-modal-close"
                type="button"
                aria-label="Close"
                data-bs-dismiss="modal"
              >
                <i className="bi bi-x-lg" aria-hidden="true"></i>
              </button>
            </header>
            <form className="request-modal-form" onSubmit={handleCreate}>
              <div className="request-modal-body">
                <div className="request-form-grid">
                  <div className="request-form-group full">
                    <label htmlFor="request-category">Request Category</label>
                    <select
                      id="request-category"
                      value={form.category}
                      onChange={(event) => setForm({ ...form, category: event.target.value })}
                      required
                    >
                      <option value="">Select request category</option>
                      {requestCategories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div className="request-form-group full">
                    <label htmlFor="request-subject">Request Subject</label>
                    <input
                      id="request-subject"
                      type="text"
                      maxLength={120}
                      placeholder="Enter a short subject for your request"
                      value={form.subject}
                      onChange={(event) => setForm({ ...form, subject: event.target.value })}
                      required
                    />
                  </div>
                  {form.category === "Asset Request" && (
                    <>
                      <div className="request-form-group">
                        <label htmlFor="request-asset-type">Asset Type</label>
                        <select
                          id="request-asset-type"
                          value={form.assetType}
                          onChange={(event) => setForm({ ...form, assetType: event.target.value })}
                          required
                        >
                          <option value="">Select asset type</option>
                          <option value="laptop">Laptop</option>
                          <option value="monitor">Monitor</option>
                          <option value="mobile">Mobile</option>
                          <option value="keyboard">Keyboard</option>
                          <option value="mouse">Mouse</option>
                          <option value="headset">Headset</option>
                          <option value="access-card">Access Card</option>
                          <option value="security-token">Security Token</option>
                          <option value="other">Other Equipment</option>
                        </select>
                      </div>
                      <div className="request-form-group">
                        <label htmlFor="request-date-needed">Date Needed</label>
                        <input
                          id="request-date-needed"
                          type="date"
                          value={form.dateNeeded}
                          onChange={(event) => setForm({ ...form, dateNeeded: event.target.value })}
                        />
                      </div>
                      <div className="request-form-group">
                        <label htmlFor="request-preferred-model">Preferred Make or Model</label>
                        <input
                          id="request-preferred-model"
                          value={form.preferredModel}
                          onChange={(event) => setForm({ ...form, preferredModel: event.target.value })}
                          placeholder="Optional, e.g. Dell Latitude"
                        />
                      </div>
                      <div className="request-form-group">
                        <label htmlFor="request-work-location">Work Location</label>
                        <select
                          id="request-work-location"
                          value={form.workLocation}
                          onChange={(event) => setForm({ ...form, workLocation: event.target.value })}
                        >
                          <option value="">Select work location</option>
                          <option>Chennai Office</option>
                          <option>Hyderabad Office</option>
                          <option>Bangalore Office</option>
                          <option>Remote</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div className="request-form-group full">
                        <label htmlFor="request-additional-requirements">Additional Requirements</label>
                        <textarea
                          id="request-additional-requirements"
                          rows="3"
                          value={form.additionalRequirements}
                          onChange={(event) => setForm({ ...form, additionalRequirements: event.target.value })}
                          placeholder="Share preferred specifications or accessories..."
                        ></textarea>
                      </div>
                    </>
                  )}
                  {form.category === "Leave Request" && (
                    <>
                      <div className="request-form-group">
                        <label htmlFor="request-leave-type">Leave Type</label>
                        <select
                          id="request-leave-type"
                          value={form.leaveTypeId}
                          onChange={(event) => setForm({ ...form, leaveTypeId: event.target.value })}
                          required
                        >
                          <option value="">Select leave type</option>
                          {leaveTypes.map((leaveType) => (
                            <option key={leaveType.id} value={leaveType.id}>{leaveType.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="request-form-group">
                        <label htmlFor="request-approver">Approver</label>
                        <select
                          id="request-approver"
                          value={form.approverId}
                          onChange={(event) => setForm({ ...form, approverId: event.target.value })}
                          required
                        >
                          <option value="">Select approver</option>
                          {approvers.map((approver) => (
                            <option key={approver.id} value={approver.id}>
                              {`${approver.first_name || ""} ${approver.last_name || ""}`.trim() || `Employee ${approver.id}`}
                              {approver.role_name ? ` (${approver.role_name})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="request-form-group full">
                        <div className="d-flex align-items-center justify-content-between p-2 rounded-2" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          <label className="form-check-label d-flex align-items-center gap-2 mb-0 fw-semibold text-dark" style={{ cursor: 'pointer', fontSize: '13px' }}>
                            <input
                              type="checkbox"
                              className="form-check-input mt-0"
                              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                              checked={form.isHalfDay || false}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setForm(prev => ({
                                  ...prev,
                                  isHalfDay: checked,
                                  endDate: checked ? prev.startDate : prev.endDate,
                                  halfDayPeriod: prev.halfDayPeriod || 'First Half'
                                }));
                              }}
                            />
                            Apply for Half Day
                          </label>
                          {form.isHalfDay && (
                            <div className="d-flex align-items-center gap-1.5">
                              <span className="text-muted" style={{ fontSize: '12px' }}>Period:</span>
                              <div className="btn-group btn-group-sm" role="group">
                                <button
                                  type="button"
                                  className={`btn btn-sm ${form.halfDayPeriod === 'First Half' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                  style={{ fontSize: '11.5px', padding: '2px 8px', fontWeight: form.halfDayPeriod === 'First Half' ? '600' : '400' }}
                                  onClick={() => setForm(prev => ({ ...prev, halfDayPeriod: 'First Half' }))}
                                >
                                  1st Half (Morning)
                                </button>
                                <button
                                  type="button"
                                  className={`btn btn-sm ${form.halfDayPeriod === 'Second Half' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                  style={{ fontSize: '11.5px', padding: '2px 8px', fontWeight: form.halfDayPeriod === 'Second Half' ? '600' : '400' }}
                                  onClick={() => setForm(prev => ({ ...prev, halfDayPeriod: 'Second Half' }))}
                                >
                                  2nd Half (Afternoon)
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="request-form-group">
                        <label htmlFor="request-start-date">{form.isHalfDay ? "Date" : "From Date"}</label>
                        <input
                          id="request-start-date"
                          type="date"
                          value={form.startDate}
                          onChange={(event) => {
                            const val = event.target.value;
                            setForm(prev => ({
                              ...prev,
                              startDate: val,
                              ...(prev.isHalfDay ? { endDate: val } : {})
                            }));
                          }}
                          required
                        />
                      </div>
                      {!form.isHalfDay ? (
                        <div className="request-form-group">
                          <label htmlFor="request-end-date">To Date</label>
                          <input
                            id="request-end-date"
                            type="date"
                            min={form.startDate || undefined}
                            value={form.endDate}
                            onChange={(event) => setForm({ ...form, endDate: event.target.value })}
                            required
                          />
                        </div>
                      ) : (
                        <div className="request-form-group">
                          <label>Duration</label>
                          <input
                            type="text"
                            readOnly
                            value={`0.50 Day · ${form.halfDayPeriod === 'Second Half' ? '2nd Half' : '1st Half'}`}
                            style={{ backgroundColor: '#f8fafc', fontWeight: '500', color: '#4338ca' }}
                          />
                        </div>
                      )}
                    </>
                  )}
                  {form.category === "Work From Home (WFH)" && (
                    <>
                      <div className="request-form-group">
                        <label htmlFor="wfh-start-date">From Date <span className="text-danger">*</span></label>
                        <input
                          id="wfh-start-date"
                          type="date"
                          value={form.startDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            setForm(prev => ({
                              ...prev,
                              startDate: val,
                              endDate: prev.endDate && prev.endDate >= val ? prev.endDate : val
                            }));
                          }}
                          required
                        />
                      </div>
                      <div className="request-form-group">
                        <label htmlFor="wfh-end-date">To Date <span className="text-danger">*</span></label>
                        <input
                          id="wfh-end-date"
                          type="date"
                          min={form.startDate || undefined}
                          value={form.endDate || form.startDate}
                          onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                          required
                        />
                      </div>
                      <div className="request-form-group">
                        <label htmlFor="wfh-days-display">Total WFH Days</label>
                        <input
                          id="wfh-days-display"
                          type="text"
                          readOnly
                          style={{ backgroundColor: '#f8fafc', fontWeight: '600', color: '#4e36f5' }}
                          value={
                            form.startDate
                              ? `${Math.max(1, Math.floor((new Date(form.endDate || form.startDate) - new Date(form.startDate)) / 86400000) + 1)} Day(s)`
                              : '--'
                          }
                        />
                      </div>
                      <div className="request-form-group">
                        <label htmlFor="wfh-contact">Contact Phone during WFH</label>
                        <input
                          id="wfh-contact"
                          type="tel"
                          placeholder="e.g. +91 98765 43210"
                          value={form.wfhContact || ""}
                          onChange={(e) => setForm({ ...form, wfhContact: e.target.value })}
                        />
                      </div>
                    </>
                  )}
                  {form.category === "Expenses & Claims" && (
                    <>
                      <div className="request-form-group">
                        <label htmlFor="request-expense-category">Expense Category</label>
                        <select
                          id="request-expense-category"
                          value={form.expenseCategory || "Travel & Cab"}
                          onChange={(event) => setForm({ ...form, expenseCategory: event.target.value })}
                          required
                        >
                          <option value="Travel & Cab">Travel & Cab</option>
                          <option value="Food & Meals">Food & Meals</option>
                          <option value="Internet / Mobile">Internet / Mobile</option>
                          <option value="Office Supplies">Office Supplies</option>
                          <option value="Certification Fees">Certification Fees</option>
                        </select>
                      </div>
                      <div className="request-form-group">
                        <label htmlFor="request-claim-amount">Claim Amount (₹)</label>
                        <input
                          id="request-claim-amount"
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="e.g. 1500.00"
                          value={form.claimAmount || ""}
                          onChange={(event) => setForm({ ...form, claimAmount: event.target.value })}
                          required
                        />
                      </div>
                      <div className="request-form-group">
                        <label htmlFor="request-merchant-name">Merchant / Vendor Name</label>
                        <input
                          id="request-merchant-name"
                          type="text"
                          placeholder="e.g. Uber, Airtel, Crossword"
                          value={form.merchantName || ""}
                          onChange={(event) => setForm({ ...form, merchantName: event.target.value })}
                          required
                        />
                      </div>
                      <div className="request-form-group">
                        <label htmlFor="request-expense-date">Expense Date</label>
                        <input
                          id="request-expense-date"
                          type="date"
                          max={new Date().toISOString().split("T")[0]}
                          value={form.expenseDate || ""}
                          onChange={(event) => setForm({ ...form, expenseDate: event.target.value })}
                          required
                        />
                      </div>
                    </>
                  )}
                  <div className="request-form-group">
                    <label htmlFor="request-priority">Priority</label>
                    <select
                      id="request-priority"
                      value={form.priority}
                      onChange={(event) => setForm({ ...form, priority: event.target.value })}
                    >
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                  <div className="request-form-group">
                    <label htmlFor="request-response">Preferred Response</label>
                    <select
                      id="request-response"
                      value={form.response}
                      onChange={(event) => setForm({ ...form, response: event.target.value })}
                    >
                      <option>Email</option>
                      <option>Portal Notification</option>
                      <option>Phone Call</option>
                    </select>
                  </div>
                  <div className="request-form-group full">
                    <label htmlFor="request-description">Request Details</label>
                    <textarea
                      id="request-description"
                      rows="5"
                      maxLength={2000}
                      placeholder="Explain your request clearly..."
                      value={form.description}
                      onChange={(event) => setForm({ ...form, description: event.target.value })}
                      required
                    ></textarea>
                  </div>
                  <div className="request-form-group full">
                    <span className="request-upload-label">Attachment</span>
                    <label className="request-upload-box">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={handleAttachmentChange}
                        hidden
                      />
                      <i className="bi bi-cloud-arrow-up" aria-hidden="true"></i>
                      <strong>{attachment ? attachment.name : "Click to upload a file"}</strong>
                      <span>PDF, JPG, PNG or DOCX · Maximum 500 KB</span>
                    </label>
                    {fileError && <span className="request-file-error" role="alert">{fileError}</span>}
                  </div>
                </div>
              </div>
              {formError && <div className="request-form-error" role="alert">{formError}</div>}
              <footer className="request-modal-footer">
                <button className="requests-secondary-btn" type="button" onClick={closeRequestModal}>
                  Cancel
                </button>
                <button className="requests-primary-btn" type="submit" disabled={submitting}>
                  <i className="bi bi-send" aria-hidden="true"></i>
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      </div>

      {selectedRequest && (
        <div
          className="request-modal-overlay show"
          onClick={(event) => {
            if (event.target === event.currentTarget) setSelectedRequest(null);
          }}
        >
          <section
            className="request-modal request-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-request-title"
          >
            <header className="request-modal-header">
              <div>
                <h2 id="detail-request-title">{selectedRequest.subject}</h2>
                <p>{selectedRequest.id}</p>
              </div>
              <button
                className="request-modal-close"
                type="button"
                aria-label="Close request details"
                onClick={() => setSelectedRequest(null)}
              >
                <i className="bi bi-x-lg" aria-hidden="true"></i>
              </button>
            </header>
            <div className="request-details-body">
              <div className="request-detail-status-row">
                <div>
                  <span>Status</span>
                  <strong className={`request-status ${statusClass(selectedRequest.status)}`}>
                    <i className={`bi ${statusIcon(selectedRequest.status)}`} aria-hidden="true"></i>
                    {selectedRequest.status}
                  </strong>
                </div>
                <div><span>Submitted</span><strong>{selectedRequest.date}</strong></div>
                <div><span>Category</span><strong>{selectedRequest.category}</strong></div>
              </div>

              <section className="request-detail-section">
                <h3><i className="bi bi-clock-history" aria-hidden="true"></i>Request Timeline</h3>
                <div className="request-detail-timeline">
                  <div className="request-detail-timeline-item completed">
                    <span className="timeline-dot"><i className="bi bi-check" aria-hidden="true"></i></span>
                    <div><strong>Request Submitted</strong><span>{selectedRequest.date}</span></div>
                  </div>
                  <div className={`request-detail-timeline-item ${["In Review", "Approved", "Completed", "Rejected"].includes(selectedRequest.status) ? "completed" : "current"}`}>
                    <span className="timeline-dot"><i className={`bi ${statusIcon(selectedRequest.status)}`} aria-hidden="true"></i></span>
                    <div>
                      <strong>{selectedRequest.status === "Pending" ? "Waiting for Manager Review" : selectedRequest.status}</strong>
                      <span>{selectedRequest.status === "Pending" ? "Awaiting review" : selectedRequest.assignedTo}</span>
                    </div>
                  </div>
                  <div className={`request-detail-timeline-item ${["Approved", "Completed"].includes(selectedRequest.status) ? "completed" : ""}`}>
                    <span className="timeline-dot"><i className={`bi ${["Approved", "Completed"].includes(selectedRequest.status) ? "bi-check" : "bi-circle"}`} aria-hidden="true"></i></span>
                    <div><strong>HR Verification</strong><span>{["Approved", "Completed"].includes(selectedRequest.status) ? "Completed" : "Pending"}</span></div>
                  </div>
                  <div className={`request-detail-timeline-item ${selectedRequest.status === "Completed" ? "completed" : ""}`}>
                    <span className="timeline-dot"><i className={`bi ${selectedRequest.status === "Completed" ? "bi-check" : "bi-circle"}`} aria-hidden="true"></i></span>
                    <div><strong>Request Completed</strong><span>{selectedRequest.status === "Completed" ? "Completed" : "Pending"}</span></div>
                  </div>
                </div>
              </section>

              <section className="request-detail-section">
                <h3><i className="bi bi-info-circle" aria-hidden="true"></i>Request Information</h3>
                <div className="request-information-grid">
                  <div><span>Subject</span><strong>{selectedRequest.subject}</strong></div>
                  <div><span>Priority</span><strong>{selectedRequest.priority}</strong></div>
                  <div><span>Assigned To</span><strong>{selectedRequest.assignedTo}</strong></div>
                  <div><span>Preferred Response</span><strong>{selectedRequest.response}</strong></div>
                  {selectedRequest.leave_type && (
                    <>
                      <div><span>Leave Type</span><strong>{selectedRequest.leave_type}</strong></div>
                      <div><span>Leave Dates</span><strong>{selectedRequest.start_date}{selectedRequest.is_half_day ? "" : ` – ${selectedRequest.end_date}`}</strong></div>
                      <div><span>Days Requested</span><strong>{selectedRequest.is_half_day ? `0.50 Day (${selectedRequest.half_day_period === 'Second Half' ? '2nd Half' : '1st Half'})` : `${selectedRequest.days_requested} Day(s)`}</strong></div>
                    </>
                  )}
                  {(selectedRequest.category === "Work From Home (WFH)" || selectedRequest.wfh_start_date) && (
                    <>
                      <div><span>Request Type</span><strong>Work From Home (WFH)</strong></div>
                      <div>
                        <span>WFH Date(s)</span>
                        <strong>
                          {selectedRequest.wfh_start_date
                            ? (selectedRequest.wfh_start_date === selectedRequest.wfh_end_date || !selectedRequest.wfh_end_date
                                ? new Date(selectedRequest.wfh_start_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                                : `${new Date(selectedRequest.wfh_start_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} – ${new Date(selectedRequest.wfh_end_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`)
                            : "--"}
                        </strong>
                      </div>
                      {selectedRequest.wfh_contact && (
                        <div><span>Contact Phone</span><strong>{selectedRequest.wfh_contact}</strong></div>
                      )}
                    </>
                  )}
                  {selectedRequest.asset_type && (
                    <>
                      <div><span>Asset Type</span><strong>{selectedRequest.asset_type.replace(/-/g, " ")}</strong></div>
                      {selectedRequest.date_needed && (
                        <div><span>Date Needed</span><strong>{selectedRequest.date_needed}</strong></div>
                      )}
                      {selectedRequest.preferred_model && (
                        <div><span>Preferred Model</span><strong>{selectedRequest.preferred_model}</strong></div>
                      )}
                      {selectedRequest.work_location && (
                        <div><span>Work Location</span><strong>{selectedRequest.work_location}</strong></div>
                      )}
                    </>
                  )}
                  {selectedRequest.attachment && (
                    <div><span>Attachment</span><strong>{selectedRequest.attachment}</strong></div>
                  )}
                  {(selectedRequest.claim_amount || selectedRequest.category === "Expenses & Claims") && (
                    <>
                      {selectedRequest.claim_amount && (
                        <div>
                          <span>Claim Amount</span>
                          <strong style={{ color: "#16a34a", fontWeight: "700" }}>
                            ₹{parseFloat(selectedRequest.claim_amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </strong>
                        </div>
                      )}
                      {selectedRequest.expense_category && (
                        <div><span>Expense Category</span><strong>{selectedRequest.expense_category}</strong></div>
                      )}
                      {selectedRequest.merchant_name && (
                        <div><span>Merchant / Store</span><strong>{selectedRequest.merchant_name}</strong></div>
                      )}
                      {selectedRequest.expense_date && (
                        <div><span>Expense Date</span><strong>{selectedRequest.expense_date}</strong></div>
                      )}
                      {selectedRequest.receipt_url && (
                        <div>
                          <span>Receipt Document</span>
                          <strong>
                            <a
                              href={selectedRequest.receipt_url.startsWith('http') ? selectedRequest.receipt_url : `${API_BASE}${selectedRequest.receipt_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "#4e36f5", textDecoration: "none", fontWeight: 600 }}
                            >
                              <i className="bi bi-paperclip me-1"></i>
                              {selectedRequest.receipt_filename || "View Receipt"}
                            </a>
                          </strong>
                        </div>
                      )}
                    </>
                  )}
                </div>
                {selectedRequest.admin_remarks && (
                  <div className="request-description-box mt-3">
                    <strong>Reviewer notes:</strong> {selectedRequest.admin_remarks}
                  </div>
                )}
              </section>

              <section className="request-detail-section">
                <h3><i className="bi bi-chat-left-text" aria-hidden="true"></i>Request Details</h3>
                <div className="request-description-box">{selectedRequest.description}</div>
              </section>
            </div>
            <footer className="request-modal-footer">
              <button className="requests-secondary-btn" type="button" onClick={() => setSelectedRequest(null)}>
                Close
              </button>
            </footer>
          </section>
        </div>
      )}

      {showContactPanel && (
        <div
          className="request-contact-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) setShowContactPanel(false);
          }}
        >
          <section
            className="request-contact-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-hr-title"
          >
            <header>
              <div>
                <span className="requests-section-label">HR SUPPORT</span>
                <h2 id="contact-hr-title">Contact HR</h2>
              </div>
              <button type="button" aria-label="Close" onClick={() => setShowContactPanel(false)}>
                <i className="bi bi-x-lg" aria-hidden="true"></i>
              </button>
            </header>
            <form onSubmit={handleContactSubmit}>
              <div className="request-form-group">
                <label htmlFor="contact-hr-subject">Subject</label>
                <input
                  id="contact-hr-subject"
                  value={contactForm.subject}
                  onChange={(event) => setContactForm({ ...contactForm, subject: event.target.value })}
                  placeholder="What do you need help with?"
                  required
                />
              </div>
              <div className="request-form-group">
                <label htmlFor="contact-hr-message">Message</label>
                <textarea
                  id="contact-hr-message"
                  rows="6"
                  value={contactForm.message}
                  onChange={(event) => setContactForm({ ...contactForm, message: event.target.value })}
                  placeholder="Describe your request..."
                  required
                ></textarea>
              </div>
              <button className="requests-primary-btn" type="submit">
                <i className="bi bi-send" aria-hidden="true"></i>
                Submit Request
              </button>
            </form>
          </section>
        </div>
      )}

      {showContactSuccess && (
        <div className="requests-toast show" role="status">
          <div className="requests-toast-icon"><i className="bi bi-check-lg" aria-hidden="true"></i></div>
          <div><strong>Request submitted</strong><span>Your request has been sent to HR as high priority.</span></div>
          <button type="button" aria-label="Dismiss notification" onClick={() => setShowContactSuccess(false)}>
            <i className="bi bi-x" aria-hidden="true"></i>
          </button>
        </div>
      )}

      {toast && (
        <div className="requests-toast show" role="status">
          <div className="requests-toast-icon"><i className="bi bi-check-lg" aria-hidden="true"></i></div>
          <div><strong>Request submitted</strong><span>{toast}</span></div>
          <button type="button" aria-label="Dismiss notification" onClick={() => setToast("")}>
            <i className="bi bi-x" aria-hidden="true"></i>
          </button>
        </div>
      )}
    </main>
  );
}

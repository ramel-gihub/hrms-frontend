import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import EmptyState from "../components/EmptyState";

const API_BASE = import.meta.env.VITE_API_URL || (
  ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? "http://localhost:5002"
    : "https://hrms-backend-f2ef.onrender.com"
);
const FILTERS = ["All Notifications", "Unread", "Important", "Archived"];
const CATEGORIES = ["Leave", "Attendance", "Work From Home (WFH)", "Requests", "Assets", "IT Access", "Documents", "HR Announcement", "Celebrations"];
const ICONS = {
  Leave: "bi-calendar-check",
  Attendance: "bi-clock-history",
  "Work From Home (WFH)": "bi-house-door",
  Requests: "bi-inbox",
  Assets: "bi-laptop",
  "IT Access": "bi-shield-lock",
  Documents: "bi-file-earmark-text",
  "HR Announcement": "bi-megaphone",
  Celebrations: "bi-stars"
};
const EMPTY_COUNTS = { total: 0, unread: 0, important: 0, read: 0, archived: 0 };

async function readApiResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(`Notifications API returned a non-JSON response (HTTP ${response.status}).`);
  }
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `Notifications request failed (HTTP ${response.status}).`);
  return result;
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export default function Notifications({ currentUser, employeeProfile, adminView = false }) {
  const userId = currentUser?.id || employeeProfile?.user_id;
  const [notifications, setNotifications] = useState([]);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [activeFilter, setActiveFilter] = useState("All Notifications");
  const [activeCategory, setActiveCategory] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [previewNotification, setPreviewNotification] = useState(null);
  const [viewMode, setViewMode] = useState("preview");

  const errorTimeoutRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  const showError = (msg) => {
    setError(msg);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    if (msg) errorTimeoutRef.current = setTimeout(() => setError(""), 5000);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    if (msg) toastTimeoutRef.current = setTimeout(() => setToastMessage(""), 5000);
  };

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const loadNotifications = useCallback(async (signal, showLoading = false) => {
    if (!userId) {
      showError("Unable to identify your account. Please sign in again.");
      setLoading(false);
      return;
    }
    if (showLoading) setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/notifications/${encodeURIComponent(userId)}`, { signal });
      const result = await readApiResponse(response);
      setNotifications(Array.isArray(result.notifications) ? result.notifications : []);
      setCounts({ ...EMPTY_COUNTS, ...(result.counts || {}) });
      setError("");
    } catch (loadError) {
      if (loadError.name !== "AbortError") {
        showError(loadError.message || "Unable to load notifications.");
      }
    } finally {
      if (!signal?.aborted && showLoading) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const controller = new AbortController();
    const refresh = () => {
      if (document.visibilityState === "visible") loadNotifications(controller.signal);
    };
    loadNotifications(controller.signal, true);
    const interval = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [loadNotifications]);

  const [page, setPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    setPage(1);
  }, [activeFilter, activeCategory, search]);

  const visibleNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();
    return notifications.filter((notification) => {
      const archived = Boolean(notification.is_archived);
      if (activeFilter === "Archived" && !archived) return false;
      if (activeFilter !== "Archived" && archived) return false;
      if (activeFilter === "Unread" && notification.is_read) return false;
      if (activeFilter === "Important" && !notification.is_important) return false;
      if (activeCategory) {
        const normCat = (notification.category || "").toLowerCase();
        const normActive = activeCategory.toLowerCase();
        if (normActive.includes("wfh") || normActive.includes("work from home")) {
          if (!normCat.includes("wfh") && !normCat.includes("work from home")) return false;
        } else if (normCat !== normActive) {
          return false;
        }
      }
      if (query && !`${notification.title} ${notification.message} ${notification.category}`.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [notifications, activeFilter, activeCategory, search]);

  const totalPages = Math.max(1, Math.ceil(visibleNotifications.length / pageSize));
  const paginatedNotifications = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return visibleNotifications.slice(startIndex, startIndex + pageSize);
  }, [visibleNotifications, page, pageSize]);

  const updateNotification = async (notification, update) => {
    setBusyId(notification.id);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/notifications/${notification.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...update })
      });
      await readApiResponse(response);
      await loadNotifications();
    } catch (updateError) {
      showError(updateError.message || "Unable to update notification.");
    } finally {
      setBusyId(null);
    }
  };

  const deleteNotification = async (notification) => {
    if (!notification || !notification.id) return;
    setBusyId(notification.id);
    setError("");

    // Optimistically update notifications and counts
    setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    setCounts((prev) => ({
      ...prev,
      total: Math.max(0, prev.total - 1),
      unread: !notification.is_read && !notification.is_archived ? Math.max(0, prev.unread - 1) : prev.unread,
      important: notification.is_important && !notification.is_archived ? Math.max(0, prev.important - 1) : prev.important,
      read: notification.is_read && !notification.is_archived ? Math.max(0, prev.read - 1) : prev.read,
      archived: notification.is_archived ? Math.max(0, prev.archived - 1) : prev.archived
    }));

    if (previewNotification?.id === notification.id) {
      setPreviewNotification(null);
    }

    try {
      const response = await fetch(`${API_BASE}/api/notifications/${notification.id}?userId=${encodeURIComponent(userId)}`, {
        method: "DELETE"
      });
      await readApiResponse(response);
      showToast("Notification deleted successfully.");
    } catch (err) {
      await loadNotifications();
      showError(err.message || "Unable to delete notification.");
    } finally {
      setBusyId(null);
    }
  };

  const openPreview = (notification, mode = "preview") => {
    setPreviewNotification(notification);
    setViewMode(mode);
    if (!notification.is_read) {
      updateNotification(notification, { is_read: true });
    }
  };

  const markAllRead = async () => {
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/notifications/${encodeURIComponent(userId)}/read-all`, {
        method: "PATCH"
      });
      await readApiResponse(response);
      await loadNotifications();
      showToast("All notifications marked as read.");
    } catch (updateError) {
      showError(updateError.message || "Unable to mark notifications as read.");
    }
  };

  return (
    <div className="px-0 px-md-5 employee-dashboard">
      <div className="employee-notifications-page">
        <div className="en-page-header">
          <div>
            <h2>{adminView ? "Admin Notifications" : "Notifications"}</h2>
            <p>{adminView ? "New employee requests and asset returns for your organization." : "Live updates for your requests, approvals, assets, and HR."}</p>
          </div>
          <div className="en-header-actions">
            <button className="btn en-btn-light" type="button" onClick={() => loadNotifications(undefined, true)} disabled={loading}>
              <i className="bi bi-arrow-clockwise me-2"></i>Refresh
            </button>
            <button className="btn en-btn-primary" type="button" onClick={markAllRead} disabled={!counts.unread}>
              <i className="bi bi-check2-all me-2"></i>Mark all as read
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center justify-content-between" role="alert">
            <div>
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
            </div>
            <button type="button" className="btn-close" onClick={() => setError("")} aria-label="Close"></button>
          </div>
        )}
        {toastMessage && (
          <div className="alert alert-success alert-dismissible fade show d-flex align-items-center justify-content-between" role="alert">
            <div>
              <i className="bi bi-check-circle-fill me-2"></i>
              {toastMessage}
            </div>
            <button type="button" className="btn-close" onClick={() => setToastMessage("")} aria-label="Close"></button>
          </div>
        )}

        <div className="en-welcome-banner">
          <div className="en-welcome-icon"><i className="bi bi-bell-fill"></i></div>
          <div className="en-welcome-content">
            <span className="en-eyebrow">LIVE NOTIFICATION CENTER</span>
            <h3>{adminView ? "Employee activity, all in one place." : "Every request update, all in one place."}</h3>
            <p>{adminView ? "Review employee submissions and requests waiting for your team." : "Request submissions and administrator decisions appear here automatically."}</p>
          </div>
          <div className="en-banner-decoration"><i className="bi bi-bell"></i><i className="bi bi-stars"></i></div>
        </div>

        <div className="row g-3 en-summary-row">
          {[
            ["Total Notifications", counts.total, "bi-bell", "en-icon-purple"],
            ["Unread", counts.unread, "bi-envelope", "en-icon-blue"],
            ["Important", counts.important, "bi-star", "en-icon-orange"],
            ["Read", counts.read, "bi-check-circle", "en-icon-green"]
          ].map(([label, count, icon, color]) => (
            <div className="col-6 col-xl-3" key={label}>
              <div className="en-summary-card">
                <div className={`en-summary-icon ${color}`}><i className={`bi ${icon}`}></i></div>
                <div><span>{label}</span><h3>{count}</h3><small>Stored notifications</small></div>
              </div>
            </div>
          ))}
        </div>

        <div className="en-workspace">
          <aside className="en-sidebar">
            <div className="en-sidebar-heading">INBOX</div>
            {FILTERS.map((filter) => (
              <button key={filter} className={`en-nav-item ${activeFilter === filter && !activeCategory ? "active" : ""}`} type="button" onClick={() => { setActiveFilter(filter); setActiveCategory(""); }}>
                <span className="en-nav-icon"><i className={`bi ${filter === "Unread" ? "bi-envelope" : filter === "Important" ? "bi-star" : filter === "Archived" ? "bi-archive" : "bi-inbox"}`}></i></span>
                <span>{filter}</span>
                <span className="en-nav-count">{filter === "Unread" ? counts.unread : filter === "Important" ? counts.important : filter === "Archived" ? counts.archived : counts.total}</span>
              </button>
            ))}
            <div className="en-sidebar-divider"></div>
            <div className="en-sidebar-heading">CATEGORIES</div>
            {CATEGORIES.map((category) => (
              <button key={category} className={`en-category-item ${activeCategory === category ? "active" : ""}`} type="button" onClick={() => { setActiveCategory(activeCategory === category ? "" : category); setActiveFilter("All Notifications"); }}>
                <span className="en-category-dot en-dot-purple"></span>{category}
              </button>
            ))}
          </aside>

          <section className="en-feed">
            <div className="en-feed-header">
              <div><h4>{activeCategory || activeFilter}</h4><p>{visibleNotifications.length} notification{visibleNotifications.length === 1 ? "" : "s"}</p></div>
            </div>
            <div className="en-toolbar">
              <div className="en-search">
                <i className="bi bi-search"></i>
                <input type="search" aria-label="Search notifications" placeholder="Search notifications..." value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
            </div>
            {loading ? (
              <div className="text-center text-muted py-5"><span className="spinner-border spinner-border-sm me-2" role="status"></span>Loading notifications...</div>
            ) : visibleNotifications.length ? (
              <>
                {paginatedNotifications.map((notification) => (
                  <article 
                    key={notification.id} 
                    className={`en-notification ${notification.is_read ? "" : "unread"}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => openPreview(notification, "preview")}
                  >
                    <div className="en-notification-icon en-icon-purple"><i className={`bi ${ICONS[notification.category] || "bi-bell"}`}></i></div>
                    <div className="en-notification-main">
                      <div className="en-notification-top">
                        <h5 className="en-notification-title">{notification.title}</h5>
                        {!notification.is_read && <span className="en-unread-badge">New</span>}
                        {notification.is_important && <i className="bi bi-star-fill en-important-badge" title="Important"></i>}
                      </div>
                      <p className="en-notification-description">{notification.message}</p>
                      <div className="en-notification-meta">
                        <span className="en-category-label">{notification.category}</span>
                        <span><i className="bi bi-clock"></i>{formatDate(notification.created_at)}</span>
                      </div>
                    </div>
                    <div className="en-notification-actions">
                      <button 
                        type="button" 
                        className="en-action-btn" 
                        title="Notification Preview" 
                        aria-label="Notification Preview" 
                        onClick={(e) => { e.stopPropagation(); openPreview(notification, "preview"); }}
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                      <button 
                        type="button" 
                        className="en-action-btn" 
                        title="Email View" 
                        aria-label="Email View" 
                        onClick={(e) => { e.stopPropagation(); openPreview(notification, "email"); }}
                      >
                        <i className="bi bi-envelope-paper"></i>
                      </button>
                      {!notification.is_archived && (
                        <button 
                          type="button" 
                          className="en-action-btn" 
                          title={notification.is_read ? "Mark unread" : "Mark read"} 
                          aria-label={notification.is_read ? "Mark unread" : "Mark read"} 
                          disabled={busyId === notification.id} 
                          onClick={(e) => { e.stopPropagation(); updateNotification(notification, { is_read: !notification.is_read }); }}
                        >
                          <i className={`bi ${notification.is_read ? "bi-envelope" : "bi-envelope-open"}`}></i>
                        </button>
                      )}
                      <button 
                        type="button" 
                        className="en-action-btn" 
                        title={notification.is_archived ? "Restore" : "Archive"} 
                        aria-label={notification.is_archived ? "Restore notification" : "Archive notification"} 
                        disabled={busyId === notification.id} 
                        onClick={(e) => { e.stopPropagation(); updateNotification(notification, { is_archived: !notification.is_archived }); }}
                      >
                        <i className={`bi ${notification.is_archived ? "bi-arrow-counterclockwise" : "bi-archive"}`}></i>
                      </button>
                      <button 
                        type="button" 
                        className="en-action-btn text-danger" 
                        title="Delete notification" 
                        aria-label="Delete notification" 
                        disabled={busyId === notification.id} 
                        onClick={(e) => { e.stopPropagation(); deleteNotification(notification); }}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </article>
                ))}
                {visibleNotifications.length > pageSize && (
                  <div className="d-flex align-items-center justify-content-between p-3 border-top mt-3 flex-wrap gap-2">
                    <span className="text-muted" style={{ fontSize: "13px" }}>
                      Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, visibleNotifications.length)} of {visibleNotifications.length} notifications
                    </span>
                    <div className="d-flex align-items-center gap-1">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        style={{ fontSize: "12px", borderRadius: "6px" }}
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        <i className="bi bi-chevron-left me-1"></i> Prev
                      </button>
                      {Array.from({ length: totalPages }).map((_, idx) => {
                        const pageNum = idx + 1;
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            className={`btn btn-sm ${page === pageNum ? "btn-primary" : "btn-outline-secondary"}`}
                            style={{ fontSize: "12px", minWidth: "30px", borderRadius: "6px" }}
                            onClick={() => setPage(pageNum)}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        style={{ fontSize: "12px", borderRadius: "6px" }}
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Next <i className="bi bi-chevron-right ms-1"></i>
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                emoji="🔔"
                title={notifications.length ? "No matching notifications" : "No notifications yet"}
                message={notifications.length ? "No notifications match this filter." : "You're all caught up! New alerts and updates will appear here."}
              />
            )}
          </section>
        </div>

        {/* Notification Preview & Email View Modal */}
        {previewNotification && (
          <div 
            className="modal fade show d-block" 
            tabIndex="-1" 
            style={{ backgroundColor: "rgba(0,0,0,0.55)", zIndex: 1060 }}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content shadow border-0" style={{ borderRadius: "14px", overflow: "hidden" }}>
                <div className="modal-header bg-light py-3 px-4 border-bottom d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <div className="btn-group p-1 bg-white rounded-pill border" role="group">
                      <button
                        type="button"
                        className={`btn btn-sm rounded-pill px-3 py-1 ${viewMode === "preview" ? "btn-primary text-white" : "btn-light text-secondary"}`}
                        style={{ fontSize: "12px", fontWeight: "600" }}
                        onClick={() => setViewMode("preview")}
                      >
                        <i className="bi bi-eye me-1"></i> Standard Preview
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm rounded-pill px-3 py-1 ${viewMode === "email" ? "btn-primary text-white" : "btn-light text-secondary"}`}
                        style={{ fontSize: "12px", fontWeight: "600" }}
                        onClick={() => setViewMode("email")}
                      >
                        <i className="bi bi-envelope-paper me-1"></i> Email View
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => setPreviewNotification(null)}
                  ></button>
                </div>

                <div className="modal-body p-4" style={{ maxHeight: "75vh", overflowY: "auto" }}>
                  {viewMode === "preview" ? (
                    <div className="notification-preview-content">
                      <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom flex-wrap gap-2">
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 rounded-pill" style={{ fontSize: "12px" }}>
                            <i className={`bi ${ICONS[previewNotification.category] || "bi-bell"} me-1`}></i>
                            {previewNotification.category || "General"}
                          </span>
                          {previewNotification.is_important && (
                            <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1 rounded-pill" style={{ fontSize: "12px" }}>
                              <i className="bi bi-star-fill me-1"></i> Important
                            </span>
                          )}
                          {!previewNotification.is_read && (
                            <span className="badge bg-info-subtle text-info-emphasis px-2 py-1 rounded-pill" style={{ fontSize: "12px" }}>
                              New
                            </span>
                          )}
                        </div>
                        <small className="text-muted">
                          <i className="bi bi-clock me-1"></i>
                          {formatDate(previewNotification.created_at)}
                        </small>
                      </div>

                      <div className="mb-4">
                        <h4 className="fw-bold mb-3 text-dark d-flex align-items-center gap-2">
                          <div 
                            className="rounded-circle bg-primary bg-opacity-10 text-primary d-inline-flex align-items-center justify-content-center flex-shrink-0" 
                            style={{ width: "40px", height: "40px", fontSize: "18px" }}
                          >
                            <i className={`bi ${ICONS[previewNotification.category] || "bi-bell"}`}></i>
                          </div>
                          {previewNotification.title}
                        </h4>
                        <div 
                          className="p-3 bg-light rounded-3 text-secondary lh-lg border"
                          style={{ fontSize: "14px", whiteSpace: "pre-wrap" }}
                        >
                          {previewNotification.message}
                        </div>
                      </div>

                      {previewNotification.action_url && (
                        <div className="mt-3 p-3 bg-white border rounded-3 d-flex align-items-center justify-content-between">
                          <div>
                            <small className="text-muted d-block fw-semibold">Action Required / Associated Link</small>
                            <span className="text-dark small text-break">{previewNotification.action_url}</span>
                          </div>
                          <a 
                            href={previewNotification.action_url} 
                            className="btn btn-sm btn-outline-primary rounded-pill px-3"
                            target="_blank" 
                            rel="noreferrer"
                          >
                            Open Link <i className="bi bi-box-arrow-up-right ms-1"></i>
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Email View */
                    <div className="notification-email-view border rounded-3 shadow-sm bg-white overflow-hidden">
                      <div className="bg-light p-3 border-bottom">
                        <div className="row g-2 text-muted small">
                          <div className="col-12 col-md-6">
                            <strong className="text-dark">From:</strong> HRMS Portal &lt;notifications@company.internal&gt;
                          </div>
                          <div className="col-12 col-md-6 text-md-end">
                            <strong className="text-dark">Date:</strong> {formatDate(previewNotification.created_at)}
                          </div>
                          <div className="col-12">
                            <strong className="text-dark">To:</strong> {employeeProfile?.email || currentUser?.email || "employee@company.internal"}
                          </div>
                          <div className="col-12">
                            <strong className="text-dark">Subject:</strong> [HRMS Notification] {previewNotification.title}
                          </div>
                        </div>
                      </div>

                      <div className="p-4" style={{ backgroundColor: "#fafbfc" }}>
                        <div className="bg-white p-4 rounded-3 border shadow-none" style={{ maxWidth: "680px", margin: "0 auto" }}>
                          <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom">
                            <div className="fw-bold text-primary fs-5 d-flex align-items-center gap-2">
                              <i className="bi bi-building"></i>
                              <span>Enterprise HRMS Portal</span>
                            </div>
                            <span className="badge bg-secondary-subtle text-secondary small px-2 py-1">
                              {previewNotification.category || "Notification"}
                            </span>
                          </div>

                          <p className="mb-3 text-dark fw-medium">
                            Dear {employeeProfile?.first_name || currentUser?.name || "Employee"},
                          </p>

                          <p className="text-secondary mb-3" style={{ fontSize: "14px", lineHeight: "1.6" }}>
                            You have received an official communication from the HRMS portal regarding <strong>{previewNotification.title}</strong>:
                          </p>

                          <div className="p-3 my-3 border-start border-4 border-primary bg-light rounded-end" style={{ fontSize: "14px", lineHeight: "1.7", color: "#334155" }}>
                            {previewNotification.message}
                          </div>

                          {previewNotification.action_url && (
                            <div className="my-4 text-center">
                              <a
                                href={previewNotification.action_url}
                                className="btn btn-primary px-4 py-2 rounded-pill fw-semibold"
                                style={{ fontSize: "13px" }}
                                target="_blank"
                                rel="noreferrer"
                              >
                                View Details in Portal <i className="bi bi-arrow-right ms-1"></i>
                              </a>
                            </div>
                          )}

                          <div className="mt-4 pt-3 border-top text-muted" style={{ fontSize: "13px", lineHeight: "1.5" }}>
                            <p className="mb-1">Best regards,</p>
                            <p className="fw-bold text-dark mb-0">Human Resources & Operations Team</p>
                            <p className="text-secondary small mb-0">Enterprise HRMS Portal | Automated Notification Service</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="modal-footer bg-light py-2 px-4 border-top d-flex justify-content-between flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => deleteNotification(previewNotification)}
                      disabled={busyId === previewNotification.id}
                    >
                      <i className="bi bi-trash me-1"></i> Delete
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => {
                        updateNotification(previewNotification, { is_archived: !previewNotification.is_archived });
                        setPreviewNotification((prev) => prev ? { ...prev, is_archived: !prev.is_archived } : null);
                      }}
                      disabled={busyId === previewNotification.id}
                    >
                      <i className={`bi ${previewNotification.is_archived ? "bi-arrow-counterclockwise" : "bi-archive"} me-1`}></i>
                      {previewNotification.is_archived ? "Restore" : "Archive"}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary px-3"
                    onClick={() => setPreviewNotification(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

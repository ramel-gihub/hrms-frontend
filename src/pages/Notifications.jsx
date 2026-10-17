import React, { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || (
  ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? "https://hrms-backend-fzef.onrender.com"
    : "https://hrms-backend-fzef.onrender.com"
);
const FILTERS = ["All Notifications", "Unread", "Important", "Archived"];
const CATEGORIES = ["Leave", "Attendance", "Requests", "Assets", "IT Access", "Documents", "HR Announcement", "Celebrations"];
const ICONS = {
  Leave: "bi-calendar-check",
  Attendance: "bi-clock-history",
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

  const loadNotifications = useCallback(async (signal, showLoading = false) => {
    if (!userId) {
      setError("Unable to identify your account. Please sign in again.");
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
        setError(loadError.message || "Unable to load notifications.");
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

  const visibleNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();
    return notifications.filter((notification) => {
      const archived = Boolean(notification.is_archived);
      if (activeFilter === "Archived" && !archived) return false;
      if (activeFilter !== "Archived" && archived) return false;
      if (activeFilter === "Unread" && notification.is_read) return false;
      if (activeFilter === "Important" && !notification.is_important) return false;
      if (activeCategory && notification.category !== activeCategory) return false;
      if (query && !`${notification.title} ${notification.message} ${notification.category}`.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [notifications, activeFilter, activeCategory, search]);

  const updateNotification = async (notification, update) => {
    setBusyId(notification.id);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/notifications/${notification.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...update })
      });
      const result = await readApiResponse(response);
      await loadNotifications();
    } catch (updateError) {
      setError(updateError.message || "Unable to update notification.");
    } finally {
      setBusyId(null);
    }
  };

  const markAllRead = async () => {
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/notifications/${encodeURIComponent(userId)}/read-all`, {
        method: "PATCH"
      });
      const result = await readApiResponse(response);
      await loadNotifications();
    } catch (updateError) {
      setError(updateError.message || "Unable to mark notifications as read.");
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

        {error && <div className="alert alert-danger" role="alert">{error}</div>}

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
            ) : visibleNotifications.length ? visibleNotifications.map((notification) => (
              <article key={notification.id} className={`en-notification ${notification.is_read ? "" : "unread"}`}>
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
                  {!notification.is_archived && (
                    <button type="button" className="en-action-btn" title={notification.is_read ? "Mark unread" : "Mark read"} aria-label={notification.is_read ? "Mark unread" : "Mark read"} disabled={busyId === notification.id} onClick={() => updateNotification(notification, { is_read: !notification.is_read })}>
                      <i className={`bi ${notification.is_read ? "bi-envelope" : "bi-envelope-open"}`}></i>
                    </button>
                  )}
                  <button type="button" className="en-action-btn" title={notification.is_archived ? "Restore" : "Archive"} aria-label={notification.is_archived ? "Restore notification" : "Archive notification"} disabled={busyId === notification.id} onClick={() => updateNotification(notification, { is_archived: !notification.is_archived })}>
                    <i className={`bi ${notification.is_archived ? "bi-arrow-counterclockwise" : "bi-archive"}`}></i>
                  </button>
                </div>
              </article>
            )) : (
              <div className="en-empty-state">
                <div className="en-empty-icon"><i className="bi bi-bell-slash"></i></div>
                <h4>{notifications.length ? "No notifications match this filter." : "No notifications yet."}</h4>
                <p>New request activity and status updates will appear here.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

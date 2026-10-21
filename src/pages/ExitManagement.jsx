import React, { useEffect, useState, useCallback } from "react";
import { jsPDF } from "jspdf";

const API_BASE = import.meta.env.VITE_API_URL || "https://hrms-backend-5xo8.onrender.com";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_MS = 24 * 60 * 60 * 1000;

const fmt = (d) => {
  if (!d) return "—";
  const [y, m, day] = String(d).slice(0, 10).split("-");
  return `${day} ${MONTHS[Number(m) - 1]} ${y}`;
};
const toISO = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const parse = (s) => {
  const [y, m, d] = String(s).slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (s, n) => {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return toISO(d);
};
const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function ExitManagement({ currentUser, employeeProfile, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alertBanner, setAlertBanner] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [interviewModal, setInterviewModal] = useState({ open: false, date: "" });
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({ resignationDate: toISO(new Date()), noticePeriod: 60, reason: "", comments: "", confirm: false });

  const userId = currentUser?.id || employeeProfile?.user_id;

  const showAlert = (type, message) => {
    setAlertBanner({ type, message });
    setToast({ type: type === "danger" ? "error" : type, text: message });
  };

  const downloadResignationAcceptance = () => {
    if (data?.resignation?.status !== "Approved") {
      setToast({ type: "error", text: "The resignation acceptance letter is available after approval." });
      return;
    }

    try {
      const { employee, resignation } = data;
      const doc = new jsPDF();
      const companyName = employee.company_name || "Company";
      const employeeName = [employee.first_name, employee.last_name].filter(Boolean).join(" ") || "Employee";
      const left = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const contentWidth = pageWidth - left * 2;
      let y = 25;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(companyName, left, y);
      y += 16;
      doc.setFontSize(18);
      doc.text("Resignation Acceptance", left, y);
      y += 13;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`Date of approval: ${resignation.reviewed_at ? fmt(resignation.reviewed_at) : "Not recorded"}`, left, y);
      y += 10;
      doc.text(`Employee: ${employeeName}`, left, y);
      y += 7;
      doc.text(`Employee ID: ${employee.employee_code || "Not recorded"}`, left, y);
      y += 7;
      doc.text(`Department: ${employee.department || "Not recorded"}`, left, y);
      y += 7;
      doc.text(`Designation: ${employee.designation || "Not recorded"}`, left, y);
      y += 14;

      const body = `Dear ${employeeName},\n\nThis letter confirms that your resignation submitted on ${fmt(resignation.resignation_date)} has been approved. Your recorded last working day is ${fmt(resignation.last_working_day)}.\n\nWe appreciate your contributions to ${companyName} and wish you success in your future endeavors.`;
      const lines = doc.splitTextToSize(body, contentWidth);
      doc.text(lines, left, y);
      y += lines.length * 6 + 14;
      doc.text("Sincerely,", left, y);
      y += 7;
      doc.setFont("helvetica", "bold");
      doc.text("Human Resources", left, y);

      const employeeId = String(employee.employee_code || employee.employee_id).replace(/[^a-zA-Z0-9_-]/g, "-");
      doc.save(`resignation-acceptance-${employeeId}.pdf`);
      setToast({ type: "success", text: "Resignation acceptance PDF downloaded." });
    } catch (e) {
      console.error("Resignation acceptance PDF error:", e);
      setToast({ type: "error", text: "Unable to generate the resignation acceptance PDF." });
    }
  };

  const load = useCallback(async (signal) => {
    setData(null);
    setLoading(true);
    setError("");
    if (!userId) {
      setError("Unable to load exit details for this user.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/exit/${userId}`, { signal });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setData(json);
      setError("");
    } catch (e) {
      if (e.name !== "AbortError") setError(e.message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const call = async (url, method, body) => {
    const res = await fetch(`${API_BASE}${url}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...body }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Request failed");
    setData(json);
    return json;
  };

  const run = async (url, method, body, message) => {
    try {
      await call(url, method, body);
      showAlert("success", message);
    } catch (e) {
      showAlert("danger", e.message);
    }
  };

  const openSubmit = () => {
    setEditing(false);
    setFormError("");
    const noticePeriods = data?.options?.noticePeriods || [];
    const noticePeriod = noticePeriods.includes(60) ? 60 : (noticePeriods[0] ?? "");
    setForm({ resignationDate: toISO(new Date()), noticePeriod, reason: "", comments: "", confirm: false });
    setShowModal(true);
  };

  const openEdit = () => {
    const r = data.resignation;
    setEditing(true);
    setFormError("");
    setForm({ resignationDate: r.resignation_date, noticePeriod: r.notice_period_days, reason: r.reason || "", comments: r.comments || "", confirm: true });
    setShowModal(true);
  };

  const calcLastDay = form.resignationDate ? addDays(form.resignationDate, Number(form.noticePeriod) - 1) : "";

  const submit = async () => {
    if (!form.resignationDate) return setFormError("Please select a resignation date.");
    if (!form.reason) return setFormError("Please select a reason for leaving.");
    if (!form.confirm) return setFormError("Please confirm that you understand the exit process.");
    setSaving(true);
    setFormError("");
    try {
      const payload = { resignationDate: form.resignationDate, noticePeriod: Number(form.noticePeriod), reason: form.reason, comments: form.comments };
      if (editing) await call(`/api/exit/${data.resignation.id}`, "PUT", payload);
      else await call("/api/exit/resign", "POST", payload);
      setShowModal(false);
      showAlert("success", editing ? "Resignation updated successfully." : "Your resignation has been submitted.");
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmWithdraw = () => {
    setConfirmDialog({
      title: "Withdraw Resignation?",
      message: "Are you sure you want to withdraw your resignation? This will cancel your ongoing exit process.",
      confirmLabel: "Yes, Withdraw",
      cancelLabel: "Cancel",
      onConfirm: async () => {
        setConfirmDialog(null);
        await run(`/api/exit/${data.resignation.id}/withdraw`, "POST", {}, "Your resignation has been withdrawn.");
      },
    });
  };

  const openScheduleInterviewModal = () => {
    const defaultDate = data?.resignation?.exit_interview_date
      ? toISO(new Date(data.resignation.exit_interview_date))
      : addDays(toISO(new Date()), 1);
    setInterviewModal({ open: true, date: defaultDate });
  };

  const confirmScheduleInterview = async () => {
    if (!interviewModal.date) return;
    const dateVal = interviewModal.date;
    setInterviewModal({ open: false, date: "" });
    await run(`/api/exit/${data.resignation.id}/interview`, "POST", { date: dateVal }, "Exit interview scheduled.");
  };

  const confirmChecklistAction = (itemKey, title) => {
    setConfirmDialog({
      title: `Mark ${title} as Completed?`,
      message: `Do you want to confirm that "${title}" has been completed?`,
      confirmLabel: "Yes, Mark Completed",
      cancelLabel: "Cancel",
      onConfirm: async () => {
        setConfirmDialog(null);
        await run(`/api/exit/${data.resignation.id}/checklist/${itemKey}`, "POST", {}, `${title} marked as completed.`);
      },
    });
  };

  if (loading) return <div className="px-0 px-md-5 employee-dashboard"><div className="employee-exit-page"><p>Loading…</p></div></div>;
  if (error && !data) return <div className="px-0 px-md-5 employee-dashboard"><div className="employee-exit-page"><p role="alert">{error}</p><button className="exit-outline-btn" onClick={() => load()}>Retry</button></div></div>;

  const { employee, resignation, settlement, pendingAssets, hr } = data;
  const name = [employee.first_name, employee.last_name].filter(Boolean).join(" ") || currentUser?.email || "";
  const initials = (n) => n.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const noticePeriods = data.options?.noticePeriods || [];

  let timeline = [], checklist = [], completedCount = 0, percent = 0, remaining = 0, elapsedPct = 0, active = false;

  if (resignation) {
    active = ["Submitted", "Approved"].includes(resignation.status);
    const exitItems = data.checklist || [];
    const assetsDone = (pendingAssets || []).length === 0;
    const isDone = (item) => item.item_key === "asset_return"
      ? assetsDone
      : item.status === "Completed";
    const approved = resignation.status === "Approved";
    const rejected = resignation.status === "Rejected";
    const settled = settlement?.status === "Paid";

    timeline = [
      { t: "Resignation Submitted", d: resignation.submitted_on, p: "Your resignation request has been submitted successfully.", done: true },
      { t: "Manager Approval", d: approved ? resignation.reviewed_at : rejected ? "Rejected" : "Pending",
        p: rejected ? (resignation.admin_remarks || "Your resignation was not approved.") : approved ? (resignation.admin_remarks || "Resignation approved by HR.") : "Waiting for your manager and HR to review.", done: approved },
      ...exitItems.map((item) => ({
        t: item.title,
        d: isDone(item) ? item.completed_at || "Completed"
          : item.item_key === "exit_interview" && resignation.exit_interview_date
            ? `Scheduled ${fmt(resignation.exit_interview_date)}`
            : item.item_key === "asset_return" && !assetsDone
              ? `${pendingAssets.length} asset${pendingAssets.length === 1 ? "" : "s"} pending`
              : item.status || "Pending",
        p: item.description || "",
        done: isDone(item),
      })),
      { t: "Final Settlement & Documents", d: settled ? "Completed" : settlement?.status || "Pending", p: "Receive final settlement and exit documentation.", done: settled },
    ];
    let currentSet = false;
    timeline = timeline.map((s) => {
      const state = s.done ? "completed" : !currentSet && !rejected ? (currentSet = true, "current") : "";
      return { ...s, state };
    });
    completedCount = timeline.filter((s) => s.done).length;
    percent = Math.round((completedCount / timeline.length) * 100);

    checklist = exitItems.map((i) => {
        const itemDone = isDone(i);
        if (i.item_key === "asset_return") {
          return { key: i.item_key, title: i.title, done: itemDone,
            sub: itemDone ? (i.completed_at ? `Completed on ${fmt(i.completed_at)}` : "All assets returned")
              : assetsDone ? i.description : `${pendingAssets.length} asset${pendingAssets.length > 1 ? "s" : ""} pending: ${pendingAssets.map((a) => a.asset_name).join(", ")}`,
            action: assetsDone ? null : { label: "View Assets", fn: () => onNavigate && onNavigate("assets") } };
        }
        return { key: i.item_key, title: i.title, done: itemDone,
          sub: itemDone ? `Completed on ${fmt(i.completed_at)}` : i.description,
          action: i.employee_can_complete && !itemDone && active
            ? { label: "Mark Done", fn: () => confirmChecklistAction(i.item_key, i.title) } : null };
      });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const lwd = parse(resignation.last_working_day);
    remaining = Math.max(0, Math.ceil((lwd - today) / DAY_MS));
    const total = Math.max(1, Math.ceil((lwd - parse(resignation.resignation_date)) / DAY_MS));
    elapsedPct = Math.min(100, Math.max(0, Math.round(((total - remaining) / total) * 100)));
  }

  const statusLabel = !resignation ? "" : resignation.status === "Submitted" ? "Pending Approval" : resignation.status === "Approved" ? "Notice Period" : resignation.status;
  const statusText = !resignation ? "" : resignation.status === "Submitted" ? "Your resignation is awaiting approval"
    : resignation.status === "Approved" ? "Your resignation is currently under notice period"
    : resignation.status === "Rejected" ? "Your resignation was not approved" : "Your resignation is closed";

  const total = settlement ? Number(settlement.pending_salary) + Number(settlement.leave_encashment) + Number(settlement.reimbursements) - Number(settlement.recoveries) : 0;
  const lwdDate = resignation ? parse(resignation.last_working_day) : null;
  const allCleared = Boolean(resignation?.status === "Approved" && checklist.length > 0 && checklist.every((item) => item.done));
  const docs = resignation ? [
    { t: "Resignation Acceptance", icon: "bi-file-earmark-text", ok: resignation.status === "Approved", on: "PDF · Available", off: "Available after approval" },
    { t: "Experience Letter", icon: "bi-file-earmark-check", ok: allCleared, on: "PDF · Available", off: "Available after exit" },
    { t: "Relieving Letter", icon: "bi-file-earmark-medical", ok: allCleared, on: "PDF · Available", off: "Available after clearance" },
  ] : [];

  return (
    <>
      <div className="px-0 px-md-5 employee-dashboard">
        <div className="employee-exit-page">
          <div className="exit-page-header">
            <div>
              <h1>Resignation &amp; Exit</h1>
              <p>Manage your resignation, notice period, handover, clearance and final settlement in one place.</p>
            </div>
            {!active && (
              <button className="exit-primary-btn" onClick={openSubmit}>
                <i className="bi bi-send"></i> Submit Resignation
              </button>
            )}
          </div>

          {alertBanner && (
            <div
              className={`alert alert-${alertBanner.type || "info"} alert-dismissible fade show mb-4`}
              role="alert"
              style={{
                borderRadius: "14px",
                border: "0",
                boxShadow: "0 6px 20px rgba(31, 35, 69, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 18px",
              }}
            >
              <div className="d-flex align-items-center gap-2">
                <i
                  className={`bi ${
                    alertBanner.type === "success"
                      ? "bi-check-circle-fill text-success"
                      : alertBanner.type === "danger"
                      ? "bi-exclamation-triangle-fill text-danger"
                      : "bi-info-circle-fill text-primary"
                  } fs-5`}
                ></i>
                <span style={{ fontWeight: 600, fontSize: "14px" }}>{alertBanner.message}</span>
              </div>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setAlertBanner(null)}
                style={{ position: "static", padding: "0.25rem 0.5rem" }}
              ></button>
            </div>
          )}

          {!resignation ? (
            <div className="exit-card" style={{ textAlign: "center", padding: "48px 24px" }}>
              <h3>No active resignation</h3>
              <p>You have not submitted a resignation. If you wish to leave the organisation, use the Submit Resignation button.</p>
              <div className="exit-detail-list" style={{ maxWidth: 420, margin: "16px auto 0", textAlign: "left" }}>
                <div><span>Employee</span><strong>{name}</strong></div>
                <div><span>Employee ID</span><strong>{employee.employee_code}</strong></div>
                <div><span>Designation</span><strong>{employee.designation || "—"}</strong></div>
                <div><span>Department</span><strong>{employee.department || "—"}</strong></div>
              </div>
            </div>
          ) : (
            <>
              <div className="exit-status-banner">
                <div className="exit-status-icon"><i className="bi bi-hourglass-split"></i></div>
                <div className="exit-status-content">
                  <div className="exit-status-top">
                    <span className="exit-status-label">Current Exit Status</span>
                    <span className="exit-status-badge">{statusLabel}</span>
                  </div>
                  <h3>{statusText}</h3>
                  <p>
                    Your planned last working day is <strong>{fmt(resignation.last_working_day)}</strong>.
                    {resignation.status === "Rejected" && resignation.admin_remarks ? ` Remarks: ${resignation.admin_remarks}` : " Please complete all required exit activities before your last day."}
                  </p>
                </div>
                <div className="exit-status-date">
                  <span>Remaining</span>
                  <strong>{remaining}</strong>
                  <small>Days</small>
                </div>
              </div>

              <div className="exit-overview-grid">
                <div className="exit-overview-card">
                  <div className="exit-overview-icon purple"><i className="bi bi-calendar-event"></i></div>
                  <div><span>Resignation Date</span><strong>{fmt(resignation.resignation_date)}</strong><small>Submitted by employee</small></div>
                </div>
                <div className="exit-overview-card">
                  <div className="exit-overview-icon blue"><i className="bi bi-calendar-check"></i></div>
                  <div><span>Last Working Day</span><strong>{fmt(resignation.last_working_day)}</strong><small>Based on notice period</small></div>
                </div>
                <div className="exit-overview-card">
                  <div className="exit-overview-icon orange"><i className="bi bi-clock-history"></i></div>
                  <div><span>Notice Period</span><strong>{resignation.notice_period_days} Days</strong><small>Selected notice period</small></div>
                </div>
                <div className="exit-overview-card">
                  <div className="exit-overview-icon green"><i className="bi bi-check2-circle"></i></div>
                  <div><span>Exit Progress</span><strong>{percent}%</strong><small>{completedCount} of {timeline.length} activities completed</small></div>
                </div>
              </div>

              <div className="exit-main-layout">
                <div className="exit-main-column">
                  <section className="exit-card exit-progress-card">
                    <div className="exit-card-header">
                      <div>
                        <span className="exit-section-label">EXIT JOURNEY</span>
                        <h2>Exit Progress</h2>
                        <p>Track everything that needs to be completed before your last working day.</p>
                      </div>
                      <span className="exit-progress-percent">{percent}%</span>
                    </div>
                    <div className="exit-progress-track"><div className="exit-progress-fill" style={{ width: `${percent}%` }}></div></div>
                    <div className="exit-progress-meta">
                      <span>{completedCount} completed</span>
                      <span>{timeline.length - completedCount} remaining</span>
                    </div>
                    <div className="exit-timeline">
                      {timeline.map((s, index) => (
                        <div key={`${s.t}-${index}`} className={`exit-timeline-item ${s.state}`}>
                          <div className="exit-timeline-marker">
                            <i className={`bi ${s.state === "completed" ? "bi-check-lg" : s.state === "current" ? "bi-arrow-right" : "bi-circle"}`}></i>
                          </div>
                          <div className="exit-timeline-content">
                            <strong>{s.t}</strong>
                            <span>{/^\d{4}-/.test(s.d) ? fmt(s.d) : s.d}</span>
                            <p>{s.p}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="exit-card">
                    <div className="exit-card-header">
                      <div>
                        <span className="exit-section-label">CLEARANCE</span>
                        <h2>Exit Checklist</h2>
                        <p>Complete the required activities before your last working day.</p>
                      </div>
                    </div>
                    <div className="exit-checklist">
                      {checklist.map((c) => (
                        <div key={c.key} className={`exit-check-item ${c.done ? "completed" : ""}`}>
                          <div className={`exit-check-icon ${c.done ? "" : "pending"}`}>
                            <i className={`bi ${c.done ? "bi-check-lg" : "bi-arrow-right"}`}></i>
                          </div>
                          <div className="exit-check-content">
                            <strong>{c.title}</strong>
                            <span>{c.sub}</span>
                          </div>
                          {c.done ? <span className="exit-check-status completed">Completed</span>
                            : c.action ? <button className="exit-action-link" onClick={c.action.fn}>{c.action.label}</button>
                            : <span className="exit-pending-badge">Pending HR</span>}
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="exit-card">
                    <div className="exit-card-header">
                      <div>
                        <span className="exit-section-label">FINANCE</span>
                        <h2>Full &amp; Final Settlement</h2>
                        <p>Overview of items considered during your final settlement.</p>
                      </div>
                      <span className="exit-pending-badge"><i className="bi bi-hourglass-split"></i> {settlement?.status || "Pending"}</span>
                    </div>
                    <div className="exit-settlement-grid">
                      <div className="exit-settlement-item"><span>Pending Salary</span><strong>{money(settlement?.pending_salary)}</strong><small>Final payroll cycle</small></div>
                      <div className="exit-settlement-item"><span>Leave Encashment</span><strong>{money(settlement?.leave_encashment)}</strong><small>Based on eligible leave</small></div>
                      <div className="exit-settlement-item"><span>Reimbursements</span><strong>{money(settlement?.reimbursements)}</strong><small>Approved claims</small></div>
                      <div className="exit-settlement-item deduction"><span>Recoveries</span><strong>{money(settlement?.recoveries)}</strong><small>{Number(settlement?.recoveries) ? "Deducted from settlement" : "No recovery currently recorded"}</small></div>
                    </div>
                    <div className="exit-settlement-total">
                      <div>
                        <span>Estimated Final Settlement</span>
                        <small>Subject to final HR &amp; Finance verification</small>
                      </div>
                      <strong>{money(total)}</strong>
                    </div>
                  </section>

                  <section className="exit-card">
                    <div className="exit-card-header">
                      <div>
                        <span className="exit-section-label">DOCUMENTS</span>
                        <h2>Exit Documents</h2>
                        <p>Documents that will be provided as part of your exit process.</p>
                      </div>
                    </div>
                    <div className="exit-document-grid">
                      {docs.map((d) => (
                        <div key={d.t} className={`exit-document-item ${d.ok ? "available" : "pending"}`}>
                          <div className="exit-document-icon"><i className={`bi ${d.icon}`}></i></div>
                          <div><strong>{d.t}</strong><span>{d.ok ? d.on : d.off}</span></div>
                          {d.ok ? (
                            <button className="exit-document-action" onClick={d.t === "Resignation Acceptance" ? downloadResignationAcceptance : () => setToast({ type: "success", text: "Document download started." })} aria-label={`Download ${d.t}`}><i className="bi bi-download"></i></button>
                          ) : (
                            <button className="exit-document-action disabled" disabled><i className="bi bi-lock"></i></button>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <aside className="exit-side-column">
                  <div className="exit-card exit-countdown-card">
                    <span className="exit-section-label">LAST WORKING DAY</span>
                    <div className="exit-countdown-date">
                      <strong>{String(lwdDate.getDate()).padStart(2, "0")}</strong>
                      <div><span>{MONTHS[lwdDate.getMonth()]}</span><small>{lwdDate.getFullYear()}</small></div>
                    </div>
                    <div className="exit-countdown-days"><strong>{remaining}</strong><span>days remaining</span></div>
                    <div className="exit-countdown-progress"><div className="exit-countdown-fill" style={{ width: `${elapsedPct}%` }}></div></div>
                    <p>Keep your exit activities on track to ensure a smooth transition.</p>
                  </div>

                  <div className="exit-card">
                    <div className="exit-side-title">
                      <div>
                        <span className="exit-section-label">RESIGNATION</span>
                        <h3>Details</h3>
                      </div>
                      {resignation.status === "Submitted" && (
                        <button className="exit-icon-btn" title="Edit resignation" onClick={openEdit}><i className="bi bi-pencil"></i></button>
                      )}
                    </div>
                    <div className="exit-detail-list">
                      <div><span>Employee</span><strong>{name}</strong></div>
                      <div><span>Employee ID</span><strong>{employee.employee_code}</strong></div>
                      <div><span>Designation</span><strong>{employee.designation || "—"}</strong></div>
                      <div><span>Department</span><strong>{employee.department || "—"}</strong></div>
                      <div><span>Resignation Date</span><strong>{fmt(resignation.resignation_date)}</strong></div>
                      <div><span>Notice Period</span><strong>{resignation.notice_period_days} Days</strong></div>
                      <div><span>Last Working Day</span><strong>{fmt(resignation.last_working_day)}</strong></div>
                      <div><span>Reason</span><strong>{resignation.reason || "—"}</strong></div>
                    </div>
                    {active && (
                      <button className="exit-outline-btn full-width" style={{ marginTop: 16 }} onClick={confirmWithdraw}>
                        <i className="bi bi-arrow-counterclockwise"></i> Withdraw Resignation
                      </button>
                    )}
                  </div>

                  {active && (
                    <div className="exit-card exit-interview-card">
                      <div className="exit-interview-icon"><i className="bi bi-chat-square-heart"></i></div>
                      <h3>Exit Interview</h3>
                      <p>Share your experience and feedback with the HR team before your final working day.</p>
                      {resignation.exit_interview_date && <p><strong>Scheduled: {fmt(resignation.exit_interview_date)}</strong></p>}
                      <button className="exit-outline-btn full-width" onClick={openScheduleInterviewModal}>
                        <i className="bi bi-calendar2-check"></i> {resignation.exit_interview_date ? "Reschedule Interview" : "Schedule Interview"}
                      </button>
                    </div>
                  )}

                  <div className="exit-card exit-contact-card">
                    <span className="exit-section-label">NEED HELP?</span>
                    <h3>Contact HR</h3>
                    <p>Have questions about your notice period, clearance or final settlement?</p>
                    {hr && (
                      <div className="exit-contact-person">
                        <div className="exit-contact-avatar">{initials([hr.first_name, hr.last_name].filter(Boolean).join(" ") || "HR")}</div>
                        <div><strong>{[hr.first_name, hr.last_name].filter(Boolean).join(" ")}</strong><span>{hr.role_name}</span></div>
                      </div>
                    )}
                  </div>
                </aside>
              </div>
            </>
          )}

          <div className={`exit-modal-overlay ${showModal ? "show" : ""}`}>
            <div className="exit-modal">
              <div className="exit-modal-header">
                <div>
                  <span className="exit-section-label">EMPLOYEE EXIT</span>
                  <h2>{editing ? "Edit Resignation" : "Submit Resignation"}</h2>
                </div>
                <button className="exit-modal-close" onClick={() => setShowModal(false)}><i className="bi bi-x-lg"></i></button>
              </div>
              <div className="exit-modal-body">
                <div className="exit-warning-box">
                  <i className="bi bi-info-circle"></i>
                  <p>Once submitted, your resignation will be sent to your reporting manager and HR for review.</p>
                </div>
                <div className="exit-form-grid">
                  <div className="exit-form-group">
                    <label>Resignation Date</label>
                    <input type="date" value={form.resignationDate} onChange={(e) => setForm({ ...form, resignationDate: e.target.value })} />
                  </div>
                  <div className="exit-form-group">
                    <label>Notice Period</label>
                    <select value={form.noticePeriod} onChange={(e) => setForm({ ...form, noticePeriod: Number(e.target.value) })}>
                      {noticePeriods.map((n) => <option key={n} value={n}>{n} Days</option>)}
                    </select>
                  </div>
                  <div className="exit-form-group">
                    <label>Calculated Last Working Day</label>
                    <div className="exit-calculated-field">
                      <i className="bi bi-calendar-check"></i>
                      <strong>{calcLastDay ? fmt(calcLastDay) : "—"}</strong>
                    </div>
                  </div>
                  <div className="exit-form-group">
                    <label>Reason for Leaving</label>
                    <input type="text" maxLength={100} value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                      placeholder="Enter your reason for leaving" />
                  </div>
                  <div className="exit-form-group full">
                    <label>Additional Comments</label>
                    <textarea rows="4" value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })}
                      placeholder="Add any additional information for your manager or HR..."></textarea>
                  </div>
                  <div className="exit-form-group full">
                    <label className="exit-checkbox-label">
                      <input type="checkbox" checked={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.checked })} />
                      <span>I understand that submitting my resignation will initiate the employee exit process and notice period.</span>
                    </label>
                  </div>
                  {formError && <div className="exit-form-group full" style={{ color: "#dc2626" }}>{formError}</div>}
                </div>
              </div>
              <div className="exit-modal-footer">
                <button className="exit-secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="exit-primary-btn" onClick={submit} disabled={saving}>
                  <i className="bi bi-send"></i> {saving ? "Saving…" : editing ? "Save Changes" : "Submit Resignation"}
                </button>
              </div>
            </div>
          </div>

          <div className={`exit-modal-overlay ${interviewModal.open ? "show" : ""}`} style={{ zIndex: 10001 }}>
            <div className="exit-modal" style={{ maxWidth: 460 }}>
              <div className="exit-modal-header">
                <div>
                  <span className="exit-section-label">EXIT PROCESS</span>
                  <h2>{data?.resignation?.exit_interview_date ? "Reschedule Exit Interview" : "Schedule Exit Interview"}</h2>
                </div>
                <button className="exit-modal-close" onClick={() => setInterviewModal({ open: false, date: "" })}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              <div className="exit-modal-body">
                <p style={{ color: "#5f6174", fontSize: "14px", marginBottom: "16px" }}>
                  Please choose your preferred date for the HR exit interview.
                </p>
                <div className="exit-form-group">
                  <label>Preferred Date</label>
                  <input
                    type="date"
                    min={toISO(new Date())}
                    value={interviewModal.date}
                    onChange={(e) => setInterviewModal((prev) => ({ ...prev, date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="exit-modal-footer">
                <button className="exit-secondary-btn" onClick={() => setInterviewModal({ open: false, date: "" })}>
                  Cancel
                </button>
                <button
                  className="exit-primary-btn"
                  onClick={confirmScheduleInterview}
                  disabled={!interviewModal.date}
                >
                  <i className="bi bi-calendar2-check"></i> Confirm Date
                </button>
              </div>
            </div>
          </div>

          <div className={`exit-modal-overlay ${confirmDialog ? "show" : ""}`} style={{ zIndex: 10002 }}>
            <div className="exit-modal" style={{ maxWidth: 440 }}>
              <div className="exit-modal-header">
                <div>
                  <span className="exit-section-label" style={{ color: "#e75b5b" }}>CONFIRMATION</span>
                  <h2 style={{ fontSize: "19px" }}>{confirmDialog?.title || "Are you sure?"}</h2>
                </div>
                <button className="exit-modal-close" onClick={() => setConfirmDialog(null)}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              <div className="exit-modal-body">
                <p style={{ margin: 0, color: "#47495b", fontSize: "14px", lineHeight: "1.5" }}>
                  {confirmDialog?.message}
                </p>
              </div>
              <div className="exit-modal-footer" style={{ gap: "10px" }}>
                <button className="exit-secondary-btn" onClick={() => setConfirmDialog(null)}>
                  {confirmDialog?.cancelLabel || "Cancel"}
                </button>
                <button
                  className="exit-primary-btn"
                  style={{ background: "#e75b5b", borderColor: "#e75b5b" }}
                  onClick={() => confirmDialog?.onConfirm && confirmDialog.onConfirm()}
                >
                  {confirmDialog?.confirmLabel || "Yes, Proceed"}
                </button>
              </div>
            </div>
          </div>

          <div className={`exit-toast ${toast ? "show" : ""} ${toast?.type === "error" ? "error" : ""}`}>
            <div className="exit-toast-icon"><i className={`bi ${toast?.type === "error" ? "bi-exclamation-lg" : "bi-check-lg"}`}></i></div>
            <div><strong>{toast?.type === "error" ? "Action failed" : "Action completed"}</strong><span>{toast?.text}</span></div>
            <button onClick={() => setToast(null)}><i className="bi bi-x"></i></button>
          </div>
        </div>
      </div>
    </>
  );
}
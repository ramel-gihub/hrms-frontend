import React, { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "https://hrms-backend-f2ef.onrender.com";

const TYPE_META = {
  laptop: { icon: "bi-laptop", cls: "laptop", label: "Laptop" },
  monitor: { icon: "bi-display", cls: "monitor", label: "Monitor" },
  mobile: { icon: "bi-phone", cls: "mobile", label: "Mobile" },
  keyboard: { icon: "bi-keyboard", cls: "accessory", label: "Keyboard" },
  mouse: { icon: "bi-mouse", cls: "accessory", label: "Mouse" },
  headset: { icon: "bi-headset", cls: "accessory", label: "Headset" },
  "access-card": { icon: "bi-person-vcard", cls: "accessory", label: "Access Card" },
  "security-token": { icon: "bi-shield-lock", cls: "accessory", label: "Security Token" },
};
const metaFor = (type) => TYPE_META[type] || { icon: "bi-box-seam", cls: "accessory", label: "Other Equipment" };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = (d) => {
  if (!d) return "—";
  const [y, m, day] = String(d).slice(0, 10).split("-");
  return `${day}-${MONTHS[Number(m) - 1]}-${y}`;
};
const fmtTimeline = (d) => (d ? fmtDate(d).replace(/-/g, " ") : "—");
const statusClass = (s) => (s === "Returned" ? "returned" : s === "Under Maintenance" || s === "Return Requested" ? "maintenance" : "assigned");
const typeLine = (a) => [metaFor(a.asset_type).label, a.manufacturer, a.model].filter(Boolean).join(" · ");
const dayMs = 24 * 60 * 60 * 1000;
const STATUS_FILTER_LABELS = {
  assets: "Assigned Assets",
  total: "Total Assets",
  active: "Active Assets",
  returned: "Returned Assets",
  maintenance: "Under Maintenance",
};

export default function Assets({ currentUser, employeeProfile, embedded = false }) {
  const user = currentUser || (employeeProfile?.user_id ? { id: employeeProfile.user_id, email: employeeProfile.email } : null);
  const [data, setData] = useState({ employee: null, assets: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("assets");
  const [selectedId, setSelectedId] = useState(null);
  const [returnAsset, setReturnAsset] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const emptyReturn = { returnDate: new Date().toISOString().slice(0, 10), condition: "Good", returnedTo: "IT Admin", remarks: "" };
  const [returnForm, setReturnForm] = useState(emptyReturn);
  const [returning, setReturning] = useState(false);
  const [requests, setRequests] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);
  const emptyForm = { assetType: "", priority: "", preferredModel: "", dateNeeded: "", justification: "", workLocation: "", additionalRequirements: "" };
  const [form, setForm] = useState(emptyForm);
  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    const close = () => setOpenMenuId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const openReturn = (a) => {
    setOpenMenuId(null);
    setSelectedId(a.id);
    setReturnForm(emptyReturn);
    setReturnAsset(a);
  };

  const submitReturn = async (e) => {
    e.preventDefault();
    setReturning(true);
    try {
      const res = await fetch(`${API_BASE}/api/assets/${returnAsset.id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, ...returnForm }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Return failed");
      const updated = result.asset;
      setData((d) => ({ ...d, assets: d.assets.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)) }));
      setNotice({ type: "success", text: `${returnAsset.asset_name} return has been submitted for confirmation.` });
      setReturnAsset(null);
    } catch (err) {
      setNotice({ type: "danger", text: err.message });
    } finally {
      setReturning(false);
    }
  };

  const loadRequests = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/api/assets/requests/${user.id}`);
      const result = await res.json();
      if (res.ok) setRequests(result.requests);
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => { loadRequests(); }, [user?.id]);

  const submitRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/assets/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, ...form }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Request failed");
      const modalEl = document.getElementById("eaAssignAssetModal");
    window.bootstrap?.Modal.getOrCreateInstance(modalEl)?.hide();
      setForm(emptyForm);
      setNotice({ type: "success", text: `Request ${result.request.request_code} submitted. It is now pending admin review.` });
      loadRequests();
    } catch (err) {
      setNotice({ type: "danger", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/assets/${user.id}`);
        const result = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(result.error || "Unable to load assets");
          setData({ employee: null, assets: [] });
        } else {
          setError("");
          setData(result);
          setSelectedId(result.assets.find((a) => a.status !== "Returned")?.id ?? null);
        }
      } catch (err) {
        if (!cancelled) setError("Unable to reach the server");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const { employee, assets } = data;
  const fullName = employee ? `${employee.first_name || ""} ${employee.last_name || ""}`.trim() || user?.email : user?.email || "";
  const initials = fullName.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");

  const total = assets.length;
  const activeCount = assets.filter((a) => a.status === "Assigned").length;
  const returnedCount = assets.filter((a) => a.status === "Returned").length;
  const maintenanceCount = assets.filter((a) => a.status === "Under Maintenance").length;

  const q = search.toLowerCase().trim();
  const filtered = assets.filter((a) => {
    const matchesStatus =
      statusFilter === "total" ||
      (statusFilter === "assets" && a.status !== "Returned") ||
      (statusFilter === "active" && a.status === "Assigned") ||
      (statusFilter === "returned" && a.status === "Returned") ||
      (statusFilter === "maintenance" && a.status === "Under Maintenance");
    const text = `${a.asset_tag} ${a.asset_name} ${a.serial_number || ""} ${a.asset_type}`.toLowerCase();
    return matchesStatus && text.includes(q);
  });

  const selected = filtered.find((a) => a.id === selectedId) || filtered[0] || null;
  const sMeta = selected ? metaFor(selected.asset_type) : null;

  let warrantyTitle = "No warranty information";
  let warrantyText = "Warranty details are not available for this asset.";
  let warrantyRemaining = "—";
  let warrantyPct = 0;
  if (selected?.warranty_expiry) {
    const expiry = new Date(String(selected.warranty_expiry).slice(0, 10));
    const start = selected.purchase_date ? new Date(String(selected.purchase_date).slice(0, 10)) : null;
    const now = new Date();
    const monthsLeft = (expiry.getFullYear() - now.getFullYear()) * 12 + (expiry.getMonth() - now.getMonth());
    const expiryLabel = `${MONTHS[expiry.getMonth()]} ${expiry.getFullYear()}`;
    if (expiry < now) {
      warrantyTitle = `Expired in ${expiryLabel}`;
      warrantyText = "Warranty has expired for this asset.";
      warrantyRemaining = "Expired";
      warrantyPct = 100;
    } else {
      warrantyTitle = `Covered until ${expiryLabel}`;
      warrantyText = "Warranty is currently active for this asset.";
      warrantyRemaining = monthsLeft >= 12 ? `${Math.floor(monthsLeft / 12)}+ years remaining` : `${Math.max(monthsLeft, 0)} months remaining`;
      if (start && expiry > start) warrantyPct = Math.min(100, Math.max(0, Math.round(((now - start) / (expiry - start)) * 100)));
    }
  }

  let serviceStatus = { text: "Not scheduled", cls: "" };
  if (selected?.next_service_date) {
    const overdue = new Date(String(selected.next_service_date).slice(0, 10)).getTime() + dayMs < Date.now();
    serviceStatus = overdue ? { text: "Overdue", cls: "text-danger" } : { text: "Up to date", cls: "text-success" };
  }

  const conditionClass = (c) => (c || "").toLowerCase();

  return (
    <>
<div className="px-0 px-md-5 employee-dashboard">
                <div className="employee-assets-page">

                    <div className="ea-page-header">
                        {!embedded && <div>
                            <h2>Employee Assets</h2>
                            <p>Manage assigned equipment, asset lifecycle, returns and maintenance records.</p>
                        </div>}

                        <div className="ea-header-actions">
                            {!embedded && <button className="btn ea-btn-light" type="button" id="eaExportBtn">
                                <i className="bi bi-download"></i>
                                Export
                            </button>}

                            <button className="btn ea-btn-primary" type="button" data-bs-toggle="modal"
                                data-bs-target="#eaAssignAssetModal">
                                <i className="bi bi-plus-lg"></i>
                                New Asset Request
                            </button>
                        </div>
                    </div>

                    {error && <div className="alert alert-warning">{error}</div>}
                    {notice && (
                        <div className={`alert alert-${notice.type} alert-dismissible`}>
                            {notice.text}
                            <button type="button" className="btn-close" onClick={() => setNotice(null)}></button>
                        </div>
                    )}
                    {loading && <div className="text-muted mb-3">Loading assets...</div>}

                    <div className={`esc-employee-bar${embedded ? " d-none" : ""}`}>
                        <div className="esc-employee-main">
                            <div className="esc-avatar overflow-hidden">
                                {(employeeProfile?.profile_pic || employeeProfile?.avatar_url) ? (
                                    <img
                                        src={/^https?:\/\//i.test(employeeProfile?.profile_pic || employeeProfile?.avatar_url)
                                            ? (employeeProfile?.profile_pic || employeeProfile?.avatar_url)
                                            : `${import.meta.env.VITE_API_URL || 'https://hrms-backend-f2ef.onrender.com'}/${(employeeProfile?.profile_pic || employeeProfile?.avatar_url).replace(/^\/+/, '')}`}
                                        alt={fullName}
                                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "17px" }}
                                    />
                                ) : (
                                    initials
                                )}
                            </div>

                            <div className="esc-employee-info">
                                <div className="esc-name-row">
                                    <h3>{fullName}</h3>
                                    <span className="esc-status-badge">
                                        <span></span>
                                        {employee?.status || "Active"}
                                    </span>
                                </div>

                                <p>{employee?.designation || employee?.role_name || ""}</p>

                                <div className="esc-employee-meta">
                                    <span>
                                        <i className="bi bi-diagram-3"></i>
                                        {employee?.department || "—"}
                                    </span>

                                    <span>
                                        <i className="bi bi-person-badge"></i>
                                        {employee?.employee_code || "—"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="ea-overview-strip">
                        <div className="ea-overview-item">
                            <div className="ea-overview-icon purple"><i className="bi bi-box-seam"></i></div>
                            <div><strong>{total}</strong><span>Total Assets</span></div>
                        </div>
                        <div className="ea-overview-item">
                            <div className="ea-overview-icon green"><i className="bi bi-check2-circle"></i></div>
                            <div><strong>{activeCount}</strong><span>Active Assets</span></div>
                        </div>
                        <div className="ea-overview-item">
                            <div className="ea-overview-icon blue"><i className="bi bi-arrow-return-left"></i></div>
                            <div><strong>{returnedCount}</strong><span>Returned</span></div>
                        </div>
                        <div className="ea-overview-item">
                            <div className="ea-overview-icon orange"><i className="bi bi-tools"></i></div>
                            <div><strong>{maintenanceCount}</strong><span>Under Maintenance</span></div>
                        </div>
                    </div>

                    <div className="row g-4">

                        <div className="col-xl-8">

                            <div className="ea-card">

                                <div className="ea-card-header common-card-heading">
                                    <div>
                                        <span className="ea-section-label">ASSET INVENTORY</span>
                                        <h4>{STATUS_FILTER_LABELS[statusFilter]}</h4>
                                        <p>Search and filter {fullName}&apos;s assets by status.</p>
                                    </div>

                                    <div className="ea-header-tools">
                                        <div className="ea-search">
                                            <i className="bi bi-search"></i>
                                            <input type="text" id="eaAssetSearch" placeholder="Search assets..."
                                                value={search} onChange={(e) => setSearch(e.target.value)} />
                                        </div>

                                        <select className="form-select ea-filter" id="eaAssetStatusFilter"
                                            aria-label="Filter assets by status"
                                            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                            <option value="assets">Assets</option>
                                            <option value="total">Total Assets</option>
                                            <option value="active">Active Assets</option>
                                            <option value="returned">Returned Assets</option>
                                            <option value="maintenance">Under Maintenance</option>
                                        </select>

                                    </div>
                                </div>

                                <div className="ea-asset-list" id="eaAssetList">
                                    {filtered.map((a) => {
                                        const m = metaFor(a.asset_type);
                                        return (
                                            <div className="ea-asset-row" key={a.id} onClick={() => setSelectedId(a.id)}
                                                style={{ cursor: "pointer", background: a.id === selected?.id ? "#f6f5ff" : undefined, boxShadow: a.id === selected?.id ? "inset 3px 0 0 #4b3fd1" : undefined }}>
                                                <div className="ea-asset-main">
                                                    <div className={`ea-asset-icon ${m.cls}`}>
                                                        <i className={`bi ${m.icon}`}></i>
                                                    </div>

                                                    <div className="ea-asset-info">
                                                        <div className="ea-asset-title-row">
                                                            <h5>{a.asset_name}</h5>
                                                            <span className={`ea-asset-status ${statusClass(a.status)}`}>{a.status}</span>
                                                        </div>

                                                        <p>{typeLine(a)}</p>

                                                        <div className="ea-asset-meta">
                                                            <span><strong>Asset ID:</strong> {a.asset_tag}</span>
                                                            <span><strong>Serial:</strong> {a.serial_number || "—"}</span>
                                                            <span><strong>Assigned:</strong> {fmtDate(a.assigned_date)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="ea-asset-condition">
                                                    <span>Condition</span>
                                                    <strong className={conditionClass(a.asset_condition)}>{a.asset_condition}</strong>
                                                </div>

                                                <div className="dropdown" style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
                                                    <button className="btn ea-more-btn" type="button"
                                                        onClick={() => setOpenMenuId(openMenuId === a.id ? null : a.id)}>
                                                        <i className="bi bi-three-dots"></i>
                                                    </button>

                                                    <ul className={`dropdown-menu dropdown-menu-end ea-dropdown${openMenuId === a.id ? " show" : ""}`}
                                                        style={{ right: 0, left: "auto", zIndex: 20 }}>
                                                        {(a.status === "Assigned" || a.status === "Under Maintenance") && (
                                                            <>
                                                                <li>
                                                                    <button className="dropdown-item text-danger ea-return-btn" type="button"
                                                                        onClick={() => openReturn(a)}>
                                                                        <i className="bi bi-box-arrow-left"></i>
                                                                        Return Asset
                                                                    </button>
                                                                </li>
                                                            </>
                                                        )}
                                                    </ul>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {!loading && filtered.length === 0 && (
                                    <div className="ea-empty-state" id="eaEmptyState">
                                        <div><i className="bi bi-box-seam"></i></div>
                                        <h4>No assets found</h4>
                                        <p>{assets.length === 0 ? "No assets are currently assigned." : "Try changing your search or asset filters."}</p>
                                    </div>
                                )}
                            </div>

                            {selected && (
                                <div className="ea-card">
                                    <div className="ea-card-header common-card-heading">
                                        <div>
                                            <span className="ea-section-label">SELECTED ASSET</span>
                                            <h4>Asset Details</h4>
                                        </div>
                                    </div>

                                    <div className="ea-detail-hero">
                                        <div className="ea-detail-icon"><i className={`bi ${sMeta.icon}`}></i></div>
                                        <div>
                                            <h4 id="eaDetailAssetName">{selected.asset_name}</h4>
                                            <p id="eaDetailAssetType">{typeLine(selected)}</p>
                                        </div>
                                        <span className={`ea-asset-status ${statusClass(selected.status)}`}>{selected.status}</span>
                                    </div>

                                    <div className="row g-0 ea-detail-grid">
                                        {[
                                            ["Asset ID", selected.asset_tag],
                                            ["Serial Number", selected.serial_number || "—"],
                                            ["Manufacturer", selected.manufacturer || "—"],
                                            ["Model", selected.model || "—"],
                                            ["Purchase Date", fmtDate(selected.purchase_date)],
                                            ["Assigned Date", fmtDate(selected.assigned_date)],
                                            ["Condition", selected.asset_condition],
                                            ["Assigned By", selected.assigned_by || "—"],
                                            ["Warranty Expiry", fmtDate(selected.warranty_expiry)],
                                        ].map(([label, value]) => (
                                            <div className="col-md-4" key={label}>
                                                <div className="ea-detail-item">
                                                    <span>{label}</span>
                                                    <strong>{value}</strong>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="ea-card">
                                <div className="ea-card-header common-card-heading">
                                    <div>
                                        <span className="ea-section-label">REQUESTS</span>
                                        <h4>My Asset Requests</h4>
                                        <p>Requests you submitted and their review status.</p>
                                    </div>
                                </div>

                                {requests.length === 0 ? (
                                    <div className="p-4 text-muted">No asset requests yet.</div>
                                ) : (
                                    <div className="ea-asset-list">
                                        {requests.map((r) => (
                                            <div className="ea-asset-row" key={r.id}>
                                                <div className="ea-asset-main">
                                                    <div className={`ea-asset-icon ${metaFor(r.asset_type).cls}`}>
                                                        <i className={`bi ${metaFor(r.asset_type).icon}`}></i>
                                                    </div>
                                                    <div className="ea-asset-info">
                                                        <div className="ea-asset-title-row">
                                                            <h5>{metaFor(r.asset_type).label}{r.preferred_model ? ` · ${r.preferred_model}` : ""}</h5>
                                                            <span className={`ea-asset-status ${r.status === "Approved" || r.status === "Fulfilled" ? "assigned" : r.status === "Rejected" ? "returned" : "maintenance"}`}>{r.status}</span>
                                                        </div>
                                                        <p>{r.justification}</p>
                                                        <div className="ea-asset-meta">
                                                            <span><strong>Request:</strong> {r.request_code}</span>
                                                            <span><strong>Priority:</strong> {r.priority}</span>
                                                            <span><strong>Requested:</strong> {fmtDate(r.created_at)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>

                        <div className="col-xl-4">

                            {selected && (
                                <>
                                    <div className="ea-card">
                                        <div className="ea-card-header common-card-heading">
                                            <div>
                                                <span className="ea-section-label">LIFECYCLE</span>
                                                <h4>Asset Timeline</h4>
                                            </div>
                                        </div>

                                        <div className="ea-timeline">
                                            <div className="ea-timeline-item completed">
                                                <div className="ea-timeline-dot"><i className="bi bi-cart-check"></i></div>
                                                <div>
                                                    <strong>Asset Purchased</strong>
                                                    <span>{fmtTimeline(selected.purchase_date)}</span>
                                                    <p>Asset registered in company inventory.</p>
                                                </div>
                                            </div>

                                            <div className="ea-timeline-item completed">
                                                <div className="ea-timeline-dot"><i className="bi bi-person-check"></i></div>
                                                <div>
                                                    <strong>Assigned to {fullName}</strong>
                                                    <span>{fmtTimeline(selected.assigned_date)}</span>
                                                    <p>Assigned by {selected.assigned_by || "—"}.</p>
                                                </div>
                                            </div>

                                            {selected.status === "Returned" ? (
                                                <div className="ea-timeline-item completed">
                                                    <div className="ea-timeline-dot"><i className={`bi ${sMeta.icon}`}></i></div>
                                                    <div>
                                                        <strong>Used by Employee</strong>
                                                        <span>Completed</span>
                                                        <p>Asset was with the employee until return.</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="ea-timeline-item current">
                                                    <div className="ea-timeline-dot"><i className={`bi ${sMeta.icon}`}></i></div>
                                                    <div>
                                                        <strong>{selected.status === "Under Maintenance" ? "Under Maintenance" : "Currently Assigned"}</strong>
                                                        <span>{selected.status === "Under Maintenance" ? "In service" : "Active"}</span>
                                                        <p>{selected.status === "Under Maintenance" ? "Asset is currently being serviced." : "Asset is currently with the employee."}</p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className={`ea-timeline-item${selected.status === "Returned" ? " current" : ""}`}>
                                                <div className="ea-timeline-dot"><i className="bi bi-arrow-return-left"></i></div>
                                                <div>
                                                    <strong>Return</strong>
                                                    <span>{selected.returned_date ? fmtTimeline(selected.returned_date) : "Not scheduled"}</span>
                                                    <p>{selected.status === "Returned" ? (selected.return_remarks || "Asset returned.") : selected.status === "Return Requested" ? `Return requested${selected.returned_to ? " to " + selected.returned_to : ""}. Awaiting confirmation.` : "No return date has been recorded."}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ea-card ea-warranty-card">
                                        <div className="ea-warranty-icon"><i className="bi bi-shield-check"></i></div>
                                        <div>
                                            <span className="ea-section-label">WARRANTY</span>
                                            <h4>{warrantyTitle}</h4>
                                            <p>{warrantyText}</p>
                                        </div>
                                        <div className="ea-warranty-progress">
                                            <div>
                                                <span>Warranty period</span>
                                                <strong>{warrantyRemaining}</strong>
                                            </div>
                                            <div className="progress">
                                                <div className="progress-bar" style={{ width: `${warrantyPct}%` }}></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ea-card">
                                        <div className="ea-card-header common-card-heading">
                                            <div>
                                                <span className="ea-section-label">MAINTENANCE</span>
                                                <h4>Service Information</h4>
                                            </div>
                                        </div>

                                        <div className="ea-maintenance-list">
                                            <div><span>Last Service</span><strong>{fmtDate(selected.last_service_date)}</strong></div>
                                            <div><span>Next Service</span><strong>{fmtDate(selected.next_service_date)}</strong></div>
                                            <div><span>Status</span><strong className={serviceStatus.cls}>{serviceStatus.text}</strong></div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                    </div>



                    
                    <div className="modal fade" id="eaAssignAssetModal" tabIndex="-1" aria-hidden="true">

                        <div className="modal-dialog modal-lg modal-dialog-centered">

                            <div className="modal-content ea-modal">

                                <div className="modal-header">
                                    <div>
                                        <span className="ea-section-label">EMPLOYEE REQUEST</span>
                                        <h4>New Asset Request</h4>
                                        <p>Tell us what equipment you need and why.</p>
                                    </div>

                                    <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                                </div>

                                <div className="modal-body">

                                    <form id="eaNewAssetRequestForm" onSubmit={submitRequest}>

                                        <div className="ea-form-section">
                                            <h5>Requested Asset</h5>

                                            <div className="row g-3">

                                                <div className="col-md-6">
                                                    <label className="form-label">Asset Type</label>
                                                    <select className="form-select" required value={form.assetType} onChange={setField("assetType")}>
                                                        <option value="" disabled>Select asset type</option>
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

                                                <div className="col-md-6">
                                                    <label className="form-label">Priority</label>
                                                    <select className="form-select" required value={form.priority} onChange={setField("priority")}>
                                                        <option value="" disabled>Select priority</option>
                                                        <option>Low</option>
                                                        <option>Normal</option>
                                                        <option>High</option>
                                                        <option>Urgent</option>
                                                    </select>
                                                </div>

                                                <div className="col-md-6">
                                                    <label className="form-label">Preferred Make or Model</label>
                                                    <input type="text" className="form-control" placeholder="Optional, e.g. Dell Latitude"
                                                        value={form.preferredModel} onChange={setField("preferredModel")} />
                                                </div>

                                                <div className="col-md-6">
                                                    <label className="form-label">Date Needed</label>
                                                    <input type="date" className="form-control" value={form.dateNeeded} onChange={setField("dateNeeded")} />
                                                </div>

                                                <div className="col-12">
                                                    <label className="form-label">Business Justification</label>
                                                    <textarea className="form-control" rows="3" required
                                                        placeholder="Explain how this asset will support your work..."
                                                        value={form.justification} onChange={setField("justification")}></textarea>
                                                </div>

                                            </div>
                                        </div>

                                        <div className="ea-form-section">

                                            <h5>Delivery Details</h5>

                                            <div className="row g-3">

                                                <div className="col-md-6">
                                                    <label className="form-label">Work Location</label>
                                                    <select className="form-select" value={form.workLocation} onChange={setField("workLocation")}>
                                                        <option value="">Select work location</option>
                                                        <option>Chennai Office</option>
                                                        <option>Hyderabad Office</option>
                                                        <option>Bangalore Office</option>
                                                        <option>Remote</option>
                                                        <option>Other</option>
                                                    </select>
                                                </div>

                                                <div className="col-md-6">
                                                    <label className="form-label">Additional Requirements</label>
                                                    <textarea className="form-control" rows="3"
                                                        placeholder="Share any preferred specifications or accessories..."
                                                        value={form.additionalRequirements} onChange={setField("additionalRequirements")}></textarea>
                                                </div>

                                            </div>

                                        </div>

                                    </form>

                                </div>

                                <div className="modal-footer">
                                    <button type="button" className="btn ea-btn-light" data-bs-dismiss="modal">
                                        Cancel
                                    </button>

                                    <button type="submit" form="eaNewAssetRequestForm" className="btn ea-btn-primary" disabled={submitting}>
                                        <i className="bi bi-check2"></i>
                                        {submitting ? "Submitting..." : "Submit Request"}
                                    </button>
                                </div>

                            </div>

                        </div>

                    </div>


                    
                    {returnAsset && (
                    <>
                    <div className="modal-backdrop fade show"></div>
                    <div className="modal fade show d-block" tabIndex="-1" onClick={() => setReturnAsset(null)}>
                        <div className="modal-dialog modal-md modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                            <form className="modal-content ea-modal" onSubmit={submitReturn}>

                                <div className="modal-header">
                                    <div>
                                        <span className="ea-section-label">ASSET RETURN</span>
                                        <h4>Return Asset</h4>
                                        <p>Record the asset handover and condition.</p>
                                    </div>
                                    <button type="button" className="btn-close" onClick={() => setReturnAsset(null)}></button>
                                </div>

                                <div className="modal-body">
                                    <div className="ea-return-asset-box">
                                        <div className="ea-return-icon">
                                            <i className={`bi ${metaFor(returnAsset.asset_type).icon}`}></i>
                                        </div>
                                        <div>
                                            <strong>{returnAsset.asset_name}</strong>
                                            <span>{returnAsset.asset_tag} · {returnAsset.serial_number}</span>
                                        </div>
                                    </div>

                                    <div className="row g-3 mt-1">
                                        <div className="col-md-6">
                                            <label className="form-label">Return Date</label>
                                            <input type="date" className="form-control" required value={returnForm.returnDate}
                                                onChange={(e) => setReturnForm({ ...returnForm, returnDate: e.target.value })} />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">Condition at Return</label>
                                            <select className="form-select" value={returnForm.condition}
                                                onChange={(e) => setReturnForm({ ...returnForm, condition: e.target.value })}>
                                                <option>Excellent</option>
                                                <option>Good</option>
                                                <option>Fair</option>
                                                <option>Damaged</option>
                                            </select>
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label">Returned To</label>
                                            <select className="form-select" value={returnForm.returnedTo}
                                                onChange={(e) => setReturnForm({ ...returnForm, returnedTo: e.target.value })}>
                                                <option>HR Manager</option>
                                                <option>IT Admin</option>
                                                <option>Administrator</option>
                                                <option>Management</option>
                                            </select>
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label">Return Remarks</label>
                                            <textarea className="form-control" rows="3" placeholder="Add return or handover remarks..."
                                                value={returnForm.remarks}
                                                onChange={(e) => setReturnForm({ ...returnForm, remarks: e.target.value })}></textarea>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button type="button" className="btn ea-btn-light" onClick={() => setReturnAsset(null)}>Cancel</button>
                                    <button type="submit" className="btn ea-btn-primary" disabled={returning}>
                                        <i className="bi bi-check2"></i>
                                        {returning ? "Submitting..." : "Confirm Return"}
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>
                    </>
                    )}

                    <div className="toast-container position-fixed bottom-0 end-0 p-4" id="eaToastContainer">

                        <div className="toast ea-toast" id="eaToast" role="alert">

                            <div className="toast-body">
                                <div className="ea-toast-icon">
                                    <i className="bi bi-check-lg"></i>
                                </div>

                                <div>
                                    <strong id="eaToastTitle">Success</strong>
                                    <p id="eaToastMessage">
                                        Asset updated successfully.
                                    </p>
                                </div>

                                <button type="button" className="btn-close ms-auto" data-bs-dismiss="toast"></button>
                            </div>

                        </div>

                    </div>

                </div>
            </div>
    </>
  );
}
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const PAGE_SIZE = 4;
const EXPIRING_WITHIN_DAYS = 90;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${String(date.getDate()).padStart(2, "0")}-${MONTHS[date.getMonth()]}-${date.getFullYear()}`;
};

const daysUntil = (value) => (new Date(`${value}T00:00:00`) - new Date()) / 86400000;

const fileKind = (doc) => {
  const mime = doc.file_mime_type || "";
  if (mime === "application/pdf") return { cls: "epd-pdf", icon: "bi-file-earmark-pdf", label: "PDF Document" };
  if (mime.startsWith("image/")) return { cls: "epd-image", icon: "bi-card-image", label: "Image" };
  return { cls: "epd-doc", icon: "bi-file-earmark-text", label: "Document" };
};

const statusKind = (status) => {
  if (status === "Verified") return { cls: "verified", icon: "bi-check-circle-fill", label: "Verified" };
  if (status === "Rejected") return { cls: "rejected", icon: "bi-x-circle-fill", label: "Rejected" };
  if (status === "Re-upload") return { cls: "rejected", icon: "bi-arrow-repeat", label: "Re-upload Required" };
  return { cls: "pending", icon: "bi-clock-fill", label: "Pending" };
};
const API_BASE = import.meta.env.VITE_API_URL || "https://hrms-backend-5xo8.onrender.com";
const readApiResponse = async (response) => {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) return response.json();
    const body = await response.text();
    throw new Error(body.trim().startsWith("<")
        ? `Server returned an unexpected response (${response.status}).`
        : body || `Request failed (${response.status}).`);
};
const EMPTY_FORM = {
  documentCategory: "",
  documentType: "",
  documentName: "",
  documentNumber: "",
  issuedDate: "",
  expiryDate: "",
  remarks: "",
};

export default function Documents({ currentUser, employeeProfile, embedded = false }) {
    const firstName = employeeProfile?.first_name || "";
    const lastName = employeeProfile?.last_name || "";
    const employeeName = `${firstName} ${lastName}`.trim() || currentUser?.email || "Employee";
    const employeeInitials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
        || currentUser?.email?.slice(0, 2).toUpperCase()
        || "EM";
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const fileInputRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [viewDoc, setViewDoc] = useState(null);
  const [editingDoc, setEditingDoc] = useState(null);
  const [actionError, setActionError] = useState("");
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

  const openEdit = (doc) => {
    setEditingDoc(doc);
    setForm({
      documentCategory: doc.document_category || "",
      documentType: doc.document_type || "",
      documentName: doc.document_name || "",
      documentNumber: doc.document_number || "",
      issuedDate: doc.issued_date || "",
      expiryDate: doc.expiry_date || "",
      remarks: doc.remarks || "",
    });
    setFeedback({ type: "", text: "" });
    setIsUploadOpen(true);
  };

    const openDeleteConfirmation = (doc) => {
        setActionError("");
        setDeleteTarget(doc);
    };

    const deleteDocument = async () => {
        if (!deleteTarget) return;

    try {
      setActionError("");
            setDeleting(true);
            const response = await fetch(`${API_BASE}/api/employee/documents/${currentUser.id}/${deleteTarget.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Delete failed");
            setDeleteTarget(null);
            await loadDocuments();
    } catch (err) {
      setActionError(err.message || "Delete failed");
        } finally {
            setDeleting(false);
    }
  };

  const loadDocuments = useCallback(async () => {
    if (!currentUser?.id) {
      setListLoading(false);
      return;
    }
    try {
      setListError("");
      const response = await fetch(`${API_BASE}/api/employee/documents/${currentUser.id}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load documents");
      setDocuments(data);
    } catch (err) {
      setListError(err.message || "Failed to load documents");
    } finally {
      setListLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const filteredDocuments = useMemo(() => {
    const term = search.trim().toLowerCase();
    return documents.filter((doc) => {
      if (categoryFilter && doc.document_category !== categoryFilter) return false;
      if (statusFilter && doc.verification_status !== statusFilter) return false;
      if (!term) return true;
      return [doc.document_name, doc.document_type, doc.document_number, doc.file_name]
        .some((value) => (value || "").toLowerCase().includes(term));
    });
  }, [documents, search, categoryFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pagedDocuments = filteredDocuments.slice(pageStart, pageStart + PAGE_SIZE);

  const pendingCount = documents.filter((d) => !d.verification_status || d.verification_status === "Pending").length;
  const verifiedCount = documents.filter((d) => d.verification_status === "Verified").length;
  const expiringCount = documents.filter((d) => {
    if (!d.expiry_date) return false;
    const days = daysUntil(d.expiry_date);
    return days <= EXPIRING_WITHIN_DAYS;
  }).length;

  const tableRows = pagedDocuments.map((doc) => {
    const kind = fileKind(doc);
    const status = statusKind(doc.verification_status);
    const expiring = doc.expiry_date && daysUntil(doc.expiry_date) <= EXPIRING_WITHIN_DAYS;
    return (
      <tr key={doc.id}>
        <td>
          <div className="epd-document-name">
            <div className={`epd-file-icon ${kind.cls}`}>
              <i className={`bi ${kind.icon}`}></i>
            </div>
            <div>
              <strong>{doc.document_name || doc.document_type}</strong>
              <span>{kind.label}</span>
            </div>
          </div>
        </td>
        <td>
          <span className="epd-type-badge">{doc.document_category}</span>
        </td>
        <td>
          <div className="epd-date">
            <strong>{formatDate(doc.created_at)}</strong>
            <span>Uploaded</span>
          </div>
        </td>
        <td>
          <span className={`epd-status ${status.cls}`}>
            <i className={`bi ${status.icon}`}></i>
            {status.label}
          </span>
        </td>
        <td>
          <span className={expiring ? "epd-expiry epd-expiry-warning" : "epd-expiry"}>
            {doc.expiry_date ? formatDate(`${doc.expiry_date}T00:00:00`) : "—"}
          </span>
        </td>
        <td>
          <div className="epd-actions">
            <button type="button" className="epd-view-btn" title="View details" onClick={() => setViewDoc(doc)}>
              <i className="bi bi-eye"></i>
            </button>
            {doc.verification_status !== "Verified" && (
              <>
                <button type="button" className="epd-edit-btn" title="Edit" onClick={() => openEdit(doc)}>
                  <i className="bi bi-pencil"></i>
                </button>
                <button type="button" className="epd-delete-btn" title="Delete" onClick={() => openDeleteConfirmation(doc)}>
                  <i className="bi bi-trash"></i>
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
    );
  });
  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const closeUpload = () => {
    setIsUploadOpen(false);
    setEditingDoc(null);
    setSelectedFile(null);
    setFileError("");
    setForm(EMPTY_FORM);
    setFeedback({ type: "", text: "" });
  };

  const submitUpload = async () => {
    if (!form.documentCategory || !form.documentType) {
      setFeedback({ type: "danger", text: "Document category and type are required." });
      return;
    }

    if (editingDoc) {
      try {
        setSubmitting(true);
        setFeedback({ type: "", text: "" });
        const editBody = new FormData();
        Object.entries(form).forEach(([key, value]) => editBody.append(key, value));
        if (selectedFile) editBody.append("file", selectedFile);
        const response = await fetch(`${API_BASE}/api/employee/documents/${currentUser.id}/${editingDoc.id}`, {
          method: "PATCH",
          body: editBody,
        });
        const data = await readApiResponse(response);
        if (!response.ok) throw new Error(data.message || "Update failed");
        loadDocuments();
        closeUpload();
      } catch (err) {
        setFeedback({ type: "danger", text: err.message || "Update failed" });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!selectedFile) {
      setFeedback({ type: "danger", text: "Please choose a file to upload." });
      return;
    }

    const body = new FormData();
    body.append("file", selectedFile);
    Object.entries(form).forEach(([key, value]) => body.append(key, value));

    try {
      setSubmitting(true);
      setFeedback({ type: "", text: "" });
      const response = await fetch(`${API_BASE}/api/employee/documents/${currentUser.id}`, {
        method: "POST",
        body,
      });
    const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.message || "Upload failed");
      setSelectedFile(null);
      setForm(EMPTY_FORM);
    await loadDocuments();
    closeUpload();
    } catch (err) {
      setFeedback({ type: "danger", text: err.message || "Upload failed" });
    } finally {
      setSubmitting(false);
    }
  };

  const pickFile = (file) => {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
            setSelectedFile(null);
            setFileError("File size must be 2 MB or less.");
      return;
    }
    setFileError("");
    setSelectedFile(file);
  };

  return (
    <>
<div className="px-0 px-md-5 employee-dashboard">

                <div id="profileDocuments">

                    <div className="epd-page">

                        
                        {!embedded && <div className="epd-header">

                            <div>
                                <h3>Documents</h3>

                                <p>
                                    Manage employee documents, verification and document status.
                                </p>
                            </div>

                            <button type="button" className="epd-upload-btn" id="epdHeaderUploadBtn" onClick={() => setIsUploadOpen(true)}>

                                <i className="bi bi-cloud-arrow-up"></i>

                                Upload Document

                            </button>

                        </div>}

                        
                        {!embedded && <div className="esc-employee-bar">

                            <div className="esc-employee-main">

                                <div className="esc-avatar overflow-hidden">
                                    {(employeeProfile?.profile_pic || employeeProfile?.avatar_url) ? (
                                        <img
                                            src={/^(https?:\/\/|data:|blob:)/i.test(employeeProfile?.profile_pic || employeeProfile?.avatar_url)
                                                ? (employeeProfile?.profile_pic || employeeProfile?.avatar_url)
                                                : `${import.meta.env.VITE_API_URL || 'https://hrms-backend-5xo8.onrender.com'}/${(employeeProfile?.profile_pic || employeeProfile?.avatar_url).replace(/^\/+/, '')}`}
                                            alt={employeeName}
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
                                <span className="esc-side-label">{documents.length}</span>
                                <strong>Total Documents</strong>
                            </div>

                        </div>}

                       

                        

                        <div className="row g-3 esc-summary-row">

                            <div className="col-xl-3 col-md-6">
                                <div className="esc-summary-card">
                                    <div className="esc-summary-icon esc-icon-purple">
                                        <i className="bi bi-lightning-charge"></i>
                                    </div>

                                    <div>
                                        <span>Total Documents</span>
                                        <strong id="escTotalSkills">{documents.length}</strong>
                                        <small>Across all categories</small>
                                    </div>
                                </div>
                            </div>

                            <div className="col-xl-3 col-md-6">
                                <div className="esc-summary-card">
                                    <div className="esc-summary-icon esc-icon-blue">
                                        <i className="bi bi-clock"></i>
                                    </div>

                                    <div>
                                        <span>Pending Documents</span>
                                        <strong id="escAdvancedSkills">{pendingCount}</strong>
                                        <small>Awaiting verification</small>
                                    </div>
                                </div>
                            </div>

                            <div className="col-xl-3 col-md-6">
                                <div className="esc-summary-card">
                                    <div className="esc-summary-icon esc-icon-green">
                                        <i className="bi bi-patch-check"></i>
                                    </div>

                                    <div>
                                        <span>Verified Documents</span>
                                        <strong id="escVerifiedSkills">{verifiedCount}</strong>
                                        <small>Verified by HR</small>
                                    </div>
                                </div>
                            </div>

                            <div className="col-xl-3 col-md-6">
                                <div className="esc-summary-card">
                                    <div className="esc-summary-icon esc-icon-orange">
                                        <i className="bi bi-award"></i>
                                    </div>

                                    <div>
                                        <span>Expiring Documents</span>
                                        <strong id="escCertificationCount">{expiringCount}</strong>
                                        <small>Within 90 days</small>
                                    </div>
                                </div>
                            </div>

                        </div>


                        
                        <div className="epd-section">

                            <div className="epd-section-header common-card-heading">

                                <div>
                                    <h5>Document List</h5>

                                    <p>
                                        All documents uploaded for this employee.
                                    </p>
                                </div>

                                <span className="epd-list-count">
                                    {documents.length} Documents
                                </span>
                                {embedded && (
                                    <button type="button" className="epd-upload-btn" onClick={() => setIsUploadOpen(true)}>
                                        <i className="bi bi-cloud-arrow-up"></i>
                                        Upload Document
                                    </button>
                                )}

                            </div>


                            
                            {actionError && <p className="text-danger small px-3 mb-2">{actionError}</p>}

                            <div className="epd-toolbar">

                                <div className="epd-search">

                                    <i className="bi bi-search"></i>

                                    <input type="text" id="epdSearch" placeholder="Search documents..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />

                                </div>


                                <select id="epdTypeFilter" className="epd-filter" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
                                    <option value="">All Types</option>
                                    <option value="Identity">Identity</option>
                                    <option value="Employment">Employment</option>
                                    <option value="Education">Education</option>
                                    <option value="Bank">Bank</option>
                                    <option value="Tax">Tax</option>
                                    <option value="Compliance">Compliance</option>
                                </select>

                                <select id="epdStatusFilter" className="epd-filter" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                                    <option value="">All Status</option>
                                    <option value="Verified">Verified</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Rejected">Rejected</option>
                                    <option value="Re-upload">Re-upload Required</option>
                                </select>
                            </div>


                            
                            <div className="epd-table-wrapper">

                                <table className="epd-document-table">

                                    <thead>

                                        <tr>

                                            <th>Document</th>

                                            <th>Type</th>

                                            <th>Uploaded</th>

                                            <th>Status</th>

                                            <th>Expiry</th>

                                            <th className="epd-action-column">
                                                Action
                                            </th>

                                        </tr>

                                    </thead>

                                    <tbody id="epdDocumentTableBody">
                                        {tableRows}
                                    </tbody>

                                </table>

                            </div>


                            
                            <div id="epdNoResults" className={`epd-no-results${!listLoading && filteredDocuments.length === 0 ? "" : " d-none"}`}>

                                <div>
                                    <i className="bi bi-file-earmark-x"></i>
                                </div>

                                <h6>{listError || "No documents found"}</h6>

                                <p>
                                    {listError ? "Please try again later." : "Try changing your search or filter."}
                                </p>

                            </div>


                            
                            <div className="epd-table-footer">

                                <span>
                                    Showing <strong>{filteredDocuments.length ? `${pageStart + 1}–${pageStart + pagedDocuments.length}` : 0}</strong> of{" "}
                                    <strong>{filteredDocuments.length}</strong> documents
                                </span>

                                <div className="epd-pagination">

                                    <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
                                        <i className="bi bi-chevron-left"></i>
                                    </button>

                                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
                                        <button type="button" key={number} className={number === currentPage ? "active" : ""} onClick={() => setPage(number)}>
                                            {number}
                                        </button>
                                    ))}

                                    <button type="button" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>
                                        <i className="bi bi-chevron-right"></i>
                                    </button>

                                </div>

                            </div>

                        </div>


                        
                        


                        
                        


                        
                        <div className="epd-document-note">

                            <div className="epd-note-icon">
                                <i className="bi bi-info-circle"></i>
                            </div>

                            <div>

                                <strong>Document verification history</strong>

                                <p>
                                    Verification actions should be recorded with the
                                    verifier, verification date and remarks for
                                    future reference.
                                </p>

                            </div>

                        </div>

                    </div>


                    
                    {viewDoc && <div className="modal-backdrop fade show" onClick={() => setViewDoc(null)}></div>}

                    <div
                        className={`modal fade${viewDoc ? " show d-block" : ""}`}
                        id="epdViewModal"
                        tabIndex="-1"
                        aria-hidden={!viewDoc}
                        onClick={(event) => {
                            if (event.target === event.currentTarget) setViewDoc(null);
                        }}
                    >
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content epd-modal">
                                <div className="modal-header">
                                    <div>
                                        <span className="epd-modal-label">Employee Documents</span>
                                        <h5 className="modal-title">Document Details</h5>
                                    </div>
                                    <button type="button" className="btn-close" aria-label="Close" onClick={() => setViewDoc(null)}></button>
                                </div>

                                {viewDoc && (
                                    <div className="modal-body">
                                        <div className="epd-detail-head">
                                            <div className={`epd-file-icon ${fileKind(viewDoc).cls}`}>
                                                <i className={`bi ${fileKind(viewDoc).icon}`}></i>
                                            </div>
                                            <div>
                                                <strong>{viewDoc.document_name || viewDoc.document_type}</strong>
                                                <span>{viewDoc.file_name} · {fileKind(viewDoc).label}</span>
                                            </div>
                                        </div>

                                        <div className="row g-3 epd-detail-grid">
                                            {[
                                                ["Document Category", viewDoc.document_category],
                                                ["Document Type", viewDoc.document_type],
                                                ["Document Name", viewDoc.document_name],
                                                ["Document Number", viewDoc.document_number],
                                                ["Issued Date", viewDoc.issued_date ? formatDate(`${viewDoc.issued_date}T00:00:00`) : ""],
                                                ["Expiry Date", viewDoc.expiry_date ? formatDate(`${viewDoc.expiry_date}T00:00:00`) : ""],
                                            ].map(([label, value]) => (
                                                <div className="col-6" key={label}>
                                                    <span>{label}</span>
                                                    <strong>{value || "—"}</strong>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="modal-footer">
                                    {viewDoc && (
                                        <a
                                            className="epd-modal-save text-decoration-none"
                                            href={`${API_BASE}/uploads/documents/${encodeURIComponent(viewDoc.file_path)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <i className="bi bi-box-arrow-up-right"></i> Open File
                                        </a>
                                    )}
                                    <button type="button" className="epd-modal-cancel" onClick={() => setViewDoc(null)}>Close</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {isUploadOpen && <div className="modal-backdrop fade show" onClick={closeUpload}></div>}

                    <div
                        className={`modal fade${isUploadOpen ? " show d-block" : ""}`}
                        id="epdUploadModal"
                        tabIndex="-1"
                        aria-hidden={!isUploadOpen}
                        onClick={(event) => {
                            if (event.target === event.currentTarget) closeUpload();
                        }}
                    >

                        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">

                            <div className="modal-content epd-modal">

                                <div className="modal-header">

                                    <div>

                                        <span className="epd-modal-label">
                                            Employee Documents
                                        </span>

                                        <h5 className="modal-title">
                                            {editingDoc ? "Edit Document" : "Upload Document"}
                                        </h5>

                                    </div>

                                    <button type="button" className="btn-close" aria-label="Close" onClick={closeUpload}>
                                    </button>

                                </div>


                                <div className="modal-body">

                                    <div
                                        className="epd-upload-zone"
                                        id="epdUploadZone"
                                        onClick={() => fileInputRef.current?.click()}
                                        onDragOver={(event) => event.preventDefault()}
                                        onDrop={(event) => {
                                            event.preventDefault();
                                            pickFile(event.dataTransfer.files[0]);
                                        }}
                                    >

                                        <input
                                            type="file"
                                            id="epdFileInput"
                                            ref={fileInputRef}
                                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                            hidden
                                            onClick={(event) => event.stopPropagation()}
                                            onChange={(event) => {
                                                pickFile(event.target.files[0]);
                                                event.target.value = "";
                                            }}
                                        />

                                        <div className="epd-upload-icon">

                                            <i className="bi bi-cloud-arrow-up"></i>

                                        </div>

                                        <strong>
                                            Upload your document
                                        </strong>

                                        <span>
                                            Click to browse or drag and drop
                                        </span>

                                        <small>
                                            PDF, JPG, PNG, DOC, DOCX · Maximum 2 MB
                                        </small>

                                    </div>

                                    {fileError && <p className="text-danger small mt-2">{fileError}</p>}

                                    {editingDoc && !selectedFile && (
                                        <p className="small text-muted mt-2 mb-0">
                                            Current file: {editingDoc.file_name}. Choose a new file only if you want to replace it.
                                        </p>
                                    )}

                                    <div id="epdSelectedFile" className={`epd-selected-file${selectedFile ? "" : " d-none"}`}>

                                        <i className="bi bi-file-earmark-text"></i>

                                        <div>

                                            <strong id="epdFileName">
                                                {selectedFile?.name}
                                            </strong>

                                            <span id="epdFileSize">
                                                {selectedFile ? `${Math.max(1, Math.round(selectedFile.size / 1024))} KB` : ""}
                                            </span>

                                        </div>

                                        <button type="button" id="epdRemoveFile" onClick={() => setSelectedFile(null)}>

                                            <i className="bi bi-x-lg"></i>

                                        </button>

                                    </div>

                                    <div className="epd-section-header common-card-heading">

                                        <div>

                                            <h5>Document Details</h5>

                                            <p>
                                                Select a document and manage its information
                                                and verification details.
                                            </p>

                                        </div>

                                        

                                    </div>


                                    <div className="epd-form-area">

                                        <div className="row g-4">

                                            
                                            <div className="col-lg-6">

                                                <label className="epd-label">
                                                    Document Category
                                                    <span>*</span>
                                                </label>

                                                <select className="form-select epd-input" id="epdDocumentCategory" name="documentCategory" value={form.documentCategory} onChange={updateField}>

                                                    <option>Identity</option>

                                                    <option>Employment</option>

                                                    <option>Education</option>

                                                    <option>Bank</option>

                                                    <option>
                                                        Tax
                                                    </option>

                                                    <option>
                                                        Compliance
                                                    </option>
                                                </select>

                                            </div>

                                            
                                            <div className="col-lg-6">

                                                <label className="epd-label">
                                                    Document Type
                                                    <span>*</span>
                                                </label>

                                                <select className="form-select epd-input" id="epdDocumentType" name="documentType" value={form.documentType} onChange={updateField}>

                                                    <option value="">
                                                        Select Document Type
                                                    </option>

                                                    <option>Aadhaar</option>
                                                    <option>PAN</option>
                                                    <option>Passport</option>
                                                    <option>Offer Letter</option>
                                                    <option>Resume</option>
                                                    <option>Education Certificate</option>

                                                    <option>10th Certificate</option>

                                                    <option>+2 Certificate</option>

                                                    <option>Graduation</option>

                                                    <option>Post Graduation</option>

                                                    <option>
                                                        1st Company Offer Letter
                                                    </option>

                                                    <option>
                                                        1st Company Relieving Letter
                                                    </option>

                                                    <option>
                                                        Offer Letter
                                                    </option>

                                                    <option>
                                                        NDA
                                                    </option>

                                                    <option>
                                                        ID Proof
                                                    </option>

                                                    <option>
                                                        Experience Letter
                                                    </option>

                                                    <option>
                                                        Certification
                                                    </option>

                                                    <option>
                                                        Passport
                                                    </option>

                                                    <option>
                                                        Driving License
                                                    </option>

                                                    <option>
                                                        Other
                                                    </option>

                                                </select>

                                            </div>

                                            
                                            <div className="col-lg-6">

                                                <label className="epd-label">
                                                    Document Name
                                                </label>

                                                <div className="">

                                                    <input type="text" className="form-control epd-input" id="epdDocumentName" name="documentName" value={form.documentName} onChange={updateField}
                                                        placeholder="Actual name/title of the document" />

                                                </div>

                                            </div>

                                            
                                            <div className="col-lg-6">

                                                <label className="epd-label">
                                                    Document Number
                                                </label>

                                                <div className="">

                                                    <input type="text" className="form-control epd-input" id="epdDocumentNumber" name="documentNumber" value={form.documentNumber} onChange={updateField}
                                                        placeholder="Document Number" />

                                                </div>

                                            </div>


                                            
                                            <div className="col-lg-6">

                                                <label className="epd-label">
                                                    Issued Date
                                                </label>

                                                <div className="epd-input-icon">

                                                    <i className="bi bi-calendar3"></i>

                                                    <input type="date" className="form-control epd-input" id="epdIssuedDate" name="issuedDate" value={form.issuedDate} onChange={updateField} />

                                                </div>

                                            </div>

                                            
                                            <div className="col-lg-6">

                                                <label className="epd-label">
                                                    Expiry Date
                                                </label>

                                                <div className="epd-input-icon">

                                                    <i className="bi bi-calendar3"></i>

                                                    <input type="date" className="form-control epd-input" id="epdExpiryDate" name="expiryDate" value={form.expiryDate} onChange={updateField} />

                                                </div>

                                            </div>


                                            
                                            <div className="col-12">

                                                <label className="epd-label">
                                                    Remarks
                                                </label>

                                                <textarea className="form-control epd-input epd-textarea" id="epdRemarks" rows="4" name="remarks" value={form.remarks} onChange={updateField}
                                                    placeholder="Add remarks or verification notes..."></textarea>

                                            </div>

                                        </div>

                                    </div>

                                </div>


                                <div className="modal-footer">

                                    {feedback.text && <span className={`me-auto small text-${feedback.type}`}>{feedback.text}</span>}

                                    <button type="button" className="epd-modal-cancel" onClick={closeUpload}>

                                        Cancel

                                    </button>

                                    <button type="button" className="epd-modal-save" id="epdUploadConfirm" onClick={submitUpload} disabled={submitting}>

                                        <i className={`bi ${editingDoc ? "bi-check-lg" : "bi-cloud-arrow-up"}`}></i>

                                        {submitting ? (editingDoc ? "Saving..." : "Uploading...") : (editingDoc ? "Save Changes" : "Upload Document")}

                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

                {deleteTarget && <div className="modal-backdrop fade show" onClick={() => !deleting && setDeleteTarget(null)}></div>}

                <div
                    className={`modal fade${deleteTarget ? " show d-block" : ""}`}
                    id="epdDeleteConfirmModal"
                    tabIndex="-1"
                    aria-hidden={!deleteTarget}
                    aria-modal={deleteTarget ? true : undefined}
                    role={deleteTarget ? "dialog" : undefined}
                    onClick={(event) => {
                        if (event.target === event.currentTarget && !deleting) setDeleteTarget(null);
                    }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content epd-modal">
                            <div className="modal-header">
                                <div>
                                    <span className="epd-modal-label">Employee Documents</span>
                                    <h5 className="modal-title">Delete Document</h5>
                                </div>
                                <button type="button" className="btn-close" aria-label="Close" onClick={() => !deleting && setDeleteTarget(null)} disabled={deleting}></button>
                            </div>
                            <div className="modal-body">
                                <p className="mb-0">
                                    Delete <strong>{deleteTarget?.document_name || deleteTarget?.document_type}</strong>? This cannot be undone.
                                </p>
                                {actionError && <p className="text-danger mt-3 mb-0" role="alert">{actionError}</p>}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="epd-modal-cancel" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
                                <button type="button" className="epd-modal-save" onClick={deleteDocument} disabled={deleting}>
                                    <i className={`bi ${deleting ? "bi-arrow-repeat" : "bi-trash"}`}></i>
                                    {deleting ? "Deleting..." : "Delete Document"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
    </>
  );
}
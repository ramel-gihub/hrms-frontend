import React, { useState, useEffect, useMemo } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5002";

const EXPENSE_CATEGORIES = [
  "Travel & Cab",
  "Food & Meals",
  "Internet / Mobile",
  "Office Supplies",
  "Certification Fees"
];

const categoryConfig = {
  "Travel & Cab": { icon: "bi-car-front", bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
  "Food & Meals": { icon: "bi-cup-hot", bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" },
  "Internet / Mobile": { icon: "bi-wifi", bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe" },
  "Office Supplies": { icon: "bi-paperclip", bg: "#ecfdf5", color: "#059669", border: "#a7f3d0" },
  "Certification Fees": { icon: "bi-award", bg: "#fdf2f8", color: "#db2777", border: "#fbcfe8" }
};

const statusConfig = {
  "Pending": { icon: "bi-hourglass-split", bg: "#fef3c7", color: "#92400e", label: "Pending" },
  "Approved": { icon: "bi-check2", bg: "#dbeafe", color: "#1e40af", label: "Approved" },
  "Settled": { icon: "bi-check2-circle", bg: "#dcfce7", color: "#166534", label: "Settled" },
  "Rejected": { icon: "bi-x-circle", bg: "#fee2e2", color: "#991b1b", label: "Rejected" }
};

export default function Expenses({ currentUser, employeeProfile, onNavigate, embedded = false }) {
  const [claims, setClaims] = useState([]);
  const [summary, setSummary] = useState({
    totalClaimedThisMonth: 0,
    pendingApproval: { amount: 0, count: 0 },
    approvedReimbursed: { amount: 0, count: 0 },
    settled: { amount: 0, count: 0 },
    rejectedCount: 0,
    totalClaimsCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [alertBanner, setAlertBanner] = useState(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, categoryFilter, itemsPerPage]);

  // Modals
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);

  // Submit Form state
  const todayStr = new Date().toISOString().split("T")[0];
  const [formData, setFormData] = useState({
    expense_category: "Travel & Cab",
    expense_date: todayStr,
    claim_amount: "",
    merchant_name: "",
    business_purpose: ""
  });
  const [receiptFile, setReceiptFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  // Fetch claims from backend
  const fetchExpenses = async () => {
    const targetId = currentUser?.id || employeeProfile?.employee_id;
    if (!targetId) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/expenses/${targetId}`);
      if (!res.ok) {
        throw new Error("Failed to load claims");
      }
      const data = await res.json();
      setClaims(data.claims || []);
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error("Error fetching expenses:", err);
      showAlert("danger", "Could not fetch expense claims. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [currentUser?.id, employeeProfile?.employee_id]);

  const showAlert = (type, message) => {
    setAlertBanner({ type, message });
    setTimeout(() => {
      setAlertBanner(null);
    }, 5000);
  };

  const resetForm = () => {
    setFormData({
      expense_category: "Travel & Cab",
      expense_date: todayStr,
      claim_amount: "",
      merchant_name: "",
      business_purpose: ""
    });
    setReceiptFile(null);
    setFileError("");
    setFormError("");
  };

  // Handle file select
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setFileError("");
    if (!file) {
      setReceiptFile(null);
      return;
    }

    // Validate size (max 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setFileError("File size exceeds 5 MB limit. Please select a smaller file.");
      setReceiptFile(null);
      e.target.value = "";
      return;
    }

    // Validate mime type
    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setFileError("Invalid format. Please upload PDF, JPEG, or PNG only.");
      setReceiptFile(null);
      e.target.value = "";
      return;
    }

    setReceiptFile(file);
  };

  // Submit claim handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setFormError("");

    // Validate category
    if (!formData.expense_category) {
      setFormError("Please select an expense category.");
      return;
    }

    // Validate date - cannot be future date
    if (!formData.expense_date) {
      setFormError("Expense date is required.");
      return;
    }
    if (formData.expense_date > todayStr) {
      setFormError("Expense date cannot be in the future.");
      return;
    }

    // Validate amount > 0
    const parsedAmount = parseFloat(formData.claim_amount);
    if (!formData.claim_amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError("Claim amount must be a numeric value greater than ₹0.");
      return;
    }

    // Validate merchant
    if (!formData.merchant_name.trim()) {
      setFormError("Merchant / store name is required (e.g., 'Uber', 'Airtel').");
      return;
    }

    // Validate purpose
    if (!formData.business_purpose.trim()) {
      setFormError("Please provide a short justification for the expense.");
      return;
    }

    try {
      setSubmitting(true);
      const targetId = currentUser?.id || employeeProfile?.employee_id;

      const body = new FormData();
      body.append("userId", targetId);
      body.append("expense_category", formData.expense_category);
      body.append("expense_date", formData.expense_date);
      body.append("claim_amount", parsedAmount.toString());
      body.append("merchant_name", formData.merchant_name.trim());
      body.append("business_purpose", formData.business_purpose.trim());
      if (receiptFile) {
        body.append("file", receiptFile);
      }

      const res = await fetch(`${API_BASE}/api/expenses`, {
        method: "POST",
        body
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || resData.message || "Failed to submit claim");
      }

      setShowSubmitModal(false);
      resetForm();
      showAlert("success", "Expense claim submitted successfully!");
      fetchExpenses();
    } catch (err) {
      console.error("Submit error:", err);
      setFormError(err.message || "Something went wrong while submitting the claim.");
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel / Delete pending claim
  const handleCancelClaim = async (claimId) => {
    if (!window.confirm("Are you sure you want to cancel this pending claim?")) return;

    try {
      setCancellingId(claimId);
      const res = await fetch(`${API_BASE}/api/expenses/${claimId}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to cancel claim");
      }
      if (showViewModal && selectedClaim?.id === claimId) {
        setShowViewModal(false);
        setSelectedClaim(null);
      }
      showAlert("success", "Claim cancelled successfully.");
      fetchExpenses();
    } catch (err) {
      console.error("Cancel claim error:", err);
      showAlert("danger", err.message || "Failed to cancel claim.");
    } finally {
      setCancellingId(null);
    }
  };

  // Filtered claims
  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesMerchant = (claim.merchant_name || "").toLowerCase().includes(q);
        const matchesPurpose = (claim.business_purpose || "").toLowerCase().includes(q);
        const matchesCategory = (claim.expense_category || "").toLowerCase().includes(q);
        const matchesId = claim.id?.toString().includes(q);
        if (!matchesMerchant && !matchesPurpose && !matchesCategory && !matchesId) {
          return false;
        }
      }

      // Status
      if (statusFilter !== "All" && claim.status !== statusFilter) {
        return false;
      }

      // Category
      if (categoryFilter !== "All" && claim.expense_category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [claims, searchQuery, statusFilter, categoryFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredClaims.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredClaims.length);
  const paginatedClaims = useMemo(() => {
    return filteredClaims.slice(startIndex, endIndex);
  }, [filteredClaims, startIndex, endIndex]);

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "--";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }).replace(/ /g, "-");
    } catch {
      return dateStr;
    }
  };

  const getFullReceiptUrl = (url) => {
    if (!url) return null;
    return /^https?:\/\//i.test(url) ? url : `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  return (
    <div className="epa-page">
      {/* Alert Banner */}
      {alertBanner && (
        <div
          className={`alert alert-${alertBanner.type} alert-dismissible fade show mb-4`}
          role="alert"
          style={{ borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.06)" }}
        >
          <div className="d-flex align-items-center">
            <i
              className={`bi ${
                alertBanner.type === "success"
                  ? "bi-check-circle-fill text-success"
                  : "bi-exclamation-triangle-fill text-danger"
              } fs-5 me-2`}
            ></i>
            <strong>{alertBanner.message}</strong>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setAlertBanner(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Page Header (No export button per user requirement) */}
      <div className={`epa-page-header${embedded ? " d-none" : ""}`}>
        <div>
          <h2 className="epa-title">Expenses &amp; Claims</h2>
          <p className="epa-subtitle">
            Out-of-pocket bills, travel &amp; reimbursements management.
          </p>
        </div>

        <div className="epa-header-actions">
          <button
            type="button"
            className="btn"
            style={{
              backgroundColor: "#4e36f5",
              color: "#fff",
              fontWeight: "600",
              padding: "10px 20px",
              borderRadius: "10px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              border: "none",
              boxShadow: "0 4px 14px rgba(78, 54, 245, 0.3)",
              cursor: "pointer",
              transition: "transform 0.15s ease"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            onClick={() => {
              resetForm();
              setShowSubmitModal(true);
            }}
          >
            <i className="bi bi-plus-lg"></i>
            <span>Submit New Claim</span>
          </button>
        </div>
      </div>

      {/* Standard Employee Purple Banner */}
      <div className={`esc-employee-bar${embedded ? " d-none" : ""}`}>
        <div className="esc-employee-main">
          <div className="esc-avatar overflow-hidden">
            {employeeProfile?.profile_pic || employeeProfile?.avatar_url ? (
              <img
                src={
                  /^https?:\/\//i.test(employeeProfile?.profile_pic || employeeProfile?.avatar_url)
                    ? employeeProfile?.profile_pic || employeeProfile?.avatar_url
                    : `${API_BASE}/${(employeeProfile?.profile_pic || employeeProfile?.avatar_url).replace(/^\/+/, "")}`
                }
                alt="Employee"
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "17px" }}
              />
            ) : (
              <>
                {employeeProfile?.first_name?.charAt(0) || currentUser?.email?.charAt(0)?.toUpperCase()}
                {employeeProfile?.last_name?.charAt(0) || ""}
              </>
            )}
          </div>

          <div className="esc-employee-info">
            <div className="esc-name-row">
              <h3>
                {employeeProfile?.first_name
                  ? `${employeeProfile.first_name} ${employeeProfile.last_name || ""}`
                  : currentUser?.email}
              </h3>
              <span className="esc-status-badge">
                <span></span>
                Active
              </span>
            </div>

            <p>{employeeProfile?.designation || "Developer"}</p>

            <div className="esc-employee-meta">
              <span>
                <i className="bi bi-diagram-3"></i>
                {employeeProfile?.department || "Engineering"}
              </span>
              <span>
                <i className="bi bi-geo-alt"></i>
                {employeeProfile?.city || employeeProfile?.location || "Nagpur"}
              </span>
              <span>
                <i className="bi bi-person-badge"></i>
                {employeeProfile?.employee_code || "EMP-1360"}
              </span>
            </div>
          </div>
        </div>

        <div className="esc-employee-side">
          <span className="esc-side-label">Finance &amp; Claims</span>
          <strong>Expense Reimbursement</strong>
          <strong>Out-of-Pocket &amp; Travel</strong>
          <div>
            <strong>
              Total Claims: {claims.length} ({claims.filter((c) => c.status === "Pending").length} Pending)
            </strong>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row g-4 mb-4">
        {/* Card 1: Total Claimed this month */}
        <div className="col-xl-4 col-md-6">
          <div
            className="esc-summary-card"
            style={{
              height: "100%",
              background: "#fff",
              border: "1px solid #ebecf3",
              borderRadius: "18px",
              padding: "20px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              boxShadow: "0 10px 30px rgba(31, 35, 69, .04)"
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                background: "#eeecff",
                color: "#4e36f5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                flexShrink: 0
              }}
            >
              <i className="bi bi-wallet2"></i>
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: "13px", color: "#85889b", fontWeight: 500 }}>
                Total Claimed this month
              </span>
              <strong
                style={{
                  fontSize: "24px",
                  color: "#1a1d27",
                  display: "block",
                  margin: "4px 0 2px",
                  fontWeight: 700
                }}
              >
                ₹
                {Number(summary.totalClaimedThisMonth || 0).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </strong>
              <small style={{ color: "#85889b", fontSize: "12px" }}>
                {new Date().toLocaleString("default", { month: "long", year: "numeric" })}
              </small>
            </div>
          </div>
        </div>

        {/* Card 2: Pending Approval */}
        <div className="col-xl-4 col-md-6">
          <div
            className="esc-summary-card"
            style={{
              height: "100%",
              background: "#fff",
              border: "1px solid #ebecf3",
              borderRadius: "18px",
              padding: "20px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              boxShadow: "0 10px 30px rgba(31, 35, 69, .04)"
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                background: "#fff7ed",
                color: "#ea580c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                flexShrink: 0
              }}
            >
              <i className="bi bi-hourglass-split"></i>
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: "13px", color: "#85889b", fontWeight: 500 }}>
                Pending Approval
              </span>
              <strong
                style={{
                  fontSize: "24px",
                  color: "#1a1d27",
                  display: "block",
                  margin: "4px 0 2px",
                  fontWeight: 700
                }}
              >
                ₹
                {Number(summary.pendingApproval?.amount || 0).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </strong>
              <small style={{ color: "#ea580c", fontSize: "12px", fontWeight: 600 }}>
                {summary.pendingApproval?.count || 0} claims awaiting approval
              </small>
            </div>
          </div>
        </div>

        {/* Card 3: Approved & Reimbursed */}
        <div className="col-xl-4 col-md-6">
          <div
            className="esc-summary-card"
            style={{
              height: "100%",
              background: "#fff",
              border: "1px solid #ebecf3",
              borderRadius: "18px",
              padding: "20px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              boxShadow: "0 10px 30px rgba(31, 35, 69, .04)"
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                background: "#ecfdf5",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                flexShrink: 0
              }}
            >
              <i className="bi bi-check-circle-fill"></i>
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: "13px", color: "#85889b", fontWeight: 500 }}>
                Approved &amp; Reimbursed
              </span>
              <strong
                style={{
                  fontSize: "24px",
                  color: "#1a1d27",
                  display: "block",
                  margin: "4px 0 2px",
                  fontWeight: 700
                }}
              >
                ₹
                {Number(summary.approvedReimbursed?.amount || 0).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </strong>
              <small style={{ color: "#059669", fontSize: "12px", fontWeight: 600 }}>
                {summary.approvedReimbursed?.count || 0} claims approved / settled
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Claims History Card */}
      <div
        className="card border-0 mb-4"
        style={{
          borderRadius: "20px",
          border: "1px solid #ebecf3",
          boxShadow: "0 10px 35px rgba(31, 35, 69, .05)",
          overflow: "hidden"
        }}
      >
        {/* Card Header & Toolbar */}
        <div
          className="p-4 bg-white"
          style={{ borderBottom: "1px solid #f0f0f5" }}
        >
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <div className="d-flex align-items-center gap-2">
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    background: "#eeecff",
                    color: "#4e36f5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px"
                  }}
                >
                  <i className="bi bi-receipt"></i>
                </div>
                <h4 className="mb-0 fw-bold" style={{ fontSize: "18px", color: "#1a1d27" }}>
                  Claims History
                </h4>
              </div>
              <p className="text-muted small mb-0 mt-1">
                Showing {filteredClaims.length === 0 ? 0 : startIndex + 1} - {endIndex} of {filteredClaims.length} claims {totalPages > 1 && `(Page ${currentPage} of ${totalPages})`}
              </p>
            </div>

            {/* Toolbar Filters */}
            <div className="d-flex flex-wrap align-items-center gap-2">
              {/* Search */}
              <div
                className="esc-search-box"
                style={{
                  minWidth: "220px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "#fafaff",
                  border: "1px solid #ebecf3",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 12px",
                  gap: "8px"
                }}
              >
                <i className="bi bi-search text-muted"></i>
                <input
                  type="text"
                  placeholder="Search merchant, purpose..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontSize: "13px",
                    width: "100%"
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-muted p-0"
                    onClick={() => setSearchQuery("")}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <select
                className="form-select form-select-sm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  minWidth: "160px",
                  height: "40px",
                  borderRadius: "10px",
                  borderColor: "#ebecf3",
                  fontSize: "13px",
                  background: "#fafaff"
                }}
              >
                <option value="All">All Categories</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  minWidth: "130px",
                  height: "40px",
                  borderRadius: "10px",
                  borderColor: "#ebecf3",
                  fontSize: "13px",
                  background: "#fafaff"
                }}
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Settled">Settled</option>
                <option value="Rejected">Rejected</option>
              </select>

              {(searchQuery || statusFilter !== "All" || categoryFilter !== "All") && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  style={{ height: "40px", borderRadius: "10px", fontSize: "12px" }}
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("All");
                    setCategoryFilter("All");
                  }}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i> Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="table-responsive bg-white">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: "13px" }}>
            <thead style={{ background: "#f8f9fa", borderBottom: "1px solid #ebecf3" }}>
              <tr>
                <th style={{ padding: "14px 18px", color: "#64748b", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Date</th>
                <th style={{ padding: "14px 18px", color: "#64748b", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Category</th>
                <th style={{ padding: "14px 18px", color: "#64748b", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Merchant</th>
                <th style={{ padding: "14px 18px", color: "#64748b", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Amount</th>
                <th style={{ padding: "14px 18px", color: "#64748b", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Receipt Link</th>
                <th style={{ padding: "14px 18px", color: "#64748b", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</th>
                <th style={{ padding: "14px 18px", color: "#64748b", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
                    <span className="text-muted">Loading expense claims...</span>
                  </td>
                </tr>
              ) : filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="py-4">
                      <div
                        style={{
                          width: "60px",
                          height: "60px",
                          borderRadius: "50%",
                          background: "#f1f5f9",
                          color: "#94a3b8",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "28px",
                          marginBottom: "12px"
                        }}
                      >
                        <i className="bi bi-inbox"></i>
                      </div>
                      <h6 className="fw-bold mb-1" style={{ color: "#334155" }}>
                        No Expense Claims Found
                      </h6>
                      <p className="text-muted small mb-3">
                        {claims.length === 0
                          ? "You haven't submitted any expense reimbursement claims yet."
                          : "No claims matched your search or filter criteria."}
                      </p>
                      {claims.length === 0 && (
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          style={{
                            backgroundColor: "#4e36f5",
                            borderColor: "#4e36f5",
                            borderRadius: "8px",
                            padding: "8px 16px"
                          }}
                          onClick={() => {
                            resetForm();
                            setShowSubmitModal(true);
                          }}
                        >
                          <i className="bi bi-plus-lg me-1"></i> Submit First Claim
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedClaims.map((claim) => {
                  const cat = categoryConfig[claim.expense_category] || {
                    icon: "bi-tag",
                    bg: "#f1f5f9",
                    color: "#475569",
                    border: "#cbd5e1"
                  };
                  const st = statusConfig[claim.status] || {
                    icon: "bi-circle",
                    bg: "#f1f5f9",
                    color: "#475569",
                    label: claim.status
                  };
                  const receiptUrl = getFullReceiptUrl(claim.receipt_url);

                  return (
                    <tr key={claim.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      {/* Date */}
                      <td style={{ padding: "16px 18px", whiteSpace: "nowrap" }}>
                        <div className="d-flex align-items-center gap-2">
                          <i className="bi bi-calendar3 text-muted" style={{ fontSize: "14px" }}></i>
                          <span style={{ fontWeight: 600, color: "#1e293b" }}>
                            {formatDate(claim.expense_date)}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: "16px 18px", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "5px 10px",
                            borderRadius: "8px",
                            fontSize: "12px",
                            fontWeight: 600,
                            backgroundColor: cat.bg,
                            color: cat.color,
                            border: `1px solid ${cat.border}`
                          }}
                        >
                          <i className={`bi ${cat.icon}`}></i>
                          {claim.expense_category}
                        </span>
                      </td>

                      {/* Merchant */}
                      <td style={{ padding: "16px 18px" }}>
                        <div>
                          <strong style={{ color: "#0f172a", fontSize: "13px" }}>
                            {claim.merchant_name}
                          </strong>
                          {claim.business_purpose && (
                            <div
                              className="text-muted text-truncate"
                              style={{ maxWidth: "240px", fontSize: "12px" }}
                              title={claim.business_purpose}
                            >
                              {claim.business_purpose}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td style={{ padding: "16px 18px", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: 700,
                            color: "#1e293b",
                            fontFamily: "monospace"
                          }}
                        >
                          ₹{Number(claim.claim_amount || 0).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                      </td>

                      {/* Receipt Link */}
                      <td style={{ padding: "16px 18px", whiteSpace: "nowrap" }}>
                        {receiptUrl ? (
                          <a
                            href={receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm"
                            style={{
                              backgroundColor: "#f8fafc",
                              color: "#4e36f5",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                              padding: "4px 10px",
                              fontSize: "12px",
                              fontWeight: 500,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px"
                            }}
                            onClick={(e) => {
                              // If image or PDF, we can also open details modal
                              // Default opens in new tab cleanly
                            }}
                          >
                            <i className="bi bi-paperclip"></i>
                            <span className="text-truncate" style={{ maxWidth: "120px" }}>
                              {claim.receipt_filename || "View Receipt"}
                            </span>
                            <i className="bi bi-box-arrow-up-right" style={{ fontSize: "10px" }}></i>
                          </a>
                        ) : (
                          <span className="text-muted" style={{ fontSize: "12px" }}>
                            <i className="bi bi-dash-circle me-1"></i>No receipt
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "16px 18px", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "4px 10px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: 600,
                            backgroundColor: st.bg,
                            color: st.color
                          }}
                          title={claim.rejection_reason ? `Reason: ${claim.rejection_reason}` : ""}
                        >
                          <i className={`bi ${st.icon}`}></i>
                          {st.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "16px 18px", whiteSpace: "nowrap", textAlign: "right" }}>
                        <div className="d-flex align-items-center justify-content-end gap-1">
                          <button
                            type="button"
                            className="btn btn-sm btn-light text-primary rounded-circle"
                            style={{
                              width: "32px",
                              height: "32px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "1px solid #e2e8f0"
                            }}
                            title="View Claim Details"
                            onClick={() => {
                              setSelectedClaim(claim);
                              setShowViewModal(true);
                            }}
                          >
                            <i className="bi bi-eye"></i>
                          </button>

                          {claim.status === "Pending" && (
                            <button
                              type="button"
                              className="btn btn-sm btn-light text-danger rounded-circle"
                              style={{
                                width: "32px",
                                height: "32px",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: "1px solid #fee2e2"
                              }}
                              title="Cancel Claim"
                              disabled={cancellingId === claim.id}
                              onClick={() => handleCancelClaim(claim.id)}
                            >
                              {cancellingId === claim.id ? (
                                <span className="spinner-border spinner-border-sm" style={{ width: "12px", height: "12px" }}></span>
                              ) : (
                                <i className="bi bi-trash3"></i>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination Footer (5 records per page by default) */}
        <div
          className="p-3 bg-white d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3"
          style={{ borderTop: "1px solid #f0f0f5" }}
        >
          <div className="d-flex align-items-center gap-3 text-muted" style={{ fontSize: "13px" }}>
            <span>
              Showing <strong>{filteredClaims.length === 0 ? 0 : startIndex + 1}</strong> to <strong>{endIndex}</strong> of <strong>{filteredClaims.length}</strong> claims
            </span>
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small">Per page:</span>
              <select
                className="form-select form-select-sm"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  width: "72px",
                  height: "32px",
                  borderRadius: "8px",
                  borderColor: "#ebecf3",
                  fontSize: "12px",
                  backgroundColor: "#fafaff",
                  cursor: "pointer"
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="epl-pagination d-flex align-items-center gap-1">
              <button
                type="button"
                className={`epl-page-btn ${currentPage === 1 ? "disabled" : ""}`}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                title="Previous Page"
              >
                <i className="bi bi-chevron-left"></i>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  className={`epl-page-btn ${currentPage === pageNum ? "active" : ""}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                className={`epl-page-btn ${currentPage === totalPages ? "disabled" : ""}`}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                title="Next Page"
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* "SUBMIT NEW CLAIM" MODAL */}
      {/* ============================================================ */}
      {showSubmitModal && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ zIndex: 1055 }}
            onClick={() => !submitting && setShowSubmitModal(false)}
          >
            <div
              className="modal-dialog modal-dialog-centered modal-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="modal-content"
                style={{
                  border: "none",
                  borderRadius: "16px",
                  boxShadow: "0 25px 60px rgba(0,0,0,0.2)",
                  overflow: "hidden"
                }}
              >
                {/* Modal Header */}
                <div
                  className="modal-header d-flex justify-content-between align-items-center"
                  style={{
                    backgroundColor: "#fafafa",
                    borderBottom: "1px solid #eee",
                    padding: "20px 24px"
                  }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "12px",
                        background: "#eeecff",
                        color: "#4e36f5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px"
                      }}
                    >
                      <i className="bi bi-plus-circle-fill"></i>
                    </div>
                    <div>
                      <h5 className="modal-title mb-0 fw-bold" style={{ color: "#1a1d27" }}>
                        Submit New Expense Claim
                      </h5>
                      <span className="text-muted" style={{ fontSize: "12px" }}>
                        Fill in out-of-pocket or travel expense details for reimbursement
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    disabled={submitting}
                    onClick={() => setShowSubmitModal(false)}
                  ></button>
                </div>

                {/* Modal Form */}
                <form onSubmit={handleSubmit}>
                  <div className="modal-body" style={{ padding: "24px" }}>
                    {/* Error Banner */}
                    {formError && (
                      <div
                        className="alert alert-danger d-flex align-items-center mb-4 py-2 px-3"
                        style={{ borderRadius: "10px", fontSize: "13px" }}
                      >
                        <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                        <div>{formError}</div>
                      </div>
                    )}

                    <div className="row g-3">
                      {/* 1. expense_category */}
                      <div className="col-md-6">
                        <label className="form-label fw-semibold" style={{ fontSize: "13px", color: "#334155" }}>
                          Expense Category <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          value={formData.expense_category}
                          onChange={(e) => setFormData({ ...formData, expense_category: e.target.value })}
                          required
                          style={{ borderRadius: "10px", borderColor: "#e2e8f0", fontSize: "14px", padding: "10px 14px" }}
                        >
                          {EXPENSE_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                        <small className="text-muted" style={{ fontSize: "11px" }}>
                          Select the appropriate expense classification
                        </small>
                      </div>

                      {/* 2. expense_date (Cannot be future date) */}
                      <div className="col-md-6">
                        <label className="form-label fw-semibold" style={{ fontSize: "13px", color: "#334155" }}>
                          Expense Date <span className="text-danger">*</span>
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          max={todayStr}
                          value={formData.expense_date}
                          onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                          required
                          style={{ borderRadius: "10px", borderColor: "#e2e8f0", fontSize: "14px", padding: "10px 14px" }}
                        />
                        <small className="text-muted" style={{ fontSize: "11px" }}>
                          Cannot be future date (up to today: {todayStr})
                        </small>
                      </div>

                      {/* 3. claim_amount */}
                      <div className="col-md-6">
                        <label className="form-label fw-semibold" style={{ fontSize: "13px", color: "#334155" }}>
                          Claim Amount (₹) <span className="text-danger">*</span>
                        </label>
                        <div className="input-group">
                          <span
                            className="input-group-text"
                            style={{
                              backgroundColor: "#f8fafc",
                              borderColor: "#e2e8f0",
                              borderRadius: "10px 0 0 10px",
                              fontWeight: 600,
                              color: "#475569"
                            }}
                          >
                            ₹
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            className="form-control"
                            placeholder="0.00"
                            value={formData.claim_amount}
                            onChange={(e) => setFormData({ ...formData, claim_amount: e.target.value })}
                            required
                            style={{ borderRadius: "0 10px 10px 0", borderColor: "#e2e8f0", fontSize: "14px", padding: "10px 14px" }}
                          />
                        </div>
                        <small className="text-muted" style={{ fontSize: "11px" }}>
                          Decimal numeric amount, must be greater than 0
                        </small>
                      </div>

                      {/* 4. merchant_name */}
                      <div className="col-md-6">
                        <label className="form-label fw-semibold" style={{ fontSize: "13px", color: "#334155" }}>
                          Merchant / Store Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder='e.g., "Uber", "Airtel", "Starbucks"'
                          value={formData.merchant_name}
                          onChange={(e) => setFormData({ ...formData, merchant_name: e.target.value })}
                          required
                          style={{ borderRadius: "10px", borderColor: "#e2e8f0", fontSize: "14px", padding: "10px 14px" }}
                        />
                        <small className="text-muted" style={{ fontSize: "11px" }}>
                          Name of vendor or establishment
                        </small>
                      </div>

                      {/* 5. bill_invoice_receipt (PDF, JPEG, PNG, max 5 MB) */}
                      <div className="col-12">
                        <label className="form-label fw-semibold" style={{ fontSize: "13px", color: "#334155" }}>
                          Bill / Invoice Receipt <span className="text-muted fw-normal">(PDF, JPEG, PNG - max 5 MB)</span>
                        </label>
                        <div
                          style={{
                            border: fileError ? "2px dashed #ef4444" : "2px dashed #cbd5e1",
                            borderRadius: "12px",
                            padding: "16px",
                            textAlign: "center",
                            background: "#f8fafc",
                            cursor: "pointer",
                            position: "relative"
                          }}
                        >
                          <input
                            type="file"
                            accept=".pdf,image/jpeg,image/png,image/jpg"
                            onChange={handleFileChange}
                            style={{
                              position: "absolute",
                              inset: 0,
                              opacity: 0,
                              cursor: "pointer",
                              width: "100%",
                              height: "100%"
                            }}
                          />
                          {receiptFile ? (
                            <div className="d-flex align-items-center justify-content-center gap-3">
                              <i
                                className={`bi ${
                                  receiptFile.type === "application/pdf"
                                    ? "bi-file-earmark-pdf-fill text-danger"
                                    : "bi-file-earmark-image-fill text-primary"
                                } fs-2`}
                              ></i>
                              <div className="text-start">
                                <strong className="d-block text-truncate" style={{ maxWidth: "300px", fontSize: "13px", color: "#1e293b" }}>
                                  {receiptFile.name}
                                </strong>
                                <small className="text-muted">
                                  {(receiptFile.size / (1024 * 1024)).toFixed(2)} MB • Click or drag to replace
                                </small>
                              </div>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger ms-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReceiptFile(null);
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div>
                              <i className="bi bi-cloud-arrow-up text-primary fs-2 mb-1 d-block"></i>
                              <span style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>
                                Click to browse or drag and drop your receipt
                              </span>
                              <span className="d-block text-muted" style={{ fontSize: "11px", marginTop: "2px" }}>
                                Supported: PDF, JPEG, PNG (Max 5 MB)
                              </span>
                            </div>
                          )}
                        </div>
                        {fileError && (
                          <div className="text-danger small mt-1" style={{ fontSize: "12px" }}>
                            <i className="bi bi-exclamation-circle me-1"></i>
                            {fileError}
                          </div>
                        )}
                      </div>

                      {/* 6. business_purpose */}
                      <div className="col-12">
                        <label className="form-label fw-semibold" style={{ fontSize: "13px", color: "#334155" }}>
                          Business Purpose <span className="text-danger">*</span>
                        </label>
                        <textarea
                          className="form-control"
                          rows="3"
                          placeholder="Short justification for the expense (e.g. Travel to client site for software demonstration and onboarding)..."
                          value={formData.business_purpose}
                          onChange={(e) => setFormData({ ...formData, business_purpose: e.target.value })}
                          required
                          style={{ borderRadius: "10px", borderColor: "#e2e8f0", fontSize: "13px", padding: "10px 14px" }}
                        ></textarea>
                        <small className="text-muted" style={{ fontSize: "11px" }}>
                          Clear business rationale facilitates prompt approval
                        </small>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div
                    className="modal-footer d-flex justify-content-end gap-2"
                    style={{
                      borderTop: "1px solid #eee",
                      padding: "16px 24px",
                      backgroundColor: "#fafafa"
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-light"
                      disabled={submitting}
                      onClick={() => setShowSubmitModal(false)}
                      style={{ borderRadius: "8px", fontWeight: 500, padding: "8px 18px", color: "#64748b" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn"
                      disabled={submitting}
                      style={{
                        backgroundColor: "#4e36f5",
                        color: "#fff",
                        borderRadius: "8px",
                        fontWeight: 600,
                        padding: "8px 22px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(78, 54, 245, 0.25)"
                      }}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check2 me-1"></i> Submit Claim
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* "VIEW CLAIM DETAILS" MODAL */}
      {/* ============================================================ */}
      {showViewModal && selectedClaim && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ zIndex: 1055 }}
            onClick={() => setShowViewModal(false)}
          >
            <div
              className="modal-dialog modal-dialog-centered modal-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="modal-content"
                style={{
                  border: "none",
                  borderRadius: "16px",
                  boxShadow: "0 25px 60px rgba(0,0,0,0.2)",
                  overflow: "hidden"
                }}
              >
                {/* Header */}
                <div
                  className="modal-header d-flex justify-content-between align-items-center"
                  style={{
                    backgroundColor: "#fafafa",
                    borderBottom: "1px solid #eee",
                    padding: "20px 24px"
                  }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "12px",
                        background: "#eeecff",
                        color: "#4e36f5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px"
                      }}
                    >
                      <i className="bi bi-receipt-cutoff"></i>
                    </div>
                    <div>
                      <h5 className="modal-title mb-0 fw-bold" style={{ color: "#1a1d27" }}>
                        Claim Details #{selectedClaim.id}
                      </h5>
                      <span className="text-muted" style={{ fontSize: "12px" }}>
                        Submitted on {formatDate(selectedClaim.created_at || selectedClaim.expense_date)}
                      </span>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "6px 14px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: 600,
                        backgroundColor: statusConfig[selectedClaim.status]?.bg || "#f1f5f9",
                        color: statusConfig[selectedClaim.status]?.color || "#334155"
                      }}
                    >
                      <i className={`bi ${statusConfig[selectedClaim.status]?.icon || "bi-circle"}`}></i>
                      {selectedClaim.status}
                    </span>
                    <button
                      type="button"
                      className="btn-close ms-2"
                      onClick={() => setShowViewModal(false)}
                    ></button>
                  </div>
                </div>

                {/* Body */}
                <div className="modal-body" style={{ padding: "24px" }}>
                  {/* Rejection Note */}
                  {selectedClaim.status === "Rejected" && selectedClaim.rejection_reason && (
                    <div
                      className="alert alert-danger mb-4 d-flex align-items-start gap-2"
                      style={{ borderRadius: "10px" }}
                    >
                      <i className="bi bi-x-octagon-fill fs-5 mt-1"></i>
                      <div>
                        <strong>Claim Rejected:</strong>
                        <div style={{ fontSize: "13px" }}>{selectedClaim.rejection_reason}</div>
                      </div>
                    </div>
                  )}

                  {/* Summary Metric Grid */}
                  <div className="row g-3 mb-4">
                    <div className="col-sm-6 col-md-3">
                      <div className="p-3 rounded" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <span className="text-muted d-block small" style={{ fontSize: "11px" }}>Amount</span>
                        <strong className="fs-5" style={{ color: "#0f172a" }}>
                          ₹{Number(selectedClaim.claim_amount || 0).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </strong>
                      </div>
                    </div>
                    <div className="col-sm-6 col-md-3">
                      <div className="p-3 rounded" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <span className="text-muted d-block small" style={{ fontSize: "11px" }}>Expense Date</span>
                        <strong style={{ color: "#0f172a", fontSize: "14px" }}>
                          {formatDate(selectedClaim.expense_date)}
                        </strong>
                      </div>
                    </div>
                    <div className="col-sm-6 col-md-3">
                      <div className="p-3 rounded" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <span className="text-muted d-block small" style={{ fontSize: "11px" }}>Category</span>
                        <strong style={{ color: "#0f172a", fontSize: "14px" }}>
                          {selectedClaim.expense_category}
                        </strong>
                      </div>
                    </div>
                    <div className="col-sm-6 col-md-3">
                      <div className="p-3 rounded" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <span className="text-muted d-block small" style={{ fontSize: "11px" }}>Merchant</span>
                        <strong style={{ color: "#0f172a", fontSize: "14px" }}>
                          {selectedClaim.merchant_name}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Justification */}
                  <div className="mb-4">
                    <label className="fw-semibold text-muted small mb-1" style={{ fontSize: "12px", textTransform: "uppercase" }}>
                      Business Justification
                    </label>
                    <div
                      className="p-3 rounded"
                      style={{
                        background: "#fafafa",
                        border: "1px solid #eee",
                        fontSize: "14px",
                        color: "#1e293b",
                        lineHeight: 1.6
                      }}
                    >
                      {selectedClaim.business_purpose || "No justification provided."}
                    </div>
                  </div>

                  {/* Receipt Proof */}
                  <div>
                    <label className="fw-semibold text-muted small mb-2" style={{ fontSize: "12px", textTransform: "uppercase" }}>
                      Attached Bill / Invoice Receipt
                    </label>
                    {selectedClaim.receipt_url ? (
                      <div
                        className="p-3 rounded d-flex align-items-center justify-content-between"
                        style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <i className="bi bi-file-earmark-check fs-2 text-primary"></i>
                          <div>
                            <strong className="d-block" style={{ fontSize: "13px", color: "#1e293b" }}>
                              {selectedClaim.receipt_filename || "Expense Receipt Document"}
                            </strong>
                            <small className="text-muted">Document attached as proof of payment</small>
                          </div>
                        </div>

                        <a
                          href={getFullReceiptUrl(selectedClaim.receipt_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-primary"
                          style={{
                            backgroundColor: "#4e36f5",
                            borderColor: "#4e36f5",
                            borderRadius: "8px",
                            padding: "6px 14px",
                            fontSize: "12px"
                          }}
                        >
                          <i className="bi bi-box-arrow-up-right me-1"></i> View / Download
                        </a>
                      </div>
                    ) : (
                      <div className="text-muted small p-3 rounded" style={{ background: "#f8fafc" }}>
                        <i className="bi bi-info-circle me-1"></i> No receipt file was uploaded for this claim.
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div
                  className="modal-footer d-flex justify-content-between"
                  style={{
                    backgroundColor: "#fafafa",
                    borderTop: "1px solid #eee",
                    padding: "16px 24px"
                  }}
                >
                  <div>
                    {selectedClaim.status === "Pending" && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        disabled={cancellingId === selectedClaim.id}
                        onClick={() => handleCancelClaim(selectedClaim.id)}
                        style={{ borderRadius: "8px" }}
                      >
                        <i className="bi bi-trash3 me-1"></i> Cancel Claim
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowViewModal(false)}
                    style={{ borderRadius: "8px", padding: "6px 18px" }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

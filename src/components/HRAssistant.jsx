import React, { useState, useRef, useEffect, useMemo } from "react";

export default function HRAssistant({ currentUser, employeeProfile, mode = "employee" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const messagesEndRef = useRef(null);

  const role = (currentUser?.role || employeeProfile?.role || "").toLowerCase();
  const isAdmin = mode === "admin" || (mode !== "employee" && role.includes("admin"));
  const isManager = role.includes("lead") || role.includes("manager");

  // Dynamic Question Suite: Admin vs Employee
  const employeeCategories = useMemo(() => ({
    "Profile": [
      "What is my employee ID?",
      "What is my designation?",
      "Who is my reporting manager?",
      "What is my department?",
      "Can I update my personal information?"
    ],
    "Attendance": [
      "What time did I check in today?",
      "What time did I check out yesterday?",
      "How many days was I present this month?",
      "What is my attendance for this month?",
      "Do I have any attendance regularization requests pending?"
    ],
    "Leaves": [
      "What is my leave balance?",
      "How many annual leaves do I have remaining?",
      "How can I apply for leave?",
      "What is the status of my leave request?",
      "Can I cancel my approved leave?"
    ],
    "WFH": [
      "How can I apply for WFH?",
      "What is the status of my WFH request?",
      "How many WFH days have I used this month?"
    ],
    "Payroll": [
      "When will I receive my salary?",
      "Can I download my payslip?",
      "What are my salary deductions?",
      "What is my annual CTC?"
    ],
    "Holidays": [
      "What are the upcoming holidays?",
      "Is tomorrow a company holiday?",
      "Can I view the holiday calendar?"
    ],
    "Claims": [
      "How can I submit an expense claim?",
      "What is the status of my reimbursement request?",
      "When will my claim be processed?"
    ],
    "Goals": [
      "What are my current goals?",
      "When is my performance review?",
      "Can I view my appraisal history?"
    ],
    "Help Desk": [
      "How do I raise an HR ticket?",
      "How do I reset my password?",
      "Who should I contact for payroll issues?"
    ],
    "Exit & Notice": [
      "How can I submit my resignation?",
      "What is my notice period?",
      "What is the status of my exit clearance?",
      "When will I receive my experience letter?"
    ],
    ...(isManager ? {
      "My Team": [
        "Show my team members.",
        "Which team members are on leave today?",
        "Who is working from home today?",
        "Show team attendance report.",
        "Show employee availability status.",
        "Show pending leave requests for my team.",
        "Approve employee leave request.",
        "Reject leave request with comments.",
        "Show leave history of my team members.",
        "Show team performance dashboard.",
        "What are the pending goals for my team?",
        "Show timesheet status of my team."
      ]
    } : {})
  }), [isManager]);

  const adminCategories = useMemo(() => ({
    "Workforce & Attendance": [
      "How many employees are present today?",
      "Who is absent today?",
      "Show late coming employees.",
      "Show employees working from home today.",
      "Generate attendance report.",
      "How many active employees are there?",
      "Show me the list of new joiners this month.",
      "Which employees are on probation?",
      "Who are the employees whose contracts are expiring soon?"
    ],
    "Leave Management": [
      "Show all pending leave requests.",
      "Which employees are on leave today?",
      "Who has exceeded their leave quota?",
      "Show leave balance for all employees.",
      "Generate monthly leave utilization report."
    ],
    "Recruitment": [
      "How many open positions do we have?",
      "What is the status of current recruitment?",
      "Show candidate interview schedules.",
      "Which positions are pending approval?"
    ],
    "Payroll & Comp": [
      "Has payroll been processed this month?",
      "Show employees with pending salary revisions.",
      "Generate payroll summary report."
    ],
    "Exit & Attrition": [
      "Show pending resignation requests.",
      "Who is currently serving notice period?",
      "What is the employee attrition rate?",
      "Show pending exit clearance tasks."
    ],
    "Asset Management": [
      "Which employees have company laptops assigned?",
      "Show pending asset returns.",
      "Which assets require maintenance?",
      "What assets are assigned to a specific employee?"
    ],
    "Facility & Access": [
      "Show meeting room bookings.",
      "What are today's visitor details?",
      "Generate facility usage report.",
      "Show parking allocation details.",
      "Which employees have VPN access?",
      "Show users with system access permissions.",
      "Who needs access approval?",
      "List employees whose email accounts are inactive."
    ],
    "Teams & Projects": [
      "Show project allocation details.",
      "Show team productivity report.",
      "Show timesheet status of my team.",
      "Show employees with low attendance."
    ],
    "Company Holidays": [
      "What are the upcoming holidays?",
      "Is tomorrow a company holiday?",
      "Can I view the holiday calendar?"
    ]
  }), []);

  const categories = isAdmin ? adminCategories : employeeCategories;
  const initialCat = isAdmin ? "Workforce & Attendance" : "Profile";
  const [activeCategory, setActiveCategory] = useState(initialCat);

  // Update initial active category and greeting if mode/role changes
  useEffect(() => {
    setActiveCategory(isAdmin ? "Workforce & Attendance" : "Profile");
    setMessages([
      {
        sender: "ai",
        text: isAdmin
          ? "Hello Administrator! I am your **Ramel HR Enterprise AI**. Ask me about company-wide attendance, workforce statistics, pending leave approvals, recruitment pipelines, payroll summaries, or asset allocations."
          : `Hello ${employeeProfile?.first_name || currentUser?.name || 'there'}! I am your **Ramel HR AI Assistant**. You can ask me anything about your personal profile, attendance punches, leave balances, WFH requests, payroll slips, upcoming holidays, expense claims, or company policies.`,
        sources: [isAdmin ? "Ramel HR Master Records & Analytics" : "Ramel HR Handbook & Live Records"],
        time: "Just now"
      }
    ]);
  }, [isAdmin, currentUser?.name, employeeProfile?.first_name]);

  const [messages, setMessages] = useState(() => [
    {
      sender: "ai",
      text: isAdmin
        ? "Hello Administrator! I am your **Ramel HR Enterprise AI**. Ask me about company-wide attendance, workforce statistics, pending leave approvals, recruitment pipelines, payroll summaries, or asset allocations."
        : "Hello! I am your **Ramel HR AI Assistant**. You can ask me anything about your personal profile, attendance punches, leave balances, WFH requests, payroll slips, upcoming holidays, expense claims, or company policies.",
      sources: [isAdmin ? "Ramel HR Master Records & Analytics" : "Ramel HR Handbook & Live Records"],
      time: "Just now"
    }
  ]);
  const [loading, setLoading] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Formatted message parser (handles **bold**, `code`, and line breaks)
  const renderFormattedText = (rawText) => {
    if (!rawText) return null;
    const lines = rawText.split("\n");
    return lines.map((line, lIdx) => {
      const parts = line.split(/(\*\*.*?\*\*|\`.*?\`)/g);
      return (
        <div key={lIdx} style={{ minHeight: line.trim() ? "auto" : "8px", marginBottom: "2px" }}>
          {parts.map((part, pIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return <strong key={pIdx} style={{ fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith("`") && part.endsWith("`")) {
              return (
                <code
                  key={pIdx}
                  style={{
                    backgroundColor: "#e2e8f0",
                    padding: "1px 5px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontFamily: "monospace",
                    color: "#0f172a"
                  }}
                >
                  {part.slice(1, -1)}
                </code>
              );
            }
            return <span key={pIdx}>{part}</span>;
          })}
        </div>
      );
    });
  };

  const handleSend = async (questionText) => {
    const textToSend = questionText || query;
    if (!textToSend || !textToSend.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg = { sender: "user", text: textToSend.trim(), time: timeStr };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setQuery("");
    setLoading(true);

    try {
      const userRole = isAdmin ? "admin" : (currentUser?.role || employeeProfile?.role || "employee");
      const userId = currentUser?.id || employeeProfile?.user_id || employeeProfile?.id || 1;
      const res = await fetch(`${import.meta.env.VITE_API_URL || "https://hrms-backend-5xo8.onrender.com"}/api/ask-hr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: textToSend.trim(),
          userRole,
          userId,
          scope: isAdmin ? "admin" : "employee"
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process question");
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: data.answer || "I could not find relevant guidelines in the HR documents.",
          sources: data.sources || [],
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "I am having trouble connecting to the HR knowledge base right now. Please try again shortly or contact HR directly.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        sender: "ai",
        text: isAdmin
          ? "Chat cleared! How can I assist with workforce analytics or organization administration?"
          : "Chat cleared! How can I help you today?",
        sources: [isAdmin ? "Ramel HR Master Analytics" : "Ramel HR Handbook 2026"],
        time: "Just now"
      }
    ]);
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "24px",
          zIndex: 9990
        }}
      >
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          title={isAdmin ? "Ramel HR Enterprise AI" : "Ramel HR AI Assistant"}
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: isAdmin ? "#1e1b4b" : "#2B2677",
            color: "#ffffff",
            border: "none",
            boxShadow: isAdmin ? "0 8px 24px rgba(30, 27, 75, 0.45)" : "0 8px 24px rgba(43, 38, 119, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.25s ease",
            transform: isOpen ? "rotate(90deg)" : "scale(1)"
          }}
        >
          {isOpen ? (
            <i className="bi bi-x-lg" style={{ fontSize: "20px" }}></i>
          ) : (
            <i className="bi bi-robot" style={{ fontSize: "22px" }}></i>
          )}
        </button>
      </div>

      {/* Floating Chat Window */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "86px",
            right: "24px",
            width: "440px",
            maxWidth: "calc(100vw - 32px)",
            height: "580px",
            maxHeight: "calc(100vh - 110px)",
            backgroundColor: "#ffffff",
            borderRadius: "18px",
            boxShadow: "0 20px 50px rgba(27, 24, 74, 0.25)",
            border: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
            zIndex: 9995,
            overflow: "hidden"
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 18px",
              backgroundColor: isAdmin ? "#1e1b4b" : "#2B2677",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <i className="bi bi-stars" style={{ fontSize: "18px", color: isAdmin ? "#38bdf8" : "#ffd166" }}></i>
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <h6 style={{ margin: 0, fontWeight: 700, fontSize: "15px", letterSpacing: "0.2px" }}>
                    {isAdmin ? "Ramel HR Enterprise AI" : "Ramel HR AI"}
                  </h6>
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      padding: "2px 6px",
                      borderRadius: "6px",
                      backgroundColor: isAdmin ? "rgba(56, 189, 248, 0.2)" : "rgba(255, 209, 102, 0.2)",
                      color: isAdmin ? "#38bdf8" : "#ffd166"
                    }}
                  >
                    {isAdmin ? "Admin Suite" : "Employee"}
                  </span>
                </div>
                <small style={{ color: "#c7c4e8", fontSize: "11px" }}>
                  {isAdmin ? "Organization-wide Workforce & Analytics" : "Personal HR & Attendance Assistant"}
                </small>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                type="button"
                onClick={clearChat}
                title="Reset Chat"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#cbd5e1",
                  cursor: "pointer",
                  padding: "4px 8px",
                  fontSize: "12px",
                  borderRadius: "6px"
                }}
              >
                <i className="bi bi-arrow-counterclockwise me-1"></i>Reset
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ffffff",
                  cursor: "pointer",
                  padding: "4px"
                }}
              >
                <i className="bi bi-x-lg" style={{ fontSize: "16px" }}></i>
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div
            style={{
              padding: "6px 10px",
              backgroundColor: "#f1f5f9",
              borderBottom: "1px solid #e2e8f0",
              overflowX: "auto",
              display: "flex",
              gap: "4px",
              whiteSpace: "nowrap"
            }}
          >
            {Object.keys(categories).map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: "4px 10px",
                    fontSize: "11px",
                    fontWeight: isActive ? 600 : 500,
                    borderRadius: "14px",
                    border: "none",
                    backgroundColor: isActive ? (isAdmin ? "#1e1b4b" : "#2B2677") : "transparent",
                    color: isActive ? "#ffffff" : "#475569",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Quick Prompts for Selected Category */}
          <div
            style={{
              padding: "8px 12px",
              backgroundColor: "#ffffff",
              borderBottom: "1px solid #eef2f6",
              overflowX: "auto",
              display: "flex",
              gap: "6px",
              whiteSpace: "nowrap"
            }}
          >
            {categories[activeCategory]?.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(q)}
                title={q}
                style={{
                  padding: "4px 11px",
                  fontSize: "11px",
                  borderRadius: "18px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#f8fafc",
                  color: "#334155",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = isAdmin ? "#e0f2fe" : "#e0e7ff";
                  e.currentTarget.style.borderColor = isAdmin ? "#38bdf8" : "#818cf8";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "#f8fafc";
                  e.currentTarget.style.borderColor = "#cbd5e1";
                }}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div
            style={{
              flex: 1,
              padding: "16px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              backgroundColor: "#f8fafc"
            }}
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: m.sender === "user" ? "flex-end" : "flex-start"
                }}
              >
                <div
                  style={{
                    maxWidth: "88%",
                    padding: "11px 15px",
                    borderRadius: "14px",
                    fontSize: "12.5px",
                    lineHeight: "1.55",
                    backgroundColor: m.sender === "user" ? (isAdmin ? "#1e1b4b" : "#2B2677") : "#ffffff",
                    color: m.sender === "user" ? "#ffffff" : "#1e293b",
                    boxShadow: m.sender === "user" ? "0 4px 12px rgba(43, 38, 119, 0.2)" : "0 2px 8px rgba(0,0,0,0.04)",
                    border: m.sender === "user" ? "none" : "1px solid #e2e8f0"
                  }}
                >
                  {renderFormattedText(m.text)}

                  {m.sources && m.sources.length > 0 && (
                    <div
                      style={{
                        marginTop: "8px",
                        paddingTop: "6px",
                        borderTop: m.sender === "user" ? "1px dashed rgba(255,255,255,0.2)" : "1px dashed #e2e8f0",
                        fontSize: "11px",
                        color: m.sender === "user" ? "#cbd5e1" : "#64748b"
                      }}
                    >
                      <i className="bi bi-database me-1"></i>
                      <strong>Source:</strong> {m.sources.join(", ")}
                    </div>
                  )}
                </div>
                <span
                  style={{
                    fontSize: "10px",
                    color: "#94a3b8",
                    marginTop: "3px",
                    padding: "0 4px"
                  }}
                >
                  {m.time}
                </span>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "12px", padding: "6px 0" }}>
                <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                <span>{isAdmin ? "Aggregating organization analytics & records..." : "Checking your employee records & HR policy..."}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div
            style={{
              padding: "12px 14px",
              backgroundColor: "#ffffff",
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              gap: "8px"
            }}
          >
            <input
              type="text"
              placeholder={isAdmin ? "Ask organization queries (e.g. 'Show attendance report', 'Show pending leaves')..." : "Ask about your leaves, attendance punches, payroll, claims..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              style={{
                flex: 1,
                border: "1px solid #cbd5e1",
                borderRadius: "10px",
                padding: "9px 13px",
                fontSize: "12.5px",
                outline: "none"
              }}
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={loading || !query.trim()}
              style={{
                backgroundColor: isAdmin ? "#1e1b4b" : "#2B2677",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                padding: "0 15px",
                cursor: loading || !query.trim() ? "not-allowed" : "pointer",
                opacity: loading || !query.trim() ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease"
              }}
            >
              <i className="bi bi-send-fill" style={{ fontSize: "14px" }}></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

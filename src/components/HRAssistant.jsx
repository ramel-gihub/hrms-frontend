import React, { useState, useRef, useEffect } from "react";

export default function HRAssistant({ currentUser, employeeProfile }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hello! I am your Ramel HR AI Assistant. You can ask me anything about company leave policies, work hours, attendance, assigned assets, resignation, or employee benefits.",
      sources: ["Ramel HR Handbook 2026"],
      time: "Just now"
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickQuestions = [
    "What is the annual leave policy?",
    "What are standard office working hours?",
    "How does overtime calculation work?",
    "What is the notice period for resignation?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (questionText) => {
    const textToSend = questionText || query;
    if (!textToSend || !textToSend.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg = { sender: "user", text: textToSend.trim(), time: timeStr };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setQuery("");
    setLoading(true);

    try {
      const userRole = currentUser?.role || employeeProfile?.role || "employee";
      const userId = currentUser?.id || employeeProfile?.user_id || employeeProfile?.id || 1;
      const res = await fetch(`${(import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).replace("f2ef", "fzef") : "https://hrms-backend-fzef.onrender.com")}/api/ask-hr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: textToSend.trim(),
          userRole,
          userId
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

  return (
    <>
      {/* Floating Launcher Button */}
      <div
        style={{
          position: "fixed",
          bottom: "95px",
          right: "26px",
          zIndex: 9990
        }}
      >
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          title="Ramel HR AI Assistant"
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            backgroundColor: "#2B2677",
            color: "#ffffff",
            border: "none",
            boxShadow: "0 8px 24px rgba(43, 38, 119, 0.35)",
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
            bottom: "160px",
            right: "26px",
            width: "380px",
            maxWidth: "calc(100vw - 32px)",
            height: "530px",
            maxHeight: "calc(100vh - 180px)",
            backgroundColor: "#ffffff",
            borderRadius: "18px",
            boxShadow: "0 16px 48px rgba(27, 24, 74, 0.22)",
            border: "1px solid #e5e7eb",
            display: "flex",
            flexDirection: "column",
            zIndex: 9995,
            overflow: "hidden"
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px 18px",
              backgroundColor: "#2B2677",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <i className="bi bi-stars" style={{ fontSize: "17px", color: "#ffd166" }}></i>
              </div>
              <div>
                <h6 style={{ margin: 0, fontWeight: 700, fontSize: "15px" }}>Ramel HR AI</h6>
                <small style={{ color: "#c7c4e8", fontSize: "11px" }}>RAG Policy & Knowledge Assistant</small>
              </div>
            </div>
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

          {/* Quick Prompts */}
          <div
            style={{
              padding: "8px 12px",
              backgroundColor: "#f9fafb",
              borderBottom: "1px solid #eef2f6",
              overflowX: "auto",
              display: "flex",
              gap: "6px",
              whiteSpace: "nowrap"
            }}
          >
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(q)}
                style={{
                  padding: "4px 10px",
                  fontSize: "11px",
                  borderRadius: "20px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#ffffff",
                  color: "#475569",
                  cursor: "pointer"
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
                    maxWidth: "85%",
                    padding: "10px 14px",
                    borderRadius: "14px",
                    fontSize: "13px",
                    lineHeight: "1.5",
                    backgroundColor: m.sender === "user" ? "#2B2677" : "#ffffff",
                    color: m.sender === "user" ? "#ffffff" : "#1e293b",
                    boxShadow: m.sender === "user" ? "none" : "0 2px 8px rgba(0,0,0,0.04)",
                    border: m.sender === "user" ? "none" : "1px solid #e2e8f0",
                    whiteSpace: "pre-line"
                  }}
                >
                  {m.text}

                  {m.sources && m.sources.length > 0 && (
                    <div
                      style={{
                        marginTop: "8px",
                        paddingTop: "6px",
                        borderTop: "1px dashed #e2e8f0",
                        fontSize: "11px",
                        color: "#64748b"
                      }}
                    >
                      <i className="bi bi-file-earmark-text me-1"></i>
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
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "12px" }}>
                <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                <span>Searching HR documents & policies...</span>
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
              placeholder="Ask about leaves, holidays, benefits..."
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
                padding: "8px 12px",
                fontSize: "13px",
                outline: "none"
              }}
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={loading || !query.trim()}
              style={{
                backgroundColor: "#2B2677",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                padding: "0 14px",
                cursor: loading || !query.trim() ? "not-allowed" : "pointer",
                opacity: loading || !query.trim() ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
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

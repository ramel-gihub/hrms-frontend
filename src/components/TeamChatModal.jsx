import React, { useState, useEffect, useRef } from 'react';

export default function TeamChatModal({
  isOpen,
  onClose,
  targetUser,
  currentUser,
  currentEmployee,
  employeeProfile,
  apiBase
}) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);

  const API_BASE = apiBase || import.meta.env.VITE_API_URL || 'https://hrms-backend-5xo8.onrender.com';

  const senderId = currentEmployee?.id || employeeProfile?.id || employeeProfile?.employee_id || currentUser?.id;
  const senderName = currentEmployee?.employee_name || 
    (employeeProfile?.first_name ? `${employeeProfile.first_name} ${employeeProfile.last_name || ''}`.trim() : null) || 
    currentUser?.name || 
    'You';
  const orgId = currentEmployee?.organization_id || employeeProfile?.organization_id || currentUser?.organization_id || 1;

  const targetId = targetUser?.id || targetUser?.employee_id;
  const targetName = targetUser?.full_name || targetUser?.name || 'Colleague';
  const targetDesignation = targetUser?.designation || 'Team Member';

  // Smooth scroll to bottom so the latest messages (last 4 messages) are kept in view
  const scrollToBottom = (behavior = 'smooth') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior
      });
    }
  };

  // Fetch conversation history
  const fetchMessages = async (isInitial = false) => {
    if (!senderId || !targetId) return;
    if (isInitial) setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat/messages?user1Id=${senderId}&user2Id=${targetId}&orgId=${orgId}`);
      const data = await res.json();
      if (data && data.success) {
        setMessages(data.messages || []);
        setError(null);
      } else if (data && data.error) {
        setError(data.error);
      }
    } catch (err) {
      console.error('Error fetching chat messages:', err);
      if (isInitial) setError('Unable to load chat history. Please try again.');
    } finally {
      if (isInitial) {
        setLoading(false);
        // After initial load, default cursor to input and scroll view to latest messages (bottom 4 messages)
        setTimeout(() => {
          scrollToBottom('auto');
          inputRef.current?.focus();
        }, 100);
      }
    }
  };

  // Polling & setup on open
  useEffect(() => {
    if (!isOpen || !senderId || !targetId) return;

    fetchMessages(true);
    const interval = setInterval(() => {
      fetchMessages(false);
    }, 3000);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, senderId, targetId]);

  // Keep bottom messages in view when messages change if auto-scroll is active
  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      scrollToBottom('smooth');
    }
  }, [messages.length]);

  // Monitor user scrolling: if scrolled up, don't force auto-scroll; if near bottom, maintain auto-scroll
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    // Within 80px from bottom is considered at the bottom
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 80;
    shouldAutoScrollRef.current = isAtBottom;
  };

  // Send message
  const handleSendMessage = async (customText = null) => {
    const textToSend = typeof customText === 'string' ? customText : inputText;
    if (!textToSend || !textToSend.trim() || sending) return;

    const trimmed = textToSend.trim();
    setSending(true);

    // Optimistic message append
    const tempMsg = {
      id: 'temp-' + Date.now(),
      sender_id: Number(senderId),
      receiver_id: Number(targetId),
      sender_name: senderName,
      receiver_name: targetName,
      message: trimmed,
      is_read: false,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);
    setInputText('');
    shouldAutoScrollRef.current = true;
    setTimeout(() => scrollToBottom('smooth'), 50);

    try {
      const res = await fetch(`${API_BASE}/api/chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: Number(senderId),
          receiverId: Number(targetId),
          senderName,
          receiverName: targetName,
          message: trimmed,
          organizationId: Number(orgId)
        })
      });
      const data = await res.json();
      if (data && data.success && data.message) {
        // Replace temp message with actual saved record
        setMessages(prev => prev.map(m => m.id === tempMsg.id ? data.message : m));
      } else {
        // Rollback or refetch
        fetchMessages(false);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      fetchMessages(false);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen || !targetUser) return null;

  // Format timestamp
  const formatTime = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Format date header
  const formatDateLabel = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const targetInitials = (targetName || 'TM')
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div 
      className="modal-backdrop-chat"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 1060,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="card shadow-lg border-0"
        style={{
          width: '100%',
          maxWidth: '460px',
          height: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          overflow: 'hidden',
          animation: 'chatModalFadeIn 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Chat Modal Header */}
        <div 
          className="d-flex align-items-center justify-content-between px-3 py-2.5 text-white"
          style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <div className="d-flex align-items-center gap-2.5" style={{ minWidth: 0 }}>
            <div 
              className="rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm"
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#ffffff',
                color: '#1e3a8a',
                fontSize: '15px',
                flexShrink: 0
              }}
            >
              {targetInitials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="d-flex align-items-center gap-1.5">
                <h6 className="mb-0 text-white text-truncate fw-semibold" style={{ fontSize: '15px' }} title={targetName}>
                  {targetName}
                </h6>
                <span 
                  className="rounded-circle"
                  style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#10b981',
                    display: 'inline-block',
                    flexShrink: 0
                  }}
                  title="Available"
                ></span>
              </div>
              <small className="text-white-50 text-truncate d-block" style={{ fontSize: '11.5px' }}>
                {targetDesignation}
              </small>
            </div>
          </div>

          <div className="d-flex align-items-center gap-1">
            <button
              type="button"
              className="btn btn-sm btn-icon text-white text-opacity-75 hover-opacity-100 p-1"
              title="Refresh conversation"
              onClick={() => fetchMessages(false)}
              style={{ background: 'transparent', border: 'none' }}
            >
              <i className="bi bi-arrow-clockwise fs-5"></i>
            </button>
            <button
              type="button"
              className="btn btn-sm btn-icon text-white p-1"
              title="Close chat"
              onClick={onClose}
              style={{ background: 'transparent', border: 'none' }}
            >
              <i className="bi bi-x-lg fs-5"></i>
            </button>
          </div>
        </div>

        {/* Chat Messages Body */}
        <div 
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="p-3 bg-light"
          style={{
            flex: '1 1 auto',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          {loading ? (
            <div className="d-flex flex-column align-items-center justify-content-center h-100 py-5 text-muted">
              <div className="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
              <small>Loading conversation...</small>
            </div>
          ) : error ? (
            <div className="alert alert-danger py-2 px-3 small text-center my-auto">
              <i className="bi bi-exclamation-triangle-fill me-1"></i> {error}
            </div>
          ) : messages.length === 0 ? (
            <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center py-4 my-auto">
              <div 
                className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center mb-3"
                style={{ width: '60px', height: '60px', fontSize: '26px' }}
              >
                💬
              </div>
              <h6 className="fw-semibold text-dark mb-1">No messages yet</h6>
              <p className="text-muted small mb-3" style={{ maxWidth: '280px' }}>
                Start a direct conversation with <strong>{targetName}</strong>. Your chat history is stored securely.
              </p>
              <div className="d-flex flex-wrap gap-1.5 justify-content-center" style={{ maxWidth: '320px' }}>
                {['👋 Hi there!', 'Hey, got a quick minute?', 'Can we connect on tasks?'].map((quick, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="btn btn-sm btn-white bg-white border text-primary rounded-pill shadow-xs"
                    style={{ fontSize: '11.5px', padding: '4px 10px' }}
                    onClick={() => handleSendMessage(quick)}
                  >
                    {quick}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => {
                const isSentByMe = Number(msg.sender_id) === Number(senderId);
                const prevMsg = index > 0 ? messages[index - 1] : null;
                const showDateHeader = !prevMsg || 
                  new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();

                return (
                  <React.Fragment key={msg.id || index}>
                    {showDateHeader && (
                      <div className="text-center my-2">
                        <span 
                          className="badge bg-white text-muted border px-2.5 py-1 shadow-xs fw-normal"
                          style={{ fontSize: '11px', borderRadius: '12px' }}
                        >
                          {formatDateLabel(msg.created_at)}
                        </span>
                      </div>
                    )}

                    <div 
                      className={`d-flex flex-column ${isSentByMe ? 'align-items-end' : 'align-items-start'}`}
                      style={{ maxWidth: '82%', alignSelf: isSentByMe ? 'flex-end' : 'flex-start' }}
                    >
                      <div 
                        className={`p-2.5 rounded-3 shadow-xs ${
                          isSentByMe 
                            ? 'bg-primary text-white' 
                            : 'bg-white text-dark border'
                        }`}
                        style={{
                          wordBreak: 'break-word',
                          lineHeight: '1.4',
                          fontSize: '13.5px',
                          borderBottomRightRadius: isSentByMe ? '3px' : '12px',
                          borderBottomLeftRadius: !isSentByMe ? '3px' : '12px'
                        }}
                      >
                        {msg.message}
                      </div>

                      <div 
                        className="d-flex align-items-center gap-1 mt-1 px-1 text-muted"
                        style={{ fontSize: '10.5px' }}
                      >
                        <span>{formatTime(msg.created_at)}</span>
                        {isSentByMe && (
                          <span title={msg.is_read ? 'Read' : 'Delivered'}>
                            <i 
                              className={`bi ${msg.is_read ? 'bi-check2-all text-primary' : 'bi-check2'}`}
                              style={{ fontSize: '12px' }}
                            ></i>
                          </span>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </>
          )}
        </div>

        {/* Chat Input Footer */}
        <div className="p-2.5 bg-white border-top">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="d-flex align-items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              className="form-control form-control-sm rounded-pill px-3 py-2 border"
              placeholder={`Message ${targetName}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={sending}
              style={{ fontSize: '13px' }}
              autoFocus
            />
            <button
              type="submit"
              className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center shadow-sm"
              disabled={!inputText.trim() || sending}
              style={{
                width: '38px',
                height: '38px',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
              title="Send message (Enter)"
            >
              {sending ? (
                <span className="spinner-border spinner-border-sm" role="status"></span>
              ) : (
                <i className="bi bi-send-fill" style={{ fontSize: '13px', marginLeft: '1px' }}></i>
              )}
            </button>
          </form>
          <div className="d-flex align-items-center justify-content-between px-2 pt-1 text-muted" style={{ fontSize: '10.5px' }}>
            <span>Press <kbd style={{ fontSize: '9.5px', padding: '1px 3px' }}>Enter</kbd> to send</span>
            <span>Defaulting view to latest messages</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes chatModalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .shadow-xs {
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
      `}</style>
    </div>
  );
}

import React, { useState } from 'react';

export default function HrmsAdminHeader({
  currentUser,
  handleLogout,
  onOpenAddModal,
  onToggleSidebar,
  activeTab,
  setActiveTab,
  pendingCount = 0,
  unreadNotifications = 0,
  onSwitchToClassic
}) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const userInitial = (currentUser?.email || 'A').charAt(0).toUpperCase();
  const userName = currentUser?.name || currentUser?.email?.split('@')[0] || 'Admin User';
  const roleDisplay = currentUser?.roleName || currentUser?.role || 'Administrator';

  return (
    <header className="top-header">
      <div className="d-flex align-items-center justify-content-between">
        {/* Brand Logo & Mobile Menu Toggle */}
        <div className="d-flex align-items-center gap-3">
          <button 
            type="button" 
            className="header-action d-lg-none" 
            onClick={onToggleSidebar}
            aria-label="Open Navigation"
          >
            <i className="bi bi-list fs-4"></i>
          </button>

          <div 
            className="brand-logo cursor-pointer" 
            onClick={() => setActiveTab('dashboard')}
            style={{ cursor: 'pointer' }}
          >
            <div className="brand-icon">
              <i className="bi bi-grid-1x2-fill"></i>
            </div>
            <div>
              <h5 className="mb-0 fw-bold">Ramel HR</h5>
              <span className="text-muted" style={{ fontSize: '11px', letterSpacing: '0.04em' }}>
                ADMIN WORKSPACE
              </span>
            </div>
          </div>
        </div>

        {/* Center / Date badge */}
        <div className="d-none d-md-flex align-items-center gap-2 text-muted" style={{ fontSize: '13px' }}>
          <i className="bi bi-calendar3 text-primary"></i>
          <span className="fw-semibold text-dark">{todayFormatted}</span>
        </div>

        {/* Header Actions */}
        <div className="d-flex align-items-center gap-2 gap-md-3 header-actions">
          {/* Quick Add Employee Button */}
          {onOpenAddModal && (
            <button
              onClick={onOpenAddModal}
              className="btn btn-sm btn-primary d-none d-sm-inline-flex align-items-center gap-2 rounded-pill px-3 py-1.5 shadow-sm"
              style={{ backgroundColor: 'var(--primary, #3c2fbc)', borderColor: 'var(--primary, #3c2fbc)', fontSize: '13px' }}
            >
              <i className="bi bi-person-plus-fill"></i>
              <span>Add Employee</span>
            </button>
          )}

          {/* Notifications */}
          <button 
            className="header-action position-relative" 
            title="Notifications & Alerts"
            onClick={() => setActiveTab('announcements')}
          >
            <i className="bi bi-bell"></i>
            {(pendingCount > 0 || unreadNotifications > 0) && (
              <span className="notification-dot"></span>
            )}
          </button>

          {/* Theme switcher badge (Local Dev Feature) */}
          {onSwitchToClassic && (
            <button
              onClick={onSwitchToClassic}
              className="btn btn-sm btn-outline-secondary d-none d-lg-inline-flex align-items-center gap-1 rounded-pill px-2.5 py-1"
              style={{ fontSize: '11px' }}
              title="Switch back to Classic Admin Theme"
            >
              <i className="bi bi-arrow-repeat text-indigo-500"></i>
              <span>Classic Theme</span>
            </button>
          )}

          {/* Profile Dropdown */}
          <div className="dropdown position-relative">
            <button 
              className="profile-button border-0 bg-transparent p-0 d-flex align-items-center gap-2"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              type="button"
            >
              <div 
                className="profile-avatar text-white fw-bold d-flex align-items-center justify-content-center"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #3c2fbc, #5a6ff0)',
                  fontSize: '15px'
                }}
              >
                {userInitial}
              </div>
              <div className="profile-info text-start d-none d-sm-block">
                <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '13px' }}>{userName}</h6>
                <span className="text-muted d-block" style={{ fontSize: '11px' }}>{roleDisplay}</span>
              </div>
              <i className="bi bi-chevron-down text-muted" style={{ fontSize: '11px' }}></i>
            </button>

            {profileDropdownOpen && (
              <div 
                className="dropdown-menu dropdown-menu-end show border-0 shadow-lg rounded-4 p-2 mt-2"
                style={{ 
                  position: 'absolute', 
                  right: 0, 
                  top: '100%', 
                  minWidth: '220px', 
                  zIndex: 1050,
                  backgroundColor: '#ffffff'
                }}
              >
                <div className="px-3 py-2 border-bottom mb-1">
                  <div className="fw-bold text-dark" style={{ fontSize: '13px' }}>{currentUser?.email}</div>
                  <small className="text-muted text-uppercase" style={{ fontSize: '10px' }}>{roleDisplay}</small>
                </div>

                <button 
                  className="dropdown-item rounded-3 py-2 d-flex align-items-center gap-2"
                  onClick={() => { setActiveTab('profile'); setProfileDropdownOpen(false); }}
                >
                  <i className="bi bi-person text-primary"></i> Admin Profile
                </button>

                <button 
                  className="dropdown-item rounded-3 py-2 d-flex align-items-center gap-2"
                  onClick={() => { setActiveTab('settings'); setProfileDropdownOpen(false); }}
                >
                  <i className="bi bi-gear text-secondary"></i> System Settings
                </button>

                {onSwitchToClassic && (
                  <button 
                    className="dropdown-item rounded-3 py-2 d-flex align-items-center gap-2 text-primary"
                    onClick={() => { onSwitchToClassic(); setProfileDropdownOpen(false); }}
                  >
                    <i className="bi bi-arrow-repeat"></i> Switch to Classic Theme
                  </button>
                )}

                <div className="dropdown-divider my-1"></div>

                <button 
                  className="dropdown-item rounded-3 py-2 d-flex align-items-center gap-2 text-danger"
                  onClick={handleLogout}
                >
                  <i className="bi bi-box-arrow-right"></i> Logout
                </button>
              </div>
            )}
          </div>

          {/* Desktop Sidebar Toggle */}
          <button 
            className="header-action d-none d-lg-flex" 
            onClick={onToggleSidebar}
            aria-label="Toggle Navigation Drawer"
            title="Toggle Menu"
          >
            <i className="bi bi-list fs-5"></i>
          </button>
        </div>
      </div>
    </header>
  );
}

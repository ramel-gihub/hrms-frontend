import React from 'react';

export default function HrmsAdminSidebar({
  sidebarOpen,
  setSidebarOpen,
  activeTab,
  setActiveTab,
  isSuperAdmin,
  pendingLeavesCount = 0,
  pendingRequestsCount = 0,
  unmappedCount = 0,
  currentUser,
  handleLogout
}) {
  const menuGroups = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Admin Dashboard', icon: 'bi-grid-1x2' }
      ]
    },
    {
      title: 'WORKFORCE MANAGEMENT',
      items: [
        { id: 'employees', label: 'Employee Directory', icon: 'bi-people' },
        { id: 'project-teams', label: 'Project Teams', icon: 'bi-diagram-3' },
        { 
          id: 'requests', 
          label: 'Request Approvals', 
          icon: 'bi-check2-square',
          badge: pendingRequestsCount > 0 ? pendingRequestsCount : null,
          badgeColor: 'bg-warning text-dark'
        }
      ]
    },
    {
      title: 'TIME & ATTENDANCE',
      items: [
        { id: 'admin-leaves', label: 'Manage Leaves', icon: 'bi-calendar2-range' },
        { id: 'admin-wfh', label: 'Manage WFH', icon: 'bi-house-check' },
        { 
          id: 'leave-approvals', 
          label: 'Leave Approvals', 
          icon: 'bi-calendar2-minus',
          badge: pendingLeavesCount > 0 ? pendingLeavesCount : null,
          badgeColor: 'bg-danger text-white'
        },
        { 
          id: 'leave-balance-mapping', 
          label: 'Leave Types & Quotas', 
          icon: 'bi-layers',
          badge: unmappedCount > 0 ? `${unmappedCount} Unmapped` : null,
          badgeColor: 'bg-danger text-white'
        },
        { id: 'holidays', label: 'Public Holidays', icon: 'bi-calendar-event' }
      ]
    },
    {
      title: 'OPERATIONS & FINANCE',
      items: [
        { id: 'announcements', label: 'Broadcast Notices', icon: 'bi-megaphone' },
        { id: 'calendar', label: 'Company Calendar', icon: 'bi-calendar3' },
        { id: 'payroll', label: 'Payroll & CTC', icon: 'bi-cash-coin' },
        { id: 'analytics', label: 'Reports & Analytics', icon: 'bi-bar-chart-line' }
      ]
    },
    {
      title: 'ADMINISTRATION',
      items: [
        ...(isSuperAdmin ? [
          { id: 'tenants', label: 'Tenant Organizations', icon: 'bi-buildings' }
        ] : []),
        { id: 'data-reset', label: 'Data Reset & Cleanup', icon: 'bi-arrow-counterclockwise' },
        { id: 'profile', label: 'Admin Profile', icon: 'bi-person-circle' },
        { id: 'settings', label: 'System Settings', icon: 'bi-gear' }
      ]
    }
  ];

  return (
    <>
      {/* Offcanvas Backdrop for Mobile */}
      {sidebarOpen && (
        <div 
          className="offcanvas-backdrop fade show"
          onClick={() => setSidebarOpen(false)}
          style={{ zIndex: 1040 }}
        ></div>
      )}

      {/* Offcanvas Sidebar Container matching Netlify */}
      <div 
        className={`offcanvas offcanvas-start custom-offcanvas ${sidebarOpen ? 'show' : ''}`}
        tabIndex="-1" 
        id="mainMenu"
        style={{
          visibility: sidebarOpen ? 'visible' : 'hidden',
          width: '300px',
          backgroundColor: '#ffffff',
          boxShadow: '0 0 25px rgba(0,0,0,0.15)',
          zIndex: 1045,
          transition: 'transform 0.3s ease-in-out'
        }}
      >
        {/* Brand Header */}
        <div className="offcanvas-header p-3 border-bottom d-flex align-items-center justify-content-between">
          <div className="menu-brand d-flex align-items-center gap-2">
            <div 
              className="menu-brand-icon rounded-3 text-white d-flex align-items-center justify-content-center"
              style={{ width: '38px', height: '38px', background: 'var(--primary, #3c2fbc)' }}
            >
              <i className="bi bi-grid-1x2-fill fs-5"></i>
            </div>
            <div>
              <h5 className="mb-0 fw-bold text-dark" style={{ fontSize: '15px' }}>Ramel | HR</h5>
              <span className="text-muted" style={{ fontSize: '11px' }}>
                {isSuperAdmin ? 'Enterprise SaaS' : 'Admin Workspace'}
              </span>
            </div>
          </div>
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setSidebarOpen(false)} 
            aria-label="Close"
          ></button>
        </div>

        {/* Offcanvas Body Navigation */}
        <div className="offcanvas-body p-0" style={{ overflowY: 'auto' }}>
          <div className="menu-nav py-3">
            {menuGroups.map((group, gIdx) => (
              <div key={gIdx} className="mb-3">
                <span className="menu-label px-3 text-uppercase fw-bold text-muted d-block mb-1" style={{ fontSize: '10px', letterSpacing: '0.06em' }}>
                  {group.title}
                </span>

                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTab(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`menu-item d-flex align-items-center justify-content-between px-3 py-2 text-decoration-none transition-all ${isActive ? 'active' : ''}`}
                      style={{
                        color: isActive ? 'var(--primary, #3c2fbc)' : '#4b5563',
                        background: isActive ? '#f0eeff' : 'transparent',
                        fontWeight: isActive ? '600' : '500',
                        fontSize: '13.5px',
                        borderRadius: '10px',
                        margin: '2px 10px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div className="d-flex align-items-center gap-2.5">
                        <i className={`bi ${item.icon} fs-5 ${isActive ? 'text-primary' : 'text-secondary'}`}></i>
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`badge rounded-pill ${item.badgeColor || 'bg-primary'} px-2 py-1`} style={{ fontSize: '10px' }}>
                          {item.badge}
                        </span>
                      )}
                    </a>
                  );
                })}
              </div>
            ))}

            {/* Logout item */}
            <div className="border-top pt-2 px-3 mt-3">
              <a
                href="#logout"
                onClick={(e) => {
                  e.preventDefault();
                  handleLogout();
                }}
                className="menu-item text-danger d-flex align-items-center gap-2 py-2 text-decoration-none fw-semibold"
                style={{ fontSize: '13.5px' }}
              >
                <i className="bi bi-box-arrow-left fs-5"></i>
                <span>Logout</span>
              </a>
            </div>
          </div>
        </div>

        {/* User Footer */}
        <div className="p-3 border-top bg-light d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2 overflow-hidden">
            <div 
              className="rounded-circle text-white fw-bold d-flex align-items-center justify-content-center shrink-0"
              style={{ width: '32px', height: '32px', background: '#3c2fbc', fontSize: '12px' }}
            >
              {(currentUser?.email || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <div className="fw-bold text-dark text-truncate" style={{ fontSize: '12px', maxWidth: '160px' }}>
                {currentUser?.email}
              </div>
              <small className="text-muted text-capitalize d-block" style={{ fontSize: '10px' }}>
                {currentUser?.role || 'Admin'}
              </small>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

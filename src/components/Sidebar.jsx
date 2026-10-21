import React from 'react';

export default function Sidebar({ isOpen, toggleSidebar, activeMenu, setActiveMenu }) {
  const sections = [
    {
      label: 'ADMINISTRATION',
      menus: [
        { name: 'Employee Dashboard', icon: 'bi-grid', page: 'index' },
        { name: 'Employee Profile', icon: 'bi-person', page: 'employee-profile' },
        { name: 'Employment Details', icon: 'bi-briefcase', page: 'employement-details' },
        { name: 'Documents', icon: 'bi-file-earmark-text', page: 'documents' },
        { name: 'Skills & Certifications', icon: 'bi-award', page: 'skills-certifications' },
        { name: 'Attendance', icon: 'bi-clock', page: 'attendance' },
        { name: 'Leave', icon: 'bi-calendar', page: 'leaves' },
      ]
    },
    /*
    {
      label: 'FINANCE & CLAIMS',
      menus: [
        { name: 'Expenses & Claims', icon: 'bi-wallet2', page: 'expenses' },
      ]
    },
    */
    {
      label: 'RESOURCES & SETTINGS',
      menus: [
        { name: 'Assets', icon: 'bi-laptop', page: 'assets' },
        // { name: 'Access & Accounts', icon: 'bi-shield-lock', page: 'access-accounts' },
        { name: 'Notifications', icon: 'bi-bell', page: 'notifications' },
        { name: 'Settings', icon: 'bi-gear', page: 'settings' },
        { name: 'Resignation & Exit', icon: 'bi-box-arrow-right', page: 'exit-management' },
      ]
    }
  ];

  return (
    <div className={`bg-white border-end shadow-sm d-flex flex-column h-100 ${isOpen ? '' : 'd-none'}`} style={{ width: '250px', position: 'fixed', zIndex: 1000, top: 0, bottom: 0, left: 0 }}>
      <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
        <h5 className="mb-0 fw-bold text-primary">Ramel | HR</h5>
        <button className="btn btn-sm btn-light d-md-none" onClick={toggleSidebar}>
          <i className="bi bi-x-lg"></i>
        </button>
      </div>
      <div className="flex-grow-1 overflow-auto p-2">
        {sections.map((sec, sIdx) => (
          <div key={sIdx} className="mb-3">
            <small className="text-muted fw-bold ms-3 mb-2 d-block mt-2" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
              {sec.label}
            </small>
            <ul className="nav flex-column gap-1">
              {sec.menus.map((menu, idx) => (
                <li className="nav-item" key={idx}>
                  <button 
                    className={`nav-link text-start w-100 btn ${activeMenu === menu.page ? 'btn-primary-subtle text-primary fw-bold' : 'btn-light text-dark'}`}
                    onClick={() => { setActiveMenu(menu.page); if(window.innerWidth < 768) toggleSidebar(); }}
                  >
                    <i className={`bi ${menu.icon} me-2`}></i> {menu.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

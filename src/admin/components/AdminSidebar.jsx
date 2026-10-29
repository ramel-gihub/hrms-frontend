import React from 'react';
import {
  GridIcon,
  UsersIcon,
  TableIcon,
  FileTextIcon,
  PieChartIcon,
  CalendarIcon,
  SettingsIcon,
  UserCircleIcon,
  LogOutIcon,
  LayersIcon,
  BuildingIcon,
  HomeIcon
} from './Icons';

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
  currentUser,
  handleLogout,
  isSuperAdmin = false,
  currentTenant,
  companyName,
  unmappedCount = 0,
  pendingLeavesCount = 0,
  pendingRequestsCount = 0
}) {
  const dynamicCompanyName = companyName || currentTenant?.company_name || currentUser?.tenant?.name || currentUser?.company_name || 'Ramel';
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <GridIcon className="w-5 h-5" /> },
    { id: "employees", label: "Employees", icon: <UsersIcon className="w-5 h-5" /> },
    { 
      id: "project-teams", 
      label: "Project Teams", 
      icon: <i className="bi bi-diagram-3-fill w-5 h-5 text-indigo-400 text-lg flex items-center justify-center" /> 
    },
    { 
      id: "admin-leaves", 
      label: "Manage Leaves", 
      icon: <CalendarIcon className="w-5 h-5 text-indigo-400" />
    },
    { 
      id: "admin-wfh", 
      label: "Manage WFH", 
      icon: <HomeIcon className="w-5 h-5 text-emerald-400" />
    },
    { 
      id: "leave-approvals", 
      label: "Leave Approvals", 
      icon: <CalendarIcon className="w-5 h-5" />,
      badge: pendingLeavesCount > 0 ? pendingLeavesCount : null,
      badgeColor: "bg-purple-500/20 text-purple-300 border border-purple-500/30"
    },
    { 
      id: "requests", 
      label: "Employee Requests", 
      icon: <FileTextIcon className="w-5 h-5" />,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : null,
      badgeColor: "bg-amber-500/20 text-amber-300 border border-amber-500/30"
    },
    { 
      id: "leave-balance-mapping", 
      label: "Leave Balance Mapping", 
      icon: <LayersIcon className="w-5 h-5" />,
      badge: unmappedCount > 0 ? `${unmappedCount} Unmapped` : null,
      badgeColor: "bg-rose-500 text-white font-bold"
    },
    { id: "holidays", label: "Public Holidays", icon: <CalendarIcon className="w-5 h-5 text-emerald-400" /> },
    /* { id: "calendar", label: "Calendar", icon: <CalendarIcon className="w-5 h-5" /> }, */
    /* 
    { id: "analytics", label: "Analytics & Reports", icon: <PieChartIcon className="w-5 h-5" /> }, 
    */
  ];

  const adminItems = [
    ...(isSuperAdmin ? [
      { id: "tenants", label: "Tenant Organizations", icon: <BuildingIcon className="w-5 h-5" /> }
    ] : []),
    { 
      id: "data-reset", 
      label: "Data Reset", 
      icon: <i className="bi bi-arrow-counterclockwise w-5 h-5 text-rose-400 text-lg flex items-center justify-center" /> 
    },
    { id: "profile", label: "Admin Profile", icon: <UserCircleIcon className="w-5 h-5" /> },
    { id: "settings", label: "Settings", icon: <SettingsIcon className="w-5 h-5" /> },
  ];

  const menuGroups = [
    { title: "MENU", items: menuItems },
    { title: "ADMINISTRATION", items: adminItems }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-50 flex h-screen w-72 flex-col justify-between bg-[#1c2434] text-[#dee4ee] transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ minWidth: "280px" }}
      >
        {/* Brand Header */}
        <div>
          <div className="flex h-20 items-center justify-between px-6 border-b border-[#2d3a4f]">
            <div className="flex items-center gap-3 cursor-pointer min-w-0" onClick={() => setActiveTab("dashboard")}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#3c50e0] to-[#5a6ff0] text-white shadow-md">
                <GridIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xl font-bold tracking-tight text-white block truncate" title={dynamicCompanyName}>
                  {dynamicCompanyName}
                </span>
                <span className="text-[11px] uppercase tracking-wider text-[#8a99ad] block font-semibold truncate">
                  {isSuperAdmin ? "SaaS Superadmin" : "HRMS ENTERPRISE"}
                </span>
              </div>
            </div>

            <button
              className="lg:hidden text-[#8a99ad] hover:text-white"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <i className="bi bi-x-lg text-lg"></i>
            </button>
          </div>

          {/* Navigation Items */}
          <div className="px-4 py-6 overflow-y-auto max-h-[calc(100vh-160px)] custom-scrollbar">
            {menuGroups.map((group, gIdx) => (
              <div key={gIdx} className="mb-6">
                <h3 className="px-4 mb-3 text-[11px] font-bold tracking-wider uppercase text-[#8a99ad]">
                  {group.title}
                </h3>
                <ul className="space-y-1.5">
                  {group.items.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab(item.id);
                            if (window.innerWidth < 1024) setSidebarOpen(false);
                          }}
                          className={`group flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-[#3c50e0] text-white shadow-sm"
                              : "text-[#dee4ee] hover:bg-[#333a48] hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <span className={isActive ? "text-white" : "text-[#8a99ad] group-hover:text-white"}>
                              {item.icon}
                            </span>
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-blue-600 text-white'}`}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Footer / User Profile & Logout */}
        <div className="p-4 border-t border-[#2d3a4f] bg-[#1a222f]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3c50e0] text-white font-bold text-sm">
                {(currentUser?.email || "A").charAt(0).toUpperCase()}
              </div>
              <div className="truncate" style={{ maxWidth: "140px" }}>
                <p className="text-sm font-semibold text-white truncate leading-tight">
                  {currentUser?.name || currentUser?.email?.split('@')[0] || "Admin"}
                </p>
                <span className="text-xs text-[#8a99ad] capitalize">
                  {isSuperAdmin ? "Super Administrator" : (currentUser?.role || "Administrator")}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-[#8a99ad] hover:text-rose-400 rounded-lg hover:bg-[#333a48] transition-colors"
              title="Logout"
            >
              <LogOutIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

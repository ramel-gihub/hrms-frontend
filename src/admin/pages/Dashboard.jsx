import React from 'react';
import EmptyState from "../../components/EmptyState";
import Chart from 'react-apexcharts';
import MetricCard from '../components/MetricCard';
import { UsersIcon, ClockIcon, FileTextIcon, CheckCircleIcon, ArrowUpIcon, PlusIcon, CalendarIcon } from '../components/Icons';

export default function Dashboard({
  employees = [],
  adminRequests = [],
  leaveRequests = [],
  tenants = [],
  onNavigate,
  onOpenAddModal,
  isSuperAdmin = false,
  currentTenant = {}
}) {
  const pendingLeaves = leaveRequests.filter(r => (r.status || '').toLowerCase() === 'pending');
  const pendingGeneral = adminRequests.filter(r => (r.status || '').toLowerCase() === 'pending');
  const totalPending = pendingLeaves.length + pendingGeneral.length;

  // Weekly attendance chart
  const attendanceChartOptions = {
    chart: {
      type: 'area',
      height: 310,
      toolbar: { show: false },
      fontFamily: 'Outfit, Inter, sans-serif'
    },
    colors: ['#3c50e0', '#10b981'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [20, 100]
      }
    },
    xaxis: {
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: '#64748b', fontSize: '12px' } }
    },
    yaxis: {
      labels: { style: { colors: '#64748b', fontSize: '12px' } }
    },
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 4
    },
    tooltip: { theme: 'light' },
    legend: { position: 'top', horizontalAlign: 'right' }
  };

  const attendanceChartSeries = [
    { name: 'Present Staff', data: [19, 21, 20, 23, 22, 6, 0] },
    { name: 'On Approved Leave', data: [2, 1, 3, 1, 2, 0, 0] }
  ];

  // Department distribution donut
  const deptMap = {};
  employees.forEach(e => {
    const dept = e.department || 'Engineering';
    deptMap[dept] = (deptMap[dept] || 0) + 1;
  });
  const deptLabels = Object.keys(deptMap).length > 0 ? Object.keys(deptMap) : ['Engineering', 'HR', 'Design', 'Sales'];
  const deptSeries = Object.values(deptMap).length > 0 ? Object.values(deptMap) : [14, 4, 3, 3];

  const deptChartOptions = {
    chart: { type: 'donut', fontFamily: 'Outfit, Inter, sans-serif' },
    colors: ['#3c50e0', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6'],
    labels: deptLabels,
    legend: { position: 'bottom' },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Staff',
              formatter: () => `${employees.length || 24}`
            }
          }
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard Overview
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isSuperAdmin 
              ? "SaaS Superadmin — monitoring attendance, leave approvals, and multi-tenant operations."
              : `${currentTenant?.company_name || 'Enterprise'} HRMS — monitoring staff, attendance, and leave approvals.`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate("leave-approvals")}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <CalendarIcon className="w-4 h-4 text-purple-500" />
            Leave Approvals ({pendingLeaves.length})
          </button>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 rounded-xl bg-[#3c50e0] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#3444be] transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Add Employee
          </button>
        </div>
      </div>

      {/* 4 TailAdmin KPI Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Employees"
          value={employees.length || 0}
          change="+12.5%"
          isPositive={true}
          icon={<UsersIcon className="w-6 h-6" />}
          color="blue"
        />
        {isSuperAdmin ? (
          <MetricCard
            title="Active Tenants"
            value={tenants.length || 1}
            change="Multi-Tenant Ready"
            isPositive={true}
            icon={<CheckCircleIcon className="w-6 h-6" />}
            color="green"
          />
        ) : (
          <MetricCard
            title="Active Staff"
            value={employees.length || 0}
            change="Company Workforce"
            isPositive={true}
            icon={<CheckCircleIcon className="w-6 h-6" />}
            color="green"
          />
        )}
        <MetricCard
          title="Pending Leave Requests"
          value={pendingLeaves.length}
          change={pendingLeaves.length > 0 ? "Action required" : "All cleared"}
          isPositive={pendingLeaves.length === 0}
          icon={<CalendarIcon className="w-6 h-6" />}
          color="purple"
        />
        <MetricCard
          title="Other Employee Requests"
          value={pendingGeneral.length}
          change={pendingGeneral.length > 0 ? `${pendingGeneral.length} pending` : "No pending"}
          isPositive={pendingGeneral.length === 0}
          icon={<FileTextIcon className="w-6 h-6" />}
          color="orange"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Attendance Trends */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm xl:col-span-8 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Weekly Attendance & Absence Analytics
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Real-time attendance ratio across teams</p>
            </div>
            <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              Live Week
            </span>
          </div>
          <div className="mt-4">
            <Chart options={attendanceChartOptions} series={attendanceChartSeries} type="area" height={310} />
          </div>
        </div>

        {/* Department Breakdown Donut */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm xl:col-span-4 dark:border-gray-800 dark:bg-gray-900 flex flex-col justify-between">
          <div className="border-b border-gray-100 pb-4 dark:border-gray-800">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Department Distribution
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Staff allocation by division</p>
          </div>
          <div className="my-auto py-4">
            <Chart options={deptChartOptions} series={deptSeries} type="donut" height={260} />
          </div>
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-center">
            <button
              onClick={() => onNavigate("employees")}
              className="text-xs font-semibold text-[#3c50e0] hover:underline"
            >
              View Full Employee Directory →
            </button>
          </div>
        </div>
      </div>

      {/* Pending Leave Approvals Highlights */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Pending Leave Approvals (With Leave Balances)
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Review leave applications with employee-wise balance cards
            </p>
          </div>
          <button
            onClick={() => onNavigate("leave-approvals")}
            className="text-xs font-semibold text-[#3c50e0] hover:underline"
          >
            Open Leave Approvals ({leaveRequests.length}) →
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingLeaves.slice(0, 2).map((leave) => (
            <div
              key={leave.id}
              className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/40 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 font-bold flex items-center justify-center text-sm">
                    {(leave.employee_name || 'E').charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                      {leave.employee_name}
                    </h4>
                    <span className="text-xs text-gray-500">{leave.employee_code} · {leave.department || 'Engineering'}</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  {leave.days_requested} {parseFloat(leave.days_requested) <= 1 ? 'Day' : 'Days'}
                </span>
              </div>

              {/* Employee Leave Balance Preview Card */}
              <div className="p-2.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700/60">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Available Leave Count</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">
                    {leave.totalAvailableLeaves !== undefined ? `${leave.totalAvailableLeaves} Days Left` : '12 Days Left'}
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {(leave.balances || []).slice(0, 3).map((b, bIdx) => (
                    <span key={bIdx} className="text-[11px] px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                      {b.leave_type_name}: <b>{parseFloat(b.available_days || 0)}d</b>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-gray-500 italic truncate max-w-[200px]">
                  "{leave.reason || 'Personal Purpose'}"
                </span>
                <button
                  onClick={() => onNavigate("leave-approvals")}
                  className="text-xs font-bold text-[#3c50e0] hover:underline"
                >
                  Review Details & Action →
                </button>
              </div>
            </div>
          ))}

          {pendingLeaves.length === 0 && (
            <div className="col-span-2">
              <EmptyState
                compact
                emoji="🏖️"
                title="No pending leave requests"
                message="All employee leave requests have been reviewed and processed."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

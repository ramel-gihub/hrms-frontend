import React, { useState, useEffect, useMemo } from 'react';
import EmptyState from '../../components/EmptyState';
import { SearchIcon, CloseIcon, CheckCircleIcon, FileTextIcon } from '../components/Icons';

export default function PayrollManagement({ currentTenant = {}, currentUser = {} }) {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';
  const tenantId = currentTenant?.id || currentUser?.organization_id || 1;

  // Tabs: 'payroll' (Monthly Attendance & Payslip Generator), 'ctc' (Employee CTC Store Master), 'config' (Percentage Master)
  const [activeTab, setActiveTab] = useState('payroll');

  // Dynamic Month & Year selection
  const currentDate = new Date();
  const currentCalYear = currentDate.getFullYear();
  const currentCalMonth = currentDate.getMonth() + 1; // 1-12

  const [selectedYear, setSelectedYear] = useState(currentCalYear);
  const [selectedMonth, setSelectedMonth] = useState(currentCalMonth);

  // Dynamic years list initialized dynamically around current calendar year
  const initialDynamicYears = useMemo(() => {
    const list = [];
    for (let y = currentCalYear + 2; y >= currentCalYear - 4; y--) {
      list.push(y);
    }
    return list;
  }, [currentCalYear]);

  const [availableYears, setAvailableYears] = useState(initialDynamicYears);

  // Data states
  const [loading, setLoading] = useState(false);
  const [salaryConfig, setSalaryConfig] = useState({
    basic_percent: 40.0,
    hra_percent: 20.0,
    travel_percent: 14.0,
    conveyance_percent: 12.0,
    medical_percent: 4.0,
    bonus_percent: 10.0,
    pt_amount: 250.0,
    pt_enabled: true,
    epf_percent: 12.0,
    epf_enabled: true,
    epf_cap_amount: 1800.0,
    tds_percent: 0.0,
    tds_enabled: false
  });

  const [employeesCtcList, setEmployeesCtcList] = useState([]);
  const [monthlyPayroll, setMonthlyPayroll] = useState([]);
  const [monthlyMeta, setMonthlyMeta] = useState({});

  // Search & filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Pagination state for Attendance & Salary Summary table
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal states
  const [activePayslipModal, setActivePayslipModal] = useState(null);
  const [editingCtcEmployee, setEditingCtcEmployee] = useState(null);
  const [customYearlyCtc, setCustomYearlyCtc] = useState(480000);
  const [epfApplicable, setEpfApplicable] = useState(true);
  const [ptApplicable, setPtApplicable] = useState(true);
  const [customMonthlyTds, setCustomMonthlyTds] = useState(0);
  const [adjustingAttendanceEmp, setAdjustingAttendanceEmp] = useState(null);
  const [adjustedPaidDays, setAdjustedPaidDays] = useState(30);
  const [adjustedLopDays, setAdjustedLopDays] = useState(0);
  const [adjustedRemarks, setAdjustedRemarks] = useState('');
  const [resettingAdjustment, setResettingAdjustment] = useState(false);

  // Selective Processing states (Process 5 today, remaining later)
  const [selectedEmpIds, setSelectedEmpIds] = useState([]);
  const [processingSelective, setProcessingSelective] = useState(false);

  // Status/Feedback alerts
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });
  const [savingConfig, setSavingConfig] = useState(false);
  const [savingCtc, setSavingCtc] = useState(false);
  const [generatingBatch, setGeneratingBatch] = useState(false);

  // Helper to convert number to words (for net pay in words)
  const numberToWords = (num) => {
    if (!num || isNaN(num)) return "Zero";
    const a = [
      "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
      "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    ];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const formatHundreds = (n) => {
      let str = "";
      if (n > 99) {
        str += a[Math.floor(n / 100)] + " Hundred ";
        n %= 100;
      }
      if (n > 19) {
        str += b[Math.floor(n / 10)] + " " + a[n % 10];
      } else if (n > 0) {
        str += a[n];
      }
      return str.trim();
    };

    let n = Math.floor(num);
    let output = "";
    if (n >= 10000000) {
      output += formatHundreds(Math.floor(n / 10000000)) + " Crore ";
      n %= 10000000;
    }
    if (n >= 100000) {
      output += formatHundreds(Math.floor(n / 100000)) + " Lakh ";
      n %= 100000;
    }
    if (n >= 1000) {
      output += formatHundreds(Math.floor(n / 1000)) + " Thousand ";
      n %= 1000;
    }
    if (n > 0) {
      output += formatHundreds(n);
    }
    return output.trim();
  };

  // Helper to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '22 Oct 2023';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const showFeedback = (type, text) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg({ type: '', text: '' }), 4000);
  };

  // Fetch Percentage Configuration
  const fetchSalaryConfig = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/payroll/config?orgId=${tenantId}`);
      const data = await res.json();
      if (data && data.config) {
        setSalaryConfig({
          basic_percent: Number(data.config.basic_percent ?? 40),
          hra_percent: Number(data.config.hra_percent ?? 20),
          travel_percent: Number(data.config.travel_percent ?? 14),
          conveyance_percent: Number(data.config.conveyance_percent ?? 12),
          medical_percent: Number(data.config.medical_percent ?? 4),
          bonus_percent: Number(data.config.bonus_percent ?? 10),
          pt_amount: Number(data.config.pt_amount !== undefined ? data.config.pt_amount : 250),
          pt_enabled: data.config.pt_enabled !== false,
          epf_percent: Number(data.config.epf_percent !== undefined ? data.config.epf_percent : 12),
          epf_enabled: data.config.epf_enabled !== false,
          epf_cap_amount: Number(data.config.epf_cap_amount !== undefined ? data.config.epf_cap_amount : 1800),
          tds_percent: Number(data.config.tds_percent || 0),
          tds_enabled: data.config.tds_enabled === true
        });
      }
    } catch (err) {
      console.error('Error fetching salary config:', err);
    }
  };

  // Fetch Employee CTC List
  const fetchEmployeesCtc = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/payroll/employees-ctc?orgId=${tenantId}`);
      const data = await res.json();
      if (data && Array.isArray(data.employees)) {
        setEmployeesCtcList(data.employees);
      }
    } catch (err) {
      console.error('Error fetching employees CTC:', err);
    }
  };

  // Fetch Monthly Payroll Summary (Attendance + Payslips)
  const fetchMonthlyPayroll = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/payroll/monthly-summary?orgId=${tenantId}&year=${selectedYear}&month=${selectedMonth}`);
      const data = await res.json();
      if (data && Array.isArray(data.summary)) {
        setMonthlyPayroll(data.summary);
        setMonthlyMeta({
          daysInMonth: data.days_in_month,
          monthName: data.month_name,
          financialYear: data.financial_year
        });
        if (Array.isArray(data.available_years) && data.available_years.length > 0) {
          setAvailableYears(data.available_years);
        }
      }
    } catch (err) {
      console.error('Error fetching monthly payroll:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaryConfig();
    fetchEmployeesCtc();
    fetchMonthlyPayroll();
  }, [tenantId, selectedYear, selectedMonth]);

  // Handle Save Percentage Master
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    const sum =
      Number(salaryConfig.basic_percent) +
      Number(salaryConfig.hra_percent) +
      Number(salaryConfig.travel_percent) +
      Number(salaryConfig.conveyance_percent) +
      Number(salaryConfig.medical_percent) +
      Number(salaryConfig.bonus_percent);

    if (Math.abs(sum - 100) > 0.05) {
      showFeedback('error', `Salary component percentages must total 100%. Current total: ${sum.toFixed(1)}%`);
      return;
    }

    setSavingConfig(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/payroll/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: tenantId,
          basicPercent: salaryConfig.basic_percent,
          hraPercent: salaryConfig.hra_percent,
          travelPercent: salaryConfig.travel_percent,
          conveyancePercent: salaryConfig.conveyance_percent,
          medicalPercent: salaryConfig.medical_percent,
          bonusPercent: salaryConfig.bonus_percent,
          ptAmount: salaryConfig.pt_amount,
          ptEnabled: salaryConfig.pt_enabled !== false,
          epfPercent: salaryConfig.epf_percent,
          epfEnabled: salaryConfig.epf_enabled !== false,
          epfCapAmount: salaryConfig.epf_cap_amount,
          tdsPercent: salaryConfig.tds_percent,
          tdsEnabled: salaryConfig.tds_enabled === true
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update salary configuration');
      }

      showFeedback('success', 'Salary percentage master & statutory deductions updated successfully!');
      await fetchSalaryConfig();
      await fetchEmployeesCtc();
      await fetchMonthlyPayroll();
    } catch (err) {
      showFeedback('error', err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  // Open Edit CTC Modal
  const handleOpenEditCtc = (emp) => {
    setEditingCtcEmployee(emp);
    setCustomYearlyCtc(Number(emp.ctc_yearly) || 480000);
    setEpfApplicable(emp.epf_applicable !== false);
    setPtApplicable(emp.pt_applicable !== false);
    setCustomMonthlyTds(Number(emp.monthly_tds) || 0);
  };

  // Handle Save Employee CTC
  const handleSaveEmployeeCtc = async (e) => {
    e.preventDefault();
    if (!editingCtcEmployee) return;

    setSavingCtc(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/payroll/employees-ctc/${editingCtcEmployee.employee_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: tenantId,
          ctcYearly: customYearlyCtc,
          epfApplicable: epfApplicable,
          ptApplicable: ptApplicable,
          monthlyTds: customMonthlyTds
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update employee CTC');
      }

      showFeedback('success', `CTC updated successfully for ${editingCtcEmployee.full_name}`);
      setEditingCtcEmployee(null);
      await fetchEmployeesCtc();
      await fetchMonthlyPayroll();
    } catch (err) {
      showFeedback('error', err.message);
    } finally {
      setSavingCtc(false);
    }
  };

  // Handle Generate / Recalculate Payslip for Single Employee (with manual override support)
  const handleGeneratePayslip = async (emp, customP = null, customL = null, isManual = false, remarks = '') => {
    try {
      const res = await fetch(`${API_URL}/api/admin/payroll/generate-payslip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: tenantId,
          employeeId: emp.employee_id,
          year: selectedYear,
          month: selectedMonth,
          paidDays: customP !== null ? customP : emp.paid_days,
          lopDays: customL !== null ? customL : emp.lop_days,
          isManualOverride: isManual,
          manualRemarks: remarks
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate payslip');
      }

      const result = await res.json();
      showFeedback('success', `Payslip generated for ${emp.full_name} (${monthlyMeta.monthName || 'Month'} ${selectedYear})`);
      await fetchMonthlyPayroll();
      if (activePayslipModal && activePayslipModal.employee_id === emp.employee_id) {
        setActivePayslipModal({ ...emp, ...result.payslip, status: 'Paid' });
      }
    } catch (err) {
      showFeedback('error', err.message);
    }
  };

  // Handle Reset Manual Adjustment / Revert to Dynamic Attendance & Leaves
  const handleResetAdjustment = async () => {
    if (!adjustingAttendanceEmp) return;
    setResettingAdjustment(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/payroll/reset-attendance-adjustment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: tenantId,
          employeeId: adjustingAttendanceEmp.employee_id,
          year: selectedYear,
          month: selectedMonth
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to reset attendance adjustment');
      }

      showFeedback('success', `Reset attendance and LOP calculation to dynamic for ${adjustingAttendanceEmp.full_name}`);
      await fetchMonthlyPayroll();
      setAdjustingAttendanceEmp(null);
    } catch (err) {
      showFeedback('error', err.message);
    } finally {
      setResettingAdjustment(false);
    }
  };

  // Handle Batch Generate All Payslips for Month
  const handleGenerateAllPayslips = async () => {
    if (!window.confirm(`Generate and disburse all employee payslips for ${monthlyMeta.monthName || 'Month'} ${selectedYear}?`)) {
      return;
    }
    setGeneratingBatch(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/payroll/generate-all-payslips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: tenantId,
          year: selectedYear,
          month: selectedMonth
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate batch payslips');
      }

      const result = await res.json();
      showFeedback('success', result.message || 'All payslips generated successfully!');
      await fetchMonthlyPayroll();
    } catch (err) {
      showFeedback('error', err.message);
    } finally {
      setGeneratingBatch(false);
    }
  };

  // Handle Attendance Adjustment Save (Manual Edit & Correction)
  const handleSaveAttendanceAdjustment = async (e) => {
    e.preventDefault();
    if (!adjustingAttendanceEmp) return;
    const pDays = Number(adjustedPaidDays);
    const lDays = Number(adjustedLopDays);

    await handleGeneratePayslip(adjustingAttendanceEmp, pDays, lDays, true, adjustedRemarks);
    setAdjustingAttendanceEmp(null);
  };

  // Toggle select employee for selective processing
  const handleToggleSelect = (empId) => {
    setSelectedEmpIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  // Toggle select all filtered employees
  const handleToggleSelectAll = () => {
    if (selectedEmpIds.length === filteredPayroll.length && filteredPayroll.length > 0) {
      setSelectedEmpIds([]);
    } else {
      setSelectedEmpIds(filteredPayroll.map((e) => e.employee_id));
    }
  };

  // Process selective employees (e.g. process 5 today, remaining next day)
  const handleProcessSelective = async (action = 'mark_paid') => {
    if (selectedEmpIds.length === 0) return;
    const actionLabel = action === 'mark_paid' ? 'generate and mark as PAID' : 'mark as PENDING';
    if (!window.confirm(`Are you sure you want to ${actionLabel} for ${selectedEmpIds.length} selected employee(s)?`)) {
      return;
    }

    setProcessingSelective(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/payroll/process-selective`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: tenantId,
          year: selectedYear,
          month: selectedMonth,
          employeeIds: selectedEmpIds,
          action
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to process selected employees');
      }

      const result = await res.json();
      showFeedback('success', result.message || 'Selected employees processed successfully!');
      setSelectedEmpIds([]);
      await fetchMonthlyPayroll();
    } catch (err) {
      showFeedback('error', err.message);
    } finally {
      setProcessingSelective(false);
    }
  };

  // Toggle single employee status between Paid and Pending
  const handleToggleSingleStatus = async (emp) => {
    const isCurrentlyPaid = (emp.status || '').toLowerCase() === 'paid';
    const newAction = isCurrentlyPaid ? 'mark_pending' : 'mark_paid';
    try {
      const res = await fetch(`${API_URL}/api/admin/payroll/process-selective`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: tenantId,
          year: selectedYear,
          month: selectedMonth,
          employeeIds: [emp.employee_id],
          action: newAction
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update employee status');
      }
      showFeedback('success', `${emp.full_name} marked as ${newAction === 'mark_paid' ? 'Paid' : 'Pending'}`);
      await fetchMonthlyPayroll();
    } catch (err) {
      showFeedback('error', err.message);
    }
  };

  // Export Complete Monthly Salary Report to Excel (.xls) matching exact user screenshot
  // When employees are selected (selectedEmpIds.length > 0), exports ONLY the selected employees
  const exportMonthlySalaryExcel = () => {
    if (!monthlyPayroll || monthlyPayroll.length === 0) {
      showFeedback('error', 'No payroll records available to export for this month.');
      return;
    }

    const isSelectionActive = selectedEmpIds.length > 0;
    const exportList = isSelectionActive
      ? monthlyPayroll.filter((e) => selectedEmpIds.includes(e.employee_id))
      : monthlyPayroll;

    if (exportList.length === 0) {
      showFeedback('error', 'No employee records found matching selection.');
      return;
    }

    const monthName = monthlyMeta.monthName || new Date(selectedYear, selectedMonth - 1, 1).toLocaleString('en-US', { month: 'long' });
    const bPct = Number(salaryConfig.basic_percent || 40);
    const hPct = Number(salaryConfig.hra_percent || 20);
    const tPct = Number(salaryConfig.travel_percent || 14);
    const cPct = Number(salaryConfig.conveyance_percent || 12);
    const mPct = Number(salaryConfig.medical_percent || 4);
    const bnPct = Number(salaryConfig.bonus_percent || 10);

    const titleSuffix = isSelectionActive ? ` (SELECTED: ${exportList.length} EMPLOYEES)` : '';

    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          table { border-collapse: collapse; font-family: Calibri, Arial, sans-serif; font-size: 11px; }
          th { background-color: #d8bfd8; color: #111827; font-weight: bold; border: 1px solid #7f7f7f; padding: 8px 10px; text-align: center; }
          td { border: 1px solid #cccccc; padding: 6px 8px; }
          .num { text-align: right; mso-number-format: "#,##0.00"; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .title { font-size: 14px; font-weight: bold; background-color: #ede4f5; text-align: center; padding: 12px; border: 1px solid #7f7f7f; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="20" class="title">
              ${(currentTenant?.company_name || 'RAMEL').toUpperCase()} - MONTHLY SALARY REGISTER${titleSuffix} · ${monthName.toUpperCase()} ${selectedYear} (FY ${monthlyMeta.financialYear || '2026-27'})
            </td>
          </tr>
          <tr>
            <th>SR NO.</th>
            <th>EMPLOYEE CODE</th>
            <th>EMPLOYEE NAME</th>
            <th>DEPARTMENT</th>
            <th>DESIGNATION</th>
            <th>PAID DAYS</th>
            <th>LOP DAYS</th>
            <th>CTC</th>
            <th>BASIC SALARY - ${bPct}%</th>
            <th>HOUSE RENT ALLOWANCE (HRA) - ${hPct}%</th>
            <th>TRAVEL ALLOWANCE - ${tPct}%</th>
            <th>CONVEYANCE ALLOWANCE - ${cPct}%</th>
            <th>MEDICAL ALLOWANCE - ${mPct}%</th>
            <th>BONUS (PERFORMANCE/STATUTORY) - ${bnPct}%</th>
            <th>GROSS</th>
            <th>PROFESSION TAX</th>
            <th>EPF</th>
            <th>TDS</th>
            <th>NET PAY</th>
            <th>STATUS</th>
          </tr>
    `;

    exportList.forEach((emp, index) => {
      const ctcYearlyVal = Number(emp.yearly_ctc || (Number(emp.monthly_ctc) * 12) || 480000);
      const isPaid = (emp.status || '').toLowerCase() === 'paid';
      html += `
        <tr>
          <td class="center">${index + 1}</td>
          <td class="center">${emp.employee_code || ''}</td>
          <td class="bold">${emp.full_name || ''}</td>
          <td>${emp.department || 'General'}</td>
          <td>${emp.designation || 'Staff'}</td>
          <td class="center">${emp.paid_days || 0}</td>
          <td class="center">${emp.lop_days || 0}</td>
          <td class="num">${ctcYearlyVal.toFixed(2)}</td>
          <td class="num">${Number(emp.basic_salary || 0).toFixed(2)}</td>
          <td class="num">${Number(emp.hra || 0).toFixed(2)}</td>
          <td class="num">${Number(emp.travel_allowance || 0).toFixed(2)}</td>
          <td class="num">${Number(emp.conveyance_allowance || 0).toFixed(2)}</td>
          <td class="num">${Number(emp.medical_allowance || 0).toFixed(2)}</td>
          <td class="num">${Number(emp.bonus || 0).toFixed(2)}</td>
          <td class="num bold">${Number(emp.gross_earnings || emp.monthly_ctc || 0).toFixed(2)}</td>
          <td class="num">${Number(emp.professional_tax || 0).toFixed(2)}</td>
          <td class="num">${Number(emp.epf_deductions || 0).toFixed(2)}</td>
          <td class="num">${Number(emp.tds_deductions || 0).toFixed(2)}</td>
          <td class="num bold" style="color: #1a5fb4;">${Number(emp.net_pay || 0).toFixed(2)}</td>
          <td class="center bold" style="color: ${isPaid ? '#2e7d32' : '#ed6c02'};">
            ${isPaid ? 'PAID' : 'PENDING'}
          </td>
        </tr>
      `;
    });

    const totalCTC = exportList.reduce((acc, curr) => acc + Number(curr.yearly_ctc || (Number(curr.monthly_ctc) * 12) || 0), 0);
    const totalBasic = exportList.reduce((acc, curr) => acc + Number(curr.basic_salary || 0), 0);
    const totalHRA = exportList.reduce((acc, curr) => acc + Number(curr.hra || 0), 0);
    const totalTravel = exportList.reduce((acc, curr) => acc + Number(curr.travel_allowance || 0), 0);
    const totalConveyance = exportList.reduce((acc, curr) => acc + Number(curr.conveyance_allowance || 0), 0);
    const totalMedical = exportList.reduce((acc, curr) => acc + Number(curr.medical_allowance || 0), 0);
    const totalBonus = exportList.reduce((acc, curr) => acc + Number(curr.bonus || 0), 0);
    const totalGross = exportList.reduce((acc, curr) => acc + Number(curr.gross_earnings || curr.monthly_ctc || 0), 0);
    const totalPT = exportList.reduce((acc, curr) => acc + Number(curr.professional_tax || 0), 0);
    const totalEPF = exportList.reduce((acc, curr) => acc + Number(curr.epf_deductions || 0), 0);
    const totalTDS = exportList.reduce((acc, curr) => acc + Number(curr.tds_deductions || 0), 0);
    const totalNet = exportList.reduce((acc, curr) => acc + Number(curr.net_pay || 0), 0);

    html += `
        <tr style="background-color: #f3f4f6; font-weight: bold;">
          <td colspan="7" class="center">TOTAL</td>
          <td class="num">${totalCTC.toFixed(2)}</td>
          <td class="num">${totalBasic.toFixed(2)}</td>
          <td class="num">${totalHRA.toFixed(2)}</td>
          <td class="num">${totalTravel.toFixed(2)}</td>
          <td class="num">${totalConveyance.toFixed(2)}</td>
          <td class="num">${totalMedical.toFixed(2)}</td>
          <td class="num">${totalBonus.toFixed(2)}</td>
          <td class="num">${totalGross.toFixed(2)}</td>
          <td class="num">${totalPT.toFixed(2)}</td>
          <td class="num">${totalEPF.toFixed(2)}</td>
          <td class="num">${totalTDS.toFixed(2)}</td>
          <td class="num" style="color: #1a5fb4;">${totalNet.toFixed(2)}</td>
          <td></td>
        </tr>
      </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = isSelectionActive
      ? `Monthly_Salary_Selected_${exportList.length}_${monthName}_${selectedYear}.xls`
      : `Monthly_Salary_Report_${monthName}_${selectedYear}.xls`;
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(url);
    showFeedback('success', `Exported ${exportList.length} ${isSelectionActive ? 'selected ' : ''}employee record(s) to Excel.`);
  };

  // Filtered monthly payroll records
  const filteredPayroll = useMemo(() => {
    return monthlyPayroll.filter((item) => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        (item.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.employee_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.department || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' || (item.status || 'Pending').toUpperCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [monthlyPayroll, searchTerm, statusFilter]);

  // Reset page when search, filter, or period changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, selectedYear, selectedMonth]);

  const totalPages = Math.max(1, Math.ceil(filteredPayroll.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPayroll = useMemo(() => {
    return filteredPayroll.slice(startIndex, startIndex + pageSize);
  }, [filteredPayroll, startIndex, pageSize]);

  // Overall KPI Metrics
  const totalPayrollMonthlyCost = monthlyPayroll.reduce((acc, curr) => acc + Number(curr.monthly_ctc || 0), 0);
  const totalNetDisbursed = monthlyPayroll.reduce((acc, curr) => acc + Number(curr.net_pay || 0), 0);
  const totalLopDeductions = monthlyPayroll.reduce((acc, curr) => acc + Number(curr.loss_of_pay || 0), 0);
  const totalPaidCount = monthlyPayroll.filter(i => (i.status || '').toLowerCase() === 'paid').length;

  // Percentage Sum Calculation
  const totalConfigPercent =
    Number(salaryConfig.basic_percent || 0) +
    Number(salaryConfig.hra_percent || 0) +
    Number(salaryConfig.travel_percent || 0) +
    Number(salaryConfig.conveyance_percent || 0) +
    Number(salaryConfig.medical_percent || 0) +
    Number(salaryConfig.bonus_percent || 0);

  // Computed Breakup Preview for Editing CTC Modal (Matches Image 2 Spreadsheet exactly)
  const previewMonthlyCtc = Math.round((Number(customYearlyCtc || 0) / 12) * 100) / 100;
  const ctcBreakupPreview = useMemo(() => {
    const y = Number(customYearlyCtc || 0);
    const m = previewMonthlyCtc;

    const bPct = Number(salaryConfig.basic_percent || 40);
    const hPct = Number(salaryConfig.hra_percent || 20);
    const tPct = Number(salaryConfig.travel_percent || 14);
    const cPct = Number(salaryConfig.conveyance_percent || 12);
    const mPct = Number(salaryConfig.medical_percent || 4);
    const bnPct = Number(salaryConfig.bonus_percent || 10);

    return [
      { name: 'Basic Salary', pct: bPct, monthly: Math.round((m * (bPct / 100))), yearly: Math.round((y * (bPct / 100))) },
      { name: 'House Rent Allowance (HRA)', pct: hPct, monthly: Math.round((m * (hPct / 100))), yearly: Math.round((y * (hPct / 100))) },
      { name: 'Travel Allowance', pct: tPct, monthly: Math.round((m * (tPct / 100))), yearly: Math.round((y * (tPct / 100))) },
      { name: 'Conveyance allowance', pct: cPct, monthly: Math.round((m * (cPct / 100))), yearly: Math.round((y * (cPct / 100))) },
      { name: 'Medical Allowance', pct: mPct, monthly: Math.round((m * (mPct / 100))), yearly: Math.round((y * (mPct / 100))) },
      { name: 'Bonus (Performance/Statutory)', pct: bnPct, monthly: Math.round((m * (bnPct / 100))), yearly: Math.round((y * (bnPct / 100))) }
    ];
  }, [customYearlyCtc, previewMonthlyCtc, salaryConfig]);

  // Live Deductions Preview for CTC Modal (Matches Image 3)
  const deductionsPreview = useMemo(() => {
    const m = previewMonthlyCtc;
    const bPct = Number(salaryConfig.basic_percent || 40);
    const basicMonthly = Math.round(m * (bPct / 100));

    const ptAmount = (ptApplicable && salaryConfig.pt_enabled !== false)
      ? Number(salaryConfig.pt_amount !== undefined ? salaryConfig.pt_amount : 250)
      : 0;

    let epfAmount = 0;
    if (epfApplicable && salaryConfig.epf_enabled !== false && Number(salaryConfig.epf_percent || 0) > 0) {
      epfAmount = Math.round(basicMonthly * (Number(salaryConfig.epf_percent) / 100));
      if (Number(salaryConfig.epf_cap_amount) > 0) {
        epfAmount = Math.min(epfAmount, Number(salaryConfig.epf_cap_amount));
      }
    }

    let tdsAmount = Number(customMonthlyTds || 0);
    if (tdsAmount === 0 && salaryConfig.tds_enabled && Number(salaryConfig.tds_percent || 0) > 0) {
      tdsAmount = Math.round(m * (Number(salaryConfig.tds_percent) / 100));
    }

    const grossDeductions = Math.round((ptAmount + epfAmount + tdsAmount) * 100) / 100;
    const netPayable = Math.round((m - grossDeductions) * 100) / 100;

    return {
      lossOfPay: 0,
      professionTax: ptAmount,
      epfDeductions: epfAmount,
      tdsDeductions: tdsAmount,
      grossDeductions,
      netPayable
    };
  }, [previewMonthlyCtc, salaryConfig, ptApplicable, epfApplicable, customMonthlyTds]);

  return (
    <div className="space-y-6">
      {/* Print Specific CSS to format clean PDF payslips */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-payslip-area, .printable-payslip-area * {
            visibility: visible;
          }
          .printable-payslip-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header & Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between no-print">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Payroll & CTC Management
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure salary percentages, manage employee CTC masters, compute monthly attendance-based payroll, and generate dynamic payslips.
          </p>
        </div>

        {/* Tab Navigation Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <button
            onClick={() => setActiveTab('payroll')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'payroll'
                ? 'bg-white text-[#3c50e0] shadow-xs dark:bg-gray-700 dark:text-white font-bold'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
            }`}
          >
            Monthly Payroll & Attendance
          </button>

          <button
            onClick={() => setActiveTab('ctc')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'ctc'
                ? 'bg-white text-[#3c50e0] shadow-xs dark:bg-gray-700 dark:text-white font-bold'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
            }`}
          >
            Employee CTC Master
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'config'
                ? 'bg-white text-[#3c50e0] shadow-xs dark:bg-gray-700 dark:text-white font-bold'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
            }`}
          >
            Salary Percentage Master
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMsg.text && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between no-print ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
              : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg({ type: '', text: '' })}>
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: MONTHLY PAYROLL & ATTENDANCE GENERATOR                             */}
      {/* ========================================================================= */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-800 no-print">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase text-gray-500">Payroll Period:</span>
              {/* Dynamic Month Selector */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-800 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const m = i + 1;
                  const monthDate = new Date(selectedYear, i, 1);
                  const monthName = monthDate.toLocaleString('en-US', { month: 'long' });
                  const isCurrent = (selectedYear === currentCalYear && m === currentCalMonth);
                  return (
                    <option key={m} value={m}>
                      {monthName} {isCurrent ? '• (Current)' : ''}
                    </option>
                  );
                })}
              </select>

              {/* Dynamic Year Selector */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-800 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr} {yr === currentCalYear ? '(Current)' : ''}
                  </option>
                ))}
              </select>

              <span className="text-xs text-gray-400">
                ({monthlyMeta.daysInMonth || new Date(selectedYear, selectedMonth, 0).getDate()} days · FY {monthlyMeta.financialYear || (selectedMonth >= 4 ? `${selectedYear}-${String(selectedYear + 1).slice(-2)}` : `${selectedYear - 1}-${String(selectedYear).slice(-2)}`)})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportMonthlySalaryExcel}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 shadow-xs hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 transition-colors"
                title="Export complete monthly salary register to Excel spreadsheet"
              >
                <i className="bi bi-file-earmark-excel-fill text-emerald-600 dark:text-emerald-400"></i>
                Export Excel Report
              </button>

              <button
                onClick={handleGenerateAllPayslips}
                disabled={generatingBatch}
                className="inline-flex items-center gap-2 rounded-xl bg-[#3c50e0] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#3444be] disabled:opacity-50 transition-colors"
              >
                <i className="bi bi-lightning-charge-fill"></i>
                {generatingBatch ? 'Processing...' : 'Generate All Payslips'}
              </button>

              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <i className="bi bi-printer"></i>
                Print Summary
              </button>
            </div>
          </div>

          {/* Selective Processing Action Bar (When employees are checked) */}
          {selectedEmpIds.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl dark:bg-emerald-950/40 dark:border-emerald-800 animate-fadeIn no-print shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white font-extrabold text-xs shadow-xs">
                  {selectedEmpIds.length}
                </span>
                <div>
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    {selectedEmpIds.length} employee{selectedEmpIds.length > 1 ? 's' : ''} selected
                  </span>
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                    Batch pay selected employees now (e.g. process 5 employees today, remaining later)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportMonthlySalaryExcel}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-emerald-400 bg-white text-emerald-800 text-xs font-bold hover:bg-emerald-100 dark:bg-gray-800 dark:text-emerald-300 dark:border-emerald-700 transition-colors shadow-xs"
                  title={`Export only ${selectedEmpIds.length} selected employee(s) to Excel`}
                >
                  <i className="bi bi-file-earmark-excel-fill text-emerald-600 dark:text-emerald-400"></i>
                  Export Selected to Excel ({selectedEmpIds.length})
                </button>

                <button
                  onClick={() => handleProcessSelective('mark_paid')}
                  disabled={processingSelective}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  <i className="bi bi-check-circle-fill"></i>
                  {processingSelective ? 'Processing...' : `Mark Paid for Selected (${selectedEmpIds.length})`}
                </button>

                <button
                  onClick={() => handleProcessSelective('mark_pending')}
                  disabled={processingSelective}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-xs font-bold hover:bg-amber-100 dark:bg-amber-950/60 dark:border-amber-700 dark:text-amber-300 disabled:opacity-50 transition-colors"
                >
                  <i className="bi bi-clock-history"></i>
                  Mark as Pending
                </button>

                <button
                  onClick={() => setSelectedEmpIds([])}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white px-2 py-1 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
            <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-800">
              <span className="text-xs font-semibold text-gray-500 uppercase">Monthly Payroll Budget</span>
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1.5">
                ₹ {totalPayrollMonthlyCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
              <span className="text-xs text-gray-400 mt-1 inline-block">Sum of all employee monthly CTC</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-800">
              <span className="text-xs font-semibold text-gray-500 uppercase">Net Disbursed Pay</span>
              <h3 className="text-2xl font-extrabold text-emerald-600 mt-1.5">
                ₹ {totalNetDisbursed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
              <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">After attendance proration & PT</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-800">
              <span className="text-xs font-semibold text-gray-500 uppercase">Attendance LOP Deductions</span>
              <h3 className="text-2xl font-extrabold text-amber-600 mt-1.5">
                ₹ {totalLopDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
              <span className="text-xs text-amber-600 font-semibold mt-1 inline-block">Calculated from unexcused absences</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-800">
              <span className="text-xs font-semibold text-gray-500 uppercase">Payslips Issued</span>
              <h3 className="text-2xl font-extrabold text-[#3c50e0] mt-1.5">
                {totalPaidCount} / {monthlyPayroll.length}
              </h3>
              <span className="text-xs text-purple-600 font-semibold mt-1 inline-block">
                {monthlyPayroll.length - totalPaidCount} pending release
              </span>
            </div>
          </div>

          {/* Table Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden space-y-4 no-print">
            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="relative flex-1 max-w-md">
                <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by employee name, code, department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-700 font-medium focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  <option value="ALL">All Status</option>
                  <option value="PAID">Paid / Generated</option>
                  <option value="PENDING">Pending</option>
                </select>

                <button
                  onClick={exportMonthlySalaryExcel}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 shadow-xs hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 transition-colors"
                  title={selectedEmpIds.length > 0 ? `Export ${selectedEmpIds.length} selected employee(s) to Excel` : "Export complete monthly salary register to Excel spreadsheet (.xls)"}
                >
                  <i className="bi bi-file-earmark-excel-fill text-emerald-600 dark:text-emerald-400"></i>
                  <span>{selectedEmpIds.length > 0 ? `Export Selected Excel (${selectedEmpIds.length})` : 'Export Monthwise Excel'}</span>
                </button>
              </div>
            </div>

            {/* Attendance & Salary Summary Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50/75 text-xs uppercase font-semibold text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
                  <tr>
                    <th className="px-3 py-3 rounded-l-xl w-10 text-center">
                      <input
                        type="checkbox"
                        checked={paginatedPayroll.length > 0 && paginatedPayroll.every(e => selectedEmpIds.includes(e.employee_id))}
                        onChange={handleToggleSelectAll}
                        className="rounded border-gray-300 text-[#3c50e0] focus:ring-[#3c50e0] w-4 h-4 cursor-pointer"
                        title="Select All Employees"
                      />
                    </th>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Dept / Role</th>
                    <th className="px-4 py-3 text-right">Monthly CTC</th>
                    <th className="px-4 py-3 text-center">Working / Paid / LOP</th>
                    <th className="px-4 py-3 text-right">Gross Earned</th>
                    <th className="px-4 py-3 text-right">Deductions</th>
                    <th className="px-4 py-3 text-right">Net Payable</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right rounded-r-xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {loading ? (
                    <tr>
                      <td colSpan="10" className="py-8 text-center text-xs text-gray-400">
                        Calculating monthly attendance and salary...
                      </td>
                    </tr>
                  ) : filteredPayroll.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ padding: '2rem 0' }}>
                        <EmptyState
                          emoji="💰"
                          title="No payroll records found"
                          message="No employees match your search or filter criteria for this month."
                        />
                      </td>
                    </tr>
                  ) : (
                    paginatedPayroll.map((emp) => {
                      const isPaid = (emp.status || '').toLowerCase() === 'paid';
                      const isChecked = selectedEmpIds.includes(emp.employee_id);
                      return (
                        <tr
                          key={emp.employee_id}
                          className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors ${
                            isChecked ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                          }`}
                        >
                          <td className="px-3 py-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSelect(emp.employee_id)}
                              className="rounded border-gray-300 text-[#3c50e0] focus:ring-[#3c50e0] w-4 h-4 cursor-pointer"
                            />
                          </td>

                          <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-white">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#3c50e0] to-[#607afb] text-white font-bold text-xs shrink-0 shadow-sm">
                                {emp.full_name?.charAt(0) || 'E'}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 dark:text-white leading-tight">
                                  {emp.full_name}
                                </p>
                                <span className="text-[11px] text-gray-400 font-mono">{emp.employee_code}</span>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 text-xs">
                            <div className="font-medium text-gray-800 dark:text-gray-200">{emp.department || 'General'}</div>
                            <span className="text-[11px] text-gray-400">{emp.designation || 'Staff'}</span>
                          </td>

                          <td className="px-4 py-3.5 text-right font-mono text-xs font-semibold text-gray-900 dark:text-white">
                            ₹ {Number(emp.monthly_ctc).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <button
                              onClick={() => {
                                setAdjustingAttendanceEmp(emp);
                                setAdjustedPaidDays(emp.paid_days !== undefined ? emp.paid_days : (monthlyMeta.daysInMonth || 30));
                                setAdjustedLopDays(emp.lop_days !== undefined ? emp.lop_days : 0);
                                setAdjustedRemarks(emp.manual_remarks || '');
                              }}
                              className="group inline-flex flex-col items-center justify-center p-2 rounded-xl border border-gray-200 hover:border-[#3c50e0] hover:bg-blue-50/40 dark:border-gray-700 dark:hover:border-blue-500 dark:hover:bg-blue-950/20 transition-all text-left shadow-xs"
                              title="Click to view attendance & leave details, or manually edit Paid/LOP days"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                  {emp.paid_days} P
                                </span>
                                <span className="text-xs text-gray-300">/</span>
                                <span className={`text-xs font-bold ${Number(emp.lop_days) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                  {emp.lop_days} LOP
                                </span>
                                <i className="bi bi-pencil-square text-[11px] text-gray-400 group-hover:text-[#3c50e0] ml-0.5"></i>
                              </div>
                              <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                                <span>Work: {emp.standard_working_days || 20}d</span>
                                <span>•</span>
                                <span>Att: {emp.present_days || 0}d</span>
                                {Number(emp.approved_paid_leave_days) > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="text-blue-500 font-medium">Lv: {emp.approved_paid_leave_days}d</span>
                                  </>
                                )}
                                {emp.is_manual_override && (
                                  <span className="ml-0.5 px-1 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[9px] font-bold">
                                    Manual
                                  </span>
                                )}
                              </div>
                            </button>
                          </td>

                          <td className="px-4 py-3.5 text-right font-mono text-xs text-gray-800 dark:text-gray-200">
                            ₹ {Number(emp.gross_earnings).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>

                          <td className="px-4 py-3.5 text-right font-mono text-xs text-rose-500">
                            - ₹ {Number(emp.total_deductions).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>

                          <td className="px-4 py-3.5 text-right font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            ₹ {Number(emp.net_pay).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            {isPaid ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                                ● Paid
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                                ○ Pending
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View / Download Payslip Button */}
                              <button
                                onClick={() => setActivePayslipModal(emp)}
                                className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:text-[#3c50e0] dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                                title="View & Print Official Payslip"
                              >
                                View
                              </button>

                              {/* Direct Status Toggle (Mark Paid vs Mark Pending) */}
                              {isPaid ? (
                                <button
                                  onClick={() => handleToggleSingleStatus(emp)}
                                  className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300 transition-colors"
                                  title="Click to revert status to Pending"
                                >
                                  Unpay
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleToggleSingleStatus(emp)}
                                  className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs"
                                  title="Click to process and mark Paid now"
                                >
                                  Pay Now
                                </button>
                              )}

                              {/* Generate / Recalculate button */}
                              <button
                                onClick={() => handleGeneratePayslip(emp)}
                                className="rounded-lg bg-gray-100 p-1 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 transition-colors"
                                title={isPaid ? "Recalculate Payslip" : "Generate & Mark Paid"}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredPayroll.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-800 no-print">
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    Showing <strong className="text-gray-700 dark:text-gray-200">{startIndex + 1}</strong> to{' '}
                    <strong className="text-gray-700 dark:text-gray-200">
                      {Math.min(startIndex + pageSize, filteredPayroll.length)}
                    </strong> of <strong className="text-gray-700 dark:text-gray-200">{filteredPayroll.length}</strong> employees
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span>Per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 focus:outline-none"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[32px] px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        currentPage === page
                          ? 'bg-[#3c50e0] text-white shadow-xs'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EMPLOYEE CTC MASTER (Store & Component Breakup)                    */}
      {/* ========================================================================= */}
      {activeTab === 'ctc' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Employee Compensation & CTC Master
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Configure Yearly and Monthly CTC packages. Components automatically calculate based on organization percentage master.
              </p>
            </div>

            <div className="relative max-w-xs">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-1.5 text-xs text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50/75 text-xs uppercase font-semibold text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3 rounded-l-xl">Employee</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Designation</th>
                    <th className="px-4 py-3 text-center">EPF / PT</th>
                    <th className="px-4 py-3 text-right">Monthly CTC</th>
                    <th className="px-4 py-3 text-right">Yearly CTC</th>
                    <th className="px-4 py-3 text-right rounded-r-xl">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {employeesCtcList.filter(e => 
                    searchTerm.trim() === '' || 
                    (e.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (e.employee_code || '').toLowerCase().includes(searchTerm.toLowerCase())
                  ).map((emp) => (
                    <tr key={emp.employee_id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-white">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#3c50e0] to-[#607afb] text-white font-bold text-xs shrink-0 shadow-sm">
                            {emp.full_name?.charAt(0) || 'E'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white leading-tight">
                              {emp.full_name}
                            </p>
                            <span className="text-[11px] text-gray-400 font-mono">{emp.employee_code}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-xs text-gray-700 dark:text-gray-300">
                        {emp.department || 'Engineering'}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-gray-700 dark:text-gray-300">
                        {emp.designation || 'Staff'}
                      </td>

                      <td className="px-4 py-3.5 text-center text-xs">
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              emp.epf_applicable !== false
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                            title={emp.epf_applicable !== false ? 'EPF Applicable (12% Basic)' : 'EPF Exempt'}
                          >
                            EPF {emp.epf_applicable !== false ? '✓' : '✗'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              emp.pt_applicable !== false
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                            title={emp.pt_applicable !== false ? 'PT Applicable (₹250/mo)' : 'PT Exempt'}
                          >
                            PT {emp.pt_applicable !== false ? '✓' : '✗'}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        ₹ {Number(emp.ctc_monthly).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono text-xs font-bold text-gray-900 dark:text-white">
                        ₹ {Number(emp.ctc_yearly).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => handleOpenEditCtc(emp)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:text-[#3c50e0] dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                        >
                          <i className="bi bi-gear-fill text-xs"></i>
                          Configure CTC
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SALARY PERCENTAGE MASTER CONFIGURATION                             */}
      {/* ========================================================================= */}
      {activeTab === 'config' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-800 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Salary Component Percentage Master
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Define the percentage allocation for each salary component. The sum must total 100%.
                </p>
              </div>

              <div className="mt-2 sm:mt-0 flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500">Current Total:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                    Math.abs(totalConfigPercent - 100) < 0.05
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                  }`}
                >
                  {totalConfigPercent.toFixed(1)}% {Math.abs(totalConfigPercent - 100) < 0.05 ? '✓ Balanced' : '⚠ Must be 100%'}
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Salary */}
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/40">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-800 dark:text-white">Basic Salary (%)</label>
                    <span className="text-[11px] text-gray-400">Default: 40%</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={salaryConfig.basic_percent}
                      onChange={(e) => setSalaryConfig({ ...salaryConfig, basic_percent: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-gray-200 p-2 text-xs font-mono font-bold text-gray-900 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                    <span className="absolute right-3 top-2 text-xs text-gray-400 font-bold">%</span>
                  </div>
                </div>

                {/* HRA */}
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/40">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-800 dark:text-white">House Rent Allowance (HRA) (%)</label>
                    <span className="text-[11px] text-gray-400">Default: 20%</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={salaryConfig.hra_percent}
                      onChange={(e) => setSalaryConfig({ ...salaryConfig, hra_percent: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-gray-200 p-2 text-xs font-mono font-bold text-gray-900 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                    <span className="absolute right-3 top-2 text-xs text-gray-400 font-bold">%</span>
                  </div>
                </div>

                {/* Travel Allowance */}
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/40">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-800 dark:text-white">Travel Allowance (%)</label>
                    <span className="text-[11px] text-gray-400">Default: 14%</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={salaryConfig.travel_percent}
                      onChange={(e) => setSalaryConfig({ ...salaryConfig, travel_percent: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-gray-200 p-2 text-xs font-mono font-bold text-gray-900 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                    <span className="absolute right-3 top-2 text-xs text-gray-400 font-bold">%</span>
                  </div>
                </div>

                {/* Conveyance Allowance */}
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/40">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-800 dark:text-white">Conveyance Allowance (%)</label>
                    <span className="text-[11px] text-gray-400">Default: 12%</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={salaryConfig.conveyance_percent}
                      onChange={(e) => setSalaryConfig({ ...salaryConfig, conveyance_percent: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-gray-200 p-2 text-xs font-mono font-bold text-gray-900 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                    <span className="absolute right-3 top-2 text-xs text-gray-400 font-bold">%</span>
                  </div>
                </div>

                {/* Medical Allowance */}
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/40">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-800 dark:text-white">Medical Allowance (%)</label>
                    <span className="text-[11px] text-gray-400">Default: 4%</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={salaryConfig.medical_percent}
                      onChange={(e) => setSalaryConfig({ ...salaryConfig, medical_percent: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-gray-200 p-2 text-xs font-mono font-bold text-gray-900 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                    <span className="absolute right-3 top-2 text-xs text-gray-400 font-bold">%</span>
                  </div>
                </div>

                {/* Bonus (Performance/Statutory) */}
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/40">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-800 dark:text-white">Bonus (Performance/Statutory) (%)</label>
                    <span className="text-[11px] text-gray-400">Default: 10%</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={salaryConfig.bonus_percent}
                      onChange={(e) => setSalaryConfig({ ...salaryConfig, bonus_percent: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-gray-200 p-2 text-xs font-mono font-bold text-gray-900 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                    <span className="absolute right-3 top-2 text-xs text-gray-400 font-bold">%</span>
                  </div>
                </div>
              </div>

              {/* Statutory Deductions Section */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                      Statutory Deductions Configuration
                    </span>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Configure statutory EPF, Profession Tax, and TDS deduction rules across all employees.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Profession Tax Card */}
                  <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-800 dark:text-white flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={salaryConfig.pt_enabled}
                          onChange={(e) => setSalaryConfig({ ...salaryConfig, pt_enabled: e.target.checked })}
                          className="rounded border-gray-300 text-[#3c50e0] focus:ring-[#3c50e0] w-4 h-4"
                        />
                        Profession Tax (PT)
                      </label>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                        {salaryConfig.pt_enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-gray-500 block mb-1">Monthly Flat Amount (₹)</span>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs text-gray-400 font-bold">₹</span>
                        <input
                          type="number"
                          step="1"
                          required
                          value={salaryConfig.pt_amount}
                          onChange={(e) => setSalaryConfig({ ...salaryConfig, pt_amount: parseFloat(e.target.value) || 0 })}
                          className="w-full rounded-xl border border-gray-200 pl-7 pr-3 py-1.5 text-xs font-mono font-bold text-gray-900 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 block">Default: ₹250.00 / month</span>
                    </div>
                  </div>

                  {/* EPF Deductions Card */}
                  <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-800 dark:text-white flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={salaryConfig.epf_enabled}
                          onChange={(e) => setSalaryConfig({ ...salaryConfig, epf_enabled: e.target.checked })}
                          className="rounded border-gray-300 text-[#3c50e0] focus:ring-[#3c50e0] w-4 h-4"
                        />
                        EPF Deductions
                      </label>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {salaryConfig.epf_enabled ? '12% Basic' : 'Disabled'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[11px] text-gray-500 block mb-1">Rate (% Basic)</span>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.5"
                            required
                            value={salaryConfig.epf_percent}
                            onChange={(e) => setSalaryConfig({ ...salaryConfig, epf_percent: parseFloat(e.target.value) || 0 })}
                            className="w-full rounded-xl border border-gray-200 p-1.5 pr-6 text-xs font-mono font-bold text-gray-900 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                          />
                          <span className="absolute right-2 top-1.5 text-xs text-gray-400 font-bold">%</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] text-gray-500 block mb-1">Wage Cap (₹)</span>
                        <input
                          type="number"
                          step="100"
                          value={salaryConfig.epf_cap_amount}
                          onChange={(e) => setSalaryConfig({ ...salaryConfig, epf_cap_amount: parseFloat(e.target.value) || 0 })}
                          placeholder="1800 (0=No cap)"
                          className="w-full rounded-xl border border-gray-200 p-1.5 text-xs font-mono font-bold text-gray-900 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 block">Cap: ₹1,800.00 / mo (12% of ₹15,000)</span>
                  </div>

                  {/* TDS Deductions Card */}
                  <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-800 dark:text-white flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={salaryConfig.tds_enabled}
                          onChange={(e) => setSalaryConfig({ ...salaryConfig, tds_enabled: e.target.checked })}
                          className="rounded border-gray-300 text-[#3c50e0] focus:ring-[#3c50e0] w-4 h-4"
                        />
                        TDS Deductions
                      </label>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                        {salaryConfig.tds_enabled ? `${salaryConfig.tds_percent}%` : 'Per-Emp'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-gray-500 block mb-1">Default Rate (% Gross)</span>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          value={salaryConfig.tds_percent}
                          onChange={(e) => setSalaryConfig({ ...salaryConfig, tds_percent: parseFloat(e.target.value) || 0 })}
                          className="w-full rounded-xl border border-gray-200 p-1.5 pr-6 text-xs font-mono font-bold text-gray-900 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        />
                        <span className="absolute right-2 top-1.5 text-xs text-gray-400 font-bold">%</span>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 block">Can be customized per employee</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="submit"
                  disabled={savingConfig || Math.abs(totalConfigPercent - 100) > 0.05}
                  className="rounded-xl bg-[#3c50e0] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#3444be] disabled:opacity-50 transition-colors"
                >
                  {savingConfig ? 'Saving Master...' : 'Save Percentage Master'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIGURE EMPLOYEE CTC (Matches Image 2 Spreadsheet exactly)       */}
      {/* ========================================================================= */}
      {editingCtcEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm no-print">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Configure Employee CTC & Salary Structure
                </h3>
                <p className="text-xs text-gray-500">
                  {editingCtcEmployee.full_name} ({editingCtcEmployee.employee_code}) · {editingCtcEmployee.designation || 'Staff'}
                </p>
              </div>
              <button onClick={() => setEditingCtcEmployee(null)} className="text-gray-400 hover:text-gray-600">
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployeeCtc} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    CTC YEARLY (₹)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    required
                    value={customYearlyCtc}
                    onChange={(e) => setCustomYearlyCtc(Number(e.target.value) || 0)}
                    className="w-full rounded-xl border border-gray-300 p-2 text-sm font-mono font-bold text-gray-900 focus:border-[#3c50e0] focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">e.g. 480000</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Total Monthly CTC (₹)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`₹ ${previewMonthlyCtc.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                    className="w-full rounded-xl border border-gray-200 p-2 text-sm font-mono font-extrabold text-emerald-600 bg-gray-100 dark:bg-gray-800 dark:border-gray-700"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">Auto-computed: Yearly ÷ 12</span>
                </div>
              </div>

              {/* Employee Statutory Deduction Applicability */}
              <div className="p-4 rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/40 space-y-3">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider block">
                  Statutory Deductions Applicability
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={epfApplicable}
                      onChange={(e) => setEpfApplicable(e.target.checked)}
                      className="rounded border-gray-300 text-[#3c50e0] focus:ring-[#3c50e0] w-4 h-4"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-gray-800 dark:text-white block">EPF Applicable</span>
                      <span className="text-[10px] text-gray-400">12% Basic (Cap ₹1,800)</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ptApplicable}
                      onChange={(e) => setPtApplicable(e.target.checked)}
                      className="rounded border-gray-300 text-[#3c50e0] focus:ring-[#3c50e0] w-4 h-4"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-gray-800 dark:text-white block">PT Applicable</span>
                      <span className="text-[10px] text-gray-400">₹{salaryConfig.pt_amount || 250}/mo</span>
                    </div>
                  </label>

                  <div className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800">
                    <span className="text-xs font-bold text-gray-800 dark:text-white block mb-1">Monthly Custom TDS</span>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-xs text-gray-400 font-bold">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={customMonthlyTds}
                        onChange={(e) => setCustomMonthlyTds(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full rounded-lg border border-gray-200 pl-6 pr-2 py-1 text-xs font-mono font-bold text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Exact Spreadsheet Table from User Image 2 */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  Live CTC Component Breakup (Based on Percentage Master)
                </span>

                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 dark:bg-gray-800 font-bold text-gray-700 dark:text-gray-300 uppercase">
                      <tr>
                        <th className="px-3 py-2.5">Component</th>
                        <th className="px-3 py-2.5 text-center">%</th>
                        <th className="px-3 py-2.5 text-right">MONTHLY</th>
                        <th className="px-3 py-2.5 text-right">YEARLY</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-mono">
                      {ctcBreakupPreview.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                          <td className="px-3 py-2 font-sans font-medium text-gray-800 dark:text-gray-200">{item.name}</td>
                          <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">{item.pct}%</td>
                          <td className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-white">
                            {item.monthly.toLocaleString('en-IN')}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                            {item.yearly.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-100/80 dark:bg-gray-800/80 font-bold text-gray-900 dark:text-white">
                        <td className="px-3 py-2.5 font-sans">total</td>
                        <td className="px-3 py-2.5 text-center">100</td>
                        <td className="px-3 py-2.5 text-right text-emerald-600 dark:text-emerald-400">
                          {Math.round(previewMonthlyCtc).toLocaleString('en-IN')}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {Number(customYearlyCtc).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Exact Statutory Deductions Preview Table (Matches User Image 3) */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  Monthly Statutory Deductions Preview
                </span>

                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 dark:bg-gray-800 font-bold text-gray-700 dark:text-gray-300 uppercase">
                      <tr>
                        <th className="px-3 py-2.5">DEDUCTIONS</th>
                        <th className="px-3 py-2.5 text-right">AMOUNT (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-mono">
                      <tr className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                        <td className="px-3 py-2 font-sans font-medium text-gray-800 dark:text-gray-200">LOSS OF PAY</td>
                        <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">0.00</td>
                      </tr>
                      <tr className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                        <td className="px-3 py-2 font-sans font-medium text-gray-800 dark:text-gray-200">PROFESSION TAX</td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-white">
                          {deductionsPreview.professionTax.toFixed(2)}
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                        <td className="px-3 py-2 font-sans font-medium text-gray-800 dark:text-gray-200">EPF DEDUCTIONS</td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-white">
                          {deductionsPreview.epfDeductions.toFixed(2)}
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                        <td className="px-3 py-2 font-sans font-medium text-gray-800 dark:text-gray-200">TDS DEDUCTIONS</td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-white">
                          {deductionsPreview.tdsDeductions.toFixed(2)}
                        </td>
                      </tr>
                      <tr className="bg-gray-100/80 dark:bg-gray-800/80 font-bold text-gray-900 dark:text-white">
                        <td className="px-3 py-2.5 font-sans">GROSS DEDUCTIONS</td>
                        <td className="px-3 py-2.5 text-right text-rose-600">
                          {deductionsPreview.grossDeductions.toFixed(2)}
                        </td>
                      </tr>
                      <tr className="bg-emerald-50/80 dark:bg-emerald-950/40 font-bold text-emerald-800 dark:text-emerald-300 border-t border-emerald-200 dark:border-emerald-800">
                        <td className="px-3 py-2.5 font-sans">ESTIMATED NET PAY</td>
                        <td className="px-3 py-2.5 text-right font-mono text-sm">
                          ₹ {deductionsPreview.netPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditingCtcEmployee(null)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCtc}
                  className="rounded-xl bg-[#3c50e0] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#3444be] disabled:opacity-50"
                >
                  {savingCtc ? 'Saving...' : 'Save Employee CTC'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ATTENDANCE, WORKING DAYS & LOP CORRECTION                          */}
      {/* ========================================================================= */}
      {adjustingAttendanceEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm no-print">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <i className="bi bi-calendar2-check text-[#3c50e0]"></i>
                  Attendance, Leave & LOP Correction
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {adjustingAttendanceEmp.full_name} ({adjustingAttendanceEmp.employee_code || ''}) · {monthlyMeta.monthName || 'Month'} {selectedYear}
                </p>
              </div>
              <button
                onClick={() => setAdjustingAttendanceEmp(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
              >
                <i className="bi bi-x-lg text-sm"></i>
              </button>
            </div>

            {/* Dynamic Attendance & Leave Summary Cards */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-center">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Days</span>
                <span className="text-base font-black font-mono text-gray-800 dark:text-white">
                  {monthlyMeta.daysInMonth || 30}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-center">
                <span className="text-[10px] uppercase font-bold text-indigo-500 block">Working Days</span>
                <span className="text-base font-black font-mono text-indigo-600 dark:text-indigo-400">
                  {adjustingAttendanceEmp.standard_working_days || 20}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Present Days</span>
                <span className="text-base font-black font-mono text-emerald-700 dark:text-emerald-300">
                  {adjustingAttendanceEmp.present_days || 0}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-800 text-center">
                <span className="text-[10px] uppercase font-bold text-rose-500 block">Absent Days</span>
                <span className="text-base font-black font-mono text-rose-600 dark:text-rose-400">
                  {adjustingAttendanceEmp.absent_days || 0}
                </span>
              </div>
            </div>

            {/* Leave Details Pills */}
            <div className="mt-3 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/60 dark:border-blue-900/40 text-xs flex items-center justify-between">
              <div>
                <span className="font-semibold text-blue-900 dark:text-blue-300">Approved Leaves Recorded:</span>
                <div className="flex gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 text-[11px] font-bold">
                    {adjustingAttendanceEmp.approved_paid_leave_days || 0} Paid Leave(s)
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200 text-[11px] font-bold">
                    {adjustingAttendanceEmp.approved_lop_leave_days || 0} LOP / Unpaid
                  </span>
                </div>
              </div>
              {adjustingAttendanceEmp.is_manual_override && (
                <div className="text-right">
                  <span className="px-2 py-1 rounded-lg bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold inline-block">
                    Currently Manual Override
                  </span>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveAttendanceAdjustment} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Payable / Paid Days <span className="text-emerald-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max={monthlyMeta.daysInMonth || 31}
                    required
                    value={adjustedPaidDays}
                    onChange={(e) => {
                      const p = parseFloat(e.target.value) || 0;
                      const tot = monthlyMeta.daysInMonth || 30;
                      setAdjustedPaidDays(p);
                      setAdjustedLopDays(Math.max(0, Math.round((tot - p) * 10) / 10));
                    }}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-sm font-mono font-bold text-emerald-600 dark:border-gray-700 dark:bg-gray-800 dark:text-emerald-400"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">Counts towards gross salary</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Loss of Pay (LOP) Days <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max={monthlyMeta.daysInMonth || 31}
                    required
                    value={adjustedLopDays}
                    onChange={(e) => {
                      const l = parseFloat(e.target.value) || 0;
                      const tot = monthlyMeta.daysInMonth || 30;
                      setAdjustedLopDays(l);
                      setAdjustedPaidDays(Math.max(0, Math.round((tot - l) * 10) / 10));
                    }}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-sm font-mono font-bold text-rose-600 dark:border-gray-700 dark:bg-gray-800 dark:text-rose-400"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">Deducted from gross CTC</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Correction Reason / Remarks (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Regularization approved by Admin, medical certificate, attendance correction"
                  value={adjustedRemarks}
                  onChange={(e) => setAdjustedRemarks(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Realtime Salary Proration Preview */}
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Monthly CTC:</span>
                  <span className="font-mono font-semibold text-gray-800 dark:text-white">
                    ₹ {Number(adjustingAttendanceEmp.monthly_ctc || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Proration Factor:</span>
                  <span className="font-mono font-bold text-blue-600">
                    {adjustedPaidDays} / {monthlyMeta.daysInMonth || 30} Days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Loss of Pay Deduction:</span>
                  <span className="font-mono font-bold text-rose-500">
                    - ₹ {Math.round(
                      Number(adjustingAttendanceEmp.monthly_ctc || 0) * (adjustedLopDays / (monthlyMeta.daysInMonth || 30))
                    ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-gray-200 dark:border-gray-700">
                  <span className="font-bold text-gray-700 dark:text-gray-300">Estimated Gross Earned:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ₹ {Math.round(
                      Number(adjustingAttendanceEmp.monthly_ctc || 0) * (adjustedPaidDays / (monthlyMeta.daysInMonth || 30))
                    ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  disabled={resettingAdjustment}
                  onClick={handleResetAdjustment}
                  className="rounded-xl border border-rose-200 bg-rose-50/60 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100/80 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 transition-colors"
                  title="Remove manual edit and re-calculate dynamically from employee attendance & leave requests"
                >
                  {resettingAdjustment ? 'Resetting...' : 'Revert to Dynamic'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustingAttendanceEmp(null)}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#3c50e0] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#3444be]"
                  >
                    Save & Recalculate
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL & PRINTABLE OFFICIAL PAYSLIP (Matches Official Ramel Payslip)       */}
      {/* ========================================================================= */}
      {activePayslipModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-gray-900/70 backdrop-blur-sm overflow-y-auto"
          onClick={() => setActivePayslipModal(null)}
        >
          <div
            className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800 my-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 no-print">
              <div className="flex items-center gap-2">
                <i className="bi bi-file-earmark-ruled fs-5 text-[#3c50e0]"></i>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Official Payslip · {activePayslipModal.month_name || 'Month'} {activePayslipModal.year || selectedYear}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePayslipModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Exact template matching Ramel Techno Solutions Private Limited payslip PDF */}
            <div className="p-4 sm:p-6 bg-white text-gray-900 overflow-x-auto">
              <div className="ramel-payslip-paper">
                <div className="ramel-payslip-top-tag">Pay Slip</div>
                
                {/* Header Table / Box */}
                <div className="ramel-payslip-outer-box">
                  <div className="ramel-payslip-header-row">
                    <div className="ramel-payslip-brand-box">
                      <div className="ramel-payslip-brand-flex">
                        <div className="ramel-payslip-logo-icon">
                          <i className="bi bi-intersect"></i>
                        </div>
                        <div>
                          <span className="ramel-brand-title">RAMEL</span>
                          <span className="ramel-brand-subtitle">Techno solutions Private limited</span>
                        </div>
                      </div>
                    </div>
                    <div className="ramel-payslip-company-address">
                      <strong>RAMEL TECHNO SOLUTIONS PRIVATE LIMITED</strong>
                      <div>NO.3, Sridharan Street,</div>
                      <div>Ayyavoo Colony,</div>
                      <div>Aminjikarai, Chennai - 600 029</div>
                    </div>
                  </div>

                  {/* Employee Details Grid */}
                  <table className="ramel-payslip-meta-table">
                    <tbody>
                      <tr>
                        <td className="meta-label">EMP CODE</td>
                        <td className="meta-value">: {activePayslipModal.employee_code || '—'}</td>
                        <td className="meta-label">BANK NAME</td>
                        <td className="meta-value">: {activePayslipModal.bank_name || 'ABC BANK'}</td>
                      </tr>
                      <tr>
                        <td className="meta-label">EMP NAME</td>
                        <td className="meta-value">: {(activePayslipModal.full_name || 'EMPLOYEE').toUpperCase()}</td>
                        <td className="meta-label">BANK A/C NO.</td>
                        <td className="meta-value">: {activePayslipModal.bank_account || '1234567890'}</td>
                      </tr>
                      <tr>
                        <td className="meta-label">DESIGNATION</td>
                        <td className="meta-value">: {(activePayslipModal.designation || 'STAFF').toUpperCase()}</td>
                        <td className="meta-label">PAN NUMBER</td>
                        <td className="meta-value">: {activePayslipModal.pan_number || 'ABCDE1234F'}</td>
                      </tr>
                      <tr>
                        <td className="meta-label">DOJ</td>
                        <td className="meta-value">: {formatDate(activePayslipModal.joining_date)}</td>
                        <td className="meta-label">PAID DAYS</td>
                        <td className="meta-value">: {activePayslipModal.paid_days !== undefined ? activePayslipModal.paid_days : (activePayslipModal.days_in_month || 30)}</td>
                      </tr>
                      <tr>
                        <td className="meta-label">LOCATION</td>
                        <td className="meta-value">: {(activePayslipModal.location || 'PUNE, INDIA').toUpperCase()}</td>
                        <td className="meta-label">LOP DAYS</td>
                        <td className="meta-value">: {activePayslipModal.lop_days !== undefined ? activePayslipModal.lop_days : 0}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Earnings & Deductions Split Table */}
                  <table className="ramel-payslip-salary-table">
                    <thead>
                      <tr>
                        <th style={{ width: '38%' }}>EARNINGS</th>
                        <th style={{ width: '15%', textAlign: 'right' }}>ACTUAL</th>
                        <th style={{ width: '15%', textAlign: 'right' }}>EARNED</th>
                        <th style={{ width: '22%' }}>DEDUCTIONS</th>
                        <th style={{ width: '10%', textAlign: 'right' }}>AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>BASIC PAY</td>
                        <td className="amt">{Number(activePayslipModal.basic_salary ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="amt">{Number(activePayslipModal.basic_salary ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td>LOSS OF PAY</td>
                        <td className="amt">{Number(activePayslipModal.loss_of_pay ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr>
                        <td>HOUSE RENT ALLOWANCE (HRA)</td>
                        <td className="amt">{Number(activePayslipModal.hra ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="amt">{Number(activePayslipModal.hra ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td>PROFESSION TAX</td>
                        <td className="amt">{Number(activePayslipModal.professional_tax ?? 250).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr>
                        <td>TRAVEL ALLOWANCE</td>
                        <td className="amt">{Number(activePayslipModal.travel_allowance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="amt">{Number(activePayslipModal.travel_allowance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td>EPF DEDUCTIONS</td>
                        <td className="amt">{Number(activePayslipModal.epf_deductions ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr>
                        <td>CONVEYANCE ALLOWANCE</td>
                        <td className="amt">{Number(activePayslipModal.conveyance_allowance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="amt">{Number(activePayslipModal.conveyance_allowance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td>TDS DEDUCTIONS</td>
                        <td className="amt">{Number(activePayslipModal.tds_deductions ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      {(Number(activePayslipModal.medical_allowance ?? 0) > 0 || (!activePayslipModal.other_allowance && !activePayslipModal.bonus)) && (
                        <tr>
                          <td>MEDICAL ALLOWANCE</td>
                          <td className="amt">{Number(activePayslipModal.medical_allowance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="amt">{Number(activePayslipModal.medical_allowance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td></td>
                          <td className="amt"></td>
                        </tr>
                      )}
                      {Number(activePayslipModal.other_allowance ?? 0) > 0 && (
                        <tr>
                          <td>OTHER ALLOWANCE</td>
                          <td className="amt">{Number(activePayslipModal.other_allowance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="amt">{Number(activePayslipModal.other_allowance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td></td>
                          <td className="amt"></td>
                        </tr>
                      )}
                      {Number(activePayslipModal.bonus ?? 0) > 0 && (
                        <tr>
                          <td>BONUS (PERFORMANCE/STATUTORY)</td>
                          <td className="amt">{Number(activePayslipModal.bonus ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="amt">{Number(activePayslipModal.bonus ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td></td>
                          <td className="amt"></td>
                        </tr>
                      )}
                      <tr className="total-row">
                        <td><strong>GROSS EARNINGS</strong></td>
                        <td className="amt"><strong>{Number(activePayslipModal.gross_earnings ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
                        <td className="amt"><strong>{Number(activePayslipModal.gross_earnings ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
                        <td><strong>GROSS DEDUCTIONS</strong></td>
                        <td className="amt"><strong>{Number(activePayslipModal.total_deductions ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
                      </tr>
                      <tr className="netpay-row">
                        <td><strong>NET PAY</strong></td>
                        <td colSpan="4">
                          <strong>: ₹ {Number(activePayslipModal.net_pay ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                        </td>
                      </tr>
                      <tr className="words-row">
                        <td><strong>IN WORDS</strong></td>
                        <td colSpan="4">
                          : Rupees {numberToWords(activePayslipModal.net_pay ?? 0)} Only
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="ramel-payslip-disclaimer">
                    Note: This is a auto-generated document and does not require a signature.
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer with Print / Export PDF button */}
            <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-800 no-print">
              <button
                type="button"
                onClick={() => setActivePayslipModal(null)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-xl bg-[#3c50e0] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#3444be] flex items-center gap-2 transition-colors"
                >
                  <i className="bi bi-printer-fill"></i>
                  Print / Export PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

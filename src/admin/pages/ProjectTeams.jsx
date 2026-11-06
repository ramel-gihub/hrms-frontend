import React, { useState, useEffect, useMemo } from 'react';
import Pagination from '../components/Pagination';
import Chart from 'react-apexcharts';

export default function ProjectTeams({
  currentTenantId = 1,
  currentUser,
  employees = []
}) {
  const [activeTab, setActiveTab] = useState('management'); // 'management' | 'report'
  const [teams, setTeams] = useState([]);
  const [clientsList, setClientsList] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Report pagination
  const [reportPage, setReportPage] = useState(1);
  const [reportPageSize, setReportPageSize] = useState(10);
  const [reportSearch, setReportSearch] = useState('');
  const [profitFilter, setProfitFilter] = useState('All'); // 'All' | 'Profit' | 'Loss'

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formClientName, setFormClientName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formLeadId, setFormLeadId] = useState('');
  const [formMemberIds, setFormMemberIds] = useState([]);
  const [formStatus, setFormStatus] = useState('Active');
  const [formBudgetDays, setFormBudgetDays] = useState(115);
  const [formBudgetHours, setFormBudgetHours] = useState(1240);
  const [formHourlyRate, setFormHourlyRate] = useState(75);
  const [memberSearch, setMemberSearch] = useState('');

  // Invoices & Revenue Report State
  const [invoicesList, setInvoicesList] = useState([]);
  const [invoicesSummary, setInvoicesSummary] = useState({
    cumulativeInvoicedAmount: 0,
    cumulativeCostAmount: 0,
    cumulativeNetMargin: 0,
    cumulativePaidAmount: 0,
    cumulativePendingAmount: 0,
    totalInvoicesCount: 0
  });
  const [monthlyBreakdown, setMonthlyBreakdown] = useState([]);
  const [invoiceFilterMonth, setInvoiceFilterMonth] = useState('all');
  const [invoiceFilterStatus, setInvoiceFilterStatus] = useState('all');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  // Invoice Modal / Custom Edit State
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [invProjectId, setInvProjectId] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceBillingMonth, setInvoiceBillingMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [invoiceClientName, setInvoiceClientName] = useState('');
  const [invoiceProjectName, setInvoiceProjectName] = useState('');
  const [invoiceProjectCode, setInvoiceProjectCode] = useState('');
  const [invoiceBudgetHours, setInvoiceBudgetHours] = useState(1240);
  const [invoiceActualHours, setInvoiceActualHours] = useState(0);
  const [invoiceHourlyRate, setInvoiceHourlyRate] = useState(75);
  const [invoiceTotalAmount, setInvoiceTotalAmount] = useState(93000);
  const [invoicePaidAmount, setInvoicePaidAmount] = useState(0);
  const [invoiceTaxAmount, setInvoiceTaxAmount] = useState(0);
  const [invoiceDiscountAmount, setInvoiceDiscountAmount] = useState(0);
  const [invoiceStatus, setInvoiceStatus] = useState('Generated');
  const [invoiceIssueDate, setInvoiceIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [invoiceDueDate, setInvoiceDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [invoiceLineItems, setInvoiceLineItems] = useState([]);
  const [invoiceStaffBreakdown, setInvoiceStaffBreakdown] = useState([]);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [isCustomClient, setIsCustomClient] = useState(false);
  const [isCustomProject, setIsCustomProject] = useState(false);
  const [invoiceSuccess, setInvoiceSuccess] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 
    (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:5002'
      : 'https://hrms-backend-fzef.onrender.com');

  const orgId = currentTenantId || currentUser?.organization_id || 1;

  const fetchInvoices = async () => {
    setInvoicesLoading(true);
    try {
      const params = new URLSearchParams({
        orgId,
        month: invoiceFilterMonth,
        status: invoiceFilterStatus,
        search: invoiceSearch
      });
      const res = await fetch(`${API_URL}/api/admin/invoices?${params.toString()}`);
      const data = await res.json();
      if (data && data.success) {
        setInvoicesList(data.invoices || []);
        if (data.summary) setInvoicesSummary(data.summary);
        if (data.monthlyBreakdown) setMonthlyBreakdown(data.monthlyBreakdown);
      }
    } catch (e) {
      console.error('Fetch invoices error:', e);
    } finally {
      setInvoicesLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [orgId, invoiceFilterMonth, invoiceFilterStatus]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoices();
    }, 300);
    return () => clearTimeout(timer);
  }, [invoiceSearch]);

  // Combined list of projects from teams and reportData
  const allProjects = useMemo(() => {
    const map = new Map();
    (teams || []).forEach(t => {
      if (t && t.id) map.set(t.id, t);
    });
    (reportData?.projects || []).forEach(p => {
      if (p && p.id) {
        if (!map.has(p.id)) map.set(p.id, p);
        else map.set(p.id, { ...map.get(p.id), ...p });
      }
    });
    return Array.from(map.values());
  }, [teams, reportData]);

  // Unique client names across projects and registered clients
  const uniqueClients = useMemo(() => {
    const set = new Set();
    allProjects.forEach(p => {
      if (p.client_name && p.client_name.trim()) set.add(p.client_name.trim());
    });
    (clientsList || []).forEach(c => {
      const name = typeof c === 'string' ? c : c.client_name || c.name;
      if (name && name.trim()) set.add(name.trim());
    });
    if (invoiceClientName && invoiceClientName.trim() && invoiceClientName !== '__custom__') {
      set.add(invoiceClientName.trim());
    }
    return Array.from(set).sort();
  }, [allProjects, clientsList, invoiceClientName]);

  // Projects belonging to currently selected client
  const clientProjects = useMemo(() => {
    if (!invoiceClientName || invoiceClientName === '__custom__') return allProjects;
    const filtered = allProjects.filter(p => (p.client_name || '').toLowerCase() === invoiceClientName.toLowerCase());
    return filtered.length > 0 ? filtered : allProjects;
  }, [allProjects, invoiceClientName]);

  const applyProjectToInvoice = (proj, clientNameOverride) => {
    if (!proj) return;
    setInvProjectId(proj.id);
    const client = clientNameOverride || proj.client_name || 'Acme Corporation';
    setInvoiceClientName(client);
    setInvoiceProjectName(proj.project_name || '');
    const pCode = proj.project_code || `PRJ-${proj.id}`;
    setInvoiceProjectCode(pCode);

    // Auto-generate current invoice number
    const cleanCode = pCode.replace(/[^a-zA-Z0-9]/g, '');
    const autoInvNum = `INV-${new Date().getFullYear()}-${cleanCode}`;
    setInvoiceNumber(autoInvNum);

    const bHours = parseFloat(proj.budget_hours) || 1240;
    const aHours = parseFloat(proj.actual_hours) || 0;
    const hRate = parseFloat(proj.hourly_rate) || 75;
    const invAmt = parseFloat(proj.invoice_amount) || (bHours * hRate);

    setInvoiceBudgetHours(bHours);
    setInvoiceActualHours(aHours);
    setInvoiceHourlyRate(hRate);
    setInvoiceTotalAmount(invAmt);
    if (proj.staff) setInvoiceStaffBreakdown(proj.staff);

    // Auto-populate / update baseline line item
    setInvoiceLineItems([
      {
        id: Date.now(),
        description: `Standard Baseline Allocation (115 Days × 8h) - ${proj.project_name}`,
        hours: bHours,
        rate: hRate,
        amount: bHours * hRate
      }
    ]);
  };

  const handleClientChange = (selectedClient) => {
    if (selectedClient === '__custom__') {
      setIsCustomClient(true);
      setInvoiceClientName('');
      return;
    }
    setIsCustomClient(false);
    setInvoiceClientName(selectedClient);

    // Find projects under this client
    const matchingProjects = allProjects.filter(
      p => (p.client_name || '').toLowerCase() === selectedClient.toLowerCase()
    );

    if (matchingProjects.length > 0) {
      // Auto load first project under this client with its code and current invoice number
      applyProjectToInvoice(matchingProjects[0], selectedClient);
    } else {
      const cleanClient = selectedClient.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
      const code = `PRJ-${cleanClient || 'CLIENT'}`;
      setInvoiceProjectName(`${selectedClient} Delivery Project`);
      setInvoiceProjectCode(code);
      setInvoiceNumber(`INV-${new Date().getFullYear()}-${code.replace(/[^a-zA-Z0-9]/g, '')}`);
    }
  };

  const handleProjectSelect = (projIdVal) => {
    if (projIdVal === '__custom__') {
      setIsCustomProject(true);
      setInvProjectId(null);
      return;
    }
    setIsCustomProject(false);
    const found = allProjects.find(p => String(p.id) === String(projIdVal));
    if (found) {
      applyProjectToInvoice(found, invoiceClientName || found.client_name);
    }
  };

  const handleOpenInvoiceModal = (proj) => {
    if (!proj) return;
    setEditingInvoiceId(null);
    setInvProjectId(proj.id);
    const cleanCode = (proj.project_code || `PRJ-${proj.id}`).replace(/[^a-zA-Z0-9]/g, '');
    const num = `INV-${new Date().getFullYear()}-${cleanCode}`;
    setInvoiceNumber(num);
    const currentMonth = new Date().toISOString().slice(0, 7);
    setInvoiceBillingMonth(currentMonth);
    setInvoiceClientName(proj.client_name || 'Acme Corporation');
    setInvoiceProjectName(proj.project_name);
    setInvoiceProjectCode(proj.project_code || `PRJ-${proj.id}`);
    setInvoiceBudgetHours(proj.budget_hours || 1240);
    setInvoiceActualHours(proj.actual_hours || 0);
    setInvoiceHourlyRate(proj.hourly_rate || 75);
    setInvoiceTotalAmount(proj.invoice_amount || 93000);
    setInvoicePaidAmount(0);
    setInvoiceTaxAmount(0);
    setInvoiceDiscountAmount(0);
    setInvoiceStatus('Generated');
    setInvoiceIssueDate(new Date().toISOString().split('T')[0]);
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setInvoiceDueDate(d.toISOString().split('T')[0]);
    setInvoiceNotes('Payment is due within 30 days of invoice date. Thank you for your business.');
    setInvoiceStaffBreakdown(proj.staff || []);
    setInvoiceLineItems([
      {
        id: 1,
        description: `Standard Baseline Allocation (115 Days × 8h) - ${proj.project_name}`,
        hours: proj.budget_hours || 1240,
        rate: proj.hourly_rate || 75,
        amount: proj.invoice_amount || 93000
      }
    ]);
    setInvoiceSuccess(null);
    setShowInvoiceModal(true);
  };

  const handleOpenEditInvoice = (inv) => {
    if (!inv) return;
    setEditingInvoiceId(inv.id);
    setInvProjectId(inv.project_id);
    setInvoiceNumber(inv.invoice_number);
    setInvoiceBillingMonth(inv.billing_month || '2026-11');
    setInvoiceClientName(inv.client_name);
    setInvoiceProjectName(inv.project_name);
    setInvoiceProjectCode(inv.project_code);
    setInvoiceBudgetHours(parseFloat(inv.budget_hours) || 1240);
    setInvoiceActualHours(parseFloat(inv.actual_hours) || 0);
    setInvoiceHourlyRate(parseFloat(inv.hourly_rate) || 75);
    setInvoiceTotalAmount(parseFloat(inv.total_amount) || 93000);
    setInvoicePaidAmount(parseFloat(inv.paid_amount) || 0);
    setInvoiceTaxAmount(parseFloat(inv.tax_amount) || 0);
    setInvoiceDiscountAmount(parseFloat(inv.discount_amount) || 0);
    setInvoiceStatus(inv.status || 'Generated');
    setInvoiceIssueDate(inv.issue_date ? inv.issue_date.slice(0, 10) : new Date().toISOString().split('T')[0]);
    setInvoiceDueDate(inv.due_date ? inv.due_date.slice(0, 10) : new Date().toISOString().split('T')[0]);
    setInvoiceNotes(inv.notes || '');
    setInvoiceStaffBreakdown(Array.isArray(inv.staff_breakdown) ? inv.staff_breakdown : []);
    const lines = Array.isArray(inv.line_items) && inv.line_items.length > 0
      ? inv.line_items
      : [
          {
            id: 1,
            description: `${inv.project_name} Milestone Delivery`,
            hours: parseFloat(inv.actual_hours) || 1240,
            rate: parseFloat(inv.hourly_rate) || 75,
            amount: parseFloat(inv.total_amount) || 93000
          }
        ];
    setInvoiceLineItems(lines);
    setInvoiceSuccess(null);
    setShowInvoiceModal(true);
  };

  const handleOpenCreateCustomInvoice = () => {
    setEditingInvoiceId(null);
    setIsCustomClient(false);
    setIsCustomProject(false);
    
    const defaultProj = (allProjects && allProjects.length > 0) ? allProjects[0] : (teams && teams.length > 0 ? teams[0] : null);
    const clientName = defaultProj?.client_name || 'Acme Corporation';
    
    setInvoiceBillingMonth(new Date().toISOString().slice(0, 7));
    setInvoiceStatus('Draft');
    setInvoiceIssueDate(new Date().toISOString().split('T')[0]);
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setInvoiceDueDate(d.toISOString().split('T')[0]);
    setInvoicePaidAmount(0);
    setInvoiceTaxAmount(0);
    setInvoiceDiscountAmount(0);
    setInvoiceNotes('Commercial project delivery invoice.');
    setInvoiceSuccess(null);

    if (defaultProj) {
      applyProjectToInvoice(defaultProj, clientName);
    } else {
      setInvProjectId(null);
      setInvoiceClientName('Acme Corporation');
      setInvoiceProjectName('Custom Project Delivery');
      setInvoiceProjectCode('PRJ-CUSTOM');
      setInvoiceNumber(`INV-${new Date().getFullYear()}-CUSTOM`);
      setInvoiceBudgetHours(1240);
      setInvoiceActualHours(0);
      setInvoiceHourlyRate(75);
      setInvoiceTotalAmount(93000);
      setInvoiceStaffBreakdown([]);
      setInvoiceLineItems([
        {
          id: Date.now(),
          description: 'Commercial Consulting & Delivery Milestone',
          hours: 1240,
          rate: 75,
          amount: 93000
        }
      ]);
    }
    setShowInvoiceModal(true);
  };

  const handleAddLineItem = () => {
    setInvoiceLineItems([
      ...invoiceLineItems,
      {
        id: Date.now(),
        description: 'Additional Engineering / QA Milestone',
        hours: 40,
        rate: invoiceHourlyRate || 75,
        amount: 40 * (invoiceHourlyRate || 75)
      }
    ]);
  };

  const handleUpdateLineItem = (id, field, val) => {
    setInvoiceLineItems(invoiceLineItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: val };
        if (field === 'hours' || field === 'rate') {
          const h = field === 'hours' ? parseFloat(val) || 0 : parseFloat(item.hours) || 0;
          const r = field === 'rate' ? parseFloat(val) || 0 : parseFloat(item.rate) || 0;
          updated.amount = parseFloat((h * r).toFixed(2));
        }
        return updated;
      }
      return item;
    }));
  };

  const handleRemoveLineItem = (id) => {
    setInvoiceLineItems(invoiceLineItems.filter(item => item.id !== id));
  };

  const handleSaveInvoice = async () => {
    if (!invoiceNumber || !invoiceClientName || !invoiceProjectName) {
      alert('Please fill in Invoice Number, Client Name, and Project Name.');
      return;
    }

    setGeneratingInvoice(true);
    setInvoiceSuccess(null);

    // Compute lines total
    const linesSum = invoiceLineItems.reduce((acc, it) => acc + (parseFloat(it.amount) || 0), 0);
    const baseTotal = linesSum > 0 ? linesSum : (parseFloat(invoiceTotalAmount) || 93000);
    const finalAmount = parseFloat((baseTotal + (parseFloat(invoiceTaxAmount) || 0) - (parseFloat(invoiceDiscountAmount) || 0)).toFixed(2));
    const finalCost = parseFloat(((parseFloat(invoiceActualHours) || 0) * (parseFloat(invoiceHourlyRate) || 75)).toFixed(2));
    const finalMargin = parseFloat((finalAmount - finalCost).toFixed(2));
    const isProfit = (parseFloat(invoiceActualHours) || 0) <= (parseFloat(invoiceBudgetHours) || 1240);

    try {
      const res = await fetch(`${API_URL}/api/admin/invoices/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingInvoiceId || undefined,
          orgId,
          projectId: invProjectId,
          invoiceNumber,
          billingMonth: invoiceBillingMonth,
          clientName: invoiceClientName,
          projectName: invoiceProjectName,
          projectCode: invoiceProjectCode,
          budgetHours: parseFloat(invoiceBudgetHours) || 1240.0,
          actualHours: parseFloat(invoiceActualHours) || 0.0,
          hourlyRate: parseFloat(invoiceHourlyRate) || 75.0,
          totalAmount: finalAmount,
          actualCost: finalCost,
          netMargin: finalMargin,
          profitLossStatus: isProfit ? 'Profit' : 'Loss',
          status: invoiceStatus,
          issueDate: invoiceIssueDate,
          dueDate: invoiceDueDate,
          notes: invoiceNotes,
          staffBreakdown: invoiceStaffBreakdown,
          lineItems: invoiceLineItems,
          taxAmount: parseFloat(invoiceTaxAmount) || 0.0,
          discountAmount: parseFloat(invoiceDiscountAmount) || 0.0,
          paidAmount: parseFloat(invoicePaidAmount) || 0.0
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setInvoiceSuccess(`Invoice ${invoiceNumber} saved successfully!`);
        await fetchInvoices();
        await fetchTrackingReport();
        setTimeout(() => {
          setInvoiceSuccess(null);
          setShowInvoiceModal(false);
        }, 1500);
      } else {
        throw new Error(data.error || 'Failed to save invoice');
      }
    } catch (e) {
      setInvoiceSuccess(`Error: ${e.message}`);
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const handleDeleteInvoice = async (id, invNum) => {
    if (!window.confirm(`Are you sure you want to delete invoice ${invNum}?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/invoices/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: 'success', message: `Invoice ${invNum} deleted successfully.` });
        await fetchInvoices();
        setTimeout(() => setFeedback(null), 3500);
      }
    } catch (e) {
      setFeedback({ type: 'error', message: 'Failed to delete invoice.' });
    }
  };

  const handleExportCSV = () => {
    if (!invoicesList || invoicesList.length === 0) {
      alert('No invoice data available to export.');
      return;
    }

    const headers = [
      'Invoice Number',
      'Billing Month',
      'Client Name',
      'Project Name',
      'Project Code',
      'Budget Hours (115d)',
      'Actual Hours',
      'Hourly Rate ($)',
      'Total Amount ($)',
      'Actual Cost ($)',
      'Net Margin ($)',
      'Profit/Loss Status',
      'Payment Status',
      'Paid Amount ($)',
      'Issue Date',
      'Due Date',
      'Notes'
    ];

    const rows = invoicesList.map(inv => [
      `"${inv.invoice_number || ''}"`,
      `"${inv.billing_month || ''}"`,
      `"${(inv.client_name || '').replace(/"/g, '""')}"`,
      `"${(inv.project_name || '').replace(/"/g, '""')}"`,
      `"${inv.project_code || ''}"`,
      inv.budget_hours || 1240,
      inv.actual_hours || 0,
      inv.hourly_rate || 75,
      inv.total_amount || 0,
      inv.actual_cost || 0,
      inv.net_margin || 0,
      `"${inv.profit_loss_status || ''}"`,
      `"${inv.status || ''}"`,
      inv.paid_amount || 0,
      `"${inv.issue_date ? new Date(inv.issue_date).toLocaleDateString('en-GB') : ''}"`,
      `"${inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-GB') : ''}"`,
      `"${(inv.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Monthly_Invoice_Report_${invoiceFilterMonth}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintInvoice = () => {
    const linesSum = invoiceLineItems.reduce((acc, it) => acc + (parseFloat(it.amount) || ((parseFloat(it.hours) || 0) * (parseFloat(it.rate) || 0))), 0);
    const subTotal = linesSum > 0 ? linesSum : (parseFloat(invoiceTotalAmount) || 93000);
    const tax = parseFloat(invoiceTaxAmount) || 0;
    const discount = parseFloat(invoiceDiscountAmount) || 0;
    const totalPayable = parseFloat((subTotal + tax - discount).toFixed(2));
    const paid = parseFloat(invoicePaidAmount) || 0;
    const balanceDue = parseFloat((totalPayable - paid).toFixed(2));

    const lineItemsRows = invoiceLineItems.length > 0 ? invoiceLineItems.map((item, idx) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #475569;">${idx + 1}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #1e293b;">${item.description || invoiceProjectName || 'Milestone Delivery'}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; font-family: monospace; color: #334155;">${item.hours || 0} hrs</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; font-family: monospace; color: #334155;">${(parseFloat(item.rate) || invoiceHourlyRate || 75).toFixed(2)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; font-weight: 700; font-family: monospace; color: #0f172a;">${(parseFloat(item.amount) || ((parseFloat(item.hours) || 0) * (parseFloat(item.rate) || 75))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    `).join('') : `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #475569;">1</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #1e293b;">${invoiceProjectName || 'Commercial Project Delivery'}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; font-family: monospace; color: #334155;">${invoiceBudgetHours || 1240} hrs</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; font-family: monospace; color: #334155;">${(invoiceHourlyRate || 75).toFixed(2)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; font-weight: 700; font-family: monospace; color: #0f172a;">${subTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    `;

    const printHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice - ${invoiceNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e293b;
      background: #fff;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      padding: 10px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #3c50e0;
      padding-bottom: 18px;
      margin-bottom: 22px;
    }
    .logo-img {
      height: 44px;
      object-fit: contain;
    }
    .company-title {
      font-size: 11px;
      color: #64748b;
      margin-top: 5px;
    }
    .inv-title {
      text-align: right;
    }
    .inv-title h1 {
      font-size: 26px;
      font-weight: 900;
      color: #3c50e0;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .inv-title p {
      font-family: monospace;
      font-size: 14px;
      font-weight: 700;
      color: #334155;
      margin: 3px 0 0;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 18px;
      margin-bottom: 22px;
    }
    .meta-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #94a3b8;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
    }
    .meta-val {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }
    .meta-sub {
      font-size: 12px;
      color: #475569;
      margin-top: 2px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 22px;
    }
    .items-table th {
      background: #f1f5f9;
      padding: 9px 12px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #475569;
      border-bottom: 2px solid #cbd5e1;
    }
    .calc-section {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin-top: 10px;
    }
    .notes-box {
      flex: 1;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 16px;
    }
    .notes-box h4 {
      margin: 0 0 5px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
    }
    .notes-box p {
      margin: 0;
      font-size: 12px;
      color: #334155;
      line-height: 1.5;
      white-space: pre-wrap;
    }
    .totals-table {
      width: 320px;
      border-collapse: collapse;
    }
    .totals-table td {
      padding: 6px 8px;
      font-size: 12px;
    }
    .total-row {
      border-top: 2px solid #3c50e0;
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
    }
    .total-val {
      text-align: right;
      font-family: monospace;
      font-weight: 800;
      color: #3c50e0;
      font-size: 16px;
    }
    .footer {
      margin-top: 36px;
      border-top: 1px solid #e2e8f0;
      padding-top: 14px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div>
        <img src="/images/logo/official_ramel_logo.png" class="logo-img" alt="Ramel" onerror="this.onerror=null;this.src='/images/logo/logo.png';" />
        <div class="company-title">Ramel Enterprise Solutions &bull; Employee Management & Consulting</div>
      </div>
      <div class="inv-title">
        <h1>INVOICE</h1>
        <p>${invoiceNumber}</p>
        <div style="font-size: 11px; color: #64748b; margin-top: 3px;">Status: <strong>${invoiceStatus}</strong></div>
      </div>
    </div>

    <div class="meta-grid">
      <div>
        <div class="meta-label">Billed To (Client):</div>
        <div class="meta-val">${invoiceClientName || 'Valued Client'}</div>
        <div class="meta-sub">Project: <strong>${invoiceProjectName}</strong> (${invoiceProjectCode})</div>
        ${invoiceBillingMonth ? `<div class="meta-sub">Billing Month: <strong>${invoiceBillingMonth}</strong></div>` : ''}
      </div>
      <div style="text-align: right;">
        <div class="meta-label">Invoice Details:</div>
        <div class="meta-sub">Issue Date: <strong>${invoiceIssueDate}</strong></div>
        <div class="meta-sub">Due Date: <strong>${invoiceDueDate}</strong></div>
        <div class="meta-sub">Standard Rate: <strong>${invoiceHourlyRate}/hr</strong></div>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 40px;">#</th>
          <th style="text-align: left;">Description / Deliverable</th>
          <th style="text-align: right; width: 90px;">Hours</th>
          <th style="text-align: right; width: 100px;">Rate ($)</th>
          <th style="text-align: right; width: 130px;">Amount ($)</th>
        </tr>
      </thead>
      <tbody>
        ${lineItemsRows}
      </tbody>
    </table>

    <div class="calc-section">
      <div class="notes-box">
        <h4>Payment Terms & Notes</h4>
        <p>${invoiceNotes || 'Payment is due within 30 days of invoice date. Thank you for your business.'}</p>
      </div>

      <table class="totals-table">
        <tr>
          <td style="color: #64748b;">Deliverables Subtotal:</td>
          <td style="text-align: right; font-family: monospace; font-weight: 600;">${subTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
        ${tax > 0 ? `
        <tr>
          <td style="color: #64748b;">Tax / VAT / GST:</td>
          <td style="text-align: right; font-family: monospace; font-weight: 600; color: #0284c7;">+${tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>` : ''}
        ${discount > 0 ? `
        <tr>
          <td style="color: #64748b;">Discount / Rebate:</td>
          <td style="text-align: right; font-family: monospace; font-weight: 600; color: #e11d48;">-${discount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>` : ''}
        <tr class="total-row">
          <td>Total Invoiced:</td>
          <td class="total-val">${totalPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
        ${paid > 0 ? `
        <tr>
          <td style="color: #16a34a; font-weight: 600;">Amount Paid:</td>
          <td style="text-align: right; font-family: monospace; font-weight: 700; color: #16a34a;">-${paid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>` : ''}
        <tr style="border-top: 1px dashed #cbd5e1; font-weight: 700;">
          <td style="color: ${balanceDue > 0 ? '#b45309' : '#16a34a'};">Balance Due:</td>
          <td style="text-align: right; font-family: monospace; font-size: 14px; color: ${balanceDue > 0 ? '#b45309' : '#16a34a'};">${balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      </table>
    </div>

    <div class="footer">
      Thank you for your business &bull; Ramel Employee Management System
    </div>
  </div>
</body>
</html>`;

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow.document;
    frameDoc.open();
    frameDoc.write(printHtml);
    frameDoc.close();

    printFrame.contentWindow.focus();
    setTimeout(() => {
      printFrame.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 3000);
    }, 400);
  };

  // Filter out superadmins so only actual staff can be leads or members
  const visibleEmployees = employees.filter(e => {
    const role = (e.role_name || e.roleKey || e.role || '').toLowerCase();
    const code = (e.employee_code || '').toLowerCase();
    const email = (e.email || '').toLowerCase();
    return !role.includes('super_admin') && !code.includes('emp-super') && !email.includes('superadmin');
  });

  const getEmpName = (emp) => {
    if (!emp) return '';
    const full = (emp.full_name || '').trim();
    if (full && full.toLowerCase() !== 'new hire') return full;
    const combined = `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
    if (combined) return combined;
    if (emp.name) return emp.name;
    if (emp.email) return emp.email.split('@')[0];
    return emp.employee_code || 'Employee';
  };

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/project-teams?orgId=${orgId}`);
      const data = await res.json();
      if (data && Array.isArray(data.teams)) {
        setTeams(data.teams);
      }
    } catch (err) {
      console.error('Failed to fetch project teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackingReport = async () => {
    setReportLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/project-tracking-report?orgId=${orgId}`);
      const data = await res.json();
      if (data && data.success) {
        setReportData(data);
      }
    } catch (err) {
      console.error('Failed to fetch tracking report:', err);
    } finally {
      setReportLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch(`${API_URL}/api/clients`);
      const data = await res.json();
      if (data && Array.isArray(data.clients)) {
        setClientsList(data.clients);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchClients();
    fetchTrackingReport();
  }, [orgId]);

  const handleOpenCreateModal = () => {
    setEditingTeam(null);
    setFormName('');
    setFormCode('');
    setFormClientName('');
    setFormDesc('');
    setFormLeadId('');
    setFormMemberIds([]);
    setFormStatus('Active');
    setFormBudgetDays(115);
    setFormBudgetHours(1240);
    setFormHourlyRate(75);
    setMemberSearch('');
    setShowModal(true);
  };

  const handleOpenEditModal = (team) => {
    setEditingTeam(team);
    setFormName(team.project_name || '');
    setFormCode(team.project_code || '');
    setFormClientName(team.client_name || '');
    setFormDesc(team.description || '');
    setFormLeadId(team.team_lead_id ? String(team.team_lead_id) : '');
    const memberIds = (team.members || []).map(m => String(m.employee_id));
    setFormMemberIds(memberIds);
    setFormStatus(team.status || 'Active');
    setFormBudgetDays(team.budget_days || 115);
    setFormBudgetHours(team.budget_hours || 1240);
    setFormHourlyRate(team.hourly_rate || 75);
    setMemberSearch('');
    setShowModal(true);
  };

  const handleToggleMember = (empIdStr) => {
    setFormMemberIds(prev => 
      prev.includes(empIdStr) 
        ? prev.filter(id => id !== empIdStr) 
        : [...prev, empIdStr]
    );
  };

  const handleSaveTeam = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFeedback({ type: 'error', message: 'Project Name is required.' });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const days = parseInt(formBudgetDays, 10) || 115;
      const hours = parseFloat(formBudgetHours) || (days * 8);
      const rate = parseFloat(formHourlyRate) || 75;

      const payload = {
        organizationId: orgId,
        projectName: formName.trim(),
        projectCode: formCode.trim(),
        clientName: formClientName.trim() || 'Direct Client',
        budgetDays: days,
        budgetHours: hours,
        hourlyRate: rate,
        fixedBudgetAmount: hours * rate,
        description: formDesc.trim(),
        teamLeadId: formLeadId ? parseInt(formLeadId, 10) : null,
        memberIds: formMemberIds.map(id => parseInt(id, 10)),
        status: formStatus,
        adminUserId: currentUser?.id
      };

      const url = editingTeam 
        ? `${API_URL}/api/admin/project-teams/${editingTeam.id}`
        : `${API_URL}/api/admin/project-teams`;
      const method = editingTeam ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save project team');
      }

      setShowModal(false);
      setFeedback({
        type: 'success',
        message: editingTeam ? 'Project team updated successfully!' : 'Project team created successfully!'
      });
      await fetchTeams();
      await fetchClients();
      await fetchTrackingReport();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      console.error('Save team error:', err);
      setFeedback({ type: 'error', message: err.message || 'Error saving project team.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeam = async (teamId, teamName) => {
    if (!window.confirm(`Are you sure you want to delete project team "${teamName}"?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/project-teams/${teamId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setFeedback({ type: 'success', message: `Team "${teamName}" deleted successfully.` });
        await fetchTeams();
        await fetchTrackingReport();
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch (err) {
      console.error('Delete team error:', err);
      setFeedback({ type: 'error', message: 'Failed to delete team.' });
    }
  };

  // Filtered teams for Management view
  const filteredTeams = teams.filter(t => {
    const q = searchTerm.toLowerCase();
    const nameMatch = (t.project_name || '').toLowerCase().includes(q);
    const codeMatch = (t.project_code || '').toLowerCase().includes(q);
    const clientMatch = (t.client_name || '').toLowerCase().includes(q);
    const leadMatch = (t.team_lead_name || '').toLowerCase().includes(q);
    const statusMatch = statusFilter === 'All' || t.status === statusFilter;
    return (nameMatch || codeMatch || clientMatch || leadMatch) && statusMatch;
  });

  const paginatedTeams = filteredTeams.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const filteredMembersList = visibleEmployees.filter(emp => {
    const q = memberSearch.toLowerCase();
    const name = getEmpName(emp).toLowerCase();
    const code = (emp.employee_code || '').toLowerCase();
    const dept = (emp.department || '').toLowerCase();
    return name.includes(q) || code.includes(q) || dept.includes(q);
  });

  // Report calculations & filtering
  const allReportProjects = reportData?.projects || [];
  const filteredReportProjects = useMemo(() => {
    return allReportProjects.filter(p => {
      const q = reportSearch.toLowerCase();
      const matchSearch = 
        p.project_name.toLowerCase().includes(q) ||
        p.project_code.toLowerCase().includes(q) ||
        p.client_name.toLowerCase().includes(q) ||
        (p.team_lead_name || '').toLowerCase().includes(q);
      
      const matchProfit = 
        profitFilter === 'All' ||
        (profitFilter === 'Profit' && p.is_profit) ||
        (profitFilter === 'Loss' && !p.is_profit);

      return matchSearch && matchProfit;
    });
  }, [allReportProjects, reportSearch, profitFilter]);

  const paginatedReportProjects = useMemo(() => {
    const start = (reportPage - 1) * reportPageSize;
    return filteredReportProjects.slice(start, start + reportPageSize);
  }, [filteredReportProjects, reportPage, reportPageSize]);

  // Donut chart configuration for Client Breakdown
  const clientChartData = useMemo(() => {
    const clients = reportData?.clients || [];
    if (!clients.length) return null;

    const labels = clients.map(c => c.client_name);
    const series = clients.map(c => c.total_hours);
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b', '#ef4444'];

    const options = {
      chart: {
        type: 'donut',
        height: 280,
        animations: { enabled: true }
      },
      labels,
      colors: colors.slice(0, labels.length),
      legend: { show: false },
      dataLabels: {
        enabled: true,
        formatter: (val) => `${val.toFixed(0)}%`
      },
      plotOptions: {
        pie: {
          donut: {
            size: '68%',
            labels: {
              show: true,
              name: { show: true, fontSize: '13px', fontWeight: 600 },
              value: {
                show: true,
                fontSize: '20px',
                fontWeight: 700,
                formatter: (val) => `${val}h`
              },
              total: {
                show: true,
                label: 'Total Hours',
                fontSize: '12px',
                fontWeight: 600,
                color: '#6b7280',
                formatter: (w) => {
                  const sum = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                  return `${sum.toFixed(0)} hrs`;
                }
              }
            }
          }
        }
      },
      tooltip: {
        y: { formatter: (val) => `${val} working hours` }
      }
    };

    return { series, options, clients, colors };
  }, [reportData]);

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <i className="bi bi-diagram-3-fill text-[#3c50e0]"></i>
            Project Teams & Hours Tracking
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage projects, associate clients, and track hours, budgets, and Profit/Loss thresholds (115 Days = 1,240 Hours).
          </p>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('management')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'management'
                ? 'bg-white dark:bg-gray-900 text-[#3c50e0] shadow-sm font-bold'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <i className="bi bi-people-fill mr-1.5"></i>
            Project Teams
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'report'
                ? 'bg-white dark:bg-gray-900 text-[#3c50e0] shadow-sm font-bold'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <i className="bi bi-bar-chart-steps mr-1.5 text-indigo-500"></i>
            📊 Tracking & Profit/Loss Report
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('invoices');
              fetchInvoices();
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'invoices'
                ? 'bg-white dark:bg-gray-900 text-[#3c50e0] shadow-sm font-bold'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <i className="bi bi-receipt mr-1.5 text-emerald-500"></i>
            🧾 Monthly Invoices & Cumulative Report
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl p-3.5 text-xs font-medium border animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <i className={`bi ${feedback.type === 'success' ? 'bi-check-circle-fill text-emerald-600' : 'bi-exclamation-octagon-fill text-rose-600'} text-base`}></i>
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <i className="bi bi-x text-base"></i>
          </button>
        </div>
      )}

      {/* TAB 1: PROJECT TEAMS MANAGEMENT */}
      {activeTab === 'management' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total Teams: {teams.length}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={fetchTeams}
                disabled={loading}
                className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 transition-colors cursor-pointer"
              >
                {loading ? 'Refreshing...' : '↻ Refresh'}
              </button>

              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 rounded-xl bg-[#3c50e0] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#3245c5] transition-all cursor-pointer"
              >
                <i className="bi bi-plus-lg"></i>
                Create Project Team
              </button>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Projects</span>
              <div className="mt-2 flex items-baseline justify-between">
                <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                  {teams.length}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                  Active Setup
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Delivery</span>
              <div className="mt-2 flex items-baseline justify-between">
                <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {teams.filter(t => t.status === 'Active').length}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Live
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mapped Staff</span>
              <div className="mt-2 flex items-baseline justify-between">
                <h3 className="text-3xl font-extrabold text-[#3c50e0] dark:text-indigo-400">
                  {teams.reduce((acc, t) => acc + (t.member_count || 0), 0)}
                </h3>
                <span className="text-xs text-gray-400">Resources</span>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Standard Budget</span>
              <div className="mt-2 flex items-baseline justify-between">
                <h3 className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">
                  1,240h
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                  115 Days × 8h
                </span>
              </div>
            </div>
          </div>

          {/* Search & Status Filter */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <i className="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by project, client, code, or team lead..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-9 pr-4 py-2 text-xs text-gray-800 focus:border-[#3c50e0] focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-1.5 text-xs text-gray-800 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Project Teams Cards Grid */}
          {loading ? (
            <div className="p-12 text-center text-xs text-gray-400">Loading project teams...</div>
          ) : filteredTeams.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-800">
              <i className="bi bi-folder2-open text-4xl text-gray-400 mb-3 block"></i>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">No Project Teams Found</h3>
              <p className="text-xs text-gray-400 mt-1">
                {searchTerm ? 'Try adjusting your search criteria.' : 'Create your first project team to map staff and set client budgets.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {paginatedTeams.map((team) => (
                  <div
                    key={team.id}
                    className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-xs hover:shadow-md transition-shadow dark:border-gray-800 dark:bg-gray-900"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                              {team.project_code || `PRJ-${team.id}`}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                team.status === 'Active'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              }`}
                            >
                              {team.status}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-gray-900 dark:text-white mt-1.5 line-clamp-1">
                            {team.project_name}
                          </h4>
                          {/* Client Name badge */}
                          <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 mt-0.5 font-semibold">
                            <i className="bi bi-briefcase-fill text-[11px]"></i>
                            <span>Client: {team.client_name || 'Direct Client'}</span>
                          </div>
                        </div>

                        {/* Budget pill */}
                        <div className="text-right">
                          <span className="text-[11px] font-bold px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 block">
                            {team.budget_hours || 1240}h Budget
                          </span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            {team.budget_days || 115}d @ 8h
                          </span>
                        </div>
                      </div>

                      {team.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                          {team.description}
                        </p>
                      )}

                      {/* Team Lead */}
                      <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl mb-3 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">Team Lead</span>
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                            {team.team_lead_name || 'Not Assigned'}
                          </span>
                        </div>
                        <i className="bi bi-person-badge text-indigo-500 text-base"></i>
                      </div>

                      {/* Members Avatar Row */}
                      <div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                          <span className="font-semibold text-gray-600 dark:text-gray-300">
                            Team Members ({team.member_count || 0})
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                          {(team.members || []).length > 0 ? (
                            team.members.map((m) => (
                              <span
                                key={m.mapping_id || m.employee_id}
                                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                {m.employee_name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400 italic">No members mapped.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 mt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenInvoiceModal(team)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                        title="Generate commercial client invoice"
                      >
                        <i className="bi bi-receipt"></i>
                        Invoice
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(team)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#3c50e0] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                      >
                        <i className="bi bi-pencil-square"></i>
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteTeam(team.id, team.project_name)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
                      >
                        <i className="bi bi-trash3"></i>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <Pagination
                currentPage={currentPage}
                totalItems={filteredTeams.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[6, 12, 24]}
                itemLabel="project teams"
              />
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PROJECT TRACKING & PROFIT/LOSS REPORT (Matching user shared image) */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          {/* Formula Rule Banner */}
          <div className="p-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-2xl text-white shadow-md">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">
                  Financial Scenario & Project Commercial Model
                </span>
                <h3 className="text-sm md:text-base font-bold mt-0.5 flex items-center gap-2">
                  <span>Client ➔ Project(s) ➔ Invoices / Hours Allocation</span>
                </h3>
                <p className="text-xs text-indigo-100/90 mt-1">
                  Standard baseline: <strong>115 Days × 8 Hours = 1,240 Hours</strong> across 1 or more resources.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/20 self-start md:self-auto">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/30 text-emerald-300 font-bold text-xs border border-emerald-400/40">
                  ≤ 1,240h = Profit 🟢
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-400/40">
                  &gt; 1,240h = Loss 🔴
                </span>
              </div>
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tracked Projects</span>
              <div className="mt-2 flex items-baseline justify-between">
                <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                  {reportData?.summary?.totalProjects || allReportProjects.length}
                </h3>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full dark:bg-indigo-900/40 dark:text-indigo-300">
                  Active
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Logged Hours</span>
              <div className="mt-2 flex items-baseline justify-between">
                <h3 className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                  {reportData?.summary?.totalActualHours || 0}h
                </h3>
                <span className="text-xs text-gray-400">
                  of {reportData?.summary?.totalBudgetHours || 0}h Budget
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Projects in Profit</span>
              <div className="mt-2 flex items-baseline justify-between">
                <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {reportData?.summary?.profitCount || 0}
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Within 1,240h 🟢
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Projects in Loss</span>
              <div className="mt-2 flex items-baseline justify-between">
                <h3 className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
                  {reportData?.summary?.lossCount || 0}
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
                  Exceeded 🔴
                </span>
              </div>
            </div>
          </div>

          {/* 2-COLUMN SECTION MATCHING USER'S SCREENSHOT (Image 10/14) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT: Hours Contributed Per Project split by its staff */}
            <div className="lg:col-span-7 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <i className="bi bi-grid-3x3-gap-fill text-emerald-600"></i>
                    Hours contributed per project
                  </h3>
                  <span className="text-[11px] font-semibold text-gray-400">
                    Per project — each project split by its staff
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Top billing hours breakdown. All projects with cut corners that combine, as clients form and all others is shown.
                </p>
              </div>

              {/* Projects Grid Tiles (Treemap Style) */}
              <div className="space-y-4">
                {allReportProjects.slice(0, 4).map((p, idx) => {
                  const bgThemes = [
                    'border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-900',
                    'border-sky-200 bg-sky-50/40 dark:bg-sky-950/20 dark:border-sky-900',
                    'border-indigo-200 bg-indigo-50/40 dark:bg-indigo-950/20 dark:border-indigo-900',
                    'border-purple-200 bg-purple-50/40 dark:bg-purple-950/20 dark:border-purple-900'
                  ];
                  const barThemes = [
                    'bg-emerald-600 text-white',
                    'bg-sky-600 text-white',
                    'bg-indigo-600 text-white',
                    'bg-purple-600 text-white'
                  ];
                  const themeIdx = idx % bgThemes.length;

                  return (
                    <div
                      key={p.id}
                      className={`rounded-xl border ${bgThemes[themeIdx]} p-3.5 transition-all`}
                    >
                      {/* Project Bar */}
                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200/50 dark:border-gray-800">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${barThemes[themeIdx]}`}>
                            {p.project_code}
                          </span>
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                            {p.project_name}
                          </span>
                          <span className="text-[11px] text-gray-400 font-normal">
                            ({p.client_name})
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-gray-900 dark:text-white">
                            {p.actual_hours}h
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              p.is_profit
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300'
                            }`}
                          >
                            {p.profit_loss_status}
                          </span>
                        </div>
                      </div>

                      {/* Staff Sub-Tiles */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {p.staff.map((member) => (
                          <div
                            key={member.employee_id}
                            className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-2 border border-gray-200/70 dark:border-gray-700 shadow-2xs"
                          >
                            <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 block truncate">
                              {member.employee_name}
                            </span>
                            <span className="text-[10px] text-gray-400 block truncate">
                              {member.designation || member.role_in_team}
                            </span>
                            <span className="text-xs font-extrabold text-[#3c50e0] dark:text-indigo-400 mt-1 block">
                              {member.logged_hours} hrs
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT: Working Hours by Client and Project (Donut Chart) */}
            <div className="lg:col-span-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <i className="bi bi-pie-chart-fill text-indigo-600"></i>
                    Working hours by client and project
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Per client — inner ring is client total, outer breakdown by projects.
                </p>

                {/* Donut Chart */}
                {clientChartData ? (
                  <div className="flex flex-col items-center">
                    <div className="w-full">
                      <Chart
                        options={clientChartData.options}
                        series={clientChartData.series}
                        type="donut"
                        height={260}
                      />
                    </div>

                    {/* Legend Breakdown */}
                    <div className="w-full mt-4 space-y-2 max-h-48 overflow-y-auto pr-1">
                      {clientChartData.clients.map((client, cIdx) => (
                        <div
                          key={client.client_name}
                          className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: clientChartData.colors[cIdx % clientChartData.colors.length] }}
                            ></span>
                            <span className="font-bold text-gray-800 dark:text-gray-200 truncate">
                              {client.client_name}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              ({client.total_projects} projects)
                            </span>
                          </div>
                          <span className="font-extrabold text-gray-900 dark:text-white shrink-0">
                            {client.total_hours} hrs
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-gray-400">
                    No client data available.
                  </div>
                )}
              </div>

              {/* Bottom Insight Pill */}
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
                <span>Profit limit: <strong>1,240 hrs / project</strong></span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  Standard Commercial SLA
                </span>
              </div>
            </div>
          </div>

          {/* Filter Bar for Commercial Report Table */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <i className="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
              <input
                type="text"
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                placeholder="Search report by project, client, or lead..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-9 pr-4 py-2 text-xs text-gray-800 focus:border-[#3c50e0] focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Profit Filter:</span>
              <select
                value={profitFilter}
                onChange={(e) => setProfitFilter(e.target.value)}
                className="rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-1.5 text-xs text-gray-800 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="All">All Projects</option>
                <option value="Profit">Profit Only (≤ 1,240h)</option>
                <option value="Loss">Loss Only (&gt; 1,240h)</option>
              </select>
            </div>
          </div>

          {/* COMMERCIAL & FINANCIAL TRACKING TABLE */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  Project Commercial & Variance Ledger
                </h4>
                <p className="text-xs text-gray-400">
                  Comprehensive budget vs actual hours, rate margin, and Profit/Loss evaluation.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const candidate = filteredReportProjects[0] || allReportProjects[0];
                    if (candidate) handleOpenInvoiceModal(candidate);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3c50e0] text-white hover:bg-[#3245c5] font-bold text-xs shadow-xs transition-all cursor-pointer"
                  title="Generate commercial client invoice for selected project"
                >
                  <i className="bi bi-receipt"></i>
                  <span>Generate Invoice</span>
                </button>

                <button
                  type="button"
                  onClick={fetchTrackingReport}
                  disabled={reportLoading}
                  className="text-xs font-semibold text-[#3c50e0] hover:underline cursor-pointer"
                >
                  {reportLoading ? 'Loading...' : '↻ Refresh Ledger'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/75 dark:bg-gray-800/50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="py-3 px-4">Project & Code</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Team Lead</th>
                    <th className="py-3 px-4 text-center">Staff Count</th>
                    <th className="py-3 px-4 text-right">Budget (115d)</th>
                    <th className="py-3 px-4 text-right">Actual Hours</th>
                    <th className="py-3 px-4 text-right">Variance</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Invoiced ($)</th>
                    <th className="py-3 px-4 text-right">Net Margin ($)</th>
                    <th className="py-3 px-4 text-center">Invoice Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {paginatedReportProjects.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-gray-400">
                        No projects match the report filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedReportProjects.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-gray-900 dark:text-white block">
                            {p.project_name}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {p.project_code}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-indigo-600 dark:text-indigo-400">
                          {p.client_name}
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                          {p.team_lead_name || '—'}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-gray-700 dark:text-gray-300">
                          {p.members_count}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-800 dark:text-gray-200">
                          {p.budget_hours}h
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-gray-900 dark:text-white">
                          {p.actual_hours}h
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          <span className={p.variance_hours >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                            {p.variance_hours >= 0 ? `+${p.variance_hours}h` : `${p.variance_hours}h`}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              p.is_profit
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${p.is_profit ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                            {p.profit_loss_status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-gray-700 dark:text-gray-300">
                          ${p.invoice_amount?.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-bold">
                          <span className={p.net_margin >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                            ${p.net_margin?.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenInvoiceModal(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 transition-colors shadow-xs cursor-pointer"
                            title="Generate and view commercial client invoice"
                          >
                            <i className="bi bi-receipt"></i>
                            <span>Generate Invoice</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-gray-100 dark:border-gray-800">
              <Pagination
                currentPage={reportPage}
                totalItems={filteredReportProjects.length}
                pageSize={reportPageSize}
                onPageChange={setReportPage}
                onPageSizeChange={setReportPageSize}
                pageSizeOptions={[5, 10, 20]}
                itemLabel="report rows"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MONTHLY INVOICES & CUMULATIVE REPORT */}
      {activeTab === 'invoices' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Header Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-[#1e1b4b] via-[#2e1065] to-[#0f172a] p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-44 h-44 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                  Commercial Ledger & Accounts Receivable
                </span>
                <h3 className="text-base md:text-xl font-extrabold mt-0.5 flex items-center gap-2">
                  <i className="bi bi-receipt text-emerald-400"></i>
                  <span>Monthly Client Invoices & Cumulative Revenue Report</span>
                </h3>
                <p className="text-xs text-indigo-200/90 mt-1 max-w-2xl">
                  Month-wise client billing extraction, live custom editing, payment reconciliation, and cumulative margin tracking across all project teams.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition-all cursor-pointer"
                  title="Export monthly invoices report to CSV/Excel format"
                >
                  <i className="bi bi-file-earmark-spreadsheet-fill"></i>
                  <span>Extract Monthly CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenCreateCustomInvoice}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#3c50e0] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#3245c5] transition-all cursor-pointer"
                >
                  <i className="bi bi-plus-circle-fill"></i>
                  <span>Create Invoice</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cumulative Financial KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cumulative Invoiced</span>
              <div className="mt-2 flex items-baseline justify-between">
                <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white font-mono">
                  ${(invoicesSummary.cumulativeInvoicedAmount || 0).toLocaleString()}
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                  {invoicesSummary.totalInvoicesCount || 0} Invoices
                </span>
              </div>
              <span className="text-[11px] text-gray-400 mt-1 block">Gross contract billed value</span>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cumulative Collected</span>
              <div className="mt-2 flex items-baseline justify-between">
                <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  ${(invoicesSummary.cumulativePaidAmount || 0).toLocaleString()}
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Paid / Settled
                </span>
              </div>
              <span className="text-[11px] text-gray-400 mt-1 block">Realized client payments</span>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cumulative Pending</span>
              <div className="mt-2 flex items-baseline justify-between">
                <h3 className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                  ${(invoicesSummary.cumulativePendingAmount || 0).toLocaleString()}
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  Outstanding
                </span>
              </div>
              <span className="text-[11px] text-gray-400 mt-1 block">Pending client reconciliation</span>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cumulative Net Margin</span>
              <div className="mt-2 flex items-baseline justify-between">
                <h3 className={`text-2xl font-extrabold font-mono ${(invoicesSummary.cumulativeNetMargin || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  ${(invoicesSummary.cumulativeNetMargin || 0).toLocaleString()}
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                  Net Profit 🟢
                </span>
              </div>
              <span className="text-[11px] text-gray-400 mt-1 block">Total revenue less delivery costs</span>
            </div>
          </div>

          {/* Monthly Revenue & Hours Breakdown Ledger */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <i className="bi bi-calendar3 text-[#3c50e0]"></i>
                  Monthly Revenue & Cumulative Hours Breakdown
                </h4>
                <p className="text-xs text-gray-400">
                  Aggregated financial metrics segmented by each monthly billing cycle.
                </p>
              </div>
              <span className="text-xs text-gray-400 font-medium">
                {monthlyBreakdown.length} Billing Periods
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/75 dark:bg-gray-800/50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="py-3 px-4">Billing Month</th>
                    <th className="py-3 px-4 text-center">Invoices</th>
                    <th className="py-3 px-4 text-right">Total Hours</th>
                    <th className="py-3 px-4 text-right">Invoiced Revenue</th>
                    <th className="py-3 px-4 text-right">Delivery Cost</th>
                    <th className="py-3 px-4 text-right">Collected / Paid</th>
                    <th className="py-3 px-4 text-right">Net Profit Margin</th>
                    <th className="py-3 px-4 text-center">Month Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                  {monthlyBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-gray-400">
                        No monthly billing data recorded yet.
                      </td>
                    </tr>
                  ) : (
                    monthlyBreakdown.map((mb) => {
                      const isProfit = mb.netMargin >= 0;
                      return (
                        <tr key={mb.month} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 px-4 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#3c50e0]"></span>
                            <span>{mb.month}</span>
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-gray-700 dark:text-gray-300">
                            {mb.invoicesCount}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-gray-900 dark:text-white">
                            {mb.totalHours}h
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-gray-900 dark:text-white font-bold">
                            ${mb.invoicedAmount?.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-gray-600 dark:text-gray-400">
                            ${mb.costAmount?.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                            ${mb.paidAmount?.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold">
                            <span className={isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                              {isProfit ? `+$${mb.netMargin?.toLocaleString()}` : `-$${Math.abs(mb.netMargin)?.toLocaleString()}`}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              isProfit
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isProfit ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                              {isProfit ? 'Profit 🟢' : 'Loss 🔴'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Filter Bar & Invoices List Ledger */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Month Filter */}
                <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
                  <span className="text-[11px] font-bold text-gray-500 uppercase">Month:</span>
                  <select
                    value={invoiceFilterMonth}
                    onChange={(e) => setInvoiceFilterMonth(e.target.value)}
                    className="bg-transparent text-xs font-bold text-gray-800 dark:text-white focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Months</option>
                    <option value="2026-11">November 2026 (2026-11)</option>
                    <option value="2026-10">October 2026 (2026-10)</option>
                    <option value="2026-09">September 2026 (2026-09)</option>
                    <option value="2026-12">December 2026 (2026-12)</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
                  <span className="text-[11px] font-bold text-gray-500 uppercase">Status:</span>
                  <select
                    value={invoiceFilterStatus}
                    onChange={(e) => setInvoiceFilterStatus(e.target.value)}
                    className="bg-transparent text-xs font-bold text-gray-800 dark:text-white focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Generated">Generated</option>
                    <option value="Sent">Sent</option>
                    <option value="Paid">Paid</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>

                {/* Search */}
                <div className="relative min-w-[220px]">
                  <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                  <input
                    type="text"
                    placeholder="Search invoice, client, project..."
                    value={invoiceSearch}
                    onChange={(e) => setInvoiceSearch(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-8 pr-3 py-1.5 text-xs text-gray-800 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <i className="bi bi-download"></i>
                  <span>Export CSV</span>
                </button>

                <button
                  type="button"
                  onClick={fetchInvoices}
                  disabled={invoicesLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <i className="bi bi-arrow-repeat"></i>
                  <span>{invoicesLoading ? 'Refreshing...' : 'Refresh'}</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/75 dark:bg-gray-800/50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="py-3 px-4">Invoice # & Month</th>
                    <th className="py-3 px-4">Client & Project</th>
                    <th className="py-3 px-4 text-right">Actual Hours</th>
                    <th className="py-3 px-4 text-center">Issue / Due Date</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Invoiced Amount</th>
                    <th className="py-3 px-4 text-right">Net Margin</th>
                    <th className="py-3 px-4 text-center">Actions & Custom Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {invoicesList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-gray-400">
                        No invoices match the selected month/status filter.
                      </td>
                    </tr>
                  ) : (
                    invoicesList.map((inv) => {
                      const isProfit = (parseFloat(inv.net_margin) || 0) >= 0;
                      return (
                        <tr key={inv.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-mono font-extrabold text-indigo-600 dark:text-indigo-400 block">
                              {inv.invoice_number}
                            </span>
                            <span className="text-[10px] text-gray-400 font-semibold">
                              Period: {inv.billing_month || '2026-11'}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-bold text-gray-900 dark:text-white block">
                              {inv.client_name}
                            </span>
                            <span className="text-[11px] text-gray-500">
                              {inv.project_name} <span className="font-mono text-[10px]">({inv.project_code})</span>
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-bold text-gray-900 dark:text-white">
                            {inv.actual_hours || 0}h
                            <span className="text-[10px] text-gray-400 font-normal block">
                              Budget: {inv.budget_hours || 1240}h
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">
                            <span className="block font-semibold">
                              {inv.issue_date ? new Date(inv.issue_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            </span>
                            <span className="text-[10px] text-gray-400 block">
                              Due: {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              (inv.status || '').toLowerCase() === 'paid'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : (inv.status || '').toLowerCase() === 'sent'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                : (inv.status || '').toLowerCase() === 'draft'
                                ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                : 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                (inv.status || '').toLowerCase() === 'paid' ? 'bg-emerald-500' : 'bg-indigo-500'
                              }`}></span>
                              {inv.status || 'Generated'}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-extrabold text-gray-900 dark:text-white">
                            ${(parseFloat(inv.total_amount) || 0).toLocaleString()}
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-bold">
                            <span className={isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                              ${(parseFloat(inv.net_margin) || 0).toLocaleString()}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* Custom Edit Option */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditInvoice(inv)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 transition-colors shadow-xs cursor-pointer"
                                title="Custom edit all invoice details and rates"
                              >
                                <i className="bi bi-pencil-square"></i>
                                <span>Edit</span>
                              </button>

                              {/* Print / View */}
                              <button
                                type="button"
                                onClick={() => {
                                  handleOpenEditInvoice(inv);
                                  setTimeout(() => window.print(), 300);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 font-bold text-xs border border-gray-200 dark:border-gray-700 transition-colors cursor-pointer"
                                title="Print or save as PDF"
                              >
                                <i className="bi bi-printer"></i>
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => handleDeleteInvoice(inv.id, inv.invoice_number)}
                                className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="Delete invoice"
                              >
                                <i className="bi bi-trash3 text-xs"></i>
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
          </div>
        </div>
      )}

      {/* CREATE / EDIT PROJECT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-[#3c50e0] dark:bg-indigo-950/40 dark:text-indigo-300">
                  <i className="bi bi-diagram-3-fill text-lg"></i>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {editingTeam ? 'Edit Project Team' : 'Create Project Team'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Define project details, assign client, set budget days/hours, and select team members.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <i className="bi bi-x-lg text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSaveTeam} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Project / Team Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Enterprise HRMS Platform"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs text-gray-800 focus:border-[#3c50e0] focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Project Code
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="e.g. PRJ-HRMS (auto-generated if empty)"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs text-gray-800 focus:border-[#3c50e0] focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Client Name Input with Datalist & Quick Select */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Client Name *
                    </label>
                    {clientsList.length > 0 && (
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                        {clientsList.length} registered client(s)
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      list="clients-datalist"
                      required
                      value={formClientName}
                      onChange={(e) => setFormClientName(e.target.value)}
                      placeholder="Type or select client name (e.g. Acme Corp, BeeSuite Global)..."
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs text-gray-800 focus:border-[#3c50e0] focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                    <datalist id="clients-datalist">
                      {clientsList.map(c => (
                        <option key={c.id} value={c.name}>
                          {c.client_code ? `${c.client_code} — ` : ''}{c.name}
                        </option>
                      ))}
                    </datalist>
                  </div>
                  
                  {/* Quick-pick registered clients pills */}
                  {clientsList.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[10px] text-gray-400 font-medium">Quick Pick:</span>
                      {clientsList.slice(0, 4).map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setFormClientName(c.name)}
                          className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors cursor-pointer ${
                            formClientName === c.name
                              ? 'bg-[#3c50e0] text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                          }`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-[11px] text-gray-400 mt-1">
                    Associates project with client invoices and hour tracking. Saved to database.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Project Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs text-gray-800 focus:border-[#3c50e0] focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="Active">Active</option>
                    <option value="In Progress">In Progress</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Commercial & Profit/Loss Threshold Fields */}
              <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-950 dark:text-indigo-300 flex items-center gap-1.5">
                    <i className="bi bi-calculator-fill text-[#3c50e0]"></i>
                    Project Budget & Commercial Model
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                    ≤ {formBudgetHours}h Profit 🟢 | &gt; {formBudgetHours}h Loss 🔴
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">
                      Budget Days (e.g. 115)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formBudgetDays}
                      onChange={(e) => {
                        const days = parseInt(e.target.value, 10) || 0;
                        setFormBudgetDays(days);
                        setFormBudgetHours(days * 8);
                      }}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-800 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">
                      Budget Hours (115 × 8 = 1,240)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formBudgetHours}
                      onChange={(e) => setFormBudgetHours(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-800 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">
                      Hourly Rate ($ / hr)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formHourlyRate}
                      onChange={(e) => setFormHourlyRate(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-800 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Assign Team Lead
                </label>
                <select
                  value={formLeadId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormLeadId(val);
                    if (val && !formMemberIds.includes(val)) {
                      setFormMemberIds(prev => [...prev, val]);
                    }
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs text-gray-800 focus:border-[#3c50e0] focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">-- Select Team Lead --</option>
                  {visibleEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employee_code} - {getEmpName(emp)} ({emp.designation || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Project Description
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Brief summary of project scope, objectives, or responsibilities..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-800 focus:border-[#3c50e0] focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Select Team Members (Multi-Select Checklist) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Select Team Members ({formMemberIds.length} selected)
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormMemberIds(visibleEmployees.map(e => String(e.id)))}
                      className="text-[11px] font-semibold text-[#3c50e0] hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => setFormMemberIds([])}
                      className="text-[11px] font-semibold text-gray-400 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="relative mb-2">
                  <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search employees to add..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-8 pr-3 py-1.5 text-xs text-gray-800 focus:border-[#3c50e0] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200/60 dark:border-gray-700">
                  {filteredMembersList.map(emp => {
                    const empIdStr = String(emp.id);
                    const isChecked = formMemberIds.includes(empIdStr);
                    const isLead = formLeadId === empIdStr;
                    const name = getEmpName(emp);

                    return (
                      <label
                        key={emp.id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                          isChecked 
                            ? 'bg-indigo-50/70 border border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800' 
                            : 'hover:bg-white dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleMember(empIdStr)}
                            className="rounded border-gray-300 text-[#3c50e0] focus:ring-[#3c50e0]"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                                {name}
                              </span>
                              {isLead && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300">
                                  Lead
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-gray-400">
                              {emp.employee_code} • {emp.designation || 'Staff'} • {emp.department || 'General'}
                            </span>
                          </div>
                        </div>

                        {isChecked && (
                          <i className="bi bi-check2 text-[#3c50e0] font-bold text-sm"></i>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#3c50e0] px-5 py-2 text-xs font-semibold text-white hover:bg-[#3245c5] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : editingTeam ? 'Save Changes' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CUSTOM EDIT & GENERATE MONTH-WISE CLIENT INVOICE */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 my-8 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#3c50e0] to-indigo-600 flex items-center justify-center text-white shadow-sm">
                  <i className="bi bi-receipt text-lg"></i>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>{editingInvoiceId ? 'Custom Edit Client Invoice' : 'Generate Month-Wise Commercial Invoice'}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                      {invoiceNumber || 'NEW INVOICE'}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Month-wise client billing invoice with customizable line items, rates, taxes, and status.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowInvoiceModal(false);
                  setInvoiceModalProject(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
              >
                <i className="bi bi-x-lg text-lg"></i>
              </button>
            </div>

            {/* Modal Body / Invoice Content */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto" id="printable-invoice">
              {invoiceSuccess && (
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  invoiceSuccess.startsWith('Error') ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  <i className={`bi ${invoiceSuccess.startsWith('Error') ? 'bi-exclamation-octagon-fill' : 'bi-check-circle-fill'}`}></i>
                  <span>{invoiceSuccess}</span>
                </div>
              )}

              {/* Controls Bar: Billing Month, Status, Dates */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/30 dark:bg-indigo-950/20 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block mb-1">
                    🗓️ Billing Month *
                  </label>
                  <input
                    type="month"
                    value={invoiceBillingMonth}
                    onChange={(e) => setInvoiceBillingMonth(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold text-xs focus:ring-1 focus:ring-[#3c50e0]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1">
                    Invoice Status
                  </label>
                  <select
                    value={invoiceStatus}
                    onChange={(e) => setInvoiceStatus(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium text-xs"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Generated">Generated</option>
                    <option value="Sent">Sent</option>
                    <option value="Paid">Paid</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={invoiceIssueDate}
                    onChange={(e) => setInvoiceIssueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1">
                    Due Date (Net 30)
                  </label>
                  <input
                    type="date"
                    value={invoiceDueDate}
                    onChange={(e) => setInvoiceDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs"
                  />
                </div>
              </div>

              {/* Invoice Meta Grid: Client & Project Selection with Auto-load */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-800/20 text-xs">
                {/* Left Column: Client & Project Selection */}
                <div className="space-y-3">
                  {/* Client Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <i className="bi bi-building text-[#3c50e0]"></i>
                        <span>Select Client *</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCustomClient(!isCustomClient)}
                        className="text-[10px] font-semibold text-[#3c50e0] hover:underline cursor-pointer"
                      >
                        {isCustomClient ? '← Select Existing Client' : '+ Custom Client'}
                      </button>
                    </div>

                    {!isCustomClient ? (
                      <select
                        value={invoiceClientName}
                        onChange={(e) => handleClientChange(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-xs focus:ring-1 focus:ring-[#3c50e0] shadow-2xs"
                      >
                        <option value="">-- Select Client to Auto-Load Project --</option>
                        {uniqueClients.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={invoiceClientName}
                        onChange={(e) => setInvoiceClientName(e.target.value)}
                        placeholder="Type Client or Company Name..."
                        className="w-full px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-xs focus:ring-1 focus:ring-[#3c50e0]"
                      />
                    )}
                  </div>

                  {/* Project Selection (Auto-loaded based on client) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <i className="bi bi-kanban text-[#3c50e0]"></i>
                        <span>Select Project *</span>
                        <span className="text-[9px] font-mono text-gray-400">({clientProjects.length} available)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCustomProject(!isCustomProject)}
                        className="text-[10px] font-semibold text-[#3c50e0] hover:underline cursor-pointer"
                      >
                        {isCustomProject ? '← Select from List' : '+ Custom Project'}
                      </button>
                    </div>

                    {!isCustomProject && clientProjects.length > 0 ? (
                      <select
                        value={invProjectId || ''}
                        onChange={(e) => handleProjectSelect(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold text-xs focus:ring-1 focus:ring-[#3c50e0] shadow-2xs"
                      >
                        <option value="">-- Choose Project to Auto-Generate Invoice --</option>
                        {clientProjects.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.project_name} ({p.project_code || `PRJ-${p.id}`})
                          </option>
                        ))}
                      </select>
                    ) : null}

                    {/* Project Name and Code Editable Fields */}
                    <div className="grid grid-cols-2 gap-2 mt-1.5">
                      <div>
                        <label className="text-[9px] font-semibold text-gray-400 block mb-0.5">Project Name</label>
                        <input
                          type="text"
                          value={invoiceProjectName}
                          onChange={(e) => setInvoiceProjectName(e.target.value)}
                          placeholder="Project Name"
                          className="w-full px-2.5 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-semibold text-gray-400 block mb-0.5">Project Code</label>
                        <input
                          type="text"
                          value={invoiceProjectCode}
                          onChange={(e) => {
                            const val = e.target.value;
                            setInvoiceProjectCode(val);
                            const clean = val.replace(/[^a-zA-Z0-9]/g, '');
                            if (clean) setInvoiceNumber(`INV-${new Date().getFullYear()}-${clean}`);
                          }}
                          placeholder="e.g. PRJ-MOBILE"
                          className="w-full px-2.5 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Invoice Number, Rates, Logged Hours */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
                      📄 Current Invoice Number (Auto-Generated)
                    </label>
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="e.g. INV-2026-PRJMOBILE"
                      className="w-full px-3 py-1.5 font-mono font-bold text-xs rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20 text-[#3c50e0] dark:text-indigo-300 focus:ring-1 focus:ring-[#3c50e0]"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Auto-generated from year & project code upon client/project selection.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        Billing Rate ($/hr)
                      </label>
                      <input
                        type="number"
                        value={invoiceHourlyRate}
                        onChange={(e) => setInvoiceHourlyRate(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 font-mono text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        Logged Actual Hours
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={invoiceActualHours}
                        onChange={(e) => setInvoiceActualHours(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 font-mono text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Editable Custom Line Items & Scope Deliverables */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-800/60 px-4 py-2.5 border-b border-gray-200 dark:border-gray-800 font-bold text-xs text-gray-700 dark:text-gray-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <i className="bi bi-list-check text-[#3c50e0]"></i>
                    <span>Custom Invoice Line Items & Milestones</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                      {invoiceLineItems.length} items
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#3c50e0] text-white hover:bg-[#3245c5] text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    <i className="bi bi-plus-circle"></i>
                    Add Custom Line Item
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100/60 dark:bg-gray-800/50 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800">
                      <tr>
                        <th className="py-2.5 px-3 w-10">#</th>
                        <th className="py-2.5 px-3">Description / Deliverable</th>
                        <th className="py-2.5 px-3 text-right w-28">Hours</th>
                        <th className="py-2.5 px-3 text-right w-28">Rate ($/hr)</th>
                        <th className="py-2.5 px-3 text-right w-32">Amount ($)</th>
                        <th className="py-2.5 px-3 text-center w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {invoiceLineItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-gray-400">
                            No line items added yet. Click &quot;Add Custom Line Item&quot; to customize deliverables.
                          </td>
                        </tr>
                      ) : (
                        invoiceLineItems.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                            <td className="py-2 px-3 text-gray-400 font-mono text-[11px]">{idx + 1}</td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={item.description || ''}
                                onChange={(e) => handleUpdateLineItem(item.id, 'description', e.target.value)}
                                placeholder="Milestone / task / engineering deliverable"
                                className="w-full px-2.5 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#3c50e0]"
                              />
                            </td>
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                step="0.5"
                                value={item.hours ?? 0}
                                onChange={(e) => handleUpdateLineItem(item.id, 'hours', e.target.value)}
                                className="w-24 text-right px-2 py-1 text-xs font-mono rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#3c50e0]"
                              />
                            </td>
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                step="1"
                                value={item.rate ?? 75}
                                onChange={(e) => handleUpdateLineItem(item.id, 'rate', e.target.value)}
                                className="w-24 text-right px-2 py-1 text-xs font-mono rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#3c50e0]"
                              />
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-gray-900 dark:text-white">
                              ${((parseFloat(item.amount) || ((parseFloat(item.hours) || 0) * (parseFloat(item.rate) || 0)))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveLineItem(item.id)}
                                title="Remove Line Item"
                                className="text-gray-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Staff Breakdown Timesheet (if populated) */}
              {invoiceStaffBreakdown && invoiceStaffBreakdown.length > 0 && (
                <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                  <div className="bg-gray-50/70 dark:bg-gray-800/40 px-4 py-2 border-b border-gray-200 dark:border-gray-800 font-semibold text-xs text-gray-600 dark:text-gray-400 flex items-center justify-between">
                    <span>Staff Timesheet Allocation (Reference)</span>
                    <span className="text-[11px] font-mono text-gray-400">{invoiceStaffBreakdown.length} assigned resources</span>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100/40 dark:bg-gray-800/30 text-[10px] font-bold text-gray-400 uppercase">
                      <tr>
                        <th className="py-2 px-4">Staff Member</th>
                        <th className="py-2 px-4">Role / Designation</th>
                        <th className="py-2 px-4 text-right">Logged Hours</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {invoiceStaffBreakdown.map((m, mIdx) => (
                        <tr key={m.employee_id || mIdx} className="hover:bg-gray-50/20">
                          <td className="py-1.5 px-4 text-gray-800 dark:text-gray-200">
                            • {m.employee_name} <span className="text-[10px] text-gray-400 font-mono">({m.employee_code})</span>
                          </td>
                          <td className="py-1.5 px-4 text-gray-500">{m.role_in_team} ({m.designation || 'Staff'})</td>
                          <td className="py-1.5 px-4 text-right font-mono text-gray-700 dark:text-gray-300">{m.logged_hours || 0}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Financial Calculation Ledger */}
              {(() => {
                const linesSum = invoiceLineItems.reduce((acc, it) => acc + (parseFloat(it.amount) || ((parseFloat(it.hours) || 0) * (parseFloat(it.rate) || 0))), 0);
                const subTotal = linesSum > 0 ? linesSum : (parseFloat(invoiceTotalAmount) || 93000);
                const tax = parseFloat(invoiceTaxAmount) || 0;
                const discount = parseFloat(invoiceDiscountAmount) || 0;
                const totalPayable = parseFloat((subTotal + tax - discount).toFixed(2));
                const paid = parseFloat(invoicePaidAmount) || 0;
                const balanceDue = parseFloat((totalPayable - paid).toFixed(2));
                const actualCost = parseFloat(((parseFloat(invoiceActualHours) || 0) * (parseFloat(invoiceHourlyRate) || 75)).toFixed(2));
                const netMargin = parseFloat((totalPayable - actualCost).toFixed(2));
                const isProfit = (parseFloat(invoiceActualHours) || 0) <= (parseFloat(invoiceBudgetHours) || 1240);

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                        Invoice Notes & Payment Terms
                      </label>
                      <textarea
                        rows={5}
                        value={invoiceNotes}
                        onChange={(e) => setInvoiceNotes(e.target.value)}
                        placeholder="Payment terms, bank details, delivery milestones, or custom clauses..."
                        className="w-full text-xs rounded-xl border border-gray-200 dark:border-gray-700 p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-gray-800/30 space-y-2 text-xs">
                      <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>Deliverables Subtotal:</span>
                        <span className="font-mono font-bold">${subTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                        <span>Tax / GST / VAT ($):</span>
                        <input
                          type="number"
                          step="0.01"
                          value={invoiceTaxAmount}
                          onChange={(e) => setInvoiceTaxAmount(e.target.value)}
                          className="w-28 text-right font-mono font-semibold px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                        />
                      </div>

                      <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                        <span>Discount / Rebate ($):</span>
                        <input
                          type="number"
                          step="0.01"
                          value={invoiceDiscountAmount}
                          onChange={(e) => setInvoiceDiscountAmount(e.target.value)}
                          className="w-28 text-right font-mono font-semibold px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-rose-600 dark:text-rose-400"
                        />
                      </div>

                      <div className="flex justify-between text-sm font-extrabold pt-2 border-t border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
                        <span>Total Invoiced Amount:</span>
                        <span className="text-[#3c50e0] font-mono">${totalPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>

                      <div className="flex items-center justify-between text-gray-600 dark:text-gray-400 pt-1 border-t border-gray-200 dark:border-gray-700">
                        <span className="font-medium text-emerald-700 dark:text-emerald-400">Paid / Collected ($):</span>
                        <input
                          type="number"
                          step="0.01"
                          value={invoicePaidAmount}
                          onChange={(e) => setInvoicePaidAmount(e.target.value)}
                          className="w-28 text-right font-mono font-semibold px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400"
                        />
                      </div>

                      <div className="flex justify-between font-bold text-xs pt-1 border-t border-gray-200 dark:border-gray-700">
                        <span className={balanceDue > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                          Outstanding Balance Due:
                        </span>
                        <span className="font-mono font-bold">${balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>

                      
                    </div>
                  

                  {/* Admin Internal Reference (Hidden from client invoice & print) */}
                  <div className="mt-4 p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/40 text-xs print:hidden">
                    <div className="flex items-center justify-between text-gray-700 dark:text-gray-300 font-semibold mb-1">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <i className="bi bi-shield-lock text-[#3c50e0]"></i>
                        <span>Admin Internal Reference (Confidential • Not Shown on Client Invoice)</span>
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        netMargin >= 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}>
                        {netMargin >= 0 ? 'Profitable Project' : 'Exceeded Budget (Loss)'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px] pt-1.5 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <span className="text-gray-400 block text-[10px]">Logged Hours:</span>
                        <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{invoiceActualHours}h</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Internal Cost:</span>
                        <span className="font-mono font-bold text-gray-800 dark:text-gray-200">${actualCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Projected Net Margin:</span>
                        <span className={`font-mono font-bold ${netMargin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          ${netMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div></div>
                );
              })()}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
              <button
                type="button"
                onClick={handlePrintInvoice}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 shadow-xs cursor-pointer"
              >
                <i className="bi bi-printer"></i>
                Print / Save PDF
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowInvoiceModal(false);
                    setInvoiceModalProject(null);
                  }}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveInvoice}
                  disabled={generatingInvoice}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#3c50e0] px-5 py-2 text-xs font-semibold text-white hover:bg-[#3245c5] transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  <i className="bi bi-save"></i>
                  {generatingInvoice ? 'Saving Invoice...' : editingInvoiceId ? 'Update Invoice Changes' : 'Save & Record Invoice'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

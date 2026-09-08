'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Receipt, Plus, Printer, Send, CheckCircle2, 
  AlertCircle, DollarSign, Calendar, Clock, ArrowRight, Eye, RefreshCw
} from 'lucide-react';

interface ParticipantOption {
  id: string;
  name: string;
  referenceNumber?: string;
  fundingType?: string;
  planManager?: string;
}

interface InvoiceLineItem {
  id: string;
  service_record_id?: string;
  support_item_code: string;
  description: string;
  service_date: string;
  quantity: number;
  unit: string;
  unit_rate: number;
  line_total: number;
}

interface Invoice {
  id: string;
  invoice_reference: string;
  participant_id: string;
  funding_type: string;
  plan_manager_name?: string;
  plan_manager_email?: string;
  invoice_date: string;
  due_date: string;
  status: 'Draft' | 'Ready' | 'Sent' | 'Paid' | 'Partially Paid' | 'Rejected' | 'Cancelled' | 'Adjusted';
  subtotal: number;
  gst: number;
  total: number;
  notes?: string;
  created_at: string;
  participant?: { id: string; full_name: string; reference_number?: string; email?: string; ndis_number?: string };
  items?: InvoiceLineItem[];
}

interface ReadyServiceRecord {
  id: string;
  service_reference: string;
  service_date: string;
  support_item_name: string;
  support_item_code: string;
  quantity: number;
  unit_rate: number;
  subtotal: number;
  travel_amount: number;
}

interface InvoicingTabProps {
  participants: ParticipantOption[];
}

export default function InvoicingTab({ participants }: InvoicingTabProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showGenModal, setShowGenModal] = useState(false);
  const [selectedParticipantId, setSelectedParticipantId] = useState('');
  const [readyRecords, setReadyRecords] = useState<ReadyServiceRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [dueDays, setDueDays] = useState(14);
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/billing/invoices?';
      if (statusFilter !== 'all') url += `status=${statusFilter}&`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // When participant is selected in Generator modal, load approved service records
  useEffect(() => {
    if (!selectedParticipantId) {
      setReadyRecords([]);
      setSelectedRecordIds([]);
      return;
    }

    async function loadReadyRecords() {
      setLoadingRecords(true);
      try {
        const res = await fetch(`/api/billing/service-records?participant_id=${selectedParticipantId}&approval_status=Approved&billable_status=Ready`);
        if (res.ok) {
          const data = await res.json();
          const recs = data.records || [];
          setReadyRecords(recs);
          setSelectedRecordIds(recs.map((r: any) => r.id));
        }
      } catch (err) {
        console.error('Failed to load ready records:', err);
      } finally {
        setLoadingRecords(false);
      }
    }

    loadReadyRecords();
  }, [selectedParticipantId]);

  async function handleGenerateInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedParticipantId) {
      alert('Please select a participant.');
      return;
    }
    if (selectedRecordIds.length === 0) {
      alert('Please select at least one approved service record to bill.');
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('/api/billing/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: selectedParticipantId,
          service_record_ids: selectedRecordIds,
          due_days: dueDays,
          notes: invoiceNotes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setNotice(`Tax Invoice ${data.invoice.invoice_reference} generated successfully.`);
        setShowGenModal(false);
        loadInvoices();
      } else {
        alert('Error: ' + (data.error || 'Failed to generate invoice'));
      }
    } catch {
      alert('Network error while generating invoice.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleMarkPaid(invoiceId: string) {
    if (!confirm('Mark this invoice as Paid?')) return;
    try {
      const res = await fetch('/api/billing/invoices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: invoiceId, status: 'Paid' }),
      });
      if (res.ok) {
        setNotice('Invoice marked as Paid.');
        loadInvoices();
      }
    } catch {
      alert('Network error.');
    }
  }

  async function handleSendInvoice(invoiceId: string) {
    try {
      const res = await fetch(`/api/billing/invoices/${invoiceId}/send`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setNotice('Invoice dispatched via email to billing contact.');
        loadInvoices();
      } else {
        alert('Notice: ' + (data.error || 'Could not send invoice'));
      }
    } catch {
      alert('Network error sending invoice.');
    }
  }

  const statusColors: Record<string, { bg: string; text: string }> = {
    Draft: { bg: '#F1F5F9', text: '#475569' },
    Ready: { bg: '#FEF3C7', text: '#B45309' },
    Sent: { bg: '#EFF6FF', text: '#1E40AF' },
    Paid: { bg: '#ECFDF5', text: '#065F46' },
    'Partially Paid': { bg: '#FFFBEB', text: '#B45309' },
    Rejected: { bg: '#FEF2F2', text: '#DC2626' },
    Cancelled: { bg: '#F1F5F9', text: '#64748B' },
  };

  const selectedTotal = readyRecords
    .filter((r) => selectedRecordIds.includes(r.id))
    .reduce((acc, r) => acc + Number(r.subtotal || 0) + Number(r.travel_amount || 0), 0);

  return (
    <div className="crmTabPanel">
      <div className="crmPanelHeader">
        <div>
          <h2 className="crmPanelTitle">Invoicing & Billing Foundation</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748B' }}>
            Generate NDIS-compliant tax invoices from verified, manager-approved service delivery records.
          </p>
        </div>
        <button
          onClick={() => {
            if (participants.length > 0) setSelectedParticipantId(participants[0].id);
            setShowGenModal(true);
          }}
          className="vsBtnBlack"
          style={{ padding: '8px 18px', fontSize: '0.82rem' }}
        >
          <Receipt size={15} style={{ marginRight: 6 }} />
          Generate Invoice
        </button>
      </div>

      {notice && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '10px 16px', borderRadius: 10, marginBottom: 16, fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>? {notice}</span>
          <button onClick={() => setNotice(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>&times;</button>
        </div>
      )}

      {/* Existing Invoices Table */}
      <div className="crmTableWrapper">
        <table className="crmTable">
          <thead>
            <tr>
              <th>Invoice Ref</th>
              <th>Participant</th>
              <th>Funding Type / Contact</th>
              <th>Date</th>
              <th>Due Date</th>
              <th>Amount (AUD)</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: '#64748B' }}>Loading invoices...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>No invoices generated yet. Click &quot;Generate Invoice&quot; to bill approved shifts.</td></tr>
            ) : (
              invoices.map((inv) => {
                const st = statusColors[inv.status] || { bg: '#F1F5F9', text: '#475569' };
                return (
                  <tr key={inv.id}>
                    <td>
                      <strong style={{ fontFamily: 'monospace', color: '#0F172A', fontSize: '0.88rem' }}>{inv.invoice_reference}</strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1E293B', fontSize: '0.88rem' }}>
                        {inv.participant?.full_name || 'Participant'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {inv.participant?.reference_number || ''}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                        {inv.funding_type}
                      </div>
                      {inv.plan_manager_name && (
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          PM: {inv.plan_manager_name}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: '#475569' }}>
                      {new Date(inv.invoice_date).toLocaleDateString('en-AU')}
                    </td>
                    <td style={{ fontSize: '0.82rem', fontWeight: 600, color: '#DC2626' }}>
                      {new Date(inv.due_date).toLocaleDateString('en-AU')}
                    </td>
                    <td>
                      <strong style={{ fontSize: '0.92rem', color: '#0F172A' }}>${Number(inv.total).toFixed(2)}</strong>
                    </td>
                    <td>
                      <span style={{ background: st.bg, color: st.text, padding: '3px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700 }}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <a
                          href={`/api/billing/invoices/${inv.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Print / Save PDF"
                          style={{ background: '#F1F5F9', textDecoration: 'none', borderRadius: 6, padding: '6px 10px', color: '#334155', fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Printer size={13} /> PDF
                        </a>
                        <button
                          onClick={() => handleSendInvoice(inv.id)}
                          title="Send Invoice to Billing Contact"
                          style={{ background: '#EFF6FF', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: '#1E40AF', fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Send size={12} /> Send
                        </button>
                        {inv.status !== 'Paid' && (
                          <button
                            onClick={() => handleMarkPaid(inv.id)}
                            title="Mark as Paid"
                            style={{ background: '#ECFDF5', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: '#065F46', fontSize: '0.78rem', fontWeight: 700 }}
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Generate Invoice Modal */}
      {showGenModal && (
        <div className="crmModalBackdrop" onClick={() => setShowGenModal(false)}>
          <div className="crmModalCard" style={{ maxWidth: 740 }} onClick={(e) => e.stopPropagation()}>
            <div className="crmModalHeader">
              <div>
                <h3 className="crmModalTitle">Generate Tax Invoice</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                  Billing is created exclusively from approved service delivery records.
                </p>
              </div>
              <button className="crmModalCloseBtn" onClick={() => setShowGenModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleGenerateInvoice}>
              <div className="crmModalBody" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>
                      Select Participant *
                    </label>
                    <select
                      value={selectedParticipantId}
                      onChange={(e) => setSelectedParticipantId(e.target.value)}
                      required
                      style={{ width: '100%', height: 38, borderRadius: 8, border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '0.85rem', background: '#FFF' }}
                    >
                      <option value="">Select participant...</option>
                      {participants.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.referenceNumber || 'PAR'}) - {p.fundingType || 'Plan-Managed'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>
                      Payment Terms (Due in Days)
                    </label>
                    <input
                      type="number"
                      value={dueDays}
                      onChange={(e) => setDueDays(Number(e.target.value))}
                      min="1"
                      max="60"
                      style={{ width: '100%', height: 38, borderRadius: 8, border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                {/* Approved Service Records to Bill */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
                    Approved Shifts Ready to Bill ({readyRecords.length})
                  </label>

                  {loadingRecords ? (
                    <div style={{ padding: 20, textAlign: 'center', color: '#64748B', fontSize: '0.85rem' }}>
                      Querying approved service records...
                    </div>
                  ) : readyRecords.length === 0 ? (
                    <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: 8, padding: 24, textAlign: 'center', color: '#64748B', fontSize: '0.85rem' }}>
                      No approved service records are currently ready for billing for this participant.
                      <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: 4 }}>
                        (Tip: Check Workforce &gt; Timesheets and approve completed shifts first.)
                      </div>
                    </div>
                  ) : (
                    <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
                      <table className="crmTable" style={{ margin: 0 }}>
                        <thead>
                          <tr>
                            <th style={{ width: 40 }}>
                              <input
                                type="checkbox"
                                checked={selectedRecordIds.length === readyRecords.length}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedRecordIds(readyRecords.map((r) => r.id));
                                  else setSelectedRecordIds([]);
                                }}
                              />
                            </th>
                            <th>Service Date</th>
                            <th>Support Description</th>
                            <th>Quantity (hrs)</th>
                            <th>Unit Rate</th>
                            <th style={{ textAlign: 'right' }}>Line Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {readyRecords.map((rec) => (
                            <tr key={rec.id}>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={selectedRecordIds.includes(rec.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedRecordIds([...selectedRecordIds, rec.id]);
                                    else setSelectedRecordIds(selectedRecordIds.filter((id) => id !== rec.id));
                                  }}
                                />
                              </td>
                              <td style={{ fontSize: '0.82rem' }}>{new Date(rec.service_date).toLocaleDateString('en-AU')}</td>
                              <td style={{ fontSize: '0.82rem', fontWeight: 600 }}>{rec.support_item_name}</td>
                              <td>{rec.quantity} hrs</td>
                              <td>${Number(rec.unit_rate).toFixed(2)}</td>
                              <td style={{ textAlign: 'right', fontWeight: 700 }}>
                                ${(Number(rec.subtotal) + Number(rec.travel_amount || 0)).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {readyRecords.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '12px 18px' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#166534' }}>
                      Selected ({selectedRecordIds.length} of {readyRecords.length} records)
                    </span>
                    <strong style={{ fontSize: '1.15rem', color: '#15803D' }}>
                      Invoice Total: ${selectedTotal.toFixed(2)} AUD
                    </strong>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>
                    Invoice Notes / Remittance Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fortnightly personal care and community access"
                    value={invoiceNotes}
                    onChange={(e) => setInvoiceNotes(e.target.value)}
                    style={{ width: '100%', height: 38, borderRadius: 8, border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div className="crmModalFooter" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: 16 }}>
                <button
                  type="button"
                  onClick={() => setShowGenModal(false)}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFF', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating || selectedRecordIds.length === 0}
                  style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#0F766E', color: '#FFF', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  {generating ? 'Generating...' : `Generate Invoice ($${selectedTotal.toFixed(2)})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import LoadingRows from '@/components/ui/LoadingRows';

import DialogPanel from '@/components/ui/DialogPanel';

import { notify } from '@/components/ui/ProductFeedback';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FormDrawer,
  DrawerHeader,
  FormSection,
  FormField,
  FormInput,
  FormSelect,
  FormGrid2,
  FormSummaryCard,
  StickyFormFooter,
} from '@/components/admin/forms';
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
  const [loadError, setLoadError] = useState(false);
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
    setLoadError(false);
    try {
      let url = '/api/billing/invoices?';
      if (statusFilter !== 'all') url += `status=${statusFilter}&`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Unable to load records');
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
      }
    } catch (err) {
      setLoadError(true);
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
      notify('Please select a participant.');
      return;
    }
    if (selectedRecordIds.length === 0) {
      notify('Please select at least one approved service record to bill.');
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
        notify('Error: ' + (data.error || 'Failed to generate invoice'));
      }
    } catch {
      notify('Network error while generating invoice.');
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
      notify('Network error.');
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
        notify('Notice: ' + (data.error || 'Could not send invoice'));
      }
    } catch {
      notify('Network error sending invoice.');
    }
  }

  const statusColors: Record<string, { bg: string; text: string }> = {
    Draft: { bg: 'var(--oc-subtle)', text: 'var(--oc-secondary)' },
    Ready: { bg: '#FEF3C7', text: '#B45309' },
    Sent: { bg: 'var(--oc-info-soft)', text: 'var(--oc-accent)' },
    Paid: { bg: '#ECFDF5', text: '#065F46' },
    'Partially Paid': { bg: 'var(--oc-warning-soft)', text: '#B45309' },
    Rejected: { bg: 'var(--oc-danger-soft)', text: 'var(--oc-danger)' },
    Cancelled: { bg: 'var(--oc-subtle)', text: 'var(--oc-muted)' },
  };

  const selectedTotal = readyRecords
    .filter((r) => selectedRecordIds.includes(r.id))
    .reduce((acc, r) => acc + Number(r.subtotal || 0) + Number(r.travel_amount || 0), 0);

  return (
    <div className="crmTabPanel">
      <div className="crmPanelHeader">
        <div>
          <h2 className="crmPanelTitle">Invoices</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--oc-muted)' }}>
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
              <th className="ocNumeric">Amount (AUD)</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadError ? (<tr><td colSpan={8}><div className="ocEmpty" role="alert"><strong>Unable to load invoices</strong><p>Check your connection and try again.</p><button type="button" className="ocTextButton" onClick={loadInvoices}>Try again</button></div></td></tr>) : loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: 'var(--oc-muted)' }}><LoadingRows label="Loading invoices" /></td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--oc-muted)' }}><div className="ocEmpty"><strong>Your invoice register is clear</strong><p>Generate an invoice when approved service records are ready to bill.</p></div></td></tr>
            ) : (
              invoices.map((inv) => {
                const st = statusColors[inv.status] || { bg: 'var(--oc-subtle)', text: 'var(--oc-secondary)' };
                return (
                  <tr key={inv.id}>
                    <td>
                      <strong style={{ fontFamily: 'monospace', color: 'var(--oc-text)', fontSize: '0.88rem' }}>{inv.invoice_reference}</strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--oc-text)', fontSize: '0.88rem' }}>
                        {inv.participant?.full_name || 'Participant'}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)' }}>
                        {inv.participant?.reference_number || ''}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--oc-secondary)' }}>
                        {inv.funding_type}
                      </div>
                      {inv.plan_manager_name && (
                        <div style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)' }}>
                          PM: {inv.plan_manager_name}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--oc-secondary)' }}>
                      {new Date(inv.invoice_date).toLocaleDateString('en-AU')}
                    </td>
                    <td style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--oc-danger)' }}>
                      {new Date(inv.due_date).toLocaleDateString('en-AU')}
                    </td>
                    <td className="ocNumeric">
                      <strong style={{ fontSize: '0.92rem', color: 'var(--oc-text)' }}>${Number(inv.total).toFixed(2)}</strong>
                    </td>
                    <td>
                      <span style={{ background: st.bg, color: st.text, padding: '3px 10px', borderRadius: 12, fontSize: '0.8125rem', fontWeight: 600 }}>
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
                          style={{ background: 'var(--oc-subtle)', textDecoration: 'none', borderRadius: 6, padding: '6px 10px', color: 'var(--oc-secondary)', fontSize: '0.8125rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Printer size={13} /> PDF
                        </a>
                        <button
                          onClick={() => handleSendInvoice(inv.id)}
                          title="Send Invoice to Billing Contact"
                          style={{ background: 'var(--oc-info-soft)', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: 'var(--oc-accent)', fontSize: '0.8125rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Send size={12} /> Send
                        </button>
                        {inv.status !== 'Paid' && (
                          <button
                            onClick={() => handleMarkPaid(inv.id)}
                            title="Mark as Paid"
                            style={{ background: '#ECFDF5', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: '#065F46', fontSize: '0.8125rem', fontWeight: 600 }}
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

      {/* Generate Invoice Drawer */}
      <FormDrawer
        isOpen={showGenModal}
        onClose={() => setShowGenModal(false)}
        wide={true}
      >
        <DrawerHeader
          title="Generate Tax Invoice"
          description="Billing is generated directly from verified and approved support shift records."
          badge={<span className="refIdTag">BILLING & CLAIMS</span>}
          onClose={() => setShowGenModal(false)}
        />

        <form onSubmit={handleGenerateInvoice} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 73px)' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <FormSection title="1. Participant & Payment Terms">
              <FormGrid2>
                <FormField label="Select Participant" required>
                  <FormSelect
                    value={selectedParticipantId}
                    onChange={(e) => setSelectedParticipantId(e.target.value)}
                    required
                  >
                    <option value="">Select participant...</option>
                    {participants.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.referenceNumber || 'PAR'}) - {p.fundingType || 'Plan-Managed'}
                      </option>
                    ))}
                  </FormSelect>
                </FormField>

                <FormField label="Payment Terms (Due in Days)" hint="Standard terms: 14 days">
                  <FormInput
                    type="number"
                    value={dueDays}
                    onChange={(e) => setDueDays(Number(e.target.value))}
                    min="1"
                    max="60"
                  />
                </FormField>
              </FormGrid2>
            </FormSection>

            <FormSection title="2. Approved Shifts Ready to Bill">
              <div style={{ marginBottom: 8, fontSize: '0.8125rem', color: 'var(--oc-muted)' }}>
                Showing approved shift records for the selected participant ({readyRecords.length} available)
              </div>

              {loadingRecords ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--oc-muted)', fontSize: '0.85rem' }}>
                  Querying approved service delivery records...
                </div>
              ) : readyRecords.length === 0 ? (
                <div style={{ background: 'var(--oc-background)', border: '1px dashed var(--oc-border)', borderRadius: 10, padding: 24, textAlign: 'center', color: 'var(--oc-muted)', fontSize: '0.85rem' }}>
                  No approved service records are currently ready for billing for this participant.
                  <div style={{ fontSize: '0.75rem', color: 'var(--oc-muted)', marginTop: 6 }}>
                    Tip: Verify shifts in Workforce &gt; Timesheets and approve completed shifts first.
                  </div>
                </div>
              ) : (
                <div style={{ border: '1px solid var(--oc-border)', borderRadius: 10, overflow: 'hidden' }}>
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
                        <th>Hours</th>
                        <th className="ocNumeric">Unit Rate</th>
                        <th className="ocNumeric" style={{ textAlign: 'right' }}>Line Total</th>
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
                          <td className="ocNumeric">$${Number(rec.unit_rate).toFixed(2)}</td>
                          <td className="ocNumeric" style={{ textAlign: 'right', fontWeight: 600 }}>
                            $${(Number(rec.subtotal) + Number(rec.travel_amount || 0)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </FormSection>

            {readyRecords.length > 0 && (
              <FormSummaryCard
                title="Invoice Billing Breakdown"
                rows={[
                  { label: 'Selected Shift Records', value: `${selectedRecordIds.length} of ${readyRecords.length} items` },
                  { label: 'Total Billed Amount', value: `$${selectedTotal.toFixed(2)}`, isBold: true },
                ]}
                totalLabel="Invoice Payable"
                totalValue={`$${selectedTotal.toFixed(2)} AUD`}
              />
            )}

            <FormSection title="3. Remittance & Reference">
              <FormField label="Invoice Notes / Remittance Reference">
                <FormInput
                  type="text"
                  placeholder="e.g. Fortnightly personal care and community access"
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                />
              </FormField>
            </FormSection>
          </div>

          <StickyFormFooter
            cancelLabel="Cancel"
            onCancel={() => setShowGenModal(false)}
            primaryLabel={generating ? 'Generating...' : `Generate Invoice ($${selectedTotal.toFixed(2)})`}
            primaryDisabled={generating || selectedRecordIds.length === 0}
            loading={generating}
          />
        </form>
      </FormDrawer>
    </div>
  );
}

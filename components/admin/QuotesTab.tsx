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
  FormTextarea,
  FormGrid2,
  FormSummaryCard,
  StickyFormFooter,
} from '@/components/admin/forms';
import { 
  FileText, Plus, Calculator, CheckCircle2, Send, 
  Printer, ArrowRight, Layers, Trash2, Eye, ExternalLink, RefreshCw
} from 'lucide-react';

interface NdisItem {
  id: string;
  support_item_code: string;
  support_item_name: string;
  category: string;
  reference_rate: number;
  unit: string;
}

interface ParticipantOption {
  id: string;
  name: string;
  referenceNumber?: string;
  fundingType?: string;
  email?: string;
}

interface QuoteLineItem {
  id?: string;
  support_item_id?: string;
  description: string;
  unit: string;
  quantity: number;
  frequency: string;
  unit_rate: number;
  estimated_weeks: number;
  line_total: number;
}

interface Quote {
  id: string;
  quote_reference: string;
  participant_id: string;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Declined' | 'Expired' | 'Converted';
  valid_until: string;
  notes?: string;
  subtotal: number;
  total: number;
  created_at: string;
  participant?: { id: string; full_name: string; reference_number?: string; email?: string };
  items?: QuoteLineItem[];
}

interface QuotesTabProps {
  participants: ParticipantOption[];
}

export default function QuotesTab({ participants }: QuotesTabProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [supportItems, setSupportItems] = useState<NdisItem[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Quote Builder State
  const [selectedParticipantId, setSelectedParticipantId] = useState('');
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [quoteNotes, setQuoteNotes] = useState('');
  const [builderItems, setBuilderItems] = useState<QuoteLineItem[]>([
    {
      description: 'Assistance With Self-Care Activities - Standard Weekday',
      unit: 'Hour',
      quantity: 10,
      frequency: 'Weekly',
      unit_rate: 73.58,
      estimated_weeks: 52,
      line_total: 38261.60,
    },
  ]);

  const loadQuotes = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await fetch('/api/billing/quotes');
      if (!res.ok) throw new Error('Unable to load records');
      if (res.ok) {
        const data = await res.json();
        setQuotes(data.quotes || []);
      }
    } catch (err) {
      setLoadError(true);
      console.error('Failed to load quotes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSupportItems = useCallback(async () => {
    try {
      const res = await fetch('/api/billing/support-items');
      if (res.ok) {
        const data = await res.json();
        setSupportItems(data.items || []);
      }
    } catch (err) {
      console.error('Failed to load support items:', err);
    }
  }, []);

  useEffect(() => {
    loadQuotes();
    loadSupportItems();
  }, [loadQuotes, loadSupportItems]);

  function handleAddItem() {
    const defaultItem = supportItems[0];
    setBuilderItems([
      ...builderItems,
      {
        support_item_id: defaultItem?.id,
        description: defaultItem?.support_item_name || 'Community & Social Participation',
        unit: 'Hour',
        quantity: 5,
        frequency: 'Weekly',
        unit_rate: defaultItem ? Number(defaultItem.reference_rate) : 73.58,
        estimated_weeks: 52,
        line_total: Number((5 * (defaultItem ? Number(defaultItem.reference_rate) : 73.58) * 52).toFixed(2)),
      },
    ]);
  }

  function handleItemChange(idx: number, field: keyof QuoteLineItem, val: any) {
    const updated = [...builderItems];
    const current = { ...updated[idx], [field]: val };

    if (field === 'support_item_id') {
      const found = supportItems.find((s) => s.id === val);
      if (found) {
        current.description = found.support_item_name;
        current.unit_rate = Number(found.reference_rate);
      }
    }

    const qty = Number(current.quantity) || 0;
    const rate = Number(current.unit_rate) || 0;
    const wks = Number(current.estimated_weeks) || 52;
    current.line_total = Number((qty * rate * wks).toFixed(2));
    updated[idx] = current;
    setBuilderItems(updated);
  }

  function handleRemoveItem(idx: number) {
    if (builderItems.length <= 1) return;
    setBuilderItems(builderItems.filter((_, i) => i !== idx));
  }

  const builderTotal = builderItems.reduce((acc, it) => acc + (it.line_total || 0), 0);
  const weeklyEstimate = builderTotal / 52;
  const monthlyEstimate = weeklyEstimate * 4.33;

  async function handleSaveQuote(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedParticipantId) {
      notify('Please select a participant.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/billing/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: selectedParticipantId,
          valid_until: validUntil,
          notes: quoteNotes,
          items: builderItems,
        }),
      });

      if (res.ok) {
        setNotice('Quote created successfully.');
        setShowBuilder(false);
        loadQuotes();
      } else {
        const d = await res.json();
        notify('Error: ' + (d.error || 'Failed to create quote'));
      }
    } catch {
      notify('Network error while saving quote.');
    } finally {
      setSaving(false);
    }
  }

  async function handleConvert(quoteId: string, action: 'convert_to_schedule' | 'convert_to_agreement') {
    if (!confirm(`Are you sure you want to ${action === 'convert_to_schedule' ? 'convert this quote into an Active Schedule of Supports' : 'generate a Service Agreement contract from this quote'}?`)) {
      return;
    }

    try {
      const res = await fetch('/api/billing/quotes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: quoteId, action }),
      });

      const data = await res.json();
      if (res.ok) {
        setNotice(data.message || 'Quote converted successfully.');
        loadQuotes();
      } else {
        notify('Error: ' + (data.error || 'Conversion failed'));
      }
    } catch {
      notify('Network error during quote conversion.');
    }
  }

  async function handleSendQuote(quoteId: string) {
    try {
      const res = await fetch(`/api/billing/quotes/${quoteId}/send`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setNotice('Quote email sent to participant.');
        loadQuotes();
      } else {
        notify('Notice: ' + (data.error || 'Could not send email'));
      }
    } catch {
      notify('Network error sending quote.');
    }
  }

  const statusBadges: Record<string, { bg: string; text: string }> = {
    Draft: { bg: 'var(--oc-subtle)', text: 'var(--oc-secondary)' },
    Sent: { bg: 'var(--oc-info-soft)', text: 'var(--oc-accent)' },
    Accepted: { bg: '#ECFDF5', text: '#065F46' },
    Declined: { bg: 'var(--oc-danger-soft)', text: 'var(--oc-danger)' },
    Expired: { bg: 'var(--oc-warning-soft)', text: '#B45309' },
    Converted: { bg: '#FAF5FF', text: '#6B21A8' },
  };

  return (
    <div className="crmTabPanel">
      <div className="crmPanelHeader">
        <div>
          <h2 className="crmPanelTitle">Quotes & budgets</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--oc-muted)' }}>
            Calculate weekly, monthly, and annual support estimates directly linked to NDIS pricing catalog items.
          </p>
        </div>
        <button
          onClick={() => {
            if (participants.length > 0) setSelectedParticipantId(participants[0].id);
            setShowBuilder(true);
          }}
          className="vsBtnBlack"
          style={{ padding: '8px 18px', fontSize: '0.82rem' }}
        >
          <Plus size={15} style={{ marginRight: 6 }} />
          New Service Quote
        </button>
      </div>

      {notice && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '10px 16px', borderRadius: 10, marginBottom: 16, fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>? {notice}</span>
          <button onClick={() => setNotice(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>&times;</button>
        </div>
      )}

      {/* Existing Quotes Table */}
      <div className="crmTableWrapper">
        <table className="crmTable">
          <thead>
            <tr>
              <th>Quote Ref</th>
              <th>Participant</th>
              <th className="ocNumeric">Total Estimate</th>
              <th className="ocNumeric">Weekly estimate</th>
              <th className="ocNumeric">Monthly estimate</th>
              <th>Valid Until</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadError ? (<tr><td colSpan={8}><div className="ocEmpty" role="alert"><strong>Unable to load quotes</strong><p>Check your connection and try again.</p><button type="button" className="ocTextButton" onClick={loadQuotes}>Try again</button></div></td></tr>) : loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: 'var(--oc-muted)' }}><LoadingRows label="Loading quotes" /></td></tr>
            ) : quotes.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--oc-muted)' }}><div className="ocEmpty"><strong>Prepare your first service quote</strong><p>Choose New Service Quote to estimate support hours and costs.</p></div></td></tr>
            ) : (
              quotes.map((q) => {
                const weekly = Number(q.total) / 52;
                const monthly = weekly * 4.33;
                const st = statusBadges[q.status] || { bg: 'var(--oc-subtle)', text: 'var(--oc-secondary)' };

                return (
                  <tr key={q.id}>
                    <td>
                      <strong style={{ fontFamily: 'monospace', color: 'var(--oc-text)', fontSize: '0.85rem' }}>{q.quote_reference}</strong>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)' }}>
                        {new Date(q.created_at).toLocaleDateString('en-AU')}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--oc-text)', fontSize: '0.88rem' }}>
                        {q.participant?.full_name || 'Participant'}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)' }}>
                        {q.participant?.reference_number || ''}
                      </div>
                    </td>
                    <td className="ocNumeric">
                      <strong style={{ fontSize: '0.92rem', color: 'var(--oc-text)' }}>${Number(q.total).toFixed(2)}</strong>
                    </td>
                    <td className="ocNumeric" style={{ fontSize: '0.85rem', color: 'var(--oc-secondary)' }}>${weekly.toFixed(2)} / wk</td>
                    <td className="ocNumeric" style={{ fontSize: '0.85rem', color: 'var(--oc-secondary)' }}>${monthly.toFixed(2)} / mo</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--oc-muted)' }}>
                      {q.valid_until ? new Date(q.valid_until).toLocaleDateString('en-AU') : '-'}
                    </td>
                    <td>
                      <span style={{ background: st.bg, color: st.text, padding: '3px 10px', borderRadius: 12, fontSize: '0.8125rem', fontWeight: 600 }}>
                        {q.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <a
                          href={`/api/billing/quotes/${q.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View / Print PDF"
                          style={{ background: 'var(--oc-subtle)', textDecoration: 'none', borderRadius: 6, padding: '6px 10px', color: 'var(--oc-secondary)', fontSize: '0.8125rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Printer size={13} /> PDF
                        </a>
                        <button
                          onClick={() => handleSendQuote(q.id)}
                          title="Email Quote"
                          style={{ background: 'var(--oc-info-soft)', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: 'var(--oc-accent)', fontSize: '0.8125rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Send size={12} /> Send
                        </button>
                        {q.status !== 'Converted' && (
                          <>
                            <button
                              onClick={() => handleConvert(q.id, 'convert_to_schedule')}
                              title="Convert to Schedule of Supports"
                              style={{ background: '#ECFDF5', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: '#065F46', fontSize: '0.8125rem', fontWeight: 600 }}
                            >
                              ? Schedule
                            </button>
                            <button
                              onClick={() => handleConvert(q.id, 'convert_to_agreement')}
                              title="Convert to Agreement"
                              style={{ background: '#FAF5FF', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: '#6D28D9', fontSize: '0.8125rem', fontWeight: 600 }}
                            >
                              ? Contract
                            </button>
                          </>
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

      {/* Quote Builder Drawer */}
      <FormDrawer
        isOpen={showBuilder}
        onClose={() => setShowBuilder(false)}
        wide={true}
      >
        <DrawerHeader
          title="Create NDIS Service Quote"
          description="Select NDIS support items, weekly hours, and agreement duration to generate an authoritative quote."
          badge={<span className="refIdTag">SERVICE QUOTE</span>}
          onClose={() => setShowBuilder(false)}
        />

        <form onSubmit={handleSaveQuote} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 73px)' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <FormSection title="1. Participant & Validity">
              <FormGrid2>
                <FormField label="Participant" required>
                  <FormSelect
                    value={selectedParticipantId}
                    onChange={(e) => setSelectedParticipantId(e.target.value)}
                    required
                  >
                    <option value="">Select a participant...</option>
                    {participants.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.referenceNumber || 'PAR'}) - {p.fundingType || 'Plan-Managed'}
                      </option>
                    ))}
                  </FormSelect>
                </FormField>

                <FormField label="Valid Until" hint="Defaults to standard 30-day quote window">
                  <FormInput
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                </FormField>
              </FormGrid2>
            </FormSection>

            <FormSection title="2. Support Schedule Line Items">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)' }}>
                  Included Support Items ({builderItems.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="canonical-btn canonical-btn-subtle"
                  style={{ fontSize: '0.75rem', padding: '5px 12px' }}
                >
                  + Add Item
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {builderItems.map((item, idx) => (
                  <div key={idx} style={{ background: 'var(--oc-background)', border: '1px solid var(--oc-border)', borderRadius: 10, padding: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 36px', gap: 10, alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--oc-muted)', display: 'block', marginBottom: 4, fontWeight: 600 }}>NDIS Support Item</span>
                        <FormSelect
                          value={item.support_item_id || ''}
                          onChange={(e) => handleItemChange(idx, 'support_item_id', e.target.value)}
                        >
                          {supportItems.map((si) => (
                            <option key={si.id} value={si.id}>
                              {si.support_item_name} (${si.reference_rate}/hr)
                            </option>
                          ))}
                        </FormSelect>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--oc-muted)', display: 'block', marginBottom: 4, fontWeight: 600 }}>Hours / Wk</span>
                        <FormInput
                          type="number"
                          step="0.5"
                          min="0.5"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                        />
                      </div>

                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--oc-muted)', display: 'block', marginBottom: 4, fontWeight: 600 }}>Agreed Rate ($)</span>
                        <FormInput
                          type="number"
                          step="0.01"
                          value={item.unit_rate}
                          onChange={(e) => handleItemChange(idx, 'unit_rate', Number(e.target.value))}
                        />
                      </div>

                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--oc-muted)', display: 'block', marginBottom: 4, fontWeight: 600 }}>Line Total</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--oc-text)', display: 'block', marginTop: 8 }}>
                          ${item.line_total.toFixed(2)}
                        </span>
                      </div>

                      <div style={{ paddingTop: 20 }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={builderItems.length <= 1}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: builderItems.length <= 1 ? 'not-allowed' : 'pointer',
                            color: builderItems.length <= 1 ? 'var(--oc-border)' : 'var(--oc-danger)',
                            padding: 4
                          }}
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </FormSection>

            {/* Live Estimate Summary */}
            <FormSummaryCard
              title="Quote Pricing Calculation"
              rows={[
                { label: 'Weekly Estimate', value: `$${weeklyEstimate.toFixed(2)}` },
                { label: 'Monthly Estimate (x4.33 weeks)', value: `$${monthlyEstimate.toFixed(2)}` },
                { label: 'Annual Total (52 Weeks)', value: `$${builderTotal.toFixed(2)}`, isBold: true },
              ]}
              totalLabel="Total Quoted Commitment"
              totalValue={`$${builderTotal.toFixed(2)} AUD`}
            />

            <FormSection title="3. Terms & Notes">
              <FormField label="Notes & Assumptions">
                <FormTextarea
                  rows={2}
                  placeholder="e.g. Rate based on weekday non-remote schedule, includes community access"
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                />
              </FormField>
            </FormSection>
          </div>

          <StickyFormFooter
            cancelLabel="Cancel"
            onCancel={() => setShowBuilder(false)}
            primaryLabel={saving ? 'Creating...' : 'Save Draft Quote'}
            loading={saving}
          />
        </form>
      </FormDrawer>
    </div>
  );
}

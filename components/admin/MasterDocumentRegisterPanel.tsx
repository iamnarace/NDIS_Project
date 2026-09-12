'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Shield,
  Clock,
  Layers,
  Download,
  Eye,
  RefreshCw,
} from 'lucide-react';
import type { MasterDocumentItem, DocumentCategory, RegisterStatus } from '@/lib/services/masterDocumentRegister';

const CATEGORIES: DocumentCategory[] = [
  '1. Participant & Client Documents',
  '2. Workforce & Employment Documents',
  '3. Contractor Documents',
  '4. Payroll & Pay Documents',
  '5. Finance & Billing Documents',
  '6. Service Delivery Records',
  '7. Safeguarding & Quality Records',
  '8. WHS & Safety Records',
  '9. Vehicle & Transport Records',
  '10. Governance & Business Operational Documents',
  '11. Regulatory & Unregistered Provider Evidence',
  '12. Continuous Improvement & Audit Evidence',
  '13. Marketing, Public & Information Notices',
  '14. Training & Competency Records',
  '15. Clinical & High-Intensity Transition Documents',
];

const STATUS_CONFIG: Record<RegisterStatus, { label: string; bg: string; text: string; border: string }> = {
  READY: { label: 'READY', bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
  'EXTERNAL-OFFICIAL': { label: 'OFFICIAL EXTERNAL', bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
  PARTIAL: { label: 'PARTIAL / PENDING ACTION', bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' },
  MISSING: { label: 'MISSING', bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' },
  'NOT-APPLICABLE': { label: 'NOT APPLICABLE', bg: '#F3F4F6', text: '#4B5563', border: '#E5E7EB' },
  'FUTURE / CLINICAL-DISABLED': { label: 'FUTURE / CLINICAL-DISABLED', bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' },
};

export default function MasterDocumentRegisterPanel() {
  const [items, setItems] = useState<MasterDocumentItem[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<MasterDocumentItem | null>(null);

  const loadRegister = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedClass !== 'all') params.append('documentClass', selectedClass);
      if (search.trim()) params.append('search', search.trim());

      const res = await fetch(`/api/governance/document-register?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.ok) {
        setItems(data.items || []);
        setSummary(data.summary || null);
      } else {
        setError(data.error || 'Failed to load master document register.');
      }
    } catch {
      setError('Network error loading document register.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedStatus, selectedClass, search]);

  useEffect(() => {
    loadRegister();
  }, [loadRegister]);

  return (
    <div style={{ marginTop: 24, background: '#FFF', borderRadius: 12, border: '1px solid var(--oc-border)', padding: 24 }}>
      {/* Header & Metrics */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--oc-navy)' }}>
              Master Business Document Register
            </h3>
            <span style={{ background: '#ECFDF5', color: '#065F46', padding: '2px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700 }}>
              15 Categories · 85 Business Outputs
            </span>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '0.875rem', color: 'var(--oc-muted)', maxWidth: 720 }}>
            Controlled operational register covering client agreements, Fair Work/ATO official statements, payroll boundary exports, safeguarding records, and fail-closed clinical transition modules.
          </p>
        </div>

        <button
          onClick={loadRegister}
          disabled={loading}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'var(--oc-surface)', border: '1px solid var(--oc-border)',
            borderRadius: 8, padding: '8px 14px', fontSize: '0.82rem', fontWeight: 600,
            cursor: 'pointer', color: 'var(--oc-secondary)',
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Register
        </button>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 14px' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Total Register</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{summary.total}</div>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>15 Categories</span>
          </div>

          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '12px 14px' }}>
            <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600, textTransform: 'uppercase' }}>Ready (Operational)</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#15803D', marginTop: 2 }}>{summary.ready}</div>
            <span style={{ fontSize: '0.75rem', color: '#166534' }}>Generated / Structured / Policy</span>
          </div>

          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '12px 14px' }}>
            <span style={{ fontSize: '0.75rem', color: '#1E40AF', fontWeight: 600, textTransform: 'uppercase' }}>Official External</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1D4ED8', marginTop: 2 }}>{summary.externalOfficial}</div>
            <span style={{ fontSize: '0.75rem', color: '#1E40AF' }}>Fair Work · ATO · ABR · NWSD</span>
          </div>

          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '12px 14px' }}>
            <span style={{ fontSize: '0.75rem', color: '#92400E', fontWeight: 600, textTransform: 'uppercase' }}>Pending Real-World</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#B45309', marginTop: 2 }}>{summary.partial}</div>
            <span style={{ fontSize: '0.75rem', color: '#92400E' }}>Insurance Policy Purchase</span>
          </div>

          <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 8, padding: '12px 14px' }}>
            <span style={{ fontSize: '0.75rem', color: '#6D28D9', fontWeight: 600, textTransform: 'uppercase' }}>Clinical Disabled</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#7C3AED', marginTop: 2 }}>{summary.clinicalDisabled}</div>
            <span style={{ fontSize: '0.75rem', color: '#6D28D9' }}>Fail-Closed Gated</span>
          </div>

          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, padding: '12px 14px' }}>
            <span style={{ fontSize: '0.75rem', color: '#065F46', fontWeight: 600, textTransform: 'uppercase' }}>Completeness</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#047857', marginTop: 2 }}>
              {summary.operationalCompletenessPct}%
            </div>
            <span style={{ fontSize: '0.75rem', color: '#065F46' }}>Ready + Official</span>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18, background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 280 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search code, name, trigger..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', height: 34, paddingLeft: 30, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ height: 34, borderRadius: 6, border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '0.82rem', background: '#FFF' }}
        >
          <option value="all">All 15 Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          style={{ height: 34, borderRadius: 6, border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '0.82rem', background: '#FFF' }}
        >
          <option value="all">All Statuses</option>
          <option value="READY">READY</option>
          <option value="EXTERNAL-OFFICIAL">EXTERNAL-OFFICIAL</option>
          <option value="PARTIAL">PARTIAL</option>
          <option value="FUTURE / CLINICAL-DISABLED">FUTURE / CLINICAL-DISABLED</option>
        </select>

        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          style={{ height: 34, borderRadius: 6, border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '0.82rem', background: '#FFF' }}
        >
          <option value="all">All Document Classes</option>
          <option value="A. GENERATED DOCUMENT">A. GENERATED DOCUMENT</option>
          <option value="B. CRM STRUCTURED RECORD / FORM">B. CRM STRUCTURED RECORD / FORM</option>
          <option value="C. CONTROLLED POLICY">C. CONTROLLED POLICY</option>
          <option value="D. OFFICIAL EXTERNAL / GOVERNMENT DOCUMENT">D. OFFICIAL EXTERNAL / GOV</option>
          <option value="E. EVIDENCE / UPLOADED DOCUMENT">E. EVIDENCE / UPLOADED</option>
        </select>

        {(selectedCategory !== 'all' || selectedStatus !== 'all' || selectedClass !== 'all' || search) && (
          <button
            onClick={() => { setSelectedCategory('all'); setSelectedStatus('all'); setSelectedClass('all'); setSearch(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--oc-accent)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Error Notice */}
      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: 10, borderRadius: 8, marginBottom: 16, fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #CBD5E1', color: '#334155' }}>
              <th style={{ padding: '10px 12px', fontWeight: 600 }}>Code</th>
              <th style={{ padding: '10px 12px', fontWeight: 600 }}>Document Title & Category</th>
              <th style={{ padding: '10px 12px', fontWeight: 600 }}>Class</th>
              <th style={{ padding: '10px 12px', fontWeight: 600 }}>Audience</th>
              <th style={{ padding: '10px 12px', fontWeight: 600 }}>System Location / Access</th>
              <th style={{ padding: '10px 12px', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '10px 12px', fontWeight: 600 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#64748B' }}>Loading register items…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#64748B' }}>No documents matched your query.</td></tr>
            ) : (
              items.map((item) => {
                const badge = STATUS_CONFIG[item.status] || STATUS_CONFIG.READY;
                return (
                  <tr key={item.code} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--oc-navy)', whiteSpace: 'nowrap' }}>
                      {item.code}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--oc-text)' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>{item.category}</div>
                    </td>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '0.75rem', background: '#F1F5F9', padding: '2px 8px', borderRadius: 6, color: '#334155', fontWeight: 600 }}>
                        {item.documentClass.split(' ')[0]} {item.documentClass.split(' ')[1]}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#475569', whiteSpace: 'nowrap' }}>
                      {item.audience}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#334155', maxWidth: 220 }}>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#475569' }}>
                        {item.systemLocation}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: 12,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: badge.bg,
                        color: badge.text,
                        border: `1px solid ${badge.border}`,
                      }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {item.officialUrl && (
                          <a
                            href={item.officialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '4px 8px', borderRadius: 6, fontSize: '0.75rem',
                              background: '#EFF6FF', color: '#1D4ED8', textDecoration: 'none', fontWeight: 600,
                            }}
                            title="Open official government/regulatory link"
                          >
                            <ExternalLink size={12} /> Official
                          </a>
                        )}
                        <button
                          onClick={() => setSelectedItem(item)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '4px 8px', borderRadius: 6, fontSize: '0.75rem',
                            background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#334155',
                            cursor: 'pointer', fontWeight: 600,
                          }}
                        >
                          <Eye size={12} /> Details
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

      {/* Details Modal */}
      {selectedItem && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{ background: '#FFF', borderRadius: 12, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--oc-accent)' }}>{selectedItem.code}</span>
                <h3 style={{ margin: '4px 0 0', fontSize: '1.15rem', color: 'var(--oc-navy)' }}>{selectedItem.name}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--oc-muted)' }}>{selectedItem.category}</span>
              </div>
              <button onClick={() => setSelectedItem(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748B' }}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, fontSize: '0.82rem', marginBottom: 16 }}>
              <div><strong>Document Class:</strong> {selectedItem.documentClass}</div>
              <div><strong>Audience:</strong> {selectedItem.audience}</div>
              <div><strong>Mandatory Status:</strong> {selectedItem.mandatoryStatus}</div>
              <div><strong>Owner / Approver:</strong> {selectedItem.owner}</div>
              <div><strong>Version:</strong> {selectedItem.version}</div>
              <div><strong>Effective Date:</strong> {selectedItem.effectiveDate}</div>
              <div><strong>Review Date:</strong> {selectedItem.reviewDate}</div>
              <div><strong>Signature Required:</strong> {selectedItem.signatureRequired ? 'Yes' : 'No'}</div>
              <div><strong>Acknowledgement Required:</strong> {selectedItem.acknowledgementRequired ? 'Yes' : 'No'}</div>
              <div><strong>Status:</strong> {selectedItem.status}</div>
            </div>

            <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', fontSize: '0.82rem', marginBottom: 12 }}>
              <strong style={{ display: 'block', marginBottom: 4, color: 'var(--oc-navy)' }}>Trigger & Operational Purpose:</strong>
              <p style={{ margin: 0, color: '#334155' }}>{selectedItem.trigger}</p>
            </div>

            <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', fontSize: '0.82rem', marginBottom: 12 }}>
              <strong style={{ display: 'block', marginBottom: 4, color: 'var(--oc-navy)' }}>Retention & Archival Requirement:</strong>
              <p style={{ margin: 0, color: '#334155' }}>{selectedItem.retentionRecordStatus}</p>
            </div>

            <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', fontSize: '0.82rem', marginBottom: 16 }}>
              <strong style={{ display: 'block', marginBottom: 4, color: 'var(--oc-navy)' }}>System Location & Access Path:</strong>
              <p style={{ margin: 0, color: '#334155', fontFamily: 'monospace' }}>{selectedItem.systemLocation}</p>
            </div>

            {selectedItem.notes && (
              <div style={{ background: '#FFFBEB', padding: 12, borderRadius: 8, border: '1px solid #FDE68A', fontSize: '0.82rem', marginBottom: 16, color: '#92400E' }}>
                <strong>Operational Note:</strong> {selectedItem.notes}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              {selectedItem.officialUrl && (
                <a
                  href={selectedItem.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: '#1E40AF', color: '#FFF', borderRadius: 6,
                    padding: '8px 14px', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={14} /> Official Government Form
                </a>
              )}
              <button
                onClick={() => setSelectedItem(null)}
                style={{
                  background: 'var(--oc-surface)', border: '1px solid var(--oc-border)',
                  borderRadius: 6, padding: '8px 14px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

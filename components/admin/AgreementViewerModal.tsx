'use client';

import React, { useRef } from 'react';
import {
  X,
  Printer,
  Shield,
  CheckCircle2,
  FileText,
  Clock,
  GitBranch,
  PenTool,
} from 'lucide-react';
import { FormDrawer, DrawerHeader } from '@/components/admin/forms';

interface AgreementViewerModalProps {
  agreement: any;
  onClose: () => void;
  onCreateVariation?: (agreement: any) => void;
  onResumeDraft?: (agreement: any) => void;
}

export default function AgreementViewerModal({
  agreement,
  onClose,
  onCreateVariation,
  onResumeDraft,
}: AgreementViewerModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const isExecuted = agreement.status === 'active' || agreement.status === 'fully_signed';
  const qData = agreement.questionnaire_data || {};
  const clauses = agreement.compiled_clauses || {};

  return (
    <FormDrawer isOpen onClose={onClose} wide>
      {/* Header Bar */}
      <div className="drawer-header">
        <div className="header-title-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'monospace',
                fontWeight: 700,
                background: 'var(--brand-subtle)',
                color: 'var(--brand-primary)',
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
              }}
            >
              {agreement.agreement_reference}
            </span>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{agreement.title}</h2>
            <span
              className={`pill-semantic ${isExecuted ? 'pill-mint' : 'pill-amber'}`}
            >
              v{agreement.version_number} • {agreement.status.toUpperCase()}
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
            Commenced: {agreement.commencement_date || 'Not set'} • Review: {agreement.review_date || '12 Months'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onResumeDraft && agreement.status === 'draft' && (
            <button
              type="button"
              onClick={() => onResumeDraft(agreement)}
              className="btn btn-primary"
              style={{ padding: '6px 12px', fontSize: 12 }}
            >
              <PenTool size={14} />
              <span>Continue &amp; Sign</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-surface"
            style={{ padding: '6px 12px', fontSize: 12 }}
            title="Print Document"
          >
            <Printer size={14} />
            <span>Print / PDF</span>
          </button>

          {onCreateVariation && isExecuted && (
            <button
              type="button"
              onClick={() => onCreateVariation(agreement)}
              className="btn btn-surface"
              style={{ padding: '6px 12px', fontSize: 12 }}
              title="Create a variation that supersedes this agreement"
            >
              <GitBranch size={14} />
              <span>Variation (v{agreement.version_number + 1})</span>
            </button>
          )}

          <button
            type="button"
            className="btn-close-icon"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="drawer-body" ref={printRef}>
        {/* Recipient & Financial Summary Card */}
        <div
          style={{
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
          }}
        >
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Recipient / Target
            </span>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)', marginTop: 2 }}>
              {qData.participant_name || qData.worker_name || 'Recipient Name'}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
              {agreement.owner_type === 'participant'
                ? `NDIS #: ${qData.ndis_number || 'N/A'} • ${qData.funding_type || 'Funding not recorded'}`
                : `${qData.worker_classification || 'Support Worker'} • ${qData.worker_basis || 'Employment terms'}`}
            </div>
          </div>

          <div>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Estimated Financial Value
            </span>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--status-mint)', marginTop: 2 }}>
              {agreement.owner_type === 'participant'
                ? `$${Number(agreement.estimated_budget || 0).toLocaleString('en-AU', { minimumFractionDigits: 2 })} AUD`
                : `$${Number(qData.hourly_rate || 0).toFixed(2)} AUD / hr`}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Commencement: {agreement.commencement_date || 'Immediate'}
            </div>
          </div>
        </div>

        {/* Schedule of Supports (For Participants) */}
        {clauses.service_schedule && Array.isArray(clauses.service_schedule) && (
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 10 }}>
              Schedule of Supports &amp; Pricing Limits
            </h3>
            <div className="crmTableWrapper">
              <table className="crmTable">
                <thead>
                  <tr>
                    <th>Item Code</th>
                    <th>Support Description</th>
                    <th>Hours / Wk</th>
                    <th>Agreed Rate</th>
                    <th>Weekly Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {clauses.service_schedule.map((row: any, idx: number) => {
                    const hrs = Number(row.hours_pw || 0);
                    const rate = Number(row.agreed_rate || 0);
                    const subtotal = hrs * rate;
                    return (
                      <tr key={idx}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--brand-primary)' }}>
                          {row.item_code}
                        </td>
                        <td>{row.description}</td>
                        <td>{hrs.toFixed(1)} hrs</td>
                        <td>${rate.toFixed(2)} / hr</td>
                        <td style={{ fontWeight: 700, color: 'var(--text-heading)' }}>
                          ${subtotal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Signatures & Execution Record */}
        <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Shield size={16} color="var(--brand-primary)" />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>
              Execution &amp; Audit Trail
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              background: '#F8FAFC',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '14px 16px',
            }}
          >
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Recipient Execution
              </span>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', marginTop: 2 }}>
                {isExecuted ? qData.participant_name || qData.worker_name || 'Signed' : 'Pending Signature'}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                {isExecuted ? 'Digital Canvas Signature Recorded' : 'Awaiting digital signing'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Provider Representative
              </span>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', marginTop: 2 }}>
                {isExecuted ? 'Opus Care Support Services' : 'Pending Verification'}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                Managing Director, Opus Care
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="drawer-footer">
        <button type="button" className="btn-link" onClick={onClose}>
          Close Viewer
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handlePrint}
        >
          <Printer size={15} />
          <span>Print / Export PDF</span>
        </button>
      </div>
    </FormDrawer>
  );
}

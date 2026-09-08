'use client';

import React from 'react';
import { ShieldCheck, Calendar, UploadCloud, CheckCircle2 } from 'lucide-react';

export interface CredentialUploadProps {
  title: string;
  subtitle?: string;
  referenceNumber?: string;
  onReferenceChange?: (val: string) => void;
  referencePlaceholder?: string;
  expiryDate?: string;
  onExpiryChange?: (val: string) => void;
  statusText?: string;
  required?: boolean;
}

export function CredentialUpload({
  title,
  subtitle,
  referenceNumber = '',
  onReferenceChange,
  referencePlaceholder = 'Reference / Registration Number',
  expiryDate = '',
  onExpiryChange,
  statusText = 'Verified',
  required = false,
}: CredentialUploadProps) {
  return (
    <div
      style={{
        background: 'var(--oc-surface)',
        border: '1.5px solid var(--oc-border)',
        borderRadius: 10,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#E0F2FE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--oc-info)',
            }}
          >
            <ShieldCheck size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--oc-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{title}</span>
              {required && <span style={{ color: '#E11D48', fontWeight: 600 }}>*</span>}
            </div>
            {subtitle && <div style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)' }}>{subtitle}</div>}
          </div>
        </div>
        {expiryDate && (
          <span
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 6,
              background: '#ECFDF5',
              color: '#059669',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <CheckCircle2 size={13} />
            <span>Active</span>
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: onReferenceChange ? '1.2fr 1fr' : '1fr', gap: 10 }}>
        {onReferenceChange && (
          <div>
            <label className="crmFormLabel" style={{ fontSize: '0.8125rem' }}>Number / Ref</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => onReferenceChange(e.target.value)}
              placeholder={referencePlaceholder}
              className="crmFormInput"
              style={{ minHeight: 40, padding: '6px 10px', fontSize: '0.85rem' }}
            />
          </div>
        )}
        {onExpiryChange && (
          <div>
            <label className="crmFormLabel" style={{ fontSize: '0.8125rem' }}>Expiry Date</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => onExpiryChange(e.target.value)}
              className="crmFormInput"
              style={{ minHeight: 40, padding: '6px 10px', fontSize: '0.85rem' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default CredentialUpload;

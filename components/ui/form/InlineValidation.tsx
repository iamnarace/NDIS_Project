'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export interface InlineValidationProps {
  type?: 'error' | 'warning' | 'success' | 'info';
  message: string;
  description?: string;
}

export function InlineValidation({ type = 'error', message, description }: InlineValidationProps) {
  const styles = {
    error: { bg: 'var(--oc-danger-soft)', border: '#FCA5A5', color: '#991B1B', icon: <AlertCircle size={16} /> },
    warning: { bg: 'var(--oc-warning-soft)', border: '#FDE68A', color: '#92400E', icon: <AlertTriangle size={16} /> },
    success: { bg: '#ECFDF5', border: '#A7F3D0', color: '#065F46', icon: <CheckCircle2 size={16} /> },
    info: { bg: '#F0F9FF', border: '#BAE6FD', color: '#0369A1', icon: <Info size={16} /> },
  }[type];

  return (
    <div
      style={{
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        borderRadius: 8,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
      }}
    >
      <div style={{ color: styles.color, flexShrink: 0, marginTop: 2 }}>{styles.icon}</div>
      <div>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: styles.color }}>{message}</div>
        {description && (
          <div style={{ fontSize: '0.8125rem', color: styles.color, opacity: 0.9, marginTop: 2 }}>
            {description}
          </div>
        )}
      </div>
    </div>
  );
}

export default InlineValidation;

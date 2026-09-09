import React from 'react';
import { AlertCircle } from 'lucide-react';

export interface FormErrorProps {
  message?: string | null;
  onDismiss?: () => void;
}

export default function FormError({ message, onDismiss }: FormErrorProps) {
  if (!message) return null;

  return (
    <div
      style={{
        background: 'var(--status-rose-bg)',
        border: '1px solid #FECDD3',
        color: '#9F1239',
        padding: '10px 14px',
        borderRadius: 'var(--radius-sm)',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
      role="alert"
    >
      <AlertCircle size={16} style={{ flexShrink: 0, color: 'var(--status-rose)' }} />
      <span style={{ flex: 1 }}>{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: '#9F1239',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          Dismiss
        </button>
      )}
    </div>
  );
}

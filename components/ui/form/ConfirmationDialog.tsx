'use client';

import React from 'react';
import DialogPanel from '@/components/ui/DialogPanel';
import { AlertTriangle, X } from 'lucide-react';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="crmModalOverlay" onClick={onClose}>
      <DialogPanel onClose={onClose} label={title} className="crmModalBox" style={{ maxWidth: 440, padding: 24 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: danger ? '#FEE2E2' : '#E0F2FE',
              color: danger ? 'var(--oc-danger)' : 'var(--oc-info)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 600, color: 'var(--oc-text)' }}>
              {title}
            </h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--oc-muted)', lineHeight: 1.5 }}>
              {message}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button type="button" onClick={onClose} className="crmSecondaryBtn" style={{ minHeight: 40 }}>
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="crmActionBtnPrimary"
            style={{
              minHeight: 40,
              background: danger ? 'var(--oc-danger)' : 'var(--oc-info)',
            }}
          >
            {confirmText}
          </button>
        </div>
      </DialogPanel>
    </div>
  );
}

export default ConfirmationDialog;

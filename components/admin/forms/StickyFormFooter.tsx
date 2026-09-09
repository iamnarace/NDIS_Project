import React from 'react';
import { Loader2, ArrowRight } from 'lucide-react';

export interface StickyFormFooterProps {
  onCancel: () => void;
  cancelLabel?: string;
  onSecondary?: () => void;
  secondaryLabel?: string;
  secondaryDisabled?: boolean;
  onPrimary?: () => void;
  primaryLabel: string;
  primaryDisabled?: boolean;
  loading?: boolean;
  primaryIcon?: React.ReactNode;
  showArrow?: boolean;
}

export default function StickyFormFooter({
  onCancel,
  cancelLabel = 'Cancel',
  onSecondary,
  secondaryLabel,
  secondaryDisabled = false,
  onPrimary,
  primaryLabel,
  primaryDisabled = false,
  loading = false,
  primaryIcon,
  showArrow = false,
}: StickyFormFooterProps) {
  return (
    <div className="drawer-footer">
      <button
        type="button"
        className="btn-link"
        onClick={onCancel}
        disabled={loading}
      >
        {cancelLabel}
      </button>

      <div className="footer-action-cluster">
        {onSecondary && secondaryLabel && (
          <button
            type="button"
            className="btn-secondary"
            onClick={onSecondary}
            disabled={secondaryDisabled || loading}
          >
            {secondaryLabel}
          </button>
        )}

        <button
          type={onPrimary ? 'button' : 'submit'}
          className="btn-primary-action"
          onClick={onPrimary}
          disabled={primaryDisabled || loading}
        >
          {loading ? (
            <>
              <Loader2 size={14} className="spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              {primaryIcon}
              <span>{primaryLabel}</span>
              {showArrow && <ArrowRight size={14} />}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

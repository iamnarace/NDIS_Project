'use client';

import React from 'react';
import { Check } from 'lucide-react';

export interface RadioCardProps {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description?: string;
  badge?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export function RadioCard({
  selected,
  onSelect,
  title,
  description,
  badge,
  icon,
  disabled,
}: RadioCardProps) {
  return (
    <div
      role="radio" aria-checked={selected} aria-label={title} aria-disabled={disabled} tabIndex={disabled ? -1 : 0}
      onKeyDown={event => { if (!disabled && (event.key === ' ' || event.key === 'Enter')) { event.preventDefault(); onSelect(); } }}
      onClick={() => !disabled && onSelect()}
      style={{
        border: selected ? '2px solid var(--oc-info)' : '1.5px solid var(--oc-border)',
        background: selected ? '#F0F9FF' : 'var(--oc-surface)',
        borderRadius: 10,
        padding: '14px 16px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: selected ? '0 2px 8px rgba(2, 132, 199, 0.08)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon && <div style={{ color: selected ? 'var(--oc-info)' : 'var(--oc-muted)' }}>{icon}</div>}
          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--oc-text)' }}>{title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {badge && (
            <span
              style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                padding: '2px 7px',
                borderRadius: 4,
                background: selected ? '#E0F2FE' : 'var(--oc-subtle)',
                color: selected ? 'var(--oc-info)' : 'var(--oc-secondary)',
              }}
            >
              {badge}
            </span>
          )}
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              border: selected ? '2px solid var(--oc-info)' : '2px solid var(--oc-border)',
              background: selected ? 'var(--oc-info)' : 'var(--oc-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {selected && <Check size={12} color="var(--oc-surface)" strokeWidth={3} />}
          </div>
        </div>
      </div>
      {description && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)', margin: 0, lineHeight: 1.45 }}>
          {description}
        </p>
      )}
    </div>
  );
}

export default RadioCard;

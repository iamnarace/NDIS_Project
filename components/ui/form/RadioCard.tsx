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
      onClick={() => !disabled && onSelect()}
      style={{
        border: selected ? '2px solid #0284C7' : '1.5px solid #E2E8F0',
        background: selected ? '#F0F9FF' : '#FFFFFF',
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
          {icon && <div style={{ color: selected ? '#0284C7' : '#64748B' }}>{icon}</div>}
          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#0F172A' }}>{title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {badge && (
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '2px 7px',
                borderRadius: 4,
                background: selected ? '#E0F2FE' : '#F1F5F9',
                color: selected ? '#0284C7' : '#475569',
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
              border: selected ? '2px solid #0284C7' : '2px solid #CBD5E1',
              background: selected ? '#0284C7' : '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {selected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
          </div>
        </div>
      </div>
      {description && (
        <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: 0, lineHeight: 1.45 }}>
          {description}
        </p>
      )}
    </div>
  );
}

export default RadioCard;

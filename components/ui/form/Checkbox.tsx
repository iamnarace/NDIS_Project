'use client';

import React from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
}

export function Checkbox({ id, checked, onChange, label, description, disabled }: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <div
        onClick={(e) => {
          if (!disabled) {
            e.preventDefault();
            onChange(!checked);
          }
        }}
        style={{
          width: 20,
          height: 20,
          borderRadius: 5,
          border: checked ? '2px solid #0284C7' : '2px solid #CBD5E1',
          background: checked ? '#0284C7' : '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 2,
          transition: 'all 0.15s ease',
        }}
      >
        {checked && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
      </div>
      <div>
        <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#0F172A', lineHeight: 1.35 }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 2, lineHeight: 1.4 }}>
            {description}
          </div>
        )}
      </div>
    </label>
  );
}

export default Checkbox;

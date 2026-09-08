'use client';

import React from 'react';

export interface SegmentedChoiceOption<T extends string = string> {
  value: T;
  label: string;
  badge?: string;
  icon?: React.ReactNode;
}

export interface SegmentedChoiceProps<T extends string = string> {
  options: SegmentedChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
  fullWidth?: boolean;
}

export function SegmentedChoice<T extends string = string>({
  options,
  value,
  onChange,
  fullWidth = true,
}: SegmentedChoiceProps<T>) {
  return (
    <div
      style={{
        display: 'inline-flex',
        width: fullWidth ? '100%' : 'auto',
        background: '#F1F5F9',
        borderRadius: 8,
        padding: 3,
        border: '1px solid #E2E8F0',
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              flex: fullWidth ? 1 : 'none',
              padding: '8px 14px',
              minHeight: 38,
              borderRadius: 6,
              border: 'none',
              background: active ? '#FFFFFF' : 'transparent',
              color: active ? '#0F172A' : '#64748B',
              fontWeight: active ? 600 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: active ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
            }}
          >
            {opt.icon}
            <span>{opt.label}</span>
            {opt.badge && (
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '1px 5px',
                  borderRadius: 4,
                  background: active ? '#E0F2FE' : '#E2E8F0',
                  color: active ? '#0284C7' : '#475569',
                }}
              >
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedChoice;

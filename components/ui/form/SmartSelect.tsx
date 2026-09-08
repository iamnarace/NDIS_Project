'use client';

import { useFieldControl } from './FieldContext';

import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SmartSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  disabled?: boolean;
}

export interface SmartSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SmartSelectOption[];
  error?: boolean;
  placeholder?: string;
}

export const SmartSelect = forwardRef<HTMLSelectElement, SmartSelectProps>(function SmartSelect(
  { options, error, placeholder, className = '', ...props },
  ref
) {
  const field = useFieldControl();
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <select
        {...field}
        ref={ref}
        className={`crmFormSelect ${error ? 'hasError' : ''} ${className}`}
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          paddingRight: 38,
          cursor: 'pointer',
        }}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}{opt.sublabel ? ` — ${opt.sublabel}` : ''}
          </option>
        ))}
      </select>
      <ChevronDown
        size={18}
        style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--oc-muted)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
});

export default SmartSelect;

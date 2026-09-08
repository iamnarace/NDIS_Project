'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  error?: string;
  id?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  required,
  optional,
  hint,
  error,
  id,
  children,
  className = '',
}: FormFieldProps) {
  return (
    <div className={`formFieldGroup ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label
            htmlFor={id}
            className="crmFormLabel"
            style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <span>{label}</span>
            {required && <span style={{ color: '#E11D48', fontWeight: 600 }}>*</span>}
          </label>
          {optional && (
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 400 }}>Optional</span>
          )}
        </div>
      )}

      {children}

      {hint && !error && (
        <p className="crmFormHelper" style={{ margin: 0 }}>
          {hint}
        </p>
      )}

      {error && (
        <p className="crmFormError" style={{ margin: 0 }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export default FormField;

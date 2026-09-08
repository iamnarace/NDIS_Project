'use client';

import React, { useId } from 'react';
import { FieldContext } from './FieldContext';
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
  const generatedId = useId();
  const fieldId = id || generatedId;
  const descriptionId = hint || error ? `${fieldId}-description` : undefined;
  return (
    <div className={`formFieldGroup ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label
            htmlFor={fieldId}
            className="crmFormLabel"
            style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <span>{label}</span>
            {required && <span style={{ color: '#E11D48', fontWeight: 600 }}>*</span>}
          </label>
          {optional && (
            <span style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)', fontWeight: 400 }}>Optional</span>
          )}
        </div>
      )}

      <FieldContext.Provider value={{ id: fieldId, 'aria-describedby': descriptionId, 'aria-invalid': !!error }}>{children}</FieldContext.Provider>

      {hint && !error && (
        <p id={descriptionId} className="crmFormHelper" style={{ margin: 0 }}>
          {hint}
        </p>
      )}

      {error && (
        <p id={descriptionId} role="alert" className="crmFormError" style={{ margin: 0 }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export default FormField;

import React from 'react';

export interface FormFieldProps {
  label: string;
  required?: boolean;
  htmlFor?: string;
  id?: string;
  helperText?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export default function FormField({
  label,
  required,
  htmlFor,
  id,
  helperText,
  hint,
  error,
  children,
  style,
  className = '',
}: FormFieldProps) {
  const targetId = htmlFor || id;
  const note = helperText || hint;

  return (
    <div className={`form-group ${className}`} style={style}>
      <label htmlFor={targetId} className="form-label">
        {label} {required && <span className="req">*</span>}
      </label>
      {children}
      {error ? (
        <span className="form-error-text" role="alert">{error}</span>
      ) : note ? (
        <span className="helper-text">{note}</span>
      ) : null}
    </div>
  );
}

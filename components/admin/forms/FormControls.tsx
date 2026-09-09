import React from 'react';

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export function FormInput({ hasError, className = '', ...props }: FormInputProps) {
  return (
    <input
      className={`form-input ${hasError ? 'hasError' : ''} ${className}`}
      {...props}
    />
  );
}

export interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export function FormSelect({ hasError, className = '', children, ...props }: FormSelectProps) {
  return (
    <select
      className={`form-select ${hasError ? 'hasError' : ''} ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export function FormTextarea({ hasError, className = '', ...props }: FormTextareaProps) {
  return (
    <textarea
      className={`form-textarea ${hasError ? 'hasError' : ''} ${className}`}
      {...props}
    />
  );
}

export function FormGrid2({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div className="form-grid-2" style={style}>{children}</div>;
}

export function FormGrid3({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div className="form-grid-3" style={style}>{children}</div>;
}

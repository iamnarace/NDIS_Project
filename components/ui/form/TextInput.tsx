'use client';

import { useFieldControl } from './FieldContext';

import React, { forwardRef } from 'react';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { className = '', error, leftIcon, rightIcon, ...props },
  ref
) {
  const field = useFieldControl();
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
      {leftIcon && (
        <span
          style={{
            position: 'absolute',
            left: 14,
            display: 'flex',
            alignItems: 'center',
            color: 'var(--oc-muted)',
            pointerEvents: 'none',
          }}
        >
          {leftIcon}
        </span>
      )}
      <input
        {...field}
        ref={ref}
        className={`crmFormInput ${error ? 'hasError' : ''} ${className}`}
        style={{
          paddingLeft: leftIcon ? 40 : 14,
          paddingRight: rightIcon ? 40 : 14,
        }}
        {...props}
      />
      {rightIcon && (
        <span
          style={{
            position: 'absolute',
            right: 14,
            display: 'flex',
            alignItems: 'center',
            color: 'var(--oc-muted)',
          }}
        >
          {rightIcon}
        </span>
      )}
    </div>
  );
});

export default TextInput;

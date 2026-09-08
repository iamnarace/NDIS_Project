'use client';

import { useFieldControl } from './FieldContext';

import React, { forwardRef } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  maxLength?: number;
  showCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className = '', error, maxLength, showCount, value, ...props },
  ref
) {
  const currentLength = typeof value === 'string' ? value.length : 0;

  const field = useFieldControl();
  return (
    <div style={{ width: '100%' }}>
      <textarea
        {...field}
        ref={ref}
        value={value}
        maxLength={maxLength}
        className={`crmFormTextarea ${error ? 'hasError' : ''} ${className}`}
        style={{ minHeight: 88, resize: 'vertical' }}
        {...props}
      />
      {showCount && maxLength && (
        <div style={{ textAlign: 'right', fontSize: '0.8125rem', color: 'var(--oc-muted)', marginTop: 4 }}>
          {currentLength} / {maxLength}
        </div>
      )}
    </div>
  );
});

export default Textarea;

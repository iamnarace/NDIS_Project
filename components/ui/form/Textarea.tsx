'use client';

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

  return (
    <div style={{ width: '100%' }}>
      <textarea
        ref={ref}
        value={value}
        maxLength={maxLength}
        className={`crmFormTextarea ${error ? 'hasError' : ''} ${className}`}
        style={{ minHeight: 88, resize: 'vertical' }}
        {...props}
      />
      {showCount && maxLength && (
        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#94A3B8', marginTop: 4 }}>
          {currentLength} / {maxLength}
        </div>
      )}
    </div>
  );
});

export default Textarea;

'use client';

import { useFieldControl } from './FieldContext';

import React, { forwardRef } from 'react';
import { Calendar } from 'lucide-react';

export interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(
  { className = '', error, ...props },
  ref
) {
  const field = useFieldControl();
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        {...field}
        ref={ref}
        type="date"
        className={`crmFormInput ${error ? 'hasError' : ''} ${className}`}
        style={{ paddingRight: 38 }}
        {...props}
      />
      <Calendar
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

export default DatePicker;

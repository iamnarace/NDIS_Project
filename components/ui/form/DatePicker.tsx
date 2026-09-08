'use client';

import React, { forwardRef } from 'react';
import { Calendar } from 'lucide-react';

export interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(
  { className = '', error, ...props },
  ref
) {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
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
          color: '#64748B',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
});

export default DatePicker;

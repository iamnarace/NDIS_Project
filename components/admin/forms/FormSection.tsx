import React from 'react';

export interface FormSectionProps {
  title: string;
  pill?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export default function FormSection({
  title,
  pill,
  children,
  style,
}: FormSectionProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', ...style }}>
      <div className="form-section-title">
        <span>{title}</span>
        {pill && (
          typeof pill === 'string' ? (
            <span className="compliance-pill">{pill}</span>
          ) : (
            pill
          )
        )}
      </div>
      {children}
    </div>
  );
}

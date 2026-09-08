import React from 'react';

export interface CrmBentoPaneProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  tintHeader?: 'lavender' | 'teal' | 'sky' | 'amber' | 'coral' | 'slate' | 'none';
  noPadding?: boolean;
  className?: string;
}

export default function CrmBentoPane({
  title,
  subtitle,
  action,
  children,
  tintHeader = 'none',
  noPadding = false,
  className = '',
}: CrmBentoPaneProps) {
  const tintBg = {
    none: '#FFFFFF',
    lavender: '#EEF2FF',
    teal: '#E6F7F5',
    sky: '#E0F2FE',
    amber: '#FEF3C7',
    coral: '#FFF1EC',
    slate: '#F8FAFC',
  }[tintHeader];

  return (
    <div className={`vsCard ${className}`} style={{ padding: 0, overflow: 'hidden' }}>
      {(title || subtitle || action) && (
        <div
          style={{
            padding: '16px 20px',
            background: tintBg,
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div>
            {title && (
              <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748B' }}>
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div style={{ padding: noPadding ? 0 : '20px' }}>
        {children}
      </div>
    </div>
  );
}

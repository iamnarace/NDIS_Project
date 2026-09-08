import React from 'react';

export type SquircleTint = 'teal' | 'indigo' | 'sky' | 'amber' | 'emerald' | 'rose' | 'slate';

export interface CrmSquircleCardProps {
  title: string;
  subtitle?: string;
  value?: string | number;
  meta?: string;
  icon: React.ReactNode;
  tint?: SquircleTint;
  badge?: string;
  actionLabel?: string;
  onAction?: () => void;
  onClick?: () => void;
  footer?: React.ReactNode;
  className?: string;
}

export default function CrmSquircleCard({
  title,
  subtitle,
  value,
  meta,
  icon,
  tint = 'teal',
  badge,
  actionLabel,
  onAction,
  onClick,
  footer,
  className = '',
}: CrmSquircleCardProps) {
  return (
    <div
      onClick={onClick}
      className={`vsCard ${className}`}
      style={{ cursor: onClick ? 'pointer' : 'default', justifyContent: 'space-between' }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
          <div className={`vsSquircle ${tint}`}>
            {icon}
          </div>
          {badge && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 9px',
              borderRadius: 9999,
              fontSize: '0.72rem',
              fontWeight: 800,
              background: '#F1F5F9',
              color: '#475569'
            }}>
              {badge}
            </span>
          )}
        </div>

        {value !== undefined && (
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 4 }}>
            {value}
          </div>
        )}

        <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>
          {title}
        </h3>

        {subtitle && (
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748B', lineHeight: 1.45 }}>
            {subtitle}
          </p>
        )}

        {meta && (
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8', marginTop: 6 }}>
            {meta}
          </div>
        )}
      </div>

      {(actionLabel || footer) && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div>{footer}</div>
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAction();
              }}
              className="vsBtnBlack"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

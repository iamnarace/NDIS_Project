import React from 'react';
import { SquircleTint } from './CrmSquircleCard';

export interface CrmNotificationItemProps {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  icon: React.ReactNode;
  tint?: SquircleTint;
  unread?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function CrmNotificationItem({
  title,
  description,
  timestamp,
  icon,
  tint = 'teal',
  unread = false,
  actionLabel,
  onAction,
  className = '',
}: CrmNotificationItemProps) {
  return (
    <div
      className={className}
      style={{
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div
          className={`vsSquircle ${tint}`}
          style={{ width: 40, height: 40, borderRadius: 13, position: 'relative' }}
        >
          {icon}
          {unread && (
            <span
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: '#0D9488',
                border: '2px solid #FFFFFF',
              }}
            />
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h4 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {title}
            </h4>
            <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600 }}>
              {timestamp}
            </span>
          </div>
          <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {description}
          </p>
        </div>
      </div>

      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="vsBtnOutline"
          style={{ padding: '4px 12px', fontSize: '0.72rem' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

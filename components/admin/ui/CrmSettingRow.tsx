import React from 'react';
import { ChevronRight } from 'lucide-react';
import { SquircleTint } from './CrmSquircleCard';

export interface CrmSettingRowProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  tint?: SquircleTint;
  badge?: string;
  isDestructive?: boolean;
  toggle?: {
    checked: boolean;
    onChange: (checked: boolean) => void;
  };
  action?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function CrmSettingRow({
  title,
  description,
  icon,
  tint = 'slate',
  badge,
  isDestructive = false,
  toggle,
  action,
  onClick,
  className = '',
}: CrmSettingRowProps) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        borderRadius: 14,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (onClick) e.currentTarget.style.background = isDestructive ? '#FEF2F2' : '#F8FAFC';
      }}
      onMouseLeave={(e) => {
        if (onClick) e.currentTarget.style.background = 'transparent';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div
          className={`vsSquircle ${tint}`}
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: isDestructive ? '#EF4444' : undefined,
            color: isDestructive ? '#FFFFFF' : undefined,
            borderColor: isDestructive ? '#DC2626' : undefined,
          }}
        >
          {icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <h4
            style={{
              margin: 0,
              fontSize: '0.85rem',
              fontWeight: 700,
              color: isDestructive ? '#DC2626' : '#0F172A',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </h4>
          {description && (
            <p
              style={{
                margin: '1px 0 0',
                fontSize: '0.72rem',
                color: '#64748B',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {description}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {badge && (
          <span style={{ padding: '2px 8px', borderRadius: 9999, fontSize: '0.7rem', fontWeight: 800, background: '#F1F5F9', color: '#475569' }}>
            {badge}
          </span>
        )}

        {toggle && (
          <button
            type="button"
            role="switch"
            aria-checked={toggle.checked}
            onClick={(e) => {
              e.stopPropagation();
              toggle.onChange(!toggle.checked);
            }}
            style={{
              position: 'relative',
              width: 38,
              height: 22,
              borderRadius: 9999,
              background: toggle.checked ? '#0F172A' : '#CBD5E1',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.2s',
              padding: 2,
            }}
          >
            <span
              style={{
                display: 'block',
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#FFFFFF',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                transform: toggle.checked ? 'translateX(16px)' : 'translateX(0)',
                transition: 'transform 0.2s',
              }}
            />
          </button>
        )}

        {action}

        {onClick && !toggle && !action && (
          <ChevronRight size={16} color="#94A3B8" />
        )}
      </div>
    </div>
  );
}

import React from 'react';

export interface SummaryRow {
  label: string;
  value: React.ReactNode;
  isBold?: boolean;
}

export interface FormSummaryCardProps {
  title: string;
  badge?: React.ReactNode;
  rows: SummaryRow[];
  totalLabel?: string;
  totalValue?: React.ReactNode;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export default function FormSummaryCard({
  title,
  badge,
  rows,
  totalLabel,
  totalValue,
  children,
  style,
}: FormSummaryCardProps) {
  return (
    <div className="summary-calc-card" style={style}>
      <div className="calc-header">
        <span>{title}</span>
        {badge && (
          typeof badge === 'string' ? (
            <span style={{ fontSize: 11, color: 'var(--brand-primary)', fontWeight: 700 }}>
              {badge}
            </span>
          ) : (
            badge
          )
        )}
      </div>

      {rows.map((row, idx) => (
        <div key={idx} className="calc-row-item">
          <span style={row.isBold ? { fontWeight: 600 } : undefined}>{row.label}</span>
          <span style={{ fontWeight: row.isBold ? 700 : 600, color: 'var(--text-heading)' }}>
            {row.value}
          </span>
        </div>
      ))}

      {children}

      {totalLabel && totalValue !== undefined && (
        <div className="calc-total">
          <span>{totalLabel}</span>
          <span style={{ color: 'var(--brand-primary)', fontSize: 16 }}>
            {totalValue}
          </span>
        </div>
      )}
    </div>
  );
}

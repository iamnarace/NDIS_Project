'use client';

import React from 'react';

export interface SummaryField {
  label: string;
  value: React.ReactNode;
  badge?: string;
}

export interface SummarySection {
  title: string;
  fields: SummaryField[];
}

export interface ReviewSummaryProps {
  sections: SummarySection[];
}

export function ReviewSummary({ sections }: ReviewSummaryProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {sections.map((sec, idx) => (
        <div
          key={idx}
          style={{
            background: 'var(--oc-background)',
            border: '1px solid var(--oc-border)',
            borderRadius: 10,
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--oc-text)',
              marginBottom: 12,
              paddingBottom: 8,
              borderBottom: '1px solid #EEF2F6',
            }}
          >
            {sec.title}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {sec.fields.map((f, fIdx) => (
              <div key={fIdx}>
                <div style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)', fontWeight: 500, marginBottom: 2 }}>
                  {f.label}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--oc-text)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{f.value || '—'}</span>
                  {f.badge && (
                    <span
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        padding: '1px 5px',
                        borderRadius: 4,
                        background: '#E0F2FE',
                        color: 'var(--oc-info)',
                      }}
                    >
                      {f.badge}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ReviewSummary;

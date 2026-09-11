'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Info, ArrowRight, ShieldAlert } from 'lucide-react';

export interface ContextualGuidanceProps {
  title?: string;
  defaultExpanded?: boolean;
  beforeStart?: string[];
  dataSource?: string;
  whatHappensNext?: string;
  calculationNote?: string;
  complianceNote?: string;
  className?: string;
}

export default function ContextualGuidance({
  title = 'Workflow Guidance & Requirements',
  defaultExpanded = false,
  beforeStart,
  dataSource,
  whatHappensNext,
  calculationNote,
  complianceNote,
  className = '',
}: ContextualGuidanceProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div
      className={`oc-contextual-guidance ${className}`}
      style={{
        background: '#F0FDFA',
        border: '1px solid #99F6E4',
        borderRadius: 8,
        padding: '10px 14px',
        margin: '12px 0 16px',
        fontSize: '12.5px',
        color: '#134E4A',
        transition: 'all 0.2s ease',
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: '#0F766E',
          fontWeight: 700,
          fontSize: '12.5px',
          textAlign: 'left',
        }}
        aria-expanded={expanded}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <HelpCircle size={15} />
          <span>{title}</span>
        </span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expanded && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #CCFBF1', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {beforeStart && beforeStart.length > 0 && (
            <div>
              <strong style={{ display: 'block', color: '#0F766E', marginBottom: 2 }}>What do I need before doing this?</strong>
              <ul style={{ margin: 0, paddingLeft: 18, color: '#334155' }}>
                {beforeStart.map((item, idx) => (
                  <li key={idx} style={{ margin: '2px 0' }}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {dataSource && (
            <div>
              <strong style={{ display: 'block', color: '#0F766E', marginBottom: 2 }}>Where does this information come from?</strong>
              <span style={{ color: '#334155' }}>{dataSource}</span>
            </div>
          )}

          {calculationNote && (
            <div>
              <strong style={{ display: 'block', color: '#0F766E', marginBottom: 2 }}>How is this calculated?</strong>
              <span style={{ color: '#334155' }}>{calculationNote}</span>
            </div>
          )}

          {whatHappensNext && (
            <div>
              <strong style={{ display: 'block', color: '#0F766E', marginBottom: 2 }}>What happens next?</strong>
              <span style={{ color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}>
                <ArrowRight size={13} style={{ color: '#0F766E', flexShrink: 0 }} />
                <span>{whatHappensNext}</span>
              </span>
            </div>
          )}

          {complianceNote && (
            <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: '6px 10px', borderRadius: 6, color: '#92400E', fontSize: '12px', marginTop: 4 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldAlert size={14} style={{ flexShrink: 0 }} />
                <span><strong>Compliance Notice:</strong> {complianceNote}</span>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

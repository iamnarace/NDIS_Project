'use client';

import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  FileText,
  Users,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { OPERATIONS_GUIDE_WORKFLOWS, GuideWorkflowItem } from '@/lib/services/operationsGuide';

export default function HelpCentrePanel() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>('referral_onboarding');

  const categories = useMemo(() => {
    const set = new Set<string>();
    OPERATIONS_GUIDE_WORKFLOWS.forEach((w) => set.add(w.category));
    return Array.from(set);
  }, []);

  const filteredWorkflows = useMemo(() => {
    return OPERATIONS_GUIDE_WORKFLOWS.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.commonBlockers.some((b) => b.toLowerCase().includes(q)) ||
        item.recordLocation.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [search, selectedCategory]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          borderRadius: 16,
          padding: '24px 28px',
          color: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BookOpen size={20} color="#38BDF8" />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
              Opus Care Help Centre &amp; Operations Guide
            </h2>
            <span style={{ fontSize: 13, color: '#94A3B8' }}>
              Authoritative end-to-end workflows, governance prerequisites, records &amp; blocker resolutions
            </span>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
          <div
            style={{
              position: 'relative',
              flex: 1,
              minWidth: 260,
            }}
          >
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94A3B8',
              }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search workflows, prerequisites, blockers, or record locations..."
              style={{
                width: '100%',
                padding: '10px 14px 10px 36px',
                borderRadius: 8,
                border: '1px solid #334155',
                background: '#0F172A',
                color: '#F8FAFC',
                fontSize: 13.5,
              }}
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #334155',
              background: '#0F172A',
              color: '#F8FAFC',
              fontSize: 13,
            }}
          >
            <option value="all">All Categories ({OPERATIONS_GUIDE_WORKFLOWS.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Workflows List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filteredWorkflows.map((item, idx) => {
          const isExpanded = expandedId === item.id;
          return (
            <div
              key={item.id}
              style={{
                background: '#FFFFFF',
                borderRadius: 12,
                border: '1px solid #E2E8F0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Summary Header (Clickable) */}
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '18px 22px',
                  background: isExpanded ? '#F8FAFC' : '#FFFFFF',
                  border: 'none',
                  borderBottom: isExpanded ? '1px solid #E2E8F0' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: '#E0F2FE',
                        color: '#0369A1',
                      }}
                    >
                      {item.category}
                    </span>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                      {idx + 1}. {item.title}
                    </h3>
                  </div>
                  <p style={{ fontSize: 13, color: '#64748B', margin: 0, marginTop: 4 }}>
                    {item.summary}
                  </p>
                </div>
                <div>
                  {isExpanded ? (
                    <ChevronUp size={20} color="#64748B" />
                  ) : (
                    <ChevronDown size={20} color="#64748B" />
                  )}
                </div>
              </button>

              {/* Expanded Detail Body */}
              {isExpanded && (
                <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    {/* Prerequisites */}
                    <div
                      style={{
                        background: '#F8FAFC',
                        borderRadius: 10,
                        padding: '16px 18px',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      <h4
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#0F172A',
                          margin: '0 0 10px 0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <ShieldCheck size={16} color="#059669" />
                        Prerequisites &amp; Governance Gates
                      </h4>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: '#334155', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {item.prerequisites.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Required Data */}
                    <div
                      style={{
                        background: '#F8FAFC',
                        borderRadius: 10,
                        padding: '16px 18px',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      <h4
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#0F172A',
                          margin: '0 0 10px 0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <FileText size={16} color="#0284C7" />
                        Required Operational Data
                      </h4>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: '#334155', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {item.requiredData.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Downstream Effect & Record Location */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.2fr 0.8fr',
                      gap: 20,
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', margin: '0 0 8px 0' }}>
                        Downstream System Effects:
                      </h4>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: '#475569', display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {item.downstreamEffect.map((eff, i) => (
                          <li key={i}>{eff}</li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div
                        style={{
                          background: '#F1F5F9',
                          borderRadius: 8,
                          padding: '10px 14px',
                          fontSize: 12,
                        }}
                      >
                        <strong style={{ color: '#0F172A' }}>Record Location in CRM:</strong>
                        <div style={{ color: '#334155', marginTop: 2 }}>{item.recordLocation}</div>
                      </div>
                      <div
                        style={{
                          background: '#FEF3C7',
                          borderRadius: 8,
                          padding: '10px 14px',
                          fontSize: 12,
                        }}
                      >
                        <strong style={{ color: '#92400E' }}>Escalation Path:</strong>
                        <div style={{ color: '#78350F', marginTop: 2 }}>{item.escalationPath}</div>
                      </div>
                    </div>
                  </div>

                  {/* Common Blockers & Resolutions */}
                  <div
                    style={{
                      background: '#FFF1F2',
                      borderRadius: 10,
                      padding: '14px 18px',
                      border: '1px solid #FFE4E6',
                    }}
                  >
                    <h4
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#9F1239',
                        margin: '0 0 8px 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <AlertTriangle size={15} color="#E11D48" />
                      Common Blockers &amp; Fail-Closed Rules
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#881337', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {item.commonBlockers.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

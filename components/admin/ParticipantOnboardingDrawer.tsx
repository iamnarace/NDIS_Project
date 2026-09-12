'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FormDrawer,
  DrawerHeader,
  FormSection,
  FormError,
  StickyFormFooter,
} from '@/components/admin/forms';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  FileCheck,
  UserCheck,
  Ban,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

interface ParticipantOnboardingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  participant: any;
  onUpdated?: () => void;
}

export default function ParticipantOnboardingDrawer({
  isOpen,
  onClose,
  participant,
  onUpdated,
}: ParticipantOnboardingDrawerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checklist, setChecklist] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [percentage, setPercentage] = useState(0);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [requirements, setRequirements] = useState<Record<string, any>>({});
  const [signingOff, setSigningOff] = useState(false);

  // Waiver modal / inline input state
  const [waivingCode, setWaivingCode] = useState<string | null>(null);
  const [waiverReason, setWaiverReason] = useState('');

  const loadChecklist = useCallback(async () => {
    if (!participant?.id) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/crm/onboarding?participant_id=${participant.id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to load onboarding checklist.');
        return;
      }

      setIsReady(data.isReady);
      setPercentage(data.percentage);
      setBlockers(data.blockers || []);
      setRequirements(data.requirements || {});
    } catch (err: any) {
      setError(err.message || 'Error connecting to onboarding service.');
    } finally {
      setLoading(false);
    }
  }, [participant?.id]);

  useEffect(() => {
    if (isOpen && participant?.id) {
      loadChecklist();
    }
  }, [isOpen, participant?.id, loadChecklist]);

  const handleUpdateItem = async (code: string, newStatus: 'completed' | 'pending' | 'waived', reason?: string) => {
    setError('');
    try {
      const res = await fetch('/api/crm/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: participant.id,
          code,
          status: newStatus,
          waiverReason: reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update requirement.');
        return;
      }

      setWaivingCode(null);
      setWaiverReason('');
      await loadChecklist();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setError(err.message || 'Network error updating requirement.');
    }
  };

  const handleSignoff = async () => {
    setSigningOff(true);
    setError('');

    try {
      const res = await fetch('/api/crm/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: participant.id,
          action: 'signoff',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Readiness sign-off failed.');
        return;
      }

      await loadChecklist();
      if (onUpdated) onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Network error during sign-off.');
    } finally {
      setSigningOff(false);
    }
  };

  if (!isOpen) return null;

  // Group requirements by category
  const categories: Record<string, any[]> = {
    'Administrative & Identity': [],
    'Legal & Consent': [],
    'Care & Risk Governance': [],
    'Operational Readiness': [],
  };

  for (const [code, item] of Object.entries(requirements)) {
    const cat = item.category || 'Administrative & Identity';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push({ code, ...item });
  }

  return (
    <FormDrawer isOpen={isOpen} onClose={onClose} wide>
      <DrawerHeader
        title={`Onboarding Governance: ${participant?.name || participant?.full_name}`}
        description="Dynamic readiness gate tracking mandatory legal, consent, and safety requirements before roster scheduling."
        onClose={onClose}
        badge={
          <span
            className="compliance-pill"
            style={{
              background: isReady ? '#DCFCE7' : '#FEF3C7',
              color: isReady ? '#166534' : '#92400E',
            }}
          >
            {isReady ? 'Roster Ready' : `${percentage}% Onboarded`}
          </span>
        }
      />

      <div className="drawer-body">
        {error && <FormError message={error} onDismiss={() => setError('')} />}

        {/* PROGRESS BANNER */}
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 8,
            background: 'var(--oc-surface, #FFFFFF)',
            border: '1px solid var(--oc-border, #E2E8F0)',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Readiness Completion</span>
            <span style={{ fontWeight: 700, fontSize: 14, color: isReady ? '#16A34A' : 'var(--oc-primary)' }}>
              {percentage}%
            </span>
          </div>

          <div style={{ width: '100%', height: 8, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
            <div
              style={{
                width: `${percentage}%`,
                height: '100%',
                background: isReady ? '#16A34A' : 'var(--brand-primary, #2563EB)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          {isReady ? (
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, color: '#166534', fontSize: 13 }}>
              <ShieldCheck size={18} />
              <span>All mandatory governance items satisfied. Participant is certified ready for active rostering.</span>
            </div>
          ) : (
            <div style={{ marginTop: 12, fontSize: 12.5, color: '#B45309' }}>
              <AlertTriangle size={15} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />
              <strong>{blockers.length} Remaining Item(s) Required Before Rostering:</strong>
              <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                {blockers.slice(0, 4).map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
                {blockers.length > 4 && <li>...and {blockers.length - 4} more requirements.</li>}
              </ul>
            </div>
          )}
        </div>

        {/* CHECKLIST BY CATEGORY */}
        {Object.entries(categories).map(([catTitle, items]) => {
          if (items.length === 0) return null;
          return (
            <FormSection key={catTitle} title={catTitle}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map((item) => {
                  const isCompleted = item.status === 'completed';
                  const isWaived = item.status === 'waived';
                  const isNotApplicable = item.status === 'not_applicable';

                  return (
                    <div
                      key={item.code}
                      data-testid={`checklist-item-${item.code}`}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 6,
                        border: '1px solid var(--oc-border, #E2E8F0)',
                        background: isCompleted ? '#F0FDF4' : isWaived ? '#EFF6FF' : 'var(--oc-surface)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 14,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 600, fontSize: 13.5 }}>{item.title}</span>
                          {!item.waivable && (
                            <span style={{ fontSize: 10.5, padding: '2px 6px', borderRadius: 4, background: '#FEE2E2', color: '#991B1B', fontWeight: 600 }}>
                              Non-Waivable
                            </span>
                          )}
                          {isNotApplicable && (
                            <span style={{ fontSize: 10.5, padding: '2px 6px', borderRadius: 4, background: '#F1F5F9', color: '#64748B' }}>
                              Not Applicable
                            </span>
                          )}
                        </div>
                        {item.notes && (
                          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--oc-muted)' }}>{item.notes}</p>
                        )}
                        {isWaived && item.waiverReason && (
                          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#1D4ED8' }}>
                            <strong>Waiver Reason:</strong> {item.waiverReason}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {isCompleted ? (
                          <button
                            onClick={() => handleUpdateItem(item.code, 'pending')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '5px 10px',
                              borderRadius: 4,
                              background: '#DCFCE7',
                              border: '1px solid #86EFAC',
                              color: '#166534',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            <Check size={13} /> Completed
                          </button>
                        ) : isWaived ? (
                          <button
                            onClick={() => handleUpdateItem(item.code, 'pending')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '5px 10px',
                              borderRadius: 4,
                              background: '#DBEAFE',
                              border: '1px solid #93C5FD',
                              color: '#1E40AF',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Waived
                          </button>
                        ) : isNotApplicable ? (
                          <span style={{ fontSize: 12, color: '#94A3B8' }}>N/A</span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleUpdateItem(item.code, 'completed')}
                              style={{
                                padding: '5px 12px',
                                borderRadius: 4,
                                background: 'var(--brand-primary, #2563EB)',
                                color: '#FFFFFF',
                                border: 'none',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Verify
                            </button>

                            {item.waivable && (
                              <button
                                onClick={() => setWaivingCode(item.code)}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: 4,
                                  background: 'transparent',
                                  border: '1px solid #CBD5E1',
                                  color: '#64748B',
                                  fontSize: 12,
                                  cursor: 'pointer',
                                }}
                              >
                                Waive
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </FormSection>
          );
        })}

        {/* Inline waiver input dialog */}
        {waivingCode && (
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#FFFFFF',
              padding: 24,
              borderRadius: 8,
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
              zIndex: 1000,
              width: 420,
              maxWidth: '90vw',
              border: '1px solid #CBD5E1',
            }}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>Waive Onboarding Requirement</h3>
            <p style={{ margin: '0 0 12px', fontSize: 12.5, color: '#64748B' }}>
              State the mandatory governance rationale for waiving this requirement:
            </p>
            <textarea
              aria-label="Waiver rationale"
              rows={3}
              value={waiverReason}
              onChange={(e) => setWaiverReason(e.target.value)}
              placeholder="e.g. Participant is privately self-funding services pending NDIS plan approval..."
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #CBD5E1', fontSize: 13, marginBottom: 14 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setWaivingCode(null)}
                style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #CBD5E1', background: '#F8FAFC', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateItem(waivingCode, 'waived', waiverReason)}
                disabled={!waiverReason.trim()}
                style={{
                  padding: '6px 14px',
                  borderRadius: 4,
                  background: waiverReason.trim() ? '#2563EB' : '#94A3B8',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 600,
                  cursor: waiverReason.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Confirm Waiver
              </button>
            </div>
          </div>
        )}
      </div>

      <StickyFormFooter
        onCancel={onClose}
        onPrimary={isReady ? handleSignoff : undefined}
        primaryLabel={isReady ? 'Approve for Active Rostering' : 'Readiness Review Incomplete'}
        primaryIcon={isReady ? <ShieldCheck size={16} /> : undefined}
        primaryDisabled={!isReady || signingOff}
        loading={signingOff}
      />
    </FormDrawer>
  );
}

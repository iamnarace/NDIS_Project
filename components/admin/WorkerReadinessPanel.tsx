'use client';

import { useCallback, useEffect, useState } from 'react';

type Evidence = {
  worker: { lifecycle_stage: string; is_rosterable: boolean; readiness_notes?: string };
  credentials: Array<{ id: string; requirement_code: string; verification_status: string; screening_status?: string; expiry_date?: string }>;
  competencies: Array<{ id: string; competency_code: string; status: string; participant_id?: string; review_date?: string }>;
  futureShifts: Array<{ id: string; shift?: { shift_reference: string; start_time: string; status: string } }>;
};

const BASE_REQUIREMENTS = [
  'identity_verified', 'right_to_work', 'ndis_worker_screening', 'first_aid', 'cpr',
  'code_of_conduct', 'privacy_confidentiality', 'whs_induction', 'safeguarding',
  'valid_driver_licence', 'vehicle_registration', 'vehicle_insurance_comprehensive',
  'vehicle_roadworthiness', 'business_use_insurance', 'ahpra_nursing', 'clinical_indemnity',
];

export default function WorkerReadinessPanel({ staffId }: { staffId: string }) {
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [requirementCode, setRequirementCode] = useState('ndis_worker_screening');
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [screeningStatus, setScreeningStatus] = useState('Unknown / Needs Verification');
  const [reference, setReference] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const load = useCallback(async () => {
    const response = await fetch(`/api/workforce/readiness?staff_id=${encodeURIComponent(staffId)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not load worker readiness.');
    setEvidence(data);
  }, [staffId]);

  useEffect(() => { load().catch((cause) => setError(cause.message)); }, [load]);

  const saveCredential = async () => {
    setSaving(true); setError('');
    try {
      const response = await fetch('/api/workforce/readiness', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'credential', staffId, requirementCode,
          requirementType: requirementCode === 'ndis_worker_screening' ? 'screening' : 'credential',
          verificationStatus,
          screeningStatus: requirementCode === 'ndis_worker_screening' ? screeningStatus : null,
          credentialNumber: reference || null, expiryDate: expiryDate || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Credential update failed.');
      setReference(''); setExpiryDate(''); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Credential update failed.'); }
    finally { setSaving(false); }
  };

  if (!evidence) return <div style={{ marginTop: 20 }}>{error || 'Loading governed readiness…'}</div>;
  return (
    <section style={{ gridColumn: '1 / -1', marginTop: 16, borderTop: '1px solid #E5E7EB', paddingTop: 16 }} data-testid="worker-readiness-panel">
      <h4 style={{ margin: '0 0 8px' }}>Governed worker readiness</h4>
      <p style={{ margin: '0 0 12px', color: evidence.worker.is_rosterable ? '#166534' : '#92400E' }}>
        <strong>{evidence.worker.is_rosterable ? 'Roster ready' : 'Rostering blocked'}</strong> · {evidence.worker.lifecycle_stage}
      </p>
      <p style={{ fontSize: 13, color: '#64748B' }}>{evidence.worker.readiness_notes}</p>
      {error && <p role="alert" style={{ color: '#B91C1C' }}>{error}</p>}
      <div style={{ overflowX: 'auto' }}>
        <table className="crmTable"><thead><tr><th>Requirement</th><th>Status</th><th>Screening</th><th>Expiry</th></tr></thead>
          <tbody>{evidence.credentials.map((item) => <tr key={item.id}><td>{item.requirement_code}</td><td>{item.verification_status}</td><td>{item.screening_status || '—'}</td><td>{item.expiry_date || 'No expiry recorded'}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="ocFormGrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 8, marginTop: 12 }}>
        <select aria-label="Worker requirement" value={requirementCode} onChange={(e) => setRequirementCode(e.target.value)}>{BASE_REQUIREMENTS.map((code) => <option key={code}>{code}</option>)}</select>
        <select aria-label="Verification status" value={verificationStatus} onChange={(e) => setVerificationStatus(e.target.value)}>{['pending','verified','expired','revoked','rejected'].map((status) => <option key={status}>{status}</option>)}</select>
        {requirementCode === 'ndis_worker_screening' && <select aria-label="Screening status" value={screeningStatus} onChange={(e) => setScreeningStatus(e.target.value)}>{['Clearance','Pending','Interim Bar','Exclusion','Suspension','No Valid Clearance','Unknown / Needs Verification'].map((status) => <option key={status}>{status}</option>)}</select>}
        <input aria-label="Credential or evidence reference" placeholder="Credential/evidence reference" value={reference} onChange={(e) => setReference(e.target.value)} />
        <input aria-label="Credential expiry" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
        <button type="button" className="crmViewBtn" disabled={saving} onClick={saveCredential}>{saving ? 'Saving…' : 'Record controlled evidence'}</button>
      </div>
      <p style={{ fontSize: 12, color: '#64748B' }}>Competencies recorded: {evidence.competencies.length}. Future shifts requiring review: {evidence.futureShifts.length}.</p>
    </section>
  );
}

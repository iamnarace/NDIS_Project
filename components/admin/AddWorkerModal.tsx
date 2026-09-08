'use client';

import React, { useState } from 'react';
import { X, UserCheck, AlertCircle } from 'lucide-react';

interface AddWorkerModalProps {
  onClose: () => void;
  onCreated: (newStaff: any) => void;
}

const REGIONAL_SUBURBS = [
  'Yamba', 'Maclean', 'Grafton', 'Iluka', 'Ulmarra', 'Townsend', 'Wooli'
];

export default function AddWorkerModal({ onClose, onCreated }: AddWorkerModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Disability Support Worker');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [hourlyRate, setHourlyRate] = useState('38.50');
  const [selectedSuburbs, setSelectedSuburbs] = useState<string[]>(['Yamba', 'Maclean']);
  
  // Credentials
  const [ndisScreening, setNdisScreening] = useState('Verified');
  const [ndisScreeningExpiry, setNdisScreeningExpiry] = useState('');
  const [wwcc, setWwcc] = useState('');
  const [wwccExpiry, setWwccExpiry] = useState('');
  const [firstAidExpiry, setFirstAidExpiry] = useState('');
  const [cprExpiry, setCprExpiry] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggleSuburb = (sub: string) => {
    if (selectedSuburbs.includes(sub)) {
      setSelectedSuburbs(selectedSuburbs.filter(s => s !== sub));
    } else {
      setSelectedSuburbs([...selectedSuburbs, sub]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (!name.trim() || !phone.trim() || !email.trim()) {
      setError('Full Name, Phone, and Email are required.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/crm/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          role: role.trim(),
          phone: phone.trim(),
          email: email.trim(),
          suburbs: selectedSuburbs.length > 0 ? selectedSuburbs : ['Yamba', 'Maclean'],
          hourlyRate: Number(hourlyRate) || 38.50,
          ndisScreening,
          ndisScreeningExpiry: ndisScreeningExpiry || null,
          wwcc: wwcc.trim() || null,
          wwccExpiry: wwccExpiry || null,
          firstAidExpiry: firstAidExpiry || null,
          cprExpiry: cprExpiry || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to register support worker.');
        return;
      }

      onCreated(data.staff);
      onClose();
    } catch (err: unknown) {
      setError('Connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="crmModalOverlay" onClick={onClose}>
      <div className="crmModalBox" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div className="crmModalHeader">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <UserCheck size={18} />
            </div>
            <div>
              <span className="refIdTag">NEW SUPPORT WORKER</span>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>Register Support Worker</h3>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Full Name & Role */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="crmFormLabel">Worker Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="crmFormInput"
                placeholder="e.g. Sarah Jenkins"
                required
              />
            </div>
            <div>
              <label className="crmFormLabel">Position / Title</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="crmFormInput"
              >
                <option value="Disability Support Worker">Disability Support Worker (Level 2)</option>
                <option value="Senior Support Worker">Senior Support Worker (Level 3)</option>
                <option value="Team Leader / Coordinator">Team Leader / Coordinator</option>
                <option value="Allied Health Assistant">Allied Health Assistant</option>
              </select>
            </div>
          </div>

          {/* Phone & Email */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="crmFormLabel">Mobile Phone *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="crmFormInput"
                placeholder="0400 000 000"
                required
              />
            </div>
            <div>
              <label className="crmFormLabel">Email Address *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="crmFormInput"
                placeholder="worker@opuscare.com.au"
                required
              />
            </div>
          </div>

          {/* Base Hourly Rate */}
          <div>
            <label className="crmFormLabel">Base Hourly Rate (AUD)</label>
            <input
              type="number"
              step="0.5"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              className="crmFormInput"
              placeholder="38.50"
            />
          </div>

          {/* Suburbs Covered */}
          <div>
            <label className="crmFormLabel">Covered Suburbs / Service Areas</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {REGIONAL_SUBURBS.map((sub) => {
                const active = selectedSuburbs.includes(sub);
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => toggleSuburb(sub)}
                    style={{
                      border: active ? '1.5px solid #059669' : '1px solid #CBD5E1',
                      background: active ? '#ECFDF5' : '#FFFFFF',
                      color: active ? '#065F46' : '#475569',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      padding: '4px 10px',
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                  >
                    {active ? `✓ ${sub}` : `+ ${sub}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clearances & Expiry Dates */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: 10 }}>
              Mandatory Clearances &amp; Expiry Tracking
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="crmFormLabel">NDIS Screening Expiry</label>
                <input
                  type="date"
                  value={ndisScreeningExpiry}
                  onChange={(e) => setNdisScreeningExpiry(e.target.value)}
                  className="crmFormInput"
                />
              </div>
              <div>
                <label className="crmFormLabel">WWCC Number &amp; Expiry</label>
                <input
                  type="text"
                  value={wwcc}
                  onChange={(e) => setWwcc(e.target.value)}
                  className="crmFormInput"
                  placeholder="e.g. WWC1234567E"
                />
              </div>
              <div>
                <label className="crmFormLabel">First Aid Expiry (HLTAID011)</label>
                <input
                  type="date"
                  value={firstAidExpiry}
                  onChange={(e) => setFirstAidExpiry(e.target.value)}
                  className="crmFormInput"
                />
              </div>
              <div>
                <label className="crmFormLabel">CPR Expiry (HLTAID009)</label>
                <input
                  type="date"
                  value={cprExpiry}
                  onChange={(e) => setCprExpiry(e.target.value)}
                  className="crmFormInput"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8, borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
            <button
              type="button"
              onClick={onClose}
              className="crmSecondaryBtn"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="crmActionBtnPrimary"
            >
              {submitting ? 'Registering...' : 'Save Support Worker'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

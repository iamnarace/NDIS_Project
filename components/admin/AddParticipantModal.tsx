'use client';

import React, { useState } from 'react';
import { X, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AddParticipantModalProps {
  onClose: () => void;
  onCreated: (newParticipant: any) => void;
}

export default function AddParticipantModal({ onClose, onCreated }: AddParticipantModalProps) {
  const [name, setName] = useState('');
  const [ndisNumber, setNdisNumber] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [suburb, setSuburb] = useState('Yamba NSW');
  const [streetAddress, setStreetAddress] = useState('');
  const [fundingType, setFundingType] = useState('Plan-Managed');
  const [planManagerName, setPlanManagerName] = useState('');
  const [planManagerEmail, setPlanManagerEmail] = useState('');
  const [allocatedHours, setAllocatedHours] = useState('8');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (!name.trim()) {
      setError('Participant Full Name is required.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/crm/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          ndisNumber: ndisNumber.trim() || null,
          dateOfBirth: dob || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          suburb: suburb.trim() || 'Yamba NSW',
          streetAddress: streetAddress.trim() || null,
          fundingType,
          planManager: fundingType === 'Plan-Managed' ? planManagerName.trim() : null,
          planManagerEmail: fundingType === 'Plan-Managed' ? planManagerEmail.trim() : null,
          allocatedHours: Number(allocatedHours) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to create participant record.');
        return;
      }

      onCreated(data.participant);
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
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
              <UserPlus size={18} />
            </div>
            <div>
              <span className="refIdTag">NEW NDIS PARTICIPANT</span>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>Add Participant Record</h3>
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

          {/* Full Name & NDIS Number */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="crmFormLabel">Participant Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="crmFormInput"
                placeholder="e.g. Eleanor Vance"
                required
              />
            </div>
            <div>
              <label className="crmFormLabel">NDIS Number</label>
              <input
                type="text"
                value={ndisNumber}
                onChange={(e) => setNdisNumber(e.target.value)}
                className="crmFormInput"
                placeholder="e.g. 430 982 104"
              />
            </div>
          </div>

          {/* Phone & Email */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="crmFormLabel">Primary Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="crmFormInput"
                placeholder="0400 000 000"
              />
            </div>
            <div>
              <label className="crmFormLabel">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="crmFormInput"
                placeholder="participant@example.com"
              />
            </div>
          </div>

          {/* Suburb & Street Address */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 14 }}>
            <div>
              <label className="crmFormLabel">Suburb / Region *</label>
              <input
                type="text"
                value={suburb}
                onChange={(e) => setSuburb(e.target.value)}
                className="crmFormInput"
                placeholder="e.g. Yamba NSW 2464"
                required
              />
            </div>
            <div>
              <label className="crmFormLabel">Street Address</label>
              <input
                type="text"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                className="crmFormInput"
                placeholder="e.g. 24 Ocean Street"
              />
            </div>
          </div>

          {/* Funding Type & Weekly Hours */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="crmFormLabel">NDIS Funding Type *</label>
              <select
                value={fundingType}
                onChange={(e) => setFundingType(e.target.value)}
                className="crmFormInput"
              >
                <option value="Plan-Managed">Plan-Managed</option>
                <option value="Self-Managed">Self-Managed</option>
                <option value="NDIA Managed">NDIA Managed (Agency)</option>
              </select>
            </div>
            <div>
              <label className="crmFormLabel">Allocated Weekly Hours</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={allocatedHours}
                onChange={(e) => setAllocatedHours(e.target.value)}
                className="crmFormInput"
                placeholder="e.g. 8"
              />
            </div>
          </div>

          {/* Plan Manager fields if Plan-Managed */}
          {fundingType === 'Plan-Managed' && (
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0284C7', display: 'block', marginBottom: 10 }}>
                Plan Management Organization
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="crmFormLabel">Plan Manager Name</label>
                  <input
                    type="text"
                    value={planManagerName}
                    onChange={(e) => setPlanManagerName(e.target.value)}
                    className="crmFormInput"
                    placeholder="e.g. My Plan Manager"
                  />
                </div>
                <div>
                  <label className="crmFormLabel">Invoicing Email</label>
                  <input
                    type="email"
                    value={planManagerEmail}
                    onChange={(e) => setPlanManagerEmail(e.target.value)}
                    className="crmFormInput"
                    placeholder="invoices@planmanager.com.au"
                  />
                </div>
              </div>
            </div>
          )}

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
              {submitting ? 'Creating Record...' : 'Save Participant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

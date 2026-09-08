'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, CheckCircle2, AlertTriangle, ChevronDown, X } from 'lucide-react';
import { getAllServiceSuburbs, checkServiceArea, SuburbEntry } from '@/lib/regions';

export interface AddressSuburbPickerProps {
  value: string;
  onChange: (suburb: string, inServiceArea: boolean) => void;
  error?: boolean;
  placeholder?: string;
}

export function AddressSuburbPicker({
  value,
  onChange,
  error,
  placeholder = 'Select or type suburb / town (e.g. Yamba, Grafton, Maclean)...',
}: AddressSuburbPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const containerRef = useRef<HTMLDivElement | null>(null);

  const serviceSuburbs = getAllServiceSuburbs();

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const serviceStatus = checkServiceArea(query);

  const filtered = serviceSuburbs.filter((s) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return s.suburb.toLowerCase().includes(q) || s.regionName.toLowerCase().includes(q);
  });

  const handleSelect = (s: SuburbEntry) => {
    const text = `${s.suburb} NSW`;
    setQuery(text);
    onChange(text, true);
    setIsOpen(false);
  };

  const handleCustomInput = (text: string) => {
    setQuery(text);
    const check = checkServiceArea(text);
    onChange(text, check.inServiceArea);
  };

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      <div style={{ position: 'relative', width: '100%' }}>
        <MapPin
          size={18}
          style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#64748B',
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            handleCustomInput(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`crmFormInput ${error ? 'hasError' : ''}`}
          style={{ paddingLeft: 40, paddingRight: 36 }}
        />
        <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 4 }}>
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                onChange('', false);
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}
            >
              <X size={15} />
            </button>
          )}
          <ChevronDown
            size={16}
            style={{ color: '#64748B', cursor: 'pointer' }}
            onClick={() => setIsOpen(!isOpen)}
          />
        </div>

        {/* Dropdown for Suburb Search */}
        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              zIndex: 1050,
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: 8,
              boxShadow: '0 10px 25px rgba(15, 23, 42, 0.12)',
              maxHeight: 240,
              overflowY: 'auto',
              padding: 4,
            }}
          >
            <div style={{ padding: '6px 10px', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
              Opus Care Primary Service Network
            </div>
            {filtered.slice(0, 30).map((s) => (
              <div
                key={s.suburb}
                onClick={() => handleSelect(s)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#F0F9FF')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div>
                  <span style={{ fontWeight: 600, color: '#0F172A' }}>{s.suburb}</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: 6 }}>({s.regionName})</span>
                </div>
                {s.isMajor && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, background: '#E0F2FE', color: '#0284C7', padding: '1px 5px', borderRadius: 4 }}>
                    Major Hub
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instant Service Area Verification Badge */}
      {query.trim().length > 1 && (
        <div style={{ marginTop: 2 }}>
          {serviceStatus.inServiceArea ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 6,
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                color: '#047857',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={14} />
              <span>✓ Within Opus Care service area ({serviceStatus.regionName})</span>
            </div>
          ) : (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 6,
                background: '#FFFBEB',
                border: '1px solid #FDE68A',
                color: '#B45309',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              <AlertTriangle size={14} />
              <span>⚠ Outside primary service area (travel or remote arrangement required)</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AddressSuburbPicker;

'use client';

import React, { useState, useEffect, useRef, useId } from 'react';
import { useFieldControl } from './FieldContext';
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

  const field = useFieldControl();
  const listId = useId();
  const [active, setActive] = useState(0);
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
    const q = query.toLowerCase().replace(/\s+nsw.*$/, '').trim();
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
            color: 'var(--oc-muted)',
            pointerEvents: 'none',
          }}
        />
        <input
          {...field} role="combobox" aria-expanded={isOpen} aria-autocomplete="list" aria-controls={isOpen ? listId : undefined} aria-activedescendant={isOpen && filtered[active] ? listId+'-'+active : undefined}
          onKeyDown={event => {
            if (event.key === 'Escape' && isOpen) { event.preventDefault(); event.stopPropagation(); setIsOpen(false); }
            else if (event.key === 'ArrowDown') { event.preventDefault(); setIsOpen(true); setActive(index => Math.min(index + 1, Math.min(filtered.length, 30) - 1)); }
            else if (event.key === 'ArrowUp') { event.preventDefault(); setActive(index => Math.max(index - 1, 0)); }
            else if (event.key === 'Enter' && isOpen && filtered[active]) { event.preventDefault(); handleSelect(filtered[active]); }
            else if (event.key === 'Tab') { setIsOpen(false); }
          }}
          type="text"
          value={query}
          onChange={(e) => {
            handleCustomInput(e.target.value);
            setActive(0);
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
              type="button" aria-label="Clear suburb"
              onClick={() => {
                setQuery('');
                onChange('', false);
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--oc-muted)', padding: 0 }}
            >
              <X size={15} />
            </button>
          )}
          <ChevronDown
            size={16}
            style={{ color: 'var(--oc-muted)', cursor: 'pointer' }}
            onClick={() => setIsOpen(!isOpen)}
          />
        </div>

        {/* Dropdown for Suburb Search */}
        {isOpen && (
          <div role="listbox" id={listId} aria-label="Service suburbs"
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              zIndex: 1050,
              background: 'var(--oc-surface)',
              border: '1px solid var(--oc-border)',
              borderRadius: 8,
              boxShadow: '0 10px 25px rgba(15, 23, 42, 0.12)',
              maxHeight: 240,
              overflowY: 'auto',
              padding: 4,
            }}
          >
            <div style={{ padding: '6px 10px', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--oc-muted)', textTransform: 'uppercase' }}>
              Opus Care Primary Service Network
            </div>
            {filtered.slice(0, 30).map((s, index) => (
              <div
                key={s.suburb} role="option" id={listId+'-'+index} aria-selected={index === active} onMouseDown={event => event.preventDefault()}
                onClick={() => handleSelect(s)}
                style={{
                  padding: '10px 12px',
                  background: index === active ? 'var(--oc-accent-soft)' : 'transparent',
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
                  <span style={{ fontWeight: 600, color: 'var(--oc-text)' }}>{s.suburb}</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--oc-muted)', marginLeft: 6 }}>({s.regionName})</span>
                </div>
                {s.isMajor && (
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, background: '#E0F2FE', color: 'var(--oc-info)', padding: '1px 5px', borderRadius: 4 }}>
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
                fontSize: '0.8125rem',
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
                background: 'var(--oc-warning-soft)',
                border: '1px solid #FDE68A',
                color: '#B45309',
                fontSize: '0.8125rem',
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

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface ComboboxItem {
  id: string;
  label: string;
  sublabel?: string;
  badge?: string;
  meta?: any;
}

export interface SearchableComboboxProps {
  items: ComboboxItem[];
  value: string;
  onChange: (value: string, item?: ComboboxItem) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  error?: boolean;
  disabled?: boolean;
  emptyText?: string;
  clearable?: boolean;
}

export function SearchableCombobox({
  items,
  value,
  onChange,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Type to search...',
  error,
  disabled,
  emptyText = 'No matching options found',
  clearable = true,
}: SearchableComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedItem = items.find((i) => i.id === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = items.filter((i) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      i.label.toLowerCase().includes(q) ||
      (i.sublabel && i.sublabel.toLowerCase().includes(q)) ||
      (i.badge && i.badge.toLowerCase().includes(q))
    );
  });

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`crmFormInput ${error ? 'hasError' : ''}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'left',
          cursor: disabled ? 'not-allowed' : 'pointer',
          padding: '10px 14px',
          background: disabled ? '#F8FAFC' : '#FFFFFF',
        }}
      >
        <span style={{ color: selectedItem ? '#0F172A' : '#94A3B8', fontWeight: selectedItem ? 500 : 400 }}>
          {selectedItem ? selectedItem.label : placeholder}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {clearable && selectedItem && !disabled && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              style={{ padding: 2, cursor: 'pointer', color: '#94A3B8' }}
              title="Clear selection"
            >
              <X size={15} />
            </span>
          )}
          <ChevronDown size={16} style={{ color: '#64748B' }} />
        </div>
      </button>

      {/* Dropdown Menu */}
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
            overflow: 'hidden',
          }}
        >
          {/* Search Box */}
          <div style={{ padding: '8px 10px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={16} style={{ color: '#94A3B8' }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              autoFocus
              style={{
                border: 'none',
                outline: 'none',
                width: '100%',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                color: '#0F172A',
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 220, overflowY: 'auto', padding: 4 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '12px 14px', fontSize: '0.875rem', color: '#64748B', textAlign: 'center' }}>
                {emptyText}
              </div>
            ) : (
              filtered.map((item) => {
                const isSelected = item.id === value;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onChange(item.id, item);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      background: isSelected ? '#F0F9FF' : 'transparent',
                      transition: 'background 0.1s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = '#F8FAFC';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: isSelected ? 600 : 500, color: '#0F172A' }}>
                        {item.label}
                      </div>
                      {item.sublabel && (
                        <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                          {item.sublabel}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {item.badge && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: '#E2E8F0',
                            color: '#334155',
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isSelected && <Check size={16} style={{ color: '#0284C7' }} />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchableCombobox;

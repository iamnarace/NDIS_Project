import React from 'react';

export interface CrmPillItem {
  id: string;
  label: string;
  count?: number;
}

export interface CrmPillBarProps {
  items: CrmPillItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export default function CrmPillBar({
  items,
  selectedId,
  onSelect,
  className = '',
}: CrmPillBarProps) {
  return (
    <div className={`vsPillBar ${className}`}>
      {items.map((item) => {
        const isSelected = item.id === selectedId;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`vsPill ${isSelected ? 'active' : 'inactive'}`}
          >
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span className="vsPillCount">
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

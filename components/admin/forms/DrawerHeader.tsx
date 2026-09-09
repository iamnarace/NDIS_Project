'use client';

import React from 'react';
import { X } from 'lucide-react';

export interface DrawerHeaderProps {
  title: string;
  description?: string;
  onClose: () => void;
  badge?: React.ReactNode;
}

export default function DrawerHeader({
  title,
  description,
  onClose,
  badge,
}: DrawerHeaderProps) {
  return (
    <div className="drawer-header">
      <div className="header-title-block">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2>{title}</h2>
          {badge}
        </div>
        {description && <p>{description}</p>}
      </div>
      <button
        type="button"
        className="btn-close-icon"
        onClick={onClose}
        aria-label="Close dialog"
      >
        <X size={16} />
      </button>
    </div>
  );
}

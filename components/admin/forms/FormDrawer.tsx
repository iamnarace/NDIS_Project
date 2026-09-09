'use client';

import React, { useEffect, useRef } from 'react';

export interface FormDrawerProps {
  isOpen?: boolean;
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
}

export default function FormDrawer({
  isOpen = true,
  onClose,
  wide = false,
  children,
}: FormDrawerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="drawer-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={containerRef}
        className={`drawer-container ${wide ? 'drawer-container-wide' : ''}`}
      >
        {children}
      </div>
    </div>
  );
}

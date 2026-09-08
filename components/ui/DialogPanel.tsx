'use client';
import type { HTMLAttributes } from 'react';
import useDialogFocus from './useDialogFocus';

export default function DialogPanel({ onClose, label, children, ...props }: HTMLAttributes<HTMLDivElement> & { onClose: () => void; label: string }) {
  const ref = useDialogFocus(onClose);
  return <div {...props} ref={ref} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>{children}</div>;
}

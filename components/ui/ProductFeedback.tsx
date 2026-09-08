'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export function notify(message: string) {
  window.dispatchEvent(new CustomEvent<string>('opus-notice', { detail: message }));
}

export default function ProductFeedback() {
  const [notices, setNotices] = useState<{ id: number; message: string }[]>([]);
  useEffect(() => {
    let sequence = 0;
    const receive = (event: Event) => {
      const message = (event as CustomEvent<string>).detail;
      setNotices(current => [...current.slice(-3), { id: ++sequence, message }]);
    };
    window.addEventListener('opus-notice', receive);
    return () => window.removeEventListener('opus-notice', receive);
  }, []);
  return <div className="ocToastRegion" aria-live="polite" aria-relevant="additions">
    {notices.map(notice => <div className="ocToast" key={notice.id}>
      <p>{notice.message}</p>
      <button type="button" aria-label="Dismiss notification" onClick={() => setNotices(current => current.filter(item => item.id !== notice.id))}><X size={18} /></button>
    </div>)}
  </div>;
}

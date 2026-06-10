'use client';

import { useEffect, useState } from 'react';
import { useToastStore } from '@/lib/toast-store';

export default function GlobalToast() {
  const { message, type, visible, hideToast } = useToastStore();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => {
        hideToast();
        setShow(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, hideToast]);

  if (!show) return null;

  const bgColor = type === 'error' ? 'bg-red-500/90' : type === 'success' ? 'bg-green-500/90' : 'bg-primary-500/90';

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
      <div className={`px-5 py-2.5 rounded-xl text-sm text-white font-medium ${bgColor} backdrop-blur-sm shadow-lg animate-in slide-in-from-top fade-in duration-300`}>
        {message}
      </div>
    </div>
  );
}

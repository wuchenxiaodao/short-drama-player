'use client';

import { useEffect, useState } from 'react';

interface FeedbackToastProps {
  message: string;
  duration?: number;
  onClose?: () => void;
}

export default function FeedbackToast({ message, duration = 3000, onClose }: FeedbackToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
      <div
        className="
          px-5 py-2.5 rounded-xl text-sm text-white font-medium
          bg-gradient-to-r from-primary-600/90 to-primary-500/90
          backdrop-blur-sm shadow-lg shadow-primary-500/20
          animate-in slide-in-from-top fade-in duration-300
          max-w-[80vw] text-center
        "
      >
        {message}
      </div>
    </div>
  );
}

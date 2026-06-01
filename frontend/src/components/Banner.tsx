'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Drama } from '@/lib/types';
import { resolveUrl } from '@/lib/api-client';

interface BannerProps {
  dramas: Drama[];
}

export default function Banner({ dramas }: BannerProps) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % dramas.length);
  }, [dramas.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + dramas.length) % dramas.length);
  }, [dramas.length]);

  useEffect(() => {
    if (isPaused || dramas.length <= 1) return;
    const timer = setInterval(next, 3000);
    return () => clearInterval(timer);
  }, [isPaused, next, dramas.length]);

  if (dramas.length === 0) {
    return (
      <div className="w-full h-[200px] md:h-[300px] bg-drama-card rounded-xl flex items-center justify-center text-drama-muted">
        暂无推荐
      </div>
    );
  }

  const drama = dramas[current];

  return (
    <div
      className="relative w-full h-[200px] md:h-[300px] rounded-xl overflow-hidden group cursor-pointer"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onClick={() => router.push(`/drama/${drama.id}`)}
    >
      <img
        src={resolveUrl(drama.coverUrl)}
        alt={drama.title}
        className="w-full h-full object-cover transition-all duration-700"
        key={drama.id}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-drama-bg via-drama-bg/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
        <span className="inline-block px-2 py-0.5 text-xs bg-primary-500/80 text-white rounded mb-2">
          {drama.category}
        </span>
        <h2 className="text-lg md:text-2xl font-bold text-white drop-shadow-lg">
          {drama.title}
        </h2>
      </div>

      {dramas.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {dramas.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${
                  i === current
                    ? 'bg-primary-400 w-4'
                    : 'bg-white/40 hover:bg-white/60 w-2'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

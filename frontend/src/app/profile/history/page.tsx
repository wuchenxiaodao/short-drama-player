'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, ChevronLeft } from 'lucide-react';
import { useAuthStore } from '@/lib/auth';
import { apiGet, resolveUrl } from '@/lib/api-client';
import type { Drama } from '@/lib/types';

interface HistoryItem {
  drama: Drama;
  episodeId: number;
  episodeNumber: number;
  positionMs: number;
  lastWatchedAt: string;
}

function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export default function HistoryPage() {
  const { isLoggedIn } = useAuthStore();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) return;
    apiGet<any>('/api/progress/history')
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.content || []);
        setItems(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Clock className="w-16 h-16 text-drama-muted mx-auto mb-4" />
        <p className="text-drama-muted">请先登录</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/profile" className="text-drama-muted hover:text-drama-text">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-drama-text">观看历史</h1>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-drama-card animate-pulse aspect-video" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-drama-muted">还没有观看记录</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((item) =>
            item.drama && (
              <Link
                key={item.drama.id}
                href={`/drama/${item.drama.id}/play?ep=${item.episodeNumber}`}
                className="group rounded-lg overflow-hidden bg-drama-card border border-drama-border hover:border-primary-500/50 transition-colors"
              >
                <div className="relative aspect-video">
                  <img
                    src={resolveUrl(item.drama.coverUrl)}
                    alt={item.drama.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                    <div
                      className="h-full bg-primary-500"
                      style={{ width: `${Math.min(100, (item.positionMs / (item.drama.totalEpisodes * 60000)) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="p-2 space-y-1">
                  <p className="text-sm text-drama-text font-medium truncate">{item.drama.title}</p>
                  <p className="text-xs text-drama-muted">
                    第{item.episodeNumber}集 · {formatDuration(item.positionMs)}
                  </p>
                  <p className="text-xs text-primary-400 group-hover:text-primary-300">
                    继续观看 →
                  </p>
                </div>
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}

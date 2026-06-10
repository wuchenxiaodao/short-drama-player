'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bookmark, ChevronLeft, X } from 'lucide-react';
import { getFavorites, toggleFavorite } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth';
import { useToastStore } from '@/lib/toast-store';
import DramaCard from '@/components/DramaCard';
import type { Drama } from '@/lib/types';

export default function FavoritesPage() {
  const { isLoggedIn } = useAuthStore();
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(true);
  const showToast = useToastStore((s) => s.showToast);

  useEffect(() => {
    if (!isLoggedIn) return;
    getFavorites()
      .then((res: any) => {
        const list = Array.isArray(res) ? res : (res?.content || []);
        setDramas(list.map((f: any) => f.drama || f));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  const handleRemove = async (dramaId: number) => {
    try {
      await toggleFavorite(dramaId);
      setDramas((prev) => prev.filter((d) => d.id !== dramaId));
      showToast('已取消追剧', 'info');
    } catch {
      showToast('操作失败，请重试', 'error');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Bookmark className="w-16 h-16 text-drama-muted mx-auto mb-4" />
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
        <h1 className="text-xl font-bold text-drama-text">我的追剧</h1>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-drama-card animate-pulse aspect-video" />
          ))}
        </div>
      ) : dramas.length === 0 ? (
        <div className="text-center py-20 text-drama-muted">还没有追剧记录</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {dramas.map((d) => (
            <div key={d.id} className="relative group">
              <DramaCard drama={d} />
              <button
                onClick={() => handleRemove(d.id)}
                className="absolute top-2 right-2 z-10 p-1 rounded-full bg-black/50 text-white opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

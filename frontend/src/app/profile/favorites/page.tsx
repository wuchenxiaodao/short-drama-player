'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bookmark, ChevronLeft } from 'lucide-react';
import { getFavorites } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth';
import DramaCard from '@/components/DramaCard';
import type { Drama } from '@/lib/types';

export default function FavoritesPage() {
  const { isLoggedIn } = useAuthStore();
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(true);

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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-drama-card animate-pulse aspect-video" />
          ))}
        </div>
      ) : dramas.length === 0 ? (
        <div className="text-center py-20 text-drama-muted">还没有追剧记录</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {dramas.map((d) => <DramaCard key={d.id} drama={d} />)}
        </div>
      )}
    </div>
  );
}

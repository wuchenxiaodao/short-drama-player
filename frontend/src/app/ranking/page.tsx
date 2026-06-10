'use client';

import { useState, useEffect } from 'react';
import { Trophy, Flame, Star } from 'lucide-react';
import { getHotDramas, getRecommendDramas } from '@/lib/api-client';
import DramaCard from '@/components/DramaCard';
import type { Drama } from '@/lib/types';

const TABS = [
  { key: 'hot', label: '热播榜', icon: Flame },
  { key: 'rating', label: '好评榜', icon: Star },
];

export default function RankingPage() {
  const [tab, setTab] = useState('hot');
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetcher = tab === 'hot' ? getHotDramas : getRecommendDramas;
    fetcher(0, 20)
      .then((res: any) => setDramas(res?.content || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Trophy className="w-6 h-6 text-amber-400" />
        <h1 className="text-xl font-bold text-drama-text">排行榜</h1>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-colors ${
                tab === t.key ? 'bg-primary-500 text-white' : 'bg-drama-surface text-drama-muted hover:text-drama-text'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-drama-card animate-pulse aspect-video" />
          ))}
        </div>
      ) : dramas.length === 0 ? (
        <div className="text-center py-20 text-drama-muted">暂无数据</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {dramas.map((d, i) => (
            <div key={d.id} className="relative">
              {i < 3 && (
                <span className={`absolute top-1 left-1 z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : 'bg-amber-700'
                }`}>
                  {i + 1}
                </span>
              )}
              <DramaCard drama={d} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

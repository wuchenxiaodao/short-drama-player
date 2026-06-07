'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Egg, Lock, LogIn } from 'lucide-react';
import { getEggCollection, apiGet } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth';
import type { UserEgg } from '@/lib/types';
import { formatTimeAgo } from '@/lib/utils';

interface EggCatalogEntry {
  id: number;
  dramaId: number;
  dramaTitle: string;
  eggContent: string;
  interactionId: number;
}

interface DramaEggGroup {
  dramaId: number;
  dramaTitle: string;
  eggs: EggItem[];
}

interface EggItem {
  id: number;
  interactionId: number;
  eggContent: string;
  collected: boolean;
  collectedAt?: string;
}

const EGG_COLORS = [
  'from-accent-400 to-rose-500',
  'from-purple-500 to-indigo-500',
  'from-cyan-500 to-blue-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-violet-500 to-fuchsia-500',
];

function getEggColor(index: number) {
  return EGG_COLORS[index % EGG_COLORS.length];
}

export default function EggsPage() {
  const { isLoggedIn } = useAuthStore();
  const [groups, setGroups] = useState<DramaEggGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const [catalog, collected] = await Promise.all([
          apiGet<EggCatalogEntry[]>('/api/eggs/catalog'),
          getEggCollection(),
        ]);

        const collectedMap = new Map<number, UserEgg>();
        collected.forEach((egg: UserEgg) => collectedMap.set(egg.interactionId, egg));

        const dramaMap = new Map<number, DramaEggGroup>();
        catalog.forEach((entry) => {
          if (!dramaMap.has(entry.dramaId)) {
            dramaMap.set(entry.dramaId, {
              dramaId: entry.dramaId,
              dramaTitle: entry.dramaTitle,
              eggs: [],
            });
          }
          const collectedEgg = collectedMap.get(entry.interactionId);
          dramaMap.get(entry.dramaId)!.eggs.push({
            id: entry.id,
            interactionId: entry.interactionId,
            eggContent: entry.eggContent,
            collected: !!collectedEgg,
            collectedAt: collectedEgg?.collectedAt,
          });
        });

        setGroups(Array.from(dramaMap.values()));
      } catch {
        setGroups([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Lock className="w-16 h-16 text-drama-muted mx-auto mb-4" />
        <h2 className="text-xl font-medium text-drama-text mb-2">登录后查看彩蛋图鉴</h2>
        <p className="text-drama-muted mb-6">登录账号后即可查看你收集的所有彩蛋</p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-full font-medium transition-colors"
        >
          <LogIn className="w-4 h-4" />
          去登录
        </Link>
      </div>
    );
  }

  const totalEggs = groups.reduce((sum, g) => sum + g.eggs.length, 0);
  const collectedEggs = groups.reduce(
    (sum, g) => sum + g.eggs.filter((e) => e.collected).length,
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Egg className="w-6 h-6 text-accent-400" />
          <h1 className="text-2xl font-bold text-drama-text">彩蛋图鉴</h1>
        </div>
        <div className="px-4 py-2 bg-drama-card rounded-lg border border-drama-border">
          <span className="text-accent-400 font-bold text-lg">{collectedEggs}</span>
          <span className="text-drama-muted">/{totalEggs}</span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-8">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-6 bg-drama-surface rounded w-32 mb-4" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-32 bg-drama-card rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-20">
          <Egg className="w-12 h-12 text-drama-muted mx-auto mb-4" />
          <p className="text-drama-muted">暂无彩蛋数据</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group, groupIndex) => {
            const groupCollected = group.eggs.filter((e) => e.collected).length;
            return (
              <div key={group.dramaId}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-drama-text">{group.dramaTitle}</h2>
                  <span className="text-sm text-drama-muted">
                    <span className="text-accent-400 font-medium">{groupCollected}</span>
                    /{group.eggs.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {group.eggs.map((egg, eggIndex) =>
                    egg.collected ? (
                      <div
                        key={egg.id}
                        className={`relative rounded-lg p-4 bg-gradient-to-br ${getEggColor(groupIndex + eggIndex)} bg-opacity-20 border border-white/10 overflow-hidden`}
                      >
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="relative">
                          <Egg className="w-5 h-5 text-white/80 mb-2" />
                          <p className="text-sm text-white font-medium mb-2 line-clamp-2">
                            {egg.eggContent}
                          </p>
                          {egg.collectedAt && (
                            <p className="text-xs text-white/60">
                              {formatTimeAgo(egg.collectedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div
                        key={egg.id}
                        className="rounded-lg p-4 bg-drama-card border border-drama-border/50 flex flex-col items-center justify-center min-h-[120px]"
                      >
                        <Lock className="w-6 h-6 text-drama-muted mb-2" />
                        <p className="text-drama-muted text-sm font-medium">???</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

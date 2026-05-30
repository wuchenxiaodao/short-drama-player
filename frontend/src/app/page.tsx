'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Flame, Clock } from 'lucide-react';
import { getRecommendDramas, getHotDramas, getNewDramas, getDramasByCategory } from '@/lib/api-client';
import type { Drama } from '@/lib/types';
import Banner from '@/components/Banner';
import DramaGrid from '@/components/DramaGrid';

const categories = ['全部', '都市', '甜宠', '古装', '悬疑'];
type SortType = 'hot' | 'new';

export default function HomePage() {
  const [recommendDramas, setRecommendDramas] = useState<Drama[]>([]);
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [category, setCategory] = useState('全部');
  const [sort, setSort] = useState<SortType>('hot');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getRecommendDramas(0, 5)
      .then((res: any) => setRecommendDramas(res.content || []))
      .catch(() => {});
  }, []);

  const fetchDramas = useCallback(
    async (cat: string, pageNum: number, sortType: SortType, append: boolean) => {
      setLoading(true);
      try {
        let data: any;
        const p = pageNum - 1;
        if (cat === '全部') {
          if (sortType === 'hot') {
            const res = await getHotDramas(p, 20);
            data = res.content || [];
          } else {
            const res = await getNewDramas(p, 20);
            data = res.content || [];
          }
        } else {
          const res = await getDramasByCategory(cat, p, 20);
          data = res.content || [];
        }
        if (append) {
          setDramas((prev) => [...prev, ...data]);
        } else {
          setDramas(data);
        }
        setHasMore(data.length >= 20);
      } catch {
        setHasMore(false);
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    setPage(1);
    setDramas([]);
    setHasMore(true);
    setInitialLoading(true);
    fetchDramas(category, 1, sort, false);
  }, [category, sort, fetchDramas]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchDramas(category, nextPage, sort, true);
  }, [loading, hasMore, page, category, sort, fetchDramas]);

  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <Banner dramas={recommendDramas.slice(0, 5)} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hidden">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
                category === cat
                  ? 'bg-primary-500 text-white'
                  : 'bg-drama-card text-drama-muted hover:text-drama-text'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-drama-card rounded-lg p-1">
          <button
            onClick={() => setSort('hot')}
            className={`flex items-center gap-1 px-3 py-1 text-sm rounded transition-colors ${
              sort === 'hot'
                ? 'bg-drama-surface text-primary-400'
                : 'text-drama-muted hover:text-drama-text'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            热度
          </button>
          <button
            onClick={() => setSort('new')}
            className={`flex items-center gap-1 px-3 py-1 text-sm rounded transition-colors ${
              sort === 'new'
                ? 'bg-drama-surface text-primary-400'
                : 'text-drama-muted hover:text-drama-text'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            最新
          </button>
        </div>
      </div>

      {initialLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-drama-card animate-pulse">
              <div className="aspect-video" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-drama-surface rounded w-3/4" />
                <div className="h-3 bg-drama-surface rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <DramaGrid dramas={dramas} loading={loading} />
          <div ref={observerRef} className="h-10" />
          {loading && (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!hasMore && dramas.length > 0 && (
            <p className="text-center text-sm text-drama-muted py-4">没有更多了</p>
          )}
        </>
      )}
    </div>
  );
}

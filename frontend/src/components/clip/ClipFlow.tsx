'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Loader2, Film } from 'lucide-react';
import { getClipFlow } from '@/lib/api-client';
import type { HighlightClip } from '@/lib/types';
import ClipCard from './ClipCard';

const TAGS = [
  { key: '', label: '全部' },
  { key: 'SWEET', label: '甜' },
  { key: 'THRILL', label: '刺激' },
  { key: 'FUNNY', label: '搞笑' },
  { key: 'SHOCK', label: '震惊' },
  { key: 'ANGRY', label: '气愤' },
  { key: 'SAD', label: '虐心' },
];

export default function ClipFlow() {
  const [clips, setClips] = useState<HighlightClip[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isAnimating = useRef(false);

  const loadClips = useCallback(async (tag: string, pageNum: number, append: boolean) => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await getClipFlow(tag || undefined, pageNum, 10);
      const newClips = data?.content || data || [];
      if (append) {
        setClips(prev => [...prev, ...newClips]);
      } else {
        setClips(newClips);
      }
      setHasMore(newClips.length >= 10);
    } catch {
      if (!append) setClips([]);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    setClips([]);
    setCurrentIndex(0);
    setPage(0);
    setHasMore(true);
    setInitialLoading(true);
    loadClips(currentTag, 0, false);
  }, [currentTag]);

  const showClip = useCallback((index: number) => {
    if (index < 0 || index >= clips.length) return;
    isAnimating.current = true;
    setCurrentIndex(index);
    setTimeout(() => { isAnimating.current = false; }, 500);
    if (index >= clips.length - 3 && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadClips(currentTag, nextPage, true);
    }
  }, [clips.length, hasMore, loading, page, currentTag, loadClips]);

  const handleScroll = useCallback(() => {
    if (isAnimating.current) return;
    const slider = sliderRef.current;
    if (!slider) return;
    const cardHeight = slider.clientHeight;
    const newIndex = Math.round(slider.scrollTop / cardHeight);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < clips.length) {
      showClip(newIndex);
    }
  }, [currentIndex, clips.length, showClip]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const slider = sliderRef.current;
    if (!slider) return;
    if (e.deltaY > 30 && currentIndex < clips.length - 1) {
      showClip(currentIndex + 1);
      slider.scrollTo({ top: (currentIndex + 1) * slider.clientHeight, behavior: 'smooth' });
    } else if (e.deltaY < -30 && currentIndex > 0) {
      showClip(currentIndex - 1);
      slider.scrollTo({ top: (currentIndex - 1) * slider.clientHeight, behavior: 'smooth' });
    }
  }, [currentIndex, clips.length, showClip]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const slider = sliderRef.current;
      if (!slider) return;
      if (e.key === 'ArrowDown' || e.key === 'j') {
        if (currentIndex < clips.length - 1) {
          showClip(currentIndex + 1);
          slider.scrollTo({ top: (currentIndex + 1) * slider.clientHeight, behavior: 'smooth' });
        }
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        if (currentIndex > 0) {
          showClip(currentIndex - 1);
          slider.scrollTo({ top: (currentIndex - 1) * slider.clientHeight, behavior: 'smooth' });
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIndex, clips.length, showClip]);

  const handleWatchFull = useCallback((clip: HighlightClip) => {
    window.location.href = `/drama/${clip.dramaId}`;
  }, []);

  if (initialLoading) {
    return (
      <div className="clip-empty">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        <p className="text-sm text-drama-muted">加载中...</p>
      </div>
    );
  }

  if (clips.length === 0) {
    return (
      <div className="clip-empty">
        <Film className="w-14 h-14 text-drama-muted" />
        <p className="text-sm text-drama-muted">暂无精选片段</p>
        <a href="/" className="btn-primary mt-4">去看看全部短剧</a>
      </div>
    );
  }

  return (
    <div className="clip-flow">
      <nav className="clip-nav">
        <span className="text-lg font-bold">🔥 精选片段</span>
        <div className="clip-tags">
          {TAGS.map(t => (
            <button
              key={t.key}
              className={`tag-btn ${currentTag === t.key ? 'active' : ''}`}
              onClick={() => setCurrentTag(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <a href="/?list=true" className="flex items-center gap-1 text-sm text-drama-muted hover:text-drama-text transition-colors" title="短剧列表">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
          <span>短剧</span>
        </a>
      </nav>

      <div
        ref={sliderRef}
        className="clip-slider"
        onScroll={handleScroll}
        onWheel={handleWheel}
      >
        {clips.map((clip, index) => (
          <ClipCard
            key={clip.id}
            clip={clip}
            isActive={index === currentIndex}
            onWatchFull={handleWatchFull}
            onClipEnded={() => {
              if (currentIndex < clips.length - 1) {
                showClip(currentIndex + 1);
              } else if (hasMore) {
                loadClips(currentTag, page + 1, true);
              }
            }}
          />
        ))}
        {loading && (
          <div className="clip-loading">
            <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}

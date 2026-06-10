'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LayoutGrid, List, Play } from 'lucide-react';
import type { Drama } from '@/lib/types';
import { cn, formatNumber, truncateText } from '@/lib/utils';
import { resolveUrl } from '@/lib/api-client';
import DramaCard from './DramaCard';

interface DramaGridProps {
  dramas: Drama[];
  loading: boolean;
  highlightKeyword?: string;
}

function getBadge(drama: Drama) {
  if (drama.isNew) return { text: 'NEW', color: 'bg-primary-500' };
  if (drama.status === 'ongoing') return { text: '更新中', color: 'bg-green-500' };
  return { text: '已完结', color: 'bg-gray-500' };
}

function DramaListItem({ drama }: { drama: Drama }) {
  const badge = getBadge(drama);

  return (
    <Link href={`/drama/${drama.id}`} className="block group">
      <div className="flex gap-4 p-3 rounded-lg bg-drama-card hover:bg-drama-surface/80 transition-colors">
        <div className="relative w-32 md:w-40 flex-shrink-0 aspect-video rounded-lg overflow-hidden">
          <img
            src={resolveUrl(drama.coverUrl)}
            alt={drama.title}
            className="w-full h-full object-cover"
          />
          <span
            className={`absolute top-1 right-1 px-1.5 py-0.5 text-[10px] font-medium text-white rounded ${badge.color}`}
          >
            {badge.text}
          </span>
        </div>
        <div className="flex-1 min-w-0 py-1 space-y-1.5">
          <h3 className="text-sm font-medium text-drama-text truncate">
            {drama.title}
          </h3>
          <p className="text-xs text-drama-muted">
            {drama.category} · {drama.totalEpisodes}集
          </p>
          <p className="text-xs text-drama-muted line-clamp-2">
            {truncateText(drama.description, 80)}
          </p>
          <div className="flex items-center gap-1 text-xs text-drama-muted">
            <Play className="w-3 h-3" />
            <span>{formatNumber(drama.viewCount)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function DramaGrid({ dramas, loading, highlightKeyword }: DramaGridProps) {
  const [layout, setLayout] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('drama-layout') as 'grid' | 'list') || 'grid';
    }
    return 'grid';
  });

  useEffect(() => {
    localStorage.setItem('drama-layout', layout);
  }, [layout]);

  if (dramas.length === 0 && !loading) {
    return (
      <div className="text-center py-20 text-drama-muted">暂无短剧</div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <div className="flex items-center gap-1 bg-drama-surface rounded-lg p-1">
          <button
            onClick={() => setLayout('grid')}
            className={cn(
              'p-1.5 rounded transition-colors',
              layout === 'grid'
                ? 'bg-drama-card text-primary-500'
                : 'text-drama-muted hover:text-drama-text'
            )}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLayout('list')}
            className={cn(
              'p-1.5 rounded transition-colors',
              layout === 'list'
                ? 'bg-drama-card text-primary-500'
                : 'text-drama-muted hover:text-drama-text'
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {layout === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {dramas.map((drama) => (
            <DramaCard key={drama.id} drama={drama} highlightKeyword={highlightKeyword} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {dramas.map((drama) => (
            <DramaListItem key={drama.id} drama={drama} />
          ))}
        </div>
      )}
    </div>
  );
}

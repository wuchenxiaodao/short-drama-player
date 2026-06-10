'use client';

import Link from 'next/link';
import { Play } from 'lucide-react';
import type { Drama } from '@/lib/types';
import { formatNumber } from '@/lib/utils';
import { resolveUrl } from '@/lib/api-client';

interface DramaCardProps {
  drama: Drama;
  highlightKeyword?: string;
}

function HighlightText({ text, keyword }: { text: string; keyword: string }) {
  if (!keyword?.trim()) return <>{text}</>;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === keyword.toLowerCase() ? (
          <span key={i} className="text-primary-400 font-medium">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function getBadge(drama: Drama) {
  if (drama.isNew) return { text: 'NEW', color: 'bg-primary-500' };
  if (drama.status === 'ongoing') return { text: '更新中', color: 'bg-green-500' };
  return { text: '已完结', color: 'bg-gray-500' };
}

export default function DramaCard({ drama, highlightKeyword }: DramaCardProps) {
  const badge = getBadge(drama);

  return (
    <Link href={`/drama/${drama.id}`} className="block group">
      <div className="rounded-lg overflow-hidden bg-drama-card transition-all duration-200 group-hover:scale-[1.02] group-hover:shadow-lg group-hover:shadow-black/20 active:scale-[0.97]">
        <div className="relative aspect-video">
          <img
            src={resolveUrl(drama.coverUrl)}
            alt={drama.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <span
            className={`absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-medium text-white rounded ${badge.color}`}
          >
            {badge.text}
          </span>
          <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 text-[11px] text-white bg-black/70 rounded">
            {drama.totalEpisodes}集
          </span>
        </div>
        <div className="p-2">
          <h3 className="text-sm font-medium text-drama-text truncate">
            {highlightKeyword ? <HighlightText text={drama.title} keyword={highlightKeyword} /> : drama.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-drama-muted">{drama.category}</span>
            {drama.rating > 0 && (
              <span className="text-xs text-yellow-400">★ {drama.rating.toFixed(1)}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-drama-muted">{drama.totalEpisodes}集</span>
            <span className="text-[10px] px-1 py-0.5 rounded bg-primary-500/20 text-primary-400">互动</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

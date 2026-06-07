'use client';

import Link from 'next/link';
import { Play } from 'lucide-react';
import type { Drama } from '@/lib/types';
import { formatNumber } from '@/lib/utils';
import { resolveUrl } from '@/lib/api-client';

interface DramaCardProps {
  drama: Drama;
}

function getBadge(drama: Drama) {
  if (drama.isNew) return { text: 'NEW', color: 'bg-primary-500' };
  if (drama.status === 'ongoing') return { text: '更新中', color: 'bg-green-500' };
  return { text: '已完结', color: 'bg-gray-500' };
}

export default function DramaCard({ drama }: DramaCardProps) {
  const badge = getBadge(drama);

  return (
    <Link href={`/drama/${drama.id}`} className="block group">
      <div className="rounded-lg overflow-hidden bg-drama-card transition-all duration-200 group-hover:scale-[1.02] group-hover:shadow-lg group-hover:shadow-black/20">
        <div className="relative aspect-video">
          <img
            src={resolveUrl(drama.coverUrl)}
            alt={drama.title}
            className="w-full h-full object-cover"
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
        <div className="p-3 space-y-1.5">
          <h3 className="text-sm font-medium text-drama-text truncate">
            {drama.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-drama-muted">
            <span>{drama.category}</span>
            <span className="flex items-center gap-0.5">
              <Play className="w-3 h-3" />
              {formatNumber(drama.viewCount)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

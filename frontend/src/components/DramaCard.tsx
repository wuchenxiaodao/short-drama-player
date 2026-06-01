'use client';

import Link from 'next/link';
import { Flame } from 'lucide-react';
import type { Drama } from '@/lib/types';
import { formatNumber, truncateText } from '@/lib/utils';
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
      <div className="relative rounded-xl overflow-hidden bg-drama-card transition-transform duration-200 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-primary-500/10">
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
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-drama-card to-transparent" />
        </div>
        <div className="p-3 space-y-1">
          <h3 className="text-sm font-medium text-drama-text truncate">
            {drama.title}
          </h3>
          <p className="text-xs text-drama-muted">
            {drama.category} · {drama.totalEpisodes}集
          </p>
          <p className="text-xs text-drama-muted line-clamp-2">
            {truncateText(drama.description, 50)}
          </p>
          <div className="flex items-center gap-1 text-xs text-drama-muted">
            <Flame className="w-3 h-3 text-orange-400" />
            <span>{formatNumber(drama.viewCount)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

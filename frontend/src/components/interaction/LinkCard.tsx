'use client';

import { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import type { InteractionPoint } from '@/lib/types';

interface LinkCardProps {
  interaction: InteractionPoint;
}

export default function LinkCard({ interaction }: LinkCardProps) {
  const [closed, setClosed] = useState(false);
  const link = interaction.linkContent;

  if (closed || !link) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20">
      <div className="bg-drama-card/95 backdrop-blur-md border-t border-drama-border p-4 mx-2 mb-2 rounded-xl animate-in slide-in-from-bottom duration-300">
        <div className="flex gap-3">
          {link.coverUrl && (
            <div className="w-20 h-14 flex-shrink-0 rounded-lg overflow-hidden">
              <img src={link.coverUrl} alt={link.title} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-drama-text truncate">{link.title}</h4>
            <p className="text-xs text-drama-muted mt-0.5 line-clamp-2">{link.description}</p>
          </div>
          <button
            onClick={() => setClosed(true)}
            className="text-drama-muted hover:text-drama-text flex-shrink-0 self-start"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex justify-end mt-3">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
          >
            查看详情
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

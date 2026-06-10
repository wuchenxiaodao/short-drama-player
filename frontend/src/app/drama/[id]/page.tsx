'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Play,
  Heart,
  Share2,
  Star,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { Drama } from '@/lib/types';
import {
  getDramaDetail,
  getDramasByCategory,
  toggleFavorite,
  checkFavorite,
  resolveUrl,
  getContinueWatching,
} from '@/lib/api-client';
import { formatNumber, cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth';
import { useToastStore } from '@/lib/toast-store';
import DramaCard from '@/components/DramaCard';
import RatingInput from '@/components/RatingInput';
import CommentSection from '@/components/CommentSection';

export default function DramaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dramaId = Number(params.id);
  const currentEp = Number(searchParams.get('ep')) || 1;

  const [drama, setDrama] = useState<Drama | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [relatedDramas, setRelatedDramas] = useState<Drama[]>([]);
  const [continueInfo, setContinueInfo] = useState<{ episodeNumber: number; positionMs: number } | null>(null);

  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  useEffect(() => {
    if (!dramaId) return;
    setLoading(true);
    Promise.all([
      getDramaDetail(dramaId).catch(() => null),
      checkFavorite(dramaId).catch(() => false),
    ])
      .then(([d, fav]) => {
        setDrama(d);
        setIsFavorited(!!fav?.favorited);
        if (d) {
          getDramasByCategory(d.category, 0, 8)
            .then((res: any) => setRelatedDramas(res.content || []))
            .catch(() => {});
        }
      })
      .finally(() => setLoading(false));
    getContinueWatching().then((data: any) => {
      const items = data?.content || data || [];
      const item = items.find((d: any) => d.id === Number(dramaId) || d.dramaId === Number(dramaId));
      if (item) {
        setContinueInfo({
          episodeNumber: item.lastEpisodeNumber || item.episodeNumber || 1,
          positionMs: item.lastPositionMs || item.positionMs || 0,
        });
      }
    }).catch(() => {});
  }, [dramaId]);

  const handleFavorite = useCallback(async () => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    try {
      await toggleFavorite(dramaId);
      setIsFavorited((prev) => {
        const next = !prev;
        useToastStore.getState().showToast(next ? '已加入追剧' : '已取消追剧', 'success');
        return next;
      });
    } catch {
      useToastStore.getState().showToast('操作失败，请稍后重试', 'error');
    }
  }, [dramaId, isLoggedIn, router]);

  const handleShare = useCallback(async () => {
    const shareData = {
      title: drama?.title || '短剧推荐',
      text: `推荐你看《${drama?.title}》`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        useToastStore.getState().showToast('链接已复制到剪贴板', 'success');
      } catch {
        useToastStore.getState().showToast('复制失败，请手动复制', 'error');
      }
    }
  }, [drama]);

  if (loading) {
    return <DramaDetailSkeleton />;
  }

  if (!drama) {
    return (
      <div className="min-h-screen flex items-center justify-center text-drama-muted">
        短剧不存在或加载失败
      </div>
    );
  }

  const episodes = Array.from({ length: drama.totalEpisodes }, (_, i) => i + 1);

  return (
    <div className="min-h-screen pb-12">
      <div className="relative h-[50vh] min-h-[300px]">
        <img
          src={resolveUrl(drama.coverUrl)}
          alt={drama.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-drama-card via-drama-card/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
          <span className="inline-block px-2 py-0.5 text-xs bg-primary-500/80 text-white rounded mb-2">
            {drama.category}
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg mb-2">
            {drama.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-white/80">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              {drama.rating.toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {formatNumber(drama.viewCount)}播放
            </span>
            <span>{drama.totalEpisodes}集</span>
            <span>{drama.status === 'ongoing' ? '更新中' : '已完结'}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4 relative z-10 space-y-6">
        <div className="flex items-center gap-3">
          {continueInfo ? (
            <Link
              href={`/drama/${dramaId}/play?ep=${continueInfo.episodeNumber}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-full font-medium transition-colors"
            >
              <Play className="w-5 h-5 fill-white" />
              继续播放 第{continueInfo.episodeNumber}集
            </Link>
          ) : (
            <Link
              href={`/drama/${drama.id}/play`}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-full font-medium transition-colors"
            >
              <Play className="w-5 h-5 fill-white" />
              立即播放
            </Link>
          )}
          <button
            onClick={handleFavorite}
            className={cn(
              'flex items-center justify-center gap-1.5 px-5 py-3 rounded-full border transition-colors',
              isFavorited
                ? 'border-accent-400/50 text-accent-400 bg-accent-500/10'
                : 'border-drama-border text-drama-muted hover:text-accent-400 hover:border-accent-400/50'
            )}
          >
            <Heart className={cn('w-5 h-5', isFavorited && 'fill-accent-400')} />
            <span className="text-sm">{isFavorited ? '已追' : '追剧'}</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-full border border-drama-border text-drama-muted hover:text-drama-text hover:border-drama-text/30 transition-colors"
          >
            <Share2 className="w-5 h-5" />
            <span className="text-sm">分享</span>
          </button>
        </div>

        <div className="bg-drama-card rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-drama-text">简介</h3>
            <button
              onClick={() => setDescExpanded(!descExpanded)}
              className="text-xs text-primary-500 flex items-center gap-0.5"
            >
              {descExpanded ? '收起' : '展开'}
              {descExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
          <p
            className={cn(
              'text-sm text-drama-muted leading-relaxed',
              !descExpanded && 'line-clamp-2'
            )}
          >
            {drama.description}
          </p>
        </div>

        <RatingInput dramaId={drama.id} />

        <div className="bg-drama-card rounded-lg p-4">
          <h3 className="text-sm font-medium text-drama-text mb-3">选集</h3>
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {episodes.map((ep) => (
              <Link
                key={ep}
                href={`/drama/${drama.id}/play?ep=${ep}`}
                className={cn(
                  'flex items-center justify-center py-2 rounded text-sm transition-colors',
                  ep === currentEp
                    ? 'bg-primary-500 text-white font-medium'
                    : 'bg-drama-surface text-drama-muted hover:text-drama-text hover:bg-drama-surface/80'
                )}
              >
                {ep}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <CommentSection dramaId={dramaId} />
        </div>

        {relatedDramas.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-drama-text mb-3">相关推荐</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {relatedDramas
                .filter((d) => d.id !== drama.id)
                .slice(0, 4)
                .map((d) => (
                  <DramaCard key={d.id} drama={d} />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DramaDetailSkeleton() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="h-[50vh] bg-drama-card" />
      <div className="max-w-4xl mx-auto px-4 -mt-4 relative z-10 space-y-6">
        <div className="flex gap-3">
          <div className="flex-1 h-12 bg-drama-card rounded-lg" />
          <div className="w-20 h-12 bg-drama-card rounded-lg" />
          <div className="w-20 h-12 bg-drama-card rounded-lg" />
        </div>
        <div className="bg-drama-card rounded-xl p-4 space-y-2">
          <div className="h-4 w-12 bg-drama-surface rounded" />
          <div className="h-3 w-full bg-drama-surface rounded" />
          <div className="h-3 w-3/4 bg-drama-surface rounded" />
        </div>
        <div className="bg-drama-card rounded-xl p-4 space-y-3">
          <div className="h-4 w-12 bg-drama-surface rounded" />
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-9 bg-drama-surface rounded-lg" />
            ))}
          </div>
        </div>
        <div className="bg-drama-card rounded-xl p-4 space-y-3">
          <div className="h-4 w-20 bg-drama-surface rounded" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 bg-drama-surface rounded-full" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-20 bg-drama-surface rounded" />
                <div className="h-3 w-full bg-drama-surface rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Play,
  Heart,
  Share2,
  Star,
  Eye,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  ThumbsUp,
  Send,
} from 'lucide-react';
import type { Drama, Comment } from '@/lib/types';
import {
  getDramaDetail,
  getDramasByCategory,
  getComments,
  postComment,
  toggleCommentLike,
  toggleFavorite,
  checkFavorite,
} from '@/lib/api-client';
import { formatNumber, formatTimeAgo, cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth';
import DramaCard from '@/components/DramaCard';

export default function DramaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dramaId = Number(params.id);

  const [drama, setDrama] = useState<Drama | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [relatedDramas, setRelatedDramas] = useState<Drama[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentPage, setCommentPage] = useState(1);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
        setIsFavorited(!!fav);
        if (d) {
          getDramasByCategory(d.category, 1, 8)
            .then(setRelatedDramas)
            .catch(() => {});
        }
      })
      .finally(() => setLoading(false));
  }, [dramaId]);

  useEffect(() => {
    if (!dramaId) return;
    getComments(dramaId, 1, 20)
      .then(setComments)
      .catch(() => {});
  }, [dramaId, commentPage]);

  const handleFavorite = useCallback(async () => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    try {
      await toggleFavorite(dramaId);
      setIsFavorited((prev) => !prev);
    } catch {}
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
        alert('链接已复制到剪贴板');
      } catch {}
    }
  }, [drama]);

  const handleCommentSubmit = useCallback(async () => {
    if (!commentText.trim() || submitting) return;
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    setSubmitting(true);
    try {
      const newComment = await postComment(dramaId, commentText.trim());
      setComments((prev) => [newComment, ...prev]);
      setCommentText('');
    } catch {} finally {
      setSubmitting(false);
    }
  }, [commentText, submitting, dramaId, isLoggedIn, router]);

  const handleCommentLike = useCallback(async (commentId: number) => {
    if (!isLoggedIn) return;
    try {
      await toggleCommentLike(commentId);
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, isLiked: !c.isLiked, likeCount: c.isLiked ? c.likeCount - 1 : c.likeCount + 1 }
            : c
        )
      );
    } catch {}
  }, [isLoggedIn]);

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
          src={drama.coverUrl}
          alt={drama.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-drama-bg via-drama-bg/50 to-transparent" />
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
          <Link
            href={`/drama/${drama.id}/play`}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
          >
            <Play className="w-5 h-5 fill-white" />
            立即播放
          </Link>
          <button
            onClick={handleFavorite}
            className={cn(
              'flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl border transition-colors',
              isFavorited
                ? 'border-primary-400/50 text-primary-400 bg-primary-500/10'
                : 'border-drama-border text-drama-muted hover:text-primary-400 hover:border-primary-400/50'
            )}
          >
            <Heart className={cn('w-5 h-5', isFavorited && 'fill-primary-400')} />
            <span className="text-sm">{isFavorited ? '已追' : '追剧'}</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl border border-drama-border text-drama-muted hover:text-drama-text hover:border-drama-text/30 transition-colors"
          >
            <Share2 className="w-5 h-5" />
            <span className="text-sm">分享</span>
          </button>
        </div>

        <div className="bg-drama-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-drama-text">简介</h3>
            <button
              onClick={() => setDescExpanded(!descExpanded)}
              className="text-xs text-primary-400 flex items-center gap-0.5"
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

        <div className="bg-drama-card rounded-xl p-4">
          <h3 className="text-sm font-medium text-drama-text mb-3">选集</h3>
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {episodes.map((ep) => (
              <Link
                key={ep}
                href={`/drama/${drama.id}/play?ep=${ep}`}
                className={cn(
                  'flex items-center justify-center py-2 rounded-lg text-sm transition-colors',
                  ep === 1
                    ? 'bg-primary-500 text-white font-medium'
                    : 'bg-drama-surface text-drama-muted hover:text-drama-text hover:bg-drama-surface/80'
                )}
              >
                {ep}
              </Link>
            ))}
          </div>
        </div>

        <CommentSection
          comments={comments}
          commentText={commentText}
          onCommentTextChange={setCommentText}
          onSubmit={handleCommentSubmit}
          onLike={handleCommentLike}
          submitting={submitting}
          isLoggedIn={isLoggedIn}
        />

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

interface CommentSectionProps {
  comments: Comment[];
  commentText: string;
  onCommentTextChange: (text: string) => void;
  onSubmit: () => void;
  onLike: (commentId: number) => void;
  submitting: boolean;
  isLoggedIn: boolean;
}

function CommentSection({
  comments,
  commentText,
  onCommentTextChange,
  onSubmit,
  onLike,
  submitting,
  isLoggedIn,
}: CommentSectionProps) {
  const router = useRouter();

  return (
    <div className="bg-drama-card rounded-xl p-4">
      <h3 className="text-sm font-medium text-drama-text mb-3 flex items-center gap-1.5">
        <MessageCircle className="w-4 h-4" />
        评论 ({comments.length})
      </h3>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={commentText}
          onChange={(e) => onCommentTextChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          placeholder={isLoggedIn ? '说点什么...' : '登录后评论'}
          disabled={!isLoggedIn}
          className="flex-1 bg-drama-surface border border-drama-border rounded-lg px-3 py-2 text-sm text-drama-text placeholder:text-drama-muted outline-none focus:border-primary-400/50 transition-colors disabled:opacity-50"
        />
        <button
          onClick={() => {
            if (!isLoggedIn) {
              router.push('/login');
              return;
            }
            onSubmit();
          }}
          disabled={submitting || !commentText.trim()}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-drama-surface disabled:text-drama-muted text-white text-sm rounded-lg transition-colors flex items-center gap-1"
        >
          <Send className="w-3.5 h-3.5" />
          发送
        </button>
      </div>

      <div className="space-y-3">
        {comments.length === 0 && (
          <p className="text-center text-drama-muted text-sm py-6">暂无评论，快来抢沙发</p>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 py-2">
            <div className="w-8 h-8 rounded-full bg-drama-surface flex items-center justify-center flex-shrink-0 text-xs text-drama-muted">
              {comment.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-medium text-drama-text">{comment.username}</span>
                <span className="text-xs text-drama-muted">{formatTimeAgo(comment.createdAt)}</span>
              </div>
              <p className="text-sm text-drama-text/90 leading-relaxed">{comment.content}</p>
              <div className="flex items-center gap-3 mt-1">
                <button
                  onClick={() => onLike(comment.id)}
                  className={cn(
                    'flex items-center gap-1 text-xs transition-colors',
                    comment.isLiked ? 'text-primary-400' : 'text-drama-muted hover:text-primary-400'
                  )}
                >
                  <ThumbsUp className="w-3 h-3" />
                  {comment.likeCount > 0 && comment.likeCount}
                </button>
                {comment.replyCount > 0 && (
                  <span className="text-xs text-drama-muted">{comment.replyCount}回复</span>
                )}
              </div>
            </div>
          </div>
        ))}
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
          <div className="flex-1 h-12 bg-drama-card rounded-xl" />
          <div className="w-20 h-12 bg-drama-card rounded-xl" />
          <div className="w-20 h-12 bg-drama-card rounded-xl" />
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

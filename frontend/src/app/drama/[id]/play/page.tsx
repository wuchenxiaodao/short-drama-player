'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  MessageCircle,
  ThumbsUp,
  Send,
  ChevronRight,
  Users,
  Sparkles,
  Wand2,
} from 'lucide-react';
import type { Drama, Episode, InteractionPoint, Danmaku, Comment } from '@/lib/types';
import {
  getDramaDetail,
  getEpisodePlayInfo,
  getDanmaku,
  getComments,
  postComment,
  toggleCommentLike,
  sendDanmaku as sendDanmakuApi,
  submitAnswer,
  reportProgress,
  resolveUrl,
  getEpisodeInteractions,
  getOnlineCount,
  generateBranch,
  generateContinue,
} from '@/lib/api-client';
import { formatTimeAgo, formatDuration, cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth';
import VideoPlayer from '@/components/VideoPlayer';
import InteractionOverlay from '@/components/InteractionOverlay';
import DanmakuLayer from '@/components/danmaku/DanmakuLayer';
import { sentimentAnalyzer } from '@/lib/danmaku-sentiment';

export default function PlayPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const dramaId = Number(params.id);
  const episodeNumber = Number(searchParams.get('ep')) || 1;

  const [drama, setDrama] = useState<Drama | null>(null);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [interactions, setInteractions] = useState<InteractionPoint[]>([]);
  const [danmakuList, setDanmakuList] = useState<Danmaku[]>([]);
  const [danmakuEnabled, setDanmakuEnabled] = useState(true);
  const [resumePositionMs, setResumePositionMs] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);

  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  const [episodeTitle, setEpisodeTitle] = useState('');

  useEffect(() => {
    if (!dramaId) return;
    setLoading(true);
    getDramaDetail(dramaId)
      .then((detail: any) => {
        setDrama(detail);
        const epInfo = detail?.episodes?.find(
          (e: any) => e.episodeNumber === episodeNumber
        );
        if (epInfo) {
          setEpisodeTitle(epInfo.title || `第${episodeNumber}集`);
          return loadEpisodeData(epInfo.id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dramaId, episodeNumber]);

  async function loadEpisodeData(episodeId: number) {
    try {
      const ep = await getEpisodePlayInfo(episodeId);
      setEpisode(ep);

      if (ep?.lastPositionMs) {
        setResumePositionMs(ep.lastPositionMs);
      }

      const [danmakus, comms, interactionPoints] = await Promise.all([
        getDanmaku(episodeId).catch(() => []),
        getComments(dramaId, 0, 5).catch(() => ({ content: [] })),
        getEpisodeInteractions(episodeId).catch(() => []),
      ]);
      setDanmakuList(Array.isArray(danmakus) ? danmakus : []);
      const commentData = comms as any;
      setComments(Array.isArray(commentData) ? commentData : (commentData?.content || []));
      setInteractions(Array.isArray(interactionPoints) ? interactionPoints : []);
    } catch (err) {
      console.error('Failed to load episode data:', err);
    }
  }

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!episode) return;
    const fetchOnline = () => {
      getOnlineCount(episode.id)
        .then((count) => setOnlineCount(typeof count === 'number' ? count : 0))
        .catch(() => {});
    };
    fetchOnline();
    const timer = setInterval(fetchOnline, 30000);
    return () => clearInterval(timer);
  }, [episode]);

  const handleTimeUpdate = useCallback((timeMs: number) => {
    setCurrentTimeMs(timeMs);
  }, []);

  useEffect(() => {
    if (!episode || !isLoggedIn) return;

    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      reportProgress(episode.id, currentTimeMs, false).catch(() => {});
    }, 15000);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [episode, isLoggedIn, currentTimeMs]);

  const handleEnded = useCallback(() => {
    if (!episode || !drama) return;

    reportProgress(episode.id, currentTimeMs, true).catch(() => {});

    if (episodeNumber < drama.totalEpisodes) {
      router.push(`/drama/${dramaId}/play?ep=${episodeNumber + 1}`);
    }
  }, [episode, drama, episodeNumber, dramaId, currentTimeMs, router]);

  const handleInteractionAnswer = useCallback(
    (interactionId: number, optionId: number, emojiReaction?: string, isSend?: boolean) => {
      submitAnswer(interactionId, optionId, emojiReaction, isSend).catch(() => {});
    },
    []
  );

  const handleSendDanmaku = useCallback(
    (content: string) => {
      if (!episode || !isLoggedIn) return;
      sendDanmakuApi(episode.id, content, currentTimeMs)
        .then((newDanmaku) => {
          setDanmakuList((prev) => [...prev, newDanmaku]);
        })
        .catch(() => {});
    },
    [episode, isLoggedIn, currentTimeMs]
  );

  const handleCommentSubmit = useCallback(async () => {
    if (!commentText.trim() || submitting || !isLoggedIn) return;
    setSubmitting(true);
    try {
      const newComment = await postComment(dramaId, commentText.trim());
      setComments((prev) => [newComment, ...prev].slice(0, 5));
      setCommentText('');
    } catch {} finally {
      setSubmitting(false);
    }
  }, [commentText, submitting, dramaId, isLoggedIn]);

  const handleCommentLike = useCallback(
    async (commentId: number) => {
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
    },
    [isLoggedIn]
  );

  const handleAIGenerate = useCallback(async (type: 'branch' | 'continue') => {
    if (!episode || !isLoggedIn || aiLoading) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const fn = type === 'branch' ? generateBranch : generateContinue;
      const res = await fn(episode.id, aiPrompt || (type === 'branch' ? '生成剧情分支' : '续写剧情'));
      setAiResult(res?.data?.content || res?.content || res?.data || '生成成功');
    } catch {
      setAiResult('生成失败，请稍后重试');
    } finally {
      setAiLoading(false);
    }
  }, [episode, isLoggedIn, aiLoading, aiPrompt]);

  if (loading) {
    return <PlayPageSkeleton />;
  }

  if (!drama) {
    return (
      <div className="min-h-screen flex items-center justify-center text-drama-muted">
        加载失败
      </div>
    );
  }

  const episodes = Array.from({ length: drama.totalEpisodes }, (_, i) => i + 1);

  return (
    <div className="min-h-screen pb-12">
      <div className="relative bg-black">
        <div className="max-w-5xl mx-auto">
          {episode && (
            <>
              <VideoPlayer
                src={resolveUrl(episode.videoUrl)}
                streams={episode.streams?.map(s => ({ ...s, url: resolveUrl(s.url) }))}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                initialPosition={resumePositionMs}
              />
              <DanmakuLayer
                danmakuList={danmakuList}
                currentTimeMs={currentTimeMs}
                onSend={handleSendDanmaku}
                enabled={danmakuEnabled}
              />
              <InteractionOverlay
                interactions={interactions}
                currentTimeMs={currentTimeMs}
                onAnswer={handleInteractionAnswer}
                userId={useAuthStore.getState().user?.id}
                episodeId={episode?.id}
                danmakuList={danmakuList}
              />
            </>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 space-y-4 mt-4">
        <div className="flex items-center gap-2 mb-1">
          <Link
            href={`/drama/${drama.id}`}
            className="text-drama-muted hover:text-drama-text transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-medium text-drama-text truncate">
              {drama.title}
            </h1>
            <p className="text-xs text-drama-muted">
              第{episodeNumber}集{episodeTitle ? ` · ${episodeTitle}` : ''}{episode ? ` · ${formatDuration(episode.durationSeconds)}` : ''}
              {onlineCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-0.5">
                  <Users className="w-3 h-3" />
                  {onlineCount}人在线
                </span>
              )}
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-drama-text mb-2">选集</h3>
          <div className="flex gap-2 overflow-x-auto scrollbar-hidden pb-2">
            {episodes.map((ep) => (
              <Link
                key={ep}
                href={`/drama/${dramaId}/play?ep=${ep}`}
                className={cn(
                  'flex-shrink-0 px-4 py-2 rounded-lg text-sm transition-colors',
                  ep === episodeNumber
                    ? 'bg-primary-500 text-white font-medium'
                    : 'bg-drama-card text-drama-muted hover:text-drama-text hover:bg-drama-surface'
                )}
              >
                {ep}
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-drama-card rounded-xl p-4">
          <h3 className="text-sm font-medium text-drama-text mb-3 flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4" />
            热门评论
          </h3>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()}
              placeholder={isLoggedIn ? '说点什么...' : '登录后评论'}
              disabled={!isLoggedIn}
              onClick={() => { if (!isLoggedIn) router.push('/login'); }}
              className="flex-1 bg-drama-surface border border-drama-border rounded-lg px-3 py-2 text-sm text-drama-text placeholder:text-drama-muted outline-none focus:border-primary-400/50 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-pointer"
            />
            <button
              onClick={handleCommentSubmit}
              disabled={submitting || !commentText.trim()}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-drama-surface disabled:text-drama-muted text-white text-sm rounded-lg transition-colors flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {comments.length === 0 && (
              <p className="text-center text-drama-muted text-sm py-4">暂无评论</p>
            )}
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 py-1">
                <div className="w-7 h-7 rounded-full bg-drama-surface flex items-center justify-center flex-shrink-0 text-xs text-drama-muted">
                  {comment.username?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-drama-text">{comment.username}</span>
                    <span className="text-xs text-drama-muted">{formatTimeAgo(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-drama-text/90">{comment.content}</p>
                  <button
                    onClick={() => handleCommentLike(comment.id)}
                    className={cn(
                      'flex items-center gap-1 text-xs mt-1 transition-colors',
                      comment.isLiked ? 'text-primary-400' : 'text-drama-muted hover:text-primary-400'
                    )}
                  >
                    <ThumbsUp className="w-3 h-3" />
                    {comment.likeCount > 0 && comment.likeCount}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Link
            href={`/drama/${dramaId}`}
            className="flex items-center justify-center gap-1 text-xs text-primary-400 hover:text-primary-300 mt-3 pt-2 border-t border-drama-border/50 transition-colors"
          >
            查看全部评论
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-drama-card rounded-xl p-4">
          <button
            onClick={() => setShowAiPanel(!showAiPanel)}
            className="w-full flex items-center justify-between"
          >
            <h3 className="text-sm font-medium text-drama-text flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary-400" />
              AI剧情生成
            </h3>
            <ChevronRight className={cn('w-4 h-4 text-drama-muted transition-transform', showAiPanel && 'rotate-90')} />
          </button>

          {showAiPanel && (
            <div className="mt-3 space-y-3">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="输入你想要的剧情方向..."
                className="w-full bg-drama-surface border border-drama-border rounded-lg px-3 py-2 text-sm text-drama-text placeholder:text-drama-muted outline-none focus:border-primary-400/50 transition-colors"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleAIGenerate('branch')}
                  disabled={aiLoading || !isLoggedIn}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-drama-surface disabled:text-drama-muted text-white text-sm rounded-lg transition-colors"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  {aiLoading ? '生成中...' : '生成分支'}
                </button>
                <button
                  onClick={() => handleAIGenerate('continue')}
                  disabled={aiLoading || !isLoggedIn}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-drama-surface hover:bg-drama-border text-drama-text text-sm rounded-lg transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {aiLoading ? '生成中...' : '续写剧情'}
                </button>
              </div>
              {!isLoggedIn && (
                <p className="text-xs text-drama-muted text-center">登录后可使用AI剧情生成</p>
              )}
              {aiResult && (
                <div className="bg-drama-surface rounded-lg p-3 text-sm text-drama-text/90 whitespace-pre-wrap leading-relaxed">
                  {aiResult}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlayPageSkeleton() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="w-full aspect-video bg-black" />
      <div className="max-w-5xl mx-auto px-4 space-y-4 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-drama-card rounded" />
          <div className="flex-1 space-y-1">
            <div className="h-4 w-40 bg-drama-card rounded" />
            <div className="h-3 w-60 bg-drama-card rounded" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-12 bg-drama-card rounded" />
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-14 h-9 bg-drama-card rounded-lg flex-shrink-0" />
            ))}
          </div>
        </div>
        <div className="bg-drama-card rounded-xl p-4 space-y-3">
          <div className="h-4 w-20 bg-drama-surface rounded" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-7 h-7 bg-drama-surface rounded-full" />
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

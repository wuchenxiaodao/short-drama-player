'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Send,
  ThumbsUp,
  CornerDownRight,
  X,
  LogIn,
} from 'lucide-react';
import { getComments, postComment, toggleCommentLike } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth';
import type { Comment } from '@/lib/types';
import { formatTimeAgo, cn } from '@/lib/utils';

interface CommentSectionProps {
  dramaId: number;
}

type SortType = 'hot' | 'new';

export default function CommentSection({ dramaId }: CommentSectionProps) {
  const { isLoggedIn, user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [sort, setSort] = useState<SortType>('hot');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showInput, setShowInput] = useState(false);
  const [inputContent, setInputContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());

  const fetchComments = useCallback(
    async (pageNum: number, sortType: SortType, append: boolean) => {
      setLoading(true);
      try {
        const sortBy = sortType === 'hot' ? 'hot' : 'new';
        const data = await getComments(dramaId, pageNum, 20, sortBy);
        const list: Comment[] = Array.isArray(data) ? data : (data?.comments ?? []);
        if (append) {
          setComments((prev) => [...prev, ...list]);
        } else {
          setComments(list);
        }
        setHasMore(list.length >= 20);
      } catch {
        setHasMore(false);
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    },
    [dramaId]
  );

  useEffect(() => {
    setPage(1);
    setComments([]);
    setHasMore(true);
    setInitialLoading(true);
    fetchComments(1, sort, false);
  }, [sort, fetchComments]);

  function handleLoadMore() {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchComments(nextPage, sort, true);
  }

  async function handleSubmit() {
    if (!inputContent.trim() || submitting) return;

    setSubmitting(true);
    try {
      const newComment = await postComment(
        dramaId,
        inputContent.trim(),
        replyTo?.id
      );
      if (replyTo) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyTo.id
              ? {
                  ...c,
                  replyCount: c.replyCount + 1,
                  replies: [...(c.replies || []), newComment],
                }
              : c
          )
        );
      } else {
        setComments((prev) => [newComment, ...prev]);
      }
      setInputContent('');
      setShowInput(false);
      setReplyTo(null);
    } catch {
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLike(commentId: number) {
    if (!isLoggedIn) return;
    try {
      await toggleCommentLike(commentId);
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                isLiked: !c.isLiked,
                likeCount: c.isLiked ? c.likeCount - 1 : c.likeCount + 1,
              }
            : c
        )
      );
    } catch {}
  }

  function toggleReplies(commentId: number) {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  }

  function openReply(comment: Comment) {
    if (!isLoggedIn) return;
    setReplyTo(comment);
    setShowInput(true);
  }

  function openNewComment() {
    if (!isLoggedIn) return;
    setReplyTo(null);
    setShowInput(true);
  }

  if (initialLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse flex gap-3 p-4 bg-drama-card rounded-xl">
            <div className="w-10 h-10 bg-drama-surface rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-drama-surface rounded w-20" />
              <div className="h-4 bg-drama-surface rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary-400" />
          <span className="font-medium text-drama-text">
            评论 {comments.length > 0 ? `(${comments.length})` : ''}
          </span>
        </div>
        <button
          onClick={openNewComment}
          className="px-4 py-1.5 bg-primary-500/10 text-primary-400 text-sm rounded-lg hover:bg-primary-500/20 transition-colors"
        >
          写评论
        </button>
      </div>

      <div className="flex items-center gap-1 bg-drama-card rounded-lg p-1 w-fit">
        <button
          onClick={() => setSort('hot')}
          className={cn(
            'px-3 py-1 text-sm rounded transition-colors',
            sort === 'hot'
              ? 'bg-drama-surface text-primary-400'
              : 'text-drama-muted hover:text-drama-text'
          )}
        >
          最热
        </button>
        <button
          onClick={() => setSort('new')}
          className={cn(
            'px-3 py-1 text-sm rounded transition-colors',
            sort === 'new'
              ? 'bg-drama-surface text-primary-400'
              : 'text-drama-muted hover:text-drama-text'
          )}
        >
          最新
        </button>
      </div>

      {comments.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-10 h-10 text-drama-muted mx-auto mb-3" />
          <p className="text-drama-muted">暂无评论，快来抢沙发</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-drama-card rounded-xl p-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-primary-400">
                    {comment.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-drama-text">
                      {comment.username}
                    </span>
                    <span className="text-xs text-drama-muted">
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-drama-text/90 mb-2">{comment.content}</p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLike(comment.id)}
                      className={cn(
                        'flex items-center gap-1 text-xs transition-colors',
                        comment.isLiked
                          ? 'text-primary-400'
                          : 'text-drama-muted hover:text-primary-400'
                      )}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      {comment.likeCount > 0 && comment.likeCount}
                    </button>
                    <button
                      onClick={() => openReply(comment)}
                      className="flex items-center gap-1 text-xs text-drama-muted hover:text-drama-text transition-colors"
                    >
                      <CornerDownRight className="w-3.5 h-3.5" />
                      回复
                    </button>
                    {comment.replyCount > 0 && (
                      <button
                        onClick={() => toggleReplies(comment.id)}
                        className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                      >
                        {expandedReplies.has(comment.id) ? '收起回复' : `查看${comment.replyCount}条回复`}
                      </button>
                    )}
                  </div>

                  {expandedReplies.has(comment.id) &&
                    comment.replies &&
                    comment.replies.length > 0 && (
                      <div className="mt-3 pl-4 border-l border-drama-border/50 space-y-3">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex gap-2">
                            <div className="w-7 h-7 rounded-full bg-drama-surface flex items-center justify-center flex-shrink-0">
                              <span className="text-xs text-drama-muted">
                                {reply.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs font-medium text-drama-text">
                                  {reply.username}
                                </span>
                                <span className="text-xs text-drama-muted">
                                  {formatTimeAgo(reply.createdAt)}
                                </span>
                              </div>
                              <p className="text-xs text-drama-text/90">{reply.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            </div>
          ))}

          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="w-full py-3 text-sm text-drama-muted hover:text-drama-text bg-drama-card rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? '加载中...' : '加载更多'}
            </button>
          )}
        </div>
      )}

      {showInput && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-2xl bg-drama-card border-t border-drama-border rounded-t-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-drama-text">
                {replyTo ? `回复 ${replyTo.username}` : '写评论'}
              </span>
              <button
                onClick={() => {
                  setShowInput(false);
                  setReplyTo(null);
                  setInputContent('');
                }}
                className="text-drama-muted hover:text-drama-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {!isLoggedIn ? (
              <div className="text-center py-4">
                <p className="text-drama-muted text-sm mb-3">登录后即可评论</p>
                <a
                  href="/login"
                  className="inline-flex items-center gap-1 px-4 py-2 bg-primary-500 text-white text-sm rounded-lg"
                >
                  <LogIn className="w-4 h-4" />
                  去登录
                </a>
              </div>
            ) : (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-primary-400">
                    {user?.nickname?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <textarea
                    value={inputContent}
                    onChange={(e) => setInputContent(e.target.value)}
                    placeholder={replyTo ? `回复 ${replyTo.username}...` : '说点什么...'}
                    rows={3}
                    className="w-full px-3 py-2 bg-drama-surface border border-drama-border rounded-xl text-drama-text placeholder:text-drama-muted focus:outline-none focus:border-primary-500 resize-none text-sm transition-colors"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={handleSubmit}
                      disabled={!inputContent.trim() || submitting}
                      className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm rounded-lg hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {submitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          发送
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

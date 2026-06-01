'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star } from 'lucide-react';
import { submitRating, getUserRating, getRatingStats } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth';

interface RatingInputProps {
  dramaId: number;
  currentRating?: number;
  onRate?: (score: number) => void;
}

export default function RatingInput({ dramaId, currentRating, onRate }: RatingInputProps) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [userScore, setUserScore] = useState<number | null>(currentRating ?? null);
  const [hoverScore, setHoverScore] = useState<number | null>(null);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [ratingCount, setRatingCount] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getRatingStats(dramaId)
      .then((res: any) => {
        setAvgRating(res.averageScore ?? 0);
        setRatingCount(res.ratingCount ?? 0);
      })
      .catch(() => {});
  }, [dramaId]);

  useEffect(() => {
    if (!isLoggedIn) return;
    getUserRating(dramaId)
      .then((res: any) => {
        if (res?.score != null) {
          setUserScore(res.score);
        }
      })
      .catch(() => {});
  }, [dramaId, isLoggedIn]);

  const handleClick = useCallback(
    async (score: number) => {
      if (!isLoggedIn || submitting) return;
      setSubmitting(true);
      try {
        await submitRating(dramaId, score);
        setUserScore(score);
        onRate?.(score);
        const stats = await getRatingStats(dramaId);
        setAvgRating(stats.averageScore ?? 0);
        setRatingCount(stats.ratingCount ?? 0);
      } catch {} finally {
        setSubmitting(false);
      }
    },
    [dramaId, isLoggedIn, submitting, onRate]
  );

  const displayScore = hoverScore ?? userScore ?? 0;

  const stars = Array.from({ length: 5 }, (_, i) => {
    const starBase = (i + 1) * 2;
    const prevBase = i * 2;
    const fill = displayScore >= starBase ? 'full' : displayScore >= prevBase + 1 ? 'half' : 'empty';
    return { index: i, fill };
  });

  return (
    <div className="bg-drama-card rounded-xl p-4">
      <h3 className="text-sm font-medium text-drama-text mb-3">评分</h3>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          {stars.map(({ index, fill }) => (
            <div
              key={index}
              className="relative cursor-pointer"
              onMouseEnter={() => setHoverScore((index + 1) * 2)}
              onMouseLeave={() => setHoverScore(null)}
              onClick={() => handleClick((index + 1) * 2)}
            >
              <Star
                className="w-7 h-7 text-drama-muted/30"
                fill="currentColor"
                strokeWidth={0}
              />
              {fill === 'full' && (
                <Star
                  className="absolute inset-0 w-7 h-7 text-yellow-400"
                  fill="currentColor"
                  strokeWidth={0}
                />
              )}
              {fill === 'half' && (
                <div className="absolute inset-0 w-1/2 overflow-hidden">
                  <Star
                    className="w-7 h-7 text-yellow-400"
                    fill="currentColor"
                    strokeWidth={0}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-drama-text">
            {avgRating > 0 ? avgRating.toFixed(1) : '--'}
          </span>
          <span className="text-xs text-drama-muted">{ratingCount}人评分</span>
        </div>
      </div>
      {userScore != null && (
        <p className="text-xs text-primary-400 mt-2">我的评分：{userScore}分</p>
      )}
      {!isLoggedIn && (
        <p className="text-xs text-drama-muted mt-2">登录后即可评分</p>
      )}
    </div>
  );
}

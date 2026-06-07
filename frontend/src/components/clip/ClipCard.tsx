'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Heart, Share2, Film } from 'lucide-react';
import { resolveUrl, recordClipPlay, recordClipClick, recordClipLike } from '@/lib/api-client';
import type { HighlightClip } from '@/lib/types';

interface ClipCardProps {
  clip: HighlightClip;
  isActive: boolean;
  onWatchFull?: (clip: HighlightClip) => void;
}

const TAG_COLORS: Record<string, string> = {
  SWEET: 'bg-pink-500',
  THRILL: 'bg-red-500',
  FUNNY: 'bg-yellow-500',
  SHOCK: 'bg-purple-500',
  ANGRY: 'bg-orange-500',
  SAD: 'bg-blue-400',
};

export default function ClipCard({ clip, isActive, onWatchFull }: ClipCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [liked, setLiked] = useState(false);
  const [hasReportedView, setHasReportedView] = useState(false);

  const videoSrc = resolveUrl(clip.clipUrl);
  const poster = resolveUrl(clip.coverUrl || clip.dramaCoverUrl);
  const start = clip.startTime || 0;
  const end = clip.endTime || 0;
  const duration = end > start ? end - start : 30;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.currentTime = start;
    } else {
      video.pause();
      setPlaying(false);
    }
  }, [isActive, start]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const elapsed = video.currentTime - start;
    setProgress(Math.min(100, Math.max(0, (elapsed / duration) * 100)));
    const remaining = end - video.currentTime;
    if (remaining <= 5 && remaining > 0) {
      setCountdown(Math.ceil(remaining));
    } else {
      setCountdown(0);
    }
    if (end > 0 && video.currentTime >= end) {
      video.pause();
      setPlaying(false);
    }
  }, [start, end, duration]);

  const togglePlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      if (end > 0 && video.currentTime >= end) {
        video.currentTime = start;
      }
      try {
        await video.play();
        setPlaying(true);
        if (!hasReportedView) {
          recordClipPlay(clip.id).catch(() => {});
          setHasReportedView(true);
        }
      } catch {}
    } else {
      video.pause();
      setPlaying(false);
    }
  }, [clip.id, start, end, hasReportedView]);

  const handleLike = useCallback(() => {
    setLiked(true);
    recordClipLike(clip.id).catch(() => {});
  }, [clip.id]);

  const handleClickThrough = useCallback(() => {
    recordClipClick(clip.id).catch(() => {});
    onWatchFull?.(clip);
  }, [clip.id, clip, onWatchFull]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: clip.title,
        text: `快来看《${clip.dramaTitle}》的精彩片段！`,
        url: `${location.origin}/drama/${clip.dramaId}`,
      }).catch(() => {});
    }
  }, [clip]);

  return (
    <div className="clip-card" onClick={togglePlay}>
      <video
        ref={videoRef}
        src={videoSrc}
        poster={poster}
        className="clip-video"
        playsInline
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
      />

      {!playing && (
        <div className="clip-overlay">
          <div className="clip-play-btn">
            <Play className="w-7 h-7 text-white ml-1" />
          </div>
        </div>
      )}

      <div className="clip-progress">
        <div className="clip-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {countdown > 0 && (
        <div className="clip-countdown">{countdown}s</div>
      )}

      <div className="clip-info">
        <span className={`clip-tag ${TAG_COLORS[clip.tag] || 'bg-gray-500'}`}>
          {clip.tagLabel}
        </span>
        <h3 className="clip-title">{clip.title || '精彩片段'}</h3>
        <p className="clip-drama">{clip.dramaTitle}</p>
      </div>

      <div className="clip-actions" onClick={(e) => e.stopPropagation()}>
        <button className="btn-watch-full" onClick={handleClickThrough}>
          <Film className="w-4 h-4" />
          从第1集看
        </button>
        <button
          className={`btn-action ${liked ? 'liked' : ''}`}
          onClick={handleLike}
        >
          <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
        </button>
        <button className="btn-action" onClick={handleShare}>
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

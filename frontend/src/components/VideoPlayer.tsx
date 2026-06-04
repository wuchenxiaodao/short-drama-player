'use client';

import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  Settings,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import type { Stream } from '@/lib/types';

interface VideoPlayerProps {
  src: string;
  streams?: Stream[];
  onTimeUpdate?: (timeMs: number) => void;
  onEnded?: () => void;
  initialPosition?: number;
}

export interface VideoPlayerHandle {
  slowDown: () => void;
  restoreSpeed: () => void;
}

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
const QUALITY_OPTIONS: Stream['quality'][] = ['720p', '1080p'];
const HIDE_DELAY = 3000;
const SEEK_STEP = 5;

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(function VideoPlayer(
  { src, streams, onTimeUpdate, onEnded, initialPosition },
  ref
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastClickRef = useRef<number>(0);

  useImperativeHandle(ref, () => ({
    slowDown: () => {
      const video = videoRef.current;
      if (video) video.playbackRate = 0.3;
    },
    restoreSpeed: () => {
      const video = videoRef.current;
      if (video) video.playbackRate = parseFloat(localStorage.getItem('video-speed') || '1');
    },
  }));

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(() => {
    if (typeof window === 'undefined') return 1.0;
    const saved = localStorage.getItem('video-speed');
    return saved ? parseFloat(saved) : 1.0;
  });
  const [quality, setQuality] = useState<Stream['quality']>('1080p');
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsMobile('ontouchstart' in window);
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (initialPosition && initialPosition > 0) {
      setShowResume(true);
    }
  }, [initialPosition]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    function handlePlay() { setPlaying(true); }
    function handlePause() { setPlaying(false); }
    function handleTimeUpdate() {
      if (!video) return;
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(Math.floor(video.currentTime * 1000));

      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    }
    function handleLoadedMetadata() {
      if (!video) return;
      setDuration(video.duration);
    }
    function handleEnded() {
      setPlaying(false);
      onEnded?.();
    }

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onTimeUpdate, onEnded]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = speed;
    }
    localStorage.setItem('video-speed', speed.toString());
  }, [speed]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = muted ? 0 : volume;
    }
  }, [volume, muted]);

  useEffect(() => {
    function handleFullscreenChange() {
      setFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const video = videoRef.current;
      if (!video) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - SEEK_STEP);
          break;
        case 'ArrowRight':
          e.preventDefault();
          video.currentTime = Math.min(video.duration, video.currentTime + SEEK_STEP);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume((v) => {
            const next = Math.min(1, v + 0.1);
            setMuted(false);
            return next;
          });
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume((v) => Math.max(0, v - 0.1));
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'm':
          setMuted((m) => !m);
          break;
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (playing) {
      hideTimerRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
        setShowQualityMenu(false);
      }, HIDE_DELAY);
    }
  }, [playing]);

  useEffect(() => {
    if (!playing) {
      setShowControls(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      return;
    }
    resetHideTimer();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [playing, resetHideTimer]);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }

  function toggleFullscreen() {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      container.requestFullscreen().catch(() => {});
    }
  }

  function handleResume() {
    const video = videoRef.current;
    if (video && initialPosition) {
      video.currentTime = initialPosition / 1000;
    }
    setShowResume(false);
    togglePlay();
  }

  function handleResumeFromStart() {
    setShowResume(false);
    togglePlay();
  }

  function handleProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    const video = videoRef.current;
    const bar = e.currentTarget;
    if (!video || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = ratio * duration;
  }

  function handleProgressHover(e: React.MouseEvent<HTMLDivElement>) {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime(ratio * duration);
    setHoverX(e.clientX - rect.left);
  }

  function handleProgressMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    setDragging(true);
    handleProgressClick(e);

    function onMouseMove(ev: MouseEvent) {
      const video = videoRef.current;
      const bar = e.currentTarget as HTMLDivElement;
      if (!video || !duration) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      video.currentTime = ratio * duration;
    }

    function onMouseUp() {
      setDragging(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  function handleSpeedChange(s: number) {
    setSpeed(s);
    setShowSpeedMenu(false);
  }

  function handleQualityChange(q: Stream['quality']) {
    setQuality(q);
    setShowQualityMenu(false);

    if (streams) {
      const stream = streams.find((s) => s.quality === q);
      if (stream && videoRef.current) {
        const wasPlaying = !videoRef.current.paused;
        const currentPos = videoRef.current.currentTime;
        videoRef.current.src = stream.url;
        videoRef.current.currentTime = currentPos;
        if (wasPlaying) {
          videoRef.current.play().catch(() => {});
        }
      }
    }
  }

  function handleVideoClick() {
    const now = Date.now();
    if (now - lastClickRef.current < 300) {
      toggleFullscreen();
    } else {
      togglePlay();
    }
    lastClickRef.current = now;
  }

  function handleVolumeSlider(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (v > 0) setMuted(false);
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  const simplified = isMobile && isPortrait;

  return (
    <div
      ref={containerRef}
      className="video-player-container relative bg-black select-none"
      onMouseMove={resetHideTimer}
      onMouseLeave={() => { if (playing) setShowControls(false); }}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        playsInline
        onClick={handleVideoClick}
      />

      {showResume && initialPosition && initialPosition > 0 && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/70 to-transparent p-3 flex items-center justify-between">
          <span className="text-sm text-white">
            上次播放到 {formatTime(initialPosition / 1000)}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResumeFromStart}
              className="px-3 py-1 text-xs text-white/80 hover:text-white border border-white/30 rounded-md transition-colors"
            >
              从头播放
            </button>
            <button
              onClick={handleResume}
              className="px-3 py-1 text-xs text-white bg-primary-500 hover:bg-primary-600 rounded-md transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              继续播放
            </button>
          </div>
        </div>
      )}

      <div
        className={`video-controls transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="video-progress-bar mb-2 group"
          onClick={handleProgressClick}
          onMouseMove={handleProgressHover}
          onMouseLeave={() => setHoverTime(null)}
          onMouseDown={handleProgressMouseDown}
        >
          <div
            className="absolute top-0 left-0 h-full bg-white/20 rounded-l"
            style={{ width: `${bufferedPercent}%` }}
          />
          <div
            className="video-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
          {hoverTime !== null && (
            <div
              className="absolute -top-7 px-1.5 py-0.5 bg-black/80 text-white text-xs rounded transform -translate-x-1/2 pointer-events-none"
              style={{ left: `${hoverX}px` }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button onClick={togglePlay} className="text-white hover:text-primary-400 transition-colors">
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>

            <span className="text-xs text-white/80 tabular-nums min-w-[80px]">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {!simplified && (
              <div className="flex items-center gap-1 group/vol">
                <button
                  onClick={() => setMuted((m) => !m)}
                  className="text-white hover:text-primary-400 transition-colors"
                >
                  <VolumeIcon className="w-4 h-4" />
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={muted ? 0 : volume}
                  onChange={handleVolumeSlider}
                  className="w-16 h-1 accent-primary-500 cursor-pointer opacity-0 group-hover/vol:opacity-100 transition-opacity"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!simplified && (
              <>
                <div className="relative">
                  <button
                    onClick={() => { setShowSpeedMenu(!showSpeedMenu); setShowQualityMenu(false); }}
                    className="text-xs text-white/80 hover:text-white px-1.5 py-0.5 rounded transition-colors"
                  >
                    {speed}x
                  </button>
                  {showSpeedMenu && (
                    <div className="absolute bottom-full right-0 mb-2 bg-drama-card/95 backdrop-blur-md border border-drama-border rounded-lg py-1 min-w-[80px]">
                      {SPEED_OPTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSpeedChange(s)}
                          className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                            speed === s ? 'text-primary-400 bg-primary-500/10' : 'text-drama-text hover:bg-drama-surface'
                          }`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {streams && streams.length > 1 && (
                  <div className="relative">
                    <button
                      onClick={() => { setShowQualityMenu(!showQualityMenu); setShowSpeedMenu(false); }}
                      className="text-xs text-white/80 hover:text-white px-1.5 py-0.5 rounded transition-colors"
                    >
                      {quality}
                    </button>
                    {showQualityMenu && (
                      <div className="absolute bottom-full right-0 mb-2 bg-drama-card/95 backdrop-blur-md border border-drama-border rounded-lg py-1 min-w-[80px]">
                        {QUALITY_OPTIONS.filter((q) => streams.some((s) => s.quality === q)).map((q) => (
                          <button
                            key={q}
                            onClick={() => handleQualityChange(q)}
                            className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                              quality === q ? 'text-primary-400 bg-primary-500/10' : 'text-drama-text hover:bg-drama-surface'
                            }`}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            <button onClick={toggleFullscreen} className="text-white hover:text-primary-400 transition-colors">
              {fullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {!playing && !showResume && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
      )}
    </div>
  );
});

export default VideoPlayer;

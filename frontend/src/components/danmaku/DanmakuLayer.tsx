'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MessageCircle, X, Send, Settings } from 'lucide-react';
import type { Danmaku } from '@/lib/types';
import { useAuthStore } from '@/lib/auth';

interface DanmakuLayerProps {
  danmakuList: Danmaku[];
  currentTimeMs: number;
  onSend?: (content: string) => void;
  enabled: boolean;
}

interface ActiveDanmaku {
  id: number;
  content: string;
  track: number;
  color?: string;
  createdAt: number;
}

const TRACK_COUNT = 5;
const DANMAKU_DURATION = 3500;
const WINDOW_MS = 3000;

export default function DanmakuLayer({ danmakuList, currentTimeMs, onSend, enabled }: DanmakuLayerProps) {
  const [showInput, setShowInput] = useState(false);
  const [inputText, setInputText] = useState('');
  const [activeDanmaku, setActiveDanmaku] = useState<ActiveDanmaku[]>([]);
  const [danmakuEnabled, setDanmakuEnabled] = useState(() => {
    if (typeof window === 'undefined') return enabled;
    const saved = localStorage.getItem('danmaku-enabled');
    return saved !== null ? saved === 'true' : enabled;
  });
  const lastTimeRef = useRef(0);
  const shownIdsRef = useRef<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const trackEndTimes = useRef<number[]>(new Array(TRACK_COUNT).fill(0));

  const toggleDanmaku = useCallback(() => {
    setDanmakuEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('danmaku-enabled', String(next));
      return next;
    });
  }, []);

  const [showSettings, setShowSettings] = useState(false);
  const [danmakuOpacity, setDanmakuOpacity] = useState(() => {
    if (typeof window === 'undefined') return 0.8;
    return parseFloat(localStorage.getItem('danmaku-opacity') || '0.8');
  });
  const [danmakuFontSize, setDanmakuFontSize] = useState(() => {
    if (typeof window === 'undefined') return 16;
    return parseInt(localStorage.getItem('danmaku-font-size') || '16');
  });

  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  const allocateTrack = useCallback(() => {
    const now = Date.now();
    let bestTrack = 0;
    let earliestEnd = Infinity;
    for (let i = 0; i < TRACK_COUNT; i++) {
      if (trackEndTimes.current[i] <= now) {
        bestTrack = i;
        break;
      }
      if (trackEndTimes.current[i] < earliestEnd) {
        earliestEnd = trackEndTimes.current[i];
        bestTrack = i;
      }
    }
    trackEndTimes.current[bestTrack] = now + DANMAKU_DURATION * 0.3;
    return bestTrack;
  }, []);

  const visibleDanmaku = useMemo(() => {
    return danmakuList.filter((d) => {
      const diff = currentTimeMs - d.positionMs;
      return diff >= 0 && diff < WINDOW_MS;
    });
  }, [danmakuList, currentTimeMs]);

  useEffect(() => {
    if (!danmakuEnabled) return;

    const newDanmaku = visibleDanmaku.filter(
      (d) => !shownIdsRef.current.has(d.id)
    );
    if (newDanmaku.length === 0) return;

    const items = newDanmaku.map((d) => ({
      id: d.id,
      content: d.content,
      track: allocateTrack(),
      color: (d as any).color,
      createdAt: Date.now(),
    }));

    setActiveDanmaku((prev) => [...prev, ...items]);
    newDanmaku.forEach((d) => shownIdsRef.current.add(d.id));
  }, [visibleDanmaku, danmakuEnabled, allocateTrack]);

  useEffect(() => {
    const timer = setInterval(() => {
      const cutoff = Date.now() - DANMAKU_DURATION;
      setActiveDanmaku((prev) => prev.filter((d) => d.createdAt > cutoff));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (Math.abs(currentTimeMs - lastTimeRef.current) > 5000) {
      shownIdsRef.current = new Set();
      setActiveDanmaku([]);
    }
    lastTimeRef.current = currentTimeMs;
  }, [currentTimeMs]);

  function handleSend() {
    if (!inputText.trim()) return;
    onSend?.(inputText.trim());
    setInputText('');
    setShowInput(false);
  }

  return (
    <>
      <style jsx global>{`
        @keyframes danmakuScroll {
          from { transform: translateX(100%); }
          to { transform: translateX(-100vw); }
        }
      `}</style>
      <div
        ref={containerRef}
        className="danmaku-layer"
        style={{ opacity: danmakuEnabled ? danmakuOpacity : 0 }}
      >
        {activeDanmaku.map((d) => (
          <div
            key={d.id}
            className="absolute whitespace-nowrap text-white text-base font-bold pointer-events-none"
            style={{
              top: `${(d.track / TRACK_COUNT) * 100}%`,
              right: 0,
              animation: `danmakuScroll ${DANMAKU_DURATION}ms linear forwards`,
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              color: d.color || 'white',
              fontSize: `${danmakuFontSize}px`,
            }}
          >
            {d.content}
          </div>
        ))}
      </div>

      <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
        <button
          onClick={toggleDanmaku}
          className={`px-2 py-1 text-xs rounded-md transition-colors ${
            danmakuEnabled
              ? 'bg-drama-card/80 text-drama-text'
              : 'bg-drama-card/80 text-drama-muted line-through'
          }`}
        >
          弹幕{danmakuEnabled ? '开' : '关'}
        </button>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-1.5 rounded-md bg-drama-card/80 text-drama-text hover:text-primary-400 transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            if (!isLoggedIn) {
              window.location.href = '/login';
              return;
            }
            setShowInput(!showInput);
          }}
          className="p-1.5 rounded-md bg-drama-card/80 text-drama-text hover:text-primary-400 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
        </button>
      </div>

      {showSettings && (
        <div className="absolute top-10 right-3 z-30 bg-drama-card/95 backdrop-blur-md rounded-lg p-3 border border-drama-border w-48 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-drama-muted">透明度</span>
            <span className="text-xs text-drama-text">{Math.round(danmakuOpacity * 100)}%</span>
          </div>
          <input type="range" min={0.2} max={1} step={0.1} value={danmakuOpacity}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setDanmakuOpacity(v);
              localStorage.setItem('danmaku-opacity', String(v));
            }}
            className="w-full h-1 accent-primary-500"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-drama-muted">字号</span>
            <span className="text-xs text-drama-text">{danmakuFontSize}px</span>
          </div>
          <input type="range" min={12} max={24} step={2} value={danmakuFontSize}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              setDanmakuFontSize(v);
              localStorage.setItem('danmaku-font-size', String(v));
            }}
            className="w-full h-1 accent-primary-500"
          />
        </div>
      )}

      {showInput && (
        <div className="absolute bottom-16 left-0 right-0 z-30 px-3">
          <div className="flex items-center gap-2 bg-drama-card/95 backdrop-blur-md rounded-lg p-2 border border-drama-border">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="发送弹幕..."
              className="flex-1 bg-transparent text-sm text-drama-text placeholder:text-drama-muted outline-none"
              maxLength={50}
              autoFocus
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="p-1.5 text-primary-400 hover:text-primary-300 disabled:text-drama-muted transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowInput(false)}
              className="p-1.5 text-drama-muted hover:text-drama-text transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

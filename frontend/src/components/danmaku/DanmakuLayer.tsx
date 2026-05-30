'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import type { Danmaku } from '@/lib/types';
import { useAuthStore } from '@/lib/auth';

interface DanmakuLayerProps {
  danmakuList: Danmaku[];
  currentTimeMs: number;
  onSend?: (content: string) => void;
  enabled: boolean;
}

interface ActiveDanmaku extends Danmaku {
  track: number;
  startTime: number;
}

const TRACK_COUNT = 5;
const DANMAKU_DURATION = 8000;
const WINDOW_MS = 3000;

export default function DanmakuLayer({ danmakuList, currentTimeMs, onSend, enabled }: DanmakuLayerProps) {
  const [showInput, setShowInput] = useState(false);
  const [inputText, setInputText] = useState('');
  const [activeDanmaku, setActiveDanmaku] = useState<ActiveDanmaku[]>([]);
  const [danmakuEnabled, setDanmakuEnabled] = useState(enabled);
  const lastTimeRef = useRef(0);
  const shownIdsRef = useRef<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  const visibleDanmaku = useMemo(() => {
    return danmakuList.filter((d) => {
      const diff = currentTimeMs - d.positionMs;
      return diff >= 0 && diff < WINDOW_MS;
    });
  }, [danmakuList, currentTimeMs]);

  useEffect(() => {
    if (!danmakuEnabled) return;

    const newDanmaku: ActiveDanmaku[] = [];
    visibleDanmaku.forEach((d) => {
      if (shownIdsRef.current.has(d.id)) return;
      shownIdsRef.current.add(d.id);

      const track = Math.floor(Math.random() * TRACK_COUNT);
      newDanmaku.push({ ...d, track, startTime: Date.now() });
    });

    if (newDanmaku.length > 0) {
      setActiveDanmaku((prev) => [...prev, ...newDanmaku]);
    }
  }, [visibleDanmaku, danmakuEnabled]);

  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setActiveDanmaku((prev) => {
        const filtered = prev.filter((d) => now - d.startTime < DANMAKU_DURATION);
        if (filtered.length !== prev.length) {
          const currentIds = new Set(filtered.map((d) => d.id));
          shownIdsRef.current = currentIds;
        }
        return filtered;
      });
    }, 1000);
    return () => clearInterval(cleanup);
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
      <div
        ref={containerRef}
        className="danmaku-layer"
        style={{ opacity: danmakuEnabled ? 1 : 0 }}
      >
        {activeDanmaku.map((d) => {
          const elapsed = Date.now() - d.startTime;
          const progress = elapsed / DANMAKU_DURATION;
          const trackHeight = 100 / TRACK_COUNT;
          const topPercent = d.track * trackHeight + 2;

          return (
            <span
              key={`${d.id}-${d.startTime}`}
              className="danmaku-item"
              style={{
                top: `${topPercent}%`,
                left: 0,
                transform: `translateX(${(1 - progress) * 100 - 0}%)`,
                transformOrigin: 'left center',
                whiteSpace: 'nowrap',
                position: 'absolute',
                color: '#fff',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)',
                fontSize: '14px',
                lineHeight: '1.5',
                pointerEvents: 'none',
                willChange: 'transform',
                transition: 'none',
                animation: 'none',
              }}
            >
              {d.content}
            </span>
          );
        })}
      </div>

      <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
        <button
          onClick={() => setDanmakuEnabled(!danmakuEnabled)}
          className={`px-2 py-1 text-xs rounded-md transition-colors ${
            danmakuEnabled
              ? 'bg-drama-card/80 text-drama-text'
              : 'bg-drama-card/80 text-drama-muted line-through'
          }`}
        >
          弹幕{danmakuEnabled ? '开' : '关'}
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

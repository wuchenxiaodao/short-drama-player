'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/* ------------------------------------------------------------------ */
/*  Configurable time parameters                                       */
/* ------------------------------------------------------------------ */

const EMOJI_CONFIG = {
  /** How long a single floating emoji animates (seconds) */
  floatDuration: { min: 3, max: 5 },
  /** Bottom bar visible duration (ms) */
  barDurationMs: 5000,
  /** Bar show/hide transition duration (ms) */
  barTransitionMs: 300,
  /** Like flash duration (ms) */
  likeFlashMs: 400,
  /** Particle burst duration (ms) */
  particleDurationMs: 600,
  /** Max simultaneous floating emojis */
  maxFloating: 8,
};

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FloatingEmoji {
  id: number;
  emoji: string;
  x: number;
  startY: number;
  size: number;
  duration: number;
  swayAmount: number;
  swayDir: number;
  liked: boolean;
}

interface EmojiRainLayerProps {
  emojis: string[];
  episodeId: number;
  interactionId?: number;
  onSendEmoji?: (emoji: string) => void;
  onLikeEmoji?: (emoji: string) => void;
  /** The single emoji to display right now (from danmaku sentiment analysis) */
  currentEmoji?: string;
  /** Whether the bottom bar should show (controlled by parent: once per episode) */
  showBar?: boolean;
  /** Auto-hide bar after this many ms (default from config) */
  barDurationMs?: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const STORAGE_PREFIX = 'emoji-likes-';

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function loadCounts(episodeId: number, emojis: string[]): Map<string, number> {
  if (typeof window === 'undefined') return new Map();
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${episodeId}`);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, number>;
      const map = new Map<string, number>();
      emojis.forEach(e => map.set(e, parsed[e] ?? 0));
      return map;
    }
  } catch { /* ignore */ }
  return new Map(emojis.map(e => [e, 0]));
}

function saveCounts(episodeId: number, counts: Map<string, number>): void {
  if (typeof window === 'undefined') return;
  try {
    const obj: Record<string, number> = {};
    counts.forEach((v, k) => { obj[k] = v; });
    localStorage.setItem(`${STORAGE_PREFIX}${episodeId}`, JSON.stringify(obj));
  } catch { /* ignore */ }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function EmojiRainLayer({
  emojis,
  episodeId,
  onSendEmoji,
  onLikeEmoji,
  currentEmoji,
  showBar = true,
  barDurationMs = EMOJI_CONFIG.barDurationMs,
}: EmojiRainLayerProps) {
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [emojiCounts, setEmojiCounts] = useState<Map<string, number>>(() =>
    loadCounts(episodeId, emojis),
  );
  const [barVisible, setBarVisible] = useState(false);
  const [barHiding, setBarHiding] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [likeFlashIds, setLikeFlashIds] = useState<Set<number>>(new Set());
  const [particles, setParticles] = useState<
    { id: number; emoji: string; cx: number; cy: number; dx: number; dy: number }[]
  >([]);

  const nextId = useRef(0);
  const particleId = useRef(0);
  const barTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removeTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const flashTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const particleTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const barShownOnce = useRef(false);

  // ---- Spawn a single floating emoji ----
  const spawnEmoji = useCallback(
    (emoji: string) => {
      setFloatingEmojis(prev => {
        if (prev.length >= EMOJI_CONFIG.maxFloating) return prev;
        const id = nextId.current++;
        const fe: FloatingEmoji = {
          id,
          emoji,
          x: rand(15, 85),
          startY: rand(70, 90),
          size: rand(28, 40),
          duration: rand(EMOJI_CONFIG.floatDuration.min, EMOJI_CONFIG.floatDuration.max),
          swayAmount: rand(20, 50),
          swayDir: Math.random() > 0.5 ? 1 : -1,
          liked: false,
        };

        const timer = setTimeout(() => {
          setFloatingEmojis(p => p.filter(e => e.id !== id));
          removeTimers.current.delete(id);
        }, fe.duration * 1000 + 200);
        removeTimers.current.set(id, timer);

        return [...prev, fe];
      });
    },
    [],
  );

  // ---- Show single emoji when currentEmoji changes ----
  useEffect(() => {
    if (!currentEmoji) return;
    spawnEmoji(currentEmoji);
  }, [currentEmoji, spawnEmoji]);

  // ---- Show bottom bar once, auto-hide after barDurationMs ----
  useEffect(() => {
    if (!showBar || barShownOnce.current) return;
    barShownOnce.current = true;
    setBarVisible(true);

    barTimer.current = setTimeout(() => {
      setBarHiding(true);
      setTimeout(() => setBarVisible(false), EMOJI_CONFIG.barTransitionMs);
    }, barDurationMs);

    return () => {
      if (barTimer.current) clearTimeout(barTimer.current);
    };
  }, [showBar, barDurationMs]);

  // ---- Cleanup on unmount ----
  useEffect(() => {
    return () => {
      if (barTimer.current) clearTimeout(barTimer.current);
      removeTimers.current.forEach(t => clearTimeout(t));
      flashTimers.current.forEach(t => clearTimeout(t));
      particleTimers.current.forEach(t => clearTimeout(t));
    };
  }, []);

  // ---- Like a floating emoji ----
  const handleLike = useCallback(
    (fe: FloatingEmoji) => {
      if (likedIds.has(fe.id)) return;

      setLikedIds(prev => new Set(prev).add(fe.id));

      // Flash animation
      setLikeFlashIds(prev => new Set(prev).add(fe.id));
      const flashTimer = setTimeout(() => {
        setLikeFlashIds(prev => {
          const next = new Set(prev);
          next.delete(fe.id);
          return next;
        });
        flashTimers.current.delete(fe.id);
      }, EMOJI_CONFIG.likeFlashMs);
      flashTimers.current.set(fe.id, flashTimer);

      // Update counts
      setEmojiCounts(prev => {
        const next = new Map(prev);
        next.set(fe.emoji, (next.get(fe.emoji) ?? 0) + 1);
        saveCounts(episodeId, next);
        return next;
      });

      // Spawn particles (6 sparkles)
      const angleStep = (Math.PI * 2) / 6;
      const newParticles = Array.from({ length: 6 }, (_, i) => {
        const angle = angleStep * i;
        const dist = rand(20, 35);
        const pid = particleId.current++;
        return {
          id: pid,
          emoji: '✨',
          cx: fe.x,
          cy: fe.startY,
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist,
        };
      });

      setParticles(prev => [...prev, ...newParticles]);
      newParticles.forEach(p => {
        const timer = setTimeout(() => {
          setParticles(prev => prev.filter(pp => pp.id !== p.id));
          particleTimers.current.delete(p.id);
        }, EMOJI_CONFIG.particleDurationMs);
        particleTimers.current.set(p.id, timer);
      });

      onLikeEmoji?.(fe.emoji);
    },
    [likedIds, episodeId, onLikeEmoji],
  );

  // ---- Send emoji from bar ----
  const handleSend = useCallback(
    (emoji: string) => {
      spawnEmoji(emoji);
      onSendEmoji?.(emoji);
    },
    [spawnEmoji, onSendEmoji],
  );

  // ---- Render ----
  return (
    <div style={styles.container}>
      {/* Floating emojis */}
      {floatingEmojis.map(fe => {
        const sway = fe.swayAmount * fe.swayDir;
        const isFlashing = likeFlashIds.has(fe.id);
        const isLiked = likedIds.has(fe.id);

        return (
          <div
            key={fe.id}
            onClick={() => handleLike(fe)}
            style={{
              ...styles.floatingEmoji,
              left: `${fe.x}%`,
              bottom: `${100 - fe.startY}%`,
              fontSize: `${fe.size}px`,
              ['--sway' as string]: `${sway}px`,
              animation: `emojiRainFloatUp ${fe.duration}s ease-out forwards`,
              ...(isFlashing
                ? {
                    transform: 'scale(1.8)',
                    filter: 'drop-shadow(0 0 8px #FFD700)',
                    transition: `transform ${EMOJI_CONFIG.likeFlashMs / 1000}s ease, filter ${EMOJI_CONFIG.likeFlashMs / 1000}s ease`,
                    zIndex: 11,
                  }
                : isLiked
                  ? { transition: `transform ${EMOJI_CONFIG.likeFlashMs / 1000}s ease, filter ${EMOJI_CONFIG.likeFlashMs / 1000}s ease` }
                  : {}),
              cursor: isLiked ? 'default' : 'pointer',
              pointerEvents: isLiked ? 'none' : 'auto',
            } as React.CSSProperties}
          >
            {fe.emoji}
          </div>
        );
      })}

      {/* Like particle bursts */}
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            ...styles.particle,
            left: `${p.cx}%`,
            bottom: `${100 - p.cy}%`,
            ['--dx' as string]: `${p.dx}px`,
            ['--dy' as string]: `${p.dy}px`,
            animation: `emojiRainParticleBurst ${EMOJI_CONFIG.particleDurationMs / 1000}s ease-out forwards`,
          } as React.CSSProperties}
        >
          {p.emoji}
        </div>
      ))}

      {/* Bottom quick button bar — shows once per episode */}
      {barVisible && (
        <div
          style={{
            ...styles.bar,
            animation: barHiding
              ? `emojiRainSlideDown ${EMOJI_CONFIG.barTransitionMs / 1000}s ease forwards`
              : `emojiRainSlideUp ${EMOJI_CONFIG.barTransitionMs / 1000}s ease forwards`,
          }}
        >
          {emojis.map((emoji, i) => (
            <button
              key={i}
              onClick={() => handleSend(emoji)}
              onContextMenu={e => e.preventDefault()}
              style={styles.barBtn}
            >
              <span style={styles.barBtnEmoji}>{emoji}</span>
              <span style={styles.barBtnCount}>
                {emojiCounts.get(emoji) ?? 0}
              </span>
            </button>
          ))}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: keyframesCSS }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 10,
    overflow: 'hidden',
  },
  floatingEmoji: {
    position: 'absolute',
    willChange: 'transform, opacity',
    pointerEvents: 'auto',
    userSelect: 'none',
    cursor: 'pointer',
    lineHeight: 1,
  },
  particle: {
    position: 'absolute',
    fontSize: '12px',
    pointerEvents: 'none',
    willChange: 'transform, opacity',
    zIndex: 12,
    lineHeight: 1,
  },
  bar: {
    position: 'absolute',
    bottom: '60px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '8px',
    padding: '8px 16px',
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    borderRadius: '24px',
    zIndex: 12,
    pointerEvents: 'auto',
  },
  barBtn: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '16px',
    padding: '6px 12px',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    touchAction: 'none',
  },
  barBtnEmoji: {
    fontSize: '24px',
    lineHeight: 1,
  },
  barBtnCount: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: '2px',
    transition: 'transform 0.2s ease',
  },
};

/* ------------------------------------------------------------------ */
/*  Keyframes CSS                                                      */
/* ------------------------------------------------------------------ */

const keyframesCSS = `
@keyframes emojiRainFloatUp {
  0% {
    transform: translateY(0) translateX(0);
    opacity: 1;
  }
  25% {
    transform: translateY(-25vh) translateX(var(--sway, 20px));
  }
  50% {
    transform: translateY(-50vh) translateX(calc(var(--sway, 20px) * -0.5));
  }
  75% {
    transform: translateY(-75vh) translateX(calc(var(--sway, 20px) * 0.3));
  }
  100% {
    transform: translateY(-100vh) translateX(0);
    opacity: 0;
  }
}

@keyframes emojiRainParticleBurst {
  0% {
    transform: translate(0, 0);
    opacity: 1;
  }
  100% {
    transform: translate(var(--dx, 0px), var(--dy, 0px));
    opacity: 0;
  }
}

@keyframes emojiRainSlideUp {
  from {
    transform: translateX(-50%) translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

@keyframes emojiRainSlideDown {
  from {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
  to {
    transform: translateX(-50%) translateY(20px);
    opacity: 0;
  }
}
`;

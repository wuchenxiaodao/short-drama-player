'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { InteractionPoint } from '@/lib/types';

interface EmojiPickerProps {
  interaction: InteractionPoint;
  onSend?: (emoji: string) => void;
}

interface FloatingEmoji {
  id: number;
  emoji: string;
  x: number;
  startY: number;
  scale: number;
  duration: number;
}

const DEFAULT_EMOJIS = ['🔥', '😂', '❤️', '😱', '👏'];

export default function EmojiPicker({ interaction, onSend }: EmojiPickerProps) {
  const [visible, setVisible] = useState(true);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const nextId = useRef(0);
  const autoSpawnRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Parse emojiList: prefer emojiList field, fallback to questionText (comma-separated), then DEFAULT_EMOJIS
  const emojiList = (() => {
    if (interaction.emojiList && interaction.emojiList.length > 0) return interaction.emojiList;
    if (interaction.questionText) {
      const parsed = interaction.questionText.split(',').map(s => s.trim()).filter(Boolean);
      if (parsed.length > 0) return parsed;
    }
    return DEFAULT_EMOJIS;
  })();

  // Auto-hide after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  // Simulate other users' emoji reactions
  useEffect(() => {
    autoSpawnRef.current = setInterval(() => {
      if (Math.random() > 0.6) {
        const randomEmoji = emojiList[Math.floor(Math.random() * emojiList.length)];
        addFloatingEmoji(randomEmoji, true);
      }
    }, 2000 + Math.random() * 3000);

    return () => {
      if (autoSpawnRef.current) clearInterval(autoSpawnRef.current);
    };
  }, [emojiList]);

  const addFloatingEmoji = useCallback((emoji: string, isAuto = false) => {
    const id = nextId.current++;
    const newEmoji: FloatingEmoji = {
      id,
      emoji,
      x: 10 + Math.random() * 80, // 10%-90% from left
      startY: isAuto ? 60 + Math.random() * 20 : 80, // auto spawns higher
      scale: 0.8 + Math.random() * 0.8,
      duration: 2 + Math.random() * 1.5,
    };
    setFloatingEmojis(prev => [...prev, newEmoji]);

    // Remove after animation
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    }, newEmoji.duration * 1000 + 100);
  }, []);

  function handleEmojiClick(emoji: string) {
    addFloatingEmoji(emoji);
    // Spawn 2-3 extra for visual impact
    for (let i = 0; i < 2; i++) {
      setTimeout(() => addFloatingEmoji(emoji), i * 150);
    }
    onSend?.(emoji);
  }

  function handleLike() {
    addFloatingEmoji('❤️');
    for (let i = 0; i < 3; i++) {
      setTimeout(() => addFloatingEmoji('❤️'), i * 100);
    }
    onSend?.('❤️');
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Floating emoji rain */}
      {floatingEmojis.map(fe => (
        <div
          key={fe.id}
          className="absolute pointer-events-none select-none"
          style={{
            left: `${fe.x}%`,
            bottom: `${100 - fe.startY}%`,
            fontSize: `${fe.scale * 2}rem`,
            animation: `emojiRain ${fe.duration}s ease-out forwards`,
          }}
        >
          {fe.emoji}
        </div>
      ))}

      {/* Emoji bar - bottom right, non-intrusive */}
      {visible && (
        <div className="absolute bottom-16 right-3 pointer-events-auto">
          <div className="bg-black/50 backdrop-blur-sm rounded-full px-2 py-1.5 flex items-center gap-1.5 animate-in slide-in-from-right duration-300">
            {emojiList.map((emoji, i) => (
              <button
                key={i}
                onClick={() => handleEmojiClick(emoji)}
                className="text-xl hover:scale-125 transition-transform duration-150 active:scale-90"
              >
                {emoji}
              </button>
            ))}
            <div className="w-px h-5 bg-white/20 mx-0.5" />
            <button
              onClick={handleLike}
              className="text-xl hover:scale-125 transition-transform duration-150 active:scale-90"
            >
              👍
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes emojiRain {
          0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
          30% { transform: translateY(-40vh) scale(1.2) rotate(${Math.random() > 0.5 ? '' : '-'}15deg); opacity: 0.9; }
          60% { transform: translateY(-70vh) scale(0.9) rotate(${Math.random() > 0.5 ? '' : '-'}10deg); opacity: 0.6; }
          100% { transform: translateY(-100vh) scale(0.5) rotate(0deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

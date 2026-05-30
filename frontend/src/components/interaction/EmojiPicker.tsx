'use client';

import { useState, useEffect } from 'react';
import type { InteractionPoint } from '@/lib/types';

interface EmojiPickerProps {
  interaction: InteractionPoint;
  onSend?: (emoji: string) => void;
}

const DEFAULT_EMOJIS = ['🔥', '😂', '❤️', '😱', '👏', '🤣', '😍', '🥺'];

export default function EmojiPicker({ interaction, onSend }: EmojiPickerProps) {
  const [closed, setClosed] = useState(false);
  const [floatingEmoji, setFloatingEmoji] = useState<string | null>(null);

  const emojiList = interaction.emojiList && interaction.emojiList.length > 0
    ? interaction.emojiList
    : DEFAULT_EMOJIS;

  useEffect(() => {
    const timer = setTimeout(() => setClosed(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  function handleSelect(emoji: string) {
    setFloatingEmoji(emoji);
    onSend?.(emoji);
    setTimeout(() => {
      setFloatingEmoji(null);
      setClosed(true);
    }, 1200);
  }

  if (closed && !floatingEmoji) return null;

  return (
    <div className="absolute top-8 left-0 right-0 z-20 flex flex-col items-center">
      {floatingEmoji && (
        <div
          className="text-6xl pointer-events-none"
          style={{
            animation: 'emojiFloatUp 1.2s ease-out forwards',
          }}
        >
          {floatingEmoji}
        </div>
      )}

      {!closed && (
        <div className="bg-drama-card/90 backdrop-blur-md border border-drama-border rounded-full px-3 py-2 flex items-center gap-2 animate-in slide-in-from-top duration-200">
          {emojiList.map((emoji, i) => (
            <button
              key={i}
              onClick={() => handleSelect(emoji)}
              className="text-2xl hover:scale-125 transition-transform duration-150 active:scale-90"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes emojiFloatUp {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          50% { transform: translateY(-60px) scale(1.5); opacity: 0.8; }
          100% { transform: translateY(-120px) scale(0.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';

interface EggPopupProps {
  interaction: {
    id: number;
    questionText: string;
    hint: string;
  };
}

export default function EggPopup({ interaction }: EggPopupProps) {
  const [closed, setClosed] = useState(false);
  const [showPoints, setShowPoints] = useState(false);

  useEffect(() => {
    const pointsTimer = setTimeout(() => setShowPoints(true), 400);
    const closeTimer = setTimeout(() => setClosed(true), 2000);
    return () => {
      clearTimeout(pointsTimer);
      clearTimeout(closeTimer);
    };
  }, []);

  if (closed) return null;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
      <EmojiRainEffect />
      <div
        className="bg-drama-card/95 backdrop-blur-md border border-primary-400/30 rounded-2xl p-6 text-center pointer-events-auto"
        style={{
          animation: 'eggPopIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        }}
      >
        <div className="text-5xl mb-3">🥚</div>
        <h4 className="text-base font-bold text-drama-text mb-1">发现彩蛋！</h4>
        <p className="text-sm text-drama-muted mb-2">{interaction.questionText || interaction.hint}</p>
        {showPoints && (
          <div
            className="text-lg font-bold text-primary-400"
            style={{
              animation: 'pointsFloat 1s ease-out forwards',
            }}
          >
            +5积分
          </div>
        )}
      </div>
      <style jsx>{`
        @keyframes eggPopIn {
          0% { transform: scale(0.3); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes pointsFloat {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-30px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function EmojiRainEffect() {
  const emojis = ['🎉', '✨', '🎊', '⭐', '🌟', '💫', '🎁', '🥚'];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {emojis.map((emoji, i) => (
        <span
          key={i}
          className="absolute text-xl"
          style={{
            left: `${8 + ((i * 31) % 84)}%`,
            top: 0,
            animation: `emojiFallEgg ${1 + (i % 3) * 0.3}s ease-in ${i * 0.1}s forwards`,
          }}
        >
          {emoji}
        </span>
      ))}
      <style jsx>{`
        @keyframes emojiFallEgg {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

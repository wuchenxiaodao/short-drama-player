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
  const [showPoints, setShowPoints] = useState(false);

  useEffect(() => {
    const pointsTimer = setTimeout(() => setShowPoints(true), 400);
    return () => clearTimeout(pointsTimer);
  }, []);

  return (
    <div className="bg-drama-card/95 backdrop-blur-md border border-primary-400/30 rounded-2xl p-6 text-center mx-2 mb-2 animate-in slide-in-from-bottom duration-300">
      <EmojiRainEffect />
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
      <style jsx>{`
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

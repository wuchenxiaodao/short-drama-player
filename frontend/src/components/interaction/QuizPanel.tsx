'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import type { InteractionPoint } from '@/lib/types';
import { buyHint } from '@/lib/api-client';

interface QuizPanelProps {
  interaction: InteractionPoint;
  onAnswer: (optionId: number) => void;
  userId?: number;
}

export default function QuizPanel({ interaction, onAnswer, userId }: QuizPanelProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [hintText, setHintText] = useState<string | null>(null);
  const [emojiRain, setEmojiRain] = useState(false);
  const [closed, setClosed] = useState(false);

  const options = interaction.options || [];

  const handleClose = useCallback(() => {
    setClosed(true);
  }, []);

  useEffect(() => {
    if (!showResult) return;
    const timer = setTimeout(handleClose, 3000);
    return () => clearTimeout(timer);
  }, [showResult, handleClose]);

  function handleSelect(optionId: number) {
    if (selectedId !== null) return;
    setSelectedId(optionId);
    setShowResult(true);
    onAnswer(optionId);

    const selected = options.find((o) => o.id === optionId);
    if (selected?.isCorrect) {
      setEmojiRain(true);
      setTimeout(() => setEmojiRain(false), 2500);
    }
  }

  async function handleBuyHint() {
    try {
      const hint = await buyHint(interaction.id);
      setHintText(hint);
    } catch {
      setHintText('获取提示失败');
    }
  }

  if (closed) return null;

  const selectedOption = options.find((o) => o.id === selectedId);
  const correctOption = options.find((o) => o.isCorrect);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20">
      {emojiRain && <EmojiRainEffect />}
      <div className="bg-drama-card/95 backdrop-blur-md border-t border-drama-border p-4 mx-2 mb-2 rounded-xl animate-in slide-in-from-bottom duration-300">
        <div className="flex items-start justify-between mb-3">
          <h4 className="text-sm font-medium text-drama-text flex-1">{interaction.questionText}</h4>
          <button onClick={handleClose} className="text-drama-muted hover:text-drama-text ml-2 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 mb-3">
          {options.map((option) => {
            let btnClass = 'bg-drama-surface border border-drama-border text-drama-text hover:border-primary-400/50';
            if (showResult) {
              if (option.isCorrect) {
                btnClass = 'bg-green-500/20 border border-green-500/50 text-green-400';
              } else if (option.id === selectedId) {
                btnClass = 'bg-red-500/20 border border-red-500/50 text-red-400';
              } else {
                btnClass = 'bg-drama-surface/50 border border-drama-border/50 text-drama-muted';
              }
            }
            return (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                disabled={showResult}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${btnClass}`}
              >
                {showResult && option.isCorrect && <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />}
                {showResult && !option.isCorrect && option.id === selectedId && <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                <span>{option.optionText}</span>
              </button>
            );
          })}
        </div>

        {showResult && selectedOption && (
          <p className={`text-xs mb-2 ${selectedOption.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
            {selectedOption.isCorrect ? '✓ ' : '✗ '}
            {selectedOption.feedbackText}
          </p>
        )}

        {showResult && !selectedOption?.isCorrect && correctOption && (
          <p className="text-xs text-green-400 mb-2">
            正确答案：{correctOption.optionText}
          </p>
        )}

        {!showResult && interaction.hint && (
          <button
            onClick={handleBuyHint}
            className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300"
          >
            <Lightbulb className="w-3 h-3" />
            购买提示（{interaction.hintCost}积分）
          </button>
        )}

        {hintText && (
          <p className="text-xs text-yellow-400 mt-1">💡 {hintText}</p>
        )}
      </div>
    </div>
  );
}

function EmojiRainEffect() {
  const emojis = ['🎉', '✨', '🎊', '⭐', '🌟', '💫', '🎯', '🏆'];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      {emojis.map((emoji, i) => (
        <span
          key={i}
          className="absolute text-2xl"
          style={{
            left: `${10 + ((i * 37) % 80)}%`,
            top: 0,
            animation: `emojiFall ${1.2 + (i % 3) * 0.3}s ease-in ${i * 0.12}s forwards`,
          }}
        >
          {emoji}
        </span>
      ))}
      <style jsx>{`
        @keyframes emojiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

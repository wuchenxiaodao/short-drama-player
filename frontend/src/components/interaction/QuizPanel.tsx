'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import type { InteractionPoint } from '@/lib/types';
import { buyHint, getInteractionStats } from '@/lib/api-client';

interface QuizPanelProps {
  interaction: InteractionPoint;
  onAnswer: (optionId: number) => void;
  userId?: number;
  onSlowDown?: () => void;
  onRestoreSpeed?: () => void;
}

interface StatsData {
  totalParticipants: number;
  optionStats: Record<string, { count: number; percentage: number }>;
}

export default function QuizPanel({ interaction, onAnswer, userId, onSlowDown, onRestoreSpeed }: QuizPanelProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [hintText, setHintText] = useState<string | null>(null);
  const [emojiRain, setEmojiRain] = useState(false);
  const [stats, setStats] = useState<StatsData | null>(null);

  const options = interaction.options || [];

  useEffect(() => {
    onSlowDown?.();
    return () => onRestoreSpeed?.();
  }, [onSlowDown, onRestoreSpeed]);

  useEffect(() => {
    if (!showResult) return;
    getInteractionStats(interaction.id)
      .then((res: any) => {
        const data = res?.data || res;
        if (data) setStats(data as StatsData);
      })
      .catch(() => {});
  }, [showResult, interaction.id]);

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

  const selectedOption = options.find((o) => o.id === selectedId);
  const correctOption = options.find((o) => o.isCorrect);

  return (
    <div className="bg-drama-card/95 backdrop-blur-md border-t border-drama-border p-4 mx-2 mb-2 rounded-xl animate-in slide-in-from-bottom duration-300">
      {emojiRain && <EmojiRainEffect />}
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-sm font-medium text-drama-text flex-1">{interaction.questionText}</h4>
        <span className="text-[10px] text-primary-400/80 bg-primary-500/10 px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2">
          🐢 0.3x
        </span>
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
              {showResult && stats?.optionStats?.[String(option.id)] && (
                <span className="ml-auto text-xs text-drama-muted">
                  {stats.optionStats[String(option.id)].percentage}%
                </span>
              )}
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

      {showResult && stats?.totalParticipants != null && (
        <p className="text-xs text-drama-muted mb-2">
          {stats.totalParticipants}人参与答题
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

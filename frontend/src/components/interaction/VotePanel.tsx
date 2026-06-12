'use client';

import { useState, useEffect, useCallback } from 'react';
import type { InteractionPoint } from '@/lib/types';
import { getInteractionStats } from '@/lib/api-client';

interface VotePanelProps {
  interaction: InteractionPoint;
  onAnswer: (optionId: number) => void;
  onClose?: () => void;
}

interface StatsData {
  totalParticipants: number;
  optionStats: Record<string, { count: number; percentage: number }>;
}

export default function VotePanel({ interaction, onAnswer, onClose }: VotePanelProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);

  const options = interaction.options || [];

  useEffect(() => {
    if (selectedId === null) return;
    getInteractionStats(interaction.id)
      .then((data) => {
        if (data && data.totalParticipants !== undefined) {
          setStats({
            totalParticipants: data.totalParticipants,
            optionStats: data.optionStats || {},
          });
        }
      })
      .catch(() => {});
  }, [selectedId, interaction.id]);

  function handleVote(optionId: number) {
    if (selectedId !== null) return;
    setSelectedId(optionId);
    onAnswer(optionId);
  }

  function getPercent(optionId: number): number {
    if (!stats?.optionStats) return 0;
    const os = stats.optionStats[String(optionId)];
    return os?.percentage || 0;
  }

  return (
    <div className="bg-drama-card/95 backdrop-blur-md border-t border-drama-border p-4 mx-2 mb-2 rounded-xl animate-in slide-in-from-bottom duration-300 relative">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 px-2 py-1 text-drama-muted text-xs rounded-full hover:text-drama-text hover:bg-drama-surface/50 transition-colors z-10"
      >
        跳过
      </button>
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-sm font-medium text-drama-text flex-1">{interaction.questionText}</h4>
      </div>

      <div className="space-y-2 mb-3">
        {options.map((option) => {
          const percent = selectedId !== null ? getPercent(option.id) : 0;
          const isSelected = option.id === selectedId;

          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={selectedId !== null}
              className={`w-full text-left relative overflow-hidden rounded-lg text-sm transition-all ${
                isSelected
                  ? 'border border-primary-400/50 text-primary-400'
                  : 'border border-drama-border text-drama-text hover:border-primary-400/30'
              }`}
            >
              {selectedId !== null && (
                <div
                  className={`absolute inset-0 ${isSelected ? 'bg-primary-500/20' : 'bg-drama-surface/50'}`}
                  style={{ clipPath: `inset(0 ${100 - percent}% 0 0)`, transition: 'clip-path 0.5s ease' }}
                />
              )}
              <div className="relative px-3 py-2 flex items-center justify-between">
                <span>{option.optionText}</span>
                {selectedId !== null && (
                  <span className="text-xs text-drama-muted">{percent}%</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedId !== null && (
        <p className="text-xs text-drama-muted">
          {options.find((o) => o.id === selectedId)?.feedbackText || '感谢参与投票！'}
          {stats?.totalParticipants != null && (
            <span className="ml-1">· {stats.totalParticipants}人参与</span>
          )}
        </p>
      )}
    </div>
  );
}

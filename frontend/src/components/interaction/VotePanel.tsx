'use client';

import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import type { InteractionPoint } from '@/lib/types';

interface VotePanelProps {
  interaction: InteractionPoint;
  onAnswer: (optionId: number) => void;
}

export default function VotePanel({ interaction, onAnswer }: VotePanelProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [closed, setClosed] = useState(false);

  const options = interaction.options || [];

  const handleClose = useCallback(() => {
    setClosed(true);
  }, []);

  useEffect(() => {
    if (selectedId === null) return;
    const timer = setTimeout(handleClose, 3000);
    return () => clearTimeout(timer);
  }, [selectedId, handleClose]);

  function handleVote(optionId: number) {
    if (selectedId !== null) return;
    setSelectedId(optionId);
    onAnswer(optionId);
  }

  if (closed) return null;

  const totalVotes = options.reduce((sum, o) => sum + (o.optionIndex + 1) * 3 + 7, 0);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20">
      <div className="bg-drama-card/95 backdrop-blur-md border-t border-drama-border p-4 mx-2 mb-2 rounded-xl animate-in slide-in-from-bottom duration-300">
        <div className="flex items-start justify-between mb-3">
          <h4 className="text-sm font-medium text-drama-text flex-1">{interaction.questionText}</h4>
          <button onClick={handleClose} className="text-drama-muted hover:text-drama-text ml-2 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 mb-3">
          {options.map((option) => {
            const votes = (option.optionIndex + 1) * 3 + 7;
            const percent = selectedId !== null ? Math.round((votes / totalVotes) * 100) : 0;
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
                    style={{ width: `${percent}%`, transition: 'width 0.5s ease' }}
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
          </p>
        )}
      </div>
    </div>
  );
}

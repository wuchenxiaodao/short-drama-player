'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, GitBranch } from 'lucide-react';
import type { InteractionPoint } from '@/lib/types';

interface ChoicePanelProps {
  interaction: InteractionPoint;
  onAnswer: (optionId: number) => void;
}

export default function ChoicePanel({ interaction, onAnswer }: ChoicePanelProps) {
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

  function handleChoose(optionId: number) {
    if (selectedId !== null) return;
    setSelectedId(optionId);
    onAnswer(optionId);
  }

  if (closed) return null;

  const selectedOption = options.find((o) => o.id === selectedId);

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
            const isSelected = option.id === selectedId;
            return (
              <button
                key={option.id}
                onClick={() => handleChoose(option.id)}
                disabled={selectedId !== null}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                  isSelected
                    ? 'bg-primary-500/20 border border-primary-400/50 text-primary-400'
                    : 'bg-drama-surface border border-drama-border text-drama-text hover:border-primary-400/30'
                }`}
              >
                {option.optionText}
              </button>
            );
          })}
        </div>

        {selectedOption && (
          <div className="space-y-1">
            <p className="text-xs text-drama-muted">{selectedOption.feedbackText}</p>
            {selectedOption.nextInteractionId && (
              <div className="flex items-center gap-1 text-xs text-primary-400">
                <GitBranch className="w-3 h-3" />
                <span>剧情将根据你的选择分支发展</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

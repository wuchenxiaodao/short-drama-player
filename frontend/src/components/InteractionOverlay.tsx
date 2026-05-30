'use client';

import { useState, useEffect, useRef } from 'react';
import type { InteractionPoint, InteractionType } from '@/lib/types';
import QuizPanel from './interaction/QuizPanel';
import VotePanel from './interaction/VotePanel';
import ChoicePanel from './interaction/ChoicePanel';
import EggPopup from './interaction/EggPopup';
import InfoPopup from './interaction/InfoPopup';
import LinkCard from './interaction/LinkCard';
import EmojiPicker from './interaction/EmojiPicker';

interface InteractionOverlayProps {
  interactions: InteractionPoint[];
  currentTimeMs: number;
  onAnswer: (interactionId: number, optionId: number) => void;
  userId?: number;
}

const TOLERANCE_MS = 500;

const componentMap: Record<InteractionType, React.ComponentType<Record<string, unknown>>> = {
  QUIZ: QuizPanel as unknown as React.ComponentType<Record<string, unknown>>,
  VOTE: VotePanel as unknown as React.ComponentType<Record<string, unknown>>,
  CHOICE: ChoicePanel as unknown as React.ComponentType<Record<string, unknown>>,
  EGG: EggPopup as unknown as React.ComponentType<Record<string, unknown>>,
  INFO: InfoPopup as unknown as React.ComponentType<Record<string, unknown>>,
  LINK: LinkCard as unknown as React.ComponentType<Record<string, unknown>>,
  EMOJI: EmojiPicker as unknown as React.ComponentType<Record<string, unknown>>,
};

export default function InteractionOverlay({
  interactions,
  currentTimeMs,
  onAnswer,
  userId,
}: InteractionOverlayProps) {
  const [activeInteraction, setActiveInteraction] = useState<InteractionPoint | null>(null);
  const triggeredRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    for (const interaction of interactions) {
      if (triggeredRef.current.has(interaction.id)) continue;

      const diff = Math.abs(currentTimeMs - interaction.timestampMs);
      if (diff <= TOLERANCE_MS) {
        triggeredRef.current.add(interaction.id);
        setActiveInteraction(interaction);
        break;
      }
    }
  }, [currentTimeMs, interactions]);

  useEffect(() => {
    if (!activeInteraction) return;

    const isAutoClose = ['QUIZ', 'VOTE', 'CHOICE', 'EGG', 'EMOJI'].includes(activeInteraction.interactionType);
    if (!isAutoClose) return;

    const timers: Record<string, number> = { QUIZ: 3500, VOTE: 3500, CHOICE: 3500, EGG: 2500, EMOJI: 3500 };
    const timeout = timers[activeInteraction.interactionType] || 3500;

    const timer = setTimeout(() => {
      setActiveInteraction(null);
    }, timeout);

    return () => clearTimeout(timer);
  }, [activeInteraction]);

  function handleAnswer(interactionId: number, optionId: number) {
    onAnswer(interactionId, optionId);
  }

  if (!activeInteraction) return null;

  const Component = componentMap[activeInteraction.interactionType];
  if (!Component) return null;

  const commonProps: Record<string, unknown> = {
    interaction: activeInteraction,
    onAnswer: (optionId: number) => handleAnswer(activeInteraction.id, optionId),
  };

  if (activeInteraction.interactionType === 'QUIZ') {
    commonProps.userId = userId;
  }

  if (activeInteraction.interactionType === 'EMOJI') {
    commonProps.onSend = (emoji: string) => {
      handleAnswer(activeInteraction.id, 0);
    };
  }

  return (
    <div className="interaction-overlay">
      <Component {...commonProps} />
    </div>
  );
}

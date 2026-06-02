'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { InteractionPoint, InteractionType, InteractionOption } from '@/lib/types';
import QuizPanel from './interaction/QuizPanel';
import VotePanel from './interaction/VotePanel';
import ChoicePanel from './interaction/ChoicePanel';
import EggPopup from './interaction/EggPopup';
import InfoPopup from './interaction/InfoPopup';
import LinkCard from './interaction/LinkCard';
import EmojiPicker from './interaction/EmojiPicker';
import FeedbackToast from './FeedbackToast';

interface InteractionOverlayProps {
  interactions: InteractionPoint[];
  currentTimeMs: number;
  onAnswer: (interactionId: number, optionId: number) => void;
  userId?: number;
}

interface BranchChoice {
  interactionId: number;
  optionId: number;
  branchId: number | null;
}

const TOLERANCE_MS = 500;
const COUNTDOWN_SECONDS = 10;

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
  const [currentBranchId, setCurrentBranchId] = useState<number | null>(null);
  const [branchHistory, setBranchHistory] = useState<BranchChoice[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const triggeredRef = useRef<Set<number>>(new Set());
  const chosenOptionsRef = useRef<Map<number, number>>(new Map());
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canTrigger = useCallback((interaction: InteractionPoint): boolean => {
    if (triggeredRef.current.has(interaction.id)) return false;

    if (interaction.branchGroupId != null && currentBranchId !== interaction.branchGroupId) {
      return false;
    }

    if (interaction.prerequisiteId != null) {
      if (!triggeredRef.current.has(interaction.prerequisiteId)) return false;

      if (interaction.prerequisiteChoiceOptionId != null) {
        const chosenOption = chosenOptionsRef.current.get(interaction.prerequisiteId);
        if (chosenOption !== interaction.prerequisiteChoiceOptionId) return false;
      }
    }

    return true;
  }, [currentBranchId]);

  useEffect(() => {
    for (const interaction of interactions) {
      if (!canTrigger(interaction)) continue;

      const diff = Math.abs(currentTimeMs - interaction.timestampMs);
      if (diff <= TOLERANCE_MS) {
        triggeredRef.current.add(interaction.id);
        setActiveInteraction(interaction);
        setCountdown(COUNTDOWN_SECONDS);
        break;
      }
    }
  }, [currentTimeMs, interactions, canTrigger]);

  useEffect(() => {
    if (!activeInteraction || countdown === null) return;

    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          handleAutoSelect();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [activeInteraction]);

  function handleAutoSelect() {
    if (!activeInteraction) return;
    const options = activeInteraction.options || [];
    if (options.length > 0) {
      handleBranchAnswer(activeInteraction.id, options[0].id, options[0]);
    }
  }

  function handleBranchAnswer(interactionId: number, optionId: number, option?: InteractionOption) {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setCountdown(null);

    triggeredRef.current.add(interactionId);
    chosenOptionsRef.current.set(interactionId, optionId);

    const selectedOption = option || activeInteraction?.options?.find((o) => o.id === optionId);

    if (selectedOption?.feedbackText) {
      setFeedbackMessage(selectedOption.feedbackText);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = setTimeout(() => setFeedbackMessage(null), 3000);
    }

    if (selectedOption?.nextInteractionId != null) {
      setCurrentBranchId(selectedOption.nextInteractionId);
      setBranchHistory((prev) => [
        ...prev,
        { interactionId, optionId, branchId: selectedOption.nextInteractionId },
      ]);
    }

    setActiveInteraction(null);
    onAnswer(interactionId, optionId);
  }

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  if (!activeInteraction && !feedbackMessage) return null;

  const Component = activeInteraction ? componentMap[activeInteraction.interactionType] : null;

  return (
    <>
      {feedbackMessage && <FeedbackToast message={feedbackMessage} />}

      {activeInteraction && Component && (
        <div className="absolute inset-0 z-10">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={handleAutoSelect}
          />
          <div className="absolute bottom-0 left-0 right-0 z-20">
            {countdown !== null && (
              <div className="mx-4 mb-1">
                <div className="h-1 bg-drama-surface/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${((countdown || 0) / COUNTDOWN_SECONDS) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-drama-muted text-center mt-0.5">
                  {countdown}秒后自动选择
                </p>
              </div>
            )}
            <Component
              interaction={activeInteraction}
              onAnswer={(optionId: number) => {
                const opt = activeInteraction.options?.find((o) => o.id === optionId);
                handleBranchAnswer(activeInteraction.id, optionId, opt);
              }}
              {...(activeInteraction.interactionType === 'QUIZ' ? { userId } : {})}
              {...(activeInteraction.interactionType === 'EMOJI'
                ? {
                    onSend: () => {
                      handleBranchAnswer(activeInteraction.id, 0);
                    },
                  }
                : {})}
            />
          </div>
        </div>
      )}
    </>
  );
}

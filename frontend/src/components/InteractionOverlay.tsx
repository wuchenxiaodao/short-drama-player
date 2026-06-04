'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { InteractionPoint, InteractionType, InteractionOption } from '@/lib/types';
import QuizPanel from './interaction/QuizPanel';
import VotePanel from './interaction/VotePanel';
import ChoicePanel from './interaction/ChoicePanel';
import EggPopup from './interaction/EggPopup';
import InfoPopup from './interaction/InfoPopup';
import LinkCard from './interaction/LinkCard';
import EmojiRainLayer from './interaction/EmojiRainLayer';
import FeedbackToast from './FeedbackToast';
import { sentimentAnalyzer } from '@/lib/danmaku-sentiment';

const EMOJI_DISPLAY_CONFIG = {
  danmakuEmojiIntervalMs: 5000,
  danmakuWindowMs: 15000,
  barDurationMs: 5000,
  minSentimentWeight: 0.2,
};

interface InteractionOverlayProps {
  interactions: InteractionPoint[];
  currentTimeMs: number;
  onAnswer: (interactionId: number, optionId: number, emojiReaction?: string, isSend?: boolean) => void;
  userId?: number;
  episodeId?: number;
  danmakuList?: { id: number; content: string; positionMs: number }[];
  onSlowDown?: () => void;
  onRestoreSpeed?: () => void;
}

interface BranchChoice {
  interactionId: number;
  optionId: number;
  branchId: number | null;
}

const TOLERANCE_MS = 500;

const AUTO_CLOSE_MS: Partial<Record<InteractionType, number>> = {
  EGG: 2500,
  INFO: 3500,
  LINK: 5000,
};

// 需要用户交互的底部面板类型
const PANEL_TYPES: InteractionType[] = ['QUIZ', 'VOTE', 'CHOICE'];
// 自动提交的类型（无需用户交互）
const AUTO_SUBMIT_TYPES: InteractionType[] = ['INFO', 'LINK', 'EGG'];

const overlayComponentMap: Record<string, React.ComponentType<Record<string, unknown>>> = {
  EGG: EggPopup as unknown as React.ComponentType<Record<string, unknown>>,
  INFO: InfoPopup as unknown as React.ComponentType<Record<string, unknown>>,
  LINK: LinkCard as unknown as React.ComponentType<Record<string, unknown>>,
};

const panelComponentMap: Record<string, React.ComponentType<Record<string, unknown>>> = {
  QUIZ: QuizPanel as unknown as React.ComponentType<Record<string, unknown>>,
  VOTE: VotePanel as unknown as React.ComponentType<Record<string, unknown>>,
  CHOICE: ChoicePanel as unknown as React.ComponentType<Record<string, unknown>>,
};

const DEFAULT_EMOJIS = ['🔥', '😂', '❤️', '😱', '👏'];

export default function InteractionOverlay({
  interactions,
  currentTimeMs,
  onAnswer,
  userId,
  episodeId,
  danmakuList,
  onSlowDown,
  onRestoreSpeed,
}: InteractionOverlayProps) {
  // overlay 类型（INFO/LINK/EGG）- 带自动消失的小弹窗
  const [activeInteraction, setActiveInteraction] = useState<InteractionPoint | null>(null);
  // panel 类型（QUIZ/VOTE/CHOICE）- 底部面板，需要用户交互
  const [activePanel, setActivePanel] = useState<InteractionPoint | null>(null);
  const [currentBranchId, setCurrentBranchId] = useState<number | null>(null);
  const [branchHistory, setBranchHistory] = useState<BranchChoice[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const [currentEmoji, setCurrentEmoji] = useState<string | null>(null);
  const [emojiList, setEmojiList] = useState<string[]>(DEFAULT_EMOJIS);
  const [showBar, setShowBar] = useState(false);
  const barShownOnce = useRef(false);

  const triggeredRef = useRef<Set<number>>(new Set());
  const chosenOptionsRef = useRef<Map<number, number>>(new Map());
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeInteractionRef = useRef<InteractionPoint | null>(null);
  const activePanelRef = useRef<InteractionPoint | null>(null);
  const lastDanmakuEmojiTimeRef = useRef<number>(0);

  const canTrigger = useCallback((interaction: InteractionPoint): boolean => {
    if (triggeredRef.current.has(interaction.id)) return false;
    if (interaction.branchGroupId != null && currentBranchId !== interaction.branchGroupId) return false;
    if (interaction.prerequisiteId != null) {
      if (!triggeredRef.current.has(interaction.prerequisiteId)) return false;
      if (interaction.prerequisiteChoiceOptionId != null) {
        const chosenOption = chosenOptionsRef.current.get(interaction.prerequisiteId);
        if (chosenOption !== interaction.prerequisiteChoiceOptionId) return false;
      }
    }
    return true;
  }, [currentBranchId]);

  // ---- Trigger interactions ----
  useEffect(() => {
    for (const interaction of interactions) {
      if (!canTrigger(interaction)) continue;
      const diff = Math.abs(currentTimeMs - interaction.timestampMs);
      if (diff > TOLERANCE_MS) continue;

      triggeredRef.current.add(interaction.id);
      const type = interaction.interactionType;

      if (type === 'EMOJI') {
        // Emoji: 自动提交 + emoji 雨
        const baseEmojis = parseEmojiList(interaction);
        const bestEmoji = getBestDanmakuEmoji(currentTimeMs, danmakuList) || baseEmojis[0] || '🔥';
        const sentimentEmojis = getSentimentEmojis(currentTimeMs, danmakuList);
        setEmojiList(mergeEmojiList(sentimentEmojis, baseEmojis));
        setCurrentEmoji(bestEmoji);
        if (!barShownOnce.current) { barShownOnce.current = true; setShowBar(true); }
        onAnswer(interaction.id, 0);
      } else if (PANEL_TYPES.includes(type)) {
        // QUIZ/VOTE/CHOICE: 底部面板，需要用户交互
        setActivePanel(interaction);
        activePanelRef.current = interaction;
      } else if (AUTO_SUBMIT_TYPES.includes(type)) {
        // INFO/LINK/EGG: 自动提交 + 小弹窗
        setActiveInteraction(interaction);
        activeInteractionRef.current = interaction;
        onAnswer(interaction.id, 0);
      } else {
        // 未知类型：自动提交
        onAnswer(interaction.id, 0);
      }
      break;
    }
  }, [currentTimeMs, interactions, canTrigger, onAnswer, danmakuList]);

  // ---- Danmaku-driven emoji ----
  useEffect(() => {
    if (!danmakuList || danmakuList.length === 0) return;
    const timeSinceLast = currentTimeMs - lastDanmakuEmojiTimeRef.current;
    if (timeSinceLast < EMOJI_DISPLAY_CONFIG.danmakuEmojiIntervalMs) return;

    const danmakuInWindow = danmakuList.filter(d => {
      const diff = currentTimeMs - d.positionMs;
      return diff >= 0 && diff < EMOJI_DISPLAY_CONFIG.danmakuWindowMs;
    });
    if (danmakuInWindow.length === 0) return;

    const bestEmoji = getBestDanmakuEmoji(currentTimeMs, danmakuList);
    if (!bestEmoji) return;

    const sentimentEmojis = getSentimentEmojis(currentTimeMs, danmakuList);
    if (sentimentEmojis.length > 0) setEmojiList(prev => mergeEmojiList(sentimentEmojis, prev));

    lastDanmakuEmojiTimeRef.current = currentTimeMs;
    setCurrentEmoji(bestEmoji);
    if (!barShownOnce.current) { barShownOnce.current = true; setShowBar(true); }
  }, [currentTimeMs, danmakuList]);

  useEffect(() => {
    if (!currentEmoji) return;
    const timer = setTimeout(() => setCurrentEmoji(null), 5500);
    return () => clearTimeout(timer);
  }, [currentEmoji]);

  const clearAllTimers = useCallback(() => {
    if (autoCloseTimerRef.current) { clearTimeout(autoCloseTimerRef.current); autoCloseTimerRef.current = null; }
  }, []);

  const closeActiveInteraction = useCallback(() => {
    clearAllTimers();
    setActiveInteraction(null);
    activeInteractionRef.current = null;
  }, [clearAllTimers]);

  const closePanel = useCallback(() => {
    if (activePanelRef.current?.interactionType === 'QUIZ') {
      onRestoreSpeed?.();
    }
    setActivePanel(null);
    activePanelRef.current = null;
  }, [onRestoreSpeed]);

  // Auto-close for INFO/LINK/EGG
  useEffect(() => {
    if (!activeInteraction) return;
    const autoCloseMs = AUTO_CLOSE_MS[activeInteraction.interactionType];
    if (autoCloseMs != null) {
      autoCloseTimerRef.current = setTimeout(() => closeActiveInteraction(), autoCloseMs);
    }
    return () => { if (autoCloseTimerRef.current) { clearTimeout(autoCloseTimerRef.current); autoCloseTimerRef.current = null; } };
  }, [activeInteraction, closeActiveInteraction, onAnswer]);

  function processAnswer(interactionId: number, optionId: number, option?: InteractionOption) {
    triggeredRef.current.add(interactionId);
    chosenOptionsRef.current.set(interactionId, optionId);
    const current = activePanelRef.current || activeInteractionRef.current;
    const selectedOption = option || current?.options?.find((o) => o.id === optionId);
    if (selectedOption?.feedbackText) {
      setFeedbackMessage(selectedOption.feedbackText);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = setTimeout(() => setFeedbackMessage(null), 3000);
    }
    if (selectedOption?.nextInteractionId != null) {
      setCurrentBranchId(selectedOption.nextInteractionId);
      setBranchHistory((prev) => [...prev, { interactionId, optionId, branchId: selectedOption.nextInteractionId! }]);
    }
    closePanel();
    closeActiveInteraction();
    onAnswer(interactionId, optionId);
  }

  useEffect(() => {
    return () => { if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current); };
  }, []);

  // ---- Helpers ----
  function parseEmojiList(interaction: InteractionPoint): string[] {
    if (interaction.emojiList && interaction.emojiList.length > 0) return interaction.emojiList;
    if (interaction.questionText) {
      const parsed = interaction.questionText.split(',').map(s => s.trim()).filter(Boolean);
      if (parsed.length > 0) return parsed;
    }
    return DEFAULT_EMOJIS;
  }

  function getBestDanmakuEmoji(timeMs: number, dmList?: { id: number; content: string; positionMs: number }[]): string | null {
    if (!dmList || dmList.length === 0) return null;
    const danmakuInWindow = dmList.filter(d => {
      const diff = timeMs - d.positionMs;
      return diff >= 0 && diff < EMOJI_DISPLAY_CONFIG.danmakuWindowMs;
    });
    if (danmakuInWindow.length === 0) return null;
    const aggregatedWeights: Map<string, number> = new Map();
    for (const dm of danmakuInWindow) {
      const matches = sentimentAnalyzer.analyzeContent(dm.content);
      for (const match of matches) {
        if (match.weight >= EMOJI_DISPLAY_CONFIG.minSentimentWeight) {
          aggregatedWeights.set(match.emoji, (aggregatedWeights.get(match.emoji) ?? 0) + match.weight);
        }
      }
    }
    if (aggregatedWeights.size === 0) return null;
    let bestEmoji: string | null = null;
    let maxWeight = 0;
    aggregatedWeights.forEach((weight, emoji) => {
      if (weight > maxWeight) { maxWeight = weight; bestEmoji = emoji; }
    });
    return bestEmoji;
  }

  function getSentimentEmojis(timeMs: number, dmList?: { id: number; content: string; positionMs: number }[]): string[] {
    if (!dmList || dmList.length === 0) return [];
    const danmakuInWindow = dmList.filter(d => {
      const diff = timeMs - d.positionMs;
      return diff >= 0 && diff < EMOJI_DISPLAY_CONFIG.danmakuWindowMs;
    });
    const result: string[] = [];
    const seen = new Set<string>();
    for (const dm of danmakuInWindow) {
      const matches = sentimentAnalyzer.analyzeContent(dm.content);
      for (const match of matches) {
        if (match.weight >= EMOJI_DISPLAY_CONFIG.minSentimentWeight && !seen.has(match.emoji)) {
          seen.add(match.emoji);
          result.push(match.emoji);
        }
      }
    }
    return result;
  }

  function mergeEmojiList(sentimentEmojis: string[], baseEmojis: string[]): string[] {
    const combined = [...sentimentEmojis];
    for (const e of baseEmojis) {
      if (!combined.includes(e) && combined.length < 5) combined.push(e);
    }
    return combined.length > 0 ? combined : DEFAULT_EMOJIS;
  }

  // ---- Render ----
  const hasEmojiContent = currentEmoji || showBar;
  if (!activeInteraction && !activePanel && !hasEmojiContent && !feedbackMessage) return null;

  const OverlayComponent = activeInteraction ? overlayComponentMap[activeInteraction.interactionType] : null;
  const PanelComponent = activePanel ? panelComponentMap[activePanel.interactionType] : null;

  return (
    <>
      {feedbackMessage && <FeedbackToast message={feedbackMessage} />}

      {/* Emoji 雨层 */}
      {(currentEmoji || showBar) && (
        <EmojiRainLayer
          emojis={emojiList}
          episodeId={episodeId || 0}
          currentEmoji={currentEmoji || undefined}
          showBar={showBar}
          barDurationMs={EMOJI_DISPLAY_CONFIG.barDurationMs}
          onSendEmoji={(emoji) => {
            const emojiInteraction = interactions.find(i => i.interactionType === 'EMOJI');
            if (emojiInteraction) onAnswer(emojiInteraction.id, 0, emoji, true);
          }}
          onLikeEmoji={(emoji) => {
            const emojiInteraction = interactions.find(i => i.interactionType === 'EMOJI');
            if (emojiInteraction) onAnswer(emojiInteraction.id, 0, emoji, false);
          }}
        />
      )}

      {/* QUIZ/VOTE/CHOICE: 底部面板，无遮罩 */}
      {activePanel && PanelComponent && (
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <PanelComponent
            interaction={activePanel}
            onAnswer={(optionId: number) => {
              const current = activePanelRef.current;
              if (current) {
                const opt = current.options?.find((o) => o.id === optionId);
                processAnswer(current.id, optionId, opt);
              }
            }}
            {...(activePanel.interactionType === 'QUIZ' ? { userId, onSlowDown, onRestoreSpeed } : {})}
          />
        </div>
      )}

      {/* INFO/LINK/EGG: 小弹窗 + 半透明遮罩 + 自动消失 */}
      {activeInteraction && OverlayComponent && (
        <div className="absolute inset-0 z-10">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={closeActiveInteraction}
          />
          <div className="absolute bottom-4 right-4 z-20 max-w-[280px]">
            <OverlayComponent
              interaction={activeInteraction}
              onAnswer={(optionId: number) => {
                const current = activeInteractionRef.current;
                if (current) {
                  const opt = current.options?.find((o) => o.id === optionId);
                  processAnswer(current.id, optionId, opt);
                }
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

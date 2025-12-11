/**
 * useBotThinking Hook
 *
 * Generates thinking explanations for bot players based on their card plays.
 */

import { useState, useEffect, useCallback } from 'react';
import { Player, TrickCard } from '../../types/game';

interface UseBotThinkingOptions {
  /** Current trick cards */
  currentTrick: TrickCard[];
  /** All players in the game */
  players: Player[];
  /** Current trump suit */
  trump?: string | null;
}

interface UseBotThinkingReturn {
  /** Map of bot names to their thinking explanations */
  botThinkingMap: Map<string, string>;
  /** Set of bot names whose thinking is expanded */
  openThinkingButtons: Set<string>;
  /** Toggle a bot's thinking explanation visibility */
  toggleBotThinking: (botName: string) => void;
}

export function useBotThinking({
  currentTrick,
  players,
  trump,
}: UseBotThinkingOptions): UseBotThinkingReturn {
  const [botThinkingMap, setBotThinkingMap] = useState<Map<string, string>>(new Map());
  const [openThinkingButtons, setOpenThinkingButtons] = useState<Set<string>>(new Set());

  // Generate thinking reasons for bots
  useEffect(() => {
    const newMap = new Map<string, string>();

    currentTrick.forEach((play, index) => {
      const player = players.find((p) => p.name === play.playerName);
      if (!player?.isBot) return;

      const card = play.card;
      const trickLength = index + 1;
      let action = '';

      if (card.color === 'red' && card.value === 0) {
        action = 'Playing Red 0 for +5 bonus points!';
      } else if (card.color === 'brown' && card.value === 0) {
        action = 'Dumping Brown 0 (-2 penalty)';
      } else if (card.value === 7) {
        if (trickLength === 1) {
          action = `Leading with 7 ${card.color} to control the trick`;
        } else {
          action = `Playing 7 ${card.color} to secure the win`;
        }
      } else if (trickLength === 1) {
        action = `Leading with ${card.value} ${card.color}`;
      } else if (card.color === trump) {
        action = `Playing trump (${card.value} ${card.color})`;
      } else {
        action = `Playing ${card.value} ${card.color}`;
      }

      newMap.set(player.name, action);
    });

    setBotThinkingMap(newMap);

    if (currentTrick.length === 0) {
      setOpenThinkingButtons(new Set());
    }
  }, [currentTrick, players, trump]);

  // Toggle a bot's thinking explanation
  const toggleBotThinking = useCallback((botName: string) => {
    setOpenThinkingButtons((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(botName)) {
        newSet.delete(botName);
      } else {
        newSet.add(botName);
      }
      return newSet;
    });
  }, []);

  return {
    botThinkingMap,
    openThinkingButtons,
    toggleBotThinking,
  };
}

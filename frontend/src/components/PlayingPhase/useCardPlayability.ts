/**
 * useCardPlayability Hook
 *
 * Manages card playability logic for the player's hand.
 * Determines which cards can be played based on suit-following rules.
 */

import { useMemo, useCallback } from 'react';
import { Card as CardType, TrickCard } from '../../types/game';

interface UseCardPlayabilityOptions {
  /** Player's hand of cards */
  hand: CardType[];
  /** Whether it's the current player's turn */
  isCurrentTurn: boolean;
  /** Cards played in the current trick */
  currentTrick: TrickCard[];
  /** Current trump suit */
  trump?: string | null;
  /** Card that's queued for next turn */
  queuedCard?: CardType | null;
}

interface UseCardPlayabilityReturn {
  /** List of cards that can be played */
  playableCards: CardType[];
  /** Check if a specific card is playable */
  isCardPlayable: (card: CardType) => boolean;
  /** Check if a specific card is queued */
  isCardQueued: (card: CardType) => boolean;
  /** Check if a specific card is trump */
  isCardTrump: (card: CardType) => boolean;
  /** Get the reason why a card is disabled */
  getDisabledReason: (card: CardType) => string | undefined;
}

export function useCardPlayability({
  hand,
  isCurrentTurn,
  currentTrick,
  trump,
  queuedCard,
}: UseCardPlayabilityOptions): UseCardPlayabilityReturn {
  // Calculate playable cards (suit-following rules)
  const playableCards = useMemo(() => {
    if (!isCurrentTurn) return [];
    // When currentTrick.length === 4, the previous trick is still displayed for 2 seconds,
    // but we're actually leading a new trick (all cards are playable)
    // When currentTrick.length === 0, we're also leading (all cards are playable)
    if (currentTrick.length === 0 || currentTrick.length === 4) return hand;

    const ledSuit = currentTrick[0].card.color;
    const hasLedSuit = hand.some((c) => c.color === ledSuit);

    if (hasLedSuit) {
      return hand.filter((c) => c.color === ledSuit);
    }

    return hand;
  }, [isCurrentTurn, hand, currentTrick]);

  // Check if specific card is playable
  const isCardPlayable = useCallback(
    (card: CardType) => {
      return playableCards.some((c) => c.color === card.color && c.value === card.value);
    },
    [playableCards]
  );

  // Check if a card is queued
  const isCardQueued = useCallback(
    (card: CardType) => {
      return queuedCard?.color === card.color && queuedCard?.value === card.value;
    },
    [queuedCard]
  );

  // Check if a card is trump suit
  const isCardTrump = useCallback(
    (card: CardType) => {
      return trump != null && card.color === trump;
    },
    [trump]
  );

  // Get the reason why a card is disabled (for tooltip)
  const getDisabledReason = useCallback(
    (card: CardType): string | undefined => {
      if (!isCurrentTurn) return undefined;
      if (isCardPlayable(card)) return undefined;

      // If there's a trick in progress with cards, explain suit-following
      if (currentTrick.length > 0 && currentTrick.length < 4) {
        const ledSuit = currentTrick[0].card.color;
        const ledSuitName = ledSuit.charAt(0).toUpperCase() + ledSuit.slice(1);
        return `Must follow suit: play a ${ledSuitName} card`;
      }

      return undefined;
    },
    [isCurrentTurn, isCardPlayable, currentTrick]
  );

  return {
    playableCards,
    isCardPlayable,
    isCardQueued,
    isCardTrump,
    getDisabledReason,
  };
}

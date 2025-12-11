/**
 * useDealingAnimation Hook
 *
 * Manages card dealing animation state for the player's hand.
 * Shows cards being dealt one by one at the start of each round.
 */

import { useState, useEffect } from 'react';
import { sounds } from '../../utils/sounds';

interface UseDealingAnimationOptions {
  /** Number of cards in hand */
  cardCount: number;
  /** Current round number (triggers animation on change) */
  roundNumber: number;
  /** Whether animations are enabled */
  animationsEnabled: boolean;
}

interface UseDealingAnimationReturn {
  /** Whether dealing animation is in progress */
  showDealingAnimation: boolean;
  /** Index of the last dealt card (for staggered reveal) */
  dealingCardIndex: number;
}

export function useDealingAnimation({
  cardCount,
  roundNumber,
  animationsEnabled,
}: UseDealingAnimationOptions): UseDealingAnimationReturn {
  const [showDealingAnimation, setShowDealingAnimation] = useState(false);
  const [dealingCardIndex, setDealingCardIndex] = useState(0);

  // Dealing animation on new round
  useEffect(() => {
    let dealingEndTimer: number | null = null;

    if (animationsEnabled && cardCount > 0 && !showDealingAnimation) {
      setShowDealingAnimation(true);
      setDealingCardIndex(0);

      sounds.roundStart();

      const interval = setInterval(() => {
        setDealingCardIndex((prev) => {
          if (prev >= cardCount - 1) {
            clearInterval(interval);
            dealingEndTimer = window.setTimeout(() => setShowDealingAnimation(false), 300);
            return prev;
          }
          sounds.cardDeal();
          return prev + 1;
        });
      }, 120);

      return () => {
        clearInterval(interval);
        if (dealingEndTimer) clearTimeout(dealingEndTimer);
      };
    }
  }, [roundNumber, animationsEnabled, cardCount]);

  return {
    showDealingAnimation,
    dealingCardIndex,
  };
}

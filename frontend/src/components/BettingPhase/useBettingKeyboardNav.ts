/**
 * useBettingKeyboardNav Hook
 *
 * Handles keyboard navigation for the betting phase.
 * Features:
 * - Level-based navigation (Amount → Trump → Actions)
 * - Arrow key navigation within each level
 * - Enter to confirm, Escape to go back
 * - Sound effects integration
 */

import { useState, useEffect, useCallback } from 'react';
import { sounds } from '../../utils/sounds';

export interface UseBettingKeyboardNavOptions {
  /** Whether it's the current player's turn */
  isMyTurn: boolean;
  /** Whether the player has already placed a bet */
  hasPlacedBet: boolean;
  /** Current selected bet amount */
  selectedAmount: number;
  /** Set the selected bet amount */
  setSelectedAmount: (amount: number | ((prev: number) => number)) => void;
  /** Whether betting without trump */
  withoutTrump: boolean;
  /** Toggle without trump */
  setWithoutTrump: (value: boolean | ((prev: boolean) => boolean)) => void;
  /** Whether skip is allowed */
  canSkip: boolean;
  /** Validate if current bet is valid */
  isCurrentBetValid: () => boolean;
  /** Handle skip action */
  onSkip: () => void;
  /** Handle place bet action */
  onPlaceBet: () => void;
}

export interface UseBettingKeyboardNavReturn {
  /** Current navigation level (0=amount, 1=trump, 2=actions) */
  navLevel: number;
  /** Set navigation level */
  setNavLevel: React.Dispatch<React.SetStateAction<number>>;
  /** Current action index (0=skip, 1=bet) */
  actionIndex: number;
  /** Set action index */
  setActionIndex: React.Dispatch<React.SetStateAction<number>>;
}

export function useBettingKeyboardNav({
  isMyTurn,
  hasPlacedBet,
  selectedAmount,
  setSelectedAmount,
  withoutTrump,
  setWithoutTrump,
  canSkip,
  isCurrentBetValid,
  onSkip,
  onPlaceBet,
}: UseBettingKeyboardNavOptions): UseBettingKeyboardNavReturn {
  const [navLevel, setNavLevel] = useState<number>(0);
  const [actionIndex, setActionIndex] = useState<number>(0);

  const scrollToLevel = useCallback((level: number) => {
    const levelIds = ['bet-level-amount', 'bet-level-trump', 'bet-level-action'];
    const element = document.getElementById(levelIds[level]);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  useEffect(() => {
    if (!isMyTurn || hasPlacedBet) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const newLevel = Math.max(0, navLevel - 1);
        setNavLevel(newLevel);
        scrollToLevel(newLevel);
        sounds.buttonClick();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const newLevel = Math.min(2, navLevel + 1);
        setNavLevel(newLevel);
        scrollToLevel(newLevel);
        sounds.buttonClick();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (navLevel === 0) {
          if (e.key === 'ArrowRight') {
            setSelectedAmount((prev) => Math.min(12, prev + 1));
          } else {
            setSelectedAmount((prev) => Math.max(7, prev - 1));
          }
        } else if (navLevel === 1) {
          setWithoutTrump((prev) => !prev);
        } else if (navLevel === 2) {
          if (canSkip) {
            setActionIndex((prev) => (prev === 0 ? 1 : 0));
          }
        }
        sounds.buttonClick();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (navLevel === 2) {
          if (actionIndex === 0 && canSkip) {
            onSkip();
          } else if (actionIndex === 1 || !canSkip) {
            if (isCurrentBetValid()) {
              onPlaceBet();
            }
          }
        } else {
          setNavLevel(2);
        }
        sounds.buttonClick();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (navLevel > 0) {
          setNavLevel((prev) => prev - 1);
        } else if (canSkip) {
          onSkip();
        }
        sounds.buttonClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isMyTurn,
    hasPlacedBet,
    selectedAmount,
    withoutTrump,
    navLevel,
    actionIndex,
    canSkip,
    isCurrentBetValid,
    onSkip,
    onPlaceBet,
    setSelectedAmount,
    setWithoutTrump,
    scrollToLevel,
  ]);

  return {
    navLevel,
    setNavLevel,
    actionIndex,
    setActionIndex,
  };
}

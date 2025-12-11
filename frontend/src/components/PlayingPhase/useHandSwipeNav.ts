/**
 * useHandSwipeNav Hook
 *
 * Handles touch/swipe navigation for mobile fan-style card display.
 * Provides real-time preview during swipe and commits on release.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { sounds } from '../../utils/sounds';

interface UseHandSwipeNavOptions {
  /** Number of cards in hand */
  cardCount: number;
}

interface UseHandSwipeNavReturn {
  /** Index of the currently focused card */
  focusedCardIndex: number;
  /** Set the focused card index */
  setFocusedCardIndex: (index: number) => void;
  /** Preview index during active swipe (null when not swiping) */
  previewCardIndex: number | null;
  /** Touch start handler */
  handleTouchStart: (e: React.TouchEvent) => void;
  /** Touch move handler */
  handleTouchMove: (e: React.TouchEvent) => void;
  /** Touch end handler */
  handleTouchEnd: (e: React.TouchEvent) => void;
  /** Click handler to focus a specific card */
  handleCardFocus: (index: number) => void;
}

export function useHandSwipeNav({ cardCount }: UseHandSwipeNavOptions): UseHandSwipeNavReturn {
  // Track focused card index for swipe navigation
  const [focusedCardIndex, setFocusedCardIndex] = useState<number>(Math.floor(cardCount / 2));
  // Preview index shows which card WILL be selected during active swipe
  const [previewCardIndex, setPreviewCardIndex] = useState<number | null>(null);

  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const startFocusedIndex = useRef<number>(0);

  // Keep focused card index in bounds when hand changes
  useEffect(() => {
    if (cardCount > 0 && focusedCardIndex >= cardCount) {
      setFocusedCardIndex(cardCount - 1);
    }
  }, [cardCount, focusedCardIndex]);

  // Touch handlers for mobile swipe navigation - real-time preview during swipe
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      startFocusedIndex.current = focusedCardIndex;
      setPreviewCardIndex(null);
    },
    [focusedCardIndex]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      const deltaX = touchX - touchStartX.current;
      const deltaY = touchY - touchStartY.current;

      // Only handle horizontal swipes
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 15) {
        // Calculate preview index based on swipe distance (40px per card)
        const cardsToMove = Math.round(deltaX / -40); // negative because swipe left = next card
        const newIndex = Math.max(0, Math.min(cardCount - 1, startFocusedIndex.current + cardsToMove));
        setPreviewCardIndex(newIndex);
      }
    },
    [cardCount]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX.current;
      const deltaY = touchEndY - touchStartY.current;

      // Commit the preview if we were swiping horizontally
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
        const cardsToMove = Math.round(deltaX / -40);
        const newIndex = Math.max(0, Math.min(cardCount - 1, startFocusedIndex.current + cardsToMove));
        setFocusedCardIndex(newIndex);
        sounds.cardDeal();
      }

      // Clear preview
      setPreviewCardIndex(null);
    },
    [cardCount]
  );

  // Click on a card in mobile fan mode sets it as focused
  const handleCardFocus = useCallback((index: number) => {
    setFocusedCardIndex(index);
  }, []);

  return {
    focusedCardIndex,
    setFocusedCardIndex,
    previewCardIndex,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleCardFocus,
  };
}

/**
 * useHandKeyboardNav Hook
 *
 * Handles keyboard navigation for the player's hand.
 * Supports arrow keys, tab, number keys, and enter/space for selection.
 */

import { useState, useEffect, RefObject } from 'react';
import { Card as CardType } from '../../types/game';
import { sounds } from '../../utils/sounds';

interface UseHandKeyboardNavOptions {
  /** Player's hand of cards */
  hand: CardType[];
  /** Whether it's the current player's turn */
  isCurrentTurn: boolean;
  /** Current player index (for turn change detection) */
  currentPlayerIndex: number;
  /** Check if a card is playable */
  isCardPlayable: (card: CardType) => boolean;
  /** Callback when a card is clicked/selected */
  onCardClick: (card: CardType) => void;
  /** Refs to card elements for scrolling */
  cardRefs: RefObject<(HTMLDivElement | null)[]>;
}

interface UseHandKeyboardNavReturn {
  /** Currently selected card index */
  selectedCardIndex: number | null;
  /** Set the selected card index */
  setSelectedCardIndex: (index: number | null) => void;
}

export function useHandKeyboardNav({
  hand,
  isCurrentTurn,
  currentPlayerIndex,
  isCardPlayable,
  onCardClick,
  cardRefs,
}: UseHandKeyboardNavOptions): UseHandKeyboardNavReturn {
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);

  // Keyboard navigation
  useEffect(() => {
    if (hand.length === 0) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // When it's your turn: only navigate playable cards
      // When it's NOT your turn: navigate all cards (for queuing)
      const navigableCardsIndexes = isCurrentTurn
        ? hand
            .map((card, index) => ({ card, index }))
            .filter(({ card }) => isCardPlayable(card))
            .map(({ index }) => index)
        : hand.map((_, index) => index);

      if (navigableCardsIndexes.length === 0) return;

      // Arrow keys: navigate through cards
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        sounds.cardDeal();

        if (selectedCardIndex === null) {
          setSelectedCardIndex(navigableCardsIndexes[0]);
        } else {
          const currentPos = navigableCardsIndexes.indexOf(selectedCardIndex);

          if (e.key === 'ArrowRight') {
            const nextPos = (currentPos + 1) % navigableCardsIndexes.length;
            setSelectedCardIndex(navigableCardsIndexes[nextPos]);
          } else {
            const prevPos =
              (currentPos - 1 + navigableCardsIndexes.length) % navigableCardsIndexes.length;
            setSelectedCardIndex(navigableCardsIndexes[prevPos]);
          }
        }
      }
      // Tab: cycle through cards
      else if (e.key === 'Tab') {
        e.preventDefault();
        sounds.cardDeal();

        if (selectedCardIndex === null || navigableCardsIndexes.length === 0) {
          setSelectedCardIndex(navigableCardsIndexes[0]);
        } else {
          const currentPos = navigableCardsIndexes.indexOf(selectedCardIndex);
          const nextPos = e.shiftKey
            ? (currentPos - 1 + navigableCardsIndexes.length) % navigableCardsIndexes.length
            : (currentPos + 1) % navigableCardsIndexes.length;
          setSelectedCardIndex(navigableCardsIndexes[nextPos]);
        }
      }
      // Enter or Space: play/queue selected card
      else if ((e.key === 'Enter' || e.key === ' ') && selectedCardIndex !== null) {
        e.preventDefault();
        const card = hand[selectedCardIndex];
        if (!card) return;

        // If it's your turn: play the card (if playable)
        if (isCurrentTurn) {
          if (isCardPlayable(card)) {
            sounds.cardPlay();
            onCardClick(card);
            setSelectedCardIndex(null);
          }
        } else {
          // If NOT your turn: queue the card
          sounds.cardDeal();
          onCardClick(card);
        }
      }
      // Number keys 1-9: quick select card by position
      else if (e.key >= '1' && e.key <= '9') {
        const cardIndex = parseInt(e.key) - 1;
        if (cardIndex < hand.length && navigableCardsIndexes.includes(cardIndex)) {
          e.preventDefault();
          sounds.cardDeal();
          setSelectedCardIndex(cardIndex);
        }
      }
      // Escape: clear selection
      else if (e.key === 'Escape' && selectedCardIndex !== null) {
        e.preventDefault();
        setSelectedCardIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isCurrentTurn, hand, selectedCardIndex, isCardPlayable, onCardClick]);

  // Reset selection when turn changes
  useEffect(() => {
    setSelectedCardIndex(null);
  }, [currentPlayerIndex]);

  // Scroll selected card into view
  useEffect(() => {
    if (selectedCardIndex !== null && cardRefs.current && cardRefs.current[selectedCardIndex]) {
      cardRefs.current[selectedCardIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [selectedCardIndex, cardRefs]);

  return {
    selectedCardIndex,
    setSelectedCardIndex,
  };
}

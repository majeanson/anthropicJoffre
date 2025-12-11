/**
 * useCardQueue Hook
 *
 * Manages card queuing functionality for pre-selecting a card to play
 * on the player's next turn.
 */

import { useState, useEffect, useCallback } from 'react';
import { Card as CardType, Player, TrickCard, GameState } from '../../types/game';
import { sounds } from '../../utils/sounds';

interface UseCardQueueOptions {
  /** Whether it's the current player's turn */
  isCurrentTurn: boolean;
  /** Whether trick is being collected (don't auto-play during this) */
  isTrickCollecting: boolean;
  /** Current player object */
  currentPlayer: Player | undefined;
  /** Current trick cards */
  currentTrick: TrickCard[];
  /** Previous trick info (for detecting trick wins) */
  previousTrick?: GameState['previousTrick'];
  /** Current round number (resets queue on new round) */
  roundNumber: number;
  /** Callback to play a card */
  onPlayCard: (card: CardType) => void;
}

interface UseCardQueueReturn {
  /** Currently queued card */
  queuedCard: CardType | null;
  /** Handler to queue/unqueue a card */
  handleQueueCard: (card: CardType | null) => void;
}

export function useCardQueue({
  isCurrentTurn,
  isTrickCollecting,
  currentPlayer,
  currentTrick,
  previousTrick,
  roundNumber,
  onPlayCard,
}: UseCardQueueOptions): UseCardQueueReturn {
  const [queuedCard, setQueuedCard] = useState<CardType | null>(null);
  // Track if the card was queued while it was the player's turn (for continuous play flow)
  const [queuedDuringOwnTurn, setQueuedDuringOwnTurn] = useState(false);

  // Auto-play queued card when turn comes
  useEffect(() => {
    // Don't process queue during trick collection animation - keep card queued
    if (isTrickCollecting) return;

    if (!isCurrentTurn || !queuedCard || !currentPlayer) return;

    const cardInHand = currentPlayer.hand.some(
      (c) => c.color === queuedCard.color && c.value === queuedCard.value
    );
    if (!cardInHand) {
      setQueuedCard(null);
      setQueuedDuringOwnTurn(false);
      return;
    }

    // Don't auto-play if:
    // 1. Player just won the trick and is now leading AND
    // 2. The card was queued while waiting (not during own turn)
    // This allows continuous play flow when winning tricks (queue 7, play, queue 6, auto-play, etc.)
    const justWonTrick =
      currentTrick.length === 0 &&
      previousTrick?.winnerName === currentPlayer.name;
    if (justWonTrick && !queuedDuringOwnTurn) {
      // Keep the card queued but don't auto-play - player queued while waiting, now they're leading
      return;
    }

    let isValidToPlay = true;
    // Only validate suit-following if there are 1-3 cards in the trick (someone has led)
    // When currentTrick.length === 4, the previous trick is still displayed for 2 seconds,
    // but we're actually leading a new trick (no suit-following required)
    // When currentTrick.length === 0, we're also leading (no suit-following required)
    if (currentTrick.length > 0 && currentTrick.length < 4) {
      const ledSuit = currentTrick[0].card.color;
      const hasLedSuit = currentPlayer.hand.some((c) => c.color === ledSuit);
      if (hasLedSuit && queuedCard.color !== ledSuit) {
        isValidToPlay = false;
      }
    }

    if (!isValidToPlay) {
      setQueuedCard(null);
      setQueuedDuringOwnTurn(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      sounds.cardConfirm(queuedCard.value);
      onPlayCard(queuedCard);
      setQueuedCard(null);
      setQueuedDuringOwnTurn(false);
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [
    isCurrentTurn,
    isTrickCollecting,
    queuedCard,
    queuedDuringOwnTurn,
    currentPlayer,
    currentTrick,
    previousTrick,
    onPlayCard,
  ]);

  // Clear queue on new round
  useEffect(() => {
    setQueuedCard(null);
    setQueuedDuringOwnTurn(false);
  }, [roundNumber]);

  // Handler to queue/unqueue a card
  const handleQueueCard = useCallback(
    (card: CardType | null) => {
      if (!card) {
        setQueuedCard(null);
        setQueuedDuringOwnTurn(false);
        return;
      }
      if (queuedCard && queuedCard.color === card.color && queuedCard.value === card.value) {
        // Unqueue - clicking same card
        setQueuedCard(null);
        setQueuedDuringOwnTurn(false);
      } else {
        // Queue new card - track if it was queued during own turn for continuous play flow
        setQueuedCard(card);
        setQueuedDuringOwnTurn(isCurrentTurn);
        sounds.cardDeal();
      }
    },
    [queuedCard, isCurrentTurn]
  );

  return {
    queuedCard,
    handleQueueCard,
  };
}

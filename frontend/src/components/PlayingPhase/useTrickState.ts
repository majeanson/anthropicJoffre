/**
 * useTrickState Hook
 *
 * Manages trick collection state and winner tracking for the playing phase.
 */

import { useState, useEffect, useRef } from 'react';
import { Player, TrickCard, GameState } from '../../types/game';
import { sounds } from '../../utils/sounds';

interface UseTrickStateOptions {
  /** Current trick cards */
  currentTrick: TrickCard[];
  /** Previous trick info */
  previousTrick?: GameState['previousTrick'];
  /** ID of current trick winner */
  currentTrickWinnerId: string | null;
  /** All players in the game */
  players: Player[];
  /** Current player's team ID */
  currentPlayerTeamId?: 1 | 2;
}

interface UseTrickStateReturn {
  /** Whether trick is currently being collected */
  isTrickCollecting: boolean;
  /** Name of the player who won the last trick */
  lastTrickWinnerName: string | null;
  /** Trick winner celebration info */
  trickWinner: {
    playerName: string;
    points: number;
    teamId: 1 | 2;
    position: 'bottom' | 'left' | 'top' | 'right';
  } | null;
  /** Set trick winner (used by socket listener) */
  setTrickWinner: (winner: {
    playerName: string;
    points: number;
    teamId: 1 | 2;
    position: 'bottom' | 'left' | 'top' | 'right';
  } | null) => void;
}

export function useTrickState({
  currentTrick,
  previousTrick,
  currentTrickWinnerId,
  players,
  currentPlayerTeamId,
}: UseTrickStateOptions): UseTrickStateReturn {
  // Track trick collection animation state (persists turn indicator during collection)
  const [isTrickCollecting, setIsTrickCollecting] = useState(false);
  const [lastTrickWinnerName, setLastTrickWinnerName] = useState<string | null>(null);

  // Trick winner celebration state
  const [trickWinner, setTrickWinner] = useState<{
    playerName: string;
    points: number;
    teamId: 1 | 2;
    position: 'bottom' | 'left' | 'top' | 'right';
  } | null>(null);

  // Track which trick we've already played sound for
  const lastSoundedTrickWinnerRef = useRef<string | null>(null);

  // Track trick collection state - when 4 cards are in trick, set collecting for 2 seconds
  // Use a ref to track the timeout so we can let it complete even if dependencies change
  const collectingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (currentTrick.length === 4) {
      // Find the winner (based on previousTrick when it gets updated, or infer from currentTrick)
      const winnerInfo = currentTrickWinnerId
        ? players.find((p) => p.id === currentTrickWinnerId)
        : null;
      if (winnerInfo) {
        setLastTrickWinnerName(winnerInfo.name);
      }
      setIsTrickCollecting(true);

      // Clear any existing timeout before starting a new one
      if (collectingTimeoutRef.current) {
        clearTimeout(collectingTimeoutRef.current);
      }

      collectingTimeoutRef.current = setTimeout(() => {
        setIsTrickCollecting(false);
        setLastTrickWinnerName(null);
        collectingTimeoutRef.current = null;
      }, 2000);

      // Don't clear timeout on effect cleanup - let it complete
      // This fixes the bug where backend clearing the trick would cancel the timeout
      // before it had a chance to reset isTrickCollecting
    } else if (currentTrick.length === 0 && !collectingTimeoutRef.current) {
      // If trick is empty and no timeout is running, ensure collecting state is reset
      // This handles edge cases like component remounting or missed state updates
      setIsTrickCollecting(false);
      setLastTrickWinnerName(null);
    }
  }, [currentTrick.length, currentTrickWinnerId, players]);

  // Cleanup timeout on unmount only
  useEffect(() => {
    return () => {
      if (collectingTimeoutRef.current) {
        clearTimeout(collectingTimeoutRef.current);
      }
    };
  }, []);

  // Win/loss sound effects
  useEffect(() => {
    if (!previousTrick) return;

    const winnerId = previousTrick.winnerId;
    if (lastSoundedTrickWinnerRef.current === winnerId) return;
    lastSoundedTrickWinnerRef.current = winnerId;

    const winnerTeamId = players.find((p) => p.id === winnerId)?.teamId;

    if (winnerTeamId === currentPlayerTeamId) {
      sounds.trickWon();
    } else {
      sounds.trickCollect();
    }
  }, [previousTrick, currentPlayerTeamId, players]);

  return {
    isTrickCollecting,
    lastTrickWinnerName,
    trickWinner,
    setTrickWinner,
  };
}

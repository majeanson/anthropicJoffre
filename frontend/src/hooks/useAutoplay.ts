/**
 * Autoplay Hook
 * Manages autoplay mode where the human player is controlled by bot AI
 * Sprint 3 Refactoring - Phase 1.4
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { GameState, Card } from '../types/game';
import { EnhancedBotPlayer as BotPlayer } from '../utils/botPlayerEnhanced';

interface UseAutoplayProps {
  gameState: GameState | null;
  socket: Socket | null;
  onPlaceBet: (amount: number, withoutTrump: boolean, skipped: boolean) => void;
  onPlayCard: (card: Card) => void;
}

interface UseAutoplayReturn {
  autoplayEnabled: boolean;
  toggleAutoplay: () => void;
  setAutoplayEnabled: (enabled: boolean) => void;
  /** Seconds remaining before autoplay takes action (0 if not active) */
  countdownSeconds: number;
  /** Whether autoplay is currently counting down to take an action */
  isCountingDown: boolean;
}

/**
 * Hook to manage autoplay mode
 *
 * When enabled, the bot AI will automatically play for the human player
 * including betting, card playing, and ready confirmations
 */
export function useAutoplay({
  gameState,
  socket,
  onPlaceBet,
  onPlayCard,
}: UseAutoplayProps): UseAutoplayReturn {
  const [autoplayEnabled, setAutoplayEnabled] = useState<boolean>(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0);
  const [isCountingDown, setIsCountingDown] = useState<boolean>(false);
  const autoplayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const toggleAutoplay = useCallback(() => {
    setAutoplayEnabled((prev) => !prev);
  }, []);

  // Extract specific values from gameState to prevent infinite re-renders
  const phase = gameState?.phase;
  const currentPlayerIndex = gameState?.currentPlayerIndex;
  const currentPlayerId = gameState?.players[currentPlayerIndex || 0]?.id;
  const playersReadyList = gameState?.playersReady;
  const gameId = gameState?.id;

  // Helper to clear countdown interval
  const clearCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdownSeconds(0);
    setIsCountingDown(false);
  }, []);

  // Helper to start countdown with visual feedback
  const startCountdown = useCallback((delayMs: number, onComplete: () => void) => {
    clearCountdown();

    const totalSeconds = Math.ceil(delayMs / 1000);
    setCountdownSeconds(totalSeconds);
    setIsCountingDown(true);

    // Update countdown every second
    const startTime = Date.now();
    countdownIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, Math.ceil((delayMs - elapsed) / 1000));
      setCountdownSeconds(remaining);

      if (remaining <= 0) {
        clearCountdown();
      }
    }, 100); // Update frequently for smooth display

    // Schedule the action
    autoplayTimeoutRef.current = setTimeout(() => {
      clearCountdown();
      onComplete();
      autoplayTimeoutRef.current = null;
    }, delayMs);
  }, [clearCountdown]);

  // Autoplay effect: when enabled and it's the player's turn, act as a bot
  useEffect(() => {
    if (!autoplayEnabled || !gameState || !socket) {
      clearCountdown();
      return;
    }
    if (phase !== 'betting' && phase !== 'playing' && phase !== 'scoring') {
      clearCountdown();
      return;
    }

    // CRITICAL: Use player name as stable identifier (socket.id changes on reconnect)
    const myPlayerName = localStorage.getItem('playerName') || '';
    const me = gameState.players.find((p) => p.name === myPlayerName);
    if (!me) {
      clearCountdown();
      return; // Player not found in game
    }

    const myPlayerId = me.id; // Get socket ID from player object

    // For scoring phase, auto-ready
    if (phase === 'scoring') {
      // playersReady now stores names, not IDs
      const isAlreadyReady = playersReadyList?.includes(me.name) || false;
      if (!isAlreadyReady) {
        // Clear any existing autoplay timeout
        if (autoplayTimeoutRef.current) {
          clearTimeout(autoplayTimeoutRef.current);
          autoplayTimeoutRef.current = null;
        }
        clearCountdown();

        // Schedule ready action with bot delay and countdown
        startCountdown(BotPlayer.getActionDelay(), () => {
          socket.emit('player_ready', { gameId });
        });
      }
      return;
    }

    // Only act if it's my turn (use extracted currentPlayerId to prevent stale closure)
    if (!currentPlayerId || currentPlayerId !== myPlayerId) {
      clearCountdown();
      return;
    }

    // Clear any existing autoplay timeout
    if (autoplayTimeoutRef.current) {
      clearTimeout(autoplayTimeoutRef.current);
      autoplayTimeoutRef.current = null;
    }

    // Schedule autoplay action with bot delay and countdown
    startCountdown(BotPlayer.getActionDelay(), () => {
      if (phase === 'betting') {
        const bet = BotPlayer.makeBet(gameState, myPlayerId);
        onPlaceBet(bet.amount, bet.withoutTrump, bet.skipped);
      } else if (phase === 'playing') {
        const card = BotPlayer.playCard(gameState, myPlayerId);
        if (card) {
          onPlayCard(card);
        }
      }
    });

    return () => {
      if (autoplayTimeoutRef.current) {
        clearTimeout(autoplayTimeoutRef.current);
        autoplayTimeoutRef.current = null;
      }
      clearCountdown();
    };
  }, [
    autoplayEnabled,
    phase,
    currentPlayerId,
    playersReadyList,
    socket,
    gameState,
    gameId,
    onPlaceBet,
    onPlayCard,
    startCountdown,
    clearCountdown,
  ]);

  return {
    autoplayEnabled,
    toggleAutoplay,
    setAutoplayEnabled,
    countdownSeconds,
    isCountingDown,
  };
}

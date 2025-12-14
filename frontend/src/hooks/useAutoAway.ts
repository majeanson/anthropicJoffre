/**
 * useAutoAway - Automatic away status detection
 *
 * Tracks user activity and automatically sets status to 'away' after inactivity.
 * Restores previous status when activity resumes.
 *
 * Features:
 * - Tracks mouse, keyboard, scroll, touch, and visibility events
 * - Configurable timeout (default 5 minutes)
 * - Distinguishes between auto-away and manual away
 * - Restores previous status on activity
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { PlayerStatus } from '../types/game';

interface UseAutoAwayProps {
  socket: Socket | null;
  /** Whether the user is in the lounge */
  isInLounge: boolean;
  /** Current player status */
  currentStatus: PlayerStatus;
  /** Timeout in milliseconds before marking as away (default: 5 minutes) */
  timeout?: number;
  /** Whether auto-away is enabled */
  enabled?: boolean;
}

interface UseAutoAwayReturn {
  /** Whether the user is currently auto-away (not manually set) */
  isAutoAway: boolean;
  /** Time until auto-away triggers (in seconds), null if not counting */
  timeUntilAway: number | null;
  /** Manually set away status (this disables auto-restore) */
  setManualAway: () => void;
  /** Clear manual away and restore to in_lounge */
  clearManualAway: () => void;
}

// Activity events to track
const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click',
  'wheel',
] as const;

// Default timeout: 5 minutes
const DEFAULT_TIMEOUT = 5 * 60 * 1000;

export function useAutoAway({
  socket,
  isInLounge,
  currentStatus,
  timeout = DEFAULT_TIMEOUT,
  enabled = true,
}: UseAutoAwayProps): UseAutoAwayReturn {
  const [isAutoAway, setIsAutoAway] = useState(false);
  const [timeUntilAway, setTimeUntilAway] = useState<number | null>(null);
  const [isManualAway, setIsManualAway] = useState(false);

  // Refs for tracking
  const lastActivityRef = useRef<number>(Date.now());
  const previousStatusRef = useRef<PlayerStatus>(currentStatus);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update previous status when it changes (but not to 'away')
  useEffect(() => {
    if (currentStatus !== 'away') {
      previousStatusRef.current = currentStatus;
    }
  }, [currentStatus]);

  // Handle activity detection
  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now();

    // If user was auto-away, restore their previous status
    if (isAutoAway && !isManualAway && socket && isInLounge) {
      setIsAutoAway(false);
      socket.emit('set_player_status', { status: previousStatusRef.current });
    }
  }, [isAutoAway, isManualAway, socket, isInLounge]);

  // Handle visibility change (tab focus)
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible') {
      handleActivity();
    }
  }, [handleActivity]);

  // Set up activity listeners
  useEffect(() => {
    if (!enabled || !isInLounge) return;

    // Add activity event listeners
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, isInLounge, handleActivity, handleVisibilityChange]);

  // Set up inactivity timeout check
  useEffect(() => {
    if (!enabled || !isInLounge || !socket || isManualAway) {
      // Clear any existing timers
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      if (countdownIdRef.current) {
        clearInterval(countdownIdRef.current);
        countdownIdRef.current = null;
      }
      setTimeUntilAway(null);
      return;
    }

    // Don't start countdown if already away
    if (currentStatus === 'away') {
      setTimeUntilAway(null);
      return;
    }

    const checkInactivity = () => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityRef.current;
      const timeRemaining = timeout - timeSinceActivity;

      if (timeRemaining <= 0 && !isAutoAway) {
        // Mark as away
        setIsAutoAway(true);
        socket.emit('set_player_status', { status: 'away' });
        setTimeUntilAway(null);
      } else if (timeRemaining > 0) {
        setTimeUntilAway(Math.ceil(timeRemaining / 1000));
      }
    };

    // Initial check
    checkInactivity();

    // Set up interval to update countdown
    countdownIdRef.current = setInterval(checkInactivity, 1000);

    return () => {
      if (countdownIdRef.current) {
        clearInterval(countdownIdRef.current);
        countdownIdRef.current = null;
      }
    };
  }, [enabled, isInLounge, socket, timeout, currentStatus, isAutoAway, isManualAway]);

  // Manual away control
  const setManualAway = useCallback(() => {
    if (!socket || !isInLounge) return;
    setIsManualAway(true);
    setIsAutoAway(false);
    socket.emit('set_player_status', { status: 'away' });
  }, [socket, isInLounge]);

  const clearManualAway = useCallback(() => {
    if (!socket || !isInLounge) return;
    setIsManualAway(false);
    setIsAutoAway(false);
    lastActivityRef.current = Date.now();
    socket.emit('set_player_status', { status: previousStatusRef.current });
  }, [socket, isInLounge]);

  // Reset state when leaving lounge
  useEffect(() => {
    if (!isInLounge) {
      setIsAutoAway(false);
      setIsManualAway(false);
      setTimeUntilAway(null);
    }
  }, [isInLounge]);

  return {
    isAutoAway,
    timeUntilAway,
    setManualAway,
    clearManualAway,
  };
}

export default useAutoAway;

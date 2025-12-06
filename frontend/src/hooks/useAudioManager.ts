/**
 * Audio Manager Hook
 * Manages sound effects and audio state
 * Sprint 3 Refactoring - Phase 1.1
 */

import { useState, useCallback, useEffect } from 'react';
import { sounds } from '../utils/sounds';
import { GameState } from '../types/game';

interface UseAudioManagerProps {
  gameState: GameState | null;
}

interface UseAudioManagerReturn {
  soundEnabled: boolean;
  toggleSound: () => void;
  playGameOverSound: () => void;
  playErrorSound: () => void;
}

/**
 * Hook to manage audio state and sound effects
 *
 * Handles:
 * - Sound on/off toggle
 * - Game over sound
 * - Error sound
 * - Sound state persistence
 */
export function useAudioManager({ gameState }: UseAudioManagerProps): UseAudioManagerReturn {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem('soundEnabled');
    return saved === null ? true : saved === 'true';
  });

  // Persist sound setting to localStorage
  useEffect(() => {
    localStorage.setItem('soundEnabled', soundEnabled.toString());
    sounds.setEnabled(soundEnabled);
  }, [soundEnabled]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const newState = !prev;
      sounds.setEnabled(newState);
      if (newState) {
        sounds.buttonClick(); // Play test sound when enabling
      }
      return newState;
    });
  }, []);

  const playGameOverSound = useCallback(() => {
    if (soundEnabled && gameState?.phase === 'game_over') {
      sounds.gameOver();
    }
  }, [soundEnabled, gameState?.phase]);

  const playErrorSound = useCallback(() => {
    if (soundEnabled) {
      sounds.error();
    }
  }, [soundEnabled]);

  // Auto-play game over sound when game ends
  useEffect(() => {
    if (gameState?.phase === 'game_over') {
      playGameOverSound();
    }
  }, [gameState?.phase, playGameOverSound]);

  return {
    soundEnabled,
    toggleSound,
    playGameOverSound,
    playErrorSound,
  };
}

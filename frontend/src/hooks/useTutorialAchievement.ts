/**
 * Tutorial Achievement Hook
 * Checks for tutorial completion and triggers achievement unlock
 */

import { useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { areAllTutorialsCompleted } from '../utils/tutorialProgress';
import { useAuth } from '../contexts/AuthContext';
import logger from '../utils/logger';

interface UseTutorialAchievementProps {
  socket: Socket | null;
}

interface UseTutorialAchievementReturn {
  checkTutorialAchievement: () => void;
}

/**
 * Hook to check and unlock tutorial completion achievement
 * Returns a function to manually trigger achievement check
 */
export function useTutorialAchievement({
  socket,
}: UseTutorialAchievementProps): UseTutorialAchievementReturn {
  const { user, isAuthenticated } = useAuth();
  const hasUnlockedRef = useRef(false);

  const checkTutorialAchievement = useCallback(() => {
    // Only unlock once per session
    if (hasUnlockedRef.current) return;

    // Only for authenticated users
    if (!isAuthenticated || !user || !socket) return;

    // Check if all tutorials are completed
    const allCompleted = areAllTutorialsCompleted();

    if (allCompleted) {
      // Mark as unlocked to prevent duplicate requests
      hasUnlockedRef.current = true;

      // Request achievement unlock from server
      socket.emit('check_tutorial_achievement', {
        playerName: user.username,
      });

      logger.info('All tutorials completed! Requesting Master Student achievement unlock...');
    }
  }, [socket, isAuthenticated, user]);

  // Check on mount and when socket/auth becomes available
  // This handles retroactive unlocks for users who already completed tutorials
  useEffect(() => {
    // Only run when all dependencies are available
    if (socket && isAuthenticated && user) {
      checkTutorialAchievement();
    }
  }, [socket, isAuthenticated, user, checkTutorialAchievement]);

  return { checkTutorialAchievement };
}

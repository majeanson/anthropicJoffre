/**
 * Tutorial Achievement Hook
 * Checks for tutorial completion and triggers achievement unlock
 */

import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { areAllTutorialsCompleted } from '../utils/tutorialProgress';
import { useAuth } from '../contexts/AuthContext';

interface UseTutorialAchievementProps {
  socket: Socket | null;
}

/**
 * Hook to check and unlock tutorial completion achievement
 * Runs when all tutorials are completed
 */
export function useTutorialAchievement({ socket }: UseTutorialAchievementProps) {
  const { user, isAuthenticated } = useAuth();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Only check once per session
    if (hasCheckedRef.current) return;

    // Only for authenticated users
    if (!isAuthenticated || !user || !socket) return;

    // Check if all tutorials are completed
    const allCompleted = areAllTutorialsCompleted();

    if (allCompleted) {
      // Mark as checked to prevent duplicate requests
      hasCheckedRef.current = true;

      // Request achievement unlock from server
      socket.emit('check_tutorial_achievement', {
        playerName: user.username,
      });

      console.log('✅ All tutorials completed! Requesting achievement unlock...');
    }
  }, [socket, isAuthenticated, user]);
}

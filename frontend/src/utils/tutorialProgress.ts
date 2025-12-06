/**
 * Tutorial Progress Tracking System
 * Tracks which tutorials have been completed by the user
 */

import { TutorialPhase } from '../components/BeginnerTutorial';

// Re-export TutorialPhase for convenience
export type { TutorialPhase };

const STORAGE_KEY = 'tutorialProgress';
const COMPLETION_STORAGE_KEY = 'tutorialCompletedPhases';

export interface TutorialProgress {
  completedPhases: Set<TutorialPhase>;
  lastCompletedDate?: Date;
  totalPhasesCompleted: number;
  completionPercentage: number;
}

// All available tutorial phases
export const ALL_TUTORIAL_PHASES: TutorialPhase[] = [
  'team_selection',
  'betting_intro',
  'betting_decision',
  'playing_intro',
  'playing_suit',
  'playing_trump',
  'trick_complete',
  'special_cards',
  'round_summary',
];

/**
 * Get tutorial progress from localStorage
 */
export function getTutorialProgress(): TutorialProgress {
  const saved = localStorage.getItem(COMPLETION_STORAGE_KEY);
  const completedPhases = saved
    ? new Set<TutorialPhase>(JSON.parse(saved))
    : new Set<TutorialPhase>();

  const totalPhasesCompleted = completedPhases.size;
  const completionPercentage = Math.round(
    (totalPhasesCompleted / ALL_TUTORIAL_PHASES.length) * 100
  );

  return {
    completedPhases,
    totalPhasesCompleted,
    completionPercentage,
  };
}

/**
 * Mark a tutorial phase as completed
 */
export function markTutorialCompleted(phase: TutorialPhase): void {
  const progress = getTutorialProgress();
  progress.completedPhases.add(phase);

  localStorage.setItem(COMPLETION_STORAGE_KEY, JSON.stringify([...progress.completedPhases]));
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      lastCompletedDate: new Date().toISOString(),
      totalPhasesCompleted: progress.completedPhases.size,
    })
  );
}

/**
 * Check if a tutorial phase has been completed
 */
export function isTutorialCompleted(phase: TutorialPhase): boolean {
  const progress = getTutorialProgress();
  return progress.completedPhases.has(phase);
}

/**
 * Check if all tutorials have been completed
 */
export function areAllTutorialsCompleted(): boolean {
  const progress = getTutorialProgress();
  return progress.completionPercentage === 100;
}

/**
 * Reset all tutorial progress (for testing or user request)
 */
export function resetTutorialProgress(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(COMPLETION_STORAGE_KEY);
  // Also clear the old dismissed phases key
  localStorage.removeItem('tutorialDismissed');
}

/**
 * Get remaining tutorials
 */
export function getRemainingTutorials(): TutorialPhase[] {
  const progress = getTutorialProgress();
  return ALL_TUTORIAL_PHASES.filter((phase) => !progress.completedPhases.has(phase));
}

/**
 * Export tutorial stats for achievements
 */
export function getTutorialStats() {
  const progress = getTutorialProgress();
  const remaining = getRemainingTutorials();

  return {
    total: ALL_TUTORIAL_PHASES.length,
    completed: progress.totalPhasesCompleted,
    remaining: remaining.length,
    percentage: progress.completionPercentage,
    allCompleted: areAllTutorialsCompleted(),
    completedPhases: Array.from(progress.completedPhases),
    remainingPhases: remaining,
  };
}

/**
 * Tutorial Progress Modal
 * Shows completed and remaining tutorial steps in beginner mode
 */

import { useEffect, useRef } from 'react';
import { getTutorialStats, ALL_TUTORIAL_PHASES, TutorialPhase } from '../utils/tutorialProgress';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface TutorialProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TUTORIAL_ICONS: Record<TutorialPhase, string> = {
  team_selection: '👋',
  betting_intro: '🎯',
  betting_decision: '🤔',
  playing_intro: '🃏',
  playing_suit: '⚠️',
  playing_trump: '👑',
  trick_complete: '🎉',
  special_cards: '✨',
  round_summary: '📊',
};

const TUTORIAL_TITLES: Record<TutorialPhase, string> = {
  team_selection: 'Welcome to Jaffre!',
  betting_intro: 'Betting Phase',
  betting_decision: 'Making Your Bet',
  playing_intro: 'Playing Cards',
  playing_suit: 'Following Suit',
  playing_trump: 'Using Trump Cards',
  trick_complete: 'Trick Won!',
  special_cards: 'Special Cards',
  round_summary: 'Round Complete',
};

export function TutorialProgressModal({ isOpen, onClose }: TutorialProgressModalProps) {
  const stats = getTutorialStats();
  const lastCompletedRef = useRef<HTMLDivElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to the most recently completed tutorial when modal opens
  useEffect(() => {
    if (isOpen && lastCompletedRef.current && listContainerRef.current) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        lastCompletedRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [isOpen]);

  // Find the index of the last completed tutorial
  const lastCompletedIndex = ALL_TUTORIAL_PHASES.reduce((lastIdx, phase, idx) => {
    return stats.completedPhases.includes(phase) ? idx : lastIdx;
  }, -1);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tutorial Progress"
      icon={<span>📚</span>}
      theme="green"
      size="md"
      customHeight="max-h-[80vh]"
      testId="tutorial-progress-modal"
    >
      {/* Progress Bar */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex-1 bg-blue-800/50 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-green-400 h-full transition-all duration-500 rounded-full"
            style={{ width: `${stats.percentage}%` }}
          />
        </div>
        <span className="text-gray-900 dark:text-white text-sm font-bold whitespace-nowrap">
          {stats.completed}/{stats.total} ({stats.percentage}%)
        </span>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Completion Message */}
        {stats.allCompleted && (
          <div className="mb-4 bg-green-100 dark:bg-green-900/30 border-2 border-green-500 rounded-lg p-4">
            <p className="text-green-800 dark:text-green-200 font-bold text-center">
                🎉 Congratulations! You've completed all tutorials!
            </p>
          </div>
        )}

        {/* Tutorial Steps List */}
        <div ref={listContainerRef} className="space-y-3">
          {ALL_TUTORIAL_PHASES.map((phase, index) => {
            const isCompleted = stats.completedPhases.includes(phase);
            const isLastCompleted = index === lastCompletedIndex;

            return (
              <div
                key={phase}
                ref={isLastCompleted ? lastCompletedRef : undefined}
                className={`
                  flex items-start gap-3 p-3 rounded-lg border-2 transition-all
                  ${
                    isCompleted
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-600'
                      : 'bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600'
                  }
                `}
              >
                {/* Icon/Checkmark */}
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                  {isCompleted ? (
                    <span className="text-2xl text-green-600 dark:text-green-400">✓</span>
                  ) : (
                    <span className="text-2xl">{TUTORIAL_ICONS[phase]}</span>
                  )}
                </div>

                {/* Title */}
                <div className="flex-1 min-w-0">
                  <h3
                    className={`
                      font-semibold text-sm
                      ${
                        isCompleted
                          ? 'text-green-800 dark:text-green-200'
                          : 'text-gray-800 dark:text-gray-200'
                      }
                    `}
                  >
                    {TUTORIAL_TITLES[phase]}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {isCompleted ? 'Completed' : 'Not yet seen'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Help Text */}
        {!stats.allCompleted && (
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <span className="font-bold">💡 Tip:</span> Tutorials appear automatically as you play.
              Complete all steps to unlock the "Tutorial Master" achievement!
            </p>
          </div>
        )}

        {/* Close Button */}
        <Button
          variant="primary"
          fullWidth
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </Modal>
  );
}

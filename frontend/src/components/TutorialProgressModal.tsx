/**
 * Tutorial Progress Modal
 * Shows completed and remaining tutorial steps in beginner mode
 */

import { getTutorialStats, ALL_TUTORIAL_PHASES, TutorialPhase } from '../utils/tutorialProgress';

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
  if (!isOpen) return null;

  const stats = getTutorialStats();

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-xl flex items-center gap-2">
              <span className="text-2xl">📚</span>
              Tutorial Progress
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-red-300 transition-colors text-2xl font-bold"
              title="Close"
            >
              ✕
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 bg-blue-800/50 rounded-full h-3 overflow-hidden">
              <div
                className="bg-green-400 h-full transition-all duration-500 rounded-full"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
            <span className="text-white text-sm font-bold whitespace-nowrap">
              {stats.completed}/{stats.total} ({stats.percentage}%)
            </span>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-160px)]">
          {/* Completion Message */}
          {stats.allCompleted && (
            <div className="mb-4 bg-green-100 dark:bg-green-900/30 border-2 border-green-500 rounded-lg p-4">
              <p className="text-green-800 dark:text-green-200 font-bold text-center">
                🎉 Congratulations! You've completed all tutorials!
              </p>
            </div>
          )}

          {/* Tutorial Steps List */}
          <div className="space-y-3">
            {ALL_TUTORIAL_PHASES.map((phase) => {
              const isCompleted = stats.completedPhases.includes(phase);

              return (
                <div
                  key={phase}
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
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

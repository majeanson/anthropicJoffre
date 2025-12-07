/**
 * Tutorial Progress Modal
 * Shows completed and remaining tutorial steps in beginner mode
 * Click on any step to view its full explanation
 */

import { useEffect, useRef, useState } from 'react';
import { getTutorialStats, ALL_TUTORIAL_PHASES, TutorialPhase } from '../utils/tutorialProgress';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { HowToPlay } from './HowToPlay';

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

// Same content as BeginnerTutorial.tsx for consistency
const TUTORIAL_CONTENT: Record<TutorialPhase, string> = {
  team_selection: `This is a 4-player, 2-team trick-taking card game. Here's what to do:\n\n• Choose a team (Orange or Purple)\n• Your teammate sits across from you\n• Click "Start Game" when all 4 players are ready\n\n💡 Tip: You and your teammate work together to win!`,
  betting_intro: `Now it's time to bet on how many POINTS your team will win this round.\n\n• Bets range from 7-12 points\n• Each trick is worth 1 point normally\n• Red 0 card: +5 bonus points\n• Brown 0 card: -2 penalty points\n\n💡 Tip: Look at your hand strength before betting!`,
  betting_decision: `When it's your turn to bet:\n\n• You must raise the current highest bet, or\n• You can SKIP (pass) if you don't have a strong hand\n• "Without Trump" option doubles your bet multiplier\n\n💡 Tip: The dealer (marked with 👑) cannot skip if everyone else skips!`,
  playing_intro: `Time to play! The highest bet determined the TRUMP suit.\n\n• Trump suit cards beat all other suits\n• You must play 8 tricks (8 cards each)\n• The highest card wins each trick\n\n💡 Tip: Save your high trump cards for important tricks!`,
  playing_suit: `IMPORTANT RULE: You must follow the LED SUIT if you have it!\n\n• The first card played determines the led suit\n• If you have that color, you MUST play it\n• If you don't have it, you can play any card (including trump)\n\n💡 Tip: Unplayable cards will be grayed out and marked with ✕`,
  playing_trump: `Trump cards are powerful:\n\n• They beat any non-trump card\n• Play them strategically to win important tricks\n• Higher value trumps beat lower value trumps\n\n💡 Tip: Don't waste high trumps on low-value tricks!`,
  trick_complete: `A trick is complete when all 4 players play a card.\n\n• The winner leads the next trick\n• Points are added to your team's score\n• Watch the trick counter (e.g., "Trick 3/8")\n\n💡 Tip: Keep track of which suits have been played!`,
  special_cards: `Watch out for these special cards:\n\n• 🔴 Red 0: Worth +5 bonus points\n• 🟤 Brown 0: Worth -2 penalty points\n\n💡 Tip: Try to win tricks with Red 0, and avoid winning tricks with Brown 0!`,
  round_summary: `The round is over! Here's what happens:\n\n• Compare your team's score to the bet\n• If you met/exceeded the bet: gain points\n• If you fell short: lose points\n• First team to 41+ points wins!\n\n💡 Tip: Accurate betting is key to winning!`,
};

export function TutorialProgressModal({ isOpen, onClose }: TutorialProgressModalProps) {
  const stats = getTutorialStats();
  const lastCompletedRef = useRef<HTMLDivElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const [expandedPhase, setExpandedPhase] = useState<TutorialPhase | null>(null);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

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

  // Reset expanded phase when modal closes
  useEffect(() => {
    if (!isOpen) {
      setExpandedPhase(null);
    }
  }, [isOpen]);

  // Find the index of the last completed tutorial
  const lastCompletedIndex = ALL_TUTORIAL_PHASES.reduce((lastIdx, phase, idx) => {
    return stats.completedPhases.includes(phase) ? idx : lastIdx;
  }, -1);

  const toggleExpanded = (phase: TutorialPhase) => {
    setExpandedPhase(expandedPhase === phase ? null : phase);
  };

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
        <div className="flex-1 bg-skin-tertiary rounded-full h-3 overflow-hidden">
          <div
            className="bg-green-500 h-full transition-all duration-500 rounded-full"
            style={{ width: `${stats.percentage}%` }}
          />
        </div>
        <span className="text-skin-primary text-sm font-bold whitespace-nowrap">
          {stats.completed}/{stats.total} ({stats.percentage}%)
        </span>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Completion Message */}
        {stats.allCompleted && (
          <div className="mb-4 bg-green-100 border-2 border-green-500 rounded-lg p-4">
            <p className="text-green-800 font-bold text-center">
              🎉 Congratulations! You've completed all tutorials!
            </p>
          </div>
        )}

        {/* Tutorial Steps List */}
        <div ref={listContainerRef} className="space-y-3">
          {ALL_TUTORIAL_PHASES.map((phase, index) => {
            const isCompleted = stats.completedPhases.includes(phase);
            const isLastCompleted = index === lastCompletedIndex;
            const isExpanded = expandedPhase === phase;

            return (
              <div
                key={phase}
                ref={isLastCompleted ? lastCompletedRef : undefined}
                className={`
                  rounded-lg border-2 transition-all overflow-hidden
                  ${
                    isCompleted
                      ? 'bg-skin-success border-skin-success'
                      : 'bg-skin-tertiary border-skin-default'
                  }
                  ${isExpanded ? 'ring-2 ring-blue-400' : ''}
                `}
              >
                {/* Clickable Header */}
                <button
                  onClick={() => toggleExpanded(phase)}
                  className="w-full flex items-start gap-3 p-3 text-left hover:bg-black/5 transition-colors"
                >
                  {/* Icon/Checkmark */}
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                    {isCompleted ? (
                      <span className="text-2xl text-green-600">✓</span>
                    ) : (
                      <span className="text-2xl">{TUTORIAL_ICONS[phase]}</span>
                    )}
                  </div>

                  {/* Title and Status */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`
                        font-semibold text-sm
                        ${isCompleted ? 'text-green-800' : 'text-gray-800'}
                      `}
                    >
                      {TUTORIAL_TITLES[phase]}
                    </h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {isCompleted ? 'Completed' : 'Not yet seen'} • Tap to{' '}
                      {isExpanded ? 'hide' : 'view'}
                    </p>
                  </div>

                  {/* Expand/Collapse Indicator */}
                  <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-500">
                    <span
                      className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    >
                      ▼
                    </span>
                  </div>
                </button>

                {/* Expandable Content */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-0 border-t border-gray-200">
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{TUTORIAL_ICONS[phase]}</span>
                        <span className="text-blue-800 font-bold text-sm">
                          {TUTORIAL_TITLES[phase]}
                        </span>
                      </div>
                      <p className="text-gray-800 text-sm whitespace-pre-line leading-relaxed">
                        {TUTORIAL_CONTENT[phase]}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Help Text */}
        {!stats.allCompleted && (
          <div className="mt-6 bg-blue-50 border border-blue-300 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <span className="font-bold">💡 Tip:</span> Tutorials appear automatically as you play.
              Complete all steps to unlock the "Tutorial Master" achievement!
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setShowHowToPlay(true)}>
            📖 How to Play
          </Button>
          <Button variant="primary" fullWidth onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* How to Play Modal */}
      <HowToPlay isModal={true} isOpen={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
    </Modal>
  );
}

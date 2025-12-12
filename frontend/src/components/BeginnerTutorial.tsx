/**
 * Beginner Tutorial Component
 * Displays step-by-step tutorial tips during gameplay for beginners
 * Now with progress tracking!
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GameState } from '../types/game';
import { markTutorialCompleted, getTutorialStats } from '../utils/tutorialProgress';
import { Button } from './ui/Button';

export type TutorialPhase =
  | 'team_selection'
  | 'betting_intro'
  | 'betting_decision'
  | 'playing_intro'
  | 'playing_suit'
  | 'playing_trump'
  | 'trick_complete'
  | 'round_summary'
  | 'special_cards';

interface TutorialStep {
  phase: TutorialPhase;
  title: string;
  content: string;
  icon: string;
  priority: number; // Higher priority shows first if multiple apply
}

interface BeginnerTutorialProps {
  gameState: GameState;
  currentPlayerId: string;
  onClose?: () => void;
  onDismiss?: (phase: TutorialPhase) => void;
  onAllTutorialsCompleted?: () => void;
}

const tutorialSteps: TutorialStep[] = [
  {
    phase: 'team_selection',
    title: 'Welcome to Jaffre!',
    icon: '👋',
    priority: 10,
    content: `This is a 4-player, 2-team trick-taking card game. Here's what to do:\n\n• Choose a team (Orange or Purple)\n• Your teammate sits across from you\n• Click "Start Game" when all 4 players are ready\n\n💡 Tip: You and your teammate work together to win!`,
  },
  {
    phase: 'betting_intro',
    title: 'Betting Phase',
    icon: '🎯',
    priority: 9,
    content: `Now it's time to bet on how many POINTS your team will win this round.\n\n• Bets range from 7-12 points\n• Each trick is worth 1 point normally\n• Red 0 card: +5 bonus points\n• Brown 0 card: -2 penalty points\n\n💡 Tip: Look at your hand strength before betting!`,
  },
  {
    phase: 'betting_decision',
    title: 'Making Your Bet',
    icon: '🤔',
    priority: 8,
    content: `When it's your turn to bet:\n\n• You must raise the current highest bet, or\n• You can SKIP (pass) if you don't have a strong hand\n• "Without Trump" option doubles your bet multiplier\n\n💡 Tip: The dealer (marked with 👑) cannot skip if everyone else skips!`,
  },
  {
    phase: 'playing_intro',
    title: 'Playing Cards',
    icon: '🃏',
    priority: 9,
    content: `Time to play! The highest bet determined the TRUMP suit.\n\n• Trump suit cards beat all other suits\n• You must play 8 tricks (8 cards each)\n• The highest card wins each trick\n\n💡 Tip: Save your high trump cards for important tricks!`,
  },
  {
    phase: 'playing_suit',
    title: 'Following Suit',
    icon: '⚠️',
    priority: 10,
    content: `IMPORTANT RULE: You must follow the LED SUIT if you have it!\n\n• The first card played determines the led suit\n• If you have that color, you MUST play it\n• If you don't have it, you can play any card (including trump)\n\n💡 Tip: Unplayable cards will be grayed out and marked with ✕`,
  },
  {
    phase: 'playing_trump',
    title: 'Using Trump Cards',
    icon: '👑',
    priority: 7,
    content: `Trump cards are powerful:\n\n• They beat any non-trump card\n• Play them strategically to win important tricks\n• Higher value trumps beat lower value trumps\n\n💡 Tip: Don't waste high trumps on low-value tricks!`,
  },
  {
    phase: 'trick_complete',
    title: 'Trick Won!',
    icon: '🎉',
    priority: 5,
    content: `A trick is complete when all 4 players play a card.\n\n• The winner leads the next trick\n• Points are added to your team's score\n• Watch the trick counter (e.g., "Trick 3/8")\n\n💡 Tip: Keep track of which suits have been played!`,
  },
  {
    phase: 'special_cards',
    title: 'Special Cards',
    icon: '✨',
    priority: 6,
    content: `Watch out for these special cards:\n\n• 🔴 Red 0: Worth +5 bonus points\n• 🟤 Brown 0: Worth -2 penalty points\n\n💡 Tip: Try to win tricks with Red 0, and avoid winning tricks with Brown 0!`,
  },
  {
    phase: 'round_summary',
    title: 'Round Complete',
    icon: '📊',
    priority: 4,
    content: `The round is over! Here's what happens:\n\n• Compare your team's score to the bet\n• If you met/exceeded the bet: gain points\n• If you fell short: lose points\n• First team to 41+ points wins!\n\n💡 Tip: Accurate betting is key to winning!`,
  },
];

export function BeginnerTutorial({
  gameState,
  currentPlayerId,
  onClose,
  onDismiss,
  onAllTutorialsCompleted,
}: BeginnerTutorialProps) {
  // Use centralized tutorial progress system instead of separate localStorage key
  const [dismissedPhases, setDismissedPhases] = useState<Set<TutorialPhase>>(() => {
    const progress = getTutorialStats();
    return new Set(progress.completedPhases as TutorialPhase[]);
  });

  const [currentStep, setCurrentStep] = useState<TutorialStep | null>(null);
  const [accumulatedSteps, setAccumulatedSteps] = useState<TutorialStep[]>([]);

  useEffect(() => {
    // Determine which tutorial step to show based on game state
    const applicableSteps = tutorialSteps.filter((step) => {
      if (dismissedPhases.has(step.phase)) return false;

      switch (step.phase) {
        case 'team_selection':
          return gameState.phase === 'team_selection';

        case 'betting_intro':
          return gameState.phase === 'betting' && (gameState.currentBets?.length || 0) === 0;

        case 'betting_decision':
          // Show when betting phase has at least one bet placed (so user can see the mechanics)
          return gameState.phase === 'betting' && (gameState.currentBets?.length || 0) >= 1;

        case 'playing_intro':
          return (
            gameState.phase === 'playing' &&
            (gameState.currentTrick?.length || 0) === 0 &&
            (gameState.currentRoundTricks?.length || 0) === 0
          );

        case 'playing_suit':
          return (
            gameState.phase === 'playing' &&
            (gameState.currentTrick?.length || 0) > 0 &&
            (gameState.currentRoundTricks?.length || 0) <= 1
          );

        case 'playing_trump':
          return (
            gameState.phase === 'playing' &&
            gameState.trump !== null &&
            (gameState.currentRoundTricks?.length || 0) === 1
          );

        case 'trick_complete':
          return (
            gameState.phase === 'playing' &&
            (gameState.currentTrick?.length || 0) === 4 &&
            (gameState.currentRoundTricks?.length || 0) === 1
          );

        case 'special_cards':
          // Show early in the playing phase to teach about special cards
          // Don't require the player to have a special card - just inform them
          return (
            gameState.phase === 'playing' &&
            (gameState.currentRoundTricks?.length || 0) >= 2 &&
            (gameState.currentRoundTricks?.length || 0) <= 4
          );

        case 'round_summary':
          return gameState.phase === 'scoring';

        default:
          return false;
      }
    });

    // Show highest priority applicable step
    if (applicableSteps.length > 0) {
      const highestPriority = applicableSteps.reduce((max, step) =>
        step.priority > max.priority ? step : max
      );

      // Check if this is a new step (not already in accumulated steps)
      const isNewStep = !accumulatedSteps.some((s) => s.phase === highestPriority.phase);
      if (isNewStep) {
        setAccumulatedSteps((prev) => [...prev, highestPriority]);
      }

      // Only set current step if we don't have one yet (prevent auto-closing)
      if (!currentStep) {
        setCurrentStep(highestPriority);
      }
    }
    // Don't set currentStep to null when no applicable steps - let user dismiss explicitly
  }, [gameState, currentPlayerId, dismissedPhases, accumulatedSteps]);

  const handleDismiss = () => {
    if (currentStep) {
      // Always mark tutorial as completed (both "Got It!" and "Don't Show Again")
      // This prevents repetitive messages, especially for special_cards phase
      markTutorialCompleted(currentStep.phase);

      // Update local dismissed phases state
      const newDismissed = new Set(dismissedPhases);
      newDismissed.add(currentStep.phase);
      setDismissedPhases(newDismissed);
      onDismiss?.(currentStep.phase);

      // Check if this was the last tutorial and trigger achievement check
      const stats = getTutorialStats();
      if (stats.allCompleted) {
        onAllTutorialsCompleted?.();
      }

      setCurrentStep(null);
      onClose?.();
    }
  };

  if (!currentStep) return null;

  // Get tutorial progress
  const tutorialStats = getTutorialStats();

  return createPortal(
    <div
      className="fixed top-20 right-4 md:right-6 z-[10000] w-[380px] max-w-[calc(100vw-2rem)] animate-slide-in rounded-xl shadow-2xl overflow-hidden"
      data-testid="beginner-tutorial"
    >
      {/* Header - solid blue gradient for readability */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">
              {currentStep.icon}
            </span>
            <span>{currentStep.title}</span>
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-white hover:text-red-300 min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Close Tutorial"
            data-testid="tutorial-close-button"
          >
            ✕
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-blue-800/50 rounded-full h-2 overflow-hidden">
            <div
              className="bg-green-400 h-full transition-all duration-500 rounded-full"
              style={{ width: `${tutorialStats.percentage}%` }}
            />
          </div>
          <span className="text-white text-xs font-semibold whitespace-nowrap">
            {tutorialStats.completed}/{tutorialStats.total} ({tutorialStats.percentage}%)
          </span>
        </div>
      </div>

      {/* Content - solid colors for consistent readability on all themes */}
      <div className="bg-slate-800 p-4 max-h-[400px] overflow-y-auto">
        {/* Show all accumulated steps */}
        {accumulatedSteps.map((step, index) => (
          <div
            key={step.phase}
            className={index > 0 ? 'mt-4 pt-4 border-t border-slate-600' : ''}
          >
            {/* Step header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl" aria-hidden="true">
                {step.icon}
              </span>
              <span className="text-blue-300 text-sm font-bold">{step.title}</span>
              {step.phase === currentStep?.phase && (
                <span className="ml-auto text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-semibold">
                  NEW
                </span>
              )}
            </div>
            {/* Step content */}
            <p className="text-slate-100 text-sm whitespace-pre-line leading-relaxed">
              {step.content}
            </p>
          </div>
        ))}
      </div>

      {/* Actions - slightly darker footer */}
      <div className="bg-slate-900 px-4 py-3 border-t border-slate-700">
        <Button
          variant="primary"
          fullWidth
          onClick={handleDismiss}
          data-testid="tutorial-got-it-button"
        >
          Got It! ✓
        </Button>
      </div>
    </div>,
    document.body
  );
}

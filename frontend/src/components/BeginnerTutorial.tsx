/**
 * Beginner Tutorial Component
 * Displays step-by-step tutorial tips during gameplay for beginners
 * Now with progress tracking!
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GameState } from '../types/game';
import { markTutorialCompleted, getTutorialStats } from '../utils/tutorialProgress';
import { colors } from '../design-system';

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
          return gameState.phase === 'betting' && gameState.currentBets.length === 0;

        case 'betting_decision':
          const player = gameState.players.find((p) => p.id === currentPlayerId);
          const playerIndex = gameState.players.findIndex((p) => p.id === currentPlayerId);
          return (
            gameState.phase === 'betting' &&
            playerIndex === gameState.currentPlayerIndex &&
            player &&
            !player.isBot
          );

        case 'playing_intro':
          return (
            gameState.phase === 'playing' &&
            gameState.currentTrick.length === 0 &&
            gameState.currentRoundTricks.length === 0
          );

        case 'playing_suit':
          return (
            gameState.phase === 'playing' &&
            gameState.currentTrick.length > 0 &&
            gameState.currentRoundTricks.length <= 1
          );

        case 'playing_trump':
          return (
            gameState.phase === 'playing' &&
            gameState.trump !== null &&
            gameState.currentRoundTricks.length === 1
          );

        case 'trick_complete':
          return (
            gameState.phase === 'playing' &&
            gameState.currentTrick.length === 4 &&
            gameState.currentRoundTricks.length === 1
          );

        case 'special_cards':
          const currentPlayer = gameState.players.find((p) => p.id === currentPlayerId);
          const hasSpecialCard = currentPlayer?.hand.some(
            (card) => card.value === 0 && (card.color === 'red' || card.color === 'brown')
          );
          return gameState.phase === 'playing' && hasSpecialCard && gameState.currentRoundTricks.length <= 2;

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
      const isNewStep = !accumulatedSteps.some(s => s.phase === highestPriority.phase);
      if (isNewStep) {
        setAccumulatedSteps(prev => [...prev, highestPriority]);
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

      // Check if this was the last tutorial
      const stats = getTutorialStats();
      if (stats.allCompleted) {
        console.log('🎉 All tutorials completed! Achievement will be unlocked on next socket connection.');
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
      className="fixed top-20 right-4 md:right-6 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 border-4 border-blue-400 dark:border-blue-600 rounded-xl shadow-2xl z-[9999] w-[380px] max-w-[calc(100vw-2rem)] animate-slide-in"
      data-testid="beginner-tutorial"
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${colors.gradients.primary} dark:${colors.gradients.primaryDark} px-4 py-3 rounded-t-lg border-b-4 border-blue-600 dark:border-blue-800`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">{currentStep.icon}</span>
            <span>{currentStep.title}</span>
          </h3>
          <button
            onClick={handleDismiss}
            className="text-white hover:text-red-300 transition-colors text-xl font-bold focus:outline-none focus:ring-2 focus:ring-white"
            title="Close Tutorial"
            data-testid="tutorial-close-button"
          >
            ✕
          </button>
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

      {/* Content */}
      <div className="p-4 max-h-[400px] overflow-y-auto">
        {/* Show all accumulated steps */}
        {accumulatedSteps.map((step, index) => (
          <div key={step.phase} className={index > 0 ? 'mt-4 pt-4 border-t border-blue-300 dark:border-blue-700' : ''}>
            {/* Step header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl" aria-hidden="true">{step.icon}</span>
              <span className="text-blue-900 dark:text-blue-100 text-sm font-bold">{step.title}</span>
              {step.phase === currentStep?.phase && (
                <span className="ml-auto text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-semibold">NEW</span>
              )}
            </div>
            {/* Step content */}
            <p className="text-blue-900 dark:text-blue-100 text-sm whitespace-pre-line leading-relaxed">
              {step.content}
            </p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="px-4 pb-4">
        <button
          onClick={handleDismiss}
          className={`w-full bg-gradient-to-r ${colors.gradients.primary} hover:${colors.gradients.primaryHover} text-white font-bold py-2 px-3 rounded transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-blue-400`}
          data-testid="tutorial-got-it-button"
        >
          Got It! ✓
        </button>
      </div>
    </div>,
    document.body
  );
}

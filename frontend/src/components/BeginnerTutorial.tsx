/**
 * Beginner Tutorial Component
 * Displays step-by-step tutorial tips during gameplay for beginners
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GameState } from '../types/game';

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
  const [dismissedPhases, setDismissedPhases] = useState<Set<TutorialPhase>>(
    () => {
      const saved = localStorage.getItem('tutorialDismissed');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
  );

  const [currentStep, setCurrentStep] = useState<TutorialStep | null>(null);

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
            gameState.tricksPlayed === 0
          );

        case 'playing_suit':
          return (
            gameState.phase === 'playing' &&
            gameState.currentTrick.length > 0 &&
            gameState.tricksPlayed <= 1
          );

        case 'playing_trump':
          return (
            gameState.phase === 'playing' &&
            gameState.trump !== null &&
            gameState.tricksPlayed === 1
          );

        case 'trick_complete':
          return (
            gameState.phase === 'playing' &&
            gameState.currentTrick.length === 4 &&
            gameState.tricksPlayed === 1
          );

        case 'special_cards':
          const currentPlayer = gameState.players.find((p) => p.id === currentPlayerId);
          const hasSpecialCard = currentPlayer?.hand.some(
            (card) => card.value === 0 && (card.color === 'red' || card.color === 'brown')
          );
          return gameState.phase === 'playing' && hasSpecialCard && gameState.tricksPlayed <= 2;

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
      setCurrentStep(highestPriority);
    } else {
      setCurrentStep(null);
    }
  }, [gameState, currentPlayerId, dismissedPhases]);

  const handleDismiss = (permanent: boolean) => {
    if (currentStep) {
      if (permanent) {
        const newDismissed = new Set(dismissedPhases);
        newDismissed.add(currentStep.phase);
        setDismissedPhases(newDismissed);
        localStorage.setItem('tutorialDismissed', JSON.stringify([...newDismissed]));
        onDismiss?.(currentStep.phase);
      }
      setCurrentStep(null);
      onClose?.();
    }
  };

  if (!currentStep) return null;

  return createPortal(
    <div
      className="fixed top-20 right-4 md:right-6 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 border-4 border-blue-400 dark:border-blue-600 rounded-xl shadow-2xl z-[9999] w-[380px] max-w-[calc(100vw-2rem)] animate-slide-in"
      data-testid="beginner-tutorial"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 px-4 py-3 rounded-t-lg border-b-4 border-blue-600 dark:border-blue-800 flex items-center justify-between">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <span className="text-2xl">{currentStep.icon}</span>
          <span>{currentStep.title}</span>
        </h3>
        <button
          onClick={() => handleDismiss(false)}
          className="text-white hover:text-red-300 transition-colors text-xl font-bold"
          title="Close Tutorial"
          data-testid="tutorial-close-button"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[400px] overflow-y-auto">
        <p className="text-blue-900 dark:text-blue-100 text-sm whitespace-pre-line leading-relaxed">
          {currentStep.content}
        </p>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={() => handleDismiss(true)}
          className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 font-semibold py-2 px-3 rounded transition-colors text-sm"
          data-testid="tutorial-dismiss-button"
        >
          Don't Show Again
        </button>
        <button
          onClick={() => handleDismiss(false)}
          className="flex-1 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-2 px-3 rounded transition-colors text-sm"
          data-testid="tutorial-got-it-button"
        >
          Got It! ✓
        </button>
      </div>
    </div>,
    document.body
  );
}

/**
 * GameWithBotCreationForm Component
 *
 * Dedicated form for creating games with bots.
 * Features:
 * - Bot difficulty selection (Easy/Medium/Hard)
 * - Ranked/Casual mode toggle (for registered users)
 * - Player name input (for guests)
 * - Loading state during game creation
 *
 * Uses shared keyboard navigation and layout components
 */

import { useState, useRef, useCallback } from 'react';
import { sounds } from '../utils/sounds';
import { User } from '../types/auth';
import { BotDifficulty } from '../utils/botPlayerEnhanced';
import { getUserTierInfo } from '../utils/userTier';
import { Button, UIBadge, Input, Checkbox, FormPageLayout, FormActionButtons } from './ui';
import { useFormKeyboardNav } from '../hooks/useFormKeyboardNav';

interface GameWithBotCreationFormProps {
  playerName: string;
  setPlayerName: (name: string) => void;
  onCreateGame: (
    difficulty: BotDifficulty,
    persistenceMode: 'elo' | 'casual',
    playerName?: string
  ) => void;
  onBack: () => void;
  user: User | null;
  defaultDifficulty?: BotDifficulty;
}

export function GameWithBotCreationForm({
  playerName,
  setPlayerName,
  onCreateGame,
  onBack,
  user,
  defaultDifficulty = 'medium',
}: GameWithBotCreationFormProps) {
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>(defaultDifficulty);
  const [persistenceMode, setPersistenceMode] = useState<'elo' | 'casual'>('casual');
  const [isLoading, setIsLoading] = useState(false);

  // User tier info for feature access
  const tierInfo = getUserTierInfo(user, playerName);
  const isGuest = tierInfo.tier === 'guest';

  // Refs for focusable elements
  const nameInputRef = useRef<HTMLInputElement>(null);
  const easyButtonRef = useRef<HTMLButtonElement>(null);
  const mediumButtonRef = useRef<HTMLButtonElement>(null);
  const hardButtonRef = useRef<HTMLButtonElement>(null);
  const rankedCheckboxRef = useRef<HTMLInputElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);

  // Grid config: Row 0=name (skip if auth), Row 1=difficulty, Row 2=checkbox, Row 3=buttons
  const getFocusableElement = useCallback(
    (row: number, col: number): HTMLElement | null => {
      const effectiveRow = user ? row + 1 : row;
      switch (effectiveRow) {
        case 0:
          return nameInputRef.current;
        case 1:
          if (col === 0) return easyButtonRef.current;
          if (col === 1) return mediumButtonRef.current;
          return hardButtonRef.current;
        case 2:
          return rankedCheckboxRef.current;
        case 3:
          return col === 0 ? backButtonRef.current : startButtonRef.current;
        default:
          return null;
      }
    },
    [user]
  );

  // Use shared keyboard navigation hook
  const { setNavCol } = useFormKeyboardNav({
    grid: {
      colsPerRow: [1, 3, 1, 2], // name, difficulty buttons, checkbox, buttons
      skipRows: user ? 1 : 0,
      initialCol: 1, // Default to middle (Medium)
    },
    getFocusableElement,
    onEscape: onBack,
    inputRefs: [nameInputRef],
  });

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (playerName.trim()) {
      setIsLoading(true);
      // Save to localStorage if guest enters a name
      if (isGuest) {
        localStorage.setItem('playerName', playerName.trim());
      }
      onCreateGame(botDifficulty, persistenceMode, playerName);
    }
  };

  const handleDifficultySelect = (difficulty: BotDifficulty) => {
    sounds.buttonClick();
    setBotDifficulty(difficulty);
    const difficultyIndex = { easy: 0, medium: 1, hard: 2 }[difficulty];
    setNavCol(difficultyIndex);
  };

  const difficultyDescriptions: Record<BotDifficulty, string> = {
    easy: 'Random play, good for beginners',
    medium: 'Strategic play with positional awareness',
    hard: 'Advanced AI with card counting',
  };

  return (
    <FormPageLayout
      title="Play vs Bots"
      subtitle="1 Player + 3 AI Opponents"
      animatedEmojis={['🤖', '🃏', '🎮', '🎴']}
    >
      <form onSubmit={handleStart} className="space-y-4">
          {/* Player Name Input (for guests) */}
          {!user && (
            <Input
              ref={nameInputRef}
              id="playerName"
              data-testid="player-name-input"
              label="Your Name"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              required
              variant="default"
              fullWidth
            />
          )}

          {/* Bot Difficulty Selection */}
          <div className="bg-skin-secondary border-2 border-skin-default rounded-lg p-4">
            <label className="block text-sm font-medium text-skin-primary mb-3">
              Bot Difficulty
            </label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                ref={easyButtonRef}
                type="button"
                data-testid="difficulty-easy"
                onClick={() => handleDifficultySelect('easy')}
                variant={botDifficulty === 'easy' ? 'primary' : 'ghost'}
                size="sm"
              >
                Easy
              </Button>
              <Button
                ref={mediumButtonRef}
                type="button"
                data-testid="difficulty-medium"
                onClick={() => handleDifficultySelect('medium')}
                variant={botDifficulty === 'medium' ? 'primary' : 'ghost'}
                size="sm"
              >
                Medium
              </Button>
              <Button
                ref={hardButtonRef}
                type="button"
                data-testid="difficulty-hard"
                onClick={() => handleDifficultySelect('hard')}
                variant={botDifficulty === 'hard' ? 'primary' : 'ghost'}
                size="sm"
              >
                Hard
              </Button>
            </div>
            <p className="text-xs text-skin-muted mt-3 text-center">
              {difficultyDescriptions[botDifficulty]}
            </p>
          </div>

          {/* Ranked Mode Selector */}
          <div
            className={`bg-skin-secondary border-2 border-skin-default rounded-lg p-3 ${!tierInfo.canPlayRanked ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center justify-between gap-3">
              <Checkbox
                ref={rankedCheckboxRef}
                id="persistenceMode"
                data-testid="persistence-mode-checkbox"
                label="Ranked Mode"
                checked={persistenceMode === 'elo'}
                onChange={(e) => setPersistenceMode(e.target.checked ? 'elo' : 'casual')}
                disabled={!tierInfo.canPlayRanked}
                size="sm"
              />
              <UIBadge
                variant="solid"
                color={persistenceMode === 'elo' && tierInfo.canPlayRanked ? 'warning' : 'gray'}
                size="sm"
              >
                <span aria-hidden="true">
                  {persistenceMode === 'elo' && tierInfo.canPlayRanked ? '🏆' : '🎮'}
                </span>{' '}
                {persistenceMode === 'elo' && tierInfo.canPlayRanked ? 'Ranked' : 'Casual'}
              </UIBadge>
            </div>
            <p className="text-xs text-skin-muted mt-2">
              {!tierInfo.canPlayRanked ? (
                <>
                  <span aria-hidden="true">🔒</span> Register an account to enable ranked mode
                </>
              ) : persistenceMode === 'elo' ? (
                'Game will be saved to your profile and affect your ranking'
              ) : (
                'No stats saved - play without affecting your ELO rating'
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <FormActionButtons
            onBack={onBack}
            submitLabel="Start Game"
            isLoading={isLoading}
            isDisabled={!playerName.trim()}
            backButtonRef={backButtonRef}
            submitButtonRef={startButtonRef}
            className="pt-2"
          />
        </form>
    </FormPageLayout>
  );
}

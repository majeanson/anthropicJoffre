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
 * Keyboard Navigation: Grid-based GameBoy style
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { sounds } from '../utils/sounds';
import { User } from '../types/auth';
import { BotDifficulty } from '../utils/botPlayerEnhanced';
import { getUserTierInfo } from '../utils/userTier';
import { Button, UIBadge, Input, Checkbox } from './ui';

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

  // Keyboard navigation state - grid-based like GameBoy
  // Row 0: Player name input (skip if authenticated)
  // Row 1: Bot difficulty buttons (Easy | Medium | Hard)
  // Row 2: Ranked mode checkbox
  // Row 3: Back | Start buttons
  const [navRow, setNavRow] = useState(user ? 1 : 0);
  const [navCol, setNavCol] = useState(1); // Default to middle (Medium)

  // Refs for focusable elements
  const nameInputRef = useRef<HTMLInputElement>(null);
  const easyButtonRef = useRef<HTMLButtonElement>(null);
  const mediumButtonRef = useRef<HTMLButtonElement>(null);
  const hardButtonRef = useRef<HTMLButtonElement>(null);
  const rankedCheckboxRef = useRef<HTMLInputElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);

  // Get focusable element for current position
  const getFocusableElement = useCallback(
    (row: number, col: number): HTMLElement | null => {
      const effectiveRow = user ? row + 1 : row; // Skip name input row if authenticated

      switch (effectiveRow) {
        case 0: // Name input
          return nameInputRef.current;
        case 1: // Difficulty buttons
          if (col === 0) return easyButtonRef.current;
          if (col === 1) return mediumButtonRef.current;
          return hardButtonRef.current;
        case 2: // Ranked checkbox
          return rankedCheckboxRef.current;
        case 3: // Back/Start buttons
          return col === 0 ? backButtonRef.current : startButtonRef.current;
        default:
          return null;
      }
    },
    [user]
  );

  // Focus current element
  const focusCurrentElement = useCallback(() => {
    const element = getFocusableElement(navRow, navCol);
    element?.focus();
  }, [navRow, navCol, getFocusableElement]);

  // Get max columns for a row
  const getMaxCols = useCallback(
    (row: number): number => {
      const effectiveRow = user ? row + 1 : row;
      switch (effectiveRow) {
        case 0:
          return 1; // Name input
        case 1:
          return 3; // Easy/Medium/Hard
        case 2:
          return 1; // Ranked checkbox
        case 3:
          return 2; // Back/Start
        default:
          return 1;
      }
    },
    [user]
  );

  // Get max rows
  const getMaxRows = useCallback((): number => {
    return user ? 3 : 4; // Skip name input row if authenticated
  }, [user]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in input
      if (
        document.activeElement === nameInputRef.current &&
        !['ArrowUp', 'ArrowDown', 'Escape'].includes(e.key)
      ) {
        return;
      }

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          sounds.buttonClick();
          onBack();
          break;

        case 'ArrowUp':
          e.preventDefault();
          setNavRow((prev) => {
            const newRow = prev > 0 ? prev - 1 : getMaxRows() - 1;
            setNavCol((c) => Math.min(c, getMaxCols(newRow) - 1));
            return newRow;
          });
          sounds.buttonClick();
          break;

        case 'ArrowDown':
          e.preventDefault();
          setNavRow((prev) => {
            const newRow = prev < getMaxRows() - 1 ? prev + 1 : 0;
            setNavCol((c) => Math.min(c, getMaxCols(newRow) - 1));
            return newRow;
          });
          sounds.buttonClick();
          break;

        case 'ArrowLeft':
          e.preventDefault();
          setNavCol((prev) => {
            const maxCols = getMaxCols(navRow);
            const newCol = prev > 0 ? prev - 1 : maxCols - 1;
            // Handle difficulty button selection
            const effectiveRow = user ? navRow + 1 : navRow;
            if (effectiveRow === 1) {
              const difficulties: BotDifficulty[] = ['easy', 'medium', 'hard'];
              setBotDifficulty(difficulties[newCol]);
            }
            return newCol;
          });
          sounds.buttonClick();
          break;

        case 'ArrowRight':
          e.preventDefault();
          setNavCol((prev) => {
            const maxCols = getMaxCols(navRow);
            const newCol = prev < maxCols - 1 ? prev + 1 : 0;
            // Handle difficulty button selection
            const effectiveRow = user ? navRow + 1 : navRow;
            if (effectiveRow === 1) {
              const difficulties: BotDifficulty[] = ['easy', 'medium', 'hard'];
              setBotDifficulty(difficulties[newCol]);
            }
            return newCol;
          });
          sounds.buttonClick();
          break;

        case 'Enter':
        case ' ':
          // Let form handle submit, but handle checkbox toggle
          if (document.activeElement === rankedCheckboxRef.current && e.key === ' ') {
            // Checkbox handles space natively
            return;
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack, navRow, getMaxRows, getMaxCols, user]);

  // Focus element when navigation changes
  useEffect(() => {
    focusCurrentElement();
  }, [navRow, navCol, focusCurrentElement]);

  // Auto-focus first element on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      focusCurrentElement();
    }, 100);
    return () => clearTimeout(timer);
  }, [focusCurrentElement]);

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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-amber-400 via-orange-500 to-red-500">
      {/* Animated background cards */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl animate-bounce-3s" aria-hidden="true">
          🤖
        </div>
        <div className="absolute top-20 right-20 text-6xl animate-bounce-4s" aria-hidden="true">
          🃏
        </div>
        <div
          className="absolute bottom-20 left-20 text-6xl animate-bounce-3s-half"
          aria-hidden="true"
        >
          🎮
        </div>
        <div
          className="absolute bottom-10 right-10 text-6xl animate-bounce-4s-half"
          aria-hidden="true"
        >
          🎴
        </div>
      </div>

      <div className="bg-skin-primary rounded-2xl p-8 shadow-2xl max-w-md w-full border-4 border-skin-accent relative">
        {/* Decorative corners */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-skin-accent rounded-tl-xl"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-skin-accent rounded-tr-xl"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-skin-accent rounded-bl-xl"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-skin-accent rounded-br-xl"></div>

        <h2 className="text-4xl font-bold mb-2 text-skin-primary font-serif text-center">
          Play vs Bots
        </h2>
        <p className="text-sm text-skin-secondary text-center mb-6">
          1 Player + 3 AI Opponents
        </p>

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
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
            <Button
              ref={backButtonRef}
              data-testid="back-button"
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => {
                sounds.buttonClick();
                onBack();
              }}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              ref={startButtonRef}
              data-testid="submit-start-button"
              type="submit"
              variant="success"
              size="lg"
              className="flex-1"
              loading={isLoading}
              disabled={isLoading || !playerName.trim()}
            >
              Start Game
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

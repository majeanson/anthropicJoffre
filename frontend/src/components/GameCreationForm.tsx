/**
 * GameCreationForm Component
 * Sprint 4 Phase 4.3: Lobby Component Splitting
 *
 * Handles game creation UI with player name input and persistence mode selection
 * Keyboard Navigation: Grid-based GameBoy style
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { sounds } from '../utils/sounds';
import { User } from '../types/auth';
import { Button, UIBadge, Input, Checkbox } from './ui';

interface GameCreationFormProps {
  playerName: string;
  setPlayerName: (name: string) => void;
  onCreateGame: (playerName: string, persistenceMode?: 'elo' | 'casual') => void;
  onBack: () => void;
  user: User | null;
}

export function GameCreationForm({
  playerName,
  setPlayerName,
  onCreateGame,
  onBack,
  user,
}: GameCreationFormProps) {
  const [createGamePersistence, setCreateGamePersistence] = useState<'elo' | 'casual'>('elo');

  // Keyboard navigation state - grid-based like GameBoy
  // Row 0: Player name input (skip if authenticated)
  // Row 1: Ranked mode checkbox
  // Row 2: Back | Create buttons
  const [navRow, setNavRow] = useState(user ? 1 : 0);
  const [navCol, setNavCol] = useState(0);

  // Refs for focusable elements
  const nameInputRef = useRef<HTMLInputElement>(null);
  const rankedCheckboxRef = useRef<HTMLInputElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const createButtonRef = useRef<HTMLButtonElement>(null);

  // Get focusable element for current position
  const getFocusableElement = useCallback(
    (row: number, col: number): HTMLElement | null => {
      const effectiveRow = user ? row + 1 : row; // Skip name input row if authenticated

      switch (effectiveRow) {
        case 0: // Name input
          return nameInputRef.current;
        case 1: // Ranked checkbox
          return rankedCheckboxRef.current;
        case 2: // Back/Create buttons
          return col === 0 ? backButtonRef.current : createButtonRef.current;
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
          return 1; // Ranked checkbox
        case 2:
          return 2; // Back/Create
        default:
          return 1;
      }
    },
    [user]
  );

  // Get max rows
  const getMaxRows = useCallback((): number => {
    return user ? 2 : 3; // Skip name input row if authenticated
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
            return prev > 0 ? prev - 1 : maxCols - 1;
          });
          sounds.buttonClick();
          break;

        case 'ArrowRight':
          e.preventDefault();
          setNavCol((prev) => {
            const maxCols = getMaxCols(navRow);
            return prev < maxCols - 1 ? prev + 1 : 0;
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
  }, [onBack, navRow, getMaxRows, getMaxCols]);

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

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      onCreateGame(playerName, createGamePersistence);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-amber-400 via-orange-500 to-red-500">
      {/* Animated background cards */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl animate-bounce-3s" aria-hidden="true">
          🃏
        </div>
        <div className="absolute top-20 right-20 text-6xl animate-bounce-4s" aria-hidden="true">
          🎴
        </div>
        <div
          className="absolute bottom-20 left-20 text-6xl animate-bounce-3s-half"
          aria-hidden="true"
        >
          🂡
        </div>
        <div
          className="absolute bottom-10 right-10 text-6xl animate-bounce-4s-half"
          aria-hidden="true"
        >
          🂱
        </div>
      </div>

      <div className="bg-skin-primary rounded-2xl p-8 shadow-2xl max-w-md w-full border-4 border-skin-accent relative">
        {/* Decorative corners */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-skin-accent rounded-tl-xl"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-skin-accent rounded-tr-xl"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-skin-accent rounded-bl-xl"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-skin-accent rounded-br-xl"></div>

        <h2 className="text-4xl font-bold mb-6 text-skin-primary font-serif text-center">
          Create Game
        </h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            ref={nameInputRef}
            id="playerName"
            data-testid="player-name-input"
            label="Your Name"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder={user ? 'Using authenticated username' : 'Enter your name'}
            disabled={!!user}
            required
            variant="default"
            fullWidth
          />

          {/* Persistence Mode Selector */}
          <div
            className={`bg-skin-secondary border-2 border-skin-default rounded-lg p-3 ${!user ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center justify-between gap-3">
              <Checkbox
                ref={rankedCheckboxRef}
                id="persistenceMode"
                data-testid="persistence-mode-checkbox"
                label="Ranked Mode"
                checked={createGamePersistence === 'elo'}
                onChange={(e) => setCreateGamePersistence(e.target.checked ? 'elo' : 'casual')}
                disabled={!user}
                size="sm"
              />
              <UIBadge
                variant="solid"
                color={createGamePersistence === 'elo' ? 'warning' : 'gray'}
                size="sm"
              >
                <span aria-hidden="true">{createGamePersistence === 'elo' ? '🏆' : '🎮'}</span>{' '}
                {createGamePersistence === 'elo' ? 'Ranked' : 'Casual'}
              </UIBadge>
            </div>
            <p className="text-xs text-skin-muted mt-2">
              {!user ? (
                <>
                  <span aria-hidden="true">🔒</span> Available when registered - Register to enable
                  ranked mode
                </>
              ) : createGamePersistence === 'elo' ? (
                'Game will be saved to your profile and affect your ranking'
              ) : (
                'No stats saved - play without affecting your ELO rating'
              )}
            </p>
          </div>

          <div className="flex gap-3">
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
              ref={createButtonRef}
              data-testid="submit-create-button"
              type="submit"
              variant="success"
              size="lg"
              className="flex-1"
            >
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

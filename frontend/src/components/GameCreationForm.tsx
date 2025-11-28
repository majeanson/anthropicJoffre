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
import { colors } from '../design-system';

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
  const getFocusableElement = useCallback((row: number, col: number): HTMLElement | null => {
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
  }, [user]);

  // Focus current element
  const focusCurrentElement = useCallback(() => {
    const element = getFocusableElement(navRow, navCol);
    element?.focus();
  }, [navRow, navCol, getFocusableElement]);

  // Get max columns for a row
  const getMaxCols = useCallback((row: number): number => {
    const effectiveRow = user ? row + 1 : row;
    switch (effectiveRow) {
      case 0: return 1; // Name input
      case 1: return 1; // Ranked checkbox
      case 2: return 2; // Back/Create
      default: return 1;
    }
  }, [user]);

  // Get max rows
  const getMaxRows = useCallback((): number => {
    return user ? 2 : 3; // Skip name input row if authenticated
  }, [user]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in input
      if (document.activeElement === nameInputRef.current &&
          !['ArrowUp', 'ArrowDown', 'Escape'].includes(e.key)) {
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
          setNavRow(prev => {
            const newRow = prev > 0 ? prev - 1 : getMaxRows() - 1;
            setNavCol(c => Math.min(c, getMaxCols(newRow) - 1));
            return newRow;
          });
          sounds.buttonClick();
          break;

        case 'ArrowDown':
          e.preventDefault();
          setNavRow(prev => {
            const newRow = prev < getMaxRows() - 1 ? prev + 1 : 0;
            setNavCol(c => Math.min(c, getMaxCols(newRow) - 1));
            return newRow;
          });
          sounds.buttonClick();
          break;

        case 'ArrowLeft':
          e.preventDefault();
          setNavCol(prev => {
            const maxCols = getMaxCols(navRow);
            return prev > 0 ? prev - 1 : maxCols - 1;
          });
          sounds.buttonClick();
          break;

        case 'ArrowRight':
          e.preventDefault();
          setNavCol(prev => {
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
    <div
      style={{
        background: `linear-gradient(to bottom right, ${colors.warning.start}, ${colors.warning.end}, ${colors.error.end})`
      }}
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
    >
      {/* Animated background cards */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl animate-bounce" style={{ animationDuration: '3s', animationDelay: '0s' }} aria-hidden="true">🃏</div>
        <div className="absolute top-20 right-20 text-6xl animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }} aria-hidden="true">🎴</div>
        <div className="absolute bottom-20 left-20 text-6xl animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }} aria-hidden="true">🂡</div>
        <div className="absolute bottom-10 right-10 text-6xl animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '1.5s' }} aria-hidden="true">🂱</div>
      </div>

      <div className="bg-gradient-to-br from-parchment-50 to-parchment-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 shadow-2xl max-w-md w-full border-4 border-amber-700 dark:border-gray-600 relative">
        {/* Decorative corners */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-600 dark:border-gray-500 rounded-tl-xl"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-600 dark:border-gray-500 rounded-tr-xl"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-600 dark:border-gray-500 rounded-bl-xl"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-600 dark:border-gray-500 rounded-br-xl"></div>

        <h2 className="text-4xl font-bold mb-6 text-umber-900 dark:text-gray-100 font-serif text-center">Create Game</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-umber-800 dark:text-gray-200 mb-2">
              Your Name
            </label>
            <input
              ref={nameInputRef}
              data-testid="player-name-input"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-2 border-2 border-parchment-400 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-umber-500 focus:border-umber-500 bg-parchment-100 dark:bg-gray-700 text-umber-900 dark:text-gray-100 focus:outline-none focus:ring-offset-2"
              placeholder={user ? "Using authenticated username" : "Enter your name"}
              disabled={!!user}
              required
            />
          </div>

          {/* Persistence Mode Selector */}
          <div className={`bg-parchment-100 dark:bg-gray-800 border-2 border-umber-300 dark:border-gray-600 rounded-lg p-3 ${!user ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between gap-3">
              <label className={`flex items-center gap-2 flex-1 ${user ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                <input
                  ref={rankedCheckboxRef}
                  data-testid="persistence-mode-checkbox"
                  type="checkbox"
                  checked={createGamePersistence === 'elo'}
                  onChange={(e) => setCreateGamePersistence(e.target.checked ? 'elo' : 'casual')}
                  disabled={!user}
                  className="w-4 h-4 text-umber-600 dark:text-purple-600 bg-parchment-50 dark:bg-gray-700 border-umber-300 dark:border-gray-500 rounded focus:ring-umber-500 dark:focus:ring-purple-500 focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-sm font-medium text-umber-800 dark:text-gray-200">
                  Ranked Mode
                </span>
              </label>
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                createGamePersistence === 'elo'
                  ? 'bg-amber-200 dark:bg-purple-900 text-amber-900 dark:text-purple-200'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}>
                <span aria-hidden="true">{createGamePersistence === 'elo' ? '🏆' : '🎮'}</span> {createGamePersistence === 'elo' ? 'Ranked' : 'Casual'}
              </span>
            </div>
            <p className="text-xs text-umber-600 dark:text-gray-400 mt-2">
              {!user
                ? <><span aria-hidden="true">🔒</span> Available when registered - Register to enable ranked mode</>
                : createGamePersistence === 'elo'
                ? 'Game will be saved to your profile and affect your ranking'
                : 'No stats saved - play without affecting your ELO rating'}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              ref={backButtonRef}
              data-testid="back-button"
              type="button"
              onClick={() => { sounds.buttonClick(); onBack(); }}
              className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 rounded-xl font-bold hover:from-gray-600 hover:to-gray-700 transition-all duration-300 border-2 border-gray-700 shadow-lg transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              Back
            </button>
            <button
              ref={createButtonRef}
              data-testid="submit-create-button"
              type="submit"
              style={{
                background: `linear-gradient(to right, ${colors.success.start}, ${colors.success.end})`,
                borderColor: colors.success.border
              }}
              className="flex-1 text-white py-3 rounded-xl font-bold transition-all duration-300 border-2 shadow-lg transform hover:scale-105 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

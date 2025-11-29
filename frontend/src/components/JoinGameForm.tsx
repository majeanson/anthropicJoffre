/**
 * JoinGameForm Component
 * Sprint 4 Phase 4.3: Lobby Component Splitting
 *
 * Handles game joining UI for both players and spectators
 * Keyboard Navigation: Grid-based GameBoy style
 */

import { Suspense, lazy, useEffect, useState, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { sounds } from '../utils/sounds';
import { User } from '../types/auth';
import { UICard } from './ui/UICard';
import { Button } from './ui/Button';

// Lazy load modals
const PlayerStatsModal = lazy(() => import('./PlayerStatsModal').then(m => ({ default: m.PlayerStatsModal })));
const GlobalLeaderboard = lazy(() => import('./GlobalLeaderboard').then(m => ({ default: m.GlobalLeaderboard })));

interface JoinGameFormProps {
  gameId: string;
  setGameId: (id: string) => void;
  playerName: string;
  setPlayerName: (name: string) => void;
  joinType: 'player' | 'spectator';
  setJoinType: (type: 'player' | 'spectator') => void;
  autoJoinGameId?: string;
  onJoinGame: (gameId: string, playerName: string) => void;
  onSpectateGame: (gameId: string, spectatorName?: string) => void;
  onBack: () => void;
  onBackToHomepage: () => void;
  user: User | null;
  socket: Socket | null;
  showPlayerStats: boolean;
  setShowPlayerStats: (show: boolean) => void;
  showLeaderboard: boolean;
  setShowLeaderboard: (show: boolean) => void;
  selectedPlayerName: string;
  setSelectedPlayerName: (name: string) => void;
}

export function JoinGameForm({
  gameId,
  setGameId,
  playerName,
  setPlayerName,
  joinType,
  setJoinType,
  autoJoinGameId,
  onJoinGame,
  onSpectateGame,
  onBack,
  onBackToHomepage,
  user,
  socket,
  showPlayerStats,
  setShowPlayerStats,
  showLeaderboard,
  setShowLeaderboard,
  selectedPlayerName,
  setSelectedPlayerName,
}: JoinGameFormProps) {
  // Keyboard navigation state - grid-based like GameBoy
  // Row 0: Join type radios (Player | Spectator)
  // Row 1: Game ID input
  // Row 2: Player name input (skip if authenticated)
  // Row 3: Back | Join buttons
  const [navRow, setNavRow] = useState(0);
  const [navCol, setNavCol] = useState(0);

  // Refs for focusable elements
  const playerRadioRef = useRef<HTMLInputElement>(null);
  const spectatorRadioRef = useRef<HTMLInputElement>(null);
  const gameIdInputRef = useRef<HTMLInputElement>(null);
  const playerNameInputRef = useRef<HTMLInputElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const joinButtonRef = useRef<HTMLButtonElement>(null);

  // Get focusable element for current position
  const getFocusableElement = useCallback((row: number, col: number): HTMLElement | null => {
    // Adjust row if user is authenticated (skip name input)
    const effectiveRow = user && row >= 2 ? row + 1 : row;

    switch (effectiveRow) {
      case 0: // Join type radios
        return col === 0 ? playerRadioRef.current : spectatorRadioRef.current;
      case 1: // Game ID input
        return gameIdInputRef.current;
      case 2: // Player name input
        return playerNameInputRef.current;
      case 3: // Back/Join buttons
        return col === 0 ? backButtonRef.current : joinButtonRef.current;
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
    const effectiveRow = user && row >= 2 ? row + 1 : row;
    switch (effectiveRow) {
      case 0: return 2; // Player/Spectator
      case 1: return 1; // Game ID
      case 2: return 1; // Player name
      case 3: return 2; // Back/Join
      default: return 1;
    }
  }, [user]);

  // Get max rows
  const getMaxRows = useCallback((): number => {
    return user ? 3 : 4; // Skip name input row if authenticated
  }, [user]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs (except for navigation keys)
      const isInInput = document.activeElement === gameIdInputRef.current ||
                        document.activeElement === playerNameInputRef.current;
      if (isInInput && !['ArrowUp', 'ArrowDown', 'Escape'].includes(e.key)) {
        return;
      }

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          sounds.buttonClick();
          if (autoJoinGameId) {
            onBackToHomepage();
          } else {
            onBack();
          }
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
            const newCol = prev > 0 ? prev - 1 : maxCols - 1;
            // Handle radio button toggle
            const effectiveRow = user && navRow >= 2 ? navRow + 1 : navRow;
            if (effectiveRow === 0) {
              setJoinType(newCol === 0 ? 'player' : 'spectator');
            }
            return newCol;
          });
          sounds.buttonClick();
          break;

        case 'ArrowRight':
          e.preventDefault();
          setNavCol(prev => {
            const maxCols = getMaxCols(navRow);
            const newCol = prev < maxCols - 1 ? prev + 1 : 0;
            // Handle radio button toggle
            const effectiveRow = user && navRow >= 2 ? navRow + 1 : navRow;
            if (effectiveRow === 0) {
              setJoinType(newCol === 0 ? 'player' : 'spectator');
            }
            return newCol;
          });
          sounds.buttonClick();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack, onBackToHomepage, autoJoinGameId, navRow, user, getMaxRows, getMaxCols, setJoinType]);

  // Focus element when navigation changes
  useEffect(() => {
    focusCurrentElement();
  }, [navRow, navCol, focusCurrentElement]);

  // Auto-focus first element on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      // Focus player name input if from auto-join URL, otherwise first element
      if (autoJoinGameId && playerNameInputRef.current) {
        setNavRow(user ? 2 : 2);
        playerNameInputRef.current.focus();
      } else {
        focusCurrentElement();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [autoJoinGameId, user, focusCurrentElement]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinType === 'player') {
      if (playerName.trim() && gameId.trim()) {
        onJoinGame(gameId, playerName);
      }
    } else {
      // Spectator mode
      if (gameId.trim()) {
        onSpectateGame(gameId, playerName.trim() || undefined);
      }
    }
  };

  return (
    <>
      <div
        className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-amber-400 via-orange-500 to-red-500"
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

          <h2 className="text-4xl font-bold mb-6 text-umber-900 dark:text-gray-100 font-serif text-center">Join Game</h2>

          {/* Show message when joining from URL */}
          {autoJoinGameId && (
            <UICard
              variant="gradient"
              gradient="info"
              size="md"
              className="mb-6 animate-pulse shadow-lg"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl" aria-hidden="true">🎮</span>
                <p className="text-white font-bold text-lg text-center">
                  Joining game: <span className="font-mono bg-white/20 px-2 py-1 rounded border border-white/30">{gameId}</span>
                </p>
              </div>
              <p className="text-white/90 font-medium text-center">
                <span aria-hidden="true">👇</span> Enter your name below to join!
              </p>
            </UICard>
          )}

          <form onSubmit={handleJoin} className="space-y-4">
            {/* Join Type Selection */}
            <div className="bg-parchment-100 dark:bg-gray-700 rounded-lg p-4 border-2 border-parchment-400 dark:border-gray-600">
              <label className="block text-sm font-medium text-umber-800 dark:text-gray-200 mb-3">
                Join as:
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer flex-1">
                  <input
                    ref={playerRadioRef}
                    type="radio"
                    name="joinType"
                    value="player"
                    checked={joinType === 'player'}
                    onChange={(e) => setJoinType(e.target.value as 'player' | 'spectator')}
                    className="w-4 h-4 text-umber-600 focus:ring-umber-500 focus:ring-2 focus:ring-offset-2"
                  />
                  <span className="ml-3 text-umber-800 dark:text-gray-200 font-medium">Player</span>
                </label>
                <label className="flex items-center cursor-pointer flex-1">
                  <input
                    ref={spectatorRadioRef}
                    type="radio"
                    name="joinType"
                    value="spectator"
                    checked={joinType === 'spectator'}
                    onChange={(e) => setJoinType(e.target.value as 'player' | 'spectator')}
                    className="w-4 h-4 text-umber-600 focus:ring-umber-500 focus:ring-2 focus:ring-offset-2"
                  />
                  <span className="ml-3 text-umber-800 dark:text-gray-200 font-medium">Spectator</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-umber-800 dark:text-gray-200 mb-2">
                Game ID
              </label>
              <input
                ref={gameIdInputRef}
                data-testid="game-id-input"
                type="text"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                className="w-full px-4 py-2 border-2 border-parchment-400 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-umber-500 focus:border-umber-500 focus:outline-none focus:ring-offset-2 bg-parchment-100 dark:bg-gray-700 text-umber-900 dark:text-gray-100"
                placeholder="Enter game ID"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-umber-800 dark:text-gray-200 mb-2">
                Your Name {joinType === 'spectator' && '(Optional)'}
              </label>
              <input
                ref={playerNameInputRef}
                data-testid="player-name-input"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                disabled={!!user}
                placeholder={user ? "Using authenticated username" : "Enter your name"}
                className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-umber-500 focus:border-umber-500 focus:outline-none focus:ring-offset-2 bg-parchment-100 dark:bg-gray-700 text-umber-900 dark:text-gray-100 ${
                  user ? 'opacity-60 cursor-not-allowed' : ''
                } ${
                  autoJoinGameId
                    ? 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-300 dark:ring-blue-700'
                    : 'border-parchment-400 dark:border-gray-500'
                }`}
                required={joinType === 'player'}
              />
            </div>

            {/* Info message for spectator mode */}
            {joinType === 'spectator' && (
              <div className="bg-parchment-100 dark:bg-gray-800 border-2 border-parchment-400 dark:border-gray-600 rounded-lg p-3">
                <p className="text-sm text-umber-900 dark:text-gray-300">
                  As a spectator, you can watch the game but cannot play cards. Player hands will be hidden.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              {/* Show appropriate back button based on context */}
              {autoJoinGameId ? (
                <Button
                  ref={backButtonRef}
                  data-testid="back-to-homepage-button"
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={onBackToHomepage}
                  className="flex-1"
                >
                  <span aria-hidden="true">🏠</span> Back to Homepage
                </Button>
              ) : (
                <Button
                  ref={backButtonRef}
                  data-testid="back-button"
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={() => { sounds.buttonClick(); onBack(); }}
                  className="flex-1"
                >
                  Back
                </Button>
              )}
              <Button
                ref={joinButtonRef}
                data-testid="submit-join-button"
                type="submit"
                variant={joinType === 'player' ? 'secondary' : 'primary'}
                size="lg"
                className="flex-1"
              >
                {joinType === 'player' ? 'Join as Player' : 'Join as Spectator'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Stats & Leaderboard Modals */}
      {socket && (
        <Suspense fallback={<div />}>
          <PlayerStatsModal
            playerName={selectedPlayerName}
            socket={socket}
            isOpen={showPlayerStats}
            onClose={() => setShowPlayerStats(false)}
          />
          <GlobalLeaderboard
            socket={socket}
            isOpen={showLeaderboard}
            onClose={() => setShowLeaderboard(false)}
            onViewPlayerStats={(playerName) => {
              setSelectedPlayerName(playerName);
              setShowLeaderboard(false);
              setShowPlayerStats(true);
            }}
          />
        </Suspense>
      )}
    </>
  );
}

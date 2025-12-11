/**
 * JoinGameForm Component
 * Sprint 4 Phase 4.3: Lobby Component Splitting
 *
 * Handles game joining UI for both players and spectators
 * Uses shared keyboard navigation and layout components
 */

import { Suspense, lazy, useState, useRef, useCallback, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { sounds } from '../utils/sounds';
import { User } from '../types/auth';
import { UICard, Button, Input, FormPageLayout } from './ui';
import { useFormKeyboardNav } from '../hooks/useFormKeyboardNav';

// Lazy load modals
const PlayerStatsModal = lazy(() =>
  import('./PlayerStatsModal').then((m) => ({ default: m.PlayerStatsModal }))
);
const GlobalLeaderboard = lazy(() =>
  import('./GlobalLeaderboard').then((m) => ({ default: m.GlobalLeaderboard }))
);

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
  const [isLoading, setIsLoading] = useState(false);

  // Refs for focusable elements
  const playerRadioRef = useRef<HTMLInputElement>(null);
  const spectatorRadioRef = useRef<HTMLInputElement>(null);
  const gameIdInputRef = useRef<HTMLInputElement>(null);
  const playerNameInputRef = useRef<HTMLInputElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const joinButtonRef = useRef<HTMLButtonElement>(null);

  // Custom escape handler (different behavior for auto-join URLs)
  const handleEscape = useCallback(() => {
    if (autoJoinGameId) {
      onBackToHomepage();
    } else {
      onBack();
    }
  }, [autoJoinGameId, onBackToHomepage, onBack]);

  // Grid config: Row 0=radios, Row 1=game ID, Row 2=name (skip if auth), Row 3=buttons
  const getFocusableElement = useCallback(
    (row: number, col: number): HTMLElement | null => {
      // Apply user-based skip for row 2 (name input)
      const effectiveRow = user && row >= 2 ? row + 1 : row;
      switch (effectiveRow) {
        case 0:
          return col === 0 ? playerRadioRef.current : spectatorRadioRef.current;
        case 1:
          return gameIdInputRef.current;
        case 2:
          return playerNameInputRef.current;
        case 3:
          return col === 0 ? backButtonRef.current : joinButtonRef.current;
        default:
          return null;
      }
    },
    [user]
  );

  // Use shared keyboard navigation hook
  const { navRow, setNavRow } = useFormKeyboardNav({
    grid: {
      colsPerRow: [2, 1, 1, 2], // radios, game ID, name, buttons
      skipRows: 0, // We handle the skip differently for this form
    },
    getFocusableElement,
    onEscape: handleEscape,
    inputRefs: [gameIdInputRef, playerNameInputRef],
  });

  // Sync joinType with radio when on row 0
  useEffect(() => {
    if (navRow === 0) {
      // Radio row - sync is handled by onChange
    }
  }, [navRow]);

  // Auto-focus player name input if from auto-join URL
  useEffect(() => {
    if (autoJoinGameId && playerNameInputRef.current) {
      const timer = setTimeout(() => {
        setNavRow(user ? 2 : 2);
        playerNameInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [autoJoinGameId, user, setNavRow]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (joinType === 'player') {
      if (playerName.trim() && gameId.trim()) {
        setIsLoading(true);
        onJoinGame(gameId, playerName);
      }
    } else {
      // Spectator mode
      if (gameId.trim()) {
        setIsLoading(true);
        onSpectateGame(gameId, playerName.trim() || undefined);
      }
    }
  };

  return (
    <>
      <FormPageLayout title="Join Game">
        {/* Show message when joining from URL */}
        {autoJoinGameId && (
          <UICard
            variant="gradient"
            gradient="info"
            size="md"
            className="mb-6 animate-pulse shadow-lg"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl" aria-hidden="true">
                🎮
              </span>
              <p className="text-white font-bold text-lg text-center">
                Joining game:{' '}
                <span className="font-mono bg-white/20 px-2 py-1 rounded border border-white/30">
                  {gameId}
                </span>
              </p>
            </div>
            <p className="text-white/90 font-medium text-center">
              <span aria-hidden="true">👇</span> Enter your name below to join!
            </p>
          </UICard>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
            {/* Join Type Selection */}
            <div className="bg-skin-secondary rounded-lg p-4 border-2 border-skin-default">
              <label className="block text-sm font-medium text-skin-primary mb-3">
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
                    className="w-4 h-4 text-skin-accent focus:ring-skin-accent focus:ring-2 focus:ring-offset-2"
                  />
                  <span className="ml-3 text-skin-primary font-medium">Player</span>
                </label>
                <label className="flex items-center cursor-pointer flex-1">
                  <input
                    ref={spectatorRadioRef}
                    type="radio"
                    name="joinType"
                    value="spectator"
                    checked={joinType === 'spectator'}
                    onChange={(e) => setJoinType(e.target.value as 'player' | 'spectator')}
                    className="w-4 h-4 text-skin-accent focus:ring-skin-accent focus:ring-2 focus:ring-offset-2"
                  />
                  <span className="ml-3 text-skin-primary font-medium">
                    Spectator
                  </span>
                </label>
              </div>
            </div>

            <Input
              ref={gameIdInputRef}
              data-testid="game-id-input"
              label="Game ID"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              placeholder="Enter game ID"
              required
            />
            <Input
              ref={playerNameInputRef}
              data-testid="player-name-input"
              label={`Your Name ${joinType === 'spectator' ? '(Optional)' : ''}`}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              disabled={!!user}
              placeholder={user ? 'Using authenticated username' : 'Enter your name'}
              required={joinType === 'player'}
              className={autoJoinGameId ? 'ring-2 ring-skin-accent' : ''}
            />

            {/* Info message for spectator mode */}
            {joinType === 'spectator' && (
              <div className="bg-skin-secondary border-2 border-skin-default rounded-lg p-3">
                <p className="text-sm text-skin-secondary">
                  As a spectator, you can watch the game but cannot play cards. Player hands will be
                  hidden.
                </p>
              </div>
            )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
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
                Back to Homepage
              </Button>
            ) : (
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
            )}
            <Button
              ref={joinButtonRef}
              data-testid="submit-join-button"
              type="submit"
              variant={joinType === 'player' ? 'secondary' : 'primary'}
              size="lg"
              className="flex-1"
              loading={isLoading}
              disabled={isLoading}
            >
              {joinType === 'player' ? 'Join as Player' : 'Join as Spectator'}
            </Button>
          </div>
        </form>
      </FormPageLayout>

      {/* Stats & Leaderboard Modals */}
      {socket && (
        <Suspense fallback={<div />}>
          <PlayerStatsModal
            playerName={selectedPlayerName}
            socket={socket}
            isOpen={showPlayerStats}
            onClose={() => setShowPlayerStats(false)}
            onResumeGame={(gameIdToResume) => {
              setShowPlayerStats(false);
              onJoinGame(gameIdToResume, playerName);
            }}
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

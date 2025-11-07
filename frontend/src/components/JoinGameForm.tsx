/**
 * JoinGameForm Component
 * Sprint 4 Phase 4.3: Lobby Component Splitting
 *
 * Handles game joining UI for both players and spectators
 */

import { Suspense, lazy } from 'react';
import { Socket } from 'socket.io-client';
import { sounds } from '../utils/sounds';
import { User } from '../types/auth';

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
      <div className="min-h-screen bg-gradient-to-br from-amber-900 via-orange-800 to-red-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background cards */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 text-6xl animate-bounce" style={{ animationDuration: '3s', animationDelay: '0s' }}>🃏</div>
          <div className="absolute top-20 right-20 text-6xl animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>🎴</div>
          <div className="absolute bottom-20 left-20 text-6xl animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>🂡</div>
          <div className="absolute bottom-10 right-10 text-6xl animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '1.5s' }}>🂱</div>
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
            <div className="mb-6 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 border-2 border-blue-500 dark:border-blue-600 rounded-lg p-5 animate-pulse shadow-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl">🎮</span>
                <p className="text-blue-900 dark:text-blue-200 font-bold text-lg text-center">
                  Joining game: <span className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded border border-blue-400 dark:border-blue-500">{gameId}</span>
                </p>
              </div>
              <p className="text-blue-700 dark:text-blue-300 font-medium text-center">
                👇 Enter your name below to join!
              </p>
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4">
            {/* Join Type Selection */}
            <div className="bg-parchment-100 dark:bg-gray-700 rounded-lg p-4 border-2 border-parchment-400 dark:border-gray-600">
              <label className="block text-sm font-medium text-umber-800 dark:text-gray-200 mb-3">
                Join as:
              </label>
              <div className="space-y-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="joinType"
                    value="player"
                    checked={joinType === 'player'}
                    onChange={(e) => setJoinType(e.target.value as 'player' | 'spectator')}
                    className="w-4 h-4 text-umber-600 focus:ring-umber-500"
                  />
                  <span className="ml-3 text-umber-800 dark:text-gray-200 font-medium">Player</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="joinType"
                    value="spectator"
                    checked={joinType === 'spectator'}
                    onChange={(e) => setJoinType(e.target.value as 'player' | 'spectator')}
                    className="w-4 h-4 text-umber-600 focus:ring-umber-500"
                  />
                  <span className="ml-3 text-umber-800 dark:text-gray-200 font-medium">Guest (Spectator)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-umber-800 dark:text-gray-200 mb-2">
                Game ID
              </label>
              <input
                data-testid="game-id-input"
                type="text"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                className="w-full px-4 py-2 border-2 border-parchment-400 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-umber-500 focus:border-umber-500 bg-parchment-100 dark:bg-gray-700 text-umber-900 dark:text-gray-100"
                placeholder="Enter game ID"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-umber-800 dark:text-gray-200 mb-2">
                Your Name {joinType === 'spectator' && '(Optional)'}
              </label>
              <input
                data-testid="player-name-input"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                disabled={!!user}
                placeholder={user ? "Using authenticated username" : "Enter your name"}
                className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-umber-500 focus:border-umber-500 bg-parchment-100 dark:bg-gray-700 text-umber-900 dark:text-gray-100 ${
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
              <div className="bg-parchment-200 border-2 border-umber-400 rounded-lg p-3">
                <p className="text-sm text-umber-800">
                  As a spectator, you can watch the game but cannot play cards. Player hands will be hidden.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              {/* Show appropriate back button based on context */}
              {autoJoinGameId ? (
                <button
                  data-testid="back-to-homepage-button"
                  type="button"
                  onClick={onBackToHomepage}
                  className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 rounded-xl font-bold hover:from-gray-600 hover:to-gray-700 transition-all duration-300 border-2 border-gray-700 shadow-lg transform hover:scale-105"
                >
                  🏠 Back to Homepage
                </button>
              ) : (
                <button
                  data-testid="back-button"
                  type="button"
                  onClick={() => { sounds.buttonClick(); onBack(); }}
                  className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 rounded-xl font-bold hover:from-gray-600 hover:to-gray-700 transition-all duration-300 border-2 border-gray-700 shadow-lg transform hover:scale-105"
                >
                  Back
                </button>
              )}
              <button
                data-testid="submit-join-button"
                type="submit"
                className={`flex-1 text-white py-3 rounded-xl font-bold transition-all duration-300 border-2 shadow-lg transform hover:scale-105 ${
                  joinType === 'player'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 border-purple-800'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 border-blue-800'
                }`}
              >
                {joinType === 'player' ? 'Join as Player' : 'Join as Guest'}
              </button>
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

/**
 * Active Games Component
 *
 * Displays the player's active (in-progress) games that can be resumed
 * Allows players to reconnect to games after disconnection or server restart
 */

import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { sounds } from '../utils/sounds';

interface ActiveGame {
  gameId: string;
  playerNames: string[];
  phase: string;
  teamScores: { team1: number; team2: number };
  myTeamId: number | null;
  createdAt: number;
}

interface ActiveGamesProps {
  playerName: string;
  socket: Socket | null;
  onResumeGame: (gameId: string) => void;
}

export function ActiveGames({ playerName, socket, onResumeGame }: ActiveGamesProps) {
  const [activeGames, setActiveGames] = useState<ActiveGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playerName.trim()) {
      setActiveGames([]);
      return;
    }

    const fetchActiveGames = async () => {
      setLoading(true);
      setError(null);

      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/api/players/${encodeURIComponent(playerName)}/active-games`);

        if (!response.ok) {
          throw new Error('Failed to fetch active games');
        }

        const data = await response.json();
        setActiveGames(data.games || []);
      } catch (err) {
        console.error('Error fetching active games:', err);
        setError('Failed to load active games');
      } finally {
        setLoading(false);
      }
    };

    fetchActiveGames();

    // Refresh every 30 seconds
    const interval = setInterval(fetchActiveGames, 30000);

    return () => clearInterval(interval);
  }, [playerName]);

  if (!playerName.trim()) {
    return null;
  }

  if (loading && activeGames.length === 0) {
    return (
      <div className="bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-400 dark:border-blue-600 rounded-lg p-4">
        <p className="text-blue-800 dark:text-blue-300 text-center">
          🔍 Loading your active games...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900/30 border-2 border-red-400 dark:border-red-600 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-300 text-center">
          ⚠️ {error}
        </p>
      </div>
    );
  }

  if (activeGames.length === 0) {
    return null; // Don't show anything if no active games
  }

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'betting': return '💰 Betting';
      case 'playing': return '🎮 Playing';
      case 'scoring': return '📊 Scoring';
      default: return phase;
    }
  };

  const getTeamColor = (teamId: number | null) => {
    if (teamId === 1) return 'text-orange-600 dark:text-orange-400';
    if (teamId === 2) return 'text-purple-600 dark:text-purple-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-400 dark:border-green-600 rounded-lg p-4 shadow-lg">
      <h3 className="font-bold text-lg text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
        <span>🔄</span>
        <span>Your Active Games ({activeGames.length})</span>
      </h3>

      <div className="space-y-2">
        {activeGames.map((game) => (
          <div
            key={game.gameId}
            className="bg-white dark:bg-gray-800 rounded-lg p-3 border-2 border-green-300 dark:border-green-700 hover:border-green-500 dark:hover:border-green-500 transition-colors"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
                    {game.gameId.substring(0, 8).toUpperCase()}
                  </span>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {getPhaseLabel(game.phase)}
                  </span>
                </div>

                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Players: {game.playerNames.join(', ')}
                </div>

                <div className="flex items-center gap-4 mt-1 text-sm">
                  <span className="text-orange-600 dark:text-orange-400 font-bold">
                    Team 1: {game.teamScores.team1}
                  </span>
                  <span className="text-purple-600 dark:text-purple-400 font-bold">
                    Team 2: {game.teamScores.team2}
                  </span>
                  {game.myTeamId && (
                    <span className={`text-xs font-semibold ${getTeamColor(game.myTeamId)}`}>
                      (You're Team {game.myTeamId})
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  sounds.buttonClick();
                  onResumeGame(game.gameId);
                }}
                disabled={!socket}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ▶️ Resume
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-green-700 dark:text-green-400 mt-3 text-center">
        💡 Click Resume to rejoin your game
      </p>
    </div>
  );
}

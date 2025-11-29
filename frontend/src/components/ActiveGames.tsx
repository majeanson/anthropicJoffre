/**
 * Active Games Component
 *
 * Displays the player's active (in-progress) games that can be resumed
 * Allows players to reconnect to games after disconnection or server restart
 */

import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { sounds } from '../utils/sounds';
import { CONFIG } from '../config/constants';
import { ERROR_MESSAGES } from '../config/errorMessages';
import logger from '../utils/logger';
import { UICard } from './ui/UICard';
import { Button } from './ui/Button';

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
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/players/${encodeURIComponent(playerName)}/active-games`);

        if (!response.ok) {
          throw new Error(ERROR_MESSAGES.ACTIVE_GAMES_LOAD_FAILED);
        }

        const data = await response.json();
        setActiveGames(data.games || []);
      } catch (err) {
        logger.error('Error fetching active games:', err);
        // More specific error message for CORS/network failures
        if (err instanceof TypeError) {
          setError(ERROR_MESSAGES.CONNECTION_FAILED);
        } else {
          setError(ERROR_MESSAGES.ACTIVE_GAMES_LOAD_FAILED);
        }
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
      <UICard variant="gradient" gradient="info" size="md" className="text-center">
        <p className="text-white">
          🔍 Loading your active games...
        </p>
      </UICard>
    );
  }

  if (error) {
    return (
      <UICard variant="gradient" gradient="error" size="md" className="text-center">
        <p className="text-white">
          ⚠️ {error}
        </p>
      </UICard>
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
    <UICard variant="gradient" gradient="success" size="lg">
      <h3 className="font-bold text-lg text-white mb-3 flex items-center gap-2">
        <span aria-hidden="true">🔄</span>
        <span>Your Active Games ({activeGames.length})</span>
      </h3>

      <div className="space-y-2">
        {activeGames.map((game) => (
          <UICard
            key={game.gameId}
            variant="bordered"
            size="md"
            className="hover:border-green-500 dark:hover:border-green-500 transition-colors"
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

              <Button
                variant="success"
                onClick={() => {
                  sounds.buttonClick();
                  onResumeGame(game.gameId);
                }}
                disabled={!socket}
                leftIcon={<span>▶️</span>}
                aria-label={`Resume game ${game.gameId.substring(0, 8)}`}
              >
                Resume
              </Button>
            </div>
          </UICard>
        ))}
      </div>

      <p className="text-xs text-white/90 mt-3 text-center">
        💡 Click Resume to rejoin your game
      </p>
    </UICard>
  );
}

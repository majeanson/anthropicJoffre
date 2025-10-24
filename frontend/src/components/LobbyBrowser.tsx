import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { GameReplay } from './GameReplay';

interface LobbyGame {
  gameId: string;
  phase: string;
  playerCount: number;
  humanPlayerCount: number;
  botPlayerCount: number;
  isJoinable: boolean;
  isInProgress: boolean;
  teamScores: {
    team1: number;
    team2: number;
  };
  roundNumber: number;
  createdAt: number;
  players: Array<{
    name: string;
    teamId: 1 | 2;
    isBot: boolean;
  }>;
}

interface RecentGame {
  game_id: string;
  winning_team: 1 | 2;
  team1_score: number;
  team2_score: number;
  rounds: number;
  player_names: string[];
  player_teams: (1 | 2)[];
  is_bot_game: boolean;
  game_duration_seconds: number;
  created_at: string;
  finished_at: string;
}

interface LobbyBrowserProps {
  socket: Socket | null;
  onJoinGame: (gameId: string) => void;
  onSpectateGame: (gameId: string) => void;
  onClose: () => void;
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export function LobbyBrowser({ socket, onJoinGame, onSpectateGame, onClose }: LobbyBrowserProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'recent'>('active');
  const [games, setGames] = useState<LobbyGame[]>([]);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameId, setGameId] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [replayGameId, setReplayGameId] = useState<string | null>(null);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${SOCKET_URL}/api/games/lobby`);
      if (!response.ok) throw new Error('Failed to fetch games');
      const data = await response.json();
      setGames(data.games);
      setError(null);
    } catch (err) {
      setError('Failed to load games. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentGames = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${SOCKET_URL}/api/games/recent?limit=20`);
      if (!response.ok) throw new Error('Failed to fetch recent games');
      const data = await response.json();
      setRecentGames(data.games);
      setError(null);
    } catch (err) {
      setError('Failed to load recent games. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'active') {
      fetchGames();
      // Refresh active games every 5 seconds
      const interval = setInterval(fetchGames, 5000);
      return () => clearInterval(interval);
    } else {
      fetchRecentGames();
    }
  }, [activeTab]);

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'team_selection': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'betting': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'playing': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'scoring': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'game_over': return 'bg-gray-100 text-gray-800 dark:text-gray-200 dark:bg-gray-800 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:text-gray-200 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'team_selection': return 'Team Selection';
      case 'betting': return 'Betting';
      case 'playing': return 'Playing';
      case 'scoring': return 'Scoring';
      case 'game_over': return 'Game Over';
      default: return phase;
    }
  };

  // Show GameReplay if a game is selected for replay
  if (replayGameId) {
    return (
      <GameReplay
        gameId={replayGameId}
        socket={socket}
        onClose={() => setReplayGameId(null)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-parchment-50 dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border-4 border-amber-700 dark:border-gray-600 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 to-orange-700 dark:from-gray-700 dark:to-gray-900 p-6 text-white flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black font-serif">Game Lobby</h2>
            <p className="text-sm opacity-90 mt-1">
              {activeTab === 'active'
                ? `${games.length} active game${games.length !== 1 ? 's' : ''}`
                : `${recentGames.length} recent game${recentGames.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            aria-label="Close"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b-2 border-parchment-300 dark:border-gray-600 bg-parchment-100 dark:bg-gray-700">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-4 px-6 font-bold text-lg transition-all ${
              activeTab === 'active'
                ? 'bg-parchment-50 dark:bg-gray-800 text-amber-700 dark:text-amber-500 border-b-4 border-amber-700 dark:border-amber-500'
                : 'text-umber-600 dark:text-gray-400 hover:bg-parchment-200 dark:hover:bg-gray-600'
            }`}
          >
            🎮 Active Games
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`flex-1 py-4 px-6 font-bold text-lg transition-all ${
              activeTab === 'recent'
                ? 'bg-parchment-50 dark:bg-gray-800 text-amber-700 dark:text-amber-500 border-b-4 border-amber-700 dark:border-amber-500'
                : 'text-umber-600 dark:text-gray-400 hover:bg-parchment-200 dark:hover:bg-gray-600'
            }`}
          >
            📜 Recent Games
          </button>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-4 space-y-3">
          {/* Join with Game ID Section - Only in Active Games tab */}
          {activeTab === 'active' && (
            <div className="bg-white dark:bg-gray-700 rounded-xl p-4 border-2 border-parchment-300 dark:border-gray-600">
              <button
                onClick={() => setShowJoinInput(!showJoinInput)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔑</span>
                  <span className="font-semibold text-umber-900 dark:text-gray-100">Join with Game ID</span>
                </div>
                <span className="text-sm text-umber-600 dark:text-gray-400">{showJoinInput ? '▲' : '▼'}</span>
              </button>

              {showJoinInput && (
                <div className="mt-3 space-y-2 animate-slideDown">
                  <input
                    type="text"
                    value={gameId}
                    onChange={(e) => setGameId(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-parchment-400 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 bg-parchment-100 dark:bg-gray-600 text-umber-900 dark:text-gray-100 text-sm"
                    placeholder="Enter Game ID"
                  />
                  <button
                    data-testid="join-game-button"
                    onClick={() => {
                      if (gameId.trim()) {
                        onJoinGame(gameId.trim());
                        onClose();
                      }
                    }}
                    disabled={!gameId.trim()}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Join Game
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin h-12 w-12 border-4 border-amber-600 dark:border-gray-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-umber-700 dark:text-gray-300 mt-4">Loading games...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-400 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg text-center">
              {error}
            </div>
          )}

          {/* Active Games Tab */}
          {activeTab === 'active' && !loading && !error && (
            <>
              {games.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-2xl mb-2">🎮</p>
                  <p className="text-umber-700 dark:text-gray-300 font-semibold">No active games</p>
                  <p className="text-umber-600 dark:text-gray-400 text-sm mt-1">
                    Create a new game to get started!
                  </p>
                </div>
              ) : (
                games.map(game => (
                  <div
                    key={game.gameId}
                    className="bg-white dark:bg-gray-700 rounded-xl p-4 border-2 border-parchment-300 dark:border-gray-600 hover:border-amber-500 dark:hover:border-gray-500 transition-all shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-black text-xl text-umber-900 dark:text-gray-100">
                            Game {game.gameId}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPhaseColor(game.phase)}`}>
                            {getPhaseLabel(game.phase)}
                          </span>
                        </div>
                        <div className="text-sm text-umber-600 dark:text-gray-400 flex items-center gap-4">
                          <span>👥 {game.humanPlayerCount} player{game.humanPlayerCount !== 1 ? 's' : ''}</span>
                          {game.botPlayerCount > 0 && (
                            <span>🤖 {game.botPlayerCount} bot{game.botPlayerCount !== 1 ? 's' : ''}</span>
                          )}
                          {game.isInProgress && (
                            <span>📊 Round {game.roundNumber}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {game.isJoinable && (
                          <button
                            onClick={() => {
                              onJoinGame(game.gameId);
                              onClose();
                            }}
                            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg font-bold hover:from-green-700 hover:to-green-800 transition-all duration-300 border-2 border-green-800 shadow-lg transform hover:scale-105"
                          >
                            Join
                          </button>
                        )}
                        {game.isInProgress && (
                          <button
                            onClick={() => {
                              onSpectateGame(game.gameId);
                              onClose();
                            }}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 border-2 border-blue-800 shadow-lg transform hover:scale-105 flex items-center gap-2"
                          >
                            <span>👁️</span>
                            Spectate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* Recent Games Tab */}
          {activeTab === 'recent' && !loading && !error && (
            <>
              {recentGames.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-2xl mb-2">📜</p>
                  <p className="text-umber-700 dark:text-gray-300 font-semibold">No recent games</p>
                  <p className="text-umber-600 dark:text-gray-400 text-sm mt-1">
                    Completed games will appear here
                  </p>
                </div>
              ) : (
                recentGames.map(game => {
                  const durationMinutes = Math.floor(game.game_duration_seconds / 60);
                  const finishedDate = new Date(game.finished_at);
                  const timeAgo = getTimeAgo(finishedDate);

                  return (
                    <div
                      key={game.game_id}
                      className="bg-white dark:bg-gray-700 rounded-xl p-4 border-2 border-parchment-300 dark:border-gray-600 hover:border-amber-500 dark:hover:border-gray-500 transition-all shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-black text-xl text-umber-900 dark:text-gray-100">
                              Game {game.game_id}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              game.winning_team === 1
                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200'
                                : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200'
                            }`}>
                              🏆 Team {game.winning_team} Won
                            </span>
                          </div>
                          <div className="text-sm text-umber-600 dark:text-gray-400 flex items-center gap-4">
                            <span>📊 Score: {game.team1_score} - {game.team2_score}</span>
                            <span>🎯 {game.rounds} rounds</span>
                            <span>⏱️ {durationMinutes}m</span>
                            <span>🕒 {timeAgo}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => setReplayGameId(game.game_id)}
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 border-2 border-purple-800 shadow-lg transform hover:scale-105 flex items-center gap-2"
                        >
                          <span>📺</span>
                          Watch Replay
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to format time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

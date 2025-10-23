import { useState, useEffect } from 'react';

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

interface LobbyBrowserProps {
  onJoinGame: (gameId: string) => void;
  onSpectateGame: (gameId: string) => void;
  onClose: () => void;
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export function LobbyBrowser({ onJoinGame, onSpectateGame, onClose }: LobbyBrowserProps) {
  const [games, setGames] = useState<LobbyGame[]>([]);
  const [filter, setFilter] = useState<'all' | 'joinable' | 'in_progress'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameId, setGameId] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${SOCKET_URL}/api/games/lobby`);
      if (!response.ok) throw new Error('Failed to fetch games');
      const data = await response.json();
      setGames(data.games);
      setError(null);
    } catch (err) {
      logger.error('Error fetching games:', err);
      setError('Failed to load games. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
    // Refresh every 5 seconds
    const interval = setInterval(fetchGames, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredGames = games.filter(game => {
    if (filter === 'joinable') return game.isJoinable;
    if (filter === 'in_progress') return game.isInProgress;
    return true;
  });

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

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-parchment-50 dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border-4 border-amber-700 dark:border-gray-600 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 to-orange-700 dark:from-gray-700 dark:to-gray-900 p-6 text-white flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black font-serif">Game Lobby</h2>
            <p className="text-sm opacity-90 mt-1">
              {games.length} active game{games.length !== 1 ? 's' : ''}
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

        {/* Filters */}
        <div className="p-4 bg-parchment-100 dark:bg-gray-700 border-b-2 border-parchment-300 dark:border-gray-600 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'all'
                ? 'bg-amber-600 text-white'
                : 'bg-parchment-200 dark:bg-gray-600 text-umber-900 dark:text-gray-200 hover:bg-parchment-300 dark:hover:bg-gray-500'
            }`}
          >
            All Games ({games.length})
          </button>
          <button
            onClick={() => setFilter('joinable')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'joinable'
                ? 'bg-green-600 text-white'
                : 'bg-parchment-200 dark:bg-gray-600 text-umber-900 dark:text-gray-200 hover:bg-parchment-300 dark:hover:bg-gray-500'
            }`}
          >
            Joinable ({games.filter(g => g.isJoinable).length})
          </button>
          <button
            onClick={() => setFilter('in_progress')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'in_progress'
                ? 'bg-blue-600 text-white'
                : 'bg-parchment-200 dark:bg-gray-600 text-umber-900 dark:text-gray-200 hover:bg-parchment-300 dark:hover:bg-gray-500'
            }`}
          >
            In Progress ({games.filter(g => g.isInProgress).length})
          </button>
          <button
            onClick={fetchGames}
            className="ml-auto px-4 py-2 rounded-lg font-semibold bg-parchment-200 dark:bg-gray-600 text-umber-900 dark:text-gray-200 hover:bg-parchment-300 dark:hover:bg-gray-500 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Games List */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-4 space-y-3">
          {/* Join with Game ID Section */}
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

          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin h-12 w-12 border-4 border-amber-600 dark:border-gray-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-umber-700 dark:text-gray-300 mt-4">Loading games...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-400 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg text-center">
              {error}
            </div>
          )}

          {!loading && !error && filteredGames.length === 0 && (
            <div className="text-center py-12">
              <p className="text-2xl mb-2">🎮</p>
              <p className="text-umber-700 dark:text-gray-300 font-semibold">
                {filter === 'all' ? 'No games available' : `No ${filter.replace('_', ' ')} games`}
              </p>
              <p className="text-umber-600 dark:text-gray-400 text-sm mt-1">
                Create a new game to get started!
              </p>
            </div>
          )}

          {!loading && !error && filteredGames.map(game => (
            <div
              key={game.gameId}
              className="bg-white dark:bg-gray-700 rounded-xl p-4 border-2 border-parchment-300 dark:border-gray-600 hover:border-amber-500 dark:hover:border-gray-500 transition-all shadow-sm hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
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
                      Join Game
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

              {/* Players */}
              {game.players.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-3 pt-3 border-t border-parchment-200 dark:border-gray-600">
                  {game.players.map((player, idx) => (
                    <div
                      key={idx}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        player.teamId === 1
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200'
                      }`}
                    >
                      {player.isBot && '🤖 '}
                      {player.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

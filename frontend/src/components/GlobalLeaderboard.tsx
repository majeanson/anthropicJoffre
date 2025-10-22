import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';

interface LeaderboardPlayer {
  player_name: string;
  games_played: number;
  games_won: number;
  games_lost: number;
  win_percentage: number;
  elo_rating: number;
  highest_rating: number;
  total_tricks_won: number;
  total_points_earned: number;
  ranking_tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
}

interface GlobalLeaderboardProps {
  socket: Socket;
  isOpen: boolean;
  onClose: () => void;
  onViewPlayerStats?: (playerName: string) => void;
}

export function GlobalLeaderboard({ socket, isOpen, onClose, onViewPlayerStats }: GlobalLeaderboardProps) {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    socket.emit('get_leaderboard', { limit: 100, excludeBots: true });

    const handleLeaderboardResponse = ({ players: receivedPlayers }: { players: LeaderboardPlayer[] }) => {
      setPlayers(receivedPlayers);
      setLoading(false);
    };

    socket.on('leaderboard_response', handleLeaderboardResponse);

    return () => {
      socket.off('leaderboard_response', handleLeaderboardResponse);
    };
  }, [isOpen, socket]);

  if (!isOpen) return null;

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Diamond': return 'bg-gradient-to-r from-cyan-400 to-blue-600 text-white';
      case 'Platinum': return 'bg-gradient-to-r from-gray-300 to-gray-500 text-gray-900';
      case 'Gold': return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900';
      case 'Silver': return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
      case 'Bronze': return 'bg-gradient-to-r from-orange-700 to-orange-900 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Diamond': return '💎';
      case 'Platinum': return '🏆';
      case 'Gold': return '🥇';
      case 'Silver': return '🥈';
      case 'Bronze': return '🥉';
      default: return '📊';
    }
  };

  const getRankMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-gradient-to-br from-parchment-50 to-parchment-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-4 border-amber-900 dark:border-gray-600">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-700 to-blue-700 dark:from-purple-800 dark:to-blue-800 p-6 flex items-center justify-between rounded-t-xl border-b-4 border-purple-950 dark:border-gray-900 z-10">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🏆</span>
            <div>
              <h2 className="text-2xl font-bold text-white">Global Leaderboard</h2>
              <p className="text-purple-200 dark:text-blue-200">Top {players.length} Players</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 text-white w-10 h-10 rounded-full font-bold text-xl transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-purple-700"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400 font-semibold">Loading leaderboard...</p>
            </div>
          )}

          {!loading && players.length === 0 && (
            <div className="text-center py-12">
              <span className="text-6xl">🎮</span>
              <p className="mt-4 text-gray-700 dark:text-gray-300 font-bold text-lg">
                No players yet!
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Be the first to play and claim the top spot!
              </p>
            </div>
          )}

          {!loading && players.length > 0 && (
            <div className="space-y-2">
              {/* Table Header */}
              <div className="hidden md:grid md:grid-cols-7 gap-4 px-4 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg font-bold text-sm text-gray-700 dark:text-gray-300">
                <div className="col-span-1">Rank</div>
                <div className="col-span-2">Player</div>
                <div className="col-span-1 text-center">ELO</div>
                <div className="col-span-1 text-center">Games</div>
                <div className="col-span-1 text-center">Win Rate</div>
                <div className="col-span-1 text-center">Tier</div>
              </div>

              {/* Player Rows */}
              {players.map((player, index) => (
                <div
                  key={player.player_name}
                  className={`grid grid-cols-1 md:grid-cols-7 gap-2 md:gap-4 p-4 rounded-lg transition-all duration-200 ${
                    index < 3
                      ? 'bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/40 border-2 border-yellow-400 dark:border-yellow-600'
                      : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 border border-gray-300 dark:border-gray-600'
                  } ${onViewPlayerStats ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
                  onClick={() => onViewPlayerStats?.(player.player_name)}
                >
                  {/* Rank */}
                  <div className="col-span-1 flex items-center">
                    <span className="text-2xl md:text-3xl font-bold text-gray-700 dark:text-gray-300">
                      {getRankMedal(index + 1)}
                    </span>
                  </div>

                  {/* Player Name */}
                  <div className="col-span-1 md:col-span-2 flex flex-col justify-center">
                    <p className="font-bold text-lg text-gray-900 dark:text-gray-100">{player.player_name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {player.games_won}W - {player.games_lost}L
                    </p>
                  </div>

                  {/* ELO Rating */}
                  <div className="col-span-1 flex flex-col items-center justify-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 md:hidden">ELO</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{player.elo_rating}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Peak: {player.highest_rating}</p>
                  </div>

                  {/* Games Played */}
                  <div className="col-span-1 flex flex-col items-center justify-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 md:hidden">Games</p>
                    <p className="text-xl font-bold text-gray-700 dark:text-gray-300">{player.games_played}</p>
                  </div>

                  {/* Win Percentage */}
                  <div className="col-span-1 flex flex-col items-center justify-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 md:hidden">Win Rate</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{player.win_percentage}%</p>
                  </div>

                  {/* Tier Badge */}
                  <div className="col-span-1 flex items-center justify-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getTierColor(player.ranking_tier)}`}>
                      {getTierIcon(player.ranking_tier)} {player.ranking_tier}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && players.length > 0 && (
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-b-xl border-t-2 border-gray-300 dark:border-gray-600">
            <div className="flex flex-wrap gap-4 justify-center text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span>💎 Diamond:</span>
                <span className="font-bold">{players.filter(p => p.ranking_tier === 'Diamond').length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🏆 Platinum:</span>
                <span className="font-bold">{players.filter(p => p.ranking_tier === 'Platinum').length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🥇 Gold:</span>
                <span className="font-bold">{players.filter(p => p.ranking_tier === 'Gold').length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🥈 Silver:</span>
                <span className="font-bold">{players.filter(p => p.ranking_tier === 'Silver').length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🥉 Bronze:</span>
                <span className="font-bold">{players.filter(p => p.ranking_tier === 'Bronze').length}</span>
              </div>
            </div>
            {onViewPlayerStats && (
              <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                Click on a player to view detailed statistics
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

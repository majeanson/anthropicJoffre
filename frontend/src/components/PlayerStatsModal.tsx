import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';

interface PlayerStats {
  player_name: string;
  games_played: number;
  games_won: number;
  games_lost: number;
  games_abandoned: number;
  win_percentage: number;
  total_tricks_won: number;
  total_points_earned: number;
  avg_tricks_per_game: number;
  total_bets_made: number;
  bets_won: number;
  bets_lost: number;
  avg_bet_amount: number;
  highest_bet: number;
  without_trump_bets: number;
  trump_cards_played: number;
  red_zeros_collected: number;
  brown_zeros_received: number;
  elo_rating: number;
  highest_rating: number;
  ranking_tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  created_at: string;
  updated_at: string;
}

interface PlayerStatsModalProps {
  playerName: string;
  socket: Socket;
  isOpen: boolean;
  onClose: () => void;
}

export function PlayerStatsModal({ playerName, socket, isOpen, onClose }: PlayerStatsModalProps) {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !playerName) return;

    setLoading(true);
    socket.emit('get_player_stats', { playerName });

    const handleStatsResponse = ({ stats: receivedStats, playerName: responseName }: { stats: PlayerStats | null; playerName: string }) => {
      if (responseName === playerName) {
        setStats(receivedStats);
        setLoading(false);
      }
    };

    socket.on('player_stats_response', handleStatsResponse);

    return () => {
      socket.off('player_stats_response', handleStatsResponse);
    };
  }, [isOpen, playerName, socket]);

  if (!isOpen) return null;

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Diamond': return 'from-cyan-400 to-blue-600';
      case 'Platinum': return 'from-gray-300 to-gray-500';
      case 'Gold': return 'from-yellow-400 to-yellow-600';
      case 'Silver': return 'from-gray-400 to-gray-600';
      case 'Bronze': return 'from-orange-700 to-orange-900';
      default: return 'from-gray-500 to-gray-700';
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

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-gradient-to-br from-parchment-50 to-parchment-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-4 border-amber-900 dark:border-gray-600">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-amber-700 to-amber-900 dark:from-gray-700 dark:to-gray-800 p-6 flex items-center justify-between rounded-t-xl border-b-4 border-amber-950 dark:border-gray-900">
          <div className="flex items-center gap-3">
            <span className="text-4xl">📊</span>
            <div>
              <h2 className="text-2xl font-bold text-parchment-50">Player Statistics</h2>
              <p className="text-amber-200 dark:text-gray-300 font-semibold">{playerName}</p>
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
        <div className="p-6 space-y-6">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-amber-700"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400 font-semibold">Loading stats...</p>
            </div>
          )}

          {!loading && !stats && (
            <div className="text-center py-12">
              <span className="text-6xl">❌</span>
              <p className="mt-4 text-gray-700 dark:text-gray-300 font-bold text-lg">
                No statistics found for {playerName}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Play some games to start building your stats!
              </p>
            </div>
          )}

          {!loading && stats && (
            <>
              {/* Ranking Tier Card */}
              <div className={`bg-gradient-to-r ${getTierColor(stats.ranking_tier)} rounded-xl p-6 text-white shadow-xl`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold opacity-90">Current Rank</p>
                    <p className="text-4xl font-bold flex items-center gap-2 mt-1">
                      {getTierIcon(stats.ranking_tier)} {stats.ranking_tier}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold opacity-90">ELO Rating</p>
                    <p className="text-4xl font-bold mt-1">{stats.elo_rating}</p>
                    <p className="text-xs opacity-75">Peak: {stats.highest_rating}</p>
                  </div>
                </div>
              </div>

              {/* Win/Loss Record */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-100 dark:bg-green-900/40 rounded-lg p-4 border-2 border-green-300 dark:border-green-600">
                  <p className="text-green-700 dark:text-green-300 font-bold text-sm">Games Won</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.games_won}</p>
                </div>
                <div className="bg-red-100 dark:bg-red-900/40 rounded-lg p-4 border-2 border-red-300 dark:border-red-600">
                  <p className="text-red-700 dark:text-red-300 font-bold text-sm">Games Lost</p>
                  <p className="text-3xl font-bold text-red-900 dark:text-red-100">{stats.games_lost}</p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/40 rounded-lg p-4 border-2 border-blue-300 dark:border-blue-600">
                  <p className="text-blue-700 dark:text-blue-300 font-bold text-sm">Win Rate</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.win_percentage}%</p>
                </div>
              </div>

              {/* Gameplay Stats */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/40 dark:to-blue-900/40 rounded-lg p-6 border-2 border-purple-200 dark:border-purple-600">
                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  🎮 Gameplay Statistics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Total Games</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.games_played}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Tricks Won</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total_tricks_won}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Avg Tricks/Game</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.avg_tricks_per_game}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Total Points</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total_points_earned}</p>
                  </div>
                </div>
              </div>

              {/* Betting Stats */}
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/40 dark:to-yellow-900/40 rounded-lg p-6 border-2 border-orange-200 dark:border-orange-600">
                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  💰 Betting Statistics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Bets Made</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total_bets_made}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Bets Won</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.bets_won}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Bets Lost</p>
                    <p className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.bets_lost}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Avg Bet</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.avg_bet_amount}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Highest Bet</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.highest_bet}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Without Trump</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{stats.without_trump_bets}</p>
                  </div>
                </div>
              </div>

              {/* Special Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-red-50 dark:bg-red-900/40 rounded-lg p-4 border-2 border-red-200 dark:border-red-600">
                  <p className="text-red-700 dark:text-red-300 font-bold mb-2 flex items-center gap-2">
                    🔴 Red Zeros Collected
                  </p>
                  <p className="text-3xl font-bold text-red-900 dark:text-red-100">{stats.red_zeros_collected}</p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">+5 bonus points each</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/40 rounded-lg p-4 border-2 border-amber-200 dark:border-amber-600">
                  <p className="text-amber-700 dark:text-amber-300 font-bold mb-2 flex items-center gap-2">
                    🟤 Brown Zeros Received
                  </p>
                  <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">{stats.brown_zeros_received}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">-2 penalty points each</p>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4 border-t-2 border-gray-300 dark:border-gray-600">
                <p>Member since: {new Date(stats.created_at).toLocaleDateString()}</p>
                <p>Last updated: {new Date(stats.updated_at).toLocaleString()}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

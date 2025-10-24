import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { getTierColor, getTierIcon } from '../utils/tierBadge';

interface PlayerStats {
  player_name: string;

  // Game-level stats
  games_played: number;
  games_won: number;
  games_lost: number;
  games_abandoned: number;
  win_percentage: number;
  elo_rating: number;
  highest_rating: number;
  lowest_rating: number;
  ranking_tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  current_win_streak: number;
  best_win_streak: number;
  current_loss_streak: number;
  worst_loss_streak: number;
  fastest_win: number;
  longest_game: number;
  avg_game_duration_minutes: number;

  // Round-level stats
  total_rounds_played: number;
  rounds_won: number;
  rounds_lost: number;
  rounds_win_percentage: number;

  // Trick stats
  total_tricks_won: number;
  avg_tricks_per_round: number;
  most_tricks_in_round: number;
  zero_trick_rounds: number;

  // Betting stats
  total_bets_placed: number;
  bets_made: number;
  bets_failed: number;
  bet_success_rate: number;
  avg_bet_amount: number;
  highest_bet: number;
  without_trump_bets: number;

  // Points stats
  total_points_earned: number;
  avg_points_per_round: number;
  highest_points_in_round: number;

  // Special cards
  trump_cards_played: number;
  red_zeros_collected: number;
  brown_zeros_received: number;

  created_at: string;
  updated_at: string;
}

interface GameHistoryEntry {
  game_id: string;
  winning_team: 1 | 2;
  team1_score: number;
  team2_score: number;
  rounds: number;
  is_finished: boolean;
  created_at: string;
  finished_at: string;
  team_id: 1 | 2;
  tricks_won: number;
  points_earned: number;
  bet_amount: number | null;
  bet_won: boolean | null;
  won_game: boolean;
}

interface PlayerStatsModalProps {
  playerName: string;
  socket: Socket;
  isOpen: boolean;
  onClose: () => void;
  onViewReplay?: (gameId: string) => void;
}

export function PlayerStatsModal({ playerName, socket, isOpen, onClose, onViewReplay }: PlayerStatsModalProps) {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'round' | 'game' | 'history'>('round');
  const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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

  // Fetch game history when history tab is active
  useEffect(() => {
    if (!isOpen || activeTab !== 'history' || !playerName || historyLoading) return;

    setHistoryLoading(true);
    socket.emit('get_player_history', { playerName, limit: 20 });

    const handleHistoryResponse = ({ games, playerName: responseName }: { games: GameHistoryEntry[]; playerName: string }) => {
      if (responseName === playerName) {
        setGameHistory(games);
        setHistoryLoading(false);
      }
    };

    socket.on('player_history_response', handleHistoryResponse);

    return () => {
      socket.off('player_history_response', handleHistoryResponse);
    };
  }, [isOpen, activeTab, playerName, socket, historyLoading]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-gradient-to-br from-parchment-50 to-parchment-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-4 border-amber-900 dark:border-gray-600">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-amber-700 to-amber-900 dark:from-gray-700 dark:to-gray-800 p-6 flex items-center justify-between rounded-t-xl border-b-4 border-amber-950 dark:border-gray-900 z-10">
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
                    <p className="text-xs opacity-75">
                      Peak: {stats.highest_rating} • Low: {stats.lowest_rating || stats.elo_rating}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex gap-2 border-b-2 border-gray-300 dark:border-gray-600">
                <button
                  onClick={() => setActiveTab('round')}
                  className={`flex-1 py-3 px-4 font-bold transition-all duration-200 ${
                    activeTab === 'round'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  📊 Round Stats
                </button>
                <button
                  onClick={() => setActiveTab('game')}
                  className={`flex-1 py-3 px-4 font-bold transition-all duration-200 ${
                    activeTab === 'game'
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  🏆 Game Stats
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 py-3 px-4 font-bold transition-all duration-200 ${
                    activeTab === 'history'
                      ? 'bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  📜 Game History
                </button>
              </div>

              {/* Round Stats Tab */}
              {activeTab === 'round' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Round Performance */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-100 dark:bg-blue-900/40 rounded-lg p-4 border-2 border-blue-300 dark:border-blue-600">
                      <p className="text-blue-700 dark:text-blue-300 font-bold text-sm">Total Rounds</p>
                      <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.total_rounds_played || 0}</p>
                    </div>
                    <div className="bg-green-100 dark:bg-green-900/40 rounded-lg p-4 border-2 border-green-300 dark:border-green-600">
                      <p className="text-green-700 dark:text-green-300 font-bold text-sm">Rounds Won</p>
                      <p className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.rounds_won || 0}</p>
                    </div>
                    <div className="bg-red-100 dark:bg-red-900/40 rounded-lg p-4 border-2 border-red-300 dark:border-red-600">
                      <p className="text-red-700 dark:text-red-300 font-bold text-sm">Rounds Lost</p>
                      <p className="text-3xl font-bold text-red-900 dark:text-red-100">{stats.rounds_lost || 0}</p>
                    </div>
                    <div className="bg-purple-100 dark:bg-purple-900/40 rounded-lg p-4 border-2 border-purple-300 dark:border-purple-600">
                      <p className="text-purple-700 dark:text-purple-300 font-bold text-sm">Win Rate</p>
                      <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.rounds_win_percentage || 0}%</p>
                    </div>
                  </div>

                  {/* Trick Performance */}
                  <div className="bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-indigo-900/40 dark:to-cyan-900/40 rounded-lg p-6 border-2 border-indigo-200 dark:border-indigo-600">
                    <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      🎯 Trick Performance
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Total Tricks</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total_tricks_won || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Avg Per Round</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.avg_tricks_per_round || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Best Round</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.most_tricks_in_round || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Zero Tricks</p>
                        <p className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.zero_trick_rounds || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Betting Performance */}
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/40 dark:to-yellow-900/40 rounded-lg p-6 border-2 border-orange-200 dark:border-orange-600">
                    <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      💰 Betting Performance
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Bets Placed</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total_bets_placed || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Bets Made</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.bets_made || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Bets Failed</p>
                        <p className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.bets_failed || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Success Rate</p>
                        <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{stats.bet_success_rate || 0}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Avg Bet</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.avg_bet_amount || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Highest Bet</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.highest_bet || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Without Trump</p>
                        <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{stats.without_trump_bets || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Points Performance */}
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/40 dark:to-teal-900/40 rounded-lg p-6 border-2 border-emerald-200 dark:border-emerald-600">
                    <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      ⭐ Points Performance
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Total Points</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total_points_earned || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Avg Per Round</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.avg_points_per_round || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Best Round</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.highest_points_in_round || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Special Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-red-50 dark:bg-red-900/40 rounded-lg p-4 border-2 border-red-200 dark:border-red-600">
                      <p className="text-red-700 dark:text-red-300 font-bold mb-2 flex items-center gap-2">
                        🔴 Red Zeros Collected
                      </p>
                      <p className="text-3xl font-bold text-red-900 dark:text-red-100">{stats.red_zeros_collected || 0}</p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">+5 bonus points each</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/40 rounded-lg p-4 border-2 border-amber-200 dark:border-amber-600">
                      <p className="text-amber-700 dark:text-amber-300 font-bold mb-2 flex items-center gap-2">
                        🟤 Brown Zeros Received
                      </p>
                      <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">{stats.brown_zeros_received || 0}</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">-2 penalty points each</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Game Stats Tab */}
              {activeTab === 'game' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Win/Loss Record */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-100 dark:bg-blue-900/40 rounded-lg p-4 border-2 border-blue-300 dark:border-blue-600">
                      <p className="text-blue-700 dark:text-blue-300 font-bold text-sm">Games Played</p>
                      <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.games_played}</p>
                    </div>
                    <div className="bg-green-100 dark:bg-green-900/40 rounded-lg p-4 border-2 border-green-300 dark:border-green-600">
                      <p className="text-green-700 dark:text-green-300 font-bold text-sm">Games Won</p>
                      <p className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.games_won}</p>
                    </div>
                    <div className="bg-red-100 dark:bg-red-900/40 rounded-lg p-4 border-2 border-red-300 dark:border-red-600">
                      <p className="text-red-700 dark:text-red-300 font-bold text-sm">Games Lost</p>
                      <p className="text-3xl font-bold text-red-900 dark:text-red-100">{stats.games_lost}</p>
                    </div>
                    <div className="bg-purple-100 dark:bg-purple-900/40 rounded-lg p-4 border-2 border-purple-300 dark:border-purple-600">
                      <p className="text-purple-700 dark:text-purple-300 font-bold text-sm">Win Rate</p>
                      <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.win_percentage}%</p>
                    </div>
                  </div>

                  {/* Streaks */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/40 dark:to-orange-900/40 rounded-lg p-6 border-2 border-yellow-200 dark:border-yellow-600">
                    <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      🔥 Streaks
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Current Win</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.current_win_streak || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Best Win</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.best_win_streak || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Current Loss</p>
                        <p className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.current_loss_streak || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Worst Loss</p>
                        <p className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.worst_loss_streak || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Game Records */}
                  <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/40 dark:to-blue-900/40 rounded-lg p-6 border-2 border-cyan-200 dark:border-cyan-600">
                    <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      📈 Game Records
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Fastest Win</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.fastest_win || 'N/A'} {stats.fastest_win && 'rounds'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Longest Game</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.longest_game || 0} rounds</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Avg Duration</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.avg_game_duration_minutes || 0} min</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Game History Tab */}
              {activeTab === 'history' && (
                <div className="space-y-4 animate-fadeIn">
                  {historyLoading && (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-green-700"></div>
                      <p className="mt-4 text-gray-600 dark:text-gray-400 font-semibold">Loading game history...</p>
                    </div>
                  )}

                  {!historyLoading && gameHistory.length === 0 && (
                    <div className="text-center py-12">
                      <span className="text-6xl">📭</span>
                      <p className="mt-4 text-gray-700 dark:text-gray-300 font-bold text-lg">
                        No game history found
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        Play some games to build your history!
                      </p>
                    </div>
                  )}

                  {!historyLoading && gameHistory.length > 0 && (
                    <>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Showing last {gameHistory.length} games
                      </p>
                      <div className="space-y-3">
                        {gameHistory.map((game) => (
                          <div
                            key={game.game_id}
                            className={`rounded-lg p-4 border-2 ${
                              game.won_game
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-600'
                                : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-600'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-4 mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-lg font-bold ${
                                    game.won_game
                                      ? 'text-green-700 dark:text-green-300'
                                      : 'text-red-700 dark:text-red-300'
                                  }`}>
                                    {game.won_game ? '✓ Victory' : '✗ Defeat'}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                    game.team_id === 1
                                      ? 'bg-orange-500 text-white'
                                      : 'bg-purple-500 text-white'
                                  }`}>
                                    Team {game.team_id}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {new Date(game.finished_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                  {game.team1_score} - {game.team2_score}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {game.rounds} rounds
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 text-sm mb-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                              <div>
                                <p className="text-gray-600 dark:text-gray-400">Tricks Won</p>
                                <p className="font-bold text-gray-900 dark:text-gray-100">{game.tricks_won}</p>
                              </div>
                              <div>
                                <p className="text-gray-600 dark:text-gray-400">Points Earned</p>
                                <p className="font-bold text-gray-900 dark:text-gray-100">{game.points_earned}</p>
                              </div>
                              {game.bet_amount !== null && (
                                <div>
                                  <p className="text-gray-600 dark:text-gray-400">Bet</p>
                                  <p className="font-bold text-gray-900 dark:text-gray-100">
                                    {game.bet_amount} {game.bet_won === true ? '✓' : game.bet_won === false ? '✗' : ''}
                                  </p>
                                </div>
                              )}
                            </div>

                            {onViewReplay && game.is_finished && (
                              <button
                                onClick={() => {
                                  onViewReplay(game.game_id);
                                  onClose();
                                }}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-2 px-4 rounded-lg font-bold transition-all"
                              >
                                📺 View Replay
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

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

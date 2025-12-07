import { PlayerStats } from './types';

interface RoundStatsTabProps {
  stats: PlayerStats;
}

export function RoundStatsTab({ stats }: RoundStatsTabProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Round Performance */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-100 rounded-lg p-4 border-2 border-blue-300">
          <p className="text-blue-700 font-bold text-sm">Total Rounds</p>
          <p className="text-3xl font-bold text-blue-900">{stats.total_rounds_played || 0}</p>
        </div>
        <div className="bg-green-100 rounded-lg p-4 border-2 border-green-300">
          <p className="text-green-700 font-bold text-sm">Rounds Won</p>
          <p className="text-3xl font-bold text-green-900">{stats.rounds_won || 0}</p>
        </div>
        <div className="bg-red-100 rounded-lg p-4 border-2 border-red-300">
          <p className="text-red-700 font-bold text-sm">Rounds Lost</p>
          <p className="text-3xl font-bold text-red-900">{stats.rounds_lost || 0}</p>
        </div>
        <div className="bg-team2-10 rounded-lg p-4 border-2 border-team2">
          <p className="text-team2 font-bold text-sm">Win Rate</p>
          <p className="text-3xl font-bold text-team2">{stats.rounds_win_percentage || 0}%</p>
        </div>
      </div>

      {/* Trick Performance */}
      <div className="bg-gradient-to-r from-indigo-50 to-cyan-50 rounded-lg p-6 border-2 border-indigo-200">
        <h3 className="text-xl font-bold mb-4 text-skin-primary flex items-center gap-2">
          <span aria-hidden="true">🎯</span> Trick Performance
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-skin-muted text-sm">Total Tricks</p>
            <p className="text-2xl font-bold text-skin-primary">{stats.total_tricks_won || 0}</p>
          </div>
          <div>
            <p className="text-skin-muted text-sm">Avg Per Round</p>
            <p className="text-2xl font-bold text-skin-primary">{stats.avg_tricks_per_round || 0}</p>
          </div>
          <div>
            <p className="text-skin-muted text-sm">Best Round</p>
            <p className="text-2xl font-bold text-green-700">{stats.most_tricks_in_round || 0}</p>
          </div>
          <div>
            <p className="text-skin-muted text-sm">Zero Tricks</p>
            <p className="text-2xl font-bold text-red-700">{stats.zero_trick_rounds || 0}</p>
          </div>
        </div>
      </div>

      {/* Betting Performance */}
      <div className="bg-skin-tertiary rounded-lg p-6 border-2 border-skin-default">
        <h3 className="text-xl font-bold mb-4 text-skin-primary flex items-center gap-2">
          <span aria-hidden="true">💰</span> Betting Performance
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-skin-muted text-sm">Bets Placed</p>
            <p className="text-2xl font-bold text-skin-primary">{stats.total_bets_placed || 0}</p>
          </div>
          <div>
            <p className="text-skin-muted text-sm">Bets Made</p>
            <p className="text-2xl font-bold text-green-700">{stats.bets_made || 0}</p>
          </div>
          <div>
            <p className="text-skin-muted text-sm">Bets Failed</p>
            <p className="text-2xl font-bold text-red-700">{stats.bets_failed || 0}</p>
          </div>
          <div>
            <p className="text-skin-secondary text-sm">Success Rate</p>
            <p className="text-2xl font-bold text-skin-accent">{stats.bet_success_rate || 0}%</p>
          </div>
          <div>
            <p className="text-skin-muted text-sm">Avg Bet</p>
            <p className="text-2xl font-bold text-skin-primary">{stats.avg_bet_amount || 0}</p>
          </div>
          <div>
            <p className="text-skin-muted text-sm">Highest Bet</p>
            <p className="text-2xl font-bold text-skin-primary">{stats.highest_bet || 0}</p>
          </div>
          <div>
            <p className="text-skin-secondary text-sm">Without Trump</p>
            <p className="text-2xl font-bold text-skin-accent">{stats.without_trump_bets || 0}</p>
          </div>
        </div>
      </div>

      {/* Points Performance */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-6 border-2 border-emerald-200">
        <h3 className="text-xl font-bold mb-4 text-skin-primary flex items-center gap-2">
          <span aria-hidden="true">⭐</span> Points Performance
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-skin-muted text-sm">Total Points</p>
            <p className="text-2xl font-bold text-skin-primary">{stats.total_points_earned || 0}</p>
          </div>
          <div>
            <p className="text-skin-muted text-sm">Avg Per Round</p>
            <p className="text-2xl font-bold text-skin-primary">{stats.avg_points_per_round || 0}</p>
          </div>
          <div>
            <p className="text-skin-muted text-sm">Best Round</p>
            <p className="text-2xl font-bold text-green-700">
              {stats.highest_points_in_round || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Special Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-red-50 rounded-lg p-4 border-2 border-red-200">
          <p className="text-red-700 font-bold mb-2 flex items-center gap-2">
            <span aria-hidden="true">🔴</span> Red Zeros Collected
          </p>
          <p className="text-3xl font-bold text-red-900">{stats.red_zeros_collected || 0}</p>
          <p className="text-xs text-red-600 mt-1">+5 bonus points each</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-4 border-2 border-amber-200">
          <p className="text-amber-700 font-bold mb-2 flex items-center gap-2">
            <span aria-hidden="true">🟤</span> Brown Zeros Received
          </p>
          <p className="text-3xl font-bold text-amber-900">{stats.brown_zeros_received || 0}</p>
          <p className="text-xs text-amber-600 mt-1">-3 penalty points each</p>
        </div>
      </div>
    </div>
  );
}

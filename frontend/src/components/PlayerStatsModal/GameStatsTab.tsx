import { PlayerStats } from './types';

interface GameStatsTabProps {
  stats: PlayerStats;
}

export function GameStatsTab({ stats }: GameStatsTabProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Win/Loss Record */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-100 rounded-lg p-4 border-2 border-blue-300">
          <p className="text-blue-700 font-bold text-sm">Games Played</p>
          <p className="text-3xl font-bold text-blue-900">{stats.games_played}</p>
        </div>
        <div className="bg-green-100 rounded-lg p-4 border-2 border-green-300">
          <p className="text-green-700 font-bold text-sm">Games Won</p>
          <p className="text-3xl font-bold text-green-900">{stats.games_won}</p>
        </div>
        <div className="bg-red-100 rounded-lg p-4 border-2 border-red-300">
          <p className="text-red-700 font-bold text-sm">Games Lost</p>
          <p className="text-3xl font-bold text-red-900">{stats.games_lost}</p>
        </div>
        <div className="bg-team2-10 rounded-lg p-4 border-2 border-team2">
          <p className="text-team2 font-bold text-sm">Win Rate</p>
          <p className="text-3xl font-bold text-team2">{stats.win_percentage}%</p>
        </div>
      </div>

      {/* Streaks */}
      <div className="bg-skin-tertiary rounded-lg p-6 border-2 border-skin-default">
        <h3 className="text-xl font-bold mb-4 text-skin-primary flex items-center gap-2">
          <span aria-hidden="true">🔥</span> Streaks
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-skin-muted text-sm">Current Win</p>
            <p className="text-2xl font-bold text-green-700">{stats.current_win_streak || 0}</p>
          </div>
          <div>
            <p className="text-skin-muted text-sm">Best Win</p>
            <p className="text-2xl font-bold text-green-700">{stats.best_win_streak || 0}</p>
          </div>
          <div>
            <p className="text-skin-muted text-sm">Current Loss</p>
            <p className="text-2xl font-bold text-red-700">{stats.current_loss_streak || 0}</p>
          </div>
          <div>
            <p className="text-skin-muted text-sm">Worst Loss</p>
            <p className="text-2xl font-bold text-red-700">{stats.worst_loss_streak || 0}</p>
          </div>
        </div>
      </div>

      {/* Game Records */}
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-6 border-2 border-cyan-200">
        <h3 className="text-xl font-bold mb-4 text-skin-primary flex items-center gap-2">
          <span aria-hidden="true">📈</span> Game Records
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-skin-muted text-sm">Fastest Win</p>
            <p className="text-2xl font-bold text-skin-primary">
              {stats.fastest_win || 'N/A'} {stats.fastest_win && 'rounds'}
            </p>
          </div>
          <div>
            <p className="text-skin-muted text-sm">Longest Game</p>
            <p className="text-2xl font-bold text-skin-primary">{stats.longest_game || 0} rounds</p>
          </div>
          <div>
            <p className="text-skin-muted text-sm">Avg Duration</p>
            <p className="text-2xl font-bold text-skin-primary">
              {stats.avg_game_duration_minutes || 0} min
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

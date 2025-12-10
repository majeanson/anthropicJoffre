/**
 * QuickStatsGrid - Games played, won, and win rate
 */

import { UICard } from '../ui/UICard';
import type { QuickStatsGridProps } from './types';

export function QuickStatsGrid({ stats }: QuickStatsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <UICard variant="bordered" size="sm">
        <div className="text-2xl font-bold text-yellow-400">{stats.games_played}</div>
        <div className="text-sm text-skin-muted">Games Played</div>
      </UICard>
      <UICard variant="bordered" size="sm">
        <div className="text-2xl font-bold text-green-400">{stats.games_won}</div>
        <div className="text-sm text-skin-muted">Games Won</div>
      </UICard>
      <UICard variant="bordered" size="sm" className="col-span-2">
        <div className="text-2xl font-bold text-blue-400">
          {stats.win_percentage.toFixed(1)}%
        </div>
        <div className="text-sm text-skin-muted">Win Rate</div>
      </UICard>
    </div>
  );
}

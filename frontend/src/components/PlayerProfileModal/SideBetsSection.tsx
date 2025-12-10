/**
 * SideBetsSection - Coins and side bet statistics
 */

import { UICard } from '../ui/UICard';
import type { SideBetsSectionProps } from './types';

export function SideBetsSection({ stats }: SideBetsSectionProps) {
  const hasBets = (stats.side_bets_won ?? 0) > 0 || (stats.side_bets_lost ?? 0) > 0;

  return (
    <UICard variant="bordered" size="md">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-yellow-400">
          <span aria-hidden="true">🪙</span> Coins & Side Bets
        </h4>
        <span className="text-lg font-bold text-yellow-400">
          {stats.cosmetic_currency ?? 100} coins
        </span>
      </div>

      {hasBets ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 bg-green-500/10 rounded-lg border border-green-500/20">
            <div className="text-lg font-bold text-green-400">{stats.side_bets_won ?? 0}</div>
            <div className="text-xs text-skin-muted">Bets Won</div>
          </div>
          <div className="text-center p-2 bg-red-500/10 rounded-lg border border-red-500/20">
            <div className="text-lg font-bold text-red-400">{stats.side_bets_lost ?? 0}</div>
            <div className="text-xs text-skin-muted">Bets Lost</div>
          </div>
          <div className="text-center p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <div className="text-lg font-bold text-yellow-400">
              +{stats.side_bets_coins_won ?? 0}
            </div>
            <div className="text-xs text-skin-muted">Coins Won</div>
          </div>
          <div className="text-center p-2 bg-team1-10 rounded-lg border border-team1">
            <div className="text-lg font-bold text-team1">
              -{stats.side_bets_coins_lost ?? 0}
            </div>
            <div className="text-xs text-skin-muted">Coins Lost</div>
          </div>
          {(stats.best_bet_streak ?? 0) > 0 && (
            <div className="col-span-2 text-center p-2 bg-team2-10 rounded-lg border border-team2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg font-bold text-team2">
                  🔥 {stats.current_bet_streak ?? 0}
                </span>
                <span className="text-xs text-skin-muted">current</span>
                <span className="text-skin-muted">|</span>
                <span className="text-lg font-bold text-team2">
                  {stats.best_bet_streak ?? 0}
                </span>
                <span className="text-xs text-skin-muted">best streak</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-skin-muted italic text-center py-2">
          No side bets placed yet
        </p>
      )}
    </UICard>
  );
}

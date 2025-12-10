/**
 * XPDisplay - XP and Level progress bar
 */

import { UICard } from '../ui/UICard';
import {
  getLevelProgress,
  getLevelTitle,
  getLevelColor,
  getLevelGradient,
  formatXp,
} from '../../utils/xpSystem';
import type { XPDisplayProps } from './types';

export function XPDisplay({ totalXp }: XPDisplayProps) {
  const progress = getLevelProgress(totalXp);
  const levelTitle = getLevelTitle(progress.level);
  const levelColor = getLevelColor(progress.level);
  const levelGradient = getLevelGradient(progress.level);

  return (
    <UICard variant="bordered" size="sm">
      <div className="flex items-center gap-3 mb-2">
        {/* Level Badge */}
        <div
          className={`
            w-12 h-12 rounded-lg flex items-center justify-center
            bg-gradient-to-br ${levelGradient}
            shadow-lg
          `}
        >
          <span className="text-white font-bold text-lg">{progress.level}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className={`font-bold ${levelColor}`}>{levelTitle}</span>
            <span className="text-xs text-skin-muted">{formatXp(totalXp)} XP</span>
          </div>
          {/* XP Progress Bar */}
          <div className="mt-1">
            <div className="h-2 bg-skin-tertiary rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${levelGradient} transition-all duration-500`}
                style={{ width: `${progress.progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-skin-muted mt-0.5">
              <span>Level {progress.level}</span>
              <span>{formatXp(progress.xpToNextLevel)} XP to next</span>
            </div>
          </div>
        </div>
      </div>
    </UICard>
  );
}

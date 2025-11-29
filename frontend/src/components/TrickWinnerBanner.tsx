/**
 * TrickWinnerBanner Component
 * Sprint 1 Phase 3: Trick Winner Celebrations
 *
 * Winner announcement banner for trick victories
 * Always centered at bottom for consistency and less visual distraction
 */

import { useSettings } from '../contexts/SettingsContext';
import { UICard } from './ui/UICard';

type PlayerPosition = 'bottom' | 'left' | 'top' | 'right';

interface TrickWinnerBannerProps {
  playerName: string;
  points: number;
  teamColor: 'orange' | 'purple';
  position?: PlayerPosition; // Kept for backwards compatibility but not used
}

export function TrickWinnerBanner({ playerName, points, teamColor }: TrickWinnerBannerProps) {
  const { animationsEnabled } = useSettings();

  // Don't show if animations are disabled
  if (!animationsEnabled) return null;

  const gradientType = teamColor === 'orange' ? 'team1' : 'team2';

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none motion-safe:animate-fadeIn motion-reduce:opacity-90 max-w-[90vw] px-2">
      <UICard variant="bordered" size="sm" gradient={gradientType} className="border-2 border-yellow-400 opacity-90 text-white">
        <div className="flex items-center gap-2">
          <span className="text-xl md:text-2xl" aria-hidden="true">👑</span>
          <div className="text-sm md:text-base">
            <span className="font-bold">{playerName}</span>
            <span className="font-normal ml-1">won +{points} pts</span>
          </div>
        </div>
      </UICard>
    </div>
  );
}

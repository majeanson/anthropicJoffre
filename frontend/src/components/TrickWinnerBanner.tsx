/**
 * TrickWinnerBanner Component
 * Sprint 1 Phase 3: Trick Winner Celebrations
 *
 * Winner announcement banner for trick victories
 * Always centered at bottom for consistency and less visual distraction
 */

import { useSettings } from '../contexts/SettingsContext';

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

  const bgColor = teamColor === 'orange' ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'bg-gradient-to-r from-purple-500 to-violet-500';
  const textColor = 'text-white';

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none motion-safe:animate-fadeIn motion-reduce:opacity-90 max-w-[90vw] px-2">
      <div className={`${bgColor} ${textColor} px-3 md:px-4 py-1.5 md:py-2 rounded-lg shadow-lg border-2 border-yellow-400 opacity-90`}>
        <div className="flex items-center gap-2">
          <span className="text-xl md:text-2xl">👑</span>
          <div className="text-sm md:text-base">
            <span className="font-bold">{playerName}</span>
            <span className="font-normal ml-1">won +{points} pts</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * TrickWinnerBanner Component
 * Sprint 1 Phase 3: Trick Winner Celebrations
 *
 * Winner announcement banner for trick victories
 */

import { useSettings } from '../contexts/SettingsContext';

interface TrickWinnerBannerProps {
  playerName: string;
  points: number;
  teamColor: 'orange' | 'purple';
}

export function TrickWinnerBanner({ playerName, points, teamColor }: TrickWinnerBannerProps) {
  const { animationsEnabled } = useSettings();

  // Don't show if animations are disabled
  if (!animationsEnabled) return null;

  const bgColor = teamColor === 'orange' ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'bg-gradient-to-r from-purple-500 to-violet-500';
  const textColor = 'text-white';

  return (
    <div className="fixed top-[30%] left-1/2 -translate-x-1/2 z-[9999] pointer-events-none motion-safe:animate-fadeInDown motion-reduce:opacity-100 max-w-[90vw] px-2">
      <div className={`${bgColor} ${textColor} px-4 md:px-6 py-2 md:py-3 rounded-xl shadow-2xl border-4 border-yellow-400 motion-safe:animate-crown-bounce`}>
        <div className="flex items-center gap-2 md:gap-3">
          <span className="text-3xl md:text-4xl motion-safe:animate-trophy-rotate">👑</span>
          <div>
            <div className="text-xl md:text-2xl font-black drop-shadow-lg truncate max-w-[40vw]">{playerName}</div>
            <div className="text-base md:text-lg font-semibold">won the trick! +{points} points</div>
          </div>
          <span className="text-3xl md:text-4xl motion-safe:animate-trophy-rotate" style={{ animationDelay: '0.2s' }}>🏆</span>
        </div>
      </div>
    </div>
  );
}

/**
 * TrickWinnerBanner Component
 * Sprint 1 Phase 3: Trick Winner Celebrations
 *
 * Winner announcement banner for trick victories
 */

interface TrickWinnerBannerProps {
  playerName: string;
  points: number;
  teamColor: 'orange' | 'purple';
}

export function TrickWinnerBanner({ playerName, points, teamColor }: TrickWinnerBannerProps) {
  const bgColor = teamColor === 'orange' ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'bg-gradient-to-r from-purple-500 to-violet-500';
  const textColor = 'text-white';

  return (
    <div className="fixed top-1/4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none motion-safe:animate-fadeInDown motion-reduce:opacity-100">
      <div className={`${bgColor} ${textColor} px-8 py-4 rounded-2xl shadow-2xl border-4 border-yellow-400 motion-safe:animate-crown-bounce`}>
        <div className="flex items-center gap-4">
          <span className="text-5xl motion-safe:animate-trophy-rotate">👑</span>
          <div>
            <div className="text-3xl font-black drop-shadow-lg">{playerName}</div>
            <div className="text-xl font-semibold">won the trick! +{points} points</div>
          </div>
          <span className="text-5xl motion-safe:animate-trophy-rotate" style={{ animationDelay: '0.2s' }}>🏆</span>
        </div>
      </div>
    </div>
  );
}

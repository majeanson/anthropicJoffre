interface TimeoutBannerProps {
  playerName: string;
  secondsRemaining: number;
  isCurrentPlayer: boolean;
}

export function TimeoutBanner({
  playerName,
  secondsRemaining,
  isCurrentPlayer
}: TimeoutBannerProps) {
  if (secondsRemaining === 0 || secondsRemaining > 60) {
    return null;
  }

  const isWarning = secondsRemaining <= 15;
  const isCritical = secondsRemaining <= 5;

  return (
    <div
      className={`
        fixed top-4 left-1/2 -translate-x-1/2 z-50
        px-6 py-3 rounded-lg shadow-2xl backdrop-blur-md
        border-2 transition-colors duration-500
        ${isCritical
          ? 'bg-red-600/90 border-red-400'
          : isWarning
            ? 'bg-orange-600/90 border-orange-400'
            : 'bg-blue-600/90 border-blue-400'
        }
      `}
    >
      <div className="flex items-center gap-3 text-white">
        {/* Timer Icon */}
        <div className="text-2xl">
          ⏱️
        </div>

        {/* Countdown */}
        <div className="flex flex-col">
          <div className="text-xs font-semibold opacity-90">
            {isCurrentPlayer ? 'Your Turn' : `${playerName}'s Turn`}
          </div>
          <div className="text-2xl font-black leading-none flex items-baseline gap-2">
            <span>{secondsRemaining}</span>
            <span className="text-sm font-normal opacity-75">seconds left</span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="h-12 w-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className={`w-full transition-all duration-1000 ease-linear ${
              isCritical ? 'bg-red-200' : isWarning ? 'bg-orange-200' : 'bg-blue-200'
            }`}
            style={{
              height: `${(secondsRemaining / 60) * 100}%`,
              transformOrigin: 'bottom'
            }}
          />
        </div>
      </div>

      {/* Warning Message */}
      {isWarning && (
        <div className="mt-2 text-center text-xs font-semibold text-white/90">
          {isCritical
            ? '⚡ Action will be taken automatically!'
            : '⚠️ Running out of time...'}
        </div>
      )}
    </div>
  );
}

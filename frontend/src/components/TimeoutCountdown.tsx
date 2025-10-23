interface TimeoutCountdownProps {
  playerName: string;
  secondsRemaining: number;
  isYourTurn: boolean;
}

export function TimeoutCountdown({ playerName, secondsRemaining, isYourTurn }: TimeoutCountdownProps) {
  if (secondsRemaining === 0 || secondsRemaining > 60) {
    return null;
  }

  const isWarning = secondsRemaining <= 15;
  const isCritical = secondsRemaining <= 5;

  // Color based on time remaining (smooth transitions, no animations)
  const bgColor = isCritical
    ? 'bg-red-600'
    : isWarning
    ? 'bg-yellow-600'
    : 'bg-blue-600';

  return (
    <div
      className={`fixed top-20 left-1/2 transform -translate-x-1/2 ${bgColor} text-white px-6 py-3 rounded-lg shadow-2xl z-40 transition-colors duration-500`}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-bold">
            {isYourTurn ? 'Your turn' : playerName}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-2xl font-black">{secondsRemaining}</span>
          <span className="text-sm">sec</span>
        </div>
      </div>
      {isYourTurn && secondsRemaining <= 15 && (
        <div className="text-xs text-center mt-1 opacity-90">
          {secondsRemaining === 0
            ? 'Auto-playing...'
            : 'Hurry! Auto-play will activate soon'}
        </div>
      )}
    </div>
  );
}

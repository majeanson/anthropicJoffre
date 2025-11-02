interface ReconnectingBannerProps {
  attempt: number;
  maxAttempts: number;
}

export function ReconnectingBanner({ attempt, maxAttempts }: ReconnectingBannerProps) {
  const progress = (attempt / maxAttempts) * 100;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slideDown">
      <div className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-2xl backdrop-blur-sm min-w-[300px]">
        <div className="flex items-center gap-3 mb-2">
          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
          <span className="font-bold">Reconnecting to game...</span>
        </div>

        {/* Attempt counter */}
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-white/80">Attempt {attempt} of {maxAttempts}</span>
          <span className="text-white/80">{Math.round(progress)}%</span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-blue-800/50 rounded-full h-2 overflow-hidden">
          <div
            className="bg-white h-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

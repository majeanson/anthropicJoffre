/**
 * AutoplayCountdown Component
 *
 * Visual indicator showing when autoplay is about to take an action.
 * Displays a countdown with a pulsing animation.
 */

interface AutoplayCountdownProps {
  /** Seconds remaining before autoplay takes action */
  countdownSeconds: number;
  /** Whether autoplay is currently counting down */
  isCountingDown: boolean;
}

export function AutoplayCountdown({ countdownSeconds, isCountingDown }: AutoplayCountdownProps) {
  if (!isCountingDown || countdownSeconds <= 0) {
    return null;
  }

  return (
    <div
      className="
        fixed bottom-24 left-1/2 -translate-x-1/2 z-40
        flex items-center gap-2
        px-4 py-2
        rounded-full
        bg-skin-primary/95
        border-2 border-skin-accent
        shadow-lg backdrop-blur-sm
        animate-pulse
      "
      style={{
        boxShadow: '0 0 20px var(--color-glow)',
      }}
    >
      {/* Robot icon */}
      <span className="text-xl" aria-hidden="true">
        🤖
      </span>

      {/* Countdown text */}
      <div className="flex items-baseline gap-1">
        <span className="text-sm font-medium text-skin-secondary">Autoplay in</span>
        <span className="text-xl font-bold font-display text-skin-accent">{countdownSeconds}</span>
        <span className="text-sm font-medium text-skin-secondary">s</span>
      </div>

      {/* Progress indicator - circular */}
      <div className="relative w-6 h-6">
        <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
          {/* Background circle */}
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke="var(--color-border-default)"
            strokeWidth="2"
          />
          {/* Progress circle - animate based on countdown */}
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke="var(--color-text-accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 10}`}
            strokeDashoffset={`${2 * Math.PI * 10 * (1 - countdownSeconds / 3)}`}
            className="transition-all duration-100"
          />
        </svg>
      </div>
    </div>
  );
}

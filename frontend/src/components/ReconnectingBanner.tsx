import { memo } from 'react';
import { UICard, Spinner, ProgressBar } from './ui';

interface ReconnectingBannerProps {
  attempt: number;
  maxAttempts: number;
}

export const ReconnectingBanner = memo(function ReconnectingBanner({ attempt, maxAttempts }: ReconnectingBannerProps) {
  const isFirstAttempt = attempt <= 2;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slideDown">
      <UICard variant="elevated" size="sm" gradient="info" className="min-w-[300px] text-white">
        <div className="flex items-center gap-3 mb-2">
          <Spinner size="sm" color="white" />
          <span className="font-bold">Reconnecting to game...</span>
        </div>

        {/* Helpful hint for cold start */}
        {isFirstAttempt && (
          <p className="text-xs text-blue-100 mb-2">
            Server may be waking up (cold start). This can take 10-30 seconds...
          </p>
        )}

        {/* Progress bar with attempt counter */}
        <ProgressBar
          value={attempt}
          max={maxAttempts}
          label={`Attempt ${attempt} of ${maxAttempts}`}
          showValue
          size="sm"
          color="info"
          className="[&_*]:text-white/80 [&>div:first-child]:text-white/80 [&>div:last-child]:bg-blue-800/50 [&>div:last-child>div]:bg-white"
        />
      </UICard>
    </div>
  );
});

import { useEffect, useState } from 'react';

interface TimeoutIndicatorProps {
  duration: number; // Duration in milliseconds
  isActive: boolean; // Whether the timer is currently counting down
  onTimeout?: () => void; // Optional callback when timer reaches 0
}

export function TimeoutIndicator({ duration, isActive, onTimeout }: TimeoutIndicatorProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Reset timer when isActive changes or duration changes
  useEffect(() => {
    if (isActive) {
      setTimeRemaining(duration);
      setStartTime(Date.now());
    } else {
      setStartTime(null);
    }
  }, [isActive, duration]);

  // Countdown logic
  useEffect(() => {
    if (!isActive || startTime === null) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        onTimeout?.();
        clearInterval(interval);
      }
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(interval);
  }, [isActive, startTime, duration, onTimeout]);

  if (!isActive) return null;

  const seconds = Math.ceil(timeRemaining / 1000);
  const percentage = (timeRemaining / duration) * 100;

  // Color based on urgency
  const getColor = () => {
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTextColor = () => {
    if (percentage > 50) return 'text-green-700';
    if (percentage > 25) return 'text-yellow-700';
    return 'text-red-700';
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
      <div className="flex flex-col items-center gap-1">
        <span className={`text-2xl font-bold ${getTextColor()}`}>{seconds}s</span>
        <span className="text-xs text-gray-300">remaining</span>
      </div>
      <div className="flex-1">
        <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-100 ${getColor()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

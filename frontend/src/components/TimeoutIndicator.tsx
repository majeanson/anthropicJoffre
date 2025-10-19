import { useEffect, useState } from 'react';

interface TimeoutIndicatorProps {
  duration: number; // Duration in milliseconds
  isActive: boolean; // Whether the timer is currently counting down
  resetKey?: string | number; // Key to trigger timer reset (e.g., playerId or turnIndex)
  onTimeout?: () => void; // Optional callback when timer reaches 0
}

export function TimeoutIndicator({ duration, isActive, resetKey, onTimeout }: TimeoutIndicatorProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Reset timer when isActive changes, duration changes, or resetKey changes
  useEffect(() => {
    if (isActive) {
      setTimeRemaining(duration);
      setStartTime(Date.now());
    } else {
      setStartTime(null);
    }
  }, [isActive, duration, resetKey]);

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

  // Color based on urgency (for badge)
  const getBadgeColor = () => {
    if (percentage > 50) return 'bg-green-500 text-white';
    if (percentage > 25) return 'bg-yellow-500 text-white';
    return 'bg-red-500 text-white';
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-bold ${getBadgeColor()}`}>
      ⏱️ {seconds}s
    </span>
  );
}

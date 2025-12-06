import { useEffect, useState, useRef } from 'react';
import { UIBadge } from './ui/UIBadge';

interface TimeoutIndicatorProps {
  duration: number; // Duration in milliseconds
  isActive: boolean; // Whether the timer is currently counting down
  resetKey?: string | number; // Key to trigger timer reset (e.g., playerId or turnIndex)
  onTimeout?: () => void; // Optional callback when timer reaches 0
}

export function TimeoutIndicator({
  duration,
  isActive,
  resetKey,
  onTimeout,
}: TimeoutIndicatorProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [hasShown, setHasShown] = useState(false);
  const timeoutCalledRef = useRef(false);

  // Reset timer when resetKey changes (new turn/player)
  useEffect(() => {
    if (isActive) {
      setTimeRemaining(duration);
      setStartTime(Date.now());
      setHasShown(true);
      timeoutCalledRef.current = false;
    } else {
      setStartTime(null);
    }
  }, [resetKey, isActive, duration]);

  // Countdown logic
  useEffect(() => {
    if (!isActive || startTime === null) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      setTimeRemaining(remaining);

      if (remaining === 0 && !timeoutCalledRef.current) {
        timeoutCalledRef.current = true;
        onTimeout?.();
        clearInterval(interval);
      }
    }, 1000); // Update every second (no need for 100ms)

    return () => clearInterval(interval);
  }, [isActive, startTime, duration, onTimeout]);

  // Don't show if never activated
  if (!hasShown || !isActive) return null;

  const seconds = Math.ceil(timeRemaining / 1000);
  const percentage = (timeRemaining / duration) * 100;

  // Color based on urgency (smooth transitions, no flashing)
  const getBadgeColor = (): 'success' | 'warning' | 'error' => {
    if (percentage > 50) return 'success';
    if (percentage > 25) return 'warning';
    return 'error';
  };

  return (
    <UIBadge
      variant="solid"
      color={getBadgeColor()}
      size="sm"
      className="transition-colors duration-500"
    >
      ⏱️ {seconds}s
    </UIBadge>
  );
}

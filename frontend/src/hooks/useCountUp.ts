/**
 * useCountUp Hook
 * Sprint 1 Phase 4: Score Change Animations
 *
 * Animates a number counting up/down with easing
 */

import { useState, useEffect, useRef } from 'react';

export function useCountUp(
  targetValue: number,
  duration: number = 500,
  enabled: boolean = true
): number {
  const [displayValue, setDisplayValue] = useState(targetValue);
  const animationRef = useRef<number | null>(null);
  const startValueRef = useRef(targetValue);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setDisplayValue(targetValue);
      return;
    }

    // If value hasn't changed, don't animate
    if (startValueRef.current === targetValue) {
      return;
    }

    // Cancel any ongoing animation
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }

    const startValue = displayValue;
    startValueRef.current = startValue;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out quad function for smooth deceleration
      const easeProgress = 1 - (1 - progress) * (1 - progress);

      const currentValue = startValue + (targetValue - startValue) * easeProgress;
      setDisplayValue(Math.round(currentValue));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
        startValueRef.current = targetValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration, enabled, displayValue]);

  return displayValue;
}

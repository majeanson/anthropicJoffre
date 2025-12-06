/**
 * Haptic Feedback Utility
 *
 * Provides tactile feedback on supported mobile devices.
 * Uses the Vibration API (navigator.vibrate).
 *
 * Note: Vibration API requires user interaction context on iOS Safari
 * and may not work on all devices/browsers.
 */

/**
 * Check if haptic feedback is supported
 */
export function isHapticsSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

/**
 * Light tap feedback - for card selection, button clicks
 * Duration: 10ms
 */
export function hapticTap(): void {
  if (isHapticsSupported()) {
    try {
      navigator.vibrate(10);
    } catch {
      // Silently fail if vibration not allowed
    }
  }
}

/**
 * Medium feedback - for card play confirmation
 * Duration: 25ms
 */
export function hapticPlay(): void {
  if (isHapticsSupported()) {
    try {
      navigator.vibrate(25);
    } catch {
      // Silently fail
    }
  }
}

/**
 * Success feedback - for winning a trick, achieving something
 * Pattern: short-pause-short (celebration feel)
 * Duration: 50ms-25ms-50ms
 */
export function hapticSuccess(): void {
  if (isHapticsSupported()) {
    try {
      navigator.vibrate([50, 25, 50]);
    } catch {
      // Silently fail
    }
  }
}

/**
 * Error/warning feedback - for invalid moves, warnings
 * Pattern: two short bursts
 * Duration: 30ms-50ms-30ms
 */
export function hapticError(): void {
  if (isHapticsSupported()) {
    try {
      navigator.vibrate([30, 50, 30]);
    } catch {
      // Silently fail
    }
  }
}

/**
 * Game win celebration - for winning the game
 * Pattern: ascending intensity
 * Duration: 100ms-50ms-100ms-50ms-150ms
 */
export function hapticWin(): void {
  if (isHapticsSupported()) {
    try {
      navigator.vibrate([100, 50, 100, 50, 150]);
    } catch {
      // Silently fail
    }
  }
}

/**
 * Cancel any ongoing vibration
 */
export function hapticCancel(): void {
  if (isHapticsSupported()) {
    try {
      navigator.vibrate(0);
    } catch {
      // Silently fail
    }
  }
}

/**
 * Haptic feedback manager object for easier imports
 */
export const haptics = {
  isSupported: isHapticsSupported,
  tap: hapticTap,
  play: hapticPlay,
  success: hapticSuccess,
  error: hapticError,
  win: hapticWin,
  cancel: hapticCancel,
};

export default haptics;

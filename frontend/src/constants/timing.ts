/**
 * Centralized timing constants for UI animations and timeouts
 *
 * Using named constants improves:
 * - Maintainability (single place to update)
 * - Readability (self-documenting code)
 * - Consistency (same timings across components)
 */

// Animation durations (ms)
export const ANIMATION = {
  /** Quick transition for instant feedback */
  INSTANT: 100,
  /** Fast animations like button clicks */
  FAST: 200,
  /** Standard animation duration */
  DEFAULT: 300,
  /** Moderate animations like modal transitions */
  MODERATE: 500,
  /** Slower animations for emphasis */
  SLOW: 800,
} as const;

// Toast/notification display durations (ms)
export const NOTIFICATION = {
  /** Short notifications (copy confirmations) */
  SHORT: 2000,
  /** Standard notification duration */
  DEFAULT: 3000,
  /** Long notifications (important info) */
  LONG: 5000,
  /** Achievement popup duration */
  ACHIEVEMENT: 5000,
} as const;

// UI feedback durations (ms)
export const FEEDBACK = {
  /** Flash effects (score changes) */
  FLASH: 500,
  /** Score change display */
  SCORE_CHANGE: 1500,
  /** Selection highlight flash */
  SELECT_FLASH: 600,
  /** Copy to clipboard confirmation */
  COPY_CONFIRM: 2000,
  /** Trick collection animation */
  TRICK_COLLECTION: 2000,
  /** Trick winner display */
  TRICK_WINNER: 2000,
} as const;

// Focus and input delays (ms)
export const INPUT = {
  /** Delay before focusing input elements */
  FOCUS_DELAY: 100,
  /** Delay for message sending (debounce) */
  MESSAGE_DELAY: 100,
} as const;

// Game timing (ms)
export const GAME = {
  /** Your turn reminder sound delay */
  TURN_REMINDER: 10000,
  /** Card dealing animation stagger */
  DEAL_CARD_STAGGER: 300,
  /** Card play effect duration */
  PLAY_EFFECT: 800,
} as const;

// Network/retry timing (ms)
export const NETWORK = {
  /** API request timeout */
  REQUEST_TIMEOUT: 5000,
  /** Base retry delay (multiplied by attempt) */
  RETRY_BASE: 1000,
  /** Image preload delay */
  PRELOAD_DELAY: 1000,
} as const;

// Modal content timing (ms)
export const MODAL = {
  /** Delay before showing modal content */
  CONTENT_DELAY: 300,
  /** Delay before showing additional content */
  EXTRA_CONTENT_DELAY: 800,
  /** Clear message display duration */
  CLEAR_MESSAGE: 3000,
} as const;

/**
 * Z-Index Scale Configuration
 *
 * Centralized z-index values to prevent stacking context issues.
 * All components should use these constants instead of arbitrary values.
 *
 * IMPORTANT: Game elements use values up to z-[9999] for effects like:
 * - Card transitions and animations
 * - Score floating animations
 * - Queued card highlighting
 *
 * Modals and overlays MUST use values >= 10000 to appear above game content.
 *
 * Usage:
 * ```tsx
 * import { zIndex } from '@/config/zIndex';
 *
 * <div style={{ zIndex: zIndex.modal }}>...</div>
 * ```
 */

export const zIndex = {
  /** Base layer - normal document flow */
  base: 0,

  /** Game board elements - cards, players */
  gameBoard: 10,

  /** Player hand container */
  playerHand: 45,

  /** Dropdown menus, select options */
  dropdown: 100,

  /** Sticky headers, fixed navigation */
  sticky: 200,

  /** Floating action buttons, chat bubbles */
  floating: 300,

  /** Tooltips, popovers (in-game) */
  tooltip: 400,

  /** Game effects - card animations, score floats */
  gameEffects: 9999,

  /** Modals - main layer (ABOVE all game content) */
  modal: 10000,

  /** Nested modals (stack level 1) */
  modalNested1: 10100,

  /** Nested modals (stack level 2) */
  modalNested2: 10200,

  /** Toast notifications */
  toast: 10300,

  /** Loading overlays, blocking UI */
  overlay: 10400,

  /** Suggestion/thinking tooltips (appear over modals too) */
  suggestionTooltip: 10500,

  /** Absolute maximum - emergency overrides only */
  max: 10999,
} as const;

/**
 * Get z-index for modal with stacking support
 * @param stackLevel - 0 for base modal, 1+ for nested modals
 */
export function getModalZIndex(stackLevel: number = 0): number {
  return zIndex.modal + stackLevel * 100;
}

/**
 * CSS custom properties reference for Tailwind classes:
 *
 * Game elements:
 * - z-[10]     - game board
 * - z-[11]     - player hand
 * - z-[9999]   - game effects (card animations, score floats)
 *
 * UI overlays (must be >= 10000):
 * - z-[10000]  - modals (base)
 * - z-[10100]  - nested modal 1
 * - z-[10200]  - nested modal 2
 * - z-[10300]  - toasts
 * - z-[10400]  - loading overlays
 * - z-[10500]  - suggestion tooltips
 */

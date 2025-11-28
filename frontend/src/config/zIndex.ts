/**
 * Z-Index Scale Configuration
 *
 * Centralized z-index values to prevent stacking context issues.
 * All components should use these constants instead of arbitrary values.
 *
 * Usage:
 * ```tsx
 * import { zIndex } from '@/config/zIndex';
 *
 * <div style={{ zIndex: zIndex.modal }}>...</div>
 * <div className="z-[var(--z-modal)]">...</div>
 * ```
 */

export const zIndex = {
  /** Base layer - normal document flow */
  base: 0,

  /** Dropdown menus, select options */
  dropdown: 10,

  /** Sticky headers, fixed navigation */
  sticky: 20,

  /** Floating action buttons, chat bubbles */
  floating: 30,

  /** Tooltips, popovers */
  tooltip: 40,

  /** Modals - main layer */
  modal: 50,

  /** Nested modals (stack level 1) */
  modalNested1: 60,

  /** Nested modals (stack level 2) */
  modalNested2: 70,

  /** Toast notifications */
  toast: 80,

  /** Loading overlays, blocking UI */
  overlay: 90,

  /** Absolute maximum - emergency overrides only */
  max: 100,
} as const;

/**
 * Get z-index for modal with stacking support
 * @param stackLevel - 0 for base modal, 1+ for nested modals
 */
export function getModalZIndex(stackLevel: number = 0): number {
  return zIndex.modal + (stackLevel * 10);
}

/**
 * CSS custom properties for Tailwind
 * Add these to your tailwind.config.js theme.extend:
 *
 * ```js
 * extend: {
 *   zIndex: {
 *     dropdown: '10',
 *     sticky: '20',
 *     floating: '30',
 *     tooltip: '40',
 *     modal: '50',
 *     toast: '80',
 *     overlay: '90',
 *     max: '100',
 *   }
 * }
 * ```
 */

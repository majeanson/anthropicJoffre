/**
 * Card Style Constants
 * Shared style configurations for card components
 */

import { CardColor } from '../../types/game';

// Suit-specific CSS class mappings
export const suitClasses: Record<
  CardColor,
  {
    border: string;
    innerGlow: string;
    badge: string;
    borderStyle: string;
  }
> = {
  red: {
    border: 'border-suit-red',
    innerGlow: 'card-inner-glow-red',
    badge: 'card-badge-red',
    borderStyle: 'border-solid',
  },
  brown: {
    border: 'border-suit-brown',
    innerGlow: 'card-inner-glow-brown',
    badge: 'card-badge-brown',
    borderStyle: 'border-double',
  },
  green: {
    border: 'border-suit-green',
    innerGlow: 'card-inner-glow-green',
    badge: 'card-badge-green',
    borderStyle: 'border-solid',
  },
  blue: {
    border: 'border-suit-blue',
    innerGlow: 'card-inner-glow-blue',
    badge: 'card-badge-blue',
    borderStyle: 'border-solid',
  },
};

// Size configurations - all Tailwind classes, no inline styles
// Note: Badge text minimum 10px on mobile for readability (WCAG)
export const sizeStyles = {
  tiny: {
    container: 'w-[2.75rem] h-[4rem] sm:w-12 sm:h-20 border-2',
    text: 'text-base',
    cornerText: 'text-sm font-black',
    emblem: 'w-6 h-6 sm:w-6 sm:h-6',
    badge: 'text-[10px] sm:text-[10px] px-1 py-0.5',
    badgeSize: 'min-w-[18px] h-[18px]',
    cornerOffset: 'top-0.5 left-0.5',
    cornerOffsetBottom: 'bottom-0.5 right-0.5',
  },
  small: {
    container: 'w-[3.25rem] h-[5rem] sm:w-16 sm:h-24 md:w-16 md:h-28 border-2',
    text: 'text-base sm:text-lg',
    cornerText: 'text-sm sm:text-base font-black',
    emblem: 'w-8 h-8 sm:w-10 sm:h-10 md:w-10 md:h-10',
    badge: 'text-[10px] sm:text-xs px-1 py-0.5',
    badgeSize: 'min-w-[22px] h-[22px]',
    cornerOffset: 'top-0.5 left-1 sm:top-1 sm:left-1.5',
    cornerOffsetBottom: 'bottom-0.5 right-1 sm:bottom-1 sm:right-1.5',
  },
  medium: {
    container: 'w-[4rem] h-[6rem] sm:w-20 sm:h-32 md:w-20 md:h-32 border-2',
    text: 'text-lg sm:text-2xl',
    cornerText: 'text-base sm:text-lg font-black',
    emblem: 'w-10 h-10 sm:w-12 sm:h-12 md:w-12 md:h-12',
    badge: 'text-[11px] sm:text-xs px-1 sm:px-1.5 py-0.5',
    badgeSize: 'min-w-[26px] h-[26px]',
    cornerOffset: 'top-0.5 left-1 sm:top-1 sm:left-1.5',
    cornerOffsetBottom: 'bottom-0.5 right-1 sm:bottom-1 sm:right-1.5',
  },
  large: {
    container: 'w-[5rem] h-[7.5rem] sm:w-24 sm:h-36 md:w-24 md:h-36 border-[3px]',
    text: 'text-xl sm:text-3xl',
    cornerText: 'text-lg sm:text-xl font-black',
    emblem: 'w-12 h-12 sm:w-16 sm:h-16 md:w-16 md:h-16',
    badge: 'text-xs sm:text-sm px-1.5 sm:px-2 py-0.5',
    badgeSize: 'min-w-[26px] h-[26px]',
    cornerOffset: 'top-1 left-1.5 sm:top-1.5 sm:left-2',
    cornerOffsetBottom: 'bottom-1 right-1.5 sm:bottom-1.5 sm:right-2',
  },
};

export type CardSize = keyof typeof sizeStyles;

/**
 * Design System - Main Export
 * Sprint 21: Centralized design token system
 *
 * Usage:
 * import { colors, typography, spacing, shadows, breakpoints } from '@/design-system';
 * import * as designSystem from '@/design-system';
 */

export * from './colors';
export * from './typography';
export * from './spacing';
export * from './shadows';
export * from './breakpoints';

// Re-export for convenience
import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { shadows } from './shadows';
import { breakpoints } from './breakpoints';

export const designSystem = {
  colors,
  typography,
  spacing,
  shadows,
  breakpoints,
} as const;

export default designSystem;

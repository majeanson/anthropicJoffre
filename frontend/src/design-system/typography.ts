/**
 * Design System - Typography Tokens
 * Sprint 21: Standardized typography scale
 *
 * Usage:
 * import { typography } from '@/design-system';
 * className={typography.h1}
 */

export const typography = {
  // Headings
  h1: 'text-4xl font-bold leading-tight',
  h2: 'text-3xl font-bold leading-tight',
  h3: 'text-2xl font-bold leading-snug',
  h4: 'text-xl font-bold leading-snug',
  h5: 'text-lg font-semibold leading-normal',
  h6: 'text-base font-semibold leading-normal',

  // Body text
  body: 'text-base leading-relaxed',
  bodyLarge: 'text-lg leading-relaxed',
  bodySmall: 'text-sm leading-relaxed',

  // Caption and labels
  caption: 'text-xs leading-normal',
  captionBold: 'text-xs font-semibold leading-normal',
  label: 'text-sm font-medium leading-normal',
  labelSmall: 'text-xs font-medium leading-normal',

  // Display (hero text)
  display1: 'text-5xl font-bold leading-tight',
  display2: 'text-6xl font-bold leading-tight',

  // Code and monospace
  code: 'font-mono text-sm',
  codeInline: 'font-mono text-sm px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded',

  // Responsive heading classes
  responsive: {
    h1: 'text-2xl md:text-3xl lg:text-4xl font-bold leading-tight',
    h2: 'text-xl md:text-2xl lg:text-3xl font-bold leading-tight',
    h3: 'text-lg md:text-xl lg:text-2xl font-bold leading-snug',
    h4: 'text-base md:text-lg lg:text-xl font-bold leading-snug',
  },

  // Font weights
  weights: {
    thin: 'font-thin',
    extralight: 'font-extralight',
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    extrabold: 'font-extrabold',
    black: 'font-black',
  },

  // Line heights
  leading: {
    none: 'leading-none',
    tight: 'leading-tight',
    snug: 'leading-snug',
    normal: 'leading-normal',
    relaxed: 'leading-relaxed',
    loose: 'leading-loose',
  },

  // Text alignment
  align: {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify',
  },

  // Text transforms
  transform: {
    uppercase: 'uppercase',
    lowercase: 'lowercase',
    capitalize: 'capitalize',
    normalCase: 'normal-case',
  },

  // Text decoration
  decoration: {
    underline: 'underline',
    overline: 'overline',
    lineThrough: 'line-through',
    noUnderline: 'no-underline',
  },

  // Text overflow
  overflow: {
    truncate: 'truncate',
    ellipsis: 'text-ellipsis',
    clip: 'text-clip',
  },
} as const;

// Typography variants that return string values
type TypographyVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'bodyLarge' | 'bodySmall' | 'caption' | 'captionBold' | 'label' | 'labelSmall' | 'display1' | 'display2' | 'code' | 'codeInline';

// Helper function to combine typography classes
export function getTypography(
  variant: TypographyVariant,
  additionalClasses?: string
): string {
  const baseClass = typography[variant] as string;
  return additionalClasses ? `${baseClass} ${additionalClasses}` : baseClass;
}

// Helper function for heading with custom color
export function getHeading(
  level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6',
  colorClass?: string
): string {
  const baseClass = typography[level];
  return colorClass ? `${baseClass} ${colorClass}` : baseClass;
}

// Helper function for responsive heading
export function getResponsiveHeading(
  level: 'h1' | 'h2' | 'h3' | 'h4',
  colorClass?: string
): string {
  const baseClass = typography.responsive[level];
  return colorClass ? `${baseClass} ${colorClass}` : baseClass;
}

/**
 * UIBadge Component - Midnight Alchemy Edition
 *
 * Mystical badge/tag component with ethereal styling.
 * Features brass accents and alchemical color schemes.
 *
 * Features:
 * - 4 variants: solid, outline, subtle, arcane
 * - Multiple color schemes with elemental glows
 * - Pulse animation for status indicators
 * - Sacred geometry styling
 *
 * @example
 * ```tsx
 * <UIBadge color="success" variant="solid">Active</UIBadge>
 * ```
 *
 * @example With icon
 * ```tsx
 * <UIBadge color="warning" icon={<span>⚠</span>}>Unstable</UIBadge>
 * ```
 *
 * @example Pulsing status indicator
 * ```tsx
 * <UIBadge color="success" pulse>Online</UIBadge>
 * ```
 */

import React, { ReactNode } from 'react';

export type UIBadgeVariant = 'solid' | 'outline' | 'subtle' | 'arcane' | 'translucent';
export type UIBadgeColor =
  | 'team1'
  | 'team2'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'muted'
  | 'accent'
  | 'gray'
  | 'primary';
export type UIBadgeSize = 'xs' | 'sm' | 'md';
export type UIBadgeShape = 'rounded' | 'pill';

export interface UIBadgeProps {
  /** Visual style variant */
  variant?: UIBadgeVariant;
  /** Color scheme */
  color?: UIBadgeColor;
  /** Badge size */
  size?: UIBadgeSize;
  /** Shape style */
  shape?: UIBadgeShape;
  /** Optional icon (displayed left of text) */
  icon?: ReactNode;
  /** Enable pulse animation (for status indicators) */
  pulse?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Badge content */
  children: ReactNode;
}

// Size-based styles
const sizeStyles: Record<UIBadgeSize, { padding: string; text: string; icon: string }> = {
  xs: { padding: 'px-2 py-0.5', text: 'text-xs', icon: 'w-3 h-3' },
  sm: { padding: 'px-2.5 py-1', text: 'text-sm', icon: 'w-3.5 h-3.5' },
  md: { padding: 'px-3 py-1.5', text: 'text-base', icon: 'w-4 h-4' },
};

// Color + Variant styles with Midnight Alchemy theming
const colorStyles: Record<UIBadgeColor, {
  solid: { bg: string; text: string; shadow: string };
  outline: { border: string; text: string };
  subtle: { bg: string; text: string };
  arcane: { bg: string; border: string; text: string; shadow: string };
  translucent: { bg: string; text: string };
}> = {
  team1: {
    solid: { bg: '#d97706', text: '#0B0E14', shadow: 'rgba(217, 119, 6, 0.5)' },
    outline: { border: '#d97706', text: '#d97706' },
    subtle: { bg: 'rgba(217, 119, 6, 0.15)', text: '#d97706' },
    arcane: { bg: 'rgba(217, 119, 6, 0.1)', border: '#d97706', text: '#d97706', shadow: 'rgba(217, 119, 6, 0.3)' },
    translucent: { bg: 'rgba(217, 119, 6, 0.2)', text: '#d97706' },
  },
  team2: {
    solid: { bg: '#7c3aed', text: '#E8E4DC', shadow: 'rgba(124, 58, 237, 0.5)' },
    outline: { border: '#7c3aed', text: '#7c3aed' },
    subtle: { bg: 'rgba(124, 58, 237, 0.15)', text: '#7c3aed' },
    arcane: { bg: 'rgba(124, 58, 237, 0.1)', border: '#7c3aed', text: '#7c3aed', shadow: 'rgba(124, 58, 237, 0.3)' },
    translucent: { bg: 'rgba(124, 58, 237, 0.2)', text: '#7c3aed' },
  },
  success: {
    solid: { bg: '#4A9C6D', text: '#0B0E14', shadow: 'rgba(74, 156, 109, 0.5)' },
    outline: { border: '#4A9C6D', text: '#4A9C6D' },
    subtle: { bg: 'rgba(74, 156, 109, 0.15)', text: '#4A9C6D' },
    arcane: { bg: 'rgba(74, 156, 109, 0.1)', border: '#4A9C6D', text: '#4A9C6D', shadow: 'rgba(74, 156, 109, 0.3)' },
    translucent: { bg: 'rgba(74, 156, 109, 0.2)', text: '#4A9C6D' },
  },
  warning: {
    solid: { bg: '#D4A574', text: '#0B0E14', shadow: 'rgba(212, 165, 116, 0.5)' },
    outline: { border: '#D4A574', text: '#D4A574' },
    subtle: { bg: 'rgba(212, 165, 116, 0.15)', text: '#D4A574' },
    arcane: { bg: 'rgba(212, 165, 116, 0.1)', border: '#D4A574', text: '#D4A574', shadow: 'rgba(212, 165, 116, 0.3)' },
    translucent: { bg: 'rgba(212, 165, 116, 0.2)', text: '#D4A574' },
  },
  error: {
    solid: { bg: '#A63D3D', text: '#E8E4DC', shadow: 'rgba(166, 61, 61, 0.5)' },
    outline: { border: '#A63D3D', text: '#A63D3D' },
    subtle: { bg: 'rgba(166, 61, 61, 0.15)', text: '#A63D3D' },
    arcane: { bg: 'rgba(166, 61, 61, 0.1)', border: '#8B3D3D', text: '#A63D3D', shadow: 'rgba(166, 61, 61, 0.3)' },
    translucent: { bg: 'rgba(166, 61, 61, 0.2)', text: '#A63D3D' },
  },
  info: {
    solid: { bg: '#4682B4', text: '#E8E4DC', shadow: 'rgba(70, 130, 180, 0.5)' },
    outline: { border: '#4682B4', text: '#4682B4' },
    subtle: { bg: 'rgba(70, 130, 180, 0.15)', text: '#4682B4' },
    arcane: { bg: 'rgba(70, 130, 180, 0.1)', border: '#4682B4', text: '#4682B4', shadow: 'rgba(70, 130, 180, 0.3)' },
    translucent: { bg: 'rgba(70, 130, 180, 0.2)', text: '#4682B4' },
  },
  muted: {
    solid: { bg: '#6B7280', text: '#E8E4DC', shadow: 'rgba(107, 114, 128, 0.4)' },
    outline: { border: '#6B7280', text: '#6B7280' },
    subtle: { bg: 'rgba(107, 114, 128, 0.15)', text: '#9CA3AF' },
    arcane: { bg: 'rgba(107, 114, 128, 0.1)', border: '#6B7280', text: '#9CA3AF', shadow: 'rgba(107, 114, 128, 0.2)' },
    translucent: { bg: 'rgba(107, 114, 128, 0.2)', text: '#9CA3AF' },
  },
  accent: {
    solid: { bg: '#C17F59', text: '#0B0E14', shadow: 'rgba(193, 127, 89, 0.5)' },
    outline: { border: '#C17F59', text: '#D4A574' },
    subtle: { bg: 'rgba(193, 127, 89, 0.15)', text: '#D4A574' },
    arcane: { bg: 'rgba(193, 127, 89, 0.1)', border: '#C17F59', text: '#D4A574', shadow: 'rgba(193, 127, 89, 0.3)' },
    translucent: { bg: 'rgba(193, 127, 89, 0.2)', text: '#D4A574' },
  },
  gray: {
    solid: { bg: '#6B7280', text: '#E8E4DC', shadow: 'rgba(107, 114, 128, 0.4)' },
    outline: { border: '#6B7280', text: '#6B7280' },
    subtle: { bg: 'rgba(107, 114, 128, 0.15)', text: '#9CA3AF' },
    arcane: { bg: 'rgba(107, 114, 128, 0.1)', border: '#6B7280', text: '#9CA3AF', shadow: 'rgba(107, 114, 128, 0.2)' },
    translucent: { bg: 'rgba(107, 114, 128, 0.2)', text: '#9CA3AF' },
  },
  primary: {
    solid: { bg: '#C17F59', text: '#0B0E14', shadow: 'rgba(193, 127, 89, 0.5)' },
    outline: { border: '#C17F59', text: '#D4A574' },
    subtle: { bg: 'rgba(193, 127, 89, 0.15)', text: '#D4A574' },
    arcane: { bg: 'rgba(193, 127, 89, 0.1)', border: '#C17F59', text: '#D4A574', shadow: 'rgba(193, 127, 89, 0.3)' },
    translucent: { bg: 'rgba(193, 127, 89, 0.2)', text: '#D4A574' },
  },
};

/**
 * UIBadge - Mystical badge component for labels and status indicators
 *
 * Variants:
 * - solid: Full background with ethereal glow
 * - outline: Border with colored text
 * - subtle: Muted background
 * - arcane: Sacred geometry with corner accents
 */
export const UIBadge: React.FC<UIBadgeProps> = ({
  variant = 'solid',
  color = 'muted',
  size = 'sm',
  shape = 'rounded',
  icon,
  pulse = false,
  className = '',
  children,
}) => {
  const sizeStyle = sizeStyles[size];
  const colorStyle = colorStyles[color][variant];

  // Get variant-specific styles
  const getStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'solid':
        return {
          backgroundColor: (colorStyle as typeof colorStyles.accent.solid).bg,
          color: (colorStyle as typeof colorStyles.accent.solid).text,
          boxShadow: `0 2px 10px ${(colorStyle as typeof colorStyles.accent.solid).shadow}`,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: (colorStyle as typeof colorStyles.accent.outline).border,
          color: (colorStyle as typeof colorStyles.accent.outline).text,
        };
      case 'subtle':
        return {
          backgroundColor: (colorStyle as typeof colorStyles.accent.subtle).bg,
          color: (colorStyle as typeof colorStyles.accent.subtle).text,
        };
      case 'arcane':
        return {
          backgroundColor: (colorStyle as typeof colorStyles.accent.arcane).bg,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: (colorStyle as typeof colorStyles.accent.arcane).border,
          color: (colorStyle as typeof colorStyles.accent.arcane).text,
          boxShadow: `0 0 15px ${(colorStyle as typeof colorStyles.accent.arcane).shadow}`,
        };
      case 'translucent':
        return {
          backgroundColor: (colorStyle as typeof colorStyles.accent.translucent).bg,
          color: (colorStyle as typeof colorStyles.accent.translucent).text,
          backdropFilter: 'blur(4px)',
        };
      default:
        return {
          backgroundColor: (colorStyle as typeof colorStyles.accent.solid).bg,
          color: (colorStyle as typeof colorStyles.accent.solid).text,
        };
    }
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        font-semibold tracking-wide uppercase
        transition-all duration-200
        ${sizeStyle.padding}
        ${sizeStyle.text}
        ${shape === 'pill' ? 'rounded-full' : 'rounded-md'}
        ${pulse ? 'animate-pulse' : ''}
        ${variant === 'arcane' ? 'relative' : ''}
        ${className}
      `}
      style={{
        ...getStyles(),
        fontFamily: '"Cinzel", Georgia, serif',
      }}
    >
      {/* Arcane corner accents */}
      {variant === 'arcane' && (
        <>
          <span
            className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t rounded-tl-sm"
            style={{ borderColor: (colorStyle as typeof colorStyles.accent.arcane).border }}
          />
          <span
            className="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t rounded-tr-sm"
            style={{ borderColor: (colorStyle as typeof colorStyles.accent.arcane).border }}
          />
          <span
            className="absolute bottom-0 left-0 w-1.5 h-1.5 border-l border-b rounded-bl-sm"
            style={{ borderColor: (colorStyle as typeof colorStyles.accent.arcane).border }}
          />
          <span
            className="absolute bottom-0 right-0 w-1.5 h-1.5 border-r border-b rounded-br-sm"
            style={{ borderColor: (colorStyle as typeof colorStyles.accent.arcane).border }}
          />
        </>
      )}

      {icon && <span className={sizeStyle.icon}>{icon}</span>}
      {children}
    </span>
  );
};

// ============================================================================
// PRESET BADGE COMPONENTS
// ============================================================================

export interface PresetBadgeProps extends Omit<UIBadgeProps, 'variant' | 'color'> {}

/** Arcane badge with sacred geometry styling */
export const ArcaneBadge: React.FC<PresetBadgeProps> = (props) => (
  <UIBadge variant="arcane" color="accent" {...props} />
);

/** Success badge for positive states */
export const SuccessBadge: React.FC<PresetBadgeProps> = (props) => (
  <UIBadge variant="solid" color="success" {...props} />
);

/** Warning badge for caution states */
export const WarningBadge: React.FC<PresetBadgeProps> = (props) => (
  <UIBadge variant="solid" color="warning" {...props} />
);

/** Error badge for critical states */
export const ErrorBadge: React.FC<PresetBadgeProps> = (props) => (
  <UIBadge variant="solid" color="error" {...props} />
);

export default UIBadge;

/**
 * UIDivider Component
 * Unified divider/separator component
 *
 * Replaces inline border-t and hr elements with consistent styling.
 */

export type DividerOrientation = 'horizontal' | 'vertical';
export type DividerVariant = 'solid' | 'dashed' | 'dotted' | 'gradient';
export type DividerSize = 'sm' | 'md' | 'lg';
export type DividerColor = 'default' | 'muted' | 'amber' | 'gray' | 'team1' | 'team2';

export interface UIDividerProps {
  /** Orientation of the divider */
  orientation?: DividerOrientation;
  /** Visual style variant */
  variant?: DividerVariant;
  /** Thickness/size of the divider */
  size?: DividerSize;
  /** Color scheme */
  color?: DividerColor;
  /** Optional label text in the middle of the divider */
  label?: string;
  /** Spacing around the divider */
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

const sizeConfig: Record<DividerSize, { horizontal: string; vertical: string }> = {
  sm: { horizontal: 'border-t', vertical: 'border-l' },
  md: { horizontal: 'border-t-2', vertical: 'border-l-2' },
  lg: { horizontal: 'border-t-4', vertical: 'border-l-4' },
};

const variantConfig: Record<DividerVariant, string> = {
  solid: 'border-solid',
  dashed: 'border-dashed',
  dotted: 'border-dotted',
  gradient: '', // Handled separately with gradient bg
};

const colorConfig: Record<DividerColor, string> = {
  default: 'border-parchment-400',
  muted: 'border-parchment-300',
  amber: 'border-amber-700/30',
  gray: 'border-gray-300',
  team1: 'border-orange-400/50',
  team2: 'border-purple-400/50',
};

const spacingConfig: Record<'none' | 'sm' | 'md' | 'lg', { horizontal: string; vertical: string }> =
  {
    none: { horizontal: '', vertical: '' },
    sm: { horizontal: 'my-2', vertical: 'mx-2' },
    md: { horizontal: 'my-4', vertical: 'mx-4' },
    lg: { horizontal: 'my-6', vertical: 'mx-6' },
  };

export function UIDivider({
  orientation = 'horizontal',
  variant = 'solid',
  size = 'sm',
  color = 'default',
  label,
  spacing = 'md',
  className = '',
}: UIDividerProps) {
  const isHorizontal = orientation === 'horizontal';
  const sizeClass = sizeConfig[size][orientation];
  const variantClass = variantConfig[variant];
  const colorClass = colorConfig[color];
  const spacingClass = spacingConfig[spacing][orientation];

  // Gradient variant uses a different approach
  if (variant === 'gradient') {
    const gradientSize = size === 'sm' ? 'h-px' : size === 'md' ? 'h-0.5' : 'h-1';
    const gradientColor =
      color === 'team1'
        ? 'from-transparent via-orange-400/50 to-transparent'
        : color === 'team2'
          ? 'from-transparent via-purple-400/50 to-transparent'
          : color === 'amber'
            ? 'from-transparent via-amber-600/50 to-transparent'
            : 'from-transparent via-gray-400/50 to-transparent';

    return (
      <div
        className={`
          w-full ${gradientSize} bg-gradient-to-r ${gradientColor}
          ${spacingClass}
          ${className}
        `}
        role="separator"
        aria-orientation={orientation}
      />
    );
  }

  // Simple divider without label
  if (!label) {
    return (
      <div
        className={`
          ${isHorizontal ? 'w-full' : 'h-full'}
          ${sizeClass}
          ${variantClass}
          ${colorClass}
          ${spacingClass}
          ${className}
        `}
        role="separator"
        aria-orientation={orientation}
      />
    );
  }

  // Divider with label (horizontal only)
  return (
    <div
      className={`flex items-center ${spacingClass} ${className}`}
      role="separator"
      aria-orientation="horizontal"
    >
      <div className={`flex-1 ${sizeClass} ${variantClass} ${colorClass}`} />
      <span className="px-3 text-sm font-medium text-umber-600">{label}</span>
      <div className={`flex-1 ${sizeClass} ${variantClass} ${colorClass}`} />
    </div>
  );
}

export default UIDivider;

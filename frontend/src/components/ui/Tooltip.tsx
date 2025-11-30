/**
 * Tooltip Component - Midnight Alchemy Edition
 *
 * Mystical tooltip with brass frame aesthetics and ethereal glow.
 * Features arcane styling and smooth transmutation animations.
 *
 * Features:
 * - 4 positions: top, bottom, left, right
 * - Multiple variants with alchemical color schemes
 * - Delay support for intentional reveals
 * - Sacred geometry arrow styling
 * - Full accessibility (aria-describedby)
 *
 * Usage:
 * ```tsx
 * <Tooltip content="Ancient knowledge awaits">
 *   <Button>Hover to reveal</Button>
 * </Tooltip>
 *
 * <Tooltip
 *   content="Copy the arcane seal"
 *   position="bottom"
 *   variant="arcane"
 * >
 *   <span>Seal ID: ⚗ABC123</span>
 * </Tooltip>
 * ```
 */

import { ReactNode, useState, useRef, useEffect } from 'react';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';
export type TooltipVariant = 'dark' | 'light' | 'arcane' | 'success' | 'warning' | 'error' | 'info';

export interface TooltipProps {
  /** Tooltip content */
  content: ReactNode;
  /** Element to attach tooltip to */
  children: ReactNode;
  /** Tooltip position */
  position?: TooltipPosition;
  /** Tooltip variant */
  variant?: TooltipVariant;
  /** Delay before showing (ms) */
  delay?: number;
  /** Additional classes for tooltip */
  className?: string;
  /** Disable tooltip */
  disabled?: boolean;
}

const positionClasses: Record<TooltipPosition, { container: string; arrow: string }> = {
  top: {
    container: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    arrow: 'top-full left-1/2 -translate-x-1/2',
  },
  bottom: {
    container: 'top-full left-1/2 -translate-x-1/2 mt-2',
    arrow: 'bottom-full left-1/2 -translate-x-1/2',
  },
  left: {
    container: 'right-full top-1/2 -translate-y-1/2 mr-2',
    arrow: 'left-full top-1/2 -translate-y-1/2',
  },
  right: {
    container: 'left-full top-1/2 -translate-y-1/2 ml-2',
    arrow: 'right-full top-1/2 -translate-y-1/2',
  },
};

// Variant styles using CSS variables for skin compatibility
const variantStyles: Record<TooltipVariant, {
  bg: string;
  text: string;
  border: string;
  shadow: string;
}> = {
  dark: {
    bg: 'var(--color-bg-primary)',
    text: 'var(--color-text-primary)',
    border: 'var(--color-border-default)',
    shadow: 'var(--shadow-lg)',
  },
  light: {
    bg: 'var(--color-bg-secondary)',
    text: 'var(--color-text-primary)',
    border: 'var(--color-border-accent)',
    shadow: 'var(--shadow-lg), var(--shadow-glow)',
  },
  arcane: {
    bg: 'linear-gradient(180deg, var(--color-bg-secondary) 0%, var(--color-bg-primary) 100%)',
    text: 'var(--color-text-accent)',
    border: 'var(--color-border-accent)',
    shadow: 'var(--shadow-lg), var(--shadow-glow)',
  },
  success: {
    bg: 'color-mix(in srgb, var(--color-success) 15%, var(--color-bg-primary))',
    text: 'var(--color-success)',
    border: 'var(--color-success)',
    shadow: 'var(--shadow-lg)',
  },
  warning: {
    bg: 'color-mix(in srgb, var(--color-warning) 15%, var(--color-bg-primary))',
    text: 'var(--color-warning)',
    border: 'var(--color-warning)',
    shadow: 'var(--shadow-lg)',
  },
  error: {
    bg: 'color-mix(in srgb, var(--color-error) 15%, var(--color-bg-primary))',
    text: 'var(--color-error)',
    border: 'var(--color-error)',
    shadow: 'var(--shadow-lg)',
  },
  info: {
    bg: 'color-mix(in srgb, var(--color-info) 15%, var(--color-bg-primary))',
    text: 'var(--color-info)',
    border: 'var(--color-info)',
    shadow: 'var(--shadow-lg)',
  },
};

export function Tooltip({
  content,
  children,
  position = 'top',
  variant = 'dark',
  delay = 0,
  className = '',
  disabled = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const tooltipId = useRef(`tooltip-${Math.random().toString(36).substr(2, 9)}`);

  // Handle show with delay
  const handleShow = () => {
    if (disabled) return;

    if (delay > 0) {
      timeoutRef.current = window.setTimeout(() => {
        setShouldRender(true);
        // Small delay for animation
        requestAnimationFrame(() => setIsVisible(true));
      }, delay);
    } else {
      setShouldRender(true);
      requestAnimationFrame(() => setIsVisible(true));
    }
  };

  // Handle hide
  const handleHide = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
    // Wait for animation to complete
    setTimeout(() => setShouldRender(false), 200);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const positionStyle = positionClasses[position];
  const variantStyle = variantStyles[variant];

  // Arrow direction based on position
  const getArrowStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      width: 0,
      height: 0,
      borderWidth: '6px',
      borderStyle: 'solid',
      borderColor: 'transparent',
    };

    const arrowColor = variant === 'arcane' ? 'var(--color-bg-secondary)' : variantStyle.bg;

    switch (position) {
      case 'top':
        return { ...baseStyle, borderTopColor: arrowColor };
      case 'bottom':
        return { ...baseStyle, borderBottomColor: arrowColor };
      case 'left':
        return { ...baseStyle, borderLeftColor: arrowColor };
      case 'right':
        return { ...baseStyle, borderRightColor: arrowColor };
    }
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleShow}
      onMouseLeave={handleHide}
      onFocus={handleShow}
      onBlur={handleHide}
    >
      {/* Trigger Element */}
      <div aria-describedby={shouldRender ? tooltipId.current : undefined}>
        {children}
      </div>

      {/* Tooltip */}
      {shouldRender && (
        <div
          id={tooltipId.current}
          role="tooltip"
          className={`
            absolute z-50
            ${positionStyle.container}
            px-3 py-2
            text-sm font-medium
            rounded-md
            whitespace-nowrap
            pointer-events-none
            transition-all duration-200
            ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-1 scale-95'}
            ${className}
          `}
          style={{
            background: variantStyle.bg,
            color: variantStyle.text,
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: variantStyle.border,
            boxShadow: variantStyle.shadow,
            fontFamily: '"Cormorant Garamond", Georgia, serif',
          }}
        >
          {/* Arcane corner accents */}
          {variant === 'arcane' && (
            <>
              <div className="absolute top-0 left-0 w-2 h-2 border-l border-t opacity-60 rounded-tl-sm" style={{ borderColor: 'var(--color-border-accent)' }} />
              <div className="absolute top-0 right-0 w-2 h-2 border-r border-t opacity-60 rounded-tr-sm" style={{ borderColor: 'var(--color-border-accent)' }} />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b opacity-60 rounded-bl-sm" style={{ borderColor: 'var(--color-border-accent)' }} />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b opacity-60 rounded-br-sm" style={{ borderColor: 'var(--color-border-accent)' }} />
            </>
          )}

          {content}

          {/* Arrow */}
          <div
            className={`absolute ${positionStyle.arrow}`}
            style={getArrowStyle()}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PRESET TOOLTIP COMPONENTS
// ============================================================================

export interface PresetTooltipProps extends Omit<TooltipProps, 'variant'> {}

/** Arcane tooltip with copper glow */
export const ArcaneTooltip = (props: PresetTooltipProps) => (
  <Tooltip variant="arcane" {...props} />
);

/** Success tooltip for positive feedback */
export const SuccessTooltip = (props: PresetTooltipProps) => (
  <Tooltip variant="success" {...props} />
);

/** Warning tooltip for cautions */
export const WarningTooltip = (props: PresetTooltipProps) => (
  <Tooltip variant="warning" {...props} />
);

/** Error tooltip for critical information */
export const ErrorTooltip = (props: PresetTooltipProps) => (
  <Tooltip variant="error" {...props} />
);

export default Tooltip;

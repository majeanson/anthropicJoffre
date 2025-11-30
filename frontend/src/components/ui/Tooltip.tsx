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

// Variant styles with Midnight Alchemy theming
const variantStyles: Record<TooltipVariant, {
  bg: string;
  text: string;
  border: string;
  shadow: string;
}> = {
  dark: {
    bg: '#0B0E14',
    text: '#E8E4DC',
    border: '#2D3548',
    shadow: '0 4px 20px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(45, 53, 72, 0.5)',
  },
  light: {
    bg: '#1A1F2E',
    text: '#E8E4DC',
    border: '#C17F59',
    shadow: '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(193, 127, 89, 0.15)',
  },
  arcane: {
    bg: 'linear-gradient(180deg, #1A1F2E 0%, #131824 100%)',
    text: '#D4A574',
    border: '#C17F59',
    shadow: '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 25px rgba(193, 127, 89, 0.25)',
  },
  success: {
    bg: '#1A2E23',
    text: '#4A9C6D',
    border: '#4A9C6D',
    shadow: '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(74, 156, 109, 0.2)',
  },
  warning: {
    bg: '#2E2A1A',
    text: '#D4A574',
    border: '#D4A574',
    shadow: '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(212, 165, 116, 0.2)',
  },
  error: {
    bg: '#2E1A1A',
    text: '#A63D3D',
    border: '#8B3D3D',
    shadow: '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(166, 61, 61, 0.2)',
  },
  info: {
    bg: '#1A232E',
    text: '#4682B4',
    border: '#4682B4',
    shadow: '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(70, 130, 180, 0.2)',
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

    const arrowColor = variant === 'arcane' ? '#1A1F2E' : variantStyle.bg;

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
              <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-[#C17F59] opacity-60 rounded-tl-sm" />
              <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-[#C17F59] opacity-60 rounded-tr-sm" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-[#C17F59] opacity-60 rounded-bl-sm" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-[#C17F59] opacity-60 rounded-br-sm" />
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

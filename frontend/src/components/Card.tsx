/**
 * Card Component - Midnight Alchemy Edition
 *
 * Playing cards as ancient alchemical artifacts. Each card appears as an
 * illuminated manuscript page with mystical glow effects and copper accents.
 *
 * Design Philosophy:
 * - Cards have parchment-like backgrounds with aged texture
 * - Each suit glows with its elemental color on hover
 * - Special cards (Red 0, Brown 0) pulse with mystical energy
 * - Playable cards levitate with ethereal lighting
 * - Non-playable cards fade into shadow with arcane seal
 *
 * Accessibility:
 * - Full keyboard navigation support
 * - Clear visual feedback for all states
 * - ARIA labels for screen readers
 */

import { memo, useMemo } from 'react';
import { Card as CardType, CardColor } from '../types/game';

interface CardProps {
  card: CardType;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  size?: 'tiny' | 'small' | 'medium' | 'large';
  isPlayable?: boolean;
  isKeyboardSelected?: boolean;
  /** Show card back instead of face */
  faceDown?: boolean;
}

// Alchemical element colors for each suit
const suitStyles: Record<CardColor, {
  border: string;
  text: string;
  shadow: string;
  shadowHover: string;
  innerGlow: string;
  elementName: string;
}> = {
  red: {
    border: 'var(--color-suit-red)',
    text: 'var(--color-suit-red)',
    shadow: '0 4px 16px rgba(220, 38, 38, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
    shadowHover: '0 8px 32px rgba(220, 38, 38, 0.4), 0 0 40px rgba(220, 38, 38, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
    innerGlow: 'rgba(220, 38, 38, 0.12)',
    elementName: 'Fire',
  },
  brown: {
    border: 'var(--color-suit-brown)',
    text: 'var(--color-suit-brown)',
    shadow: '0 4px 16px rgba(180, 83, 9, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
    shadowHover: '0 8px 32px rgba(180, 83, 9, 0.4), 0 0 40px rgba(180, 83, 9, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
    innerGlow: 'rgba(180, 83, 9, 0.12)',
    elementName: 'Earth',
  },
  green: {
    border: 'var(--color-suit-green)',
    text: 'var(--color-suit-green)',
    shadow: '0 4px 16px rgba(5, 150, 105, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
    shadowHover: '0 8px 32px rgba(5, 150, 105, 0.4), 0 0 40px rgba(5, 150, 105, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
    innerGlow: 'rgba(5, 150, 105, 0.12)',
    elementName: 'Nature',
  },
  blue: {
    border: 'var(--color-suit-blue)',
    text: 'var(--color-suit-blue)',
    shadow: '0 4px 16px rgba(37, 99, 235, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
    shadowHover: '0 8px 32px rgba(37, 99, 235, 0.4), 0 0 40px rgba(37, 99, 235, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
    innerGlow: 'rgba(37, 99, 235, 0.12)',
    elementName: 'Water',
  },
};

// Size configurations with golden ratio proportions
const sizeStyles = {
  tiny: {
    container: 'w-14 h-20 sm:w-12 sm:h-20',
    text: 'text-base',
    cornerText: 'text-[10px]',
    emblem: 'w-7 h-7 sm:w-6 sm:h-6',
    badge: 'text-[8px] px-0.5',
    borderWidth: '2px',
    cornerOffset: 'top-0.5 left-1',
    cornerOffsetBottom: 'bottom-0.5 right-1',
  },
  small: {
    container: 'w-20 h-32 md:w-16 md:h-28',
    text: 'text-lg',
    cornerText: 'text-xs',
    emblem: 'w-12 h-12 md:w-10 md:h-10',
    badge: 'text-[9px] px-0.5',
    borderWidth: '2px',
    cornerOffset: 'top-1 left-1.5',
    cornerOffsetBottom: 'bottom-1 right-1.5',
  },
  medium: {
    container: 'w-24 h-36 md:w-20 md:h-32',
    text: 'text-2xl',
    cornerText: 'text-sm',
    emblem: 'w-14 h-14 md:w-12 md:h-12',
    badge: 'text-xs px-1',
    borderWidth: '2px',
    cornerOffset: 'top-1 left-1.5',
    cornerOffsetBottom: 'bottom-1 right-1.5',
  },
  large: {
    container: 'w-28 h-40 md:w-24 md:h-36',
    text: 'text-3xl',
    cornerText: 'text-base',
    emblem: 'w-18 h-18 md:w-16 md:h-16',
    badge: 'text-sm px-1.5',
    borderWidth: '3px',
    cornerOffset: 'top-1.5 left-2',
    cornerOffsetBottom: 'bottom-1.5 right-2',
  },
};

function CardComponent({
  card,
  onClick,
  disabled,
  size = 'medium',
  isPlayable = false,
  isKeyboardSelected = false,
  faceDown = false,
}: CardProps) {
  // Memoize expensive calculations
  const isSpecial = useMemo(
    () => (card.color === 'red' || card.color === 'brown') && card.value === 0,
    [card.color, card.value]
  );

  const suitStyle = suitStyles[card.color];
  const sizeConfig = sizeStyles[size];

  // Determine which image to show
  const cardImage = useMemo(() => {
    if (isSpecial) {
      return `/cards/production/${card.color}_bon.jpg`;
    }
    return `/cards/production/${card.color}_emblem.jpg`;
  }, [isSpecial, card.color]);

  // Generate aria-label for accessibility
  const ariaLabel = isSpecial
    ? `${card.color} special card (${card.color === 'red' ? '+5 points' : '-2 points'})`
    : `${card.color} ${card.value}`;

  // Card back design - Alchemical grimoire pattern
  if (faceDown) {
    return (
      <div
        className={`
          ${sizeConfig.container}
          rounded-[var(--radius-lg)]
          flex items-center justify-center
          relative overflow-hidden
        `}
        style={{
          backgroundColor: 'var(--color-bg-tertiary)',
          borderWidth: sizeConfig.borderWidth,
          borderStyle: 'solid',
          borderColor: 'var(--color-border-accent)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
          background: `
            linear-gradient(135deg,
              var(--color-bg-tertiary) 0%,
              var(--color-bg-secondary) 50%,
              var(--color-bg-tertiary) 100%
            )
          `,
        }}
      >
        {/* Alchemical circle pattern */}
        <div
          className="absolute inset-3 rounded-full border opacity-20"
          style={{
            borderColor: 'var(--color-border-accent)',
          }}
        />
        <div
          className="absolute inset-5 rounded-full border opacity-15"
          style={{
            borderColor: 'var(--color-border-accent)',
          }}
        />

        {/* Sacred geometry corners */}
        <div className="absolute top-1 left-1 w-3 h-3 border-l-2 border-t-2 border-[var(--color-border-accent)] opacity-50" />
        <div className="absolute top-1 right-1 w-3 h-3 border-r-2 border-t-2 border-[var(--color-border-accent)] opacity-50" />
        <div className="absolute bottom-1 left-1 w-3 h-3 border-l-2 border-b-2 border-[var(--color-border-accent)] opacity-50" />
        <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 border-[var(--color-border-accent)] opacity-50" />

        {/* Center alchemical symbol */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center relative"
          style={{
            background: 'linear-gradient(135deg, var(--color-bg-accent) 0%, rgba(193, 127, 89, 0.8) 100%)',
            boxShadow: '0 2px 12px rgba(212, 165, 116, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          }}
        >
          {/* Triangle inside circle (alchemical symbol) */}
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 4L21 20H3L12 4Z"
              stroke="var(--color-text-inverse)"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      data-testid={`card-${card.color}-${card.value}`}
      data-card-value={card.value}
      data-card-color={card.color}
      className={`
        ${sizeConfig.container}
        rounded-[var(--radius-lg)]
        font-display
        flex flex-col items-center justify-center gap-1
        transition-all duration-[var(--duration-normal)] ease-[var(--easing)]
        relative overflow-hidden
        ${!disabled && onClick ? 'cursor-pointer' : 'cursor-default'}
        ${disabled ? 'opacity-50' : ''}
        ${isKeyboardSelected ? 'ring-[var(--input-focus-ring-width)] ring-[var(--color-text-accent)] ring-offset-2 ring-offset-[var(--color-bg-primary)]' : ''}
        focus-visible:outline-none
        focus-visible:ring-[var(--input-focus-ring-width)]
        focus-visible:ring-[var(--color-text-accent)]
        focus-visible:ring-offset-2
        focus-visible:ring-offset-[var(--color-bg-primary)]
      `}
      style={{
        backgroundColor: 'var(--card-bg-color)',
        borderWidth: sizeConfig.borderWidth,
        borderStyle: 'solid',
        borderColor: suitStyle.border,
        boxShadow: isPlayable && !disabled
          ? suitStyle.shadowHover
          : disabled
            ? '0 2px 4px rgba(0, 0, 0, 0.2)'
            : suitStyle.shadow,
        transform: isPlayable && !disabled ? 'translateY(-6px)' : undefined,
      }}
      onMouseEnter={(e) => {
        if (!disabled && onClick) {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = suitStyle.shadowHover;
          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-8px) scale(1.03)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = isPlayable ? suitStyle.shadowHover : suitStyle.shadow;
          (e.currentTarget as HTMLButtonElement).style.transform = isPlayable ? 'translateY(-6px)' : '';
        }
      }}
    >
      {/* Parchment texture overlay */}
      <div
        className="absolute inset-0 rounded-[var(--radius-lg)] pointer-events-none opacity-40"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.08) 100%)',
        }}
      />

      {/* Ethereal glow for playable cards */}
      {isPlayable && !disabled && (
        <div
          className="absolute inset-0 rounded-[var(--radius-lg)] pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, ${suitStyle.innerGlow} 0%, transparent 65%)`,
            animation: 'ethereal-pulse 2.5s ease-in-out infinite',
          }}
        />
      )}

      {/* Top-left value with mystical typography */}
      {!isSpecial && (
        <span
          className={`
            absolute ${sizeConfig.cornerOffset}
            font-display font-bold
            ${sizeConfig.cornerText}
          `}
          style={{
            color: suitStyle.text,
            textShadow: `0 1px 3px rgba(0, 0, 0, 0.4), 0 0 8px ${suitStyle.innerGlow}`,
          }}
        >
          {card.value}
        </span>
      )}

      {/* Center emblem or special card image */}
      <img
        src={cardImage}
        alt={`${card.color} ${isSpecial ? 'bon' : 'emblem'}`}
        decoding="async"
        loading="lazy"
        className={`
          ${sizeConfig.emblem}
          object-contain
          ${isSpecial ? '' : 'opacity-85'}
        `}
        style={{
          filter: `drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4)) ${isPlayable ? 'brightness(1.05)' : ''}`,
        }}
      />

      {/* Bottom-right value (rotated) */}
      {!isSpecial && (
        <span
          className={`
            absolute ${sizeConfig.cornerOffsetBottom}
            font-display font-bold
            ${sizeConfig.cornerText}
            rotate-180
          `}
          style={{
            color: suitStyle.text,
            textShadow: `0 1px 3px rgba(0, 0, 0, 0.4), 0 0 8px ${suitStyle.innerGlow}`,
          }}
        >
          {card.value}
        </span>
      )}

      {/* Special card badge with transmutation glow */}
      {isSpecial && (
        <span
          className={`
            absolute top-0.5 right-0.5
            ${sizeConfig.badge}
            font-display font-bold
            rounded-[var(--radius-sm)]
          `}
          style={{
            backgroundColor: card.color === 'red'
              ? 'var(--color-success)'
              : 'var(--color-error)',
            color: card.color === 'red'
              ? '#0B0E14'
              : '#FEF2F2',
            boxShadow: card.color === 'red'
              ? '0 2px 10px rgba(45, 212, 191, 0.6)'
              : '0 2px 10px rgba(220, 38, 38, 0.6)',
          }}
        >
          {card.color === 'red' ? '+5' : '-2'}
        </span>
      )}

      {/* Disabled overlay with arcane seal */}
      {disabled && onClick && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-[var(--radius-lg)]"
          style={{
            backgroundColor: 'rgba(11, 14, 20, 0.6)',
            backdropFilter: 'grayscale(90%) brightness(0.7)',
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.8), rgba(127, 29, 29, 0.8))',
              boxShadow: '0 0 15px rgba(220, 38, 38, 0.4)',
            }}
          >
            <span
              className="font-display text-xl font-bold text-white"
              style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)' }}
            >
              ✕
            </span>
          </div>
        </div>
      )}
    </button>
  );
}

// Custom comparison function for React.memo
function arePropsEqual(prevProps: CardProps, nextProps: CardProps) {
  return (
    prevProps.card.color === nextProps.card.color &&
    prevProps.card.value === nextProps.card.value &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.size === nextProps.size &&
    prevProps.onClick === nextProps.onClick &&
    prevProps.isPlayable === nextProps.isPlayable &&
    prevProps.isKeyboardSelected === nextProps.isKeyboardSelected &&
    prevProps.faceDown === nextProps.faceDown
  );
}

// Export memoized component for better performance
export const Card = memo(CardComponent, arePropsEqual);

// ============================================================================
// CARD BACK COMPONENT (for opponent hands)
// ============================================================================

interface CardBackProps {
  size?: 'tiny' | 'small' | 'medium' | 'large';
  /** Optional team color tint */
  teamColor?: 1 | 2;
}

export function CardBack({ size = 'medium', teamColor }: CardBackProps) {
  const sizeConfig = sizeStyles[size];

  const teamColors = {
    1: 'var(--color-team1-primary)',
    2: 'var(--color-team2-primary)',
  };

  const teamGlows = {
    1: 'rgba(180, 83, 9, 0.3)',
    2: 'rgba(124, 58, 237, 0.3)',
  };

  return (
    <div
      className={`
        ${sizeConfig.container}
        rounded-[var(--radius-lg)]
        flex items-center justify-center
        relative overflow-hidden
      `}
      style={{
        backgroundColor: 'var(--color-bg-tertiary)',
        borderWidth: sizeConfig.borderWidth,
        borderStyle: 'solid',
        borderColor: teamColor ? teamColors[teamColor] : 'var(--color-border-accent)',
        boxShadow: teamColor
          ? `0 4px 20px rgba(0, 0, 0, 0.5), 0 0 25px ${teamGlows[teamColor]}`
          : '0 4px 20px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
        background: `
          linear-gradient(135deg,
            var(--color-bg-tertiary) 0%,
            var(--color-bg-secondary) 50%,
            var(--color-bg-tertiary) 100%
          )
        `,
      }}
    >
      {/* Alchemical circle pattern */}
      <div
        className="absolute inset-3 rounded-full border opacity-20"
        style={{
          borderColor: teamColor ? teamColors[teamColor] : 'var(--color-border-accent)',
        }}
      />

      {/* Sacred geometry corners */}
      <div
        className="absolute top-1 left-1 w-3 h-3 border-l-2 border-t-2 opacity-50"
        style={{ borderColor: teamColor ? teamColors[teamColor] : 'var(--color-border-accent)' }}
      />
      <div
        className="absolute top-1 right-1 w-3 h-3 border-r-2 border-t-2 opacity-50"
        style={{ borderColor: teamColor ? teamColors[teamColor] : 'var(--color-border-accent)' }}
      />
      <div
        className="absolute bottom-1 left-1 w-3 h-3 border-l-2 border-b-2 opacity-50"
        style={{ borderColor: teamColor ? teamColors[teamColor] : 'var(--color-border-accent)' }}
      />
      <div
        className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 opacity-50"
        style={{ borderColor: teamColor ? teamColors[teamColor] : 'var(--color-border-accent)' }}
      />

      {/* Center symbol */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{
          background: teamColor
            ? `linear-gradient(135deg, ${teamColors[teamColor]}, color-mix(in srgb, ${teamColors[teamColor]} 80%, black))`
            : 'linear-gradient(135deg, var(--color-bg-accent) 0%, rgba(193, 127, 89, 0.8) 100%)',
          boxShadow: teamColor
            ? `0 2px 12px ${teamGlows[teamColor]}`
            : '0 2px 12px rgba(212, 165, 116, 0.5)',
        }}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 4L21 20H3L12 4Z"
            stroke="var(--color-text-inverse)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

// ============================================================================
// CARD STACK COMPONENT (for deck visualization)
// ============================================================================

interface CardStackProps {
  count: number;
  size?: 'tiny' | 'small' | 'medium' | 'large';
  maxVisible?: number;
}

export function CardStack({ count, size = 'medium', maxVisible = 5 }: CardStackProps) {
  const visibleCards = Math.min(count, maxVisible);

  return (
    <div className="relative">
      {Array.from({ length: visibleCards }).map((_, index) => (
        <div
          key={index}
          className="absolute"
          style={{
            top: index * -2,
            left: index * 1,
            zIndex: index,
          }}
        >
          <CardBack size={size} />
        </div>
      ))}

      {/* Card count badge with copper accent */}
      {count > 0 && (
        <div
          className="absolute -top-2 -right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center font-display text-xs font-bold"
          style={{
            background: 'linear-gradient(135deg, var(--color-bg-accent), rgba(193, 127, 89, 0.9))',
            color: 'var(--color-text-inverse)',
            boxShadow: '0 2px 10px rgba(212, 165, 116, 0.5)',
          }}
        >
          {count}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ELEGANT CARD DISPLAY (for showcasing single cards)
// ============================================================================

interface ElegantCardDisplayProps {
  card: CardType;
  size?: 'small' | 'medium' | 'large';
  /** Add dramatic spotlight effect */
  spotlight?: boolean;
}

export function ElegantCardDisplay({ card, size = 'medium', spotlight = false }: ElegantCardDisplayProps) {
  return (
    <div className="relative inline-block">
      {/* Mystical spotlight effect */}
      {spotlight && (
        <div
          className="absolute -inset-10 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(212, 165, 116, 0.15) 0%, rgba(193, 127, 89, 0.08) 30%, transparent 60%)',
            filter: 'blur(12px)',
            animation: 'ethereal-pulse 3s ease-in-out infinite',
          }}
        />
      )}
      <Card card={card} size={size} />
    </div>
  );
}

export default Card;

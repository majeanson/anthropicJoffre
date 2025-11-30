/**
 * Card Component - Retro Gaming Edition
 *
 * Playing card component with distinctive retro arcade aesthetics.
 * Features neon glow effects for each suit color, pixel-perfect borders,
 * and satisfying hover/selection animations.
 *
 * Design Philosophy:
 * - Each suit has its own neon color that glows on hover
 * - Special cards (Red 0, Brown 0) have extra visual flair
 * - Playable cards pulse with inviting glow
 * - Non-playable cards are clearly dimmed
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

// Neon colors for each suit (matches skin CSS variables)
const suitNeonColors: Record<CardColor, {
  border: string;
  text: string;
  glow: string;
  glowHover: string;
}> = {
  red: {
    border: 'var(--color-suit-red)',
    text: 'var(--color-suit-red)',
    glow: '0 0 10px var(--color-suit-red)',
    glowHover: '0 0 20px var(--color-suit-red), 0 0 40px var(--color-suit-red)',
  },
  brown: {
    border: 'var(--color-suit-brown)',
    text: 'var(--color-suit-brown)',
    glow: '0 0 10px var(--color-suit-brown)',
    glowHover: '0 0 20px var(--color-suit-brown), 0 0 40px var(--color-suit-brown)',
  },
  green: {
    border: 'var(--color-suit-green)',
    text: 'var(--color-suit-green)',
    glow: '0 0 10px var(--color-suit-green)',
    glowHover: '0 0 20px var(--color-suit-green), 0 0 40px var(--color-suit-green)',
  },
  blue: {
    border: 'var(--color-suit-blue)',
    text: 'var(--color-suit-blue)',
    glow: '0 0 10px var(--color-suit-blue)',
    glowHover: '0 0 20px var(--color-suit-blue), 0 0 40px var(--color-suit-blue)',
  },
};

// Size configurations
const sizeStyles = {
  tiny: {
    container: 'w-14 h-20 sm:w-12 sm:h-20',
    text: 'text-base',
    cornerText: 'text-[10px]',
    emblem: 'w-7 h-7 sm:w-6 sm:h-6',
    badge: 'text-[8px] px-0.5',
    borderWidth: '2px',
  },
  small: {
    container: 'w-20 h-32 md:w-16 md:h-28',
    text: 'text-lg',
    cornerText: 'text-xs',
    emblem: 'w-12 h-12 md:w-10 md:h-10',
    badge: 'text-[9px] px-0.5',
    borderWidth: '3px',
  },
  medium: {
    container: 'w-24 h-36 md:w-20 md:h-32',
    text: 'text-2xl',
    cornerText: 'text-sm',
    emblem: 'w-14 h-14 md:w-12 md:h-12',
    badge: 'text-xs px-1',
    borderWidth: '4px',
  },
  large: {
    container: 'w-28 h-40 md:w-24 md:h-36',
    text: 'text-3xl',
    cornerText: 'text-base',
    emblem: 'w-18 h-18 md:w-16 md:h-16',
    badge: 'text-sm px-1.5',
    borderWidth: '4px',
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

  const suitStyle = suitNeonColors[card.color];
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

  // Card back design
  if (faceDown) {
    return (
      <div
        className={`
          ${sizeConfig.container}
          rounded-[var(--radius-lg)]
          bg-[var(--color-bg-tertiary)]
          border-[length:${sizeConfig.borderWidth}]
          border-[var(--color-border-default)]
          flex items-center justify-center
          relative overflow-hidden
        `}
        style={{
          background: `
            repeating-linear-gradient(
              45deg,
              var(--color-bg-tertiary),
              var(--color-bg-tertiary) 10px,
              var(--color-bg-secondary) 10px,
              var(--color-bg-secondary) 20px
            )
          `,
        }}
      >
        <div className="absolute inset-2 border-2 border-[var(--color-border-default)] rounded-[var(--radius-md)] opacity-50" />
        <span className="text-2xl opacity-30">?</span>
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
        transition-all duration-[var(--duration-fast)]
        relative overflow-hidden
        ${!disabled && onClick ? 'cursor-pointer' : 'cursor-default'}
        ${disabled ? 'opacity-40 grayscale' : ''}
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
          ? suitStyle.glowHover
          : disabled
            ? 'none'
            : suitStyle.glow,
        transform: isPlayable && !disabled ? 'translateY(-4px)' : undefined,
      }}
      onMouseEnter={(e) => {
        if (!disabled && onClick) {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = suitStyle.glowHover;
          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-8px) scale(1.05)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = isPlayable ? suitStyle.glowHover : suitStyle.glow;
          (e.currentTarget as HTMLButtonElement).style.transform = isPlayable ? 'translateY(-4px)' : '';
        }
      }}
    >
      {/* Playable indicator glow pulse */}
      {isPlayable && !disabled && (
        <div
          className="absolute inset-0 rounded-[var(--radius-lg)] pointer-events-none animate-pulse"
          style={{
            boxShadow: `inset 0 0 20px ${suitStyle.border}`,
            opacity: 0.3,
          }}
        />
      )}

      {/* Top-left value */}
      {!isSpecial && (
        <span
          className={`
            absolute top-1 left-1.5
            font-display font-bold
            ${sizeConfig.cornerText}
            drop-shadow-lg
          `}
          style={{ color: suitStyle.text }}
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
          ${isSpecial ? '' : 'opacity-90'}
          drop-shadow-lg
        `}
      />

      {/* Bottom-right value (rotated) */}
      {!isSpecial && (
        <span
          className={`
            absolute bottom-1 right-1.5
            font-display font-bold
            ${sizeConfig.cornerText}
            rotate-180
            drop-shadow-lg
          `}
          style={{ color: suitStyle.text }}
        >
          {card.value}
        </span>
      )}

      {/* Special card badge */}
      {isSpecial && (
        <span
          className={`
            absolute top-0.5 right-0.5
            ${sizeConfig.badge}
            font-display font-bold
            rounded-[var(--radius-sm)]
            ${card.color === 'red'
              ? 'bg-[var(--color-warning)] text-black shadow-[0_0_10px_var(--color-warning)]'
              : 'bg-[var(--color-error)] text-white shadow-[0_0_10px_var(--color-error)]'
            }
          `}
        >
          {card.color === 'red' ? '+5' : '-2'}
        </span>
      )}

      {/* Disabled overlay with X mark */}
      {disabled && onClick && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-[var(--radius-lg)]">
          <span className="text-[var(--color-error)] text-2xl font-display drop-shadow-lg">
            X
          </span>
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
        borderColor: teamColor ? teamColors[teamColor] : 'var(--color-border-default)',
        background: `
          repeating-linear-gradient(
            45deg,
            var(--color-bg-tertiary),
            var(--color-bg-tertiary) 8px,
            var(--color-bg-secondary) 8px,
            var(--color-bg-secondary) 16px
          )
        `,
        boxShadow: teamColor
          ? `0 0 10px ${teamColors[teamColor]}`
          : '0 0 5px var(--color-shadow)',
      }}
    >
      {/* Inner border */}
      <div
        className="absolute inset-2 border-2 rounded-[var(--radius-md)]"
        style={{
          borderColor: teamColor ? teamColors[teamColor] : 'var(--color-border-default)',
          opacity: 0.5,
        }}
      />

      {/* Center icon */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: teamColor ? teamColors[teamColor] : 'var(--color-border-accent)',
          boxShadow: teamColor
            ? `0 0 15px ${teamColors[teamColor]}`
            : '0 0 10px var(--color-glow)',
        }}
      >
        <span className="text-white font-display text-lg">J</span>
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

      {/* Card count badge */}
      {count > 0 && (
        <div
          className="absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center font-display text-xs"
          style={{
            backgroundColor: 'var(--color-bg-accent)',
            color: 'white',
            boxShadow: '0 0 10px var(--color-bg-accent)',
          }}
        >
          {count}
        </div>
      )}
    </div>
  );
}

export default Card;

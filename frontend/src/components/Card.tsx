import { memo, useMemo } from 'react';
import { Card as CardType, CardColor } from '../types/game';

interface CardProps {
  card: CardType;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  size?: 'tiny' | 'small' | 'medium' | 'large';
  isPlayable?: boolean; // Sprint 1 Phase 1: Indicate if card can be played
  isKeyboardSelected?: boolean; // Sprint 1 Phase 1: Keyboard navigation
}

// Card background color: #d6ccba (custom beige matching emblem aesthetics)
// Border colors use the actual card suit colors
const cardBackgroundColor = '#d6ccba';

const borderColorStyles: Record<CardColor, string> = {
  red: 'border-red-700',
  brown: 'border-amber-900',
  green: 'border-green-700',
  blue: 'border-blue-700',
};

// Number colors use the old vibrant card colors
const numberColorStyles: Record<CardColor, string> = {
  red: 'text-red-600',
  brown: 'text-amber-800',
  green: 'text-green-600',
  blue: 'text-blue-700',
};

const sizeStyles = {
  tiny: 'w-14 h-20 text-base sm:w-12 sm:h-20',
  small: 'w-20 h-32 text-lg md:w-16 md:h-28',
  medium: 'w-24 h-36 text-2xl md:w-20 md:h-32',
  large: 'w-28 h-40 text-3xl md:w-24 md:h-36',
};

const emblemSizeStyles = {
  tiny: 'w-7 h-7 sm:w-6 sm:h-6',
  small: 'w-12 h-12 md:w-10 md:h-10',
  medium: 'w-14 h-14 md:w-12 md:h-12',
  large: 'w-18 h-18 md:w-16 md:h-16',
};

function CardComponent({
  card,
  onClick,
  disabled,
  size = 'medium',
  isPlayable = false,
  isKeyboardSelected = false,
}: CardProps) {
  // Memoize expensive calculations
  const isSpecial = useMemo(
    () => (card.color === 'red' || card.color === 'brown') && card.value === 0,
    [card.color, card.value]
  );

  const badgeSize = useMemo(
    () => size === 'tiny' ? 'text-[8px] px-0.5' : size === 'small' ? 'text-[9px] px-0.5' : 'text-xs px-1',
    [size]
  );

  const borderWidth = useMemo(
    () => size === 'tiny' ? 'border-2' : size === 'small' ? 'border-3' : 'border-4',
    [size]
  );

  // Determine which image to show (using production images <95KB each for fast load)
  const cardImage = useMemo(() => {
    if (isSpecial) {
      // Use special bon images for red 0 and brown 0
      return `/cards/production/${card.color}_bon.jpg`;
    }
    // Use emblem for regular cards
    return `/cards/production/${card.color}_emblem.jpg`;
  }, [isSpecial, card.color]);


  // Generate aria-label for accessibility
  const ariaLabel = isSpecial
    ? `${card.color} special card (${card.color === 'red' ? '+5 points' : '-2 points'})`
    : `${card.color} ${card.value}`;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      data-testid={`card-${card.color}-${card.value}`}
      data-card-value={card.value}
      data-card-color={card.color}
      style={{ backgroundColor: cardBackgroundColor }}
      className={`
        ${borderColorStyles[card.color]}
        ${sizeStyles[size]}
        ${borderWidth} rounded-lg font-bold
        flex flex-col items-center justify-center gap-1
        transition-all duration-200
        ${!disabled && onClick ? 'cursor-pointer' : 'cursor-default'}
        ${disabled ? 'opacity-50' : ''}
        ${isPlayable && !disabled ? 'motion-safe:animate-card-glow-pulse' : ''}
        ${isKeyboardSelected ? 'motion-safe:animate-selection-ring' : ''}
        relative overflow-hidden
      `}
    >
      {/* Top value number */}
      {!isSpecial && (
        <span className={`absolute top-1 left-1 font-bold drop-shadow-sm ${numberColorStyles[card.color]}`}>
          {card.value}
        </span>
      )}

      {/* Center emblem or special card image */}
      <img
        src={cardImage}
        alt={`${card.color} ${isSpecial ? 'bon' : 'emblem'}`}
        decoding="async"
        className={`${emblemSizeStyles[size]} object-contain ${isSpecial ? '' : 'opacity-90'}`}
      />

      {/* Bottom value number */}
      {!isSpecial && (
        <span className={`absolute bottom-1 right-1 font-bold drop-shadow-sm rotate-180 ${numberColorStyles[card.color]}`}>
          {card.value}
        </span>
      )}

      {/* Special card badge */}
      {isSpecial && (
        <span className={`absolute top-0.5 right-0.5 ${badgeSize} bg-yellow-400 text-black rounded font-bold`}>
          {card.color === 'red' ? '+5' : '-2'}
        </span>
      )}
    </button>
  );
}

// Custom comparison function for React.memo
// Only re-render if card, disabled, size, or new Sprint 1 props change
function arePropsEqual(prevProps: CardProps, nextProps: CardProps) {
  return (
    prevProps.card.color === nextProps.card.color &&
    prevProps.card.value === nextProps.card.value &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.size === nextProps.size &&
    prevProps.onClick === nextProps.onClick &&
    prevProps.isPlayable === nextProps.isPlayable &&
    prevProps.isKeyboardSelected === nextProps.isKeyboardSelected
  );
}

// Export memoized component for better performance
// This prevents re-renders when parent components update unnecessarily
export const Card = memo(CardComponent, arePropsEqual);

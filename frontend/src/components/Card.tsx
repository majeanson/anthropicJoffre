import { memo, useMemo } from 'react';
import { Card as CardType, CardColor } from '../types/game';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'tiny' | 'small' | 'medium' | 'large';
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
  tiny: 'w-12 h-20 text-base',
  small: 'w-16 h-28 text-lg',
  medium: 'w-20 h-32 text-2xl',
  large: 'w-24 h-36 text-3xl',
};

const emblemSizeStyles = {
  tiny: 'w-6 h-6',
  small: 'w-10 h-10',
  medium: 'w-12 h-12',
  large: 'w-16 h-16',
};

function CardComponent({ card, onClick, disabled, size = 'medium' }: CardProps) {
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

  // Determine which image to show
  const cardImage = useMemo(() => {
    if (isSpecial) {
      // Use special bon images for red 0 and brown 0
      return `/cards/${card.color}_bon.jpg`;
    }
    // Use emblem for regular cards
    return `/cards/${card.color}_emblem.jpg`;
  }, [isSpecial, card.color]);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
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
        ${!disabled && onClick ? 'hover:scale-105 hover:shadow-xl cursor-pointer' : 'cursor-default'}
        ${disabled ? 'opacity-50' : ''}
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
// Only re-render if card, disabled, or size changes
function arePropsEqual(prevProps: CardProps, nextProps: CardProps) {
  return (
    prevProps.card.color === nextProps.card.color &&
    prevProps.card.value === nextProps.card.value &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.size === nextProps.size &&
    prevProps.onClick === nextProps.onClick
  );
}

// Export memoized component for better performance
// This prevents re-renders when parent components update unnecessarily
export const Card = memo(CardComponent, arePropsEqual);

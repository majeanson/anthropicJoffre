import { Card as CardType, CardColor } from '../types/game';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'tiny' | 'small' | 'medium' | 'large';
}

const colorStyles: Record<CardColor, string> = {
  red: 'bg-red-500 border-red-700',
  brown: 'bg-amber-700 border-amber-900',
  green: 'bg-green-500 border-green-700',
  blue: 'bg-blue-500 border-blue-700',
};

const sizeStyles = {
  tiny: 'w-12 h-20 text-base',
  small: 'w-16 h-28 text-lg',
  medium: 'w-20 h-32 text-2xl',
  large: 'w-24 h-36 text-3xl',
};

export function Card({ card, onClick, disabled, size = 'medium' }: CardProps) {
  const isSpecial = (card.color === 'red' || card.color === 'brown') && card.value === 0;
  const badgeSize = size === 'tiny' ? 'text-[8px] px-0.5' : size === 'small' ? 'text-[9px] px-0.5' : 'text-xs px-1';
  const borderWidth = size === 'tiny' ? 'border-2' : size === 'small' ? 'border-3' : 'border-4';
  const ringWidth = size === 'tiny' ? 'ring-2' : size === 'small' ? 'ring-2' : 'ring-4';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={`card-${card.color}-${card.value}`}
      data-card-value={card.value}
      data-card-color={card.color}
      className={`
        ${colorStyles[card.color]}
        ${sizeStyles[size]}
        ${borderWidth} rounded-lg font-bold text-white
        flex items-center justify-center
        transition-all duration-200
        ${!disabled && onClick ? 'hover:scale-105 hover:shadow-xl cursor-pointer' : 'cursor-default'}
        ${disabled ? 'opacity-50' : ''}
        ${isSpecial ? `${ringWidth} ring-yellow-400` : ''}
        relative
      `}
    >
      <span>{card.value}</span>
      {isSpecial && (
        <span className={`absolute top-0.5 right-0.5 ${badgeSize} bg-yellow-400 text-black rounded`}>
          {card.color === 'red' ? '+5' : '-2'}
        </span>
      )}
    </button>
  );
}

import { Card as CardType, CardColor } from '../types/game';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const colorStyles: Record<CardColor, string> = {
  red: 'bg-red-500 border-red-700',
  brown: 'bg-amber-700 border-amber-900',
  green: 'bg-green-500 border-green-700',
  blue: 'bg-blue-500 border-blue-700',
};

const sizeStyles = {
  small: 'w-16 h-24 text-lg',
  medium: 'w-20 h-32 text-2xl',
  large: 'w-24 h-36 text-3xl',
};

export function Card({ card, onClick, disabled, size = 'medium' }: CardProps) {
  const isSpecial = (card.color === 'red' || card.color === 'brown') && card.value === 0;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${colorStyles[card.color]}
        ${sizeStyles[size]}
        border-4 rounded-lg font-bold text-white
        flex items-center justify-center
        transition-all duration-200
        ${!disabled && onClick ? 'hover:scale-105 hover:shadow-xl cursor-pointer' : 'cursor-default'}
        ${disabled ? 'opacity-50' : ''}
        ${isSpecial ? 'ring-4 ring-yellow-400' : ''}
        relative
      `}
    >
      <span>{card.value}</span>
      {isSpecial && (
        <span className="absolute top-1 right-1 text-xs bg-yellow-400 text-black px-1 rounded">
          {card.color === 'red' ? '+5' : '-2'}
        </span>
      )}
    </button>
  );
}

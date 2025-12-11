/**
 * CardStack Component
 * Displays a stack of face-down cards with count badge (for deck visualization)
 */

import { CardBack } from './CardBack';

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
          className="absolute card-stack-offset"
          style={{ '--stack-index': index } as React.CSSProperties}
        >
          <CardBack size={size} />
        </div>
      ))}

      {/* Card count badge */}
      {count > 0 && (
        <div className="absolute -top-2 -right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center font-display text-xs font-bold card-count-badge">
          {count}
        </div>
      )}
    </div>
  );
}

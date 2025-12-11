/**
 * ElegantCardDisplay Component
 * Showcases a single card with optional spotlight effect
 * Used for displaying featured cards in UI
 */

import { Card as CardType } from '../../types/game';
import { Card } from './Card';

interface ElegantCardDisplayProps {
  card: CardType;
  size?: 'small' | 'medium' | 'large';
  /** Add dramatic spotlight effect */
  spotlight?: boolean;
}

export function ElegantCardDisplay({
  card,
  size = 'medium',
  spotlight = false,
}: ElegantCardDisplayProps) {
  return (
    <div className="relative inline-block">
      {/* Spotlight effect */}
      {spotlight && (
        <div className="absolute -inset-10 rounded-full pointer-events-none card-spotlight" />
      )}
      <Card card={card} size={size} />
    </div>
  );
}

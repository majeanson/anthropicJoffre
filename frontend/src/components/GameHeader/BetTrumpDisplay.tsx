/**
 * BetTrumpDisplay Component
 *
 * Displays current highest bet and trump suit indicator.
 * Uses CSS variables for skin-compatible colors.
 */

import { memo } from 'react';
import { CardColor } from '../../types/game';

interface BetTrumpDisplayProps {
  /** Current highest bet info */
  highestBet?: { amount: number; withoutTrump: boolean; playerId: string };
  /** Current trump suit */
  trump?: CardColor | null;
  /** Mobile variant (more compact) */
  mobile?: boolean;
}

// Helper to get trump color using CSS variables for skin compatibility
function getTrumpColorStyle(color: CardColor | null | undefined): React.CSSProperties {
  if (!color) return { backgroundColor: 'var(--color-text-muted)' };
  const colorMap: Record<CardColor, string> = {
    red: 'var(--color-suit-red)',
    brown: 'var(--color-suit-brown)',
    green: 'var(--color-suit-green)',
    blue: 'var(--color-suit-blue)',
  };
  return { backgroundColor: colorMap[color] };
}

function getTrumpColorName(color: CardColor | null | undefined): string {
  if (!color) return '?';
  return color.charAt(0).toUpperCase() + color.slice(1);
}

function BetTrumpDisplayComponent({ highestBet, trump, mobile = false }: BetTrumpDisplayProps) {
  if (!highestBet && !trump) return null;

  if (mobile) {
    return (
      <div
        className="flex items-center gap-0.5 px-1.5 py-1 rounded-[var(--radius-md)] backdrop-blur-sm flex-shrink-0 bg-skin-tertiary"
        title={
          highestBet
            ? `Bet: ${highestBet.amount}${highestBet.withoutTrump ? ' (No Trump = 2x points)' : ''}${trump ? ` | Trump: ${getTrumpColorName(trump)}` : ''}`
            : trump
              ? `Trump: ${getTrumpColorName(trump)}`
              : undefined
        }
        aria-label={
          highestBet
            ? `Current bet: ${highestBet.amount} points${highestBet.withoutTrump ? ', without trump doubles points' : ''}${trump ? `, Trump suit: ${getTrumpColorName(trump)}` : ''}`
            : trump
              ? `Trump suit: ${getTrumpColorName(trump)}`
              : undefined
        }
      >
        {highestBet && (
          <span className="text-[10px] font-bold text-skin-primary">
            {highestBet.amount}
            {highestBet.withoutTrump && (
              <span className="text-skin-warning" title="No Trump = 2x points">
                !
              </span>
            )}
          </span>
        )}
        {trump && (
          <div
            className="w-2.5 h-2.5 rounded-sm"
            style={getTrumpColorStyle(trump)}
            title={getTrumpColorName(trump)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-md)] backdrop-blur-sm flex-shrink-0 bg-skin-tertiary">
      {highestBet && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-skin-muted">Bet:</span>
          <span className="text-xs font-bold text-skin-primary">{highestBet.amount}</span>
          {highestBet.withoutTrump && (
            <span
              className="text-xs font-bold text-skin-warning"
              title="No Trump = 2x points (if met, double points; if lost, double penalty)"
            >
              !
            </span>
          )}
        </div>
      )}
      {highestBet && trump && <span className="text-skin-muted">|</span>}
      {trump && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-skin-muted">Trump:</span>
          <div
            className="w-3 h-3 rounded-sm"
            style={getTrumpColorStyle(trump)}
            title={`Trump suit: ${getTrumpColorName(trump)} (trumps beat other suits)`}
          />
        </div>
      )}
    </div>
  );
}

export const BetTrumpDisplay = memo(BetTrumpDisplayComponent);

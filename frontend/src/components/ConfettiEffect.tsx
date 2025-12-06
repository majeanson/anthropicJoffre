/**
 * WinnerEffect Component (formerly ConfettiEffect)
 * Sprint 1 Phase 3: Trick Winner Celebrations
 *
 * Sparkle burst animation for trick winner celebration
 * Special effects for Red 0 (+6 pts) and Brown 0 (-1 pts)
 * GPU-accelerated CSS animations
 */

import { useMemo } from 'react';
import { useSettings } from '../contexts/SettingsContext';

type PlayerPosition = 'bottom' | 'left' | 'top' | 'right';

interface ConfettiEffectProps {
  teamColor: 'orange' | 'purple';
  duration?: number;
  position?: PlayerPosition;
  points?: number;
}

interface Sparkle {
  id: number;
  angle: number;
  delay: number;
  size: number;
  type: 'star' | 'circle' | 'diamond';
}

export function ConfettiEffect({
  teamColor,
  duration = 1500,
  position = 'bottom',
  points = 1,
}: ConfettiEffectProps) {
  const { animationsEnabled } = useSettings();

  // Don't render if animations are disabled
  if (!animationsEnabled) return null;

  // Determine effect type based on points
  // Red 0: +6 points (5 bonus + 1 trick)
  // Brown 0: -1 points (-2 penalty + 1 trick)
  const isRedZero = points >= 6;
  const isBrownZero = points < 0;
  const isSpecialCard = isRedZero || isBrownZero;

  // Get CSS variables for skin-aware colors
  const root = getComputedStyle(document.documentElement);
  const suitRed = root.getPropertyValue('--color-suit-red').trim() || '#ef4444';
  const suitBrown = root.getPropertyValue('--color-suit-brown').trim() || '#92400e';
  const team1Color = root.getPropertyValue('--color-team1-primary').trim() || '#f97316';
  const team2Color = root.getPropertyValue('--color-team2-primary').trim() || '#a855f7';
  const accentGold = root.getPropertyValue('--color-warning').trim() || '#fbbf24';

  // Colors based on card type
  let primaryColor: string;
  let accentColor: string;

  if (isRedZero) {
    // Red 0 - golden/red celebration
    primaryColor = suitRed;
    accentColor = accentGold;
  } else if (isBrownZero) {
    // Brown 0 - brown/dark effect
    primaryColor = suitBrown;
    accentColor = suitBrown;
  } else {
    // Normal - team colors from CSS variables
    primaryColor = teamColor === 'orange' ? team1Color : team2Color;
    accentColor = accentGold;
  }

  // Generate sparkles - more for special cards
  const sparkles: Sparkle[] = useMemo(() => {
    const items: Sparkle[] = [];
    const count = isSpecialCard ? 12 : 8;

    for (let i = 0; i < count; i++) {
      items.push({
        id: i,
        angle: (360 / count) * i,
        delay: i * 0.02,
        size: isSpecialCard ? 10 + Math.random() * 8 : 8 + Math.random() * 6,
        type: i % 3 === 0 ? 'star' : i % 3 === 1 ? 'diamond' : 'circle',
      });
    }
    return items;
  }, [isSpecialCard]);

  // Position at the winning card's location
  const positionClasses = {
    bottom: 'bottom-16 left-1/2 -translate-x-1/2',
    left: 'top-1/2 left-16 -translate-y-1/2',
    top: 'top-16 left-1/2 -translate-x-1/2',
    right: 'top-1/2 right-16 -translate-y-1/2',
  };

  const renderShape = (type: string, size: number, color: string) => {
    if (type === 'star') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    }
    if (type === 'diamond') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <path d="M12 2L2 12l10 10 10-10L12 2z" />
        </svg>
      );
    }
    // circle
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: color,
        }}
      />
    );
  };

  // Special icon for red/brown 0
  const renderSpecialIcon = () => {
    if (isRedZero) {
      return <div className="text-2xl animate-bounce">💎</div>;
    }
    if (isBrownZero) {
      return <div className="text-2xl">💩</div>;
    }
    return null;
  };

  const effectDuration = isSpecialCard ? duration * 1.2 : duration;

  return (
    <div
      className={`absolute ${positionClasses[position]} pointer-events-none z-[60] w-[140px] h-[140px]`}
    >
      {/* Special card icon */}
      {isSpecialCard && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
          style={{
            animation: `special-icon ${effectDuration}ms ease-out forwards`,
          }}
        >
          {renderSpecialIcon()}
        </div>
      )}

      {/* Center glow - bigger for special cards */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: isSpecialCard ? 60 : 40,
          height: isSpecialCard ? 60 : 40,
          background: isRedZero
            ? `radial-gradient(circle, ${accentGold}80 0%, ${suitRed}40 50%, transparent 70%)`
            : isBrownZero
              ? `radial-gradient(circle, ${suitBrown}60 0%, ${suitBrown}40 50%, transparent 70%)`
              : `radial-gradient(circle, ${primaryColor}80 0%, transparent 70%)`,
          animation: `pulse-glow ${effectDuration}ms ease-out forwards`,
        }}
      />

      {/* Radiating sparkles */}
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="absolute top-1/2 left-1/2"
          style={{
            transform: `translate(-50%, -50%) rotate(${sparkle.angle}deg)`,
          }}
        >
          <div
            style={{
              animation: `sparkle-burst ${effectDuration}ms ease-out ${sparkle.delay}s forwards`,
              opacity: 0,
            }}
          >
            {renderShape(
              sparkle.type,
              sparkle.size,
              sparkle.id % 2 === 0 ? primaryColor : accentColor
            )}
          </div>
        </div>
      ))}

      {/* Ring burst - double ring for special cards */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
        style={{
          borderColor: primaryColor,
          animation: `ring-expand ${effectDuration}ms ease-out forwards`,
          width: 20,
          height: 20,
        }}
      />

      {isSpecialCard && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
          style={{
            borderColor: accentColor,
            animation: `ring-expand ${effectDuration}ms ease-out 0.1s forwards`,
            width: 20,
            height: 20,
          }}
        />
      )}

      <style>{`
        @keyframes sparkle-burst {
          0% {
            transform: translateY(0);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translateY(-60px);
            opacity: 0;
          }
        }
        @keyframes pulse-glow {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 1;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0.8;
          }
          100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
          }
        }
        @keyframes ring-expand {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(5);
            opacity: 0;
          }
        }
        @keyframes special-icon {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
          }
          30% {
            transform: translate(-50%, -50%) scale(1.3);
            opacity: 1;
          }
          60% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

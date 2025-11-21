/**
 * ConfettiEffect Component
 * Sprint 1 Phase 3: Trick Winner Celebrations
 *
 * CSS-based confetti animation for trick winner celebration
 * GPU-accelerated for better performance
 */

import { useMemo } from 'react';
import { useSettings } from '../contexts/SettingsContext';

type PlayerPosition = 'bottom' | 'left' | 'top' | 'right';

interface ConfettiEffectProps {
  teamColor: 'orange' | 'purple';
  duration?: number;
  position?: PlayerPosition;
}

interface ConfettiPiece {
  id: number;
  color: string;
  left: number;
  delay: number;
  rotation: number;
  scale: number;
}

export function ConfettiEffect({ teamColor, duration = 2000, position = 'bottom' }: ConfettiEffectProps) {
  const { animationsEnabled } = useSettings();

  // Don't render if animations are disabled
  if (!animationsEnabled) return null;

  // Team colors
  const colors = teamColor === 'orange'
    ? ['#ea580c', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5']
    : ['#9333ea', '#c084fc', '#d8b4fe', '#e9d5ff', '#f3e8ff'];

  // Generate confetti pieces (memoized to avoid re-renders)
  const confettiPieces: ConfettiPiece[] = useMemo(() => {
    const pieces: ConfettiPiece[] = [];
    const count = 12; // Reduced count for performance

    for (let i = 0; i < count; i++) {
      pieces.push({
        id: i,
        color: colors[i % colors.length],
        left: 20 + (i * 60 / count), // Spread across container
        delay: i * 0.05, // Stagger animation
        rotation: Math.random() * 360,
        scale: 0.8 + Math.random() * 0.4,
      });
    }
    return pieces;
  }, [teamColor]);

  // Position the confetti at the winning card's location
  const positionClasses = {
    bottom: 'bottom-12 left-1/2 -translate-x-1/2',
    left: 'top-1/2 left-12 -translate-y-1/2',
    top: 'top-12 left-1/2 -translate-x-1/2',
    right: 'top-1/2 right-12 -translate-y-1/2',
  };

  return (
    <div
      className={`absolute ${positionClasses[position]} pointer-events-none z-[60] w-24 h-24`}
      style={{
        animation: `confetti-container ${duration}ms ease-out forwards`,
      }}
    >
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-2 h-2 rounded-sm"
          style={{
            backgroundColor: piece.color,
            left: `${piece.left}%`,
            top: '50%',
            transform: `rotate(${piece.rotation}deg) scale(${piece.scale})`,
            animation: `confetti-fall ${duration}ms ease-out ${piece.delay}s forwards`,
            opacity: 0.9,
          }}
        />
      ))}

      {/* Inline keyframes for the animation */}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(80px) rotate(720deg) scale(0.5);
            opacity: 0;
          }
        }
        @keyframes confetti-container {
          0% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

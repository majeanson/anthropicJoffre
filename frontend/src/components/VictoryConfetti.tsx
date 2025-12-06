/**
 * VictoryConfetti Component
 * Full-screen confetti celebration for game over screen
 * Uses CSS animations for performance
 */

import { useMemo, useEffect, useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotation: number;
  shape: 'square' | 'circle' | 'star';
}

interface VictoryConfettiProps {
  teamColor: 'orange' | 'purple';
  duration?: number;
}

export function VictoryConfetti({ teamColor, duration = 4000 }: VictoryConfettiProps) {
  const { animationsEnabled } = useSettings();
  const [visible, setVisible] = useState(true);

  // Hide after duration
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  // Don't render if animations disabled or duration expired
  if (!animationsEnabled || !visible) return null;

  // Team-based color palette
  const colors =
    teamColor === 'orange'
      ? ['#f97316', '#fb923c', '#fbbf24', '#fcd34d', '#ffffff']
      : ['#a855f7', '#c084fc', '#e879f9', '#f0abfc', '#ffffff'];

  // Generate confetti pieces
  const pieces: ConfettiPiece[] = useMemo(() => {
    const items: ConfettiPiece[] = [];
    const count = 50;

    for (let i = 0; i < count; i++) {
      items.push({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 8 + Math.random() * 12,
        rotation: Math.random() * 360,
        shape: ['square', 'circle', 'star'][Math.floor(Math.random() * 3)] as
          | 'square'
          | 'circle'
          | 'star',
      });
    }
    return items;
  }, []);

  const renderShape = (piece: ConfettiPiece) => {
    if (piece.shape === 'star') {
      return (
        <svg width={piece.size} height={piece.size} viewBox="0 0 24 24" fill={piece.color}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    }
    if (piece.shape === 'circle') {
      return (
        <div
          className="rounded-full"
          style={{
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
          }}
        />
      );
    }
    // square
    return (
      <div
        style={{
          width: piece.size,
          height: piece.size,
          backgroundColor: piece.color,
        }}
      />
    );
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute opacity-0 -top-5"
          style={{
            left: `${piece.x}%`,
            transform: `rotate(${piece.rotation}deg)`,
            animation: `confetti-fall ${piece.duration}s ease-out ${piece.delay}s forwards`,
          }}
        >
          {renderShape(piece)}
        </div>
      ))}

      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

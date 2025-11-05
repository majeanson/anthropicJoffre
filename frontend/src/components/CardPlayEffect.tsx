/**
 * CardPlayEffect Component
 * Sprint 1 Phase 2: Play Confirmation Animations
 *
 * Shows a particle burst effect when a card is played
 */

import { useEffect, useState } from 'react';
import { Card as CardType } from '../types/game';

interface CardPlayEffectProps {
  card: CardType;
  position: { x: number; y: number };
  onComplete: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
}

const PARTICLE_COUNT = 12;

export function CardPlayEffect({ card, position, onComplete }: CardPlayEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate particles in a radial pattern
    const newParticles: Particle[] = [];
    const colors = {
      red: '#dc2626',
      brown: '#b45309',
      green: '#16a34a',
      blue: '#2563eb',
    };

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
      const distance = 50 + Math.random() * 30; // 50-80px radius
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;

      newParticles.push({
        id: i,
        x,
        y,
        color: colors[card.color],
      });
    }

    setParticles(newParticles);

    // Clean up after animation completes
    const timer = setTimeout(() => {
      onComplete();
    }, 600);

    return () => clearTimeout(timer);
  }, [card.color, onComplete]);

  return (
    <div
      className="fixed pointer-events-none z-[10000]"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-3 h-3 rounded-full motion-safe:animate-particle-burst motion-reduce:opacity-0"
          style={{
            backgroundColor: particle.color,
            '--particle-x': `${particle.x}px`,
            '--particle-y': `${particle.y}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

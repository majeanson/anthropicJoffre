/**
 * ConfettiEffect Component
 * Sprint 1 Phase 3: Trick Winner Celebrations
 *
 * Canvas-based confetti animation for trick winner celebration
 * Positioned and spreading from the winning card's position in the circular layout
 */

import { useEffect, useRef } from 'react';
import { useSettings } from '../contexts/SettingsContext';

type PlayerPosition = 'bottom' | 'left' | 'top' | 'right';

interface ConfettiEffectProps {
  teamColor: 'orange' | 'purple';
  duration?: number;
  position?: PlayerPosition;
}

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  size: number;
}

export function ConfettiEffect({ teamColor, duration = 2000, position = 'bottom' }: ConfettiEffectProps) {
  const { animationsEnabled } = useSettings();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Don't render if animations are disabled
  if (!animationsEnabled) return null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Small canvas size to cover trick area only
    const canvasWidth = 250;
    const canvasHeight = 200;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Team colors
    const colors = teamColor === 'orange'
      ? ['#ea580c', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5']
      : ['#9333ea', '#c084fc', '#d8b4fe', '#e9d5ff', '#f3e8ff'];

    // Create confetti particles spreading from the center (where the winning card is)
    const particles: ConfettiParticle[] = [];
    const particleCount = 20; // Increased for more visible effect
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 3 + 2;

      particles.push({
        x: centerX + (Math.random() - 0.5) * 20, // Start near center
        y: centerY + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed, // Radial spread
        vy: Math.sin(angle) * speed,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 3,
      });
    }

    let animationId: number;
    const startTime = Date.now();

    function animate() {
      if (!canvas || !ctx) return;

      const elapsed = Date.now() - startTime;
      if (elapsed > duration) {
        return; // Stop animation after duration
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.rotation += particle.rotationSpeed;

        // Add gravity
        particle.vy += 0.1;

        // Draw particle
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate((particle.rotation * Math.PI) / 180);
        ctx.fillStyle = particle.color;
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size / 2);
        ctx.restore();

        // Wrap around horizontally
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.x < 0) particle.x = canvas.width;
      });

      animationId = requestAnimationFrame(animate);
    }

    animate();

    // Cleanup
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [teamColor, duration]);

  // Position the confetti canvas at the winning card's location in the circular layout
  const positionClasses = {
    bottom: 'top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2', // At bottom card
    left: 'top-1/2 left-[20%] -translate-x-1/2 -translate-y-1/2', // At left card
    top: 'top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2', // At top card
    right: 'top-1/2 right-[20%] translate-x-1/2 -translate-y-1/2', // At right card
  };

  return (
    <canvas
      ref={canvasRef}
      className={`fixed ${positionClasses[position]} pointer-events-none z-[9998] motion-reduce:hidden w-[250px] h-[200px]`}
      style={{ opacity: 0.9, backgroundColor: 'transparent' }}
    />
  );
}

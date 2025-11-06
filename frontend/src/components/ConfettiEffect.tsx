/**
 * ConfettiEffect Component
 * Sprint 1 Phase 3: Trick Winner Celebrations
 *
 * Canvas-based confetti animation for trick winner celebration
 * Positioned above the winning player in a minimal size
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

    // Minimal canvas size (much smaller)
    const canvasWidth = 200;
    const canvasHeight = 150;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Team colors
    const colors = teamColor === 'orange'
      ? ['#ea580c', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5']
      : ['#9333ea', '#c084fc', '#d8b4fe', '#e9d5ff', '#f3e8ff'];

    // Create confetti particles (minimal count for small area)
    const particles: ConfettiParticle[] = [];
    const particleCount = 25; // Reduced from 50

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 3, // Reduced speed
        vy: Math.random() * 2 + 1.5,   // Reduced speed
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8, // Reduced rotation
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 3, // Smaller particles
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
  }, [teamColor, duration, position]);

  // Position classes based on player position
  const positionClasses = {
    bottom: 'bottom-[30%] left-1/2 -translate-x-1/2', // Above bottom player
    left: 'top-1/2 left-[15%] -translate-y-1/2',      // Above left player
    top: 'top-[15%] left-1/2 -translate-x-1/2',       // Above top player
    right: 'top-1/2 right-[15%] -translate-y-1/2',    // Above right player
  };

  return (
    <canvas
      ref={canvasRef}
      className={`fixed ${positionClasses[position]} pointer-events-none z-[9998] motion-reduce:hidden w-[200px] h-[150px]`}
      style={{ opacity: 0.9, backgroundColor: 'transparent' }}
    />
  );
}

/**
 * ConfettiEffect Component
 * Sprint 1 Phase 3: Trick Winner Celebrations
 *
 * Canvas-based confetti animation for trick winner celebration
 */

import { useEffect, useRef } from 'react';
import { useSettings } from '../contexts/SettingsContext';

interface ConfettiEffectProps {
  teamColor: 'orange' | 'purple';
  duration?: number;
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

export function ConfettiEffect({ teamColor, duration = 2000 }: ConfettiEffectProps) {
  const { animationsEnabled } = useSettings();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Don't render if animations are disabled
  if (!animationsEnabled) return null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to a smaller area (centered)
    const canvasWidth = Math.min(600, window.innerWidth * 0.8);
    const canvasHeight = Math.min(400, window.innerHeight * 0.6);
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Team colors
    const colors = teamColor === 'orange'
      ? ['#ea580c', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5']
      : ['#9333ea', '#c084fc', '#d8b4fe', '#e9d5ff', '#f3e8ff'];

    // Create confetti particles (reduced count for smaller area)
    const particles: ConfettiParticle[] = [];
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 10 + 5,
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

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[9998] motion-reduce:hidden max-w-[600px] max-h-[400px]"
      style={{ mixBlendMode: 'multiply' }}
    />
  );
}

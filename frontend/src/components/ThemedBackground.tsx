/**
 * ThemedBackground Component
 *
 * Renders ambient visual effects based on the current skin theme.
 * Effects are purely decorative and rendered in a fixed position behind content.
 *
 * Effects per skin:
 * - Tavern Noir: Floating candle flames, smoke wisps
 * - Midnight Alchemy: Glowing particles, mystical orbs
 * - Luxury Casino: Golden sparkles, light rays
 * - Cyberpunk Neon: Digital rain, glitch effects
 * - Ocean Depths: Bubbles, light rays through water
 * - Forest Enchanted: Floating leaves, fireflies
 * - Sakura Spring: Cherry blossom petals
 * - Classic Parchment: Dust motes, aged paper texture
 * - Modern Minimal: Subtle geometric shapes
 */

import { useEffect, useState, useRef, memo, useMemo } from 'react';
import { useSkin } from '../contexts/SkinContext';
import { useSettings } from '../contexts/SettingsContext';
import type { SkinId } from '../config/skins';

// ============================================================================
// TYPES
// ============================================================================

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  delay: number;
  duration: number;
  // Type-specific properties
  wobble?: number;
  color?: string;
  rotation?: number;
  scale?: number;
}

interface EffectConfig {
  particleCount: number;
  className: string;
  generateParticle: (index: number) => Particle;
  renderParticle: (particle: Particle) => React.ReactNode;
}

// ============================================================================
// EFFECT CONFIGURATIONS
// ============================================================================

const getEffectConfig = (skinId: SkinId): EffectConfig | null => {
  switch (skinId) {
    case 'tavern-noir':
      return {
        particleCount: 12,
        className: 'tavern-noir-effects',
        generateParticle: (i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: 4 + Math.random() * 4,
          opacity: 0.3 + Math.random() * 0.4,
          speed: 8 + Math.random() * 6,
          delay: Math.random() * 5,
          duration: 8 + Math.random() * 4,
          wobble: Math.random() * 20 - 10,
          color: i % 3 === 0 ? '#fbbf24' : i % 3 === 1 ? '#f59e0b' : '#d97706',
        }),
        renderParticle: (p) => (
          <div
            key={p.id}
            className="absolute animate-candle-flicker"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size * 1.5,
              background: `radial-gradient(ellipse at center, ${p.color} 0%, transparent 70%)`,
              opacity: p.opacity,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              filter: `blur(${p.size / 4}px)`,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            }}
          />
        ),
      };

    case 'midnight-alchemy':
      return {
        particleCount: 20,
        className: 'midnight-alchemy-effects',
        generateParticle: (i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: 2 + Math.random() * 4,
          opacity: 0.2 + Math.random() * 0.5,
          speed: 15 + Math.random() * 10,
          delay: Math.random() * 8,
          duration: 15 + Math.random() * 10,
          color: i % 4 === 0 ? '#a78bfa' : i % 4 === 1 ? '#8b5cf6' : i % 4 === 2 ? '#7c3aed' : '#6366f1',
        }),
        renderParticle: (p) => (
          <div
            key={p.id}
            className="absolute rounded-full animate-float-up"
            style={{
              left: `${p.x}%`,
              bottom: `-${p.size}px`,
              width: p.size,
              height: p.size,
              background: p.color,
              opacity: p.opacity,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            }}
          />
        ),
      };

    case 'luxury-casino':
      return {
        particleCount: 15,
        className: 'luxury-casino-effects',
        generateParticle: (i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: 2 + Math.random() * 3,
          opacity: 0.3 + Math.random() * 0.4,
          speed: 3 + Math.random() * 2,
          delay: Math.random() * 10,
          duration: 3 + Math.random() * 2,
          rotation: Math.random() * 360,
        }),
        renderParticle: (p) => (
          <div
            key={p.id}
            className="absolute animate-sparkle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              background: 'linear-gradient(45deg, #fbbf24, #f59e0b, #fcd34d)',
              opacity: p.opacity,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              transform: `rotate(${p.rotation}deg)`,
              clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
            }}
          />
        ),
      };

    case 'cyberpunk-neon':
      return {
        particleCount: 30,
        className: 'cyberpunk-effects',
        generateParticle: (i) => ({
          id: i,
          x: Math.random() * 100,
          y: -10,
          size: 1 + Math.random() * 2,
          opacity: 0.4 + Math.random() * 0.4,
          speed: 2 + Math.random() * 3,
          delay: Math.random() * 5,
          duration: 2 + Math.random() * 3,
          color: i % 3 === 0 ? '#0ff' : i % 3 === 1 ? '#f0f' : '#ff0',
        }),
        renderParticle: (p) => (
          <div
            key={p.id}
            className="absolute animate-digital-rain"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: 20 + Math.random() * 30,
              background: `linear-gradient(to bottom, ${p.color}, transparent)`,
              opacity: p.opacity,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ),
      };

    case 'ocean-depths':
      return {
        particleCount: 18,
        className: 'ocean-depths-effects',
        generateParticle: (i) => ({
          id: i,
          x: Math.random() * 100,
          y: 100 + Math.random() * 20,
          size: 3 + Math.random() * 6,
          opacity: 0.2 + Math.random() * 0.3,
          speed: 10 + Math.random() * 8,
          delay: Math.random() * 10,
          duration: 10 + Math.random() * 8,
          wobble: Math.random() * 40 - 20,
        }),
        renderParticle: (p) => (
          <div
            key={p.id}
            className="absolute rounded-full animate-bubble-rise"
            style={{
              left: `${p.x}%`,
              bottom: `-${p.size}px`,
              width: p.size,
              height: p.size,
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), rgba(100,200,255,0.2))',
              opacity: p.opacity,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              '--wobble': `${p.wobble}px`,
            } as React.CSSProperties}
          />
        ),
      };

    case 'forest-enchanted':
      return {
        particleCount: 25,
        className: 'forest-enchanted-effects',
        generateParticle: (i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: 2 + Math.random() * 3,
          opacity: 0.3 + Math.random() * 0.5,
          speed: 4 + Math.random() * 3,
          delay: Math.random() * 8,
          duration: 4 + Math.random() * 3,
          color: i % 2 === 0 ? '#84cc16' : '#fef08a',
        }),
        renderParticle: (p) => (
          <div
            key={p.id}
            className="absolute rounded-full animate-firefly"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              background: p.color,
              opacity: p.opacity,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            }}
          />
        ),
      };

    case 'sakura-spring':
      return {
        particleCount: 20,
        className: 'sakura-effects',
        generateParticle: (i) => ({
          id: i,
          x: -5 + Math.random() * 110,
          y: -10,
          size: 8 + Math.random() * 8,
          opacity: 0.4 + Math.random() * 0.4,
          speed: 12 + Math.random() * 8,
          delay: Math.random() * 10,
          duration: 12 + Math.random() * 8,
          rotation: Math.random() * 360,
          wobble: Math.random() * 100 - 50,
          color: i % 3 === 0 ? '#fce7f3' : i % 3 === 1 ? '#fbcfe8' : '#f9a8d4',
        }),
        renderParticle: (p) => (
          <div
            key={p.id}
            className="absolute animate-petal-fall"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              background: p.color,
              opacity: p.opacity,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              borderRadius: '50% 0 50% 50%',
              transform: `rotate(${p.rotation}deg)`,
              '--wobble': `${p.wobble}px`,
            } as React.CSSProperties}
          />
        ),
      };

    case 'classic-parchment':
      return {
        particleCount: 15,
        className: 'parchment-effects',
        generateParticle: (i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: 1 + Math.random() * 2,
          opacity: 0.15 + Math.random() * 0.2,
          speed: 20 + Math.random() * 15,
          delay: Math.random() * 15,
          duration: 20 + Math.random() * 15,
        }),
        renderParticle: (p) => (
          <div
            key={p.id}
            className="absolute rounded-full animate-dust-float"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              background: '#8b7355',
              opacity: p.opacity,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ),
      };

    case 'modern-minimal':
    case 'modern-minimal-dark':
      return {
        particleCount: 8,
        className: 'minimal-effects',
        generateParticle: (i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: 30 + Math.random() * 50,
          opacity: 0.02 + Math.random() * 0.03,
          speed: 30 + Math.random() * 20,
          delay: Math.random() * 20,
          duration: 30 + Math.random() * 20,
          rotation: Math.random() * 360,
        }),
        renderParticle: (p) => (
          <div
            key={p.id}
            className="absolute animate-geometric-drift"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              border: '1px solid currentColor',
              opacity: p.opacity,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              transform: `rotate(${p.rotation}deg)`,
            }}
          />
        ),
      };

    default:
      return null;
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

interface ThemedBackgroundProps {
  /** Override to disable effects regardless of settings */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export const ThemedBackground = memo(function ThemedBackground({
  disabled = false,
  className = '',
}: ThemedBackgroundProps) {
  const { skinId } = useSkin();
  const { animationsEnabled, environmentEnabled } = useSettings();
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Get effect configuration for current skin
  const effectConfig = useMemo(() => getEffectConfig(skinId), [skinId]);

  // Generate particles when skin changes
  useEffect(() => {
    if (!effectConfig || disabled || isReducedMotion || !animationsEnabled || !environmentEnabled) {
      setParticles([]);
      return;
    }

    const newParticles = Array.from({ length: effectConfig.particleCount }, (_, i) =>
      effectConfig.generateParticle(i)
    );
    setParticles(newParticles);
  }, [effectConfig, disabled, isReducedMotion, animationsEnabled, environmentEnabled]);

  // Don't render if disabled or no effects
  if (disabled || isReducedMotion || !animationsEnabled || !environmentEnabled || !effectConfig || particles.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none overflow-hidden z-0 ${effectConfig.className} ${className}`}
      aria-hidden="true"
    >
      {particles.map((particle) => effectConfig.renderParticle(particle))}
    </div>
  );
});

export default ThemedBackground;

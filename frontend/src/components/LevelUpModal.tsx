/**
 * LevelUpModal Component
 *
 * Sprint 20: Level Up Celebration
 *
 * Modal shown when player levels up:
 * - Animated level badge
 * - Shows old level -> new level
 * - Lists newly unlocked skins
 * - Confetti-style celebration
 */

import { useEffect, useState } from 'react';
import { skinList } from '../config/skins';

export interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  oldLevel: number;
  newLevel: number;
  newlyUnlockedSkins: string[];
}

export function LevelUpModal({
  isOpen,
  onClose,
  oldLevel,
  newLevel,
  newlyUnlockedSkins,
}: LevelUpModalProps) {
  const [showContent, setShowContent] = useState(false);
  const [showSkins, setShowSkins] = useState(false);

  // Staged animation
  useEffect(() => {
    if (isOpen) {
      setShowContent(false);
      setShowSkins(false);

      const contentTimer = setTimeout(() => setShowContent(true), 300);
      const skinsTimer = setTimeout(() => setShowSkins(true), 800);

      return () => {
        clearTimeout(contentTimer);
        clearTimeout(skinsTimer);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Get tier info for styling
  const getTierInfo = (level: number) => {
    if (level >= 50) return { color: 'from-purple-500 to-pink-500', name: 'Legendary' };
    if (level >= 40) return { color: 'from-yellow-400 to-orange-500', name: 'Master' };
    if (level >= 30) return { color: 'from-cyan-400 to-blue-500', name: 'Expert' };
    if (level >= 20) return { color: 'from-emerald-400 to-green-500', name: 'Veteran' };
    if (level >= 10) return { color: 'from-blue-400 to-indigo-500', name: 'Skilled' };
    if (level >= 5) return { color: 'from-slate-400 to-slate-500', name: 'Apprentice' };
    return { color: 'from-amber-600 to-amber-700', name: 'Beginner' };
  };

  const tierInfo = getTierInfo(newLevel);
  const unlockedSkinItems = newlyUnlockedSkins
    .map(id => skinList.find(s => s.id === id))
    .filter(Boolean);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[100]"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
      onClick={onClose}
    >
      {/* Celebration particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              top: '-20px',
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          >
            {['🎉', '✨', '🌟', '💫', '⭐'][Math.floor(Math.random() * 5)]}
          </div>
        ))}
      </div>

      {/* Modal content */}
      <div
        className={`
          relative w-full max-w-md mx-4 p-6 rounded-2xl text-center
          transform transition-all duration-500
          ${showContent ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}
        `}
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          border: '2px solid var(--color-text-accent)',
          boxShadow: '0 0 60px rgba(59, 130, 246, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-500/20"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          ✕
        </button>

        {/* Level Up Header */}
        <div className="mb-6">
          <h2
            className="text-3xl font-bold mb-2"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Level Up!
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Congratulations!
          </p>
        </div>

        {/* Level transition */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {/* Old level */}
          <div
            className={`
              w-16 h-16 rounded-full flex items-center justify-center
              text-2xl font-bold text-white opacity-50
              bg-gradient-to-br ${getTierInfo(oldLevel).color}
            `}
          >
            {oldLevel}
          </div>

          {/* Arrow */}
          <div className="text-3xl animate-pulse">→</div>

          {/* New level - animated */}
          <div className="relative">
            <div
              className={`
                w-20 h-20 rounded-full flex items-center justify-center
                text-3xl font-bold text-white
                bg-gradient-to-br ${tierInfo.color}
                shadow-lg animate-bounce-slow
              `}
            >
              {newLevel}
            </div>
            {/* Glow ring */}
            <div
              className={`
                absolute inset-0 rounded-full
                bg-gradient-to-br ${tierInfo.color}
                opacity-50 blur-xl animate-pulse
              `}
            />
          </div>
        </div>

        {/* Tier name */}
        <div
          className={`
            inline-block px-4 py-1 rounded-full mb-6
            bg-gradient-to-r ${tierInfo.color}
            text-white font-semibold
          `}
        >
          {tierInfo.name}
        </div>

        {/* Unlocked skins */}
        {unlockedSkinItems.length > 0 && (
          <div
            className={`
              mt-4 pt-4 border-t transition-all duration-500
              ${showSkins ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
            style={{ borderColor: 'var(--color-border-subtle)' }}
          >
            <h3
              className="text-sm font-semibold mb-3"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              🎨 New Skin Unlocked!
            </h3>

            <div className="space-y-2">
              {unlockedSkinItems.map((skin) => (
                <div
                  key={skin!.id}
                  className="flex items-center gap-3 p-2 rounded-lg"
                  style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                >
                  <div
                    className="w-10 h-10 rounded"
                    style={{ background: skin!.preview }}
                  />
                  <div className="text-left">
                    <div
                      className="font-medium text-sm"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {skin!.name}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {skin!.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action button */}
        <button
          onClick={onClose}
          className={`
            mt-6 px-8 py-3 rounded-lg font-bold
            bg-gradient-to-r ${tierInfo.color}
            text-white shadow-lg
            hover:scale-105 active:scale-95
            transition-transform
          `}
        >
          Awesome!
        </button>
      </div>

      {/* Add keyframe styles inline */}
      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 3s ease-out forwards;
        }
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

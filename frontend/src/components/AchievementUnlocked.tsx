/**
 * Achievement Unlocked Animation Component
 * Sprint 3 Phase 3.5
 *
 * Shows animated achievement unlock notification
 * Click anywhere on the popup to dismiss
 */

import { useEffect, useState } from 'react';
import { Achievement } from '../types/achievements';
import { sounds } from '../utils/sounds';

interface AchievementUnlockedProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

export function AchievementUnlocked({ achievement, onDismiss }: AchievementUnlockedProps) {
  const [isVisible, setIsVisible] = useState(false);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 500); // Wait for fade-out animation
  };

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      // Play achievement unlock sound
      sounds.achievementUnlock();

      const timer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [achievement, onDismiss]);

  if (!achievement) return null;

  // Map tier to rarity for backwards compatibility
  const getRarity = () => {
    if (achievement.rarity) return achievement.rarity;
    // Map tier to rarity
    switch (achievement.tier) {
      case 'bronze':
        return 'common';
      case 'silver':
        return 'rare';
      case 'gold':
        return 'epic';
      case 'platinum':
        return 'legendary';
      default:
        return 'common';
    }
  };

  const rarity = getRarity();

  // Get background gradient based on rarity - using explicit colors for all skins
  const getRarityStyles = () => {
    switch (rarity) {
      case 'legendary':
        return {
          bg: 'bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500',
          glow: 'shadow-[0_0_30px_rgba(251,191,36,0.6)]',
          border: 'border-yellow-300',
        };
      case 'epic':
        return {
          bg: 'bg-gradient-to-br from-purple-600 via-violet-600 to-purple-700',
          glow: 'shadow-[0_0_25px_rgba(147,51,234,0.5)]',
          border: 'border-purple-300',
        };
      case 'rare':
        return {
          bg: 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600',
          glow: 'shadow-[0_0_20px_rgba(59,130,246,0.4)]',
          border: 'border-blue-300',
        };
      default: // common
        return {
          bg: 'bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600',
          glow: 'shadow-[0_0_15px_rgba(34,197,94,0.4)]',
          border: 'border-green-300',
        };
    }
  };

  const rarityStyles = getRarityStyles();

  // Get name with fallback to achievement_name
  const name = achievement.name || achievement.achievement_name;

  return (
    <div
      className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-[10000] transition-all duration-500 ${
        isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}
    >
      {/* Clickable card - click anywhere to dismiss */}
      <button
        onClick={handleClose}
        className={`
          ${rarityStyles.bg} ${rarityStyles.glow}
          p-5 rounded-xl border-2 ${rarityStyles.border}
          animate-bounce-once cursor-pointer
          hover:scale-105 active:scale-95 transition-transform
          text-left w-full max-w-md
        `}
        aria-label="Click to dismiss achievement notification"
      >
        {/* Close hint */}
        <div className="absolute top-2 right-3 text-white/60 text-xs">
          tap to close
        </div>

        <div className="flex items-center gap-4">
          {/* Trophy Icon */}
          <div className="text-5xl animate-spin-slow" aria-hidden="true">
            🏆
          </div>

          {/* Content - Always white text on colored gradient backgrounds */}
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider mb-1 text-white/90 font-semibold">
              {achievement.is_secret ? '🔓 Secret Achievement Unlocked!' : 'Achievement Unlocked!'}
            </div>
            <div className="font-bold text-xl mb-1 text-white">{name}</div>
            <div className="text-sm text-white/90">
              {achievement.description}
            </div>
          </div>

          {/* Icon */}
          <div className="text-4xl" aria-hidden="true">
            {achievement.icon}
          </div>
        </div>

        {/* Progress Bar Animation - white on colored bg */}
        <div className="mt-3 h-1 bg-white/30 rounded-full overflow-hidden">
          <div className="h-full bg-white animate-progress-fill" />
        </div>
      </button>
    </div>
  );
}

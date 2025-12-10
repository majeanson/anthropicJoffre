/**
 * Achievement Unlocked Animation Component
 * Sprint 3 Phase 3.5
 *
 * Shows animated achievement unlock notification
 * Click anywhere on the popup to dismiss
 */

import { useEffect, useState, useRef } from 'react';
import { Achievement } from '../types/achievements';
import { sounds } from '../utils/sounds';

interface AchievementUnlockedProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

export function AchievementUnlocked({ achievement, onDismiss }: AchievementUnlockedProps) {
  const [isVisible, setIsVisible] = useState(false);
  const dismissTimerRef = useRef<number | null>(null);

  const handleClose = () => {
    setIsVisible(false);
    // Clear any existing dismiss timer
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }
    // Schedule dismiss after fade-out animation
    dismissTimerRef.current = window.setTimeout(onDismiss, 500);
  };

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      // Play achievement unlock sound
      sounds.achievementUnlock();

      const timer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => {
        clearTimeout(timer);
        // Also cleanup dismiss timer on unmount
        if (dismissTimerRef.current) {
          clearTimeout(dismissTimerRef.current);
        }
      };
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
      className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-[10000] transition-all duration-300 ${
        isVisible ? 'scale-100 translate-y-0' : 'scale-95 -translate-y-4 pointer-events-none'
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
          relative
        `}
        aria-label="Click to dismiss achievement notification"
      >
        {/* Close button */}
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white font-bold text-sm transition-colors">
          ✕
        </div>

        <div className="flex items-center gap-4">
          {/* Trophy Icon */}
          <div className="text-5xl animate-spin-slow" aria-hidden="true">
            🏆
          </div>

          {/* Content - Always white text on colored gradient backgrounds */}
          <div className="flex-1 pr-6">
            <div className="text-xs uppercase tracking-wider mb-1 text-white font-bold drop-shadow-sm">
              {achievement.is_secret ? '🔓 Secret Achievement Unlocked!' : 'Achievement Unlocked!'}
            </div>
            <div className="font-bold text-xl mb-1 text-white drop-shadow-sm">{name}</div>
            <div className="text-sm text-white font-medium drop-shadow-sm">
              {achievement.description}
            </div>
          </div>

          {/* Icon */}
          <div className="text-4xl" aria-hidden="true">
            {achievement.icon}
          </div>
        </div>

        {/* Progress Bar Animation - solid white on colored bg */}
        <div className="mt-3 h-1.5 bg-black/20 rounded-full overflow-hidden">
          <div className="h-full bg-white animate-progress-fill" />
        </div>
      </button>
    </div>
  );
}

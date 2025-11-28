/**
 * Achievement Unlocked Animation Component
 * Sprint 3 Phase 3.5
 *
 * Shows animated achievement unlock notification
 */

import { useEffect, useState } from 'react';
import { Achievement } from '../types/achievements';
import { designTokens } from '../styles/designTokens';
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
      case 'bronze': return 'common';
      case 'silver': return 'rare';
      case 'gold': return 'epic';
      case 'platinum': return 'legendary';
      default: return 'common';
    }
  };

  const rarity = getRarity();

  const getRarityColor = () => {
    switch (rarity) {
      case 'common': return designTokens.gradients.secondary;
      case 'rare': return designTokens.gradients.primary;
      case 'epic': return designTokens.gradients.team2;
      case 'legendary': return designTokens.gradients.special;
      default: return designTokens.gradients.secondary;
    }
  };

  const getRarityGlow = () => {
    switch (rarity) {
      case 'legendary': return 'shadow-[0_0_30px_rgba(251,191,36,0.5)]';
      case 'epic': return 'shadow-[0_0_25px_rgba(147,51,234,0.4)]';
      case 'rare': return 'shadow-[0_0_20px_rgba(59,130,246,0.3)]';
      default: return 'shadow-2xl';
    }
  };

  // Get name with fallback to achievement_name
  const name = achievement.name || achievement.achievement_name;

  return (
    <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] transition-all duration-500 ${
      isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
    }`}>
      <div className={`bg-gradient-to-r ${getRarityColor()} rounded-lg p-6 ${getRarityGlow()} animate-bounce-once relative`}>
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-white/70 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Close achievement notification"
        >
          ×
        </button>

        <div className="flex items-center gap-4">
          {/* Trophy Icon */}
          <div className="text-5xl animate-spin-slow" aria-hidden="true">
            🏆
          </div>

          {/* Content */}
          <div className="text-white">
            <div className="text-xs uppercase tracking-wider mb-1 opacity-90">
              {achievement.is_secret ? '🔓 Secret Achievement Unlocked!' : 'Achievement Unlocked!'}
            </div>
            <div className="font-bold text-xl mb-1">
              {name}
            </div>
            <div className="text-sm opacity-90">
              {achievement.description}
            </div>
          </div>

          {/* Icon */}
          <div className="text-4xl" aria-hidden="true">
            {achievement.icon}
          </div>
        </div>

        {/* Progress Bar Animation */}
        <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white animate-progress-fill" />
        </div>
      </div>
    </div>
  );
}
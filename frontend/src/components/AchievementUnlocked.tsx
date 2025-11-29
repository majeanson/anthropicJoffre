/**
 * Achievement Unlocked Animation Component
 * Sprint 3 Phase 3.5
 *
 * Shows animated achievement unlock notification
 */

import { useEffect, useState } from 'react';
import { Achievement } from '../types/achievements';
import { UICard, UICardGradient } from './ui/UICard';
import { Button } from './ui/Button';

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

  const getRarityGradient = (): UICardGradient => {
    switch (rarity) {
      case 'common': return 'success';
      case 'rare': return 'info';
      case 'epic': return 'team2';
      case 'legendary': return 'warning';
      default: return 'success';
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
    <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-[10000] transition-all duration-500 ${
      isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
    }`}>
      <UICard
        variant="gradient"
        gradient={getRarityGradient()}
        size="lg"
        className={`${getRarityGlow()} animate-bounce-once relative`}
      >
        {/* Close Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="absolute top-2 right-2 text-white/70 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
          aria-label="Close achievement notification"
        >
          ×
        </Button>

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
      </UICard>
    </div>
  );
}
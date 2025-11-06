/**
 * Achievement Unlocked Animation Component
 * Sprint 3 Phase 3.5
 *
 * Shows animated achievement unlock notification
 */

import { useEffect, useState } from 'react';
import { Achievement } from '../types/achievements';
interface AchievementUnlockedProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

export function AchievementUnlocked({ achievement, onDismiss }: AchievementUnlockedProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 500); // Wait for fade-out animation
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [achievement, onDismiss]);

  if (!achievement) return null;

  const getRarityColor = () => {
    switch (achievement.rarity) {
      case 'common': return 'from-gray-600 to-gray-700';
      case 'rare': return 'from-blue-600 to-blue-700';
      case 'epic': return 'from-purple-600 to-purple-700';
      case 'legendary': return 'from-yellow-500 to-orange-500';
      default: return 'from-gray-600 to-gray-700';
    }
  };

  const getRarityGlow = () => {
    switch (achievement.rarity) {
      case 'legendary': return 'shadow-[0_0_30px_rgba(251,191,36,0.5)]';
      case 'epic': return 'shadow-[0_0_25px_rgba(147,51,234,0.4)]';
      case 'rare': return 'shadow-[0_0_20px_rgba(59,130,246,0.3)]';
      default: return 'shadow-2xl';
    }
  };

  return (
    <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] transition-all duration-500 ${
      isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
    }`}>
      <div className={`bg-gradient-to-r ${getRarityColor()} rounded-lg p-6 ${getRarityGlow()} animate-bounce-once`}>
        <div className="flex items-center gap-4">
          {/* Trophy Icon */}
          <div className="text-5xl animate-spin-slow">
            🏆
          </div>

          {/* Content */}
          <div className="text-white">
            <div className="text-xs uppercase tracking-wider mb-1 opacity-90">
              Achievement Unlocked!
            </div>
            <div className="font-bold text-xl mb-1">
              {achievement.name}
            </div>
            <div className="text-sm opacity-90">
              {achievement.description}
            </div>
          </div>

          {/* Icon */}
          <div className="text-4xl">
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
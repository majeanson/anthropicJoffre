/**
 * AchievementsPanel Component
 * Sprint 2 Phase 1
 *
 * Browse and view all achievements with filters
 */

import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { AchievementProgress, AchievementCategory, AchievementTier } from '../types/achievements';
import { AchievementCard } from './AchievementCard';

interface AchievementsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  socket: Socket | null;
  playerName: string;
}

export function AchievementsPanel({ isOpen, onClose, socket, playerName }: AchievementsPanelProps) {
  const [achievements, setAchievements] = useState<AchievementProgress[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<AchievementCategory | 'all'>('all');
  const [filterTier, setFilterTier] = useState<AchievementTier | 'all'>('all');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);

  useEffect(() => {
    if (isOpen && socket) {
      loadAchievements();
    }
  }, [isOpen, socket, playerName]);

  const loadAchievements = () => {
    if (!socket) return;

    setLoading(true);
    socket.emit('get_player_achievements', { playerName }, (response: any) => {
      if (response.success) {
        setAchievements(response.achievements);
        setTotalPoints(response.points || 0);
      }
      setLoading(false);
    });
  };

  if (!isOpen) return null;

  // Filter achievements
  const filteredAchievements = achievements.filter(achievement => {
    if (filterCategory !== 'all' && achievement.category !== filterCategory) return false;
    if (filterTier !== 'all' && achievement.tier !== filterTier) return false;
    if (showUnlockedOnly && !achievement.is_unlocked) return false;
    return true;
  });

  // Calculate stats
  const unlockedCount = achievements.filter(a => a.is_unlocked).length;
  const totalCount = achievements.length;
  const completionPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-parchment-50 to-parchment-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border-2 border-parchment-400 dark:border-gray-600 m-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-umber-700 to-umber-900 dark:from-gray-700 dark:to-gray-900 px-6 py-4 border-b-2 border-umber-800 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-parchment-50">🏆 Achievements</h2>
              <p className="text-sm text-parchment-200 mt-1">
                {unlockedCount}/{totalCount} unlocked ({completionPercent}%) • {totalPoints} points
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-parchment-50 hover:text-parchment-200 text-2xl font-bold transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="h-3 bg-black/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all duration-500"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-parchment-300 dark:border-gray-700 bg-parchment-100 dark:bg-gray-800">
          <div className="flex flex-wrap items-center gap-4">
            {/* Category filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-umber-800 dark:text-gray-200">Category:</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as AchievementCategory | 'all')}
                className="px-3 py-1 rounded-lg border-2 border-parchment-400 dark:border-gray-600 bg-white dark:bg-gray-700 text-umber-800 dark:text-gray-200 text-sm"
              >
                <option value="all">All</option>
                <option value="gameplay">Gameplay</option>
                <option value="milestone">Milestone</option>
                <option value="social">Social</option>
                <option value="special">Special</option>
              </select>
            </div>

            {/* Tier filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-umber-800 dark:text-gray-200">Tier:</label>
              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value as AchievementTier | 'all')}
                className="px-3 py-1 rounded-lg border-2 border-parchment-400 dark:border-gray-600 bg-white dark:bg-gray-700 text-umber-800 dark:text-gray-200 text-sm"
              >
                <option value="all">All</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
              </select>
            </div>

            {/* Show unlocked only */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showUnlockedOnly}
                onChange={(e) => setShowUnlockedOnly(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-semibold text-umber-800 dark:text-gray-200">Unlocked only</span>
            </label>

            <div className="ml-auto text-sm text-umber-600 dark:text-gray-400">
              Showing {filteredAchievements.length} achievements
            </div>
          </div>
        </div>

        {/* Achievements grid */}
        <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-250px)]">
          {loading ? (
            <div className="text-center py-12 text-umber-600 dark:text-gray-400">
              Loading achievements...
            </div>
          ) : filteredAchievements.length === 0 ? (
            <div className="text-center py-12 text-umber-600 dark:text-gray-400">
              No achievements match your filters
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAchievements.map((achievement) => (
                <AchievementCard
                  key={achievement.achievement_id}
                  achievement={achievement}
                  size="medium"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

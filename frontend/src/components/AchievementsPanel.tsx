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
import { Modal, UICard, LoadingState, EmptyState, ProgressBar, Select, Checkbox } from './ui';

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
    socket.emit('get_player_achievements', { playerName }, (response: { success: boolean; achievements?: AchievementProgress[]; points?: number; error?: string }) => {
      if (response.success && response.achievements) {
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Achievements"
      subtitle={`${unlockedCount}/${totalCount} unlocked (${completionPercent}%) • ${totalPoints} points`}
      icon="🏆"
      theme="parchment"
      size="xl"
    >
      {/* Progress bar */}
      <div className="mb-4">
        <ProgressBar
          value={completionPercent}
          max={100}
          variant="gradient"
          color="warning"
          size="lg"
        />
      </div>

      {/* Filters */}
      <UICard variant="bordered" size="sm" className="mb-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Category filter */}
          <Select
            label="Category"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as AchievementCategory | 'all')}
            size="sm"
            options={[
              { value: 'all', label: 'All' },
              { value: 'gameplay', label: 'Gameplay' },
              { value: 'milestone', label: 'Milestone' },
              { value: 'social', label: 'Social' },
              { value: 'special', label: 'Special' },
            ]}
          />

          {/* Tier filter */}
          <Select
            label="Tier"
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value as AchievementTier | 'all')}
            size="sm"
            options={[
              { value: 'all', label: 'All' },
              { value: 'bronze', label: 'Bronze' },
              { value: 'silver', label: 'Silver' },
              { value: 'gold', label: 'Gold' },
              { value: 'platinum', label: 'Platinum' },
            ]}
          />

          {/* Show unlocked only */}
          <Checkbox
            label="Unlocked only"
            checked={showUnlockedOnly}
            onChange={(e) => setShowUnlockedOnly(e.target.checked)}
            size="sm"
          />

          <div className="ml-auto text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Showing {filteredAchievements.length} achievements
          </div>
        </div>
      </UICard>

      {/* Achievements grid */}
      <div className="overflow-y-auto flex-1 min-h-0">
        {loading ? (
          <LoadingState message="Loading achievements..." card />
        ) : filteredAchievements.length === 0 ? (
          <EmptyState
            icon="🏆"
            title="No achievements found"
            description="No achievements match your current filters"
            card
            compact
          />
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
    </Modal>
  );
}

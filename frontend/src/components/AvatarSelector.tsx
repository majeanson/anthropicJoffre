/**
 * Avatar Selector Component
 * Sprint 21: Reward System - Shows locked/unlocked avatars based on player level
 */

import { useState, useMemo } from 'react';
import { AVATARS, AVATAR_CATEGORIES, Avatar, isAvatarUnlocked } from '../utils/avatars';
import { Button } from './ui/Button';

interface AvatarSelectorProps {
  selectedAvatarId?: string;
  onSelect: (avatarId: string) => void;
  playerLevel?: number; // If provided, shows lock status
}

export function AvatarSelector({
  selectedAvatarId,
  onSelect,
  playerLevel = 1,
}: AvatarSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<Avatar['category'] | 'all'>('all');

  // Get avatars filtered by category
  const filteredAvatars = useMemo(() => {
    const avatars =
      selectedCategory === 'all'
        ? AVATARS
        : AVATARS.filter((avatar) => avatar.category === selectedCategory);

    // Sort: unlocked first, then by unlock level
    return [...avatars].sort((a, b) => {
      const aUnlocked = isAvatarUnlocked(a.id, playerLevel);
      const bUnlocked = isAvatarUnlocked(b.id, playerLevel);
      if (aUnlocked && !bUnlocked) return -1;
      if (!aUnlocked && bUnlocked) return 1;
      return a.unlockLevel - b.unlockLevel;
    });
  }, [selectedCategory, playerLevel]);

  // Count unlocked vs total for each category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, { unlocked: number; total: number }> = {
      all: { unlocked: 0, total: AVATARS.length },
    };

    AVATAR_CATEGORIES.forEach((cat) => {
      counts[cat.id] = { unlocked: 0, total: 0 };
    });

    AVATARS.forEach((avatar) => {
      if (isAvatarUnlocked(avatar.id, playerLevel)) {
        counts.all.unlocked++;
        if (counts[avatar.category]) {
          counts[avatar.category].unlocked++;
        }
      }
      if (counts[avatar.category]) {
        counts[avatar.category].total++;
      }
    });

    return counts;
  }, [playerLevel]);

  const handleAvatarClick = (avatar: Avatar) => {
    if (isAvatarUnlocked(avatar.id, playerLevel)) {
      onSelect(avatar.id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === 'all' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
        >
          All ({categoryCounts.all.unlocked}/{categoryCounts.all.total})
        </Button>
        {AVATAR_CATEGORIES.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.name} ({categoryCounts[category.id]?.unlocked || 0}/
            {categoryCounts[category.id]?.total || 0})
          </Button>
        ))}
      </div>

      {/* Avatar Grid */}
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-64 overflow-y-auto p-2 rounded-lg bg-skin-tertiary">
        {filteredAvatars.map((avatar) => {
          const unlocked = isAvatarUnlocked(avatar.id, playerLevel);
          const isSelected = selectedAvatarId === avatar.id;

          return (
            <button
              key={avatar.id}
              onClick={() => handleAvatarClick(avatar)}
              disabled={!unlocked}
              className={`
                relative aspect-square flex items-center justify-center text-3xl sm:text-4xl
                rounded-lg transition-all duration-200 border-2
                ${
                  unlocked
                    ? 'hover:scale-110 cursor-pointer bg-skin-secondary'
                    : 'cursor-not-allowed opacity-50 grayscale bg-skin-primary'
                }
                ${
                  isSelected
                    ? 'ring-4 ring-blue-400 scale-110 border-blue-400'
                    : 'border-transparent hover:border-skin-subtle'
                }
              `}
              title={
                unlocked
                  ? avatar.name
                  : `${avatar.name} - Unlocks at Level ${avatar.unlockLevel}${avatar.unlockDescription ? ` (${avatar.unlockDescription})` : ''}`
              }
            >
              {/* Emoji */}
              <span className={unlocked ? '' : 'filter blur-[1px]'}>{avatar.emoji}</span>

              {/* Lock overlay for locked avatars */}
              {!unlocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                  <span className="text-lg">🔒</span>
                </div>
              )}

              {/* Level badge for locked avatars */}
              {!unlocked && avatar.unlockLevel < 100 && (
                <div className="absolute -bottom-1 -right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-skin-status-warning text-skin-primary">
                  Lv.{avatar.unlockLevel}
                </div>
              )}

              {/* Special unlock badge */}
              {!unlocked && avatar.unlockLevel >= 100 && (
                <div className="absolute -bottom-1 -right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-skin-accent text-skin-primary">
                  ★
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Avatar Info */}
      {selectedAvatarId && (
        <div className="text-center p-3 rounded-lg bg-skin-tertiary">
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl">
              {AVATARS.find((a) => a.id === selectedAvatarId)?.emoji}
            </span>
            <div className="text-left">
              <div className="font-semibold text-skin-primary">
                {AVATARS.find((a) => a.id === selectedAvatarId)?.name}
              </div>
              <div className="text-xs text-skin-muted">
                {
                  AVATAR_CATEGORIES.find(
                    (c) => c.id === AVATARS.find((a) => a.id === selectedAvatarId)?.category
                  )?.name
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress summary */}
      <div className="text-center text-sm py-2 rounded-lg bg-skin-tertiary text-skin-muted">
        <span className="font-semibold text-skin-accent">{categoryCounts.all.unlocked}</span> of{' '}
        <span className="font-semibold">{categoryCounts.all.total}</span> avatars unlocked
        {playerLevel < 50 && <span> • Keep leveling to unlock more!</span>}
      </div>
    </div>
  );
}

/**
 * RewardsTab Component
 * Sprint 21: Shows all rewards, progression, and upcoming unlocks
 */

import { useMemo } from 'react';
import {
  AVATARS,
  TITLES,
  SKIN_REWARDS,
  Avatar,
  Title,
  SkinReward,
  isAvatarUnlocked,
  getTitleForLevel,
  getNextTitle,
  getUpcomingRewards,
} from '../utils/avatars';
import { cardSkinList, CardSkin } from '../config/cardSkins';
import { skinList, Skin, getSkinPricing } from '../config/skins';

interface RewardsTabProps {
  playerLevel: number;
  totalXp: number;
  currentLevelXP: number;
  nextLevelXP: number;
}

export function RewardsTab({
  playerLevel,
  totalXp,
  currentLevelXP,
  nextLevelXP,
}: RewardsTabProps) {
  // Current title
  const currentTitle = getTitleForLevel(playerLevel);
  const nextTitle = getNextTitle(playerLevel);

  // Upcoming rewards (next 10 levels) - including card skins and UI skins
  const upcomingRewards = useMemo(() => {
    const baseRewards = getUpcomingRewards(playerLevel, 10);

    // Enhance with card skins and UI skins
    return baseRewards.map(reward => ({
      ...reward,
      cardSkins: cardSkinList.filter(cs => cs.requiredLevel === reward.level),
      uiSkins: skinList.filter(s => getSkinPricing(s.id).suggestedLevel === reward.level && getSkinPricing(s.id).price > 0),
    }));
  }, [playerLevel]);

  // Also find levels with ONLY skins (not covered by base rewards)
  const additionalSkinLevels = useMemo(() => {
    const existingLevels = new Set(upcomingRewards.map(r => r.level));
    const skinOnlyRewards: { level: number; cardSkins: CardSkin[]; uiSkins: Skin[] }[] = [];

    for (let level = playerLevel + 1; level <= playerLevel + 10; level++) {
      if (!existingLevels.has(level)) {
        const cardSkinsAtLevel = cardSkinList.filter(cs => cs.requiredLevel === level);
        const uiSkinsAtLevel = skinList.filter(s => getSkinPricing(s.id).suggestedLevel === level && getSkinPricing(s.id).price > 0);
        if (cardSkinsAtLevel.length > 0 || uiSkinsAtLevel.length > 0) {
          skinOnlyRewards.push({ level, cardSkins: cardSkinsAtLevel, uiSkins: uiSkinsAtLevel });
        }
      }
    }

    return skinOnlyRewards;
  }, [playerLevel, upcomingRewards]);

  // Calculate progress stats
  const stats = useMemo(() => {
    const unlockedAvatars = AVATARS.filter(a => isAvatarUnlocked(a.id, playerLevel)).length;
    const unlockedTitles = TITLES.filter(t => t.unlockLevel <= playerLevel).length;
    const unlockedSkins = SKIN_REWARDS.filter(s => s.unlockLevel <= playerLevel).length;
    const unlockedCardSkins = cardSkinList.filter(cs => cs.requiredLevel <= playerLevel).length;

    return {
      avatars: { unlocked: unlockedAvatars, total: AVATARS.length },
      titles: { unlocked: unlockedTitles, total: TITLES.length },
      skins: { unlocked: unlockedSkins, total: SKIN_REWARDS.length },
      cardSkins: { unlocked: unlockedCardSkins, total: cardSkinList.length },
    };
  }, [playerLevel]);

  const xpProgress = nextLevelXP > 0 ? (currentLevelXP / nextLevelXP) * 100 : 100;

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <div
        className="p-4 rounded-lg border-2"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-accent)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Current Level
            </div>
            <div
              className="text-3xl font-bold"
              style={{ color: 'var(--color-text-accent)' }}
            >
              Level {playerLevel}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Title
            </div>
            <div className={`text-xl font-semibold ${currentTitle.color}`}>
              {currentTitle.name}
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span style={{ color: 'var(--color-text-muted)' }}>
              {currentLevelXP.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
            </span>
            <span style={{ color: 'var(--color-text-accent)' }}>
              {Math.round(xpProgress)}%
            </span>
          </div>
          <div
            className="h-3 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${xpProgress}%`,
                background: 'linear-gradient(90deg, var(--color-info) 0%, var(--color-accent) 100%)',
              }}
            />
          </div>
          <div
            className="text-xs text-center mt-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Total XP: {totalXp.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Collection Progress */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ProgressCard
          icon="😀"
          label="Avatars"
          unlocked={stats.avatars.unlocked}
          total={stats.avatars.total}
        />
        <ProgressCard
          icon="🏷️"
          label="Titles"
          unlocked={stats.titles.unlocked}
          total={stats.titles.total}
        />
        <ProgressCard
          icon="🎨"
          label="UI Themes"
          unlocked={stats.skins.unlocked}
          total={stats.skins.total}
        />
        <ProgressCard
          icon="🃏"
          label="Card Skins"
          unlocked={stats.cardSkins.unlocked}
          total={stats.cardSkins.total}
        />
      </div>

      {/* Upcoming Rewards */}
      {(upcomingRewards.length > 0 || additionalSkinLevels.length > 0) && (
        <div>
          <h3
            className="text-lg font-semibold mb-3"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Upcoming Rewards
          </h3>
          <div className="space-y-2">
            {/* Merge and sort all upcoming rewards by level */}
            {[
              ...upcomingRewards.map(r => ({ ...r, type: 'full' as const })),
              ...additionalSkinLevels.map(r => ({
                level: r.level,
                avatars: [] as Avatar[],
                title: null as Title | null,
                skins: [] as SkinReward[],
                cardSkins: r.cardSkins,
                uiSkins: r.uiSkins,
                type: 'skinOnly' as const,
              })),
            ]
              .sort((a, b) => a.level - b.level)
              .map(reward => (
                <UpcomingRewardRow
                  key={reward.level}
                  level={reward.level}
                  currentLevel={playerLevel}
                  avatars={reward.avatars}
                  title={reward.title}
                  skins={reward.skins}
                  cardSkins={reward.cardSkins}
                  uiSkins={'uiSkins' in reward ? reward.uiSkins : []}
                />
              ))}
          </div>
        </div>
      )}

      {/* Next Title Preview */}
      {nextTitle && (
        <div
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            borderColor: 'var(--color-border-default)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Next Title at Level {nextTitle.unlockLevel}
              </div>
              <div className={`text-lg font-semibold ${nextTitle.color}`}>
                {nextTitle.name}
              </div>
            </div>
            <div
              className="text-sm px-3 py-1 rounded-full"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-muted)',
              }}
            >
              {nextTitle.unlockLevel - playerLevel} levels away
            </div>
          </div>
        </div>
      )}

      {/* All Titles Preview */}
      <div>
        <h3
          className="text-lg font-semibold mb-3"
          style={{ color: 'var(--color-text-primary)' }}
        >
          All Titles
        </h3>
        <div className="flex flex-wrap gap-2">
          {TITLES.map(title => {
            const unlocked = title.unlockLevel <= playerLevel;
            return (
              <div
                key={title.id}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${title.color} ${
                  unlocked ? '' : 'opacity-40 grayscale'
                }`}
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                }}
                title={unlocked ? `Unlocked at Level ${title.unlockLevel}` : `Unlocks at Level ${title.unlockLevel}`}
              >
                {!unlocked && <span className="mr-1">🔒</span>}
                {title.name}
                {!unlocked && <span className="ml-1 text-xs opacity-70">Lv.{title.unlockLevel}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Sub-components

function ProgressCard({
  icon,
  label,
  unlocked,
  total,
}: {
  icon: string;
  label: string;
  unlocked: number;
  total: number;
}) {
  const percentage = Math.round((unlocked / total) * 100);

  return (
    <div
      className="p-3 rounded-lg text-center"
      style={{ backgroundColor: 'var(--color-bg-secondary)' }}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </div>
      <div className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
        {unlocked}/{total}
      </div>
      <div
        className="h-1 rounded-full mt-2 overflow-hidden"
        style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: 'var(--color-accent)',
          }}
        />
      </div>
    </div>
  );
}

function UpcomingRewardRow({
  level,
  currentLevel,
  avatars,
  title,
  skins,
  cardSkins,
  uiSkins,
}: {
  level: number;
  currentLevel: number;
  avatars: Avatar[];
  title: Title | null;
  skins: SkinReward[];
  cardSkins: CardSkin[];
  uiSkins: Skin[];
}) {
  const levelsAway = level - currentLevel;

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg"
      style={{ backgroundColor: 'var(--color-bg-secondary)' }}
    >
      {/* Level Badge */}
      <div
        className="w-12 h-12 flex flex-col items-center justify-center rounded-lg font-bold"
        style={{
          backgroundColor: 'var(--color-bg-tertiary)',
          color: 'var(--color-text-accent)',
        }}
      >
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Lv
        </span>
        <span className="text-lg">{level}</span>
      </div>

      {/* Rewards */}
      <div className="flex-1 flex flex-wrap gap-2">
        {avatars.map(avatar => (
          <div
            key={avatar.id}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-sm"
            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
            title={avatar.name}
          >
            <span>{avatar.emoji}</span>
            <span style={{ color: 'var(--color-text-muted)' }}>{avatar.name}</span>
          </div>
        ))}
        {title && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm ${title.color}`}
            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
          >
            <span>🏷️</span>
            <span>{title.name}</span>
          </div>
        )}
        {skins.map(skin => (
          <div
            key={skin.skinId}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-sm"
            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
            title={skin.description}
          >
            <span>🎨</span>
            <span style={{ color: 'var(--color-text-muted)' }}>{skin.name}</span>
          </div>
        ))}
        {cardSkins.map(cardSkin => (
          <div
            key={cardSkin.id}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-sm"
            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
            title={cardSkin.description}
          >
            <span>🃏</span>
            <span style={{ color: 'var(--color-text-muted)' }}>{cardSkin.name}</span>
          </div>
        ))}
        {uiSkins.map(uiSkin => (
          <div
            key={uiSkin.id}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-sm"
            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
            title={uiSkin.description}
          >
            <span>🎨</span>
            <span style={{ color: 'var(--color-text-muted)' }}>{uiSkin.name}</span>
          </div>
        ))}
      </div>

      {/* Distance */}
      <div
        className="text-xs px-2 py-1 rounded-full whitespace-nowrap"
        style={{
          backgroundColor: 'var(--color-bg-tertiary)',
          color: levelsAway <= 2 ? 'var(--color-success)' : 'var(--color-text-muted)',
        }}
      >
        {levelsAway === 1 ? 'Next!' : `+${levelsAway}`}
      </div>
    </div>
  );
}

/**
 * AchievementsPanel Stories
 *
 * Achievement cards with tier indicators and progress tracking.
 * Adapts to the currently selected skin theme.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { AchievementCard } from '../../AchievementCard';
import { AchievementProgress } from '../../../types/achievements';

// Mock achievement data
const createMockAchievement = (
  overrides: Partial<AchievementProgress> = {}
): AchievementProgress => ({
  achievement_id: 1,
  achievement_key: 'first_victory',
  achievement_name: 'First Victory',
  name: 'First Victory',
  description: 'Win your first game',
  rarity: 'common',
  icon: '🏆',
  category: 'milestone',
  tier: 'bronze',
  points: 10,
  is_unlocked: false,
  progress: 0,
  max_progress: 1,
  is_secret: false,
  created_at: new Date(),
  unlocked_at: undefined,
  ...overrides,
});

const meta: Meta<typeof AchievementCard> = {
  title: 'Components/AchievementCard',
  component: AchievementCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Achievement Card Component

Displays a single achievement with progress. Adapts to the selected skin theme.

## Features
- **4 tiers**: Bronze, Silver, Gold, Platinum
- **Locked/unlocked states**: Visual differentiation
- **Progress bar**: For incremental achievements
- **Secret masking**: Hidden achievements until unlocked

Use the skin selector in the toolbar to see how achievements adapt to different themes.
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-80 p-4 rounded-xl bg-skin-primary border border-skin-default">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AchievementCard>;

/**
 * Bronze tier - unlocked
 */
export const BronzeUnlocked: Story = {
  args: {
    achievement: createMockAchievement({
      tier: 'bronze',
      is_unlocked: true,
      unlocked_at: new Date('2025-01-15'),
    }),
    size: 'medium',
  },
};

/**
 * Bronze tier - locked
 */
export const BronzeLocked: Story = {
  args: {
    achievement: createMockAchievement({
      tier: 'bronze',
      is_unlocked: false,
    }),
    size: 'medium',
  },
};

/**
 * Silver tier - unlocked
 */
export const SilverUnlocked: Story = {
  args: {
    achievement: createMockAchievement({
      achievement_name: 'Veteran Player',
      description: 'Play 50 games',
      icon: '⭐',
      tier: 'silver',
      points: 25,
      is_unlocked: true,
      unlocked_at: new Date('2025-01-10'),
    }),
    size: 'medium',
  },
};

/**
 * Silver tier - locked
 */
export const SilverLocked: Story = {
  args: {
    achievement: createMockAchievement({
      achievement_name: 'Veteran Player',
      description: 'Play 50 games',
      icon: '⭐',
      tier: 'silver',
      points: 25,
      is_unlocked: false,
    }),
    size: 'medium',
  },
};

/**
 * Gold tier - unlocked
 */
export const GoldUnlocked: Story = {
  args: {
    achievement: createMockAchievement({
      achievement_name: 'Master Strategist',
      description: 'Win 100 games',
      icon: '👑',
      tier: 'gold',
      points: 50,
      is_unlocked: true,
      unlocked_at: new Date('2025-01-05'),
    }),
    size: 'medium',
  },
};

/**
 * Gold tier - locked
 */
export const GoldLocked: Story = {
  args: {
    achievement: createMockAchievement({
      achievement_name: 'Master Strategist',
      description: 'Win 100 games',
      icon: '👑',
      tier: 'gold',
      points: 50,
      is_unlocked: false,
    }),
    size: 'medium',
  },
};

/**
 * Platinum tier - unlocked
 */
export const PlatinumUnlocked: Story = {
  args: {
    achievement: createMockAchievement({
      achievement_name: 'Legend',
      description: 'Reach the top of the leaderboard',
      icon: '💎',
      tier: 'platinum',
      points: 100,
      is_unlocked: true,
      unlocked_at: new Date('2025-01-01'),
    }),
    size: 'medium',
  },
};

/**
 * With progress bar
 */
export const WithProgress: Story = {
  args: {
    achievement: createMockAchievement({
      achievement_name: 'Card Collector',
      description: 'Play 1000 cards',
      icon: '🃏',
      tier: 'gold',
      points: 50,
      is_unlocked: true,
      progress: 750,
      max_progress: 1000,
    }),
    size: 'medium',
  },
};

/**
 * Secret achievement - locked
 */
export const SecretLocked: Story = {
  args: {
    achievement: createMockAchievement({
      achievement_name: 'Hidden Master',
      description: 'A secret achievement',
      icon: '🎭',
      tier: 'platinum',
      points: 100,
      is_unlocked: false,
      is_secret: true,
    }),
    size: 'medium',
  },
};

/**
 * Secret achievement - unlocked
 */
export const SecretUnlocked: Story = {
  args: {
    achievement: createMockAchievement({
      achievement_name: 'Hidden Master',
      description: 'Discover all secret achievements',
      icon: '🎭',
      tier: 'platinum',
      points: 100,
      is_unlocked: true,
      is_secret: true,
      unlocked_at: new Date('2025-01-15'),
    }),
    size: 'medium',
  },
};

/**
 * Small size
 */
export const SmallSize: Story = {
  args: {
    achievement: createMockAchievement({
      is_unlocked: true,
    }),
    size: 'small',
  },
};

/**
 * Large size
 */
export const LargeSize: Story = {
  args: {
    achievement: createMockAchievement({
      is_unlocked: true,
    }),
    size: 'large',
  },
  decorators: [
    (Story) => (
      <div className="w-96 p-4 rounded-xl bg-skin-primary border border-skin-default">
        <Story />
      </div>
    ),
  ],
};

// ============================================================================
// ALL TIERS SHOWCASE
// ============================================================================

export const AllTiersUnlocked: Story = {
  render: () => (
    <div className="p-6 rounded-xl bg-skin-primary border border-skin-default">
      <h3 className="text-lg uppercase tracking-wider mb-4 text-skin-accent">All Tiers - Unlocked</h3>
      <div className="space-y-4 w-80">
        <AchievementCard
          achievement={createMockAchievement({
            tier: 'bronze',
            is_unlocked: true,
            achievement_name: 'Bronze Achievement',
            icon: '🥉',
          })}
          size="medium"
        />
        <AchievementCard
          achievement={createMockAchievement({
            tier: 'silver',
            is_unlocked: true,
            achievement_name: 'Silver Achievement',
            icon: '🥈',
          })}
          size="medium"
        />
        <AchievementCard
          achievement={createMockAchievement({
            tier: 'gold',
            is_unlocked: true,
            achievement_name: 'Gold Achievement',
            icon: '🥇',
          })}
          size="medium"
        />
        <AchievementCard
          achievement={createMockAchievement({
            tier: 'platinum',
            is_unlocked: true,
            achievement_name: 'Platinum Achievement',
            icon: '💎',
          })}
          size="medium"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All four achievement tiers in their unlocked state.',
      },
    },
  },
};

export const AllTiersLocked: Story = {
  render: () => (
    <div className="p-6 rounded-xl bg-skin-primary border border-skin-default">
      <h3 className="text-lg uppercase tracking-wider mb-4 text-skin-accent">All Tiers - Locked</h3>
      <div className="space-y-4 w-80">
        <AchievementCard
          achievement={createMockAchievement({
            tier: 'bronze',
            is_unlocked: false,
            achievement_name: 'Bronze Achievement',
            icon: '🥉',
          })}
          size="medium"
        />
        <AchievementCard
          achievement={createMockAchievement({
            tier: 'silver',
            is_unlocked: false,
            achievement_name: 'Silver Achievement',
            icon: '🥈',
          })}
          size="medium"
        />
        <AchievementCard
          achievement={createMockAchievement({
            tier: 'gold',
            is_unlocked: false,
            achievement_name: 'Gold Achievement',
            icon: '🥇',
          })}
          size="medium"
        />
        <AchievementCard
          achievement={createMockAchievement({
            tier: 'platinum',
            is_unlocked: false,
            achievement_name: 'Platinum Achievement',
            icon: '💎',
          })}
          size="medium"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All four achievement tiers in their locked state.',
      },
    },
  },
};

/**
 * AchievementsPanel Stories
 * Storybook stories for the AchievementsPanel and AchievementCard components
 */

import type { Meta, StoryObj } from '@storybook/react';
import { AchievementCard } from '../../AchievementCard';
import { AchievementProgress } from '../../../types/achievements';

// Mock achievement data
const createMockAchievement = (overrides: Partial<AchievementProgress> = {}): AchievementProgress => ({
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
The AchievementCard displays a single achievement with progress.

**Features:**
- Different tier colors (bronze, silver, gold, platinum)
- Locked/unlocked states
- Progress bar for incremental achievements
- Secret achievement masking

**Light/Dark Mode:**
- Locked achievements use light gray background in light mode
- Text colors adapt to background for readability
- Unlocked achievements use vibrant gradient backgrounds
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-80 p-4 bg-gray-200 dark:bg-gray-900">
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
      <div className="w-96 p-4 bg-gray-200 dark:bg-gray-900">
        <Story />
      </div>
    ),
  ],
};

/**
 * Dark mode - locked
 */
export const DarkModeLocked: Story = {
  args: {
    achievement: createMockAchievement({
      tier: 'silver',
      is_unlocked: false,
    }),
    size: 'medium',
  },
  decorators: [
    (Story) => (
      <div className="dark w-80 p-4 bg-gray-900">
        <Story />
      </div>
    ),
  ],
};

/**
 * Dark mode - unlocked
 */
export const DarkModeUnlocked: Story = {
  args: {
    achievement: createMockAchievement({
      tier: 'gold',
      is_unlocked: true,
      unlocked_at: new Date('2025-01-15'),
    }),
    size: 'medium',
  },
  decorators: [
    (Story) => (
      <div className="dark w-80 p-4 bg-gray-900">
        <Story />
      </div>
    ),
  ],
};

/**
 * All tiers comparison - light mode
 */
export const AllTiersLight: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <AchievementCard
        achievement={createMockAchievement({ tier: 'bronze', is_unlocked: true, achievement_name: 'Bronze Achievement', icon: '🥉' })}
        size="medium"
      />
      <AchievementCard
        achievement={createMockAchievement({ tier: 'silver', is_unlocked: true, achievement_name: 'Silver Achievement', icon: '🥈' })}
        size="medium"
      />
      <AchievementCard
        achievement={createMockAchievement({ tier: 'gold', is_unlocked: true, achievement_name: 'Gold Achievement', icon: '🥇' })}
        size="medium"
      />
      <AchievementCard
        achievement={createMockAchievement({ tier: 'platinum', is_unlocked: true, achievement_name: 'Platinum Achievement', icon: '💎' })}
        size="medium"
      />
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="p-4 bg-gray-200">
        <Story />
      </div>
    ),
  ],
};

/**
 * All tiers locked - light mode (tests readability)
 */
export const AllTiersLockedLight: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <AchievementCard
        achievement={createMockAchievement({ tier: 'bronze', is_unlocked: false, achievement_name: 'Bronze Achievement', icon: '🥉' })}
        size="medium"
      />
      <AchievementCard
        achievement={createMockAchievement({ tier: 'silver', is_unlocked: false, achievement_name: 'Silver Achievement', icon: '🥈' })}
        size="medium"
      />
      <AchievementCard
        achievement={createMockAchievement({ tier: 'gold', is_unlocked: false, achievement_name: 'Gold Achievement', icon: '🥇' })}
        size="medium"
      />
      <AchievementCard
        achievement={createMockAchievement({ tier: 'platinum', is_unlocked: false, achievement_name: 'Platinum Achievement', icon: '💎' })}
        size="medium"
      />
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="p-4 bg-gray-200">
        <Story />
      </div>
    ),
  ],
};

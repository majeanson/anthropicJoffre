import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { AchievementUnlocked } from '../../AchievementUnlocked';
import { Achievement } from '../../../types/achievements';

/**
 * Create a mock achievement with all required fields
 */
function createMockAchievement(overrides: Partial<Achievement>): Achievement {
  return {
    achievement_id: 1,
    achievement_key: 'test_achievement',
    achievement_name: 'Test Achievement',
    name: 'Test Achievement',
    description: 'Test description',
    rarity: 'common',
    icon: '🏆',
    tier: 'bronze',
    points: 10,
    is_secret: false,
    category: 'gameplay',
    created_at: new Date(),
    ...overrides,
  };
}

/**
 * Wrapper component to handle state for interactive stories
 */
function InteractiveAchievement(props: { achievement: Achievement | null; autoShow?: boolean }) {
  const [showAchievement, setShowAchievement] = useState(props.autoShow ?? true);

  return (
    <>
      <button
        onClick={() => setShowAchievement(true)}
        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
      >
        Unlock Achievement
      </button>
      <AchievementUnlocked
        achievement={showAchievement ? props.achievement : null}
        onDismiss={() => setShowAchievement(false)}
      />
    </>
  );
}

const meta: Meta<typeof InteractiveAchievement> = {
  title: 'Game/AchievementUnlocked',
  component: InteractiveAchievement,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'game',
      values: [
        { name: 'game', value: '#2d4a2d' },
        { name: 'light', value: '#f5f5f5' },
        { name: 'dark', value: '#1a1a1a' },
      ],
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-h-[300px] relative p-8">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof InteractiveAchievement>;

// Common rarity achievement
export const CommonAchievement: Story = {
  args: {
    achievement: createMockAchievement({
      achievement_key: 'first_win',
      achievement_name: 'First Victory',
      name: 'First Victory',
      description: 'Win your first game',
      icon: '🏆',
      rarity: 'common',
      tier: 'bronze',
    }),
    autoShow: true,
  },
};

// Rare achievement
export const RareAchievement: Story = {
  args: {
    achievement: createMockAchievement({
      achievement_key: 'win_streak_5',
      achievement_name: 'On Fire',
      name: 'On Fire',
      description: 'Win 5 games in a row',
      icon: '🔥',
      rarity: 'rare',
      tier: 'silver',
    }),
    autoShow: true,
  },
};

// Epic achievement
export const EpicAchievement: Story = {
  args: {
    achievement: createMockAchievement({
      achievement_key: 'trump_master',
      achievement_name: 'Trump Master',
      name: 'Trump Master',
      description: 'Win 50 tricks with trump cards',
      icon: '👑',
      rarity: 'epic',
      tier: 'gold',
    }),
    autoShow: true,
  },
};

// Legendary achievement
export const LegendaryAchievement: Story = {
  args: {
    achievement: createMockAchievement({
      achievement_key: 'perfect_game',
      achievement_name: 'Perfect Game',
      name: 'Perfect Game',
      description: 'Win all 8 tricks in a single round',
      icon: '💎',
      rarity: 'legendary',
      tier: 'platinum',
    }),
    autoShow: true,
  },
};

// Secret achievement
export const SecretAchievement: Story = {
  args: {
    achievement: createMockAchievement({
      achievement_key: 'hidden_master',
      achievement_name: 'Hidden Master',
      name: 'Hidden Master',
      description: 'You discovered a secret achievement!',
      icon: '🔓',
      rarity: 'epic',
      tier: 'gold',
      is_secret: true,
    }),
    autoShow: true,
  },
};

// Click to show (closed by default)
export const ClickToShow: Story = {
  args: {
    achievement: createMockAchievement({
      achievement_key: 'click_demo',
      achievement_name: 'Demo Achievement',
      name: 'Demo Achievement',
      description: 'Click the button to see this animation',
      icon: '✨',
      rarity: 'rare',
      tier: 'silver',
    }),
    autoShow: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Click the button to trigger the achievement unlock animation',
      },
    },
  },
};

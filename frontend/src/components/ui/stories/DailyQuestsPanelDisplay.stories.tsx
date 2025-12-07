/**
 * Daily Quests Panel Display Stories
 * Sprint 21: Storybook documentation for quest system UI
 */

import type { Meta, StoryObj } from '@storybook/react';
import { DailyQuestsPanelDisplay } from '../DailyQuestsPanelDisplay';

const meta = {
  title: 'Game/DailyQuestsPanel',
  component: DailyQuestsPanelDisplay,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#1a1a2e' }],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    loading: { control: 'boolean' },
    notification: { control: 'text' },
    claimingQuestId: { control: 'number' },
  },
} satisfies Meta<typeof DailyQuestsPanelDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock quest data
const mockQuests = [
  {
    id: 1,
    player_name: 'TestPlayer',
    quest_template_id: 1,
    progress: 2,
    completed: false,
    date_assigned: '2025-12-07',
    reward_claimed: false,
    template: {
      id: 1,
      quest_key: 'play_3_games',
      name: 'Play 3 Games',
      description: 'Complete 3 games in any mode',
      quest_type: 'easy' as const,
      objective_type: 'play_games',
      target_value: 3,
      reward_xp: 50,
      reward_currency: 10,
      icon: '🎮',
      is_active: true,
    },
  },
  {
    id: 2,
    player_name: 'TestPlayer',
    quest_template_id: 2,
    progress: 1,
    completed: true,
    date_assigned: '2025-12-07',
    completed_at: '2025-12-07T14:30:00Z',
    reward_claimed: false,
    template: {
      id: 2,
      quest_key: 'win_1_game',
      name: 'First Victory',
      description: 'Win a game against any opponents',
      quest_type: 'medium' as const,
      objective_type: 'win_games',
      target_value: 1,
      reward_xp: 75,
      reward_currency: 20,
      icon: '🏆',
      is_active: true,
    },
  },
  {
    id: 3,
    player_name: 'TestPlayer',
    quest_template_id: 3,
    progress: 15,
    completed: false,
    date_assigned: '2025-12-07',
    reward_claimed: false,
    template: {
      id: 3,
      quest_key: 'score_50_points',
      name: 'Point Collector',
      description: 'Score a total of 50 points across all games',
      quest_type: 'hard' as const,
      objective_type: 'score_points',
      target_value: 50,
      reward_xp: 100,
      reward_currency: 30,
      icon: '💎',
      is_active: true,
    },
  },
];

const claimedQuests = mockQuests.map((q) => ({
  ...q,
  completed: true,
  reward_claimed: true,
  claimed_at: '2025-12-07T15:00:00Z',
}));

/**
 * Default view with mixed quest states
 */
export const Default: Story = {
  args: {
    quests: mockQuests,
    loading: false,
    notification: null,
    claimingQuestId: null,
  },
};

/**
 * Loading state while fetching quests
 */
export const Loading: Story = {
  args: {
    quests: [],
    loading: true,
    notification: null,
    claimingQuestId: null,
  },
};

/**
 * Empty state when no quests available
 */
export const Empty: Story = {
  args: {
    quests: [],
    loading: false,
    notification: null,
    claimingQuestId: null,
  },
};

/**
 * All quests completed and ready to claim
 */
export const AllCompleted: Story = {
  args: {
    quests: mockQuests.map((q) => ({
      ...q,
      progress: q.template!.target_value,
      completed: true,
    })),
    loading: false,
    notification: null,
    claimingQuestId: null,
  },
};

/**
 * All rewards already claimed
 */
export const AllClaimed: Story = {
  args: {
    quests: claimedQuests,
    loading: false,
    notification: null,
    claimingQuestId: null,
  },
};

/**
 * With reward claim notification
 */
export const WithNotification: Story = {
  args: {
    quests: mockQuests,
    loading: false,
    notification: '🎉 Reward claimed! +75 XP, +20 coins',
    claimingQuestId: null,
  },
};

/**
 * Claiming a reward in progress
 */
export const ClaimingReward: Story = {
  args: {
    quests: mockQuests.map((q) =>
      q.id === 2
        ? { ...q, progress: q.template!.target_value, completed: true }
        : q
    ),
    loading: false,
    notification: null,
    claimingQuestId: 2,
  },
};

/**
 * Interactive demonstration
 */
export const Interactive: Story = {
  args: {
    quests: mockQuests,
    loading: false,
    notification: null,
    claimingQuestId: null,
    onClose: () => console.log('Close clicked'),
    onClaimReward: (questId) => console.log(`Claim reward for quest ${questId}`),
  },
};

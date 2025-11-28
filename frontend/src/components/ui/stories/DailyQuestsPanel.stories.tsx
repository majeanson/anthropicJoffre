/**
 * Daily Quests Panel Stories
 * Sprint 21 - Quest system component showcase
 */

import type { Meta, StoryObj } from '@storybook/react';
import { DailyQuestsPanelDisplay } from '../DailyQuestsPanelDisplay';
import { useState } from 'react';

const meta = {
  title: 'Quest System/DailyQuestsPanel',
  component: DailyQuestsPanelDisplay,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#1a1a1a' },
        { name: 'light', value: '#f5f5f5' },
      ],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DailyQuestsPanelDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample quest data
const easyQuest = {
  id: 1,
  player_name: 'TestPlayer',
  quest_template_id: 1,
  progress: 2,
  completed: false,
  date_assigned: new Date().toISOString(),
  reward_claimed: false,
  template: {
    id: 1,
    quest_key: 'play_games',
    name: 'Play 5 Games',
    description: 'Complete 5 games in any mode',
    quest_type: 'easy' as const,
    objective_type: 'game_completion',
    target_value: 5,
    reward_xp: 50,
    reward_currency: 25,
    icon: '🎮',
    is_active: true,
  },
};

const mediumQuest = {
  id: 2,
  player_name: 'TestPlayer',
  quest_template_id: 2,
  progress: 8,
  completed: false,
  date_assigned: new Date().toISOString(),
  reward_claimed: false,
  template: {
    id: 2,
    quest_key: 'win_rounds',
    name: 'Win 10 Rounds',
    description: 'Win rounds with your team',
    quest_type: 'medium' as const,
    objective_type: 'round_wins',
    target_value: 10,
    reward_xp: 100,
    reward_currency: 50,
    icon: '🏆',
    is_active: true,
  },
};

const hardQuest = {
  id: 3,
  player_name: 'TestPlayer',
  quest_template_id: 3,
  progress: 12,
  completed: true,
  date_assigned: new Date().toISOString(),
  completed_at: new Date().toISOString(),
  reward_claimed: false,
  template: {
    id: 3,
    quest_key: 'perfect_bets',
    name: 'Perfect Betting',
    description: 'Win 15 rounds with exact bet predictions',
    quest_type: 'hard' as const,
    objective_type: 'perfect_bets',
    target_value: 15,
    reward_xp: 200,
    reward_currency: 100,
    icon: '🎯',
    is_active: true,
  },
};

const claimedQuest = {
  ...hardQuest,
  id: 4,
  reward_claimed: true,
  claimed_at: new Date().toISOString(),
};

// Loading state
export const Loading: Story = {
  args: {
    quests: [],
    loading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state while fetching quest data',
      },
    },
  },
};

// Empty state (no quests)
export const NoQuests: Story = {
  args: {
    quests: [],
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state when no quests are available',
      },
    },
  },
};

// Single easy quest in progress
export const EasyQuestInProgress: Story = {
  args: {
    quests: [easyQuest],
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Easy quest with 40% progress (2/5 games)',
      },
    },
  },
};

// Single medium quest in progress
export const MediumQuestInProgress: Story = {
  args: {
    quests: [mediumQuest],
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Medium quest with 80% progress (8/10 rounds)',
      },
    },
  },
};

// Completed quest ready to claim
export const CompletedQuestReadyToClaim: Story = {
  args: {
    quests: [hardQuest],
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Completed hard quest ready to claim rewards',
      },
    },
  },
};

// Already claimed quest
export const ClaimedQuest: Story = {
  args: {
    quests: [claimedQuest],
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Quest with rewards already claimed',
      },
    },
  },
};

// Multiple quests (typical state)
export const MultipleQuests: Story = {
  args: {
    quests: [easyQuest, mediumQuest, hardQuest],
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Typical state with multiple quests at different stages',
      },
    },
  },
};

// All quest states
export const AllQuestStates: Story = {
  args: {
    quests: [
      easyQuest,
      mediumQuest,
      hardQuest,
      claimedQuest,
      {
        ...easyQuest,
        id: 5,
        progress: 0,
        template: {
          ...easyQuest.template!,
          id: 5,
          quest_key: 'special_cards',
          name: 'Play Special Cards',
          description: 'Play 20 special cards (red 0 or brown 0)',
          target_value: 20,
          reward_xp: 75,
          reward_currency: 40,
          icon: '🃏',
        },
      },
    ],
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'All quest states: not started, in progress, completed, claimed',
      },
    },
  },
};

// With notification
export const WithNotification: Story = {
  args: {
    quests: [easyQuest, mediumQuest, hardQuest],
    loading: false,
    notification: '🎉 Quest completed: Win 10 Rounds!',
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows quest completion notification',
      },
    },
  },
};

// Claiming reward state
export const ClaimingReward: Story = {
  args: {
    quests: [hardQuest],
    loading: false,
    claimingQuestId: 3,
  },
  parameters: {
    docs: {
      description: {
        story: 'Claiming reward in progress (button disabled)',
      },
    },
  },
};

// Near completion quests
export const NearCompletion: Story = {
  args: {
    quests: [
      {
        ...easyQuest,
        progress: 4,
        template: {
          ...easyQuest.template!,
          name: 'Almost There!',
          description: 'Just one more game to complete',
        },
      },
      {
        ...mediumQuest,
        progress: 9,
        template: {
          ...mediumQuest.template!,
          name: 'One Win Away',
          description: 'Win 1 more round to complete',
        },
      },
      {
        ...hardQuest,
        progress: 14,
        template: {
          ...hardQuest.template!,
          name: 'Final Push',
          description: 'One perfect bet away from completion',
        },
      },
    ],
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Quests with 80-90% completion (motivational state)',
      },
    },
  },
};

// Interactive example
export const Interactive: Story = {
  render: () => {
    const [quests, setQuests] = useState([easyQuest, mediumQuest, hardQuest]);
    const [notification, setNotification] = useState<string | null>(null);
    const [claimingQuestId, setClaimingQuestId] = useState<number | null>(null);

    const handleClaimReward = (questId: number) => {
      setClaimingQuestId(questId);

      // Simulate claiming delay
      setTimeout(() => {
        setQuests((prev) =>
          prev.map((q) =>
            q.id === questId ? { ...q, reward_claimed: true, claimed_at: new Date().toISOString() } : q
          )
        );

        const quest = quests.find((q) => q.id === questId);
        if (quest?.template) {
          setNotification(
            `✅ Claimed: +${quest.template.reward_xp} XP, +${quest.template.reward_currency} coins!`
          );
          setTimeout(() => setNotification(null), 5000);
        }

        setClaimingQuestId(null);
      }, 1500);
    };

    const handleAddProgress = (questId: number) => {
      setQuests((prev) =>
        prev.map((q) => {
          if (q.id === questId && q.template) {
            const newProgress = Math.min(q.progress + 1, q.template.target_value);
            const completed = newProgress >= q.template.target_value;

            if (completed && !q.completed) {
              setNotification(`🎉 Quest completed: ${q.template.name}!`);
              setTimeout(() => setNotification(null), 5000);
            }

            return {
              ...q,
              progress: newProgress,
              completed,
              completed_at: completed ? new Date().toISOString() : q.completed_at,
            };
          }
          return q;
        })
      );
    };

    return (
      <div className="space-y-4 p-8 bg-gray-900 min-h-screen">
        <DailyQuestsPanelDisplay
          quests={quests}
          loading={false}
          notification={notification}
          claimingQuestId={claimingQuestId}
          onClaimReward={handleClaimReward}
          onClose={() => alert('Close clicked')}
        />

        <div className="fixed bottom-8 right-8 space-y-2 bg-gray-800 p-4 rounded-lg border border-gray-600">
          <h3 className="text-white font-bold mb-2">Quest Controls</h3>
          {quests.map((quest) => (
            <button
              key={quest.id}
              onClick={() => handleAddProgress(quest.id)}
              disabled={quest.completed}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Progress: {quest.template?.name}
            </button>
          ))}
        </div>
      </div>
    );
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Interactive example with controls to add progress and claim rewards',
      },
    },
  },
};

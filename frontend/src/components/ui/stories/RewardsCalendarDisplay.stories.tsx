/**
 * Rewards Calendar Display Stories
 * Sprint 21: Storybook documentation for rewards calendar system UI
 */

import type { Meta, StoryObj } from '@storybook/react';
import { RewardsCalendarDisplay } from '../RewardsCalendarDisplay';

const meta = {
  title: 'Game/RewardsCalendar',
  component: RewardsCalendarDisplay,
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
    claimingDay: { control: 'number' },
  },
} satisfies Meta<typeof RewardsCalendarDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

// Generate 30-day calendar rewards
const generateCalendar = () => {
  const rewards = [];
  for (let day = 1; day <= 30; day++) {
    const isSpecial = [7, 14, 21, 30].includes(day);
    let rewardType = 'coins';
    let rewardAmount = 10 + day * 2;
    let icon = '💰';
    let description = `${rewardAmount} coins`;

    if (day % 5 === 0 && !isSpecial) {
      rewardType = 'xp';
      rewardAmount = 50 + day * 5;
      icon = '⭐';
      description = `${rewardAmount} XP`;
    }

    if (isSpecial) {
      switch (day) {
        case 7:
          icon = '🎴';
          description = '50 coins + card back';
          break;
        case 14:
          icon = '🏷️';
          description = '100 coins + title';
          break;
        case 21:
          icon = '🏅';
          description = '150 coins + badge';
          break;
        case 30:
          icon = '👑';
          description = '500 coins + exclusive!';
          break;
      }
    }

    rewards.push({
      dayNumber: day,
      rewardType,
      rewardAmount,
      rewardItemId: isSpecial ? day : null,
      isSpecial,
      icon,
      description,
    });
  }
  return rewards;
};

const mockCalendar = generateCalendar();

const progressEarlyDays = {
  currentDay: 3,
  rewardsClaimed: [1, 2],
  monthStartDate: '2025-12-01',
  lastClaimedDate: '2025-12-02',
  calendarResets: 0,
};

const progressMidMonth = {
  currentDay: 15,
  rewardsClaimed: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
  monthStartDate: '2025-11-23',
  lastClaimedDate: '2025-12-06',
  calendarResets: 1,
};

const progressNearComplete = {
  currentDay: 28,
  rewardsClaimed: Array.from({ length: 27 }, (_, i) => i + 1),
  monthStartDate: '2025-11-10',
  lastClaimedDate: '2025-12-06',
  calendarResets: 3,
};

const progressComplete = {
  currentDay: 30,
  rewardsClaimed: Array.from({ length: 30 }, (_, i) => i + 1),
  monthStartDate: '2025-11-08',
  lastClaimedDate: '2025-12-07',
  calendarResets: 5,
};

/**
 * Default view - early in the calendar (Day 3)
 */
export const Default: Story = {
  args: {
    calendar: mockCalendar,
    progress: progressEarlyDays,
    loading: false,
    notification: null,
    claimingDay: null,
  },
};

/**
 * Loading state while fetching calendar
 */
export const Loading: Story = {
  args: {
    calendar: [],
    progress: null,
    loading: true,
    notification: null,
    claimingDay: null,
  },
};

/**
 * Mid-month progress (Day 15) - approaching special milestone
 */
export const MidMonth: Story = {
  args: {
    calendar: mockCalendar,
    progress: progressMidMonth,
    loading: false,
    notification: null,
    claimingDay: null,
  },
};

/**
 * Near complete (Day 28) - almost at final reward
 */
export const NearComplete: Story = {
  args: {
    calendar: mockCalendar,
    progress: progressNearComplete,
    loading: false,
    notification: null,
    claimingDay: null,
  },
};

/**
 * Fully complete calendar (all 30 days claimed)
 */
export const Complete: Story = {
  args: {
    calendar: mockCalendar,
    progress: progressComplete,
    loading: false,
    notification: null,
    claimingDay: null,
  },
};

/**
 * With reward claim notification
 */
export const WithNotification: Story = {
  args: {
    calendar: mockCalendar,
    progress: progressMidMonth,
    loading: false,
    notification: '🎉 Reward claimed! +50 coins',
    claimingDay: null,
  },
};

/**
 * Claiming a reward in progress
 */
export const ClaimingReward: Story = {
  args: {
    calendar: mockCalendar,
    progress: progressEarlyDays,
    loading: false,
    notification: null,
    claimingDay: 3,
  },
};

/**
 * First day (Day 1) - just started
 */
export const FirstDay: Story = {
  args: {
    calendar: mockCalendar,
    progress: {
      currentDay: 1,
      rewardsClaimed: [],
      monthStartDate: '2025-12-07',
      lastClaimedDate: null,
      calendarResets: 0,
    },
    loading: false,
    notification: null,
    claimingDay: null,
  },
};

/**
 * Special milestone day (Day 7)
 */
export const SpecialMilestone: Story = {
  args: {
    calendar: mockCalendar,
    progress: {
      currentDay: 7,
      rewardsClaimed: [1, 2, 3, 4, 5, 6],
      monthStartDate: '2025-12-01',
      lastClaimedDate: '2025-12-06',
      calendarResets: 0,
    },
    loading: false,
    notification: null,
    claimingDay: null,
  },
};

/**
 * Interactive demonstration with handlers
 */
export const Interactive: Story = {
  args: {
    calendar: mockCalendar,
    progress: progressEarlyDays,
    loading: false,
    notification: null,
    claimingDay: null,
    onClose: () => console.log('Calendar closed'),
    onClaimReward: (day) => console.log(`Claiming reward for day ${day}`),
  },
};

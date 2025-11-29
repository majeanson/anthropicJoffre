/**
 * Rewards Calendar Stories
 * Sprint 21 - Quest system component showcase
 */

import type { Meta, StoryObj } from '@storybook/react';
import { RewardsCalendarDisplay } from '../RewardsCalendarDisplay';
import { useState } from 'react';

const meta = {
  title: 'Quest System/RewardsCalendar',
  component: RewardsCalendarDisplay,
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
} satisfies Meta<typeof RewardsCalendarDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

// Generate 30-day calendar with special milestones
const generateCalendar = () => {
  const specialDays = [7, 14, 21, 30];

  return Array.from({ length: 30 }, (_, i) => {
    const dayNumber = i + 1;
    const isSpecial = specialDays.includes(dayNumber);

    if (isSpecial) {
      return {
        dayNumber,
        rewardType: 'special',
        rewardAmount: dayNumber * 10,
        rewardItemId: null,
        isSpecial: true,
        icon: '🎁',
        description: `${dayNumber * 10} coins + bonus`,
      };
    }

    return {
      dayNumber,
      rewardType: 'currency',
      rewardAmount: 10 + Math.floor(dayNumber / 5) * 5,
      rewardItemId: null,
      isSpecial: false,
      icon: '💰',
      description: `${10 + Math.floor(dayNumber / 5) * 5} coins`,
    };
  });
};

const calendar = generateCalendar();

// Loading state
export const Loading: Story = {
  args: {
    calendar: [],
    progress: null,
    loading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state while fetching calendar data',
      },
    },
  },
};

// Day 1 - Fresh start
export const Day1FreshStart: Story = {
  args: {
    calendar,
    progress: {
      currentDay: 1,
      rewardsClaimed: [],
      monthStartDate: new Date().toISOString(),
      lastClaimedDate: null,
      calendarResets: 0,
    },
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'First day of calendar, no rewards claimed yet',
      },
    },
  },
};

// Day 5 - Early progress
export const Day5EarlyProgress: Story = {
  args: {
    calendar,
    progress: {
      currentDay: 5,
      rewardsClaimed: [1, 2, 3, 4],
      monthStartDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      lastClaimedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      calendarResets: 0,
    },
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Day 5 with 4 previous days claimed',
      },
    },
  },
};

// Day 7 - First milestone
export const Day7FirstMilestone: Story = {
  args: {
    calendar,
    progress: {
      currentDay: 7,
      rewardsClaimed: [1, 2, 3, 4, 5, 6],
      monthStartDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      lastClaimedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      calendarResets: 0,
    },
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'First special milestone available (Day 7) - 50 coins + card back',
      },
    },
  },
};

// Day 14 - Second milestone
export const Day14SecondMilestone: Story = {
  args: {
    calendar,
    progress: {
      currentDay: 14,
      rewardsClaimed: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
      monthStartDate: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
      lastClaimedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      calendarResets: 0,
    },
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Second special milestone (Day 14) - 100 coins + title',
      },
    },
  },
};

// Day 21 - Third milestone
export const Day21ThirdMilestone: Story = {
  args: {
    calendar,
    progress: {
      currentDay: 21,
      rewardsClaimed: Array.from({ length: 20 }, (_, i) => i + 1),
      monthStartDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      lastClaimedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      calendarResets: 1,
    },
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Third special milestone (Day 21) - 150 coins + badge',
      },
    },
  },
};

// Day 30 - Final milestone
export const Day30FinalMilestone: Story = {
  args: {
    calendar,
    progress: {
      currentDay: 30,
      rewardsClaimed: Array.from({ length: 29 }, (_, i) => i + 1),
      monthStartDate: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString(),
      lastClaimedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      calendarResets: 2,
    },
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Final milestone (Day 30) - 500 coins + exclusive rewards!',
      },
    },
  },
};

// Missed days
export const MissedDays: Story = {
  args: {
    calendar,
    progress: {
      currentDay: 10,
      rewardsClaimed: [1, 2, 3, 5, 7, 8],
      monthStartDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      lastClaimedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      calendarResets: 0,
    },
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Some days missed (Days 4, 6, 9) - shown with reduced opacity',
      },
    },
  },
};

// Perfect attendance
export const PerfectAttendance: Story = {
  args: {
    calendar,
    progress: {
      currentDay: 15,
      rewardsClaimed: Array.from({ length: 14 }, (_, i) => i + 1),
      monthStartDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      lastClaimedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      calendarResets: 3,
    },
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Perfect attendance - no missed days, 3 previous cycles completed',
      },
    },
  },
};

// With notification (reward claimed)
export const WithNotification: Story = {
  args: {
    calendar,
    progress: {
      currentDay: 8,
      rewardsClaimed: [1, 2, 3, 4, 5, 6, 7],
      monthStartDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      lastClaimedDate: new Date().toISOString(),
      calendarResets: 0,
    },
    loading: false,
    notification: '✅ Day 7 claimed: +50 coins, +card back!',
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows reward claimed notification',
      },
    },
  },
};

// Claiming in progress
export const ClaimingInProgress: Story = {
  args: {
    calendar,
    progress: {
      currentDay: 10,
      rewardsClaimed: Array.from({ length: 9 }, (_, i) => i + 1),
      monthStartDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      lastClaimedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      calendarResets: 0,
    },
    loading: false,
    claimingDay: 10,
  },
  parameters: {
    docs: {
      description: {
        story: 'Reward claim in progress (all buttons disabled)',
      },
    },
  },
};

// All milestones highlighted
export const AllMilestones: Story = {
  args: {
    calendar,
    progress: {
      currentDay: 1,
      rewardsClaimed: [],
      monthStartDate: new Date().toISOString(),
      lastClaimedDate: null,
      calendarResets: 5,
    },
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'View showing all special milestone days (7, 14, 21, 30)',
      },
    },
  },
};

// Interactive example
export const Interactive: Story = {
  args: {
    calendar: generateCalendar(),
    progress: {
      currentDay: 5,
      rewardsClaimed: [1, 2, 3, 4],
      monthStartDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      lastClaimedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      calendarResets: 0,
    },
  },
  render: () => {
    const [progress, setProgress] = useState({
      currentDay: 5,
      rewardsClaimed: [1, 2, 3, 4],
      monthStartDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      lastClaimedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      calendarResets: 0,
    });
    const [notification, setNotification] = useState<string | null>(null);
    const [claimingDay, setClaimingDay] = useState<number | null>(null);

    const handleClaimReward = (dayNumber: number) => {
      // Validate
      if (dayNumber > progress.currentDay) {
        setNotification('❌ Cannot claim future rewards!');
        setTimeout(() => setNotification(null), 3000);
        return;
      }

      if (progress.rewardsClaimed.includes(dayNumber)) {
        setNotification('⚠️ Already claimed!');
        setTimeout(() => setNotification(null), 3000);
        return;
      }

      setClaimingDay(dayNumber);

      // Simulate claiming delay
      setTimeout(() => {
        setProgress((prev) => ({
          ...prev,
          rewardsClaimed: [...prev.rewardsClaimed, dayNumber].sort((a, b) => a - b),
          lastClaimedDate: new Date().toISOString(),
        }));

        const reward = calendar.find((r) => r.dayNumber === dayNumber);
        setNotification(`✅ Day ${dayNumber} claimed: ${reward?.description}!`);
        setTimeout(() => setNotification(null), 5000);

        setClaimingDay(null);
      }, 1000);
    };

    const handleAdvanceDay = () => {
      setProgress((prev) => ({
        ...prev,
        currentDay: Math.min(30, prev.currentDay + 1),
      }));
    };

    const handleReset = () => {
      setProgress({
        currentDay: 1,
        rewardsClaimed: [],
        monthStartDate: new Date().toISOString(),
        lastClaimedDate: new Date().toISOString(),
        calendarResets: progress.calendarResets + 1,
      });
      setNotification('🔄 Calendar reset! Starting new cycle.');
      setTimeout(() => setNotification(null), 3000);
    };

    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <RewardsCalendarDisplay
          calendar={calendar}
          progress={progress}
          loading={false}
          notification={notification}
          claimingDay={claimingDay}
          onClaimReward={handleClaimReward}
          onClose={() => alert('Close clicked')}
        />

        <div className="fixed bottom-8 right-8 space-y-2 bg-gray-800 p-4 rounded-lg border border-gray-600">
          <h3 className="text-white font-bold mb-2">Calendar Controls</h3>
          <button
            onClick={handleAdvanceDay}
            disabled={progress.currentDay >= 30}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Advance Day ({progress.currentDay}/30)
          </button>
          <button
            onClick={handleReset}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
          >
            Reset Calendar
          </button>
          <div className="text-gray-300 text-xs mt-2">
            Claimed: {progress.rewardsClaimed.length}/30
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Interactive calendar with controls to advance days and reset',
      },
    },
  },
};

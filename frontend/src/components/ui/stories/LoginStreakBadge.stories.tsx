/**
 * Login Streak Badge Stories
 * Sprint 21 - Quest system component showcase
 */

import type { Meta, StoryObj } from '@storybook/react';
import { LoginStreakBadgeDisplay } from '../LoginStreakBadgeDisplay';
import { useState } from 'react';

const meta = {
  title: 'Quest System/LoginStreakBadge',
  component: LoginStreakBadgeDisplay,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#1a1a1a' },
        { name: 'light', value: '#f5f5f5' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    showFreezeNotification: {
      control: 'boolean',
      description: 'Show freeze used notification',
    },
  },
} satisfies Meta<typeof LoginStreakBadgeDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

// No streak
export const NoStreak: Story = {
  args: {
    streak: {
      currentStreak: 0,
      longestStreak: 7,
      lastLoginDate: null,
      streakFreezeAvailable: true,
      totalLogins: 15,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Player with no current streak (missed login)',
      },
    },
  },
};

// Getting started (1-2 days)
export const GettingStarted: Story = {
  args: {
    streak: {
      currentStreak: 2,
      longestStreak: 5,
      lastLoginDate: new Date().toISOString(),
      streakFreezeAvailable: true,
      totalLogins: 8,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Player with 2-day streak - blue badge',
      },
    },
  },
};

// On fire (3-6 days)
export const OnFire: Story = {
  args: {
    streak: {
      currentStreak: 5,
      longestStreak: 10,
      lastLoginDate: new Date().toISOString(),
      streakFreezeAvailable: true,
      totalLogins: 25,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Player with 5-day streak - purple badge, double fire',
      },
    },
  },
};

// Weekly streak (7-13 days)
export const WeeklyStreak: Story = {
  args: {
    streak: {
      currentStreak: 7,
      longestStreak: 15,
      lastLoginDate: new Date().toISOString(),
      streakFreezeAvailable: false,
      totalLogins: 42,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Player with 7-day streak - pink badge, triple fire, freeze used',
      },
    },
  },
};

// Dedicated (14-20 days)
export const Dedicated: Story = {
  args: {
    streak: {
      currentStreak: 14,
      longestStreak: 20,
      lastLoginDate: new Date().toISOString(),
      streakFreezeAvailable: true,
      totalLogins: 85,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Player with 14-day streak - pink badge, legendary (fire + diamond)',
      },
    },
  },
};

// Legendary (21+ days)
export const Legendary: Story = {
  args: {
    streak: {
      currentStreak: 28,
      longestStreak: 28,
      lastLoginDate: new Date().toISOString(),
      streakFreezeAvailable: true,
      totalLogins: 150,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Player with 28-day streak - orange badge, legendary status (fire + diamond)',
      },
    },
  },
};

// With freeze notification
export const WithFreezeNotification: Story = {
  args: {
    streak: {
      currentStreak: 10,
      longestStreak: 12,
      lastLoginDate: new Date().toISOString(),
      streakFreezeAvailable: false,
      totalLogins: 50,
    },
    showFreezeNotification: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the freeze used notification (auto-dismisses after 5s)',
      },
    },
  },
};

// Freeze available
export const FreezeAvailable: Story = {
  args: {
    streak: {
      currentStreak: 10,
      longestStreak: 15,
      lastLoginDate: new Date().toISOString(),
      streakFreezeAvailable: true,
      totalLogins: 60,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge with freeze shield indicator',
      },
    },
  },
};

// Freeze used
export const FreezeUsed: Story = {
  args: {
    streak: {
      currentStreak: 10,
      longestStreak: 15,
      lastLoginDate: new Date().toISOString(),
      streakFreezeAvailable: false,
      totalLogins: 60,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge without freeze shield (already used)',
      },
    },
  },
};

// Milestone reached (exactly 7 days)
export const SevenDayMilestone: Story = {
  args: {
    streak: {
      currentStreak: 7,
      longestStreak: 7,
      lastLoginDate: new Date().toISOString(),
      streakFreezeAvailable: true,
      totalLogins: 12,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Player just reached 7-day milestone',
      },
    },
  },
};

// All streak levels showcase
export const AllStreakLevels: Story = {
  args: {
    streak: {
      currentStreak: 5,
      longestStreak: 10,
      lastLoginDate: new Date().toISOString(),
      streakFreezeAvailable: true,
      totalLogins: 25,
    },
  },
  render: () => (
    <div className="flex flex-col gap-4 p-8 bg-gray-900 rounded-lg">
      <h3 className="text-white text-xl font-bold mb-2">Streak Progression</h3>
      <div className="grid grid-cols-2 gap-4">
        <LoginStreakBadgeDisplay
          streak={{
            currentStreak: 0,
            longestStreak: 5,
            lastLoginDate: null,
            streakFreezeAvailable: true,
            totalLogins: 10,
          }}
        />
        <LoginStreakBadgeDisplay
          streak={{
            currentStreak: 2,
            longestStreak: 5,
            lastLoginDate: new Date().toISOString(),
            streakFreezeAvailable: true,
            totalLogins: 15,
          }}
        />
        <LoginStreakBadgeDisplay
          streak={{
            currentStreak: 5,
            longestStreak: 10,
            lastLoginDate: new Date().toISOString(),
            streakFreezeAvailable: true,
            totalLogins: 25,
          }}
        />
        <LoginStreakBadgeDisplay
          streak={{
            currentStreak: 7,
            longestStreak: 12,
            lastLoginDate: new Date().toISOString(),
            streakFreezeAvailable: false,
            totalLogins: 35,
          }}
        />
        <LoginStreakBadgeDisplay
          streak={{
            currentStreak: 14,
            longestStreak: 20,
            lastLoginDate: new Date().toISOString(),
            streakFreezeAvailable: true,
            totalLogins: 75,
          }}
        />
        <LoginStreakBadgeDisplay
          streak={{
            currentStreak: 28,
            longestStreak: 28,
            lastLoginDate: new Date().toISOString(),
            streakFreezeAvailable: true,
            totalLogins: 150,
          }}
        />
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'All streak levels from 0 to 28 days',
      },
    },
  },
};

// Interactive example
export const Interactive: Story = {
  args: {
    streak: {
      currentStreak: 5,
      longestStreak: 10,
      lastLoginDate: new Date().toISOString(),
      streakFreezeAvailable: true,
      totalLogins: 50,
    },
  },
  render: () => {
    const [currentStreak, setCurrentStreak] = useState(5);
    const [showNotification, setShowNotification] = useState(false);
    const [freezeAvailable, setFreezeAvailable] = useState(true);

    return (
      <div className="flex flex-col gap-4 p-8 bg-gray-900 rounded-lg">
        <LoginStreakBadgeDisplay
          streak={{
            currentStreak,
            longestStreak: Math.max(currentStreak, 10),
            lastLoginDate: new Date().toISOString(),
            streakFreezeAvailable: freezeAvailable,
            totalLogins: 50,
          }}
          showFreezeNotification={showNotification}
          onClick={() => alert('Badge clicked!')}
        />

        <div className="space-y-3 mt-4">
          <div>
            <label className="text-white text-sm block mb-2">Streak Days: {currentStreak}</label>
            <input
              type="range"
              min="0"
              max="30"
              value={currentStreak}
              onChange={(e) => setCurrentStreak(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowNotification(true);
                setTimeout(() => setShowNotification(false), 3000);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Show Freeze Notification
            </button>
            <button
              onClick={() => setFreezeAvailable(!freezeAvailable)}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Toggle Freeze: {freezeAvailable ? 'Available' : 'Used'}
            </button>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Interactive example with controls',
      },
    },
  },
};

/**
 * Login Streak Badge Display Stories
 * Sprint 21: Storybook documentation for login streak system UI
 */

import type { Meta, StoryObj } from '@storybook/react';
import { LoginStreakBadgeDisplay } from '../LoginStreakBadgeDisplay';

const meta = {
  title: 'Game/LoginStreakBadge',
  component: LoginStreakBadgeDisplay,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#1a1a2e' }],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    showFreezeNotification: { control: 'boolean' },
  },
} satisfies Meta<typeof LoginStreakBadgeDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock streak data for different states
const noStreak = {
  currentStreak: 0,
  longestStreak: 5,
  lastLoginDate: null,
  streakFreezeAvailable: true,
  totalLogins: 15,
};

const gettingStarted = {
  currentStreak: 2,
  longestStreak: 7,
  lastLoginDate: '2025-12-06',
  streakFreezeAvailable: true,
  totalLogins: 25,
};

const onFire = {
  currentStreak: 5,
  longestStreak: 12,
  lastLoginDate: '2025-12-07',
  streakFreezeAvailable: true,
  totalLogins: 50,
};

const dedicated = {
  currentStreak: 10,
  longestStreak: 14,
  lastLoginDate: '2025-12-07',
  streakFreezeAvailable: false,
  totalLogins: 85,
};

const legendary = {
  currentStreak: 21,
  longestStreak: 30,
  lastLoginDate: '2025-12-07',
  streakFreezeAvailable: true,
  totalLogins: 150,
};

/**
 * No streak (0 days) - gray badge
 */
export const NoStreak: Story = {
  args: {
    streak: noStreak,
    showFreezeNotification: false,
  },
};

/**
 * Getting Started (1-2 days) - blue badge
 */
export const GettingStarted: Story = {
  args: {
    streak: gettingStarted,
    showFreezeNotification: false,
  },
};

/**
 * On Fire (3-6 days) - purple badge with double fire
 */
export const OnFire: Story = {
  args: {
    streak: onFire,
    showFreezeNotification: false,
  },
};

/**
 * Dedicated (7-13 days) - pink badge with triple fire
 */
export const Dedicated: Story = {
  args: {
    streak: dedicated,
    showFreezeNotification: false,
  },
};

/**
 * Legendary (14+ days) - orange badge with diamond
 */
export const Legendary: Story = {
  args: {
    streak: legendary,
    showFreezeNotification: false,
  },
};

/**
 * Shows freeze notification banner
 */
export const WithFreezeNotification: Story = {
  args: {
    streak: dedicated,
    showFreezeNotification: true,
  },
};

/**
 * Freeze not available (already used)
 */
export const FreezeUsed: Story = {
  args: {
    streak: {
      ...onFire,
      streakFreezeAvailable: false,
    },
    showFreezeNotification: false,
  },
};

/**
 * Single day streak
 */
export const SingleDay: Story = {
  args: {
    streak: {
      currentStreak: 1,
      longestStreak: 1,
      lastLoginDate: '2025-12-07',
      streakFreezeAvailable: true,
      totalLogins: 1,
    },
    showFreezeNotification: false,
  },
};

/**
 * Interactive with click handler
 */
export const Interactive: Story = {
  args: {
    streak: onFire,
    showFreezeNotification: false,
    onClick: () => console.log('Streak badge clicked - open calendar'),
  },
};

/**
 * StatCard Stories
 * Storybook stories for the StatCard component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { StatCard } from './StatCard';

const meta: Meta<typeof StatCard> = {
  title: 'UI/StatCard',
  component: StatCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A card component for displaying statistics with an icon, value, and label.

**Use cases:**
- Player profile stats (games played, wins, etc.)
- Progress modal statistics
- Achievement counters
- Leaderboard metrics

**Features:**
- Localized number formatting
- Optional suffix for units
- Skin-aware styling for theme support
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    icon: {
      control: 'text',
      description: 'Emoji or icon to display',
    },
    label: {
      control: 'text',
      description: 'Label text below the value',
    },
    value: {
      control: 'number',
      description: 'Numeric value to display',
    },
    suffix: {
      control: 'text',
      description: 'Optional suffix (e.g., "%", "pts")',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatCard>;

/**
 * Default stat card showing games played
 */
export const Default: Story = {
  args: {
    icon: '🎮',
    label: 'Games Played',
    value: 156,
  },
};

/**
 * Win rate with percentage suffix
 */
export const WithSuffix: Story = {
  args: {
    icon: '🏆',
    label: 'Win Rate',
    value: 68,
    suffix: '%',
  },
};

/**
 * Large number with localization
 */
export const LargeNumber: Story = {
  args: {
    icon: '⭐',
    label: 'Total Points',
    value: 1234567,
  },
};

/**
 * Zero value state
 */
export const ZeroValue: Story = {
  args: {
    icon: '❌',
    label: 'Losses',
    value: 0,
  },
};

/**
 * Custom styling with className
 */
export const CustomStyling: Story = {
  args: {
    icon: '🔥',
    label: 'Win Streak',
    value: 12,
    className: 'bg-gradient-to-br from-orange-500/20 to-red-500/20',
  },
};

/**
 * Grid of multiple stat cards (common layout)
 */
export const StatsGrid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-3 w-80">
      <StatCard icon="🎮" label="Games" value={256} />
      <StatCard icon="🏆" label="Wins" value={142} />
      <StatCard icon="📊" label="Win Rate" value={55} suffix="%" />
      <StatCard icon="🔥" label="Best Streak" value={8} />
    </div>
  ),
};

/**
 * Profile stats layout (3 columns)
 */
export const ProfileStats: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-3 w-96">
      <StatCard icon="🎯" label="Bets Won" value={89} />
      <StatCard icon="🃏" label="Trumps Played" value={312} />
      <StatCard icon="💰" label="Coins" value={5420} />
    </div>
  ),
};

/**
 * Achievement progress stats
 */
export const AchievementStats: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-3 w-72">
      <StatCard icon="🏅" label="Unlocked" value={24} suffix="/50" />
      <StatCard icon="⭐" label="Points" value={1850} suffix="pts" />
    </div>
  ),
};

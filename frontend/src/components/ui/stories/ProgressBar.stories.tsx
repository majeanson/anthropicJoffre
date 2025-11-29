/**
 * ProgressBar Component Stories
 * Comprehensive Storybook stories for the ProgressBar component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ProgressBar } from '../ProgressBar';

const meta = {
  title: 'UI/ProgressBar',
  component: ProgressBar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100 },
      description: 'Current progress value',
    },
    max: {
      control: { type: 'number', min: 1 },
      description: 'Maximum value',
    },
    variant: {
      control: 'select',
      options: ['default', 'gradient', 'striped'],
      description: 'Progress bar variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Progress bar size',
    },
    color: {
      control: 'select',
      options: ['primary', 'success', 'warning', 'error', 'info', 'gray'],
      description: 'Color theme',
    },
    showValue: {
      control: 'boolean',
      description: 'Show percentage value',
    },
    animated: {
      control: 'boolean',
      description: 'Animate progress changes',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '320px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Examples
export const Default: Story = {
  args: {
    value: 65,
  },
};

export const WithLabel: Story = {
  args: {
    value: 75,
    label: 'Loading...',
    showValue: true,
  },
};

export const Complete: Story = {
  args: {
    value: 100,
    label: 'Complete!',
    showValue: true,
    color: 'success',
  },
};

// Variants
export const GradientVariant: Story = {
  args: {
    value: 60,
    variant: 'gradient',
    label: 'Gradient Progress',
    showValue: true,
  },
};

export const StripedVariant: Story = {
  args: {
    value: 45,
    variant: 'striped',
    label: 'Striped Progress',
    showValue: true,
  },
};

// Sizes
export const SmallSize: Story = {
  args: {
    value: 50,
    size: 'sm',
    label: 'Small',
    showValue: true,
  },
};

export const MediumSize: Story = {
  args: {
    value: 50,
    size: 'md',
    label: 'Medium',
    showValue: true,
  },
};

export const LargeSize: Story = {
  args: {
    value: 50,
    size: 'lg',
    label: 'Large',
    showValue: true,
  },
};

// Colors
export const PrimaryColor: Story = {
  args: {
    value: 70,
    color: 'primary',
    showValue: true,
  },
};

export const SuccessColor: Story = {
  args: {
    value: 70,
    color: 'success',
    showValue: true,
  },
};

export const WarningColor: Story = {
  args: {
    value: 70,
    color: 'warning',
    showValue: true,
  },
};

export const ErrorColor: Story = {
  args: {
    value: 70,
    color: 'error',
    showValue: true,
  },
};

export const InfoColor: Story = {
  args: {
    value: 70,
    color: 'info',
    showValue: true,
  },
};

export const GrayColor: Story = {
  args: {
    value: 70,
    color: 'gray',
    showValue: true,
  },
};

// Custom Formatter
export const CustomValueFormat: Story = {
  args: {
    value: 5,
    max: 10,
    label: 'Quest Progress',
    showValue: true,
    valueFormatter: (value, max) => `${value}/${max}`,
  },
};

// Showcase: All Sizes
export const AllSizes: Story = {
  args: {
    value: 50,
  },
  render: () => (
    <div className="space-y-6">
      <ProgressBar value={60} size="sm" label="Small" showValue />
      <ProgressBar value={60} size="md" label="Medium" showValue />
      <ProgressBar value={60} size="lg" label="Large" showValue />
    </div>
  ),
};

// Showcase: All Colors
export const AllColors: Story = {
  args: {
    value: 50,
  },
  render: () => (
    <div className="space-y-4">
      <ProgressBar value={70} color="primary" label="Primary" showValue />
      <ProgressBar value={70} color="success" label="Success" showValue />
      <ProgressBar value={70} color="warning" label="Warning" showValue />
      <ProgressBar value={70} color="error" label="Error" showValue />
      <ProgressBar value={70} color="info" label="Info" showValue />
      <ProgressBar value={70} color="gray" label="Gray" showValue />
    </div>
  ),
};

// Showcase: All Variants
export const AllVariants: Story = {
  args: {
    value: 50,
  },
  render: () => (
    <div className="space-y-6">
      <ProgressBar value={65} variant="default" label="Default" showValue />
      <ProgressBar value={65} variant="gradient" label="Gradient" showValue />
      <ProgressBar value={65} variant="striped" label="Striped" showValue />
    </div>
  ),
};

// Showcase: Quest Progress
export const QuestProgress: Story = {
  args: {
    value: 50,
  },
  render: () => (
    <div className="space-y-4 p-4 bg-parchment-100 dark:bg-gray-800 rounded-lg">
      <h3 className="text-lg font-bold text-umber-900 dark:text-gray-100 mb-4">
        Daily Quests
      </h3>
      <ProgressBar
        value={3}
        max={5}
        label="Win 5 Games"
        showValue
        valueFormatter={(v, m) => `${v}/${m}`}
        color="primary"
      />
      <ProgressBar
        value={10}
        max={10}
        label="Play 10 Cards"
        showValue
        valueFormatter={(v, m) => `${v}/${m}`}
        color="success"
      />
      <ProgressBar
        value={1}
        max={3}
        label="Use All Trump Cards"
        showValue
        valueFormatter={(v, m) => `${v}/${m}`}
        color="warning"
      />
    </div>
  ),
};

// Showcase: Achievement Progress
export const AchievementProgress: Story = {
  args: {
    value: 50,
  },
  render: () => (
    <div className="space-y-4 p-4 bg-gray-900 rounded-lg">
      <h3 className="text-lg font-bold text-gray-100 mb-4">
        Achievements
      </h3>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <div className="flex-1">
            <ProgressBar
              value={75}
              label="Master Strategist"
              showValue
              variant="gradient"
              color="warning"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl">⭐</span>
          <div className="flex-1">
            <ProgressBar
              value={100}
              label="First Victory"
              showValue
              color="success"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎯</span>
          <div className="flex-1">
            <ProgressBar
              value={40}
              label="Sharpshooter"
              showValue
              color="primary"
            />
          </div>
        </div>
      </div>
    </div>
  ),
};

// Showcase: Password Strength
export const PasswordStrength: Story = {
  args: {
    value: 50,
  },
  render: () => (
    <div className="space-y-4 p-4 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-bold text-gray-100 mb-4">
        Password Strength Examples
      </h3>
      <ProgressBar
        value={25}
        label="Weak"
        showValue
        color="error"
        size="sm"
      />
      <ProgressBar
        value={50}
        label="Fair"
        showValue
        color="warning"
        size="sm"
      />
      <ProgressBar
        value={75}
        label="Good"
        showValue
        color="info"
        size="sm"
      />
      <ProgressBar
        value={100}
        label="Strong"
        showValue
        color="success"
        size="sm"
      />
    </div>
  ),
};

// Showcase: Loading States
export const LoadingStates: Story = {
  args: {
    value: 50,
  },
  render: () => (
    <div className="space-y-6 p-4 bg-parchment-100 dark:bg-gray-800 rounded-lg">
      <h3 className="text-lg font-bold text-umber-900 dark:text-gray-100 mb-4">
        Loading States
      </h3>
      <ProgressBar
        value={30}
        variant="striped"
        label="Connecting..."
        color="info"
      />
      <ProgressBar
        value={60}
        variant="striped"
        label="Loading game data..."
        color="primary"
      />
      <ProgressBar
        value={90}
        variant="gradient"
        label="Almost ready..."
        color="success"
      />
    </div>
  ),
};

// Showcase: Memory Usage (like debug panel)
export const MemoryUsage: Story = {
  args: {
    value: 50,
  },
  render: () => (
    <div className="space-y-3 p-4 bg-gray-900 rounded-lg">
      <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">
        Server Health
      </h3>
      <ProgressBar
        value={45}
        label="Heap Memory"
        showValue
        valueFormatter={(v) => `${v}MB / 100MB`}
        color={45 > 80 ? 'error' : 45 > 60 ? 'warning' : 'success'}
        size="sm"
      />
      <ProgressBar
        value={72}
        label="CPU Usage"
        showValue
        valueFormatter={(v) => `${v}%`}
        color={72 > 80 ? 'error' : 72 > 60 ? 'warning' : 'success'}
        size="sm"
      />
      <ProgressBar
        value={23}
        label="Network I/O"
        showValue
        valueFormatter={(v) => `${v}%`}
        color="info"
        size="sm"
      />
    </div>
  ),
};

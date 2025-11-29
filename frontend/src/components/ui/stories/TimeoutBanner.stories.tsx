import type { Meta, StoryObj } from '@storybook/react';
import { TimeoutBanner } from '../../TimeoutBanner';

const meta: Meta<typeof TimeoutBanner> = {
  title: 'Game/TimeoutBanner',
  component: TimeoutBanner,
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
  argTypes: {
    secondsRemaining: {
      control: { type: 'range', min: 0, max: 60 },
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-[200px] relative">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TimeoutBanner>;

// Normal state (30+ seconds)
export const Normal: Story = {
  args: {
    playerName: 'Alice',
    secondsRemaining: 45,
    isCurrentPlayer: false,
  },
};

// Warning state (15 seconds or less)
export const Warning: Story = {
  args: {
    playerName: 'Bob',
    secondsRemaining: 12,
    isCurrentPlayer: false,
  },
};

// Critical state (5 seconds or less)
export const Critical: Story = {
  args: {
    playerName: 'Charlie',
    secondsRemaining: 4,
    isCurrentPlayer: false,
  },
};

// Your turn variant
export const YourTurn: Story = {
  args: {
    playerName: 'You',
    secondsRemaining: 25,
    isCurrentPlayer: true,
  },
};

// Your turn warning
export const YourTurnWarning: Story = {
  args: {
    playerName: 'You',
    secondsRemaining: 10,
    isCurrentPlayer: true,
  },
};

// Your turn critical
export const YourTurnCritical: Story = {
  args: {
    playerName: 'You',
    secondsRemaining: 3,
    isCurrentPlayer: true,
  },
};

// Hidden state (0 or >60 seconds)
export const Hidden: Story = {
  args: {
    playerName: 'Alice',
    secondsRemaining: 0,
    isCurrentPlayer: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Banner is hidden when secondsRemaining is 0 or > 60',
      },
    },
  },
};

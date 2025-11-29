import type { Meta, StoryObj } from '@storybook/react';
import { TrickWinnerBanner } from '../../TrickWinnerBanner';
import { SettingsProvider } from '../../../contexts/SettingsContext';

const meta: Meta<typeof TrickWinnerBanner> = {
  title: 'Game/TrickWinnerBanner',
  component: TrickWinnerBanner,
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
      <SettingsProvider>
        <div className="min-h-[200px] relative">
          <Story />
        </div>
      </SettingsProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TrickWinnerBanner>;

// Team 1 (Orange) winner
export const Team1Winner: Story = {
  args: {
    playerName: 'Alice',
    points: 1,
    teamColor: 'orange',
  },
};

// Team 2 (Purple) winner
export const Team2Winner: Story = {
  args: {
    playerName: 'Bob',
    points: 1,
    teamColor: 'purple',
  },
};

// High points win (Red 0 bonus)
export const HighPointsWin: Story = {
  args: {
    playerName: 'Charlie',
    points: 6,
    teamColor: 'orange',
  },
  parameters: {
    docs: {
      description: {
        story: 'When Red 0 is captured, the trick is worth 6 points (1 base + 5 bonus)',
      },
    },
  },
};

// Negative points (Brown 0 penalty)
export const NegativePoints: Story = {
  args: {
    playerName: 'Dave',
    points: -1,
    teamColor: 'purple',
  },
  parameters: {
    docs: {
      description: {
        story: 'When Brown 0 is captured, the trick is worth -1 points (1 base - 2 penalty)',
      },
    },
  },
};

// Long player name
export const LongName: Story = {
  args: {
    playerName: 'SuperLongPlayerName123',
    points: 2,
    teamColor: 'orange',
  },
};

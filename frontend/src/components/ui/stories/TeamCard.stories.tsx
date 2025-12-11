/**
 * TeamCard Component Stories
 * Comprehensive Storybook stories for TeamCard, TeamBadge, and TeamIndicator
 */

import type { Meta, StoryObj } from '@storybook/react';
import { TeamCard, TeamBadge, TeamIndicator } from '../TeamCard';

const meta = {
  title: 'UI/TeamCard',
  component: TeamCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    teamId: {
      control: 'select',
      options: [1, 2],
      description: 'Team ID (1 = orange, 2 = purple)',
    },
    variant: {
      control: 'select',
      options: ['solid', 'subtle', 'outlined'],
      description: 'Card variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Card size',
    },
    selected: {
      control: 'boolean',
      description: 'Selected/highlighted state',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
  },
} satisfies Meta<typeof TeamCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Examples
export const Team1Subtle: Story = {
  args: {
    teamId: 1,
    variant: 'subtle',
    children: 'Team 1 Player Card',
  },
};

export const Team2Subtle: Story = {
  args: {
    teamId: 2,
    variant: 'subtle',
    children: 'Team 2 Player Card',
  },
};

export const Team1Solid: Story = {
  args: {
    teamId: 1,
    variant: 'solid',
    children: 'Team 1 Solid',
  },
};

export const Team2Solid: Story = {
  args: {
    teamId: 2,
    variant: 'solid',
    children: 'Team 2 Solid',
  },
};

export const Team1Outlined: Story = {
  args: {
    teamId: 1,
    variant: 'outlined',
    children: 'Team 1 Outlined',
  },
};

export const Team2Outlined: Story = {
  args: {
    teamId: 2,
    variant: 'outlined',
    children: 'Team 2 Outlined',
  },
};

// Showcase: All Variants
export const AllVariants: Story = {
  args: {
    teamId: 1,
    children: '',
  },
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-skin-muted mb-2">Team 1 (Orange)</h3>
        <div className="flex gap-4">
          <TeamCard teamId={1} variant="subtle" className="min-w-[150px]">
            <p className="font-semibold">Subtle</p>
          </TeamCard>
          <TeamCard teamId={1} variant="solid" className="min-w-[150px]">
            <p className="font-semibold">Solid</p>
          </TeamCard>
          <TeamCard teamId={1} variant="outlined" className="min-w-[150px]">
            <p className="font-semibold">Outlined</p>
          </TeamCard>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-bold text-skin-muted mb-2">Team 2 (Purple)</h3>
        <div className="flex gap-4">
          <TeamCard teamId={2} variant="subtle" className="min-w-[150px]">
            <p className="font-semibold">Subtle</p>
          </TeamCard>
          <TeamCard teamId={2} variant="solid" className="min-w-[150px]">
            <p className="font-semibold">Solid</p>
          </TeamCard>
          <TeamCard teamId={2} variant="outlined" className="min-w-[150px]">
            <p className="font-semibold">Outlined</p>
          </TeamCard>
        </div>
      </div>
    </div>
  ),
};

// Interactive Card
export const ClickableCard: Story = {
  args: {
    teamId: 1,
    variant: 'subtle',
    onClick: () => alert('Card clicked!'),
    children: (
      <div className="flex items-center gap-3">
        <span className="text-2xl">👤</span>
        <div>
          <p className="font-bold">Player Name</p>
          <p className="text-sm opacity-80">Click to view profile</p>
        </div>
      </div>
    ),
  },
};

// Selected State
export const SelectedCard: Story = {
  args: {
    teamId: 1,
    variant: 'subtle',
    children: '',
  },
  render: () => (
    <div className="flex gap-4">
      <TeamCard teamId={1} variant="subtle" selected>
        <p className="font-semibold">Selected (Team 1)</p>
      </TeamCard>
      <TeamCard teamId={2} variant="subtle" selected>
        <p className="font-semibold">Selected (Team 2)</p>
      </TeamCard>
    </div>
  ),
};

// Player Card Example
export const PlayerCardExample: Story = {
  args: {
    teamId: 1,
    children: '',
  },
  render: () => (
    <div className="space-y-4 w-80">
      <TeamCard teamId={1} variant="subtle">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/30 rounded-full flex items-center justify-center">
              🎮
            </div>
            <div>
              <p className="font-bold">PlayerOne</p>
              <p className="text-sm opacity-70">1,250 ELO</p>
            </div>
          </div>
          <TeamBadge teamId={1}>T1</TeamBadge>
        </div>
      </TeamCard>
      <TeamCard teamId={2} variant="subtle">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/30 rounded-full flex items-center justify-center">
              🤖
            </div>
            <div>
              <p className="font-bold">Bot Easy</p>
              <p className="text-sm opacity-70">Bot Player</p>
            </div>
          </div>
          <TeamBadge teamId={2}>T2</TeamBadge>
        </div>
      </TeamCard>
    </div>
  ),
};

// Team Badge Stories
export const TeamBadges: Story = {
  args: {
    teamId: 1,
    children: '',
  },
  render: () => (
    <div className="flex items-center gap-4">
      <TeamBadge teamId={1}>T1</TeamBadge>
      <TeamBadge teamId={2}>T2</TeamBadge>
      <TeamBadge teamId={1}>Team 1</TeamBadge>
      <TeamBadge teamId={2}>Team 2</TeamBadge>
    </div>
  ),
};

// Team Indicator Stories
export const TeamIndicators: Story = {
  args: {
    teamId: 1,
    children: '',
  },
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-sm text-skin-muted w-12">Small:</span>
        <TeamIndicator teamId={1} size="sm" />
        <TeamIndicator teamId={2} size="sm" />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-skin-muted w-12">Medium:</span>
        <TeamIndicator teamId={1} size="md" />
        <TeamIndicator teamId={2} size="md" />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-skin-muted w-12">Large:</span>
        <TeamIndicator teamId={1} size="lg" />
        <TeamIndicator teamId={2} size="lg" />
      </div>
    </div>
  ),
};

// Score Display Example
export const ScoreDisplayExample: Story = {
  args: {
    teamId: 1,
    children: '',
  },
  render: () => (
    <div className="flex gap-4">
      <TeamCard teamId={1} variant="solid" size="lg" className="text-center min-w-[120px]">
        <p className="text-sm opacity-80">Team 1</p>
        <p className="text-4xl font-black">25</p>
      </TeamCard>
      <TeamCard teamId={2} variant="solid" size="lg" className="text-center min-w-[120px]">
        <p className="text-sm opacity-80">Team 2</p>
        <p className="text-4xl font-black">32</p>
      </TeamCard>
    </div>
  ),
};

// Disabled State
export const DisabledCard: Story = {
  args: {
    teamId: 1,
    variant: 'subtle',
    disabled: true,
    onClick: () => alert('Should not fire'),
    children: (
      <div className="flex items-center gap-2">
        <span>🚫</span>
        <span className="font-semibold">Disabled Card</span>
      </div>
    ),
  },
};

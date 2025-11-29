/**
 * OnlineStatusBadge Component Stories
 * Sprint 20 - Storybook Integration
 */

import type { Meta, StoryObj } from '@storybook/react';
import { OnlineStatusBadge } from '../OnlineStatusBadge';

const meta = {
  title: 'UI/Social/OnlineStatusBadge',
  component: OnlineStatusBadge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['online', 'in_game', 'in_lobby', 'in_team_selection', 'offline'],
    },
    showText: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof OnlineStatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Online: Story = {
  args: {
    status: 'online',
  },
};

export const InGame: Story = {
  args: {
    status: 'in_game',
  },
};

export const InLobby: Story = {
  args: {
    status: 'in_lobby',
  },
};

export const InTeamSelection: Story = {
  args: {
    status: 'in_team_selection',
  },
};

export const Offline: Story = {
  args: {
    status: 'offline',
  },
};

export const WithText: Story = {
  args: {
    status: 'in_game',
    showText: true,
  },
};

export const AllStates: Story = {
  args: {
    status: 'online',
  },
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <OnlineStatusBadge status="online" showText />
      </div>
      <div className="flex items-center gap-2">
        <OnlineStatusBadge status="in_game" showText />
      </div>
      <div className="flex items-center gap-2">
        <OnlineStatusBadge status="in_lobby" showText />
      </div>
      <div className="flex items-center gap-2">
        <OnlineStatusBadge status="in_team_selection" showText />
      </div>
      <div className="flex items-center gap-2">
        <OnlineStatusBadge status="offline" showText />
      </div>
    </div>
  ),
};

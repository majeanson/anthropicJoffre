/**
 * SocialListItem Component Stories
 * Sprint 20 - Storybook Integration
 */

import type { Meta, StoryObj } from '@storybook/react';
import { SocialListItem } from '../SocialListItem';
import { Button } from '../Button';

const meta = {
  title: 'UI/Social/SocialListItem',
  component: SocialListItem,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['online', 'in_game', 'in_lobby', 'in_team_selection', 'offline'],
    },
  },
} satisfies Meta<typeof SocialListItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OnlineFriend: Story = {
  args: {
    playerName: 'JohnDoe',
    status: 'online',
  },
};

export const InGameFriend: Story = {
  args: {
    playerName: 'JaneSmith',
    status: 'in_game',
  },
};

export const WithMetadata: Story = {
  args: {
    playerName: 'PlayerOne',
    status: 'online',
    metadata: 'Level 25',
  },
};

export const WithSingleAction: Story = {
  args: {
    playerName: 'PlayerTwo',
    status: 'online',
    actions: (
      <Button variant="primary" size="sm">
        Add Friend
      </Button>
    ),
  },
};

export const WithMultipleActions: Story = {
  args: {
    playerName: 'PlayerThree',
    status: 'in_game',
    metadata: 'Playing Ranked',
    actions: (
      <div className="flex gap-2">
        <Button variant="primary" size="sm">
          Watch
        </Button>
        <Button variant="danger" size="sm">
          Remove
        </Button>
      </div>
    ),
  },
};

export const FriendRequest: Story = {
  args: {
    playerName: 'NewPlayer',
    metadata: '2 days ago',
    actions: (
      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
          className="bg-green-600 hover:bg-green-700 border-green-700"
        >
          Accept
        </Button>
        <Button variant="danger" size="sm">
          Reject
        </Button>
      </div>
    ),
  },
};

export const PendingRequest: Story = {
  args: {
    playerName: 'SentRequest',
    metadata: 'Sent 3 days ago',
    actions: (
      <span className="px-3 py-1 bg-yellow-600 text-white text-sm rounded font-semibold">
        Pending
      </span>
    ),
  },
};

export const SearchResult: Story = {
  args: {
    playerName: 'SearchPlayer',
    metadata: '150 games • 75 wins',
    actions: (
      <Button
        variant="primary"
        size="sm"
        className="bg-purple-600 hover:bg-purple-700 border-purple-700"
      >
        Add Friend
      </Button>
    ),
  },
};

export const ListExample: Story = {
  args: {
    playerName: 'JohnDoe',
    status: 'online',
  },
  render: () => (
    <div className="max-w-md space-y-3 bg-gray-900 p-4 rounded-lg">
      <h3 className="text-white font-bold mb-2">Friends List</h3>
      <SocialListItem
        playerName="JohnDoe"
        status="online"
        actions={
          <Button variant="danger" size="sm">
            Remove
          </Button>
        }
      />
      <SocialListItem
        playerName="JaneSmith"
        status="in_game"
        actions={
          <div className="flex gap-2">
            <Button variant="primary" size="sm">
              Watch
            </Button>
            <Button variant="danger" size="sm">
              Remove
            </Button>
          </div>
        }
      />
      <SocialListItem
        playerName="BobJones"
        status="offline"
        actions={
          <Button variant="danger" size="sm">
            Remove
          </Button>
        }
      />
    </div>
  ),
};

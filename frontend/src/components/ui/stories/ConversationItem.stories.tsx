/**
 * ConversationItem Component Stories
 * Sprint 20 - Storybook Integration
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ConversationItem } from '../ConversationItem';

const meta = {
  title: 'UI/Social/ConversationItem',
  component: ConversationItem,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    isSelected: {
      control: 'boolean',
    },
    unreadCount: {
      control: 'number',
    },
  },
} satisfies Meta<typeof ConversationItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    username: 'JohnDoe',
    lastMessage: 'Hey, want to play a game?',
    timestamp: new Date().toISOString(),
    onClick: () => console.log('Clicked'),
  },
};

export const WithUnread: Story = {
  args: {
    username: 'JaneSmith',
    lastMessage: "Sure! I'm ready when you are.",
    timestamp: new Date(Date.now() - 300000).toISOString(), // 5 min ago
    unreadCount: 3,
    onClick: () => console.log('Clicked'),
  },
};

export const Selected: Story = {
  args: {
    username: 'BobJones',
    lastMessage: 'Great game! Want to play another?',
    timestamp: new Date(Date.now() - 600000).toISOString(), // 10 min ago
    isSelected: true,
    onClick: () => console.log('Clicked'),
  },
};

export const SelectedWithUnread: Story = {
  args: {
    username: 'AliceWilliams',
    lastMessage: "I'll be online later tonight",
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    unreadCount: 5,
    isSelected: true,
    onClick: () => console.log('Clicked'),
  },
};

export const OldMessage: Story = {
  args: {
    username: 'CharlieBrown',
    lastMessage: 'Thanks for the game yesterday!',
    timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    onClick: () => console.log('Clicked'),
  },
};

export const LongMessage: Story = {
  args: {
    username: 'DianaRoss',
    lastMessage:
      'This is a really long message that should get truncated with an ellipsis to prevent it from breaking the layout of the conversation list.',
    timestamp: new Date().toISOString(),
    onClick: () => console.log('Clicked'),
  },
};

export const ConversationListExample: Story = {
  args: {
    username: 'JohnDoe',
    lastMessage: 'Hey! Want to play?',
    timestamp: new Date().toISOString(),
    onClick: () => console.log('Clicked'),
  },
  render: () => (
    <div className="max-w-md bg-gray-900 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-white font-bold">Messages</h3>
      </div>
      <ConversationItem
        username="JohnDoe"
        lastMessage="Hey! Want to play?"
        timestamp={new Date(Date.now() - 180000).toISOString()}
        unreadCount={2}
        onClick={() => console.log('Clicked JohnDoe')}
      />
      <ConversationItem
        username="JaneSmith"
        lastMessage="That was a great game!"
        timestamp={new Date(Date.now() - 600000).toISOString()}
        isSelected={true}
        onClick={() => console.log('Clicked JaneSmith')}
      />
      <ConversationItem
        username="BobJones"
        lastMessage="See you later!"
        timestamp={new Date(Date.now() - 3600000).toISOString()}
        onClick={() => console.log('Clicked BobJones')}
      />
      <ConversationItem
        username="AliceWilliams"
        lastMessage="Thanks for the tips!"
        timestamp={new Date(Date.now() - 86400000).toISOString()}
        onClick={() => console.log('Clicked AliceWilliams')}
      />
    </div>
  ),
};

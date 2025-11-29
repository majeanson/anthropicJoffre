/**
 * MessageBubble Component Stories
 * Sprint 20 - Storybook Integration
 */

import type { Meta, StoryObj } from '@storybook/react';
import { MessageBubble } from '../MessageBubble';

const meta = {
  title: 'UI/Social/MessageBubble',
  component: MessageBubble,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    isSent: {
      control: 'boolean',
    },
    isRead: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof MessageBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SentMessage: Story = {
  args: {
    text: 'Hey, how are you doing?',
    isSent: true,
    timestamp: new Date().toISOString(),
  },
};

export const ReceivedMessage: Story = {
  args: {
    text: 'I\'m doing great, thanks! How about you?',
    isSent: false,
    timestamp: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
  },
};

export const SentMessageRead: Story = {
  args: {
    text: 'That\'s awesome to hear!',
    isSent: true,
    timestamp: new Date().toISOString(),
    isRead: true,
  },
};

export const SentMessageUnread: Story = {
  args: {
    text: 'Did you get my last message?',
    isSent: true,
    timestamp: new Date().toISOString(),
    isRead: false,
  },
};

export const LongMessage: Story = {
  args: {
    text: 'This is a much longer message that demonstrates how the message bubble handles text wrapping. It should wrap nicely and maintain readability even with multiple lines of text. The bubble will expand to accommodate the content while maintaining a maximum width.',
    isSent: true,
    timestamp: new Date().toISOString(),
  },
};

export const OldMessage: Story = {
  args: {
    text: 'This message was sent a while ago.',
    isSent: false,
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
  },
};

export const ConversationExample: Story = {
  args: {
    text: 'Example message',
    isSent: true,
    timestamp: new Date().toISOString(),
  },
  render: () => (
    <div className="max-w-2xl space-y-3 bg-gray-900 p-4 rounded-lg">
      <MessageBubble
        text="Hey! Want to play a game?"
        isSent={false}
        timestamp={new Date(Date.now() - 600000).toISOString()}
      />
      <MessageBubble
        text="Sure! I'd love to. Let me finish this round first."
        isSent={true}
        timestamp={new Date(Date.now() - 540000).toISOString()}
        isRead={true}
      />
      <MessageBubble
        text="No problem, take your time!"
        isSent={false}
        timestamp={new Date(Date.now() - 480000).toISOString()}
      />
      <MessageBubble
        text="Alright, I'm ready now. Creating a lobby!"
        isSent={true}
        timestamp={new Date(Date.now() - 120000).toISOString()}
        isRead={true}
      />
      <MessageBubble
        text="Great! Joining now."
        isSent={false}
        timestamp={new Date(Date.now() - 60000).toISOString()}
      />
    </div>
  ),
};

/**
 * DirectMessagesPanel Component Stories
 *
 * Full-featured direct messaging panel with conversation list and message threads.
 * Note: This component requires Socket.io - stories show static UI states.
 */

import type { Meta, StoryObj } from '@storybook/react';
import Avatar from '../../Avatar';
import { Modal, Button, ConversationItem, MessageBubble, EmptyState } from '..';
import { ListSkeleton } from '../Skeleton';

const meta = {
  title: 'Social/DirectMessagesPanel',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# DirectMessagesPanel Component

A full-featured direct messaging panel with conversation list and message threads.

## Features
- **Conversation List**: Shows all conversations with avatars and previews
- **Unread Indicators**: Badge showing unread message count
- **Message Thread**: Full conversation view with sent/received bubbles
- **Real-time Updates**: Messages delivered via Socket.io
- **Mark as Read**: Auto-marks messages read when viewing
- **Send Messages**: Input field with send button
- **Responsive Layout**: Split-pane design

## States
- Loading (skeleton)
- Empty (no conversations)
- Conversation selected
- No messages yet
- Active messaging

## Integration
Requires Socket.io connection and authenticated user context.
Uses Modal for panel structure with slide-in animation.
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// MOCK DATA
// =============================================================================

interface MockConversation {
  username: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
}

interface MockMessage {
  id: number;
  text: string;
  isSent: boolean;
  timestamp: string;
  isRead?: boolean;
}

const mockConversations: MockConversation[] = [
  { username: 'Alice', lastMessage: 'Great game! GG', timestamp: '2 min ago', unreadCount: 2 },
  { username: 'Bob', lastMessage: 'Rematch tomorrow?', timestamp: '1 hour ago', unreadCount: 0 },
  { username: 'Charlie', lastMessage: 'Thanks for the tips!', timestamp: '3 hours ago', unreadCount: 0 },
  { username: 'Diana', lastMessage: 'See you next time', timestamp: 'Yesterday', unreadCount: 0 },
];

const mockMessages: MockMessage[] = [
  { id: 1, text: 'Hey! Good game today!', isSent: false, timestamp: '10:30 AM', isRead: true },
  { id: 2, text: 'Thanks! You played really well', isSent: true, timestamp: '10:31 AM', isRead: true },
  { id: 3, text: 'That last round was intense!', isSent: false, timestamp: '10:32 AM', isRead: true },
  { id: 4, text: 'Yeah, I thought we were going to lose when you got that 12 bet', isSent: true, timestamp: '10:33 AM', isRead: true },
  { id: 5, text: 'The red zero saved me though', isSent: false, timestamp: '10:34 AM', isRead: true },
  { id: 6, text: 'Great game! GG', isSent: false, timestamp: '10:35 AM', isRead: false },
];

// =============================================================================
// FULL PANEL STATES
// =============================================================================

export const FullPanel: Story = {
  name: 'Full Panel (Conversation Selected)',
  render: () => (
    <div className="w-[800px] h-[600px]">
      <Modal
        isOpen={true}
        onClose={() => {}}
        title="Direct Messages"
        icon={<span className="text-2xl">💬</span>}
        theme="blue"
        size="xl"
        customHeight="h-[600px]"
        contentClassName="flex flex-col p-0 overflow-hidden"
      >
        <div className="flex-1 flex overflow-hidden">
          {/* Conversations List */}
          <div className="w-80 border-r border-gray-700 overflow-y-auto">
            {mockConversations.map((conv, i) => (
              <ConversationItem
                key={conv.username}
                username={conv.username}
                avatar={<Avatar username={conv.username} size="md" />}
                lastMessage={conv.lastMessage}
                timestamp={conv.timestamp}
                unreadCount={conv.unreadCount}
                isSelected={i === 0}
                onClick={() => {}}
              />
            ))}
          </div>

          {/* Messages Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {mockMessages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  text={msg.text}
                  isSent={msg.isSent}
                  timestamp={msg.timestamp}
                  isRead={msg.isSent ? msg.isRead : undefined}
                />
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-700 flex gap-2">
              <input
                type="text"
                placeholder="Message Alice..."
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button variant="primary" className="bg-blue-600 hover:bg-blue-500 border-blue-700">
                Send
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  ),
};

// =============================================================================
// EMPTY STATES
// =============================================================================

export const EmptyConversations: Story = {
  name: 'No Conversations',
  render: () => (
    <div className="w-[800px] h-[600px]">
      <Modal
        isOpen={true}
        onClose={() => {}}
        title="Direct Messages"
        icon={<span className="text-2xl">💬</span>}
        theme="blue"
        size="xl"
        customHeight="h-[600px]"
        contentClassName="flex flex-col p-0 overflow-hidden"
      >
        <div className="flex-1 flex overflow-hidden">
          {/* Empty Conversations List */}
          <div className="w-80 border-r border-gray-700 overflow-y-auto">
            <EmptyState
              icon="💬"
              title="No conversations yet"
              description="Start chatting with friends!"
              compact
            />
          </div>

          {/* Messages Area */}
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon="💬"
              title="Select a conversation"
              description="Choose a conversation to start messaging"
            />
          </div>
        </div>
      </Modal>
    </div>
  ),
};

export const NoMessagesYet: Story = {
  name: 'New Conversation (No Messages)',
  render: () => (
    <div className="w-[800px] h-[600px]">
      <Modal
        isOpen={true}
        onClose={() => {}}
        title="Direct Messages"
        icon={<span className="text-2xl">💬</span>}
        theme="blue"
        size="xl"
        customHeight="h-[600px]"
        contentClassName="flex flex-col p-0 overflow-hidden"
      >
        <div className="flex-1 flex overflow-hidden">
          {/* Conversations List */}
          <div className="w-80 border-r border-gray-700 overflow-y-auto">
            <ConversationItem
              username="NewFriend"
              avatar={<Avatar username="NewFriend" size="md" />}
              lastMessage="Start a conversation..."
              timestamp="Just now"
              unreadCount={0}
              isSelected={true}
              onClick={() => {}}
            />
          </div>

          {/* Messages Area - Empty */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon="👋"
                title="No messages yet"
                description="Say hi!"
                compact
              />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-700 flex gap-2">
              <input
                type="text"
                placeholder="Message NewFriend..."
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button variant="primary" className="bg-blue-600 hover:bg-blue-500 border-blue-700">
                Send
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  ),
};

// =============================================================================
// LOADING STATE
// =============================================================================

export const LoadingState: Story = {
  name: 'Loading Conversations',
  render: () => (
    <div className="w-[800px] h-[600px]">
      <Modal
        isOpen={true}
        onClose={() => {}}
        title="Direct Messages"
        icon={<span className="text-2xl">💬</span>}
        theme="blue"
        size="xl"
        customHeight="h-[600px]"
        contentClassName="flex flex-col p-0 overflow-hidden"
      >
        <div className="flex-1 flex overflow-hidden">
          {/* Loading Skeleton */}
          <div className="w-80 border-r border-gray-700 p-4">
            <ListSkeleton count={6} hasAvatar={true} hasSecondaryText={true} />
          </div>

          {/* Messages Area */}
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon="💬"
              title="Select a conversation"
              description="Choose a conversation to start messaging"
            />
          </div>
        </div>
      </Modal>
    </div>
  ),
};

// =============================================================================
// UNREAD MESSAGES
// =============================================================================

export const WithUnreadMessages: Story = {
  name: 'With Unread Messages',
  render: () => {
    const unreadConversations: MockConversation[] = [
      { username: 'Alice', lastMessage: 'Are you online?', timestamp: 'Just now', unreadCount: 5 },
      { username: 'Bob', lastMessage: 'Check this out!', timestamp: '5 min ago', unreadCount: 3 },
      { username: 'Charlie', lastMessage: 'Game starting...', timestamp: '10 min ago', unreadCount: 1 },
      { username: 'Diana', lastMessage: 'Old message', timestamp: '2 days ago', unreadCount: 0 },
    ];

    return (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)]">
        <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Conversation List with Unread</h3>
        <div className="w-80 bg-[var(--color-bg-secondary)] rounded-lg overflow-hidden">
          {unreadConversations.map((conv) => (
            <ConversationItem
              key={conv.username}
              username={conv.username}
              avatar={<Avatar username={conv.username} size="md" />}
              lastMessage={conv.lastMessage}
              timestamp={conv.timestamp}
              unreadCount={conv.unreadCount}
              isSelected={false}
              onClick={() => {}}
            />
          ))}
        </div>
      </div>
    );
  },
};

// =============================================================================
// MESSAGE BUBBLE VARIANTS
// =============================================================================

export const MessageBubbleVariants: Story = {
  name: 'Message Bubble Variants',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[500px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Message Types</h3>

      <div className="space-y-4 bg-[var(--color-bg-secondary)] p-4 rounded-lg">
        {/* Received messages */}
        <div>
          <p className="text-[var(--color-text-secondary)] text-xs mb-2">Received Messages</p>
          <MessageBubble text="Hello! How are you?" isSent={false} timestamp="10:30 AM" />
          <MessageBubble text="This is a longer message to show how text wraps in the bubble component." isSent={false} timestamp="10:31 AM" />
        </div>

        {/* Sent messages */}
        <div>
          <p className="text-[var(--color-text-secondary)] text-xs mb-2">Sent Messages</p>
          <MessageBubble text="I'm doing great, thanks!" isSent={true} timestamp="10:32 AM" isRead={false} />
          <MessageBubble text="Just finished a game" isSent={true} timestamp="10:33 AM" isRead={true} />
        </div>

        {/* Read status */}
        <div>
          <p className="text-[var(--color-text-secondary)] text-xs mb-2">Read Status Indicator</p>
          <div className="flex flex-col gap-2">
            <MessageBubble text="Message not yet read" isSent={true} timestamp="10:34 AM" isRead={false} />
            <MessageBubble text="Message has been read" isSent={true} timestamp="10:35 AM" isRead={true} />
          </div>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// CONVERSATION ITEM STATES
// =============================================================================

export const ConversationItemStates: Story = {
  name: 'Conversation Item States',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[350px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Conversation States</h3>

      <div className="bg-[var(--color-bg-secondary)] rounded-lg overflow-hidden space-y-1">
        <div>
          <p className="text-[var(--color-text-tertiary)] text-xs p-2 bg-[var(--color-bg-tertiary)]">Selected</p>
          <ConversationItem
            username="Alice"
            avatar={<Avatar username="Alice" size="md" />}
            lastMessage="Currently viewing"
            timestamp="Now"
            unreadCount={0}
            isSelected={true}
            onClick={() => {}}
          />
        </div>

        <div>
          <p className="text-[var(--color-text-tertiary)] text-xs p-2 bg-[var(--color-bg-tertiary)]">With Unread</p>
          <ConversationItem
            username="Bob"
            avatar={<Avatar username="Bob" size="md" />}
            lastMessage="New messages!"
            timestamp="5 min ago"
            unreadCount={3}
            isSelected={false}
            onClick={() => {}}
          />
        </div>

        <div>
          <p className="text-[var(--color-text-tertiary)] text-xs p-2 bg-[var(--color-bg-tertiary)]">Normal</p>
          <ConversationItem
            username="Charlie"
            avatar={<Avatar username="Charlie" size="md" />}
            lastMessage="Old conversation"
            timestamp="Yesterday"
            unreadCount={0}
            isSelected={false}
            onClick={() => {}}
          />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// LONG CONVERSATION
// =============================================================================

export const LongConversation: Story = {
  name: 'Long Conversation Thread',
  render: () => {
    const longMessages: MockMessage[] = [
      { id: 1, text: 'Hey! Ready for the tournament?', isSent: false, timestamp: '9:00 AM' },
      { id: 2, text: 'Yeah! Excited!', isSent: true, timestamp: '9:01 AM' },
      { id: 3, text: 'Who else is joining?', isSent: false, timestamp: '9:02 AM' },
      { id: 4, text: 'Charlie and Diana confirmed', isSent: true, timestamp: '9:03 AM' },
      { id: 5, text: 'Nice! What time?', isSent: false, timestamp: '9:04 AM' },
      { id: 6, text: '8 PM EST', isSent: true, timestamp: '9:05 AM' },
      { id: 7, text: 'Perfect, Ill be there', isSent: false, timestamp: '9:06 AM' },
      { id: 8, text: 'Cool! See you then', isSent: true, timestamp: '9:07 AM' },
      { id: 9, text: 'BTW, any strategy tips?', isSent: false, timestamp: '9:10 AM' },
      { id: 10, text: 'Always bid conservatively in early rounds', isSent: true, timestamp: '9:11 AM' },
      { id: 11, text: 'And save your trump cards!', isSent: true, timestamp: '9:11 AM' },
      { id: 12, text: 'Good advice, thanks!', isSent: false, timestamp: '9:12 AM' },
    ];

    return (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[500px]">
        <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Message Thread</h3>

        <div className="h-[400px] overflow-y-auto bg-[var(--color-bg-secondary)] rounded-lg p-4 space-y-3">
          {longMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              text={msg.text}
              isSent={msg.isSent}
              timestamp={msg.timestamp}
              isRead={msg.isSent ? true : undefined}
            />
          ))}
        </div>
      </div>
    );
  },
};

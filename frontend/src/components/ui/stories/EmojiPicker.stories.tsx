/**
 * EmojiPicker Component Stories
 *
 * Simple emoji picker for chat messages with category tabs.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { EmojiPicker } from '../../EmojiPicker';
import { Button } from '../Button';

const meta = {
  title: 'UI/EmojiPicker',
  component: EmojiPicker,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# EmojiPicker Component

A categorized emoji picker for adding emojis to chat messages.

## Categories
- 😀 **Smileys**: Facial expressions and smileys
- 👍 **Gestures**: Hand gestures and body language
- ❤️ **Emotions**: Hearts and emotional symbols
- ⚽ **Objects**: Sports, games, and objects
- 🐶 **Animals**: Animal faces and creatures
- 🍕 **Food**: Food and drinks
- 🌞 **Nature**: Weather, sun, moon, stars
- 🎉 **Symbols**: Celebrations, awards, effects

## Features
- 8 emoji categories with 20 emojis each
- Tab navigation between categories
- Hover scale animation on emojis
- Click to select and auto-close
- Close button in header
- Scrollable grid for overflow
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onSelectEmoji: { action: 'emoji selected', description: 'Called when emoji is selected' },
    onClose: { action: 'closed', description: 'Called when picker is closed' },
  },
} satisfies Meta<typeof EmojiPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// INTERACTIVE DEMO
// =============================================================================

function EmojiPickerDemo() {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);

  const handleSelectEmoji = (emoji: string) => {
    setSelectedEmojis((prev) => [...prev, emoji]);
    setIsOpen(false);
  };

  return (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[400px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Emoji Picker Demo</h3>

      {/* Selected emojis display */}
      <div className="mb-4 p-3 rounded-lg bg-[var(--color-bg-secondary)] min-h-[60px]">
        <p className="text-[var(--color-text-secondary)] text-xs mb-2">Selected emojis:</p>
        <div className="flex flex-wrap gap-1">
          {selectedEmojis.length === 0 ? (
            <span className="text-[var(--color-text-tertiary)] text-sm">None yet - pick some!</span>
          ) : (
            selectedEmojis.map((emoji, i) => (
              <span key={i} className="text-2xl">
                {emoji}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Toggle button */}
      <div className="relative">
        <Button onClick={() => setIsOpen(!isOpen)} variant="secondary">
          {isOpen ? 'Close Picker' : 'Open Emoji Picker'} 😊
        </Button>

        {/* Picker (positioned above button) */}
        {isOpen && (
          <div className="absolute bottom-full mb-2 left-0">
            <EmojiPicker onSelectEmoji={handleSelectEmoji} onClose={() => setIsOpen(false)} />
          </div>
        )}
      </div>
    </div>
  );
}

export const Interactive: Story = {
  name: 'Interactive Demo',
  render: () => <EmojiPickerDemo />,
};

// =============================================================================
// STATIC DISPLAY
// =============================================================================

export const Default: Story = {
  name: 'Default (Smileys)',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)]">
      <div className="relative w-80">
        <EmojiPicker onSelectEmoji={() => {}} onClose={() => {}} />
      </div>
    </div>
  ),
};

// =============================================================================
// CHAT INTEGRATION EXAMPLE
// =============================================================================

function ChatWithEmojiPicker() {
  const [message, setMessage] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const handleSelectEmoji = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    setShowPicker(false);
  };

  return (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[450px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Chat Message Input</h3>

      {/* Chat messages */}
      <div className="space-y-2 mb-4 p-3 rounded-lg bg-[var(--color-bg-secondary)] max-h-[200px] overflow-y-auto">
        <div className="flex gap-2">
          <span className="text-orange-400 font-semibold">Alice:</span>
          <span className="text-[var(--color-text-primary)]">Great game! 🎉</span>
        </div>
        <div className="flex gap-2">
          <span className="text-purple-400 font-semibold">Bob:</span>
          <span className="text-[var(--color-text-primary)]">GG! That was close 😅</span>
        </div>
        <div className="flex gap-2">
          <span className="text-orange-400 font-semibold">Charlie:</span>
          <span className="text-[var(--color-text-primary)]">Rematch? 🏆</span>
        </div>
      </div>

      {/* Input area */}
      <div className="relative">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] border border-[var(--color-border-primary)] focus:border-blue-500 focus:outline-none"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPicker(!showPicker)}
            className="text-2xl"
          >
            😊
          </Button>
          <Button variant="primary" size="sm">
            Send
          </Button>
        </div>

        {/* Emoji picker */}
        {showPicker && (
          <div className="absolute bottom-full right-0 mb-2">
            <EmojiPicker onSelectEmoji={handleSelectEmoji} onClose={() => setShowPicker(false)} />
          </div>
        )}
      </div>
    </div>
  );
}

export const ChatIntegration: Story = {
  name: 'Chat Integration Example',
  render: () => <ChatWithEmojiPicker />,
};

// =============================================================================
// CATEGORY SHOWCASE
// =============================================================================

export const AllCategories: Story = {
  name: 'All Categories Overview',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] space-y-4">
      <h3 className="text-[var(--color-text-primary)] font-semibold">Emoji Categories</h3>

      <div className="grid grid-cols-2 gap-4">
        {[
          { name: 'Smileys', emojis: '😀😃😄😁😅😂🤣😊' },
          { name: 'Gestures', emojis: '👍👎👌✌️🤞🤟👏🙌' },
          { name: 'Emotions', emojis: '❤️🧡💛💚💙💜🖤💔' },
          { name: 'Objects', emojis: '⚽🏀🏈⚾🎾🎮🎲🃏' },
          { name: 'Animals', emojis: '🐶🐱🐭🐹🐰🦊🐻🐼' },
          { name: 'Food', emojis: '🍕🍔🍟🌭🍿🍖🍗🥩' },
          { name: 'Nature', emojis: '🌞🌝🌛⭐🌟✨⚡🔥' },
          { name: 'Symbols', emojis: '🎉🎊🎈🎁🏆🥇💯✅' },
        ].map((cat) => (
          <div key={cat.name} className="p-3 rounded-lg bg-[var(--color-bg-secondary)]">
            <p className="text-[var(--color-text-secondary)] text-sm mb-2">{cat.name}</p>
            <p className="text-2xl">{cat.emojis}</p>
          </div>
        ))}
      </div>

      <p className="text-[var(--color-text-tertiary)] text-sm text-center">
        160 emojis across 8 categories
      </p>
    </div>
  ),
};

// =============================================================================
// POSITIONING EXAMPLES
// =============================================================================

export const PositioningExample: Story = {
  name: 'Positioning Context',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[500px] h-[400px] relative">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">
        Emoji Picker Positioning
      </h3>

      <p className="text-[var(--color-text-secondary)] text-sm mb-8">
        The emoji picker uses absolute positioning and appears above its trigger element. It
        includes proper z-indexing for overlay behavior.
      </p>

      {/* Positioned at bottom for demo */}
      <div className="absolute bottom-6 left-6 right-6">
        <div className="flex justify-end">
          <div className="relative">
            <Button variant="ghost" size="sm" className="text-2xl">
              😊
            </Button>
            <div className="absolute bottom-full right-0 mb-2">
              <EmojiPicker onSelectEmoji={() => {}} onClose={() => {}} />
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

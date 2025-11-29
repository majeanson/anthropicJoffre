/**
 * EmojiPicker Component
 * Sprint 3 Phase 4
 *
 * Simple emoji picker for chat messages
 */

import { useState } from 'react';
import { UICard } from './ui/UICard';
import { Button } from './ui/Button';

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '🙃', '😋'],
  'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '👏', '🙌', '👐', '🤲', '🙏', '✍️', '💪', '🦾', '🤝', '👋', '🤚', '🖐️', '✋'],
  'Emotions': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '😎'],
  'Objects': ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🎯', '🎮', '🎲', '🃏', '🎴', '🀄', '🎰', '🧩', '♠️', '♥️'],
  'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐔', '🐧'],
  'Food': ['🍕', '🍔', '🍟', '🌭', '🍿', '🧈', '🍖', '🍗', '🥩', '🥓', '🍞', '🥐', '🥖', '🥨', '🥯', '🧀', '🥗', '🍝', '🍜', '🍲'],
  'Nature': ['🌞', '🌝', '🌛', '🌜', '🌚', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔', '⭐', '🌟', '✨', '⚡', '🔥', '💧', '🌊'],
  'Symbols': ['🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⚔️', '🛡️', '🎯', '💯', '✅', '❌', '⭕', '💢', '💥', '💫', '💦', '💨']
};

export function EmojiPicker({ onSelectEmoji, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState<keyof typeof EMOJI_CATEGORIES>('Smileys');

  return (
    <UICard
      variant="elevated"
      size="md"
      className="absolute bottom-full right-0 mb-2 w-80 z-50 animate-slide-in border-2 border-blue-500 dark:border-blue-600"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-blue-700 px-3 py-2 -mx-4 -mt-4 mb-3 rounded-t-md flex items-center justify-between">
        <h4 className="text-white font-bold text-sm">Pick an Emoji</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white hover:text-red-300 p-1"
          aria-label="Close Emoji Picker"
        >
          ✕
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 pb-2 border-b border-gray-300 dark:border-gray-600 overflow-x-auto -mx-4 px-4">
        {Object.keys(EMOJI_CATEGORIES).map((category) => (
          <Button
            key={category}
            variant={activeCategory === category ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveCategory(category as keyof typeof EMOJI_CATEGORIES)}
            className="text-xs whitespace-nowrap"
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Emoji Grid */}
      <div className="py-3 grid grid-cols-8 gap-2 max-h-48 overflow-y-auto -mx-4 px-4 bg-gray-50 dark:bg-gray-900">
        {EMOJI_CATEGORIES[activeCategory].map((emoji, index) => (
          <Button
            key={index}
            onClick={() => {
              onSelectEmoji(emoji);
              onClose();
            }}
            variant="ghost"
            size="sm"
            className="text-2xl hover:scale-125 hover:bg-blue-100 dark:hover:bg-blue-900 !p-1"
            aria-label={`Select emoji ${emoji}`}
          >
            {emoji}
          </Button>
        ))}
      </div>

      {/* Footer */}
      <div className="-mx-4 -mb-4 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-b-md text-center text-xs text-gray-600 dark:text-gray-400">
        Click an emoji to add it to your message
      </div>
    </UICard>
  );
}

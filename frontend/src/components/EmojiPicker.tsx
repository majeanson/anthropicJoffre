/**
 * EmojiPicker Component
 * Sprint 3 Phase 4
 *
 * Simple emoji picker for chat messages
 */

import { useState } from 'react';

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
    <div className="absolute bottom-full right-0 mb-2 w-80 bg-white dark:bg-gray-800 border-2 border-blue-500 dark:border-blue-600 rounded-lg shadow-2xl z-50 animate-slide-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 px-3 py-2 rounded-t-md flex items-center justify-between">
        <h4 className="text-white font-bold text-sm">Pick an Emoji</h4>
        <button
          onClick={onClose}
          className="text-white hover:text-red-300 transition-colors font-bold"
          title="Close Emoji Picker"
        >
          ✕
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 p-2 border-b border-gray-300 dark:border-gray-600 overflow-x-auto">
        {Object.keys(EMOJI_CATEGORIES).map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category as keyof typeof EMOJI_CATEGORIES)}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all whitespace-nowrap ${
              activeCategory === category
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Emoji Grid */}
      <div className="p-3 grid grid-cols-8 gap-2 max-h-48 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        {EMOJI_CATEGORIES[activeCategory].map((emoji, index) => (
          <button
            key={index}
            onClick={() => {
              onSelectEmoji(emoji);
              onClose();
            }}
            className="text-2xl hover:scale-125 transition-transform hover:bg-blue-100 dark:hover:bg-blue-900 rounded p-1"
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-b-md text-center text-xs text-gray-600 dark:text-gray-400">
        Click an emoji to add it to your message
      </div>
    </div>
  );
}

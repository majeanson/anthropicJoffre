/**
 * Avatar Selector Component
 * Sprint 3 Phase 3.2
 */

import { useState } from 'react';
import { AVATARS, AVATAR_CATEGORIES, Avatar } from '../utils/avatars';

interface AvatarSelectorProps {
  selectedAvatarId?: string;
  onSelect: (avatarId: string) => void;
}

export function AvatarSelector({ selectedAvatarId, onSelect }: AvatarSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<Avatar['category'] | 'all'>('all');

  const filteredAvatars = selectedCategory === 'all'
    ? AVATARS
    : AVATARS.filter(avatar => avatar.category === selectedCategory);

  return (
    <div className="space-y-4">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          All
        </button>
        {AVATAR_CATEGORIES.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
              selectedCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Avatar Grid */}
      <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
        {filteredAvatars.map(avatar => (
          <button
            key={avatar.id}
            onClick={() => onSelect(avatar.id)}
            className={`aspect-square flex items-center justify-center text-4xl rounded-lg transition-all hover:scale-110 ${
              selectedAvatarId === avatar.id
                ? 'bg-blue-500 ring-4 ring-blue-400 scale-110'
                : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
            title={avatar.name}
          >
            {avatar.emoji}
          </button>
        ))}
      </div>

      {/* Selected Avatar Info */}
      {selectedAvatarId && (
        <div className="text-center p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Selected: {AVATARS.find(a => a.id === selectedAvatarId)?.name}
          </span>
        </div>
      )}
    </div>
  );
}

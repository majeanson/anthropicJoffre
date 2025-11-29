/**
 * Avatar Selector Component
 * Sprint 3 Phase 3.2
 */

import { useState } from 'react';
import { AVATARS, AVATAR_CATEGORIES, Avatar } from '../utils/avatars';
import { Button } from './ui/Button';

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
        <Button
          variant={selectedCategory === 'all' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
        >
          All
        </Button>
        {AVATAR_CATEGORIES.map(category => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.name}
          </Button>
        ))}
      </div>

      {/* Avatar Grid */}
      <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
        {filteredAvatars.map(avatar => (
          <Button
            key={avatar.id}
            onClick={() => onSelect(avatar.id)}
            variant={selectedAvatarId === avatar.id ? 'primary' : 'ghost'}
            size="lg"
            className={`aspect-square flex items-center justify-center text-4xl hover:scale-110 ${
              selectedAvatarId === avatar.id
                ? 'ring-4 ring-blue-400 scale-110'
                : ''
            }`}
            title={avatar.name}
          >
            {avatar.emoji}
          </Button>
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

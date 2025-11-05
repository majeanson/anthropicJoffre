/**
 * Avatar System
 * Sprint 3 Phase 3.2
 *
 * Emoji-based avatars for user profiles
 */

export interface Avatar {
  id: string;
  emoji: string;
  name: string;
  category: 'animals' | 'people' | 'objects' | 'nature' | 'food' | 'sports';
}

export const AVATARS: Avatar[] = [
  // Animals (20)
  { id: 'dog', emoji: '🐕', name: 'Dog', category: 'animals' },
  { id: 'cat', emoji: '🐈', name: 'Cat', category: 'animals' },
  { id: 'fox', emoji: '🦊', name: 'Fox', category: 'animals' },
  { id: 'lion', emoji: '🦁', name: 'Lion', category: 'animals' },
  { id: 'tiger', emoji: '🐯', name: 'Tiger', category: 'animals' },
  { id: 'bear', emoji: '🐻', name: 'Bear', category: 'animals' },
  { id: 'panda', emoji: '🐼', name: 'Panda', category: 'animals' },
  { id: 'koala', emoji: '🐨', name: 'Koala', category: 'animals' },
  { id: 'monkey', emoji: '🐵', name: 'Monkey', category: 'animals' },
  { id: 'rabbit', emoji: '🐰', name: 'Rabbit', category: 'animals' },
  { id: 'wolf', emoji: '🐺', name: 'Wolf', category: 'animals' },
  { id: 'elephant', emoji: '🐘', name: 'Elephant', category: 'animals' },
  { id: 'penguin', emoji: '🐧', name: 'Penguin', category: 'animals' },
  { id: 'owl', emoji: '🦉', name: 'Owl', category: 'animals' },
  { id: 'eagle', emoji: '🦅', name: 'Eagle', category: 'animals' },
  { id: 'dragon', emoji: '🐉', name: 'Dragon', category: 'animals' },
  { id: 'unicorn', emoji: '🦄', name: 'Unicorn', category: 'animals' },
  { id: 'turtle', emoji: '🐢', name: 'Turtle', category: 'animals' },
  { id: 'frog', emoji: '🐸', name: 'Frog', category: 'animals' },
  { id: 'shark', emoji: '🦈', name: 'Shark', category: 'animals' },

  // People (15)
  { id: 'ninja', emoji: '🥷', name: 'Ninja', category: 'people' },
  { id: 'mage', emoji: '🧙', name: 'Mage', category: 'people' },
  { id: 'superhero', emoji: '🦸', name: 'Superhero', category: 'people' },
  { id: 'detective', emoji: '🕵️', name: 'Detective', category: 'people' },
  { id: 'astronaut', emoji: '👨‍🚀', name: 'Astronaut', category: 'people' },
  { id: 'pirate', emoji: '🏴‍☠️', name: 'Pirate', category: 'people' },
  { id: 'robot', emoji: '🤖', name: 'Robot', category: 'people' },
  { id: 'alien', emoji: '👽', name: 'Alien', category: 'people' },
  { id: 'ghost', emoji: '👻', name: 'Ghost', category: 'people' },
  { id: 'zombie', emoji: '🧟', name: 'Zombie', category: 'people' },
  { id: 'vampire', emoji: '🧛', name: 'Vampire', category: 'people' },
  { id: 'genie', emoji: '🧞', name: 'Genie', category: 'people' },
  { id: 'elf', emoji: '🧝', name: 'Elf', category: 'people' },
  { id: 'fairy', emoji: '🧚', name: 'Fairy', category: 'people' },
  { id: 'santa', emoji: '🎅', name: 'Santa', category: 'people' },

  // Objects (15)
  { id: 'crown', emoji: '👑', name: 'Crown', category: 'objects' },
  { id: 'gem', emoji: '💎', name: 'Diamond', category: 'objects' },
  { id: 'trophy', emoji: '🏆', name: 'Trophy', category: 'objects' },
  { id: 'medal', emoji: '🏅', name: 'Medal', category: 'objects' },
  { id: 'star', emoji: '⭐', name: 'Star', category: 'objects' },
  { id: 'fire', emoji: '🔥', name: 'Fire', category: 'objects' },
  { id: 'lightning', emoji: '⚡', name: 'Lightning', category: 'objects' },
  { id: 'rocket', emoji: '🚀', name: 'Rocket', category: 'objects' },
  { id: 'crystal_ball', emoji: '🔮', name: 'Crystal Ball', category: 'objects' },
  { id: 'magic_wand', emoji: '🪄', name: 'Magic Wand', category: 'objects' },
  { id: 'sword', emoji: '⚔️', name: 'Sword', category: 'objects' },
  { id: 'shield', emoji: '🛡️', name: 'Shield', category: 'objects' },
  { id: 'bomb', emoji: '💣', name: 'Bomb', category: 'objects' },
  { id: 'key', emoji: '🔑', name: 'Key', category: 'objects' },
  { id: 'dice', emoji: '🎲', name: 'Dice', category: 'objects' },

  // Nature (10)
  { id: 'sun', emoji: '☀️', name: 'Sun', category: 'nature' },
  { id: 'moon', emoji: '🌙', name: 'Moon', category: 'nature' },
  { id: 'rainbow', emoji: '🌈', name: 'Rainbow', category: 'nature' },
  { id: 'cloud', emoji: '☁️', name: 'Cloud', category: 'nature' },
  { id: 'snowflake', emoji: '❄️', name: 'Snowflake', category: 'nature' },
  { id: 'tree', emoji: '🌳', name: 'Tree', category: 'nature' },
  { id: 'flower', emoji: '🌸', name: 'Flower', category: 'nature' },
  { id: 'rose', emoji: '🌹', name: 'Rose', category: 'nature' },
  { id: 'mushroom', emoji: '🍄', name: 'Mushroom', category: 'nature' },
  { id: 'volcano', emoji: '🌋', name: 'Volcano', category: 'nature' },

  // Food (10)
  { id: 'pizza', emoji: '🍕', name: 'Pizza', category: 'food' },
  { id: 'burger', emoji: '🍔', name: 'Burger', category: 'food' },
  { id: 'taco', emoji: '🌮', name: 'Taco', category: 'food' },
  { id: 'sushi', emoji: '🍣', name: 'Sushi', category: 'food' },
  { id: 'ramen', emoji: '🍜', name: 'Ramen', category: 'food' },
  { id: 'donut', emoji: '🍩', name: 'Donut', category: 'food' },
  { id: 'cake', emoji: '🍰', name: 'Cake', category: 'food' },
  { id: 'icecream', emoji: '🍦', name: 'Ice Cream', category: 'food' },
  { id: 'coffee', emoji: '☕', name: 'Coffee', category: 'food' },
  { id: 'cookie', emoji: '🍪', name: 'Cookie', category: 'food' },

  // Sports (10)
  { id: 'soccer', emoji: '⚽', name: 'Soccer Ball', category: 'sports' },
  { id: 'basketball', emoji: '🏀', name: 'Basketball', category: 'sports' },
  { id: 'baseball', emoji: '⚾', name: 'Baseball', category: 'sports' },
  { id: 'football', emoji: '🏈', name: 'Football', category: 'sports' },
  { id: 'tennis', emoji: '🎾', name: 'Tennis', category: 'sports' },
  { id: 'bowling', emoji: '🎳', name: 'Bowling', category: 'sports' },
  { id: 'gaming', emoji: '🎮', name: 'Gaming', category: 'sports' },
  { id: 'chess', emoji: '♟️', name: 'Chess', category: 'sports' },
  { id: 'cards', emoji: '🃏', name: 'Cards', category: 'sports' },
  { id: 'target', emoji: '🎯', name: 'Target', category: 'sports' },
];

/**
 * Get avatar by ID
 */
export function getAvatarById(id: string): Avatar | undefined {
  return AVATARS.find(avatar => avatar.id === id);
}

/**
 * Get avatars by category
 */
export function getAvatarsByCategory(category: Avatar['category']): Avatar[] {
  return AVATARS.filter(avatar => avatar.category === category);
}

/**
 * Get random avatar
 */
export function getRandomAvatar(): Avatar {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

/**
 * Get avatar URL (for display_name compatibility - returns emoji directly)
 */
export function getAvatarUrl(avatarId: string): string {
  const avatar = getAvatarById(avatarId);
  return avatar ? avatar.emoji : '👤'; // Default to generic user icon
}

/**
 * Categories for filtering
 */
export const AVATAR_CATEGORIES: Array<{ id: Avatar['category']; name: string }> = [
  { id: 'animals', name: 'Animals' },
  { id: 'people', name: 'Characters' },
  { id: 'objects', name: 'Objects' },
  { id: 'nature', name: 'Nature' },
  { id: 'food', name: 'Food' },
  { id: 'sports', name: 'Sports' },
];

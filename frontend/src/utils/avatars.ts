/**
 * Avatar System
 * Sprint 21: Reward System Overhaul
 *
 * Emoji-based avatars for user profiles with unlock progression
 * - 8 default avatars available to all players
 * - Additional avatars unlock at specific levels
 * - Rare avatars for achievements and special milestones
 */

export interface Avatar {
  id: string;
  emoji: string;
  name: string;
  category: 'default' | 'animals' | 'mythical' | 'prestige' | 'special';
  unlockLevel: number; // 0 = always available, >0 = level required
  unlockDescription?: string; // How to unlock (for non-level unlocks)
}

/**
 * All avatars organized by unlock progression
 */
export const AVATARS: Avatar[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // DEFAULT AVATARS (8) - Available to everyone
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 'cards', emoji: '🃏', name: 'Joker', category: 'default', unlockLevel: 0 },
  { id: 'star', emoji: '⭐', name: 'Star', category: 'default', unlockLevel: 0 },
  { id: 'fire', emoji: '🔥', name: 'Fire', category: 'default', unlockLevel: 0 },
  { id: 'lightning', emoji: '⚡', name: 'Lightning', category: 'default', unlockLevel: 0 },
  { id: 'target', emoji: '🎯', name: 'Bullseye', category: 'default', unlockLevel: 0 },
  { id: 'dice', emoji: '🎲', name: 'Lucky Dice', category: 'default', unlockLevel: 0 },
  { id: 'gem', emoji: '💎', name: 'Diamond', category: 'default', unlockLevel: 0 },
  { id: 'crown', emoji: '👑', name: 'Crown', category: 'default', unlockLevel: 0 },

  // ═══════════════════════════════════════════════════════════════════════════
  // EARLY UNLOCKS (Level 2-5) - Quick progression rewards
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 'fox', emoji: '🦊', name: 'Clever Fox', category: 'animals', unlockLevel: 2 },
  { id: 'cat', emoji: '🐈', name: 'Cat', category: 'animals', unlockLevel: 3 },
  { id: 'dog', emoji: '🐕', name: 'Dog', category: 'animals', unlockLevel: 3 },
  { id: 'owl', emoji: '🦉', name: 'Wise Owl', category: 'animals', unlockLevel: 4 },
  { id: 'rabbit', emoji: '🐰', name: 'Rabbit', category: 'animals', unlockLevel: 5 },
  { id: 'wolf', emoji: '🐺', name: 'Wolf', category: 'animals', unlockLevel: 5 },

  // ═══════════════════════════════════════════════════════════════════════════
  // MID-GAME UNLOCKS (Level 6-12) - Regular progression
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 'lion', emoji: '🦁', name: 'Lion', category: 'animals', unlockLevel: 6 },
  { id: 'tiger', emoji: '🐯', name: 'Tiger', category: 'animals', unlockLevel: 7 },
  { id: 'bear', emoji: '🐻', name: 'Bear', category: 'animals', unlockLevel: 8 },
  { id: 'eagle', emoji: '🦅', name: 'Eagle', category: 'animals', unlockLevel: 9 },
  { id: 'shark', emoji: '🦈', name: 'Shark', category: 'animals', unlockLevel: 10 },
  { id: 'panda', emoji: '🐼', name: 'Panda', category: 'animals', unlockLevel: 11 },
  { id: 'penguin', emoji: '🐧', name: 'Penguin', category: 'animals', unlockLevel: 12 },

  // ═══════════════════════════════════════════════════════════════════════════
  // MYTHICAL CREATURES (Level 15-25) - Advanced progression
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 'unicorn', emoji: '🦄', name: 'Unicorn', category: 'mythical', unlockLevel: 15 },
  { id: 'dragon', emoji: '🐉', name: 'Dragon', category: 'mythical', unlockLevel: 18 },
  {
    id: 'phoenix',
    emoji: '🔥',
    name: 'Phoenix',
    category: 'mythical',
    unlockLevel: 20,
    unlockDescription: 'The legendary firebird',
  },
  { id: 'ghost', emoji: '👻', name: 'Ghost', category: 'mythical', unlockLevel: 22 },
  { id: 'alien', emoji: '👽', name: 'Alien', category: 'mythical', unlockLevel: 25 },

  // ═══════════════════════════════════════════════════════════════════════════
  // PRESTIGE AVATARS (Level 30-50) - Elite status symbols
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 'ninja', emoji: '🥷', name: 'Shadow Ninja', category: 'prestige', unlockLevel: 30 },
  { id: 'robot', emoji: '🤖', name: 'Robot', category: 'prestige', unlockLevel: 35 },
  { id: 'astronaut', emoji: '👨‍🚀', name: 'Astronaut', category: 'prestige', unlockLevel: 40 },
  { id: 'mage', emoji: '🧙', name: 'Grand Wizard', category: 'prestige', unlockLevel: 45 },
  { id: 'superhero', emoji: '🦸', name: 'Superhero', category: 'prestige', unlockLevel: 50 },

  // ═══════════════════════════════════════════════════════════════════════════
  // SPECIAL AVATARS - Achievement/Event unlocks (not level-based)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'trophy',
    emoji: '🏆',
    name: 'Champion',
    category: 'special',
    unlockLevel: 999,
    unlockDescription: 'Win 100 games',
  },
  {
    id: 'medal',
    emoji: '🏅',
    name: 'Medalist',
    category: 'special',
    unlockLevel: 999,
    unlockDescription: 'Complete all achievements',
  },
  {
    id: 'rocket',
    emoji: '🚀',
    name: 'Rocket',
    category: 'special',
    unlockLevel: 999,
    unlockDescription: 'Play 500 games',
  },
];

/**
 * Player titles that unlock at specific levels
 */
export interface Title {
  id: string;
  name: string;
  unlockLevel: number;
  color: string; // Tailwind color class
}

export const TITLES: Title[] = [
  { id: 'newcomer', name: 'Newcomer', unlockLevel: 1, color: 'text-gray-400' },
  { id: 'apprentice', name: 'Apprentice', unlockLevel: 3, color: 'text-green-400' },
  { id: 'player', name: 'Card Player', unlockLevel: 5, color: 'text-blue-400' },
  { id: 'skilled', name: 'Skilled Player', unlockLevel: 8, color: 'text-blue-500' },
  { id: 'veteran', name: 'Veteran', unlockLevel: 12, color: 'text-purple-400' },
  { id: 'expert', name: 'Expert', unlockLevel: 18, color: 'text-purple-500' },
  { id: 'master', name: 'Card Master', unlockLevel: 25, color: 'text-yellow-400' },
  { id: 'grandmaster', name: 'Grand Master', unlockLevel: 35, color: 'text-yellow-500' },
  { id: 'legend', name: 'Legend', unlockLevel: 45, color: 'text-orange-400' },
  { id: 'champion', name: 'Champion', unlockLevel: 50, color: 'text-red-400' },
];

/**
 * UI Skins that unlock at specific levels
 * These reference the actual skin IDs from config/skins.ts
 */
export interface SkinReward {
  skinId: string;
  name: string;
  unlockLevel: number;
  description: string;
}

export const SKIN_REWARDS: SkinReward[] = [
  {
    skinId: 'midnight-alchemy',
    name: 'Midnight Alchemy',
    unlockLevel: 0,
    description: 'Mystical alchemist aesthetic',
  },
  {
    skinId: 'tavern-noir',
    name: 'Tavern Noir',
    unlockLevel: 0,
    description: 'Moody candlelit atmosphere',
  },
  {
    skinId: 'modern-minimal',
    name: 'Modern Minimal',
    unlockLevel: 5,
    description: 'Clean, light interface',
  },
  {
    skinId: 'classic-parchment',
    name: 'Classic Parchment',
    unlockLevel: 10,
    description: 'Traditional elegance',
  },
  {
    skinId: 'modern-minimal-dark',
    name: 'Modern Dark',
    unlockLevel: 15,
    description: 'Sleek dark interface',
  },
  {
    skinId: 'luxury-casino',
    name: 'Luxury Casino',
    unlockLevel: 25,
    description: 'Gold accents and velvet depth',
  },
  {
    skinId: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    unlockLevel: 40,
    description: 'Neon with glitch effects',
  },
];

// Keep CardBackReward as alias for backwards compatibility
export type CardBackReward = SkinReward;
export const CARD_BACK_REWARDS = SKIN_REWARDS;

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get avatar by ID
 */
export function getAvatarById(id: string): Avatar | undefined {
  return AVATARS.find((avatar) => avatar.id === id);
}

/**
 * Get avatars available to a player at a given level
 */
export function getUnlockedAvatars(playerLevel: number): Avatar[] {
  return AVATARS.filter((avatar) => avatar.unlockLevel <= playerLevel);
}

/**
 * Get locked avatars (not yet available)
 */
export function getLockedAvatars(playerLevel: number): Avatar[] {
  return AVATARS.filter((avatar) => avatar.unlockLevel > playerLevel);
}

/**
 * Get avatars by category
 */
export function getAvatarsByCategory(category: Avatar['category']): Avatar[] {
  return AVATARS.filter((avatar) => avatar.category === category);
}

/**
 * Get default avatars (always available)
 */
export function getDefaultAvatars(): Avatar[] {
  return AVATARS.filter((avatar) => avatar.category === 'default');
}

/**
 * Check if an avatar is unlocked for a player
 */
export function isAvatarUnlocked(avatarId: string, playerLevel: number): boolean {
  const avatar = getAvatarById(avatarId);
  if (!avatar) return false;
  return avatar.unlockLevel <= playerLevel;
}

/**
 * Get random unlocked avatar for a player
 */
export function getRandomUnlockedAvatar(playerLevel: number): Avatar {
  const unlocked = getUnlockedAvatars(playerLevel);
  return unlocked[Math.floor(Math.random() * unlocked.length)] || AVATARS[0];
}

/**
 * Get avatar URL (for display_name compatibility - returns emoji directly)
 */
export function getAvatarUrl(avatarId: string): string {
  const avatar = getAvatarById(avatarId);
  return avatar ? avatar.emoji : '👤'; // Default to generic user icon
}

/**
 * Get player's current title based on level
 */
export function getTitleForLevel(level: number): Title {
  // Find the highest title the player has unlocked
  const unlocked = TITLES.filter((t) => t.unlockLevel <= level);
  return unlocked[unlocked.length - 1] || TITLES[0];
}

/**
 * Get next title to unlock
 */
export function getNextTitle(level: number): Title | null {
  return TITLES.find((t) => t.unlockLevel > level) || null;
}

/**
 * Categories for filtering in UI
 */
export const AVATAR_CATEGORIES: Array<{
  id: Avatar['category'];
  name: string;
  description: string;
}> = [
  { id: 'default', name: 'Starter', description: 'Available to all players' },
  { id: 'animals', name: 'Animals', description: 'Unlock through leveling' },
  { id: 'mythical', name: 'Mythical', description: 'Rare creatures' },
  { id: 'prestige', name: 'Prestige', description: 'Elite status symbols' },
  { id: 'special', name: 'Special', description: 'Achievement rewards' },
];

/**
 * Get all rewards a player will unlock at the next few levels
 */
export function getUpcomingRewards(
  currentLevel: number,
  lookAhead: number = 5
): {
  level: number;
  avatars: Avatar[];
  title: Title | null;
  skins: SkinReward[];
}[] {
  const rewards: {
    level: number;
    avatars: Avatar[];
    title: Title | null;
    skins: SkinReward[];
  }[] = [];

  for (let level = currentLevel + 1; level <= currentLevel + lookAhead; level++) {
    const avatarsAtLevel = AVATARS.filter((a) => a.unlockLevel === level);
    const titleAtLevel = TITLES.find((t) => t.unlockLevel === level) || null;
    const skinsAtLevel = SKIN_REWARDS.filter((s) => s.unlockLevel === level);

    if (avatarsAtLevel.length > 0 || titleAtLevel || skinsAtLevel.length > 0) {
      rewards.push({
        level,
        avatars: avatarsAtLevel,
        title: titleAtLevel,
        skins: skinsAtLevel,
      });
    }
  }

  return rewards;
}

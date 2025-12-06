/**
 * Special Card Skins Configuration
 *
 * Defines the skin options for Red 0 (+5 points) and Brown 0 (-2 points) cards.
 * These are separate from regular card skins and provide unique visual customization
 * for the most important cards in the game.
 *
 * Features:
 * - Custom icons per skin
 * - Rarity-based glow effects
 * - Animation classes
 * - Multiple unlock methods (default, level, achievement, purchase)
 */

// ============================================================================
// TYPES
// ============================================================================

export type SpecialCardType = 'red_zero' | 'brown_zero';
export type SpecialCardRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type UnlockType = 'default' | 'level' | 'achievement' | 'purchase';

export interface SpecialCardSkin {
  skinId: string;
  skinName: string;
  description: string | null;
  cardType: SpecialCardType;
  rarity: SpecialCardRarity;
  unlockType: UnlockType;
  unlockRequirement: string | null;
  price: number;
  centerIcon: string | null;
  glowColor: string | null;
  animationClass: string | null;
  borderColor: string | null;
}

export interface SpecialCardSkinWithStatus extends SpecialCardSkin {
  isUnlocked: boolean;
  unlockedAt: string | null;
}

export interface PlayerEquippedSpecialSkins {
  redZeroSkin: string | null;
  brownZeroSkin: string | null;
}

// ============================================================================
// RARITY STYLING
// ============================================================================

export const rarityStyles: Record<SpecialCardRarity, {
  gradient: string;
  borderGradient: string;
  badgeColor: string;
  glowIntensity: number;
}> = {
  common: {
    gradient: 'from-gray-400 to-gray-500',
    borderGradient: 'from-gray-400 via-gray-500 to-gray-400',
    badgeColor: 'bg-gray-500',
    glowIntensity: 0.3,
  },
  rare: {
    gradient: 'from-blue-400 to-blue-600',
    borderGradient: 'from-blue-400 via-blue-500 to-blue-400',
    badgeColor: 'bg-blue-500',
    glowIntensity: 0.5,
  },
  epic: {
    gradient: 'from-purple-400 to-purple-600',
    borderGradient: 'from-purple-400 via-purple-500 to-purple-400',
    badgeColor: 'bg-purple-500',
    glowIntensity: 0.7,
  },
  legendary: {
    gradient: 'from-yellow-400 to-orange-500',
    borderGradient: 'from-yellow-400 via-orange-500 to-yellow-400',
    badgeColor: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    glowIntensity: 1.0,
  },
};

// ============================================================================
// CLIENT-SIDE SKIN DEFINITIONS (Fallback)
// These mirror the database but provide offline/quick access
// ============================================================================

export const defaultSpecialCardSkins: SpecialCardSkin[] = [
  // Red Zero Skins
  {
    skinId: 'red_zero_default',
    skinName: 'Original Art',
    description: 'The original red zero artwork - classic and iconic',
    cardType: 'red_zero',
    rarity: 'common',
    unlockType: 'default',
    unlockRequirement: null,
    price: 0,
    centerIcon: null, // Uses original image from /cards/production/red_bon.jpg
    glowColor: null,
    animationClass: null,
    borderColor: null, // Uses default suit border
  },
  {
    skinId: 'red_zero_phoenix',
    skinName: 'Phoenix Rising',
    description: 'A majestic phoenix emerges from the flames of victory',
    cardType: 'red_zero',
    rarity: 'epic',
    unlockType: 'achievement',
    unlockRequirement: 'red_zero_hunter',
    price: 0,
    centerIcon: '🦅',
    glowColor: 'rgba(251, 146, 60, 0.7)',
    animationClass: 'animate-pulse',
    borderColor: '#f97316',
  },
  {
    skinId: 'red_zero_sun',
    skinName: 'Solar Flare',
    description: 'The power of a thousand suns burns in your hands',
    cardType: 'red_zero',
    rarity: 'legendary',
    unlockType: 'achievement',
    unlockRequirement: 'games_won_100',
    price: 0,
    centerIcon: '☀️',
    glowColor: 'rgba(250, 204, 21, 0.8)',
    animationClass: 'animate-glow-intense',
    borderColor: '#fbbf24',
  },
  {
    skinId: 'red_zero_dragon',
    skinName: 'Dragon Heart',
    description: 'Ancient dragon fire burns eternal within this card',
    cardType: 'red_zero',
    rarity: 'rare',
    unlockType: 'purchase',
    unlockRequirement: null,
    price: 500,
    centerIcon: '🐉',
    glowColor: 'rgba(220, 38, 38, 0.7)',
    animationClass: 'animate-flicker',
    borderColor: '#b91c1c',
  },
  {
    skinId: 'red_zero_ruby',
    skinName: 'Ruby Essence',
    description: 'Crystallized fire compressed into gem form',
    cardType: 'red_zero',
    rarity: 'rare',
    unlockType: 'level',
    unlockRequirement: '15',
    price: 0,
    centerIcon: '💎',
    glowColor: 'rgba(239, 68, 68, 0.6)',
    animationClass: 'animate-shimmer',
    borderColor: '#ef4444',
  },

  // Brown Zero Skins
  {
    skinId: 'brown_zero_default',
    skinName: 'Original Art',
    description: 'The original brown zero artwork - classic and iconic',
    cardType: 'brown_zero',
    rarity: 'common',
    unlockType: 'default',
    unlockRequirement: null,
    price: 0,
    centerIcon: null, // Uses original image from /cards/production/brown_bon.jpg
    glowColor: null,
    animationClass: null,
    borderColor: null, // Uses default suit border
  },
  {
    skinId: 'brown_zero_skull',
    skinName: 'Memento Mori',
    description: 'A reminder that even the mightiest can fall',
    cardType: 'brown_zero',
    rarity: 'epic',
    unlockType: 'achievement',
    unlockRequirement: 'no_brown_10',
    price: 0,
    centerIcon: '💀',
    glowColor: 'rgba(107, 114, 128, 0.7)',
    animationClass: 'animate-pulse',
    borderColor: '#4b5563',
  },
  {
    skinId: 'brown_zero_void',
    skinName: 'Void Walker',
    description: 'Darkness incarnate, drawn from the space between stars',
    cardType: 'brown_zero',
    rarity: 'legendary',
    unlockType: 'achievement',
    unlockRequirement: 'perfect_game',
    price: 0,
    centerIcon: '🌑',
    glowColor: 'rgba(17, 24, 39, 0.8)',
    animationClass: 'animate-void-pulse',
    borderColor: '#111827',
  },
  {
    skinId: 'brown_zero_stone',
    skinName: 'Petrified',
    description: 'Turned to stone by ancient and terrible magic',
    cardType: 'brown_zero',
    rarity: 'rare',
    unlockType: 'purchase',
    unlockRequirement: null,
    price: 500,
    centerIcon: '🪨',
    glowColor: 'rgba(120, 113, 108, 0.6)',
    animationClass: null,
    borderColor: '#78716c',
  },
  {
    skinId: 'brown_zero_shadow',
    skinName: 'Shadow Form',
    description: 'Consumed by shadows, yet wielding their power',
    cardType: 'brown_zero',
    rarity: 'rare',
    unlockType: 'level',
    unlockRequirement: '15',
    price: 0,
    centerIcon: '👤',
    glowColor: 'rgba(30, 41, 59, 0.7)',
    animationClass: 'animate-shadow-drift',
    borderColor: '#1e293b',
  },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get a special card skin by ID from the local definitions
 */
export function getSpecialCardSkin(skinId: string): SpecialCardSkin | undefined {
  return defaultSpecialCardSkins.find(skin => skin.skinId === skinId);
}

/**
 * Get skins by card type
 */
export function getSpecialCardSkinsByType(cardType: SpecialCardType): SpecialCardSkin[] {
  return defaultSpecialCardSkins.filter(skin => skin.cardType === cardType);
}

/**
 * Get unlock requirement text for display
 */
export function getUnlockRequirementText(skin: SpecialCardSkin): string {
  switch (skin.unlockType) {
    case 'default':
      return 'Free';
    case 'level':
      return `Level ${skin.unlockRequirement}`;
    case 'achievement':
      return `Achievement: ${formatAchievementName(skin.unlockRequirement || '')}`;
    case 'purchase':
      return `${skin.price} coins`;
    default:
      return 'Unknown';
  }
}

/**
 * Format achievement key to readable name
 */
function formatAchievementName(key: string): string {
  const nameMap: Record<string, string> = {
    'red_zero_hunter': 'Red Zero Hunter',
    'games_won_100': 'Win 100 Games',
    'no_brown_10': 'Curse Dodger',
    'perfect_game': 'Perfect Game',
  };
  return nameMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Get rarity display name
 */
export function getRarityDisplayName(rarity: SpecialCardRarity): string {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1);
}

/**
 * Sort skins by rarity (legendary first)
 */
export function sortByRarity(skins: SpecialCardSkin[]): SpecialCardSkin[] {
  const order: Record<SpecialCardRarity, number> = {
    legendary: 0,
    epic: 1,
    rare: 2,
    common: 3,
  };
  return [...skins].sort((a, b) => order[a.rarity] - order[b.rarity]);
}

/**
 * Check if a skin can be purchased
 */
export function canPurchase(skin: SpecialCardSkin): boolean {
  return skin.unlockType === 'purchase' && skin.price > 0;
}

/**
 * Check if a skin is locked by level
 */
export function isLockedByLevel(skin: SpecialCardSkin, playerLevel: number): boolean {
  if (skin.unlockType !== 'level') return false;
  const requiredLevel = parseInt(skin.unlockRequirement || '0', 10);
  return playerLevel < requiredLevel;
}

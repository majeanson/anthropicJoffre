/**
 * Card Skins Configuration
 *
 * Card skins are cosmetic overlays that change how cards are displayed.
 * They work independently of the main UI skin system and can be mixed freely.
 *
 * Features:
 * - Custom value display (always readable: 1-7, Roman I-VII, A-7, etc.)
 * - Custom suit icons/emblems displayed in card center
 * - Custom colors per suit
 * - Special effects for bonus cards (red 0, brown 0)
 * - Level-based unlocking (2 free + 6 unlockable)
 */

// ============================================================================
// TYPES
// ============================================================================

export type CardSkinId =
  | 'classic'           // Free: Default numeric style
  | 'roman'             // Free: Roman numerals with laurel theme
  | 'elemental'         // Level 5: Fire, earth, water, nature elements
  | 'nordic'            // Level 10: Viking/Norse theme with runes decorations
  | 'alchemical'        // Level 15: Alchemical elements theme
  | 'celestial'         // Level 20: Stars and cosmos theme
  | 'royal'             // Level 25: Playing card style (hearts, diamonds, etc.)
  | 'neon';             // Level 30: Cyberpunk neon style

export interface CardSkinSuitStyle {
  /** Color for this suit (CSS color value) */
  color: string;
  /** Center icon/emoji for this suit (displayed in card center) */
  centerIcon: string;
  /** Glow color for special effects */
  glowColor: string;
}

export interface CardSkin {
  /** Unique identifier */
  id: CardSkinId;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Required player level (0 = free/unlocked) */
  requiredLevel: number;
  /** Preview gradient for selector */
  preview: string;
  /** Whether this is a premium/special skin */
  isPremium: boolean;

  /**
   * Transform card value to display string
   * IMPORTANT: Always use readable values (numbers, letters, etc.)
   * @param value - Card value (0-9)
   * @param isSpecial - Whether this is a special card (red 0 or brown 0)
   */
  formatValue: (value: number, isSpecial: boolean) => string;

  /** Suit-specific styles */
  suits: {
    red: CardSkinSuitStyle;
    brown: CardSkinSuitStyle;
    green: CardSkinSuitStyle;
    blue: CardSkinSuitStyle;
  };

  /** Special card styling */
  specialCards: {
    /** Red 0 card display */
    redBonus: {
      symbol: string;
      label: string;
    };
    /** Brown 0 card display */
    brownPenalty: {
      symbol: string;
      label: string;
    };
  };

  /** Font family override (optional) */
  fontFamily?: string;

  /** Whether to show center icons instead of emblem images */
  useCenterIcons: boolean;

  /** Additional CSS classes for card container */
  containerClass?: string;
}

// ============================================================================
// CARD SKIN DEFINITIONS
// ============================================================================

const cardSkins: Record<CardSkinId, CardSkin> = {
  // -------------------------------------------------------------------------
  // FREE SKINS (2)
  // -------------------------------------------------------------------------

  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional numeric display with clean aesthetics',
    requiredLevel: 0,
    preview: 'linear-gradient(135deg, #f5f0e6 0%, #d4c4a8 100%)',
    isPremium: false,
    useCenterIcons: false, // Use default emblem images
    formatValue: (value) => value.toString(),
    suits: {
      red: { color: '#dc2626', centerIcon: '🔴', glowColor: 'rgba(220, 38, 38, 0.5)' },
      brown: { color: '#92400e', centerIcon: '🟤', glowColor: 'rgba(146, 64, 14, 0.5)' },
      green: { color: '#16a34a', centerIcon: '🟢', glowColor: 'rgba(22, 163, 74, 0.5)' },
      blue: { color: '#2563eb', centerIcon: '🔵', glowColor: 'rgba(37, 99, 235, 0.5)' },
    },
    specialCards: {
      redBonus: { symbol: '0', label: '+5' },
      brownPenalty: { symbol: '0', label: '-2' },
    },
  },

  roman: {
    id: 'roman',
    name: 'Roman Empire',
    description: 'Ancient Roman numerals with laurel wreath theme',
    requiredLevel: 0,
    preview: 'linear-gradient(135deg, #1a1a2e 0%, #4a3f35 100%)',
    isPremium: false,
    useCenterIcons: true,
    formatValue: (value, isSpecial) => {
      if (isSpecial) return '0';
      const romanNumerals = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
      return romanNumerals[value] || value.toString();
    },
    suits: {
      red: { color: '#b91c1c', centerIcon: '🦅', glowColor: 'rgba(185, 28, 28, 0.5)' },   // Eagle
      brown: { color: '#78350f', centerIcon: '🏛️', glowColor: 'rgba(120, 53, 15, 0.5)' },  // Temple
      green: { color: '#166534', centerIcon: '🌿', glowColor: 'rgba(22, 101, 52, 0.5)' },  // Laurel
      blue: { color: '#1e40af', centerIcon: '⚔️', glowColor: 'rgba(30, 64, 175, 0.5)' },   // Swords
    },
    specialCards: {
      redBonus: { symbol: '0', label: '+V' },
      brownPenalty: { symbol: '0', label: '-II' },
    },
    fontFamily: 'Cinzel, serif',
  },

  // -------------------------------------------------------------------------
  // UNLOCKABLE SKINS (6)
  // -------------------------------------------------------------------------

  elemental: {
    id: 'elemental',
    name: 'Elemental Forces',
    description: 'Harness the power of fire, earth, water, and nature',
    requiredLevel: 5,
    preview: 'linear-gradient(135deg, #ef4444 0%, #22c55e 50%, #3b82f6 100%)',
    isPremium: true,
    useCenterIcons: true,
    formatValue: (value) => value.toString(),
    suits: {
      red: { color: '#ef4444', centerIcon: '🔥', glowColor: 'rgba(239, 68, 68, 0.6)' },    // Fire
      brown: { color: '#a16207', centerIcon: '🌍', glowColor: 'rgba(161, 98, 7, 0.6)' },   // Earth
      green: { color: '#22c55e', centerIcon: '🌿', glowColor: 'rgba(34, 197, 94, 0.6)' },  // Nature
      blue: { color: '#3b82f6', centerIcon: '💧', glowColor: 'rgba(59, 130, 246, 0.6)' },  // Water
    },
    specialCards: {
      redBonus: { symbol: '0', label: '+5' },
      brownPenalty: { symbol: '0', label: '-2' },
    },
  },

  nordic: {
    id: 'nordic',
    name: 'Nordic Saga',
    description: 'Viking warriors and Norse mythology theme',
    requiredLevel: 10,
    preview: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
    isPremium: true,
    useCenterIcons: true,
    formatValue: (value) => value.toString(), // Keep numbers readable
    suits: {
      red: { color: '#f87171', centerIcon: '⚡', glowColor: 'rgba(248, 113, 113, 0.6)' },  // Thor's lightning
      brown: { color: '#d97706', centerIcon: '🪓', glowColor: 'rgba(217, 119, 6, 0.6)' },  // Axe
      green: { color: '#4ade80', centerIcon: '🌲', glowColor: 'rgba(74, 222, 128, 0.6)' }, // Yggdrasil
      blue: { color: '#60a5fa', centerIcon: '❄️', glowColor: 'rgba(96, 165, 250, 0.6)' },  // Ice
    },
    specialCards: {
      redBonus: { symbol: '0', label: '+5' },
      brownPenalty: { symbol: '0', label: '-2' },
    },
  },

  alchemical: {
    id: 'alchemical',
    name: 'Alchemist\'s Lab',
    description: 'Ancient alchemical elements and transmutation',
    requiredLevel: 15,
    preview: 'linear-gradient(135deg, #fbbf24 0%, #78350f 50%, #1e1b4b 100%)',
    isPremium: true,
    useCenterIcons: true,
    formatValue: (value) => value.toString(), // Keep numbers readable
    suits: {
      red: { color: '#f59e0b', centerIcon: '🔥', glowColor: 'rgba(245, 158, 11, 0.6)' },   // Fire element
      brown: { color: '#92400e', centerIcon: '⚗️', glowColor: 'rgba(146, 64, 14, 0.6)' },  // Flask
      green: { color: '#84cc16', centerIcon: '🧪', glowColor: 'rgba(132, 204, 22, 0.6)' }, // Potion
      blue: { color: '#0ea5e9', centerIcon: '💎', glowColor: 'rgba(14, 165, 233, 0.6)' },  // Crystal
    },
    specialCards: {
      redBonus: { symbol: '0', label: '+5' },
      brownPenalty: { symbol: '0', label: '-2' },
    },
  },

  celestial: {
    id: 'celestial',
    name: 'Celestial',
    description: 'Stars, moons, and cosmic wonders',
    requiredLevel: 20,
    preview: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    isPremium: true,
    useCenterIcons: true,
    formatValue: (value) => value.toString(), // Keep numbers readable
    suits: {
      red: { color: '#fb7185', centerIcon: '☄️', glowColor: 'rgba(251, 113, 133, 0.6)' },  // Comet
      brown: { color: '#d4a574', centerIcon: '🌙', glowColor: 'rgba(212, 165, 116, 0.6)' }, // Moon
      green: { color: '#86efac', centerIcon: '🌟', glowColor: 'rgba(134, 239, 172, 0.6)' }, // Star
      blue: { color: '#93c5fd', centerIcon: '🌌', glowColor: 'rgba(147, 197, 253, 0.6)' },  // Galaxy
    },
    specialCards: {
      redBonus: { symbol: '0', label: '+5' },
      brownPenalty: { symbol: '0', label: '-2' },
    },
  },

  royal: {
    id: 'royal',
    name: 'Royal Court',
    description: 'Classic playing card suits with elegant styling',
    requiredLevel: 25,
    preview: 'linear-gradient(135deg, #7c3aed 0%, #c026d3 50%, #db2777 100%)',
    isPremium: true,
    useCenterIcons: true,
    formatValue: (value, isSpecial) => {
      if (isSpecial) return '0';
      // A, 2-7 style (like playing cards)
      const royalValues = ['0', 'A', '2', '3', '4', '5', '6', '7'];
      return royalValues[value] || value.toString();
    },
    suits: {
      red: { color: '#dc2626', centerIcon: '♥️', glowColor: 'rgba(220, 38, 38, 0.6)' },    // Heart
      brown: { color: '#b45309', centerIcon: '♦️', glowColor: 'rgba(180, 83, 9, 0.6)' },   // Diamond
      green: { color: '#059669', centerIcon: '♣️', glowColor: 'rgba(5, 150, 105, 0.6)' },  // Club
      blue: { color: '#2563eb', centerIcon: '♠️', glowColor: 'rgba(37, 99, 235, 0.6)' },   // Spade
    },
    specialCards: {
      redBonus: { symbol: '0', label: '+5' },
      brownPenalty: { symbol: '0', label: '-2' },
    },
    fontFamily: 'Cinzel Decorative, serif',
  },

  neon: {
    id: 'neon',
    name: 'Neon Nights',
    description: 'Cyberpunk neon glow aesthetic',
    requiredLevel: 30,
    preview: 'linear-gradient(135deg, #581c87 0%, #1e1b4b 50%, #0c0a09 100%)',
    isPremium: true,
    useCenterIcons: true,
    formatValue: (value) => value.toString(), // Keep numbers readable
    suits: {
      red: { color: '#f43f5e', centerIcon: '🎮', glowColor: 'rgba(244, 63, 94, 0.7)' },    // Gaming
      brown: { color: '#f97316', centerIcon: '⚡', glowColor: 'rgba(249, 115, 22, 0.7)' }, // Electric
      green: { color: '#10b981', centerIcon: '🔋', glowColor: 'rgba(16, 185, 129, 0.7)' }, // Battery
      blue: { color: '#06b6d4', centerIcon: '💠', glowColor: 'rgba(6, 182, 212, 0.7)' },   // Gem
    },
    specialCards: {
      redBonus: { symbol: '0', label: '+5' },
      brownPenalty: { symbol: '0', label: '-2' },
    },
    containerClass: 'neon-glow',
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

/** Get all card skins as an array */
export const cardSkinList = Object.values(cardSkins);

/** Get a card skin by ID */
export function getCardSkin(id: CardSkinId): CardSkin {
  return cardSkins[id] || cardSkins.classic;
}

/** Default card skin ID */
export const defaultCardSkinId: CardSkinId = 'classic';

/** Card skin requirement type for backend sync */
export interface CardSkinRequirement {
  cardSkinId: string;
  requiredLevel: number;
  description: string;
}

/** Get card skin requirements for sync with backend */
export function getCardSkinRequirements(): CardSkinRequirement[] {
  return cardSkinList.map(skin => ({
    cardSkinId: skin.id,
    requiredLevel: skin.requiredLevel,
    description: skin.description,
  }));
}

export default cardSkins;

// ============================================================================
// CARD SKIN PRICING CONFIGURATION
// Prices in cosmetic currency. Users can buy skins even if below required level.
// ============================================================================

export interface CardSkinPricingInfo {
  /** Price in cosmetic currency (0 = free) */
  price: number;
  /** Suggested level (for display, not enforced when buying) */
  suggestedLevel: number;
}

/**
 * Card Skin pricing map
 * - Free skins (level 0): price = 0
 * - Premium skins: purchasable with cosmetic currency
 */
export const cardSkinPricing: Record<CardSkinId, CardSkinPricingInfo> = {
  'classic': { price: 0, suggestedLevel: 0 },       // Free
  'roman': { price: 0, suggestedLevel: 0 },         // Free
  'elemental': { price: 100, suggestedLevel: 5 },   // Cheap (-35%)
  'nordic': { price: 195, suggestedLevel: 10 },     // Medium (-35%)
  'alchemical': { price: 325, suggestedLevel: 15 }, // Medium (-35%)
  'celestial': { price: 490, suggestedLevel: 20 },  // Premium (-35%)
  'royal': { price: 650, suggestedLevel: 25 },      // Premium (-35%)
  'neon': { price: 975, suggestedLevel: 30 },       // Most expensive (-35%)
};

/**
 * Get pricing info for a card skin
 */
export function getCardSkinPricing(cardSkinId: CardSkinId): CardSkinPricingInfo {
  return cardSkinPricing[cardSkinId] || { price: 0, suggestedLevel: 0 };
}

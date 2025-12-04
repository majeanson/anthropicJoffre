/**
 * Card Skins Configuration
 *
 * Card skins are cosmetic overlays that change how cards are displayed.
 * They work independently of the main UI skin system and can be mixed freely.
 *
 * Features:
 * - Custom value display (numbers, symbols, etc.)
 * - Custom suit icons/emblems
 * - Custom colors per suit
 * - Special effects for bonus cards (red 0, brown 0)
 * - Level-based unlocking (2 free + 6 unlockable)
 */

// ============================================================================
// TYPES
// ============================================================================

export type CardSkinId =
  | 'classic'           // Free: Default numeric style
  | 'roman'             // Free: Roman numerals
  | 'elemental'         // Level 5: Element symbols (fire, earth, water, nature)
  | 'runic'             // Level 10: Nordic runes
  | 'alchemical'        // Level 15: Alchemical symbols
  | 'celestial'         // Level 20: Zodiac/constellation symbols
  | 'royal'             // Level 25: Playing card style (J, Q, K inspired)
  | 'arcane';           // Level 30: Mystical arcane symbols

export interface CardSkinSuitStyle {
  /** Color for this suit (CSS color value) */
  color: string;
  /** Optional icon/symbol for this suit */
  icon?: string;
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
    formatValue: (value) => value.toString(),
    suits: {
      red: { color: '#dc2626', icon: undefined, glowColor: 'rgba(220, 38, 38, 0.5)' },
      brown: { color: '#92400e', icon: undefined, glowColor: 'rgba(146, 64, 14, 0.5)' },
      green: { color: '#16a34a', icon: undefined, glowColor: 'rgba(22, 163, 74, 0.5)' },
      blue: { color: '#2563eb', icon: undefined, glowColor: 'rgba(37, 99, 235, 0.5)' },
    },
    specialCards: {
      redBonus: { symbol: '0', label: '+5' },
      brownPenalty: { symbol: '0', label: '-2' },
    },
  },

  roman: {
    id: 'roman',
    name: 'Roman Numerals',
    description: 'Ancient Roman style numbering system',
    requiredLevel: 0,
    preview: 'linear-gradient(135deg, #1a1a2e 0%, #4a3f35 100%)',
    isPremium: false,
    formatValue: (value, isSpecial) => {
      if (isSpecial) return '0';
      const romanNumerals = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
      return romanNumerals[value] || value.toString();
    },
    suits: {
      red: { color: '#b91c1c', icon: undefined, glowColor: 'rgba(185, 28, 28, 0.5)' },
      brown: { color: '#78350f', icon: undefined, glowColor: 'rgba(120, 53, 15, 0.5)' },
      green: { color: '#166534', icon: undefined, glowColor: 'rgba(22, 101, 52, 0.5)' },
      blue: { color: '#1e40af', icon: undefined, glowColor: 'rgba(30, 64, 175, 0.5)' },
    },
    specialCards: {
      redBonus: { symbol: 'N', label: '+V' },  // N for Nihil (nothing/zero)
      brownPenalty: { symbol: 'N', label: '-II' },
    },
    fontFamily: 'Cinzel, serif',
  },

  // -------------------------------------------------------------------------
  // UNLOCKABLE SKINS (6)
  // -------------------------------------------------------------------------

  elemental: {
    id: 'elemental',
    name: 'Elemental',
    description: 'Harness the power of fire, earth, water, and nature',
    requiredLevel: 5,
    preview: 'linear-gradient(135deg, #ef4444 0%, #22c55e 50%, #3b82f6 100%)',
    isPremium: true,
    formatValue: (value) => value.toString(),
    suits: {
      red: { color: '#ef4444', icon: '🔥', glowColor: 'rgba(239, 68, 68, 0.6)' },
      brown: { color: '#a16207', icon: '🌍', glowColor: 'rgba(161, 98, 7, 0.6)' },
      green: { color: '#22c55e', icon: '🌿', glowColor: 'rgba(34, 197, 94, 0.6)' },
      blue: { color: '#3b82f6', icon: '💧', glowColor: 'rgba(59, 130, 246, 0.6)' },
    },
    specialCards: {
      redBonus: { symbol: '☀️', label: '+5' },
      brownPenalty: { symbol: '🌑', label: '-2' },
    },
  },

  runic: {
    id: 'runic',
    name: 'Runic',
    description: 'Ancient Nordic runes imbued with mystical power',
    requiredLevel: 10,
    preview: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
    isPremium: true,
    formatValue: (value, isSpecial) => {
      if (isSpecial) return 'ᛟ';  // Othala rune
      // Elder Futhark inspired symbols (0-7)
      const runes = ['ᛟ', 'ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ'];
      return runes[value] || value.toString();
    },
    suits: {
      red: { color: '#f87171', icon: 'ᚠ', glowColor: 'rgba(248, 113, 113, 0.6)' },
      brown: { color: '#d97706', icon: 'ᚢ', glowColor: 'rgba(217, 119, 6, 0.6)' },
      green: { color: '#4ade80', icon: 'ᚦ', glowColor: 'rgba(74, 222, 128, 0.6)' },
      blue: { color: '#60a5fa', icon: 'ᚨ', glowColor: 'rgba(96, 165, 250, 0.6)' },
    },
    specialCards: {
      redBonus: { symbol: 'ᛊ', label: '+5' },   // Sowilo (sun)
      brownPenalty: { symbol: 'ᚾ', label: '-2' }, // Nauthiz (need/hardship)
    },
    fontFamily: 'Noto Sans Runic, serif',
  },

  alchemical: {
    id: 'alchemical',
    name: 'Alchemical',
    description: 'Transmutation symbols from the great work',
    requiredLevel: 15,
    preview: 'linear-gradient(135deg, #fbbf24 0%, #78350f 50%, #1e1b4b 100%)',
    isPremium: true,
    formatValue: (value, isSpecial) => {
      if (isSpecial) return '☿';  // Mercury symbol
      // Alchemical and astrological symbols (0-7)
      const symbols = ['☿', '☉', '☽', '♂', '♀', '♃', '♄', '♅'];
      return symbols[value] || value.toString();
    },
    suits: {
      red: { color: '#f59e0b', icon: '🜂', glowColor: 'rgba(245, 158, 11, 0.6)' },  // Fire
      brown: { color: '#92400e', icon: '🜃', glowColor: 'rgba(146, 64, 14, 0.6)' },  // Earth
      green: { color: '#84cc16', icon: '🜁', glowColor: 'rgba(132, 204, 22, 0.6)' },  // Air
      blue: { color: '#0ea5e9', icon: '🜄', glowColor: 'rgba(14, 165, 233, 0.6)' },  // Water
    },
    specialCards: {
      redBonus: { symbol: '🜍', label: '+5' },    // Sulfur (soul)
      brownPenalty: { symbol: '🜔', label: '-2' }, // Salt (body)
    },
  },

  celestial: {
    id: 'celestial',
    name: 'Celestial',
    description: 'Written in the stars - zodiac and constellation symbols',
    requiredLevel: 20,
    preview: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    isPremium: true,
    formatValue: (value, isSpecial) => {
      if (isSpecial) return '✧';
      // Zodiac symbols (0-7)
      const zodiac = ['✧', '♈', '♉', '♊', '♋', '♌', '♍', '♎'];
      return zodiac[value] || value.toString();
    },
    suits: {
      red: { color: '#fb7185', icon: '☄️', glowColor: 'rgba(251, 113, 133, 0.6)' },
      brown: { color: '#d4a574', icon: '🌙', glowColor: 'rgba(212, 165, 116, 0.6)' },
      green: { color: '#86efac', icon: '🌟', glowColor: 'rgba(134, 239, 172, 0.6)' },
      blue: { color: '#93c5fd', icon: '💫', glowColor: 'rgba(147, 197, 253, 0.6)' },
    },
    specialCards: {
      redBonus: { symbol: '☀', label: '+5' },
      brownPenalty: { symbol: '🌑', label: '-2' },
    },
  },

  royal: {
    id: 'royal',
    name: 'Royal Court',
    description: 'Inspired by classic playing cards with court figures',
    requiredLevel: 25,
    preview: 'linear-gradient(135deg, #7c3aed 0%, #c026d3 50%, #db2777 100%)',
    isPremium: true,
    formatValue: (value, isSpecial) => {
      if (isSpecial) return '♔';  // King symbol for special
      // A, 2-7, with face card style for higher values (0-7)
      const royalValues = ['♔', 'A', '2', '3', '4', '5', '6', '7'];
      return royalValues[value] || value.toString();
    },
    suits: {
      red: { color: '#dc2626', icon: '♥', glowColor: 'rgba(220, 38, 38, 0.6)' },
      brown: { color: '#b45309', icon: '♦', glowColor: 'rgba(180, 83, 9, 0.6)' },
      green: { color: '#059669', icon: '♣', glowColor: 'rgba(5, 150, 105, 0.6)' },
      blue: { color: '#2563eb', icon: '♠', glowColor: 'rgba(37, 99, 235, 0.6)' },
    },
    specialCards: {
      redBonus: { symbol: '♔', label: '+5' },
      brownPenalty: { symbol: '☠', label: '-2' },
    },
    fontFamily: 'Cinzel Decorative, serif',
  },

  arcane: {
    id: 'arcane',
    name: 'Arcane Mysteries',
    description: 'Forbidden symbols from ancient grimoires',
    requiredLevel: 30,
    preview: 'linear-gradient(135deg, #581c87 0%, #1e1b4b 50%, #0c0a09 100%)',
    isPremium: true,
    formatValue: (value, isSpecial) => {
      if (isSpecial) return '⍟';
      // Mystical/magical symbols
      const arcane = ['⍟', '⌬', '⏣', '⎔', '⌘', '⍜', '⌖', '⏚'];
      return arcane[value] || value.toString();
    },
    suits: {
      red: { color: '#a855f7', icon: '✦', glowColor: 'rgba(168, 85, 247, 0.7)' },
      brown: { color: '#f97316', icon: '✧', glowColor: 'rgba(249, 115, 22, 0.7)' },
      green: { color: '#10b981', icon: '✶', glowColor: 'rgba(16, 185, 129, 0.7)' },
      blue: { color: '#06b6d4', icon: '✴', glowColor: 'rgba(6, 182, 212, 0.7)' },
    },
    specialCards: {
      redBonus: { symbol: '☯', label: '+5' },
      brownPenalty: { symbol: '☠', label: '-2' },
    },
    containerClass: 'arcane-glow',
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
  'elemental': { price: 150, suggestedLevel: 5 },   // Cheap
  'runic': { price: 300, suggestedLevel: 10 },      // Medium
  'alchemical': { price: 500, suggestedLevel: 15 }, // Medium
  'celestial': { price: 750, suggestedLevel: 20 },  // Premium
  'royal': { price: 1000, suggestedLevel: 25 },     // Premium
  'arcane': { price: 1500, suggestedLevel: 30 },    // Most expensive
};

/**
 * Get pricing info for a card skin
 */
export function getCardSkinPricing(cardSkinId: CardSkinId): CardSkinPricingInfo {
  return cardSkinPricing[cardSkinId] || { price: 0, suggestedLevel: 0 };
}

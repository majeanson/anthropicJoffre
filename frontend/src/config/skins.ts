/**
 * Skin System Configuration - Tavern Noir Edition
 *
 * A comprehensive theming system that allows users to choose from
 * multiple visual styles. Each skin defines colors, typography,
 * effects, and component-specific styling.
 *
 * Default skin: Tavern Noir (moody atmospheric card game aesthetic)
 */

// ============================================================================
// SKIN TYPE DEFINITIONS
// ============================================================================

export type SkinId =
  | 'midnight-alchemy'
  | 'tavern-noir'
  | 'luxury-casino'
  | 'modern-minimal'
  | 'modern-minimal-dark'
  | 'cyberpunk-neon'
  | 'classic-parchment'
  // Sprint 21: New UI skins
  | 'sakura-spring'
  | 'ocean-depths'
  | 'forest-enchanted';

export interface SkinColors {
  // Background layers
  bg: {
    primary: string;      // Main app background
    secondary: string;    // Card/panel backgrounds
    tertiary: string;     // Nested element backgrounds
    accent: string;       // Accent background (buttons, highlights)
    overlay: string;      // Modal overlays
  };

  // Text colors
  text: {
    primary: string;      // Main text
    secondary: string;    // Subdued text
    accent: string;       // Highlighted text
    inverse: string;      // Text on accent backgrounds
    muted: string;        // Very subdued text
  };

  // Border colors
  border: {
    default: string;      // Standard borders
    accent: string;       // Highlighted borders
    subtle: string;       // Very light borders
  };

  // Semantic colors
  success: string;
  warning: string;
  error: string;
  info: string;

  // Team colors
  team1: {
    primary: string;
    secondary: string;
    text: string;
  };
  team2: {
    primary: string;
    secondary: string;
    text: string;
  };

  // Card suit colors (for playing cards)
  suits: {
    red: string;
    brown: string;
    green: string;
    blue: string;
  };

  // Special effect colors
  glow: string;
  highlight: string;
  shadow: string;
}

export interface SkinTypography {
  fontFamily: {
    display: string;      // Headlines, titles
    body: string;         // Body text
    mono: string;         // Code, numbers
  };
  fontWeight: {
    normal: number;
    medium: number;
    bold: number;
    black: number;
  };
}

export interface SkinPricing {
  /** Price in cosmetic currency (0 = free or level-only) */
  price: number;
  /** Required level (0 = no level requirement, just purchase) */
  requiredLevel: number;
}

export interface SkinEffects {
  // Border radius scale
  radius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };

  // Shadow definitions
  shadows: {
    sm: string;
    md: string;
    lg: string;
    glow: string;
    inset: string;
  };

  // Animation preferences
  animations: {
    duration: {
      fast: string;
      normal: string;
      slow: string;
    };
    easing: string;
  };

  // Special visual effects
  specialEffects: {
    scanlines: boolean;
    noise: boolean;
    glow: boolean;
    pixelated: boolean;
    gradientOverlay: boolean;
  };
}

export interface SkinComponents {
  // Button styling
  button: {
    borderWidth: string;
    textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    letterSpacing: string;
  };

  // Card (playing card) styling
  card: {
    borderWidth: string;
    bgColor: string;
    cornerRadius: string;
  };

  // Modal styling
  modal: {
    backdropBlur: string;
    borderWidth: string;
  };

  // Input styling
  input: {
    borderWidth: string;
    focusRingWidth: string;
  };
}

export interface Skin {
  id: SkinId;
  name: string;
  description: string;
  preview: string;           // Preview image/gradient for skin selector
  isDark: boolean;           // Whether this is a dark theme
  colors: SkinColors;
  typography: SkinTypography;
  effects: SkinEffects;
  components: SkinComponents;
  cssVariables: Record<string, string>;  // CSS custom properties
  /** Pricing info for shop (optional, defaults to level-gated) */
  pricing?: SkinPricing;
}

// ============================================================================
// TAVERN NOIR SKIN (Default)
// Moody atmospheric card game with film noir + Victorian tavern aesthetic
// ============================================================================

export const tavernNoirSkin: Skin = {
  id: 'tavern-noir',
  name: '🌙 Tavern Noir',
  description: 'Moody candlelit atmosphere with art deco elegance and mysterious shadows',
  preview: 'linear-gradient(135deg, #0d0c0a 0%, #1c1814 50%, #2a2118 100%)',
  isDark: true,

  colors: {
    bg: {
      primary: '#0d0c0a',           // Deep charcoal-black
      secondary: '#1c1814',         // Dark mahogany
      tertiary: '#2a2118',          // Warm dark brown
      accent: '#c9a227',            // Burnished gold
      overlay: 'rgba(13, 12, 10, 0.96)',
    },

    text: {
      primary: '#f4efe4',           // Warm ivory
      secondary: '#a89b8a',         // Aged parchment
      accent: '#c9a227',            // Burnished gold
      inverse: '#0d0c0a',           // Deep charcoal
      muted: '#6b5d4d',             // Dusty brown
    },

    border: {
      default: '#3d3429',           // Dark brass
      accent: '#c9a227',            // Gold
      subtle: '#261f19',            // Nearly invisible
    },

    success: '#4a9c6d',             // Muted emerald
    warning: '#d4a03a',             // Amber candlelight
    error: '#a63d3d',               // Deep crimson
    info: '#5c8db8',                // Smoky blue

    team1: {
      primary: '#a63d3d',           // Crimson velvet
      secondary: '#c45454',
      text: '#f4efe4',
    },
    team2: {
      primary: '#3d6a8a',           // Midnight blue
      secondary: '#4d82a6',
      text: '#f4efe4',
    },

    suits: {
      red: '#b84444',               // Blood red
      brown: '#8b6914',             // Dark amber
      green: '#3d7a54',             // Forest green
      blue: '#3d6a8a',              // Steel blue
    },

    glow: '#c9a227',                // Gold candlelight
    highlight: '#c9a227',
    shadow: '#000000',
  },

  typography: {
    fontFamily: {
      display: '"Playfair Display", "Crimson Text", Georgia, serif',
      body: '"Crimson Text", "Georgia", serif',
      mono: '"JetBrains Mono", "Fira Code", monospace',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      bold: 700,
      black: 900,
    },
  },

  effects: {
    radius: {
      sm: '3px',
      md: '6px',
      lg: '10px',
      xl: '16px',
      full: '9999px',
    },

    shadows: {
      sm: '0 2px 8px rgba(0, 0, 0, 0.4)',
      md: '0 4px 16px rgba(0, 0, 0, 0.5)',
      lg: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 80px rgba(201, 162, 39, 0.08)',
      glow: '0 0 20px rgba(201, 162, 39, 0.25), 0 0 60px rgba(201, 162, 39, 0.1)',
      inset: 'inset 0 2px 8px rgba(0, 0, 0, 0.5)',
    },

    animations: {
      duration: {
        fast: '180ms',
        normal: '350ms',
        slow: '600ms',
      },
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },

    specialEffects: {
      scanlines: false,
      noise: true,              // Subtle grain texture
      glow: true,               // Candlelight glow
      pixelated: false,
      gradientOverlay: true,    // Vignette effect
    },
  },

  components: {
    button: {
      borderWidth: '2px',
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
    },
    card: {
      borderWidth: '3px',
      bgColor: '#f8f4e8',
      cornerRadius: '8px',
    },
    modal: {
      backdropBlur: '12px',
      borderWidth: '2px',
    },
    input: {
      borderWidth: '2px',
      focusRingWidth: '3px',
    },
  },

  cssVariables: {
    '--skin-noise-opacity': '0.04',
    '--skin-vignette-intensity': '0.6',
    '--skin-candlelight-flicker': '1',
  },
};

// ============================================================================
// LUXURY CASINO SKIN
// Sophisticated, dark with gold accents and velvet textures
// ============================================================================

export const luxuryCasinoSkin: Skin = {
  id: 'luxury-casino',
  name: '🌙 Luxury Casino',
  description: 'Sophisticated elegance with gold accents and velvet depth',
  preview: 'linear-gradient(135deg, #0a0908 0%, #1a1614 50%, #0a0908 100%)',
  isDark: true,

  colors: {
    bg: {
      primary: '#0a0908',           // Near black with warmth
      secondary: '#141210',         // Rich black
      tertiary: '#1e1a16',          // Card backgrounds
      accent: '#d4af37',            // Pure gold
      overlay: 'rgba(10, 9, 8, 0.96)',
    },

    text: {
      primary: '#f5f0e6',           // Cream white
      secondary: '#9a9080',         // Warm gray
      accent: '#d4af37',            // Gold
      inverse: '#0a0908',           // Dark
      muted: '#5a5448',             // Subdued
    },

    border: {
      default: '#2e2820',
      accent: '#d4af37',
      subtle: '#1a1612',
    },

    success: '#2ecc71',
    warning: '#f39c12',
    error: '#c0392b',
    info: '#3498db',

    team1: {
      primary: '#9b2335',           // Deep burgundy
      secondary: '#b83347',
      text: '#ffffff',
    },
    team2: {
      primary: '#1e3a5f',           // Navy blue
      secondary: '#2a4f7f',
      text: '#ffffff',
    },

    suits: {
      red: '#9b2335',
      brown: '#8b6914',
      green: '#1a6b4a',
      blue: '#1e3a5f',
    },

    glow: '#d4af37',
    highlight: '#d4af37',
    shadow: '#000000',
  },

  typography: {
    fontFamily: {
      display: '"Playfair Display", "Georgia", serif',
      body: '"Lato", "Helvetica Neue", sans-serif',
      mono: '"JetBrains Mono", monospace',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      bold: 700,
      black: 900,
    },
  },

  effects: {
    radius: {
      sm: '4px',
      md: '8px',
      lg: '12px',
      xl: '20px',
      full: '9999px',
    },

    shadows: {
      sm: '0 2px 6px rgba(0, 0, 0, 0.35)',
      md: '0 4px 16px rgba(0, 0, 0, 0.45)',
      lg: '0 8px 32px rgba(0, 0, 0, 0.55), 0 0 60px rgba(212, 175, 55, 0.06)',
      glow: '0 0 30px rgba(212, 175, 55, 0.25)',
      inset: 'inset 0 2px 6px rgba(0, 0, 0, 0.3)',
    },

    animations: {
      duration: {
        fast: '200ms',
        normal: '400ms',
        slow: '600ms',
      },
      easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    },

    specialEffects: {
      scanlines: false,
      noise: true,
      glow: true,
      pixelated: false,
      gradientOverlay: true,
    },
  },

  components: {
    button: {
      borderWidth: '2px',
      textTransform: 'uppercase',
      letterSpacing: '0.15em',
    },
    card: {
      borderWidth: '2px',
      bgColor: '#f5f0e6',
      cornerRadius: '10px',
    },
    modal: {
      backdropBlur: '16px',
      borderWidth: '1px',
    },
    input: {
      borderWidth: '1px',
      focusRingWidth: '2px',
    },
  },

  cssVariables: {
    '--skin-noise-opacity': '0.025',
    '--skin-gold-shimmer': '1',
  },
};

// ============================================================================
// MODERN MINIMAL SKIN
// Clean, sharp, generous whitespace with subtle warmth
// ============================================================================

export const modernMinimalSkin: Skin = {
  id: 'modern-minimal',
  name: '☀️ Modern Minimal',
  description: 'Clean lines, generous whitespace, and refined simplicity',
  preview: 'linear-gradient(135deg, #f5f3f0 0%, #ebe8e4 50%, #e0ddd8 100%)',
  isDark: false,

  colors: {
    bg: {
      primary: '#f5f3f0',           // Softer warm cream (easier on eyes)
      secondary: '#ffffff',         // Pure white for panels
      tertiary: '#ebe8e4',          // Warm light gray
      accent: '#1f2937',            // Dark gray accent (more contrast)
      overlay: 'rgba(245, 243, 240, 0.98)',
    },

    text: {
      primary: '#1f2937',           // Darker gray for better readability
      secondary: '#4b5563',         // Medium gray
      accent: '#0369a1',            // Strong blue
      inverse: '#ffffff',
      muted: '#6b7280',
    },

    border: {
      default: '#d1d5db',
      accent: '#1f2937',
      subtle: '#e5e7eb',
    },

    success: '#15803d',
    warning: '#b45309',
    error: '#b91c1c',
    info: '#0369a1',

    team1: {
      primary: '#c2410c',
      secondary: '#ea580c',
      text: '#ffffff',
    },
    team2: {
      primary: '#4338ca',
      secondary: '#6366f1',
      text: '#ffffff',
    },

    suits: {
      red: '#b91c1c',
      brown: '#78350f',
      green: '#15803d',
      blue: '#0369a1',
    },

    glow: '#0369a1',
    highlight: '#0369a1',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },

  typography: {
    fontFamily: {
      display: '"Segoe UI", Tahoma, Verdana, Arial, sans-serif',
      body: '"Segoe UI", Tahoma, Verdana, Arial, sans-serif',
      mono: '"Consolas", "Courier New", monospace',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      bold: 600,
      black: 700,
    },
  },

  effects: {
    radius: {
      sm: '6px',
      md: '10px',
      lg: '14px',
      xl: '20px',
      full: '9999px',
    },

    shadows: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
      md: '0 4px 8px rgba(0, 0, 0, 0.06)',
      lg: '0 12px 24px rgba(0, 0, 0, 0.08)',
      glow: '0 0 0 3px rgba(3, 105, 161, 0.12)',
      inset: 'inset 0 1px 2px rgba(0, 0, 0, 0.04)',
    },

    animations: {
      duration: {
        fast: '120ms',
        normal: '200ms',
        slow: '300ms',
      },
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    },

    specialEffects: {
      scanlines: false,
      noise: false,
      glow: false,
      pixelated: false,
      gradientOverlay: false,
    },
  },

  components: {
    button: {
      borderWidth: '1px',
      textTransform: 'none',
      letterSpacing: '-0.01em',
    },
    card: {
      borderWidth: '1px',
      bgColor: '#fefefe',           // Bright white for playing cards
      cornerRadius: '10px',
    },
    modal: {
      backdropBlur: '20px',
      borderWidth: '1px',
    },
    input: {
      borderWidth: '1px',
      focusRingWidth: '2px',
    },
  },

  cssVariables: {},
};

// ============================================================================
// MODERN MINIMAL DARK SKIN
// Clean, sharp design with dark mode - same aesthetic, inverted colors
// ============================================================================

export const modernMinimalDarkSkin: Skin = {
  id: 'modern-minimal-dark',
  name: '🌙 Modern Minimal Dark',
  description: 'Clean minimalist design with a sleek dark interface',
  preview: 'linear-gradient(135deg, #18181b 0%, #27272a 50%, #3f3f46 100%)',
  isDark: true,

  colors: {
    bg: {
      primary: '#18181b',           // Zinc-900
      secondary: '#1f1f23',         // Slightly lighter
      tertiary: '#27272a',          // Zinc-800
      accent: '#f4f4f5',            // Light accent (inverted)
      overlay: 'rgba(24, 24, 27, 0.98)',
    },

    text: {
      primary: '#f4f4f5',           // Zinc-100
      secondary: '#a1a1aa',         // Zinc-400
      accent: '#38bdf8',            // Sky-400 (softer blue)
      inverse: '#18181b',
      muted: '#71717a',             // Zinc-500
    },

    border: {
      default: '#3f3f46',           // Zinc-700
      accent: '#f4f4f5',
      subtle: '#27272a',
    },

    success: '#22c55e',             // Green-500
    warning: '#f59e0b',             // Amber-500
    error: '#ef4444',               // Red-500
    info: '#38bdf8',                // Sky-400

    team1: {
      primary: '#ea580c',           // Orange-600
      secondary: '#f97316',
      text: '#ffffff',
    },
    team2: {
      primary: '#6366f1',           // Indigo-500
      secondary: '#818cf8',
      text: '#ffffff',
    },

    suits: {
      red: '#ef4444',
      brown: '#a16207',
      green: '#22c55e',
      blue: '#38bdf8',
    },

    glow: '#38bdf8',
    highlight: '#38bdf8',
    shadow: 'rgba(0, 0, 0, 0.5)',
  },

  typography: {
    fontFamily: {
      display: '"Segoe UI", Tahoma, Verdana, Arial, sans-serif',
      body: '"Segoe UI", Tahoma, Verdana, Arial, sans-serif',
      mono: '"Consolas", "Courier New", monospace',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      bold: 600,
      black: 700,
    },
  },

  effects: {
    radius: {
      sm: '6px',
      md: '10px',
      lg: '14px',
      xl: '20px',
      full: '9999px',
    },

    shadows: {
      sm: '0 1px 3px rgba(0, 0, 0, 0.3)',
      md: '0 4px 12px rgba(0, 0, 0, 0.4)',
      lg: '0 12px 28px rgba(0, 0, 0, 0.5)',
      glow: '0 0 0 3px rgba(56, 189, 248, 0.2)',
      inset: 'inset 0 1px 3px rgba(0, 0, 0, 0.3)',
    },

    animations: {
      duration: {
        fast: '120ms',
        normal: '200ms',
        slow: '300ms',
      },
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    },

    specialEffects: {
      scanlines: false,
      noise: false,
      glow: false,
      pixelated: false,
      gradientOverlay: false,
    },
  },

  components: {
    button: {
      borderWidth: '1px',
      textTransform: 'none',
      letterSpacing: '-0.01em',
    },
    card: {
      borderWidth: '1px',
      bgColor: '#27272a',           // Dark card background
      cornerRadius: '10px',
    },
    modal: {
      backdropBlur: '20px',
      borderWidth: '1px',
    },
    input: {
      borderWidth: '1px',
      focusRingWidth: '2px',
    },
  },

  cssVariables: {},
};

// ============================================================================
// CYBERPUNK NEON SKIN
// Intense neon on dark, high contrast with digital glitch aesthetic
// ============================================================================

export const cyberpunkNeonSkin: Skin = {
  id: 'cyberpunk-neon',
  name: '🌙 Cyberpunk Neon',
  description: 'High-contrast neon with digital glitch effects and electric intensity',
  preview: 'linear-gradient(135deg, #05050a 0%, #0a0a1a 50%, #050510 100%)',
  isDark: true,

  colors: {
    bg: {
      primary: '#05050a',
      secondary: '#0a0a14',
      tertiary: '#10101e',
      accent: '#ff0080',
      overlay: 'rgba(5, 5, 10, 0.96)',
    },

    text: {
      primary: '#f0f0f5',
      secondary: '#8888a0',
      accent: '#00ffff',
      inverse: '#05050a',
      muted: '#404060',
    },

    border: {
      default: '#202040',
      accent: '#ff0080',
      subtle: '#101020',
    },

    success: '#00ff88',
    warning: '#ffcc00',
    error: '#ff0044',
    info: '#00ffff',

    team1: {
      primary: '#ff6600',
      secondary: '#ff8833',
      text: '#000000',
    },
    team2: {
      primary: '#9900ff',
      secondary: '#bb44ff',
      text: '#ffffff',
    },

    suits: {
      red: '#ff0044',
      brown: '#cc6600',
      green: '#00ff88',
      blue: '#00aaff',
    },

    glow: '#00ffff',
    highlight: '#ff0080',
    shadow: '#000000',
  },

  typography: {
    fontFamily: {
      display: '"Orbitron", "Rajdhani", sans-serif',
      body: '"Rajdhani", "Exo 2", sans-serif',
      mono: '"Share Tech Mono", monospace',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      bold: 700,
      black: 900,
    },
  },

  effects: {
    radius: {
      sm: '2px',
      md: '4px',
      lg: '6px',
      xl: '8px',
      full: '9999px',
    },

    shadows: {
      sm: '0 0 10px rgba(0, 255, 255, 0.2)',
      md: '0 0 20px rgba(255, 0, 128, 0.25)',
      lg: '0 0 40px rgba(0, 255, 255, 0.3), 0 0 80px rgba(255, 0, 128, 0.15)',
      glow: '0 0 30px rgba(0, 255, 255, 0.5), 0 0 60px rgba(0, 255, 255, 0.25)',
      inset: 'inset 0 0 20px rgba(0, 255, 255, 0.1)',
    },

    animations: {
      duration: {
        fast: '80ms',
        normal: '150ms',
        slow: '300ms',
      },
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },

    specialEffects: {
      scanlines: true,
      noise: true,
      glow: true,
      pixelated: false,
      gradientOverlay: true,
    },
  },

  components: {
    button: {
      borderWidth: '2px',
      textTransform: 'uppercase',
      letterSpacing: '0.2em',
    },
    card: {
      borderWidth: '2px',
      bgColor: '#0a0a14',
      cornerRadius: '4px',
    },
    modal: {
      backdropBlur: '8px',
      borderWidth: '2px',
    },
    input: {
      borderWidth: '2px',
      focusRingWidth: '2px',
    },
  },

  cssVariables: {
    '--skin-scanline-opacity': '0.04',
    '--skin-noise-opacity': '0.025',
    '--skin-glow-intensity': '1.5',
    '--skin-glitch-intensity': '1',
  },
};

// ============================================================================
// CLASSIC PARCHMENT SKIN
// Traditional card game aesthetic with warm parchment and ink
// ============================================================================

export const classicParchmentSkin: Skin = {
  id: 'classic-parchment',
  name: '☀️ Classic Parchment',
  description: 'Traditional elegance with aged paper textures and classic typography',
  preview: 'linear-gradient(135deg, #e8dcc8 0%, #d9ccb4 50%, #c9bea8 100%)',
  isDark: false,

  colors: {
    bg: {
      primary: '#e8dcc8',           // Warm aged parchment (was too white)
      secondary: '#efe5d6',         // Slightly lighter parchment
      tertiary: '#d9ccb4',          // Darker aged paper
      accent: '#8b2323',            // Burgundy ink
      overlay: 'rgba(232, 220, 200, 0.98)',
    },

    text: {
      primary: '#2a2318',           // Dark sepia ink
      secondary: '#4a4035',         // Medium sepia
      accent: '#8b2323',            // Burgundy accent
      inverse: '#efe5d6',           // Light parchment
      muted: '#7a6e5c',             // Faded ink
    },

    border: {
      default: '#b5a890',           // Aged paper edge
      accent: '#8b2323',            // Burgundy
      subtle: '#c9bea8',            // Light border
    },

    success: '#2d6a4f',
    warning: '#b07d2b',
    error: '#8b2323',
    info: '#1e5c8a',

    team1: {
      primary: '#8b2323',
      secondary: '#a63a3a',
      text: '#fdfbf7',
    },
    team2: {
      primary: '#1e5c8a',
      secondary: '#2874a6',
      text: '#fdfbf7',
    },

    suits: {
      red: '#8b2323',
      brown: '#6b4423',
      green: '#2d6a4f',
      blue: '#1e5c8a',
    },

    glow: '#d4af37',
    highlight: '#8b2323',
    shadow: 'rgba(61, 52, 40, 0.15)',
  },

  typography: {
    fontFamily: {
      display: '"Playfair Display", "Georgia", serif',
      body: '"Crimson Text", "Georgia", serif',
      mono: '"Courier Prime", "Courier New", monospace',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      bold: 700,
      black: 900,
    },
  },

  effects: {
    radius: {
      sm: '4px',
      md: '8px',
      lg: '12px',
      xl: '16px',
      full: '9999px',
    },

    shadows: {
      sm: '0 2px 6px rgba(61, 52, 40, 0.1)',
      md: '0 4px 12px rgba(61, 52, 40, 0.12)',
      lg: '0 8px 24px rgba(61, 52, 40, 0.15)',
      glow: '0 0 20px rgba(212, 175, 55, 0.15)',
      inset: 'inset 0 2px 6px rgba(61, 52, 40, 0.08)',
    },

    animations: {
      duration: {
        fast: '180ms',
        normal: '300ms',
        slow: '450ms',
      },
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },

    specialEffects: {
      scanlines: false,
      noise: true,
      glow: false,
      pixelated: false,
      gradientOverlay: false,
    },
  },

  components: {
    button: {
      borderWidth: '2px',
      textTransform: 'none',
      letterSpacing: '0.02em',
    },
    card: {
      borderWidth: '2px',
      bgColor: '#f5efe0',           // Warm cream parchment for cards
      cornerRadius: '8px',
    },
    modal: {
      backdropBlur: '10px',
      borderWidth: '2px',
    },
    input: {
      borderWidth: '2px',
      focusRingWidth: '2px',
    },
  },

  cssVariables: {
    '--skin-noise-opacity': '0.035',
    '--skin-paper-warmth': '1',
  },
};

// ============================================================================
// MIDNIGHT ALCHEMY SKIN (New Default)
// Mystical alchemist's study - occult manuscripts, brass instruments, ethereal glow
// ============================================================================

export const midnightAlchemySkin: Skin = {
  id: 'midnight-alchemy',
  name: '🌙 Midnight Alchemy',
  description: 'Mystical alchemist\'s study with ancient artifacts, copper accents, and ethereal glow',
  preview: 'linear-gradient(135deg, #0B0E14 0%, #131824 50%, #1A1F2E 100%)',
  isDark: true,

  colors: {
    bg: {
      primary: '#0B0E14',           // Deep midnight void
      secondary: '#131824',         // Alchemist's chamber
      tertiary: '#1A1F2E',          // Workbench shadow
      accent: '#C17F59',            // Burnished copper
      overlay: 'rgba(11, 14, 20, 0.96)',
    },

    text: {
      primary: '#E8E4DC',           // Aged manuscript
      secondary: '#9CA3AF',         // Faded ink
      accent: '#D4A574',            // Rose gold illumination
      inverse: '#0B0E14',           // Deep void
      muted: '#6B7280',             // Weathered text
    },

    border: {
      default: '#2D3548',           // Brass patina
      accent: '#C17F59',            // Polished copper
      subtle: '#1F2937',            // Shadow edge
    },

    success: '#2DD4BF',             // Alchemical teal (transmutation)
    warning: '#F59E0B',             // Molten gold
    error: '#DC2626',               // Dragon's blood
    info: '#60A5FA',                // Celestial blue

    team1: {
      primary: '#B45309',           // Ember orange
      secondary: '#D97706',
      text: '#FEF3C7',
    },
    team2: {
      primary: '#7C3AED',           // Mystic violet
      secondary: '#8B5CF6',
      text: '#F5F3FF',
    },

    suits: {
      red: '#DC2626',               // Ruby essence
      brown: '#B45309',             // Amber resin
      green: '#059669',             // Emerald elixir
      blue: '#2563EB',              // Sapphire tincture
    },

    glow: '#D4A574',                // Rose gold ethereal
    highlight: '#C17F59',           // Copper luminance
    shadow: '#000000',
  },

  typography: {
    fontFamily: {
      display: '"Cinzel", "Playfair Display", Georgia, serif',
      body: '"Lora", "Source Serif 4", Georgia, serif',
      mono: '"Fira Code", "JetBrains Mono", monospace',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      bold: 700,
      black: 900,
    },
  },

  effects: {
    radius: {
      sm: '4px',
      md: '8px',
      lg: '12px',
      xl: '20px',
      full: '9999px',
    },

    shadows: {
      sm: '0 2px 8px rgba(0, 0, 0, 0.5), 0 0 20px rgba(193, 127, 89, 0.05)',
      md: '0 4px 16px rgba(0, 0, 0, 0.6), 0 0 30px rgba(193, 127, 89, 0.08)',
      lg: '0 8px 32px rgba(0, 0, 0, 0.7), 0 0 60px rgba(212, 165, 116, 0.1)',
      glow: '0 0 30px rgba(212, 165, 116, 0.3), 0 0 60px rgba(193, 127, 89, 0.15)',
      inset: 'inset 0 2px 8px rgba(0, 0, 0, 0.5)',
    },

    animations: {
      duration: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms',
      },
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },

    specialEffects: {
      scanlines: false,
      noise: true,
      glow: true,
      pixelated: false,
      gradientOverlay: true,
    },
  },

  components: {
    button: {
      borderWidth: '2px',
      textTransform: 'uppercase',
      letterSpacing: '0.15em',
    },
    card: {
      borderWidth: '2px',
      bgColor: '#F5F0E6',
      cornerRadius: '10px',
    },
    modal: {
      backdropBlur: '16px',
      borderWidth: '2px',
    },
    input: {
      borderWidth: '2px',
      focusRingWidth: '3px',
    },
  },

  cssVariables: {
    '--skin-noise-opacity': '0.03',
    '--skin-vignette-intensity': '0.5',
    '--skin-particle-opacity': '0.4',
    '--skin-glow-intensity': '1.2',
  },
};

// ============================================================================
// SAKURA SPRING SKIN (Sprint 21)
// Light Japanese-inspired theme with cherry blossom pink accents
// ============================================================================

export const sakuraSpringSkin: Skin = {
  id: 'sakura-spring',
  name: '🌸 Sakura Spring',
  description: 'Delicate cherry blossom aesthetics with soft pink and cream tones',
  preview: 'linear-gradient(135deg, #fdf6f8 0%, #fce7ef 50%, #fbd4e0 100%)',
  isDark: false,

  colors: {
    bg: {
      primary: '#fdf6f8',           // Soft cream pink
      secondary: '#ffffff',         // Pure white
      tertiary: '#fce7ef',          // Light sakura
      accent: '#e91e63',            // Vivid cherry blossom
      overlay: 'rgba(253, 246, 248, 0.98)',
    },

    text: {
      primary: '#3d2c35',           // Deep rose brown
      secondary: '#6b5660',         // Muted plum
      accent: '#c2185b',            // Cherry accent
      inverse: '#ffffff',
      muted: '#9e8d95',
    },

    border: {
      default: '#f3d1dc',
      accent: '#e91e63',
      subtle: '#fce7ef',
    },

    success: '#43a047',
    warning: '#ef6c00',
    error: '#c62828',
    info: '#1976d2',

    team1: {
      primary: '#d81b60',           // Deep pink
      secondary: '#ec407a',
      text: '#ffffff',
    },
    team2: {
      primary: '#5e35b1',           // Deep purple
      secondary: '#7e57c2',
      text: '#ffffff',
    },

    suits: {
      red: '#c62828',
      brown: '#6d4c41',
      green: '#2e7d32',
      blue: '#1565c0',
    },

    glow: '#f48fb1',
    highlight: '#e91e63',
    shadow: 'rgba(61, 44, 53, 0.1)',
  },

  typography: {
    fontFamily: {
      display: '"Noto Serif JP", "Playfair Display", Georgia, serif',
      body: '"Noto Sans JP", "Source Sans 3", sans-serif',
      mono: '"JetBrains Mono", monospace',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      bold: 600,
      black: 700,
    },
  },

  effects: {
    radius: {
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '24px',
      full: '9999px',
    },

    shadows: {
      sm: '0 2px 6px rgba(233, 30, 99, 0.08)',
      md: '0 4px 12px rgba(233, 30, 99, 0.1)',
      lg: '0 8px 24px rgba(233, 30, 99, 0.12)',
      glow: '0 0 20px rgba(244, 143, 177, 0.3)',
      inset: 'inset 0 2px 4px rgba(233, 30, 99, 0.05)',
    },

    animations: {
      duration: {
        fast: '150ms',
        normal: '280ms',
        slow: '450ms',
      },
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },

    specialEffects: {
      scanlines: false,
      noise: false,
      glow: true,
      pixelated: false,
      gradientOverlay: false,
    },
  },

  components: {
    button: {
      borderWidth: '1px',
      textTransform: 'none',
      letterSpacing: '0.02em',
    },
    card: {
      borderWidth: '1px',
      bgColor: '#fffbfc',
      cornerRadius: '12px',
    },
    modal: {
      backdropBlur: '16px',
      borderWidth: '1px',
    },
    input: {
      borderWidth: '1px',
      focusRingWidth: '2px',
    },
  },

  cssVariables: {
    '--skin-petal-fall': '1',
  },
};

// ============================================================================
// OCEAN DEPTHS SKIN (Sprint 21)
// Deep sea blue theme with bioluminescent accents
// ============================================================================

export const oceanDepthsSkin: Skin = {
  id: 'ocean-depths',
  name: '🌊 Ocean Depths',
  description: 'Mysterious deep sea atmosphere with bioluminescent glow',
  preview: 'linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #0f2b47 100%)',
  isDark: true,

  colors: {
    bg: {
      primary: '#0a1628',           // Abyssal blue
      secondary: '#0d2137',         // Deep ocean
      tertiary: '#0f2b47',          // Twilight zone
      accent: '#00bcd4',            // Bioluminescent cyan
      overlay: 'rgba(10, 22, 40, 0.96)',
    },

    text: {
      primary: '#e0f4f8',           // Sea foam white
      secondary: '#8cb4c9',         // Pale blue
      accent: '#4dd0e1',            // Bright cyan
      inverse: '#0a1628',
      muted: '#5a8599',
    },

    border: {
      default: '#1a3a52',
      accent: '#00bcd4',
      subtle: '#0d2137',
    },

    success: '#26a69a',             // Teal coral
    warning: '#ffb74d',             // Amber fish
    error: '#ef5350',               // Crimson anemone
    info: '#29b6f6',                // Light blue

    team1: {
      primary: '#e65100',           // Orange coral
      secondary: '#ff6d00',
      text: '#ffffff',
    },
    team2: {
      primary: '#0288d1',           // Ocean blue
      secondary: '#03a9f4',
      text: '#ffffff',
    },

    suits: {
      red: '#ef5350',
      brown: '#8d6e63',
      green: '#26a69a',
      blue: '#29b6f6',
    },

    glow: '#4dd0e1',
    highlight: '#00bcd4',
    shadow: '#000000',
  },

  typography: {
    fontFamily: {
      display: '"Montserrat", "Segoe UI", sans-serif',
      body: '"Open Sans", "Roboto", sans-serif',
      mono: '"Fira Code", monospace',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      bold: 600,
      black: 700,
    },
  },

  effects: {
    radius: {
      sm: '6px',
      md: '10px',
      lg: '16px',
      xl: '24px',
      full: '9999px',
    },

    shadows: {
      sm: '0 2px 8px rgba(0, 188, 212, 0.15)',
      md: '0 4px 16px rgba(0, 188, 212, 0.2)',
      lg: '0 8px 32px rgba(0, 188, 212, 0.25), 0 0 60px rgba(0, 188, 212, 0.1)',
      glow: '0 0 30px rgba(77, 208, 225, 0.4), 0 0 60px rgba(0, 188, 212, 0.2)',
      inset: 'inset 0 2px 8px rgba(0, 0, 0, 0.4)',
    },

    animations: {
      duration: {
        fast: '180ms',
        normal: '350ms',
        slow: '600ms',
      },
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },

    specialEffects: {
      scanlines: false,
      noise: true,
      glow: true,
      pixelated: false,
      gradientOverlay: true,
    },
  },

  components: {
    button: {
      borderWidth: '2px',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
    },
    card: {
      borderWidth: '2px',
      bgColor: '#e0f7fa',
      cornerRadius: '10px',
    },
    modal: {
      backdropBlur: '12px',
      borderWidth: '2px',
    },
    input: {
      borderWidth: '2px',
      focusRingWidth: '3px',
    },
  },

  cssVariables: {
    '--skin-wave-intensity': '1',
    '--skin-bioluminescent-glow': '1.3',
  },
};

// ============================================================================
// FOREST ENCHANTED SKIN (Sprint 21)
// Dark green mystical forest theme with magical accents
// ============================================================================

export const forestEnchantedSkin: Skin = {
  id: 'forest-enchanted',
  name: '🌲 Forest Enchanted',
  description: 'Mystical woodland atmosphere with ethereal green magic',
  preview: 'linear-gradient(135deg, #0f1f16 0%, #1a3325 50%, #234430 100%)',
  isDark: true,

  colors: {
    bg: {
      primary: '#0f1f16',           // Deep forest floor
      secondary: '#1a3325',         // Shadowy undergrowth
      tertiary: '#234430',          // Mossy stone
      accent: '#4caf50',            // Magical green
      overlay: 'rgba(15, 31, 22, 0.96)',
    },

    text: {
      primary: '#e8f5e9',           // Moonlit leaf
      secondary: '#a5d6a7',         // Pale moss
      accent: '#69f0ae',            // Fairy light
      inverse: '#0f1f16',
      muted: '#5d8a66',
    },

    border: {
      default: '#2e5a3a',
      accent: '#4caf50',
      subtle: '#1a3325',
    },

    success: '#66bb6a',             // Fresh leaf
    warning: '#ffa726',             // Amber resin
    error: '#ef5350',               // Red berry
    info: '#42a5f5',                // Sky through canopy

    team1: {
      primary: '#bf360c',           // Autumn ember
      secondary: '#e64a19',
      text: '#ffffff',
    },
    team2: {
      primary: '#1565c0',           // Deep stream
      secondary: '#1e88e5',
      text: '#ffffff',
    },

    suits: {
      red: '#d32f2f',
      brown: '#795548',
      green: '#388e3c',
      blue: '#1976d2',
    },

    glow: '#69f0ae',
    highlight: '#4caf50',
    shadow: '#000000',
  },

  typography: {
    fontFamily: {
      display: '"Cinzel Decorative", "Georgia", serif',
      body: '"Lora", "Georgia", serif',
      mono: '"Fira Code", monospace',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      bold: 700,
      black: 900,
    },
  },

  effects: {
    radius: {
      sm: '4px',
      md: '8px',
      lg: '14px',
      xl: '22px',
      full: '9999px',
    },

    shadows: {
      sm: '0 2px 8px rgba(76, 175, 80, 0.12)',
      md: '0 4px 16px rgba(76, 175, 80, 0.18)',
      lg: '0 8px 32px rgba(76, 175, 80, 0.22), 0 0 60px rgba(105, 240, 174, 0.08)',
      glow: '0 0 25px rgba(105, 240, 174, 0.35), 0 0 50px rgba(76, 175, 80, 0.15)',
      inset: 'inset 0 2px 8px rgba(0, 0, 0, 0.45)',
    },

    animations: {
      duration: {
        fast: '150ms',
        normal: '320ms',
        slow: '550ms',
      },
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },

    specialEffects: {
      scanlines: false,
      noise: true,
      glow: true,
      pixelated: false,
      gradientOverlay: true,
    },
  },

  components: {
    button: {
      borderWidth: '2px',
      textTransform: 'none',
      letterSpacing: '0.05em',
    },
    card: {
      borderWidth: '2px',
      bgColor: '#e8f5e9',
      cornerRadius: '10px',
    },
    modal: {
      backdropBlur: '14px',
      borderWidth: '2px',
    },
    input: {
      borderWidth: '2px',
      focusRingWidth: '3px',
    },
  },

  cssVariables: {
    '--skin-noise-opacity': '0.035',
    '--skin-fairy-dust': '1',
    '--skin-glow-intensity': '1.1',
  },
};

// ============================================================================
// SKIN REGISTRY
// ============================================================================

export const skins: Record<SkinId, Skin> = {
  'midnight-alchemy': midnightAlchemySkin,
  'tavern-noir': tavernNoirSkin,
  'luxury-casino': luxuryCasinoSkin,
  'modern-minimal': modernMinimalSkin,
  'modern-minimal-dark': modernMinimalDarkSkin,
  'cyberpunk-neon': cyberpunkNeonSkin,
  'classic-parchment': classicParchmentSkin,
  // Sprint 21: New skins
  'sakura-spring': sakuraSpringSkin,
  'ocean-depths': oceanDepthsSkin,
  'forest-enchanted': forestEnchantedSkin,
};

export const skinList: Skin[] = Object.values(skins);

export const defaultSkinId: SkinId = 'midnight-alchemy';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get a skin by ID, with fallback to default
 */
export function getSkin(id: SkinId | string): Skin {
  return skins[id as SkinId] || skins[defaultSkinId];
}

/**
 * Generate CSS variables from a skin
 */
export function skinToCssVariables(skin: Skin): Record<string, string> {
  return {
    // Background colors
    '--color-bg-primary': skin.colors.bg.primary,
    '--color-bg-secondary': skin.colors.bg.secondary,
    '--color-bg-tertiary': skin.colors.bg.tertiary,
    '--color-bg-accent': skin.colors.bg.accent,
    '--color-bg-overlay': skin.colors.bg.overlay,

    // Text colors
    '--color-text-primary': skin.colors.text.primary,
    '--color-text-secondary': skin.colors.text.secondary,
    '--color-text-accent': skin.colors.text.accent,
    '--color-text-inverse': skin.colors.text.inverse,
    '--color-text-muted': skin.colors.text.muted,

    // Border colors
    '--color-border-default': skin.colors.border.default,
    '--color-border-accent': skin.colors.border.accent,
    '--color-border-subtle': skin.colors.border.subtle,

    // Semantic colors
    '--color-success': skin.colors.success,
    '--color-warning': skin.colors.warning,
    '--color-error': skin.colors.error,
    '--color-info': skin.colors.info,

    // Team colors
    '--color-team1-primary': skin.colors.team1.primary,
    '--color-team1-secondary': skin.colors.team1.secondary,
    '--color-team1-text': skin.colors.team1.text,
    '--color-team2-primary': skin.colors.team2.primary,
    '--color-team2-secondary': skin.colors.team2.secondary,
    '--color-team2-text': skin.colors.team2.text,

    // Suit colors
    '--color-suit-red': skin.colors.suits.red,
    '--color-suit-brown': skin.colors.suits.brown,
    '--color-suit-green': skin.colors.suits.green,
    '--color-suit-blue': skin.colors.suits.blue,

    // Effects
    '--color-glow': skin.colors.glow,
    '--color-highlight': skin.colors.highlight,
    '--color-shadow': skin.colors.shadow,

    // Typography
    '--font-display': skin.typography.fontFamily.display,
    '--font-body': skin.typography.fontFamily.body,
    '--font-mono': skin.typography.fontFamily.mono,

    // Radius
    '--radius-sm': skin.effects.radius.sm,
    '--radius-md': skin.effects.radius.md,
    '--radius-lg': skin.effects.radius.lg,
    '--radius-xl': skin.effects.radius.xl,
    '--radius-full': skin.effects.radius.full,

    // Shadows
    '--shadow-sm': skin.effects.shadows.sm,
    '--shadow-md': skin.effects.shadows.md,
    '--shadow-lg': skin.effects.shadows.lg,
    '--shadow-glow': skin.effects.shadows.glow,
    '--shadow-inset': skin.effects.shadows.inset,

    // Animation
    '--duration-fast': skin.effects.animations.duration.fast,
    '--duration-normal': skin.effects.animations.duration.normal,
    '--duration-slow': skin.effects.animations.duration.slow,
    '--easing': skin.effects.animations.easing,

    // Component-specific
    '--button-border-width': skin.components.button.borderWidth,
    '--button-text-transform': skin.components.button.textTransform,
    '--button-letter-spacing': skin.components.button.letterSpacing,
    '--card-border-width': skin.components.card.borderWidth,
    '--card-bg-color': skin.components.card.bgColor,
    '--card-corner-radius': skin.components.card.cornerRadius,
    '--modal-backdrop-blur': skin.components.modal.backdropBlur,
    '--modal-border-width': skin.components.modal.borderWidth,
    '--input-border-width': skin.components.input.borderWidth,
    '--input-focus-ring-width': skin.components.input.focusRingWidth,

    // Custom skin variables
    ...skin.cssVariables,
  };
}

/**
 * Apply a skin to the document
 */
export function applySkinToDocument(skin: Skin): void {
  const root = document.documentElement;
  const cssVars = skinToCssVariables(skin);

  // Set all CSS variables
  Object.entries(cssVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  // Set dark/light mode class
  if (skin.isDark) {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }

  // Set skin ID as data attribute
  root.setAttribute('data-skin', skin.id);
}

// ============================================================================
// SKIN PRICING CONFIGURATION
// Prices in cosmetic currency. Users can buy skins even if below required level.
// ============================================================================

export interface SkinPricingInfo {
  /** Price in cosmetic currency (0 = free) */
  price: number;
  /** Suggested level (for display, not enforced when buying) */
  suggestedLevel: number;
}

/**
 * UI Skin pricing map
 * - Free skins (level 0): price = 0
 * - Premium skins: purchasable with cosmetic currency
 */
export const skinPricing: Record<SkinId, SkinPricingInfo> = {
  'midnight-alchemy': { price: 0, suggestedLevel: 0 },       // Free (default dark)
  'classic-parchment': { price: 0, suggestedLevel: 0 },      // Free (default light)
  'modern-minimal': { price: 100, suggestedLevel: 3 },       // Cheap
  'tavern-noir': { price: 250, suggestedLevel: 5 },          // Medium
  'modern-minimal-dark': { price: 400, suggestedLevel: 8 },  // Medium
  'luxury-casino': { price: 750, suggestedLevel: 12 },       // Premium
  'cyberpunk-neon': { price: 1000, suggestedLevel: 15 },     // Most expensive
  // Sprint 21: New skins
  'sakura-spring': { price: 300, suggestedLevel: 6 },        // Medium-low
  'ocean-depths': { price: 600, suggestedLevel: 10 },        // Medium-high
  'forest-enchanted': { price: 850, suggestedLevel: 14 },    // Premium
};

/**
 * Get pricing info for a UI skin
 */
export function getSkinPricing(skinId: SkinId): SkinPricingInfo {
  return skinPricing[skinId] || { price: 0, suggestedLevel: 0 };
}

/**
 * Get upcoming skins that will be available at higher levels
 * Returns skins that have suggestedLevel > currentLevel, sorted by level
 */
export function getUpcomingSkins(currentLevel: number, limit: number = 3): Array<{
  skin: Skin;
  pricing: SkinPricingInfo;
  levelsToGo: number;
}> {
  return Object.entries(skinPricing)
    .filter(([, pricing]) => pricing.suggestedLevel > currentLevel)
    .sort((a, b) => a[1].suggestedLevel - b[1].suggestedLevel)
    .slice(0, limit)
    .map(([id, pricing]) => ({
      skin: skins[id as SkinId],
      pricing,
      levelsToGo: pricing.suggestedLevel - currentLevel,
    }));
}

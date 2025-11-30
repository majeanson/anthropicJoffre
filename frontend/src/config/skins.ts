/**
 * Skin System Configuration
 *
 * A comprehensive theming system that allows users to choose from
 * multiple visual styles. Each skin defines colors, typography,
 * effects, and component-specific styling.
 *
 * Default skin: Retro Gaming (neon arcade aesthetic)
 */

// ============================================================================
// SKIN TYPE DEFINITIONS
// ============================================================================

export type SkinId =
  | 'retro-gaming'
  | 'luxury-casino'
  | 'modern-minimal'
  | 'cyberpunk-neon'
  | 'classic-historic';

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
}

// ============================================================================
// RETRO GAMING SKIN (Default)
// Neon arcade aesthetic with pixel-perfect vibes
// ============================================================================

export const retroGamingSkin: Skin = {
  id: 'retro-gaming',
  name: 'Retro Gaming',
  description: 'Neon arcade aesthetic with pixel-perfect vibes and CRT glow effects',
  preview: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
  isDark: true,

  colors: {
    bg: {
      primary: '#0f0f23',           // Deep space blue-black
      secondary: '#1a1a2e',         // Slightly lighter
      tertiary: '#16213e',          // Card backgrounds
      accent: '#e94560',            // Hot pink accent
      overlay: 'rgba(15, 15, 35, 0.95)',
    },

    text: {
      primary: '#edf2f4',           // Bright white
      secondary: '#8d99ae',         // Cool gray
      accent: '#00fff5',            // Cyan neon
      inverse: '#0f0f23',           // Dark for light backgrounds
      muted: '#4a5568',             // Very subdued
    },

    border: {
      default: '#2d3748',           // Subtle border
      accent: '#e94560',            // Hot pink
      subtle: '#1a202c',            // Nearly invisible
    },

    success: '#00ff88',             // Neon green
    warning: '#ffbe0b',             // Arcade yellow
    error: '#ff006e',               // Hot pink-red
    info: '#00fff5',                // Cyan

    team1: {
      primary: '#ff6b35',           // Orange neon
      secondary: '#f7931a',
      text: '#ffffff',
    },
    team2: {
      primary: '#9d4edd',           // Purple neon
      secondary: '#7b2cbf',
      text: '#ffffff',
    },

    suits: {
      red: '#ff2a6d',               // Neon red
      brown: '#d4a373',             // Warm brown (less neon)
      green: '#05ffa1',             // Neon green
      blue: '#00d4ff',              // Neon blue
    },

    glow: '#00fff5',
    highlight: '#e94560',
    shadow: '#000000',
  },

  typography: {
    fontFamily: {
      display: '"Press Start 2P", "VT323", monospace',
      body: '"VT323", "Roboto Mono", monospace',
      mono: '"Roboto Mono", "Fira Code", monospace',
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
      sm: '2px',                    // Pixel-perfect small
      md: '4px',                    // Subtle rounding
      lg: '8px',                    // Cards, buttons
      xl: '12px',                   // Modals
      full: '9999px',               // Pills
    },

    shadows: {
      sm: '0 2px 4px rgba(0, 0, 0, 0.5)',
      md: '0 4px 12px rgba(0, 0, 0, 0.6)',
      lg: '0 8px 24px rgba(0, 0, 0, 0.7)',
      glow: '0 0 20px rgba(0, 255, 245, 0.4), 0 0 40px rgba(0, 255, 245, 0.2)',
      inset: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)',
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
      scanlines: true,
      noise: true,
      glow: true,
      pixelated: false,
      gradientOverlay: true,
    },
  },

  components: {
    button: {
      borderWidth: '3px',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
    },
    card: {
      borderWidth: '4px',
      bgColor: '#1a1a2e',
      cornerRadius: '8px',
    },
    modal: {
      backdropBlur: '8px',
      borderWidth: '2px',
    },
    input: {
      borderWidth: '2px',
      focusRingWidth: '3px',
    },
  },

  cssVariables: {
    '--skin-scanline-opacity': '0.03',
    '--skin-noise-opacity': '0.02',
    '--skin-glow-intensity': '1',
    '--skin-crt-curve': '0',
  },
};

// ============================================================================
// LUXURY CASINO SKIN
// Sophisticated, dark with gold accents
// ============================================================================

export const luxuryCasinoSkin: Skin = {
  id: 'luxury-casino',
  name: 'Luxury Casino',
  description: 'Sophisticated elegance with gold accents and felt textures',
  preview: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
  isDark: true,

  colors: {
    bg: {
      primary: '#0d0d0d',           // Near black
      secondary: '#1a1a1a',         // Rich black
      tertiary: '#2d2d2d',          // Card backgrounds
      accent: '#d4af37',            // Gold
      overlay: 'rgba(13, 13, 13, 0.95)',
    },

    text: {
      primary: '#f5f5f5',           // Off-white
      secondary: '#a0a0a0',         // Silver gray
      accent: '#d4af37',            // Gold
      inverse: '#0d0d0d',           // Dark
      muted: '#666666',             // Subdued
    },

    border: {
      default: '#333333',
      accent: '#d4af37',
      subtle: '#222222',
    },

    success: '#2ecc71',
    warning: '#f39c12',
    error: '#c0392b',
    info: '#3498db',

    team1: {
      primary: '#c0392b',           // Deep red
      secondary: '#e74c3c',
      text: '#ffffff',
    },
    team2: {
      primary: '#2980b9',           // Royal blue
      secondary: '#3498db',
      text: '#ffffff',
    },

    suits: {
      red: '#c0392b',
      brown: '#8b4513',
      green: '#27ae60',
      blue: '#2980b9',
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
      xl: '16px',
      full: '9999px',
    },

    shadows: {
      sm: '0 2px 4px rgba(0, 0, 0, 0.3)',
      md: '0 4px 12px rgba(0, 0, 0, 0.4)',
      lg: '0 8px 24px rgba(0, 0, 0, 0.5)',
      glow: '0 0 20px rgba(212, 175, 55, 0.3)',
      inset: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
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
      noise: true,           // Felt texture
      glow: true,
      pixelated: false,
      gradientOverlay: false,
    },
  },

  components: {
    button: {
      borderWidth: '2px',
      textTransform: 'uppercase',
      letterSpacing: '0.15em',
    },
    card: {
      borderWidth: '3px',
      bgColor: '#1a1a1a',
      cornerRadius: '12px',
    },
    modal: {
      backdropBlur: '12px',
      borderWidth: '1px',
    },
    input: {
      borderWidth: '1px',
      focusRingWidth: '2px',
    },
  },

  cssVariables: {
    '--skin-felt-texture': 'url("/textures/felt.png")',
    '--skin-gold-shimmer': '1',
  },
};

// ============================================================================
// MODERN MINIMAL SKIN
// Clean, sharp, lots of whitespace
// ============================================================================

export const modernMinimalSkin: Skin = {
  id: 'modern-minimal',
  name: 'Modern Minimal',
  description: 'Clean lines, generous whitespace, and subtle elegance',
  preview: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #e9ecef 100%)',
  isDark: false,

  colors: {
    bg: {
      primary: '#ffffff',
      secondary: '#f8f9fa',
      tertiary: '#e9ecef',
      accent: '#212529',
      overlay: 'rgba(255, 255, 255, 0.98)',
    },

    text: {
      primary: '#212529',
      secondary: '#6c757d',
      accent: '#0066cc',
      inverse: '#ffffff',
      muted: '#adb5bd',
    },

    border: {
      default: '#dee2e6',
      accent: '#212529',
      subtle: '#f1f3f5',
    },

    success: '#198754',
    warning: '#fd7e14',
    error: '#dc3545',
    info: '#0dcaf0',

    team1: {
      primary: '#fd7e14',
      secondary: '#ffc107',
      text: '#212529',
    },
    team2: {
      primary: '#6f42c1',
      secondary: '#9775fa',
      text: '#ffffff',
    },

    suits: {
      red: '#dc3545',
      brown: '#795548',
      green: '#198754',
      blue: '#0d6efd',
    },

    glow: '#0066cc',
    highlight: '#0066cc',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },

  typography: {
    fontFamily: {
      display: '"Inter", "SF Pro Display", -apple-system, sans-serif',
      body: '"Inter", "SF Pro Text", -apple-system, sans-serif',
      mono: '"SF Mono", "Fira Code", monospace',
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
      md: '12px',
      lg: '16px',
      xl: '24px',
      full: '9999px',
    },

    shadows: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px rgba(0, 0, 0, 0.07)',
      lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
      glow: '0 0 0 3px rgba(0, 102, 204, 0.15)',
      inset: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
    },

    animations: {
      duration: {
        fast: '150ms',
        normal: '250ms',
        slow: '350ms',
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
      bgColor: '#ffffff',
      cornerRadius: '12px',
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
// Intense neon on dark, high contrast
// ============================================================================

export const cyberpunkNeonSkin: Skin = {
  id: 'cyberpunk-neon',
  name: 'Cyberpunk Neon',
  description: 'High-contrast neon colors with intense glow effects',
  preview: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #0a1a2e 100%)',
  isDark: true,

  colors: {
    bg: {
      primary: '#0a0a0a',
      secondary: '#121212',
      tertiary: '#1a1a2e',
      accent: '#ff00ff',
      overlay: 'rgba(10, 10, 10, 0.95)',
    },

    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
      accent: '#00ffff',
      inverse: '#0a0a0a',
      muted: '#505050',
    },

    border: {
      default: '#333333',
      accent: '#ff00ff',
      subtle: '#1a1a1a',
    },

    success: '#00ff00',
    warning: '#ffff00',
    error: '#ff0000',
    info: '#00ffff',

    team1: {
      primary: '#ff6600',
      secondary: '#ff9900',
      text: '#000000',
    },
    team2: {
      primary: '#cc00ff',
      secondary: '#9900ff',
      text: '#ffffff',
    },

    suits: {
      red: '#ff0044',
      brown: '#cc6600',
      green: '#00ff44',
      blue: '#0088ff',
    },

    glow: '#00ffff',
    highlight: '#ff00ff',
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
      sm: '0px',                    // Sharp edges
      md: '2px',
      lg: '4px',
      xl: '8px',
      full: '9999px',
    },

    shadows: {
      sm: '0 0 10px rgba(255, 0, 255, 0.3)',
      md: '0 0 20px rgba(255, 0, 255, 0.4)',
      lg: '0 0 40px rgba(255, 0, 255, 0.5)',
      glow: '0 0 30px rgba(0, 255, 255, 0.6), 0 0 60px rgba(0, 255, 255, 0.3)',
      inset: 'inset 0 0 10px rgba(255, 0, 255, 0.2)',
    },

    animations: {
      duration: {
        fast: '100ms',
        normal: '200ms',
        slow: '400ms',
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
      bgColor: '#121212',
      cornerRadius: '4px',
    },
    modal: {
      backdropBlur: '4px',
      borderWidth: '2px',
    },
    input: {
      borderWidth: '2px',
      focusRingWidth: '2px',
    },
  },

  cssVariables: {
    '--skin-scanline-opacity': '0.05',
    '--skin-noise-opacity': '0.03',
    '--skin-glow-intensity': '1.5',
  },
};

// ============================================================================
// CLASSIC HISTORIC SKIN
// Traditional card game aesthetic (original theme updated)
// ============================================================================

export const classicHistoricSkin: Skin = {
  id: 'classic-historic',
  name: 'Classic Historic',
  description: 'Traditional card game aesthetic with parchment and rich wood tones',
  preview: 'linear-gradient(135deg, #F5F1E8 0%, #EBE4D7 50%, #D9C1A1 100%)',
  isDark: false,

  colors: {
    bg: {
      primary: '#F5F1E8',           // Warm parchment
      secondary: '#FDFCFA',         // Light parchment
      tertiary: '#EBE4D7',          // Slightly darker
      accent: '#B82020',            // Deep crimson
      overlay: 'rgba(245, 241, 232, 0.98)',
    },

    text: {
      primary: '#5A3922',           // Dark umber
      secondary: '#85532A',         // Medium brown
      accent: '#B82020',            // Crimson
      inverse: '#FDFCFA',           // Light
      muted: '#A06730',             // Subdued brown
    },

    border: {
      default: '#D9C1A1',           // Warm border
      accent: '#B82020',            // Crimson
      subtle: '#EBE4D7',            // Very subtle
    },

    success: '#357A49',             // Forest green
    warning: '#B8864D',             // Amber
    error: '#B82020',               // Crimson
    info: '#1F5FA4',                // Sapphire

    team1: {
      primary: '#B82020',           // Crimson
      secondary: '#D63939',
      text: '#ffffff',
    },
    team2: {
      primary: '#1F5FA4',           // Sapphire
      secondary: '#2E79C2',
      text: '#ffffff',
    },

    suits: {
      red: '#B82020',
      brown: '#6D4427',
      green: '#357A49',
      blue: '#1F5FA4',
    },

    glow: '#D4AF37',                // Gold glow
    highlight: '#B82020',
    shadow: 'rgba(90, 57, 34, 0.2)',
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
      sm: '0 2px 4px rgba(90, 57, 34, 0.1)',
      md: '0 4px 8px rgba(90, 57, 34, 0.15)',
      lg: '0 8px 16px rgba(90, 57, 34, 0.2)',
      glow: '0 0 20px rgba(212, 175, 55, 0.2)',
      inset: 'inset 0 2px 4px rgba(90, 57, 34, 0.1)',
    },

    animations: {
      duration: {
        fast: '200ms',
        normal: '350ms',
        slow: '500ms',
      },
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },

    specialEffects: {
      scanlines: false,
      noise: true,           // Paper texture
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
      borderWidth: '3px',
      bgColor: '#d6ccba',
      cornerRadius: '8px',
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
    '--skin-paper-texture': 'url("/textures/parchment.png")',
  },
};

// ============================================================================
// SKIN REGISTRY
// ============================================================================

export const skins: Record<SkinId, Skin> = {
  'retro-gaming': retroGamingSkin,
  'luxury-casino': luxuryCasinoSkin,
  'modern-minimal': modernMinimalSkin,
  'cyberpunk-neon': cyberpunkNeonSkin,
  'classic-historic': classicHistoricSkin,
};

export const skinList: Skin[] = Object.values(skins);

export const defaultSkinId: SkinId = 'retro-gaming';

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

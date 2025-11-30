/**
 * Skin Context
 *
 * Provides skin/theme management across the application.
 * Replaces the simpler ThemeContext with full skin system support.
 *
 * Usage:
 * ```tsx
 * const { skin, setSkin, skinId } = useSkin();
 *
 * // Change skin
 * setSkin('luxury-casino');
 *
 * // Access skin values
 * <div style={{ color: skin.colors.text.primary }}>
 * ```
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useMemo,
} from 'react';
import {
  Skin,
  SkinId,
  getSkin,
  applySkinToDocument,
  defaultSkinId,
  skinList,
} from '../config/skins';

// ============================================================================
// CONTEXT TYPES
// ============================================================================

interface SkinContextValue {
  /** Current active skin */
  skin: Skin;

  /** Current skin ID */
  skinId: SkinId;

  /** Change the active skin */
  setSkin: (id: SkinId) => void;

  /** List of all available skins */
  availableSkins: Skin[];

  /** Whether the current skin is dark mode */
  isDarkMode: boolean;

  /** Toggle between light and dark skins */
  toggleDarkMode: () => void;
}

const SkinContext = createContext<SkinContextValue | undefined>(undefined);

// ============================================================================
// STORAGE KEY
// ============================================================================

const SKIN_STORAGE_KEY = 'jaffre-skin';

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface SkinProviderProps {
  children: ReactNode;
  /** Override default skin (useful for testing) */
  defaultSkin?: SkinId;
}

export function SkinProvider({ children, defaultSkin }: SkinProviderProps) {
  // Initialize skin from localStorage or default
  const [skinId, setSkinId] = useState<SkinId>(() => {
    if (typeof window === 'undefined') {
      return defaultSkin || defaultSkinId;
    }

    const saved = localStorage.getItem(SKIN_STORAGE_KEY);
    if (saved && getSkin(saved).id === saved) {
      return saved as SkinId;
    }

    return defaultSkin || defaultSkinId;
  });

  // Get the full skin object
  const skin = useMemo(() => getSkin(skinId), [skinId]);

  // Apply skin to document when it changes
  useEffect(() => {
    applySkinToDocument(skin);
    localStorage.setItem(SKIN_STORAGE_KEY, skinId);

    // Also update the old theme storage for backward compatibility
    localStorage.setItem('theme', skin.isDark ? 'dark' : 'historic');
  }, [skin, skinId]);

  // Change skin handler
  const setSkin = useCallback((id: SkinId) => {
    setSkinId(id);
  }, []);

  // Toggle between dark and light skins
  const toggleDarkMode = useCallback(() => {
    // Find a skin with opposite dark mode setting
    const currentIsDark = skin.isDark;
    const oppositeSkin = skinList.find(s => s.isDark !== currentIsDark);
    if (oppositeSkin) {
      setSkinId(oppositeSkin.id);
    }
  }, [skin.isDark]);

  // Context value
  const value = useMemo<SkinContextValue>(
    () => ({
      skin,
      skinId,
      setSkin,
      availableSkins: skinList,
      isDarkMode: skin.isDark,
      toggleDarkMode,
    }),
    [skin, skinId, setSkin, toggleDarkMode]
  );

  return (
    <SkinContext.Provider value={value}>
      {children}
    </SkinContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Access the skin context
 */
export function useSkin(): SkinContextValue {
  const context = useContext(SkinContext);

  if (context === undefined) {
    throw new Error('useSkin must be used within a SkinProvider');
  }

  return context;
}

// ============================================================================
// COMPATIBILITY LAYER
// Keep useTheme working for backward compatibility
// ============================================================================

interface ThemeContextType {
  theme: 'historic' | 'dark';
  setTheme: (theme: 'historic' | 'dark') => void;
  themeConfig: {
    name: string;
    colors: {
      background: string;
      surface: string;
      primary: string;
      secondary: string;
      accent: string;
      text: { primary: string; secondary: string; inverse: string };
      border: string;
      team1: string;
      team2: string;
    };
  };
}

/**
 * Legacy theme hook - maps to new skin system
 * @deprecated Use useSkin() instead
 */
export function useTheme(): ThemeContextType {
  const { skin, setSkin, isDarkMode } = useSkin();

  const setTheme = useCallback(
    (theme: 'historic' | 'dark') => {
      if (theme === 'dark') {
        setSkin('tavern-noir'); // Default dark skin
      } else {
        setSkin('classic-parchment'); // Light historic skin
      }
    },
    [setSkin]
  );

  return {
    theme: isDarkMode ? 'dark' : 'historic',
    setTheme,
    themeConfig: {
      name: skin.name,
      colors: {
        background: skin.colors.bg.primary,
        surface: skin.colors.bg.secondary,
        primary: skin.colors.bg.accent,
        secondary: skin.colors.team2.primary,
        accent: skin.colors.text.accent,
        text: {
          primary: skin.colors.text.primary,
          secondary: skin.colors.text.secondary,
          inverse: skin.colors.text.inverse,
        },
        border: skin.colors.border.default,
        team1: skin.colors.team1.primary,
        team2: skin.colors.team2.primary,
      },
    },
  };
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Get skin-aware CSS classes for common patterns
 */
export function useSkinClasses() {
  const { skin } = useSkin();

  return useMemo(
    () => ({
      // Background classes
      bgPrimary: `bg-[var(--color-bg-primary)]`,
      bgSecondary: `bg-[var(--color-bg-secondary)]`,
      bgTertiary: `bg-[var(--color-bg-tertiary)]`,
      bgAccent: `bg-[var(--color-bg-accent)]`,

      // Text classes
      textPrimary: `text-[var(--color-text-primary)]`,
      textSecondary: `text-[var(--color-text-secondary)]`,
      textAccent: `text-[var(--color-text-accent)]`,
      textMuted: `text-[var(--color-text-muted)]`,

      // Border classes
      borderDefault: `border-[var(--color-border-default)]`,
      borderAccent: `border-[var(--color-border-accent)]`,
      borderSubtle: `border-[var(--color-border-subtle)]`,

      // Team classes
      team1Bg: `bg-[var(--color-team1-primary)]`,
      team1Text: `text-[var(--color-team1-text)]`,
      team2Bg: `bg-[var(--color-team2-primary)]`,
      team2Text: `text-[var(--color-team2-text)]`,

      // Semantic classes
      successText: `text-[var(--color-success)]`,
      warningText: `text-[var(--color-warning)]`,
      errorText: `text-[var(--color-error)]`,
      infoText: `text-[var(--color-info)]`,

      // Effects
      glowShadow: `shadow-[var(--shadow-glow)]`,

      // Card-specific
      cardBg: `bg-[var(--card-bg-color)]`,
      cardRadius: `rounded-[var(--card-corner-radius)]`,
      cardBorder: `border-[var(--card-border-width)]`,

      // Special effects flag
      hasSpecialEffects: skin.effects.specialEffects,
    }),
    [skin]
  );
}

/**
 * Get suit color for a card color
 */
export function useSuitColor(suitColor: 'red' | 'brown' | 'green' | 'blue'): string {
  const { skin } = useSkin();
  return skin.colors.suits[suitColor];
}

/**
 * Get team colors
 */
export function useTeamColors(teamId: 1 | 2) {
  const { skin } = useSkin();
  return teamId === 1 ? skin.colors.team1 : skin.colors.team2;
}

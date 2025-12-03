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
  useRef,
} from 'react';
import {
  Skin,
  SkinId,
  getSkin,
  applySkinToDocument,
  defaultSkinId,
  skinList,
} from '../config/skins';
import {
  CardSkin,
  CardSkinId,
  getCardSkin,
  defaultCardSkinId,
  cardSkinList,
} from '../config/cardSkins';
import { API_ENDPOINTS } from '../config/constants';
import { fetchWithCsrf } from '../utils/csrf';

// Re-export SkinId and CardSkinId for convenience
export type { SkinId, CardSkinId };

// ============================================================================
// CONTEXT TYPES
// ============================================================================

/** Skin requirement from backend */
interface SkinRequirement {
  skinId: string;
  requiredLevel: number;
  unlockDescription: string;
}

// Note: CardSkinRequirement is defined in cardSkins.ts and uses local level checking

/** User preferences from backend */
interface UserPreferencesResponse {
  skin_id?: string;
  card_skin_id?: string;
}

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

  // Sprint 20: Level-based skin unlocks
  /** Current player level */
  playerLevel: number;

  /** Set player level (called by App.tsx) */
  setPlayerLevel: (level: number) => void;

  /** List of unlocked skin IDs */
  unlockedSkinIds: string[];

  /** Set unlocked skin IDs (called by App.tsx) */
  setUnlockedSkinIds: (ids: string[]) => void;

  /** Skin requirements from backend */
  skinRequirements: SkinRequirement[];

  /** Set skin requirements (called by App.tsx) */
  setSkinRequirements: (requirements: SkinRequirement[]) => void;

  /** Check if a skin is unlocked for the player */
  isSkinUnlocked: (skinId: SkinId) => boolean;

  /** Get required level for a skin */
  getRequiredLevel: (skinId: SkinId) => number;

  // Card Skin System
  /** Current card skin */
  cardSkin: CardSkin;

  /** Current card skin ID */
  cardSkinId: CardSkinId;

  /** Change the active card skin */
  setCardSkin: (id: CardSkinId) => void;

  /** List of all available card skins */
  availableCardSkins: CardSkin[];

  /** Check if a card skin is unlocked for the player */
  isCardSkinUnlocked: (cardSkinId: CardSkinId) => boolean;

  /** Get required level for a card skin */
  getCardSkinRequiredLevel: (cardSkinId: CardSkinId) => number;

  /** Load skin preferences from backend (called when user logs in) */
  loadPreferencesFromBackend: (accessToken: string) => Promise<void>;

  /** Whether preferences have been loaded from backend */
  isPreferencesLoaded: boolean;
}

const SkinContext = createContext<SkinContextValue | undefined>(undefined);

// ============================================================================
// STORAGE KEY
// ============================================================================

const SKIN_STORAGE_KEY = 'jaffre-skin';
const CARD_SKIN_STORAGE_KEY = 'jaffre-card-skin';

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

  // Sprint 20: Player level and skin unlock state
  const [playerLevel, setPlayerLevel] = useState<number>(1);
  const [unlockedSkinIds, setUnlockedSkinIds] = useState<string[]>([]);
  const [skinRequirements, setSkinRequirements] = useState<SkinRequirement[]>([]);

  // Card Skin state - initialize from localStorage
  const [cardSkinId, setCardSkinId] = useState<CardSkinId>(() => {
    if (typeof window === 'undefined') {
      return defaultCardSkinId;
    }
    const saved = localStorage.getItem(CARD_SKIN_STORAGE_KEY);
    if (saved && getCardSkin(saved as CardSkinId).id === saved) {
      return saved as CardSkinId;
    }
    return defaultCardSkinId;
  });

  // Track if preferences have been loaded from backend
  const [isPreferencesLoaded, setIsPreferencesLoaded] = useState(false);

  // Track if we're currently saving to backend (debounce)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accessTokenRef = useRef<string | null>(null);

  // Get the full skin object
  const skin = useMemo(() => getSkin(skinId), [skinId]);

  // Get the full card skin object
  const cardSkin = useMemo(() => getCardSkin(cardSkinId), [cardSkinId]);

  // Apply skin to document when it changes
  useEffect(() => {
    applySkinToDocument(skin);
    localStorage.setItem(SKIN_STORAGE_KEY, skinId);

    // Also update the old theme storage for backward compatibility
    localStorage.setItem('theme', skin.isDark ? 'dark' : 'historic');
  }, [skin, skinId]);

  // Persist card skin to localStorage
  useEffect(() => {
    localStorage.setItem(CARD_SKIN_STORAGE_KEY, cardSkinId);
  }, [cardSkinId]);

  // Save preferences to backend (debounced)
  const savePreferencesToBackend = useCallback(async (newSkinId: string, newCardSkinId: string) => {
    const token = accessTokenRef.current;
    if (!token) return;

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce saves to backend (500ms)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetchWithCsrf(API_ENDPOINTS.userPreferences(), {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            skin_id: newSkinId,
            card_skin_id: newCardSkinId,
          }),
        });
        console.debug('[SkinContext] Preferences saved to backend');
      } catch (error) {
        console.error('[SkinContext] Failed to save preferences to backend:', error);
      }
    }, 500);
  }, []);

  // Load preferences from backend (called when user logs in)
  const loadPreferencesFromBackend = useCallback(async (accessToken: string) => {
    accessTokenRef.current = accessToken;

    try {
      const response = await fetch(API_ENDPOINTS.userPreferences(), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        console.warn('[SkinContext] Failed to load preferences from backend');
        setIsPreferencesLoaded(true);
        return;
      }

      const data = await response.json();
      const preferences: UserPreferencesResponse = data.preferences || {};

      // Apply skin from backend if valid
      if (preferences.skin_id && getSkin(preferences.skin_id).id === preferences.skin_id) {
        setSkinId(preferences.skin_id as SkinId);
        localStorage.setItem(SKIN_STORAGE_KEY, preferences.skin_id);
      }

      // Apply card skin from backend if valid
      if (preferences.card_skin_id && getCardSkin(preferences.card_skin_id as CardSkinId).id === preferences.card_skin_id) {
        setCardSkinId(preferences.card_skin_id as CardSkinId);
        localStorage.setItem(CARD_SKIN_STORAGE_KEY, preferences.card_skin_id);
      }

      console.debug('[SkinContext] Preferences loaded from backend:', {
        skin_id: preferences.skin_id,
        card_skin_id: preferences.card_skin_id,
      });
    } catch (error) {
      console.error('[SkinContext] Error loading preferences from backend:', error);
    } finally {
      setIsPreferencesLoaded(true);
    }
  }, []);

  // Check if a skin is unlocked for the player
  const isSkinUnlocked = useCallback((checkSkinId: SkinId) => {
    // Check backend unlocked skins first
    if (unlockedSkinIds.includes(checkSkinId)) return true;

    // Check requirements - skins with level 0 are always unlocked
    const requirement = skinRequirements.find(r => r.skinId === checkSkinId);
    if (!requirement) return true; // If no requirement found, assume unlocked
    if (requirement.requiredLevel === 0) return true;

    // Check if player level meets requirement
    return playerLevel >= requirement.requiredLevel;
  }, [unlockedSkinIds, skinRequirements, playerLevel]);

  // Get required level for a skin
  const getRequiredLevel = useCallback((checkSkinId: SkinId) => {
    const requirement = skinRequirements.find(r => r.skinId === checkSkinId);
    return requirement?.requiredLevel || 0;
  }, [skinRequirements]);

  // Check if a card skin is unlocked for the player
  const isCardSkinUnlocked = useCallback((checkCardSkinId: CardSkinId) => {
    const cardSkinData = getCardSkin(checkCardSkinId);
    // Card skins with level 0 are always unlocked (free)
    if (cardSkinData.requiredLevel === 0) return true;
    // Check if player level meets requirement
    return playerLevel >= cardSkinData.requiredLevel;
  }, [playerLevel]);

  // Get required level for a card skin
  const getCardSkinRequiredLevel = useCallback((checkCardSkinId: CardSkinId) => {
    const cardSkinData = getCardSkin(checkCardSkinId);
    return cardSkinData.requiredLevel;
  }, []);

  // Change skin handler - only allow if unlocked
  const setSkin = useCallback((id: SkinId) => {
    if (isSkinUnlocked(id)) {
      setSkinId(id);
      // Save to backend if authenticated
      savePreferencesToBackend(id, cardSkinId);
    } else {
      console.warn(`[SkinContext] Attempted to set locked skin: ${id}`);
    }
  }, [isSkinUnlocked, cardSkinId, savePreferencesToBackend]);

  // Change card skin handler - only allow if unlocked
  const setCardSkin = useCallback((id: CardSkinId) => {
    if (isCardSkinUnlocked(id)) {
      setCardSkinId(id);
      // Save to backend if authenticated
      savePreferencesToBackend(skinId, id);
    } else {
      console.warn(`[SkinContext] Attempted to set locked card skin: ${id}`);
    }
  }, [isCardSkinUnlocked, skinId, savePreferencesToBackend]);

  // Toggle between dark and light skins - only consider unlocked skins
  const toggleDarkMode = useCallback(() => {
    const currentIsDark = skin.isDark;
    // Find an unlocked skin with opposite dark mode setting
    const oppositeSkin = skinList.find(
      s => s.isDark !== currentIsDark && isSkinUnlocked(s.id)
    );
    if (oppositeSkin) {
      setSkinId(oppositeSkin.id);
    }
  }, [skin.isDark, isSkinUnlocked]);

  // Context value
  const value = useMemo<SkinContextValue>(
    () => ({
      skin,
      skinId,
      setSkin,
      availableSkins: skinList,
      isDarkMode: skin.isDark,
      toggleDarkMode,
      // Sprint 20: Level-based unlocks
      playerLevel,
      setPlayerLevel,
      unlockedSkinIds,
      setUnlockedSkinIds,
      skinRequirements,
      setSkinRequirements,
      isSkinUnlocked,
      getRequiredLevel,
      // Card Skin System
      cardSkin,
      cardSkinId,
      setCardSkin,
      availableCardSkins: cardSkinList,
      isCardSkinUnlocked,
      getCardSkinRequiredLevel,
      // Backend sync
      loadPreferencesFromBackend,
      isPreferencesLoaded,
    }),
    [skin, skinId, setSkin, toggleDarkMode, playerLevel, unlockedSkinIds, skinRequirements, isSkinUnlocked, getRequiredLevel, cardSkin, cardSkinId, setCardSkin, isCardSkinUnlocked, getCardSkinRequiredLevel, loadPreferencesFromBackend, isPreferencesLoaded]
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

/**
 * Hook for accessing the current card skin
 */
export function useCardSkin() {
  const { cardSkin, cardSkinId, setCardSkin, availableCardSkins, isCardSkinUnlocked, getCardSkinRequiredLevel, playerLevel } = useSkin();
  return {
    cardSkin,
    cardSkinId,
    setCardSkin,
    availableCardSkins,
    isCardSkinUnlocked,
    getCardSkinRequiredLevel,
    playerLevel,
  };
}

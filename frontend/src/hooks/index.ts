/**
 * Hooks Barrel Export
 *
 * Centralized export for all custom React hooks.
 */

// Animation & UI
export { useCountUp } from './useCountUp';
export { useFocusTrap } from './useFocusTrap';
export { useKeyboardNavigation } from './useKeyboardNavigation';
export { useUIState } from './useUIState';

// Socket & Connection
export { useSocketEvent } from './useSocketEvent';
export { useSocketConnection } from './useSocketConnection';
export { useConnectionQuality } from './useConnectionQuality';

// Game State
export { useGameState } from './useGameState';
export { useGameEventListeners } from './useGameEventListeners';
export { useAutoplay } from './useAutoplay';
export { useBotManagement } from './useBotManagement';

// Data Fetching
export { usePlayerStats, type PlayerStats } from './usePlayerStats';
export {
  useGameHistory,
  type ResultFilter,
  type SortBy,
  type SortOrder,
  type HistoryTab,
} from './useGameHistory';

// Chat & Messaging
export { useChatMessages } from './useChatMessages';
export { useChatNotifications } from './useChatNotifications';
export { useLobbyChat } from './useLobbyChat';

// Notifications & Toast
export { useToast } from './useToast';
export { useNotifications } from './useNotifications';

// Audio
export { useAudioManager } from './useAudioManager';
export { useVoiceChat } from './useVoiceChat';

// Achievements & Progress
export { useAchievementCache } from './useAchievementCache';
export { useTutorialAchievement } from './useTutorialAchievement';

// Debug
export { useDebugMode } from './useDebugMode';

// Common Patterns (individual hooks from useCommonPatterns.ts)
export {
  useDebounce,
  useLocalStorage,
  useSocketListener,
  useModal,
  useFormField,
  useAsync,
  usePrevious,
  useClickOutside,
  useWindowSize,
  useInterval,
  useCountdown,
  useToggle,
  useCopyToClipboard,
  useNetworkStatus,
} from './useCommonPatterns';

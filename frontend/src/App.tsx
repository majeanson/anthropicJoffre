import { useEffect, useState, useCallback, Suspense, lazy } from 'react';
import { Card, PlayerSession, ChatMessage } from './types/game';
import { Lobby } from './components/Lobby';
import GlobalUI from './components/GlobalUI';

// Lazy load heavy components for better initial load performance
// Game phase components (only loaded when needed)
const TeamSelection = lazy(() =>
  import('./components/TeamSelection').then((m) => ({ default: m.TeamSelection }))
);
const BettingPhase = lazy(() =>
  import('./components/BettingPhase').then((m) => ({ default: m.BettingPhase }))
);
const PlayingPhase = lazy(() =>
  import('./components/PlayingPhase').then((m) => ({ default: m.PlayingPhase }))
);
const RoundSummary = lazy(() => import('./components/RoundSummary'));
const RematchVoting = lazy(() =>
  import('./components/RematchVoting').then((m) => ({ default: m.RematchVoting }))
);

// Modals and overlays (only loaded when opened)
const GameReplay = lazy(() =>
  import('./components/GameReplay').then((m) => ({ default: m.GameReplay }))
);
const BotTakeoverModal = lazy(() =>
  import('./components/BotTakeoverModal').then((m) => ({ default: m.BotTakeoverModal }))
);
const SwapConfirmationModal = lazy(() =>
  import('./components/SwapConfirmationModal').then((m) => ({ default: m.SwapConfirmationModal }))
);
const VictoryConfetti = lazy(() =>
  import('./components/VictoryConfetti').then((m) => ({ default: m.VictoryConfetti }))
);

// Debug components (only loaded in debug mode)
const DebugControls = lazy(() => import('./components/DebugControls'));
const DebugPanel = lazy(() =>
  import('./components/DebugPanel').then((m) => ({ default: m.DebugPanel }))
);
// Task 10 Phase 2: Keyboard navigation help
const KeyboardShortcutsModal = lazy(() =>
  import('./components/KeyboardShortcutsModal').then((m) => ({ default: m.KeyboardShortcutsModal }))
);
// Player profile modal (lazy loaded)
const PlayerProfileModal = lazy(() =>
  import('./components/PlayerProfileModal').then((m) => ({ default: m.PlayerProfileModal }))
);
// Beginner mode components
const BeginnerTutorial = lazy(() =>
  import('./components/BeginnerTutorial').then((m) => ({ default: m.BeginnerTutorial }))
);
// How to Play modal (for "Why Register" prompt)
const HowToPlay = lazy(() =>
  import('./components/HowToPlay').then((m) => ({ default: m.HowToPlay }))
);
// Sprint 19: Quest system components (integrated via Stats tab → ProfileProgressModal)
import { Achievement } from './types/achievements'; // Sprint 2 Phase 1
import { FriendRequestNotification } from './types/friends'; // Sprint 2 Phase 2
import { useAuth } from './contexts/AuthContext'; // Sprint 3 Phase 1
import { ModalProvider, useModals } from './contexts/ModalContext'; // Modal state management
import { useNotifications } from './hooks/useNotifications'; // Sprint 3 Phase 5
import { useSettings } from './contexts/SettingsContext'; // Settings including beginner mode
import { preloadCardImages } from './utils/imagePreloader';
import {
  calculateGameXp,
  calculateGameCoins,
  XP_REWARDS,
  CURRENCY_REWARDS,
} from './utils/xpSystem';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ReplayErrorFallback } from './components/fallbacks/ReplayErrorFallback';
// Sprint 5 Phase 2: Custom hooks for state management
import { useSocketConnection, checkValidSession } from './hooks/useSocketConnection';
import { useGameState } from './hooks/useGameState';
import { useChatMessages } from './hooks/useChatMessages';
import { useToast } from './hooks/useToast';
// Sprint 5 Phase 3: Bot management hook
import { useBotManagement } from './hooks/useBotManagement';
// Sprint 6: Connection quality monitoring
import { useConnectionQuality } from './hooks/useConnectionQuality';
// Sprint 3 Refactoring: Audio management
import { useAudioManager } from './hooks/useAudioManager';
// Voice chat hook
import { useVoiceChat } from './hooks/useVoiceChat';
// Sprint 3 Refactoring: Debug mode management
import { useDebugMode } from './hooks/useDebugMode';
// Sprint 3 Refactoring: UI state management
import { useUIState } from './hooks/useUIState';
// Sprint 3 Refactoring: Autoplay management
import { useAutoplay } from './hooks/useAutoplay';
// Sprint 4 Phase 4.4: Game event listeners hook
import { useGameEventListeners } from './hooks/useGameEventListeners';
// Tutorial achievement hook
import { useTutorialAchievement } from './hooks/useTutorialAchievement';
// Sprint 20: Skin context for level-based unlocks
import { useSkin } from './contexts/SkinContext';
// Retention features: XP popup and quest completion toast
import { useXPGainPopup } from './components/XPGainPopup';
import { useQuestCompletedToast } from './components/QuestCompletedToast';

function AppContent() {
  // Sprint 5 Phase 2: Use custom hooks for socket connection and core game state
  const { socket, reconnecting, reconnectAttempt, error, setError } = useSocketConnection();
  const {
    gameState,
    gameId,
    currentTrickWinnerId,
    isSpectator,
    showCatchUpModal,
    setGameState,
    setGameId,
    setShowCatchUpModal,
    setIsSpectator,
  } = useGameState({ socket, onSpawnBots: undefined }); // Bot spawning handled separately below
  const { chatMessages, setChatMessages } = useChatMessages({ socket });
  const { toast, setToast, showToast } = useToast();

  // Sprint 5 Phase 3: Bot management
  const {
    botDifficulty,
    setBotDifficulty,
    botTakeoverModal,
    setBotTakeoverModal,
    botSocketsRef,
    botTimeoutsRef,
    spawnBotsForGame,
    handleAddBot,
    handleQuickPlay,
    handleTakeOverBot,
    cleanupBotSocket,
  } = useBotManagement(socket, gameId, gameState);

  // Sprint 6: Connection quality monitoring
  const connectionStats = useConnectionQuality(socket);

  // Settings context (includes beginner mode)
  const { beginnerMode } = useSettings();

  // Tutorial achievement check (runs when all tutorials completed)
  const { checkTutorialAchievement } = useTutorialAchievement({ socket });

  // Sprint 20: Skin context for level-based skin unlocks
  const { setPlayerLevel, setUnlockedSkinIds, setSkinRequirements, loadPreferencesFromBackend } =
    useSkin();

  // Sprint 3 Refactoring: Audio management hook
  const { soundEnabled, toggleSound, playErrorSound } = useAudioManager({ gameState });

  // Voice chat hook
  const {
    isVoiceEnabled,
    // isConnecting: isVoiceConnecting, // Available for UI loading state
    isMuted: isVoiceMuted,
    participants: voiceParticipants,
    error: voiceError,
    joinVoice,
    leaveVoice,
    toggleMute: toggleVoiceMute,
  } = useVoiceChat({ socket, gameId, isSpectator });

  // Voice toggle handler
  const handleVoiceToggle = useCallback(() => {
    if (isVoiceEnabled) {
      leaveVoice();
    } else {
      joinVoice();
    }
  }, [isVoiceEnabled, joinVoice, leaveVoice]);

  // Sprint 3 Refactoring: Debug mode management hook
  const {
    debugMode,
    debugPanelOpen,
    testPanelOpen,
    debugMenuOpen,
    debugInfoOpen,
    setDebugPanelOpen,
    setTestPanelOpen,
    setDebugMenuOpen,
    setDebugInfoOpen,
  } = useDebugMode();

  // Sprint 3 Refactoring: UI state management hook
  // Sprint 19: Added quest and rewards calendar state
  // Sprint 21: Added direct messages state
  const {
    showBotManagement,
    showFriendsPanel,
    showReplayModal,
    showAchievementsPanel,
    showQuestsPanel,
    showRewardsCalendar,
    showPersonalHub,
    showDirectMessages,
    dmRecipient,
    setShowBotManagement,
    setShowFriendsPanel,
    setShowReplayModal,
    setShowAchievementsPanel,
    setShowQuestsPanel,
    setShowRewardsCalendar,
    setShowPersonalHub,
    setShowDirectMessages,
    setDmRecipient,
  } = useUIState();

  // UI state
  const [hasValidSession, setHasValidSession] = useState<boolean>(false);
  const [autoJoinGameId, setAutoJoinGameId] = useState<string>(''); // URL parameter for auto-join from shared links

  // CRITICAL: Stable player identifier (use player name, NOT socket.id which changes on reconnect)
  const [currentPlayerName, setCurrentPlayerName] = useState<string>(() => {
    return localStorage.getItem('playerName') || '';
  });

  // Sprint 2 Phase 1: Achievement state
  const [achievementNotification, setAchievementNotification] = useState<{
    achievement: Achievement;
    playerName: string;
  } | null>(null);

  // Sprint 2 Phase 2: Friends state
  const [friendRequestNotification, setFriendRequestNotification] =
    useState<FriendRequestNotification | null>(null);
  const [pendingFriendRequestsCount, setPendingFriendRequestsCount] = useState<number>(0);

  // Sprint 16: Swap request state
  const [swapRequest, setSwapRequest] = useState<{
    fromPlayerId: string;
    fromPlayerName: string;
    willChangeTeams: boolean;
  } | null>(null);

  // Sprint 20: Level up celebration state
  const [levelUpData, setLevelUpData] = useState<{
    oldLevel: number;
    newLevel: number;
    newlyUnlockedSkins: string[];
  } | null>(null);

  // Sprint 21: Session XP/Coins tracking
  const [sessionXp, setSessionXp] = useState(0);
  const [sessionCoins, setSessionCoins] = useState(0);

  // Retention features: XP popup and quest completion toast
  const { addGain: addXpGain, XPGainPopupComponent } = useXPGainPopup();
  const { showQuestCompleted, QuestCompletedToastComponent } = useQuestCompletedToast();

  // Task 10 Phase 2: Keyboard shortcuts help modal
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  // Player profile modal state
  const [profilePlayerName, setProfilePlayerName] = useState<string | null>(null);

  // "Why Register" modal state (shows HowToPlay on register tab)
  const [showWhyRegister, setShowWhyRegister] = useState(false);

  // Missing state variables for GlobalUI and DebugControls
  const [missedActions, setMissedActions] = useState<unknown[]>([]);

  // Sprint 3 Phase 1: Authentication state
  const auth = useAuth();
  const modals = useModals();

  // Sprint 3 Phase 5: Notification state
  useNotifications(socket, auth?.isAuthenticated || false);

  // Authentication-gated feature handlers
  const handleOpenAchievements = useCallback(() => {
    if (!auth.isAuthenticated) {
      setShowWhyRegister(true);
      return;
    }
    setShowAchievementsPanel(true);
  }, [auth.isAuthenticated, setShowAchievementsPanel]);

  const handleOpenFriends = useCallback(() => {
    if (!auth.isAuthenticated) {
      setShowWhyRegister(true);
      return;
    }
    setShowFriendsPanel(true);
  }, [auth.isAuthenticated, setShowFriendsPanel]);

  // Handler for "Why Register" modal buttons
  const handleWhyRegisterToRegister = useCallback(() => {
    setShowWhyRegister(false);
    modals.openRegisterModal();
  }, [modals]);

  const handleWhyRegisterToLogin = useCallback(() => {
    setShowWhyRegister(false);
    modals.openLoginModal();
  }, [modals]);

  // Load skin preferences from backend when user is authenticated
  useEffect(() => {
    if (auth.isAuthenticated) {
      const token = auth.getAccessToken();
      if (token) {
        loadPreferencesFromBackend(token);
      }
    }
  }, [auth.isAuthenticated, auth.getAccessToken, loadPreferencesFromBackend]);

  // Handler to open player profile modal
  const handleClickPlayer = useCallback((playerName: string) => {
    setProfilePlayerName(playerName);
  }, []);

  // Online players tracking
  const [onlinePlayers, setOnlinePlayers] = useState<
    Array<{
      socketId: string;
      playerName: string;
      status: 'in_lobby' | 'in_game' | 'in_team_selection';
      gameId?: string;
      lastActivity: number;
    }>
  >([]);

  useEffect(() => {
    preloadCardImages();

    // Clean up any old bot sessions from localStorage
    // Bot sessions should not persist and can interfere with human player reconnection
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('botSession_')) {
        localStorage.removeItem(key);
      }
    });
  }, []);

  // Sprint 1 Phase 6: Game over sound now handled by useAudioManager hook

  // Sprint 2 Phase 1: Listen for achievement unlocks
  useEffect(() => {
    if (!socket) return;

    const handleAchievementUnlocked = ({
      playerName,
      achievement,
    }: {
      playerName: string;
      achievement: Achievement;
    }) => {
      // Show notification popup
      setAchievementNotification({ playerName, achievement });
    };

    socket.on('achievement_unlocked', handleAchievementUnlocked);

    return () => {
      socket.off('achievement_unlocked', handleAchievementUnlocked);
    };
  }, [socket]);

  // Sprint 20: Player progression and level-up listeners
  useEffect(() => {
    if (!socket || !currentPlayerName) return;

    // Fetch initial skin requirements and player progression
    socket.emit('get_skin_requirements');
    socket.emit('get_player_progression', { playerName: currentPlayerName });

    const handleSkinRequirements = (data: {
      requirements: Array<{ skinId: string; requiredLevel: number; unlockDescription: string }>;
    }) => {
      setSkinRequirements(data.requirements);
    };

    const handlePlayerProgression = (data: {
      level: number;
      totalXp: number;
      unlockedSkins: string[];
    }) => {
      setPlayerLevel(data.level);
      setUnlockedSkinIds(data.unlockedSkins);
    };

    const handleLevelUp = (data: {
      playerName: string;
      oldLevel: number;
      newLevel: number;
      newlyUnlockedSkins: string[];
      allUnlockedSkins: string[];
    }) => {
      // Only show level-up modal for current player
      if (data.playerName === currentPlayerName) {
        setLevelUpData({
          oldLevel: data.oldLevel,
          newLevel: data.newLevel,
          newlyUnlockedSkins: data.newlyUnlockedSkins,
        });
        setPlayerLevel(data.newLevel);
        // Update unlocked skins with full list from server
        setUnlockedSkinIds(data.allUnlockedSkins);
      }
    };

    socket.on('skin_requirements', handleSkinRequirements);
    socket.on('player_progression', handlePlayerProgression);
    socket.on('player_leveled_up', handleLevelUp);

    return () => {
      socket.off('skin_requirements', handleSkinRequirements);
      socket.off('player_progression', handlePlayerProgression);
      socket.off('player_leveled_up', handleLevelUp);
    };
  }, [socket, currentPlayerName, setPlayerLevel, setUnlockedSkinIds, setSkinRequirements]);

  // Sprint 2 Phase 2: Friend request notifications
  useEffect(() => {
    if (!socket || !auth.isAuthenticated) return;

    // Fetch initial count when authenticated
    socket.emit('get_friend_requests');

    const handleFriendRequestReceived = (notification: FriendRequestNotification) => {
      // Show toast notification
      setFriendRequestNotification(notification);
      // Increment count
      setPendingFriendRequestsCount((prev) => prev + 1);
    };

    const handleFriendRequests = ({ requests }: { requests: unknown[] }) => {
      setPendingFriendRequestsCount(requests.length);
    };

    const handleFriendRequestAccepted = () => {
      // Decrement count when a request is accepted
      setPendingFriendRequestsCount((prev) => Math.max(0, prev - 1));
    };

    const handleFriendRequestRejected = () => {
      // Decrement count when a request is rejected
      setPendingFriendRequestsCount((prev) => Math.max(0, prev - 1));
    };

    socket.on('friend_request_received', handleFriendRequestReceived);
    socket.on('friend_requests', handleFriendRequests);
    socket.on('friend_request_accepted_confirm', handleFriendRequestAccepted);
    socket.on('friend_request_rejected', handleFriendRequestRejected);

    return () => {
      socket.off('friend_request_received', handleFriendRequestReceived);
      socket.off('friend_requests', handleFriendRequests);
      socket.off('friend_request_accepted_confirm', handleFriendRequestAccepted);
      socket.off('friend_request_rejected', handleFriendRequestRejected);
    };
  }, [socket, auth.isAuthenticated]);

  // Sprint 22A: Game invite listener with Join action
  useEffect(() => {
    if (!socket) return;

    const handleGameInviteReceived = ({
      gameId: inviteGameId,
      fromPlayer,
    }: {
      gameId: string;
      fromPlayer: string;
      timestamp: number;
    }) => {
      // Get current player name for join action
      const playerName = currentPlayerName || localStorage.getItem('playerName') || '';

      showToast(
        `${fromPlayer} invited you to join their game!`,
        'info',
        10000, // Longer duration to give time to click Join
        {
          label: 'Join',
          onClick: () => {
            if (playerName && inviteGameId) {
              // Store player name and join game
              localStorage.setItem('playerName', playerName);
              socket.emit('join_game', { gameId: inviteGameId, playerName, beginnerMode });
              setGameId(inviteGameId);
            }
          },
        }
      );
      console.log(`[Social] Game invite received from ${fromPlayer} for game ${inviteGameId}`);
    };

    socket.on('game_invite_received', handleGameInviteReceived);

    return () => {
      socket.off('game_invite_received', handleGameInviteReceived);
    };
  }, [socket, showToast, currentPlayerName, beginnerMode]);

  // Sprint 4 Phase 4.4: Game event listeners extracted to custom hook
  useGameEventListeners({
    socket,
    gameState,
    autoJoinGameId,
    showToast,
    setToast,
    setError,
    setGameState,
    setGameId,
    setIsSpectator,
    setOnlinePlayers,
    setBotTakeoverModal,
    spawnBotsForGame,
    cleanupBotSocket,
    playErrorSound,
    setSessionXp,
    setSessionCoins,
    onXpGained: addXpGain,
  });

  // Sprint 16: Swap request event listeners
  useEffect(() => {
    if (!socket || !gameId) return;

    const handleSwapRequestReceived = (data: {
      fromPlayerId: string;
      fromPlayerName: string;
      willChangeTeams: boolean;
    }) => {
      setSwapRequest(data);
    };

    const handleSwapAccepted = (data: { message: string }) => {
      showToast(data.message, 'success', 3000);
    };

    const handleSwapRejected = (data: { message: string }) => {
      showToast(data.message, 'info', 3000);
    };

    const handleSwapRequestCancelled = (data: { message: string }) => {
      // Clear any pending swap request modal since the requester disconnected
      setSwapRequest(null);
      showToast(data.message, 'info', 3000);
    };

    socket.on('swap_request_received', handleSwapRequestReceived);
    socket.on('swap_accepted', handleSwapAccepted);
    socket.on('swap_rejected', handleSwapRejected);
    socket.on('swap_request_cancelled', handleSwapRequestCancelled);

    return () => {
      socket.off('swap_request_received', handleSwapRequestReceived);
      socket.off('swap_accepted', handleSwapAccepted);
      socket.off('swap_rejected', handleSwapRejected);
      socket.off('swap_request_cancelled', handleSwapRequestCancelled);
    };
  }, [socket, gameId, showToast]);

  // Quest progress and completion listener for toast notifications
  useEffect(() => {
    if (!socket) return;

    const handleQuestProgressUpdate = (data: {
      updates: Array<{
        questId: number;
        progressDelta: number;
        newProgress: number;
        completed: boolean;
        questName: string;
      }>;
    }) => {
      // Show toast for completed quests
      for (const update of data.updates) {
        if (update.completed) {
          // Get quest details from DailyQuestsPanel context or use defaults
          showQuestCompleted({
            id: `quest-${update.questId}-${Date.now()}`,
            questName: update.questName,
            rewardXp: 50, // Default - actual rewards are shown when claimed
            rewardCurrency: 25,
            icon: '🎯',
            questType: 'medium',
          });
        }
      }
    };

    socket.on('quest_progress_update', handleQuestProgressUpdate);

    return () => {
      socket.off('quest_progress_update', handleQuestProgressUpdate);
    };
  }, [socket, showQuestCompleted]);

  // Task 10 Phase 2: Global keyboard shortcuts (? for help)
  useEffect(() => {
    const handleGlobalKeyboard = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // ? - Show keyboard shortcuts help
      if (e.key === '?' && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setShowKeyboardShortcuts((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyboard);
    return () => window.removeEventListener('keydown', handleGlobalKeyboard);
  }, []);

  // Sprint 5 Phase 2: Handle bot spawning on reconnection
  // This ensures bots continue playing after human player reconnects
  useEffect(() => {
    if (gameState && socket && gameState.players.some((p) => p.isBot)) {
      // Check if we just reconnected by looking for showCatchUpModal
      if (showCatchUpModal) {
        spawnBotsForGame(gameState);
      }
    }
  }, [showCatchUpModal]); // Trigger when catch-up modal is shown (indicates reconnection)

  // URL parameter parsing for auto-join from shared links and replay viewing
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinGameId = urlParams.get('join');
    const replayGameId = urlParams.get('replay');

    if (joinGameId) {
      setAutoJoinGameId(joinGameId);
      // Clean the URL without reloading the page
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (replayGameId) {
      // Open replay modal for shared replay link
      setShowReplayModal(true);
      // Note: The replay gameId will be handled by the URL parameter
      // We'll store it in state for the GameReplay component to use
      sessionStorage.setItem('sharedReplayId', replayGameId);
      // Clean the URL without reloading the page
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [setShowReplayModal]);

  const handleCreateGame = (playerName: string, persistenceMode: 'elo' | 'casual' = 'elo') => {
    if (socket) {
      // Store player name in localStorage for persistence
      localStorage.setItem('playerName', playerName);
      setCurrentPlayerName(playerName); // Update stable identifier
      socket.emit('create_game', { playerName, persistenceMode, beginnerMode });
    }
  };

  const handleJoinGame = (gameId: string, playerName: string) => {
    if (!socket || !gameId?.trim() || !playerName?.trim()) {
      return;
    }

    // Store player name in localStorage for persistence
    localStorage.setItem('playerName', playerName);
    setCurrentPlayerName(playerName); // Update stable identifier

    socket.emit('join_game', { gameId, playerName, beginnerMode });
    setGameId(gameId);
  };

  const handleSpectateGame = (gameId: string, spectatorName?: string) => {
    if (socket) {
      // Explicitly include optional fields for .strict() validation
      socket.emit('spectate_game', {
        gameId,
        spectatorName: spectatorName || undefined,
      });
      setGameId(gameId);
    }
  };

  const handlePlaceBet = useCallback(
    (amount: number, withoutTrump: boolean, skipped?: boolean) => {
      if (socket && gameId) {
        // Explicitly include all fields for .strict() validation
        socket.emit('place_bet', {
          gameId,
          amount,
          withoutTrump,
          skipped: skipped ?? false,
        });
      }
    },
    [socket, gameId]
  );

  const handlePlayCard = useCallback(
    (card: Card) => {
      if (socket && gameId) {
        socket.emit('play_card', { gameId, card });
      }
    },
    [socket, gameId]
  );

  // Sprint 3 Refactoring: Autoplay management hook (must be after handlePlaceBet and handlePlayCard)
  const { autoplayEnabled, toggleAutoplay } = useAutoplay({
    gameState,
    socket,
    onPlaceBet: handlePlaceBet,
    onPlayCard: handlePlayCard,
  });

  const handleSelectTeam = (teamId: 1 | 2) => {
    if (socket && gameId) {
      socket.emit('select_team', { gameId, teamId });
    }
  };

  const handleSwapPosition = (targetPlayerId: string) => {
    if (!socket || !gameId || !gameState) return;

    const targetPlayer = gameState.players.find((p) => p.id === targetPlayerId);
    if (!targetPlayer) return;

    // If target is a bot, swap immediately
    if (targetPlayer.isBot) {
      socket.emit('swap_position', { gameId, targetPlayerId });
    } else {
      // If target is human, send swap request (requires confirmation)
      socket.emit('request_swap', { gameId, targetPlayerId });
    }
  };

  const handleAcceptSwap = () => {
    if (!socket || !gameId || !swapRequest) return;

    socket.emit('respond_to_swap', {
      gameId,
      requesterId: swapRequest.fromPlayerId,
      accepted: true,
    });

    setSwapRequest(null);
  };

  const handleRejectSwap = () => {
    if (!socket || !gameId || !swapRequest) return;

    socket.emit('respond_to_swap', {
      gameId,
      requesterId: swapRequest.fromPlayerId,
      accepted: false,
    });

    setSwapRequest(null);
  };

  const handleStartGame = () => {
    if (socket && gameId) {
      socket.emit('start_game', { gameId });
    }
  };

  const handleLeaveGame = () => {
    if (!socket || !gameId || !gameState) return;

    const currentPlayer = gameState.players.find((p) => p.id === socket.id);

    // If spectator or player not found, just leave normally
    if (isSpectator || !currentPlayer || currentPlayer.isBot) {
      socket.emit('leave_game', { gameId });
      // Clear chat messages and toasts when leaving game
      setChatMessages([]);
      setToast(null);

      // Clean up bot sockets
      botSocketsRef.current.forEach((botSocket) => {
        botSocket.disconnect();
      });
      botSocketsRef.current.clear();

      // Clear bot timeouts
      botTimeoutsRef.current.forEach((timeout) => {
        clearTimeout(timeout);
      });
      botTimeoutsRef.current.clear();
      return;
    }

    // Count current bots
    const botCount = gameState.players.filter((p) => p.isBot).length;

    // If already 3 bots, just leave without replacement (max bots would be exceeded)
    if (botCount >= 3) {
      if (!confirm('Leave game? You are the only human player.')) {
        return;
      }

      socket.emit('leave_game', { gameId });
      // Clear chat messages and toasts when leaving game
      setChatMessages([]);
      setToast(null);

      // Clean up bot sockets
      botSocketsRef.current.forEach((botSocket) => {
        botSocket.disconnect();
      });
      botSocketsRef.current.clear();

      // Clear bot timeouts
      botTimeoutsRef.current.forEach((timeout) => {
        clearTimeout(timeout);
      });
      botTimeoutsRef.current.clear();
      return;
    }

    // For players, confirm and replace with bot
    if (!confirm('Leave game? You will be replaced by a bot and cannot rejoin this game.')) {
      return;
    }

    // Replace player with bot
    socket.emit('replace_me_with_bot', {
      gameId,
      playerName: currentPlayer.name,
    });

    // Note: cleanup happens when 'replaced_by_bot' event is received
  };

  const handleKickPlayer = (playerId: string) => {
    if (socket && gameId) {
      socket.emit('kick_player', { gameId, playerId });
    }
  };

  // Sprint 5 Phase 3: Bot management handlers now in useBotManagement hook
  // (handleReplaceWithBot, handleChangeBotDifficulty, handleTakeOverBot)

  // Autoplay toggle handler - now provided by useAutoplay hook

  // Sound toggle handler - now provided by useAudioManager hook

  const handleNewChatMessage = (message: ChatMessage) => {
    setChatMessages((prev) => [...prev, message]);
  };

  const handleRejoinGame = () => {
    const sessionData = sessionStorage.getItem('gameSession');
    if (!sessionData || !socket) return;

    try {
      const session: PlayerSession = JSON.parse(sessionData);
      // Reconnecting state is now managed automatically by useSocketConnection hook
      socket.emit('reconnect_to_game', { token: session.token });
    } catch (e) {
      sessionStorage.removeItem('gameSession');
      setHasValidSession(false);
    }
  };

  // Check for valid session when in lobby
  useEffect(() => {
    if (!gameState) {
      setHasValidSession(checkValidSession());
    }
  }, [gameState]);

  // Sprint 19: Update login streak when player connects
  useEffect(() => {
    if (socket && currentPlayerName) {
      socket.emit('update_login_streak', { playerName: currentPlayerName });
    }
  }, [socket, currentPlayerName]);

  // Sprint 5 Phase 3: Bot socket management functions now in useBotManagement hook
  // (spawnBotsForGame, handleAddBot, handleQuickPlay, handleBotAction)

  // Autoplay effect: now handled by useAutoplay hook

  if (error) {
    return (
      <div className="min-h-screen bg-skin-primary flex items-center justify-center">
        <div className="bg-skin-secondary p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-skin-error mb-2">Error</h2>
          <p className="text-skin-primary">{error}</p>
          <button
            onClick={() => {
              setError('');
              setGameState(null);
              setGameId('');
            }}
            className="mt-4 bg-skin-accent text-skin-inverse px-4 py-2 rounded hover:opacity-80"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  // GlobalUI props to avoid repetition
  const globalUIProps = {
    reconnecting,
    reconnectAttempt,
    toast: toast ? { ...toast, onClose: () => {} } : null,
    setToast,
    gameState,
    showCatchUpModal,
    setShowCatchUpModal,
    missedActions,
    setMissedActions,
    showBotManagement,
    setShowBotManagement,
    botDifficulty,
    setBotDifficulty,
    achievementNotification: achievementNotification ? achievementNotification.achievement : null,
    setAchievementNotification: (achievement: Achievement | null) => {
      if (achievement) {
        setAchievementNotification({
          achievement,
          playerName: gameState?.players.find((p) => p.id === socket?.id)?.name || '',
        });
      } else {
        setAchievementNotification(null);
      }
    },
    friendRequestNotification,
    setFriendRequestNotification,
    showFriendsPanel,
    setShowFriendsPanel,
    showAchievementsPanel,
    setShowAchievementsPanel,
    gameId,
    socket,
    showQuestsPanel,
    setShowQuestsPanel,
    showRewardsCalendar,
    setShowRewardsCalendar,
    showPersonalHub,
    setShowPersonalHub,
    currentPlayerName,
    onOpenProfile: () => setProfilePlayerName(currentPlayerName),
    // Sprint 20: Level up celebration
    levelUpData,
    setLevelUpData,
    // Sprint 21: Direct messages
    showDirectMessages,
    setShowDirectMessages,
    dmRecipient,
    setDmRecipient,
    // Sprint 22A: Game invite join action
    onJoinGame: (inviteGameId: string) => {
      const playerName = currentPlayerName || localStorage.getItem('playerName') || '';
      if (playerName && socket) {
        localStorage.setItem('playerName', playerName);
        socket.emit('join_game', { gameId: inviteGameId, playerName, beginnerMode });
        setGameId(inviteGameId);
      }
    },
    // Retention features: XP popup and quest toast
    xpPopupComponent: XPGainPopupComponent,
    questToastComponent: QuestCompletedToastComponent,
  };

  if (!gameState) {
    return (
      <>
        <GlobalUI {...globalUIProps} />

        <Lobby
          onCreateGame={handleCreateGame}
          onJoinGame={handleJoinGame}
          onSpectateGame={handleSpectateGame}
          onQuickPlay={handleQuickPlay}
          onRejoinGame={handleRejoinGame}
          hasValidSession={hasValidSession}
          autoJoinGameId={autoJoinGameId}
          onlinePlayers={onlinePlayers}
          socket={socket}
          botDifficulty={botDifficulty}
          onShowLogin={modals.openLoginModal}
          onShowRegister={modals.openRegisterModal}
          onBotDifficultyChange={setBotDifficulty}
          onShowProgress={() => setShowPersonalHub(true)}
          onShowWhyRegister={() => setShowWhyRegister(true)}
        />

        {/* Bot Takeover Modal - for joining games that are full with bots */}
        {botTakeoverModal && (
          <ErrorBoundary componentName="BotTakeoverModal">
            <Suspense
              fallback={
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-white">Loading...</div>
                </div>
              }
            >
              <BotTakeoverModal
                isOpen={!!botTakeoverModal}
                availableBots={botTakeoverModal.availableBots}
                onTakeOver={handleTakeOverBot}
                onCancel={() => setBotTakeoverModal(null)}
              />
            </Suspense>
          </ErrorBoundary>
        )}
      </>
    );
  }

  // If debug mode is enabled, use the multi-player view
  if (debugMode && gameState.players.length === 4) {
    return (
      <>
        <GlobalUI {...globalUIProps} />
        <DebugControls
          gameId={gameId}
          gameState={gameState}
          socket={socket}
          debugMenuOpen={debugMenuOpen}
          setDebugMenuOpen={setDebugMenuOpen}
          testPanelOpen={testPanelOpen}
          setTestPanelOpen={setTestPanelOpen}
          debugPanelOpen={debugPanelOpen}
          setDebugPanelOpen={setDebugPanelOpen}
          debugInfoOpen={debugInfoOpen}
          setDebugInfoOpen={setDebugInfoOpen}
          showBotManagement={showBotManagement}
          setShowBotManagement={setShowBotManagement}
        />
      </>
    );
  }

  if (gameState.phase === 'team_selection') {
    return (
      <>
        <GlobalUI {...globalUIProps} />
        <DebugControls
          gameState={gameState}
          gameId={gameId}
          socket={socket}
          debugMenuOpen={debugMenuOpen}
          setDebugMenuOpen={setDebugMenuOpen}
          testPanelOpen={testPanelOpen}
          setTestPanelOpen={setTestPanelOpen}
          debugPanelOpen={debugPanelOpen}
          setDebugPanelOpen={setDebugPanelOpen}
          debugInfoOpen={debugInfoOpen}
          setDebugInfoOpen={setDebugInfoOpen}
          showBotManagement={showBotManagement}
          setShowBotManagement={setShowBotManagement}
        />
        <ErrorBoundary componentName="DebugPanel">
          <Suspense fallback={<div />}>
            <DebugPanel
              gameState={gameState}
              gameId={gameId}
              isOpen={debugPanelOpen}
              socket={socket}
              onClose={() => setDebugPanelOpen(false)}
            />
          </Suspense>
        </ErrorBoundary>
        <ErrorBoundary componentName="TeamSelection">
          <Suspense
            fallback={
              <div className="min-h-screen bg-skin-primary flex items-center justify-center">
                <div className="text-skin-primary text-2xl">Loading...</div>
              </div>
            }
          >
            <TeamSelection
              players={gameState.players}
              gameId={gameId}
              currentPlayerId={currentPlayerName}
              creatorId={gameState.creatorId}
              onSelectTeam={handleSelectTeam}
              onSwapPosition={handleSwapPosition}
              onStartGame={handleStartGame}
              onLeaveGame={handleLeaveGame}
              onAddBot={handleAddBot}
              onKickPlayer={handleKickPlayer}
              socket={socket}
              botDifficulty={botDifficulty}
              onBotDifficultyChange={setBotDifficulty}
              isVoiceEnabled={isVoiceEnabled}
              isVoiceMuted={isVoiceMuted}
              voiceParticipants={voiceParticipants}
              voiceError={voiceError}
              onVoiceToggle={handleVoiceToggle}
              onVoiceMuteToggle={toggleVoiceMute}
              onShowWhyRegister={() => setShowWhyRegister(true)}
            />
          </Suspense>
        </ErrorBoundary>

        {/* Beginner Mode Tutorial */}
        {beginnerMode && socket?.id && (
          <ErrorBoundary componentName="BeginnerTutorial">
            <Suspense fallback={<div />}>
              <BeginnerTutorial
                gameState={gameState}
                currentPlayerId={currentPlayerName}
                onAllTutorialsCompleted={checkTutorialAchievement}
              />
            </Suspense>
          </ErrorBoundary>
        )}

        {/* Player Profile Modal - shows when clicking on player names */}
        <ErrorBoundary componentName="PlayerProfileModal">
          <Suspense fallback={<div>Loading profile...</div>}>
            {profilePlayerName && (
              <PlayerProfileModal
                playerName={profilePlayerName}
                socket={socket}
                isOpen={!!profilePlayerName}
                onClose={() => setProfilePlayerName(null)}
                onShowWhyRegister={() => {
                  setProfilePlayerName(null);
                  setShowWhyRegister(true);
                }}
              />
            )}
          </Suspense>
        </ErrorBoundary>
      </>
    );
  }

  if (gameState.phase === 'betting') {
    return (
      <>
        <GlobalUI {...globalUIProps} />
        <DebugControls
          gameState={gameState}
          gameId={gameId}
          socket={socket}
          debugMenuOpen={debugMenuOpen}
          setDebugMenuOpen={setDebugMenuOpen}
          testPanelOpen={testPanelOpen}
          setTestPanelOpen={setTestPanelOpen}
          debugPanelOpen={debugPanelOpen}
          setDebugPanelOpen={setDebugPanelOpen}
          debugInfoOpen={debugInfoOpen}
          setDebugInfoOpen={setDebugInfoOpen}
          showBotManagement={showBotManagement}
          setShowBotManagement={setShowBotManagement}
        />
        <ErrorBoundary componentName="DebugPanel">
          <Suspense fallback={<div />}>
            <DebugPanel
              gameState={gameState}
              gameId={gameId}
              isOpen={debugPanelOpen}
              socket={socket}
              onClose={() => setDebugPanelOpen(false)}
            />
          </Suspense>
        </ErrorBoundary>
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="min-h-screen bg-skin-primary flex items-center justify-center">
                <div className="text-skin-primary text-2xl">Loading...</div>
              </div>
            }
          >
            <BettingPhase
              players={gameState.players}
              currentBets={gameState.currentBets}
              currentPlayerId={currentPlayerName}
              currentPlayerIndex={gameState.currentPlayerIndex}
              dealerIndex={gameState.dealerIndex}
              onPlaceBet={handlePlaceBet}
              onLeaveGame={handleLeaveGame}
              gameState={gameState}
              autoplayEnabled={autoplayEnabled}
              onAutoplayToggle={toggleAutoplay}
              soundEnabled={soundEnabled}
              onSoundToggle={toggleSound}
              connectionStats={connectionStats}
              onOpenBotManagement={() => setShowBotManagement(true)}
              onOpenAchievements={handleOpenAchievements}
              onOpenFriends={handleOpenFriends}
              pendingFriendRequestsCount={pendingFriendRequestsCount}
              onClickPlayer={handleClickPlayer}
              socket={socket}
              gameId={gameId}
              chatMessages={chatMessages}
              onNewChatMessage={handleNewChatMessage}
              isVoiceEnabled={isVoiceEnabled}
              isVoiceMuted={isVoiceMuted}
              voiceParticipants={voiceParticipants}
              voiceError={voiceError}
              onVoiceToggle={handleVoiceToggle}
              onVoiceMuteToggle={toggleVoiceMute}
            />
          </Suspense>
        </ErrorBoundary>

        {/* Beginner Mode Tutorial */}
        {beginnerMode && socket?.id && (
          <ErrorBoundary componentName="BeginnerTutorial">
            <Suspense fallback={<div />}>
              <BeginnerTutorial
                gameState={gameState}
                currentPlayerId={currentPlayerName}
                onAllTutorialsCompleted={checkTutorialAchievement}
              />
            </Suspense>
          </ErrorBoundary>
        )}

        {/* Player Profile Modal - shows when clicking on player names */}
        <ErrorBoundary componentName="PlayerProfileModal">
          <Suspense fallback={<div>Loading profile...</div>}>
            {profilePlayerName && (
              <PlayerProfileModal
                playerName={profilePlayerName}
                socket={socket}
                isOpen={!!profilePlayerName}
                onClose={() => setProfilePlayerName(null)}
                onShowWhyRegister={() => {
                  setProfilePlayerName(null);
                  setShowWhyRegister(true);
                }}
              />
            )}
          </Suspense>
        </ErrorBoundary>
      </>
    );
  }

  if (gameState.phase === 'playing') {
    return (
      <>
        <GlobalUI {...globalUIProps} />
        <DebugControls
          gameState={gameState}
          gameId={gameId}
          socket={socket}
          debugMenuOpen={debugMenuOpen}
          setDebugMenuOpen={setDebugMenuOpen}
          testPanelOpen={testPanelOpen}
          setTestPanelOpen={setTestPanelOpen}
          debugPanelOpen={debugPanelOpen}
          setDebugPanelOpen={setDebugPanelOpen}
          debugInfoOpen={debugInfoOpen}
          setDebugInfoOpen={setDebugInfoOpen}
          showBotManagement={showBotManagement}
          setShowBotManagement={setShowBotManagement}
        />
        <ErrorBoundary componentName="DebugPanel">
          <Suspense fallback={<div />}>
            <DebugPanel
              gameState={gameState}
              gameId={gameId}
              isOpen={debugPanelOpen}
              socket={socket}
              onClose={() => setDebugPanelOpen(false)}
            />
          </Suspense>
        </ErrorBoundary>
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="min-h-screen bg-skin-primary flex items-center justify-center">
                <div className="text-white text-2xl">Loading...</div>
              </div>
            }
          >
            <PlayingPhase
              gameState={gameState}
              currentPlayerId={currentPlayerName}
              onPlayCard={handlePlayCard}
              isSpectator={isSpectator}
              currentTrickWinnerId={currentTrickWinnerId}
              onLeaveGame={handleLeaveGame}
              autoplayEnabled={autoplayEnabled}
              onAutoplayToggle={toggleAutoplay}
              soundEnabled={soundEnabled}
              onSoundToggle={toggleSound}
              onOpenBotManagement={() => setShowBotManagement(true)}
              onOpenAchievements={handleOpenAchievements}
              onOpenFriends={handleOpenFriends}
              pendingFriendRequestsCount={pendingFriendRequestsCount}
              onClickPlayer={handleClickPlayer}
              socket={socket}
              gameId={gameId}
              chatMessages={chatMessages}
              onNewChatMessage={handleNewChatMessage}
              connectionStats={connectionStats}
              isVoiceEnabled={isVoiceEnabled}
              isVoiceMuted={isVoiceMuted}
              voiceParticipants={voiceParticipants}
              voiceError={voiceError}
              onVoiceToggle={handleVoiceToggle}
              onVoiceMuteToggle={toggleVoiceMute}
            />
          </Suspense>
        </ErrorBoundary>

        {/* Beginner Mode Tutorial */}
        {beginnerMode && socket?.id && (
          <ErrorBoundary componentName="BeginnerTutorial">
            <Suspense fallback={<div />}>
              <BeginnerTutorial
                gameState={gameState}
                currentPlayerId={currentPlayerName}
                onAllTutorialsCompleted={checkTutorialAchievement}
              />
            </Suspense>
          </ErrorBoundary>
        )}

        {/* Player Profile Modal - shows when clicking on player names */}
        <ErrorBoundary componentName="PlayerProfileModal">
          <Suspense fallback={<div>Loading profile...</div>}>
            {profilePlayerName && (
              <PlayerProfileModal
                playerName={profilePlayerName}
                socket={socket}
                isOpen={!!profilePlayerName}
                onClose={() => setProfilePlayerName(null)}
                onShowWhyRegister={() => {
                  setProfilePlayerName(null);
                  setShowWhyRegister(true);
                }}
              />
            )}
          </Suspense>
        </ErrorBoundary>
      </>
    );
  }

  if (gameState.phase === 'scoring') {
    const handleReady = () => {
      if (!socket) return;
      socket.emit('player_ready', { gameId });
    };

    return (
      <>
        <GlobalUI {...globalUIProps} />
        <DebugControls
          gameState={gameState}
          gameId={gameId}
          socket={socket}
          debugMenuOpen={debugMenuOpen}
          setDebugMenuOpen={setDebugMenuOpen}
          testPanelOpen={testPanelOpen}
          setTestPanelOpen={setTestPanelOpen}
          debugPanelOpen={debugPanelOpen}
          setDebugPanelOpen={setDebugPanelOpen}
          debugInfoOpen={debugInfoOpen}
          setDebugInfoOpen={setDebugInfoOpen}
          showBotManagement={showBotManagement}
          setShowBotManagement={setShowBotManagement}
        />
        <ErrorBoundary componentName="DebugPanel">
          <Suspense fallback={<div />}>
            <DebugPanel
              gameState={gameState}
              gameId={gameId}
              isOpen={debugPanelOpen}
              socket={socket}
              onClose={() => setDebugPanelOpen(false)}
            />
          </Suspense>
        </ErrorBoundary>
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="min-h-screen bg-skin-primary flex items-center justify-center">
                <div className="text-white text-2xl">Loading...</div>
              </div>
            }
          >
            <div className="min-h-screen bg-skin-primary flex items-center justify-center p-6">
              <div className="bg-skin-secondary rounded-2xl shadow-2xl max-w-5xl w-full">
                <RoundSummary
                  gameState={gameState}
                  onReady={handleReady}
                  currentPlayerId={isSpectator ? undefined : currentPlayerName}
                />
              </div>
            </div>
          </Suspense>
        </ErrorBoundary>

        {/* Beginner Mode Tutorial */}
        {beginnerMode && socket?.id && (
          <ErrorBoundary componentName="BeginnerTutorial">
            <Suspense fallback={<div />}>
              <BeginnerTutorial
                gameState={gameState}
                currentPlayerId={currentPlayerName}
                onAllTutorialsCompleted={checkTutorialAchievement}
              />
            </Suspense>
          </ErrorBoundary>
        )}

        {/* Player Profile Modal - shows when clicking on player names */}
        <ErrorBoundary componentName="PlayerProfileModal">
          <Suspense fallback={<div>Loading profile...</div>}>
            {profilePlayerName && (
              <PlayerProfileModal
                playerName={profilePlayerName}
                socket={socket}
                isOpen={!!profilePlayerName}
                onClose={() => setProfilePlayerName(null)}
                onShowWhyRegister={() => {
                  setProfilePlayerName(null);
                  setShowWhyRegister(true);
                }}
              />
            )}
          </Suspense>
        </ErrorBoundary>
      </>
    );
  }

  if (gameState.phase === 'game_over') {
    const winningTeam = gameState.teamScores.team1 >= 41 ? 1 : 2;
    const team1Players = gameState.players.filter((p) => p.teamId === 1);
    const team2Players = gameState.players.filter((p) => p.teamId === 2);

    return (
      <>
        <GlobalUI {...globalUIProps} />
        <Suspense fallback={null}>
          <VictoryConfetti teamColor={winningTeam === 1 ? 'orange' : 'purple'} duration={5000} />
        </Suspense>
        <DebugControls
          gameState={gameState}
          gameId={gameId}
          socket={socket}
          debugMenuOpen={debugMenuOpen}
          setDebugMenuOpen={setDebugMenuOpen}
          testPanelOpen={testPanelOpen}
          setTestPanelOpen={setTestPanelOpen}
          debugPanelOpen={debugPanelOpen}
          setDebugPanelOpen={setDebugPanelOpen}
          debugInfoOpen={debugInfoOpen}
          setDebugInfoOpen={setDebugInfoOpen}
          showBotManagement={showBotManagement}
          setShowBotManagement={setShowBotManagement}
        />
        <Suspense fallback={<div />}>
          <DebugPanel
            gameState={gameState}
            gameId={gameId}
            isOpen={debugPanelOpen}
            socket={socket}
            onClose={() => setDebugPanelOpen(false)}
          />
        </Suspense>
        <div className="min-h-screen bg-skin-primary flex items-center justify-center p-6">
          <div className="bg-skin-secondary rounded-2xl p-8 shadow-2xl max-w-4xl w-full border-4 border-skin-accent">
            {/* Victory Banner */}
            <div className="text-center mb-8">
              <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 mb-4 animate-pulse">
                🏆 Game Over! 🏆
              </h2>
              <div
                className={`text-6xl font-black mb-2 ${winningTeam === 1 ? 'text-team1' : 'text-team2'}`}
              >
                Team {winningTeam} Wins!
              </div>
              <p className="text-umber-600 font-semibold">Round {gameState.roundNumber}</p>
            </div>

            {/* Final Scores */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div
                className={`text-center p-6 rounded-xl border-4 border-team1 ${winningTeam === 1 ? 'bg-team1-20 ring-4 ring-yellow-400' : 'bg-team1-10'}`}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  {winningTeam === 1 && <span className="text-3xl">👑</span>}
                  <h3 className="text-2xl font-bold text-team1">Team 1</h3>
                </div>
                <p data-testid="team1-final-score" className="text-6xl font-black text-team1">
                  {gameState.teamScores.team1}
                </p>
                <p className="text-sm text-team1 opacity-80 mt-2">Final Score</p>
              </div>
              <div
                className={`text-center p-6 rounded-xl border-4 border-team2 ${winningTeam === 2 ? 'bg-team2-20 ring-4 ring-yellow-400' : 'bg-team2-10'}`}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  {winningTeam === 2 && <span className="text-3xl">👑</span>}
                  <h3 className="text-2xl font-bold text-team2">Team 2</h3>
                </div>
                <p data-testid="team2-final-score" className="text-6xl font-black text-team2">
                  {gameState.teamScores.team2}
                </p>
                <p className="text-sm text-team2 opacity-80 mt-2">Final Score</p>
              </div>
            </div>

            {/* XP & Coins Earned This Game */}
            {(() => {
              // Don't show rewards for spectators
              if (isSpectator) return null;

              // Calculate rewards for current player
              const currentPlayer = gameState.players.find(
                (p) => p.name === currentPlayerName || p.id === currentPlayerName
              );
              if (!currentPlayer || currentPlayer.isBot) return null;

              // Calculate stats from game
              const won = winningTeam === currentPlayer.teamId;
              const tricksWon = currentPlayer.tricksWon || 0;

              // Count stats from round history
              let betsSuccessful = 0;
              let roundsWon = 0;
              let roundsLost = 0;
              let redZerosCollected = 0;

              if (gameState.roundHistory) {
                for (const round of gameState.roundHistory) {
                  const wasBettingTeam = round.offensiveTeam === currentPlayer.teamId;
                  // Count successful bets (player was on betting team AND bet was made)
                  if (wasBettingTeam && round.betMade) {
                    betsSuccessful++;
                  }
                  // Count rounds won/lost based on round score (positive = team scored points)
                  const playerTeamScore =
                    currentPlayer.teamId === 1 ? round.roundScore.team1 : round.roundScore.team2;
                  if (playerTeamScore > 0) {
                    roundsWon++;
                  } else {
                    roundsLost++;
                  }
                  // Count special cards from player stats
                  const playerStats = round.playerStats?.find(
                    (ps) => ps.playerName === currentPlayer.name
                  );
                  if (playerStats?.redZerosCollected) {
                    redZerosCollected += playerStats.redZerosCollected;
                  }
                }
              }

              const xp = calculateGameXp({
                won,
                tricksWon,
                betsSuccessful,
                redZerosCollected,
              });

              const coins = calculateGameCoins({
                won,
                roundsWon,
                roundsLost,
                redZerosCollected,
                brownZerosDodged: 0, // Not tracked per-player; kept for interface compatibility
              });

              return (
                <section
                  className="mb-8 bg-skin-success/10 rounded-xl p-4 md:p-6 border-4 border-skin-success"
                  aria-label="Game rewards summary"
                  role="region"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* XP Section */}
                    <div
                      className="flex items-center gap-3 md:gap-4"
                      role="group"
                      aria-label="Experience points earned"
                    >
                      <span className="text-4xl md:text-5xl" aria-hidden="true">
                        ✨
                      </span>
                      <div>
                        <h3
                          className="text-base md:text-lg font-bold text-skin-success"
                          id="game-xp-label"
                        >
                          Total XP
                        </h3>
                        <div
                          className="text-3xl md:text-4xl font-black text-skin-success"
                          aria-labelledby="game-xp-label"
                        >
                          +{xp} XP
                        </div>
                      </div>
                    </div>

                    {/* Coins Section */}
                    <div
                      className="flex items-center gap-3 md:gap-4 md:border-l md:border-skin-success md:pl-6"
                      role="group"
                      aria-label="Coins earned"
                    >
                      <span className="text-4xl md:text-5xl" aria-hidden="true">
                        🪙
                      </span>
                      <div>
                        <h3
                          className="text-base md:text-lg font-bold text-skin-warning"
                          id="game-coins-label"
                        >
                          Total Coins
                        </h3>
                        <div
                          className="text-3xl md:text-4xl font-black text-skin-warning"
                          aria-labelledby="game-coins-label"
                        >
                          +{coins}
                        </div>
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div
                      className="text-xs md:text-sm space-y-1 border-t md:border-t-0 md:border-l border-skin-success pt-3 md:pt-0 md:pl-6"
                      aria-label="Reward breakdown"
                    >
                      <div className="text-skin-success">
                        <div>Game = +{XP_REWARDS.GAME_COMPLETION} XP</div>
                        {won && <div>Victory = +{XP_REWARDS.GAME_WIN} XP</div>}
                        {tricksWon > 0 && (
                          <div>
                            {tricksWon} tricks = +{tricksWon * XP_REWARDS.TRICK_WON} XP
                          </div>
                        )}
                        {betsSuccessful > 0 && (
                          <div>
                            {betsSuccessful} bets = +{betsSuccessful * XP_REWARDS.SUCCESSFUL_BET} XP
                          </div>
                        )}
                      </div>
                      <div className="text-skin-warning">
                        {won ? (
                          <div>Win bonus = +{CURRENCY_REWARDS.GAME_WON} coins</div>
                        ) : (
                          <div>Participation = +{CURRENCY_REWARDS.GAME_LOST} coins</div>
                        )}
                        {roundsWon > 0 && (
                          <div>
                            {roundsWon} rounds won = +
                            {roundsWon * (CURRENCY_REWARDS.ROUND_WON + CURRENCY_REWARDS.BET_MADE)}{' '}
                            coins
                          </div>
                        )}
                        {redZerosCollected > 0 && (
                          <div>
                            {redZerosCollected} red 0s = +
                            {redZerosCollected * CURRENCY_REWARDS.RED_ZERO_COLLECTED} coins
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              );
            })()}

            {/* Session Totals - Show accumulated XP/Coins across all games this session */}
            {sessionXp > 0 && (
              <section
                className="mb-6 bg-skin-accent/10 rounded-lg p-3 md:p-4 border-2 border-skin-accent"
                aria-label="Session rewards summary"
                role="region"
              >
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xl" aria-hidden="true">
                      📊
                    </span>
                    <span className="text-sm font-semibold text-skin-accent">
                      This Session:
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <span className="text-lg" aria-hidden="true">
                        ✨
                      </span>
                      <span className="text-lg font-bold text-skin-success">
                        {sessionXp} XP
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-lg" aria-hidden="true">
                        🪙
                      </span>
                      <span className="text-lg font-bold text-skin-warning">
                        {sessionCoins} coins
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Player Stats */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              {/* Team 1 Players */}
              <div className="bg-team1/10 rounded-lg p-4 border-2 border-team1">
                <h4 className="text-lg font-bold text-team1 mb-3 text-center">
                  Team 1 Players
                </h4>
                <div className="space-y-2">
                  {team1Players.map((player) => (
                    <div
                      key={player.id}
                      className="bg-skin-primary rounded-lg p-3 border border-team1"
                    >
                      <div className="font-semibold text-skin-primary">
                        {player.name}
                      </div>
                      <div className="text-sm text-skin-secondary">
                        {player.tricksWon} tricks • {player.pointsWon} pts
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team 2 Players */}
              <div className="bg-team2/10 rounded-lg p-4 border-2 border-team2">
                <h4 className="text-lg font-bold text-team2 mb-3 text-center">
                  Team 2 Players
                </h4>
                <div className="space-y-2">
                  {team2Players.map((player) => (
                    <div
                      key={player.id}
                      className="bg-skin-primary rounded-lg p-3 border border-team2"
                    >
                      <div className="font-semibold text-skin-primary">
                        {player.name}
                      </div>
                      <div className="text-sm text-skin-secondary">
                        {player.tricksWon} tricks • {player.pointsWon} pts
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Round History */}
            {gameState.roundHistory.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-skin-primary mb-4 border-b-2 border-skin-default pb-2 font-serif">
                  📜 Game History
                </h3>
                <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                  {gameState.roundHistory
                    .slice()
                    .reverse()
                    .map((round) => {
                      const betPlayer = gameState.players.find(
                        (p) => p.id === round.highestBet.playerId
                      );

                      return (
                        <div
                          key={round.roundNumber}
                          className="bg-skin-tertiary rounded-lg p-4 border-2 border-skin-default hover:bg-skin-secondary transition-colors"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-lg font-bold text-skin-primary">
                              Round {round.roundNumber}
                            </h4>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-semibold border-2 ${
                                round.betMade
                                  ? 'bg-green-100 text-green-800 border-green-400'
                                  : 'bg-red-100 text-red-800 border-red-400'
                              }`}
                            >
                              {round.betMade ? '✓ Bet Made' : '✗ Bet Failed'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="bg-skin-primary rounded p-2">
                              <p className="text-skin-secondary font-semibold text-xs">
                                Bidder
                              </p>
                              <p className="font-bold text-skin-primary">
                                {betPlayer?.name || 'Unknown'}
                              </p>
                              <p className="text-xs text-skin-muted">
                                Team {round.offensiveTeam}
                              </p>
                            </div>
                            <div className="bg-skin-primary rounded p-2">
                              <p className="text-skin-secondary font-semibold text-xs">
                                Bet
                              </p>
                              <p className="font-bold text-skin-primary">
                                {round.betAmount} points
                              </p>
                              <p className="text-xs text-skin-muted">
                                {round.withoutTrump ? 'No Trump (2x)' : 'With Trump'}
                              </p>
                            </div>
                            <div className="bg-skin-primary rounded p-2">
                              <p className="text-skin-secondary font-semibold text-xs">
                                Points Earned
                              </p>
                              <p className="font-bold text-skin-primary">
                                {round.offensivePoints} / {round.betAmount}
                              </p>
                              <p className="text-xs text-skin-muted">
                                Defensive: {round.defensivePoints}
                              </p>
                            </div>
                            <div className="bg-skin-primary rounded p-2">
                              <p className="text-skin-secondary font-semibold text-xs">
                                Round Score
                              </p>
                              <p className="font-bold">
                                <span className="text-team1">
                                  {round.roundScore.team1 >= 0 ? '+' : ''}
                                  {round.roundScore.team1}
                                </span>
                                {' / '}
                                <span className="text-team2">
                                  {round.roundScore.team2 >= 0 ? '+' : ''}
                                  {round.roundScore.team2}
                                </span>
                              </p>
                              <p className="text-xs text-umber-600">
                                Total: {round.cumulativeScore.team1} - {round.cumulativeScore.team2}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Rematch Voting */}
            <div className="mb-6">
              <ErrorBoundary componentName="RematchVoting">
                <Suspense fallback={<div className="text-center text-gray-500">Loading...</div>}>
                  <RematchVoting
                    socket={socket}
                    gameId={gameId}
                    gameState={gameState}
                    currentPlayerId={currentPlayerName}
                  />
                </Suspense>
              </ErrorBoundary>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                data-testid="view-replay-button"
                onClick={() => setShowReplayModal(true)}
                className="bg-skin-accent text-skin-inverse px-8 py-4 rounded-xl font-bold hover:opacity-90 transition-all duration-300 border-2 border-skin-accent shadow-lg transform hover:scale-105"
              >
                📺 View Game Replay
              </button>
              <button
                data-testid="back-to-lobby-button"
                onClick={() => {
                  setGameState(null);
                  setGameId('');
                }}
                className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-8 py-4 rounded-xl font-bold hover:from-gray-600 hover:to-gray-700 transition-all duration-300 border-2 border-gray-700 shadow-lg transform hover:scale-105"
              >
                🏠 Back to Lobby
              </button>
            </div>
          </div>
        </div>

        {/* Game Replay Modal */}
        {showReplayModal && socket && (
          <ErrorBoundary
            fallback={<ReplayErrorFallback onClose={() => setShowReplayModal(false)} />}
          >
            <Suspense
              fallback={
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-white">Loading replay...</div>
                </div>
              }
            >
              <GameReplay
                gameId={gameId}
                socket={socket}
                onClose={() => setShowReplayModal(false)}
              />
            </Suspense>
          </ErrorBoundary>
        )}

        {/* Bot Takeover Modal */}
        {botTakeoverModal && (
          <ErrorBoundary componentName="BotTakeoverModal">
            <Suspense
              fallback={
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-white">Loading...</div>
                </div>
              }
            >
              <BotTakeoverModal
                isOpen={!!botTakeoverModal}
                availableBots={botTakeoverModal.availableBots}
                onTakeOver={handleTakeOverBot}
                onCancel={() => setBotTakeoverModal(null)}
              />
            </Suspense>
          </ErrorBoundary>
        )}

        {/* Swap Confirmation Modal */}
        {swapRequest && (
          <ErrorBoundary componentName="SwapConfirmationModal">
            <Suspense
              fallback={
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-white">Loading...</div>
                </div>
              }
            >
              <SwapConfirmationModal
                isOpen={!!swapRequest}
                fromPlayerName={swapRequest.fromPlayerName}
                willChangeTeams={swapRequest.willChangeTeams}
                onAccept={handleAcceptSwap}
                onReject={handleRejectSwap}
              />
            </Suspense>
          </ErrorBoundary>
        )}

        {/* Task 10 Phase 2: Keyboard Shortcuts Help Modal (press ?) */}
        <ErrorBoundary componentName="KeyboardShortcutsModal">
          <Suspense fallback={<div />}>
            {(() => {
              // Cast to string to avoid TypeScript control flow narrowing issues
              const phase = gameState?.phase as string | undefined;
              const currentPhase: 'lobby' | 'team_selection' | 'betting' | 'playing' =
                phase === 'team_selection'
                  ? 'team_selection'
                  : phase === 'betting'
                    ? 'betting'
                    : phase === 'playing'
                      ? 'playing'
                      : 'lobby';

              return (
                <KeyboardShortcutsModal
                  isOpen={showKeyboardShortcuts}
                  onClose={() => setShowKeyboardShortcuts(false)}
                  currentPhase={currentPhase}
                />
              );
            })()}
          </Suspense>
        </ErrorBoundary>

        {/* Player Profile Modal - shows when clicking on player names */}
        <ErrorBoundary componentName="PlayerProfileModal">
          <Suspense fallback={<div>Loading profile...</div>}>
            {profilePlayerName && (
              <PlayerProfileModal
                playerName={profilePlayerName}
                socket={socket}
                isOpen={!!profilePlayerName}
                onClose={() => setProfilePlayerName(null)}
                onShowWhyRegister={() => {
                  setProfilePlayerName(null);
                  setShowWhyRegister(true);
                }}
              />
            )}
          </Suspense>
        </ErrorBoundary>

        {/* Why Register Modal - shows HowToPlay on register tab with action buttons */}
        <ErrorBoundary componentName="HowToPlay">
          <Suspense fallback={<div />}>
            <HowToPlay
              isModal
              isOpen={showWhyRegister}
              onClose={() => setShowWhyRegister(false)}
              initialTab="register"
              onRegister={handleWhyRegisterToRegister}
              onLogin={handleWhyRegisterToLogin}
            />
          </Suspense>
        </ErrorBoundary>
      </>
    );
  }

  return null;
}

// Wrapper component to provide modal context
function App() {
  return (
    <ModalProvider>
      <AppContent />
    </ModalProvider>
  );
}

export default App;

import { useEffect, useState, useCallback, Suspense, lazy } from 'react';
import { Card, PlayerSession, ChatMessage } from './types/game';
import { Lobby } from './components/Lobby';
import GlobalUI from './components/GlobalUI';

// Lazy load heavy components for better initial load performance
// Game phase components (only loaded when needed)
const TeamSelection = lazy(() => import('./components/TeamSelection').then(m => ({ default: m.TeamSelection })));
const BettingPhase = lazy(() => import('./components/BettingPhase').then(m => ({ default: m.BettingPhase })));
const PlayingPhase = lazy(() => import('./components/PlayingPhase').then(m => ({ default: m.PlayingPhase })));
const RoundSummary = lazy(() => import('./components/RoundSummary'));
const RematchVoting = lazy(() => import('./components/RematchVoting').then(m => ({ default: m.RematchVoting })));

// Modals and overlays (only loaded when opened)
const GameReplay = lazy(() => import('./components/GameReplay').then(m => ({ default: m.GameReplay })));
const BotTakeoverModal = lazy(() => import('./components/BotTakeoverModal').then(m => ({ default: m.BotTakeoverModal })));
const SwapConfirmationModal = lazy(() => import('./components/SwapConfirmationModal').then(m => ({ default: m.SwapConfirmationModal })));

// Debug components (only loaded in debug mode)
const DebugControls = lazy(() => import('./components/DebugControls'));
const DebugPanel = lazy(() => import('./components/DebugPanel').then(m => ({ default: m.DebugPanel })));
// Task 10 Phase 2: Keyboard navigation help
const KeyboardShortcutsModal = lazy(() => import('./components/KeyboardShortcutsModal').then(m => ({ default: m.KeyboardShortcutsModal })));
// Player profile modal (lazy loaded)
const PlayerProfileModal = lazy(() => import('./components/PlayerProfileModal').then(m => ({ default: m.PlayerProfileModal })));
// Beginner mode components
const BeginnerTutorial = lazy(() => import('./components/BeginnerTutorial').then(m => ({ default: m.BeginnerTutorial })));
import { Achievement } from './types/achievements'; // Sprint 2 Phase 1
import { FriendRequestNotification } from './types/friends'; // Sprint 2 Phase 2
import { useAuth } from './contexts/AuthContext'; // Sprint 3 Phase 1
import { ModalProvider, useModals } from './contexts/ModalContext'; // Modal state management
import { useNotifications } from './hooks/useNotifications'; // Sprint 3 Phase 5
import { useSettings } from './contexts/SettingsContext'; // Settings including beginner mode
import { preloadCardImages } from './utils/imagePreloader';
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
  useTutorialAchievement({ socket });

  // Sprint 3 Refactoring: Audio management hook
  const { soundEnabled, toggleSound, playErrorSound } = useAudioManager({ gameState });

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
  const {
    showBotManagement,
    showFriendsPanel,
    showReplayModal,
    showAchievementsPanel,
    setShowBotManagement,
    setShowFriendsPanel,
    setShowReplayModal,
    setShowAchievementsPanel,
  } = useUIState();

  // UI state
  const [hasValidSession, setHasValidSession] = useState<boolean>(false);
  const [autoJoinGameId, setAutoJoinGameId] = useState<string>(''); // URL parameter for auto-join from shared links

  // CRITICAL: Stable player identifier (use player name, NOT socket.id which changes on reconnect)
  const [currentPlayerName, setCurrentPlayerName] = useState<string>(() => {
    return localStorage.getItem('playerName') || '';
  });

  // Sprint 2 Phase 1: Achievement state
  const [achievementNotification, setAchievementNotification] = useState<{ achievement: Achievement; playerName: string } | null>(null);

  // Sprint 2 Phase 2: Friends state
  const [friendRequestNotification, setFriendRequestNotification] = useState<FriendRequestNotification | null>(null);
  const [pendingFriendRequestsCount, setPendingFriendRequestsCount] = useState<number>(0);

  // Sprint 16: Swap request state
  const [swapRequest, setSwapRequest] = useState<{ fromPlayerId: string; fromPlayerName: string; willChangeTeams: boolean } | null>(null);

  // Task 10 Phase 2: Keyboard shortcuts help modal
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  // Player profile modal state
  const [profilePlayerName, setProfilePlayerName] = useState<string | null>(null);

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
      showToast('Please register to access achievements', 'info', 3000);
      return;
    }
    setShowAchievementsPanel(true);
  }, [auth.isAuthenticated, showToast, setShowAchievementsPanel]);

  const handleOpenFriends = useCallback(() => {
    if (!auth.isAuthenticated) {
      showToast('Please register to access friends', 'info', 3000);
      return;
    }
    setShowFriendsPanel(true);
  }, [auth.isAuthenticated, showToast, setShowFriendsPanel]);

  // Handler to open player profile modal
  const handleClickPlayer = useCallback((playerName: string) => {
    setProfilePlayerName(playerName);
  }, []);

  // Online players tracking
  const [onlinePlayers, setOnlinePlayers] = useState<Array<{
    socketId: string;
    playerName: string;
    status: 'in_lobby' | 'in_game' | 'in_team_selection';
    gameId?: string;
    lastActivity: number;
  }>>([]);

  useEffect(() => {
    preloadCardImages();

    // Clean up any old bot sessions from localStorage
    // Bot sessions should not persist and can interfere with human player reconnection
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('botSession_')) {
        localStorage.removeItem(key);
      }
    });
  }, []);

  // Sprint 1 Phase 6: Game over sound now handled by useAudioManager hook

  // Sprint 2 Phase 1: Listen for achievement unlocks
  useEffect(() => {
    if (!socket) return;

    const handleAchievementUnlocked = ({ playerName, achievement }: { playerName: string; achievement: Achievement }) => {
      // Show notification popup
      setAchievementNotification({ playerName, achievement });
    };

    socket.on('achievement_unlocked', handleAchievementUnlocked);

    return () => {
      socket.off('achievement_unlocked', handleAchievementUnlocked);
    };
  }, [socket]);

  // Sprint 2 Phase 2: Friend request notifications
  useEffect(() => {
    if (!socket || !auth.isAuthenticated) return;

    // Fetch initial count when authenticated
    socket.emit('get_friend_requests');

    const handleFriendRequestReceived = (notification: FriendRequestNotification) => {
      // Show toast notification
      setFriendRequestNotification(notification);
      // Increment count
      setPendingFriendRequestsCount(prev => prev + 1);
    };

    const handleFriendRequests = ({ requests }: { requests: unknown[] }) => {
      setPendingFriendRequestsCount(requests.length);
    };

    const handleFriendRequestAccepted = () => {
      // Decrement count when a request is accepted
      setPendingFriendRequestsCount(prev => Math.max(0, prev - 1));
    };

    const handleFriendRequestRejected = () => {
      // Decrement count when a request is rejected
      setPendingFriendRequestsCount(prev => Math.max(0, prev - 1));
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
  }, [socket, auth.isAuthenticated])

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
  });

  // Sprint 16: Swap request event listeners
  useEffect(() => {
    if (!socket || !gameId) return;

    const handleSwapRequestReceived = (data: { fromPlayerId: string; fromPlayerName: string; willChangeTeams: boolean }) => {
      setSwapRequest(data);
    };

    const handleSwapAccepted = (data: { message: string }) => {
      showToast(data.message, 'success', 3000);
    };

    const handleSwapRejected = (data: { message: string }) => {
      showToast(data.message, 'info', 3000);
    };

    socket.on('swap_request_received', handleSwapRequestReceived);
    socket.on('swap_accepted', handleSwapAccepted);
    socket.on('swap_rejected', handleSwapRejected);

    return () => {
      socket.off('swap_request_received', handleSwapRequestReceived);
      socket.off('swap_accepted', handleSwapAccepted);
      socket.off('swap_rejected', handleSwapRejected);
    };
  }, [socket, gameId, showToast]);

  // Task 10 Phase 2: Global keyboard shortcuts (? for help)
  useEffect(() => {
    const handleGlobalKeyboard = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // ? - Show keyboard shortcuts help
      if (e.key === '?' && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setShowKeyboardShortcuts(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyboard);
    return () => window.removeEventListener('keydown', handleGlobalKeyboard);
  }, []);

  // Sprint 5 Phase 2: Handle bot spawning on reconnection
  // This ensures bots continue playing after human player reconnects
  useEffect(() => {
    if (gameState && socket && gameState.players.some(p => p.isBot)) {
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
        spectatorName: spectatorName || undefined
      });
      setGameId(gameId);
    }
  };

  const handlePlaceBet = useCallback((amount: number, withoutTrump: boolean, skipped?: boolean) => {
    if (socket && gameId) {
      // Explicitly include all fields for .strict() validation
      socket.emit('place_bet', {
        gameId,
        amount,
        withoutTrump,
        skipped: skipped ?? false
      });
    }
  }, [socket, gameId]);

  const handlePlayCard = useCallback((card: Card) => {
    if (socket && gameId) {
      socket.emit('play_card', { gameId, card });
    }
  }, [socket, gameId]);

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

    const targetPlayer = gameState.players.find(p => p.id === targetPlayerId);
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
      accepted: true
    });

    setSwapRequest(null);
  };

  const handleRejectSwap = () => {
    if (!socket || !gameId || !swapRequest) return;

    socket.emit('respond_to_swap', {
      gameId,
      requesterId: swapRequest.fromPlayerId,
      accepted: false
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

    const currentPlayer = gameState.players.find(p => p.id === socket.id);

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
    const botCount = gameState.players.filter(p => p.isBot).length;

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
      playerName: currentPlayer.name
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
    setChatMessages(prev => [...prev, message]);
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

  // Sprint 5 Phase 3: Bot socket management functions now in useBotManagement hook
  // (spawnBotsForGame, handleAddBot, handleQuickPlay, handleBotAction)

  // Autoplay effect: now handled by useAutoplay hook

  if (error) {
    return (
      <div className="min-h-screen bg-purple-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-2">Error</h2>
          <p className="text-gray-700 dark:text-gray-300">{error}</p>
          <button
            onClick={() => {
              setError('');
              setGameState(null);
              setGameId('');
            }}
            className="mt-4 bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
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
        setAchievementNotification({ achievement, playerName: gameState?.players.find(p => p.id === socket?.id)?.name || '' });
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
    socket
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
        />
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
          <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-amber-900 via-orange-800 to-red-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center"><div className="text-white text-2xl">Loading...</div></div>}>
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
            />
          </Suspense>
        </ErrorBoundary>

        {/* Beginner Mode Tutorial */}
        {beginnerMode && socket?.id && (
          <ErrorBoundary componentName="BeginnerTutorial">
            <Suspense fallback={<div />}>
              <BeginnerTutorial
                gameState={gameState}
                currentPlayerId={socket.id}
              />
            </Suspense>
          </ErrorBoundary>
        )}
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
          <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center"><div className="text-white text-2xl">Loading...</div></div>}>
            <BettingPhase
            players={gameState.players}
            currentBets={gameState.currentBets}
            currentPlayerId={socket?.id || ''}
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
            socket={socket}
            gameId={gameId}
            chatMessages={chatMessages}
            onNewChatMessage={handleNewChatMessage}
          />
          </Suspense>
        </ErrorBoundary>

        {/* Beginner Mode Tutorial */}
        {beginnerMode && socket?.id && (
          <ErrorBoundary componentName="BeginnerTutorial">
            <Suspense fallback={<div />}>
              <BeginnerTutorial
                gameState={gameState}
                currentPlayerId={socket.id}
              />
            </Suspense>
          </ErrorBoundary>
        )}
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
          <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-green-900 via-teal-900 to-blue-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center"><div className="text-white text-2xl">Loading...</div></div>}>
            <PlayingPhase
          gameState={gameState}
          currentPlayerId={socket?.id || ''}
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
          onSwapPosition={handleSwapPosition}
          onClickPlayer={handleClickPlayer}
          socket={socket}
          gameId={gameId}
          chatMessages={chatMessages}
          onNewChatMessage={handleNewChatMessage}
          connectionStats={connectionStats}
        />
          </Suspense>
        </ErrorBoundary>

        {/* Beginner Mode Tutorial */}
        {beginnerMode && socket?.id && (
          <ErrorBoundary componentName="BeginnerTutorial">
            <Suspense fallback={<div />}>
              <BeginnerTutorial
                gameState={gameState}
                currentPlayerId={socket.id}
              />
            </Suspense>
          </ErrorBoundary>
        )}
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
          <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center"><div className="text-white text-2xl">Loading...</div></div>}>
            <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full">
                <RoundSummary
                  gameState={gameState}
                  onReady={handleReady}
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
                currentPlayerId={socket.id}
              />
            </Suspense>
          </ErrorBoundary>
        )}
      </>
    );
  }

  if (gameState.phase === 'game_over') {
    const winningTeam = gameState.teamScores.team1 >= 41 ? 1 : 2;
    const team1Players = gameState.players.filter(p => p.teamId === 1);
    const team2Players = gameState.players.filter(p => p.teamId === 2);

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
        <Suspense fallback={<div />}>
          <DebugPanel
            gameState={gameState}
            gameId={gameId}
            isOpen={debugPanelOpen}
            socket={socket}
            onClose={() => setDebugPanelOpen(false)}
          />
        </Suspense>
        <div className="min-h-screen bg-gradient-to-br from-amber-900 via-orange-800 to-red-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-6">
          <div className="bg-gradient-to-br from-parchment-50 to-parchment-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 shadow-2xl max-w-4xl w-full border-4 border-amber-700 dark:border-gray-600">
            {/* Victory Banner */}
            <div className="text-center mb-8">
              <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 mb-4 animate-pulse">
                🏆 Game Over! 🏆
              </h2>
              <div className={`text-6xl font-black mb-2 ${winningTeam === 1 ? 'text-orange-600' : 'text-purple-600'}`}>
                Team {winningTeam} Wins!
              </div>
              <p className="text-umber-600 font-semibold">Round {gameState.roundNumber}</p>
            </div>

            {/* Final Scores */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className={`text-center p-6 rounded-xl border-4 ${winningTeam === 1 ? 'bg-orange-100 border-orange-400 ring-4 ring-yellow-400' : 'bg-orange-50 border-orange-200'}`}>
                <div className="flex items-center justify-center gap-2 mb-2">
                  {winningTeam === 1 && <span className="text-3xl">👑</span>}
                  <h3 className="text-2xl font-bold text-orange-800">Team 1</h3>
                </div>
                <p data-testid="team1-final-score" className="text-6xl font-black text-orange-600">{gameState.teamScores.team1}</p>
                <p className="text-sm text-orange-700 mt-2">Final Score</p>
              </div>
              <div className={`text-center p-6 rounded-xl border-4 ${winningTeam === 2 ? 'bg-purple-100 border-purple-400 ring-4 ring-yellow-400' : 'bg-purple-50 border-purple-200'}`}>
                <div className="flex items-center justify-center gap-2 mb-2">
                  {winningTeam === 2 && <span className="text-3xl">👑</span>}
                  <h3 className="text-2xl font-bold text-purple-800">Team 2</h3>
                </div>
                <p data-testid="team2-final-score" className="text-6xl font-black text-purple-600">{gameState.teamScores.team2}</p>
                <p className="text-sm text-purple-700 mt-2">Final Score</p>
              </div>
            </div>

            {/* Player Stats */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              {/* Team 1 Players */}
              <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-4 border-2 border-orange-200 dark:border-orange-700">
                <h4 className="text-lg font-bold text-orange-800 dark:text-orange-300 mb-3 text-center">Team 1 Players</h4>
                <div className="space-y-2">
                  {team1Players.map(player => (
                    <div key={player.id} className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-orange-200 dark:border-orange-700">
                      <div className="font-semibold text-umber-900 dark:text-gray-100">{player.name}</div>
                      <div className="text-sm text-umber-700 dark:text-gray-300">
                        {player.tricksWon} tricks • {player.pointsWon} pts
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team 2 Players */}
              <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 border-2 border-purple-200 dark:border-purple-700">
                <h4 className="text-lg font-bold text-purple-800 dark:text-purple-300 mb-3 text-center">Team 2 Players</h4>
                <div className="space-y-2">
                  {team2Players.map(player => (
                    <div key={player.id} className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-purple-200 dark:border-purple-700">
                      <div className="font-semibold text-umber-900 dark:text-gray-100">{player.name}</div>
                      <div className="text-sm text-umber-700 dark:text-gray-300">
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
                <h3 className="text-2xl font-bold text-umber-900 dark:text-gray-100 mb-4 border-b-2 border-umber-400 dark:border-gray-600 pb-2 font-serif">
                  📜 Game History
                </h3>
                <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                  {gameState.roundHistory.slice().reverse().map((round) => {
                    const betPlayer = gameState.players.find(p => p.id === round.highestBet.playerId);

                    return (
                      <div
                        key={round.roundNumber}
                        className="bg-parchment-100 dark:bg-gray-700 rounded-lg p-4 border-2 border-parchment-400 dark:border-gray-600 hover:bg-parchment-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-lg font-bold text-umber-900 dark:text-gray-100">
                            Round {round.roundNumber}
                          </h4>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold border-2 ${
                            round.betMade
                              ? 'bg-green-100 text-green-800 border-green-400'
                              : 'bg-red-100 text-red-800 border-red-400'
                          }`}>
                            {round.betMade ? '✓ Bet Made' : '✗ Bet Failed'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div className="bg-parchment-50 dark:bg-gray-600 rounded p-2">
                            <p className="text-umber-600 dark:text-gray-300 font-semibold text-xs">Bidder</p>
                            <p className="font-bold text-umber-900 dark:text-gray-100">{betPlayer?.name || 'Unknown'}</p>
                            <p className="text-xs text-umber-600 dark:text-gray-400">Team {round.offensiveTeam}</p>
                          </div>
                          <div className="bg-parchment-50 dark:bg-gray-600 rounded p-2">
                            <p className="text-umber-600 dark:text-gray-300 font-semibold text-xs">Bet</p>
                            <p className="font-bold text-umber-900 dark:text-gray-100">{round.betAmount} points</p>
                            <p className="text-xs text-umber-600 dark:text-gray-400">
                              {round.withoutTrump ? 'No Trump (2x)' : 'With Trump'}
                            </p>
                          </div>
                          <div className="bg-parchment-50 dark:bg-gray-600 rounded p-2">
                            <p className="text-umber-600 dark:text-gray-300 font-semibold text-xs">Points Earned</p>
                            <p className="font-bold text-umber-900 dark:text-gray-100">
                              {round.offensivePoints} / {round.betAmount}
                            </p>
                            <p className="text-xs text-umber-600 dark:text-gray-400">
                              Defensive: {round.defensivePoints}
                            </p>
                          </div>
                          <div className="bg-parchment-50 dark:bg-gray-600 rounded p-2">
                            <p className="text-umber-600 dark:text-gray-300 font-semibold text-xs">Round Score</p>
                            <p className="font-bold">
                              <span className="text-orange-600">{round.roundScore.team1 >= 0 ? '+' : ''}{round.roundScore.team1}</span>
                              {' / '}
                              <span className="text-purple-600">{round.roundScore.team2 >= 0 ? '+' : ''}{round.roundScore.team2}</span>
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
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 border-2 border-purple-700 shadow-lg transform hover:scale-105"
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
          <ErrorBoundary fallback={<ReplayErrorFallback onClose={() => setShowReplayModal(false)} />}>
            <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center"><div className="text-white">Loading replay...</div></div>}>
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
            <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
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
            <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
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
                phase === 'team_selection' ? 'team_selection'
                : phase === 'betting' ? 'betting'
                : phase === 'playing' ? 'playing'
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
          <Suspense fallback={null}>
            {profilePlayerName && (
              <PlayerProfileModal
                playerName={profilePlayerName}
                socket={socket}
                isOpen={!!profilePlayerName}
                onClose={() => setProfilePlayerName(null)}
              />
            )}
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

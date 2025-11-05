import { useEffect, useState, useRef, useCallback } from 'react';
import { GameState, Card, PlayerSession } from './types/game';
import { Lobby } from './components/Lobby';
import { BettingPhase } from './components/BettingPhase';
import { PlayingPhase } from './components/PlayingPhase';
import { TeamSelection } from './components/TeamSelection';
import RoundSummary from './components/RoundSummary';
import { RematchVoting } from './components/RematchVoting';
import { DebugMultiPlayerView } from './components/DebugMultiPlayerView';
import { DebugPanel } from './components/DebugPanel';
import { TestPanel } from './components/TestPanel';
import { ReconnectingBanner } from './components/ReconnectingBanner';
import { CatchUpModal } from './components/CatchUpModal';
import { BotManagementPanel } from './components/BotManagementPanel';
import { BotTakeoverModal } from './components/BotTakeoverModal';
import { Toast } from './components/Toast';
import { ChatMessage } from './components/ChatPanel';
import { GameReplay } from './components/GameReplay';
import { AchievementUnlocked } from './components/AchievementUnlocked'; // Sprint 2 Phase 1
import { AchievementsPanel } from './components/AchievementsPanel'; // Sprint 2 Phase 1
import { Achievement } from './types/achievements'; // Sprint 2 Phase 1
import FriendsPanel from './components/FriendsPanel'; // Sprint 2 Phase 2
import FriendRequestNotificationComponent from './components/FriendRequestNotification'; // Sprint 2 Phase 2
import { FriendRequestNotification } from './types/friends'; // Sprint 2 Phase 2
import LoginModal from './components/LoginModal'; // Sprint 3 Phase 1
import RegisterModal from './components/RegisterModal'; // Sprint 3 Phase 1
import PasswordResetModal from './components/PasswordResetModal'; // Sprint 3 Phase 1
import EmailVerificationBanner from './components/EmailVerificationBanner'; // Sprint 3 Phase 1
import { useAuth } from './contexts/AuthContext'; // Sprint 3 Phase 1
import { NotificationCenter } from './components/NotificationCenter'; // Sprint 3 Phase 5
import { useNotifications } from './hooks/useNotifications'; // Sprint 3 Phase 5
// Use enhanced bot AI with advanced strategic concepts
import { EnhancedBotPlayer as BotPlayer, BotDifficulty } from './utils/botPlayerEnhanced';
// Fallback to original bot player if needed:
// import { BotPlayer, BotDifficulty } from './utils/botPlayer';
import { preloadCardImages } from './utils/imagePreloader';
import { ErrorBoundary } from './components/ErrorBoundary';
import { sounds } from './utils/sounds';
// Sprint 5 Phase 2: Custom hooks for state management
import { useSocketConnection, checkValidSession } from './hooks/useSocketConnection';
import { useGameState } from './hooks/useGameState';
import { useChatMessages } from './hooks/useChatMessages';
import { useToast } from './hooks/useToast';
// Sprint 5 Phase 3: Bot management hook
import { useBotManagement } from './hooks/useBotManagement';
// Sprint 6: Connection quality monitoring
import { useConnectionQuality } from './hooks/useConnectionQuality';

function App() {
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
    botManagementOpen,
    setBotManagementOpen,
    botTakeoverModal,
    setBotTakeoverModal,
    botSocketsRef,
    botTimeoutsRef,
    spawnBotsForGame,
    handleAddBot,
    handleQuickPlay,
    handleReplaceWithBot,
    handleChangeBotDifficulty,
    handleTakeOverBot,
    cleanupBotSocket,
  } = useBotManagement(socket, gameId, gameState);

  // Sprint 6: Connection quality monitoring
  const connectionStats = useConnectionQuality(socket);

  // Debug mode state
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [debugPanelOpen, setDebugPanelOpen] = useState<boolean>(false);
  const [testPanelOpen, setTestPanelOpen] = useState<boolean>(false);
  const [debugMenuOpen, setDebugMenuOpen] = useState<boolean>(false);

  // UI state
  const [hasValidSession, setHasValidSession] = useState<boolean>(false);
  const [autoplayEnabled, setAutoplayEnabled] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showReplayModal, setShowReplayModal] = useState<boolean>(false);
  const [autoJoinGameId, setAutoJoinGameId] = useState<string>(''); // URL parameter for auto-join from shared links
  const autoplayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAutoActionRef = useRef<{ message: string; timestamp: number } | null>(null);

  // Sprint 2 Phase 1: Achievement state
  const [achievementNotification, setAchievementNotification] = useState<{ achievement: Achievement; playerName: string } | null>(null);
  const [showAchievementsPanel, setShowAchievementsPanel] = useState<boolean>(false);

  // Sprint 2 Phase 2: Friends state
  const [showFriendsPanel, setShowFriendsPanel] = useState<boolean>(false);
  const [friendRequestNotification, setFriendRequestNotification] = useState<FriendRequestNotification | null>(null);

  // Sprint 3 Phase 1: Authentication state
  const auth = useAuth();
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState<boolean>(false);

  // Sprint 3 Phase 5: Notification state
  useNotifications(socket, auth?.isAuthenticated || false);

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

  // Sprint 1 Phase 6: Play game over sound when game ends
  useEffect(() => {
    if (gameState && gameState.phase === 'game_over') {
      sounds.gameOver();
    }
  }, [gameState?.phase]);

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
    if (!socket) return;

    const handleFriendRequestReceived = (notification: FriendRequestNotification) => {
      // Show toast notification
      setFriendRequestNotification(notification);
    };

    socket.on('friend_request_received', handleFriendRequestReceived);

    return () => {
      socket.off('friend_request_received', handleFriendRequestReceived);
    };
  }, [socket])

  // Sprint 5 Phase 2: Additional socket event listeners not handled by hooks
  // These events have UI-specific side effects (toasts, bot management, spectator mode)
  useEffect(() => {
    if (!socket) return;

    // Player disconnection with toast notification
    const handlePlayerDisconnected = ({ playerId, waitingForReconnection }: { playerId: string; waitingForReconnection: boolean }) => {
      if (waitingForReconnection && gameState) {
        const player = gameState.players.find(p => p.id === playerId);
        if (player) {
          showToast(`${player.name} disconnected`, 'warning');
        }
      }
    };

    // Online players list updates
    const handleOnlinePlayersUpdate = (players: typeof onlinePlayers) => {
      setOnlinePlayers(players);
    };

    // Timeout warnings
    const handleTimeoutWarning = ({ playerName, secondsRemaining }: { playerName: string; secondsRemaining: number }) => {
      const message = `⏰ ${playerName === (gameState?.players.find(p => p.id === socket.id)?.name) ? 'You have' : `${playerName} has`} ${secondsRemaining} seconds!`;
      showToast(message, 'warning');
    };

    // Auto-action notifications with deduplication to prevent flickering
    const handleAutoActionTaken = ({ playerName, phase }: { playerName: string; phase: 'betting' | 'playing' }) => {
      const message = `🤖 Auto-${phase === 'betting' ? 'bet' : 'play'} for ${playerName}`;
      const now = Date.now();

      // Only show toast if it's a different message OR more than 2 seconds have passed
      if (!lastAutoActionRef.current ||
          lastAutoActionRef.current.message !== message ||
          now - lastAutoActionRef.current.timestamp > 2000) {
        showToast(message, 'info', 1500); // Shorter duration for auto-actions
        lastAutoActionRef.current = { message, timestamp: now };
      }
    };

    // Error events
    const handleError = ({ message }: { message: string }) => {
      sounds.error(); // Sprint 1 Phase 6
      setError(message);
    };

    // Player left
    const handlePlayerLeft = ({ gameState: newGameState }: { gameState: GameState }) => {
      setGameState(newGameState);
    };

    // Kicked from game
    const handleKickedFromGame = ({ message }: { message: string }) => {
      showToast(message, 'error', 5000);
      sessionStorage.removeItem('gameSession');
      setGameState(null);
      setGameId('');
      setIsSpectator(false);
    };

    // Leave game success
    const handleLeaveGameSuccess = () => {
      sessionStorage.removeItem('gameSession');
      setGameState(null);
      setGameId('');
      setIsSpectator(false);
    };

    // Spectator joined
    const handleSpectatorJoined = ({ gameState: newGameState }: { gameState: GameState }) => {
      setIsSpectator(true);
      setGameId(newGameState.id);
      setGameState(newGameState);
    };

    // Bot management events
    const handleBotReplaced = ({ gameState: newGameState, replacedPlayerName, botName }: {
      gameState: GameState;
      replacedPlayerName: string;
      botName: string;
    }) => {
      setGameState(newGameState);
      showToast(`${replacedPlayerName} has been replaced by ${botName}`, 'info');
      spawnBotsForGame(newGameState);
    };

    // Sprint 6: Handle player self-replacement
    const handlePlayerReplacedSelf = ({ gameState: newGameState, replacedPlayerName, botName }: {
      gameState: GameState;
      replacedPlayerName: string;
      botName: string;
    }) => {
      setGameState(newGameState);
      showToast(`${replacedPlayerName} left and was replaced by ${botName}`, 'info');
      spawnBotsForGame(newGameState);
    };

    const handleBotTakenOver = ({ gameState: newGameState, botName, newPlayerName, session }: {
      gameState: GameState;
      botName: string;
      newPlayerName: string;
      session: PlayerSession | null;
    }) => {
      setGameState(newGameState);
      showToast(`${botName} has been taken over by ${newPlayerName}`, 'info');

      if (session) {
        sessionStorage.setItem('gameSession', JSON.stringify(session));
      }

      // Cleanup bot socket using hook function
      cleanupBotSocket(botName);
    };

    const handleReplacedByBot = ({ message }: { message: string; gameId: string }) => {
      showToast(message, 'warning', 5000);
      sessionStorage.removeItem('gameSession');
      setGameState(null);
      setGameId('');
      setIsSpectator(false);
    };

    const handleGameFullWithBots = ({ gameId, availableBots }: {
      gameId: string;
      availableBots: Array<{ name: string; teamId: 1 | 2; difficulty: BotDifficulty }>;
    }) => {
      const storedPlayerName = localStorage.getItem('playerName') || '';

      // If user arrived via share link (autoJoinGameId is set), automatically take over first available bot
      if (autoJoinGameId === gameId && storedPlayerName && availableBots.length > 0) {
        console.log(`[Auto-Join] Automatically taking over bot for share link join. GameId: ${gameId}, PlayerName: ${storedPlayerName}, Bot: ${availableBots[0].name}`);

        // Automatically take over the first available bot
        if (socket) {
          socket.emit('take_over_bot', {
            gameId,
            playerName: storedPlayerName,
            botName: availableBots[0].name
          });
        }
        return;
      }

      // Otherwise show the bot takeover modal
      setBotTakeoverModal({
        gameId,
        availableBots,
        playerName: storedPlayerName
      });
    };

    // Register all event listeners
    socket.on('player_disconnected', handlePlayerDisconnected);
    socket.on('online_players_update', handleOnlinePlayersUpdate);
    socket.on('timeout_warning', handleTimeoutWarning);
    socket.on('auto_action_taken', handleAutoActionTaken);
    socket.on('error', handleError);
    socket.on('player_left', handlePlayerLeft);
    socket.on('kicked_from_game', handleKickedFromGame);
    socket.on('leave_game_success', handleLeaveGameSuccess);
    socket.on('spectator_joined', handleSpectatorJoined);
    socket.on('bot_replaced', handleBotReplaced);
    socket.on('player_replaced_self', handlePlayerReplacedSelf);
    socket.on('bot_taken_over', handleBotTakenOver);
    socket.on('replaced_by_bot', handleReplacedByBot);
    socket.on('game_full_with_bots', handleGameFullWithBots);

    // Cleanup function
    return () => {
      socket.off('player_disconnected', handlePlayerDisconnected);
      socket.off('online_players_update', handleOnlinePlayersUpdate);
      socket.off('timeout_warning', handleTimeoutWarning);
      socket.off('auto_action_taken', handleAutoActionTaken);
      socket.off('error', handleError);
      socket.off('player_left', handlePlayerLeft);
      socket.off('kicked_from_game', handleKickedFromGame);
      socket.off('leave_game_success', handleLeaveGameSuccess);
      socket.off('spectator_joined', handleSpectatorJoined);
      socket.off('bot_replaced', handleBotReplaced);
      socket.off('player_replaced_self', handlePlayerReplacedSelf);
      socket.off('bot_taken_over', handleBotTakenOver);
      socket.off('replaced_by_bot', handleReplacedByBot);
      socket.off('game_full_with_bots', handleGameFullWithBots);
    };
  }, [socket, gameState, showToast, setError, setGameState, setGameId, setIsSpectator, spawnBotsForGame, cleanupBotSocket, autoJoinGameId]);

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

  // URL parameter parsing for auto-join from shared links
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinGameId = urlParams.get('join');

    if (joinGameId) {
      setAutoJoinGameId(joinGameId);

      // Clean the URL without reloading the page
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleCreateGame = (playerName: string, persistenceMode: 'elo' | 'casual' = 'elo') => {
    if (socket) {
      // Store player name in localStorage for persistence
      localStorage.setItem('playerName', playerName);
      socket.emit('create_game', { playerName, persistenceMode });
    }
  };

  const handleJoinGame = (gameId: string, playerName: string) => {
    if (socket) {
      // Store player name in localStorage for persistence
      localStorage.setItem('playerName', playerName);
      socket.emit('join_game', { gameId, playerName });
      setGameId(gameId);
    }
  };

  const handleSpectateGame = (gameId: string, spectatorName?: string) => {
    if (socket) {
      socket.emit('spectate_game', { gameId, spectatorName });
      setGameId(gameId);
    }
  };

  const handlePlaceBet = useCallback((amount: number, withoutTrump: boolean, skipped?: boolean) => {
    if (socket && gameId) {
      socket.emit('place_bet', { gameId, amount, withoutTrump, skipped });
    }
  }, [socket, gameId]);

  const handlePlayCard = useCallback((card: Card) => {
    if (socket && gameId) {
      socket.emit('play_card', { gameId, card });
    }
  }, [socket, gameId]);

  const handleSelectTeam = (teamId: 1 | 2) => {
    if (socket && gameId) {
      socket.emit('select_team', { gameId, teamId });
    }
  };

  const handleSwapPosition = (targetPlayerId: string) => {
    if (socket && gameId) {
      socket.emit('swap_position', { gameId, targetPlayerId });
    }
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
      // Clear chat messages when leaving game
      setChatMessages([]);

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
      // Clear chat messages when leaving game
      setChatMessages([]);

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

  // Autoplay toggle handler (stable reference to prevent infinite re-renders)
  const handleAutoplayToggle = useCallback(() => {
    setAutoplayEnabled(prev => !prev);
  }, []);

  // Sound toggle handler
  const toggleSound = useCallback(() => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    sounds.setEnabled(newState);
    if (newState) {
      sounds.buttonClick(); // Play test sound when enabling
    }
  }, [soundEnabled]);

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

  // Autoplay effect: when enabled and it's the player's turn, act as a bot
  // Extract specific values from gameState to prevent infinite re-renders
  const phase = gameState?.phase;
  const currentPlayerIndex = gameState?.currentPlayerIndex;
  const currentPlayerId = gameState?.players[currentPlayerIndex || 0]?.id;
  const playersReadyList = gameState?.playersReady;

  useEffect(() => {
    if (!autoplayEnabled || !gameState || !socket) return;
    if (phase !== 'betting' && phase !== 'playing' && phase !== 'scoring') return;

    const myPlayerId = socket.id || '';

    // For scoring phase, auto-ready
    if (phase === 'scoring') {
      // playersReady now stores names, not IDs
      const me = gameState.players.find(p => p.id === myPlayerId);
      const isAlreadyReady = me ? (playersReadyList?.includes(me.name) || false) : false;
      if (!isAlreadyReady) {
        // Clear any existing autoplay timeout
        if (autoplayTimeoutRef.current) {
          clearTimeout(autoplayTimeoutRef.current);
          autoplayTimeoutRef.current = null;
        }

        // Schedule ready action with bot delay
        autoplayTimeoutRef.current = setTimeout(() => {
          socket.emit('player_ready', { gameId: gameState.id });
          autoplayTimeoutRef.current = null;
        }, BotPlayer.getActionDelay());
      }
      return;
    }

    // Only act if it's my turn (use extracted currentPlayerId to prevent stale closure)
    if (!currentPlayerId || currentPlayerId !== myPlayerId) return;

    // Clear any existing autoplay timeout
    if (autoplayTimeoutRef.current) {
      clearTimeout(autoplayTimeoutRef.current);
      autoplayTimeoutRef.current = null;
    }

    // Schedule autoplay action with bot delay
    autoplayTimeoutRef.current = setTimeout(() => {
      if (phase === 'betting') {
        const bet = BotPlayer.makeBet(gameState, myPlayerId);
        handlePlaceBet(bet.amount, bet.withoutTrump, bet.skipped);
      } else if (phase === 'playing') {
        const card = BotPlayer.playCard(gameState, myPlayerId);
        if (card) {
          handlePlayCard(card);
        }
      }
      autoplayTimeoutRef.current = null;
    }, BotPlayer.getActionDelay());

    return () => {
      if (autoplayTimeoutRef.current) {
        clearTimeout(autoplayTimeoutRef.current);
        autoplayTimeoutRef.current = null;
      }
    };
  }, [autoplayEnabled, phase, currentPlayerId, playersReadyList, socket, gameState, handlePlaceBet, handlePlayCard]);

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

  // Global UI components (shown across all phases)
  const GlobalUI = () => (
    <>
      {reconnecting && <ReconnectingBanner attempt={reconnectAttempt} maxAttempts={10} />}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      {gameState && (
        <CatchUpModal
          gameState={gameState}
          currentPlayerId={socket?.id || ''}
          isOpen={showCatchUpModal}
          onClose={() => setShowCatchUpModal(false)}
        />
      )}
      <BotManagementPanel
        isOpen={botManagementOpen}
        onClose={() => setBotManagementOpen(false)}
        gameState={gameState}
        currentPlayerId={socket?.id || ''}
        onReplaceWithBot={handleReplaceWithBot}
        onChangeBotDifficulty={handleChangeBotDifficulty}
      />
      {botTakeoverModal && (
        <BotTakeoverModal
          isOpen={!!botTakeoverModal}
          availableBots={botTakeoverModal.availableBots}
          onTakeOver={handleTakeOverBot}
          onCancel={() => {
            setBotTakeoverModal(null);
          }}
        />
      )}
      {/* Sprint 2 Phase 1: Achievement system UI */}
      {achievementNotification && (
        <AchievementUnlocked
          achievement={{
            achievement_id: achievementNotification.achievement.achievement_key,
            name: achievementNotification.achievement.achievement_name,
            description: achievementNotification.achievement.description,
            icon: achievementNotification.achievement.icon,
            rarity: achievementNotification.achievement.tier === 'bronze' ? 'common' :
                    achievementNotification.achievement.tier === 'silver' ? 'rare' :
                    achievementNotification.achievement.tier === 'gold' ? 'epic' : 'legendary'
          }}
          onDismiss={() => setAchievementNotification(null)}
        />
      )}
      {gameState && (
        <AchievementsPanel
          isOpen={showAchievementsPanel}
          onClose={() => setShowAchievementsPanel(false)}
          socket={socket}
          playerName={gameState.players.find(p => p.id === socket?.id)?.name || ''}
        />
      )}
      {/* Sprint 2 Phase 2: Friends system UI */}
      {friendRequestNotification && (
        <FriendRequestNotificationComponent
          notification={friendRequestNotification}
          onClose={() => setFriendRequestNotification(null)}
          onView={() => setShowFriendsPanel(true)}
        />
      )}
      {gameState && (
        <FriendsPanel
          isOpen={showFriendsPanel}
          onClose={() => setShowFriendsPanel(false)}
          socket={socket}
          currentPlayer={gameState.players.find(p => p.id === socket?.id)?.name || ''}
        />
      )}
      {/* Sprint 3 Phase 5: Notification Center */}
      <NotificationCenter
        socket={socket}
        isAuthenticated={auth.isAuthenticated}
      />
      {/* Sprint 3 Phase 1: Authentication UI */}
      <EmailVerificationBanner />
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
        }}
        onSwitchToPasswordReset={() => {
          setShowLoginModal(false);
          setShowPasswordResetModal(true);
        }}
      />
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={() => {
          setShowRegisterModal(false);
          setShowLoginModal(true);
        }}
      />
      <PasswordResetModal
        isOpen={showPasswordResetModal}
        onClose={() => setShowPasswordResetModal(false)}
        onSwitchToLogin={() => {
          setShowPasswordResetModal(false);
          setShowLoginModal(true);
        }}
      />
    </>
  );

  if (!gameState) {
    return (
      <>
        <GlobalUI />
    
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
          onShowLogin={() => setShowLoginModal(true)}
          onShowRegister={() => setShowRegisterModal(true)}
          onBotDifficultyChange={setBotDifficulty}
        />
      </>
    );
  }

  // Debug controls - can be controlled via environment variable
  // Currently enabled for all environments (set to false to hide)
  // To disable: set VITE_DEBUG_ENABLED=false in .env
  const DEBUG_ENABLED = import.meta.env.VITE_DEBUG_ENABLED !== 'false';

  const DebugControls = () => (
    <div className="fixed top-4 right-4 z-50">
      {/* Debug Menu Button */}
      {DEBUG_ENABLED && (
        <button
          onClick={() => setDebugMenuOpen(!debugMenuOpen)}
          className="bg-gray-800 bg-opacity-80 hover:bg-opacity-90 text-white px-3 py-2 rounded-lg shadow-lg font-bold transition-all flex items-center gap-2 backdrop-blur-sm"
          title="Debug Menu"
          aria-label="Open debug menu"
        >
          ⚙️ Debug
        </button>
      )}

      {/* Dropdown Menu */}
      {debugMenuOpen && (
        <div className="absolute top-12 right-0 bg-white dark:bg-gray-800 bg-opacity-95 dark:bg-opacity-95 rounded-lg shadow-2xl p-2 min-w-[160px] backdrop-blur-sm">
          <button
            onClick={() => {
              setTestPanelOpen(true);
              setDebugMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            🧪 Test Panel
          </button>
          <button
            onClick={() => {
              setDebugPanelOpen(true);
              setDebugMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            🔍 Game State
          </button>
          {gameState && gameState.players.length === 4 && (
            <button
              onClick={() => {
                setDebugMode(!debugMode);
                setDebugMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded hover:bg-yellow-50 dark:hover:bg-yellow-900/30 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              {debugMode ? '👤 Single View' : '🐛 4-Player View'}
            </button>
          )}
        </div>
      )}
    </div>
  );

  // Render TestPanel alongside other components
  const renderTestPanel = () => (
    <TestPanel
      gameState={gameState}
      socket={socket}
      isOpen={testPanelOpen}
      onClose={() => setTestPanelOpen(false)}
    />
  );

  // If debug mode is enabled, use the multi-player view
  if (debugMode && gameState.players.length === 4) {
    return (
      <>
        <DebugControls />
        {renderTestPanel()}
        <DebugPanel
          gameState={gameState}
          gameId={gameId}
          isOpen={debugPanelOpen}
          onClose={() => setDebugPanelOpen(false)}
        />
        <DebugMultiPlayerView
          gameState={gameState}
          gameId={gameId}
          onPlaceBet={handlePlaceBet}
          onPlayCard={handlePlayCard}
          onSelectTeam={handleSelectTeam}
          onSwapPosition={handleSwapPosition}
          onStartGame={handleStartGame}
        />
      </>
    );
  }

  if (gameState.phase === 'team_selection') {
    return (
      <>
        <GlobalUI />
        <DebugControls />
        {renderTestPanel()}
        <DebugPanel
          gameState={gameState}
          gameId={gameId}
          isOpen={debugPanelOpen}
          onClose={() => setDebugPanelOpen(false)}
        />
        <TeamSelection
          players={gameState.players}
          gameId={gameId}
          currentPlayerId={socket?.id || ''}
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
      </>
    );
  }

  if (gameState.phase === 'betting') {
    return (
      <>
        <GlobalUI />
        <DebugControls />
        {renderTestPanel()}
        <DebugPanel
          gameState={gameState}
          gameId={gameId}
          isOpen={debugPanelOpen}
          onClose={() => setDebugPanelOpen(false)}
        />
        <ErrorBoundary>
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
            onAutoplayToggle={handleAutoplayToggle}
            onOpenBotManagement={() => setBotManagementOpen(true)}
            onOpenAchievements={() => setShowAchievementsPanel(true)}
            onOpenFriends={() => setShowFriendsPanel(true)}
            socket={socket}
            gameId={gameId}
            chatMessages={chatMessages}
            onNewChatMessage={handleNewChatMessage}
          />
        </ErrorBoundary>
      </>
    );
  }

  if (gameState.phase === 'playing') {
    return (
      <>
        <GlobalUI />
        <DebugControls />
        {renderTestPanel()}
        <DebugPanel
          gameState={gameState}
          gameId={gameId}
          isOpen={debugPanelOpen}
          onClose={() => setDebugPanelOpen(false)}
        />
        <ErrorBoundary>
          <PlayingPhase
          gameState={gameState}
          currentPlayerId={socket?.id || ''}
          onPlayCard={handlePlayCard}
          isSpectator={isSpectator}
          currentTrickWinnerId={currentTrickWinnerId}
          onLeaveGame={handleLeaveGame}
          autoplayEnabled={autoplayEnabled}
          onAutoplayToggle={handleAutoplayToggle}
          soundEnabled={soundEnabled}
          onSoundToggle={toggleSound}
          onOpenBotManagement={() => setBotManagementOpen(true)}
          onOpenAchievements={() => setShowAchievementsPanel(true)}
          onOpenFriends={() => setShowFriendsPanel(true)}
          socket={socket}
          gameId={gameId}
          chatMessages={chatMessages}
          onNewChatMessage={handleNewChatMessage}
          connectionStats={connectionStats}
        />
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
        <GlobalUI />
        <DebugControls />
        {renderTestPanel()}
        <DebugPanel
          gameState={gameState}
          gameId={gameId}
          isOpen={debugPanelOpen}
          onClose={() => setDebugPanelOpen(false)}
        />
        <ErrorBoundary>
          <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full">
              <RoundSummary
                gameState={gameState}
                onReady={handleReady}
              />
            </div>
          </div>
        </ErrorBoundary>
      </>
    );
  }

  if (gameState.phase === 'game_over') {
    const winningTeam = gameState.teamScores.team1 >= 41 ? 1 : 2;
    const team1Players = gameState.players.filter(p => p.teamId === 1);
    const team2Players = gameState.players.filter(p => p.teamId === 2);

    return (
      <>
        <GlobalUI />
        <DebugControls />
        {renderTestPanel()}
        <DebugPanel
          gameState={gameState}
          gameId={gameId}
          isOpen={debugPanelOpen}
          onClose={() => setDebugPanelOpen(false)}
        />
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
              <RematchVoting
                socket={socket}
                gameId={gameId}
                gameState={gameState}
                currentPlayerId={socket?.id || ''}
              />
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
          <GameReplay
            gameId={gameId}
            socket={socket}
            onClose={() => setShowReplayModal(false)}
          />
        )}
      </>
    );
  }

  return null;
}

export default App;

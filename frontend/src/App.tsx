import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, Card, PlayerSession } from './types/game';
import { Lobby } from './components/Lobby';
import { BettingPhase } from './components/BettingPhase';
import { PlayingPhase } from './components/PlayingPhase';
import { TeamSelection } from './components/TeamSelection';
import { ScoringPhase } from './components/ScoringPhase';
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
// Use enhanced bot AI with advanced strategic concepts
import { EnhancedBotPlayer as BotPlayer, BotDifficulty } from './utils/botPlayerEnhanced';
// Fallback to original bot player if needed:
// import { BotPlayer, BotDifficulty } from './utils/botPlayer';
import { preloadCardImages } from './utils/imagePreloader';
import { ErrorBoundary } from './components/ErrorBoundary';
// Sprint 5 Phase 2: Custom hooks for state management
import { useSocketConnection, checkValidSession } from './hooks/useSocketConnection';
import { useGameState } from './hooks/useGameState';
import { useChatMessages } from './hooks/useChatMessages';
import { useToast } from './hooks/useToast';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

function App() {
  // Sprint 5 Phase 2: Use custom hooks for socket connection and core game state
  const { socket, reconnecting, error, setError } = useSocketConnection();
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

  // Bot management state and refs
  const botSocketsRef = useRef<Map<string, Socket>>(new Map()); // Track bot sockets by bot player NAME (stable across reconnects)
  const botTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const botDifficultiesRef = useRef<Map<string, BotDifficulty>>(new Map()); // Track per-bot difficulty by bot name
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('medium');
  const [botManagementOpen, setBotManagementOpen] = useState<boolean>(false);
  const [botTakeoverModal, setBotTakeoverModal] = useState<{
    gameId: string;
    availableBots: Array<{ name: string; teamId: 1 | 2; difficulty: BotDifficulty }>;
    playerName: string;
  } | null>(null);

  // Debug mode state
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [debugPanelOpen, setDebugPanelOpen] = useState<boolean>(false);
  const [testPanelOpen, setTestPanelOpen] = useState<boolean>(false);
  const [debugMenuOpen, setDebugMenuOpen] = useState<boolean>(false);

  // UI state
  const [hasValidSession, setHasValidSession] = useState<boolean>(false);
  const [autoplayEnabled, setAutoplayEnabled] = useState<boolean>(false);
  const [showReplayModal, setShowReplayModal] = useState<boolean>(false);
  const autoplayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  }, [])

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

    // Auto-action notifications
    const handleAutoActionTaken = ({ playerName, phase }: { playerName: string; phase: 'betting' | 'playing' }) => {
      showToast(`🤖 Auto-${phase === 'betting' ? 'bet' : 'play'} for ${playerName}`, 'info');
    };

    // Error events
    const handleError = ({ message }: { message: string }) => {
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

      const botSocket = botSocketsRef.current.get(botName);
      if (botSocket) {
        botSocket.disconnect();
        botSocketsRef.current.delete(botName);
      }
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
      const storedPlayerName = localStorage.getItem('pendingPlayerName') || '';
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
      socket.off('bot_taken_over', handleBotTakenOver);
      socket.off('replaced_by_bot', handleReplacedByBot);
      socket.off('game_full_with_bots', handleGameFullWithBots);
    };
  }, [socket, gameState, showToast, setError, setGameState, setGameId, setIsSpectator, botSocketsRef]);

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
  const [autoJoinGameId, setAutoJoinGameId] = useState<string>('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinGameId = urlParams.get('join');

    if (joinGameId) {
      setAutoJoinGameId(joinGameId);

      // Clean the URL without reloading the page
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleCreateGame = (playerName: string) => {
    if (socket) {
      socket.emit('create_game', playerName);
    }
  };

  const handleJoinGame = (gameId: string, playerName: string) => {
    if (socket) {
      // Store player name temporarily in case game is full with bots
      localStorage.setItem('pendingPlayerName', playerName);
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

  const handlePlaceBet = (amount: number, withoutTrump: boolean, skipped?: boolean) => {
    if (socket && gameId) {
      socket.emit('place_bet', { gameId, amount, withoutTrump, skipped });
    }
  };

  const handlePlayCard = (card: Card) => {
    if (socket && gameId) {
      socket.emit('play_card', { gameId, card });
    }
  };

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
    if (socket && gameId) {
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
    }
  };

  const handleKickPlayer = (playerId: string) => {
    if (socket && gameId) {
      socket.emit('kick_player', { gameId, playerId });
    }
  };

  // Bot management handlers
  const handleReplaceWithBot = (playerNameToReplace: string) => {
    if (socket && gameId && gameState) {
      const currentPlayer = gameState.players.find(p => p.id === socket.id);
      if (currentPlayer) {
        socket.emit('replace_with_bot', {
          gameId,
          playerNameToReplace,
          requestingPlayerName: currentPlayer.name
        });
      }
    }
  };

  const handleChangeBotDifficulty = (botName: string, difficulty: BotDifficulty) => {
    // Update local ref immediately for responsiveness
    botDifficultiesRef.current.set(botName, difficulty);

    // Emit to server to update game state
    if (socket && gameId) {
      socket.emit('change_bot_difficulty', {
        gameId,
        botName,
        difficulty
      });
    }
  };

  const handleTakeOverBot = (botName: string) => {
    if (socket && botTakeoverModal) {
      socket.emit('take_over_bot', {
        gameId: botTakeoverModal.gameId,
        botNameToReplace: botName,
        newPlayerName: botTakeoverModal.playerName
      });
      // Clear the pending player name
      localStorage.removeItem('pendingPlayerName');
      // Close the modal
      setBotTakeoverModal(null);
    }
  };

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

  // Helper function to spawn bot sockets for existing bot players
  const spawnBotsForGame = (gameState: GameState) => {
    const botPlayers = gameState.players.filter(p => p.isBot);

    if (botPlayers.length === 0) return;


    botPlayers.forEach(botPlayer => {
      const botName = botPlayer.name;

      // Initialize bot difficulty from gameState if not already set
      if (botPlayer.botDifficulty && !botDifficultiesRef.current.has(botName)) {
        botDifficultiesRef.current.set(botName, botPlayer.botDifficulty);
      } else if (!botDifficultiesRef.current.has(botName)) {
        // Default to 'hard' if not specified
        botDifficultiesRef.current.set(botName, 'hard');
      }

      // Skip if bot socket already exists and is connected (using name as stable key)
      const existingBotSocket = botSocketsRef.current.get(botName);
      if (existingBotSocket && existingBotSocket.connected) {
        console.log(`Bot ${botName} already connected, skipping spawn`);
        return;
      }

      // Disconnect existing socket if any
      if (existingBotSocket) {
        console.log(`Disconnecting stale bot socket for ${botName}`);
        existingBotSocket.disconnect();
        botSocketsRef.current.delete(botName);
      }

      // Create new socket for the bot
      console.log(`Spawning new bot socket for ${botName}`);
      const botSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
      });

      // Store the bot socket reference using NAME as key (stable across reconnects)
      botSocketsRef.current.set(botName, botSocket);

      botSocket.on('connect', () => {
        // Join as a fresh bot connection (server will handle reconnection internally)
        botSocket.emit('join_game', { gameId: gameState.id, playerName: botName, isBot: true });
      });

      botSocket.on('player_joined', ({ player, gameState: newState }: { player?: any; gameState: GameState; session?: PlayerSession }) => {
        // Use the player ID from the game state, not botSocket.id
        const botPlayerId = player?.id || newState.players.find(p => p.name === botName && p.isBot)?.id;
        if (botPlayerId) {
          handleBotAction(botSocket, newState, botPlayerId);
        }
      });

      // Listen to all game state updates
      botSocket.on('game_updated', (state: GameState) => {
        // Find the bot's current player ID in the game state
        const botPlayerId = state.players.find(p => p.name === botName && p.isBot)?.id;
        if (botPlayerId) {
          handleBotAction(botSocket, state, botPlayerId);
        }
      });

      botSocket.on('round_started', (state: GameState) => {
        const botPlayerId = state.players.find(p => p.name === botName && p.isBot)?.id;
        if (botPlayerId) {
          handleBotAction(botSocket, state, botPlayerId);
        }
      });

      botSocket.on('trick_resolved', ({ gameState: newState }: { gameState: GameState }) => {
        const botPlayerId = newState.players.find(p => p.name === botName && p.isBot)?.id;
        if (botPlayerId) {
          handleBotAction(botSocket, newState, botPlayerId);
        }
      });

      botSocket.on('round_ended', (state: GameState) => {
        const botPlayerId = state.players.find(p => p.name === botName && p.isBot)?.id;
        if (botPlayerId) {
          handleBotAction(botSocket, state, botPlayerId);
        }
      });
    });
  };

  // Add a single bot to existing game
  const handleAddBot = () => {
    if (!socket || !gameId) return;

    // Find next available bot number (1-3, matching backend limit)
    const existingBotNumbers = gameState?.players
      .filter(p => p.name.startsWith('Bot '))
      .map(p => parseInt(p.name.replace('Bot ', '')))
      .filter(n => !isNaN(n)) || [];

    let botNumber = 1;
    while (existingBotNumbers.includes(botNumber) && botNumber <= 3) {
      botNumber++;
    }

    const botName = `Bot ${botNumber}`;

    const botSocket = io(SOCKET_URL);

    botSocket.on('connect', () => {
      botSocket.emit('join_game', { gameId, playerName: botName, isBot: true });
    });

    botSocket.on('player_joined', ({ gameState: state }: { gameState: GameState }) => {
      // Store bot socket reference
      const botPlayer = state.players.find(p => p.name === botName && p.isBot);
      if (botPlayer) {
        botSocketsRef.current.set(botPlayer.id, botSocket);
      }
      handleBotAction(botSocket, state, botSocket.id || '');
    });

    botSocket.on('game_updated', (state: GameState) => {
      handleBotAction(botSocket, state, botSocket.id || '');
    });

    botSocket.on('round_started', (state: GameState) => {
      handleBotAction(botSocket, state, botSocket.id || '');
    });

    botSocket.on('trick_resolved', ({ gameState: newState }: { gameState: GameState }) => {
      handleBotAction(botSocket, newState, botSocket.id || '');
    });

    botSocket.on('round_ended', (state: GameState) => {
      handleBotAction(botSocket, state, botSocket.id || '');
    });
  };

  // Bot player functionality
  const handleQuickPlay = (difficulty: BotDifficulty) => {
    if (!socket) return;

    // Set the bot difficulty globally
    BotPlayer.setDifficulty(difficulty);

    // Listen for game creation to spawn bots
    const gameCreatedHandler = ({ gameId: createdGameId }: { gameId: string }) => {
      // Spawn 3 bot players after game is created
      setTimeout(() => {
        for (let i = 0; i < 3; i++) {
          const botSocket = io(SOCKET_URL);
          const botName = `Bot ${i + 1}`;

          botSocket.on('connect', () => {
            botSocket.emit('join_game', { gameId: createdGameId, playerName: botName, isBot: true });
          });

          // Listen to all game state updates
          botSocket.on('player_joined', ({ gameState: newGameState }: { gameState: GameState; session?: PlayerSession }) => {
            // Store bot socket reference using the bot's player ID
            const botPlayer = newGameState.players.find(p => p.name === botName && p.isBot);
            if (botPlayer) {
              botSocketsRef.current.set(botPlayer.id, botSocket);
            }
            // Don't save bot sessions to localStorage - they are ephemeral
            // and should not interfere with human player reconnection
            handleBotAction(botSocket, newGameState, botSocket.id || '');
          });

          botSocket.on('game_updated', (state: GameState) => {
            handleBotAction(botSocket, state, botSocket.id || '');
          });

          botSocket.on('round_started', (state: GameState) => {
            handleBotAction(botSocket, state, botSocket.id || '');
          });

          botSocket.on('trick_resolved', ({ gameState }: { gameState: GameState }) => {
            handleBotAction(botSocket, gameState, botSocket.id || '');
          });

          botSocket.on('round_ended', (state: GameState) => {
            handleBotAction(botSocket, state, botSocket.id || '');
          });
        }
      }, 500);

      // Remove the listener after bots are spawned
      socket.off('game_created', gameCreatedHandler);
    };

    socket.on('game_created', gameCreatedHandler);

    // Create game with player
    socket.emit('create_game', 'You');
  };

  const handleBotAction = (botSocket: Socket, state: GameState, botId: string) => {
    // Find bot player and set difficulty
    const bot = state.players.find(p => p.id === botId && p.isBot);
    if (!bot) return; // Not a bot, exit early

    // Set bot difficulty from ref (default to hard if not found)
    const botDifficulty = botDifficultiesRef.current.get(bot.name) || 'hard';
    BotPlayer.setDifficulty(botDifficulty);

    // Clear any existing timeout for this bot
    const existingTimeout = botTimeoutsRef.current.get(botId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      botTimeoutsRef.current.delete(botId);
    }

    // Don't act if trick is being resolved (4 cards played, waiting for resolution)
    if (state.phase === 'playing' && state.currentTrick.length >= 4) {
      console.log(`Bot ${botId} waiting for trick resolution...`);
      return;
    }

    // Team selection phase - bot selects team immediately
    if (state.phase === 'team_selection') {
      // If bot hasn't selected a team yet, select one
      if (bot && !bot.teamId) {
        const playerIndex = state.players.findIndex(p => p.id === botId);
        const teamId = BotPlayer.selectTeam(playerIndex);

        const timeout = setTimeout(() => {
          botSocket.emit('select_team', { gameId: state.id, teamId });
          botTimeoutsRef.current.delete(botId);
        }, BotPlayer.getActionDelay());
        botTimeoutsRef.current.set(botId, timeout);
      }

      // Note: Removed auto-start logic - game now requires explicit Start Game button press
      return;
    }

    // Scoring phase - bot marks ready after delay
    if (state.phase === 'scoring') {
      // Check if this bot is already ready (playersReady stores names, not IDs)
      const bot = state.players.find(p => p.id === botId);
      const isAlreadyReady = bot ? (state.playersReady?.includes(bot.name) || false) : false;

      if (!isAlreadyReady) {
        const timeout = setTimeout(() => {
          botSocket.emit('player_ready', { gameId: state.id });
          botTimeoutsRef.current.delete(botId);
        }, BotPlayer.getActionDelay());
        botTimeoutsRef.current.set(botId, timeout);
      }
      return;
    }

    // For other phases, only act when it's the bot's turn
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.id !== botId) return;

    // Schedule bot action with delay
    const timeout = setTimeout(() => {
      // Betting phase
      if (state.phase === 'betting') {
        const bet = BotPlayer.makeBet(state, botId);
        botSocket.emit('place_bet', {
          gameId: state.id,
          amount: bet.amount,
          withoutTrump: bet.withoutTrump,
          skipped: bet.skipped
        });
      }

      // Playing phase
      if (state.phase === 'playing') {
        const card = BotPlayer.playCard(state, botId);
        if (card) {
          botSocket.emit('play_card', { gameId: state.id, card });
        }
      }

      botTimeoutsRef.current.delete(botId);
    }, BotPlayer.getActionDelay());

    botTimeoutsRef.current.set(botId, timeout);
  };

  // Autoplay effect: when enabled and it's the player's turn, act as a bot
  useEffect(() => {
    if (!autoplayEnabled || !gameState || !socket) return;
    if (gameState.phase !== 'betting' && gameState.phase !== 'playing' && gameState.phase !== 'scoring') return;

    const myPlayerId = socket.id || '';

    // For scoring phase, auto-ready
    if (gameState.phase === 'scoring') {
      // playersReady now stores names, not IDs
      const me = gameState.players.find(p => p.id === myPlayerId);
      const isAlreadyReady = me ? (gameState.playersReady?.includes(me.name) || false) : false;
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

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    // Only act if it's my turn
    if (!currentPlayer || currentPlayer.id !== myPlayerId) return;

    // Clear any existing autoplay timeout
    if (autoplayTimeoutRef.current) {
      clearTimeout(autoplayTimeoutRef.current);
      autoplayTimeoutRef.current = null;
    }

    // Schedule autoplay action with bot delay
    autoplayTimeoutRef.current = setTimeout(() => {
      if (gameState.phase === 'betting') {
        const bet = BotPlayer.makeBet(gameState, myPlayerId);
        handlePlaceBet(bet.amount, bet.withoutTrump, bet.skipped);
      } else if (gameState.phase === 'playing') {
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
  }, [autoplayEnabled, gameState, socket]);

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
      {reconnecting && <ReconnectingBanner />}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      {gameState && (
        <CatchUpModal
          gameState={gameState}
          currentPlayerId={socket?.id || ''}
          isOpen={showCatchUpModal}
          onClose={() => setShowCatchUpModal(false)}
        />
      )}
      {gameState && socket?.id && (
        <BotManagementPanel
          isOpen={botManagementOpen}
          onClose={() => setBotManagementOpen(false)}
          gameState={gameState}
          currentPlayerId={socket.id}
          onReplaceWithBot={handleReplaceWithBot}
          onChangeBotDifficulty={handleChangeBotDifficulty}
        />
      )}
      {botTakeoverModal && (
        <BotTakeoverModal
          isOpen={!!botTakeoverModal}
          availableBots={botTakeoverModal.availableBots}
          onTakeOver={handleTakeOverBot}
          onCancel={() => {
            setBotTakeoverModal(null);
            localStorage.removeItem('pendingPlayerName');
          }}
        />
      )}
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
            onAutoplayToggle={() => setAutoplayEnabled(!autoplayEnabled)}
            onOpenBotManagement={() => setBotManagementOpen(true)}
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
          onAutoplayToggle={() => setAutoplayEnabled(!autoplayEnabled)}
          onOpenBotManagement={() => setBotManagementOpen(true)}
          socket={socket}
          gameId={gameId}
          chatMessages={chatMessages}
          onNewChatMessage={handleNewChatMessage}
        />
        </ErrorBoundary>
      </>
    );
  }

  if (gameState.phase === 'scoring') {
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
          <ScoringPhase
            gameState={gameState}
            socket={socket || null}
            gameId={gameId}
            currentPlayerId={socket?.id || ''}
            chatMessages={chatMessages}
            onNewChatMessage={handleNewChatMessage}
            onLeaveGame={handleLeaveGame}
            onOpenBotManagement={() => setBotManagementOpen(true)}
            isSpectator={isSpectator}
          />
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

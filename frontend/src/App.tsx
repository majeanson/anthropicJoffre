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
import { Toast, ToastProps } from './components/Toast';
import { ChatMessage } from './components/ChatPanel';
import { GameReplay } from './components/GameReplay';
import { BotPlayer, BotDifficulty } from './utils/botPlayer';
import { preloadCardImages } from './utils/imagePreloader';
import { addRecentPlayers } from './utils/recentPlayers';
import { ErrorBoundary } from './components/ErrorBoundary';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameId, setGameId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const botSocketsRef = useRef<Map<string, Socket>>(new Map()); // Track bot sockets by bot player NAME (stable across reconnects)
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [debugPanelOpen, setDebugPanelOpen] = useState<boolean>(false);
  const [testPanelOpen, setTestPanelOpen] = useState<boolean>(false);
  const [reconnecting, setReconnecting] = useState<boolean>(false);
  const [showCatchUpModal, setShowCatchUpModal] = useState<boolean>(false);
  const [toast, setToast] = useState<Omit<ToastProps, 'onClose'> | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isSpectator, setIsSpectator] = useState<boolean>(false);
  const [currentTrickWinnerId, setCurrentTrickWinnerId] = useState<string | null>(null);
  const [debugMenuOpen, setDebugMenuOpen] = useState<boolean>(false);
  const [hasValidSession, setHasValidSession] = useState<boolean>(false);
  const [autoplayEnabled, setAutoplayEnabled] = useState<boolean>(false);
  const [botManagementOpen, setBotManagementOpen] = useState<boolean>(false);
  const [onlinePlayers, setOnlinePlayers] = useState<Array<{
    socketId: string;
    playerName: string;
    status: 'in_lobby' | 'in_game' | 'in_team_selection';
    gameId?: string;
    lastActivity: number;
  }>>([]);
  const lastToastRef = useRef<string>(''); // Track last toast to prevent duplicates
  const catchUpModalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // Track catch-up modal timeout
  const botTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const autoplayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const botDifficultiesRef = useRef<Map<string, BotDifficulty>>(new Map()); // Track per-bot difficulty by bot name
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('medium');
  const [botTakeoverModal, setBotTakeoverModal] = useState<{
    gameId: string;
    availableBots: Array<{ name: string; teamId: 1 | 2; difficulty: BotDifficulty }>;
    playerName: string;
  } | null>(null);

  const [showReplayModal, setShowReplayModal] = useState<boolean>(false);

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

  // Helper function to check if there's a valid session
  // Uses sessionStorage for multi-tab isolation - each tab maintains its own player session
  const checkValidSession = (): boolean => {
    const sessionData = sessionStorage.getItem('gameSession');
    if (!sessionData) return false;

    try {
      const session: PlayerSession = JSON.parse(sessionData);
      const SESSION_TIMEOUT = 120000; // 2 minutes
      if (Date.now() - session.timestamp > SESSION_TIMEOUT) {
        sessionStorage.removeItem('gameSession');
        return false;
      }
      return true;
    } catch (e) {
      sessionStorage.removeItem('gameSession');
      return false;
    }
  };

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      // Enable automatic reconnection with exponential backoff
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      // Connection timeout
      timeout: 10000,
    });
    setSocket(newSocket);

    // Expose socket on window for E2E tests
    if (typeof window !== 'undefined') {
      (window as any).socket = newSocket;
    }

    newSocket.on('connect', () => {
      setError(''); // Clear any connection errors
      // Note: Removed automatic reconnection - now requires explicit Rejoin button click
    });

    newSocket.on('connect_error', () => {
      setReconnecting(false);

      // If we have a stale session, clear it
      const sessionData = sessionStorage.getItem('gameSession');
      if (sessionData) {
        try {
          const session: PlayerSession = JSON.parse(sessionData);
          const SESSION_TIMEOUT = 900000; // 15 minutes
          if (Date.now() - session.timestamp > SESSION_TIMEOUT) {
            sessionStorage.removeItem('gameSession');
            setGameState(null);
            setGameId('');
          }
        } catch (e) {
          sessionStorage.removeItem('gameSession');
        }
      }
    });

    newSocket.on('disconnect', (reason) => {
      // Don't immediately clear state - allow for reconnection
      if (reason === 'io server disconnect') {
        // Server forcefully disconnected, clear session
        sessionStorage.removeItem('gameSession');
        setGameState(null);
        setGameId('');
      }
    });

    newSocket.on('reconnect_attempt', () => {
      setReconnecting(true);
    });

    newSocket.on('reconnect', () => {
      setReconnecting(false);
    });

    newSocket.on('reconnect_failed', () => {
      setReconnecting(false);
      setError('Unable to reconnect to server. Please refresh the page.');
    });

    newSocket.on('game_created', ({ gameId, gameState, session }: { gameId: string; gameState: GameState; session: PlayerSession }) => {
      setGameId(gameId);
      setGameState(gameState);

      // Save session to sessionStorage (multi-tab isolation)
      if (session) {
        sessionStorage.setItem('gameSession', JSON.stringify(session));
      }
    });

    newSocket.on('player_joined', ({ gameState, session }: { gameState: GameState; session?: PlayerSession }) => {
      setGameState(gameState);

      // Save session to sessionStorage (multi-tab isolation)
      if (session) {
        sessionStorage.setItem('gameSession', JSON.stringify(session));
      } else {
      }
    });

    newSocket.on('reconnection_successful', ({ gameState, session }: { gameState: GameState; session: PlayerSession }) => {
      setReconnecting(false);
      setGameId(gameState.id);
      setGameState(gameState);

      // Show catch-up modal and auto-close after 5 seconds (prevent flickering)
      if (catchUpModalTimeoutRef.current) {
        clearTimeout(catchUpModalTimeoutRef.current);
      }
      // Only show modal if not already showing (prevents flickering)
      setShowCatchUpModal(prev => {
        if (!prev) {
          catchUpModalTimeoutRef.current = setTimeout(() => {
            setShowCatchUpModal(false);
            catchUpModalTimeoutRef.current = null;
          }, 5000);
        }
        return true;
      });

      // Respawn bot sockets after successful reconnection
      // This ensures bots continue playing after human player reconnects
      spawnBotsForGame(gameState);

      // Update session in sessionStorage (multi-tab isolation)
      sessionStorage.setItem('gameSession', JSON.stringify(session));
    });

    newSocket.on('reconnection_failed', ({ message }: { message: string }) => {
      setReconnecting(false);

      // Clear invalid session
      sessionStorage.removeItem('gameSession');

      // Reset game state to go back to lobby
      setGameState(null);
      setGameId('');

      // Don't show error for expired sessions or invalid tokens, just go back to lobby silently
      if (!message.includes('expired') && !message.includes('Invalid')) {
        setError(message);
      }
    });

    newSocket.on('player_reconnected', ({ playerName }: { playerName: string; playerId: string; oldSocketId: string }) => {
      // Player online/offline badges will show reconnection status instead of toast
      console.log(`Player reconnected: ${playerName}`);
    });

    newSocket.on('player_disconnected', ({ playerId, waitingForReconnection }: { playerId: string; waitingForReconnection: boolean }) => {

      // Show toast notification if waiting for reconnection (prevent duplicates)
      if (waitingForReconnection && gameState) {
        const player = gameState.players.find(p => p.id === playerId);
        if (player) {
          const toastMessage = `${player.name} disconnected`;
          if (lastToastRef.current !== toastMessage) {
            lastToastRef.current = toastMessage;
            setToast({
              message: toastMessage,
              type: 'warning',
              duration: 3000,
            });
            // Clear the ref after duration
            setTimeout(() => {
              if (lastToastRef.current === toastMessage) {
                lastToastRef.current = '';
              }
            }, 3000);
          }
        }
      }
    });

    newSocket.on('round_started', (gameState) => {
      setGameState(gameState);
    });

    newSocket.on('game_updated', (gameState) => {
      console.log(`📥 Frontend received game_updated, currentTrick.length = ${gameState.currentTrick.length}`);
      setGameState(gameState);
      // Clear winner ID when trick is cleared
      if (gameState.currentTrick.length === 0) {
        setCurrentTrickWinnerId(null);
      }
    });

    newSocket.on('trick_resolved', ({ winnerId, gameState }) => {
      console.log(`📥 Frontend received trick_resolved, currentTrick.length = ${gameState.currentTrick.length}`);
      setGameState(gameState);
      // Store the winner ID for highlighting during the 3-second delay
      setCurrentTrickWinnerId(winnerId);
    });

    newSocket.on('round_ended', (gameState) => {
      setGameState(gameState);
    });

    newSocket.on('game_over', ({ gameState }: { gameState: GameState }) => {
      setGameState(gameState);

      // Save recent players (excluding yourself)
      const currentPlayer = gameState.players.find(p => p.id === newSocket.id);
      if (currentPlayer) {
        const otherPlayers = gameState.players
          .map(p => p.name)
          .filter(name => name !== currentPlayer.name);
        addRecentPlayers(otherPlayers, currentPlayer.name);
      }

      // Clear session on game over
      sessionStorage.removeItem('gameSession');
    });

    // Listen for rematch events
    newSocket.on('rematch_vote_update', ({ voters }: { votes: number; totalPlayers: number; voters: string[] }) => {
      // Update game state with new vote count
      if (gameState) {
        setGameState({
          ...gameState,
          rematchVotes: voters
        });
      }
    });

    newSocket.on('rematch_started', ({ gameState }: { gameState: GameState }) => {
      setGameState(gameState);

      // Save session for the new game
      const currentPlayer = gameState.players.find(p => p.id === newSocket.id);
      if (currentPlayer) {
        const session: PlayerSession = {
          gameId: gameState.id,
          playerId: currentPlayer.id,
          playerName: currentPlayer.name,
          token: `${gameState.id}_${currentPlayer.id}_${Date.now()}`,
          timestamp: Date.now()
        };
        sessionStorage.setItem('gameSession', JSON.stringify(session));
      }
    });

    // Listen for online players updates
    newSocket.on('online_players_update', (players: typeof onlinePlayers) => {
      setOnlinePlayers(players);
    });

    // Listen for timeout events
    newSocket.on('timeout_warning', ({ playerName, secondsRemaining }: { playerName: string; secondsRemaining: number }) => {
      setToast({
        message: `⏰ ${playerName === (gameState?.players.find(p => p.id === newSocket.id)?.name) ? 'You have' : `${playerName} has`} ${secondsRemaining} seconds!`,
        type: 'warning',
        duration: 3000,
      });
    });

    newSocket.on('auto_action_taken', ({ playerName, phase }: { playerName: string; phase: 'betting' | 'playing' }) => {
      setToast({
        message: `🤖 Auto-${phase === 'betting' ? 'bet' : 'play'} for ${playerName}`,
        type: 'info',
        duration: 3000,
      });
    });

    newSocket.on('error', ({ message }) => {
      setError(message);
    });

    newSocket.on('player_left', ({ gameState }) => {
      setGameState(gameState);
    });

    newSocket.on('kicked_from_game', ({ message }) => {
      setToast({
        message,
        type: 'error',
        duration: 5000,
      });
      // Clear session and reset state
      sessionStorage.removeItem('gameSession');
      setGameState(null);
      setGameId('');
      setIsSpectator(false);
    });

    newSocket.on('leave_game_success', () => {
      // Clear session and reset state
      sessionStorage.removeItem('gameSession');
      setGameState(null);
      setGameId('');
      setIsSpectator(false);
    });

    newSocket.on('spectator_joined', ({ gameState }: { gameState: GameState }) => {
      setIsSpectator(true);
      setGameId(gameState.id);
      setGameState(gameState);
    });

    // Bot management listeners
    newSocket.on('bot_replaced', ({ gameState, replacedPlayerName, botName }: {
      gameState: GameState;
      replacedPlayerName: string;
      botName: string;
    }) => {
      setGameState(gameState);
      setToast({
        message: `${replacedPlayerName} has been replaced by ${botName}`,
        type: 'info',
        duration: 3000,
      });
      // Respawn bot socket for the new bot
      spawnBotsForGame(gameState);
    });

    newSocket.on('bot_taken_over', ({ gameState, botName, newPlayerName, session }: {
      gameState: GameState;
      botName: string;
      newPlayerName: string;
      session: PlayerSession | null;
    }) => {
      setGameState(gameState);
      setToast({
        message: `${botName} has been taken over by ${newPlayerName}`,
        type: 'info',
        duration: 3000,
      });

      // If we're the one taking over, save our session
      if (session) {
        sessionStorage.setItem('gameSession', JSON.stringify(session));
      }

      // Clean up old bot socket if it exists
      const botSocket = botSocketsRef.current.get(botName);
      if (botSocket) {
        botSocket.disconnect();
        botSocketsRef.current.delete(botName);
      }
    });

    newSocket.on('replaced_by_bot', ({ message }: {
      message: string;
      gameId: string;
    }) => {
      setToast({
        message,
        type: 'warning',
        duration: 5000,
      });
      // Clear session and reset state
      sessionStorage.removeItem('gameSession');
      setGameState(null);
      setGameId('');
      setIsSpectator(false);
    });

    newSocket.on('game_full_with_bots', ({ gameId, availableBots }: {
      gameId: string;
      availableBots: Array<{ name: string; teamId: 1 | 2; difficulty: BotDifficulty }>;
    }) => {
      // Store the pending join info to show bot takeover modal
      // We need to get the player name from somewhere - let's add it to the modal state
      const storedPlayerName = localStorage.getItem('pendingPlayerName') || '';
      setBotTakeoverModal({
        gameId,
        availableBots,
        playerName: storedPlayerName
      });
    });

    return () => {
      newSocket.close();
    };
  }, []);

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
      setReconnecting(true);
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
                <p className="text-6xl font-black text-orange-600">{gameState.teamScores.team1}</p>
                <p className="text-sm text-orange-700 mt-2">Final Score</p>
              </div>
              <div className={`text-center p-6 rounded-xl border-4 ${winningTeam === 2 ? 'bg-purple-100 border-purple-400 ring-4 ring-yellow-400' : 'bg-purple-50 border-purple-200'}`}>
                <div className="flex items-center justify-center gap-2 mb-2">
                  {winningTeam === 2 && <span className="text-3xl">👑</span>}
                  <h3 className="text-2xl font-bold text-purple-800">Team 2</h3>
                </div>
                <p className="text-6xl font-black text-purple-600">{gameState.teamScores.team2}</p>
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
                onClick={() => setShowReplayModal(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 border-2 border-purple-700 shadow-lg transform hover:scale-105"
              >
                📺 View Game Replay
              </button>
              <button
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

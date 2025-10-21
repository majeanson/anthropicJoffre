import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, Card, PlayerSession } from './types/game';
import { Lobby } from './components/Lobby';
import { BettingPhase } from './components/BettingPhase';
import { PlayingPhase } from './components/PlayingPhase';
import { TeamSelection } from './components/TeamSelection';
import { ScoringPhase } from './components/ScoringPhase';
import { DebugMultiPlayerView } from './components/DebugMultiPlayerView';
import { DebugPanel } from './components/DebugPanel';
import { TestPanel } from './components/TestPanel';
import { ReconnectingBanner } from './components/ReconnectingBanner';
import { CatchUpModal } from './components/CatchUpModal';
import { Toast, ToastProps } from './components/Toast';
import { ChatMessage } from './components/ChatPanel';
import { BotPlayer } from './utils/botPlayer';
import { preloadCardImages } from './utils/imagePreloader';
import { addRecentPlayers } from './utils/recentPlayers';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameId, setGameId] = useState<string>('');
  const [error, setError] = useState<string>('');
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
  const [onlinePlayers, setOnlinePlayers] = useState<Array<{
    socketId: string;
    playerName: string;
    status: 'in_lobby' | 'in_game' | 'in_team_selection';
    gameId?: string;
    lastActivity: number;
  }>>([]);
  const botTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const autoplayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    preloadCardImages();

    // Clean up any old bot sessions from localStorage
    // Bot sessions should not persist and can interfere with human player reconnection
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('botSession_')) {
        console.log(`Removing old bot session: ${key}`);
        localStorage.removeItem(key);
      }
    });
  }, [])
  // Helper function to check if there's a valid session
  const checkValidSession = (): boolean => {
    const sessionData = localStorage.getItem('gameSession');
    if (!sessionData) return false;

    try {
      const session: PlayerSession = JSON.parse(sessionData);
      const SESSION_TIMEOUT = 120000; // 2 minutes
      if (Date.now() - session.timestamp > SESSION_TIMEOUT) {
        localStorage.removeItem('gameSession');
        return false;
      }
      return true;
    } catch (e) {
      localStorage.removeItem('gameSession');
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

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setError(''); // Clear any connection errors

      // Check for existing session and attempt reconnection
      const sessionData = localStorage.getItem('gameSession');
      if (sessionData) {
        try {
          const session: PlayerSession = JSON.parse(sessionData);

          // Check if session is too old (older than 15 minutes - for mobile AFK)
          const SESSION_TIMEOUT = 900000; // 15 minutes
          if (Date.now() - session.timestamp > SESSION_TIMEOUT) {
            console.log('Session expired, clearing...');
            localStorage.removeItem('gameSession');
            return;
          }

          console.log('Found existing session, attempting reconnection...');
          setReconnecting(true);
          newSocket.emit('reconnect_to_game', { token: session.token });
        } catch (e) {
          console.error('Failed to parse session data:', e);
          localStorage.removeItem('gameSession');
        }
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setReconnecting(false);

      // If we have a stale session, clear it
      const sessionData = localStorage.getItem('gameSession');
      if (sessionData) {
        try {
          const session: PlayerSession = JSON.parse(sessionData);
          const SESSION_TIMEOUT = 900000; // 15 minutes
          if (Date.now() - session.timestamp > SESSION_TIMEOUT) {
            localStorage.removeItem('gameSession');
            setGameState(null);
            setGameId('');
          }
        } catch (e) {
          localStorage.removeItem('gameSession');
        }
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      // Don't immediately clear state - allow for reconnection
      if (reason === 'io server disconnect') {
        // Server forcefully disconnected, clear session
        localStorage.removeItem('gameSession');
        setGameState(null);
        setGameId('');
      }
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Reconnection attempt #${attemptNumber}`);
      setReconnecting(true);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      setReconnecting(false);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Reconnection failed');
      setReconnecting(false);
      setError('Unable to reconnect to server. Please refresh the page.');
    });

    newSocket.on('game_created', ({ gameId, gameState, session }: { gameId: string; gameState: GameState; session: PlayerSession }) => {
      setGameId(gameId);
      setGameState(gameState);

      // Save session to localStorage
      if (session) {
        localStorage.setItem('gameSession', JSON.stringify(session));
      }
    });

    newSocket.on('player_joined', ({ gameState, session }: { gameState: GameState; session?: PlayerSession }) => {
      setGameState(gameState);

      // Save session to localStorage
      if (session) {
        localStorage.setItem('gameSession', JSON.stringify(session));
      }
    });

    newSocket.on('reconnection_successful', ({ gameState, session }: { gameState: GameState; session: PlayerSession }) => {
      console.log('Reconnection successful!');
      setReconnecting(false);
      setGameId(gameState.id);
      setGameState(gameState);

      // Show catch-up modal
      setShowCatchUpModal(true);

      // Respawn bot sockets if there are bot players
      spawnBotsForGame(gameState);

      // Update session in localStorage
      localStorage.setItem('gameSession', JSON.stringify(session));
    });

    newSocket.on('reconnection_failed', ({ message }: { message: string }) => {
      console.log('Reconnection failed:', message);
      setReconnecting(false);

      // Clear invalid session
      localStorage.removeItem('gameSession');

      // Reset game state to go back to lobby
      setGameState(null);
      setGameId('');

      // Don't show error for expired sessions or invalid tokens, just go back to lobby silently
      if (!message.includes('expired') && !message.includes('Invalid')) {
        setError(message);
      }
    });

    newSocket.on('player_reconnected', ({ playerName }: { playerName: string; playerId: string; oldSocketId: string }) => {
      console.log(`${playerName} reconnected`);
      // Show toast notification
      setToast({
        message: `${playerName} reconnected`,
        type: 'success',
        duration: 3000,
      });
    });

    newSocket.on('player_disconnected', ({ playerId, waitingForReconnection }: { playerId: string; waitingForReconnection: boolean }) => {
      console.log(`Player ${playerId} disconnected. Waiting for reconnection: ${waitingForReconnection}`);

      // Show toast notification if waiting for reconnection
      if (waitingForReconnection && gameState) {
        const player = gameState.players.find(p => p.id === playerId);
        if (player) {
          setToast({
            message: `${player.name} disconnected`,
            type: 'warning',
            duration: 3000,
          });
        }
      }
    });

    newSocket.on('round_started', (gameState) => {
      setGameState(gameState);
    });

    newSocket.on('game_updated', (gameState) => {
      setGameState(gameState);
      // Clear winner ID when trick is cleared
      if (gameState.currentTrick.length === 0) {
        setCurrentTrickWinnerId(null);
      }
    });

    newSocket.on('trick_resolved', ({ winnerId, gameState }) => {
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
      localStorage.removeItem('gameSession');
    });

    // Listen for online players updates
    newSocket.on('online_players_update', (players: typeof onlinePlayers) => {
      setOnlinePlayers(players);
    });

    newSocket.on('error', ({ message }) => {
      setError(message);
    });

    newSocket.on('player_left', ({ gameState }) => {
      setGameState(gameState);
    });

    newSocket.on('leave_game_success', () => {
      console.log('Successfully left game');
      // Clear session and reset state
      localStorage.removeItem('gameSession');
      setGameState(null);
      setGameId('');
      setIsSpectator(false);
    });

    newSocket.on('spectator_joined', ({ gameState }: { gameState: GameState }) => {
      console.log('Joined game as spectator');
      setIsSpectator(true);
      setGameId(gameState.id);
      setGameState(gameState);
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
      console.log('Auto-join game from URL:', joinGameId);
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
    }
  };

  const handleNewChatMessage = (message: ChatMessage) => {
    setChatMessages(prev => [...prev, message]);
  };

  const handleRejoinGame = () => {
    const sessionData = localStorage.getItem('gameSession');
    if (!sessionData || !socket) return;

    try {
      const session: PlayerSession = JSON.parse(sessionData);
      setReconnecting(true);
      socket.emit('reconnect_to_game', { token: session.token });
    } catch (e) {
      console.error('Failed to rejoin game:', e);
      localStorage.removeItem('gameSession');
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

    console.log(`Found ${botPlayers.length} bot players, spawning fresh bot sockets...`);

    // Note: We don't try to reconnect bots with sessions because:
    // 1. Bot sessions are ephemeral and shouldn't be saved
    // 2. Fresh bot connections work fine and don't interfere with human player sessions
    // 3. Bots will be marked as disconnected but can continue playing when respawned

    botPlayers.forEach(botPlayer => {
      // Create new socket for the bot
      const botSocket = io(SOCKET_URL);
      const botName = botPlayer.name;

      botSocket.on('connect', () => {
        console.log(`Bot ${botName} socket connected, joining game...`);
        // Join as a fresh bot connection (server will handle reconnection internally)
        botSocket.emit('join_game', { gameId: gameState.id, playerName: botName, isBot: true });
      });

      botSocket.on('player_joined', ({ gameState: newState }: { gameState: GameState; session?: PlayerSession }) => {
        console.log(`Bot ${botName} joined/reconnected successfully!`);
        handleBotAction(botSocket, newState, botSocket.id || '');
      });

      // Listen to all game state updates
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
    });
  };

  // Add a single bot to existing game
  const handleAddBot = () => {
    if (!socket || !gameId) return;

    // Count existing bots
    const existingBots = gameState?.players.filter(p => p.name.startsWith('Bot ')).length || 0;
    const botName = `Bot ${existingBots + 1}`;

    const botSocket = io(SOCKET_URL);

    botSocket.on('connect', () => {
      botSocket.emit('join_game', { gameId, playerName: botName, isBot: true });
    });

    botSocket.on('player_joined', ({ gameState: state }: { gameState: GameState }) => {
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
  const handleQuickPlay = () => {
    if (!socket) return;

    // Listen for game creation to spawn bots
    const gameCreatedHandler = ({ gameId: createdGameId }: { gameId: string; gameState: GameState }) => {
      // Spawn 3 bot players after game is created
      setTimeout(() => {
        for (let i = 0; i < 3; i++) {
          const botSocket = io(SOCKET_URL);
          const botName = `Bot ${i + 1}`;

          botSocket.on('connect', () => {
            botSocket.emit('join_game', { gameId: createdGameId, playerName: botName, isBot: true });
          });

          // Listen to all game state updates
          botSocket.on('player_joined', ({ gameState }: { gameState: GameState; session?: PlayerSession }) => {
            // Don't save bot sessions to localStorage - they are ephemeral
            // and should not interfere with human player reconnection
            handleBotAction(botSocket, gameState, botSocket.id || '');
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
    // Clear any existing timeout for this bot
    const existingTimeout = botTimeoutsRef.current.get(botId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      botTimeoutsRef.current.delete(botId);
    }

    // Team selection phase - bot selects team immediately
    if (state.phase === 'team_selection') {
      const bot = state.players.find(p => p.id === botId);

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

      // Check if all players have teams and auto-start
      const allHaveTeams = state.players.every(p => p.teamId);
      const team1Count = state.players.filter(p => p.teamId === 1).length;
      const team2Count = state.players.filter(p => p.teamId === 2).length;

      if (allHaveTeams && team1Count === 2 && team2Count === 2 && state.players.length === 4) {
        const timeout = setTimeout(() => {
          botSocket.emit('start_game', { gameId: state.id });
        }, 2000);
        botTimeoutsRef.current.set(`${botId}-start`, timeout);
      }
      return;
    }

    // Scoring phase - bot marks ready after delay
    if (state.phase === 'scoring') {
      // Check if this bot is already ready
      const isAlreadyReady = state.playersReady?.includes(botId) || false;

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
      const isAlreadyReady = gameState.playersReady?.includes(myPlayerId) || false;
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
      <div className="min-h-screen bg-purple-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-purple-600 mb-2">Error</h2>
          <p className="text-gray-700">{error}</p>
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
    </>
  );

  if (!gameState) {
    return (
      <>
        <GlobalUI />
        <Lobby onCreateGame={handleCreateGame} onJoinGame={handleJoinGame} onSpectateGame={handleSpectateGame} onQuickPlay={handleQuickPlay} onRejoinGame={handleRejoinGame} hasValidSession={hasValidSession} autoJoinGameId={autoJoinGameId} onlinePlayers={onlinePlayers} />
      </>
    );
  }

  // Debug controls
  const DEBUG_ENABLED = false; // Set to true to show debug controls

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
        <div className="absolute top-12 right-0 bg-white bg-opacity-95 rounded-lg shadow-2xl p-2 min-w-[160px] backdrop-blur-sm">
          <button
            onClick={() => {
              setTestPanelOpen(true);
              setDebugMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded hover:bg-green-50 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700"
          >
            🧪 Test Panel
          </button>
          <button
            onClick={() => {
              setDebugPanelOpen(true);
              setDebugMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded hover:bg-purple-50 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700"
          >
            🔍 Game State
          </button>
          {gameState && gameState.players.length === 4 && (
            <button
              onClick={() => {
                setDebugMode(!debugMode);
                setDebugMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded hover:bg-yellow-50 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700"
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
          onSelectTeam={handleSelectTeam}
          onSwapPosition={handleSwapPosition}
          onStartGame={handleStartGame}
          onLeaveGame={handleLeaveGame}
          onAddBot={handleAddBot}
          socket={socket}
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
        <div className="min-h-screen bg-gradient-to-br from-orange-900 to-amber-900 flex items-center justify-center p-6">
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
          />
        </div>
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
        <PlayingPhase
          gameState={gameState}
          currentPlayerId={socket?.id || ''}
          onPlayCard={handlePlayCard}
          isSpectator={isSpectator}
          currentTrickWinnerId={currentTrickWinnerId}
          onLeaveGame={handleLeaveGame}
          autoplayEnabled={autoplayEnabled}
          onAutoplayToggle={() => setAutoplayEnabled(!autoplayEnabled)}
          socket={socket}
          gameId={gameId}
          chatMessages={chatMessages}
          onNewChatMessage={handleNewChatMessage}
        />
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
        <ScoringPhase
          gameState={gameState}
          socket={socket || null}
          gameId={gameId}
          currentPlayerId={socket?.id || ''}
          chatMessages={chatMessages}
          onNewChatMessage={handleNewChatMessage}
        />
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
        <div className="min-h-screen bg-gradient-to-br from-amber-900 via-orange-800 to-red-900 flex items-center justify-center p-6">
          <div className="bg-gradient-to-br from-parchment-50 to-parchment-100 rounded-2xl p-8 shadow-2xl max-w-4xl w-full border-4 border-amber-700">
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
              <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200">
                <h4 className="text-lg font-bold text-orange-800 mb-3 text-center">Team 1 Players</h4>
                <div className="space-y-2">
                  {team1Players.map(player => (
                    <div key={player.id} className="bg-white rounded-lg p-3 border border-orange-200">
                      <div className="font-semibold text-umber-900">{player.name}</div>
                      <div className="text-sm text-umber-700">
                        {player.tricksWon} tricks • {player.pointsWon} pts
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team 2 Players */}
              <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
                <h4 className="text-lg font-bold text-purple-800 mb-3 text-center">Team 2 Players</h4>
                <div className="space-y-2">
                  {team2Players.map(player => (
                    <div key={player.id} className="bg-white rounded-lg p-3 border border-purple-200">
                      <div className="font-semibold text-umber-900">{player.name}</div>
                      <div className="text-sm text-umber-700">
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
                <h3 className="text-2xl font-bold text-umber-900 mb-4 border-b-2 border-umber-400 pb-2 font-serif">
                  📜 Game History
                </h3>
                <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                  {gameState.roundHistory.slice().reverse().map((round) => {
                    const betPlayer = gameState.players.find(p => p.id === round.highestBet.playerId);

                    return (
                      <div
                        key={round.roundNumber}
                        className="bg-parchment-100 rounded-lg p-4 border-2 border-parchment-400 hover:bg-parchment-200 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-lg font-bold text-umber-900">
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
                          <div className="bg-parchment-50 rounded p-2">
                            <p className="text-umber-600 font-semibold text-xs">Bidder</p>
                            <p className="font-bold text-umber-900">{betPlayer?.name || 'Unknown'}</p>
                            <p className="text-xs text-umber-600">Team {round.offensiveTeam}</p>
                          </div>
                          <div className="bg-parchment-50 rounded p-2">
                            <p className="text-umber-600 font-semibold text-xs">Bet</p>
                            <p className="font-bold text-umber-900">{round.betAmount} points</p>
                            <p className="text-xs text-umber-600">
                              {round.withoutTrump ? 'No Trump (2x)' : 'With Trump'}
                            </p>
                          </div>
                          <div className="bg-parchment-50 rounded p-2">
                            <p className="text-umber-600 font-semibold text-xs">Points Earned</p>
                            <p className="font-bold text-umber-900">
                              {round.offensivePoints} / {round.betAmount}
                            </p>
                            <p className="text-xs text-umber-600">
                              Defensive: {round.defensivePoints}
                            </p>
                          </div>
                          <div className="bg-parchment-50 rounded p-2">
                            <p className="text-umber-600 font-semibold text-xs">Round Score</p>
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

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  // Reset game state to allow creating a new game with same players
                  if (socket) {
                    const currentPlayer = gameState.players.find(p => p.id === socket.id);
                    const playerName = currentPlayer?.name || 'Player';
                    socket.emit('create_game', playerName);
                  }
                }}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl font-bold hover:from-green-700 hover:to-green-800 transition-all duration-300 border-2 border-green-800 shadow-lg transform hover:scale-105 flex items-center gap-2"
              >
                🔄 Rematch
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
      </>
    );
  }

  return null;
}

export default App;

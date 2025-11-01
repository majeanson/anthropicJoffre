/**
 * Bot Management Hook
 * Sprint 5 Phase 3: Extracted from App.tsx
 *
 * Manages bot player lifecycle:
 * - Bot socket creation and cleanup
 * - Bot action handling (betting, playing, team selection)
 * - Bot difficulty management
 * - Bot replacement and takeover
 */

import { useRef, useState, useCallback } from 'react';
import { Socket, io } from 'socket.io-client';
import { GameState, PlayerSession } from '../types/game';
import { EnhancedBotPlayer as BotPlayer, BotDifficulty } from '../utils/botPlayerEnhanced';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

interface BotTakeoverModalState {
  gameId: string;
  availableBots: Array<{ name: string; teamId: 1 | 2; difficulty: BotDifficulty }>;
  playerName: string;
}

/**
 * Bot management hook
 *
 * Handles all bot-related concerns including socket management, action handling,
 * and player interactions (replace, takeover, difficulty changes)
 *
 * @param socket - Main socket connection
 * @param gameId - Current game ID
 * @param gameState - Current game state
 * @returns Bot management state and handler functions
 */
export function useBotManagement(socket: Socket | null, gameId: string, gameState: GameState | null) {
  // Bot state management
  const botSocketsRef = useRef<Map<string, Socket>>(new Map());
  const botTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const botDifficultiesRef = useRef<Map<string, BotDifficulty>>(new Map());
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('medium');
  const [botManagementOpen, setBotManagementOpen] = useState<boolean>(false);
  const [botTakeoverModal, setBotTakeoverModal] = useState<BotTakeoverModalState | null>(null);

  /**
   * Handle bot action for any game phase
   * Determines what action a bot should take based on current game state
   */
  const handleBotAction = useCallback((botSocket: Socket, state: GameState, botId: string) => {
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
  }, []);

  /**
   * Spawn bot sockets for all bot players in the game
   * Used for reconnection and initial game setup
   */
  const spawnBotsForGame = useCallback((gameState: GameState) => {
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
  }, [handleBotAction]);

  /**
   * Add a single bot to existing game
   */
  const handleAddBot = useCallback(() => {
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
  }, [socket, gameId, gameState, handleBotAction]);

  /**
   * Quick Play: Create game with 3 bots
   */
  const handleQuickPlay = useCallback((difficulty: BotDifficulty, persistenceMode: 'elo' | 'casual' = 'casual') => {
    if (!socket) return;

    // Set the bot difficulty globally
    BotPlayer.setDifficulty(difficulty);

    // Listen for game creation to spawn bots
    const gameCreatedHandler = ({ gameId: createdGameId }: { gameId: string }) => {
      console.log('[Quick Play] Game created, spawning bots for game:', createdGameId);
      // Spawn 3 bot players after game is created
      setTimeout(() => {
        console.log('[Quick Play] Spawning 3 bots...');
        for (let i = 0; i < 3; i++) {
          const botSocket = io(SOCKET_URL);
          const botName = `Bot ${i + 1}`;
          console.log(`[Quick Play] Creating bot socket for ${botName}, SOCKET_URL:`, SOCKET_URL);

          botSocket.on('connect', () => {
            console.log(`[Quick Play] ${botName} connected, joining game ${createdGameId}`);
            botSocket.emit('join_game', { gameId: createdGameId, playerName: botName, isBot: true });
          });

          botSocket.on('error', (error: any) => {
            console.error(`[Quick Play] ${botName} error:`, error);
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

    // Create game with player and persistence mode
    socket.emit('create_game', { playerName: 'You', persistenceMode });
  }, [socket, handleBotAction]);

  /**
   * Replace a player with a bot
   */
  const handleReplaceWithBot = useCallback((playerNameToReplace: string) => {
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
  }, [socket, gameId, gameState]);

  /**
   * Change bot difficulty
   */
  const handleChangeBotDifficulty = useCallback((botName: string, difficulty: BotDifficulty) => {
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
  }, [socket, gameId]);

  /**
   * Take over a bot player
   */
  const handleTakeOverBot = useCallback((botName: string) => {
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
  }, [socket, botTakeoverModal]);

  /**
   * Cleanup bot socket by name
   */
  const cleanupBotSocket = useCallback((botName: string) => {
    const botSocket = botSocketsRef.current.get(botName);
    if (botSocket) {
      botSocket.disconnect();
      botSocketsRef.current.delete(botName);
    }
  }, []);

  return {
    // State
    botDifficulty,
    setBotDifficulty,
    botManagementOpen,
    setBotManagementOpen,
    botTakeoverModal,
    setBotTakeoverModal,

    // Refs (exposed for direct access if needed)
    botSocketsRef,
    botTimeoutsRef,
    botDifficultiesRef,

    // Handlers
    spawnBotsForGame,
    handleAddBot,
    handleQuickPlay,
    handleReplaceWithBot,
    handleChangeBotDifficulty,
    handleTakeOverBot,
    cleanupBotSocket,
  };
}

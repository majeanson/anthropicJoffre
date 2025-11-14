import { useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { Socket } from 'socket.io-client';
import { GameState, PlayerSession } from '../types/game';
import { BotDifficulty } from '../utils/botPlayerEnhanced';

interface UseGameEventListenersProps {
  socket: Socket | null;
  gameState: GameState | null;
  autoJoinGameId: string;
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning', duration?: number) => void;
  setToast: (toast: { message: string; type: 'success' | 'error' | 'info' | 'warning'; duration?: number } | null) => void;
  setError: Dispatch<SetStateAction<string>>;
  setGameState: (gameState: GameState | null) => void;
  setGameId: (gameId: string) => void;
  setIsSpectator: (isSpectator: boolean) => void;
  setOnlinePlayers: (players: Array<{
    socketId: string;
    playerName: string;
    status: 'in_lobby' | 'in_game' | 'in_team_selection';
    gameId?: string;
    lastActivity: number;
  }>) => void;
  setBotTakeoverModal: (modal: {
    gameId: string;
    availableBots: Array<{ name: string; teamId: 1 | 2; difficulty: BotDifficulty }>;
    playerName: string;
  } | null) => void;
  spawnBotsForGame: (gameState: GameState) => void;
  cleanupBotSocket: (botName: string) => void;
  playErrorSound: () => void;
}

/**
 * Custom hook to manage game-related socket event listeners
 * Extracted from App.tsx to improve modularity and maintainability
 */
export function useGameEventListeners({
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
}: UseGameEventListenersProps) {
  const lastAutoActionRef = useRef<{ message: string; timestamp: number } | null>(null);

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
    const handleOnlinePlayersUpdate = (players: Array<{
      socketId: string;
      playerName: string;
      status: 'in_lobby' | 'in_game' | 'in_team_selection';
      gameId?: string;
      lastActivity: number;
    }>) => {
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
      playErrorSound();
      setError(message);
    };

    // Player left
    const handlePlayerLeft = ({ gameState: newGameState }: { gameState: GameState }) => {
      setGameState(newGameState);
    };

    // Kicked from game
    const handleKickedFromGame = ({ message }: { message: string }) => {
      setToast(null); // Clear existing toasts
      showToast(message, 'error', 5000);
      sessionStorage.removeItem('gameSession');
      setGameState(null);
      setGameId('');
      setIsSpectator(false);
    };

    // Leave game success
    const handleLeaveGameSuccess = () => {
      setToast(null); // Clear toasts when leaving
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
      setToast(null); // Clear existing toasts
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
  }, [socket, gameState, showToast, setToast, setError, setGameState, setGameId, setIsSpectator, setOnlinePlayers, setBotTakeoverModal, spawnBotsForGame, cleanupBotSocket, autoJoinGameId, playErrorSound]);
}

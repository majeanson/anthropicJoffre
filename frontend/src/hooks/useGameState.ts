/**
 * Game State Hook
 * Sprint 5 Phase 1: Extracted from App.tsx
 *
 * Manages game state and Socket.io event listeners for:
 * - Game lifecycle (created, joined, updated, over)
 * - Round progression (started, ended)
 * - Trick resolution
 * - Rematch voting
 * - Delta updates (bandwidth optimization)
 */

import { useEffect, useState, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { GameState, PlayerSession } from '../types/game';
import { applyStateDelta, GameStateDelta } from '../utils/stateDelta';
import { addRecentPlayers } from '../utils/recentPlayers';

interface UseGameStateProps {
  socket: Socket | null;
  onSpawnBots?: (gameState: GameState) => void;
}

interface UseGameStateReturn {
  gameState: GameState | null;
  gameId: string;
  currentTrickWinnerId: string | null;
  isSpectator: boolean;
  showCatchUpModal: boolean;
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
  setGameId: React.Dispatch<React.SetStateAction<string>>;
  setShowCatchUpModal: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSpectator: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Game state management hook with Socket.io event listeners
 *
 * Handles all game-related socket events and state updates
 *
 * @param socket - Socket.io instance
 * @param onSpawnBots - Callback to respawn bot sockets after reconnection
 * @returns Game state and setter functions
 */
export function useGameState({ socket, onSpawnBots }: UseGameStateProps): UseGameStateReturn {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameId, setGameId] = useState<string>('');
  const [currentTrickWinnerId, setCurrentTrickWinnerId] = useState<string | null>(null);
  const [isSpectator, setIsSpectator] = useState<boolean>(false);
  const [showCatchUpModal, setShowCatchUpModal] = useState<boolean>(false);
  const catchUpModalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!socket) return;

    // Game Created Event
    const handleGameCreated = ({ gameId: newGameId, gameState: newGameState, session }: {
      gameId: string;
      gameState: GameState;
      session: PlayerSession;
    }) => {
      setGameId(newGameId);
      setGameState(newGameState);

      // Save session to sessionStorage (multi-tab isolation)
      if (session) {
        sessionStorage.setItem('gameSession', JSON.stringify(session));
      }
    };

    // Player Joined Event
    const handlePlayerJoined = ({ gameState: newGameState, session }: {
      gameState: GameState;
      session?: PlayerSession;
    }) => {
      setGameState(newGameState);

      // Save session to sessionStorage (multi-tab isolation)
      if (session) {
        sessionStorage.setItem('gameSession', JSON.stringify(session));
      }
    };

    // Reconnection Successful Event
    const handleReconnectionSuccessful = ({ gameState: newGameState, session }: {
      gameState: GameState;
      session: PlayerSession;
    }) => {
      setGameId(newGameState.id);
      setGameState(newGameState);

      // Show catch-up modal - user must manually dismiss via "Continue Playing" button
      // Clear any existing timeout to prevent flickering
      if (catchUpModalTimeoutRef.current) {
        clearTimeout(catchUpModalTimeoutRef.current);
        catchUpModalTimeoutRef.current = null;
      }

      // Set modal to true immediately (no conditional check to prevent flicker)
      setShowCatchUpModal(true);

      // No auto-close - user clicks "Continue Playing" to dismiss
      // This gives them time to review game state after reconnection

      // Respawn bot sockets after successful reconnection
      if (onSpawnBots) {
        onSpawnBots(newGameState);
      }

      // Update session in sessionStorage
      sessionStorage.setItem('gameSession', JSON.stringify(session));
    };

    // Reconnection Failed Event
    const handleReconnectionFailed = () => {
      // Clear invalid session
      sessionStorage.removeItem('gameSession');

      // Reset game state to go back to lobby
      setGameState(null);
      setGameId('');
    };

    // Game Updated Event (Full State)
    const handleGameUpdated = (newGameState: GameState) => {
      setGameState(newGameState);

      // Clear winner ID when trick is cleared
      if (newGameState.currentTrick.length === 0) {
        setCurrentTrickWinnerId(null);
      }
    };

    // Game Updated Delta Event (Bandwidth Optimization)
    const handleGameUpdatedDelta = (delta: GameStateDelta) => {
      setGameState(prevState => {
        if (!prevState) return prevState; // Can't apply delta without previous state
        const newState = applyStateDelta(prevState, delta);

        // Clear winner ID when trick is cleared
        if (newState.currentTrick.length === 0) {
          setCurrentTrickWinnerId(null);
        }
        return newState;
      });
    };

    // Round Started Event
    const handleRoundStarted = (newGameState: GameState) => {
      setGameState(newGameState);
    };

    // Trick Resolved Event
    const handleTrickResolved = ({ winnerId, gameState: newGameState }: {
      winnerId: string;
      gameState: GameState;
    }) => {
      setGameState(newGameState);

      // Store the winner ID for highlighting during the delay
      setCurrentTrickWinnerId(winnerId);
    };

    // Round Ended Event
    const handleRoundEnded = (newGameState: GameState) => {
      setGameState(newGameState);
    };

    // Game Over Event
    const handleGameOver = ({ gameState: newGameState }: { gameState: GameState }) => {
      setGameState(newGameState);

      // Save recent players (excluding yourself)
      const currentPlayer = newGameState.players.find(p => p.id === socket.id);
      if (currentPlayer) {
        const otherPlayers = newGameState.players
          .map(p => p.name)
          .filter(name => name !== currentPlayer.name);
        addRecentPlayers(otherPlayers, currentPlayer.name);
      }

      // Clear session on game over
      sessionStorage.removeItem('gameSession');
    };

    // Rematch Vote Update Event
    const handleRematchVoteUpdate = ({ voters }: { votes: number; totalPlayers: number; voters: string[] }) => {
      setGameState(prevState => {
        if (!prevState) return prevState;
        return {
          ...prevState,
          rematchVotes: voters
        };
      });
    };

    // Rematch Started Event
    const handleRematchStarted = ({ gameState: newGameState }: { gameState: GameState }) => {
      setGameState(newGameState);

      // Save session for the new game
      const currentPlayer = newGameState.players.find(p => p.id === socket.id);
      if (currentPlayer) {
        const session: PlayerSession = {
          gameId: newGameState.id,
          playerId: currentPlayer.id,
          playerName: currentPlayer.name,
          token: `${newGameState.id}_${currentPlayer.id}_${Date.now()}`,
          timestamp: Date.now()
        };
        sessionStorage.setItem('gameSession', JSON.stringify(session));
      }
    };

    // Register all event listeners
    socket.on('game_created', handleGameCreated);
    socket.on('player_joined', handlePlayerJoined);
    socket.on('reconnection_successful', handleReconnectionSuccessful);
    socket.on('reconnection_failed', handleReconnectionFailed);
    socket.on('game_updated', handleGameUpdated);
    socket.on('game_updated_delta', handleGameUpdatedDelta);
    socket.on('round_started', handleRoundStarted);
    socket.on('trick_resolved', handleTrickResolved);
    socket.on('round_ended', handleRoundEnded);
    socket.on('game_over', handleGameOver);
    socket.on('rematch_vote_update', handleRematchVoteUpdate);
    socket.on('rematch_started', handleRematchStarted);

    // Cleanup function
    return () => {
      socket.off('game_created', handleGameCreated);
      socket.off('player_joined', handlePlayerJoined);
      socket.off('reconnection_successful', handleReconnectionSuccessful);
      socket.off('reconnection_failed', handleReconnectionFailed);
      socket.off('game_updated', handleGameUpdated);
      socket.off('game_updated_delta', handleGameUpdatedDelta);
      socket.off('round_started', handleRoundStarted);
      socket.off('trick_resolved', handleTrickResolved);
      socket.off('round_ended', handleRoundEnded);
      socket.off('game_over', handleGameOver);
      socket.off('rematch_vote_update', handleRematchVoteUpdate);
      socket.off('rematch_started', handleRematchStarted);

      // Clear catch-up modal timeout
      if (catchUpModalTimeoutRef.current) {
        clearTimeout(catchUpModalTimeoutRef.current);
      }
    };
  }, [socket, onSpawnBots]);

  return {
    gameState,
    gameId,
    currentTrickWinnerId,
    isSpectator,
    showCatchUpModal,
    setGameState,
    setGameId,
    setShowCatchUpModal,
    setIsSpectator,
  };
}

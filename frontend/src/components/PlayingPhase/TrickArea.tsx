/**
 * TrickArea Component
 * Renders the circular trick layout with 4 player positions
 * Includes previous trick modal and card animations
 *
 * Extracted from PlayingPhase.tsx (lines 429-448, 601-635, 790-1021)
 * Part of Sprint: PlayingPhase.tsx split into focused components
 */

import { useState, useEffect, useMemo } from 'react';
import { Card as CardComponent } from '../Card';
import { PlayerPosition } from './PlayerPosition';
import { ConfettiEffect } from '../ConfettiEffect';
import { GameState, TrickCard, Player } from '../../types/game';
import logger from '../../utils/logger';

interface TrickWinnerInfo {
  playerName: string;
  points: number;
  teamId: 1 | 2;
  position: 'bottom' | 'left' | 'top' | 'right';
}

export interface TrickAreaProps {
  gameState: GameState;
  currentPlayerId: string;
  currentPlayerIndex: number;
  currentTrickWinnerId: string | null;
  isSpectator: boolean;
  onSwapPosition?: (targetPlayerId: string) => void;
  trickWinner?: TrickWinnerInfo | null;
}

export function TrickArea({
  gameState,
  currentPlayerId,
  currentPlayerIndex,
  currentTrickWinnerId,
  isSpectator,
  onSwapPosition,
  trickWinner,
}: TrickAreaProps) {
  const [showPreviousTrick, setShowPreviousTrick] = useState(false);
  const [trickCollectionAnimation, setTrickCollectionAnimation] = useState(false);
  const [lastTrickLength, setLastTrickLength] = useState(0);

  // Find current player
  const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);

  // Get card positions in circular layout (bottom, left, top, right)
  const getCardPositions = (trick: TrickCard[]): (TrickCard | null)[] => {
    const positions: (TrickCard | null)[] = [null, null, null, null];

    trick.forEach(tc => {
      // Find player by ID first, then match by name as fallback (for reconnection stability)
      const playerIndex = gameState.players.findIndex(
        p => p.id === tc.playerId || p.name === tc.playerName
      );

      if (playerIndex === -1) {
        logger.warn(`[TrickArea] Player not found for card:`, { playerId: tc.playerId, playerName: tc.playerName });
        return;
      }

      // Calculate relative position (0=bottom, 1=left, 2=top, 3=right)
      const relativePosition = (playerIndex - currentPlayerIndex + 4) % 4;
      positions[relativePosition] = tc;
    });

    return positions;
  };

  const cardPositions = useMemo(
    () => getCardPositions(gameState.currentTrick),
    [gameState.currentTrick, gameState.players, currentPlayerIndex]
  );

  const previousCardPositions = useMemo(
    () => (gameState.previousTrick ? getCardPositions(gameState.previousTrick.trick) : null),
    [gameState.previousTrick, gameState.players, currentPlayerIndex]
  );

  // Trigger trick collection animation
  useEffect(() => {
    if (gameState.currentTrick.length === 4 && lastTrickLength !== 4) {
      setTrickCollectionAnimation(true);
      const timeout = setTimeout(() => setTrickCollectionAnimation(false), 2000);
      return () => clearTimeout(timeout);
    }
    setLastTrickLength(gameState.currentTrick.length);
  }, [gameState.currentTrick.length, lastTrickLength]);

  // Helper: Get player at circular position
  const getPlayer = (positionIndex: number): Player | null => {
    const playerIndex = (currentPlayerIndex + positionIndex) % 4;
    return gameState.players[playerIndex] || null;
  };

  // Helper: Check if player is thinking (bot's turn)
  const isPlayerThinking = (positionIndex: number): boolean => {
    const playerIndex = (currentPlayerIndex + positionIndex) % 4;
    const player = gameState.players[playerIndex];
    return (
      player?.isBot === true &&
      gameState.currentPlayerIndex === playerIndex &&
      !gameState.currentTrick.some(tc => tc.playerId === player.id)
    );
  };

  // Helper: Check if swap is allowed
  const canSwapWithPlayer = (positionIndex: number): boolean => {
    if (!currentPlayer || !onSwapPosition || isSpectator) return false;

    // Only during active gameplay
    if (gameState.phase === 'team_selection' || gameState.phase === 'game_over') return false;

    const player = getPlayer(positionIndex);

    // Can't swap with yourself
    if (!player || player.id === currentPlayerId) return false;

    return true;
  };

  // Render individual card with animations
  const renderCard = (
    tc: TrickCard | null,
    isWinner: boolean = false,
    positionIndex?: number
  ) => {
    if (!tc) {
      return (
        <div className="w-16 h-24 md:w-20 md:h-28 border-2 border-dashed border-parchment-400 dark:border-gray-600/40 rounded-xl flex items-center justify-center bg-parchment-300/50 dark:bg-gray-600/20 backdrop-blur">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-dashed border-parchment-400 dark:border-gray-600/50 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-parchment-500/40 dark:bg-parchment-400/30"></div>
          </div>
        </div>
      );
    }

    // Determine animation classes
    let animationClass = '';

    // Trick collection animation - all cards move to winner (PRIORITY)
    if (trickCollectionAnimation && gameState.currentTrick.length === 4) {
      const winnerPosition = cardPositions.findIndex(cp => cp?.playerId === currentTrickWinnerId);
      if (winnerPosition !== -1 && positionIndex !== undefined) {
        const directions = ['bottom', 'left', 'top', 'right'];
        const winnerDir = directions[winnerPosition];
        animationClass = `animate-collect-to-${winnerDir}`;
      }
    }
    // Card play animation - cards slide in from their position (ONLY when trick not complete)
    else if (positionIndex !== undefined && gameState.currentTrick.length < 4) {
      const slideDirections = [
        'animate-slide-from-bottom',
        'animate-slide-from-left',
        'animate-slide-from-top',
        'animate-slide-from-right',
      ];
      animationClass = slideDirections[positionIndex];
    }

    return (
      <div
        className={`inline-block transition-all duration-500 ${
          isWinner
            ? 'scale-110 ring-4 md:ring-6 ring-yellow-400 rounded-lg shadow-2xl shadow-yellow-400/50'
            : ''
        } ${animationClass}`}
      >
        <CardComponent card={tc.card} size="small" />
      </div>
    );
  };

  // Render player position with badge and swap button
  const renderPlayerPosition = (positionIndex: number) => {
    const player = getPlayer(positionIndex);
    const isYou = positionIndex === 0; // Bottom position is always "You"
    const isWinner = Boolean(
      cardPositions[positionIndex]?.playerId === currentTrickWinnerId ||
        (showPreviousTrick &&
          previousCardPositions &&
          previousCardPositions[positionIndex]?.playerId === gameState.previousTrick?.winnerId)
    );

    return (
      <PlayerPosition
        player={player}
        isYou={isYou}
        isWinner={isWinner}
        canSwap={canSwapWithPlayer(positionIndex)}
        isThinking={isPlayerThinking(positionIndex)}
        onSwap={() => player && onSwapPosition?.(player.id)}
        currentPlayerTeamId={currentPlayer?.teamId}
      />
    );
  };

  return (
    <div className="flex-1 flex items-center justify-center mb-4 md:mb-6 relative">
      {/* Previous Trick Button - Top Left Corner */}
      {gameState.previousTrick && (
        <button
          onClick={() => setShowPreviousTrick(!showPreviousTrick)}
          className={`absolute top-2 md:top-4 left-2 md:left-4 z-50 ${
            showPreviousTrick
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700'
          } active:scale-95 text-parchment-50 w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2 rounded-full md:rounded-lg text-base md:text-sm font-bold transition-all duration-200 shadow-2xl hover:shadow-2xl flex items-center justify-center backdrop-blur-md border-2`}
          title={showPreviousTrick ? 'Current Trick' : 'Previous Trick'}
        >
          <span className="md:hidden">{showPreviousTrick ? '▶️' : '⏮️'}</span>
          <span className="hidden md:inline">{showPreviousTrick ? '▶️ Current' : '⏮️ Previous'}</span>
        </button>
      )}

      {showPreviousTrick && previousCardPositions ? (
        // Previous Trick View
        <>
          {/* Modal overlay background */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-lg z-30" />

          {/* Title */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-50">
            <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 border-2 border-yellow-400/50">
              <div className="text-yellow-400 text-sm md:text-2xl font-bold mb-1 md:mb-2 drop-shadow-lg">
                Previous Trick
              </div>
              <div className="text-white text-xs md:text-lg drop-shadow-md">
                Winner:{' '}
                {gameState.previousTrick
                  ? gameState.players.find(p => p.id === gameState.previousTrick?.winnerId)?.name
                  : ''}
              </div>
              <div className="text-white/80 text-xs md:text-sm">
                +{gameState.previousTrick?.points || 0} points
              </div>
            </div>
          </div>

          {/* Circular Layout - Previous Trick */}
          <div className="relative h-[340px] md:h-[380px] w-full min-w-[320px] md:min-w-[400px] max-w-[500px] mx-auto z-40">
            {/* Bottom (position 0) */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 md:gap-1.5">
              {renderCard(previousCardPositions[0], previousCardPositions[0]?.playerId === gameState.previousTrick?.winnerId, 0)}
              {renderPlayerPosition(0)}
            </div>

            {/* Left (position 1) */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 flex flex-col items-center gap-1.5 md:gap-2">
              {renderCard(previousCardPositions[1], previousCardPositions[1]?.playerId === gameState.previousTrick?.winnerId, 1)}
              {renderPlayerPosition(1)}
            </div>

            {/* Top (position 2) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 md:gap-1.5">
              {renderPlayerPosition(2)}
              {renderCard(previousCardPositions[2], previousCardPositions[2]?.playerId === gameState.previousTrick?.winnerId, 2)}
            </div>

            {/* Right (position 3) */}
            <div className="absolute top-1/2 right-0 -translate-y-1/2 flex flex-col items-center gap-1.5 md:gap-2">
              {renderCard(previousCardPositions[3], previousCardPositions[3]?.playerId === gameState.previousTrick?.winnerId, 3)}
              {renderPlayerPosition(3)}
            </div>
          </div>
        </>
      ) : (
        // Current Trick View
        <>
          <div className="relative h-[340px] md:h-[380px] w-full min-w-[320px] md:min-w-[400px] max-w-[500px] mx-auto" data-testid="trick-area">
            {/* Bottom (position 0) - You */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 md:gap-1.5">
              {renderCard(cardPositions[0], cardPositions[0]?.playerId === currentTrickWinnerId, 0)}
              {renderPlayerPosition(0)}
            </div>

            {/* Left (position 1) */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 flex flex-col items-center gap-1.5 md:gap-2">
              {renderCard(cardPositions[1], cardPositions[1]?.playerId === currentTrickWinnerId, 1)}
              {renderPlayerPosition(1)}
            </div>

            {/* Top (position 2) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 md:gap-1.5">
              {renderPlayerPosition(2)}
              {renderCard(cardPositions[2], cardPositions[2]?.playerId === currentTrickWinnerId, 2)}
            </div>

            {/* Right (position 3) */}
            <div className="absolute top-1/2 right-0 -translate-y-1/2 flex flex-col items-center gap-1.5 md:gap-2">
              {renderCard(cardPositions[3], cardPositions[3]?.playerId === currentTrickWinnerId, 3)}
              {renderPlayerPosition(3)}
            </div>

            {/* Confetti Effect - positioned relative to this container */}
            {trickWinner && (
              <ConfettiEffect
                position={trickWinner.position}
                teamColor={trickWinner.teamId === 1 ? 'orange' : 'purple'}
                duration={2000}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

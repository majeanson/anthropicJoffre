/**
 * TrickArea Component - Multi-Skin Edition
 *
 * Circular trick layout with 4 player positions.
 * Uses CSS variables for skin compatibility.
 */

import { useState, useEffect, useMemo, memo } from 'react';
import { Card as CardComponent } from '../Card';
import { PlayerPosition } from './PlayerPosition';
import { ConfettiEffect } from '../ConfettiEffect';
import { GameState, TrickCard, Player } from '../../types/game';
import { Button } from '../ui/Button';
import logger from '../../utils/logger';
import type { MoveSuggestion } from '../../utils/moveSuggestion';
import type { AchievementProgress } from '../../types/achievements';

interface TrickWinnerInfo {
  playerName: string;
  points: number;
  teamId: 1 | 2;
  position: 'bottom' | 'left' | 'top' | 'right';
}

export interface TrickAreaProps {
  gameState: GameState;
  currentPlayerIndex: number;
  currentTrickWinnerId: string | null;
  isSpectator: boolean;
  trickWinner?: TrickWinnerInfo | null;
  onClickPlayer?: (playerName: string) => void;
  botThinkingMap: Map<string, string>;
  openThinkingButtons: Set<string>;
  onToggleBotThinking: (botName: string) => void;
  currentSuggestion: MoveSuggestion | null;
  suggestionOpen: boolean;
  onToggleSuggestion: () => void;
  beginnerMode: boolean;
  isCurrentTurn: boolean;
  /** Map of player names to their top achievement badges */
  playerAchievements?: Map<string, AchievementProgress[]>;
}

export const TrickArea = memo(function TrickArea({
  gameState,
  currentPlayerIndex,
  currentTrickWinnerId,
  isSpectator,
  trickWinner,
  onClickPlayer,
  botThinkingMap,
  openThinkingButtons,
  onToggleBotThinking,
  currentSuggestion,
  suggestionOpen,
  onToggleSuggestion,
  beginnerMode,
  isCurrentTurn,
  playerAchievements,
}: TrickAreaProps) {
  const [showPreviousTrick, setShowPreviousTrick] = useState(false);
  const [trickCollectionAnimation, setTrickCollectionAnimation] = useState(false);
  const [lastTrickLength, setLastTrickLength] = useState(0);

  // Get card positions in circular layout (bottom, left, top, right)
  const getCardPositions = (trick: TrickCard[]): (TrickCard | null)[] => {
    const positions: (TrickCard | null)[] = [null, null, null, null];

    trick.forEach((tc) => {
      const playerIndex = gameState.players.findIndex(
        (p) => p.id === tc.playerId || p.name === tc.playerName
      );

      if (playerIndex === -1) {
        logger.warn(`[TrickArea] Player not found for card:`, {
          playerId: tc.playerId,
          playerName: tc.playerName,
        });
        return;
      }

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

  // Helper: Check if player is thinking
  const isPlayerThinking = (positionIndex: number): boolean => {
    const playerIndex = (currentPlayerIndex + positionIndex) % 4;
    const player = gameState.players[playerIndex];
    return (
      player?.isBot === true &&
      gameState.currentPlayerIndex === playerIndex &&
      !gameState.currentTrick.some((tc) => tc.playerId === player.id)
    );
  };

  // Render individual card with animations
  const renderCard = (tc: TrickCard | null, isWinner: boolean = false, positionIndex?: number) => {
    if (!tc) {
      return (
        <div className="w-[4rem] h-[6rem] sm:w-[4.5rem] sm:h-[6.75rem] md:w-16 md:h-28 border-2 border-dashed border-skin-subtle bg-skin-tertiary rounded-[var(--radius-lg)] flex items-center justify-center">
          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full border-2 border-dashed border-skin-subtle flex items-center justify-center">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-skin-muted opacity-40" />
          </div>
        </div>
      );
    }

    // Determine animation classes
    let animationClass = '';

    if (trickCollectionAnimation && gameState.currentTrick.length === 4) {
      const winnerPosition = cardPositions.findIndex((cp) => cp?.playerId === currentTrickWinnerId);
      if (winnerPosition !== -1 && positionIndex !== undefined) {
        const directions = ['bottom', 'left', 'top', 'right'];
        const winnerDir = directions[winnerPosition];
        animationClass = `animate-collect-to-${winnerDir}`;
      }
    } else if (positionIndex !== undefined && gameState.currentTrick.length < 4) {
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
          isWinner ? 'scale-110 rounded-lg shadow-turn-active' : ''
        } ${animationClass}`}
      >
        <CardComponent card={tc.card} size="medium" />
      </div>
    );
  };

  // Render player position with badge
  const renderPlayerPosition = (positionIndex: number) => {
    const player = getPlayer(positionIndex);
    const isYou = positionIndex === 0;
    const isWinner = Boolean(
      cardPositions[positionIndex]?.playerId === currentTrickWinnerId ||
        (showPreviousTrick &&
          previousCardPositions &&
          previousCardPositions[positionIndex]?.playerId === gameState.previousTrick?.winnerId)
    );

    const botThinking =
      beginnerMode && player?.isBot && player.name && botThinkingMap.has(player.name)
        ? botThinkingMap.get(player.name)!
        : null;
    const botThinkingOpen = player?.name ? openThinkingButtons.has(player.name) : false;

    const tooltipPositions: ('top' | 'bottom' | 'left' | 'right')[] = [
      'top',
      'right',
      'bottom',
      'left',
    ];
    const tooltipPosition = tooltipPositions[positionIndex];

    const showSuggestion = Boolean(
      isYou && isCurrentTurn && beginnerMode && currentSuggestion && !isSpectator
    );

    // Get achievement badges for this player
    const badges = player?.name && playerAchievements?.get(player.name);

    return (
      <PlayerPosition
        player={player}
        isYou={isYou}
        isWinner={isWinner}
        isThinking={isPlayerThinking(positionIndex)}
        onClickPlayer={onClickPlayer}
        botThinking={botThinking}
        botThinkingOpen={botThinkingOpen}
        onToggleBotThinking={() => player?.name && onToggleBotThinking(player.name)}
        tooltipPosition={tooltipPosition}
        showSuggestion={showSuggestion}
        suggestion={currentSuggestion}
        suggestionOpen={suggestionOpen}
        onToggleSuggestion={onToggleSuggestion}
        achievementBadges={badges || undefined}
      />
    );
  };

  return (
    <div className="flex-1 flex items-center justify-center mb-2 sm:mb-4 md:mb-6 relative touch-manipulation">
      {/* Previous Trick Button - Inside playing field top-left, z-60 to stay above modal */}
      {gameState.previousTrick && (
        <div className="absolute top-0 left-0 z-[60]">
          <Button
            onClick={() => setShowPreviousTrick(!showPreviousTrick)}
            variant={showPreviousTrick ? 'primary' : 'warning'}
            size="sm"
          >
            <span className="md:hidden" aria-hidden="true">
              {showPreviousTrick ? '▶️' : '⏮️'}
            </span>
            <span className="hidden md:inline">
              {showPreviousTrick ? '▶️ Current' : '⏮️ Previous'}
            </span>
          </Button>
        </div>
      )}

      {showPreviousTrick && previousCardPositions ? (
        // Previous Trick View
        <>
          {/* Modal overlay */}
          <div className="absolute inset-0 rounded-[var(--radius-lg)] z-30 bg-black/50 backdrop-blur-sm" />

          {/* Title */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-50">
            <div className="rounded-[var(--radius-lg)] px-4 py-2 border-2 border-skin-warning bg-skin-tertiary shadow-[0_0_15px_var(--color-warning)]">
              <div className="text-sm md:text-2xl font-display uppercase tracking-wider mb-1 md:mb-2 text-skin-warning">
                Previous Trick
              </div>
              <div className="text-xs md:text-lg text-skin-primary">
                Winner:{' '}
                {gameState.players.find((p) => p.id === gameState.previousTrick?.winnerId)?.name}
              </div>
              <div className="text-xs md:text-sm text-skin-muted">
                +{gameState.previousTrick?.points || 0} points
              </div>
            </div>
          </div>

          {/* Circular Layout - Previous Trick */}
          <div className="relative h-[220px] sm:h-[300px] md:h-[380px] w-full min-w-[260px] sm:min-w-[320px] md:min-w-[400px] max-w-[500px] mx-auto z-40">
            {/* Bottom */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 md:gap-1.5">
              {renderCard(
                previousCardPositions[0],
                previousCardPositions[0]?.playerId === gameState.previousTrick?.winnerId,
                0
              )}
              {renderPlayerPosition(0)}
            </div>

            {/* Left */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 flex flex-col items-center gap-1.5 md:gap-2">
              {renderCard(
                previousCardPositions[1],
                previousCardPositions[1]?.playerId === gameState.previousTrick?.winnerId,
                1
              )}
              {renderPlayerPosition(1)}
            </div>

            {/* Top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 md:gap-1.5">
              {renderPlayerPosition(2)}
              {renderCard(
                previousCardPositions[2],
                previousCardPositions[2]?.playerId === gameState.previousTrick?.winnerId,
                2
              )}
            </div>

            {/* Right */}
            <div className="absolute top-1/2 right-0 -translate-y-1/2 flex flex-col items-center gap-1.5 md:gap-2">
              {renderCard(
                previousCardPositions[3],
                previousCardPositions[3]?.playerId === gameState.previousTrick?.winnerId,
                3
              )}
              {renderPlayerPosition(3)}
            </div>
          </div>
        </>
      ) : (
        // Current Trick View
        <>
          <div
            className="relative h-[280px] sm:h-[320px] md:h-[380px] w-full min-w-[280px] sm:min-w-[320px] md:min-w-[400px] max-w-[500px] mx-auto"
            data-testid="trick-area"
          >
            {/* Bottom - card above name, positioned from bottom edge */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5">
              {renderCard(cardPositions[0], cardPositions[0]?.playerId === currentTrickWinnerId, 0)}
              {renderPlayerPosition(0)}
            </div>

            {/* Left */}
            <div className="absolute top-1/2 left-2 sm:left-0 -translate-y-1/2 flex flex-col items-center gap-1 md:gap-2">
              {renderCard(cardPositions[1], cardPositions[1]?.playerId === currentTrickWinnerId, 1)}
              {renderPlayerPosition(1)}
            </div>

            {/* Top - name above card, positioned from top edge */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5">
              {renderPlayerPosition(2)}
              {renderCard(cardPositions[2], cardPositions[2]?.playerId === currentTrickWinnerId, 2)}
            </div>

            {/* Right */}
            <div className="absolute top-1/2 right-2 sm:right-0 -translate-y-1/2 flex flex-col items-center gap-1 md:gap-2">
              {renderCard(cardPositions[3], cardPositions[3]?.playerId === currentTrickWinnerId, 3)}
              {renderPlayerPosition(3)}
            </div>

            {/* Winner Effect */}
            {trickWinner && (
              <ConfettiEffect
                position={trickWinner.position}
                teamColor={trickWinner.teamId === 1 ? 'orange' : 'purple'}
                duration={2000}
                points={trickWinner.points}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
});

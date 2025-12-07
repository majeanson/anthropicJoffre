/**
 * GameReplay Component
 *
 * Displays a replay of a completed game with playback controls.
 * Features:
 * - Auto-playback with adjustable speed
 * - Round and trick navigation
 * - Player hands display with played cards grayed out
 * - Keyboard navigation (Escape to close)
 *
 * Refactored into sub-components for better maintainability.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card as CardType } from '../../types/game';
import { sounds } from '../../utils/sounds';
import { TrickHistory } from '../TrickHistory';
import { Modal, Button, Spinner, UICard } from '../ui';
import logger from '../../utils/logger';
import { GameReplayProps, PlaySpeed } from './types';
import { useReplayData } from './useReplayData';
import { ReplayHeader } from './ReplayHeader';
import { ReplayInfoBar } from './ReplayInfoBar';
import { RoundInfo } from './RoundInfo';
import { TrickDisplay } from './TrickDisplay';
import { PlayerHandsDisplay } from './PlayerHandsDisplay';
import { PlaybackControls } from './PlaybackControls';

export function GameReplay({ gameId, socket, onClose }: GameReplayProps) {
  const { replayData, loading, error, correlationId, retry } = useReplayData({
    gameId,
    socket,
  });

  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentTrickIndex, setCurrentTrickIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState<PlaySpeed>(1);

  // Auto-playback effect - MUST be before early returns to follow Rules of Hooks
  useEffect(() => {
    if (!isPlaying || !replayData) return;

    const currentRound = replayData.round_history[currentRoundIndex];
    if (!currentRound) return;

    const currentTricks = currentRound.tricks || [];
    const hasNextTrick = currentTrickIndex < currentTricks.length - 1;
    const hasNextRound = currentRoundIndex < replayData.round_history.length - 1;

    const delay = playSpeed === 0.5 ? 4000 : playSpeed === 1 ? 2000 : 1000;
    const timer = setTimeout(() => {
      if (hasNextTrick) {
        setCurrentTrickIndex((prev) => prev + 1);
      } else if (hasNextRound) {
        setCurrentRoundIndex((prev) => prev + 1);
        setCurrentTrickIndex(0);
      } else {
        setIsPlaying(false);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [isPlaying, currentTrickIndex, currentRoundIndex, playSpeed, replayData]);

  // Close replay on Escape key for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Memoized computations for performance optimization
  const currentRoundData = useMemo(() => {
    if (!replayData || !replayData.round_history || replayData.round_history.length === 0) {
      return {
        currentRound: null,
        currentTricks: [],
        hasNextRound: false,
        hasPrevRound: false,
        hasNextTrick: false,
        hasPrevTrick: false,
      };
    }

    const currentRound = replayData.round_history[currentRoundIndex];
    const currentTricks = currentRound?.tricks || [];
    return {
      currentRound,
      currentTricks,
      hasNextRound: currentRoundIndex < replayData.round_history.length - 1,
      hasPrevRound: currentRoundIndex > 0,
      hasNextTrick: currentTrickIndex < currentTricks.length - 1,
      hasPrevTrick: currentTrickIndex > 0,
    };
  }, [replayData, currentRoundIndex, currentTrickIndex]);

  const { currentRound, currentTricks, hasNextRound, hasPrevRound, hasNextTrick, hasPrevTrick } =
    currentRoundData;

  // Calculate starting hands from trick history
  const startingHands = useMemo(() => {
    if (!currentRound?.tricks || currentRound.tricks.length === 0) return {};

    const hands: Record<string, CardType[]> = {};
    if (replayData) {
      replayData.player_names.forEach((name) => (hands[name] = []));

      currentRound.tricks.forEach((trick) => {
        trick.trick.forEach((trickCard) => {
          if (!hands[trickCard.playerName]) {
            logger.warn('[GameReplay] Calculating starting hands: Player not found', {
              action: 'Building hand from trick history',
              playerNameFromTrick: trickCard.playerName,
              availablePlayers: Object.keys(hands),
              round: currentRoundIndex,
              trick: currentTrickIndex,
            });
            hands[trickCard.playerName] = [];
          }
          hands[trickCard.playerName].push(trickCard.card);
        });
      });
    }

    return hands;
  }, [currentRound, replayData, currentRoundIndex, currentTrickIndex]);

  // Calculate which cards have been played so far
  const playedCards = useMemo(() => {
    const played: Set<string> = new Set();

    if (!currentTricks) return played;

    for (let i = 0; i <= currentTrickIndex && i < currentTricks.length; i++) {
      currentTricks[i].trick.forEach((trickCard) => {
        played.add(`${trickCard.card.color}-${trickCard.card.value}`);
      });
    }

    return played;
  }, [currentTricks, currentTrickIndex]);

  // Memoized navigation callbacks
  const navigateToRound = useCallback(
    (index: number) => {
      if (index >= 0 && index < (replayData?.round_history?.length || 0)) {
        setCurrentRoundIndex(index);
        setCurrentTrickIndex(0);
        setIsPlaying(false);
        sounds.trickWon();
      }
    },
    [replayData]
  );

  const handleNextTrick = useCallback(() => {
    if (hasNextTrick) {
      setCurrentTrickIndex((prev) => prev + 1);
      sounds.cardPlay();
    } else if (hasNextRound) {
      setCurrentRoundIndex((prev) => prev + 1);
      setCurrentTrickIndex(0);
      sounds.trickWon();
    }
  }, [hasNextTrick, hasNextRound]);

  const handlePrevTrick = useCallback(() => {
    if (hasPrevTrick) {
      setCurrentTrickIndex((prev) => prev - 1);
      sounds.cardPlay();
    } else if (hasPrevRound) {
      const prevRoundIndex = currentRoundIndex - 1;
      const prevRound = replayData?.round_history[prevRoundIndex];
      const lastTrickIndex = (prevRound?.tricks?.length || 1) - 1;
      setCurrentRoundIndex(prevRoundIndex);
      setCurrentTrickIndex(lastTrickIndex);
      sounds.trickWon();
    }
  }, [hasPrevTrick, hasPrevRound, currentRoundIndex, replayData]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
    sounds.cardPlay();
  }, []);

  const handleShare = useCallback(() => {
    const replayUrl = `${window.location.origin}?replay=${gameId}`;
    navigator.clipboard.writeText(replayUrl);
    sounds.buttonClick();
  }, [gameId]);

  // Early returns AFTER all hooks
  if (loading) {
    return (
      <Modal
        isOpen={true}
        onClose={onClose}
        size="sm"
        showCloseButton={false}
        theme="minimal"
        testId="loading-modal"
      >
        <div className="text-center py-4">
          <Spinner size="lg" color="primary" className="mb-4" />
          <p className="text-lg font-semibold text-skin-secondary" data-testid="loading-message">
            Loading replay...
          </p>
        </div>
      </Modal>
    );
  }

  if (error || !replayData) {
    return (
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Error"
        icon="⚠️"
        theme="red"
        size="sm"
        testId="error-modal"
      >
        <div className="text-center">
          <p className="text-lg font-semibold text-skin-error mb-2" data-testid="error-message">
            {error || 'Failed to load replay'}
          </p>
          {correlationId && (
            <UICard
              variant="default"
              size="sm"
              className="mt-4 !bg-skin-error/10 !border-skin-error"
              data-testid="error-correlation-id"
            >
              <p className="text-xs text-skin-error font-mono">Error ID: {correlationId}</p>
              <p className="text-xs text-skin-error mt-1 opacity-75">
                Please include this ID when reporting the issue
              </p>
            </UICard>
          )}
          <div className="flex gap-3 mt-6 justify-center">
            <Button
              data-testid="retry-button"
              onClick={retry}
              variant="success"
              leftIcon={<span>🔄</span>}
            >
              Try Again
            </Button>
            <Button data-testid="close-button" onClick={onClose} variant="secondary">
              Close
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  // Validate replay data has rounds
  if (!replayData.round_history || replayData.round_history.length === 0) {
    return (
      <Modal
        isOpen={true}
        onClose={onClose}
        title="No Replay Data"
        icon="⚠️"
        theme="minimal"
        size="sm"
        testId="no-data-modal"
      >
        <div className="text-center">
          <p className="text-lg font-semibold text-yellow-600 mb-2" data-testid="no-data-warning">
            No Replay Data Available
          </p>
          <p className="text-sm text-skin-secondary mb-4">
            This game has no recorded rounds. The game may have ended prematurely or data was not
            saved.
          </p>
          <Button data-testid="close-button" onClick={onClose} variant="primary">
            Close
          </Button>
        </div>
      </Modal>
    );
  }

  const currentTrick = currentTricks[currentTrickIndex];

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 md:p-4"
      onClick={onClose}
      onKeyDown={(e) => e.stopPropagation()}
      role="presentation"
      aria-hidden="true"
    >
      <div
        className="bg-skin-primary rounded-xl md:rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto border-2 md:border-4 border-emerald-600"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <ReplayHeader
          gameId={gameId}
          totalRounds={replayData.rounds}
          onShare={handleShare}
          onClose={onClose}
        />

        {/* Game Info Bar */}
        <ReplayInfoBar replayData={replayData} />

        {/* Current Round/Trick Info */}
        {currentRound && (
          <RoundInfo
            currentRound={currentRound}
            currentRoundIndex={currentRoundIndex}
            totalRounds={replayData.round_history.length}
            currentTrickIndex={currentTrickIndex}
            totalTricks={currentTricks.length}
          />
        )}

        {/* Main Content */}
        <div className="p-4 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
            {/* Left: Trick Display */}
            <div className="lg:col-span-2">
              {/* Current Trick */}
              {currentTrick && (
                <TrickDisplay
                  trick={currentTrick}
                  playerNames={replayData.player_names}
                  playerTeams={replayData.player_teams}
                  playedCards={playedCards}
                />
              )}

              {/* Player Hands */}
              <PlayerHandsDisplay
                startingHands={startingHands}
                playerNames={replayData.player_names}
                playerTeams={replayData.player_teams}
                playedCards={playedCards}
              />
            </div>

            {/* Right: Controls & History */}
            <div className="space-y-4 md:space-y-6">
              {/* Playback Controls */}
              <PlaybackControls
                isPlaying={isPlaying}
                playSpeed={playSpeed}
                hasNextTrick={hasNextTrick}
                hasPrevTrick={hasPrevTrick}
                hasNextRound={hasNextRound}
                hasPrevRound={hasPrevRound}
                totalRounds={replayData.round_history.length}
                currentRoundIndex={currentRoundIndex}
                onPlayPause={handlePlayPause}
                onNextTrick={handleNextTrick}
                onPrevTrick={handlePrevTrick}
                onSetSpeed={setPlaySpeed}
                onJumpToRound={navigateToRound}
              />

              {/* Trick History */}
              {currentRound && (
                <div className="bg-skin-primary rounded-xl p-4 md:p-6 shadow-lg border border-skin-default">
                  <h3 className="text-base md:text-lg font-black text-skin-primary mb-3 md:mb-4">
                    Round {currentRoundIndex + 1} Tricks
                  </h3>
                  <TrickHistory
                    tricks={currentTricks}
                    currentTrickIndex={currentTrickIndex}
                    players={[]}
                    trump={null}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Re-export types
export type { GameReplayProps, ReplayData, PlaySpeed } from './types';

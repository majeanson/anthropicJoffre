import { useState, useEffect, useMemo, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { RoundHistory, Card as CardType } from '../types/game';
import { sounds } from '../utils/sounds';
import { TrickHistory } from './TrickHistory';
import { Card } from './Card';
import { Modal, Button, Spinner, UICard } from './ui';
import logger from '../utils/logger';

interface ReplayData {
  game_id: string;
  winning_team: 1 | 2;
  team1_score: number;
  team2_score: number;
  rounds: number;
  player_names: string[];
  player_teams: (1 | 2)[];
  round_history: RoundHistory[];
  trump_suit: string;
  game_duration_seconds: number;
  is_bot_game: boolean;
  created_at: string;
  finished_at: string;
}

interface GameReplayProps {
  gameId: string;
  socket: Socket | null;
  onClose: () => void;
}

export function GameReplay({ gameId, socket, onClose }: GameReplayProps) {
  const [replayData, setReplayData] = useState<ReplayData | null>(null);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentTrickIndex, setCurrentTrickIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState<0.5 | 1 | 2>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [correlationId, setCorrelationId] = useState<string | null>(null);

  // Fetch replay data on mount
  useEffect(() => {
    if (!socket) {
      logger.error('[GameReplay] Socket is null');
      return;
    }

    const handleReplayData = ({ replayData }: { replayData: ReplayData }) => {
      // Validate replay data structure
      if (!replayData) {
        logger.error('[GameReplay] Replay data is null or undefined');
        setError('Replay data is missing');
        setLoading(false);
        return;
      }

      if (!replayData.round_history || !Array.isArray(replayData.round_history)) {
        logger.error(
          '[GameReplay] round_history is missing or not an array:',
          replayData.round_history
        );
        setError('Replay data is malformed (missing round history)');
        setLoading(false);
        return;
      }

      if (replayData.round_history.length === 0) {
        // Don't set error here - let the validation check below handle it with better UX
      }

      setReplayData(replayData);
      setError(null);
      setCorrelationId(null);
      setLoading(false);
    };

    const handleError = (errorData: {
      message?: string;
      correlationId?: string;
      correlation_id?: string;
    }) => {
      logger.error('[GameReplay] Error loading replay', undefined, { errorData, gameId });

      // Extract correlation ID if available
      const corrId = errorData?.correlationId || errorData?.correlation_id || null;
      if (corrId) {
        setCorrelationId(corrId);
      }

      // Set user-friendly error message
      const errorMessage = errorData?.message || 'Failed to load game replay';
      setError(errorMessage);
      setLoading(false);
    };

    socket.on('game_replay_data', handleReplayData);
    socket.on('error', handleError);

    // Request replay data
    socket.emit('get_game_replay', { gameId });

    return () => {
      socket.off('game_replay_data', handleReplayData);
      socket.off('error', handleError);
    };
  }, [socket, gameId]);

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

  // Sprint 8 Task 2: Memoized computations for performance optimization
  // Current round data and navigation state - MUST be before early returns
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

  // Calculate starting hands from trick history (expensive operation) - MUST be before early returns
  const startingHands = useMemo(() => {
    if (!currentRound?.tricks || currentRound.tricks.length === 0) return {};

    const hands: Record<string, CardType[]> = {};
    if (replayData) {
      replayData.player_names.forEach((name) => (hands[name] = []));

      currentRound.tricks.forEach((trick) => {
        trick.trick.forEach((trickCard) => {
          // Defensive check: ensure player exists in hands before pushing
          // This handles cases where player names changed (e.g., bot replacement)
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

  // Calculate which cards have been played so far - MUST be before early returns
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

  // Sprint 8 Task 2: Memoized navigation callbacks - MUST be before early returns
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
          <p
            className="text-lg font-semibold text-skin-secondary"
            data-testid="loading-message"
          >
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
          <p
            className="text-lg font-semibold text-skin-error mb-2"
            data-testid="error-message"
          >
            {error || 'Failed to load replay'}
          </p>
          {correlationId && (
            <UICard
              variant="default"
              size="sm"
              className="mt-4 !bg-skin-error/10 !border-skin-error"
              data-testid="error-correlation-id"
            >
              <p className="text-xs text-skin-error font-mono">
                Error ID: {correlationId}
              </p>
              <p className="text-xs text-skin-error mt-1 opacity-75">
                Please include this ID when reporting the issue
              </p>
            </UICard>
          )}
          <div className="flex gap-3 mt-6 justify-center">
            <Button
              data-testid="retry-button"
              onClick={() => {
                setError(null);
                setCorrelationId(null);
                setLoading(true);
                if (socket) {
                  socket.emit('get_game_replay', { gameId });
                }
              }}
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
          <p
            className="text-lg font-semibold text-yellow-600 mb-2"
            data-testid="no-data-warning"
          >
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
  const currentBet = currentRound?.highestBet;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 md:p-4"
      onClick={onClose}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div
        className="bg-skin-primary rounded-xl md:rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto border-2 md:border-4 border-emerald-600"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 md:px-8 py-4 md:py-6 rounded-t-lg md:rounded-t-xl">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-4 min-w-0">
              <span className="text-2xl md:text-4xl" aria-hidden="true">
                🎮
              </span>
              <div className="min-w-0">
                <h2 className="text-xl md:text-3xl font-black">Game Replay</h2>
                <p className="text-emerald-100 text-xs md:text-sm mt-1 truncate">
                  ID: {gameId} • {replayData.rounds} rounds
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              {/* Share Button */}
              <Button
                onClick={() => {
                  const replayUrl = `${window.location.origin}?replay=${gameId}`;
                  navigator.clipboard.writeText(replayUrl);
                  sounds.buttonClick();
                }}
                variant="ghost"
                size="sm"
                className="!bg-white/20 hover:!bg-white/30 !text-white !border-0"
                title="Copy replay link"
                leftIcon={<span aria-hidden="true">🔗</span>}
              >
                <span className="hidden md:inline">Share</span>
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="!bg-transparent !border-0 !text-white hover:!text-emerald-100 !text-2xl md:!text-4xl !p-1"
                aria-label="Close replay viewer"
              >
                ×
              </Button>
            </div>
          </div>
        </div>

        {/* Game Info Bar */}
        <div className="bg-skin-primary px-4 md:px-8 py-3 md:py-4 border-b-2 border-skin-default">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="grid grid-cols-2 md:flex gap-3 md:gap-6">
              {/* Final Score */}
              <div className="flex items-center gap-2 md:gap-3">
                <span className="text-xl md:text-2xl">🏆</span>
                <div>
                  <p className="text-xs text-skin-muted">Final Score</p>
                  <div
                    className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2"
                    data-testid="final-scores"
                  >
                    <span
                      className={`text-sm md:text-xl font-black ${replayData.winning_team === 1 ? 'text-green-600' : 'text-gray-600'}`}
                      data-testid="team1-score"
                    >
                      T1: {replayData.team1_score}
                    </span>
                    <span className="hidden md:inline text-gray-400">vs</span>
                    <span
                      className={`text-sm md:text-xl font-black ${replayData.winning_team === 2 ? 'text-green-600' : 'text-gray-600'}`}
                      data-testid="team2-score"
                    >
                      T2: {replayData.team2_score}
                    </span>
                  </div>
                </div>
              </div>

              {/* Game Duration */}
              <div className="flex items-center gap-2">
                <span className="text-lg md:text-xl">⏱️</span>
                <div>
                  <p className="text-xs text-skin-muted">Duration</p>
                  <p className="text-sm md:text-lg font-bold text-skin-secondary">
                    {Math.floor(replayData.game_duration_seconds / 60)}m{' '}
                    {replayData.game_duration_seconds % 60}s
                  </p>
                </div>
              </div>

              {/* Players - Hidden on mobile, shown on larger screens */}
              <div className="hidden md:flex items-center gap-2 col-span-2">
                <span className="text-xl">👥</span>
                <div>
                  <p className="text-xs text-skin-muted">Players</p>
                  <div className="flex flex-wrap gap-2">
                    {replayData.player_names.map((name, idx) => (
                      <span
                        key={idx}
                        className={`text-xs px-2 py-1 rounded ${
                          replayData.player_teams[idx] === 1
                            ? 'bg-team1/20 text-team1'
                            : 'bg-team2/20 text-team2'
                        }`}
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bot Game Indicator */}
            {replayData.is_bot_game && (
              <div className="flex items-center gap-2 px-2 md:px-3 py-1 bg-skin-info/20 rounded-lg self-start md:self-auto">
                <span className="text-lg md:text-xl">🤖</span>
                <span className="text-xs md:text-sm font-semibold text-skin-info">
                  Bot Game
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Current Round/Trick Info */}
        {currentRound && (
          <div className="bg-skin-secondary px-4 md:px-8 py-3 md:py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-4 md:gap-6 flex-wrap">
                <div>
                  <p className="text-xs text-skin-muted font-semibold">Round</p>
                  <p className="text-xl md:text-2xl font-black text-skin-accent">
                    {currentRoundIndex + 1} / {replayData.round_history.length}
                  </p>
                </div>

                {currentBet && (
                  <>
                    <div className="hidden md:block w-px h-8 bg-skin-tertiary" />
                    <div>
                      <p className="text-xs text-skin-muted font-semibold">Bet</p>
                      <p className="text-sm md:text-lg font-bold text-skin-secondary">
                        {currentBet.amount} {currentBet.withoutTrump && '(NT)'}
                      </p>
                    </div>
                  </>
                )}

                <div className="hidden md:block w-px h-8 bg-skin-tertiary" />
                <div>
                  <p className="text-xs text-skin-muted font-semibold">Trick</p>
                  <p className="text-xl md:text-2xl font-black text-team2">
                    {currentTrickIndex + 1} / {currentTricks.length}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm md:text-base">
                <span className="text-xs text-skin-muted">Score:</span>
                <span className="font-bold text-team1">
                  T1: {currentRound.roundScore?.team1 || 0}
                </span>
                <span className="text-gray-400">/</span>
                <span className="font-bold text-team2">
                  T2: {currentRound.roundScore?.team2 || 0}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="p-4 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
            {/* Left: Trick Display */}
            <div className="lg:col-span-2">
              {/* Current Trick */}
              {currentTrick && (
                <div className="bg-skin-primary rounded-xl p-4 md:p-6 shadow-lg mb-4 md:mb-6 border border-skin-default">
                  <h3 className="text-lg md:text-xl font-black text-skin-primary mb-3 md:mb-4 flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl md:text-2xl">🎴</span>
                      <span>Current Trick</span>
                    </div>
                    {currentTrick.winnerName && (
                      <span className="md:ml-auto text-xs md:text-sm font-semibold text-skin-success">
                        Won by {currentTrick.winnerName} ({currentTrick.points} pts)
                      </span>
                    )}
                  </h3>

                  {/* Cards in Trick */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {currentTrick.trick.map((trickCard, idx) => {
                      const isWinner = trickCard.playerName === currentTrick.winnerName;
                      const cardKey = `${trickCard.card.color}-${trickCard.card.value}`;
                      const isPlayed = playedCards.has(cardKey);

                      return (
                        <div
                          key={idx}
                          className={`relative flex flex-col items-center ${isWinner ? 'ring-4 ring-green-500 ring-offset-2 rounded-xl' : ''}`}
                        >
                          <div className="text-center mb-2">
                            <p
                              className={`text-xs md:text-sm font-bold ${
                                replayData.player_teams[
                                  replayData.player_names.indexOf(trickCard.playerName)
                                ] === 1
                                  ? 'text-team1'
                                  : 'text-team2'
                              }`}
                            >
                              {trickCard.playerName}
                            </p>
                          </div>
                          <div className={isPlayed ? 'opacity-100' : 'opacity-30'}>
                            <Card card={trickCard.card} size="small" />
                          </div>
                          {isWinner && (
                            <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center text-sm md:text-lg z-10">
                              👑
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Player Hands */}
              {Object.keys(startingHands).length > 0 && (
                <div className="bg-skin-primary rounded-xl p-4 md:p-6 shadow-lg border border-skin-default">
                  <h3 className="text-lg md:text-xl font-black text-skin-primary mb-4 flex items-center gap-2">
                    <span className="text-xl md:text-2xl">🃏</span>
                    Player Hands (Round Start)
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(startingHands).map(([playerName, cards]) => {
                      const teamId =
                        replayData.player_teams[replayData.player_names.indexOf(playerName)];
                      return (
                        <div
                          key={playerName}
                          className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3"
                        >
                          <span
                            className={`font-bold text-sm md:w-24 flex-shrink-0 ${
                              teamId === 1 ? 'text-team1' : 'text-team2'
                            }`}
                          >
                            {playerName}:
                          </span>
                          <div className="flex gap-1.5 md:gap-2 flex-wrap overflow-x-auto">
                            {cards.map((card: CardType, idx: number) => {
                              const cardKey = `${card.color}-${card.value}`;
                              const isPlayed = playedCards.has(cardKey);

                              return (
                                <div key={idx} className={isPlayed ? 'opacity-30' : 'opacity-100'}>
                                  <Card card={card} size="tiny" />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Controls & History */}
            <div className="space-y-4 md:space-y-6">
              {/* Playback Controls */}
              <div className="bg-skin-primary rounded-xl p-4 md:p-6 shadow-lg border border-skin-default">
                <h3 className="text-base md:text-lg font-black text-skin-primary mb-3 md:mb-4">
                  Playback Controls
                </h3>

                {/* Speed Control */}
                <div className="mb-3 md:mb-4">
                  <p className="text-xs md:text-sm text-skin-muted mb-2">
                    Speed:
                  </p>
                  <div className="flex gap-2">
                    {[0.5, 1, 2].map((speed) => (
                      <Button
                        key={speed}
                        data-testid={`speed-${speed}x`}
                        onClick={() => setPlaySpeed(speed as 0.5 | 1 | 2)}
                        variant={playSpeed === speed ? 'primary' : 'ghost'}
                        size="sm"
                      >
                        {speed}x
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Play/Pause & Navigation */}
                <div className="flex items-center justify-center gap-3 md:gap-2 mb-3 md:mb-4">
                  <Button
                    data-testid="prev-trick-button"
                    onClick={handlePrevTrick}
                    disabled={!hasPrevTrick && !hasPrevRound}
                    variant="ghost"
                    size="md"
                    aria-label="Previous trick"
                  >
                    ⏮️
                  </Button>
                  <Button
                    data-testid="play-pause-button"
                    onClick={handlePlayPause}
                    variant="primary"
                    size="lg"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? '⏸️' : '▶️'}
                  </Button>
                  <Button
                    data-testid="next-trick-button"
                    onClick={handleNextTrick}
                    disabled={!hasNextTrick && !hasNextRound}
                    variant="ghost"
                    size="md"
                    aria-label="Next trick"
                  >
                    ⏭️
                  </Button>
                </div>

                {/* Round Jump Buttons */}
                <div className="border-t pt-3 md:pt-4 border-skin-default">
                  <p className="text-xs md:text-sm text-skin-muted mb-2">
                    Jump to Round:
                  </p>
                  <div className="grid grid-cols-5 md:grid-cols-3 gap-1">
                    {replayData.round_history.map((_, idx) => (
                      <Button
                        key={idx}
                        data-testid={`round-jump-${idx + 1}`}
                        onClick={() => navigateToRound(idx)}
                        variant={idx === currentRoundIndex ? 'primary' : 'ghost'}
                        size="xs"
                      >
                        R{idx + 1}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

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

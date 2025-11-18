import { useState, useEffect, useMemo, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { RoundHistory } from '../types/game';
import { sounds } from '../utils/sounds';
import { TrickHistory } from './TrickHistory';

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
      console.error('[GameReplay] Socket is null');
      return;
    }

    console.log('[GameReplay] Requesting replay for game:', gameId);

    const handleReplayData = ({ replayData }: { replayData: ReplayData }) => {
      console.log('[GameReplay] Received replay data for game:', replayData?.game_id, 'rounds:', replayData?.rounds);

      // Validate replay data structure
      if (!replayData) {
        console.error('[GameReplay] Replay data is null or undefined');
        setError('Replay data is missing');
        setLoading(false);
        return;
      }

      if (!replayData.round_history || !Array.isArray(replayData.round_history)) {
        console.error('[GameReplay] round_history is missing or not an array:', replayData.round_history);
        setError('Replay data is malformed (missing round history)');
        setLoading(false);
        return;
      }

      if (replayData.round_history.length === 0) {
        console.warn('[GameReplay] round_history is empty for game:', replayData.game_id);
        // Don't set error here - let the validation check below handle it with better UX
      }

      console.log('[GameReplay] Replay data validated successfully. Rounds:', replayData.round_history.length);
      setReplayData(replayData);
      setError(null);
      setCorrelationId(null);
      setLoading(false);
    };

    const handleError = (errorData: { message?: string; correlationId?: string; correlation_id?: string }) => {
      console.error('[GameReplay] Error loading replay:', errorData, 'for game:', gameId);

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
        setCurrentTrickIndex(prev => prev + 1);
      } else if (hasNextRound) {
        setCurrentRoundIndex(prev => prev + 1);
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

  const { currentRound, currentTricks, hasNextRound, hasPrevRound, hasNextTrick, hasPrevTrick } = currentRoundData;

  // Calculate starting hands from trick history (expensive operation) - MUST be before early returns
  const startingHands = useMemo(() => {
    if (!currentRound?.tricks || currentRound.tricks.length === 0) return {};

    const hands: Record<string, any[]> = {};
    if (replayData) {
      replayData.player_names.forEach(name => hands[name] = []);

      currentRound.tricks.forEach(trick => {
        trick.trick.forEach(trickCard => {
          // Defensive check: ensure player exists in hands before pushing
          // This handles cases where player names changed (e.g., bot replacement)
          if (!hands[trickCard.playerName]) {
            console.warn('[GameReplay] Calculating starting hands: Player not found. Action: Building hand from trick history. PlayerName from trick:', trickCard.playerName, 'Available players:', Object.keys(hands), 'Round:', currentRoundIndex, 'Trick:', currentTrickIndex);
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
      currentTricks[i].trick.forEach(trickCard => {
        played.add(`${trickCard.card.color}-${trickCard.card.value}`);
      });
    }

    return played;
  }, [currentTricks, currentTrickIndex]);

  // Sprint 8 Task 2: Memoized navigation callbacks - MUST be before early returns
  const navigateToRound = useCallback((index: number) => {
    if (index >= 0 && index < (replayData?.round_history?.length || 0)) {
      setCurrentRoundIndex(index);
      setCurrentTrickIndex(0);
      setIsPlaying(false);
      sounds.trickWon();
    }
  }, [replayData]);

  const handleNextTrick = useCallback(() => {
    if (hasNextTrick) {
      setCurrentTrickIndex(prev => prev + 1);
      sounds.cardPlay();
    } else if (hasNextRound) {
      setCurrentRoundIndex(prev => prev + 1);
      setCurrentTrickIndex(0);
      sounds.trickWon();
    }
  }, [hasNextTrick, hasNextRound]);

  const handlePrevTrick = useCallback(() => {
    if (hasPrevTrick) {
      setCurrentTrickIndex(prev => prev - 1);
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
    setIsPlaying(prev => !prev);
    sounds.cardPlay();
  }, []);

  // Early returns AFTER all hooks
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-2xl max-w-md">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">🔄</div>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200" data-testid="loading-message">
              Loading replay...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !replayData) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div
          className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-2xl max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Sprint 6: Enhanced error display */}
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2" data-testid="error-message">
              {error || 'Failed to load replay'}
            </p>
            {correlationId && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-700" data-testid="error-correlation-id">
                <p className="text-xs text-red-700 dark:text-red-300 font-mono">
                  Error ID: {correlationId}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1 opacity-75">
                  Please include this ID when reporting the issue
                </p>
              </div>
            )}
            <div className="flex gap-3 mt-6 justify-center">
              <button
                data-testid="retry-button"
                onClick={() => {
                  setError(null);
                  setCorrelationId(null);
                  setLoading(true);
                  if (socket) {
                    socket.emit('get_game_replay', { gameId });
                  }
                }}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-all"
              >
                🔄 Try Again
              </button>
              <button
                data-testid="close-button"
                onClick={onClose}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Validate replay data has rounds
  if (!replayData.round_history || replayData.round_history.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
        <div
          className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-2xl max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400 mb-2" data-testid="no-data-warning">
              No Replay Data Available
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This game has no recorded rounds. The game may have ended prematurely or data was not saved.
            </p>
            <button
              data-testid="close-button"
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentTrick = currentTricks[currentTrickIndex];
  const currentBet = currentRound?.highestBet;
  const dealerName = 'Unknown'; // TODO: Add dealerName to RoundHistory type if needed

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto border-4 border-emerald-600 dark:border-emerald-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-700 dark:to-green-700 text-white px-8 py-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-4xl">🎮</span>
              <div>
                <h2 className="text-3xl font-black">Game Replay</h2>
                <p className="text-emerald-100 text-sm mt-1">
                  Game ID: {gameId} • {replayData.rounds} rounds played
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Share Button */}
              <button
                onClick={() => {
                  const replayUrl = `${window.location.origin}?replay=${gameId}`;
                  navigator.clipboard.writeText(replayUrl);
                  sounds.playSound('achievement_unlock');
                }}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition-colors flex items-center gap-2"
                title="Copy replay link"
              >
                🔗 Share
              </button>
              <button
                onClick={onClose}
                className="text-white hover:text-emerald-100 text-4xl font-bold leading-none transition-colors"
                aria-label="Close replay viewer"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Game Info Bar */}
        <div className="bg-white dark:bg-gray-800 px-8 py-4 border-b-2 border-emerald-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex gap-6">
              {/* Final Score */}
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Final Score</p>
                  <div className="flex items-center gap-2" data-testid="final-scores">
                    <span className={`text-xl font-black ${replayData.winning_team === 1 ? 'text-green-600' : 'text-gray-600'}`} data-testid="team1-score">
                      Team 1: {replayData.team1_score}
                    </span>
                    <span className="text-gray-400">vs</span>
                    <span className={`text-xl font-black ${replayData.winning_team === 2 ? 'text-green-600' : 'text-gray-600'}`} data-testid="team2-score">
                      Team 2: {replayData.team2_score}
                    </span>
                  </div>
                </div>
              </div>

              {/* Game Duration */}
              <div className="flex items-center gap-2">
                <span className="text-xl">⏱️</span>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
                  <p className="text-lg font-bold text-gray-700 dark:text-gray-200">
                    {Math.floor(replayData.game_duration_seconds / 60)}m {replayData.game_duration_seconds % 60}s
                  </p>
                </div>
              </div>

              {/* Players */}
              <div className="flex items-center gap-2">
                <span className="text-xl">👥</span>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Players</p>
                  <div className="flex flex-wrap gap-2">
                    {replayData.player_names.map((name, idx) => (
                      <span
                        key={idx}
                        className={`text-xs px-2 py-1 rounded ${
                          replayData.player_teams[idx] === 1
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
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
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <span className="text-xl">🤖</span>
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">Bot Game</span>
              </div>
            )}
          </div>
        </div>

        {/* Current Round/Trick Info */}
        {currentRound && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Round</p>
                  <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300">
                    {currentRoundIndex + 1} / {replayData.round_history.length}
                  </p>
                </div>

                {currentBet && (
                  <>
                    <div className="w-px h-8 bg-gray-300 dark:bg-gray-600" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Bet</p>
                      <p className="text-lg font-bold text-gray-700 dark:text-gray-200">
                        {currentBet.amount} pts {currentBet.withoutTrump && '(No Trump)'}
                      </p>
                    </div>
                  </>
                )}

                <div className="w-px h-8 bg-gray-300 dark:bg-gray-600" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Dealer</p>
                  <p className="text-lg font-bold text-gray-700 dark:text-gray-200">{dealerName}</p>
                </div>

                <div className="w-px h-8 bg-gray-300 dark:bg-gray-600" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Trick</p>
                  <p className="text-2xl font-black text-purple-700 dark:text-purple-300">
                    {currentTrickIndex + 1} / {currentTricks.length}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Round Score:</span>
                <span className="text-lg font-bold text-orange-600">Team 1: {currentRound.roundScore?.team1 || 0}</span>
                <span className="text-gray-400">/</span>
                <span className="text-lg font-bold text-purple-600">Team 2: {currentRound.roundScore?.team2 || 0}</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Trick Display */}
            <div className="lg:col-span-2">
              {/* Current Trick */}
              {currentTrick && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-6">
                  <h3 className="text-xl font-black text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <span className="text-2xl">🎴</span>
                    Current Trick
                    {currentTrick.winnerName && (
                      <span className="ml-auto text-sm font-semibold text-green-600 dark:text-green-400">
                        Won by {currentTrick.winnerName} ({currentTrick.points} pts)
                      </span>
                    )}
                  </h3>

                  {/* Cards in Trick */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {currentTrick.trick.map((trickCard, idx) => {
                      const isWinner = trickCard.playerName === currentTrick.winnerName;
                      const cardKey = `${trickCard.card.color}-${trickCard.card.value}`;
                      const isPlayed = playedCards.has(cardKey);

                      return (
                        <div
                          key={idx}
                          className={`relative ${isWinner ? 'ring-4 ring-green-500 ring-offset-2' : ''}`}
                        >
                          <div className="text-center mb-2">
                            <p className={`text-sm font-bold ${
                              replayData.player_teams[replayData.player_names.indexOf(trickCard.playerName)] === 1
                                ? 'text-orange-600'
                                : 'text-purple-600'
                            }`}>
                              {trickCard.playerName}
                            </p>
                          </div>
                          <div
                            className={`
                              aspect-[2/3] rounded-lg shadow-lg flex items-center justify-center text-4xl font-black
                              ${isPlayed ? 'opacity-100' : 'opacity-30'}
                              ${
                                trickCard.card.color === 'red'
                                  ? 'bg-gradient-to-br from-red-400 to-red-600 text-white'
                                  : trickCard.card.color === 'blue'
                                  ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white'
                                  : trickCard.card.color === 'green'
                                  ? 'bg-gradient-to-br from-green-400 to-green-600 text-white'
                                  : 'bg-gradient-to-br from-amber-700 to-amber-900 text-white'
                              }
                            `}
                          >
                            {trickCard.card.value}
                          </div>
                          {isWinner && (
                            <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg">
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
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-black text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <span className="text-2xl">🃏</span>
                    Player Hands (Round Start)
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(startingHands).map(([playerName, cards]) => {
                      const teamId = replayData.player_teams[replayData.player_names.indexOf(playerName)];
                      return (
                        <div key={playerName} className="flex items-center gap-3">
                          <span className={`font-bold text-sm w-24 ${
                            teamId === 1 ? 'text-orange-600' : 'text-purple-600'
                          }`}>
                            {playerName}:
                          </span>
                          <div className="flex gap-2 flex-wrap">
                            {cards.map((card: any, idx: number) => {
                              const cardKey = `${card.color}-${card.value}`;
                              const isPlayed = playedCards.has(cardKey);

                              return (
                                <div
                                  key={idx}
                                  className={`
                                    w-10 h-14 rounded flex items-center justify-center text-sm font-bold shadow
                                    ${isPlayed ? 'opacity-30' : 'opacity-100'}
                                    ${
                                      card.color === 'red'
                                        ? 'bg-red-500 text-white'
                                        : card.color === 'blue'
                                        ? 'bg-blue-500 text-white'
                                        : card.color === 'yellow'
                                        ? 'bg-yellow-400 text-gray-800'
                                        : 'bg-amber-800 text-white'
                                    }
                                  `}
                                >
                                  {card.value}
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
            <div className="space-y-6">
              {/* Playback Controls */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-black text-gray-700 dark:text-gray-200 mb-4">Playback Controls</h3>

                {/* Speed Control */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Speed:</p>
                  <div className="flex gap-2">
                    {[0.5, 1, 2].map(speed => (
                      <button
                        key={speed}
                        data-testid={`speed-${speed}x`}
                        onClick={() => setPlaySpeed(speed as 0.5 | 1 | 2)}
                        className={`px-3 py-1 rounded ${
                          playSpeed === speed
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                        } transition-colors text-sm font-semibold`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Play/Pause & Navigation */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <button
                    data-testid="prev-trick-button"
                    onClick={handlePrevTrick}
                    disabled={!hasPrevTrick && !hasPrevRound}
                    className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous trick"
                  >
                    ⏮️
                  </button>
                  <button
                    data-testid="play-pause-button"
                    onClick={handlePlayPause}
                    className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-xl"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? '⏸️' : '▶️'}
                  </button>
                  <button
                    data-testid="next-trick-button"
                    onClick={handleNextTrick}
                    disabled={!hasNextTrick && !hasNextRound}
                    className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next trick"
                  >
                    ⏭️
                  </button>
                </div>

                {/* Round Jump Buttons */}
                <div className="border-t pt-4 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Jump to Round:</p>
                  <div className="grid grid-cols-3 gap-1">
                    {replayData.round_history.map((_, idx) => (
                      <button
                        key={idx}
                        data-testid={`round-jump-${idx + 1}`}
                        onClick={() => navigateToRound(idx)}
                        className={`p-1 text-xs rounded ${
                          idx === currentRoundIndex
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                        } transition-colors font-semibold`}
                      >
                        R{idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Trick History */}
              {currentRound && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-black text-gray-700 dark:text-gray-200 mb-4">
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
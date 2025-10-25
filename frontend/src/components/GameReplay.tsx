import { useState, useEffect } from 'react';
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

  // Fetch replay data on mount
  useEffect(() => {
    if (!socket) {
      console.error('[GameReplay] Socket is null');
      return;
    }

    console.log('[GameReplay] Requesting replay for game:', gameId);

    const handleReplayData = ({ replayData }: { replayData: ReplayData }) => {
      console.log('[GameReplay] Received replay data for game:', replayData?.game_id, 'rounds:', replayData?.rounds);
      setReplayData(replayData);
      setLoading(false);
    };

    const handleError = ({ message }: { message: string }) => {
      console.error('[GameReplay] Error loading replay:', message);
      setError(message);
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-2xl max-w-md">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">🔄</div>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              Loading replay...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !replayData) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
        <div
          className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-2xl max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <div className="text-4xl mb-4">❌</div>
            <p className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
              {error || 'Failed to load replay'}
            </p>
            <button
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

  const currentRound = replayData.round_history[currentRoundIndex];
  const currentTricks = currentRound?.tricks || [];
  const hasNextRound = currentRoundIndex < replayData.round_history.length - 1;
  const hasPrevRound = currentRoundIndex > 0;
  const hasNextTrick = currentTrickIndex < currentTricks.length - 1;
  const hasPrevTrick = currentTrickIndex > 0;

  // Calculate starting hands from trick history
  const calculateStartingHands = () => {
    if (!currentRound?.tricks || currentRound.tricks.length === 0) return {};

    const hands: Record<string, any[]> = {};
    replayData.player_names.forEach(name => hands[name] = []);

    currentRound.tricks.forEach(trick => {
      trick.trick.forEach(trickCard => {
        hands[trickCard.playerName].push(trickCard.card);
      });
    });

    // Sort each hand by color then value
    Object.keys(hands).forEach(playerName => {
      hands[playerName].sort((a, b) => {
        if (a.color !== b.color) return a.color.localeCompare(b.color);
        return a.value - b.value;
      });
    });

    return hands;
  };

  const startingHands = calculateStartingHands();

  const handleNextRound = () => {
    if (hasNextRound) {
      sounds.buttonClick();
      setCurrentRoundIndex(prev => prev + 1);
      setCurrentTrickIndex(0);
      setIsPlaying(false);
    }
  };

  const handlePrevRound = () => {
    if (hasPrevRound) {
      sounds.buttonClick();
      setCurrentRoundIndex(prev => prev - 1);
      setCurrentTrickIndex(0);
      setIsPlaying(false);
    }
  };

  const handleNextTrick = () => {
    if (hasNextTrick) {
      sounds.buttonClick();
      setCurrentTrickIndex(prev => prev + 1);
    } else if (hasNextRound) {
      handleNextRound();
    }
  };

  const handlePrevTrick = () => {
    if (hasPrevTrick) {
      sounds.buttonClick();
      setCurrentTrickIndex(prev => prev - 1);
    } else if (hasPrevRound) {
      setCurrentRoundIndex(prev => prev - 1);
      const prevRound = replayData.round_history[currentRoundIndex - 1];
      setCurrentTrickIndex((prevRound?.tricks?.length || 1) - 1);
    }
  };

  const togglePlayback = () => {
    sounds.buttonClick();
    setIsPlaying(prev => !prev);
  };

  const handleJumpToTrick = (trickIndex: number) => {
    sounds.buttonClick();
    setCurrentTrickIndex(trickIndex);
    setIsPlaying(false);
  };

  // Format date
  const gameDate = new Date(replayData.finished_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Calculate game duration
  const durationMinutes = Math.floor(replayData.game_duration_seconds / 60);
  const durationSeconds = replayData.game_duration_seconds % 60;
  const durationText = `${durationMinutes}m ${durationSeconds}s`;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-800 to-pink-800 px-6 py-4 border-b-2 border-purple-600 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Game Replay
            </h2>
            <p className="text-sm text-purple-200">
              {gameDate} • {durationText} • Round {currentRoundIndex + 1}/{replayData.round_history.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-red-300 text-3xl font-bold transition-all"
          >
            ×
          </button>
        </div>

        {/* Game Overview */}
        <div className="px-6 py-4 bg-white/10 border-b-2 border-purple-600">
          <div className="grid grid-cols-2 gap-6">
            {/* Team 1 */}
            <div className="bg-orange-500/20 rounded-lg p-4 border-2 border-orange-400">
              <h3 className="text-lg font-semibold text-orange-300 mb-2">Team 1</h3>
              <div className="space-y-1 mb-3">
                {replayData.player_names
                  .map((name, idx) => ({ name, team: replayData.player_teams[idx] }))
                  .filter(p => p.team === 1)
                  .map((player, idx) => (
                    <p key={idx} className="text-white text-sm">
                      {player.name}
                    </p>
                  ))}
              </div>
              <p className={`text-4xl font-bold ${
                replayData.winning_team === 1 ? 'text-yellow-300' : 'text-orange-300'
              }`}>
                {replayData.team1_score}
                {replayData.winning_team === 1 && ' 👑'}
              </p>
            </div>

            {/* Team 2 */}
            <div className="bg-purple-500/20 rounded-lg p-4 border-2 border-purple-400">
              <h3 className="text-lg font-semibold text-purple-300 mb-2">Team 2</h3>
              <div className="space-y-1 mb-3">
                {replayData.player_names
                  .map((name, idx) => ({ name, team: replayData.player_teams[idx] }))
                  .filter(p => p.team === 2)
                  .map((player, idx) => (
                    <p key={idx} className="text-white text-sm">
                      {player.name}
                    </p>
                  ))}
              </div>
              <p className={`text-4xl font-bold ${
                replayData.winning_team === 2 ? 'text-yellow-300' : 'text-purple-300'
              }`}>
                {replayData.team2_score}
                {replayData.winning_team === 2 && ' 👑'}
              </p>
            </div>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="px-6 py-4 bg-white/5 border-b-2 border-purple-600">
          {/* Round Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevRound}
              disabled={!hasPrevRound}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                hasPrevRound
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              ← Previous Round
            </button>

            <span className="text-xl font-bold text-white">
              Round {currentRoundIndex + 1} of {replayData.round_history.length}
            </span>

            <button
              onClick={handleNextRound}
              disabled={!hasNextRound}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                hasNextRound
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              Next Round →
            </button>
          </div>

          {/* Trick Navigation & Playback */}
          <div className="flex items-center justify-between gap-4">
            {/* Trick Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevTrick}
                disabled={!hasPrevTrick && !hasPrevRound}
                className={`px-3 py-1.5 rounded-lg font-bold text-sm transition-all ${
                  hasPrevTrick || hasPrevRound
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                ← Prev Trick
              </button>

              <span className="text-sm font-bold text-white">
                Trick {currentTrickIndex + 1} of {currentTricks.length}
              </span>

              <button
                onClick={handleNextTrick}
                disabled={!hasNextTrick && !hasNextRound}
                className={`px-3 py-1.5 rounded-lg font-bold text-sm transition-all ${
                  hasNextTrick || hasNextRound
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                Next Trick →
              </button>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlayback}
                className="px-4 py-2 rounded-lg font-bold bg-green-600 hover:bg-green-700 text-white transition-all"
              >
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </button>

              <select
                value={playSpeed}
                onChange={(e) => setPlaySpeed(Number(e.target.value) as 0.5 | 1 | 2)}
                className="bg-gray-700 text-white px-3 py-2 rounded-lg font-bold text-sm border-2 border-gray-600"
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={2}>2x</option>
              </select>
            </div>
          </div>

          {/* Trick Timeline */}
          {currentTricks.length > 0 && (
            <div className="mt-4 flex gap-2">
              {currentTricks.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleJumpToTrick(index)}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                    index === currentTrickIndex
                      ? 'bg-yellow-500 text-black'
                      : index < currentTrickIndex
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  T{index + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Round Content */}
        <div className="px-6 py-6">
          {currentRound && (
            <>
              {/* Round Bet Information */}
              <section className="mb-6">
                <h3 className="text-xl font-bold text-white mb-4 border-b-2 border-white/30 pb-2">
                  🎲 Round Bet
                </h3>
                <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-lg p-4 border-2 border-blue-400">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-blue-200 font-semibold mb-1">Highest Bidder</p>
                      <p className="text-lg font-bold text-white">
                        {(() => {
                          // Find player name from the first trick's winner or any trick player
                          if (currentRound.tricks && currentRound.tricks.length > 0) {
                            const firstTrick = currentRound.tricks[0];
                            const bidder = firstTrick.trick.find(tc => tc.playerId === currentRound.highestBet?.playerId);
                            if (bidder) return bidder.playerName;
                          }
                          return 'Unknown';
                        })()}
                      </p>
                      <p className="text-xs text-blue-300">Team {currentRound.offensiveTeam}</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-200 font-semibold mb-1">Bet Amount</p>
                      <p className="text-lg font-bold text-white">
                        {currentRound.betAmount} points
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-200 font-semibold mb-1">Type</p>
                      <p className="text-lg font-bold text-white">
                        {currentRound.withoutTrump ? (
                          <span className="text-red-400">Without Trump (2x)</span>
                        ) : (
                          'With Trump'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Round Results */}
              <section className="mb-6">
                <h3 className="text-xl font-bold text-white mb-4 border-b-2 border-white/30 pb-2">
                  📊 Round Results
                </h3>
                <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg p-4 border-2 border-gray-600">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-gray-300 font-semibold mb-1">Offensive Team</p>
                      <p className="font-bold text-white">Team {currentRound.offensiveTeam}</p>
                    </div>
                    <div>
                      <p className="text-gray-300 font-semibold mb-1">Points Earned</p>
                      <p className="font-bold text-white">
                        {currentRound.offensivePoints} / {currentRound.betAmount}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-300 font-semibold mb-1">Defensive Points</p>
                      <p className="font-bold text-white">
                        {currentRound.defensivePoints}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-300 font-semibold mb-1">Result</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border-2 ${
                        currentRound.betMade
                          ? 'bg-green-500/30 text-green-300 border-green-400'
                          : 'bg-red-500/30 text-red-300 border-red-400'
                      }`}>
                        {currentRound.betMade ? '✓ Bet Made' : '✗ Bet Failed'}
                      </span>
                    </div>
                  </div>
                  <div className="border-t-2 border-gray-600 pt-3">
                    <p className="text-sm text-gray-300 font-semibold mb-2">Round Score:</p>
                    <p className="font-bold text-white">
                      <span className="text-orange-400">
                        Team 1: {currentRound.roundScore.team1 >= 0 ? '+' : ''}{currentRound.roundScore.team1}
                      </span>
                      {' | '}
                      <span className="text-purple-400">
                        Team 2: {currentRound.roundScore.team2 >= 0 ? '+' : ''}{currentRound.roundScore.team2}
                      </span>
                    </p>
                  </div>
                </div>
              </section>

              {/* Starting Hands */}
              {Object.keys(startingHands).length > 0 && (
                <section className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-4 border-b-2 border-white/30 pb-2">
                    🃏 Starting Hands
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(startingHands).map(([playerName, cards]) => {
                      const playerIndex = replayData.player_names.indexOf(playerName);
                      const teamId = replayData.player_teams[playerIndex];
                      const teamColor = teamId === 1 ? 'from-orange-500/20 to-orange-600/20 border-orange-400' : 'from-purple-500/20 to-purple-600/20 border-purple-400';

                      return (
                        <div key={playerName} className={`bg-gradient-to-r ${teamColor} rounded-lg p-3 border-2`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-white">{playerName}</span>
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${teamId === 1 ? 'bg-orange-500 text-white' : 'bg-purple-500 text-white'}`}>
                              Team {teamId}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-1">
                            {(cards as any[]).map((card, idx) => (
                              <div key={idx} className="bg-gray-800/50 rounded p-1 text-center">
                                <div className={`text-lg font-bold ${
                                  card.color === 'red' ? 'text-red-400' :
                                  card.color === 'blue' ? 'text-blue-400' :
                                  card.color === 'green' ? 'text-green-400' :
                                  card.color === 'brown' ? 'text-amber-500' :
                                  'text-gray-400'
                                }`}>
                                  {card.value}
                                </div>
                                <div className="text-xs text-gray-400 capitalize">{card.color}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Game Statistics */}
              <section className="mb-6">
                <h3 className="text-xl font-bold text-white mb-4 border-b-2 border-white/30 pb-2">
                  📊 Round Statistics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Trick count */}
                  <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg p-4 border-2 border-blue-400">
                    <p className="text-blue-200 text-sm font-semibold mb-1">Total Tricks</p>
                    <p className="text-3xl font-bold text-white">{currentRound.tricks?.length || 0}</p>
                  </div>

                  {/* Points distribution */}
                  <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-lg p-4 border-2 border-emerald-400">
                    <p className="text-emerald-200 text-sm font-semibold mb-1">Points Earned</p>
                    <p className="text-xl font-bold text-white">
                      Team 1: {currentRound.offensiveTeam === 1 ? currentRound.offensivePoints : currentRound.defensivePoints}
                      {' | '}
                      Team 2: {currentRound.offensiveTeam === 2 ? currentRound.offensivePoints : currentRound.defensivePoints}
                    </p>
                  </div>

                  {/* Bet result */}
                  <div className={`bg-gradient-to-r rounded-lg p-4 border-2 ${
                    currentRound.betMade
                      ? 'from-green-500/20 to-lime-500/20 border-green-400'
                      : 'from-red-500/20 to-pink-500/20 border-red-400'
                  }`}>
                    <p className={`text-sm font-semibold mb-1 ${currentRound.betMade ? 'text-green-200' : 'text-red-200'}`}>
                      Bet Status
                    </p>
                    <p className="text-xl font-bold text-white">
                      {currentRound.betMade ? '✓ Made' : '✗ Failed'}
                    </p>
                    <p className="text-sm text-gray-300">
                      {currentRound.offensivePoints}/{currentRound.betAmount} pts
                    </p>
                  </div>
                </div>
              </section>

              {/* Tricks Played */}
              {currentRound.tricks && currentRound.tricks.length > 0 && (
                <section>
                  <h3 className="text-xl font-bold text-white mb-4 border-b-2 border-white/30 pb-2">
                    🃏 Tricks Played
                  </h3>
                  <div className="bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-lg p-4 border-2 border-indigo-400">
                    {currentRound.trump && (
                      <div className="mb-4 flex items-center justify-center gap-2">
                        <span className="text-sm bg-blue-500/30 text-blue-200 px-3 py-1 rounded-full font-semibold border-2 border-blue-400">
                          Trump: <span className="capitalize">{currentRound.trump}</span>
                        </span>
                      </div>
                    )}
                    <TrickHistory
                      tricks={currentRound.tricks.slice(0, currentTrickIndex + 1)}
                      players={replayData.player_names.map((name, idx) => ({
                        id: name,
                        name: name,
                        teamId: replayData.player_teams[idx],
                        hand: [],
                        tricksWon: 0,
                        pointsWon: 0
                      }))}
                      trump={currentRound.trump}
                      currentTrickIndex={currentTrickIndex}
                      showWinner={true}
                    />
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {/* Footer with Close Button */}
        <div className="sticky bottom-0 px-6 py-4 bg-gradient-to-r from-purple-800 to-pink-800 border-t-2 border-purple-600 flex justify-center">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all"
          >
            Close Replay
          </button>
        </div>
      </div>
    </div>
  );
}

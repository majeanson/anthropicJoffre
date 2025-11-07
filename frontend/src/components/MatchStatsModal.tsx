/**
 * Match Stats Modal Component
 * Sprint 3 Phase 3.3
 *
 * Shows detailed statistics for a single game/match
 */

import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';

interface MatchStatsModalProps {
  gameId: string;
  socket: Socket;
  isOpen: boolean;
  onClose: () => void;
  onViewReplay?: (gameId: string) => void;
}

interface RoundHistory {
  roundNumber: number;
  bets: { [playerName: string]: { amount: number; withoutTrump: boolean } };
  winner: string;
  pointsWon: { [playerName: string]: number };
  tricks: Array<{
    cards: Array<{ playerName: string; card: { value: number; suit: string; color: string } }>;
    winner: string;
    points: number;
  }>;
}

interface MatchData {
  game_id: string;
  winning_team: 1 | 2;
  team1_score: number;
  team2_score: number;
  rounds: number;
  player_names: string[];
  player_teams: { [playerName: string]: 1 | 2 };
  round_history: RoundHistory[];
  trump_suit: string;
  game_duration_seconds: number;
  is_bot_game: boolean;
  created_at: string;
  finished_at: string;
}

export function MatchStatsModal({ gameId, socket, isOpen, onClose, onViewReplay }: MatchStatsModalProps) {
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'rounds' | 'players'>('overview');

  useEffect(() => {
    if (!isOpen || !gameId || !socket) return;

    setLoading(true);

    // Request game replay data
    socket.emit('get_game_replay', { gameId });

    // Listen for response
    const handleReplayData = (data: { replayData: MatchData }) => {
      setMatchData(data.replayData);
      setLoading(false);
    };

    const handleError = () => {
      setLoading(false);
    };

    socket.on('game_replay_data', handleReplayData);
    socket.on('error', handleError);

    return () => {
      socket.off('game_replay_data', handleReplayData);
      socket.off('error', handleError);
    };
  }, [isOpen, gameId, socket]);

  if (!isOpen) return null;

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const getTeamPlayers = (teamId: 1 | 2) => {
    if (!matchData) return [];
    return matchData.player_names.filter(name => matchData.player_teams[name] === teamId);
  };

  // Calculate player-specific stats
  const getPlayerStats = (playerName: string) => {
    if (!matchData) return { totalPoints: 0, roundsWon: 0, betsWon: 0, tricksWon: 0 };

    let totalPoints = 0;
    let roundsWon = 0;
    let betsWon = 0;
    let tricksWon = 0;

    matchData.round_history.forEach(round => {
      const playerPoints = round.pointsWon[playerName] || 0;
      totalPoints += playerPoints;

      if (round.winner === playerName) {
        roundsWon++;
      }

      // Count tricks won
      round.tricks.forEach(trick => {
        if (trick.winner === playerName) {
          tricksWon++;
        }
      });

      // Check if bet was successful
      const playerBet = round.bets[playerName];
      if (playerBet && playerPoints >= playerBet.amount) {
        betsWon++;
      }
    });

    return { totalPoints, roundsWon, betsWon, tricksWon };
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-parchment-50 to-parchment-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-4 border-amber-900 dark:border-gray-600"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-700 to-purple-900 dark:from-gray-700 dark:to-gray-800 p-6 flex items-center justify-between rounded-t-xl border-b-4 border-indigo-950 dark:border-gray-900 z-10">
          <div className="flex items-center gap-4">
            <span className="text-4xl">📊</span>
            <div>
              <h2 className="text-2xl font-bold text-parchment-50">Match Details</h2>
              <p className="text-indigo-200 dark:text-gray-300 text-sm">Game ID: {gameId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 text-white w-10 h-10 rounded-full font-bold text-xl transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-purple-700"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400 font-semibold">Loading match details...</p>
            </div>
          )}

          {!loading && !matchData && (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">😞</span>
              <p className="text-gray-600 dark:text-gray-400 font-semibold">Match data not found</p>
            </div>
          )}

          {!loading && matchData && (
            <>
              {/* Tabs */}
              <div className="flex gap-2 border-b-2 border-gray-300 dark:border-gray-600">
                <button
                  onClick={() => setSelectedTab('overview')}
                  className={`px-6 py-3 font-bold transition-all ${
                    selectedTab === 'overview'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-t-lg'
                  }`}
                >
                  📈 Overview
                </button>
                <button
                  onClick={() => setSelectedTab('rounds')}
                  className={`px-6 py-3 font-bold transition-all ${
                    selectedTab === 'rounds'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-t-lg'
                  }`}
                >
                  🔄 Round-by-Round
                </button>
                <button
                  onClick={() => setSelectedTab('players')}
                  className={`px-6 py-3 font-bold transition-all ${
                    selectedTab === 'players'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-t-lg'
                  }`}
                >
                  👥 Player Stats
                </button>
              </div>

              {/* Overview Tab */}
              {selectedTab === 'overview' && (
                <div className="space-y-6">
                  {/* Winner Banner */}
                  <div className={`p-6 rounded-xl text-center border-4 ${
                    matchData.winning_team === 1
                      ? 'bg-gradient-to-r from-orange-400 to-orange-600 border-orange-800'
                      : 'bg-gradient-to-r from-purple-400 to-purple-600 border-purple-800'
                  }`}>
                    <h3 className="text-3xl font-bold text-white mb-2">
                      🏆 Team {matchData.winning_team} Victory!
                    </h3>
                    <div className="text-xl text-white font-semibold">
                      {getTeamPlayers(matchData.winning_team).join(' & ')}
                    </div>
                  </div>

                  {/* Game Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center border-2 border-gray-300 dark:border-gray-600">
                      <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                        {matchData.team1_score} - {matchData.team2_score}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Final Score</div>
                    </div>
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center border-2 border-gray-300 dark:border-gray-600">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {matchData.rounds}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Rounds Played</div>
                    </div>
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center border-2 border-gray-300 dark:border-gray-600">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {formatDuration(matchData.game_duration_seconds)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Duration</div>
                    </div>
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center border-2 border-gray-300 dark:border-gray-600">
                      <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                        {matchData.trump_suit || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Trump Suit</div>
                    </div>
                  </div>

                  {/* Teams */}
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2].map(teamId => (
                      <div
                        key={teamId}
                        className={`p-6 rounded-xl border-4 ${
                          teamId === 1
                            ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-600'
                            : 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-600'
                        }`}
                      >
                        <h4 className={`text-xl font-bold mb-3 ${
                          teamId === 1
                            ? 'text-orange-800 dark:text-orange-300'
                            : 'text-purple-800 dark:text-purple-300'
                        }`}>
                          Team {teamId} {matchData.winning_team === teamId && '👑'}
                        </h4>
                        <div className="space-y-2">
                          {getTeamPlayers(teamId as 1 | 2).map(player => (
                            <div
                              key={player}
                              className="bg-white dark:bg-gray-700 rounded-lg p-3"
                            >
                              <div className="font-semibold text-gray-900 dark:text-gray-100">
                                {player}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rounds Tab */}
              {selectedTab === 'rounds' && (
                <div className="space-y-4">
                  {matchData.round_history.map((round, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-gray-700 rounded-lg p-6 border-2 border-gray-300 dark:border-gray-600"
                    >
                      <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                        Round {round.roundNumber}
                      </h4>

                      {/* Bets */}
                      <div className="mb-4">
                        <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Bets:</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {Object.entries(round.bets).map(([player, bet]) => (
                            <div
                              key={player}
                              className="bg-gray-100 dark:bg-gray-600 rounded p-2 text-sm"
                            >
                              <div className="font-semibold">{player}</div>
                              <div className="text-gray-600 dark:text-gray-400">
                                {bet.amount} pts {bet.withoutTrump && '🚫♠️'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Results */}
                      <div>
                        <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Results:</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {Object.entries(round.pointsWon).map(([player, points]) => {
                            const bet = round.bets[player];
                            const won = points >= (bet?.amount || 0);
                            return (
                              <div
                                key={player}
                                className={`rounded p-2 text-sm ${
                                  won
                                    ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500'
                                    : 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500'
                                }`}
                              >
                                <div className="font-semibold">{player}</div>
                                <div className={won ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                                  {points} pts {won ? '✓' : '✗'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Players Tab */}
              {selectedTab === 'players' && (
                <div className="space-y-4">
                  {matchData.player_names.map(player => {
                    const stats = getPlayerStats(player);
                    const teamId = matchData.player_teams[player];
                    return (
                      <div
                        key={player}
                        className={`p-6 rounded-xl border-4 ${
                          teamId === 1
                            ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-600'
                            : 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-600'
                        }`}
                      >
                        <h4 className={`text-xl font-bold mb-4 ${
                          teamId === 1
                            ? 'text-orange-800 dark:text-orange-300'
                            : 'text-purple-800 dark:text-purple-300'
                        }`}>
                          {player} (Team {teamId})
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-white dark:bg-gray-700 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                              {stats.totalPoints}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total Points</div>
                          </div>
                          <div className="bg-white dark:bg-gray-700 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {stats.roundsWon}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Rounds Won</div>
                          </div>
                          <div className="bg-white dark:bg-gray-700 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {stats.betsWon}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Bets Won</div>
                          </div>
                          <div className="bg-white dark:bg-gray-700 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                              {stats.tricksWon}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Tricks Won</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center gap-3 pt-4 border-t-2 border-gray-300 dark:border-gray-600">
                {onViewReplay && (
                  <button
                    onClick={() => {
                      onViewReplay(gameId);
                      onClose();
                    }}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-xl"
                  >
                    📺 View Full Replay
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-8 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold transition-all"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

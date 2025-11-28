/**
 * Match Stats Modal Component
 * Sprint 3 Phase 3.3
 *
 * Shows detailed statistics for a single game/match
 */

import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { colors } from '../design-system';
import { UICard } from './ui/UICard';

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

    matchData.round_history?.forEach(round => {
      // Handle missing pointsWon for unfinished games
      const playerPoints = round.pointsWon?.[playerName] || 0;
      totalPoints += playerPoints;

      if (round.winner === playerName) {
        roundsWon++;
      }

      // Count tricks won - handle missing tricks array for unfinished rounds
      round.tricks?.forEach(trick => {
        if (trick?.winner === playerName) {
          tricksWon++;
        }
      });

      // Check if bet was successful - handle missing bets for unfinished rounds
      const playerBet = round.bets?.[playerName];
      if (playerBet && playerPoints >= playerBet.amount) {
        betsWon++;
      }
    });

    return { totalPoints, roundsWon, betsWon, tricksWon };
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Match Details"
      subtitle={`Game ID: ${gameId}`}
      icon="📊"
      theme="parchment"
      size="xl"
    >
      <div className="space-y-6">
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
                  className={`px-6 py-3 font-bold transition-all focus:outline-none focus:ring-2 focus:ring-purple-400 ${
                    selectedTab === 'overview'
                      ? `bg-gradient-to-r ${colors.gradients.team2} text-white rounded-t-lg`
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-t-lg'
                  }`}
                >
                  <span aria-hidden="true">📈</span> Overview
                </button>
                <button
                  onClick={() => setSelectedTab('rounds')}
                  className={`px-6 py-3 font-bold transition-all focus:outline-none focus:ring-2 focus:ring-purple-400 ${
                    selectedTab === 'rounds'
                      ? `bg-gradient-to-r ${colors.gradients.team2} text-white rounded-t-lg`
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-t-lg'
                  }`}
                >
                  <span aria-hidden="true">🔄</span> Round-by-Round
                </button>
                <button
                  onClick={() => setSelectedTab('players')}
                  className={`px-6 py-3 font-bold transition-all focus:outline-none focus:ring-2 focus:ring-purple-400 ${
                    selectedTab === 'players'
                      ? `bg-gradient-to-r ${colors.gradients.team2} text-white rounded-t-lg`
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-t-lg'
                  }`}
                >
                  <span aria-hidden="true">👥</span> Player Stats
                </button>
              </div>

              {/* Overview Tab */}
              {selectedTab === 'overview' && (
                <div className="space-y-6">
                  {/* Winner Banner - only for finished games */}
                  {matchData.winning_team ? (
                    <div className={`p-6 rounded-xl text-center border-4 ${
                      matchData.winning_team === 1
                        ? `bg-gradient-to-r ${colors.gradients.team1} border-orange-800`
                        : `bg-gradient-to-r ${colors.gradients.team2} border-purple-800`
                    }`}>
                      <h3 className="text-3xl font-bold text-white mb-2">
                        <span aria-hidden="true">🏆</span> Team {matchData.winning_team} Victory!
                      </h3>
                      <div className="text-xl text-white font-semibold">
                        {getTeamPlayers(matchData.winning_team).join(' & ')}
                      </div>
                    </div>
                  ) : (
                    <UICard variant="gradient" gradient="gray" size="lg" className="text-center border-4 border-gray-800">
                      <h3 className="text-3xl font-bold text-white mb-2">
                        <span aria-hidden="true">⏳</span> Game In Progress
                      </h3>
                      <div className="text-xl text-white font-semibold">
                        Match not yet finished
                      </div>
                    </UICard>
                  )}

                  {/* Game Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <UICard variant="bordered" size="md" className="bg-white dark:bg-gray-700 text-center">
                      <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                        {matchData.team1_score} - {matchData.team2_score}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Final Score</div>
                    </UICard>
                    <UICard variant="bordered" size="md" className="bg-white dark:bg-gray-700 text-center">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {matchData.rounds}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Rounds Played</div>
                    </UICard>
                    <UICard variant="bordered" size="md" className="bg-white dark:bg-gray-700 text-center">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {formatDuration(matchData.game_duration_seconds)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Duration</div>
                    </UICard>
                    <UICard variant="bordered" size="md" className="bg-white dark:bg-gray-700 text-center">
                      <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                        {matchData.trump_suit || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Trump Suit</div>
                    </UICard>
                  </div>

                  {/* Teams */}
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2].map(teamId => (
                      <UICard
                        key={teamId}
                        variant="bordered"
                        size="lg"
                        className={`border-4 ${
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
                          Team {teamId} {matchData.winning_team === teamId && <span aria-hidden="true">👑</span>}
                        </h4>
                        <div className="space-y-2">
                          {getTeamPlayers(teamId as 1 | 2).map(player => (
                            <UICard
                              key={player}
                              variant="default"
                              size="sm"
                              className="bg-white dark:bg-gray-700"
                            >
                              <div className="font-semibold text-gray-900 dark:text-gray-100">
                                {player}
                              </div>
                            </UICard>
                          ))}
                        </div>
                      </UICard>
                    ))}
                  </div>
                </div>
              )}

              {/* Rounds Tab */}
              {selectedTab === 'rounds' && (
                <div className="space-y-4">
                  {matchData.round_history.map((round, idx) => (
                    <UICard
                      key={idx}
                      variant="bordered"
                      size="lg"
                      className="bg-white dark:bg-gray-700"
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
                                {bet.amount} pts {bet.withoutTrump && <span aria-hidden="true">🚫♠️</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Results */}
                      <div>
                        <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Results:</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {round.pointsWon ? Object.entries(round.pointsWon).map(([player, points]) => {
                            const bet = round.bets?.[player];
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
                          }) : (
                            <div className="col-span-full text-center text-gray-500 dark:text-gray-400 text-sm py-2">
                              Round incomplete - no results yet
                            </div>
                          )}
                        </div>
                      </div>
                    </UICard>
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
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => {
                      onViewReplay(gameId);
                      onClose();
                    }}
                  >
                    <span aria-hidden="true">📺</span> View Full Replay
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={onClose}
                >
                  Close
                </Button>
              </div>
            </>
          )}
      </div>
    </Modal>
  );
}

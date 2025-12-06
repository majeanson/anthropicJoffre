/**
 * Match Stats Modal Component
 * Sprint 3 Phase 3.3
 *
 * Shows detailed statistics for a single game/match
 */

import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { Modal, Button, UICard, Spinner } from './ui';

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

export function MatchStatsModal({
  gameId,
  socket,
  isOpen,
  onClose,
  onViewReplay,
}: MatchStatsModalProps) {
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
    return matchData.player_names.filter((name) => matchData.player_teams[name] === teamId);
  };

  // Calculate player-specific stats
  const getPlayerStats = (playerName: string) => {
    if (!matchData) return { totalPoints: 0, roundsWon: 0, betsWon: 0, tricksWon: 0 };

    let totalPoints = 0;
    let roundsWon = 0;
    let betsWon = 0;
    let tricksWon = 0;

    matchData.round_history?.forEach((round) => {
      // Handle missing pointsWon for unfinished games
      const playerPoints = round.pointsWon?.[playerName] || 0;
      totalPoints += playerPoints;

      if (round.winner === playerName) {
        roundsWon++;
      }

      // Count tricks won - handle missing tricks array for unfinished rounds
      round.tricks?.forEach((trick) => {
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
            <Spinner size="lg" color="primary" />
            <p className="mt-4 text-gray-600 font-semibold">Loading match details...</p>
          </div>
        )}

        {!loading && !matchData && (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">😞</span>
            <p className="text-gray-600 font-semibold">Match data not found</p>
          </div>
        )}

        {!loading && matchData && (
          <>
            {/* Tabs */}
            <div className="flex gap-2 border-b-2 border-gray-300">
              <Button
                onClick={() => setSelectedTab('overview')}
                variant={selectedTab === 'overview' ? 'secondary' : 'ghost'}
                size="md"
              >
                <span aria-hidden="true">📈</span> Overview
              </Button>
              <Button
                onClick={() => setSelectedTab('rounds')}
                variant={selectedTab === 'rounds' ? 'secondary' : 'ghost'}
                size="md"
              >
                <span aria-hidden="true">🔄</span> Round-by-Round
              </Button>
              <Button
                onClick={() => setSelectedTab('players')}
                variant={selectedTab === 'players' ? 'secondary' : 'ghost'}
                size="md"
              >
                <span aria-hidden="true">👥</span> Player Stats
              </Button>
            </div>

            {/* Overview Tab */}
            {selectedTab === 'overview' && (
              <div className="space-y-6">
                {/* Winner Banner - only for finished games */}
                {matchData.winning_team ? (
                  <div
                    className={`p-6 rounded-xl text-center border-4 ${
                      matchData.winning_team === 1
                        ? 'bg-gradient-to-r from-orange-400 to-amber-500 border-orange-800'
                        : 'bg-gradient-to-r from-purple-400 to-indigo-500 border-purple-800'
                    }`}
                  >
                    <h3 className="text-3xl font-bold text-white mb-2">
                      <span aria-hidden="true">🏆</span> Team {matchData.winning_team} Victory!
                    </h3>
                    <div className="text-xl text-white font-semibold">
                      {getTeamPlayers(matchData.winning_team).join(' & ')}
                    </div>
                  </div>
                ) : (
                  <UICard
                    variant="bordered"
                    size="lg"
                    className="text-center border-4 border-amber-400 bg-amber-100"
                  >
                    <h3 className="text-3xl font-bold text-amber-800 mb-2">
                      <span aria-hidden="true">⏳</span> Game In Progress
                    </h3>
                    <div className="text-xl text-amber-700 font-semibold">
                      Match not yet finished
                    </div>
                  </UICard>
                )}

                {/* Game Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <UICard variant="bordered" size="md" className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {matchData.team1_score ?? 0} - {matchData.team2_score ?? 0}
                    </div>
                    <div className="text-sm text-umber-700 mt-1">
                      {matchData.winning_team ? 'Final Score' : 'Current Score'}
                    </div>
                  </UICard>
                  <UICard variant="bordered" size="md" className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{matchData.rounds ?? 0}</div>
                    <div className="text-sm text-umber-700 mt-1">Rounds Played</div>
                  </UICard>
                  <UICard variant="bordered" size="md" className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {matchData.game_duration_seconds
                        ? formatDuration(matchData.game_duration_seconds)
                        : 'N/A'}
                    </div>
                    <div className="text-sm text-umber-700 mt-1">Duration</div>
                  </UICard>
                  <UICard variant="bordered" size="md" className="text-center">
                    <div className="text-3xl font-bold text-amber-600">
                      {matchData.trump_suit || 'N/A'}
                    </div>
                    <div className="text-sm text-umber-700 mt-1">Trump Suit</div>
                  </UICard>
                </div>

                {/* Teams */}
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2].map((teamId) => (
                    <UICard
                      key={teamId}
                      variant="bordered"
                      size="lg"
                      className={`border-4 ${
                        teamId === 1
                          ? 'bg-orange-50 border-orange-300'
                          : 'bg-purple-50 border-purple-300'
                      }`}
                    >
                      <h4
                        className={`text-xl font-bold mb-3 ${
                          teamId === 1 ? 'text-orange-800' : 'text-purple-800'
                        }`}
                      >
                        Team {teamId}{' '}
                        {matchData.winning_team === teamId && <span aria-hidden="true">👑</span>}
                      </h4>
                      <div className="space-y-2">
                        {getTeamPlayers(teamId as 1 | 2).length > 0 ? (
                          getTeamPlayers(teamId as 1 | 2).map((player) => (
                            <UICard key={player} variant="default" size="sm">
                              <div className="font-semibold text-umber-900">{player}</div>
                            </UICard>
                          ))
                        ) : (
                          <div className="text-gray-500 text-sm italic">No players assigned</div>
                        )}
                      </div>
                    </UICard>
                  ))}
                </div>
              </div>
            )}

            {/* Rounds Tab */}
            {selectedTab === 'rounds' && (
              <div className="space-y-4">
                {!matchData.round_history || matchData.round_history.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="text-4xl mb-2 block" aria-hidden="true">
                      📋
                    </span>
                    <p className="text-gray-600 font-semibold">No rounds recorded yet</p>
                    <p className="text-gray-500 text-sm">
                      Round data will appear here once gameplay begins
                    </p>
                  </div>
                ) : (
                  matchData.round_history.map((round, idx) => (
                    <UICard key={idx} variant="bordered" size="lg">
                      <h4 className="text-xl font-bold text-umber-900 mb-4">
                        Round {round.roundNumber || idx + 1}
                      </h4>

                      {/* Bets */}
                      <div className="mb-4">
                        <h5 className="font-semibold text-umber-800 mb-2">Bets:</h5>
                        {round.bets && Object.keys(round.bets).length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {Object.entries(round.bets).map(([player, bet]) => (
                              <div key={player} className="bg-parchment-100 rounded p-2 text-sm">
                                <div className="font-semibold text-umber-900">{player}</div>
                                <div className="text-umber-700">
                                  {bet?.amount ?? '?'} pts{' '}
                                  {bet?.withoutTrump && <span aria-hidden="true">🚫♠️</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-500 text-sm italic">
                            Betting phase not completed
                          </div>
                        )}
                      </div>

                      {/* Tricks Summary */}
                      {round.tricks && round.tricks.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-semibold text-umber-800 mb-2">
                            Tricks ({round.tricks.length}/8):
                          </h5>
                          <div className="flex flex-wrap gap-1">
                            {round.tricks.map((trick, trickIdx) => (
                              <span
                                key={trickIdx}
                                className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                                title={`Trick ${trickIdx + 1}: Won by ${trick?.winner || 'Unknown'} (+${trick?.points ?? 0} pts)`}
                              >
                                #{trickIdx + 1}: {trick?.winner?.substring(0, 8) || '?'}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Results */}
                      <div>
                        <h5 className="font-semibold text-umber-800 mb-2">Results:</h5>
                        {round.pointsWon && Object.keys(round.pointsWon).length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {Object.entries(round.pointsWon).map(([player, points]) => {
                              const bet = round.bets?.[player];
                              const won = bet ? points >= bet.amount : false;
                              return (
                                <div
                                  key={player}
                                  className={`rounded p-2 text-sm ${
                                    won
                                      ? 'bg-green-100 border-2 border-green-500'
                                      : 'bg-red-100 border-2 border-red-500'
                                  }`}
                                >
                                  <div className="font-semibold text-gray-900">{player}</div>
                                  <div className={won ? 'text-green-700' : 'text-red-700'}>
                                    {points} pts {won ? '✓' : '✗'}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="bg-amber-50 border border-amber-300 rounded p-3 text-center">
                            <span className="text-amber-700 text-sm">
                              ⏳ Round in progress - results pending
                            </span>
                          </div>
                        )}
                      </div>
                    </UICard>
                  ))
                )}
              </div>
            )}

            {/* Players Tab */}
            {selectedTab === 'players' && (
              <div className="space-y-4">
                {!matchData.player_names || matchData.player_names.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="text-4xl mb-2 block" aria-hidden="true">
                      👥
                    </span>
                    <p className="text-gray-600 font-semibold">No player data available</p>
                  </div>
                ) : (
                  matchData.player_names.map((player) => {
                    const stats = getPlayerStats(player);
                    const teamId = matchData.player_teams?.[player] || 1;
                    return (
                      <div
                        key={player}
                        className={`p-6 rounded-xl border-4 ${
                          teamId === 1
                            ? 'bg-orange-50 border-orange-300'
                            : 'bg-purple-50 border-purple-300'
                        }`}
                      >
                        <h4
                          className={`text-xl font-bold mb-4 ${
                            teamId === 1 ? 'text-orange-800' : 'text-purple-800'
                          }`}
                        >
                          {player} (Team {teamId})
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-parchment-50 rounded-lg p-3 text-center border border-parchment-400">
                            <div className="text-2xl font-bold text-purple-600">
                              {stats.totalPoints}
                            </div>
                            <div className="text-xs text-umber-700 mt-1">Total Points</div>
                          </div>
                          <div className="bg-parchment-50 rounded-lg p-3 text-center border border-parchment-400">
                            <div className="text-2xl font-bold text-blue-600">
                              {stats.roundsWon}
                            </div>
                            <div className="text-xs text-umber-700 mt-1">Rounds Won</div>
                          </div>
                          <div className="bg-parchment-50 rounded-lg p-3 text-center border border-parchment-400">
                            <div className="text-2xl font-bold text-green-600">{stats.betsWon}</div>
                            <div className="text-xs text-umber-700 mt-1">Bets Won</div>
                          </div>
                          <div className="bg-parchment-50 rounded-lg p-3 text-center border border-parchment-400">
                            <div className="text-2xl font-bold text-amber-600">
                              {stats.tricksWon}
                            </div>
                            <div className="text-xs text-umber-700 mt-1">Tricks Won</div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center gap-3 pt-4 border-t-2 border-gray-300">
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
              <Button variant="secondary" size="lg" onClick={onClose}>
                Close
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

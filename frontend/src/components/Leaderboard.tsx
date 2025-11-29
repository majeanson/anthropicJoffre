import { useState } from 'react';
import { GameState } from '../types/game';
import { Card as CardComponent } from './Card';
import { UICard, UIBadge, Modal, Button } from './ui';

interface LeaderboardProps {
  gameState: GameState;
  isOpen: boolean;
  onClose: () => void;
}

export function Leaderboard({ gameState, isOpen, onClose }: LeaderboardProps) {
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set());

  // Determine which team is leading
  const team1Score = gameState.teamScores.team1;
  const team2Score = gameState.teamScores.team2;
  const leadingTeam = team1Score > team2Score ? 1 : team1Score < team2Score ? 2 : null;

  // Get team members
  const team1Players = gameState.players.filter(p => p.teamId === 1);
  const team2Players = gameState.players.filter(p => p.teamId === 2);

  const toggleRound = (roundNumber: number) => {
    const newExpanded = new Set(expandedRounds);
    if (newExpanded.has(roundNumber)) {
      newExpanded.delete(roundNumber);
    } else {
      newExpanded.add(roundNumber);
    }
    setExpandedRounds(newExpanded);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Leaderboard"
      icon="🏆"
      subtitle={`Round ${gameState.roundNumber} Stats & History`}
      theme="parchment"
      size="xl"
      testId="leaderboard"
    >
      <div className="space-y-6">
          {/* Current Standings */}
          <section>
            <h3 className="text-xl font-bold text-umber-900 dark:text-gray-100 mb-4 border-b-2 border-parchment-400 dark:border-gray-600 dark:border-gray-500 pb-2 font-serif">
              <span aria-hidden="true">📊</span> Current Standings
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Team 1 */}
              <UICard
                variant="gradient"
                gradient="team1"
                size="lg"
                className={leadingTeam === 1 ? 'ring-4 ring-yellow-400' : ''}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-2xl font-bold text-orange-800 dark:text-orange-200">Team 1</h4>
                  {leadingTeam === 1 && <span className="text-3xl" aria-hidden="true">👑</span>}
                </div>
                <div className="text-5xl font-bold text-orange-600 dark:text-orange-300 mb-4">{team1Score}</div>
                <div className="space-y-2">
                  {team1Players.map(player => (
                    <UICard key={player.id} variant="bordered" size="sm" className="bg-parchment-50 dark:bg-gray-700 bg-opacity-80 border-orange-200 dark:border-orange-700">
                      <p className="font-semibold text-orange-900 dark:text-orange-200">{player.name}</p>
                      <p className="text-sm text-orange-700 dark:text-orange-300">Tricks: {player.tricksWon}</p>
                    </UICard>
                  ))}
                </div>
              </UICard>

              {/* Team 2 */}
              <UICard
                variant="gradient"
                gradient="team2"
                size="lg"
                className={leadingTeam === 2 ? 'ring-4 ring-yellow-400' : ''}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-2xl font-bold text-purple-800 dark:text-purple-200">Team 2</h4>
                  {leadingTeam === 2 && <span className="text-3xl" aria-hidden="true">👑</span>}
                </div>
                <div className="text-5xl font-bold text-purple-600 dark:text-purple-300 mb-4">{team2Score}</div>
                <div className="space-y-2">
                  {team2Players.map(player => (
                    <UICard key={player.id} variant="bordered" size="sm" className="bg-parchment-50 dark:bg-gray-700 bg-opacity-80 border-purple-200 dark:border-purple-700">
                      <p className="font-semibold text-purple-900 dark:text-purple-200">{player.name}</p>
                      <p className="text-sm text-purple-700 dark:text-purple-300">Tricks: {player.tricksWon}</p>
                    </UICard>
                  ))}
                </div>
              </UICard>
            </div>

            {leadingTeam === null && (
              <p className="text-center text-umber-700 dark:text-gray-300 mt-4 font-semibold">
                It's a tie! Both teams have {team1Score} points.
              </p>
            )}
          </section>

          {/* Current Bet */}
          {gameState.highestBet && (
            <section>
              <h3 className="text-xl font-bold text-umber-900 dark:text-gray-100 mb-4 border-b-2 border-parchment-400 dark:border-gray-600 dark:border-gray-500 pb-2 font-serif">
                <span aria-hidden="true">🎲</span> Current Bet
              </h3>
              <UICard variant="bordered" size="md" className="bg-gradient-to-r from-parchment-100 to-parchment-200 dark:from-gray-700 dark:to-gray-800">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-umber-700 dark:text-gray-300 font-semibold">Highest Bidder</p>
                    <p className="text-lg font-bold text-umber-900 dark:text-gray-100">
                      {gameState.players.find(p => p.id === gameState.highestBet?.playerId)?.name || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-umber-700 dark:text-gray-300 font-semibold">Bet Amount</p>
                    <p className="text-lg font-bold text-umber-900 dark:text-gray-100">
                      {gameState.highestBet.amount} points
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-umber-700 dark:text-gray-300 font-semibold">Type</p>
                    <p className="text-lg font-bold text-umber-900 dark:text-gray-100">
                      {gameState.highestBet.withoutTrump ? (
                        <span className="text-crimson-600">Without Trump (2x)</span>
                      ) : (
                        'With Trump'
                      )}
                    </p>
                  </div>
                </div>
              </UICard>
            </section>
          )}

          {/* Round History */}
          {gameState.roundHistory.length > 0 && (
            <section>
              <h3 className="text-xl font-bold text-umber-900 dark:text-gray-100 mb-4 border-b-2 border-parchment-400 dark:border-gray-600 dark:border-gray-500 pb-2 font-serif">
                <span aria-hidden="true">📜</span> Round History
              </h3>
              <div className="space-y-3">
                {gameState.roundHistory.slice().reverse().map((round) => {
                  const betPlayer = gameState.players.find(p => p.id === round.highestBet.playerId);
                  const isExpanded = expandedRounds.has(round.roundNumber);
                  const hasTricks = round.tricks && round.tricks.length > 0;

                  return (
                    <UICard
                      key={round.roundNumber}
                      variant="bordered"
                      size="md"
                      className="bg-parchment-100 dark:bg-gray-700 overflow-hidden transition-colors"
                    >
                      <div className="p-4 hover:bg-parchment-200 dark:bg-gray-600">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <h4 className="text-lg font-bold text-umber-900 dark:text-gray-100">
                              Round {round.roundNumber}
                            </h4>
                            {hasTricks && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleRound(round.roundNumber)}
                                aria-label={isExpanded ? 'Hide tricks' : 'Show tricks'}
                              >
                                <span aria-hidden="true">{isExpanded ? '▼' : '▶'}</span>
                                {isExpanded ? 'Hide Tricks' : 'Show Tricks'}
                              </Button>
                            )}
                          </div>
                          <UIBadge
                            variant="solid"
                            color={round.betMade ? 'success' : 'error'}
                            size="md"
                          >
                            <span aria-hidden="true">{round.betMade ? '✓' : '✗'}</span> {round.betMade ? 'Bet Made' : 'Bet Failed'}
                          </UIBadge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-umber-700 dark:text-gray-300 font-semibold">Bidder</p>
                            <p className="font-bold text-umber-900 dark:text-gray-100">{betPlayer?.name || 'Unknown'}</p>
                            <p className="text-xs text-umber-600 dark:text-gray-400">Team {round.offensiveTeam}</p>
                          </div>
                          <div>
                            <p className="text-umber-700 dark:text-gray-300 font-semibold">Bet</p>
                            <p className="font-bold text-umber-900 dark:text-gray-100">{round.betAmount} points</p>
                            <p className="text-xs text-umber-600 dark:text-gray-400">
                              {round.withoutTrump ? 'Without Trump (2x)' : 'With Trump'}
                            </p>
                          </div>
                          <div>
                            <p className="text-umber-700 dark:text-gray-300 font-semibold">Points Earned</p>
                            <p className="font-bold text-umber-900 dark:text-gray-100">
                              {round.offensivePoints} / {round.betAmount}
                            </p>
                            <p className="text-xs text-umber-600 dark:text-gray-400">
                              Defensive: {round.defensivePoints}
                            </p>
                          </div>
                          <div>
                            <p className="text-umber-700 dark:text-gray-300 font-semibold">Round Score</p>
                            <p className="font-bold">
                              <span className="text-orange-600">{round.roundScore.team1 >= 0 ? '+' : ''}{round.roundScore.team1}</span>
                              {' / '}
                              <span className="text-purple-600">{round.roundScore.team2 >= 0 ? '+' : ''}{round.roundScore.team2}</span>
                            </p>
                            <p className="text-xs text-umber-600 dark:text-gray-400">
                              Total: {round.cumulativeScore.team1} - {round.cumulativeScore.team2}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Trick History */}
                      {isExpanded && hasTricks && (
                        <div className="bg-parchment-50 dark:bg-gray-800 border-t-2 border-parchment-400 dark:border-gray-600 dark:border-gray-500 p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <h5 className="text-sm font-bold text-umber-800 dark:text-gray-200"><span aria-hidden="true">🃏</span> Tricks Played</h5>
                            {round.trump && (
                              <UIBadge variant="solid" color="info" size="sm">
                                Trump: <span className="capitalize">{round.trump}</span>
                              </UIBadge>
                            )}
                          </div>
                          <div className="space-y-3">
                            {round.tricks.map((trick, trickIndex) => {
                              const winner = gameState.players.find(p => p.id === trick.winnerId);
                              const winnerBadgeColor = winner?.teamId === 1 ? 'team1' : 'team2';
                              return (
                                <UICard key={trickIndex} variant="bordered" size="sm" className="bg-parchment-100 dark:bg-gray-700">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-umber-800 dark:text-gray-200">
                                      Trick {trickIndex + 1}
                                    </span>
                                    <UIBadge variant="solid" color={winnerBadgeColor} size="sm">
                                      <span aria-hidden="true">👑</span> {winner?.name || 'Unknown'} ({trick.points >= 0 ? '+' : ''}{trick.points} pts)
                                    </UIBadge>
                                  </div>
                                  <div className="grid grid-cols-4 gap-2">
                                    {trick.trick.map((trickCard, cardIndex) => {
                                      const player = gameState.players.find(p => p.id === trickCard.playerId);
                                      const isWinner = trickCard.playerId === trick.winnerId;
                                      return (
                                        <div key={cardIndex} className="text-center">
                                          <div className={`mb-1 inline-block ${isWinner ? 'ring-2 ring-yellow-400 rounded-lg' : ''}`}>
                                            <CardComponent card={trickCard.card} size="tiny" disabled={true} />
                                          </div>
                                          <p className="text-xs font-medium text-umber-700 dark:text-gray-300 truncate">
                                            {player?.name || 'Unknown'}
                                          </p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </UICard>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </UICard>
                  );
                })}
              </div>
            </section>
          )}

          {gameState.roundHistory.length === 0 && (
            <section>
              <UICard variant="bordered" size="lg" className="bg-parchment-100 dark:bg-gray-700 text-center">
                <p className="text-umber-600 dark:text-gray-400 text-lg">
                  No rounds completed yet. Start playing to see round history!
                </p>
              </UICard>
            </section>
          )}
      </div>
    </Modal>
  );
}

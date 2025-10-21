import { useState } from 'react';
import { GameState } from '../types/game';
import { Card as CardComponent } from './Card';

interface LeaderboardProps {
  gameState: GameState;
  isOpen: boolean;
  onClose: () => void;
}

export function Leaderboard({ gameState, isOpen, onClose }: LeaderboardProps) {
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set());

  if (!isOpen) return null;

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
    <div
      className="fixed inset-0 bg-umber-900 bg-opacity-60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-labelledby="leaderboard-title"
      aria-modal="true"
    >
      <div
        className="bg-parchment-50 dark:bg-gray-800 rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border-2 border-parchment-400"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-umber-600 to-umber-700 text-parchment-50 px-6 py-4 flex items-center justify-between rounded-t-lg border-b-2 border-umber-800">
          <div>
            <h2 id="leaderboard-title" className="text-2xl font-bold flex items-center gap-2 font-serif">
              🏆 Leaderboard
            </h2>
            <p className="text-sm text-parchment-200">Round {gameState.roundNumber} Stats & History</p>
          </div>
          <button
            onClick={onClose}
            className="text-parchment-50 hover:bg-parchment-50 dark:bg-gray-800 hover:bg-opacity-20 rounded-lg px-4 py-2 transition-colors font-semibold border border-parchment-400"
            aria-label="Close leaderboard"
          >
            ✕ Close
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Standings */}
          <section>
            <h3 className="text-xl font-bold text-umber-900 dark:text-gray-100 mb-4 border-b-2 border-parchment-400 dark:border-gray-500 pb-2 font-serif">
              📊 Current Standings
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Team 1 */}
              <div className={`bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border-2 border-orange-200 ${
                leadingTeam === 1 ? 'ring-4 ring-yellow-400' : ''
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-2xl font-bold text-orange-800">Team 1</h4>
                  {leadingTeam === 1 && <span className="text-3xl">👑</span>}
                </div>
                <div className="text-5xl font-bold text-orange-600 mb-4">{team1Score}</div>
                <div className="space-y-2">
                  {team1Players.map(player => (
                    <div key={player.id} className="bg-parchment-50 dark:bg-gray-800 bg-opacity-80 rounded px-3 py-2 border border-orange-200">
                      <p className="font-semibold text-orange-900">{player.name}</p>
                      <p className="text-sm text-orange-700">Tricks: {player.tricksWon}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team 2 */}
              <div className={`bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border-2 border-purple-200 ${
                leadingTeam === 2 ? 'ring-4 ring-yellow-400' : ''
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-2xl font-bold text-purple-800">Team 2</h4>
                  {leadingTeam === 2 && <span className="text-3xl">👑</span>}
                </div>
                <div className="text-5xl font-bold text-purple-600 mb-4">{team2Score}</div>
                <div className="space-y-2">
                  {team2Players.map(player => (
                    <div key={player.id} className="bg-parchment-50 dark:bg-gray-800 bg-opacity-80 rounded px-3 py-2 border border-purple-200">
                      <p className="font-semibold text-purple-900">{player.name}</p>
                      <p className="text-sm text-purple-700">Tricks: {player.tricksWon}</p>
                    </div>
                  ))}
                </div>
              </div>
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
              <h3 className="text-xl font-bold text-umber-900 dark:text-gray-100 mb-4 border-b-2 border-parchment-400 dark:border-gray-500 pb-2 font-serif">
                🎲 Current Bet
              </h3>
              <div className="bg-gradient-to-r from-parchment-100 to-parchment-50 rounded-lg p-4 border-2 border-parchment-400">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-umber-700 dark:text-gray-300 font-semibold">Highest Bidder</p>
                    <p className="text-lg font-bold text-umber-900">
                      {gameState.players.find(p => p.id === gameState.highestBet?.playerId)?.name || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-umber-700 dark:text-gray-300 font-semibold">Bet Amount</p>
                    <p className="text-lg font-bold text-umber-900">
                      {gameState.highestBet.amount} points
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-umber-700 dark:text-gray-300 font-semibold">Type</p>
                    <p className="text-lg font-bold text-umber-900">
                      {gameState.highestBet.withoutTrump ? (
                        <span className="text-crimson-600">Without Trump (2x)</span>
                      ) : (
                        'With Trump'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Round History */}
          {gameState.roundHistory.length > 0 && (
            <section>
              <h3 className="text-xl font-bold text-umber-900 dark:text-gray-100 mb-4 border-b-2 border-parchment-400 dark:border-gray-500 pb-2 font-serif">
                📜 Round History
              </h3>
              <div className="space-y-3">
                {gameState.roundHistory.slice().reverse().map((round) => {
                  const betPlayer = gameState.players.find(p => p.id === round.highestBet.playerId);
                  const isExpanded = expandedRounds.has(round.roundNumber);
                  const hasTricks = round.tricks && round.tricks.length > 0;

                  return (
                    <div
                      key={round.roundNumber}
                      className="bg-parchment-100 dark:bg-gray-700 rounded-lg overflow-hidden transition-colors border-2 border-parchment-400"
                    >
                      <div className="p-4 hover:bg-parchment-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <h4 className="text-lg font-bold text-umber-900">
                              Round {round.roundNumber}
                            </h4>
                            {hasTricks && (
                              <button
                                onClick={() => toggleRound(round.roundNumber)}
                                className="text-sm text-umber-700 dark:text-gray-300 hover:text-umber-900 dark:text-gray-100 font-semibold flex items-center gap-1"
                              >
                                {isExpanded ? '▼ Hide Tricks' : '▶ Show Tricks'}
                              </button>
                            )}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold border-2 ${
                            round.betMade
                              ? 'bg-forest-100 text-forest-800 border-forest-400'
                              : 'bg-crimson-100 text-crimson-800 border-crimson-400'
                          }`}>
                            {round.betMade ? '✓ Bet Made' : '✗ Bet Failed'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-umber-700 dark:text-gray-300 font-semibold">Bidder</p>
                            <p className="font-bold text-umber-900">{betPlayer?.name || 'Unknown'}</p>
                            <p className="text-xs text-umber-600">Team {round.offensiveTeam}</p>
                          </div>
                          <div>
                            <p className="text-umber-700 dark:text-gray-300 font-semibold">Bet</p>
                            <p className="font-bold text-umber-900">{round.betAmount} points</p>
                            <p className="text-xs text-umber-600">
                              {round.withoutTrump ? 'Without Trump (2x)' : 'With Trump'}
                            </p>
                          </div>
                          <div>
                            <p className="text-umber-700 dark:text-gray-300 font-semibold">Points Earned</p>
                            <p className="font-bold text-umber-900">
                              {round.offensivePoints} / {round.betAmount}
                            </p>
                            <p className="text-xs text-umber-600">
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
                            <p className="text-xs text-umber-600">
                              Total: {round.cumulativeScore.team1} - {round.cumulativeScore.team2}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Trick History */}
                      {isExpanded && hasTricks && (
                        <div className="bg-parchment-50 dark:bg-gray-800 border-t-2 border-parchment-400 dark:border-gray-500 p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <h5 className="text-sm font-bold text-umber-800">🃏 Tricks Played</h5>
                            {round.trump && (
                              <span className="text-xs bg-sapphire-100 text-sapphire-800 px-2 py-1 rounded-full font-semibold border border-sapphire-300">
                                Trump: <span className="capitalize">{round.trump}</span>
                              </span>
                            )}
                          </div>
                          <div className="space-y-3">
                            {round.tricks.map((trick, trickIndex) => {
                              const winner = gameState.players.find(p => p.id === trick.winnerId);
                              const winnerTeamColor = winner?.teamId === 1
                                ? 'bg-orange-500 text-white border border-orange-700'
                                : 'bg-purple-500 text-white border border-purple-700';
                              return (
                                <div key={trickIndex} className="bg-parchment-100 dark:bg-gray-700 rounded-lg p-3 border border-parchment-400">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-umber-800">
                                      Trick {trickIndex + 1}
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${winnerTeamColor}`}>
                                      👑 {winner?.name || 'Unknown'} ({trick.points >= 0 ? '+' : ''}{trick.points} pts)
                                    </span>
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
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {gameState.roundHistory.length === 0 && (
            <section>
              <div className="bg-parchment-100 dark:bg-gray-700 rounded-lg p-8 text-center border-2 border-parchment-400">
                <p className="text-umber-600 text-lg">
                  No rounds completed yet. Start playing to see round history!
                </p>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

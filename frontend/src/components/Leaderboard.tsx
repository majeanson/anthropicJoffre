import { useState, useMemo } from 'react';
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

  // Memoize team members to avoid recalculating on every render
  const team1Players = useMemo(
    () => gameState.players.filter((p) => p.teamId === 1),
    [gameState.players]
  );
  const team2Players = useMemo(
    () => gameState.players.filter((p) => p.teamId === 2),
    [gameState.players]
  );

  // Memoize reversed round history to avoid creating new array on every render
  // Safety check: ensure roundHistory exists
  const reversedRoundHistory = useMemo(
    () => (gameState.roundHistory || []).slice().reverse(),
    [gameState.roundHistory]
  );

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
          <h3 className="text-xl font-bold text-skin-primary mb-4 border-b-2 border-skin-default pb-2 font-serif">
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
                <h4 className="text-2xl font-bold text-team1">Team 1</h4>
                {leadingTeam === 1 && (
                  <span className="text-3xl" aria-hidden="true">
                    👑
                  </span>
                )}
              </div>
              <div className="text-5xl font-bold text-team1 mb-4">
                {team1Score}
              </div>
              <div className="space-y-2">
                {team1Players.map((player) => (
                  <UICard
                    key={player.id}
                    variant="bordered"
                    size="sm"
                    className="bg-skin-secondary bg-opacity-80 border-team1"
                  >
                    <p className="font-semibold text-team1">
                      {player.name}
                    </p>
                    <p className="text-sm text-team1 opacity-80">
                      Tricks: {player.tricksWon}
                    </p>
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
                <h4 className="text-2xl font-bold text-team2">Team 2</h4>
                {leadingTeam === 2 && (
                  <span className="text-3xl" aria-hidden="true">
                    👑
                  </span>
                )}
              </div>
              <div className="text-5xl font-bold text-team2 mb-4">
                {team2Score}
              </div>
              <div className="space-y-2">
                {team2Players.map((player) => (
                  <UICard
                    key={player.id}
                    variant="bordered"
                    size="sm"
                    className="bg-skin-secondary bg-opacity-80 border-team2"
                  >
                    <p className="font-semibold text-team2">
                      {player.name}
                    </p>
                    <p className="text-sm text-team2 opacity-80">
                      Tricks: {player.tricksWon}
                    </p>
                  </UICard>
                ))}
              </div>
            </UICard>
          </div>

          {leadingTeam === null && (
            <p className="text-center text-skin-secondary mt-4 font-semibold">
              It's a tie! Both teams have {team1Score} points.
            </p>
          )}
        </section>

        {/* Current Bet */}
        {gameState.highestBet && (
          <section>
            <h3 className="text-xl font-bold text-skin-primary mb-4 border-b-2 border-skin-default pb-2 font-serif">
              <span aria-hidden="true">🎲</span> Current Bet
            </h3>
            <UICard
              variant="bordered"
              size="md"
              className="bg-skin-secondary"
            >
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-skin-secondary font-semibold">
                    Highest Bidder
                  </p>
                  <p className="text-lg font-bold text-skin-primary">
                    {gameState.players.find((p) => p.id === gameState.highestBet?.playerId)?.name ||
                      'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-skin-secondary font-semibold">
                    Bet Amount
                  </p>
                  <p className="text-lg font-bold text-skin-primary">
                    {gameState.highestBet.amount} points
                  </p>
                </div>
                <div>
                  <p className="text-sm text-skin-secondary font-semibold">Type</p>
                  <p className="text-lg font-bold text-skin-primary">
                    {gameState.highestBet.withoutTrump ? (
                      <span className="text-skin-error">Without Trump (2x)</span>
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
        {reversedRoundHistory.length > 0 && (
          <section>
            <h3 className="text-xl font-bold text-skin-primary mb-4 border-b-2 border-skin-default pb-2 font-serif">
              <span aria-hidden="true">📜</span> Round History
            </h3>
            <div className="space-y-3">
              {reversedRoundHistory.map((round) => {
                const betPlayer = gameState.players.find((p) => p.id === round.highestBet.playerId);
                const isExpanded = expandedRounds.has(round.roundNumber);
                const hasTricks = round.tricks && round.tricks.length > 0;

                return (
                  <UICard
                    key={round.roundNumber}
                    variant="bordered"
                    size="md"
                    className="bg-skin-secondary overflow-hidden transition-colors"
                  >
                    <div className="p-4 hover:bg-skin-tertiary">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <h4 className="text-lg font-bold text-skin-primary">
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
                          <span aria-hidden="true">{round.betMade ? '✓' : '✗'}</span>{' '}
                          {round.betMade ? 'Bet Made' : 'Bet Failed'}
                        </UIBadge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-skin-secondary font-semibold">Bidder</p>
                          <p className="font-bold text-skin-primary">
                            {betPlayer?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-skin-muted">
                            Team {round.offensiveTeam}
                          </p>
                        </div>
                        <div>
                          <p className="text-skin-secondary font-semibold">Bet</p>
                          <p className="font-bold text-skin-primary">
                            {round.betAmount} points
                          </p>
                          <p className="text-xs text-skin-muted">
                            {round.withoutTrump ? 'Without Trump (2x)' : 'With Trump'}
                          </p>
                        </div>
                        <div>
                          <p className="text-skin-secondary font-semibold">
                            Points Earned
                          </p>
                          <p className="font-bold text-skin-primary">
                            {round.offensivePoints} / {round.betAmount}
                          </p>
                          <p className="text-xs text-skin-muted">
                            Defensive: {round.defensivePoints}
                          </p>
                        </div>
                        <div>
                          <p className="text-skin-secondary font-semibold">
                            Round Score
                          </p>
                          <p className="font-bold">
                            <span className="text-team1">
                              {round.roundScore.team1 >= 0 ? '+' : ''}
                              {round.roundScore.team1}
                            </span>
                            {' / '}
                            <span className="text-team2">
                              {round.roundScore.team2 >= 0 ? '+' : ''}
                              {round.roundScore.team2}
                            </span>
                          </p>
                          <p className="text-xs text-skin-muted">
                            Total: {round.cumulativeScore.team1} - {round.cumulativeScore.team2}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Trick History */}
                    {isExpanded && hasTricks && (
                      <div className="bg-skin-primary border-t-2 border-skin-default p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <h5 className="text-sm font-bold text-skin-primary">
                            <span aria-hidden="true">🃏</span> Tricks Played
                          </h5>
                          {round.trump && (
                            <UIBadge variant="solid" color="info" size="sm">
                              Trump: <span className="capitalize">{round.trump}</span>
                            </UIBadge>
                          )}
                        </div>
                        <div className="space-y-3">
                          {round.tricks.map((trick, trickIndex) => {
                            const winner = gameState.players.find((p) => p.id === trick.winnerId);
                            const winnerBadgeColor = winner?.teamId === 1 ? 'team1' : 'team2';
                            return (
                              <UICard
                                key={trickIndex}
                                variant="bordered"
                                size="sm"
                                className="bg-skin-secondary"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-semibold text-skin-primary">
                                    Trick {trickIndex + 1}
                                  </span>
                                  <UIBadge variant="solid" color={winnerBadgeColor} size="sm">
                                    <span aria-hidden="true">👑</span> {winner?.name || 'Unknown'} (
                                    {trick.points >= 0 ? '+' : ''}
                                    {trick.points} pts)
                                  </UIBadge>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                  {trick.trick.map((trickCard, cardIndex) => {
                                    const player = gameState.players.find(
                                      (p) => p.id === trickCard.playerId
                                    );
                                    const isWinner = trickCard.playerId === trick.winnerId;
                                    return (
                                      <div key={cardIndex} className="text-center">
                                        <div
                                          className={`mb-1 inline-block ${isWinner ? 'ring-2 ring-yellow-400 rounded-lg' : ''}`}
                                        >
                                          <CardComponent
                                            card={trickCard.card}
                                            size="tiny"
                                            disabled={true}
                                          />
                                        </div>
                                        <p className="text-xs font-medium text-skin-secondary truncate">
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

        {(!gameState.roundHistory || gameState.roundHistory.length === 0) && (
          <section>
            <UICard
              variant="bordered"
              size="lg"
              className="bg-skin-secondary text-center"
            >
              <p className="text-skin-muted text-lg">
                No rounds completed yet. Start playing to see round history!
              </p>
            </UICard>
          </section>
        )}
      </div>
    </Modal>
  );
}

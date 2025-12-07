/**
 * ScoreBoard Component - Multi-Skin Edition
 *
 * Team scores with floating animations and bet indicators.
 * Uses CSS variables for skin compatibility.
 */

import { useState, useEffect, useMemo, useRef, memo } from 'react';
import { ContextualGameInfo } from '../ContextualGameInfo';
import { TimeoutIndicator } from '../TimeoutIndicator';
import { Player, CardColor } from '../../types/game';
import type { ScoreBoardProps } from './types';

export const ScoreBoard = memo(function ScoreBoard({
  gameState,
  isCurrentTurn,
  onAutoplayTimeout,
}: ScoreBoardProps) {
  const [floatingPoints, setFloatingPoints] = useState<{
    team1: number | null;
    team2: number | null;
  }>({ team1: null, team2: null });
  const [floatingTrickPoints, setFloatingTrickPoints] = useState<{
    team1: number | null;
    team2: number | null;
  }>({ team1: null, team2: null });

  // Use refs to track previous values
  const prevTeamScoresRef = useRef<{ team1: number; team2: number } | null>(null);
  const prevRoundScoresRef = useRef<{ team1: number; team2: number } | null>(null);

  // Calculate round scores
  const { team1RoundScore, team2RoundScore } = useMemo(() => {
    const team1 = gameState.players
      .filter((p) => p.teamId === 1)
      .reduce((sum, p) => sum + p.pointsWon, 0);
    const team2 = gameState.players
      .filter((p) => p.teamId === 2)
      .reduce((sum, p) => sum + p.pointsWon, 0);
    return { team1RoundScore: team1, team2RoundScore: team2 };
  }, [gameState.players]);

  // Get current turn player
  const currentTurnPlayer: Player | undefined = gameState.players[gameState.currentPlayerIndex];

  // Cumulative score change animation
  useEffect(() => {
    if (prevTeamScoresRef.current === null) {
      prevTeamScoresRef.current = {
        team1: gameState.teamScores.team1,
        team2: gameState.teamScores.team2,
      };
      return;
    }

    const team1Delta = gameState.teamScores.team1 - prevTeamScoresRef.current.team1;
    const team2Delta = gameState.teamScores.team2 - prevTeamScoresRef.current.team2;

    if (team1Delta !== 0) {
      setFloatingPoints((prev) => ({ ...prev, team1: team1Delta }));
      setTimeout(() => setFloatingPoints((prev) => ({ ...prev, team1: null })), 2500);
    }

    if (team2Delta !== 0) {
      setFloatingPoints((prev) => ({ ...prev, team2: team2Delta }));
      setTimeout(() => setFloatingPoints((prev) => ({ ...prev, team2: null })), 2500);
    }

    prevTeamScoresRef.current = {
      team1: gameState.teamScores.team1,
      team2: gameState.teamScores.team2,
    };
  }, [gameState.teamScores.team1, gameState.teamScores.team2]);

  // Round score change animation
  useEffect(() => {
    if (prevRoundScoresRef.current === null) {
      prevRoundScoresRef.current = { team1: team1RoundScore, team2: team2RoundScore };
      return;
    }

    const team1Delta = team1RoundScore - prevRoundScoresRef.current.team1;
    const team2Delta = team2RoundScore - prevRoundScoresRef.current.team2;

    if (team1Delta !== 0) {
      setFloatingTrickPoints((prev) => ({ ...prev, team1: team1Delta }));
      setTimeout(() => setFloatingTrickPoints((prev) => ({ ...prev, team1: null })), 2000);
    }

    if (team2Delta !== 0) {
      setFloatingTrickPoints((prev) => ({ ...prev, team2: team2Delta }));
      setTimeout(() => setFloatingTrickPoints((prev) => ({ ...prev, team2: null })), 2000);
    }

    prevRoundScoresRef.current = { team1: team1RoundScore, team2: team2RoundScore };
  }, [team1RoundScore, team2RoundScore]);

  // Check if team has the bet
  const team1HasBet =
    gameState.highestBet &&
    gameState.players.find((p) => p.id === gameState.highestBet?.playerId)?.teamId === 1;
  const team2HasBet =
    gameState.highestBet &&
    gameState.players.find((p) => p.id === gameState.highestBet?.playerId)?.teamId === 2;

  return (
    <div className="w-full mb-2 md:mb-4 lg:mb-6 flex-shrink-0 px-2 md:px-4 lg:px-6 pt-2 md:pt-4 lg:pt-6 overflow-visible">
      <div
        className="rounded-[var(--radius-xl)] p-2 md:p-4 lg:p-6 border-2 border-skin-accent bg-skin-secondary shadow-[var(--shadow-glow)] overflow-visible"
        data-testid="score-board"
      >
        <div className="flex justify-between items-center gap-2 md:gap-8">
          {/* Team 1 */}
          <div
            className="flex-1 rounded-[var(--radius-lg)] p-2 md:p-3 border-2 relative overflow-visible bg-skin-team1-primary"
            style={{
              borderColor: team1HasBet ? 'var(--color-warning)' : 'transparent',
              boxShadow: team1HasBet ? '0 0 15px var(--color-warning)' : 'none',
            }}
          >
            <h3 className="text-xs md:text-sm font-display uppercase tracking-wider mb-1 flex items-center justify-start gap-1 text-skin-team1-text opacity-80">
              <span>Team 1</span>
              {team1HasBet && (
                <span className="flex items-center gap-1">
                  <span className="text-base">🎲</span>
                  <span className="font-bold text-sm">{gameState.highestBet?.amount}</span>
                </span>
              )}
            </h3>
            <p className="text-lg md:text-2xl font-display relative text-skin-team1-text">
              {team1RoundScore >= 0 ? '+' : ''}
              {team1RoundScore} pts
              {floatingTrickPoints.team1 !== null && (
                <span className="absolute left-1/2 -translate-x-1/2 -top-8 animate-points-float-up z-[9999]">
                  <span
                    className="px-2 py-1 rounded-full font-black text-white text-xs border-2"
                    style={{
                      backgroundColor:
                        floatingTrickPoints.team1 >= 0
                          ? 'var(--color-success)'
                          : 'var(--color-error)',
                      borderColor:
                        floatingTrickPoints.team1 >= 0
                          ? 'var(--color-success)'
                          : 'var(--color-error)',
                    }}
                  >
                    {floatingTrickPoints.team1 >= 0 ? '+' : ''}
                    {floatingTrickPoints.team1}
                  </span>
                </span>
              )}
            </p>
            {floatingPoints.team1 !== null && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 animate-points-float-up z-[9999]">
                <div
                  className="px-3 py-1.5 rounded-full font-black text-white border-2"
                  style={{
                    backgroundColor:
                      floatingPoints.team1 >= 0 ? 'var(--color-success)' : 'var(--color-error)',
                    borderColor:
                      floatingPoints.team1 >= 0 ? 'var(--color-success)' : 'var(--color-error)',
                  }}
                >
                  <span className="text-base md:text-xl">
                    {floatingPoints.team1 >= 0 ? '+' : ''}
                    {floatingPoints.team1}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Center Info */}
          <div className="text-center flex-shrink-0">
            <ContextualGameInfo
              state={
                gameState.currentTrick.length >= 4
                  ? 'trick_complete'
                  : gameState.currentTrick.length === 0
                    ? 'waiting'
                    : 'in_progress'
              }
              currentPlayerName={currentTurnPlayer?.name}
              betAmount={gameState.highestBet?.amount}
              withoutTrump={gameState.highestBet?.withoutTrump}
              trumpColor={gameState.trump as CardColor}
              bettingTeamId={
                gameState.highestBet
                  ? gameState.players.find((p) => p.id === gameState.highestBet?.playerId)?.teamId
                  : undefined
              }
            />
            {/* Hidden timeout indicator for autoplay trigger */}
            {gameState.currentTrick.length < 4 && isCurrentTurn && (
              <div className="hidden">
                <TimeoutIndicator
                  duration={60000}
                  isActive={true}
                  resetKey={gameState.currentPlayerIndex}
                  onTimeout={onAutoplayTimeout}
                />
              </div>
            )}
          </div>

          {/* Team 2 */}
          <div
            className="flex-1 rounded-[var(--radius-lg)] p-2 md:p-3 text-right border-2 relative overflow-visible bg-skin-team2-primary"
            style={{
              borderColor: team2HasBet ? 'var(--color-warning)' : 'transparent',
              boxShadow: team2HasBet ? '0 0 15px var(--color-warning)' : 'none',
            }}
          >
            <h3 className="text-xs md:text-sm font-display uppercase tracking-wider mb-1 flex items-center justify-end gap-1 text-skin-team2-text opacity-80">
              {team2HasBet && (
                <span className="flex items-center gap-1">
                  <span className="text-base">🎲</span>
                  <span className="font-bold text-sm">{gameState.highestBet?.amount}</span>
                </span>
              )}
              <span>Team 2</span>
            </h3>
            <p className="text-lg md:text-2xl font-display relative text-skin-team2-text">
              {team2RoundScore >= 0 ? '+' : ''}
              {team2RoundScore} pts
              {floatingTrickPoints.team2 !== null && (
                <span className="absolute left-1/2 -translate-x-1/2 -top-8 animate-points-float-up z-[9999]">
                  <span
                    className="px-2 py-1 rounded-full font-black text-white text-xs border-2"
                    style={{
                      backgroundColor:
                        floatingTrickPoints.team2 >= 0
                          ? 'var(--color-success)'
                          : 'var(--color-error)',
                      borderColor:
                        floatingTrickPoints.team2 >= 0
                          ? 'var(--color-success)'
                          : 'var(--color-error)',
                    }}
                  >
                    {floatingTrickPoints.team2 >= 0 ? '+' : ''}
                    {floatingTrickPoints.team2}
                  </span>
                </span>
              )}
            </p>
            {floatingPoints.team2 !== null && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 animate-points-float-up z-[9999]">
                <div
                  className="px-3 py-1.5 rounded-full font-black text-white border-2"
                  style={{
                    backgroundColor:
                      floatingPoints.team2 >= 0 ? 'var(--color-success)' : 'var(--color-error)',
                    borderColor:
                      floatingPoints.team2 >= 0 ? 'var(--color-success)' : 'var(--color-error)',
                  }}
                >
                  <span className="text-base md:text-xl">
                    {floatingPoints.team2 >= 0 ? '+' : ''}
                    {floatingPoints.team2}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

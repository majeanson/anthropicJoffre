/**
 * ScoreBoard Component
 * Renders team scores, bet badges, and contextual game info
 * Includes floating score animations for round and cumulative scores
 *
 * Extracted from PlayingPhase.tsx (lines 282-330, 641-646, 676-787)
 * Part of Sprint: PlayingPhase.tsx split into focused components
 */

import { useState, useEffect, useMemo, useRef, memo } from 'react';
import { ContextualGameInfo } from '../ContextualGameInfo';
import { TimeoutIndicator } from '../TimeoutIndicator';
import { GameState, CardColor, Player } from '../../types/game';
import { colors } from '../../design-system';

export interface ScoreBoardProps {
  gameState: GameState;
  isCurrentTurn: boolean;
  onAutoplayTimeout: () => void;
}

export const ScoreBoard = memo(function ScoreBoard({ gameState, isCurrentTurn, onAutoplayTimeout }: ScoreBoardProps) {
  const [floatingPoints, setFloatingPoints] = useState<{
    team1: number | null;
    team2: number | null;
  }>({ team1: null, team2: null });
  const [floatingTrickPoints, setFloatingTrickPoints] = useState<{
    team1: number | null;
    team2: number | null;
  }>({ team1: null, team2: null });

  // Use refs to track previous values (avoids re-renders and infinite loops)
  const prevTeamScoresRef = useRef<{ team1: number; team2: number } | null>(null);
  const prevRoundScoresRef = useRef<{ team1: number; team2: number } | null>(null);

  // Calculate round scores (points earned this round)
  const { team1RoundScore, team2RoundScore } = useMemo(() => {
    const team1 = gameState.players
      .filter(p => p.teamId === 1)
      .reduce((sum, p) => sum + p.pointsWon, 0);
    const team2 = gameState.players
      .filter(p => p.teamId === 2)
      .reduce((sum, p) => sum + p.pointsWon, 0);
    return { team1RoundScore: team1, team2RoundScore: team2 };
  }, [gameState.players]);

  // Get current turn player
  const currentTurnPlayer: Player | undefined = gameState.players[gameState.currentPlayerIndex];

  // Cumulative score change animation (round-end)
  useEffect(() => {
    // Initialize on first render
    if (prevTeamScoresRef.current === null) {
      prevTeamScoresRef.current = { team1: gameState.teamScores.team1, team2: gameState.teamScores.team2 };
      return;
    }

    const team1Delta = gameState.teamScores.team1 - prevTeamScoresRef.current.team1;
    const team2Delta = gameState.teamScores.team2 - prevTeamScoresRef.current.team2;

    if (team1Delta !== 0) {
      setFloatingPoints(prev => ({ ...prev, team1: team1Delta }));
      setTimeout(() => setFloatingPoints(prev => ({ ...prev, team1: null })), 2500);
    }

    if (team2Delta !== 0) {
      setFloatingPoints(prev => ({ ...prev, team2: team2Delta }));
      setTimeout(() => setFloatingPoints(prev => ({ ...prev, team2: null })), 2500);
    }

    // Update ref after processing deltas
    prevTeamScoresRef.current = { team1: gameState.teamScores.team1, team2: gameState.teamScores.team2 };
  }, [gameState.teamScores.team1, gameState.teamScores.team2]);

  // Round score change animation (trick-by-trick)
  useEffect(() => {
    // Initialize on first render
    if (prevRoundScoresRef.current === null) {
      prevRoundScoresRef.current = { team1: team1RoundScore, team2: team2RoundScore };
      return;
    }

    const team1Delta = team1RoundScore - prevRoundScoresRef.current.team1;
    const team2Delta = team2RoundScore - prevRoundScoresRef.current.team2;

    if (team1Delta !== 0) {
      setFloatingTrickPoints(prev => ({ ...prev, team1: team1Delta }));
      setTimeout(() => {
        setFloatingTrickPoints(prev => ({ ...prev, team1: null }));
      }, 2000);
    }

    if (team2Delta !== 0) {
      setFloatingTrickPoints(prev => ({ ...prev, team2: team2Delta }));
      setTimeout(() => {
        setFloatingTrickPoints(prev => ({ ...prev, team2: null }));
      }, 2000);
    }

    // Update ref after processing deltas
    prevRoundScoresRef.current = { team1: team1RoundScore, team2: team2RoundScore };
  }, [team1RoundScore, team2RoundScore]);

  return (
    <div className="w-full mb-2 md:mb-4 lg:mb-6 flex-shrink-0 px-2 md:px-4 lg:px-6 pt-2 md:pt-4 lg:pt-6 overflow-visible">
      <div
        className="bg-umber-900/40 backdrop-blur-md rounded-2xl p-2 md:p-4 lg:p-6 shadow-2xl border-2 border-parchment-400 dark:border-gray-600 overflow-visible"
        data-testid="score-board"
      >
        <div className="flex justify-between items-center gap-2 md:gap-8">
          {/* Team 1 */}
          <div className="flex-1 rounded-xl p-2 md:p-3 border border-orange-200 relative overflow-visible" style={{ background: colors.gradients.team1 }}>
            <h3 className="text-xs md:text-sm font-semibold text-orange-600/70 uppercase tracking-wider mb-1 flex items-center justify-start gap-1">
              <span>Team 1</span>
              {gameState.highestBet &&
                gameState.players.find(p => p.id === gameState.highestBet?.playerId)?.teamId ===
                  1 && (
                  <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                    <span className="text-base">🎲</span>
                    <span className="font-bold text-sm">{gameState.highestBet.amount}</span>
                  </span>
                )}
            </h3>
            <p className="text-lg md:text-2xl font-bold text-orange-500 relative">
              {team1RoundScore >= 0 ? '+' : ''}
              {team1RoundScore} pts
              {floatingTrickPoints.team1 !== null && (
                <span className="absolute left-1/2 -translate-x-1/2 -top-8 animate-points-float-up z-[9999]">
                  <span
                    className={`px-2 py-1 rounded-full font-black text-white shadow-2xl border-2 text-xs ${
                      floatingTrickPoints.team1 >= 0
                        ? 'bg-green-500 border-green-300'
                        : 'bg-red-500 border-red-300'
                    }`}
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
                  className={`px-3 py-1.5 rounded-full font-black text-white shadow-2xl border-2 ${
                    floatingPoints.team1 >= 0
                      ? 'bg-green-500 border-green-300'
                      : 'bg-red-500 border-red-300'
                  }`}
                >
                  <span className="text-base md:text-xl">
                    {floatingPoints.team1 >= 0 ? '+' : ''}
                    {floatingPoints.team1}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Center Info - Contextual Display */}
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
                  ? gameState.players.find(p => p.id === gameState.highestBet?.playerId)?.teamId
                  : undefined
              }
            />
            {/* Keep timeout indicator for autoplay trigger (hidden) */}
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
          <div className="flex-1 rounded-xl p-2 md:p-3 text-right border border-purple-200 relative overflow-visible" style={{ background: colors.gradients.team2 }}>
            <h3 className="text-xs md:text-sm font-semibold text-purple-600/70 uppercase tracking-wider mb-1 flex items-center justify-end gap-1">
              {gameState.highestBet &&
                gameState.players.find(p => p.id === gameState.highestBet?.playerId)?.teamId ===
                  2 && (
                  <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                    <span className="text-base">🎲</span>
                    <span className="font-bold text-sm">{gameState.highestBet.amount}</span>
                  </span>
                )}
              <span>Team 2</span>
            </h3>
            <p className="text-lg md:text-2xl font-bold text-purple-500 relative">
              {team2RoundScore >= 0 ? '+' : ''}
              {team2RoundScore} pts
              {floatingTrickPoints.team2 !== null && (
                <span className="absolute left-1/2 -translate-x-1/2 -top-8 animate-points-float-up z-[9999]">
                  <span
                    className={`px-2 py-1 rounded-full font-black text-white shadow-2xl border-2 text-xs ${
                      floatingTrickPoints.team2 >= 0
                        ? 'bg-green-500 border-green-300'
                        : 'bg-red-500 border-red-300'
                    }`}
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
                  className={`px-3 py-1.5 rounded-full font-black text-white shadow-2xl border-2 ${
                    floatingPoints.team2 >= 0
                      ? 'bg-green-500 border-green-300'
                      : 'bg-red-500 border-red-300'
                  }`}
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

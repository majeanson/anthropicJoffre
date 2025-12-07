/**
 * RoundSummary Component
 *
 * Displays comprehensive round-end statistics including:
 * - Team scores and bet results
 * - Creative performance and hand-based statistics (3 at a time, cycling)
 * - Detailed player stats (tricks, points, special cards)
 * - Starting hands and bets for each player
 */

import React, { useState, useEffect, useMemo } from 'react';
import { TrickHistory } from '../TrickHistory';
import { UICard } from '../ui';
import { calculateRoundXp, XP_REWARDS, CURRENCY_REWARDS } from '../../utils/xpSystem';
import { RoundSummaryProps, RoundStatistics, DisplayedStat, RewardsEarned } from './types';
import { getStatScore } from './utils';
import { LoadingState } from './LoadingState';
import { TeamScoreCard } from './TeamScoreCard';
import { RewardsSection } from './RewardsSection';
import { ReadyStatus } from './ReadyStatus';
import { HighlightCard } from './HighlightCard';
import { PlayerPerformanceTable } from './PlayerPerformanceTable';
import { BetsAndHandsSection } from './BetsAndHandsSection';

const RoundSummary: React.FC<RoundSummaryProps> = ({ gameState, onReady, currentPlayerId }) => {
  // Safety check: ensure roundHistory exists and has entries
  const lastRound =
    gameState.roundHistory?.length > 0
      ? gameState.roundHistory[gameState.roundHistory.length - 1]
      : undefined;

  // Early return BEFORE any hooks
  if (!lastRound) {
    return null;
  }

  // NOW it's safe to call hooks - all conditional returns are done
  const [dataReady, setDataReady] = useState(false);

  // Memoize expensive computations for performance
  const roundData = useMemo(() => {
    const statistics = lastRound?.statistics as RoundStatistics | undefined;
    return { statistics };
  }, [lastRound]);

  const { statistics } = roundData;

  // Check if round data is ready (prevents showing stale data during transition)
  useEffect(() => {
    if (!gameState.roundHistory || gameState.roundHistory.length === 0) {
      setDataReady(false);
      return;
    }

    const latestRound = gameState.roundHistory[gameState.roundHistory.length - 1];
    const expectedRoundNumber = gameState.roundNumber;

    if (latestRound && latestRound.roundNumber === expectedRoundNumber) {
      const timer = setTimeout(() => {
        setDataReady(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setDataReady(false);
    }
  }, [gameState.roundHistory, gameState.roundNumber]);

  // Keyboard accessibility - Enter to mark ready
  useEffect(() => {
    if (!dataReady) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onReady();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dataReady, onReady]);

  // Collect all available stats with scores (memoized)
  const allStats = useMemo(() => {
    const stats: DisplayedStat[] = [];

    if (statistics?.perfectBet)
      stats.push({
        title: 'Perfect Bet',
        icon: '🎯',
        stat: statistics.perfectBet,
        score: getStatScore('Perfect Bet', statistics.perfectBet),
      });
    if (statistics?.teamMVP)
      stats.push({
        title: 'Team MVP',
        icon: '⭐',
        stat: statistics.teamMVP,
        score: getStatScore('Team MVP', statistics.teamMVP),
      });
    if (statistics?.luckyPlayer)
      stats.push({
        title: 'Lucky Player',
        icon: '🍀',
        stat: statistics.luckyPlayer,
        score: getStatScore('Lucky Player', statistics.luckyPlayer),
      });
    if (statistics?.pointLeader)
      stats.push({
        title: 'Point Leader',
        icon: '💎',
        stat: statistics.pointLeader,
        score: getStatScore('Point Leader', statistics.pointLeader),
      });
    if (statistics?.trickMaster)
      stats.push({
        title: 'Trick Master',
        icon: '🏆',
        stat: statistics.trickMaster,
        score: getStatScore('Trick Master', statistics.trickMaster),
      });
    if (statistics?.monochrome)
      stats.push({
        title: 'Monochrome',
        icon: '🖤',
        stat: statistics.monochrome,
        score: getStatScore('Monochrome', statistics.monochrome),
      });
    if (statistics?.luckySevens)
      stats.push({
        title: 'Lucky Sevens',
        icon: '7️⃣',
        stat: statistics.luckySevens,
        score: getStatScore('Lucky Sevens', statistics.luckySevens),
      });
    if (statistics?.suitedUp)
      stats.push({
        title: 'Suited Up',
        icon: '♠',
        stat: statistics.suitedUp,
        score: getStatScore('Suited Up', statistics.suitedUp),
      });
    if (statistics?.trumpHeavy)
      stats.push({
        title: 'Trump Heavy',
        icon: '🃏',
        stat: statistics.trumpHeavy,
        score: getStatScore('Trump Heavy', statistics.trumpHeavy),
      });
    if (statistics?.rainbow)
      stats.push({
        title: 'Rainbow',
        icon: '🌈',
        stat: statistics.rainbow,
        score: getStatScore('Rainbow', statistics.rainbow),
      });
    if (statistics?.trumpMaster)
      stats.push({
        title: 'Trump Master',
        icon: '👑',
        stat: statistics.trumpMaster,
        score: getStatScore('Trump Master', statistics.trumpMaster),
      });
    if (statistics?.highRoller)
      stats.push({
        title: 'High Roller',
        icon: '📈',
        stat: statistics.highRoller,
        score: getStatScore('High Roller', statistics.highRoller),
      });
    if (statistics?.lowball)
      stats.push({
        title: 'Lowball',
        icon: '📉',
        stat: statistics.lowball,
        score: getStatScore('Lowball', statistics.lowball),
      });

    return stats;
  }, [statistics]);

  // Sort by score (most interesting first) and take top 3 (memoized)
  const displayedStats = useMemo(() => {
    return allStats.sort((a, b) => b.score - a.score).slice(0, 3);
  }, [allStats]);

  // Calculate XP and coins earned this round for current player
  const rewardsEarned = useMemo((): RewardsEarned | null => {
    if (!currentPlayerId) return null;

    const currentPlayer = gameState.players.find(
      (p) => p.name === currentPlayerId || p.id === currentPlayerId
    );
    if (!currentPlayer || currentPlayer.isBot) return null;

    const playerStats = lastRound?.playerStats?.find((ps) => ps.playerName === currentPlayer.name);
    const playerTeam = currentPlayer.teamId;
    const wasBettingTeam = lastRound.offensiveTeam === playerTeam;
    const betSuccessful = wasBettingTeam && lastRound.betMade;

    const tricksWon = currentPlayer.tricksWon || 0;
    const redZerosCollected = playerStats?.redZerosCollected || 0;

    const xp = calculateRoundXp({
      tricksWon,
      betSuccessful,
      redZerosCollected,
    });

    let coins = betSuccessful
      ? CURRENCY_REWARDS.ROUND_WON + CURRENCY_REWARDS.BET_MADE
      : CURRENCY_REWARDS.ROUND_LOST;
    coins += redZerosCollected * CURRENCY_REWARDS.RED_ZERO_COLLECTED;

    return {
      xp: {
        total: xp,
        breakdown: {
          tricks: tricksWon * XP_REWARDS.TRICK_WON,
          bet: betSuccessful ? XP_REWARDS.SUCCESSFUL_BET : 0,
          redZeros: redZerosCollected * XP_REWARDS.RED_ZERO_COLLECTED,
        },
      },
      coins: {
        total: coins,
        breakdown: {
          round: betSuccessful
            ? CURRENCY_REWARDS.ROUND_WON + CURRENCY_REWARDS.BET_MADE
            : CURRENCY_REWARDS.ROUND_LOST,
          redZeros: redZerosCollected * CURRENCY_REWARDS.RED_ZERO_COLLECTED,
        },
      },
      tricksWon,
      betSuccessful,
      redZerosCollected,
    };
  }, [currentPlayerId, gameState.players, lastRound]);

  // Show loading state while data is being calculated
  if (!dataReady) {
    return <LoadingState />;
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="text-center animate-fadeInDown">
        <h2 className="text-3xl sm:text-4xl font-black mb-2 bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent">
          Round {gameState.roundNumber} Complete
        </h2>
      </div>

      {/* Player Ready Status */}
      <ReadyStatus
        players={gameState.players}
        playersReady={gameState.playersReady || []}
        onReady={onReady}
      />

      {/* Team Scores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeInUp delay-100">
        <TeamScoreCard
          teamId={1}
          roundScore={lastRound.roundScore.team1}
          totalScore={gameState.teamScores.team1}
          isOffensiveTeam={lastRound.offensiveTeam === 1}
          betMade={lastRound.betMade}
        />
        <TeamScoreCard
          teamId={2}
          roundScore={lastRound.roundScore.team2}
          totalScore={gameState.teamScores.team2}
          isOffensiveTeam={lastRound.offensiveTeam === 2}
          betMade={lastRound.betMade}
        />
      </div>

      {/* Rewards Earned This Round (XP + Coins) */}
      {rewardsEarned && <RewardsSection rewards={rewardsEarned} />}

      {/* Round Highlights - Only 3 stats, cycling */}
      {displayedStats.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-lg sm:text-xl text-skin-primary animate-fadeInUp delay-200">
            ⭐ Round Highlights
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayedStats.map((item, index) => (
              <HighlightCard
                key={item.title}
                title={item.title}
                icon={item.icon}
                stat={item.stat}
                index={index}
              />
            ))}
          </div>
        </div>
      )}

      {/* Trick History */}
      {lastRound.tricks && lastRound.tricks.length > 0 && (
        <div className="space-y-3 animate-fadeInUp delay-300">
          <h3 className="font-bold text-lg sm:text-xl text-skin-primary">
            🃏 Trick History
          </h3>
          <UICard
            variant="bordered"
            className="bg-skin-secondary border-2 border-skin-accent"
          >
            <TrickHistory
              tricks={lastRound.tricks}
              players={gameState.players}
              trump={lastRound.trump}
              compact={true}
              showWinner={true}
            />
          </UICard>
        </div>
      )}

      {/* Detailed Player Statistics */}
      <PlayerPerformanceTable players={gameState.players} lastRound={lastRound} />

      {/* Bets and Starting Hands */}
      <BetsAndHandsSection players={gameState.players} statistics={statistics} />
    </div>
  );
};

export default RoundSummary;
export * from './types';

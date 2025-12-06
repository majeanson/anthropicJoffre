/**
 * Round Summary Component
 *
 * Displays comprehensive round-end statistics including:
 * - Team scores and bet results
 * - Creative performance and hand-based statistics (3 at a time, cycling)
 * - Detailed player stats (tricks, points, special cards)
 * - Starting hands and bets for each player
 */

import React, { useState, useEffect, useMemo } from 'react';
import { GameState, Card } from '../types/game';
import { TrickHistory } from './TrickHistory';
import { Card as CardComponent } from './Card';
import { UICard, Button } from './ui';
import { calculateRoundXp, XP_REWARDS, CURRENCY_REWARDS } from '../utils/xpSystem';
import { XP_STRINGS } from '../constants/xpStrings';

interface RoundStatistics {
  // Performance-based stats
  trickMaster?: { playerId: string; playerName: string; tricksWon: number };
  pointLeader?: { playerId: string; playerName: string; pointsEarned: number };
  perfectBet?: { playerId: string; playerName: string; betAmount: number };
  teamMVP?: { playerId: string; playerName: string; contribution: number };
  trumpMaster?: { playerId: string; playerName: string; trumpsPlayed: number };
  luckyPlayer?: { playerId: string; playerName: string; redZeros: number };

  // Starting hand stats
  monochrome?: { playerId: string; playerName: string };
  suitedUp?: { playerId: string; playerName: string; suit: string; count: number };
  luckySevens?: { playerId: string; playerName: string; sevensCount: number };
  rainbow?: { playerId: string; playerName: string };
  lowball?: { playerId: string; playerName: string; avgValue: number };
  highRoller?: { playerId: string; playerName: string; avgValue: number };
  trumpHeavy?: { playerId: string; playerName: string; trumpCount: number };

  // Raw data
  initialHands?: { [playerName: string]: Card[] };
  playerBets?: { [playerName: string]: { amount: number; withoutTrump: boolean } | null };
}

// Type for all possible stat values
type StatValue =
  | RoundStatistics['trickMaster']
  | RoundStatistics['pointLeader']
  | RoundStatistics['perfectBet']
  | RoundStatistics['teamMVP']
  | RoundStatistics['trumpMaster']
  | RoundStatistics['luckyPlayer']
  | RoundStatistics['monochrome']
  | RoundStatistics['suitedUp']
  | RoundStatistics['luckySevens']
  | RoundStatistics['rainbow']
  | RoundStatistics['lowball']
  | RoundStatistics['highRoller']
  | RoundStatistics['trumpHeavy'];

// Type guards for stat values
function hasContribution(
  stat: StatValue | undefined
): stat is NonNullable<RoundStatistics['teamMVP']> {
  return !!stat && 'contribution' in stat;
}

function hasRedZeros(
  stat: StatValue | undefined
): stat is NonNullable<RoundStatistics['luckyPlayer']> {
  return !!stat && 'redZeros' in stat;
}

function hasPointsEarned(
  stat: StatValue | undefined
): stat is NonNullable<RoundStatistics['pointLeader']> {
  return !!stat && 'pointsEarned' in stat;
}

function hasTricksWon(
  stat: StatValue | undefined
): stat is NonNullable<RoundStatistics['trickMaster']> {
  return !!stat && 'tricksWon' in stat;
}

function hasSevensCount(
  stat: StatValue | undefined
): stat is NonNullable<RoundStatistics['luckySevens']> {
  return !!stat && 'sevensCount' in stat;
}

function hasCount(stat: StatValue | undefined): stat is NonNullable<RoundStatistics['suitedUp']> {
  return !!stat && 'count' in stat;
}

function hasTrumpCount(
  stat: StatValue | undefined
): stat is NonNullable<RoundStatistics['trumpHeavy']> {
  return !!stat && 'trumpCount' in stat;
}

function hasTrumpsPlayed(
  stat: StatValue | undefined
): stat is NonNullable<RoundStatistics['trumpMaster']> {
  return !!stat && 'trumpsPlayed' in stat;
}

function hasAvgValue(
  stat: StatValue | undefined
): stat is NonNullable<RoundStatistics['highRoller']> | NonNullable<RoundStatistics['lowball']> {
  return !!stat && 'avgValue' in stat;
}

function hasSuit(stat: StatValue | undefined): stat is NonNullable<RoundStatistics['suitedUp']> {
  return !!stat && 'suit' in stat;
}

function hasBetAmount(
  stat: StatValue | undefined
): stat is NonNullable<RoundStatistics['perfectBet']> {
  return !!stat && 'betAmount' in stat;
}

interface RoundSummaryProps {
  gameState: GameState;
  onReady: () => void;
  currentPlayerId?: string;
}

const RoundSummary: React.FC<RoundSummaryProps> = ({ gameState, onReady, currentPlayerId }) => {
  // ✅ CRITICAL: Check data BEFORE hooks to prevent "Rendered more hooks than during the previous render" error
  // Rules of Hooks: All early returns must happen BEFORE calling any hooks
  // Safety check: ensure roundHistory exists and has entries
  const lastRound =
    gameState.roundHistory?.length > 0
      ? gameState.roundHistory[gameState.roundHistory.length - 1]
      : undefined;

  // Early return BEFORE any hooks
  if (!lastRound) {
    return null;
  }

  // ✅ NOW it's safe to call hooks - all conditional returns are done
  const [dataReady, setDataReady] = useState(false);

  // Sprint 8 Task 2: Memoize expensive computations for performance
  const roundData = useMemo(() => {
    const statistics = lastRound?.statistics as RoundStatistics | undefined;
    return { statistics };
  }, [lastRound]);

  const { statistics } = roundData;

  // Check if round data is ready (prevents showing stale data during transition)
  useEffect(() => {
    // Safety check: ensure roundHistory exists and has entries
    if (!gameState.roundHistory || gameState.roundHistory.length === 0) {
      setDataReady(false);
      return;
    }

    const latestRound = gameState.roundHistory[gameState.roundHistory.length - 1];
    const expectedRoundNumber = gameState.roundNumber;

    // Wait for the latest round to match the expected round number
    // This ensures we don't show stale data from the previous round
    if (latestRound && latestRound.roundNumber === expectedRoundNumber) {
      // Add a small delay to ensure all data is fully computed
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

  // ✅ Helper function for calculating stat scores (not a hook, can be defined here)
  const getStatScore = (title: string, stat: StatValue): number => {
    if (!stat) return 30;
    switch (title) {
      case 'Perfect Bet':
        return 100;
      case 'Team MVP':
        if (hasContribution(stat)) {
          return stat.contribution >= 70 ? 90 : stat.contribution >= 60 ? 60 : 50;
        }
        return 50;
      case 'Lucky Player':
        if (hasRedZeros(stat)) {
          return stat.redZeros >= 2 ? 85 : 70;
        }
        return 70;
      case 'Point Leader':
        if (hasPointsEarned(stat)) {
          return stat.pointsEarned >= 10 ? 80 : stat.pointsEarned >= 8 ? 65 : 50;
        }
        return 50;
      case 'Trick Master':
        if (hasTricksWon(stat)) {
          return stat.tricksWon >= 5 ? 75 : stat.tricksWon >= 4 ? 60 : 45;
        }
        return 45;
      case 'Monochrome':
        return 70;
      case 'Lucky Sevens':
        if (hasSevensCount(stat)) {
          return stat.sevensCount >= 3 ? 70 : 55;
        }
        return 55;
      case 'Suited Up':
        if (hasCount(stat)) {
          return stat.count >= 5 ? 65 : 50;
        }
        return 50;
      case 'Trump Heavy':
        if (hasTrumpCount(stat)) {
          return stat.trumpCount >= 4 ? 60 : 45;
        }
        return 45;
      case 'Rainbow':
        return 55;
      case 'Trump Master':
        if (hasTrumpsPlayed(stat)) {
          return stat.trumpsPlayed >= 4 ? 55 : 40;
        }
        return 40;
      case 'High Roller':
        if (hasAvgValue(stat)) {
          return stat.avgValue >= 5 ? 45 : 35;
        }
        return 35;
      case 'Lowball':
        if (hasAvgValue(stat)) {
          return stat.avgValue <= 2 ? 45 : 35;
        }
        return 35;
      default:
        return 30;
    }
  };

  // ✅ CRITICAL: ALL useMemo hooks must be here, BEFORE any conditional returns
  // Collect all available stats with scores (memoized)
  const allStats = useMemo(() => {
    const stats: Array<{ title: string; icon: string; stat: StatValue; score: number }> = [];

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
  const rewardsEarned = useMemo(() => {
    if (!currentPlayerId) return null;

    // Find current player
    const currentPlayer = gameState.players.find(
      (p) => p.name === currentPlayerId || p.id === currentPlayerId
    );
    if (!currentPlayer || currentPlayer.isBot) return null;

    // Get player stats for this round
    const playerStats = lastRound?.playerStats?.find((ps) => ps.playerName === currentPlayer.name);

    // Check if player's team made the bet
    const playerTeam = currentPlayer.teamId;
    const wasBettingTeam = lastRound.offensiveTeam === playerTeam;
    const betSuccessful = wasBettingTeam && lastRound.betMade;

    // Calculate XP and coins
    const tricksWon = currentPlayer.tricksWon || 0;
    const redZerosCollected = playerStats?.redZerosCollected || 0;

    const xp = calculateRoundXp({
      tricksWon,
      betSuccessful,
      redZerosCollected,
    });

    // Simplified coin calculation for round (brownZerosDodged is game-level stat)
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

  // ✅ NOW hooks are done - render functions can be defined here

  const renderCard = (card: Card) => {
    return <CardComponent key={`${card.color}-${card.value}`} card={card} size="tiny" />;
  };

  const renderBet = (playerName: string) => {
    if (!statistics?.playerBets)
      return <span className="text-gray-500 dark:text-gray-400">--</span>;

    const bet = statistics.playerBets[playerName];
    if (bet === null) {
      return <span className="text-gray-500 dark:text-gray-400 italic">Skipped</span>;
    }
    if (bet) {
      return (
        <span className="font-semibold text-gray-800 dark:text-gray-200">
          Bet {bet.amount}
          {bet.withoutTrump && (
            <span className="ml-1 text-purple-600 dark:text-purple-400">⚡</span>
          )}
        </span>
      );
    }
    return <span className="text-gray-500 dark:text-gray-400">--</span>;
  };

  const renderHand = (playerName: string) => {
    if (!statistics?.initialHands)
      return <span className="text-gray-500 dark:text-gray-400">No hand data</span>;

    const hand = statistics.initialHands[playerName];
    if (!hand) return <span className="text-gray-500 dark:text-gray-400">No hand data</span>;

    // Sort hand by suit then value
    const sortedHand = [...hand].sort((a, b) => {
      if (a.color !== b.color) {
        const suitOrder = ['red', 'blue', 'green', 'brown'];
        return suitOrder.indexOf(a.color) - suitOrder.indexOf(b.color);
      }
      return a.value - b.value;
    });

    return (
      <div className="flex flex-wrap gap-1">
        {sortedHand.map((card, idx) => (
          <div key={idx}>{renderCard(card)}</div>
        ))}
      </div>
    );
  };

  const renderHighlight = (title: string, icon: string, stat: StatValue, index: number) => {
    if (!stat) return null;

    let description = '';
    if (hasTricksWon(stat)) description = `${stat.tricksWon} tricks`;
    else if (hasPointsEarned(stat)) description = `${stat.pointsEarned} points`;
    else if (hasBetAmount(stat)) description = `Exact ${stat.betAmount}`;
    else if (hasContribution(stat)) description = `${stat.contribution}% of team`;
    else if (hasTrumpsPlayed(stat)) description = `${stat.trumpsPlayed} trumps`;
    else if (hasRedZeros(stat))
      description = `${stat.redZeros} red 0${stat.redZeros > 1 ? 's' : ''}`;
    else if (hasSuit(stat) && hasCount(stat)) description = `${stat.count} ${stat.suit}`;
    else if (hasSevensCount(stat)) description = `${stat.sevensCount}× 7s`;
    else if (hasAvgValue(stat)) description = `Avg: ${stat.avgValue}`;
    else if (hasTrumpCount(stat)) description = `${stat.trumpCount} trumps`;
    else if (title === 'Monochrome') description = 'No red cards';
    else if (title === 'Rainbow') description = 'All 4 suits';

    return (
      <div style={{ animationDelay: `${index * 150}ms` }} className="animate-fadeInUp">
        <UICard
          variant="bordered"
          className="flex items-center gap-3 bg-amber-50 dark:bg-gray-700 border-2 border-amber-200 dark:border-gray-600 transform hover:scale-105 transition-transform"
        >
          <span className="text-3xl">{icon}</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wide">
              {title}
            </div>
            <div className="font-bold text-base text-gray-900 dark:text-white truncate">
              {stat.playerName}
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300">{description}</div>
          </div>
        </UICard>
      </div>
    );
  };

  // ✅ Conditional rendering without early return (maintains same hook call count)
  if (!dataReady) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative">
            {/* Spinning cards animation */}
            <div className="flex gap-2 mb-4">
              <div className="w-12 h-16 rounded-lg animate-bounce bg-gradient-to-br from-red-500 to-red-700 delay-0"></div>
              <div className="w-12 h-16 rounded-lg animate-bounce bg-gradient-to-br from-yellow-500 to-orange-500 delay-100"></div>
              <div className="w-12 h-16 rounded-lg animate-bounce bg-gradient-to-br from-green-500 to-emerald-600 delay-200"></div>
              <div className="w-12 h-16 rounded-lg animate-bounce bg-gradient-to-br from-purple-500 to-indigo-600 delay-300"></div>
            </div>
            <p className="text-center text-lg font-semibold text-gray-700 dark:text-gray-300 animate-pulse">
              Calculating round results...
            </p>
          </div>
        </div>
      </div>
    );
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
      <div className="space-y-3 animate-fadeInUp delay-[550ms]">
        <h3 className="font-bold text-lg sm:text-xl text-gray-800 dark:text-gray-200 text-center">
          👥 Ready Status
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-3xl mx-auto">
          {gameState.players.map((player) => {
            const isReady = gameState.playersReady?.includes(player.name) || false;
            return (
              <UICard
                key={player.id}
                variant="bordered"
                size="sm"
                className={`transition-all ${
                  isReady
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-600'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{isReady ? '✓' : '⏳'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                      {player.name}
                    </div>
                    <div
                      className={`text-xs ${isReady ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                      {isReady ? 'Ready' : 'Waiting...'}
                    </div>
                  </div>
                </div>
              </UICard>
            );
          })}
        </div>
      </div>

      {/* Ready Button */}
      <div className="flex justify-center pt-4 animate-fadeInUp delay-[600ms]">
        <Button
          onClick={onReady}
          variant="primary"
          size="lg"
          className="px-8 py-4 text-lg transform hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl bg-gradient-to-r from-purple-500 to-indigo-600"
        >
          Ready for Next Round
        </Button>
      </div>

      {/* Team Scores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeInUp delay-100">
        <UICard
          variant="bordered"
          gradient="team1"
          className={`border-4 transition-all ${
            lastRound.offensiveTeam === 1
              ? 'border-orange-400 dark:border-orange-600 shadow-lg'
              : 'border-orange-200 dark:border-gray-700'
          }`}
        >
          <h3 className="font-bold text-lg sm:text-xl text-orange-600 dark:text-orange-400 mb-2">
            Team 1
          </h3>

          {/* Round Points - Main Focus */}
          <div className="mb-3">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">This Round</div>
            <div className="text-5xl sm:text-6xl font-black text-orange-700 dark:text-orange-300">
              {lastRound.roundScore.team1 >= 0 ? '+' : ''}
              {lastRound.roundScore.team1}
            </div>
          </div>

          {lastRound.offensiveTeam === 1 && (
            <div
              className={`text-sm sm:text-base mb-2 font-semibold ${lastRound.betMade ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
            >
              {lastRound.betMade ? '✓ Made bet!' : `✗ Missed bet`}
            </div>
          )}

          {/* Total Score - Less Prominent */}
          <div className="text-base sm:text-lg text-gray-700 dark:text-gray-300 mt-3 pt-3 border-t-2 border-orange-200 dark:border-gray-600">
            Total Score: <span className="font-bold">{gameState.teamScores.team1}</span>
          </div>
        </UICard>

        <UICard
          variant="bordered"
          gradient="team2"
          className={`border-4 transition-all ${
            lastRound.offensiveTeam === 2
              ? 'border-purple-400 dark:border-purple-600 shadow-lg'
              : 'border-purple-200 dark:border-gray-700'
          }`}
        >
          <h3 className="font-bold text-lg sm:text-xl text-purple-600 dark:text-purple-400 mb-2">
            Team 2
          </h3>

          {/* Round Points - Main Focus */}
          <div className="mb-3">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">This Round</div>
            <div className="text-5xl sm:text-6xl font-black text-purple-700 dark:text-purple-300">
              {lastRound.roundScore.team2 >= 0 ? '+' : ''}
              {lastRound.roundScore.team2}
            </div>
          </div>

          {lastRound.offensiveTeam === 2 && (
            <div
              className={`text-sm sm:text-base mb-2 font-semibold ${lastRound.betMade ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
            >
              {lastRound.betMade ? '✓ Made bet!' : `✗ Missed bet`}
            </div>
          )}

          {/* Total Score - Less Prominent */}
          <div className="text-base sm:text-lg text-gray-700 dark:text-gray-300 mt-3 pt-3 border-t-2 border-purple-200 dark:border-gray-600">
            Total Score: <span className="font-bold">{gameState.teamScores.team2}</span>
          </div>
        </UICard>
      </div>

      {/* Rewards Earned This Round (XP + Coins) */}
      {rewardsEarned && (rewardsEarned.xp.total > 0 || rewardsEarned.coins.total > 0) && (
        <section className="animate-fadeInUp delay-150" aria-label="Round rewards" role="region">
          <UICard
            variant="bordered"
            className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-2 border-emerald-300 dark:border-emerald-700"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* XP Section */}
              <div
                className="flex items-center gap-3"
                role="group"
                aria-label="Experience points earned"
              >
                <span className="text-3xl" aria-hidden="true">
                  ✨
                </span>
                <div>
                  <h4
                    className="text-sm font-semibold text-emerald-800 dark:text-emerald-300"
                    id="xp-label"
                  >
                    {XP_STRINGS.XP_EARNED}
                  </h4>
                  <div
                    className="text-2xl font-black text-emerald-600 dark:text-emerald-400"
                    aria-labelledby="xp-label"
                  >
                    +{rewardsEarned.xp.total} XP
                  </div>
                </div>
              </div>

              {/* Coins Section */}
              <div
                className="flex items-center gap-3 sm:border-l sm:border-emerald-300 dark:sm:border-emerald-700 sm:pl-4"
                role="group"
                aria-label="Coins earned"
              >
                <span className="text-3xl" aria-hidden="true">
                  🪙
                </span>
                <div>
                  <h4
                    className="text-sm font-semibold text-amber-700 dark:text-amber-400"
                    id="coins-label"
                  >
                    {XP_STRINGS.COINS_EARNED}
                  </h4>
                  <div
                    className="text-2xl font-black text-amber-600 dark:text-amber-400"
                    aria-labelledby="coins-label"
                  >
                    +{rewardsEarned.coins.total}
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              <div
                className="text-right text-xs space-y-1 border-t sm:border-t-0 sm:border-l border-emerald-300 dark:border-emerald-700 pt-3 sm:pt-0 sm:pl-4"
                aria-label="Reward breakdown"
              >
                <div className="text-emerald-700 dark:text-emerald-400">
                  {rewardsEarned.xp.breakdown.tricks > 0 && (
                    <div>
                      {rewardsEarned.tricksWon} tricks = +{rewardsEarned.xp.breakdown.tricks} XP
                    </div>
                  )}
                  {rewardsEarned.xp.breakdown.bet > 0 && (
                    <div>Bet won = +{rewardsEarned.xp.breakdown.bet} XP</div>
                  )}
                  {rewardsEarned.xp.breakdown.redZeros > 0 && (
                    <div>
                      {rewardsEarned.redZerosCollected} red 0s = +
                      {rewardsEarned.xp.breakdown.redZeros} XP
                    </div>
                  )}
                </div>
                <div className="text-amber-600 dark:text-amber-400">
                  {rewardsEarned.coins.breakdown.round > 0 && (
                    <div>Round = +{rewardsEarned.coins.breakdown.round} coins</div>
                  )}
                  {rewardsEarned.coins.breakdown.redZeros > 0 && (
                    <div>Red 0s = +{rewardsEarned.coins.breakdown.redZeros} coins</div>
                  )}
                </div>
              </div>
            </div>
          </UICard>
        </section>
      )}

      {/* Round Highlights - Only 3 stats, cycling */}
      {displayedStats.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-lg sm:text-xl text-gray-800 dark:text-gray-200 animate-fadeInUp delay-200">
            ⭐ Round Highlights
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayedStats.map((item, index) =>
              renderHighlight(item.title, item.icon, item.stat, index)
            )}
          </div>
        </div>
      )}

      {/* Trick History */}
      {lastRound.tricks && lastRound.tricks.length > 0 && (
        <div className="space-y-3 animate-fadeInUp delay-300">
          <h3 className="font-bold text-lg sm:text-xl text-gray-800 dark:text-gray-200">
            🃏 Trick History
          </h3>
          <UICard
            variant="bordered"
            className="bg-parchment-100 dark:bg-gray-800 border-2 border-amber-200 dark:border-gray-600"
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
      <div className="space-y-3 animate-fadeInUp delay-[400ms]">
        <h3 className="font-bold text-lg sm:text-xl text-gray-800 dark:text-gray-200">
          📊 Player Performance
        </h3>
        <UICard
          variant="bordered"
          className="bg-parchment-100 dark:bg-gray-800 overflow-hidden border-2 border-amber-200 dark:border-gray-600"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-amber-100 dark:bg-gray-700">
                <tr>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-center text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                    Tricks
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-center text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100 dark:divide-gray-700">
                {gameState.players.map((player) => {
                  const redZeros =
                    lastRound.playerStats?.find((ps) => ps.playerName === player.name)
                      ?.redZerosCollected || 0;
                  const brownZeros =
                    lastRound.playerStats?.find((ps) => ps.playerName === player.name)
                      ?.brownZerosReceived || 0;

                  return (
                    <tr
                      key={player.id}
                      className="hover:bg-amber-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-3 sm:px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        <div className="flex items-center gap-2">
                          <span>{player.name}</span>
                          {redZeros > 0 && (
                            <span
                              className="inline-flex items-center gap-1 text-xs"
                              title={`${redZeros} Red 0 card${redZeros > 1 ? 's' : ''} collected`}
                            >
                              <span className="w-2 h-2 rounded-full bg-red-500"></span>
                              <span className="font-bold text-green-600 dark:text-green-400">
                                ×{redZeros}
                              </span>
                            </span>
                          )}
                          {brownZeros > 0 && (
                            <span
                              className="inline-flex items-center gap-1 text-xs"
                              title={`${brownZeros} Brown 0 card${brownZeros > 1 ? 's' : ''} received`}
                            >
                              <span className="w-2 h-2 rounded-full bg-amber-800"></span>
                              <span className="font-bold text-red-600 dark:text-red-400">
                                ×{brownZeros}
                              </span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-center font-medium text-gray-800 dark:text-gray-200">
                        {player.tricksWon}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-center font-bold text-gray-900 dark:text-gray-100">
                        {player.pointsWon}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </UICard>
      </div>

      {/* Bets and Starting Hands */}
      <div className="space-y-3 animate-fadeInUp delay-500">
        <h3 className="font-bold text-lg sm:text-xl text-gray-800 dark:text-gray-200">
          🃏 Bets & Starting Hands
        </h3>
        <div className="space-y-3">
          {gameState.players.map((player) => (
            <UICard
              key={player.id}
              variant="bordered"
              className="bg-amber-50 dark:bg-gray-800 border-amber-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              {/* Player Name and Team */}
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-base text-gray-900 dark:text-gray-100">
                  {player.name}
                </span>
                <span
                  className={`px-2 py-1 rounded-md text-xs font-bold ${player.teamId === 1 ? 'bg-orange-500 text-white' : 'bg-purple-500 text-white'}`}
                >
                  Team {player.teamId}
                </span>
              </div>

              {/* Bet */}
              <div className="mb-3 text-sm">
                <span className="text-gray-600 dark:text-gray-400 font-medium">Bet: </span>
                {renderBet(player.name)}
              </div>

              {/* Starting Hand */}
              <div className="text-sm">
                <span className="text-gray-600 dark:text-gray-400 font-medium mb-1 block">
                  Starting Hand:
                </span>
                {renderHand(player.name)}
              </div>
            </UICard>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoundSummary;

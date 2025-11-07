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

interface RoundSummaryProps {
  gameState: GameState;
  onReady: () => void;
}

const RoundSummary: React.FC<RoundSummaryProps> = ({ gameState, onReady }) => {
  // ✅ CRITICAL: Check data BEFORE hooks to prevent "Rendered more hooks than during the previous render" error
  // Rules of Hooks: All early returns must happen BEFORE calling any hooks
  const lastRound = gameState.roundHistory[gameState.roundHistory.length - 1];

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

  // Show loading animation while data is being calculated
  if (!dataReady) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative">
            {/* Spinning cards animation */}
            <div className="flex gap-2 mb-4">
              <div className="w-12 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-lg animate-bounce" style={{animationDelay: '0s'}}></div>
              <div className="w-12 h-16 bg-gradient-to-br from-amber-700 to-amber-900 rounded-lg animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-12 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-lg animate-bounce" style={{animationDelay: '0.2s'}}></div>
              <div className="w-12 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg animate-bounce" style={{animationDelay: '0.3s'}}></div>
            </div>
            <p className="text-center text-lg font-semibold text-gray-700 dark:text-gray-300 animate-pulse">
              Calculating round results...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Function to calculate "interestingness" score for each stat
  const getStatScore = (title: string, stat: any): number => {
    switch (title) {
      case 'Perfect Bet':
        return 100; // Rare achievement
      case 'Team MVP':
        return stat.contribution >= 70 ? 90 : stat.contribution >= 60 ? 60 : 50;
      case 'Lucky Player':
        return stat.redZeros >= 2 ? 85 : 70; // Multiple red zeros is very lucky
      case 'Point Leader':
        return stat.pointsEarned >= 10 ? 80 : stat.pointsEarned >= 8 ? 65 : 50;
      case 'Trick Master':
        return stat.tricksWon >= 5 ? 75 : stat.tricksWon >= 4 ? 60 : 45;
      case 'Monochrome':
        return 70; // Interesting hand pattern
      case 'Lucky Sevens':
        return stat.sevensCount >= 3 ? 70 : 55; // Multiple high cards
      case 'Suited Up':
        return stat.count >= 5 ? 65 : 50; // Very suited hand
      case 'Trump Heavy':
        return stat.trumpCount >= 4 ? 60 : 45; // Strategic advantage
      case 'Rainbow':
        return 55; // Balanced hand
      case 'Trump Master':
        return stat.trumpsPlayed >= 4 ? 55 : 40; // Effective trump usage
      case 'High Roller':
        return stat.avgValue >= 5 ? 45 : 35; // High value hand
      case 'Lowball':
        return stat.avgValue <= 2 ? 45 : 35; // Low value hand
      default:
        return 30;
    }
  };

  // Collect all available stats with scores (memoized to avoid recalculation)
  const allStats = useMemo(() => {
    const stats: Array<{ title: string; icon: string; stat: any; score: number }> = [];

    if (statistics?.perfectBet) stats.push({ title: 'Perfect Bet', icon: '🎯', stat: statistics.perfectBet, score: getStatScore('Perfect Bet', statistics.perfectBet) });
    if (statistics?.teamMVP) stats.push({ title: 'Team MVP', icon: '⭐', stat: statistics.teamMVP, score: getStatScore('Team MVP', statistics.teamMVP) });
    if (statistics?.luckyPlayer) stats.push({ title: 'Lucky Player', icon: '🍀', stat: statistics.luckyPlayer, score: getStatScore('Lucky Player', statistics.luckyPlayer) });
    if (statistics?.pointLeader) stats.push({ title: 'Point Leader', icon: '💎', stat: statistics.pointLeader, score: getStatScore('Point Leader', statistics.pointLeader) });
    if (statistics?.trickMaster) stats.push({ title: 'Trick Master', icon: '🏆', stat: statistics.trickMaster, score: getStatScore('Trick Master', statistics.trickMaster) });
    if (statistics?.monochrome) stats.push({ title: 'Monochrome', icon: '🖤', stat: statistics.monochrome, score: getStatScore('Monochrome', statistics.monochrome) });
    if (statistics?.luckySevens) stats.push({ title: 'Lucky Sevens', icon: '7️⃣', stat: statistics.luckySevens, score: getStatScore('Lucky Sevens', statistics.luckySevens) });
    if (statistics?.suitedUp) stats.push({ title: 'Suited Up', icon: '♠', stat: statistics.suitedUp, score: getStatScore('Suited Up', statistics.suitedUp) });
    if (statistics?.trumpHeavy) stats.push({ title: 'Trump Heavy', icon: '🃏', stat: statistics.trumpHeavy, score: getStatScore('Trump Heavy', statistics.trumpHeavy) });
    if (statistics?.rainbow) stats.push({ title: 'Rainbow', icon: '🌈', stat: statistics.rainbow, score: getStatScore('Rainbow', statistics.rainbow) });
    if (statistics?.trumpMaster) stats.push({ title: 'Trump Master', icon: '👑', stat: statistics.trumpMaster, score: getStatScore('Trump Master', statistics.trumpMaster) });
    if (statistics?.highRoller) stats.push({ title: 'High Roller', icon: '📈', stat: statistics.highRoller, score: getStatScore('High Roller', statistics.highRoller) });
    if (statistics?.lowball) stats.push({ title: 'Lowball', icon: '📉', stat: statistics.lowball, score: getStatScore('Lowball', statistics.lowball) });

    return stats;
  }, [statistics]);

  // Sort by score (most interesting first) and take top 3 (memoized)
  const displayedStats = useMemo(() => {
    return allStats
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [allStats]);

  const renderCard = (card: Card) => {
    return (
      <CardComponent
        key={`${card.color}-${card.value}`}
        card={card}
        size="tiny"
      />
    );
  };

  const renderBet = (playerName: string) => {
    if (!statistics?.playerBets) return <span className="text-gray-500 dark:text-gray-400">--</span>;

    const bet = statistics.playerBets[playerName];
    if (bet === null) {
      return <span className="text-gray-500 dark:text-gray-400 italic">Skipped</span>;
    }
    if (bet) {
      return (
        <span className="font-semibold text-gray-800 dark:text-gray-200">
          Bet {bet.amount}
          {bet.withoutTrump && <span className="ml-1 text-purple-600 dark:text-purple-400">⚡</span>}
        </span>
      );
    }
    return <span className="text-gray-500 dark:text-gray-400">--</span>;
  };

  const renderHand = (playerName: string) => {
    if (!statistics?.initialHands) return <span className="text-gray-500 dark:text-gray-400">No hand data</span>;

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

  const renderHighlight = (title: string, icon: string, stat: any, index: number) => {
    if (!stat) return null;

    let description = '';
    if (stat.tricksWon !== undefined) description = `${stat.tricksWon} tricks`;
    else if (stat.pointsEarned !== undefined) description = `${stat.pointsEarned} points`;
    else if (stat.betAmount !== undefined) description = `Exact ${stat.betAmount}`;
    else if (stat.contribution !== undefined) description = `${stat.contribution}% of team`;
    else if (stat.trumpsPlayed !== undefined) description = `${stat.trumpsPlayed} trumps`;
    else if (stat.redZeros !== undefined) description = `${stat.redZeros} red 0${stat.redZeros > 1 ? 's' : ''}`;
    else if (stat.suit !== undefined) description = `${stat.count} ${stat.suit}`;
    else if (stat.sevensCount !== undefined) description = `${stat.sevensCount}× 7s`;
    else if (stat.avgValue !== undefined) description = `Avg: ${stat.avgValue}`;
    else if (stat.trumpCount !== undefined) description = `${stat.trumpCount} trumps`;
    else if (title === 'Monochrome') description = 'No red cards';
    else if (title === 'Rainbow') description = 'All 4 suits';

    return (
      <div
        className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-gray-700 rounded-lg border-2 border-amber-200 dark:border-gray-600 transform hover:scale-105 transition-transform animate-fadeInUp"
        style={{ animationDelay: `${index * 150}ms` }}
      >
        <span className="text-3xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wide">{title}</div>
          <div className="font-bold text-base text-gray-900 dark:text-white truncate">{stat.playerName}</div>
          <div className="text-sm text-gray-700 dark:text-gray-300">{description}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="text-center animate-fadeInDown">
        <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 mb-2">
          Round {gameState.roundNumber} Complete
        </h2>
      </div>

      
      {/* Player Ready Status */}
      <div className="space-y-3 animate-fadeInUp" style={{ animationDelay: '550ms' }}>
        <h3 className="font-bold text-lg sm:text-xl text-gray-800 dark:text-gray-200 text-center">👥 Ready Status</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-3xl mx-auto">
          {gameState.players.map((player) => {
            const isReady = gameState.playersReady?.includes(player.name) || false;
            return (
              <div
                key={player.id}
                className={`p-3 rounded-lg border-2 transition-all ${
                  isReady
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-600'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {isReady ? '✓' : '⏳'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                      {player.name}
                    </div>
                    <div className={`text-xs ${isReady ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {isReady ? 'Ready' : 'Waiting...'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Ready Button */}
      <div className="flex justify-center pt-4 animate-fadeInUp" style={{ animationDelay: '600ms' }}>
        <button
          onClick={onReady}
          className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 dark:from-blue-500 dark:to-purple-600 text-white font-bold text-lg rounded-xl hover:from-amber-600 hover:to-orange-700 dark:hover:from-blue-600 dark:hover:to-purple-700 transition-all transform hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl"
        >
          Ready for Next Round
        </button>
      </div>

      {/* Team Scores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
        <div className={`p-4 sm:p-6 rounded-xl border-4 transition-all ${
          lastRound.offensiveTeam === 1
            ? 'bg-orange-100 dark:bg-orange-900/30 border-orange-400 dark:border-orange-600 shadow-lg'
            : 'bg-orange-50 dark:bg-gray-800 border-orange-200 dark:border-gray-700'
        }`}>
          <h3 className="font-bold text-lg sm:text-xl text-orange-600 dark:text-orange-400 mb-2">Team 1</h3>

          {/* Round Points - Main Focus */}
          <div className="mb-3">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">This Round</div>
            <div className="text-5xl sm:text-6xl font-black text-orange-700 dark:text-orange-300">
              {lastRound.roundScore.team1 >= 0 ? '+' : ''}{lastRound.roundScore.team1}
            </div>
          </div>

          {lastRound.offensiveTeam === 1 && (
            <div className={`text-sm sm:text-base mb-2 font-semibold ${lastRound.betMade ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {lastRound.betMade ? '✓ Made bet!' : `✗ Missed bet`}
            </div>
          )}

          {/* Total Score - Less Prominent */}
          <div className="text-base sm:text-lg text-gray-700 dark:text-gray-300 mt-3 pt-3 border-t-2 border-orange-200 dark:border-gray-600">
            Total Score: <span className="font-bold">{gameState.teamScores.team1}</span>
          </div>
        </div>

        <div className={`p-4 sm:p-6 rounded-xl border-4 transition-all ${
          lastRound.offensiveTeam === 2
            ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-400 dark:border-purple-600 shadow-lg'
            : 'bg-purple-50 dark:bg-gray-800 border-purple-200 dark:border-gray-700'
        }`}>
          <h3 className="font-bold text-lg sm:text-xl text-purple-600 dark:text-purple-400 mb-2">Team 2</h3>

          {/* Round Points - Main Focus */}
          <div className="mb-3">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">This Round</div>
            <div className="text-5xl sm:text-6xl font-black text-purple-700 dark:text-purple-300">
              {lastRound.roundScore.team2 >= 0 ? '+' : ''}{lastRound.roundScore.team2}
            </div>
          </div>

          {lastRound.offensiveTeam === 2 && (
            <div className={`text-sm sm:text-base mb-2 font-semibold ${lastRound.betMade ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {lastRound.betMade ? '✓ Made bet!' : `✗ Missed bet`}
            </div>
          )}

          {/* Total Score - Less Prominent */}
          <div className="text-base sm:text-lg text-gray-700 dark:text-gray-300 mt-3 pt-3 border-t-2 border-purple-200 dark:border-gray-600">
            Total Score: <span className="font-bold">{gameState.teamScores.team2}</span>
          </div>
        </div>
      </div>

      {/* Round Highlights - Only 3 stats, cycling */}
      {displayedStats.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-lg sm:text-xl text-gray-800 dark:text-gray-200 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
            ⭐ Round Highlights
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayedStats.map((item, index) => renderHighlight(item.title, item.icon, item.stat, index))}
          </div>
        </div>
      )}

      {/* Trick History */}
      {lastRound.tricks && lastRound.tricks.length > 0 && (
        <div className="space-y-3 animate-fadeInUp" style={{ animationDelay: '300ms' }}>
          <h3 className="font-bold text-lg sm:text-xl text-gray-800 dark:text-gray-200">🃏 Trick History</h3>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-amber-200 dark:border-gray-600 shadow-lg">
            <TrickHistory
              tricks={lastRound.tricks}
              players={gameState.players}
              trump={lastRound.trump}
              compact={true}
              showWinner={true}
            />
          </div>
        </div>
      )}

      {/* Detailed Player Statistics */}
      <div className="space-y-3 animate-fadeInUp" style={{ animationDelay: '400ms' }}>
        <h3 className="font-bold text-lg sm:text-xl text-gray-800 dark:text-gray-200">📊 Player Performance</h3>
        <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border-2 border-amber-200 dark:border-gray-600 shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-amber-100 dark:bg-gray-700">
                <tr>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">Player</th>
                  <th className="px-3 sm:px-4 py-3 text-center text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">Team</th>
                  <th className="px-3 sm:px-4 py-3 text-center text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">Tricks</th>
                  <th className="px-3 sm:px-4 py-3 text-center text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100 dark:divide-gray-700">
                {gameState.players.map((player) => {
                  const redZeros = lastRound.playerStats?.find(ps => ps.playerName === player.name)?.redZerosCollected || 0;
                  const brownZeros = lastRound.playerStats?.find(ps => ps.playerName === player.name)?.brownZerosReceived || 0;

                  return (
                    <tr key={player.id} className="hover:bg-amber-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-3 sm:px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        <div className="flex items-center gap-2">
                          <span>{player.name}</span>
                          {redZeros > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs" title={`${redZeros} Red 0 card${redZeros > 1 ? 's' : ''} collected`}>
                              <span className="w-2 h-2 rounded-full bg-red-500"></span>
                              <span className="font-bold text-green-600 dark:text-green-400">×{redZeros}</span>
                            </span>
                          )}
                          {brownZeros > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs" title={`${brownZeros} Brown 0 card${brownZeros > 1 ? 's' : ''} received`}>
                              <span className="w-2 h-2 rounded-full bg-amber-800"></span>
                              <span className="font-bold text-red-600 dark:text-red-400">×{brownZeros}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-center">
                        <span className={`font-bold ${player.teamId === 1 ? 'text-orange-600 dark:text-orange-400' : 'text-purple-600 dark:text-purple-400'}`}>
                          {player.teamId}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-center font-medium text-gray-800 dark:text-gray-200">{player.tricksWon}</td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-center font-bold text-gray-900 dark:text-gray-100">{player.pointsWon}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bets and Starting Hands */}
      <div className="space-y-3 animate-fadeInUp" style={{ animationDelay: '500ms' }}>
        <h3 className="font-bold text-lg sm:text-xl text-gray-800 dark:text-gray-200">🃏 Bets & Starting Hands</h3>
        <div className="space-y-3">
          {gameState.players.map((player) => (
            <div
              key={player.id}
              className="p-3 sm:p-4 bg-amber-50 dark:bg-gray-800 rounded-lg border border-amber-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              {/* Player Name and Team */}
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-base text-gray-900 dark:text-gray-100">{player.name}</span>
                <span className={`px-2 py-1 rounded-md text-xs font-bold ${player.teamId === 1 ? 'bg-orange-500 text-white' : 'bg-purple-500 text-white'}`}>
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
                <span className="text-gray-600 dark:text-gray-400 font-medium mb-1 block">Starting Hand:</span>
                {renderHand(player.name)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoundSummary;

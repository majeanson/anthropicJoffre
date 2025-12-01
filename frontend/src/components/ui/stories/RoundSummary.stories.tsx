/**
 * RoundSummary Component Stories
 *
 * Comprehensive round-end statistics display.
 * Note: This is a complex component with gameState dependency - stories show static layouts.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { UICard, Button, TeamIndicator } from '..';
import type { Card, CardColor } from '../../../types/game';

const meta = {
  title: 'Game/RoundSummary',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# RoundSummary Component

Comprehensive display of round-end statistics and results.

## Features
- **Team Scores**: Large score display with round and cumulative totals
- **Bet Result**: Shows if betting team made their bet
- **Round Highlights**: Top 3 interesting stats from the round
- **Trick History**: Visual replay of all tricks played
- **Player Performance**: Table with tricks won, points, special cards
- **Starting Hands**: Shows each player's initial hand
- **Ready Status**: Track which players are ready for next round
- **Ready Button**: Press to proceed to next round

## Statistics Types
### Performance-Based
- Trick Master (most tricks)
- Point Leader (most points)
- Perfect Bet (exact points)
- Team MVP (highest contribution)
- Trump Master (most trumps played)
- Lucky Player (red zeros collected)

### Hand-Based
- Monochrome (no red cards)
- Suited Up (5+ of one suit)
- Lucky Sevens (multiple 7s)
- Rainbow (all 4 suits)
- High Roller / Lowball (high/low average)
- Trump Heavy (many trump cards)

## Integration
Requires full gameState with roundHistory.
Uses keyboard Enter to mark ready.
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// MOCK DATA
// =============================================================================

const createCard = (color: CardColor, value: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7): Card => ({
  color,
  value,
});

const mockHand = [
  createCard('red', 7),
  createCard('red', 5),
  createCard('blue', 6),
  createCard('blue', 3),
  createCard('green', 4),
  createCard('green', 2),
  createCard('brown', 1),
  createCard('brown', 0),
];

// =============================================================================
// TEAM SCORES SECTION
// =============================================================================

export const TeamScoresSection: Story = {
  name: 'Team Scores Display',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[700px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold text-center mb-6 text-2xl">
        Round 3 Complete
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Team 1 - Offensive (Made Bet) */}
        <UICard
          variant="bordered"
          gradient="team1"
          className="border-4 border-orange-400 shadow-lg"
        >
          <h3 className="font-bold text-xl text-orange-600 dark:text-orange-400 mb-2">Team 1</h3>

          <div className="mb-3">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">This Round</div>
            <div className="text-6xl font-black text-orange-700 dark:text-orange-300">
              +9
            </div>
          </div>

          <div className="text-base font-semibold text-green-600 dark:text-green-400 mb-2">
            ✓ Made bet!
          </div>

          <div className="text-lg text-gray-700 dark:text-gray-300 pt-3 border-t-2 border-orange-200 dark:border-gray-600">
            Total Score: <span className="font-bold">24</span>
          </div>
        </UICard>

        {/* Team 2 - Defensive */}
        <UICard
          variant="bordered"
          gradient="team2"
          className="border-4 border-purple-200 dark:border-gray-700"
        >
          <h3 className="font-bold text-xl text-purple-600 dark:text-purple-400 mb-2">Team 2</h3>

          <div className="mb-3">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">This Round</div>
            <div className="text-6xl font-black text-purple-700 dark:text-purple-300">
              -7
            </div>
          </div>

          <div className="text-lg text-gray-700 dark:text-gray-300 pt-3 mt-8 border-t-2 border-purple-200 dark:border-gray-600">
            Total Score: <span className="font-bold">15</span>
          </div>
        </UICard>
      </div>
    </div>
  ),
};

// =============================================================================
// BET RESULTS
// =============================================================================

export const BetResults: Story = {
  name: 'Bet Made vs Missed',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[600px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Bet Outcomes</h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Made Bet */}
        <UICard variant="bordered" gradient="team1" className="border-4 border-orange-400">
          <h4 className="font-bold text-lg text-orange-600 mb-2">Team 1</h4>
          <div className="text-5xl font-black text-orange-700 mb-3">+10</div>
          <div className="text-base font-semibold text-green-600">
            ✓ Made bet!
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Bet 8, earned 10 points
          </p>
        </UICard>

        {/* Missed Bet */}
        <UICard variant="bordered" gradient="team2" className="border-4 border-purple-400">
          <h4 className="font-bold text-lg text-purple-600 mb-2">Team 2</h4>
          <div className="text-5xl font-black text-purple-700 mb-3">-8</div>
          <div className="text-base font-semibold text-red-600">
            ✗ Missed bet
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Bet 9, only earned 6 points
          </p>
        </UICard>
      </div>
    </div>
  ),
};

// =============================================================================
// ROUND HIGHLIGHTS
// =============================================================================

export const RoundHighlights: Story = {
  name: 'Round Highlights (Stats)',
  render: () => {
    const highlights = [
      { title: 'Perfect Bet', icon: '🎯', player: 'Alice', description: 'Exact 9' },
      { title: 'Team MVP', icon: '⭐', player: 'Bob', description: '70% of team' },
      { title: 'Lucky Player', icon: '🍀', player: 'Charlie', description: '2 red 0s' },
    ];

    return (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[700px]">
        <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">⭐ Round Highlights</h3>

        <div className="grid grid-cols-3 gap-3">
          {highlights.map((h, i) => (
            <UICard
              key={i}
              variant="bordered"
              className="flex items-center gap-3 bg-amber-50 dark:bg-gray-700 border-2 border-amber-200 dark:border-gray-600 hover:scale-105 transition-transform"
            >
              <span className="text-3xl">{h.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                  {h.title}
                </div>
                <div className="font-bold text-base text-gray-900 dark:text-white truncate">
                  {h.player}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {h.description}
                </div>
              </div>
            </UICard>
          ))}
        </div>
      </div>
    );
  },
};

// =============================================================================
// ALL STAT TYPES
// =============================================================================

export const AllStatTypes: Story = {
  name: 'All Stat Types',
  render: () => {
    const performanceStats = [
      { title: 'Trick Master', icon: '🏆', description: '5 tricks' },
      { title: 'Point Leader', icon: '💎', description: '10 points' },
      { title: 'Perfect Bet', icon: '🎯', description: 'Exact 9' },
      { title: 'Team MVP', icon: '⭐', description: '70% of team' },
      { title: 'Trump Master', icon: '👑', description: '4 trumps' },
      { title: 'Lucky Player', icon: '🍀', description: '2 red 0s' },
    ];

    const handStats = [
      { title: 'Monochrome', icon: '🖤', description: 'No red cards' },
      { title: 'Suited Up', icon: '♠', description: '5 blue' },
      { title: 'Lucky Sevens', icon: '7️⃣', description: '3× 7s' },
      { title: 'Rainbow', icon: '🌈', description: 'All 4 suits' },
      { title: 'High Roller', icon: '📈', description: 'Avg: 5.5' },
      { title: 'Lowball', icon: '📉', description: 'Avg: 2.1' },
      { title: 'Trump Heavy', icon: '🃏', description: '4 trumps' },
    ];

    return (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[700px]">
        <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Performance Stats</h3>
        <div className="grid grid-cols-3 gap-2 mb-6">
          {performanceStats.map((s, i) => (
            <div key={i} className="p-3 rounded-lg bg-[var(--color-bg-secondary)] flex items-center gap-2">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <div className="text-xs font-medium text-[var(--color-text-secondary)]">{s.title}</div>
                <div className="text-sm font-bold text-[var(--color-text-primary)]">{s.description}</div>
              </div>
            </div>
          ))}
        </div>

        <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Hand-Based Stats</h3>
        <div className="grid grid-cols-3 gap-2">
          {handStats.map((s, i) => (
            <div key={i} className="p-3 rounded-lg bg-[var(--color-bg-secondary)] flex items-center gap-2">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <div className="text-xs font-medium text-[var(--color-text-secondary)]">{s.title}</div>
                <div className="text-sm font-bold text-[var(--color-text-primary)]">{s.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

// =============================================================================
// PLAYER PERFORMANCE TABLE
// =============================================================================

export const PlayerPerformanceTable: Story = {
  name: 'Player Performance Table',
  render: () => {
    const players = [
      { name: 'Alice', teamId: 1, tricks: 3, points: 8, redZeros: 1, brownZeros: 0 },
      { name: 'Bob', teamId: 2, tricks: 2, points: 4, redZeros: 0, brownZeros: 0 },
      { name: 'Charlie', teamId: 1, tricks: 2, points: 2, redZeros: 0, brownZeros: 1 },
      { name: 'Diana', teamId: 2, tricks: 1, points: 2, redZeros: 0, brownZeros: 0 },
    ];

    return (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[600px]">
        <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">📊 Player Performance</h3>

        <UICard variant="bordered" className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-amber-100 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-amber-900 dark:text-amber-300 uppercase">Player</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-amber-900 dark:text-amber-300 uppercase">Tricks</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-amber-900 dark:text-amber-300 uppercase">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100 dark:divide-gray-700">
              {players.map((p) => (
                <tr key={p.name} className="hover:bg-amber-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    <div className="flex items-center gap-2">
                      <TeamIndicator teamId={p.teamId as 1 | 2} size="sm" />
                      <span>{p.name}</span>
                      {p.redZeros > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs" title="Red 0 collected">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          <span className="font-bold text-green-600">×{p.redZeros}</span>
                        </span>
                      )}
                      {p.brownZeros > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs" title="Brown 0 received">
                          <span className="w-2 h-2 rounded-full bg-amber-800"></span>
                          <span className="font-bold text-red-600">×{p.brownZeros}</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-center font-medium text-gray-800 dark:text-gray-200">{p.tricks}</td>
                  <td className="px-4 py-3 text-sm text-center font-bold text-gray-900 dark:text-gray-100">{p.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </UICard>
      </div>
    );
  },
};

// =============================================================================
// READY STATUS
// =============================================================================

export const ReadyStatus: Story = {
  name: 'Ready Status Display',
  render: () => {
    const players = [
      { name: 'Alice', teamId: 1, isReady: true },
      { name: 'Bob', teamId: 2, isReady: true },
      { name: 'Charlie', teamId: 1, isReady: false },
      { name: 'Diana', teamId: 2, isReady: false },
    ];

    return (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[500px]">
        <h3 className="text-[var(--color-text-primary)] font-semibold mb-4 text-center">👥 Ready Status</h3>

        <div className="grid grid-cols-4 gap-2 mb-6">
          {players.map((p) => (
            <UICard
              key={p.name}
              variant="bordered"
              size="sm"
              className={`transition-all ${
                p.isReady
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-400'
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{p.isReady ? '✓' : '⏳'}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                    {p.name}
                  </div>
                  <div className={`text-xs ${p.isReady ? 'text-green-600' : 'text-gray-500'}`}>
                    {p.isReady ? 'Ready' : 'Waiting...'}
                  </div>
                </div>
              </div>
            </UICard>
          ))}
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full text-lg"
        >
          Ready for Next Round
        </Button>
      </div>
    );
  },
};

// =============================================================================
// LOADING STATE
// =============================================================================

export const LoadingState: Story = {
  name: 'Loading State',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[400px]">
      <div className="flex flex-col items-center justify-center py-16">
        <div className="flex gap-2 mb-4">
          <div className="w-12 h-16 rounded-lg animate-bounce bg-gradient-to-br from-red-500 to-red-700" style={{animationDelay: '0s'}}></div>
          <div className="w-12 h-16 rounded-lg animate-bounce bg-gradient-to-br from-yellow-500 to-yellow-700" style={{animationDelay: '0.1s'}}></div>
          <div className="w-12 h-16 rounded-lg animate-bounce bg-gradient-to-br from-green-500 to-green-700" style={{animationDelay: '0.2s'}}></div>
          <div className="w-12 h-16 rounded-lg animate-bounce bg-gradient-to-br from-purple-500 to-purple-700" style={{animationDelay: '0.3s'}}></div>
        </div>
        <p className="text-center text-lg font-semibold text-gray-700 dark:text-gray-300 animate-pulse">
          Calculating round results...
        </p>
      </div>
    </div>
  ),
};

// =============================================================================
// FULL LAYOUT
// =============================================================================

export const FullLayout: Story = {
  name: 'Full Round Summary Layout',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[800px] max-h-[600px] overflow-y-auto">
      {/* Header */}
      <h2 className="text-3xl font-black text-center mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
        Round 3 Complete
      </h2>

      {/* Team Scores */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <UICard variant="bordered" gradient="team1" className="border-4 border-orange-400">
          <h3 className="font-bold text-xl text-orange-600 mb-2">Team 1</h3>
          <div className="text-5xl font-black text-orange-700">+9</div>
          <div className="text-green-600 font-semibold mt-2">✓ Made bet!</div>
          <div className="text-gray-600 mt-3 pt-3 border-t border-orange-200">Total: 24</div>
        </UICard>
        <UICard variant="bordered" gradient="team2" className="border-4 border-purple-200">
          <h3 className="font-bold text-xl text-purple-600 mb-2">Team 2</h3>
          <div className="text-5xl font-black text-purple-700">-7</div>
          <div className="text-gray-600 mt-9 pt-3 border-t border-purple-200">Total: 15</div>
        </UICard>
      </div>

      {/* Highlights */}
      <h3 className="font-bold text-lg mb-3">⭐ Round Highlights</h3>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: '🎯', title: 'Perfect Bet', player: 'Alice', desc: 'Exact 9' },
          { icon: '⭐', title: 'Team MVP', player: 'Bob', desc: '70% of team' },
          { icon: '🍀', title: 'Lucky Player', player: 'Charlie', desc: '2 red 0s' },
        ].map((h, i) => (
          <UICard key={i} variant="bordered" className="flex items-center gap-3 bg-amber-50 dark:bg-gray-700 border-amber-200">
            <span className="text-3xl">{h.icon}</span>
            <div>
              <div className="text-xs font-medium text-amber-700">{h.title}</div>
              <div className="font-bold">{h.player}</div>
              <div className="text-sm text-gray-600">{h.desc}</div>
            </div>
          </UICard>
        ))}
      </div>

      {/* Ready Button */}
      <div className="text-center">
        <Button variant="primary" size="lg" className="px-8">
          Ready for Next Round
        </Button>
      </div>
    </div>
  ),
};

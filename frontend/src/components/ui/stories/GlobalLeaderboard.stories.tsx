/**
 * GlobalLeaderboard Component Stories
 *
 * Modal displaying top players ranked by ELO with tier badges.
 * Note: This component requires Socket.io - stories show static UI states.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Modal, Button, UICard, EmptyState } from '..';
import { TableSkeleton } from '../Skeleton';

const meta = {
  title: 'Social/GlobalLeaderboard',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# GlobalLeaderboard Component

A modal displaying top players ranked by ELO rating with tier badges.

## Features
- **Top 100 Players**: Shows ranking, name, ELO, games, win rate
- **Tier Badges**: Bronze, Silver, Gold, Platinum, Diamond
- **Rank Medals**: Special medals for top 3 positions
- **Dual View**: Toggle between Game Stats and Round Stats
- **Clickable Rows**: Click to view detailed player stats
- **Tier Distribution**: Footer showing tier counts
- **Loading State**: Skeleton while fetching data

## Stats Displayed
### Game Stats View
- ELO Rating (current + peak)
- Games Played
- Win Percentage
- Ranking Tier

### Round Stats View
- Total Rounds Played
- Round Win Percentage
- Average Tricks per Round
- Bet Success Rate

## Use Cases
- Competitive ranking display
- Player discovery
- Personal rank checking
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

interface MockPlayer {
  rank: number;
  name: string;
  elo: number;
  peak: number;
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  rounds: number;
  roundWinRate: number;
  avgTricks: number;
  betSuccess: number;
}

const mockPlayers: MockPlayer[] = [
  {
    rank: 1,
    name: 'ProPlayer',
    elo: 2150,
    peak: 2200,
    games: 500,
    wins: 350,
    losses: 150,
    winRate: 70,
    tier: 'Diamond',
    rounds: 2500,
    roundWinRate: 65,
    avgTricks: 2.3,
    betSuccess: 72,
  },
  {
    rank: 2,
    name: 'Champion123',
    elo: 2050,
    peak: 2100,
    games: 420,
    wins: 280,
    losses: 140,
    winRate: 67,
    tier: 'Diamond',
    rounds: 2100,
    roundWinRate: 62,
    avgTricks: 2.2,
    betSuccess: 68,
  },
  {
    rank: 3,
    name: 'CardMaster',
    elo: 1980,
    peak: 2020,
    games: 380,
    wins: 240,
    losses: 140,
    winRate: 63,
    tier: 'Platinum',
    rounds: 1900,
    roundWinRate: 60,
    avgTricks: 2.1,
    betSuccess: 65,
  },
  {
    rank: 4,
    name: 'TrumpKing',
    elo: 1920,
    peak: 1950,
    games: 300,
    wins: 180,
    losses: 120,
    winRate: 60,
    tier: 'Platinum',
    rounds: 1500,
    roundWinRate: 58,
    avgTricks: 2.0,
    betSuccess: 62,
  },
  {
    rank: 5,
    name: 'BetWinner',
    elo: 1850,
    peak: 1900,
    games: 250,
    wins: 145,
    losses: 105,
    winRate: 58,
    tier: 'Gold',
    rounds: 1250,
    roundWinRate: 55,
    avgTricks: 1.9,
    betSuccess: 60,
  },
  {
    rank: 6,
    name: 'LuckyAces',
    elo: 1780,
    peak: 1820,
    games: 220,
    wins: 125,
    losses: 95,
    winRate: 57,
    tier: 'Gold',
    rounds: 1100,
    roundWinRate: 53,
    avgTricks: 1.8,
    betSuccess: 58,
  },
  {
    rank: 7,
    name: 'TrickTaker',
    elo: 1650,
    peak: 1700,
    games: 180,
    wins: 95,
    losses: 85,
    winRate: 53,
    tier: 'Silver',
    rounds: 900,
    roundWinRate: 50,
    avgTricks: 1.7,
    betSuccess: 55,
  },
  {
    rank: 8,
    name: 'CardShark',
    elo: 1580,
    peak: 1620,
    games: 150,
    wins: 78,
    losses: 72,
    winRate: 52,
    tier: 'Silver',
    rounds: 750,
    roundWinRate: 48,
    avgTricks: 1.6,
    betSuccess: 52,
  },
  {
    rank: 9,
    name: 'NewPlayer',
    elo: 1450,
    peak: 1480,
    games: 80,
    wins: 40,
    losses: 40,
    winRate: 50,
    tier: 'Bronze',
    rounds: 400,
    roundWinRate: 45,
    avgTricks: 1.5,
    betSuccess: 48,
  },
  {
    rank: 10,
    name: 'Beginner',
    elo: 1350,
    peak: 1380,
    games: 40,
    wins: 18,
    losses: 22,
    winRate: 45,
    tier: 'Bronze',
    rounds: 200,
    roundWinRate: 42,
    avgTricks: 1.4,
    betSuccess: 45,
  },
];

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'Diamond':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200';
    case 'Platinum':
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200';
    case 'Gold':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200';
    case 'Silver':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200';
    case 'Bronze':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

const getTierIcon = (tier: string) => {
  switch (tier) {
    case 'Diamond':
      return '💎';
    case 'Platinum':
      return '🏆';
    case 'Gold':
      return '🥇';
    case 'Silver':
      return '🥈';
    case 'Bronze':
      return '🥉';
    default:
      return '';
  }
};

const getRankMedal = (rank: number) => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
};

// =============================================================================
// FULL LEADERBOARD
// =============================================================================

export const FullLeaderboard: Story = {
  name: 'Full Leaderboard (Game Stats)',
  render: () => (
    <div className="w-[900px]">
      <Modal
        isOpen={true}
        onClose={() => {}}
        title="Global Leaderboard"
        subtitle="Top 10 Players"
        icon="🏆"
        theme="purple"
        size="xl"
      >
        <div className="space-y-4">
          {/* Toggle Button */}
          <div className="flex justify-center">
            <Button variant="primary">📊 Show Round Stats</Button>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-7 gap-4 px-4 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg font-bold text-sm text-gray-700 dark:text-gray-300">
            <div className="col-span-1">Rank</div>
            <div className="col-span-2">Player</div>
            <div className="col-span-1 text-center">ELO</div>
            <div className="col-span-1 text-center">Games</div>
            <div className="col-span-1 text-center">Win Rate</div>
            <div className="col-span-1 text-center">Tier</div>
          </div>

          {/* Player Rows */}
          {mockPlayers.map((player) => (
            <div
              key={player.rank}
              className={`grid grid-cols-7 gap-4 p-4 rounded-lg transition-all cursor-pointer hover:scale-[1.02] ${
                player.rank <= 3
                  ? 'bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/40 border-2 border-yellow-400 dark:border-yellow-600'
                  : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-600'
              }`}
            >
              <div className="col-span-1 flex items-center">
                <span className="text-2xl font-bold text-gray-800 dark:text-gray-300">
                  {getRankMedal(player.rank)}
                </span>
              </div>

              <div className="col-span-2 flex flex-col justify-center">
                <p className="font-bold text-lg text-gray-900 dark:text-gray-100">{player.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {player.wins}W - {player.losses}L
                </p>
              </div>

              <div className="col-span-1 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                  {player.elo}
                </p>
                <p className="text-xs text-gray-500">Peak: {player.peak}</p>
              </div>

              <div className="col-span-1 flex items-center justify-center">
                <p className="text-xl font-bold text-gray-700 dark:text-gray-300">{player.games}</p>
              </div>

              <div className="col-span-1 flex items-center justify-center">
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {player.winRate}%
                </p>
              </div>

              <div className="col-span-1 flex items-center justify-center">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-bold ${getTierColor(player.tier)}`}
                >
                  {getTierIcon(player.tier)} {player.tier}
                </span>
              </div>
            </div>
          ))}

          {/* Footer */}
          <UICard variant="bordered" size="md" className="mt-4">
            <div className="flex flex-wrap gap-4 justify-center text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span>💎 Diamond:</span>
                <span className="font-bold">2</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🏆 Platinum:</span>
                <span className="font-bold">2</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🥇 Gold:</span>
                <span className="font-bold">2</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🥈 Silver:</span>
                <span className="font-bold">2</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🥉 Bronze:</span>
                <span className="font-bold">2</span>
              </div>
            </div>
            <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
              Click on a player to view detailed statistics
            </p>
          </UICard>
        </div>
      </Modal>
    </div>
  ),
};

// =============================================================================
// ROUND STATS VIEW
// =============================================================================

export const RoundStatsView: Story = {
  name: 'Round Stats View',
  render: () => (
    <div className="w-[900px]">
      <Modal
        isOpen={true}
        onClose={() => {}}
        title="Global Leaderboard"
        subtitle="Top 10 Players"
        icon="🏆"
        theme="purple"
        size="xl"
      >
        <div className="space-y-4">
          {/* Toggle Button */}
          <div className="flex justify-center">
            <Button variant="primary">🏆 Show Game Stats</Button>
          </div>

          {/* Table Header - Round Stats */}
          <div className="grid grid-cols-7 gap-4 px-4 py-3 bg-blue-200 dark:bg-blue-900/60 rounded-lg font-bold text-sm text-blue-900 dark:text-blue-200">
            <div className="col-span-1">Rank</div>
            <div className="col-span-2">Player</div>
            <div className="col-span-1 text-center">Rounds</div>
            <div className="col-span-1 text-center">Round Win%</div>
            <div className="col-span-1 text-center">Avg Tricks</div>
            <div className="col-span-1 text-center">Bet Success</div>
          </div>

          {/* Player Rows - Round Stats */}
          {mockPlayers.slice(0, 5).map((player) => (
            <div
              key={player.rank}
              className={`grid grid-cols-7 gap-4 p-4 rounded-lg transition-all cursor-pointer hover:scale-[1.02] ${
                player.rank <= 3
                  ? 'bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/40 border-2 border-yellow-400'
                  : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600'
              }`}
            >
              <div className="col-span-1 flex items-center">
                <span className="text-2xl font-bold">{getRankMedal(player.rank)}</span>
              </div>

              <div className="col-span-2 flex flex-col justify-center">
                <p className="font-bold text-lg text-gray-900 dark:text-gray-100">{player.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {Math.round((player.rounds * player.roundWinRate) / 100)}W -{' '}
                  {Math.round((player.rounds * (100 - player.roundWinRate)) / 100)}L
                </p>
              </div>

              <div className="col-span-1 flex items-center justify-center">
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {player.rounds}
                </p>
              </div>

              <div className="col-span-1 flex items-center justify-center">
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {player.roundWinRate}%
                </p>
              </div>

              <div className="col-span-1 flex items-center justify-center">
                <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                  {player.avgTricks}
                </p>
              </div>

              <div className="col-span-1 flex items-center justify-center">
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {player.betSuccess}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  ),
};

// =============================================================================
// TOP 3 HIGHLIGHT
// =============================================================================

export const TopThreeHighlight: Story = {
  name: 'Top 3 Highlight',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[600px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Top 3 Players</h3>
      <p className="text-[var(--color-text-secondary)] text-sm mb-4">
        Special golden highlight for top 3 positions
      </p>

      <div className="space-y-3">
        {mockPlayers.slice(0, 3).map((player) => (
          <div
            key={player.rank}
            className="grid grid-cols-7 gap-4 p-4 rounded-lg bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/40 border-2 border-yellow-400 dark:border-yellow-600"
          >
            <div className="col-span-1 flex items-center">
              <span className="text-3xl">{getRankMedal(player.rank)}</span>
            </div>
            <div className="col-span-2">
              <p className="font-bold text-lg text-gray-900 dark:text-gray-100">{player.name}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {player.wins}W - {player.losses}L
              </p>
            </div>
            <div className="col-span-1 text-center">
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                {player.elo}
              </p>
            </div>
            <div className="col-span-1 text-center">
              <p className="text-xl font-bold text-gray-700 dark:text-gray-300">{player.games}</p>
            </div>
            <div className="col-span-1 text-center">
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {player.winRate}%
              </p>
            </div>
            <div className="col-span-1 flex items-center justify-center">
              <span
                className={`px-3 py-1 rounded-full text-sm font-bold ${getTierColor(player.tier)}`}
              >
                {getTierIcon(player.tier)} {player.tier}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};

// =============================================================================
// TIER BADGES
// =============================================================================

export const TierBadges: Story = {
  name: 'Tier Badges',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[400px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Ranking Tiers</h3>

      <div className="space-y-3">
        {(['Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze'] as const).map((tier) => (
          <div
            key={tier}
            className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-secondary)]"
          >
            <span className={`px-4 py-2 rounded-full text-sm font-bold ${getTierColor(tier)}`}>
              {getTierIcon(tier)} {tier}
            </span>
            <span className="text-[var(--color-text-secondary)] text-sm">
              {tier === 'Diamond' && 'ELO 2000+'}
              {tier === 'Platinum' && 'ELO 1800-1999'}
              {tier === 'Gold' && 'ELO 1600-1799'}
              {tier === 'Silver' && 'ELO 1400-1599'}
              {tier === 'Bronze' && 'ELO < 1400'}
            </span>
          </div>
        ))}
      </div>
    </div>
  ),
};

// =============================================================================
// LOADING STATE
// =============================================================================

export const LoadingState: Story = {
  name: 'Loading State',
  render: () => (
    <div className="w-[900px]">
      <Modal
        isOpen={true}
        onClose={() => {}}
        title="Global Leaderboard"
        subtitle="Loading..."
        icon="🏆"
        theme="purple"
        size="xl"
      >
        <div className="space-y-4">
          <TableSkeleton rows={10} columns={7} showHeader={true} />
        </div>
      </Modal>
    </div>
  ),
};

// =============================================================================
// EMPTY STATE
// =============================================================================

export const EmptyLeaderboard: Story = {
  name: 'Empty State',
  render: () => (
    <div className="w-[900px]">
      <Modal
        isOpen={true}
        onClose={() => {}}
        title="Global Leaderboard"
        subtitle="Top Players"
        icon="🏆"
        theme="purple"
        size="xl"
      >
        <EmptyState
          icon="🎮"
          title="No players yet!"
          description="Be the first to play and claim the top spot!"
          card
        />
      </Modal>
    </div>
  ),
};

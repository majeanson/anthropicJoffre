/**
 * BettingHistory Component Stories
 *
 * Visual timeline of betting phase showing all bets in order.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { BettingHistory } from '../../BettingHistory';
import type { Player, Bet } from '../../../types/game';

// Mock player data
const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 'player-1',
  name: 'Player1',
  teamId: 1,
  hand: [],
  tricksWon: 0,
  pointsWon: 0,
  isBot: false,
  ...overrides,
});

const mockPlayers: Player[] = [
  createMockPlayer({ id: 'p1', name: 'Alice', teamId: 1 }),
  createMockPlayer({ id: 'p2', name: 'Bob', teamId: 2 }),
  createMockPlayer({ id: 'p3', name: 'Charlie', teamId: 1 }),
  createMockPlayer({ id: 'p4', name: 'Diana', teamId: 2 }),
];

// Helper to create bets
const createBet = (
  playerName: string,
  amount: number,
  withoutTrump: boolean = false,
  skipped: boolean = false
): Bet => ({
  playerId: `p-${playerName}`,
  playerName,
  amount: skipped ? -1 : amount,
  withoutTrump,
  skipped,
});

const meta = {
  title: 'Game/BettingHistory',
  component: BettingHistory,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# BettingHistory Component

Displays the betting timeline for the current round with visual indicators.

## Features
- **Betting Order**: Shows players in correct betting order (after dealer first)
- **Dealer Indicator**: Badge marking the dealer
- **Team Colors**: Left border colored by team (orange/purple)
- **Highest Bet**: Green gradient highlight for current highest bid
- **Without Trump**: x2 badge for double-points bets
- **Skip Indicator**: Gray "SKIP" badge for skipped bets
- **Waiting State**: Dashed border for players who haven't bet yet
- **Clickable Names**: Human player names open profile (bots not clickable)

## Bet Hierarchy
1. Higher amount beats lower amount
2. Same amount + without trump beats same amount with trump
3. Dealer bets last and can match or raise

## Use Cases
- Betting phase sidebar
- Round summary
- Game history display
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    players: { control: 'object', description: 'Array of players' },
    currentBets: { control: 'object', description: 'Array of bets placed' },
    dealerIndex: { control: { type: 'range', min: 0, max: 3 }, description: 'Index of dealer' },
    onClickPlayer: { action: 'player clicked', description: 'Called when player name clicked' },
  },
} satisfies Meta<typeof BettingHistory>;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// BETTING STATES
// =============================================================================

export const AllBettingStates: Story = {
  name: 'All Betting States',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] space-y-6">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Betting Progress States</h3>

      <div className="grid grid-cols-2 gap-6">
        {/* Start of betting */}
        <div className="w-[280px]">
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">Start (No Bets)</p>
          <BettingHistory
            players={mockPlayers}
            currentBets={[]}
            dealerIndex={0}
            onClickPlayer={() => {}}
          />
        </div>

        {/* Mid-betting */}
        <div className="w-[280px]">
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">Mid-Betting (2 bets)</p>
          <BettingHistory
            players={mockPlayers}
            currentBets={[
              createBet('Bob', 8),
              createBet('Charlie', 9),
            ]}
            dealerIndex={0}
            onClickPlayer={() => {}}
          />
        </div>

        {/* With skip */}
        <div className="w-[280px]">
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">With Skip</p>
          <BettingHistory
            players={mockPlayers}
            currentBets={[
              createBet('Bob', 0, false, true),
              createBet('Charlie', 8),
            ]}
            dealerIndex={0}
            onClickPlayer={() => {}}
          />
        </div>

        {/* All done */}
        <div className="w-[280px]">
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">All Bets Placed</p>
          <BettingHistory
            players={mockPlayers}
            currentBets={[
              createBet('Bob', 8),
              createBet('Charlie', 9),
              createBet('Diana', 0, false, true),
              createBet('Alice', 10),
            ]}
            dealerIndex={0}
            onClickPlayer={() => {}}
          />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// WITHOUT TRUMP BETS
// =============================================================================

export const WithoutTrumpBets: Story = {
  name: 'Without Trump (x2) Bets',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[320px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Without Trump Hierarchy</h3>
      <p className="text-[var(--color-text-secondary)] text-sm mb-4">
        8 with x2 beats 8 without x2, but loses to 9
      </p>

      <BettingHistory
        players={mockPlayers}
        currentBets={[
          createBet('Bob', 8, false),       // Regular 8
          createBet('Charlie', 8, true),    // 8 with x2 = higher
          createBet('Diana', 9, false),     // 9 = highest
          createBet('Alice', 9, true),      // 9 with x2 = actual highest
        ]}
        dealerIndex={0}
        onClickPlayer={() => {}}
      />
    </div>
  ),
};

// =============================================================================
// DEALER SCENARIOS
// =============================================================================

export const DealerScenarios: Story = {
  name: 'Dealer Scenarios',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] space-y-6">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Dealer Positions</h3>

      <div className="grid grid-cols-2 gap-6">
        {/* Dealer is Player 1 (index 0) */}
        <div className="w-[280px]">
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">
            Dealer: Alice (Player 1)
          </p>
          <p className="text-[var(--color-text-tertiary)] text-xs mb-2">
            Order: Bob → Charlie → Diana → Alice
          </p>
          <BettingHistory
            players={mockPlayers}
            currentBets={[
              createBet('Bob', 7),
              createBet('Charlie', 8),
            ]}
            dealerIndex={0}
            onClickPlayer={() => {}}
          />
        </div>

        {/* Dealer is Player 3 (index 2) */}
        <div className="w-[280px]">
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">
            Dealer: Charlie (Player 3)
          </p>
          <p className="text-[var(--color-text-tertiary)] text-xs mb-2">
            Order: Diana → Alice → Bob → Charlie
          </p>
          <BettingHistory
            players={mockPlayers}
            currentBets={[
              createBet('Diana', 7),
              createBet('Alice', 8),
            ]}
            dealerIndex={2}
            onClickPlayer={() => {}}
          />
        </div>

        {/* Dealer must bet (all skipped) */}
        <div className="w-[280px]">
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">
            Dealer Must Bet (All Skipped)
          </p>
          <BettingHistory
            players={mockPlayers}
            currentBets={[
              createBet('Bob', 0, false, true),
              createBet('Charlie', 0, false, true),
              createBet('Diana', 0, false, true),
              createBet('Alice', 7),  // Dealer forced to bet
            ]}
            dealerIndex={0}
            onClickPlayer={() => {}}
          />
        </div>

        {/* Dealer equalizes */}
        <div className="w-[280px]">
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">
            Dealer Equalizes
          </p>
          <BettingHistory
            players={mockPlayers}
            currentBets={[
              createBet('Bob', 0, false, true),
              createBet('Charlie', 8),
              createBet('Diana', 0, false, true),
              createBet('Alice', 8),  // Dealer matches (wins ties)
            ]}
            dealerIndex={0}
            onClickPlayer={() => {}}
          />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// TEAM COLORS
// =============================================================================

export const TeamColors: Story = {
  name: 'Team Colors',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[320px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Team Color Indicators</h3>
      <p className="text-[var(--color-text-secondary)] text-sm mb-4">
        Left border and T1/T2 badges show team membership
      </p>

      <BettingHistory
        players={mockPlayers}
        currentBets={[
          createBet('Bob', 7),      // Team 2
          createBet('Charlie', 8),  // Team 1
          createBet('Diana', 9),    // Team 2
          createBet('Alice', 10),   // Team 1
        ]}
        dealerIndex={0}
        onClickPlayer={() => {}}
      />
    </div>
  ),
};

// =============================================================================
// WITH BOTS
// =============================================================================

export const WithBots: Story = {
  name: 'With Bot Players',
  render: () => {
    const playersWithBots: Player[] = [
      createMockPlayer({ id: 'p1', name: 'Alice', teamId: 1, isBot: false }),
      createMockPlayer({ id: 'p2', name: 'Bot_Easy', teamId: 2, isBot: true }),
      createMockPlayer({ id: 'p3', name: 'Charlie', teamId: 1, isBot: false }),
      createMockPlayer({ id: 'p4', name: 'Bot_Hard', teamId: 2, isBot: true }),
    ];

    return (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[320px]">
        <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Human + Bot Mix</h3>
        <p className="text-[var(--color-text-secondary)] text-sm mb-4">
          Bot names are not clickable (no profile)
        </p>

        <BettingHistory
          players={playersWithBots}
          currentBets={[
            createBet('Bot_Easy', 7),
            createBet('Charlie', 8),
            createBet('Bot_Hard', 9),
            createBet('Alice', 10),
          ]}
          dealerIndex={0}
          onClickPlayer={(name) => alert(`Opening profile: ${name}`)}
        />
      </div>
    );
  },
};

// =============================================================================
// BET AMOUNTS
// =============================================================================

export const BetAmounts: Story = {
  name: 'Bet Amount Range (7-12)',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] space-y-6">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Valid Bet Range</h3>

      <div className="grid grid-cols-2 gap-6">
        {/* Low bets */}
        <div className="w-[280px]">
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">Low Bets (7-8)</p>
          <BettingHistory
            players={mockPlayers}
            currentBets={[
              createBet('Bob', 7),
              createBet('Charlie', 8),
            ]}
            dealerIndex={0}
            onClickPlayer={() => {}}
          />
        </div>

        {/* High bets */}
        <div className="w-[280px]">
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">High Bets (10-12)</p>
          <BettingHistory
            players={mockPlayers}
            currentBets={[
              createBet('Bob', 10),
              createBet('Charlie', 11),
              createBet('Diana', 12, true), // Max bet + x2!
            ]}
            dealerIndex={0}
            onClickPlayer={() => {}}
          />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// SKIP PATTERNS
// =============================================================================

export const SkipPatterns: Story = {
  name: 'Skip Patterns',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] space-y-6">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Skip Scenarios</h3>

      <div className="grid grid-cols-3 gap-4">
        {/* No skips */}
        <div className="w-[260px]">
          <p className="text-[var(--color-text-secondary)] text-xs mb-2">Everyone Bets</p>
          <BettingHistory
            players={mockPlayers}
            currentBets={[
              createBet('Bob', 7),
              createBet('Charlie', 8),
              createBet('Diana', 9),
              createBet('Alice', 10),
            ]}
            dealerIndex={0}
            onClickPlayer={() => {}}
          />
        </div>

        {/* Some skips */}
        <div className="w-[260px]">
          <p className="text-[var(--color-text-secondary)] text-xs mb-2">Some Skip</p>
          <BettingHistory
            players={mockPlayers}
            currentBets={[
              createBet('Bob', 0, false, true),
              createBet('Charlie', 8),
              createBet('Diana', 0, false, true),
              createBet('Alice', 9),
            ]}
            dealerIndex={0}
            onClickPlayer={() => {}}
          />
        </div>

        {/* All skip except dealer */}
        <div className="w-[260px]">
          <p className="text-[var(--color-text-secondary)] text-xs mb-2">All Skip (Dealer Forced)</p>
          <BettingHistory
            players={mockPlayers}
            currentBets={[
              createBet('Bob', 0, false, true),
              createBet('Charlie', 0, false, true),
              createBet('Diana', 0, false, true),
              createBet('Alice', 7),
            ]}
            dealerIndex={0}
            onClickPlayer={() => {}}
          />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// LEGEND SHOWCASE
// =============================================================================

export const LegendShowcase: Story = {
  name: 'Legend and Indicators',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[320px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">All Visual Indicators</h3>

      <BettingHistory
        players={mockPlayers}
        currentBets={[
          createBet('Bob', 0, false, true),  // Skipped
          createBet('Charlie', 8, false),     // Normal bet
          createBet('Diana', 8, true),        // Without trump
          createBet('Alice', 9, false),       // Highest bet
        ]}
        dealerIndex={0}
        onClickPlayer={() => {}}
      />

      <div className="mt-4 p-3 rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] text-xs space-y-1">
        <p>Legend shows:</p>
        <p>- Green = Highest bet (with crown)</p>
        <p>- x2 = Without trump (double points)</p>
        <p>- SKIP = Player skipped betting</p>
        <p>- T1/T2 = Team badges</p>
        <p>- Card emoji = Dealer indicator</p>
      </div>
    </div>
  ),
};

// =============================================================================
// INTERACTIVE
// =============================================================================

export const Default: Story = {
  args: {
    players: mockPlayers,
    currentBets: [
      createBet('Bob', 8),
      createBet('Charlie', 9),
    ],
    dealerIndex: 0,
  },
  render: (args) => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[320px]">
      <BettingHistory
        {...args}
        onClickPlayer={(name) => alert(`Opening profile: ${name}`)}
      />
    </div>
  ),
};

export const CompletedBetting: Story = {
  args: {
    players: mockPlayers,
    currentBets: [
      createBet('Bob', 7),
      createBet('Charlie', 8),
      createBet('Diana', 0, false, true),
      createBet('Alice', 8, true),
    ],
    dealerIndex: 0,
  },
  render: (args) => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[320px]">
      <BettingHistory
        {...args}
        onClickPlayer={(name) => alert(`Opening profile: ${name}`)}
      />
    </div>
  ),
};

/**
 * InlineBetStatus Component Stories
 *
 * Compact betting status display for all players during betting phase.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { InlineBetStatus } from '../../InlineBetStatus';
import type { Player } from '../../../types/game';

// Mock player data
const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 'player-1',
  name: 'Player1',
  teamId: 1,
  hand: [],
  tricksWon: 0,
  pointsWon: 0,
  isBot: false,
  isEmpty: false,
  isConnected: true,
  ...overrides,
});

const mockPlayers: Player[] = [
  createMockPlayer({ id: 'p1', name: 'Alice', teamId: 1 }),
  createMockPlayer({ id: 'p2', name: 'Bob', teamId: 2 }),
  createMockPlayer({ id: 'p3', name: 'Charlie', teamId: 1 }),
  createMockPlayer({ id: 'p4', name: 'Diana', teamId: 2 }),
];

const meta = {
  title: 'Game/InlineBetStatus',
  component: InlineBetStatus,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# InlineBetStatus Component

Displays betting status for all players during the betting phase.

## Status States
- **✓ Bet Placed**: Shows bet amount (with * for "without trump")
- **⊗ Skipped**: Player skipped their bet
- **⏳ Current Turn**: Player is currently betting
- **○ Waiting**: Player hasn't bet yet

## Features
- Team-colored backgrounds (Orange/Purple)
- Clickable player names (opens profile)
- Visual distinction for current player
- Compact display for betting phase UI

## Use Cases
- Betting phase sidebar
- Game state display
- Turn order visualization
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof InlineBetStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// BETTING STATES
// =============================================================================

export const AllStates: Story = {
  name: 'All Betting States',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] space-y-6">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Betting Status States</h3>

      <div className="grid grid-cols-2 gap-6">
        {/* Start of betting */}
        <div>
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">Start of Betting</p>
          <InlineBetStatus
            players={mockPlayers}
            currentBets={new Map()}
            skippedPlayers={new Set()}
            currentPlayerIndex={0}
            onClickPlayer={() => {}}
          />
        </div>

        {/* Mid-betting */}
        <div>
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">
            Mid-betting (Alice bet, Bob skipped)
          </p>
          <InlineBetStatus
            players={mockPlayers}
            currentBets={new Map([['Alice', { amount: 8, withoutTrump: false }]])}
            skippedPlayers={new Set(['Bob'])}
            currentPlayerIndex={2}
            onClickPlayer={() => {}}
          />
        </div>

        {/* Almost done */}
        <div>
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">
            Almost Done (Diana betting)
          </p>
          <InlineBetStatus
            players={mockPlayers}
            currentBets={
              new Map([
                ['Alice', { amount: 8, withoutTrump: false }],
                ['Charlie', { amount: 9, withoutTrump: false }],
              ])
            }
            skippedPlayers={new Set(['Bob'])}
            currentPlayerIndex={3}
            onClickPlayer={() => {}}
          />
        </div>

        {/* All done */}
        <div>
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">All Bets Placed</p>
          <InlineBetStatus
            players={mockPlayers}
            currentBets={
              new Map([
                ['Alice', { amount: 8, withoutTrump: false }],
                ['Charlie', { amount: 9, withoutTrump: false }],
                ['Diana', { amount: 10, withoutTrump: true }],
              ])
            }
            skippedPlayers={new Set(['Bob'])}
            currentPlayerIndex={-1}
            onClickPlayer={() => {}}
          />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// WITHOUT TRUMP INDICATOR
// =============================================================================

export const WithoutTrumpBets: Story = {
  name: 'Without Trump Bets (*)',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[250px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Without Trump Bets</h3>
      <p className="text-[var(--color-text-secondary)] text-sm mb-4">
        Asterisk (*) indicates "without trump" bets
      </p>

      <InlineBetStatus
        players={mockPlayers}
        currentBets={
          new Map([
            ['Alice', { amount: 8, withoutTrump: false }],
            ['Bob', { amount: 8, withoutTrump: true }], // Same amount but without trump = higher
            ['Charlie', { amount: 9, withoutTrump: false }],
            ['Diana', { amount: 9, withoutTrump: true }], // Highest bid
          ])
        }
        skippedPlayers={new Set()}
        currentPlayerIndex={-1}
        onClickPlayer={() => {}}
      />

      <p className="text-[var(--color-text-tertiary)] text-xs mt-3">
        8* beats 8, 9* beats 9 (without trump is higher)
      </p>
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
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[250px]">
        <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Mixed Human/Bot</h3>
        <p className="text-[var(--color-text-secondary)] text-sm mb-4">
          Bot names are not clickable
        </p>

        <InlineBetStatus
          players={playersWithBots}
          currentBets={
            new Map([
              ['Alice', { amount: 7, withoutTrump: false }],
              ['Bot_Easy', { amount: 8, withoutTrump: false }],
            ])
          }
          skippedPlayers={new Set()}
          currentPlayerIndex={2}
          onClickPlayer={(name) => alert(`Opening profile for: ${name}`)}
        />
      </div>
    );
  },
};

// =============================================================================
// BETTING PHASE CONTEXT
// =============================================================================

export const BettingPhaseLayout: Story = {
  name: 'Betting Phase Layout',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[600px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Betting Phase UI</h3>

      <div className="flex gap-6">
        {/* Main betting area */}
        <div className="flex-1 p-4 rounded-lg bg-[var(--color-bg-secondary)]">
          <h4 className="text-[var(--color-text-primary)] font-medium mb-3">Your Turn</h4>
          <div className="p-4 rounded-lg bg-[var(--color-bg-tertiary)]">
            <p className="text-[var(--color-text-secondary)] text-center">
              Betting controls would appear here
            </p>
          </div>
        </div>

        {/* Bet status sidebar */}
        <div className="w-[180px]">
          <InlineBetStatus
            players={mockPlayers}
            currentBets={new Map([['Alice', { amount: 8, withoutTrump: false }]])}
            skippedPlayers={new Set(['Bob'])}
            currentPlayerIndex={2}
            onClickPlayer={() => {}}
          />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// SKIP SCENARIOS
// =============================================================================

export const SkipScenarios: Story = {
  name: 'Skip Scenarios',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] space-y-6">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Skip Scenarios</h3>

      <div className="grid grid-cols-3 gap-4">
        {/* No skips */}
        <div>
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">No Skips</p>
          <InlineBetStatus
            players={mockPlayers}
            currentBets={
              new Map([
                ['Alice', { amount: 7, withoutTrump: false }],
                ['Bob', { amount: 8, withoutTrump: false }],
                ['Charlie', { amount: 9, withoutTrump: false }],
                ['Diana', { amount: 10, withoutTrump: false }],
              ])
            }
            skippedPlayers={new Set()}
            currentPlayerIndex={-1}
            onClickPlayer={() => {}}
          />
        </div>

        {/* Some skips */}
        <div>
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">Some Skips</p>
          <InlineBetStatus
            players={mockPlayers}
            currentBets={
              new Map([
                ['Bob', { amount: 8, withoutTrump: false }],
                ['Diana', { amount: 9, withoutTrump: false }],
              ])
            }
            skippedPlayers={new Set(['Alice', 'Charlie'])}
            currentPlayerIndex={-1}
            onClickPlayer={() => {}}
          />
        </div>

        {/* All skip (dealer must bet) */}
        <div>
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">
            All Skip (Dealer Must Bet)
          </p>
          <InlineBetStatus
            players={mockPlayers}
            currentBets={
              new Map([
                ['Diana', { amount: 7, withoutTrump: false }], // Dealer had to bet
              ])
            }
            skippedPlayers={new Set(['Alice', 'Bob', 'Charlie'])}
            currentPlayerIndex={-1}
            onClickPlayer={() => {}}
          />
        </div>
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
    currentBets: new Map([['Alice', { amount: 8, withoutTrump: false }]]),
    skippedPlayers: new Set(['Bob']),
    currentPlayerIndex: 2,
  },
  render: (args) => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[200px]">
      <InlineBetStatus {...args} onClickPlayer={(name) => alert(`Opening profile for: ${name}`)} />
    </div>
  ),
};

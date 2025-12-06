/**
 * TrickHistory Component Stories
 *
 * Displays history of played tricks with cards and winners.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { TrickHistory } from '../../TrickHistory';
import type { TrickResult, Player, Card, CardColor } from '../../../types/game';

// Helper to create cards
const createCard = (color: CardColor, value: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7): Card => ({
  color,
  value,
});

// Mock players
const mockPlayers: Player[] = [
  { id: 'p1', name: 'Alice', teamId: 1, hand: [], tricksWon: 3, pointsWon: 8, isBot: false },
  { id: 'p2', name: 'Bob', teamId: 2, hand: [], tricksWon: 2, pointsWon: 5, isBot: false },
  { id: 'p3', name: 'Charlie', teamId: 1, hand: [], tricksWon: 2, pointsWon: 4, isBot: false },
  { id: 'p4', name: 'Diana', teamId: 2, hand: [], tricksWon: 1, pointsWon: 3, isBot: false },
];

// Mock trick results
const createMockTrick = (
  winnerName: string,
  points: number,
  cards: { playerName: string; card: Card }[]
): TrickResult => ({
  trick: cards.map((c) => ({
    playerId: `p-${c.playerName}`,
    playerName: c.playerName,
    card: c.card,
  })),
  winnerId: `p-${winnerName}`,
  winnerName,
  points,
});

const sampleTricks: TrickResult[] = [
  createMockTrick('Alice', 1, [
    { playerName: 'Alice', card: createCard('red', 6) },
    { playerName: 'Bob', card: createCard('red', 4) },
    { playerName: 'Charlie', card: createCard('red', 2) },
    { playerName: 'Diana', card: createCard('red', 3) },
  ]),
  createMockTrick('Bob', 6, [
    { playerName: 'Bob', card: createCard('blue', 7) },
    { playerName: 'Charlie', card: createCard('blue', 5) },
    { playerName: 'Diana', card: createCard('blue', 3) },
    { playerName: 'Alice', card: createCard('red', 0) }, // Red zero!
  ]),
  createMockTrick('Charlie', -1, [
    { playerName: 'Charlie', card: createCard('green', 4) },
    { playerName: 'Diana', card: createCard('green', 2) },
    { playerName: 'Alice', card: createCard('brown', 0) }, // Brown zero!
    { playerName: 'Bob', card: createCard('green', 1) },
  ]),
  createMockTrick('Diana', 1, [
    { playerName: 'Diana', card: createCard('brown', 5) },
    { playerName: 'Alice', card: createCard('brown', 3) },
    { playerName: 'Bob', card: createCard('brown', 1) },
    { playerName: 'Charlie', card: createCard('brown', 2) },
  ]),
];

const meta = {
  title: 'Game/TrickHistory',
  component: TrickHistory,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# TrickHistory Component

Displays a scrollable history of played tricks with visual cards.

## Features
- **Card Display**: Shows all 4 cards played in each trick
- **Winner Highlight**: Yellow ring around winning card
- **Team Colors**: Winner badge colored by team (orange/purple)
- **Points Display**: Shows points won (including red/brown zero bonuses)
- **Current Trick**: Optional highlight for current trick
- **Compact Mode**: Smaller cards for sidebar usage

## Point Values
- Normal trick: 1 point
- Red 0 bonus: +5 points (total 6)
- Brown 0 penalty: -2 points (total -1)

## Use Cases
- Round summary display
- Replay viewer
- Game history panel
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    tricks: { control: 'object', description: 'Array of trick results' },
    players: { control: 'object', description: 'Array of players for team colors' },
    trump: { control: 'select', options: ['red', 'brown', 'green', 'blue', null] },
    currentTrickIndex: { control: 'number', description: 'Index of current trick (for highlight)' },
    compact: { control: 'boolean', description: 'Use smaller card sizes' },
    showWinner: { control: 'boolean', description: 'Show winner badge' },
  },
} satisfies Meta<typeof TrickHistory>;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// BASIC DISPLAY
// =============================================================================

export const MultipleTricks: Story = {
  name: 'Multiple Tricks',
  args: {
    tricks: sampleTricks,
    players: mockPlayers,
    trump: 'red',
    showWinner: true,
  },
  decorators: [
    (Story) => (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[450px]">
        <Story />
      </div>
    ),
  ],
};

// =============================================================================
// SINGLE TRICK DETAILS
// =============================================================================

export const SingleTrick: Story = {
  name: 'Single Trick',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[450px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Trick Details</h3>
      <TrickHistory
        tricks={[sampleTricks[0]]}
        players={mockPlayers}
        trump="red"
        showWinner={true}
      />
    </div>
  ),
};

// =============================================================================
// POINT VARIATIONS
// =============================================================================

export const PointVariations: Story = {
  name: 'Point Variations',
  render: () => {
    const pointTricks: TrickResult[] = [
      // Normal 1 point trick
      createMockTrick('Alice', 1, [
        { playerName: 'Alice', card: createCard('green', 7) },
        { playerName: 'Bob', card: createCard('green', 5) },
        { playerName: 'Charlie', card: createCard('green', 3) },
        { playerName: 'Diana', card: createCard('green', 1) },
      ]),
      // Red zero bonus (+6 points)
      createMockTrick('Bob', 6, [
        { playerName: 'Bob', card: createCard('blue', 6) },
        { playerName: 'Charlie', card: createCard('red', 0) },
        { playerName: 'Diana', card: createCard('blue', 2) },
        { playerName: 'Alice', card: createCard('blue', 4) },
      ]),
      // Brown zero penalty (-1 points)
      createMockTrick('Charlie', -1, [
        { playerName: 'Charlie', card: createCard('red', 5) },
        { playerName: 'Diana', card: createCard('brown', 0) },
        { playerName: 'Alice', card: createCard('red', 2) },
        { playerName: 'Bob', card: createCard('red', 1) },
      ]),
    ];

    return (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[450px]">
        <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Point Variations</h3>
        <p className="text-[var(--color-text-secondary)] text-sm mb-4">
          Normal (+1), Red Zero (+6), Brown Zero (-1)
        </p>
        <TrickHistory tricks={pointTricks} players={mockPlayers} trump="blue" showWinner={true} />
      </div>
    );
  },
};

// =============================================================================
// COMPACT MODE
// =============================================================================

export const CompactMode: Story = {
  name: 'Compact Mode',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] space-y-6">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Normal vs Compact</h3>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">Normal Size</p>
          <TrickHistory
            tricks={sampleTricks.slice(0, 2)}
            players={mockPlayers}
            trump="red"
            compact={false}
            showWinner={true}
          />
        </div>

        <div>
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">Compact Size</p>
          <TrickHistory
            tricks={sampleTricks.slice(0, 2)}
            players={mockPlayers}
            trump="red"
            compact={true}
            showWinner={true}
          />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// CURRENT TRICK HIGHLIGHT
// =============================================================================

export const CurrentTrickHighlight: Story = {
  name: 'Current Trick Highlight',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[450px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">
        Current Trick Highlight
      </h3>
      <p className="text-[var(--color-text-secondary)] text-sm mb-4">
        Trick 3 is highlighted as current (yellow border)
      </p>
      <TrickHistory
        tricks={sampleTricks}
        players={mockPlayers}
        trump="red"
        currentTrickIndex={2}
        showWinner={true}
      />
    </div>
  ),
};

// =============================================================================
// TEAM WINNERS
// =============================================================================

export const TeamWinners: Story = {
  name: 'Team Color Winners',
  render: () => {
    const teamTricks: TrickResult[] = [
      createMockTrick('Alice', 1, [
        { playerName: 'Alice', card: createCard('red', 7) },
        { playerName: 'Bob', card: createCard('red', 3) },
        { playerName: 'Charlie', card: createCard('red', 5) },
        { playerName: 'Diana', card: createCard('red', 2) },
      ]),
      createMockTrick('Bob', 1, [
        { playerName: 'Bob', card: createCard('green', 6) },
        { playerName: 'Charlie', card: createCard('green', 4) },
        { playerName: 'Diana', card: createCard('green', 5) },
        { playerName: 'Alice', card: createCard('green', 3) },
      ]),
      createMockTrick('Charlie', 1, [
        { playerName: 'Charlie', card: createCard('blue', 7) },
        { playerName: 'Diana', card: createCard('blue', 4) },
        { playerName: 'Alice', card: createCard('blue', 6) },
        { playerName: 'Bob', card: createCard('blue', 2) },
      ]),
      createMockTrick('Diana', 1, [
        { playerName: 'Diana', card: createCard('brown', 5) },
        { playerName: 'Alice', card: createCard('brown', 4) },
        { playerName: 'Bob', card: createCard('brown', 3) },
        { playerName: 'Charlie', card: createCard('brown', 2) },
      ]),
    ];

    return (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[450px]">
        <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Team Winners</h3>
        <p className="text-[var(--color-text-secondary)] text-sm mb-4">
          Alice & Charlie = Team 1 (Orange) | Bob & Diana = Team 2 (Purple)
        </p>
        <TrickHistory tricks={teamTricks} players={mockPlayers} trump="green" showWinner={true} />
      </div>
    );
  },
};

// =============================================================================
// WITHOUT WINNER BADGES
// =============================================================================

export const WithoutWinnerBadges: Story = {
  name: 'Without Winner Badges',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[450px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Hide Winner Badges</h3>
      <p className="text-[var(--color-text-secondary)] text-sm mb-4">
        showWinner=false hides the winner badge but keeps the card highlight
      </p>
      <TrickHistory
        tricks={sampleTricks.slice(0, 2)}
        players={mockPlayers}
        trump="red"
        showWinner={false}
      />
    </div>
  ),
};

// =============================================================================
// EMPTY STATE
// =============================================================================

export const EmptyState: Story = {
  name: 'Empty State',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[400px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">No Tricks Yet</h3>
      <TrickHistory tricks={[]} players={mockPlayers} trump="red" />
    </div>
  ),
};

// =============================================================================
// FULL ROUND (8 TRICKS)
// =============================================================================

export const FullRound: Story = {
  name: 'Full Round (8 Tricks)',
  render: () => {
    const fullRoundTricks: TrickResult[] = [
      createMockTrick('Alice', 1, [
        { playerName: 'Alice', card: createCard('red', 7) },
        { playerName: 'Bob', card: createCard('red', 5) },
        { playerName: 'Charlie', card: createCard('red', 3) },
        { playerName: 'Diana', card: createCard('red', 1) },
      ]),
      createMockTrick('Bob', 1, [
        { playerName: 'Bob', card: createCard('blue', 6) },
        { playerName: 'Charlie', card: createCard('blue', 4) },
        { playerName: 'Diana', card: createCard('blue', 2) },
        { playerName: 'Alice', card: createCard('blue', 5) },
      ]),
      createMockTrick('Alice', 6, [
        { playerName: 'Charlie', card: createCard('green', 5) },
        { playerName: 'Diana', card: createCard('red', 0) },
        { playerName: 'Alice', card: createCard('green', 7) },
        { playerName: 'Bob', card: createCard('green', 3) },
      ]),
      createMockTrick('Diana', 1, [
        { playerName: 'Diana', card: createCard('brown', 7) },
        { playerName: 'Alice', card: createCard('brown', 4) },
        { playerName: 'Bob', card: createCard('brown', 6) },
        { playerName: 'Charlie', card: createCard('brown', 5) },
      ]),
      createMockTrick('Charlie', -1, [
        { playerName: 'Alice', card: createCard('green', 4) },
        { playerName: 'Bob', card: createCard('green', 2) },
        { playerName: 'Charlie', card: createCard('green', 6) },
        { playerName: 'Diana', card: createCard('brown', 0) },
      ]),
      createMockTrick('Bob', 1, [
        { playerName: 'Bob', card: createCard('red', 6) },
        { playerName: 'Charlie', card: createCard('red', 4) },
        { playerName: 'Diana', card: createCard('red', 2) },
        { playerName: 'Alice', card: createCard('blue', 7) },
      ]),
      createMockTrick('Alice', 1, [
        { playerName: 'Charlie', card: createCard('blue', 3) },
        { playerName: 'Diana', card: createCard('blue', 1) },
        { playerName: 'Alice', card: createCard('green', 1) },
        { playerName: 'Bob', card: createCard('green', 0) },
      ]),
      createMockTrick('Diana', 1, [
        { playerName: 'Diana', card: createCard('brown', 3) },
        { playerName: 'Alice', card: createCard('brown', 2) },
        { playerName: 'Bob', card: createCard('brown', 1) },
        { playerName: 'Charlie', card: createCard('blue', 0) },
      ]),
    ];

    return (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[450px] max-h-[600px] overflow-y-auto">
        <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">
          Full Round (8 Tricks)
        </h3>
        <TrickHistory
          tricks={fullRoundTricks}
          players={mockPlayers}
          trump="green"
          showWinner={true}
        />
      </div>
    );
  },
};

// =============================================================================
// REPLAY VIEWER CONTEXT
// =============================================================================

export const ReplayViewerContext: Story = {
  name: 'In Replay Viewer',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[600px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[var(--color-text-primary)] font-semibold">Round 3 Replay</h3>
        <div className="flex gap-2">
          <span className="px-3 py-1 rounded bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] text-sm">
            Trump: Red
          </span>
          <span className="px-3 py-1 rounded bg-orange-500/20 text-orange-400 text-sm">
            Team 1: 5 pts
          </span>
          <span className="px-3 py-1 rounded bg-purple-500/20 text-purple-400 text-sm">
            Team 2: 3 pts
          </span>
        </div>
      </div>

      <TrickHistory
        tricks={sampleTricks}
        players={mockPlayers}
        trump="red"
        currentTrickIndex={1}
        showWinner={true}
        compact={true}
      />

      <div className="mt-4 flex items-center justify-center gap-4">
        <button className="px-4 py-2 rounded bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]">
          ⏮ Prev
        </button>
        <button className="px-4 py-2 rounded bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]">
          ▶ Play
        </button>
        <button className="px-4 py-2 rounded bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]">
          Next ⏭
        </button>
      </div>
    </div>
  ),
};

// =============================================================================
// INTERACTIVE
// =============================================================================

export const Default: Story = {
  args: {
    tricks: sampleTricks,
    players: mockPlayers,
    trump: 'red',
    compact: false,
    showWinner: true,
  },
  decorators: [
    (Story) => (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[450px]">
        <Story />
      </div>
    ),
  ],
};

export const Compact: Story = {
  args: {
    tricks: sampleTricks,
    players: mockPlayers,
    trump: 'blue',
    compact: true,
    showWinner: true,
  },
  decorators: [
    (Story) => (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[350px]">
        <Story />
      </div>
    ),
  ],
};

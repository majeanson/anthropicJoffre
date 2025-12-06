/**
 * RematchVoting Component Stories
 *
 * Post-game rematch voting panel where players vote to play again.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { UICard, Button, TeamIndicator } from '..';

const meta = {
  title: 'Game/RematchVoting',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# RematchVoting Component

Post-game voting panel where players can vote to play again.

## Features
- **Vote Progress**: Shows X / 4 votes with remaining count
- **Player Indicators**: Visual display of who has voted
- **Team Colors**: Players shown with team badges
- **Vote Button**: Large call-to-action for voting
- **Waiting State**: Confirmation message after voting
- **Auto-Start**: When 4/4 votes, rematch begins

## States
- No votes yet
- Partial votes (1-3)
- All voted (starting rematch)
- Already voted (waiting)

## Integration
Uses Socket.io for real-time vote updates.
Requires gameState with rematchVotes array.
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
  id: string;
  name: string;
  teamId: 1 | 2;
  isCurrentPlayer: boolean;
  hasVoted: boolean;
}

const createMockPlayers = (votes: string[]): MockPlayer[] => [
  { id: 'p1', name: 'You', teamId: 1, isCurrentPlayer: true, hasVoted: votes.includes('You') },
  { id: 'p2', name: 'Bob', teamId: 2, isCurrentPlayer: false, hasVoted: votes.includes('Bob') },
  {
    id: 'p3',
    name: 'Charlie',
    teamId: 1,
    isCurrentPlayer: false,
    hasVoted: votes.includes('Charlie'),
  },
  { id: 'p4', name: 'Diana', teamId: 2, isCurrentPlayer: false, hasVoted: votes.includes('Diana') },
];

// =============================================================================
// VOTING STATES
// =============================================================================

export const NoVotesYet: Story = {
  name: 'No Votes Yet',
  render: () => {
    const players = createMockPlayers([]);
    const voteCount = 0;
    const votesNeeded = 4;

    return (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[500px]">
        <UICard variant="elevated" size="lg">
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-black text-[var(--color-text-primary)]">Play Again?</h2>

            <UICard variant="bordered" size="md">
              <div className="text-6xl mb-4">🔄</div>

              <div className="space-y-2">
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {voteCount} / 4 votes
                </p>
                <p className="text-lg text-[var(--color-text-secondary)]">
                  {votesNeeded} more votes needed
                </p>
              </div>

              {/* Vote indicators */}
              <div className="flex justify-center gap-3 mt-6">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                      player.hasVoted
                        ? 'bg-green-100 border-green-400'
                        : 'bg-gray-200 dark:bg-gray-600 border-gray-400 dark:border-gray-500 opacity-60'
                    }`}
                  >
                    <TeamIndicator teamId={player.teamId} size="md" className="mb-2" />
                    <div className="text-xs font-bold text-[var(--color-text-primary)] max-w-[60px] truncate">
                      {player.isCurrentPlayer ? 'You' : player.name}
                    </div>
                    <div className="text-2xl mt-1">{player.hasVoted ? '✓' : '○'}</div>
                  </div>
                ))}
              </div>
            </UICard>

            <Button variant="success" size="lg" className="w-full text-xl font-black">
              Vote for Rematch
            </Button>
          </div>
        </UICard>
      </div>
    );
  },
};

export const SomeVotes: Story = {
  name: 'Some Votes (2/4)',
  render: () => {
    const players = createMockPlayers(['You', 'Bob']);
    const voteCount = 2;
    const votesNeeded = 2;

    return (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[500px]">
        <UICard variant="elevated" size="lg">
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-black text-[var(--color-text-primary)]">Play Again?</h2>

            <UICard variant="bordered" size="md">
              <div className="text-6xl mb-4">🔄</div>

              <div className="space-y-2">
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {voteCount} / 4 votes
                </p>
                <p className="text-lg text-[var(--color-text-secondary)]">
                  {votesNeeded} more votes needed
                </p>
              </div>

              <div className="flex justify-center gap-3 mt-6">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                      player.hasVoted
                        ? 'bg-green-100 dark:bg-green-900/40 border-green-400'
                        : 'bg-gray-200 dark:bg-gray-600 border-gray-400 dark:border-gray-500 opacity-60'
                    }`}
                  >
                    <TeamIndicator teamId={player.teamId} size="md" className="mb-2" />
                    <div className="text-xs font-bold text-[var(--color-text-primary)] max-w-[60px] truncate">
                      {player.isCurrentPlayer ? 'You' : player.name}
                    </div>
                    <div className="text-2xl mt-1">{player.hasVoted ? '✓' : '○'}</div>
                  </div>
                ))}
              </div>
            </UICard>

            <UICard variant="bordered" size="sm" gradient="info">
              <p className="font-semibold text-blue-800 dark:text-blue-200">
                ✓ You voted for rematch. Waiting for other players...
              </p>
            </UICard>
          </div>
        </UICard>
      </div>
    );
  },
};

export const AlmostThere: Story = {
  name: 'Almost There (3/4)',
  render: () => {
    const players = createMockPlayers(['You', 'Bob', 'Charlie']);
    const voteCount = 3;

    return (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[500px]">
        <UICard variant="elevated" size="lg">
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-black text-[var(--color-text-primary)]">Play Again?</h2>

            <UICard variant="bordered" size="md">
              <div className="text-6xl mb-4">🔄</div>

              <div className="space-y-2">
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {voteCount} / 4 votes
                </p>
                <p className="text-lg text-yellow-600 dark:text-yellow-400 font-bold">
                  1 more vote needed!
                </p>
              </div>

              <div className="flex justify-center gap-3 mt-6">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                      player.hasVoted
                        ? 'bg-green-100 dark:bg-green-900/40 border-green-400'
                        : 'bg-gray-200 dark:bg-gray-600 border-gray-400 dark:border-gray-500 opacity-60'
                    }`}
                  >
                    <TeamIndicator teamId={player.teamId} size="md" className="mb-2" />
                    <div className="text-xs font-bold text-[var(--color-text-primary)] max-w-[60px] truncate">
                      {player.isCurrentPlayer ? 'You' : player.name}
                    </div>
                    <div className="text-2xl mt-1">{player.hasVoted ? '✓' : '○'}</div>
                  </div>
                ))}
              </div>
            </UICard>

            <UICard variant="bordered" size="sm" gradient="info">
              <p className="font-semibold text-blue-800 dark:text-blue-200">
                ✓ You voted for rematch. Waiting for other players...
              </p>
            </UICard>
          </div>
        </UICard>
      </div>
    );
  },
};

export const AllVoted: Story = {
  name: 'All Voted (Starting)',
  render: () => {
    const players = createMockPlayers(['You', 'Bob', 'Charlie', 'Diana']);
    const voteCount = 4;

    return (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[500px]">
        <UICard variant="elevated" size="lg">
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-black text-[var(--color-text-primary)]">Play Again?</h2>

            <UICard variant="bordered" size="md">
              <div className="text-6xl mb-4">🎉</div>

              <div className="space-y-2">
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {voteCount} / 4 votes
                </p>
                <p className="text-lg text-green-600 dark:text-green-400 font-bold animate-pulse">
                  Starting rematch...
                </p>
              </div>

              <div className="flex justify-center gap-3 mt-6">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="flex flex-col items-center p-3 rounded-lg border-2 bg-green-100 dark:bg-green-900/40 border-green-400"
                  >
                    <TeamIndicator teamId={player.teamId} size="md" className="mb-2" />
                    <div className="text-xs font-bold text-[var(--color-text-primary)] max-w-[60px] truncate">
                      {player.isCurrentPlayer ? 'You' : player.name}
                    </div>
                    <div className="text-2xl mt-1">✓</div>
                  </div>
                ))}
              </div>
            </UICard>
          </div>
        </UICard>
      </div>
    );
  },
};

// =============================================================================
// VOTE INDICATORS
// =============================================================================

export const VoteIndicators: Story = {
  name: 'Vote Indicator States',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[400px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Player Vote States</h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Not Voted */}
        <div className="text-center">
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">Not Voted</p>
          <div className="flex flex-col items-center p-3 rounded-lg border-2 bg-gray-200 dark:bg-gray-600 border-gray-400 dark:border-gray-500 opacity-60">
            <TeamIndicator teamId={1} size="md" className="mb-2" />
            <div className="text-xs font-bold text-[var(--color-text-primary)]">Alice</div>
            <div className="text-2xl mt-1">○</div>
          </div>
        </div>

        {/* Voted */}
        <div className="text-center">
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">Voted</p>
          <div className="flex flex-col items-center p-3 rounded-lg border-2 bg-green-100 dark:bg-green-900/40 border-green-400">
            <TeamIndicator teamId={2} size="md" className="mb-2" />
            <div className="text-xs font-bold text-[var(--color-text-primary)]">Bob</div>
            <div className="text-2xl mt-1">✓</div>
          </div>
        </div>

        {/* Current Player - Not Voted */}
        <div className="text-center">
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">You (Not Voted)</p>
          <div className="flex flex-col items-center p-3 rounded-lg border-2 bg-gray-200 dark:bg-gray-600 border-gray-400 dark:border-gray-500 opacity-60">
            <TeamIndicator teamId={1} size="md" className="mb-2" />
            <div className="text-xs font-bold text-[var(--color-text-primary)]">You</div>
            <div className="text-2xl mt-1">○</div>
          </div>
        </div>

        {/* Current Player - Voted */}
        <div className="text-center">
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">You (Voted)</p>
          <div className="flex flex-col items-center p-3 rounded-lg border-2 bg-green-100 dark:bg-green-900/40 border-green-400">
            <TeamIndicator teamId={1} size="md" className="mb-2" />
            <div className="text-xs font-bold text-[var(--color-text-primary)]">You</div>
            <div className="text-2xl mt-1">✓</div>
          </div>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// BUTTON STATES
// =============================================================================

export const ButtonStates: Story = {
  name: 'Button States',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[400px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Vote Button States</h3>

      <div className="space-y-4">
        {/* Can Vote */}
        <div>
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">Can Vote</p>
          <Button variant="success" size="lg" className="w-full text-xl font-black">
            Vote for Rematch
          </Button>
        </div>

        {/* Already Voted */}
        <div>
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">Already Voted</p>
          <UICard variant="bordered" size="sm" gradient="info">
            <p className="font-semibold text-blue-800 dark:text-blue-200 text-center">
              ✓ You voted for rematch. Waiting for other players...
            </p>
          </UICard>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// PROGRESS DISPLAY
// =============================================================================

export const ProgressDisplay: Story = {
  name: 'Vote Progress Display',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[350px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Vote Progress</h3>

      <div className="space-y-4">
        {[0, 1, 2, 3, 4].map((count) => (
          <div
            key={count}
            className="p-4 rounded-lg bg-[var(--color-bg-secondary)] flex items-center justify-between"
          >
            <div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                {count} / 4 votes
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {count === 4
                  ? 'Starting rematch...'
                  : count === 3
                    ? '1 more vote needed!'
                    : `${4 - count} more votes needed`}
              </p>
            </div>
            <span className="text-4xl">{count === 4 ? '🎉' : '🔄'}</span>
          </div>
        ))}
      </div>
    </div>
  ),
};

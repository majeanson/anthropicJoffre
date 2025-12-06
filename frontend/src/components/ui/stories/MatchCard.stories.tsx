/**
 * MatchCard Component Stories
 *
 * Game history entry card showing win/loss, scores, and stats.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { MatchCard } from '../../MatchCard';
import type { GameHistoryEntry } from '../../../types/game';

// Mock game data
const createMockGame = (overrides: Partial<GameHistoryEntry> = {}): GameHistoryEntry => ({
  game_id: 'game-123',
  player_name: 'Alice',
  team_id: 1,
  won_game: true,
  team1_score: 41,
  team2_score: 32,
  rounds: 5,
  tricks_won: 12,
  points_earned: 24,
  bet_amount: 8,
  bet_won: true,
  is_finished: true,
  finished_at: new Date().toISOString(),
  ...overrides,
});

const meta = {
  title: 'Game/MatchCard',
  component: MatchCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# MatchCard Component

Displays a game history entry with match results, scores, and statistics.

## Features
- **Win/Loss Indicator**: Green gradient for wins, red for losses
- **Team Badge**: Shows which team the player was on
- **Score Display**: Final score with round count
- **Statistics**: Tricks won, points earned, bet results
- **Replay Button**: Optional button to view game replay
- **Click Handler**: Optional click to view match details
- **Timestamp**: Date and time of match completion

## Use Cases
- Player match history display
- Recent games panel
- Statistics overview
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    game: { control: 'object', description: 'Game history entry data' },
    onViewReplay: { action: 'view replay', description: 'Called when replay button clicked' },
    onViewDetails: { action: 'view details', description: 'Called when card clicked' },
  },
} satisfies Meta<typeof MatchCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// WIN/LOSS VARIANTS
// =============================================================================

export const WinAndLoss: Story = {
  name: 'Win vs Loss Comparison',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] space-y-6">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Match Results</h3>

      <div className="grid grid-cols-2 gap-4 max-w-[700px]">
        {/* Victory */}
        <div>
          <p className="text-green-400 text-sm mb-2">Victory</p>
          <MatchCard
            game={createMockGame({
              won_game: true,
              team1_score: 41,
              team2_score: 28,
              tricks_won: 14,
              points_earned: 28,
              bet_amount: 9,
              bet_won: true,
            })}
            onViewReplay={() => {}}
          />
        </div>

        {/* Defeat */}
        <div>
          <p className="text-red-400 text-sm mb-2">Defeat</p>
          <MatchCard
            game={createMockGame({
              won_game: false,
              team_id: 2,
              team1_score: 41,
              team2_score: 35,
              tricks_won: 8,
              points_earned: 18,
              bet_amount: 7,
              bet_won: false,
            })}
            onViewReplay={() => {}}
          />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// TEAM VARIANTS
// =============================================================================

export const TeamVariants: Story = {
  name: 'Team 1 vs Team 2',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] space-y-6">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Team Badges</h3>

      <div className="grid grid-cols-2 gap-4 max-w-[700px]">
        {/* Team 1 */}
        <div>
          <p className="text-orange-400 text-sm mb-2">Team 1 (Orange)</p>
          <MatchCard
            game={createMockGame({
              team_id: 1,
              won_game: true,
            })}
            onViewReplay={() => {}}
          />
        </div>

        {/* Team 2 */}
        <div>
          <p className="text-purple-400 text-sm mb-2">Team 2 (Purple)</p>
          <MatchCard
            game={createMockGame({
              team_id: 2,
              won_game: true,
              team1_score: 35,
              team2_score: 41,
            })}
            onViewReplay={() => {}}
          />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// BET RESULTS
// =============================================================================

export const BetResults: Story = {
  name: 'Bet Results Variants',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] space-y-6">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Bet Outcomes</h3>

      <div className="grid grid-cols-3 gap-4 max-w-[900px]">
        {/* Bet Won */}
        <div>
          <p className="text-green-400 text-sm mb-2">Bet Won ✓</p>
          <MatchCard
            game={createMockGame({
              bet_amount: 10,
              bet_won: true,
            })}
            onViewReplay={() => {}}
          />
        </div>

        {/* Bet Lost */}
        <div>
          <p className="text-red-400 text-sm mb-2">Bet Lost ✗</p>
          <MatchCard
            game={createMockGame({
              bet_amount: 8,
              bet_won: false,
            })}
            onViewReplay={() => {}}
          />
        </div>

        {/* No Bet */}
        <div>
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">No Bet (opponent bet)</p>
          <MatchCard
            game={createMockGame({
              bet_amount: null,
              bet_won: null,
            })}
            onViewReplay={() => {}}
          />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// SCORE VARIATIONS
// =============================================================================

export const ScoreVariations: Story = {
  name: 'Score Variations',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] space-y-4">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">
        Different Score Scenarios
      </h3>

      <div className="space-y-4 max-w-[350px]">
        {/* Close game */}
        <div>
          <p className="text-[var(--color-text-secondary)] text-xs mb-1">Close Game</p>
          <MatchCard
            game={createMockGame({
              team1_score: 41,
              team2_score: 39,
              rounds: 8,
            })}
            onViewReplay={() => {}}
          />
        </div>

        {/* Blowout */}
        <div>
          <p className="text-[var(--color-text-secondary)] text-xs mb-1">Dominant Win</p>
          <MatchCard
            game={createMockGame({
              team1_score: 41,
              team2_score: 12,
              rounds: 3,
            })}
            onViewReplay={() => {}}
          />
        </div>

        {/* Long game */}
        <div>
          <p className="text-[var(--color-text-secondary)] text-xs mb-1">Marathon Game</p>
          <MatchCard
            game={createMockGame({
              team1_score: 41,
              team2_score: 40,
              rounds: 12,
              tricks_won: 28,
              points_earned: 52,
            })}
            onViewReplay={() => {}}
          />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// INTERACTIVE OPTIONS
// =============================================================================

export const WithReplayButton: Story = {
  name: 'With Replay Button',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] max-w-[350px]">
      <MatchCard
        game={createMockGame()}
        onViewReplay={(gameId) => alert(`Viewing replay for game: ${gameId}`)}
      />
    </div>
  ),
};

export const Clickable: Story = {
  name: 'Clickable Card',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] max-w-[350px]">
      <p className="text-[var(--color-text-secondary)] text-sm mb-3">
        Click the card to view details:
      </p>
      <MatchCard
        game={createMockGame()}
        onViewDetails={(gameId) => alert(`Viewing details for game: ${gameId}`)}
      />
    </div>
  ),
};

export const FullInteractive: Story = {
  name: 'Full Interactive (Card + Replay)',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] max-w-[350px]">
      <p className="text-[var(--color-text-secondary)] text-sm mb-3">
        Card is clickable, replay button is separate:
      </p>
      <MatchCard
        game={createMockGame()}
        onViewDetails={(gameId) => alert(`Viewing details for game: ${gameId}`)}
        onViewReplay={(gameId) => alert(`Viewing replay for game: ${gameId}`)}
      />
    </div>
  ),
};

// =============================================================================
// MATCH HISTORY LIST
// =============================================================================

export const MatchHistoryList: Story = {
  name: 'Match History List',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[400px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Recent Matches</h3>

      <div className="space-y-4">
        <MatchCard
          game={createMockGame({
            game_id: 'game-1',
            won_game: true,
            team1_score: 41,
            team2_score: 28,
            finished_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
          })}
          onViewReplay={() => {}}
          onViewDetails={() => {}}
        />

        <MatchCard
          game={createMockGame({
            game_id: 'game-2',
            won_game: false,
            team_id: 2,
            team1_score: 41,
            team2_score: 35,
            finished_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          })}
          onViewReplay={() => {}}
          onViewDetails={() => {}}
        />

        <MatchCard
          game={createMockGame({
            game_id: 'game-3',
            won_game: true,
            team1_score: 41,
            team2_score: 15,
            rounds: 3,
            finished_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          })}
          onViewReplay={() => {}}
          onViewDetails={() => {}}
        />
      </div>
    </div>
  ),
};

// =============================================================================
// INTERACTIVE STORY
// =============================================================================

export const Default: Story = {
  args: {
    game: createMockGame(),
  },
  decorators: [
    (Story) => (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] max-w-[350px]">
        <Story />
      </div>
    ),
  ],
};

export const Victory: Story = {
  args: {
    game: createMockGame({
      won_game: true,
      team1_score: 41,
      team2_score: 25,
    }),
  },
  decorators: [
    (Story) => (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] max-w-[350px]">
        <Story />
      </div>
    ),
  ],
};

export const Defeat: Story = {
  args: {
    game: createMockGame({
      won_game: false,
      team_id: 2,
      team1_score: 41,
      team2_score: 30,
    }),
  },
  decorators: [
    (Story) => (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] max-w-[350px]">
        <Story />
      </div>
    ),
  ],
};

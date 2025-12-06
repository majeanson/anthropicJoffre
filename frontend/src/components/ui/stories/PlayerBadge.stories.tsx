/**
 * PlayerBadge Component Stories
 *
 * Compact player identifier badges with team colors and status indicators.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { PlayerBadge } from '../../PlayerBadge';

const meta = {
  title: 'Game/PlayerBadge',
  component: PlayerBadge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# PlayerBadge Component

A compact badge for displaying player identity with team colors and status indicators.

## Features
- **Team Colors**: Orange (Team 1) and Purple (Team 2)
- **Bot Indicator**: Robot emoji with difficulty level
- **Difficulty Levels**: Easy (green), Medium (yellow), Hard (red)
- **Thinking State**: Animated thought bubble when bot is deciding
- **Current Turn**: Scale animation highlight
- **Two Modes**: Compact (stacked) and expanded (inline)

## Use Cases
- Game board player identification
- Betting phase player indicators
- Score displays
- Turn order visualization
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    name: { control: 'text', description: 'Player name' },
    teamId: { control: 'select', options: [1, 2], description: 'Team assignment' },
    isBot: { control: 'boolean', description: 'Is this a bot player?' },
    botDifficulty: {
      control: 'select',
      options: ['easy', 'medium', 'hard'],
      description: 'Bot difficulty level',
    },
    isThinking: { control: 'boolean', description: 'Is the bot currently thinking?' },
    isCurrentTurn: { control: 'boolean', description: "Is it this player's turn?" },
    compact: { control: 'boolean', description: 'Use compact (stacked) layout?' },
  },
} satisfies Meta<typeof PlayerBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// TEAM COLORS
// =============================================================================

export const TeamColors: Story = {
  name: 'Team Colors',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] space-y-6">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Team Color Badges</h3>

      <div className="flex gap-8">
        <div className="p-4 rounded-lg bg-orange-900/20 border border-orange-500/30">
          <h4 className="text-orange-400 text-sm mb-3">Team 1 (Orange)</h4>
          <div className="flex gap-4">
            <PlayerBadge name="Alice" teamId={1} />
            <PlayerBadge name="Charlie" teamId={1} />
          </div>
        </div>

        <div className="p-4 rounded-lg bg-purple-900/20 border border-purple-500/30">
          <h4 className="text-purple-400 text-sm mb-3">Team 2 (Purple)</h4>
          <div className="flex gap-4">
            <PlayerBadge name="Bob" teamId={2} />
            <PlayerBadge name="Diana" teamId={2} />
          </div>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// BOT INDICATORS
// =============================================================================

export const BotDifficulties: Story = {
  name: 'Bot Difficulty Levels',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] space-y-6">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">
        Bot Difficulty Indicators
      </h3>

      <div className="flex gap-6">
        <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] text-center">
          <PlayerBadge name="Bot_Easy" teamId={1} isBot={true} botDifficulty="easy" />
          <p className="text-green-400 text-xs mt-2">Easy 🟢</p>
        </div>

        <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] text-center">
          <PlayerBadge name="Bot_Med" teamId={2} isBot={true} botDifficulty="medium" />
          <p className="text-yellow-400 text-xs mt-2">Medium 🟡</p>
        </div>

        <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] text-center">
          <PlayerBadge name="Bot_Hard" teamId={1} isBot={true} botDifficulty="hard" />
          <p className="text-red-400 text-xs mt-2">Hard 🔴</p>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// STATUS STATES
// =============================================================================

export const StatusStates: Story = {
  name: 'Status States',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] space-y-6">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Player Status States</h3>

      <div className="grid grid-cols-4 gap-4">
        {/* Normal */}
        <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] text-center">
          <p className="text-[var(--color-text-secondary)] text-xs mb-3">Normal</p>
          <PlayerBadge name="Alice" teamId={1} />
        </div>

        {/* Current Turn */}
        <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] text-center">
          <p className="text-[var(--color-text-secondary)] text-xs mb-3">Current Turn</p>
          <PlayerBadge name="Bob" teamId={2} isCurrentTurn={true} />
        </div>

        {/* Bot Thinking */}
        <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] text-center">
          <p className="text-[var(--color-text-secondary)] text-xs mb-3">Bot Thinking</p>
          <PlayerBadge
            name="Bot_Med"
            teamId={1}
            isBot={true}
            botDifficulty="medium"
            isThinking={true}
          />
        </div>

        {/* Bot Current Turn + Thinking */}
        <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] text-center">
          <p className="text-[var(--color-text-secondary)] text-xs mb-3">Turn + Thinking</p>
          <PlayerBadge
            name="Bot_Hard"
            teamId={2}
            isBot={true}
            botDifficulty="hard"
            isThinking={true}
            isCurrentTurn={true}
          />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// COMPACT VS EXPANDED
// =============================================================================

export const LayoutModes: Story = {
  name: 'Compact vs Expanded Layout',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] space-y-8">
      {/* Compact Layout */}
      <div>
        <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">
          Compact Layout (Default)
        </h3>
        <div className="flex gap-6 p-4 rounded-lg bg-[var(--color-bg-secondary)]">
          <PlayerBadge name="Alice" teamId={1} compact={true} />
          <PlayerBadge
            name="Bot_Easy"
            teamId={2}
            isBot={true}
            botDifficulty="easy"
            compact={true}
          />
          <PlayerBadge name="Bob" teamId={1} isCurrentTurn={true} compact={true} />
          <PlayerBadge
            name="Bot_Hard"
            teamId={2}
            isBot={true}
            botDifficulty="hard"
            isThinking={true}
            compact={true}
          />
        </div>
      </div>

      {/* Expanded Layout */}
      <div>
        <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Expanded Layout</h3>
        <div className="space-y-2 p-4 rounded-lg bg-[var(--color-bg-secondary)]">
          <PlayerBadge name="Alice" teamId={1} compact={false} />
          <PlayerBadge
            name="Bot_Easy"
            teamId={2}
            isBot={true}
            botDifficulty="easy"
            compact={false}
          />
          <PlayerBadge name="Bob" teamId={1} isCurrentTurn={true} compact={false} />
          <PlayerBadge
            name="Bot_Hard"
            teamId={2}
            isBot={true}
            botDifficulty="hard"
            isThinking={true}
            compact={false}
          />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// USE CASE EXAMPLES
// =============================================================================

export const BettingPhaseLayout: Story = {
  name: 'Betting Phase Example',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[500px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">
        Betting Phase - Player Order
      </h3>

      <div className="flex justify-between items-center p-4 rounded-lg bg-[var(--color-bg-secondary)]">
        <PlayerBadge name="Alice" teamId={1} />
        <span className="text-[var(--color-text-tertiary)]">→</span>
        <PlayerBadge name="Bob" teamId={2} isCurrentTurn={true} />
        <span className="text-[var(--color-text-tertiary)]">→</span>
        <PlayerBadge name="Bot_Med" teamId={1} isBot={true} botDifficulty="medium" />
        <span className="text-[var(--color-text-tertiary)]">→</span>
        <PlayerBadge name="Diana" teamId={2} />
      </div>

      <p className="text-[var(--color-text-secondary)] text-sm mt-3 text-center">
        Bob's turn to bet
      </p>
    </div>
  ),
};

export const ScoreDisplay: Story = {
  name: 'Score Display Example',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[400px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Round Scores</h3>

      <div className="space-y-3">
        {[
          { name: 'Alice', team: 1 as const, tricks: 3, points: 4 },
          { name: 'Bob', team: 2 as const, tricks: 2, points: 2 },
          {
            name: 'Bot_Med',
            team: 1 as const,
            tricks: 1,
            points: 1,
            isBot: true,
            difficulty: 'medium' as const,
          },
          { name: 'Diana', team: 2 as const, tricks: 2, points: 2 },
        ].map((player) => (
          <div
            key={player.name}
            className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-bg-secondary)]"
          >
            <PlayerBadge
              name={player.name}
              teamId={player.team}
              isBot={player.isBot}
              botDifficulty={player.difficulty}
            />
            <div className="text-right">
              <p className="text-[var(--color-text-primary)] font-bold">{player.points} pts</p>
              <p className="text-[var(--color-text-tertiary)] text-xs">{player.tricks} tricks</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const TurnOrderCircle: Story = {
  name: 'Turn Order Circle',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4 text-center">
        Turn Order
      </h3>

      <div className="relative w-[300px] h-[300px]">
        {/* Top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2">
          <PlayerBadge name="Alice" teamId={1} />
        </div>
        {/* Right */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2">
          <PlayerBadge name="Bob" teamId={2} isCurrentTurn={true} />
        </div>
        {/* Bottom */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
          <PlayerBadge name="Charlie" teamId={1} />
        </div>
        {/* Left */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2">
          <PlayerBadge name="Diana" teamId={2} />
        </div>

        {/* Center arrows */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-[var(--color-text-tertiary)] text-2xl">↻</div>
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
    name: 'Player1',
    teamId: 1,
    isBot: false,
    isThinking: false,
    isCurrentTurn: false,
    compact: true,
  },
  decorators: [
    (Story) => (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)]">
        <Story />
      </div>
    ),
  ],
};

export const BotPlayer: Story = {
  args: {
    name: 'Bot_Hard',
    teamId: 2,
    isBot: true,
    botDifficulty: 'hard',
    isThinking: true,
    isCurrentTurn: true,
    compact: true,
  },
  decorators: [
    (Story) => (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)]">
        <Story />
      </div>
    ),
  ],
};

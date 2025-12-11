/**
 * PlayerAvatar Component Stories
 *
 * In-game player avatar display combining avatar, name, and game indicators.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { PlayerAvatar } from '../../PlayerAvatar';

const meta = {
  title: 'Game/PlayerAvatar',
  component: PlayerAvatar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# PlayerAvatar Component

A comprehensive player display component for game interfaces, combining avatar with status indicators.

## Features
- **Avatar Display**: Shows user avatar (emoji or initials)
- **Team Indicator**: Color-coded team badges (Orange for Team 1, Purple for Team 2)
- **Online Status**: Green/gray dot for connection status
- **Bot Indicator**: Robot emoji badge for AI players
- **Dealer Badge**: Diamond indicator for current dealer
- **Turn Highlight**: Green ring when it's the player's turn
- **Two Variants**: Compact (avatar only) or Full (avatar + info)

## Use Cases
- Game board player positions
- Lobby player lists
- Team selection panels
- Leaderboards
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    playerName: { control: 'text', description: 'Player display name' },
    avatarUrl: { control: 'text', description: 'Avatar emoji or avatar ID' },
    teamId: { control: 'select', options: [null, 1, 2], description: 'Team assignment' },
    isBot: { control: 'boolean', description: 'Is this a bot player?' },
    isOnline: { control: 'boolean', description: 'Is player connected?' },
    isCurrentTurn: { control: 'boolean', description: "Is it this player's turn?" },
    isDealer: { control: 'boolean', description: 'Is this player the dealer?' },
    variant: { control: 'select', options: ['compact', 'full'], description: 'Display variant' },
    size: { control: 'select', options: ['sm', 'md', 'lg'], description: 'Avatar size' },
    clickable: { control: 'boolean', description: 'Make name clickable' },
  },
} satisfies Meta<typeof PlayerAvatar>;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// VARIANT SHOWCASE
// =============================================================================

export const AllVariants: Story = {
  name: 'All Variants',
  render: () => (
    <div className="p-6 rounded-lg bg-skin-primary space-y-8">
      {/* Full Variant */}
      <div>
        <h3 className="text-skin-primary font-semibold mb-4">Full Variant</h3>
        <div className="flex flex-wrap gap-6">
          <PlayerAvatar playerName="Alice" avatarUrl="fox" teamId={1} variant="full" />
          <PlayerAvatar playerName="Bob" avatarUrl="ninja" teamId={2} variant="full" />
          <PlayerAvatar
            playerName="Bot_Easy"
            avatarUrl="robot"
            teamId={1}
            isBot={true}
            variant="full"
          />
        </div>
      </div>

      {/* Compact Variant */}
      <div>
        <h3 className="text-skin-primary font-semibold mb-4">Compact Variant</h3>
        <div className="flex flex-wrap gap-4">
          <PlayerAvatar playerName="Alice" avatarUrl="fox" teamId={1} variant="compact" />
          <PlayerAvatar playerName="Bob" avatarUrl="ninja" teamId={2} variant="compact" />
          <PlayerAvatar
            playerName="Bot_Easy"
            avatarUrl="robot"
            teamId={1}
            isBot={true}
            variant="compact"
          />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// STATUS INDICATORS
// =============================================================================

export const StatusIndicators: Story = {
  name: 'Status Indicators',
  render: () => (
    <div className="p-6 rounded-lg bg-skin-primary space-y-6">
      <h3 className="text-skin-primary font-semibold mb-4">Player Status Indicators</h3>

      <div className="grid grid-cols-2 gap-6">
        {/* Online Status */}
        <div className="p-4 rounded-lg bg-skin-secondary">
          <h4 className="text-skin-muted text-sm mb-3">Online Status</h4>
          <div className="flex gap-4">
            <PlayerAvatar
              playerName="Online"
              avatarUrl="lion"
              teamId={1}
              isOnline={true}
              variant="compact"
              size="lg"
            />
            <PlayerAvatar
              playerName="Offline"
              avatarUrl="wolf"
              teamId={2}
              isOnline={false}
              variant="compact"
              size="lg"
            />
          </div>
        </div>

        {/* Bot Indicator */}
        <div className="p-4 rounded-lg bg-skin-secondary">
          <h4 className="text-skin-muted text-sm mb-3">Bot Indicator</h4>
          <div className="flex gap-4">
            <PlayerAvatar
              playerName="Human"
              avatarUrl="mage"
              teamId={1}
              isBot={false}
              variant="compact"
              size="lg"
            />
            <PlayerAvatar
              playerName="Bot"
              avatarUrl="robot"
              teamId={2}
              isBot={true}
              variant="compact"
              size="lg"
            />
          </div>
        </div>

        {/* Current Turn */}
        <div className="p-4 rounded-lg bg-skin-secondary">
          <h4 className="text-skin-muted text-sm mb-3">Current Turn Highlight</h4>
          <div className="flex gap-4">
            <PlayerAvatar
              playerName="Waiting"
              avatarUrl="dragon"
              teamId={1}
              isCurrentTurn={false}
              variant="compact"
              size="lg"
            />
            <PlayerAvatar
              playerName="Active"
              avatarUrl="unicorn"
              teamId={2}
              isCurrentTurn={true}
              variant="compact"
              size="lg"
            />
          </div>
        </div>

        {/* Dealer Indicator */}
        <div className="p-4 rounded-lg bg-skin-secondary">
          <h4 className="text-skin-muted text-sm mb-3">Dealer Indicator</h4>
          <div className="flex gap-4">
            <PlayerAvatar
              playerName="Regular"
              avatarUrl="crown"
              teamId={1}
              isDealer={false}
              variant="compact"
              size="lg"
            />
            <PlayerAvatar
              playerName="Dealer"
              avatarUrl="trophy"
              teamId={2}
              isDealer={true}
              variant="compact"
              size="lg"
            />
          </div>
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
    <div className="p-6 rounded-lg bg-skin-primary space-y-6">
      <h3 className="text-skin-primary font-semibold mb-4">Team Color Indicators</h3>

      <div className="grid grid-cols-3 gap-6">
        {/* Team 1 */}
        <div className="p-4 rounded-lg bg-orange-500/20 border border-orange-500/30">
          <h4 className="text-orange-400 text-sm mb-3">Team 1 (Orange)</h4>
          <div className="space-y-3">
            <PlayerAvatar playerName="Alice" avatarUrl="fox" teamId={1} variant="full" />
            <PlayerAvatar playerName="Charlie" avatarUrl="lion" teamId={1} variant="full" />
          </div>
        </div>

        {/* Team 2 */}
        <div className="p-4 rounded-lg bg-purple-500/20 border border-purple-500/30">
          <h4 className="text-purple-400 text-sm mb-3">Team 2 (Purple)</h4>
          <div className="space-y-3">
            <PlayerAvatar playerName="Bob" avatarUrl="ninja" teamId={2} variant="full" />
            <PlayerAvatar playerName="Diana" avatarUrl="mage" teamId={2} variant="full" />
          </div>
        </div>

        {/* No Team */}
        <div className="p-4 rounded-lg bg-skin-secondary border border-skin-default">
          <h4 className="text-skin-muted text-sm mb-3">No Team</h4>
          <div className="space-y-3">
            <PlayerAvatar playerName="Spectator" avatarUrl="ghost" variant="full" />
            <PlayerAvatar playerName="Waiting" avatarUrl="alien" variant="full" />
          </div>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// SIZE VARIANTS
// =============================================================================

export const AllSizes: Story = {
  name: 'All Sizes',
  render: () => (
    <div className="p-6 rounded-lg bg-skin-primary space-y-6">
      <h3 className="text-skin-primary font-semibold mb-4">Size Variants</h3>

      <div className="flex items-end gap-8">
        <div className="flex flex-col items-center gap-2">
          <PlayerAvatar playerName="Small" avatarUrl="fox" teamId={1} size="sm" variant="compact" />
          <span className="text-xs text-skin-muted">Small</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <PlayerAvatar
            playerName="Medium"
            avatarUrl="lion"
            teamId={2}
            size="md"
            variant="compact"
          />
          <span className="text-xs text-skin-muted">Medium</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <PlayerAvatar
            playerName="Large"
            avatarUrl="dragon"
            teamId={1}
            size="lg"
            variant="compact"
          />
          <span className="text-xs text-skin-muted">Large</span>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// USE CASE EXAMPLES
// =============================================================================

export const GameBoardLayout: Story = {
  name: 'Game Board Layout',
  render: () => (
    <div className="p-6 rounded-lg bg-skin-primary w-[600px]">
      <h3 className="text-skin-primary font-semibold mb-6 text-center">Game Board - 4 Players</h3>

      {/* Circular arrangement */}
      <div className="relative h-[400px]">
        {/* Top player */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2">
          <PlayerAvatar
            playerName="Alice"
            avatarUrl="fox"
            teamId={1}
            isDealer={true}
            variant="full"
          />
        </div>

        {/* Right player */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2">
          <PlayerAvatar
            playerName="Bob"
            avatarUrl="ninja"
            teamId={2}
            isCurrentTurn={true}
            variant="full"
          />
        </div>

        {/* Bottom player */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
          <PlayerAvatar playerName="Charlie" avatarUrl="lion" teamId={1} variant="full" />
        </div>

        {/* Left player */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2">
          <PlayerAvatar
            playerName="Bot_Hard"
            avatarUrl="robot"
            teamId={2}
            isBot={true}
            variant="full"
          />
        </div>

        {/* Center indicator */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-skin-muted text-sm">
          Game Board
        </div>
      </div>
    </div>
  ),
};

export const LobbyPlayerList: Story = {
  name: 'Lobby Player List',
  render: () => (
    <div className="p-6 rounded-lg bg-skin-primary w-[350px]">
      <h3 className="text-skin-primary font-semibold mb-4">Players in Lobby</h3>

      <div className="space-y-2">
        {[
          { name: 'DragonSlayer99', avatar: 'dragon', team: 1 as const, online: true },
          { name: 'NinjaWarrior', avatar: 'ninja', team: 2 as const, online: true },
          { name: 'Bot_Easy', avatar: 'robot', team: 1 as const, online: true, isBot: true },
          { name: 'AFK_Player', avatar: 'ghost', team: 2 as const, online: false },
        ].map((player, i) => (
          <div
            key={player.name}
            className="flex items-center justify-between p-2 rounded-lg bg-skin-secondary"
          >
            <PlayerAvatar
              playerName={player.name}
              avatarUrl={player.avatar}
              teamId={player.team}
              isBot={player.isBot}
              isOnline={player.online}
              variant="full"
              size="sm"
            />
            <span className="text-xs text-skin-muted">#{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const MixedStates: Story = {
  name: 'Mixed States (All Features)',
  render: () => (
    <div className="p-6 rounded-lg bg-skin-primary">
      <h3 className="text-skin-primary font-semibold mb-4">Player with All Indicators</h3>

      <div className="flex gap-8">
        <div className="p-4 rounded-lg bg-skin-secondary">
          <p className="text-skin-muted text-xs mb-2">Current Turn + Dealer + Team 1</p>
          <PlayerAvatar
            playerName="Alice"
            avatarUrl="crown"
            teamId={1}
            isCurrentTurn={true}
            isDealer={true}
            isOnline={true}
            variant="full"
            size="lg"
          />
        </div>

        <div className="p-4 rounded-lg bg-skin-secondary">
          <p className="text-skin-muted text-xs mb-2">Bot + Team 2 + Offline</p>
          <PlayerAvatar
            playerName="Bot_Medium"
            avatarUrl="robot"
            teamId={2}
            isBot={true}
            isOnline={false}
            variant="full"
            size="lg"
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
    playerName: 'Player1',
    avatarUrl: 'fox',
    teamId: 1,
    isBot: false,
    isOnline: true,
    isCurrentTurn: false,
    isDealer: false,
    variant: 'full',
    size: 'md',
    clickable: false,
  },
  decorators: [
    (Story) => (
      <div className="p-6 rounded-lg bg-skin-primary">
        <Story />
      </div>
    ),
  ],
};

/**
 * PlayerNameButton Component Stories
 *
 * Clickable player name component with multiple display variants.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { PlayerNameButton } from '../../PlayerNameButton';
import Avatar from '../../Avatar';

const meta = {
  title: 'UI/PlayerNameButton',
  component: PlayerNameButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# PlayerNameButton Component

An interactive, clickable player name component for opening player profiles.

## Features
- **Three Variants**: inline, badge, and plain styles
- **Hover Effects**: Visual feedback on interaction
- **Click Handling**: Opens player profile (customizable via onClick)
- **Accessibility**: Keyboard navigation and screen reader support
- **Click Isolation**: Prevents event propagation to parent elements

## Variants
- **inline**: Orange text with underline on hover (default)
- **badge**: Contained badge with background and border
- **plain**: Simple white text that turns orange on hover

## Use Cases
- Chat messages with clickable sender names
- Leaderboards with player links
- Game history displays
- Social panels
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    playerName: { control: 'text', description: 'Player name to display' },
    variant: {
      control: 'select',
      options: ['inline', 'badge', 'plain'],
      description: 'Display variant',
    },
    onClick: { action: 'clicked', description: 'Click handler (opens profile)' },
    className: { control: 'text', description: 'Additional CSS classes' },
  },
} satisfies Meta<typeof PlayerNameButton>;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// VARIANT SHOWCASE
// =============================================================================

export const AllVariants: Story = {
  name: 'All Variants',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] space-y-6">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Display Variants</h3>

      <div className="space-y-4">
        {/* Inline */}
        <div className="flex items-center gap-4 p-3 rounded-lg bg-[var(--color-bg-secondary)]">
          <span className="w-20 text-[var(--color-text-secondary)] text-sm">Inline:</span>
          <PlayerNameButton
            playerName="DragonSlayer99"
            onClick={() => alert('Opening profile for DragonSlayer99')}
            variant="inline"
          />
        </div>

        {/* Badge */}
        <div className="flex items-center gap-4 p-3 rounded-lg bg-[var(--color-bg-secondary)]">
          <span className="w-20 text-[var(--color-text-secondary)] text-sm">Badge:</span>
          <PlayerNameButton
            playerName="DragonSlayer99"
            onClick={() => alert('Opening profile for DragonSlayer99')}
            variant="badge"
          />
        </div>

        {/* Plain */}
        <div className="flex items-center gap-4 p-3 rounded-lg bg-[var(--color-bg-secondary)]">
          <span className="w-20 text-[var(--color-text-secondary)] text-sm">Plain:</span>
          <PlayerNameButton
            playerName="DragonSlayer99"
            onClick={() => alert('Opening profile for DragonSlayer99')}
            variant="plain"
          />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// USE CASE EXAMPLES
// =============================================================================

export const InChatMessage: Story = {
  name: 'In Chat Message',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[400px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Chat Messages</h3>

      <div className="space-y-3">
        {/* Message 1 */}
        <div className="flex gap-3">
          <Avatar username="Alice" avatarUrl="fox" size="sm" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <PlayerNameButton playerName="Alice" onClick={() => {}} variant="inline" />
              <span className="text-[var(--color-text-tertiary)] text-xs">2:34 PM</span>
            </div>
            <p className="text-[var(--color-text-primary)] text-sm">Great game everyone!</p>
          </div>
        </div>

        {/* Message 2 */}
        <div className="flex gap-3">
          <Avatar username="Bob" avatarUrl="ninja" size="sm" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <PlayerNameButton playerName="Bob" onClick={() => {}} variant="inline" />
              <span className="text-[var(--color-text-tertiary)] text-xs">2:35 PM</span>
            </div>
            <p className="text-[var(--color-text-primary)] text-sm">
              GG! That last trick was clutch
            </p>
          </div>
        </div>

        {/* Message 3 - Mention */}
        <div className="flex gap-3">
          <Avatar username="Charlie" avatarUrl="dragon" size="sm" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <PlayerNameButton playerName="Charlie" onClick={() => {}} variant="inline" />
              <span className="text-[var(--color-text-tertiary)] text-xs">2:36 PM</span>
            </div>
            <p className="text-[var(--color-text-primary)] text-sm">
              Nice play <PlayerNameButton playerName="Alice" onClick={() => {}} variant="inline" />!
              Rematch?
            </p>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const InLeaderboard: Story = {
  name: 'In Leaderboard',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[350px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Leaderboard</h3>

      <div className="space-y-2">
        {[
          { rank: 1, name: 'ChampionX', wins: 142, color: 'text-yellow-400' },
          { rank: 2, name: 'ProGamer', wins: 128, color: 'text-gray-300' },
          { rank: 3, name: 'CardMaster', wins: 115, color: 'text-amber-600' },
          { rank: 4, name: 'LuckyDice', wins: 98, color: 'text-[var(--color-text-secondary)]' },
          { rank: 5, name: 'StarPlayer', wins: 87, color: 'text-[var(--color-text-secondary)]' },
        ].map((player) => (
          <div
            key={player.rank}
            className="flex items-center gap-3 p-2 rounded-lg bg-[var(--color-bg-secondary)]"
          >
            <span className={`w-8 text-center font-bold ${player.color}`}>#{player.rank}</span>
            <PlayerNameButton playerName={player.name} onClick={() => {}} variant="plain" />
            <span className="text-[var(--color-text-tertiary)] text-sm ml-auto">
              {player.wins} W
            </span>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const InGameHistory: Story = {
  name: 'In Game History',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[450px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Recent Games</h3>

      <div className="space-y-3">
        {[
          {
            id: 1,
            team1: ['Alice', 'Charlie'],
            team2: ['Bob', 'Diana'],
            winner: 1,
            score: '41-32',
          },
          {
            id: 2,
            team1: ['Alice', 'Bob'],
            team2: ['Charlie', 'Diana'],
            winner: 2,
            score: '38-41',
          },
          {
            id: 3,
            team1: ['Alice', 'Diana'],
            team2: ['Bob', 'Charlie'],
            winner: 1,
            score: '41-28',
          },
        ].map((game) => (
          <div key={game.id} className="p-3 rounded-lg bg-[var(--color-bg-secondary)]">
            <div className="flex items-center justify-between">
              {/* Team 1 */}
              <div className={`flex gap-1 ${game.winner === 1 ? 'text-green-400' : ''}`}>
                <PlayerNameButton playerName={game.team1[0]} onClick={() => {}} variant="inline" />
                <span className="text-[var(--color-text-tertiary)]">&</span>
                <PlayerNameButton playerName={game.team1[1]} onClick={() => {}} variant="inline" />
              </div>

              {/* Score */}
              <span className="text-[var(--color-text-primary)] font-mono font-bold px-3">
                {game.score}
              </span>

              {/* Team 2 */}
              <div className={`flex gap-1 ${game.winner === 2 ? 'text-green-400' : ''}`}>
                <PlayerNameButton playerName={game.team2[0]} onClick={() => {}} variant="inline" />
                <span className="text-[var(--color-text-tertiary)]">&</span>
                <PlayerNameButton playerName={game.team2[1]} onClick={() => {}} variant="inline" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const BadgeVariantShowcase: Story = {
  name: 'Badge Variant Showcase',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Badge Variant Uses</h3>

      <div className="space-y-4">
        {/* Friend Request */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-secondary)]">
          <div className="flex items-center gap-3">
            <Avatar username="NewFriend" avatarUrl="unicorn" size="md" />
            <div>
              <p className="text-[var(--color-text-secondary)] text-sm">Friend request from</p>
              <PlayerNameButton playerName="NewFriend123" onClick={() => {}} variant="badge" />
            </div>
          </div>
          <button className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm">
            Accept
          </button>
        </div>

        {/* Game Invite */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-secondary)]">
          <div className="flex items-center gap-3">
            <Avatar username="Inviter" avatarUrl="crown" size="md" />
            <div>
              <PlayerNameButton playerName="GameMaster99" onClick={() => {}} variant="badge" />
              <p className="text-[var(--color-text-secondary)] text-sm">invited you to play</p>
            </div>
          </div>
          <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">
            Join
          </button>
        </div>
      </div>
    </div>
  ),
};

export const WithCustomContent: Story = {
  name: 'With Custom Content',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Custom Content</h3>

      <div className="space-y-4">
        {/* With Avatar */}
        <div className="p-3 rounded-lg bg-[var(--color-bg-secondary)]">
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">Name with Avatar:</p>
          <PlayerNameButton playerName="DragonSlayer99" onClick={() => {}} variant="badge">
            <span className="flex items-center gap-2">
              <Avatar username="DragonSlayer99" avatarUrl="dragon" size="sm" />
              DragonSlayer99
            </span>
          </PlayerNameButton>
        </div>

        {/* With Emoji */}
        <div className="p-3 rounded-lg bg-[var(--color-bg-secondary)]">
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">Name with Emoji:</p>
          <PlayerNameButton playerName="VIPPlayer" onClick={() => {}} variant="badge">
            👑 VIPPlayer
          </PlayerNameButton>
        </div>

        {/* With Status */}
        <div className="p-3 rounded-lg bg-[var(--color-bg-secondary)]">
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">Name with Status:</p>
          <PlayerNameButton playerName="OnlinePlayer" onClick={() => {}} variant="badge">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              OnlinePlayer
            </span>
          </PlayerNameButton>
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
    playerName: 'DragonSlayer99',
    variant: 'inline',
  },
  decorators: [
    (Story) => (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)]">
        <p className="text-[var(--color-text-secondary)] mb-4">
          Click the name to trigger onClick:
        </p>
        <Story />
      </div>
    ),
  ],
};

export const InlineVariant: Story = {
  args: {
    playerName: 'InlinePlayer',
    variant: 'inline',
  },
  decorators: [
    (Story) => (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)]">
        <Story />
      </div>
    ),
  ],
};

export const BadgeVariant: Story = {
  args: {
    playerName: 'BadgePlayer',
    variant: 'badge',
  },
  decorators: [
    (Story) => (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)]">
        <Story />
      </div>
    ),
  ],
};

export const PlainVariant: Story = {
  args: {
    playerName: 'PlainPlayer',
    variant: 'plain',
  },
  decorators: [
    (Story) => (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)]">
        <Story />
      </div>
    ),
  ],
};

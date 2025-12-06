/**
 * Avatar Component Stories
 *
 * Displays user avatars with multiple display modes:
 * - Initials with gradient background (fallback)
 * - Emoji avatars (from avatar system)
 * - Custom image URLs
 */

import type { Meta, StoryObj } from '@storybook/react';
import Avatar from '../../Avatar';

const meta = {
  title: 'UI/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Avatar Component

A versatile avatar component that displays user identity through various methods.

## Display Modes
- **Initials**: Shows first 2 characters with a gradient background (based on username)
- **Emoji**: Displays emoji avatars from the avatar system
- **Image URL**: Loads external images with fallback handling

## Features
- 4 sizes: sm, md, lg, xl
- Consistent color generation from username
- Graceful fallback when images fail to load
- Support for avatar IDs from the avatar system
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    username: {
      control: 'text',
      description: 'Username to display (used for initials and color generation)',
    },
    avatarUrl: {
      control: 'text',
      description: 'Avatar URL, emoji, or avatar ID',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Size of the avatar',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// SIZE VARIANTS
// =============================================================================

export const AllSizes: Story = {
  name: 'All Sizes',
  render: () => (
    <div className="flex items-end gap-4 p-6 rounded-lg bg-[var(--color-bg-primary)]">
      <div className="flex flex-col items-center gap-2">
        <Avatar username="Alice" size="sm" />
        <span className="text-xs text-[var(--color-text-secondary)]">Small</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Avatar username="Bob" size="md" />
        <span className="text-xs text-[var(--color-text-secondary)]">Medium</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Avatar username="Charlie" size="lg" />
        <span className="text-xs text-[var(--color-text-secondary)]">Large</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Avatar username="Diana" size="xl" />
        <span className="text-xs text-[var(--color-text-secondary)]">X-Large</span>
      </div>
    </div>
  ),
};

// =============================================================================
// DISPLAY MODES
// =============================================================================

export const InitialsMode: Story = {
  name: 'Initials Mode (Fallback)',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">
        Gradient colors based on username
      </h3>
      <div className="flex flex-wrap gap-4">
        <Avatar username="Alice" size="lg" />
        <Avatar username="Bob" size="lg" />
        <Avatar username="Charlie" size="lg" />
        <Avatar username="Diana" size="lg" />
        <Avatar username="Edward" size="lg" />
        <Avatar username="Fiona" size="lg" />
        <Avatar username="George" size="lg" />
        <Avatar username="Hannah" size="lg" />
        <Avatar username="Ivan" size="lg" />
        <Avatar username="Julia" size="lg" />
      </div>
    </div>
  ),
};

export const EmojiMode: Story = {
  name: 'Emoji Mode (Direct)',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Direct emoji avatars</h3>
      <div className="flex flex-wrap gap-4">
        <Avatar username="Player1" avatarUrl="🦊" size="lg" />
        <Avatar username="Player2" avatarUrl="🐼" size="lg" />
        <Avatar username="Player3" avatarUrl="🦁" size="lg" />
        <Avatar username="Player4" avatarUrl="🐯" size="lg" />
        <Avatar username="Player5" avatarUrl="🐸" size="lg" />
        <Avatar username="Player6" avatarUrl="🦄" size="lg" />
        <Avatar username="Player7" avatarUrl="🐉" size="lg" />
        <Avatar username="Player8" avatarUrl="🤖" size="lg" />
      </div>
    </div>
  ),
};

export const AvatarIdMode: Story = {
  name: 'Avatar ID Mode',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">
        Using avatar IDs from the avatar system
      </h3>
      <div className="grid grid-cols-5 gap-4">
        {/* Animals */}
        <div className="flex flex-col items-center gap-1">
          <Avatar username="User" avatarUrl="fox" size="lg" />
          <span className="text-xs text-[var(--color-text-secondary)]">fox</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Avatar username="User" avatarUrl="lion" size="lg" />
          <span className="text-xs text-[var(--color-text-secondary)]">lion</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Avatar username="User" avatarUrl="dragon" size="lg" />
          <span className="text-xs text-[var(--color-text-secondary)]">dragon</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Avatar username="User" avatarUrl="unicorn" size="lg" />
          <span className="text-xs text-[var(--color-text-secondary)]">unicorn</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Avatar username="User" avatarUrl="wolf" size="lg" />
          <span className="text-xs text-[var(--color-text-secondary)]">wolf</span>
        </div>
        {/* Characters */}
        <div className="flex flex-col items-center gap-1">
          <Avatar username="User" avatarUrl="ninja" size="lg" />
          <span className="text-xs text-[var(--color-text-secondary)]">ninja</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Avatar username="User" avatarUrl="mage" size="lg" />
          <span className="text-xs text-[var(--color-text-secondary)]">mage</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Avatar username="User" avatarUrl="robot" size="lg" />
          <span className="text-xs text-[var(--color-text-secondary)]">robot</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Avatar username="User" avatarUrl="alien" size="lg" />
          <span className="text-xs text-[var(--color-text-secondary)]">alien</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Avatar username="User" avatarUrl="ghost" size="lg" />
          <span className="text-xs text-[var(--color-text-secondary)]">ghost</span>
        </div>
        {/* Objects */}
        <div className="flex flex-col items-center gap-1">
          <Avatar username="User" avatarUrl="crown" size="lg" />
          <span className="text-xs text-[var(--color-text-secondary)]">crown</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Avatar username="User" avatarUrl="trophy" size="lg" />
          <span className="text-xs text-[var(--color-text-secondary)]">trophy</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Avatar username="User" avatarUrl="rocket" size="lg" />
          <span className="text-xs text-[var(--color-text-secondary)]">rocket</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Avatar username="User" avatarUrl="fire" size="lg" />
          <span className="text-xs text-[var(--color-text-secondary)]">fire</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Avatar username="User" avatarUrl="dice" size="lg" />
          <span className="text-xs text-[var(--color-text-secondary)]">dice</span>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// CATEGORY SHOWCASE
// =============================================================================

export const AllCategories: Story = {
  name: 'Avatar Categories',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] space-y-6">
      {/* Animals */}
      <div>
        <h4 className="text-[var(--color-text-primary)] font-semibold mb-3 flex items-center gap-2">
          <span>🐾</span> Animals
        </h4>
        <div className="flex flex-wrap gap-3">
          {['dog', 'cat', 'fox', 'lion', 'tiger', 'bear', 'panda', 'koala', 'wolf', 'dragon'].map(
            (id) => (
              <Avatar key={id} username="User" avatarUrl={id} size="md" />
            )
          )}
        </div>
      </div>

      {/* Characters */}
      <div>
        <h4 className="text-[var(--color-text-primary)] font-semibold mb-3 flex items-center gap-2">
          <span>🧙</span> Characters
        </h4>
        <div className="flex flex-wrap gap-3">
          {[
            'ninja',
            'mage',
            'superhero',
            'detective',
            'robot',
            'alien',
            'ghost',
            'vampire',
            'elf',
            'fairy',
          ].map((id) => (
            <Avatar key={id} username="User" avatarUrl={id} size="md" />
          ))}
        </div>
      </div>

      {/* Objects */}
      <div>
        <h4 className="text-[var(--color-text-primary)] font-semibold mb-3 flex items-center gap-2">
          <span>💎</span> Objects
        </h4>
        <div className="flex flex-wrap gap-3">
          {[
            'crown',
            'gem',
            'trophy',
            'medal',
            'star',
            'fire',
            'lightning',
            'rocket',
            'sword',
            'shield',
          ].map((id) => (
            <Avatar key={id} username="User" avatarUrl={id} size="md" />
          ))}
        </div>
      </div>

      {/* Nature */}
      <div>
        <h4 className="text-[var(--color-text-primary)] font-semibold mb-3 flex items-center gap-2">
          <span>🌿</span> Nature
        </h4>
        <div className="flex flex-wrap gap-3">
          {[
            'sun',
            'moon',
            'rainbow',
            'cloud',
            'snowflake',
            'tree',
            'flower',
            'rose',
            'mushroom',
            'volcano',
          ].map((id) => (
            <Avatar key={id} username="User" avatarUrl={id} size="md" />
          ))}
        </div>
      </div>

      {/* Food */}
      <div>
        <h4 className="text-[var(--color-text-primary)] font-semibold mb-3 flex items-center gap-2">
          <span>🍕</span> Food
        </h4>
        <div className="flex flex-wrap gap-3">
          {[
            'pizza',
            'burger',
            'taco',
            'sushi',
            'ramen',
            'donut',
            'cake',
            'icecream',
            'coffee',
            'cookie',
          ].map((id) => (
            <Avatar key={id} username="User" avatarUrl={id} size="md" />
          ))}
        </div>
      </div>

      {/* Sports */}
      <div>
        <h4 className="text-[var(--color-text-primary)] font-semibold mb-3 flex items-center gap-2">
          <span>⚽</span> Sports & Games
        </h4>
        <div className="flex flex-wrap gap-3">
          {[
            'soccer',
            'basketball',
            'baseball',
            'football',
            'tennis',
            'bowling',
            'gaming',
            'chess',
            'cards',
            'target',
          ].map((id) => (
            <Avatar key={id} username="User" avatarUrl={id} size="md" />
          ))}
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// USE CASES
// =============================================================================

export const PlayerList: Story = {
  name: 'Player List Example',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-80">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Online Players</h3>
      <div className="space-y-3">
        {[
          { name: 'DragonSlayer99', avatar: 'dragon', status: 'online' },
          { name: 'NinjaWarrior', avatar: 'ninja', status: 'online' },
          { name: 'CrystalMage', avatar: 'mage', status: 'away' },
          { name: 'GhostHunter', avatar: 'ghost', status: 'offline' },
        ].map((player) => (
          <div
            key={player.name}
            className="flex items-center gap-3 p-2 rounded-lg bg-[var(--color-bg-secondary)]"
          >
            <div className="relative">
              <Avatar username={player.name} avatarUrl={player.avatar} size="md" />
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--color-bg-secondary)] ${
                  player.status === 'online'
                    ? 'bg-green-500'
                    : player.status === 'away'
                      ? 'bg-yellow-500'
                      : 'bg-gray-500'
                }`}
              />
            </div>
            <div>
              <p className="text-[var(--color-text-primary)] font-medium">{player.name}</p>
              <p className="text-xs text-[var(--color-text-tertiary)] capitalize">
                {player.status}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const GameLobby: Story = {
  name: 'Game Lobby Example',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">
        Game Lobby - Team Selection
      </h3>
      <div className="grid grid-cols-2 gap-6">
        {/* Team 1 */}
        <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
          <h4 className="text-orange-400 font-semibold mb-3">Team 1</h4>
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <Avatar username="Alice" avatarUrl="fox" size="lg" />
              <span className="text-sm text-[var(--color-text-primary)] mt-1">Alice</span>
            </div>
            <div className="flex flex-col items-center">
              <Avatar username="Charlie" avatarUrl="lion" size="lg" />
              <span className="text-sm text-[var(--color-text-primary)] mt-1">Charlie</span>
            </div>
          </div>
        </div>

        {/* Team 2 */}
        <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
          <h4 className="text-purple-400 font-semibold mb-3">Team 2</h4>
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <Avatar username="Bob" avatarUrl="ninja" size="lg" />
              <span className="text-sm text-[var(--color-text-primary)] mt-1">Bob</span>
            </div>
            <div className="flex flex-col items-center">
              <Avatar username="Diana" avatarUrl="mage" size="lg" />
              <span className="text-sm text-[var(--color-text-primary)] mt-1">Diana</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const LeaderboardEntry: Story = {
  name: 'Leaderboard Entry Example',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-96">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Top Players</h3>
      <div className="space-y-2">
        {[
          { rank: 1, name: 'ChampionX', avatar: 'crown', wins: 142, color: 'text-yellow-400' },
          { rank: 2, name: 'ProGamer', avatar: 'trophy', wins: 128, color: 'text-gray-300' },
          { rank: 3, name: 'CardMaster', avatar: 'cards', wins: 115, color: 'text-amber-600' },
          {
            rank: 4,
            name: 'LuckyDice',
            avatar: 'dice',
            wins: 98,
            color: 'text-[var(--color-text-secondary)]',
          },
          {
            rank: 5,
            name: 'StarPlayer',
            avatar: 'star',
            wins: 87,
            color: 'text-[var(--color-text-secondary)]',
          },
        ].map((player) => (
          <div
            key={player.rank}
            className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-secondary)]"
          >
            <span className={`w-6 text-center font-bold ${player.color}`}>#{player.rank}</span>
            <Avatar username={player.name} avatarUrl={player.avatar} size="sm" />
            <span className="text-[var(--color-text-primary)] flex-1">{player.name}</span>
            <span className="text-[var(--color-text-secondary)] text-sm">{player.wins} wins</span>
          </div>
        ))}
      </div>
    </div>
  ),
};

// =============================================================================
// INTERACTIVE
// =============================================================================

export const Default: Story = {
  args: {
    username: 'JohnDoe',
    size: 'lg',
  },
};

export const WithEmoji: Story = {
  args: {
    username: 'JohnDoe',
    avatarUrl: '🦊',
    size: 'lg',
  },
};

export const WithAvatarId: Story = {
  args: {
    username: 'JohnDoe',
    avatarUrl: 'dragon',
    size: 'lg',
  },
};

/**
 * GameHeader Component Stories
 *
 * Game information header with scores, bet info, and action buttons.
 * Adapts to the currently selected skin theme.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { GameHeader } from '../../GameHeader';
import { SettingsProvider } from '../../../contexts/SettingsContext';

const meta: Meta<typeof GameHeader> = {
  title: 'Components/GameHeader',
  component: GameHeader,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Game Header Component

Displays game information and action buttons. Adapts to the selected skin theme.

## Features
- **Game ID**: Copy-to-clipboard functionality
- **Round indicator**: Current round number
- **Team scores**: Animated score changes
- **Bet/Trump info**: Current bet amount and trump suit
- **Action buttons**: Chat, leaderboard, achievements, friends, settings

Use the skin selector in the toolbar to see how the header adapts to different themes.
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <SettingsProvider>
        <div className="min-h-[200px] bg-skin-primary">
          <Story />
          <div className="p-4 mt-4 rounded m-4 bg-skin-secondary border border-skin-default">
            <p className="text-sm text-skin-muted">
              Content below header - score animations should appear above this
            </p>
          </div>
        </div>
      </SettingsProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GameHeader>;

/**
 * Default state with all buttons
 */
export const Default: Story = {
  args: {
    gameId: 'ABC123XY',
    roundNumber: 3,
    team1Score: 25,
    team2Score: 18,
    onLeaveGame: () => alert('Leave game'),
    onOpenLeaderboard: () => alert('Open leaderboard'),
    onOpenChat: () => alert('Open chat'),
    onOpenBotManagement: () => alert('Open bot management'),
    onOpenAchievements: () => alert('Open achievements'),
    onOpenFriends: () => alert('Open friends'),
    botCount: 2,
    unreadChatCount: 3,
    pendingFriendRequestsCount: 1,
    highestBet: { amount: 9, withoutTrump: false, playerId: 'p1' },
    trump: 'red',
    bettingTeamId: 1,
  },
};

/**
 * Mobile viewport simulation
 */
export const MobileView: Story = {
  args: {
    ...Default.args,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * With score change animation
 */
export const WithScoreAnimation: Story = {
  render: () => {
    const [team1Score, setTeam1Score] = useState(20);
    const [team2Score, setTeam2Score] = useState(15);

    return (
      <SettingsProvider>
        <div>
          <GameHeader
            gameId="SCORE123"
            roundNumber={5}
            team1Score={team1Score}
            team2Score={team2Score}
            onOpenChat={() => {}}
            onOpenLeaderboard={() => {}}
            onOpenAchievements={() => {}}
            onOpenFriends={() => {}}
            highestBet={{ amount: 10, withoutTrump: true, playerId: 'p1' }}
            trump="blue"
            bettingTeamId={2}
          />
          <div className="p-4 flex gap-4 justify-center">
            <button
              onClick={() => setTeam1Score((s) => s + 5)}
              className="px-4 py-2 bg-orange-500/30 text-orange-300 border border-orange-500/50 rounded hover:bg-orange-500/40"
            >
              +5 Team 1
            </button>
            <button
              onClick={() => setTeam2Score((s) => s + 3)}
              className="px-4 py-2 bg-purple-500/30 text-purple-300 border border-purple-500/50 rounded hover:bg-purple-500/40"
            >
              +3 Team 2
            </button>
            <button
              onClick={() => setTeam1Score((s) => s - 2)}
              className="px-4 py-2 bg-red-500/30 text-red-300 border border-red-500/50 rounded hover:bg-red-500/40"
            >
              -2 Team 1
            </button>
          </div>
          <p className="text-center text-sm text-skin-muted mt-2">
            Click buttons above to see score change animations (should appear above everything)
          </p>
        </div>
      </SettingsProvider>
    );
  },
};

/**
 * Without trump/bet info (early game state)
 */
export const EarlyGame: Story = {
  args: {
    gameId: 'NEW12345',
    roundNumber: 1,
    team1Score: 0,
    team2Score: 0,
    onOpenChat: () => {},
    onOpenLeaderboard: () => {},
    onOpenAchievements: () => {},
    onOpenFriends: () => {},
    highestBet: undefined,
    trump: null,
    bettingTeamId: null,
  },
};

/**
 * With "Without Trump" bet indicator
 */
export const WithoutTrumpBet: Story = {
  args: {
    gameId: 'NOTRUMP1',
    roundNumber: 2,
    team1Score: 10,
    team2Score: 8,
    onOpenChat: () => {},
    onOpenLeaderboard: () => {},
    highestBet: { amount: 8, withoutTrump: true, playerId: 'p2' },
    trump: null,
    bettingTeamId: 2,
  },
};

/**
 * Spectator mode (limited buttons)
 */
export const SpectatorMode: Story = {
  args: {
    gameId: 'SPEC1234',
    roundNumber: 4,
    team1Score: 30,
    team2Score: 28,
    isSpectator: true,
    onOpenChat: () => {},
    onOpenLeaderboard: () => {},
    highestBet: { amount: 11, withoutTrump: false, playerId: 'p3' },
    trump: 'green',
    bettingTeamId: 1,
  },
};

// Note: Theme switching is now handled via the skin selector in the toolbar

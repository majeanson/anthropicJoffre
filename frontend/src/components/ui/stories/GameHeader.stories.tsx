/**
 * GameHeader Stories
 * Storybook stories for the GameHeader component
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
The GameHeader displays game information and action buttons.

**Features:**
- Game ID with copy-to-clipboard
- Round number
- Team scores with animated changes
- Bet and trump indicators
- Action buttons (chat, leaderboard, achievements, friends, settings)

**Mobile Behavior:**
- Two-row layout with scores on top and action buttons below
- Smaller touch targets
- Action buttons should stay within header bounds

**Z-Index Considerations:**
- Header: z-40
- Floating score change indicators: z-[9999]
- Modals triggered from header: z-[10000]+
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <SettingsProvider>
        <div className="min-h-[200px] bg-gray-200 dark:bg-gray-900">
          <Story />
          <div className="p-4 mt-4 bg-parchment-100 dark:bg-gray-800 rounded m-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
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
              onClick={() => setTeam1Score(s => s + 5)}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              +5 Team 1
            </button>
            <button
              onClick={() => setTeam2Score(s => s + 3)}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              +3 Team 2
            </button>
            <button
              onClick={() => setTeam1Score(s => s - 2)}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              -2 Team 1
            </button>
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">
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

/**
 * Dark mode
 */
export const DarkMode: Story = {
  args: {
    ...Default.args,
  },
  decorators: [
    (Story) => (
      <SettingsProvider>
        <div className="dark min-h-[200px] bg-gray-900">
          <Story />
          <div className="p-4 mt-4 bg-gray-800 rounded m-4">
            <p className="text-sm text-gray-400">
              Dark mode content below header
            </p>
          </div>
        </div>
      </SettingsProvider>
    ),
  ],
};

/**
 * CatchUpModal Stories
 * Storybook stories for the CatchUpModal component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { CatchUpModal } from '../../CatchUpModal';
import { GameState } from '../../../types/game';

// Mock game state for stories
const createMockGameState = (overrides: Partial<GameState> = {}): GameState => ({
  id: 'CATCHUP1',
  creatorId: 'p1',
  persistenceMode: 'casual',
  isBotGame: false,
  phase: 'playing',
  players: [
    { id: 'p1', name: 'You', hand: [], teamId: 1, isBot: false, tricksWon: 0, pointsWon: 0 },
    { id: 'p2', name: 'Alice', hand: [], teamId: 2, isBot: false, tricksWon: 0, pointsWon: 0 },
    { id: 'p3', name: 'Bob', hand: [], teamId: 1, isBot: false, tricksWon: 0, pointsWon: 0 },
    { id: 'p4', name: 'Charlie', hand: [], teamId: 2, isBot: false, tricksWon: 0, pointsWon: 0 },
  ],
  currentPlayerIndex: 0,
  teamScores: { team1: 25, team2: 18 },
  roundNumber: 3,
  dealerIndex: 0,
  currentTrick: [],
  currentBets: [],
  highestBet: null,
  trump: 'red',
  previousTrick: null,
  currentRoundTricks: [],
  roundHistory: [],
  ...overrides,
});

const meta: Meta<typeof CatchUpModal> = {
  title: 'Components/CatchUpModal',
  component: CatchUpModal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The CatchUpModal (Welcome Back) displays when a player reconnects to a game.

**Features:**
- Shows current round and phase
- Displays team scores with highlighting for player's team
- Indicates if it's the player's turn
- Shows who the game is waiting for

**Light/Dark Mode:**
- Uses bordered UICard variants with explicit colors
- Green theme for success/reconnection context
- Readable in both light and dark modes
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-h-[500px] flex items-center justify-center bg-gray-200 dark:bg-gray-900 p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CatchUpModal>;

/**
 * Default state - it's your turn
 */
export const Default: Story = {
  args: {
    isOpen: true,
    onClose: () => alert('Continue clicked'),
    currentPlayerId: 'You',
    gameState: createMockGameState(),
  },
};

/**
 * Waiting for another player
 */
export const WaitingForPlayer: Story = {
  args: {
    isOpen: true,
    onClose: () => alert('Continue clicked'),
    currentPlayerId: 'You',
    gameState: createMockGameState({
      currentPlayerIndex: 1, // Alice's turn
    }),
  },
};

/**
 * Team 1 leading
 */
export const Team1Leading: Story = {
  args: {
    isOpen: true,
    onClose: () => alert('Continue clicked'),
    currentPlayerId: 'You',
    gameState: createMockGameState({
      teamScores: { team1: 35, team2: 22 },
    }),
  },
};

/**
 * Team 2 leading (player on Team 1)
 */
export const Team2Leading: Story = {
  args: {
    isOpen: true,
    onClose: () => alert('Continue clicked'),
    currentPlayerId: 'You',
    gameState: createMockGameState({
      teamScores: { team1: 18, team2: 32 },
    }),
  },
};

/**
 * Tied game
 */
export const TiedGame: Story = {
  args: {
    isOpen: true,
    onClose: () => alert('Continue clicked'),
    currentPlayerId: 'You',
    gameState: createMockGameState({
      teamScores: { team1: 25, team2: 25 },
    }),
  },
};

/**
 * Betting phase
 */
export const BettingPhase: Story = {
  args: {
    isOpen: true,
    onClose: () => alert('Continue clicked'),
    currentPlayerId: 'You',
    gameState: createMockGameState({
      phase: 'betting',
    }),
  },
};

/**
 * Scoring phase
 */
export const ScoringPhase: Story = {
  args: {
    isOpen: true,
    onClose: () => alert('Continue clicked'),
    currentPlayerId: 'You',
    gameState: createMockGameState({
      phase: 'scoring',
    }),
  },
};

/**
 * Dark mode
 */
export const DarkMode: Story = {
  args: {
    isOpen: true,
    onClose: () => alert('Continue clicked'),
    currentPlayerId: 'You',
    gameState: createMockGameState(),
  },
  decorators: [
    (Story) => (
      <div className="dark min-h-[500px] flex items-center justify-center bg-gray-900 p-4">
        <Story />
      </div>
    ),
  ],
};

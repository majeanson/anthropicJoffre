import type { Meta, StoryObj } from '@storybook/react';
import { BeginnerTutorial } from '../../BeginnerTutorial';
import { GameState, Card, Player, TrickCard, TrickResult, Bet } from '../../../types/game';

/**
 * Create a mock player with all required fields
 */
function createMockPlayer(overrides: Partial<Player>): Player {
  return {
    id: 'player1',
    name: 'Player',
    teamId: 1,
    hand: [],
    tricksWon: 0,
    pointsWon: 0,
    ...overrides,
  };
}

/**
 * Create a mock trick card with all required fields
 */
function createMockTrickCard(card: Card, playerId: string, playerName: string): TrickCard {
  return {
    card,
    playerId,
    playerName,
  };
}

/**
 * Create a mock trick result with all required fields
 */
function createMockTrickResult(overrides: Partial<TrickResult> = {}): TrickResult {
  return {
    trick: [],
    winnerId: 'player1',
    winnerName: 'You',
    points: 1,
    ...overrides,
  };
}

/**
 * Create a mock bet with all required fields
 */
function createMockBet(overrides: Partial<Bet>): Bet {
  return {
    playerId: 'player1',
    playerName: 'Player',
    amount: 7,
    withoutTrump: false,
    ...overrides,
  };
}

// Mock game states for different tutorial phases
const createMockGameState = (phase: string, overrides: Partial<GameState> = {}): GameState => ({
  id: 'test-game',
  creatorId: 'player1',
  persistenceMode: 'casual',
  isBotGame: true,
  phase: phase as GameState['phase'],
  players: [
    createMockPlayer({
      id: 'player1',
      name: 'You',
      teamId: 1,
      hand: [
        { color: 'red', value: 0 } as Card,
        { color: 'blue', value: 5 } as Card,
        { color: 'green', value: 3 } as Card,
      ],
    }),
    createMockPlayer({
      id: 'player2',
      name: 'Bot 1',
      teamId: 2,
      isBot: true,
      botDifficulty: 'medium',
    }),
    createMockPlayer({
      id: 'player3',
      name: 'Partner',
      teamId: 1,
    }),
    createMockPlayer({
      id: 'player4',
      name: 'Bot 2',
      teamId: 2,
      isBot: true,
      botDifficulty: 'easy',
    }),
  ],
  currentTrick: [],
  currentRoundTricks: [],
  currentBets: [],
  highestBet: null,
  trump: null,
  previousTrick: null,
  teamScores: { team1: 0, team2: 0 },
  currentPlayerIndex: 0,
  dealerIndex: 0,
  roundNumber: 1,
  roundHistory: [],
  ...overrides,
});

const meta: Meta<typeof BeginnerTutorial> = {
  title: 'Game/BeginnerTutorial',
  component: BeginnerTutorial,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'game',
      values: [
        { name: 'game', value: '#2d4a2d' },
        { name: 'light', value: '#f5f5f5' },
        { name: 'dark', value: '#1a1a1a' },
      ],
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-h-[400px] relative p-4">
        <div className="text-white text-center mb-4">
          Tutorial panel appears in top-right corner
        </div>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof BeginnerTutorial>;

// Team Selection phase tutorial
export const TeamSelection: Story = {
  args: {
    gameState: createMockGameState('team_selection'),
    currentPlayerId: 'player1',
  },
};

// Betting phase introduction
export const BettingIntro: Story = {
  args: {
    gameState: createMockGameState('betting', {
      currentBets: [],
    }),
    currentPlayerId: 'player1',
  },
};

// Betting decision (when it's your turn)
export const BettingDecision: Story = {
  args: {
    gameState: createMockGameState('betting', {
      currentBets: [
        createMockBet({ playerId: 'player2', playerName: 'Bot 1', amount: 7, withoutTrump: false }),
      ],
      currentPlayerIndex: 0,
    }),
    currentPlayerId: 'player1',
  },
};

// Playing phase introduction
export const PlayingIntro: Story = {
  args: {
    gameState: createMockGameState('playing', {
      currentTrick: [],
      currentRoundTricks: [],
      trump: 'blue',
      highestBet: createMockBet({
        playerId: 'player1',
        playerName: 'You',
        amount: 8,
        withoutTrump: false,
      }),
    }),
    currentPlayerId: 'player1',
  },
};

// Following suit tutorial
export const FollowingSuit: Story = {
  args: {
    gameState: createMockGameState('playing', {
      currentTrick: [createMockTrickCard({ color: 'red', value: 5 } as Card, 'player2', 'Bot 1')],
      currentRoundTricks: [createMockTrickResult()],
      trump: 'blue',
    }),
    currentPlayerId: 'player1',
  },
};

// Trump cards tutorial
export const TrumpCards: Story = {
  args: {
    gameState: createMockGameState('playing', {
      currentTrick: [],
      currentRoundTricks: [createMockTrickResult()],
      trump: 'blue',
    }),
    currentPlayerId: 'player1',
  },
};

// Special cards tutorial (when player has Red 0 or Brown 0)
export const SpecialCards: Story = {
  args: {
    gameState: createMockGameState('playing', {
      players: [
        createMockPlayer({
          id: 'player1',
          name: 'You',
          teamId: 1,
          hand: [
            { color: 'red', value: 0 } as Card,
            { color: 'brown', value: 0 } as Card,
            { color: 'blue', value: 5 } as Card,
          ],
        }),
      ],
      currentRoundTricks: [createMockTrickResult()],
      trump: 'green',
    }),
    currentPlayerId: 'player1',
  },
};

// Round summary tutorial
export const RoundSummary: Story = {
  args: {
    gameState: createMockGameState('scoring'),
    currentPlayerId: 'player1',
  },
};

import { describe, it, expect } from 'vitest';
import {
  validateCardPlay,
  validateBet,
  validateTeamSelection,
  validatePositionSwap,
  validateGameStart,
} from './validation';
import { GameState, Card, Player } from '../types/game';

// Helper to create a test game state
function createTestGame(overrides?: Partial<GameState>): GameState {
  const defaultPlayers: Player[] = [
    { id: 'p1', name: 'Player 1', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
    { id: 'p2', name: 'Player 2', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
    { id: 'p3', name: 'Player 3', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
    { id: 'p4', name: 'Player 4', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
  ];

  return {
    id: 'test-game',
    creatorId: 'test-creator',
    players: defaultPlayers,
    phase: 'team_selection',
    currentPlayerIndex: 0,
    currentBets: [],
    currentTrick: [],
    trump: null,
    teamScores: { team1: 0, team2: 0 },
    dealerIndex: 0,
    roundNumber: 0,
    highestBet: null,
    previousTrick: null,
    roundHistory: [],
    currentRoundTricks: [],
    ...overrides,
  };
}

describe('validateCardPlay', () => {
  it('should reject play when not in playing phase', () => {
    const game = createTestGame({ phase: 'betting' });
    const card: Card = { color: 'red', value: 5 };
    const result = validateCardPlay(game, 'p1', card);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Game is not in playing phase');
    }
  });

  it('should reject play when player already played in trick', () => {
    const game = createTestGame({
      phase: 'playing',
      currentTrick: [{ playerId: 'p1', card: { color: 'red', value: 5 } }],
    });
    const card: Card = { color: 'blue', value: 3 };
    const result = validateCardPlay(game, 'p1', card);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('You have already played a card this trick');
    }
  });

  it('should reject play when trick is complete (4 cards)', () => {
    const game = createTestGame({
      phase: 'playing',
      currentTrick: [
        { playerId: 'p2', card: { color: 'red', value: 5 } },
        { playerId: 'p3', card: { color: 'red', value: 3 } },
        { playerId: 'p4', card: { color: 'red', value: 7 } },
        { playerId: 'p1', card: { color: 'red', value: 1 } },
      ],
    });
    const card: Card = { color: 'blue', value: 3 };
    // p5 doesn't exist in game but trying to play
    const result = validateCardPlay(game, 'p5', card);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Please wait for the current trick to be resolved');
    }
  });

  it('should reject play when not player\'s turn', () => {
    const game = createTestGame({
      phase: 'playing',
      currentPlayerIndex: 0, // p1's turn
    });
    const card: Card = { color: 'red', value: 5 };
    const result = validateCardPlay(game, 'p2', card); // p2 trying to play

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('It is not your turn');
    }
  });

  it('should reject invalid card data', () => {
    const game = createTestGame({ phase: 'playing' });
    const invalidCard = { color: '', value: undefined } as any;
    const result = validateCardPlay(game, 'p1', invalidCard);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Invalid card data');
    }
  });

  it('should reject card not in player\'s hand', () => {
    const game = createTestGame({
      phase: 'playing',
      players: [
        { id: 'p1', name: 'P1', hand: [{ color: 'red', value: 5 }], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p2', name: 'P2', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
        { id: 'p3', name: 'P3', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p4', name: 'P4', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
      ],
    });
    const card: Card = { color: 'blue', value: 3 };
    const result = validateCardPlay(game, 'p1', card);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('You do not have that card in your hand');
    }
  });

  it('should enforce suit-following rule', () => {
    const game = createTestGame({
      phase: 'playing',
      currentPlayerIndex: 1,
      currentTrick: [{ playerId: 'p1', card: { color: 'red', value: 5 } }], // red led
      players: [
        { id: 'p1', name: 'P1', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p2', name: 'P2', hand: [
          { color: 'red', value: 3 }, // has red
          { color: 'blue', value: 2 },
        ], teamId: 2, tricksWon: 0, pointsWon: 0 },
        { id: 'p3', name: 'P3', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p4', name: 'P4', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
      ],
    });
    const card: Card = { color: 'blue', value: 2 }; // trying to play blue when has red
    const result = validateCardPlay(game, 'p2', card);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('You must follow the led suit (red) because you have red cards in your hand');
    }
  });

  it('should allow playing off-suit when no led suit in hand', () => {
    const game = createTestGame({
      phase: 'playing',
      currentPlayerIndex: 1,
      currentTrick: [{ playerId: 'p1', card: { color: 'red', value: 5 } }],
      players: [
        { id: 'p1', name: 'P1', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p2', name: 'P2', hand: [{ color: 'blue', value: 2 }], teamId: 2, tricksWon: 0, pointsWon: 0 },
        { id: 'p3', name: 'P3', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p4', name: 'P4', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
      ],
    });
    const card: Card = { color: 'blue', value: 2 };
    const result = validateCardPlay(game, 'p2', card);

    expect(result.success).toBe(true);
  });

  it('should allow valid card play', () => {
    const game = createTestGame({
      phase: 'playing',
      currentPlayerIndex: 0,
      players: [
        { id: 'p1', name: 'P1', hand: [{ color: 'red', value: 5 }], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p2', name: 'P2', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
        { id: 'p3', name: 'P3', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p4', name: 'P4', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
      ],
    });
    const card: Card = { color: 'red', value: 5 };
    const result = validateCardPlay(game, 'p1', card);

    expect(result.success).toBe(true);
  });
});

describe('validateBet', () => {
  it('should reject bet when not in betting phase', () => {
    const game = createTestGame({ phase: 'playing' });
    const result = validateBet(game, 'p1', 8, false);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Game is not in betting phase');
    }
  });

  it('should reject bet when not player\'s turn', () => {
    const game = createTestGame({ phase: 'betting', currentPlayerIndex: 0 });
    const result = validateBet(game, 'p2', 8, false);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('It is not your turn to bet');
    }
  });

  it('should reject duplicate bet', () => {
    const game = createTestGame({
      phase: 'betting',
      currentBets: [{ playerId: 'p1', amount: 8, withoutTrump: false, skipped: false }],
    });
    const result = validateBet(game, 'p1', 9, false);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('You have already placed your bet');
    }
  });

  it('should reject bet amount < 7', () => {
    const game = createTestGame({ phase: 'betting' });
    const result = validateBet(game, 'p1', 6, false);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Bet amount must be between 7 and 12');
    }
  });

  it('should reject bet amount > 12', () => {
    const game = createTestGame({ phase: 'betting' });
    const result = validateBet(game, 'p1', 13, false);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Bet amount must be between 7 and 12');
    }
  });

  it('should reject dealer skip when no valid bets', () => {
    const game = createTestGame({
      phase: 'betting',
      dealerIndex: 0,
      currentPlayerIndex: 0,
      currentBets: [
        { playerId: 'p2', amount: 0, withoutTrump: false, skipped: true },
        { playerId: 'p3', amount: 0, withoutTrump: false, skipped: true },
        { playerId: 'p4', amount: 0, withoutTrump: false, skipped: true },
      ],
    });
    const result = validateBet(game, 'p1', 0, false, true); // dealer trying to skip

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('As dealer, you must bet at least 7 points when no one has bet.');
    }
  });

  it('should allow dealer to skip when there are valid bets', () => {
    const game = createTestGame({
      phase: 'betting',
      dealerIndex: 0,
      currentPlayerIndex: 0,
      currentBets: [
        { playerId: 'p2', amount: 8, withoutTrump: false, skipped: false }, // valid bet
      ],
    });
    const result = validateBet(game, 'p1', 0, false, true);

    expect(result.success).toBe(true);
  });

  it('should allow valid bet', () => {
    const game = createTestGame({ phase: 'betting' });
    const result = validateBet(game, 'p1', 8, false);

    expect(result.success).toBe(true);
  });
});

describe('validateTeamSelection', () => {
  it('should reject when not in team_selection phase', () => {
    const game = createTestGame({ phase: 'betting' });
    const result = validateTeamSelection(game, 'p1', 1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Game is not in team selection phase');
    }
  });

  it('should reject when player not found', () => {
    const game = createTestGame({ phase: 'team_selection' });
    const result = validateTeamSelection(game, 'invalid-id', 1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Player not found in game');
    }
  });

  it('should reject when player already on team', () => {
    const game = createTestGame({
      phase: 'team_selection',
      players: [
        { id: 'p1', name: 'P1', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p2', name: 'P2', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
        { id: 'p3', name: 'P3', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p4', name: 'P4', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
      ],
    });
    const result = validateTeamSelection(game, 'p1', 1); // already on team 1

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('You are already on this team');
    }
  });

  it('should reject when team is full', () => {
    const game = createTestGame({
      phase: 'team_selection',
      players: [
        { id: 'p1', name: 'P1', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p2', name: 'P2', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 }, // 2 on team 1
        { id: 'p3', name: 'P3', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
        { id: 'p4', name: 'P4', hand: [], teamId: null, tricksWon: 0, pointsWon: 0 },
      ],
    });
    const result = validateTeamSelection(game, 'p4', 1); // trying to join full team

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Team is full');
    }
  });

  it('should allow valid team selection', () => {
    const game = createTestGame({
      phase: 'team_selection',
      players: [
        { id: 'p1', name: 'P1', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p2', name: 'P2', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
        { id: 'p3', name: 'P3', hand: [], teamId: null, tricksWon: 0, pointsWon: 0 },
        { id: 'p4', name: 'P4', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
      ],
    });
    const result = validateTeamSelection(game, 'p3', 1);

    expect(result.success).toBe(true);
  });
});

describe('validatePositionSwap', () => {
  it('should reject when not in team_selection phase', () => {
    const game = createTestGame({ phase: 'betting' });
    const result = validatePositionSwap(game, 'p1', 'p2');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Position swapping is only allowed during team selection');
    }
  });

  it('should reject when player not found', () => {
    const game = createTestGame({ phase: 'team_selection' });
    const result = validatePositionSwap(game, 'invalid', 'p2');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Player not found');
    }
  });

  it('should reject swapping with self', () => {
    const game = createTestGame({ phase: 'team_selection' });
    const result = validatePositionSwap(game, 'p1', 'p1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Cannot swap position with yourself');
    }
  });

  it('should allow valid position swap between teammates', () => {
    const game = createTestGame({
      phase: 'team_selection',
      players: [
        { id: 'p1', name: 'P1', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p2', name: 'P2', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
        { id: 'p3', name: 'P3', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p4', name: 'P4', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
      ]
    });
    const result = validatePositionSwap(game, 'p1', 'p3'); // Both on team 1

    expect(result.success).toBe(true);
  });
});

describe('validateGameStart', () => {
  it('should reject when not in team_selection phase', () => {
    const game = createTestGame({ phase: 'betting' });
    const result = validateGameStart(game);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Game cannot be started from this phase');
    }
  });

  it('should reject when not exactly 4 players', () => {
    const game = createTestGame({
      phase: 'team_selection',
      players: [
        { id: 'p1', name: 'P1', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p2', name: 'P2', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
        { id: 'p3', name: 'P3', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
      ],
    });
    const result = validateGameStart(game);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Need exactly 4 players to start');
    }
  });

  it('should reject when teams are not balanced', () => {
    const game = createTestGame({
      phase: 'team_selection',
      players: [
        { id: 'p1', name: 'P1', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p2', name: 'P2', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p3', name: 'P3', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 }, // 3 on team 1
        { id: 'p4', name: 'P4', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
      ],
    });
    const result = validateGameStart(game);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Teams must be balanced (2 players per team)');
    }
  });

  it('should allow starting with valid setup', () => {
    const game = createTestGame({
      phase: 'team_selection',
      players: [
        { id: 'p1', name: 'P1', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p2', name: 'P2', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
        { id: 'p3', name: 'P3', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p4', name: 'P4', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
      ],
    });
    const result = validateGameStart(game);

    expect(result.success).toBe(true);
  });
});

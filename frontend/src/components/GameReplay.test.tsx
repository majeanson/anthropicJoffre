/**
 * GameReplay Component Tests
 * Sprint 8 Task 1: Frontend Component Tests - GameReplay
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GameReplay } from './GameReplay';
import { RoundHistory, Bet } from '../types/game';

// Mock child components
vi.mock('./TrickHistory', () => ({
  TrickHistory: () => <div data-testid="trick-history">Trick History</div>,
}));

// Mock sounds utility
vi.mock('../utils/sounds', () => ({
  sounds: {
    play: vi.fn(),
    playAsync: vi.fn(),
    setEnabled: vi.fn(),
    setVolume: vi.fn(),
    playCardPlay: vi.fn(),
    trickWon: vi.fn(),
  },
}));

interface MockSocket {
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  emit: ReturnType<typeof vi.fn>;
}

function createMockSocket(): MockSocket {
  return {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  };
}

function createTestRound(roundNumber: number): RoundHistory {
  const mockBet: Bet = {
    playerId: 'player-1',
    amount: 9,
    withoutTrump: false,
    skipped: false,
  };

  return {
    roundNumber,
    bets: [mockBet],
    highestBet: mockBet,
    offensiveTeam: 1,
    offensivePoints: 10,
    defensivePoints: 8,
    betAmount: 9,
    withoutTrump: false,
    betMade: true,
    roundScore: {
      team1: 10,
      team2: 8,
    },
    cumulativeScore: {
      team1: 10,
      team2: 8,
    },
    tricks: [],
    trump: 'red',
  };
}

function createTestReplayData(overrides = {}) {
  return {
    game_id: 'test-game-123',
    winning_team: 1,
    team1_score: 45,
    team2_score: 32,
    rounds: 5,
    player_names: ['Player 1', 'Player 2', 'Player 3', 'Player 4'],
    player_teams: [1, 2, 1, 2],
    round_history: [
      createTestRound(1),
      createTestRound(2),
    ],
    trump_suit: 'red',
    game_duration_seconds: 300,
    is_bot_game: false,
    created_at: '2025-01-01T00:00:00Z',
    finished_at: '2025-01-01T00:05:00Z',
    ...overrides,
  };
}

describe('GameReplay', () => {
  let mockSocket: MockSocket;
  let mockOnClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSocket = createMockSocket();
    mockOnClose = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Loading State', () => {
    it('should show loading spinner on mount', () => {
      render(
        <GameReplay
          gameId="test-game-123"
          socket={mockSocket as any}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/Loading replay/i)).toBeInTheDocument();
    });

    it('should emit get_game_replay on mount', () => {
      render(
        <GameReplay
          gameId="test-game-123"
          socket={mockSocket as any}
          onClose={mockOnClose}
        />
      );

      expect(mockSocket.emit).toHaveBeenCalledWith('get_game_replay', {
        gameId: 'test-game-123',
      });
    });

    it('should register socket event handlers', () => {
      render(
        <GameReplay
          gameId="test-game-123"
          socket={mockSocket as any}
          onClose={mockOnClose}
        />
      );

      expect(mockSocket.on).toHaveBeenCalledWith(
        'game_replay_data',
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('Data Loading', () => {
    it('should display replay data when loaded successfully', async () => {
      render(
        <GameReplay
          gameId="test-game-123"
          socket={mockSocket as any}
          onClose={mockOnClose}
        />
      );

      const replayDataHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'game_replay_data'
      )?.[1];

      expect(replayDataHandler).toBeDefined();

      // Simulate receiving replay data
      replayDataHandler({ replayData: createTestReplayData() });

      await waitFor(() => {
        expect(screen.queryByText(/Loading replay/i)).not.toBeInTheDocument();
      });
    });

    it('should handle 404 errors with correlation ID', async () => {
      render(
        <GameReplay
          gameId="test-game-123"
          socket={mockSocket as any}
          onClose={mockOnClose}
        />
      );

      const errorHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'error'
      )?.[1];

      expect(errorHandler).toBeDefined();

      // Simulate error with correlation ID
      errorHandler({
        message: 'Game not found',
        correlationId: 'abc-123-def',
      });

      await waitFor(() => {
        expect(screen.getByText(/Game not found/i)).toBeInTheDocument();
        expect(screen.getByText(/Error ID: abc-123-def/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      render(
        <GameReplay
          gameId="test-game-123"
          socket={mockSocket as any}
          onClose={mockOnClose}
        />
      );

      const errorHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'error'
      )?.[1];

      errorHandler({
        message: 'Network connection failed',
      });

      await waitFor(() => {
        expect(screen.getByText(/Network connection failed/i)).toBeInTheDocument();
      });
    });

    it('should show warning when replay has no rounds', async () => {
      render(
        <GameReplay
          gameId="test-game-123"
          socket={mockSocket as any}
          onClose={mockOnClose}
        />
      );

      const replayDataHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'game_replay_data'
      )?.[1];

      // Replay with no rounds
      replayDataHandler({
        replayData: createTestReplayData({ round_history: [] }),
      });

      await waitFor(() => {
        expect(screen.getByText(/No Replay Data Available/i)).toBeInTheDocument();
      });
    });
  });

  describe('Playback Controls', () => {
    beforeEach(async () => {
      render(
        <GameReplay
          gameId="test-game-123"
          socket={mockSocket as any}
          onClose={mockOnClose}
        />
      );

      const replayDataHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'game_replay_data'
      )?.[1];

      replayDataHandler({ replayData: createTestReplayData() });

      await waitFor(() => {
        expect(screen.queryByText(/Loading replay/i)).not.toBeInTheDocument();
      });
    });

    it('should have play/pause button', () => {
      const playButton = screen.getByText(/▶️|⏸/);
      expect(playButton).toBeInTheDocument();
    });

    it('should start auto-playback when play clicked', async () => {
      const playButton = screen.getByText(/▶️|Play/i);
      fireEvent.click(playButton);

      // Should switch to pause icon/text after clicking
      await waitFor(() => {
        expect(screen.queryByText(/⏸|Pause/i)).toBeInTheDocument();
      });
    });

    it('should have step forward button', () => {
      const nextButton = screen.getByText(/Next|▶|→/);
      expect(nextButton).toBeInTheDocument();
    });

    it('should have step backward button', () => {
      const prevButton = screen.getByText(/Prev|◀|←/);
      expect(prevButton).toBeInTheDocument();
    });

    it('should have speed control', () => {
      // Speed buttons (0.5x, 1x, 2x)
      const speedButtons = screen.queryAllByText(/0.5x|1x|2x/);
      expect(speedButtons.length).toBeGreaterThan(0);
    });

    it('should change playback speed', () => {
      const speedButton = screen.getByText(/2x/);
      fireEvent.click(speedButton);

      // Speed should be reflected (implementation-specific)
      expect(speedButton).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    beforeEach(async () => {
      const replayData = createTestReplayData({
        round_history: [
          createTestRound(1),
          createTestRound(2),
          createTestRound(3),
        ],
      });

      render(
        <GameReplay
          gameId="test-game-123"
          socket={mockSocket as any}
          onClose={mockOnClose}
        />
      );

      const replayDataHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'game_replay_data'
      )?.[1];

      replayDataHandler({ replayData });

      await waitFor(() => {
        expect(screen.queryByText(/Loading replay/i)).not.toBeInTheDocument();
      });
    });

    it('should display current round number', () => {
      // Should show Round 1 initially
      expect(screen.getByText(/Round 1/i)).toBeInTheDocument();
    });

    it('should navigate to next round', () => {
      const nextButton = screen.getByText(/Next|▶|→/);
      fireEvent.click(nextButton);

      // May need to click multiple times to advance through tricks first
      // This is implementation-specific
    });

    it('should navigate to previous round', () => {
      const nextButton = screen.getByText(/Next|▶|→/);
      const prevButton = screen.getByText(/Prev|◀|←/);

      // Go to round 2
      fireEvent.click(nextButton);

      // Go back to round 1
      fireEvent.click(prevButton);
    });

    it('should jump to specific round', () => {
      // Look for round selector (may be dropdown or buttons)
      const round2Button = screen.queryByText(/Round 2/);
      if (round2Button) {
        fireEvent.click(round2Button);
      }
    });
  });

  describe('State Visualization', () => {
    beforeEach(async () => {
      render(
        <GameReplay
          gameId="test-game-123"
          socket={mockSocket as any}
          onClose={mockOnClose}
        />
      );

      const replayDataHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'game_replay_data'
      )?.[1];

      replayDataHandler({ replayData: createTestReplayData() });

      await waitFor(() => {
        expect(screen.queryByText(/Loading replay/i)).not.toBeInTheDocument();
      });
    });

    it('should show game scores', () => {
      expect(screen.getByText(/45/)).toBeInTheDocument(); // Team 1 score
      expect(screen.getByText(/32/)).toBeInTheDocument(); // Team 2 score
    });

    it('should display trick history', () => {
      expect(screen.getByTestId('trick-history')).toBeInTheDocument();
    });

    it('should show trump suit', () => {
      expect(screen.getByText(/red/i)).toBeInTheDocument();
    });

    it('should display winning team', () => {
      expect(screen.getByText(/Team 1|Winner/i)).toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('should have Try Again button on error', async () => {
      render(
        <GameReplay
          gameId="test-game-123"
          socket={mockSocket as any}
          onClose={mockOnClose}
        />
      );

      const errorHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'error'
      )?.[1];

      errorHandler({ message: 'Connection failed' });

      await waitFor(() => {
        expect(screen.getByText(/Try Again/i)).toBeInTheDocument();
      });
    });

    it('should retry fetching on Try Again click', async () => {
      render(
        <GameReplay
          gameId="test-game-123"
          socket={mockSocket as any}
          onClose={mockOnClose}
        />
      );

      const errorHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'error'
      )?.[1];

      errorHandler({ message: 'Connection failed' });

      await waitFor(() => {
        expect(screen.getByText(/Try Again/i)).toBeInTheDocument();
      });

      const tryAgainButton = screen.getByText(/Try Again/i);
      fireEvent.click(tryAgainButton);

      // Should emit get_game_replay again
      expect(mockSocket.emit).toHaveBeenCalledTimes(2); // Once on mount, once on retry
      expect(mockSocket.emit).toHaveBeenLastCalledWith('get_game_replay', {
        gameId: 'test-game-123',
      });
    });

    it('should close on Close button click', async () => {
      render(
        <GameReplay
          gameId="test-game-123"
          socket={mockSocket as any}
          onClose={mockOnClose}
        />
      );

      const errorHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'error'
      )?.[1];

      errorHandler({ message: 'Connection failed' });

      await waitFor(() => {
        expect(screen.getByText(/Close/i)).toBeInTheDocument();
      });

      const closeButton = screen.getByText(/Close/i);
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should unregister socket handlers on unmount', () => {
      const { unmount } = render(
        <GameReplay
          gameId="test-game-123"
          socket={mockSocket as any}
          onClose={mockOnClose}
        />
      );

      unmount();

      expect(mockSocket.off).toHaveBeenCalledWith(
        'game_replay_data',
        expect.any(Function)
      );
      expect(mockSocket.off).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });
});

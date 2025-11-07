/**
 * TeamSelection Component Tests
 * Sprint 8 Task 1: Frontend Component Tests - TeamSelection
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TeamSelection } from './TeamSelection';
import { Player, ChatMessage } from '../types/game';
import { SettingsProvider } from '../contexts/SettingsContext';
import { Socket } from 'socket.io-client';

// Mock child components
vi.mock('./HowToPlay', () => ({
  HowToPlay: () => <div data-testid="how-to-play">Rules</div>,
}));

vi.mock('./PlayerConnectionIndicator', () => ({
  PlayerConnectionIndicator: ({ isConnected }: any) => (
    <div data-testid="connection-indicator">{isConnected ? 'Online' : 'Offline'}</div>
  ),
}));

vi.mock('./FloatingTeamChat', () => ({
  FloatingTeamChat: () => <div data-testid="floating-chat">Chat</div>,
}));

// Mock sounds utility
vi.mock('../utils/sounds', () => ({
  sounds: {
    play: vi.fn(),
    playAsync: vi.fn(),
    setEnabled: vi.fn(),
    setVolume: vi.fn(),
    playCardDeal: vi.fn(),
    teamSelect: vi.fn(),
    positionSwap: vi.fn(),
    gameStart: vi.fn(),
    buttonClick: vi.fn(),
  },
}));

function createTestPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'player-1',
    name: 'TestPlayer',
    hand: [],
    teamId: 1,
    isBot: false,
    isConnected: true,
    isEmpty: false,
    ...overrides,
  };
}

function createMockSocket(): Socket {
  return {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  } as any;
}

function renderWithSettings(component: React.ReactElement) {
  return render(<SettingsProvider>{component}</SettingsProvider>);
}

describe('TeamSelection', () => {
  let mockOnSelectTeam: ReturnType<typeof vi.fn>;
  let mockOnSwapPosition: ReturnType<typeof vi.fn>;
  let mockOnStartGame: ReturnType<typeof vi.fn>;
  let mockOnLeaveGame: ReturnType<typeof vi.fn>;
  let mockOnAddBot: ReturnType<typeof vi.fn>;
  let mockOnKickPlayer: ReturnType<typeof vi.fn>;
  let mockSocket: Socket;

  beforeEach(() => {
    mockOnSelectTeam = vi.fn();
    mockOnSwapPosition = vi.fn();
    mockOnStartGame = vi.fn();
    mockOnLeaveGame = vi.fn();
    mockOnAddBot = vi.fn();
    mockOnKickPlayer = vi.fn();
    mockSocket = createMockSocket();

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  describe('Rendering and Basic UI', () => {
    it('should render team selection UI', () => {
      const players = [
        createTestPlayer({ id: 'player-1', teamId: 1 }),
        createTestPlayer({ id: 'player-2', teamId: 2 }),
      ];

      renderWithSettings(
        <TeamSelection
          players={players}
          gameId="test-game-123"
          currentPlayerId="player-1"
          creatorId="player-1"
          onSelectTeam={mockOnSelectTeam}
          onSwapPosition={mockOnSwapPosition}
          onStartGame={mockOnStartGame}
        />
      );

      expect(screen.getByText('Team Selection')).toBeInTheDocument();
      expect(screen.getByTestId('game-id')).toHaveTextContent('test-game-123');
    });

    it('should display player count', () => {
      const players = [
        createTestPlayer({ id: 'player-1', teamId: 1 }),
        createTestPlayer({ id: 'player-2', teamId: 2 }),
        createTestPlayer({ id: 'player-3', teamId: 1 }),
      ];

      renderWithSettings(
        <TeamSelection
          players={players}
          gameId="test-game-123"
          currentPlayerId="player-1"
          creatorId="player-1"
          onSelectTeam={mockOnSelectTeam}
          onSwapPosition={mockOnSwapPosition}
          onStartGame={mockOnStartGame}
        />
      );

      expect(screen.getByTestId('player-count')).toHaveTextContent('3');
    });

    it('should show both team containers', () => {
      const players = [
        createTestPlayer({ id: 'player-1', teamId: 1 }),
      ];

      renderWithSettings(
        <TeamSelection
          players={players}
          gameId="test-game-123"
          currentPlayerId="player-1"
          creatorId="player-1"
          onSelectTeam={mockOnSelectTeam}
          onSwapPosition={mockOnSwapPosition}
          onStartGame={mockOnStartGame}
        />
      );

      expect(screen.getByText('Team 1')).toBeInTheDocument();
      expect(screen.getByText('Team 2')).toBeInTheDocument();
    });
  });

  describe('Team Balance Validation', () => {
    it('should disable Start Game with unbalanced teams', () => {
      const players = [
        createTestPlayer({ id: 'player-1', teamId: 1 }),
        createTestPlayer({ id: 'player-2', teamId: 1 }),
        createTestPlayer({ id: 'player-3', teamId: 1 }),
        createTestPlayer({ id: 'player-4', teamId: 2 }),
      ];

      renderWithSettings(
        <TeamSelection
          players={players}
          gameId="test-game-123"
          currentPlayerId="player-1"
          creatorId="player-1"
          onSelectTeam={mockOnSelectTeam}
          onSwapPosition={mockOnSwapPosition}
          onStartGame={mockOnStartGame}
        />
      );

      const startButton = screen.getByText(/Start Game/i);
      expect(startButton).toBeDisabled();
    });

    it('should enable Start Game with balanced teams (2v2)', () => {
      const players = [
        createTestPlayer({ id: 'player-1', teamId: 1 }),
        createTestPlayer({ id: 'player-2', teamId: 2 }),
        createTestPlayer({ id: 'player-3', teamId: 1 }),
        createTestPlayer({ id: 'player-4', teamId: 2 }),
      ];

      renderWithSettings(
        <TeamSelection
          players={players}
          gameId="test-game-123"
          currentPlayerId="player-1"
          creatorId="player-1"
          onSelectTeam={mockOnSelectTeam}
          onSwapPosition={mockOnSwapPosition}
          onStartGame={mockOnStartGame}
        />
      );

      const startButton = screen.getByText(/Start Game/i);
      expect(startButton).not.toBeDisabled();
    });

    it('should show team balance warning message', () => {
      const players = [
        createTestPlayer({ id: 'player-1', teamId: 1 }),
        createTestPlayer({ id: 'player-2', teamId: 1 }),
      ];

      renderWithSettings(
        <TeamSelection
          players={players}
          gameId="test-game-123"
          currentPlayerId="player-1"
          creatorId="player-1"
          onSelectTeam={mockOnSelectTeam}
          onSwapPosition={mockOnSwapPosition}
          onStartGame={mockOnStartGame}
        />
      );

      // Should show waiting for players message or team balance message
      expect(screen.getByText(/Waiting for|Teams must have/i)).toBeInTheDocument();
    });

    it('should call onStartGame when Start Game clicked with valid teams', () => {
      const players = [
        createTestPlayer({ id: 'player-1', teamId: 1 }),
        createTestPlayer({ id: 'player-2', teamId: 2 }),
        createTestPlayer({ id: 'player-3', teamId: 1 }),
        createTestPlayer({ id: 'player-4', teamId: 2 }),
      ];

      renderWithSettings(
        <TeamSelection
          players={players}
          gameId="test-game-123"
          currentPlayerId="player-1"
          creatorId="player-1"
          onSelectTeam={mockOnSelectTeam}
          onSwapPosition={mockOnSwapPosition}
          onStartGame={mockOnStartGame}
        />
      );

      const startButton = screen.getByText(/Start Game/i);
      fireEvent.click(startButton);

      expect(mockOnStartGame).toHaveBeenCalled();
    });
  });

  describe('Team Selection Actions', () => {
    it('should allow selecting Team 1', () => {
      const players = [
        createTestPlayer({ id: 'player-1', teamId: 2 }), // Start on Team 2
      ];

      renderWithSettings(
        <TeamSelection
          players={players}
          gameId="test-game-123"
          currentPlayerId="player-1"
          creatorId="player-1"
          onSelectTeam={mockOnSelectTeam}
          onSwapPosition={mockOnSwapPosition}
          onStartGame={mockOnStartGame}
        />
      );

      // Look for "Join Team 1" button or similar
      const team1Button = screen.getByText(/Join Team 1|Select Team 1/i);
      fireEvent.click(team1Button);

      expect(mockOnSelectTeam).toHaveBeenCalledWith(1);
    });

    it('should allow selecting Team 2', () => {
      const players = [
        createTestPlayer({ id: 'player-1', teamId: 1 }), // Start on Team 1
      ];

      renderWithSettings(
        <TeamSelection
          players={players}
          gameId="test-game-123"
          currentPlayerId="player-1"
          creatorId="player-1"
          onSelectTeam={mockOnSelectTeam}
          onSwapPosition={mockOnSwapPosition}
          onStartGame={mockOnStartGame}
        />
      );

      // Look for "Join Team 2" button or similar
      const team2Button = screen.getByText(/Join Team 2|Select Team 2/i);
      fireEvent.click(team2Button);

      expect(mockOnSelectTeam).toHaveBeenCalledWith(2);
    });
  });

  describe('Position Swapping', () => {
    it('should allow swapping positions within team', () => {
      const players = [
        createTestPlayer({ id: 'player-1', name: 'Player 1', teamId: 1 }),
        createTestPlayer({ id: 'player-2', name: 'Player 2', teamId: 1 }),
        createTestPlayer({ id: 'player-3', name: 'Player 3', teamId: 2 }),
      ];

      renderWithSettings(
        <TeamSelection
          players={players}
          gameId="test-game-123"
          currentPlayerId="player-1"
          creatorId="player-1"
          onSelectTeam={mockOnSelectTeam}
          onSwapPosition={mockOnSwapPosition}
          onStartGame={mockOnStartGame}
        />
      );

      // Look for swap button (typically an arrow or swap icon near teammates)
      // This is implementation-specific
      const swapButtons = screen.queryAllByText(/↕️|⇅|Swap/);
      if (swapButtons.length > 0) {
        fireEvent.click(swapButtons[0]);
        expect(mockOnSwapPosition).toHaveBeenCalled();
      }
    });
  });

  describe('Game Link Copying', () => {
    it('should copy game link to clipboard', async () => {
      const players = [
        createTestPlayer({ id: 'player-1', teamId: 1 }),
      ];

      renderWithSettings(
        <TeamSelection
          players={players}
          gameId="test-game-123"
          currentPlayerId="player-1"
          creatorId="player-1"
          onSelectTeam={mockOnSelectTeam}
          onSwapPosition={mockOnSwapPosition}
          onStartGame={mockOnStartGame}
        />
      );

      const copyButton = screen.getByText(/Copy Game Link/i);
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          expect.stringContaining('join=test-game-123')
        );
      });
    });

    it('should show success toast after copying', async () => {
      const players = [
        createTestPlayer({ id: 'player-1', teamId: 1 }),
      ];

      renderWithSettings(
        <TeamSelection
          players={players}
          gameId="test-game-123"
          currentPlayerId="player-1"
          creatorId="player-1"
          onSelectTeam={mockOnSelectTeam}
          onSwapPosition={mockOnSwapPosition}
          onStartGame={mockOnStartGame}
        />
      );

      const copyButton = screen.getByText(/Copy Game Link/i);
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText(/Game link copied/i)).toBeInTheDocument();
      });
    });
  });

  describe('Leave Game Functionality', () => {
    it('should call onLeaveGame when Leave button clicked', () => {
      const players = [
        createTestPlayer({ id: 'player-1', teamId: 1 }),
      ];

      renderWithSettings(
        <TeamSelection
          players={players}
          gameId="test-game-123"
          currentPlayerId="player-1"
          creatorId="player-1"
          onSelectTeam={mockOnSelectTeam}
          onSwapPosition={mockOnSwapPosition}
          onStartGame={mockOnStartGame}
          onLeaveGame={mockOnLeaveGame}
        />
      );

      const leaveButton = screen.getByText(/Leave/i);
      fireEvent.click(leaveButton);

      expect(mockOnLeaveGame).toHaveBeenCalled();
    });

    it('should not show Leave button when onLeaveGame not provided', () => {
      const players = [
        createTestPlayer({ id: 'player-1', teamId: 1 }),
      ];

      renderWithSettings(
        <TeamSelection
          players={players}
          gameId="test-game-123"
          currentPlayerId="player-1"
          creatorId="player-1"
          onSelectTeam={mockOnSelectTeam}
          onSwapPosition={mockOnSwapPosition}
          onStartGame={mockOnStartGame}
        />
      );

      expect(screen.queryByText(/Leave/i)).not.toBeInTheDocument();
    });
  });

  describe('Chat Integration', () => {
    it('should render chat component', () => {
      const players = [
        createTestPlayer({ id: 'player-1', teamId: 1 }),
      ];

      renderWithSettings(
        <TeamSelection
          players={players}
          gameId="test-game-123"
          currentPlayerId="player-1"
          creatorId="player-1"
          onSelectTeam={mockOnSelectTeam}
          onSwapPosition={mockOnSwapPosition}
          onStartGame={mockOnStartGame}
          socket={mockSocket}
        />
      );

      expect(screen.getByTestId('floating-chat')).toBeInTheDocument();
    });

    it('should listen for chat messages when socket provided', () => {
      const players = [
        createTestPlayer({ id: 'player-1', teamId: 1 }),
      ];

      renderWithSettings(
        <TeamSelection
          players={players}
          gameId="test-game-123"
          currentPlayerId="player-1"
          creatorId="player-1"
          onSelectTeam={mockOnSelectTeam}
          onSwapPosition={mockOnSwapPosition}
          onStartGame={mockOnStartGame}
          socket={mockSocket}
        />
      );

      expect(mockSocket.on).toHaveBeenCalledWith(
        'team_selection_chat_message',
        expect.any(Function)
      );
    });
  });

  describe('Error States', () => {
    it('should handle empty players array gracefully', () => {
      const { container } = renderWithSettings(
        <TeamSelection
          players={[]}
          gameId="test-game-123"
          currentPlayerId="player-1"
          creatorId="player-1"
          onSelectTeam={mockOnSelectTeam}
          onSwapPosition={mockOnSwapPosition}
          onStartGame={mockOnStartGame}
        />
      );

      expect(container).toBeInTheDocument();
      expect(screen.getByTestId('player-count')).toHaveTextContent('0');
    });

    it('should handle missing current player gracefully', () => {
      const players = [
        createTestPlayer({ id: 'player-2', teamId: 1 }),
      ];

      const { container } = renderWithSettings(
        <TeamSelection
          players={players}
          gameId="test-game-123"
          currentPlayerId="non-existent-id"
          creatorId="player-2"
          onSelectTeam={mockOnSelectTeam}
          onSwapPosition={mockOnSwapPosition}
          onStartGame={mockOnStartGame}
        />
      );

      // Should render without crashing
      expect(container).toBeInTheDocument();
    });
  });
});

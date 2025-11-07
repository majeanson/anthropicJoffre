/**
 * JoinGameForm Component Tests
 * Sprint 4 Phase 4.3: Frontend Testing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent, createMockSocket } from '../test/utils';
import { JoinGameForm } from './JoinGameForm';

describe('JoinGameForm', () => {
  const mockSetGameId = vi.fn();
  const mockSetPlayerName = vi.fn();
  const mockSetJoinType = vi.fn();
  const mockOnJoinGame = vi.fn();
  const mockOnSpectateGame = vi.fn();
  const mockOnBack = vi.fn();
  const mockOnBackToHomepage = vi.fn();
  const mockSetShowPlayerStats = vi.fn();
  const mockSetShowLeaderboard = vi.fn();
  const mockSetSelectedPlayerName = vi.fn();

  const defaultProps = {
    gameId: 'game-123',
    setGameId: mockSetGameId,
    playerName: 'TestPlayer',
    setPlayerName: mockSetPlayerName,
    joinType: 'player' as 'player' | 'spectator',
    setJoinType: mockSetJoinType,
    autoJoinGameId: undefined,
    onJoinGame: mockOnJoinGame,
    onSpectateGame: mockOnSpectateGame,
    onBack: mockOnBack,
    onBackToHomepage: mockOnBackToHomepage,
    user: null,
    socket: createMockSocket() as any,
    showPlayerStats: false,
    setShowPlayerStats: mockSetShowPlayerStats,
    showLeaderboard: false,
    setShowLeaderboard: mockSetShowLeaderboard,
    selectedPlayerName: '',
    setSelectedPlayerName: mockSetSelectedPlayerName,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders join game form with all elements', () => {
    renderWithProviders(<JoinGameForm {...defaultProps} />);

    expect(screen.getByText('Join Game')).toBeInTheDocument();
    expect(screen.getByTestId('game-id-input')).toBeInTheDocument();
    expect(screen.getByTestId('player-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('back-button')).toBeInTheDocument();
    expect(screen.getByTestId('submit-join-button')).toBeInTheDocument();
  });

  it('shows join type selection with player and spectator options', () => {
    renderWithProviders(<JoinGameForm {...defaultProps} />);

    expect(screen.getByText('Join as:')).toBeInTheDocument();
    expect(screen.getByText('Player')).toBeInTheDocument();
    expect(screen.getByText('Guest (Spectator)')).toBeInTheDocument();
  });

  it('defaults to player join type', () => {
    renderWithProviders(<JoinGameForm {...defaultProps} />);

    const playerRadio = screen.getByLabelText('Player');
    expect(playerRadio).toBeChecked();
  });

  it('switches to spectator join type when clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<JoinGameForm {...defaultProps} />);

    const spectatorRadio = screen.getByLabelText('Guest (Spectator)');
    await user.click(spectatorRadio);

    expect(mockSetJoinType).toHaveBeenCalledWith('spectator');
  });

  it('shows spectator info message when spectator type is selected', () => {
    renderWithProviders(<JoinGameForm {...defaultProps} joinType="spectator" />);

    expect(screen.getByText('As a spectator, you can watch the game but cannot play cards. Player hands will be hidden.')).toBeInTheDocument();
  });

  it('shows (Optional) for player name when spectator type is selected', () => {
    renderWithProviders(<JoinGameForm {...defaultProps} joinType="spectator" />);

    expect(screen.getByText('Your Name (Optional)')).toBeInTheDocument();
  });

  it('calls onJoinGame with correct parameters when joining as player', async () => {
    const user = userEvent.setup();
    renderWithProviders(<JoinGameForm {...defaultProps} />);

    await user.click(screen.getByTestId('submit-join-button'));

    expect(mockOnJoinGame).toHaveBeenCalledWith('game-123', 'TestPlayer');
    expect(mockOnSpectateGame).not.toHaveBeenCalled();
  });

  it('calls onSpectateGame when joining as spectator', async () => {
    const user = userEvent.setup();
    renderWithProviders(<JoinGameForm {...defaultProps} joinType="spectator" />);

    await user.click(screen.getByTestId('submit-join-button'));

    expect(mockOnSpectateGame).toHaveBeenCalledWith('game-123', 'TestPlayer');
    expect(mockOnJoinGame).not.toHaveBeenCalled();
  });

  it('shows auto-join message when autoJoinGameId is provided', () => {
    renderWithProviders(<JoinGameForm {...defaultProps} autoJoinGameId="game-123" />);

    expect(screen.getByText(/Joining game:/)).toBeInTheDocument();
    expect(screen.getByText('game-123')).toBeInTheDocument();
    expect(screen.getByText(/Enter your name below to join!/)).toBeInTheDocument();
  });

  it('shows back to homepage button when autoJoinGameId is provided', () => {
    renderWithProviders(<JoinGameForm {...defaultProps} autoJoinGameId="game-123" />);

    expect(screen.getByTestId('back-to-homepage-button')).toBeInTheDocument();
    expect(screen.queryByTestId('back-button')).not.toBeInTheDocument();
  });

  it('shows regular back button when autoJoinGameId is not provided', () => {
    renderWithProviders(<JoinGameForm {...defaultProps} />);

    expect(screen.getByTestId('back-button')).toBeInTheDocument();
    expect(screen.queryByTestId('back-to-homepage-button')).not.toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<JoinGameForm {...defaultProps} />);

    await user.click(screen.getByTestId('back-button'));

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('calls onBackToHomepage when back to homepage button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<JoinGameForm {...defaultProps} autoJoinGameId="game-123" />);

    await user.click(screen.getByTestId('back-to-homepage-button'));

    expect(mockOnBackToHomepage).toHaveBeenCalledTimes(1);
  });

  it('disables player name input for authenticated users', () => {
    const user = { id: 1, username: 'AuthUser', email: 'auth@test.com' };
    renderWithProviders(<JoinGameForm {...defaultProps} user={user as any} />);

    const input = screen.getByTestId('player-name-input');
    expect(input).toBeDisabled();
  });

  it('requires game ID to submit', () => {
    renderWithProviders(<JoinGameForm {...defaultProps} gameId="" />);

    const input = screen.getByTestId('game-id-input');
    expect(input).toBeRequired();
  });

  it('requires player name when joining as player', () => {
    renderWithProviders(<JoinGameForm {...defaultProps} />);

    const input = screen.getByTestId('player-name-input');
    expect(input).toBeRequired();
  });

  it('does not require player name when joining as spectator', () => {
    renderWithProviders(<JoinGameForm {...defaultProps} joinType="spectator" />);

    const input = screen.getByTestId('player-name-input');
    expect(input).not.toBeRequired();
  });

  it('shows Join as Player button text when player type selected', () => {
    renderWithProviders(<JoinGameForm {...defaultProps} />);

    expect(screen.getByText('Join as Player')).toBeInTheDocument();
  });

  it('shows Join as Guest button text when spectator type selected', () => {
    renderWithProviders(<JoinGameForm {...defaultProps} joinType="spectator" />);

    expect(screen.getByText('Join as Guest')).toBeInTheDocument();
  });
});

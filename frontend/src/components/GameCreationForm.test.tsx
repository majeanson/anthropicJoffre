/**
 * GameCreationForm Component Tests
 * Sprint 4 Phase 4.3: Frontend Testing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent } from '../test/utils';
import { GameCreationForm } from './GameCreationForm';

describe('GameCreationForm', () => {
  const mockSetPlayerName = vi.fn();
  const mockOnCreateGame = vi.fn();
  const mockOnBack = vi.fn();

  const defaultProps = {
    playerName: 'TestPlayer',
    setPlayerName: mockSetPlayerName,
    onCreateGame: mockOnCreateGame,
    onBack: mockOnBack,
    user: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create game form with all elements', () => {
    renderWithProviders(<GameCreationForm {...defaultProps} />);

    expect(screen.getByText('Create Game')).toBeInTheDocument();
    expect(screen.getByTestId('player-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('persistence-mode-checkbox')).toBeInTheDocument();
    expect(screen.getByTestId('back-button')).toBeInTheDocument();
    expect(screen.getByTestId('submit-create-button')).toBeInTheDocument();
  });

  it('shows player name input with placeholder for guests', () => {
    renderWithProviders(<GameCreationForm {...defaultProps} playerName="" />);

    const input = screen.getByTestId('player-name-input');
    expect(input).toHaveAttribute('placeholder', 'Enter your name');
    expect(input).not.toBeDisabled();
  });

  it('disables player name input for authenticated users', () => {
    const user = { id: 1, username: 'AuthUser', email: 'auth@test.com' };
    renderWithProviders(<GameCreationForm {...defaultProps} user={user as any} />);

    const input = screen.getByTestId('player-name-input');
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute('placeholder', 'Using authenticated username');
  });

  it('defaults to ranked mode (ELO)', () => {
    renderWithProviders(<GameCreationForm {...defaultProps} />);

    const checkbox = screen.getByTestId('persistence-mode-checkbox');
    expect(checkbox).toBeChecked();
    expect(screen.getByText('🏆 Ranked')).toBeInTheDocument();
  });

  it('toggles between ranked and casual mode', async () => {
    const user = userEvent.setup();
    const mockUser = { id: 1, username: 'TestUser', email: 'test@example.com' };
    renderWithProviders(<GameCreationForm {...defaultProps} user={mockUser as any} />);

    const checkbox = screen.getByTestId('persistence-mode-checkbox');

    // Initially ranked
    expect(checkbox).toBeChecked();
    expect(screen.getByText('🏆 Ranked')).toBeInTheDocument();

    // Toggle to casual
    await user.click(checkbox);
    expect(screen.getByText('🎮 Casual')).toBeInTheDocument();

    // Toggle back to ranked
    await user.click(checkbox);
    expect(screen.getByText('🏆 Ranked')).toBeInTheDocument();
  });

  it('shows appropriate info message for ranked mode', () => {
    const mockUser = { id: 1, username: 'TestUser', email: 'test@example.com' };
    renderWithProviders(<GameCreationForm {...defaultProps} user={mockUser as any} />);

    expect(
      screen.getByText('Game will be saved to your profile and affect your ranking')
    ).toBeInTheDocument();
  });

  it('shows appropriate info message for casual mode', async () => {
    const user = userEvent.setup();
    const mockUser = { id: 1, username: 'TestUser', email: 'test@example.com' };
    renderWithProviders(<GameCreationForm {...defaultProps} user={mockUser as any} />);

    const checkbox = screen.getByTestId('persistence-mode-checkbox');
    await user.click(checkbox);

    expect(
      screen.getByText('No stats saved - play without affecting your ELO rating')
    ).toBeInTheDocument();
  });

  it('calls onCreateGame with player name and ranked mode on submit', async () => {
    const user = userEvent.setup();
    renderWithProviders(<GameCreationForm {...defaultProps} />);

    await user.click(screen.getByTestId('submit-create-button'));

    expect(mockOnCreateGame).toHaveBeenCalledWith('TestPlayer', 'elo');
  });

  it('calls onCreateGame with casual mode when checkbox is unchecked', async () => {
    const user = userEvent.setup();
    const mockUser = { id: 1, username: 'TestUser', email: 'test@example.com' };
    renderWithProviders(<GameCreationForm {...defaultProps} user={mockUser as any} />);

    const checkbox = screen.getByTestId('persistence-mode-checkbox');
    await user.click(checkbox);

    await user.click(screen.getByTestId('submit-create-button'));

    expect(mockOnCreateGame).toHaveBeenCalledWith('TestPlayer', 'casual');
  });

  it('calls onBack when back button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<GameCreationForm {...defaultProps} />);

    await user.click(screen.getByTestId('back-button'));

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('updates player name when typing in input', async () => {
    const user = userEvent.setup();
    renderWithProviders(<GameCreationForm {...defaultProps} playerName="" />);

    const input = screen.getByTestId('player-name-input');
    await user.type(input, 'NewPlayer');

    expect(mockSetPlayerName).toHaveBeenCalled();
  });

  it('requires player name to submit', () => {
    renderWithProviders(<GameCreationForm {...defaultProps} playerName="" />);

    const input = screen.getByTestId('player-name-input');
    expect(input).toBeRequired();
  });
});

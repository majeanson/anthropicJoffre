/**
 * QuickPlayPanel Component Tests
 * Sprint 5: Frontend Testing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent } from '../test/utils';
import { QuickPlayPanel } from './QuickPlayPanel';
import { BotDifficulty } from '../utils/botPlayer';

describe('QuickPlayPanel', () => {
  const mockOnBotDifficultyChange = vi.fn();
  const mockSetQuickPlayPersistence = vi.fn();
  const mockOnQuickPlay = vi.fn();

  const defaultProps = {
    botDifficulty: 'medium' as BotDifficulty,
    onBotDifficultyChange: mockOnBotDifficultyChange,
    quickPlayPersistence: 'casual' as 'elo' | 'casual',
    setQuickPlayPersistence: mockSetQuickPlayPersistence,
    onQuickPlay: mockOnQuickPlay,
    user: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with all difficulty buttons', () => {
    renderWithProviders(<QuickPlayPanel {...defaultProps} />);

    expect(screen.getByText('Easy')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Hard')).toBeInTheDocument();
  });

  it('highlights the selected difficulty', () => {
    renderWithProviders(<QuickPlayPanel {...defaultProps} botDifficulty="hard" />);

    const hardButton = screen.getByText('Hard').closest('button');
    expect(hardButton).toHaveClass('bg-umber-600');
  });

  it('shows correct description for each difficulty level', () => {
    const { rerender } = renderWithProviders(<QuickPlayPanel {...defaultProps} botDifficulty="easy" />);
    expect(screen.getByText('Random play, good for beginners')).toBeInTheDocument();

    rerender(<QuickPlayPanel {...defaultProps} botDifficulty="medium" />);
    expect(screen.getByText('Strategic play with positional awareness')).toBeInTheDocument();

    rerender(<QuickPlayPanel {...defaultProps} botDifficulty="hard" />);
    expect(screen.getByText('Advanced AI with card counting')).toBeInTheDocument();
  });

  it('calls onBotDifficultyChange when difficulty button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<QuickPlayPanel {...defaultProps} />);

    await user.click(screen.getByText('Hard'));
    expect(mockOnBotDifficultyChange).toHaveBeenCalledWith('hard');
  });

  it('displays persistence mode toggle', () => {
    renderWithProviders(<QuickPlayPanel {...defaultProps} />);

    expect(screen.getByText('Ranked Mode')).toBeInTheDocument();
    expect(screen.getByText('🎮 Casual')).toBeInTheDocument();
  });

  it('toggles persistence mode when checkbox is clicked', async () => {
    const user = userEvent.setup();
    const mockUser = { id: '1', username: 'testuser', email: 'test@example.com' };
    renderWithProviders(<QuickPlayPanel {...defaultProps} user={mockUser} />);

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(mockSetQuickPlayPersistence).toHaveBeenCalledWith('elo');
  });

  it('disables ranked mode checkbox when user is not authenticated', () => {
    renderWithProviders(<QuickPlayPanel {...defaultProps} user={null} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
    expect(screen.getByText('🔒 Available when registered - Register to enable ranked mode')).toBeInTheDocument();
  });

  it('shows ranked badge when persistence is elo', () => {
    const mockUser = { id: '1', username: 'testuser', email: 'test@example.com' };
    renderWithProviders(<QuickPlayPanel {...defaultProps} quickPlayPersistence="elo" user={mockUser} />);

    expect(screen.getByText('🏆 Ranked')).toBeInTheDocument();
    expect(screen.getByText('Game will be saved to your profile and affect your ranking')).toBeInTheDocument();
  });

  it('calls onQuickPlay with correct parameters when button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<QuickPlayPanel {...defaultProps} />);

    await user.click(screen.getByTestId('quick-play-button'));
    expect(mockOnQuickPlay).toHaveBeenCalledWith('medium', 'casual');
  });

  it('renders Quick Play button with correct text', () => {
    renderWithProviders(<QuickPlayPanel {...defaultProps} />);

    expect(screen.getByText(/Quick Play \(1P \+ 3 Bots\)/)).toBeInTheDocument();
  });
});

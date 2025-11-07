/**
 * StatsPanel Component Tests
 * Sprint 5: Frontend Testing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent, createMockSocket } from '../test/utils';
import { StatsPanel } from './StatsPanel';

describe('StatsPanel', () => {
  const mockSetPlayerName = vi.fn();
  const mockSetSelectedPlayerName = vi.fn();
  const mockSetShowPlayerStats = vi.fn();
  const mockSetShowLeaderboard = vi.fn();
  const mockSetShowBrowser = vi.fn();

  const defaultProps = {
    socket: createMockSocket() as any,
    playerName: 'TestPlayer',
    setPlayerName: mockSetPlayerName,
    setSelectedPlayerName: mockSetSelectedPlayerName,
    setShowPlayerStats: mockSetShowPlayerStats,
    setShowLeaderboard: mockSetShowLeaderboard,
    setShowBrowser: mockSetShowBrowser,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all stat buttons', () => {
    renderWithProviders(<StatsPanel {...defaultProps} />);

    expect(screen.getByText('My Stats')).toBeInTheDocument();
    expect(screen.getByText('Global Leaderboard')).toBeInTheDocument();
    expect(screen.getByText('Recent Games')).toBeInTheDocument();
  });

  it('opens player stats when My Stats button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<StatsPanel {...defaultProps} />);

    await user.click(screen.getByText('My Stats'));

    expect(mockSetSelectedPlayerName).toHaveBeenCalledWith('TestPlayer');
    expect(mockSetShowPlayerStats).toHaveBeenCalledWith(true);
  });

  it('opens leaderboard when Global Leaderboard button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<StatsPanel {...defaultProps} />);

    await user.click(screen.getByText('Global Leaderboard'));

    expect(mockSetShowLeaderboard).toHaveBeenCalledWith(true);
  });

  it('opens browser when Recent Games button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<StatsPanel {...defaultProps} />);

    await user.click(screen.getByText('Recent Games'));

    expect(mockSetShowBrowser).toHaveBeenCalledWith(true);
  });

  it('disables My Stats and Leaderboard buttons when socket is null', () => {
    renderWithProviders(<StatsPanel {...defaultProps} socket={null} />);

    const myStatsButton = screen.getByText('My Stats').closest('button');
    const leaderboardButton = screen.getByText('Global Leaderboard').closest('button');

    expect(myStatsButton).toBeDisabled();
    expect(leaderboardButton).toBeDisabled();
  });

  it('shows warning message when socket is null', () => {
    renderWithProviders(<StatsPanel {...defaultProps} socket={null} />);

    expect(screen.getByText('⚠️ Connect to server to view stats')).toBeInTheDocument();
  });

  it('Recent Games button is always enabled', () => {
    renderWithProviders(<StatsPanel {...defaultProps} socket={null} />);

    const recentGamesButton = screen.getByText('Recent Games').closest('button');
    expect(recentGamesButton).not.toBeDisabled();
  });

  it('displays player statistics title', () => {
    renderWithProviders(<StatsPanel {...defaultProps} />);

    expect(screen.getByText('Player Statistics')).toBeInTheDocument();
  });
});

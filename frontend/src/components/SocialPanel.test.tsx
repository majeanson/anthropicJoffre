/**
 * SocialPanel Component Tests
 * Sprint 5: Frontend Testing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent } from '../test/utils';
import { SocialPanel } from './SocialPanel';
import { OnlinePlayer } from '../types/game';
import { RecentPlayer } from '../utils/recentPlayers';

describe('SocialPanel', () => {
  const mockSetSocialTab = vi.fn();
  const mockSetPlayerName = vi.fn();
  const mockOnJoinGame = vi.fn();

  const onlinePlayers: OnlinePlayer[] = [
    {
      socketId: 'socket-1',
      playerName: 'Alice',
      status: 'in_game',
      gameId: 'game-123',
      lastActivity: Date.now(),
    },
    {
      socketId: 'socket-2',
      playerName: 'Bob',
      status: 'in_lobby',
      gameId: undefined,
      lastActivity: Date.now(),
    },
  ];

  const recentPlayers: RecentPlayer[] = [
    {
      name: 'Charlie',
      gamesPlayed: 5,
      lastPlayed: Date.now(),
    },
    {
      name: 'Bot Easy',
      gamesPlayed: 10,
      lastPlayed: Date.now() - 1000000,
    },
  ];

  const defaultProps = {
    socialTab: 'online' as 'recent' | 'online' | 'chat' | 'friends',
    setSocialTab: mockSetSocialTab,
    onlinePlayers,
    recentPlayers,
    playerName: 'TestPlayer',
    setPlayerName: mockSetPlayerName,
    onJoinGame: mockOnJoinGame,
    socket: null,
    user: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders online and recent tab buttons', () => {
    renderWithProviders(<SocialPanel {...defaultProps} />);

    expect(screen.getByText(/Online \(2\)/)).toBeInTheDocument();
    expect(screen.getByText('📜 Recent')).toBeInTheDocument();
  });

  it('switches tabs when tab buttons are clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SocialPanel {...defaultProps} />);

    await user.click(screen.getByText('📜 Recent'));
    expect(mockSetSocialTab).toHaveBeenCalledWith('recent');
  });

  it('displays online players when on online tab', () => {
    renderWithProviders(<SocialPanel {...defaultProps} socialTab="online" />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows join button for players in game', () => {
    renderWithProviders(<SocialPanel {...defaultProps} socialTab="online" />);

    const joinButtons = screen.queryAllByText('🎮 Join');
    expect(joinButtons).toHaveLength(1); // Only Alice is in a game
  });

  it('does not show join button for players in lobby', () => {
    renderWithProviders(<SocialPanel {...defaultProps} socialTab="online" />);

    const bobElement = screen.getByText('Bob');
    const bobContainer = bobElement.closest('div')?.parentElement;

    expect(bobContainer?.querySelector('button')).toBeNull();
  });

  it('displays message when no online players', () => {
    renderWithProviders(
      <SocialPanel
        {...defaultProps}
        onlinePlayers={[]}
        socialTab="online"
      />
    );

    expect(screen.getByText('No players online')).toBeInTheDocument();
  });

  it('displays recent players when on recent tab', () => {
    renderWithProviders(<SocialPanel {...defaultProps} socialTab="recent" />);

    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('filters out bot players from recent list', () => {
    renderWithProviders(<SocialPanel {...defaultProps} socialTab="recent" />);

    expect(screen.queryByText('Bot Easy')).not.toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('shows game count for recent players', () => {
    renderWithProviders(<SocialPanel {...defaultProps} socialTab="recent" />);

    expect(screen.getByText(/5 games/)).toBeInTheDocument();
  });

  it('displays message when no recent players', () => {
    renderWithProviders(
      <SocialPanel
        {...defaultProps}
        recentPlayers={[]}
        socialTab="recent"
      />
    );

    expect(screen.getByText('No recent players yet')).toBeInTheDocument();
  });

  it('shows player status labels correctly', () => {
    renderWithProviders(<SocialPanel {...defaultProps} socialTab="online" />);

    expect(screen.getByText('Playing')).toBeInTheDocument();
    expect(screen.getByText('In Lobby')).toBeInTheDocument();
  });
});

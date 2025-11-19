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

    // Online tab shows emoji and count: "🟢 2"
    expect(screen.getByText(/🟢\s*2/)).toBeInTheDocument();
    // Recent tab has been replaced with messages, friends, profile, and chat tabs
    // The component now has: 💬 (messages), 👥 (friends), 🟢 (online), 👤 (profile), 💭 (chat)
    expect(screen.getByText(/💬/)).toBeInTheDocument();
  });

  it('switches tabs when tab buttons are clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SocialPanel {...defaultProps} />);

    // Click the chat tab (💭 emoji button)
    const chatButton = screen.getByRole('button', { name: /💭/ });
    await user.click(chatButton);
    expect(mockSetSocialTab).toHaveBeenCalledWith('chat');
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

    // Bob is in lobby, so should not have a "🎮 Join" button
    // Note: The PlayerNameButton is a button, but not a join button
    const joinButton = bobContainer?.querySelector('button[title="Join their game"]');
    expect(joinButton).toBeNull();
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

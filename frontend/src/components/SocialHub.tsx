/**
 * SocialHub Component - Multi-Skin Edition
 *
 * Unified social panel with friends, achievements, recent players, and suggestions.
 * Uses CSS variables for skin compatibility.
 */

import { useState, useEffect, Suspense } from 'react';
import { Socket } from 'socket.io-client';
import { CardSkeleton } from './ui/Skeleton';
import { Button, Tabs, Tab } from './ui';
import { useAuth } from '../contexts/AuthContext';
import Avatar from './Avatar';
import { PlayerNameButton } from './PlayerNameButton';
import { GameHistoryEntry } from '../types/game';

type SocialTab = 'friends' | 'achievements' | 'recent' | 'suggestions';

interface SocialHubProps {
  isOpen: boolean;
  onClose: () => void;
  socket: Socket | null;
  currentUsername?: string;
  initialTab?: SocialTab;
  onPlayerClick?: (playerName: string) => void;
  onSendMessage?: (playerName: string) => void;
}

interface RecentPlayer {
  playerName: string;
  lastPlayed: string;
  gamesPlayed: number;
  isFriend: boolean;
}

interface FriendSuggestion {
  playerName: string;
  reason: string;
  gamesPlayed?: number;
  mutualFriends?: number;
}

export function SocialHub({
  isOpen,
  onClose,
  socket,
  currentUsername,
  initialTab = 'friends',
  onPlayerClick,
  onSendMessage
}: SocialHubProps) {
  // Early return BEFORE hooks
  if (!isOpen) return null;

  // Now safe to call hooks
  const [activeTab, setActiveTab] = useState<SocialTab>(initialTab);
  const [recentPlayers, setRecentPlayers] = useState<RecentPlayer[]>([]);
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const { user, isAuthenticated } = useAuth();

  // Load recent players
  useEffect(() => {
    if (!socket || !isAuthenticated || activeTab !== 'recent') return;

    setLoading(true);
    socket.emit('get_player_history', { playerName: currentUsername || user?.username, limit: 10 });

    const handlePlayerHistory = ({ games }: { games: GameHistoryEntry[] }) => {
      const playersMap = new Map<string, RecentPlayer>();

      games.forEach((game: GameHistoryEntry) => {
        const playerNames = game.player_names || [];
        playerNames.forEach((name: string) => {
          if (name !== (currentUsername || user?.username)) {
            const existing = playersMap.get(name);
            if (existing) {
              existing.gamesPlayed++;
            } else {
              playersMap.set(name, {
                playerName: name,
                lastPlayed: game.finished_at?.toString() || new Date().toISOString(),
                gamesPlayed: 1,
                isFriend: false
              });
            }
          }
        });
      });

      setRecentPlayers(Array.from(playersMap.values()).sort((a, b) => b.gamesPlayed - a.gamesPlayed));
      setLoading(false);
    };

    socket.on('player_history', handlePlayerHistory);

    return () => {
      socket.off('player_history', handlePlayerHistory);
    };
  }, [socket, isAuthenticated, activeTab, currentUsername, user]);

  // Generate friend suggestions
  useEffect(() => {
    if (!socket || !isAuthenticated || activeTab !== 'suggestions') return;

    const playerSuggestions: FriendSuggestion[] = recentPlayers
      .filter(p => !p.isFriend)
      .slice(0, 10)
      .map(p => ({
        playerName: p.playerName,
        reason: `Played together ${p.gamesPlayed} time${p.gamesPlayed > 1 ? 's' : ''}`,
        gamesPlayed: p.gamesPlayed
      }));

    setSuggestions(playerSuggestions);
  }, [socket, isAuthenticated, activeTab, recentPlayers]);

  const handleSendFriendRequest = (playerName: string) => {
    if (!socket) return;
    socket.emit('send_friend_request', { toPlayer: playerName });
  };

  // Tab definitions
  const socialTabs: Tab[] = [
    { id: 'friends', label: 'Friends', icon: '👥' },
    { id: 'achievements', label: 'Achievements', icon: '🏆' },
    { id: 'recent', label: 'Recent Players', icon: '🕐' },
    { id: 'suggestions', label: 'Suggestions', icon: '✨' },
  ];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div
        className="rounded-[var(--radius-xl)] border-2 w-full max-w-4xl h-[700px] shadow-2xl flex flex-col"
        style={{
          background: 'linear-gradient(to bottom right, var(--color-bg-secondary), var(--color-bg-primary))',
          borderColor: 'var(--color-border-accent)',
          boxShadow: 'var(--shadow-glow)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: 'var(--color-border-default)' }}
        >
          <h2
            className="text-2xl font-display uppercase tracking-wider"
            style={{ color: 'var(--color-text-accent)' }}
          >
            Social Hub
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            aria-label="Close"
          >
            ×
          </Button>
        </div>

        {/* Tabs */}
        <div style={{ borderBottom: '1px solid var(--color-border-default)' }}>
          <Tabs
            tabs={socialTabs}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as SocialTab)}
            variant="pills"
            size="md"
            fullWidth
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'friends' && (
            <Suspense fallback={
              <div className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
                Loading friends...
              </div>
            }>
              <div className="p-6">
                <p style={{ color: 'var(--color-text-muted)' }} className="mb-4">
                  Friends panel content will appear here. Use existing FriendsPanel component.
                </p>
              </div>
            </Suspense>
          )}

          {activeTab === 'achievements' && (
            <Suspense fallback={
              <div className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
                Loading achievements...
              </div>
            }>
              <div className="p-6">
                <p style={{ color: 'var(--color-text-muted)' }} className="mb-4">
                  Achievements panel content will appear here. Use existing AchievementsPanel component.
                </p>
              </div>
            </Suspense>
          )}

          {activeTab === 'recent' && (
            <div className="p-6">
              {loading && <CardSkeleton count={5} hasAvatar={true} />}
              {!loading && recentPlayers.length === 0 && (
                <div className="text-center py-8">
                  <p className="mb-2" style={{ color: 'var(--color-text-muted)' }}>No recent players</p>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Play some games to see players you've played with!
                  </p>
                </div>
              )}
              <div className="space-y-3">
                {recentPlayers.map((player) => (
                  <div
                    key={player.playerName}
                    className="rounded-[var(--radius-lg)] p-4 flex items-center justify-between border transition-colors hover:border-[var(--color-border-accent)]"
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      borderColor: 'var(--color-border-default)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar username={player.playerName} size="md" />
                      <div>
                        {onPlayerClick ? (
                          <PlayerNameButton
                            playerName={player.playerName}
                            onClick={() => onPlayerClick(player.playerName)}
                            variant="plain"
                            className="text-lg font-semibold"
                          />
                        ) : (
                          <p
                            className="text-lg font-semibold"
                            style={{ color: 'var(--color-text-primary)' }}
                          >
                            {player.playerName}
                          </p>
                        )}
                        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                          Played together {player.gamesPlayed} time{player.gamesPlayed > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!player.isFriend && (
                        <Button
                          onClick={() => handleSendFriendRequest(player.playerName)}
                          variant="success"
                          size="sm"
                        >
                          ➕ Add Friend
                        </Button>
                      )}
                      {onSendMessage && (
                        <Button
                          onClick={() => onSendMessage(player.playerName)}
                          variant="primary"
                          size="sm"
                        >
                          💬 Message
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'suggestions' && (
            <div className="p-6">
              {suggestions.length === 0 && (
                <div className="text-center py-8">
                  <p className="mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    No friend suggestions yet
                  </p>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Play more games to get friend suggestions!
                  </p>
                </div>
              )}
              <div className="space-y-3">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.playerName}
                    className="rounded-[var(--radius-lg)] p-4 flex items-center justify-between border transition-colors hover:border-[var(--color-success)]"
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      borderColor: 'var(--color-border-default)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar username={suggestion.playerName} size="md" />
                      <div>
                        {onPlayerClick ? (
                          <PlayerNameButton
                            playerName={suggestion.playerName}
                            onClick={() => onPlayerClick(suggestion.playerName)}
                            variant="plain"
                            className="text-lg font-semibold"
                          />
                        ) : (
                          <p
                            className="text-lg font-semibold"
                            style={{ color: 'var(--color-text-primary)' }}
                          >
                            {suggestion.playerName}
                          </p>
                        )}
                        <p className="text-sm" style={{ color: 'var(--color-success)' }}>
                          {suggestion.reason}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleSendFriendRequest(suggestion.playerName)}
                      variant="success"
                      size="sm"
                    >
                      ➕ Add Friend
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

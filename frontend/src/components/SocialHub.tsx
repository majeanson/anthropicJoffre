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
  onSendMessage,
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
                isFriend: false,
              });
            }
          }
        });
      });

      setRecentPlayers(
        Array.from(playersMap.values()).sort((a, b) => b.gamesPlayed - a.gamesPlayed)
      );
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
      .filter((p) => !p.isFriend)
      .slice(0, 10)
      .map((p) => ({
        playerName: p.playerName,
        reason: `Played together ${p.gamesPlayed} time${p.gamesPlayed > 1 ? 's' : ''}`,
        gamesPlayed: p.gamesPlayed,
      }));

    setSuggestions(playerSuggestions);
  }, [socket, isAuthenticated, activeTab, recentPlayers]);

  // Close modal on Escape key for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
      className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/70"
      onClick={onClose}
      onKeyDown={(e) => e.stopPropagation()}
      role="presentation"
      aria-hidden="true"
    >
      <div
        className="rounded-[var(--radius-xl)] border-2 border-skin-accent w-full max-w-4xl h-[calc(100vh-2rem)] max-h-[700px] shadow-2xl flex flex-col shadow-[var(--shadow-glow)] bg-gradient-to-br from-skin-secondary to-skin-primary"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-skin-default">
          <h2 className="text-2xl font-display uppercase tracking-wider text-skin-accent">
            Social Hub
          </h2>
          <Button onClick={onClose} variant="ghost" size="sm" aria-label="Close">
            ×
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b border-skin-default">
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
            <Suspense
              fallback={<div className="p-8 text-center text-skin-muted">Loading friends...</div>}
            >
              <div className="p-6">
                <p className="mb-4 text-skin-muted">
                  Friends panel content will appear here. Use existing FriendsPanel component.
                </p>
              </div>
            </Suspense>
          )}

          {activeTab === 'achievements' && (
            <Suspense
              fallback={
                <div className="p-8 text-center text-skin-muted">Loading achievements...</div>
              }
            >
              <div className="p-6">
                <p className="mb-4 text-skin-muted">
                  Achievements panel content will appear here. Use existing AchievementsPanel
                  component.
                </p>
              </div>
            </Suspense>
          )}

          {activeTab === 'recent' && (
            <div className="p-6">
              {loading && <CardSkeleton count={5} hasAvatar={true} />}
              {!loading && recentPlayers.length === 0 && (
                <div className="text-center py-8">
                  <p className="mb-2 text-skin-muted">No recent players</p>
                  <p className="text-sm text-skin-muted">
                    Play some games to see players you've played with!
                  </p>
                </div>
              )}
              <div className="space-y-3">
                {recentPlayers.map((player) => (
                  <div
                    key={player.playerName}
                    className="rounded-[var(--radius-lg)] p-4 flex items-center justify-between border transition-colors hover:border-skin-accent bg-skin-tertiary border-skin-default"
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
                          <p className="text-lg font-semibold text-skin-primary">
                            {player.playerName}
                          </p>
                        )}
                        <p className="text-sm text-skin-muted">
                          Played together {player.gamesPlayed} time
                          {player.gamesPlayed > 1 ? 's' : ''}
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
                  <p className="mb-2 text-skin-muted">No friend suggestions yet</p>
                  <p className="text-sm text-skin-muted">
                    Play more games to get friend suggestions!
                  </p>
                </div>
              )}
              <div className="space-y-3">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.playerName}
                    className="rounded-[var(--radius-lg)] p-4 flex items-center justify-between border transition-colors hover:border-skin-success bg-skin-tertiary border-skin-default"
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
                          <p className="text-lg font-semibold text-skin-primary">
                            {suggestion.playerName}
                          </p>
                        )}
                        <p className="text-sm text-skin-success">{suggestion.reason}</p>
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

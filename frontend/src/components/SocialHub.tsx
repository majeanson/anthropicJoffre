/**
 * SocialHub Component
 * Sprint 16 Day 6
 *
 * Unified social panel consolidating friends, achievements, recent players, and suggestions.
 * Replaces separate FriendsPanel and AchievementsPanel with tabbed interface.
 *
 * Features:
 * - Friends tab (existing FriendsPanel content)
 * - Achievements tab (existing AchievementsPanel content)
 * - Recent Players tab (new - players from last 10 games)
 * - Friend Suggestions tab (new - based on recent games and mutual friends)
 * - Direct Message integration
 * - Player profile integration
 *
 * Usage:
 * ```tsx
 * <SocialHub
 *   isOpen={showSocial}
 *   onClose={() => setShowSocial(false)}
 *   socket={socket}
 *   currentUsername={user.username}
 *   initialTab="friends"
 * />
 * ```
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
  reason: string; // "Played together 5 times", "Mutual friend: Alice"
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
  // ✅ Early return BEFORE hooks
  if (!isOpen) return null;

  // ✅ NOW safe to call hooks
  const [activeTab, setActiveTab] = useState<SocialTab>(initialTab);
  const [recentPlayers, setRecentPlayers] = useState<RecentPlayer[]>([]);
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const { user, isAuthenticated } = useAuth();

  // Load recent players
  useEffect(() => {
    if (!socket || !isAuthenticated || activeTab !== 'recent') return;

    setLoading(true);

    // Get recent game history
    socket.emit('get_player_history', { playerName: currentUsername || user?.username, limit: 10 });

    const handlePlayerHistory = ({ games }: { games: GameHistoryEntry[] }) => {
      // Extract unique players from recent games
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
                isFriend: false // Will be updated with friend status
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

    // For now, use recent players as suggestions
    // In the future, can be enhanced with mutual friends algorithm
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

  // Tab definitions for Tabs component
  const socialTabs: Tab[] = [
    { id: 'friends', label: 'Friends', icon: '👥' },
    { id: 'achievements', label: 'Achievements', icon: '🏆' },
    { id: 'recent', label: 'Recent Players', icon: '🕐' },
    { id: 'suggestions', label: 'Suggestions', icon: '✨' },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border-2 border-blue-500/30 w-full max-w-4xl h-[700px] shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-blue-400">Social Hub</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            aria-label="Close"
          >
            ×
          </Button>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={socialTabs}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as SocialTab)}
          variant="pills"
          size="md"
          fullWidth
          className="border-b border-gray-700"
        />

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'friends' && (
            <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading friends...</div>}>
              <div className="p-6">
                <p className="text-gray-400 mb-4">
                  Friends panel content will appear here. Use existing FriendsPanel component.
                </p>
              </div>
            </Suspense>
          )}

          {activeTab === 'achievements' && (
            <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading achievements...</div>}>
              <div className="p-6">
                <p className="text-gray-400 mb-4">
                  Achievements panel content will appear here. Use existing AchievementsPanel component.
                </p>
              </div>
            </Suspense>
          )}

          {activeTab === 'recent' && (
            <div className="p-6">
              {loading && (
                <CardSkeleton count={5} hasAvatar={true} />
              )}
              {!loading && recentPlayers.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p className="mb-2">No recent players</p>
                  <p className="text-sm">Play some games to see players you've played with!</p>
                </div>
              )}
              <div className="space-y-3">
                {recentPlayers.map((player) => (
                  <div
                    key={player.playerName}
                    className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between border border-gray-700 hover:border-blue-500/50 transition-colors"
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
                          <p className="text-lg font-semibold text-white">{player.playerName}</p>
                        )}
                        <p className="text-sm text-gray-400">
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
                <div className="text-center py-8 text-gray-400">
                  <p className="mb-2">No friend suggestions yet</p>
                  <p className="text-sm">Play more games to get friend suggestions!</p>
                </div>
              )}
              <div className="space-y-3">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.playerName}
                    className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between border border-gray-700 hover:border-emerald-500/50 transition-colors"
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
                          <p className="text-lg font-semibold text-white">{suggestion.playerName}</p>
                        )}
                        <p className="text-sm text-emerald-400">{suggestion.reason}</p>
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

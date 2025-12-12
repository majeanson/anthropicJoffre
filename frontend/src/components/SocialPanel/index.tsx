/**
 * SocialPanel Component
 * Enhanced Social Hub for Lobby
 *
 * Comprehensive social experience with:
 * - Messages tab: Direct messaging with conversation list
 * - Friends tab: Friends list with friend suggestions and recent players
 * - Online tab: Currently online players with join functionality
 *
 * Features:
 * - Direct message integration
 * - Friend management (add/remove)
 * - Friend suggestions based on recent games
 * - Recent players tracking
 * - Online player status
 *
 * Refactored to use sub-components and extracted hooks:
 * - useFriendsState: Friends list and requests management
 * - usePlayerSearch: Player search functionality
 * - useProfileState: Profile editing state
 */

import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { OnlinePlayer } from '../../types/game';
import { RecentPlayer } from '../../utils/recentPlayers';
import { sounds } from '../../utils/sounds';
import { User } from '../../types/auth';
import { DirectMessagesPanel } from '../DirectMessagesPanel';
import { PlayerProfileModal } from '../PlayerProfileModal';
import { UnifiedChat } from '../UnifiedChat';
import type { ChatMessage } from '../../types/game';
import { Button } from '../ui/Button';
import { MessagesTab } from './MessagesTab';
import { OnlineTab } from './OnlineTab';
import { FriendsTab } from './FriendsTab';
import { ProfileTab } from './ProfileTab';
import { RecentTab } from './RecentTab';
import { useFriendsState } from './useFriendsState';
import { usePlayerSearch } from './usePlayerSearch';
import { useProfileState } from './useProfileState';

export type SocialPanelTabType = 'recent' | 'online' | 'chat' | 'friends' | 'messages' | 'profile';

interface SocialPanelProps {
  socialTab: SocialPanelTabType;
  setSocialTab: (tab: SocialPanelTabType) => void;
  onlinePlayers: OnlinePlayer[];
  recentPlayers: RecentPlayer[];
  playerName: string;
  setPlayerName: (name: string) => void;
  onJoinGame: (gameId: string, playerName: string) => void;
  socket: Socket | null;
  user: User | null;
  lobbyMessages?: ChatMessage[];
  sendLobbyMessage?: (message: string) => void;
  onShowWhyRegister?: () => void;
  onOpenLounge?: () => void;
}

export function SocialPanel({
  socialTab,
  setSocialTab,
  onlinePlayers,
  recentPlayers,
  playerName,
  setPlayerName,
  onJoinGame,
  socket,
  user,
  lobbyMessages = [],
  sendLobbyMessage = () => {},
  onShowWhyRegister,
  onOpenLounge,
}: SocialPanelProps) {
  const [showDirectMessages, setShowDirectMessages] = useState(false);
  const [unreadDMCount, setUnreadDMCount] = useState(0);
  const [friendSuggestions, setFriendSuggestions] = useState<string[]>([]);
  const [selectedPlayerProfile, setSelectedPlayerProfile] = useState<string | null>(null);

  // Looking for Game (LFG) state
  const [isLookingForGame, setIsLookingForGame] = useState(false);

  // Use extracted hooks
  const {
    friends,
    isLoadingFriends,
    friendsError,
    pendingRequests,
    sentRequests,
    handleSendFriendRequest,
    handleAcceptRequest,
    handleRejectRequest,
    handleRemoveFriend,
    handleRetryFriends,
  } = useFriendsState({ socket, user, socialTab });

  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    isSearching,
    handleSearch,
  } = usePlayerSearch({ socket, user });

  const {
    profileBio,
    setProfileBio,
    profileCountry,
    setProfileCountry,
    profileFavoriteTeam,
    setProfileFavoriteTeam,
    isEditingProfile,
    setIsEditingProfile,
    isSavingProfile,
    handleSaveProfile,
    handleCancelEdit,
  } = useProfileState({ socket, user, socialTab });

  // Load friend suggestions based on recent players
  useEffect(() => {
    if (socialTab === 'friends' && user) {
      const suggestions = recentPlayers
        .filter((rp) => !friends.some((f) => f.player_name === rp.name))
        .filter((rp) => !rp.name.startsWith('Bot '))
        .slice(0, 5)
        .map((rp) => rp.name);
      setFriendSuggestions(suggestions);
    }
  }, [socialTab, recentPlayers, friends, user]);

  // Listen for LFG status updates
  useEffect(() => {
    if (!socket) return;

    const handleLfgUpdated = ({ lookingForGame }: { lookingForGame: boolean }) => {
      setIsLookingForGame(lookingForGame);
    };

    const handleError = ({ message, context }: { message: string; context?: string }) => {
      if (context === 'set_looking_for_game') {
        alert(message);
      }
    };

    socket.on('looking_for_game_updated', handleLfgUpdated);
    socket.on('error', handleError);

    return () => {
      socket.off('looking_for_game_updated', handleLfgUpdated);
      socket.off('error', handleError);
    };
  }, [socket]);

  // Handle LFG toggle
  const handleToggleLfg = () => {
    if (!socket) return;
    if (!playerName.trim()) {
      alert('Please enter your name first to use Looking for Game');
      return;
    }
    socket.emit('set_looking_for_game', { lookingForGame: !isLookingForGame });
  };

  // Listen for unread DM count
  useEffect(() => {
    if (!socket || !user) return;

    socket.emit('get_unread_count');

    const handleUnreadCount = ({ count }: { count: number }) => {
      setUnreadDMCount(count);
    };

    socket.on('unread_count', handleUnreadCount);

    return () => {
      socket.off('unread_count', handleUnreadCount);
    };
  }, [socket, user]);

  return (
    <>
      {/* Sub-tabs for Social - Reordered: Messages | Friends | Online | Profile | Chat */}
      <div className="grid grid-cols-5 gap-1.5">
        <Button
          data-keyboard-nav="social-messages"
          data-nav-subtab="messages"
          onClick={() => {
            sounds.buttonClick();
            if (!user) {
              alert('Please log in to view messages');
              return;
            }
            setSocialTab('messages');
          }}
          variant={socialTab === 'messages' ? 'primary' : 'ghost'}
          size="sm"
          className="relative"
        >
          💬
          {unreadDMCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold text-[10px]">
              {unreadDMCount}
            </span>
          )}
        </Button>
        <Button
          data-keyboard-nav="social-friends"
          data-nav-subtab="friends"
          onClick={() => {
            sounds.buttonClick();
            if (!user) {
              alert('Please log in to view friends');
              return;
            }
            setSocialTab('friends');
          }}
          variant={socialTab === 'friends' ? 'primary' : 'ghost'}
          size="sm"
        >
          👥
        </Button>
        <Button
          data-keyboard-nav="social-online"
          data-nav-subtab="online"
          onClick={() => {
            sounds.buttonClick();
            setSocialTab('online');
          }}
          variant={socialTab === 'online' ? 'primary' : 'ghost'}
          size="sm"
        >
          🟢 {onlinePlayers.length}
        </Button>
        <Button
          data-keyboard-nav="social-profile"
          data-nav-subtab="profile"
          onClick={() => {
            sounds.buttonClick();
            if (!user) {
              alert('Please log in to view your profile');
              return;
            }
            setSocialTab('profile');
          }}
          variant={socialTab === 'profile' ? 'primary' : 'ghost'}
          size="sm"
        >
          👤
        </Button>
        <Button
          data-keyboard-nav="social-chat"
          data-nav-subtab="chat"
          onClick={() => {
            sounds.buttonClick();
            setSocialTab('chat');
          }}
          variant={socialTab === 'chat' ? 'primary' : 'ghost'}
          size="sm"
        >
          💭
        </Button>
        {/* Go to Lounge button - always visible */}
        {onOpenLounge && (
          <Button
            onClick={() => {
              sounds.buttonClick();
              onOpenLounge();
            }}
            variant="secondary"
            size="sm"
            className="ml-auto bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-500/50 hover:border-purple-400"
            title="Go to the Social Lounge"
          >
            🛋️ Lounge
          </Button>
        )}
      </div>

      {/* Content Area */}
      <div className="bg-skin-secondary rounded-lg p-4 border-2 border-skin-default min-h-[320px] max-h-[320px] overflow-y-auto">
        {/* Messages Tab */}
        {socialTab === 'messages' && (
          <MessagesTab
            user={user}
            unreadDMCount={unreadDMCount}
            onOpenMessages={() => setShowDirectMessages(true)}
          />
        )}

        {/* Online Tab */}
        {socialTab === 'online' && (
          <OnlineTab
            onlinePlayers={onlinePlayers}
            friends={friends}
            playerName={playerName}
            user={user}
            isLookingForGame={isLookingForGame}
            onToggleLfg={handleToggleLfg}
            onSendFriendRequest={handleSendFriendRequest}
            onJoinGame={onJoinGame}
            onViewProfile={setSelectedPlayerProfile}
            setPlayerName={setPlayerName}
          />
        )}

        {/* Recent Tab */}
        {socialTab === 'recent' && (
          <RecentTab
            recentPlayers={recentPlayers}
            onViewProfile={setSelectedPlayerProfile}
          />
        )}

        {/* Friends Tab */}
        {socialTab === 'friends' && (
          <FriendsTab
            user={user}
            friends={friends}
            pendingRequests={pendingRequests}
            sentRequests={sentRequests}
            friendSuggestions={friendSuggestions}
            onlinePlayers={onlinePlayers}
            playerName={playerName}
            isLoading={isLoadingFriends}
            error={friendsError}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResults={searchResults}
            isSearching={isSearching}
            onSearch={handleSearch}
            onSendFriendRequest={handleSendFriendRequest}
            onAcceptRequest={handleAcceptRequest}
            onRejectRequest={handleRejectRequest}
            onRemoveFriend={handleRemoveFriend}
            onJoinGame={onJoinGame}
            onViewProfile={setSelectedPlayerProfile}
            onRetry={handleRetryFriends}
            setPlayerName={setPlayerName}
            setSearchResults={setSearchResults}
          />
        )}

        {/* Chat Tab */}
        {socialTab === 'chat' && (
          <div className="space-y-2 -m-4">
            <UnifiedChat
              mode="embedded"
              context="lobby"
              socket={socket}
              currentPlayerId={playerName}
              messages={lobbyMessages}
              onSendMessage={(message) => {
                if (!playerName.trim()) {
                  const name = window.prompt('Please enter your name to chat:');
                  if (name && name.trim()) {
                    setPlayerName(name.trim());
                    localStorage.setItem('playerName', name.trim());
                    setTimeout(() => sendLobbyMessage(message), 100);
                  }
                } else {
                  sendLobbyMessage(message);
                }
              }}
              placeholder={playerName.trim() ? 'Type a message...' : 'Click to enter your name...'}
              className="h-[328px]"
            />
          </div>
        )}

        {/* Profile Tab */}
        {socialTab === 'profile' && (
          <ProfileTab
            user={user}
            profileBio={profileBio}
            setProfileBio={setProfileBio}
            profileCountry={profileCountry}
            setProfileCountry={setProfileCountry}
            profileFavoriteTeam={profileFavoriteTeam}
            setProfileFavoriteTeam={setProfileFavoriteTeam}
            isEditingProfile={isEditingProfile}
            setIsEditingProfile={setIsEditingProfile}
            isSavingProfile={isSavingProfile}
            onSaveProfile={handleSaveProfile}
            onCancelEdit={handleCancelEdit}
            friendsCount={friends.length}
            unreadDMCount={unreadDMCount}
            onOpenMessages={() => setShowDirectMessages(true)}
            onViewFriends={() => setSocialTab('friends')}
          />
        )}
      </div>

      {/* Direct Messages Modal */}
      {user && (
        <DirectMessagesPanel
          isOpen={showDirectMessages}
          onClose={() => {
            setShowDirectMessages(false);
            if (socket) {
              socket.emit('get_unread_count');
            }
          }}
          socket={socket}
          currentUsername={user.username}
        />
      )}

      {/* Player Profile Modal */}
      {selectedPlayerProfile && socket && (
        <PlayerProfileModal
          playerName={selectedPlayerProfile}
          socket={socket}
          isOpen={!!selectedPlayerProfile}
          onClose={() => setSelectedPlayerProfile(null)}
          onShowWhyRegister={() => {
            setSelectedPlayerProfile(null);
            onShowWhyRegister?.();
          }}
        />
      )}
    </>
  );
}

// Re-export sub-components for backwards compatibility
export { MessagesTab, OnlineTab, FriendsTab, ProfileTab, RecentTab };

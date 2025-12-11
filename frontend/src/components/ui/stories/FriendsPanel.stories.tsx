/**
 * FriendsPanel Stories
 * Storybook stories for the FriendsPanel component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Modal, Button, SocialListItem, UIBadge, Tabs, Input, EmptyState, LoadingState } from '../';
import type { Tab } from '../Tabs';

// Mock the FriendsPanel UI since it requires socket connection
const FriendsPanelMock = ({
  isOpen,
  onClose,
  activeTab: initialTab = 'friends',
  friends = [],
  pendingRequests = [],
  sentRequests = [],
  searchResults = [],
  isLoading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: 'friends' | 'requests' | 'search';
  friends?: Array<{ player_name: string; status: string; is_online: boolean; game_id?: string }>;
  pendingRequests?: Array<{ id: number; from_player: string; created_at: string }>;
  sentRequests?: Array<{ id: number; to_player: string; created_at: string }>;
  searchResults?: Array<{ player_name: string; games_played: number; games_won: number }>;
  isLoading?: boolean;
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const tabs: Tab[] = [
    { id: 'friends', label: `Friends (${friends.length})`, icon: '👥' },
    { id: 'requests', label: 'Requests', icon: '📩', badge: pendingRequests.length },
    { id: 'search', label: 'Add Friends', icon: '🔍' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Friends"
      icon={<span className="text-3xl">👥</span>}
      theme="purple"
      size="lg"
    >
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as 'friends' | 'requests' | 'search')}
        variant="boxed"
        fullWidth
        className="-mt-4 mb-4"
      />

      <div className="space-y-4">
        {activeTab === 'friends' && (
          <div className="space-y-3">
            {friends.length === 0 ? (
              <EmptyState
                icon="👥"
                title="No friends yet"
                description="Add some friends to get started!"
              />
            ) : (
              friends.map((friend) => (
                <SocialListItem
                  key={friend.player_name}
                  playerName={friend.player_name}
                  status={friend.status as 'online' | 'offline' | 'in_game'}
                  actions={
                    <div className="flex items-center gap-2">
                      {friend.is_online && friend.game_id && (
                        <Button variant="primary" size="sm">
                          Watch
                        </Button>
                      )}
                      <Button variant="danger" size="sm">
                        Remove
                      </Button>
                    </div>
                  }
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-skin-primary mb-3">
                Received Requests
              </h3>
              <div className="space-y-3">
                {pendingRequests.length === 0 ? (
                  <EmptyState icon="📬" title="No pending requests" compact />
                ) : (
                  pendingRequests.map((request) => (
                    <SocialListItem
                      key={request.id}
                      playerName={request.from_player}
                      metadata={new Date(request.created_at).toLocaleDateString()}
                      actions={
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 border-green-700"
                          >
                            Accept
                          </Button>
                          <Button variant="danger" size="sm">
                            Reject
                          </Button>
                        </div>
                      }
                    />
                  ))
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-skin-primary mb-3">
                Sent Requests
              </h3>
              <div className="space-y-3">
                {sentRequests.length === 0 ? (
                  <EmptyState icon="📤" title="No sent requests" compact />
                ) : (
                  sentRequests.map((request) => (
                    <SocialListItem
                      key={request.id}
                      playerName={request.to_player}
                      metadata={`Sent ${new Date(request.created_at).toLocaleDateString()}`}
                      actions={
                        <UIBadge variant="solid" color="warning" size="sm">
                          Pending
                        </UIBadge>
                      }
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for players..."
                variant="filled"
                leftIcon={<span>🔍</span>}
                containerClassName="flex-1"
              />
              <Button
                variant="primary"
                disabled={searchQuery.trim().length < 2}
                className="bg-purple-600 hover:bg-purple-700 border-purple-700"
              >
                Search
              </Button>
            </div>

            {isLoading && <LoadingState message="Searching..." size="sm" />}

            {!isLoading && searchResults.length === 0 && searchQuery.length >= 2 && (
              <EmptyState icon="🔍" title="No players found" compact />
            )}

            <div className="space-y-3">
              {searchResults.map((player) => (
                <SocialListItem
                  key={player.player_name}
                  playerName={player.player_name}
                  metadata={`${player.games_played} games • ${player.games_won} wins`}
                  actions={
                    <Button
                      variant="primary"
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 border-purple-700"
                    >
                      Add Friend
                    </Button>
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

const meta: Meta<typeof FriendsPanelMock> = {
  title: 'Components/FriendsPanel',
  component: FriendsPanelMock,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Friends Panel Component

Manage friends list with online status, requests, and search. Adapts to the selected skin theme.

## Features
- **Friends tab**: View friends with online/offline/in-game status
- **Requests tab**: Accept/reject incoming, view sent requests
- **Search tab**: Find and add new friends
- **Watch button**: Spectate friends in active games

Use the skin selector in the toolbar to see how the panel adapts to different themes.
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-h-[600px] flex items-center justify-center bg-skin-primary p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FriendsPanelMock>;

/**
 * Friends tab with online/offline friends
 */
export const FriendsTab: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    activeTab: 'friends',
    friends: [
      { player_name: 'Alice', status: 'online', is_online: true },
      { player_name: 'Bob', status: 'in_game', is_online: true, game_id: 'ABC123' },
      { player_name: 'Charlie', status: 'offline', is_online: false },
    ],
  },
};

/**
 * Empty friends list
 */
export const EmptyFriends: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    activeTab: 'friends',
    friends: [],
  },
};

/**
 * Requests tab with pending requests
 */
export const RequestsTab: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    activeTab: 'requests',
    pendingRequests: [
      { id: 1, from_player: 'NewPlayer1', created_at: '2025-01-15' },
      { id: 2, from_player: 'NewPlayer2', created_at: '2025-01-14' },
    ],
    sentRequests: [{ id: 3, to_player: 'ProGamer', created_at: '2025-01-13' }],
  },
};

/**
 * Search tab with results
 */
export const SearchTab: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    activeTab: 'search',
    searchResults: [
      { player_name: 'TopPlayer', games_played: 150, games_won: 95 },
      { player_name: 'CasualGamer', games_played: 45, games_won: 20 },
    ],
  },
};

// Note: Theme switching is now handled via the skin selector in the toolbar

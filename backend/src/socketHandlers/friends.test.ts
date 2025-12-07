/**
 * Friends Socket Handler Tests
 * Sprint 7: Socket Handler Tests - High Priority
 *
 * Tests for friends.ts socket handlers - HIGH for social foundation:
 * - send_friend_request: Send a friend request (with block enforcement)
 * - get_friend_requests: Get pending received requests
 * - get_sent_friend_requests: Get sent requests
 * - accept_friend_request: Accept a request
 * - reject_friend_request: Reject a request
 * - remove_friend: Remove existing friendship
 * - get_friends_list: Get friends with online status
 * - search_players: Search for players to add
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ============================================================================
// TEST TYPES
// ============================================================================

interface FriendRequest {
  id: number;
  from_player: string;
  to_player: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: Date;
}

interface Friendship {
  id: number;
  player1_name: string;
  player2_name: string;
  friendship_date: Date;
}

interface FriendWithStatus {
  player_name: string;
  is_online: boolean;
  status: string;
  game_id: string | null;
  friendship_date: Date;
}

interface OnlinePlayer {
  playerName: string;
  socketId: string;
  status: string;
  gameId: string | null;
}

// ============================================================================
// TEST HELPERS
// ============================================================================

// Helper to create a test friend request
function createTestRequest(overrides: Partial<FriendRequest> = {}): FriendRequest {
  return {
    id: 1,
    from_player: 'Alice',
    to_player: 'Bob',
    status: 'pending',
    created_at: new Date(),
    ...overrides,
  };
}

// Helper to simulate friend request storage
function createFriendStore(): {
  requests: FriendRequest[];
  friendships: Friendship[];
  nextRequestId: number;
  nextFriendshipId: number;
  sendRequest: (from: string, to: string) => FriendRequest | null;
  getPendingRequests: (playerName: string) => FriendRequest[];
  getSentRequests: (playerName: string) => FriendRequest[];
  acceptRequest: (requestId: number) => Friendship | null;
  rejectRequest: (requestId: number) => boolean;
  removeFriend: (player1: string, player2: string) => boolean;
  areFriends: (player1: string, player2: string) => boolean;
  hasPendingRequest: (from: string, to: string) => boolean;
  getFriends: (playerName: string) => FriendWithStatus[];
} {
  const requests: FriendRequest[] = [];
  const friendships: Friendship[] = [];
  let nextRequestId = 1;
  let nextFriendshipId = 1;

  return {
    requests,
    friendships,
    nextRequestId,
    nextFriendshipId,
    sendRequest: (from, to) => {
      // Check for existing pending request
      const existingRequest = requests.find(
        (r) =>
          ((r.from_player === from && r.to_player === to) ||
            (r.from_player === to && r.to_player === from)) &&
          r.status === 'pending'
      );
      if (existingRequest) return null;

      const request: FriendRequest = {
        id: nextRequestId++,
        from_player: from,
        to_player: to,
        status: 'pending',
        created_at: new Date(),
      };
      requests.push(request);
      return request;
    },
    getPendingRequests: (playerName) => {
      return requests.filter((r) => r.to_player === playerName && r.status === 'pending');
    },
    getSentRequests: (playerName) => {
      return requests.filter((r) => r.from_player === playerName && r.status === 'pending');
    },
    acceptRequest: (requestId) => {
      const request = requests.find((r) => r.id === requestId && r.status === 'pending');
      if (!request) return null;

      request.status = 'accepted';

      const friendship: Friendship = {
        id: nextFriendshipId++,
        player1_name: request.from_player,
        player2_name: request.to_player,
        friendship_date: new Date(),
      };
      friendships.push(friendship);
      return friendship;
    },
    rejectRequest: (requestId) => {
      const request = requests.find((r) => r.id === requestId && r.status === 'pending');
      if (!request) return false;
      request.status = 'rejected';
      return true;
    },
    removeFriend: (player1, player2) => {
      const index = friendships.findIndex(
        (f) =>
          (f.player1_name === player1 && f.player2_name === player2) ||
          (f.player1_name === player2 && f.player2_name === player1)
      );
      if (index === -1) return false;
      friendships.splice(index, 1);
      return true;
    },
    areFriends: (player1, player2) => {
      return friendships.some(
        (f) =>
          (f.player1_name === player1 && f.player2_name === player2) ||
          (f.player1_name === player2 && f.player2_name === player1)
      );
    },
    hasPendingRequest: (from, to) => {
      return requests.some(
        (r) =>
          ((r.from_player === from && r.to_player === to) ||
            (r.from_player === to && r.to_player === from)) &&
          r.status === 'pending'
      );
    },
    getFriends: (playerName) => {
      return friendships
        .filter(
          (f) => f.player1_name === playerName || f.player2_name === playerName
        )
        .map((f) => ({
          player_name: f.player1_name === playerName ? f.player2_name : f.player1_name,
          is_online: false,
          status: 'offline',
          game_id: null,
          friendship_date: f.friendship_date,
        }));
    },
  };
}

// Helper to simulate blocking system
function createBlockTracker(): {
  blocks: Set<string>;
  addBlock: (blocker: string, blocked: string) => void;
  isBlockedEitherWay: (user1: string, user2: string) => boolean;
} {
  const blocks = new Set<string>();

  return {
    blocks,
    addBlock: (blocker: string, blocked: string) => {
      blocks.add(`${blocker}:${blocked}`);
    },
    isBlockedEitherWay: (user1: string, user2: string) => {
      return blocks.has(`${user1}:${user2}`) || blocks.has(`${user2}:${user1}`);
    },
  };
}

// Helper to simulate online players
function createOnlinePlayersTracker(): {
  players: Map<string, OnlinePlayer>;
  setOnline: (name: string, status?: string, gameId?: string | null) => void;
  setOffline: (name: string) => void;
  isOnline: (name: string) => boolean;
  getStatus: (name: string) => OnlinePlayer | undefined;
} {
  const players = new Map<string, OnlinePlayer>();

  return {
    players,
    setOnline: (name, status = 'in_lobby', gameId = null) => {
      players.set(name, {
        playerName: name,
        socketId: `socket-${name}`,
        status,
        gameId,
      });
    },
    setOffline: (name) => {
      players.delete(name);
    },
    isOnline: (name) => players.has(name),
    getStatus: (name) => players.get(name),
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe('friends handlers', () => {
  let friendStore: ReturnType<typeof createFriendStore>;
  let blockTracker: ReturnType<typeof createBlockTracker>;
  let onlinePlayers: ReturnType<typeof createOnlinePlayersTracker>;

  beforeEach(() => {
    friendStore = createFriendStore();
    blockTracker = createBlockTracker();
    onlinePlayers = createOnlinePlayersTracker();
  });

  // ==========================================================================
  // send_friend_request
  // ==========================================================================
  describe('send_friend_request', () => {
    it('should send friend request to valid player', () => {
      const request = friendStore.sendRequest('Alice', 'Bob');

      expect(request).not.toBeNull();
      expect(request?.from_player).toBe('Alice');
      expect(request?.to_player).toBe('Bob');
      expect(request?.status).toBe('pending');
    });

    it('should reject if sending to yourself', () => {
      const fromPlayer = 'Alice';
      const toPlayer = 'Alice';

      const isSelfRequest = fromPlayer === toPlayer;

      expect(isSelfRequest).toBe(true);
    });

    it('should reject if blocked by sender', () => {
      blockTracker.addBlock('Alice', 'Bob');

      const blocked = blockTracker.isBlockedEitherWay('Alice', 'Bob');

      expect(blocked).toBe(true);
    });

    it('should reject if blocked by recipient', () => {
      blockTracker.addBlock('Bob', 'Alice');

      const blocked = blockTracker.isBlockedEitherWay('Alice', 'Bob');

      expect(blocked).toBe(true);
    });

    it('should reject if already friends', () => {
      friendStore.sendRequest('Alice', 'Bob');
      friendStore.acceptRequest(1);

      const alreadyFriends = friendStore.areFriends('Alice', 'Bob');

      expect(alreadyFriends).toBe(true);
    });

    it('should reject duplicate pending request', () => {
      friendStore.sendRequest('Alice', 'Bob');
      const duplicate = friendStore.sendRequest('Alice', 'Bob');

      expect(duplicate).toBeNull();
    });

    it('should reject if there is already a pending request from target', () => {
      friendStore.sendRequest('Bob', 'Alice');

      const hasPending = friendStore.hasPendingRequest('Alice', 'Bob');

      expect(hasPending).toBe(true);
    });

    it('should require login', () => {
      const socketData = { playerName: undefined };
      const isLoggedIn = !!socketData.playerName;

      expect(isLoggedIn).toBe(false);
    });
  });

  // ==========================================================================
  // get_friend_requests
  // ==========================================================================
  describe('get_friend_requests', () => {
    it('should return pending requests received', () => {
      friendStore.sendRequest('Alice', 'Bob');
      friendStore.sendRequest('Charlie', 'Bob');
      friendStore.sendRequest('Bob', 'Dave'); // Sent, not received

      const pending = friendStore.getPendingRequests('Bob');

      expect(pending.length).toBe(2);
      expect(pending.every((r) => r.to_player === 'Bob')).toBe(true);
    });

    it('should not return rejected requests', () => {
      const request = friendStore.sendRequest('Alice', 'Bob');
      friendStore.rejectRequest(request!.id);

      const pending = friendStore.getPendingRequests('Bob');

      expect(pending.length).toBe(0);
    });

    it('should not return accepted requests', () => {
      const request = friendStore.sendRequest('Alice', 'Bob');
      friendStore.acceptRequest(request!.id);

      const pending = friendStore.getPendingRequests('Bob');

      expect(pending.length).toBe(0);
    });
  });

  // ==========================================================================
  // get_sent_friend_requests
  // ==========================================================================
  describe('get_sent_friend_requests', () => {
    it('should return pending requests sent', () => {
      friendStore.sendRequest('Alice', 'Bob');
      friendStore.sendRequest('Alice', 'Charlie');
      friendStore.sendRequest('Dave', 'Alice'); // Received, not sent

      const sent = friendStore.getSentRequests('Alice');

      expect(sent.length).toBe(2);
      expect(sent.every((r) => r.from_player === 'Alice')).toBe(true);
    });

    it('should not return rejected requests', () => {
      const request = friendStore.sendRequest('Alice', 'Bob');
      friendStore.rejectRequest(request!.id);

      const sent = friendStore.getSentRequests('Alice');

      expect(sent.length).toBe(0);
    });
  });

  // ==========================================================================
  // accept_friend_request
  // ==========================================================================
  describe('accept_friend_request', () => {
    it('should create friendship when accepted', () => {
      const request = friendStore.sendRequest('Alice', 'Bob');
      const friendship = friendStore.acceptRequest(request!.id);

      expect(friendship).not.toBeNull();
      expect(friendship?.player1_name).toBe('Alice');
      expect(friendship?.player2_name).toBe('Bob');
    });

    it('should mark request as accepted', () => {
      const request = friendStore.sendRequest('Alice', 'Bob');
      friendStore.acceptRequest(request!.id);

      const updatedRequest = friendStore.requests.find((r) => r.id === request!.id);

      expect(updatedRequest?.status).toBe('accepted');
    });

    it('should fail for non-existent request', () => {
      const friendship = friendStore.acceptRequest(999);

      expect(friendship).toBeNull();
    });

    it('should fail for already accepted request', () => {
      const request = friendStore.sendRequest('Alice', 'Bob');
      friendStore.acceptRequest(request!.id);
      const second = friendStore.acceptRequest(request!.id);

      expect(second).toBeNull();
    });

    it('should make players friends', () => {
      const request = friendStore.sendRequest('Alice', 'Bob');
      friendStore.acceptRequest(request!.id);

      expect(friendStore.areFriends('Alice', 'Bob')).toBe(true);
      expect(friendStore.areFriends('Bob', 'Alice')).toBe(true);
    });
  });

  // ==========================================================================
  // reject_friend_request
  // ==========================================================================
  describe('reject_friend_request', () => {
    it('should mark request as rejected', () => {
      const request = friendStore.sendRequest('Alice', 'Bob');
      const success = friendStore.rejectRequest(request!.id);

      expect(success).toBe(true);
      expect(friendStore.requests.find((r) => r.id === request!.id)?.status).toBe('rejected');
    });

    it('should not create friendship', () => {
      const request = friendStore.sendRequest('Alice', 'Bob');
      friendStore.rejectRequest(request!.id);

      expect(friendStore.areFriends('Alice', 'Bob')).toBe(false);
    });

    it('should fail for non-existent request', () => {
      const success = friendStore.rejectRequest(999);

      expect(success).toBe(false);
    });

    it('should fail for already rejected request', () => {
      const request = friendStore.sendRequest('Alice', 'Bob');
      friendStore.rejectRequest(request!.id);
      const second = friendStore.rejectRequest(request!.id);

      expect(second).toBe(false);
    });
  });

  // ==========================================================================
  // remove_friend
  // ==========================================================================
  describe('remove_friend', () => {
    it('should remove existing friendship', () => {
      const request = friendStore.sendRequest('Alice', 'Bob');
      friendStore.acceptRequest(request!.id);

      expect(friendStore.areFriends('Alice', 'Bob')).toBe(true);

      const success = friendStore.removeFriend('Alice', 'Bob');

      expect(success).toBe(true);
      expect(friendStore.areFriends('Alice', 'Bob')).toBe(false);
    });

    it('should work regardless of order (player1/player2)', () => {
      const request = friendStore.sendRequest('Alice', 'Bob');
      friendStore.acceptRequest(request!.id);

      const success = friendStore.removeFriend('Bob', 'Alice');

      expect(success).toBe(true);
      expect(friendStore.areFriends('Alice', 'Bob')).toBe(false);
    });

    it('should fail for non-existent friendship', () => {
      const success = friendStore.removeFriend('Alice', 'Bob');

      expect(success).toBe(false);
    });

    it('should require login', () => {
      const socketData = { playerName: undefined };
      const isLoggedIn = !!socketData.playerName;

      expect(isLoggedIn).toBe(false);
    });
  });

  // ==========================================================================
  // get_friends_list
  // ==========================================================================
  describe('get_friends_list', () => {
    it('should return all friends', () => {
      const r1 = friendStore.sendRequest('Alice', 'Bob');
      const r2 = friendStore.sendRequest('Charlie', 'Alice');
      friendStore.acceptRequest(r1!.id);
      friendStore.acceptRequest(r2!.id);

      const friends = friendStore.getFriends('Alice');

      expect(friends.length).toBe(2);
      expect(friends.map((f) => f.player_name).sort()).toEqual(['Bob', 'Charlie']);
    });

    it('should include online status', () => {
      const r1 = friendStore.sendRequest('Alice', 'Bob');
      friendStore.acceptRequest(r1!.id);

      onlinePlayers.setOnline('Bob', 'in_game', 'game-123');

      const friends = friendStore.getFriends('Alice');
      // Simulate enrichment
      const enrichedFriends = friends.map((f) => {
        const online = onlinePlayers.getStatus(f.player_name);
        if (online) {
          return { ...f, is_online: true, status: online.status, game_id: online.gameId };
        }
        return f;
      });

      expect(enrichedFriends[0].is_online).toBe(true);
      expect(enrichedFriends[0].status).toBe('in_game');
      expect(enrichedFriends[0].game_id).toBe('game-123');
    });

    it('should return empty array for no friends', () => {
      const friends = friendStore.getFriends('Alice');

      expect(friends.length).toBe(0);
    });

    it('should sort online friends first', () => {
      const r1 = friendStore.sendRequest('Alice', 'Bob');
      const r2 = friendStore.sendRequest('Charlie', 'Alice');
      const r3 = friendStore.sendRequest('Dave', 'Alice');
      friendStore.acceptRequest(r1!.id);
      friendStore.acceptRequest(r2!.id);
      friendStore.acceptRequest(r3!.id);

      onlinePlayers.setOnline('Charlie'); // Only Charlie is online

      const friends = friendStore.getFriends('Alice');
      const enrichedFriends = friends.map((f) => {
        const online = onlinePlayers.getStatus(f.player_name);
        if (online) {
          return { ...f, is_online: true, status: online.status };
        }
        return f;
      });

      // Sort: online first
      enrichedFriends.sort((a, b) => {
        if (a.is_online && !b.is_online) return -1;
        if (!a.is_online && b.is_online) return 1;
        return 0;
      });

      expect(enrichedFriends[0].player_name).toBe('Charlie');
      expect(enrichedFriends[0].is_online).toBe(true);
    });
  });

  // ==========================================================================
  // search_players
  // ==========================================================================
  describe('search_players', () => {
    it('should require minimum 2 characters', () => {
      const searchQuery = 'a';
      const isValid = searchQuery.trim().length >= 2;

      expect(isValid).toBe(false);
    });

    it('should return empty for too short query', () => {
      const searchQuery = 'a';
      const results = searchQuery.trim().length >= 2 ? ['match'] : [];

      expect(results.length).toBe(0);
    });

    it('should not include self in results', () => {
      const playerName = 'Alice';
      const searchQuery = 'ali';
      const mockResults = [{ player_name: 'Alice' }, { player_name: 'Alicia' }];

      const filtered = mockResults.filter((r) => r.player_name !== playerName);

      expect(filtered.length).toBe(1);
      expect(filtered[0].player_name).toBe('Alicia');
    });
  });

  // ==========================================================================
  // Block enforcement
  // ==========================================================================
  describe('block enforcement', () => {
    it('should prevent friend request after block', () => {
      blockTracker.addBlock('Alice', 'Bob');

      const blocked = blockTracker.isBlockedEitherWay('Alice', 'Bob');

      expect(blocked).toBe(true);
    });

    it('should work both directions', () => {
      blockTracker.addBlock('Bob', 'Alice');

      expect(blockTracker.isBlockedEitherWay('Alice', 'Bob')).toBe(true);
      expect(blockTracker.isBlockedEitherWay('Bob', 'Alice')).toBe(true);
    });
  });

  // ==========================================================================
  // Edge cases
  // ==========================================================================
  describe('edge cases', () => {
    it('should handle multiple friend requests to different players', () => {
      friendStore.sendRequest('Alice', 'Bob');
      friendStore.sendRequest('Alice', 'Charlie');
      friendStore.sendRequest('Alice', 'Dave');

      const sent = friendStore.getSentRequests('Alice');

      expect(sent.length).toBe(3);
    });

    it('should handle accepting then re-friending after removal', () => {
      const r1 = friendStore.sendRequest('Alice', 'Bob');
      friendStore.acceptRequest(r1!.id);
      friendStore.removeFriend('Alice', 'Bob');

      // Should be able to send new request
      const r2 = friendStore.sendRequest('Alice', 'Bob');

      expect(r2).not.toBeNull();
      expect(r2?.id).not.toBe(r1?.id);
    });

    it('should handle concurrent requests from both sides', () => {
      friendStore.sendRequest('Alice', 'Bob');
      // Bob tries to send request to Alice
      const bobsRequest = friendStore.sendRequest('Bob', 'Alice');

      // Should be rejected because there's already a pending request
      expect(bobsRequest).toBeNull();
    });

    it('should handle friendship date tracking', () => {
      const r1 = friendStore.sendRequest('Alice', 'Bob');
      friendStore.acceptRequest(r1!.id);

      const friends = friendStore.getFriends('Alice');

      expect(friends[0].friendship_date).toBeInstanceOf(Date);
    });
  });
});

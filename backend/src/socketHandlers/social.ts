/**
 * Social Features Socket Handlers
 * Sprint 16 Day 6
 *
 * Handles recent players and friend suggestions
 */

import { Server, Socket } from 'socket.io';
import { getRecentPlayers, getFriendSuggestions, getMutualFriends } from '../utils/socialHelpers.js';
import { errorBoundaries } from '../middleware/errorBoundary.js';

interface SocialHandlerDependencies {
  errorBoundaries: typeof errorBoundaries;
}

export function registerSocialHandlers(
  io: Server,
  socket: Socket,
  deps: SocialHandlerDependencies
) {
  const { errorBoundaries } = deps;

  /**
   * Get recent players
   */
  socket.on(
    'get_recent_players',
    errorBoundaries.readOnly('get_recent_players')(async ({ limit = 20 }: { limit?: number }) => {
      const username = socket.data.playerName;

      if (!username) {
        socket.emit('error', { message: 'Not logged in' });
        return;
      }

      const recentPlayers = await getRecentPlayers(username, limit);
      socket.emit('recent_players', { players: recentPlayers });
    })
  );

  /**
   * Get friend suggestions
   */
  socket.on(
    'get_friend_suggestions',
    errorBoundaries.readOnly('get_friend_suggestions')(async ({ limit = 10 }: { limit?: number }) => {
      const username = socket.data.playerName;

      if (!username) {
        socket.emit('error', { message: 'Not logged in' });
        return;
      }

      const suggestions = await getFriendSuggestions(username, limit);
      socket.emit('friend_suggestions', { suggestions });
    })
  );

  /**
   * Get mutual friends with another player
   */
  socket.on(
    'get_mutual_friends',
    errorBoundaries.readOnly('get_mutual_friends')(async ({ otherUsername }: { otherUsername: string }) => {
      const username = socket.data.playerName;

      if (!username) {
        socket.emit('error', { message: 'Not logged in' });
        return;
      }

      const mutualFriends = await getMutualFriends(username, otherUsername);
      socket.emit('mutual_friends', { otherUsername, mutualFriends });
    })
  );
}

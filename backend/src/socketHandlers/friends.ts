/**
 * Friends System Socket Handlers
 * Sprint 2 Phase 2
 * Sprint 6: Enhanced with error boundary integration
 */

import { Server, Socket } from 'socket.io';
import {
  sendFriendRequest,
  getPendingFriendRequests,
  getSentFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriendship,
  getFriendsWithStatus,
  areFriends
} from '../db/friends';
import { errorBoundaries } from '../middleware/errorBoundary.js';

interface FriendHandlerDependencies {
  errorBoundaries: typeof errorBoundaries;
}

export function registerFriendHandlers(
  io: Server,
  socket: Socket,
  deps: FriendHandlerDependencies
) {
  const { errorBoundaries } = deps;

  /**
   * Send a friend request
   */
  socket.on(
    'send_friend_request',
    errorBoundaries.gameAction('send_friend_request')(async ({ toPlayer }: { toPlayer: string }) => {
      const fromPlayer = socket.data.playerName;

      if (!fromPlayer) {
        socket.emit('error', { message: 'Not logged in' });
        return;
      }

      if (fromPlayer === toPlayer) {
        socket.emit('error', { message: 'Cannot send friend request to yourself' });
        return;
      }

      // Check if already friends
      const alreadyFriends = await areFriends(fromPlayer, toPlayer);
      if (alreadyFriends) {
        socket.emit('error', { message: 'Already friends with this player' });
        return;
      }

      const request = await sendFriendRequest(fromPlayer, toPlayer);

      if (!request) {
        socket.emit('error', { message: 'Failed to send friend request' });
        return;
      }

      // Notify sender
      socket.emit('friend_request_sent', { request });

      // Create database notification for recipient (if authenticated)
      try {
        const { createNotification } = await import('../db/notifications.js');
        const { getUserByUsername } = await import('../db/users.js');

        const recipientUser = await getUserByUsername(toPlayer);
        if (recipientUser) {
          await createNotification({
            user_id: recipientUser.id,
            notification_type: 'friend_request',
            title: 'New Friend Request',
            message: `${fromPlayer} sent you a friend request`,
            data: {
              request_id: request.id,
              from_player: fromPlayer,
              created_at: request.created_at
            },
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          });
        }
      } catch (error) {
        // Silently fail - guest users won't have notifications
        console.log(`Friend request notification skipped for guest player: ${toPlayer}`);
      }

      // Notify recipient if they're online (real-time socket event)
      const recipientSockets = await io.in(`player:${toPlayer}`).fetchSockets();
      if (recipientSockets.length > 0) {
        io.to(`player:${toPlayer}`).emit('friend_request_received', {
          request_id: request.id,
          from_player: fromPlayer,
          created_at: request.created_at
        });

        // Also emit notification_received for NotificationCenter
        io.to(`player:${toPlayer}`).emit('notification_received', {
          notification_type: 'friend_request',
          title: 'New Friend Request',
          message: `${fromPlayer} sent you a friend request`,
        });
      }
    })
  );

  /**
   * Get pending friend requests (received)
   */
  socket.on(
    'get_friend_requests',
    errorBoundaries.readOnly('get_friend_requests')(async () => {
      const playerName = socket.data.playerName;

      if (!playerName) {
        socket.emit('error', { message: 'Not logged in' });
        return;
      }

      const requests = await getPendingFriendRequests(playerName);
      socket.emit('friend_requests', { requests });
    })
  );

  /**
   * Get sent friend requests
   */
  socket.on(
    'get_sent_friend_requests',
    errorBoundaries.readOnly('get_sent_friend_requests')(async () => {
      const playerName = socket.data.playerName;

      if (!playerName) {
        socket.emit('error', { message: 'Not logged in' });
        return;
      }

      const requests = await getSentFriendRequests(playerName);
      socket.emit('sent_friend_requests', { requests });
    })
  );

  /**
   * Accept a friend request
   */
  socket.on(
    'accept_friend_request',
    errorBoundaries.gameAction('accept_friend_request')(async ({ requestId }: { requestId: number }) => {
      const playerName = socket.data.playerName;

      if (!playerName) {
        socket.emit('error', { message: 'Not logged in' });
        return;
      }

      const friendship = await acceptFriendRequest(requestId);

      if (!friendship) {
        socket.emit('error', { message: 'Failed to accept friend request' });
        return;
      }

      // Notify both players
      const player1 = friendship.player1_name;
      const player2 = friendship.player2_name;

      // Update friends list for both players
      const player1Friends = await getFriendsWithStatus(player1);
      const player2Friends = await getFriendsWithStatus(player2);

      io.to(`player:${player1}`).emit('friends_list_updated', { friends: player1Friends });
      io.to(`player:${player2}`).emit('friends_list_updated', { friends: player2Friends });

      // Notify the sender that their request was accepted
      const otherPlayer = player1 === playerName ? player2 : player1;

      // Create database notification for the original sender (if authenticated)
      try {
        const { createNotification } = await import('../db/notifications.js');
        const { getUserByUsername } = await import('../db/users.js');

        const senderUser = await getUserByUsername(otherPlayer);
        if (senderUser) {
          await createNotification({
            user_id: senderUser.id,
            notification_type: 'friend_request_accepted',
            title: 'Friend Request Accepted',
            message: `${playerName} accepted your friend request`,
            data: {
              friend_name: playerName,
              friendship_id: friendship.id
            },
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          });
        }
      } catch (error) {
        console.log(`Friend request accepted notification skipped for guest player: ${otherPlayer}`);
      }

      io.to(`player:${otherPlayer}`).emit('friend_request_accepted', {
        playerName: playerName,
        friendship
      });

      // Also emit notification_received for NotificationCenter
      io.to(`player:${otherPlayer}`).emit('notification_received', {
        notification_type: 'friend_request_accepted',
        title: 'Friend Request Accepted',
        message: `${playerName} accepted your friend request`,
      });

      socket.emit('friend_request_accepted_confirm', { friendship });
    })
  );

  /**
   * Reject a friend request
   */
  socket.on(
    'reject_friend_request',
    errorBoundaries.gameAction('reject_friend_request')(async ({ requestId }: { requestId: number }) => {
      const playerName = socket.data.playerName;

      if (!playerName) {
        socket.emit('error', { message: 'Not logged in' });
        return;
      }

      const success = await rejectFriendRequest(requestId);

      if (!success) {
        socket.emit('error', { message: 'Failed to reject friend request' });
        return;
      }

      socket.emit('friend_request_rejected', { requestId });
    })
  );

  /**
   * Remove a friend
   */
  socket.on(
    'remove_friend',
    errorBoundaries.gameAction('remove_friend')(async ({ friendName }: { friendName: string }) => {
      const playerName = socket.data.playerName;

      if (!playerName) {
        socket.emit('error', { message: 'Not logged in' });
        return;
      }

      const success = await removeFriendship(playerName, friendName);

      if (!success) {
        socket.emit('error', { message: 'Failed to remove friend' });
        return;
      }

      // Update friends list for both players
      const player1Friends = await getFriendsWithStatus(playerName);
      const player2Friends = await getFriendsWithStatus(friendName);

      io.to(`player:${playerName}`).emit('friends_list_updated', { friends: player1Friends });
      io.to(`player:${friendName}`).emit('friends_list_updated', { friends: player2Friends });

      socket.emit('friend_removed', { friendName });
    })
  );

  /**
   * Get friends list with status
   */
  socket.on(
    'get_friends_list',
    errorBoundaries.readOnly('get_friends_list')(async () => {
      const playerName = socket.data.playerName;

      if (!playerName) {
        socket.emit('error', { message: 'Not logged in' });
        return;
      }

      const friends = await getFriendsWithStatus(playerName);
      socket.emit('friends_list', { friends });
    })
  );

  /**
   * Search for players to add as friends
   */
  socket.on(
    'search_players',
    errorBoundaries.readOnly('search_players')(async ({ searchQuery }: { searchQuery: string }) => {
      const playerName = socket.data.playerName;

      if (!playerName) {
        socket.emit('error', { message: 'Not logged in' });
        return;
      }

      if (!searchQuery || searchQuery.trim().length < 2) {
        socket.emit('player_search_results', { players: [] });
        return;
      }

      // Search in player_stats for matching names
      const { query } = await import('../db/index');
      const result = await query(
        `SELECT player_name, games_played, games_won
         FROM player_stats
         WHERE player_name ILIKE $1 AND player_name != $2
         ORDER BY games_played DESC
         LIMIT 20`,
        [`%${searchQuery}%`, playerName]
      );

      socket.emit('player_search_results', { players: result.rows });
    })
  );
}

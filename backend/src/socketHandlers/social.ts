/**
 * Social Features Socket Handlers
 * Sprint 16 Day 6
 *
 * Handles recent players, friend suggestions, and user profiles
 */

import { Server, Socket } from 'socket.io';
import { getRecentPlayers, getFriendSuggestions, getMutualFriends } from '../utils/socialHelpers.js';
import { errorBoundaries } from '../middleware/errorBoundary.js';
import { getUserByUsername } from '../db/users.js';
import { getUserProfile, updateUserProfile, ProfileUpdateData } from '../db/profiles.js';
import { createNotification } from '../db/notifications.js';

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

  /**
   * Send game invite to another player
   * Sprint 22A - Game Invite System
   */
  socket.on(
    'send_game_invite',
    errorBoundaries.gameAction('send_game_invite')(async ({
      gameId,
      toPlayer
    }: {
      gameId: string;
      toPlayer: string;
    }) => {
      const fromPlayer = socket.data.playerName;

      if (!fromPlayer) {
        socket.emit('error', { message: 'Not logged in', context: 'send_game_invite' });
        return;
      }

      if (fromPlayer === toPlayer) {
        socket.emit('error', { message: 'Cannot invite yourself', context: 'send_game_invite' });
        return;
      }

      try {
        // Create database notification for recipient (if authenticated)
        const recipientUser = await getUserByUsername(toPlayer);
        if (recipientUser) {
          await createNotification({
            user_id: recipientUser.user_id,
            notification_type: 'game_invite',
            title: 'Game Invite',
            message: `${fromPlayer} invited you to join their game`,
            data: {
              game_id: gameId,
              from_player: fromPlayer,
              game_url: `?join=${gameId}`
            },
            expires_at: new Date(Date.now() + 60 * 60 * 1000) // 1 hour expiry
          });
        }

        // Send real-time notification to recipient if online
        io.to(`player:${toPlayer}`).emit('game_invite_received', {
          gameId,
          fromPlayer,
          timestamp: Date.now()
        });

        // Confirm to sender
        socket.emit('game_invite_sent', { toPlayer, gameId });

        console.log(`[Social] Game invite sent from ${fromPlayer} to ${toPlayer} for game ${gameId}`);
      } catch (error) {
        console.error('[Social] Error sending game invite:', error);
        socket.emit('error', { message: 'Failed to send invite', context: 'send_game_invite' });
      }
    })
  );

  /**
   * Get user profile by username
   */
  socket.on(
    'get_user_profile',
    errorBoundaries.readOnly('get_user_profile')(async ({ username }: { username: string }) => {
      try {
        // Get user ID from username
        const user = await getUserByUsername(username);

        if (!user) {
          socket.emit('user_profile_response', { username, profile: null });
          return;
        }

        // Get profile data
        const profile = await getUserProfile(user.user_id);

        socket.emit('user_profile_response', {
          username,
          profile: profile ? {
            bio: profile.bio,
            country: profile.country,
            favorite_team: profile.favorite_team,
            visibility: profile.visibility,
            show_online_status: profile.show_online_status,
            allow_friend_requests: profile.allow_friend_requests
          } : null
        });
      } catch (error) {
        console.error('Error fetching user profile:', error);
        socket.emit('error', { message: 'Failed to fetch user profile', context: 'get_user_profile' });
      }
    })
  );

  /**
   * Update own user profile
   */
  socket.on(
    'update_user_profile',
    errorBoundaries.gameAction('update_user_profile')(async (updates: ProfileUpdateData) => {
      const username = socket.data.playerName;

      if (!username) {
        socket.emit('error', { message: 'Not logged in', context: 'update_user_profile' });
        return;
      }

      try {
        // Get user ID
        const user = await getUserByUsername(username);

        if (!user) {
          socket.emit('error', { message: 'User not found', context: 'update_user_profile' });
          return;
        }

        // Update profile
        const updatedProfile = await updateUserProfile(user.user_id, updates);

        if (!updatedProfile) {
          socket.emit('error', { message: 'Failed to update profile', context: 'update_user_profile' });
          return;
        }

        socket.emit('user_profile_updated', {
          success: true,
          profile: {
            bio: updatedProfile.bio,
            country: updatedProfile.country,
            favorite_team: updatedProfile.favorite_team,
            visibility: updatedProfile.visibility,
            show_online_status: updatedProfile.show_online_status,
            allow_friend_requests: updatedProfile.allow_friend_requests
          }
        });
      } catch (error) {
        console.error('Error updating user profile:', error);
        socket.emit('error', { message: 'Failed to update profile', context: 'update_user_profile' });
      }
    })
  );
}

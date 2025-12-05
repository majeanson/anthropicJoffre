/**
 * User Blocking Socket Handlers
 * Handles block/unblock player events
 */

import { Server, Socket } from 'socket.io';
import {
  blockPlayerComprehensive,
  unblockPlayer,
  getBlockedPlayers,
  isBlocked,
  isBlockedEitherWay
} from '../db/blocks';
import { errorBoundaries } from '../middleware/errorBoundary';

interface BlockHandlerDependencies {
  errorBoundaries: typeof errorBoundaries;
}

export function registerBlockHandlers(
  io: Server,
  socket: Socket,
  deps: BlockHandlerDependencies
) {
  const { errorBoundaries } = deps;

  /**
   * Block a player
   * Removes friendship and cancels pending friend requests
   */
  socket.on('block_player', errorBoundaries.gameAction('block_player')(async (data: {
    blockedName: string;
    reason?: string;
  }) => {
    const blockerName = socket.data.username;

    if (!blockerName) {
      socket.emit('block_player_error', { message: 'You must be logged in to block players' });
      return;
    }

    if (!data.blockedName) {
      socket.emit('block_player_error', { message: 'Player name is required' });
      return;
    }

    if (blockerName === data.blockedName) {
      socket.emit('block_player_error', { message: 'You cannot block yourself' });
      return;
    }

    const result = await blockPlayerComprehensive(
      blockerName,
      data.blockedName,
      data.reason
    );

    if (result.blocked) {
      // Send success to blocker
      socket.emit('player_blocked', {
        blockedName: data.blockedName,
        friendshipRemoved: result.friendshipRemoved,
        requestsCancelled: result.requestsCancelled
      });

      // Refresh blocker's friends list if friendship was removed
      if (result.friendshipRemoved) {
        socket.emit('friends_list_updated');
      }

      console.log(`Player ${blockerName} blocked ${data.blockedName}`);
    } else {
      socket.emit('block_player_error', { message: 'Failed to block player' });
    }
  }));

  /**
   * Unblock a player
   */
  socket.on('unblock_player', errorBoundaries.gameAction('unblock_player')(async (data: {
    blockedName: string;
  }) => {
    const blockerName = socket.data.username;

    if (!blockerName) {
      socket.emit('unblock_player_error', { message: 'You must be logged in to unblock players' });
      return;
    }

    if (!data.blockedName) {
      socket.emit('unblock_player_error', { message: 'Player name is required' });
      return;
    }

    const success = await unblockPlayer(blockerName, data.blockedName);

    if (success) {
      socket.emit('player_unblocked', { unblockedName: data.blockedName });
      console.log(`Player ${blockerName} unblocked ${data.blockedName}`);
    } else {
      socket.emit('unblock_player_error', { message: 'Failed to unblock player or player was not blocked' });
    }
  }));

  /**
   * Get list of blocked players
   */
  socket.on('get_blocked_players', errorBoundaries.readOnly('get_blocked_players')(async () => {
    const username = socket.data.username;

    if (!username) {
      socket.emit('blocked_players_list', { players: [] });
      return;
    }

    const blockedPlayers = await getBlockedPlayers(username);
    socket.emit('blocked_players_list', { players: blockedPlayers });
  }));

  /**
   * Check if a specific player is blocked
   */
  socket.on('check_block_status', errorBoundaries.readOnly('check_block_status')(async (data: {
    playerName: string;
  }) => {
    const username = socket.data.username;

    if (!username || !data.playerName) {
      socket.emit('block_status', { playerName: data.playerName, isBlocked: false, blockedByThem: false });
      return;
    }

    const [iBlockedThem, theyBlockedMe] = await Promise.all([
      isBlocked(username, data.playerName),
      isBlocked(data.playerName, username)
    ]);

    socket.emit('block_status', {
      playerName: data.playerName,
      isBlocked: iBlockedThem,
      blockedByThem: theyBlockedMe
    });
  }));
}

/**
 * Helper function to check if interaction is blocked
 * Use this in other handlers before allowing friend requests, DMs, etc.
 */
export async function canInteract(player1: string, player2: string): Promise<boolean> {
  return !(await isBlockedEitherWay(player1, player2));
}

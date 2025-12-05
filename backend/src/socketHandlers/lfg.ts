/**
 * Looking for Game (LFG) Socket Handlers
 * Allows players to signal they're looking for teammates
 */

import { Server, Socket } from 'socket.io';
import {
  OnlinePlayer,
  setLookingForGame,
  getPlayersLookingForGame,
  broadcastOnlinePlayers
} from '../utils/onlinePlayerManager';
import { errorBoundaries } from '../middleware/errorBoundary';

interface LfgHandlerDependencies {
  errorBoundaries: typeof errorBoundaries;
  onlinePlayers: Map<string, OnlinePlayer>;
  io: Server;
}

export function registerLfgHandlers(
  socket: Socket,
  deps: LfgHandlerDependencies
) {
  const { errorBoundaries, onlinePlayers, io } = deps;

  /**
   * Set "Looking for Game" status
   */
  socket.on('set_looking_for_game', errorBoundaries.gameAction('set_looking_for_game')(async (data: {
    lookingForGame: boolean;
  }) => {
    const success = setLookingForGame(socket.id, data.lookingForGame, onlinePlayers);

    if (success) {
      socket.emit('looking_for_game_updated', {
        lookingForGame: data.lookingForGame
      });

      // Broadcast updated online players immediately so others see the change
      broadcastOnlinePlayers(io, onlinePlayers);

      console.log(`Player ${socket.data.playerName} set LFG status to ${data.lookingForGame}`);
    } else {
      socket.emit('error', {
        message: 'Cannot set LFG status while in a game',
        context: 'set_looking_for_game'
      });
    }
  }));

  /**
   * Get list of players looking for game
   */
  socket.on('get_players_looking_for_game', errorBoundaries.readOnly('get_players_looking_for_game')(async () => {
    const lfgPlayers = getPlayersLookingForGame(onlinePlayers);

    socket.emit('players_looking_for_game', {
      players: lfgPlayers.map(p => ({
        playerName: p.playerName,
        socketId: p.socketId
      }))
    });
  }));
}

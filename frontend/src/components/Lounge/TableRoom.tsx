/**
 * TableRoom - The pre-game gathering experience
 *
 * When users join a table, this is where they hang out before the game starts.
 * Features:
 * - Visual seat selection (click to sit/stand)
 * - Ready up system
 * - Table chat
 * - Add bots to fill seats
 * - Start game when ready
 */

import { useState, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { LoungeTable, ChatMessage, GameState } from '../../types/game';
import { Button } from '../ui/Button';
import { sounds } from '../../utils/sounds';
import { useSocketEvent } from '../../hooks/useSocketEvent';

interface TableRoomProps {
  socket: Socket | null;
  table: LoungeTable;
  playerName: string;
  onLeave: () => void;
  onGameStart: (gameId: string, gameState?: GameState) => void;
}

export function TableRoom({
  socket,
  table: initialTable,
  playerName,
  onLeave,
  onGameStart,
}: TableRoomProps) {
  const [table, setTable] = useState<LoungeTable>(initialTable);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);

  const isHost = table.hostName === playerName;
  const mySeat = table.seats.find(s => s.playerName === playerName);
  const isSeated = !!mySeat;
  const allSeated = table.seats.every(s => s.playerName !== null);
  const allReady = table.seats.every(s => s.isReady || s.isBot);
  const humanCount = table.seats.filter(s => s.playerName && !s.isBot).length;
  const canStart = isHost && allSeated && allReady && humanCount >= 1;

  // Listen for table updates
  useSocketEvent(socket, 'table_updated', (data: { table: LoungeTable }) => {
    if (data.table.id === table.id) {
      setTable(data.table);
    }
  });

  // Listen for chat messages
  useSocketEvent(socket, 'table_chat_message', (data: { message: ChatMessage }) => {
    setChatMessages(prev => [...prev, data.message].slice(-50));
  });

  // Listen for game start
  useSocketEvent(socket, 'table_game_started', (data: { gameId: string; tableId: string; gameState?: GameState }) => {
    if (data.tableId === table.id) {
      setIsStartingGame(false);
      sounds.gameStart();
      onGameStart(data.gameId, data.gameState);
    }
  });

  // Listen for errors (to clear loading state on game start failure)
  useSocketEvent(socket, 'error', (data: { message: string; context?: string }) => {
    if (data.context === 'start_table_game') {
      setIsStartingGame(false);
    }
  });

  // Sync ready state with seat
  useEffect(() => {
    if (mySeat) {
      setIsReady(mySeat.isReady);
    }
  }, [mySeat]);

  const handleSitDown = useCallback((position: number) => {
    if (socket && !isSeated) {
      socket.emit('sit_at_table', { tableId: table.id, position });
      sounds.buttonClick();
    }
  }, [socket, table.id, isSeated]);

  const handleStandUp = useCallback(() => {
    if (socket && isSeated) {
      socket.emit('stand_from_table', { tableId: table.id });
      sounds.buttonClick();
    }
  }, [socket, table.id, isSeated]);

  const handleToggleReady = useCallback(() => {
    if (socket && isSeated) {
      socket.emit('set_ready', { tableId: table.id, isReady: !isReady });
      sounds.buttonClick();
    }
  }, [socket, table.id, isSeated, isReady]);

  const handleAddBot = useCallback((position: number) => {
    if (socket && isHost) {
      socket.emit('add_bot_to_table', { tableId: table.id, position, difficulty: 'medium' });
      sounds.buttonClick();
    }
  }, [socket, table.id, isHost]);

  const handleRemoveFromSeat = useCallback((position: number) => {
    if (socket && isHost) {
      socket.emit('remove_from_seat', { tableId: table.id, position });
      sounds.buttonClick();
    }
  }, [socket, table.id, isHost]);

  const handleStartGame = useCallback(() => {
    if (socket && canStart && !isStartingGame) {
      setIsStartingGame(true);
      socket.emit('start_table_game', { tableId: table.id });
      sounds.buttonClick();
    }
  }, [socket, table.id, canStart, isStartingGame]);

  const handleSendChat = useCallback(() => {
    if (socket && chatInput.trim()) {
      socket.emit('table_chat', { tableId: table.id, message: chatInput.trim() });
      setChatInput('');
    }
  }, [socket, table.id, chatInput]);

  const handleLeave = useCallback(() => {
    if (socket) {
      socket.emit('leave_table', { tableId: table.id });
    }
    onLeave();
    sounds.buttonClick();
  }, [socket, table.id, onLeave]);

  // Team colors for visual distinction
  const teamColors = {
    1: 'from-blue-500/20 to-blue-600/10 border-blue-500/50',
    2: 'from-red-500/20 to-red-600/10 border-red-500/50',
  };

  const teamLabels = { 1: 'Team Blue', 2: 'Team Red' };

  return (
    <div className="min-h-screen bg-skin-primary p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="bg-skin-secondary rounded-xl border-2 border-skin-default p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-skin-primary text-xl">{table.name}</h2>
              <p className="text-sm text-skin-muted">
                Hosted by {table.hostName}
                {isHost && <span className="ml-2 text-skin-accent">(You)</span>}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`
                px-3 py-1 rounded-full text-xs font-medium
                ${table.status === 'gathering' ? 'bg-green-500/20 text-green-400' : ''}
                ${table.status === 'ready' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                ${table.status === 'in_game' ? 'bg-blue-500/20 text-blue-400' : ''}
                ${table.status === 'post_game' ? 'bg-purple-500/20 text-purple-400' : ''}
              `}>
                {table.status === 'gathering' && 'Gathering Players'}
                {table.status === 'ready' && 'Ready to Start'}
                {table.status === 'in_game' && 'In Game'}
                {table.status === 'post_game' && 'Game Finished'}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLeave}>
                Leave Table
              </Button>
            </div>
          </div>
        </div>

        {/* Seats Grid - Visual representation of the table */}
        <div className="bg-skin-secondary rounded-xl border-2 border-skin-default p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Team 1 (positions 0, 2) */}
            <div className="space-y-4">
              <h3 className="text-center text-sm font-display text-blue-400 uppercase tracking-wider">
                {teamLabels[1]}
              </h3>
              {table.seats.filter(s => s.teamId === 1).map((seat) => (
                <SeatCard
                  key={seat.position}
                  seat={seat}
                  isCurrentPlayer={seat.playerName === playerName}
                  isHost={isHost}
                  canSit={!isSeated && !seat.playerName}
                  teamColor={teamColors[1]}
                  onSit={() => handleSitDown(seat.position)}
                  onStand={handleStandUp}
                  onAddBot={() => handleAddBot(seat.position)}
                  onRemove={() => handleRemoveFromSeat(seat.position)}
                />
              ))}
            </div>

            {/* Team 2 (positions 1, 3) */}
            <div className="space-y-4">
              <h3 className="text-center text-sm font-display text-red-400 uppercase tracking-wider">
                {teamLabels[2]}
              </h3>
              {table.seats.filter(s => s.teamId === 2).map((seat) => (
                <SeatCard
                  key={seat.position}
                  seat={seat}
                  isCurrentPlayer={seat.playerName === playerName}
                  isHost={isHost}
                  canSit={!isSeated && !seat.playerName}
                  teamColor={teamColors[2]}
                  onSit={() => handleSitDown(seat.position)}
                  onStand={handleStandUp}
                  onAddBot={() => handleAddBot(seat.position)}
                  onRemove={() => handleRemoveFromSeat(seat.position)}
                />
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex justify-center gap-4">
            {isSeated && (
              <Button
                variant={isReady ? 'success' : 'secondary'}
                size="lg"
                onClick={handleToggleReady}
                leftIcon={<span>{isReady ? '✓' : '○'}</span>}
              >
                {isReady ? 'Ready!' : 'Click when Ready'}
              </Button>
            )}
            {canStart && (
              <Button
                variant="warning"
                size="lg"
                onClick={handleStartGame}
                disabled={isStartingGame}
                loading={isStartingGame}
                leftIcon={!isStartingGame ? <span>🎮</span> : undefined}
              >
                {isStartingGame ? 'Starting...' : 'Start Game!'}
              </Button>
            )}
          </div>

          {/* Status message */}
          {!canStart && isHost && (
            <p className="mt-4 text-center text-sm text-skin-muted">
              {!allSeated && 'Waiting for all seats to be filled...'}
              {allSeated && !allReady && 'Waiting for everyone to be ready...'}
            </p>
          )}
        </div>

        {/* Table Chat */}
        <div className="bg-skin-secondary rounded-xl border-2 border-skin-default p-4">
          <h3 className="font-display text-skin-primary text-sm uppercase tracking-wider mb-3">
            Table Chat
          </h3>

          {/* Messages */}
          <div className="h-40 overflow-y-auto space-y-2 mb-3 p-2 bg-skin-tertiary rounded-lg">
            {chatMessages.length === 0 ? (
              <p className="text-skin-muted text-sm text-center py-4">
                No messages yet. Say hello!
              </p>
            ) : (
              chatMessages.map((msg, i) => (
                <div key={i} className="text-sm">
                  <span className={`font-medium ${
                    msg.teamId === 1 ? 'text-blue-400' :
                    msg.teamId === 2 ? 'text-red-400' :
                    'text-skin-primary'
                  }`}>
                    {msg.playerName}:
                  </span>
                  <span className="text-skin-secondary ml-2">{msg.message}</span>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 bg-skin-tertiary border border-skin-default rounded-lg text-skin-primary text-sm focus:outline-none focus:border-skin-accent"
            />
            <Button variant="primary" size="sm" onClick={handleSendChat}>
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Seat card component
interface SeatCardProps {
  seat: LoungeTable['seats'][0];
  isCurrentPlayer: boolean;
  isHost: boolean;
  canSit: boolean;
  teamColor: string;
  onSit: () => void;
  onStand: () => void;
  onAddBot: () => void;
  onRemove: () => void;
}

function SeatCard({
  seat,
  isCurrentPlayer,
  isHost,
  canSit,
  teamColor,
  onSit,
  onStand,
  onAddBot,
  onRemove,
}: SeatCardProps) {
  const isEmpty = !seat.playerName;
  const isBot = seat.isBot;

  return (
    <div className={`
      relative p-4 rounded-xl border-2 transition-all
      bg-gradient-to-br ${teamColor}
      ${isCurrentPlayer ? 'ring-2 ring-skin-accent ring-offset-2 ring-offset-skin-primary' : ''}
      ${isEmpty ? 'border-dashed opacity-60 hover:opacity-100' : ''}
    `}>
      {isEmpty ? (
        // Empty seat
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-full bg-skin-tertiary border-2 border-dashed border-skin-default flex items-center justify-center">
            <span className="text-2xl text-skin-muted">?</span>
          </div>
          <p className="text-sm text-skin-muted">Empty Seat</p>
          <div className="flex gap-2 justify-center">
            {canSit && (
              <Button variant="primary" size="xs" onClick={onSit}>
                Sit Here
              </Button>
            )}
            {isHost && (
              <Button variant="ghost" size="xs" onClick={onAddBot}>
                + Bot
              </Button>
            )}
          </div>
        </div>
      ) : (
        // Occupied seat
        <div className="text-center space-y-2">
          <div className={`
            w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl
            ${isBot ? 'bg-skin-muted' : 'bg-skin-accent'}
          `}>
            {isBot ? '🤖' : seat.playerName?.slice(0, 2).toUpperCase()}
          </div>
          <p className={`text-sm font-medium ${isCurrentPlayer ? 'text-skin-accent' : 'text-skin-primary'}`}>
            {seat.playerName}
            {isCurrentPlayer && ' (You)'}
          </p>

          {/* Ready indicator */}
          <div className={`
            text-xs px-2 py-1 rounded-full inline-block
            ${seat.isReady || isBot ? 'bg-green-500/20 text-green-400' : 'bg-skin-tertiary text-skin-muted'}
          `}>
            {seat.isReady || isBot ? '✓ Ready' : 'Not Ready'}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-center">
            {isCurrentPlayer && (
              <Button variant="ghost" size="xs" onClick={onStand}>
                Stand Up
              </Button>
            )}
            {isHost && !isCurrentPlayer && (
              <Button variant="danger" size="xs" onClick={onRemove}>
                Remove
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TableRoom;
